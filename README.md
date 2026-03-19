# Freelance Payment Platform

A REST API for a freelance payment platform. Clients post contracts, hire contractors, pay for completed jobs, and deposit funds into their accounts.

## Prerequisites

- Node.js ≥ 20
- MongoDB with a replica set enabled (required for transactions)

## Setup

```bash
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `3001` |
| `MONGODB_URI` | MongoDB connection string (replica set required) | `mongodb://127.0.0.1:27017/freelance_payment` |
| `DEPOSIT_LIMIT_PCT` | Maximum deposit as a fraction of total unpaid job value | `0.25` |
| `NODE_ENV` | Environment (`development` / `production` / `test`) | `development` |

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

32 integration tests across contracts, jobs, balances, and admin suites. Tests use an in-memory MongoDB replica set — no local database required.

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

---

#### GET /contracts

Returns all non-terminated contracts belonging to the authenticated profile.

**Auth:** required

**Response `200`** — array of contract objects

---

### Jobs

#### GET /jobs/unpaid

Returns all unpaid jobs for active (non-terminated) contracts belonging to the authenticated profile.

**Auth:** required

**Response `200`** — array of job objects

---

#### POST /jobs/:job_id/pay

Pays for a job. Transfers the job price from the client's balance to the contractor's balance. Records an audit log entry.

**Auth:** required (must be the client on the contract)

**Response `200`**

```json
{ "balance": 950 }
```

**Errors:** `400` insufficient funds or job already paid · `403` not the client · `404` job or contract not found

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
