# Freelance Payment Platform

A REST API for a freelance payment platform. Clients post contracts, hire contractors, pay for completed jobs, and deposit funds into their accounts.

## Prerequisites

- Node.js ≥ 20
- MongoDB with a replica set enabled (required for transactions)

If you are running MongoDB locally via Homebrew, add the following to `/opt/homebrew/etc/mongod.conf` and restart:

```yaml
replication:
  replSetName: "rs0"
```

Then initialise the replica set once:

```bash
mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"
```

## Setup

```bash
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

## Environment Variables

All variables are **required**. The server will refuse to start if any are missing or invalid.

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on |
| `MONGODB_URI` | MongoDB connection string (replica set required) |
| `NODE_ENV` | Environment — one of `development`, `production`, `test` |

## Running

Development (watch mode):

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

## Seeding

Populates the database with 8 profiles, 9 contracts, and 13 jobs:

```bash
npm run db:seed
```

## Testing

```bash
npm test
```

35 integration tests across contracts, jobs, balances, and admin suites. Tests use an in-memory MongoDB replica set — no local database required.

## Design Decisions

### Why MongoDB?

MongoDB was chosen because replica sets come out of the box with `mongodb-memory-server`, making multi-document ACID transactions trivial to test without any external infrastructure. The aggregation pipeline also maps naturally onto the analytics queries (`best-profession`, `best-clients`), where multi-collection `$lookup` + `$group` is more expressive than equivalent SQL joins.

### Stretch goals chosen

| Goal | Rationale |
|---|---|
| **A — Idempotency** | Preventing duplicate charges is the highest-priority correctness concern in any payment system. A client retrying on a network timeout must never be charged twice. |
| **B — Concurrency** | Race conditions on balance deductions are a silent data-integrity risk. Optimistic locking with Mongoose's `__v` field was chosen over pessimistic locking because it avoids held locks under contention and is straightforward to implement without a distributed lock store. |
| **C — Rate Limiting** | Protects expensive admin analytics endpoints and the payment endpoint from accidental or malicious flooding. In-memory limiter keyed on `profile_id` is sufficient for a single-process deployment. |
| **D — Audit Log** | Every balance change is appended to an immutable `AuditLog` collection (pre-hooks block updates). This is a compliance necessity: any payment dispute requires a trustworthy event trail. |
| **E — Indexes** | MongoDB performs collection scans by default. Indexes on `Job.paid + contractId`, `Job.paymentDate`, and `AuditLog.profileId + timestamp` ensure analytics and idempotency lookups remain fast as data grows. |

### Payment atomicity

Payments use a MongoDB multi-document transaction (`session.withTransaction`). Within a single session the following steps are atomic:

1. Fetch and lock the job document.
2. Debit the client balance using `findOneAndUpdate` with an optimistic version check (`__v`).
3. Credit the contractor balance.
4. Mark the job as paid with the idempotency key.
5. Write an audit log entry.

If any step fails the transaction is rolled back. The optimistic lock on the client profile causes a version mismatch error when two concurrent payments race — exactly one succeeds and the other is rejected with an insufficient-funds / version error.

### Idempotency

The `Idempotency-Key` header is stored as `paymentReference` on the `Job` document. A unique sparse index prevents two jobs from sharing the same reference. On retry, the repository looks up the key but only within a **24-hour window** — keys older than 24 h are considered expired and the retry is treated as a fresh (failing) request, matching the spec requirement.

## The Scale Question

> *If we get 10x more traffic tomorrow, what breaks first?*

### 1. MongoDB connection pool (most likely first failure)

Mongoose defaults to a pool of 5 connections per process. At 10x traffic the pool will be exhausted, causing requests to queue. Every queued request holds a Node.js event-loop tick, latency spikes, and eventually timeouts cascade.

**Fix:** Increase `maxPoolSize` in the connection options (e.g. `100`). Separate reads (analytics) onto a MongoDB read replica so write-heavy payment traffic doesn't compete with slow aggregations.

### 2. In-memory rate limiter state is not shared

The current `express-rate-limit` store is in-process memory. Under a multi-process deployment (PM2 cluster, multiple pods in Kubernetes) each process maintains its own counters, so a single client can effectively multiply its allowed rate by the number of processes.

**Fix:** Swap the store for a Redis-backed implementation (`rate-limit-redis`). Redis provides a shared, atomic counter across all processes.

### 3. Analytics aggregations hold connections

`best-profession` and `best-clients` run multi-stage aggregation pipelines over the full jobs collection for the requested date range. As the jobs collection grows these queries get progressively slower, blocking the connection for longer.

**Fix:** Add a compound index on `{ paid: 1, paymentDate: 1 }` (already present), ensure MongoDB uses it (verify with `.explain()`), and route analytics reads to a replica. For very high traffic, pre-compute results into a summary collection via a scheduled job.

### 4. Single-server deployment

There is one Express process. A single hardware failure or deploy takes the API down.

**Fix:** Deploy behind a load balancer with at least two instances. The stateless Express app scales horizontally without code changes (rate limiter Redis fix must be applied first).

### 5. No query result caching

Repeated identical analytics queries (`best-profession` with the same date range) hit MongoDB every time.

**Fix:** Cache results in Redis with a short TTL (e.g. 60 s for analytics). Payment endpoints must never be cached.

---

## API Reference

### Authentication

Protected routes require a `profile_id` header containing the MongoDB ObjectId of the acting profile.

```
profile_id: <ObjectId>
```

---

### Contracts

#### GET /contracts/:id

Returns a contract by ID. Only visible to the client or contractor on the contract.

**Auth:** required

**Response `200`**

```json
{
  "_id": "...",
  "terms": "bla bla bla",
  "status": "in_progress",
  "clientId": "...",
  "contractorId": "..."
}
```

**Errors:** `401` unauthenticated · `403` not a party to the contract · `404` not found

```bash
curl http://localhost:3001/contracts/<contract_id> \
  -H "profile_id: <your_profile_id>"
```

---

#### GET /contracts

Returns all non-terminated contracts belonging to the authenticated profile.

**Auth:** required

**Response `200`** — array of contract objects

```bash
curl http://localhost:3001/contracts \
  -H "profile_id: <your_profile_id>"
```

---

### Jobs

#### GET /jobs/unpaid

Returns all unpaid jobs for active (non-terminated) contracts belonging to the authenticated profile.

**Auth:** required

**Response `200`** — array of job objects

```bash
curl http://localhost:3001/jobs/unpaid \
  -H "profile_id: <your_profile_id>"
```

---

#### POST /jobs/:job_id/pay

Pays for a job. Transfers the job price from the client's balance to the contractor's balance. Records an audit log entry.

**Auth:** required (must be the client on the contract)

**Response `200`**

```json
{ "balance": 950 }
```

**Errors:** `400` insufficient funds or job already paid · `403` not the client · `404` job or contract not found

```bash
curl -X POST http://localhost:3001/jobs/<job_id>/pay \
  -H "profile_id: <your_profile_id>" \
  -H "idempotency-key: <unique_key>"
```

---

### Balances

#### POST /balances/deposit/:userId

Deposits funds into a client's account. The deposit cannot exceed 25% of the total value of the client's unpaid jobs at the time of the request.

**Auth:** required (must be depositing into your own account)

**Body**

```json
{ "amount": 50 }
```

| Field | Type | Constraints |
|---|---|---|
| `amount` | number | positive |

**Response `200`**

```json
{ "balance": 1200 }
```

**Errors:** `400` exceeds cap or invalid amount · `403` depositing into another account · `404` user not found

```bash
curl -X POST http://localhost:3001/balances/deposit/<user_id> \
  -H "profile_id: <your_profile_id>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50}'
```

---

### Admin

Admin endpoints do not require authentication.

#### GET /admin/best-profession?start=&end=

Returns the profession that earned the most within the given date range.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `start` | ISO date string | yes | Range start (inclusive) |
| `end` | ISO date string | yes | Range end (inclusive) |

**Response `200`**

```json
{ "profession": "Programmer", "earned": 703 }
```

```bash
curl "http://localhost:3001/admin/best-profession?start=2025-01-01&end=2025-12-31"
```

---

#### GET /admin/best-clients?start=&end=&limit=

Returns the clients who paid the most within the given date range.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `start` | ISO date string | yes | Range start (inclusive) |
| `end` | ISO date string | yes | Range end (inclusive) |
| `limit` | integer | no | Number of results to return (default: `2`) |

**Response `200`**

```json
[
  { "id": "...", "fullName": "Harry Potter", "paid": 403 },
  { "id": "...", "fullName": "Ash Ketchum", "paid": 200 }
]
```

```bash
curl "http://localhost:3001/admin/best-clients?start=2025-01-01&end=2025-12-31&limit=3"
```
