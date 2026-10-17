# Google Wallet Pass Backend

A NestJS backend for creating, storing, and updating Google Wallet Generic Passes.

This project demonstrates a complete Google Wallet pass workflow:

1. Create a pass through a REST API.
2. Generate a **Save to Google Wallet** URL.
3. Add the pass to an Android device.
4. Display the user's name, label, value, and a unique QR code.
5. Update the existing pass through an API.
6. Reflect the updated value on the already-installed Google Wallet pass without requiring the user to add the pass again.

The backend uses PostgreSQL for persistent pass data and is deployed on Render.

---

## Live Backend

**Production API:**

https://google-wallet-pass-backend.onrender.com

**GitHub Repository:**

https://github.com/kahiumahamedfahim/google-wallet-pass-backend

---

## Features

- Google Wallet Generic Pass integration
- Create Google Wallet passes through REST API
- Generate Save to Google Wallet links
- Unique pass IDs
- QR code generation inside the Wallet pass
- Update existing Google Wallet passes
- Update passes without re-adding them to the device
- PostgreSQL persistence
- TypeORM integration
- DTO validation using `class-validator`
- Provider abstraction for wallet integrations
- Environment-based configuration
- Production deployment with Render
- RESTful API architecture
- Error handling for Google Wallet and database operations

---

# Technology Stack

## Backend

- Node.js
- NestJS
- TypeScript
- REST API

## Database

- PostgreSQL
- TypeORM

## Google Wallet

- Google Wallet API
- Google Wallet Generic Pass
- Google Cloud Service Account
- JWT
- RS256

## Validation

- `class-validator`
- `class-transformer`

## Deployment

- GitHub
- Render

---

# Architecture

The application follows a layered architecture with a wallet-provider abstraction.

```text
                         Client
                           |
                           |
                    REST API Request
                           |
                           v
                  +------------------+
                  | PassesController |
                  +------------------+
                           |
                           v
                  +------------------+
                  |  PassesService   |
                  +------------------+
                     |            |
                     |            |
                     v            v
              +-----------+  +-------------------+
              | PostgreSQL|  |  WalletProvider   |
              +-----------+  +-------------------+
                                      |
                                      v
                           +----------------------+
                           | GoogleWalletProvider |
                           +----------------------+
                                      |
                                      v
                           +----------------------+
                           |   Google Wallet API  |
                           +----------------------+
```

The main application logic is independent of Google Wallet-specific implementation.

---

# Project Structure

```text
google-wallet-pass-backend/
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   └── passes/
│       ├── dto/
│       │   ├── create-pass.dto.ts
│       │   └── update-pass.dto.ts
│       │
│       ├── entities/
│       │   └── pass.entity.ts
│       │
│       ├── providers/
│       │   ├── google-wallet.provider.ts
│       │   └── wallet-provider.interface.ts
│       │
│       ├── passes.controller.ts
│       ├── passes.service.ts
│       └── passes.module.ts
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

# Provider Architecture

The project uses a `WalletProvider` interface to keep the business logic independent from a specific wallet platform.

```ts
export interface WalletProvider {
  createPass(data: {
    passId: string;
    name: string;
    label: string;
    value: number;
  }): Promise<{ saveUrl: string }>;

  updatePass(
    passId: string,
    label: string,
    value: number,
  ): Promise<void>;
}
```

The current implementation is:

```text
WalletProvider
      |
      v
GoogleWalletProvider
      |
      v
Google Wallet API
```

This design makes it possible to add another wallet provider in the future without changing the core pass business logic.

For example:

```text
WalletProvider
    |
    +---- GoogleWalletProvider
    |
    +---- AppleWalletProvider
    |
    +---- OtherWalletProvider
```

---

# Google Wallet Pass

The project uses a Google Wallet Generic Pass.

Each pass contains:

- User name
- Custom label
- Numeric value
- QR code
- Unique pass ID

Example:

```text
Kahium

Balance
40

[ QR CODE ]

PASS-1792255656091
```

After updating the pass:

```text
Kahium

Balance
55

[ QR CODE ]

PASS-1792255656091
```

The pass remains the same Wallet object.

---

# Pass ID

Every application pass receives a unique pass ID.

Example:

```text
PASS-1792255656091
```

The Google Wallet object ID is generated using:

```text
{issuerId}.{passId}
```

For example:

```text
3388000000023206686.PASS-1792255656091
```

This creates a predictable relationship between the application's pass and the corresponding Google Wallet object.

---

# QR Code

Every Google Wallet pass contains a QR code.

The QR code value is the unique application pass ID.

Example:

```text
PASS-1792255656091
```

The QR code is created as part of the Google Wallet Generic Object.

---

# API Documentation

## Base URL

Production:

```text
https://google-wallet-pass-backend.onrender.com
```

---

# 1. Create Pass

Creates a new pass in the application database and Google Wallet, then returns a Save to Google Wallet URL.

### Endpoint

```http
POST /passes
```

### Production URL

```text
https://google-wallet-pass-backend.onrender.com/passes
```

### Request Body

```json
{
  "name": "Kahium",
  "label": "Balance",
  "value": 40
}
```

### Request Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Name displayed on the pass |
| `label` | string | Yes | Label displayed above the value |
| `value` | integer | Yes | Numeric value displayed on the pass |

The `value` must be greater than or equal to `0`.

---

## Example cURL

```bash
curl -X POST \
  https://google-wallet-pass-backend.onrender.com/passes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kahium",
    "label": "Balance",
    "value": 40
  }'
```

---

## Example Response

```json
{
  "passId": "PASS-1792255656091",
  "name": "Kahium",
  "label": "Balance",
  "value": 40,
  "saveUrl": "https://pay.google.com/gp/v/save/..."
}
```

The `saveUrl` can be opened on a supported Android device to add the pass to Google Wallet.

---

# 2. Update Existing Pass

Updates the value of an existing Google Wallet pass.

### Endpoint

```http
POST /passes/:id
```

### Production URL

```text
https://google-wallet-pass-backend.onrender.com/passes/{passId}
```

Example:

```text
https://google-wallet-pass-backend.onrender.com/passes/PASS-1792255656091
```

### Request Body

```json
{
  "value": 55
}
```

---

## Example cURL

```bash
curl -X POST \
  https://google-wallet-pass-backend.onrender.com/passes/PASS-1792255656091 \
  -H "Content-Type: application/json" \
  -d '{
    "value": 55
  }'
```

---

## Example Response

```json
{
  "passId": "PASS-1792255656091",
  "name": "Kahium",
  "label": "Balance",
  "value": 55,
  "message": "Pass updated successfully"
}
```

---

# Important Update Behavior

The update endpoint does **not** create a new Google Wallet pass.

Instead, it updates the existing Google Wallet Generic Object.

The flow is:

```text
Existing Google Wallet Pass
            |
            v
POST /passes/:id
            |
            v
Find pass in PostgreSQL
            |
            v
Find corresponding Google Wallet Object
            |
            v
Patch Google Wallet Object
            |
            v
Update database value
            |
            v
Existing installed pass changes
```

Therefore, the user does not need to add the pass again.

Example:

```text
Initial pass:

Balance
40
```

After:

```http
POST /passes/PASS-1792255656091
```

with:

```json
{
  "value": 55
}
```

The installed pass becomes:

```text
Balance
55
```

without requiring the user to re-add the pass.

---

# Google Wallet Integration

The backend uses a Google Cloud service account to communicate with the Google Wallet API.

The Google Wallet API is used for:

- Creating Generic Classes
- Creating Generic Objects
- Checking existing objects
- Updating Generic Objects
- Generating Save to Google Wallet URLs

---

# Google Wallet Object

A Generic Object is created with information similar to:

```ts
{
  id: objectId,
  classId,
  state: 'ACTIVE',

  cardTitle: {
    defaultValue: {
      language: 'en-US',
      value: 'Google Wallet Pass Demo',
    },
  },

  header: {
    defaultValue: {
      language: 'en-US',
      value: data.name,
    },
  },

  textModulesData: [
    {
      id: 'label',
      header: data.label,
      body: String(data.value),
    },
  ],

  barcode: {
    type: 'QR_CODE',
    value: data.passId,
    alternateText: data.passId,
  }
}
```

---

# Updating a Google Wallet Object

The existing Wallet Object is updated using the Google Wallet API.

The backend patches the `textModulesData` section:

```ts
await this.walletClient.genericobject.patch({
  resourceId: objectId,

  requestBody: {
    textModulesData: [
      {
        id: 'label',
        header: label,
        body: String(value),
      },
    ],
  },
});
```

This allows the value displayed on the installed pass to change without generating a new pass.

---

# Save to Google Wallet

The backend generates a signed JWT containing the Google Wallet Generic Object information.

The JWT is signed using the Google Cloud service account private key.

The signing algorithm is:

```text
RS256
```

The resulting JWT is converted into a Google Wallet Save URL.

The user opens the URL and selects:

```text
Save to Google Wallet
```

The pass is then added to Google Wallet.

---

# Database

The application uses PostgreSQL with TypeORM.

## Pass Table

The main database table is:

```text
passes
```

## Pass Entity

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Internal database ID |
| `passId` | varchar | Unique application pass ID |
| `name` | varchar | Pass name |
| `label` | varchar | Pass label |
| `value` | integer | Current pass value |
| `provider` | varchar | Wallet provider |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

---

# Environment Variables

Create a `.env` file locally.

Example:

```env
PORT=7000

GOOGLE_WALLET_PROJECT_ID=your-google-cloud-project-id
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=your-service-account-email
GOOGLE_WALLET_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"

GOOGLE_WALLET_ISSUER_ID=your-google-wallet-issuer-id
GOOGLE_WALLET_CLASS_ID=google_wallet_pass_demo

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-database-password
DB_DATABASE=google_wallet_pass
```

## Important

Never commit `.env` to GitHub.

Sensitive credentials must not be hardcoded in the source code.

Never expose:

- Google service account private keys
- Database passwords
- Cloud credentials
- Other secret values

---

# Google Cloud Setup

To run this project with Google Wallet, the following configuration is required.

## 1. Create a Google Cloud Project

Create a Google Cloud project for the application.

---

## 2. Enable Google Wallet API

Enable the Google Wallet API in the Google Cloud project.

---

## 3. Create a Service Account

Create a Google Cloud service account.

Example:

```text
google-wallet-backend@PROJECT_ID.iam.gserviceaccount.com
```

---

## 4. Create Service Account Credentials

Create a service account key and configure the credentials securely through environment variables.

The private key is used by the backend to authenticate with Google services.

---

## 5. Configure Google Wallet Issuer

Configure a Google Wallet issuer account and create a Generic Class.

Example:

```text
google_wallet_pass_demo
```

---

## 6. Add the Service Account to Google Wallet

The service account must have the required access to the Google Wallet issuer account.

For testing, Google Wallet Demo Mode and test users can be used.

---

# Local Development

## Prerequisites

Install:

- Node.js
- npm
- PostgreSQL
- Google Cloud account
- Google Wallet issuer account

---

## Clone Repository

```bash
git clone https://github.com/kahiumahamedfahim/google-wallet-pass-backend.git
```

Navigate into the project:

```bash
cd google-wallet-pass-backend
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment

Create a `.env` file:

```text
.env
```

Add the required environment variables.

---

## PostgreSQL

Make sure PostgreSQL is running.

Create a database:

```text
google_wallet_pass
```

Then configure:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-database-password
DB_DATABASE=google_wallet_pass
```

---

# Run the Application

## Development

```bash
npm run start:dev
```

The application will run on:

```text
http://localhost:7000
```

when `PORT=7000` is configured.

---

## Standard Start

```bash
npm run start
```

---

## Production Start

```bash
npm run start:prod
```

---

# Build

Build the NestJS application:

```bash
npm run build
```

The compiled application is generated in the `dist` directory.

---

# Testing the Application

## Step 1 — Create a Pass

Send:

```http
POST /passes
```

Request:

```json
{
  "name": "Kahium",
  "label": "Balance",
  "value": 40
}
```

The API returns a `saveUrl`.

---

## Step 2 — Add the Pass to Google Wallet

Open the returned `saveUrl` on an Android device.

Select:

```text
Save to Google Wallet
```

The pass should be installed.

The pass contains:

```text
Kahium

Balance
40

QR CODE
```

---

## Step 3 — Update the Existing Pass

Use the returned `passId`.

Send:

```http
POST /passes/{passId}
```

Request:

```json
{
  "value": 55
}
```

---

## Step 4 — Verify the Update

Open the already-installed Google Wallet pass.

The value should change from:

```text
40
```

to:

```text
55
```

without adding the pass again.

---

# Validation

The application uses NestJS `ValidationPipe` with DTO validation.

## Create Pass DTO

```ts
@IsString()
@IsNotEmpty()
name!: string;

@IsString()
@IsNotEmpty()
label!: string;

@IsInt()
@Min(0)
value!: number;
```

## Update Pass DTO

```ts
@IsInt()
@Min(0)
value!: number;
```

Invalid requests are rejected before reaching the business logic.

---

# Error Handling

The service handles several important failure scenarios.

## Pass Not Found

If the requested pass does not exist:

```text
404 Not Found
```

is returned.

---

## Google Wallet Update Failure

If the Google Wallet API update fails, the database value is not updated.

The error is logged and the request fails.

---

## Database Update Failure

The service first updates Google Wallet and then updates the database.

If Google Wallet succeeds but the database update fails, the service reports that the Wallet was updated but the database update failed.

This is because Google Wallet and PostgreSQL are separate systems and cannot be rolled back together using a normal database transaction.

A future improvement could introduce retry and reconciliation mechanisms.

---

# Deployment

The application is deployed using Render.

Production URL:

```text
https://google-wallet-pass-backend.onrender.com
```

Deployment flow:

```text
GitHub
   |
   v
Render
   |
   +---- npm install
   |
   +---- npm run build
   |
   +---- npm run start:prod
   |
   v
NestJS Application
```

---

# Render Configuration

## Build Command

```bash
npm install; npm run build
```

## Start Command

```bash
npm run start:prod
```

## Environment Variables

The required environment variables are configured in the Render dashboard.

Sensitive credentials are not stored in the GitHub repository.

---

# Production API

The deployed backend is available at:

```text
https://google-wallet-pass-backend.onrender.com
```

### Create Pass

```text
POST https://google-wallet-pass-backend.onrender.com/passes
```

### Update Pass

```text
POST https://google-wallet-pass-backend.onrender.com/passes/{passId}
```

---

# Complete Workflow

The complete application workflow is:

```text
             Create Pass
                  |
                  v
          POST /passes
                  |
                  v
         Generate Pass ID
                  |
          +-------+-------+
          |               |
          v               v
      PostgreSQL     Google Wallet
                          |
                          v
                 Generic Wallet Object
                          |
                          v
                   Generate Save URL
                          |
                          v
                   Android Device
                          |
                          v
                  Save to Wallet
                          |
                          |
                    Existing Pass
                          |
                          v
                POST /passes/:id
                          |
                          v
                 Update Google Object
                          |
                          v
                 Update Database
                          |
                          v
              Existing Wallet Pass
                     Updated
```

---

# Design Decisions

## 1. Provider Abstraction

Google Wallet-specific operations are isolated inside `GoogleWalletProvider`.

This prevents Google Wallet implementation details from spreading through the application.

The core service communicates with:

```text
WalletProvider
```

instead of directly depending on Google Wallet APIs.

---

## 2. PostgreSQL for Application State

The backend stores:

- Pass ID
- Name
- Label
- Current value
- Provider
- Creation timestamp
- Update timestamp

This allows the application to manage the relationship between its internal pass and the external Google Wallet object.

---

## 3. Predictable Wallet Object ID

The Wallet Object ID is generated from:

```text
issuerId + passId
```

This makes it possible to locate and update the same Google Wallet object later.

---

## 4. Existing Object Update

The update API patches the existing Generic Object instead of creating another object.

This is important because the requirement is to update the pass already installed on the user's phone.

---

# Security Considerations

Sensitive values are loaded through environment variables.

The following values must never be committed to Git:

```text
GOOGLE_WALLET_PRIVATE_KEY
DB_PASSWORD
```

The `.env` file should remain ignored by Git.

For production systems, credentials should be stored using a secure secret-management solution.

Service account keys should also be rotated if they are exposed outside the intended secret environment.

---

# Production Considerations

This project is currently designed as a working technical demonstration.

For a larger production system, the following improvements would be recommended.

## Database Migrations

Use controlled TypeORM migrations instead of relying on:

```text
synchronize: true
```

in production.

---

## Secret Management

Use a dedicated secret-management solution for:

- Google service account credentials
- Database credentials
- Other sensitive configuration

---

## Reliability

Add:

- Retry mechanisms
- Reconciliation jobs
- Idempotency
- External API failure recovery
- Background processing where appropriate

---

## Observability

Add:

- Structured logging
- Monitoring
- Error tracking
- Request tracing

---

# Future Improvements

Possible future improvements include:

- Authentication and authorization
- User accounts
- Pass ownership
- Pass deletion
- Pass expiration
- Pass history
- Audit logs
- Background retry/reconciliation
- Google Wallet event handling
- Automated tests
- Swagger/OpenAPI documentation
- CI/CD pipeline
- Production database migrations
- Secure secret management
- Additional wallet providers
- Apple Wallet integration

---

# NPM Scripts

```bash
# Development
npm run start:dev

# Standard start
npm run start

# Production
npm run start:prod

# Build
npm run build

# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

# API Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/passes` | Create a new Google Wallet pass |
| `POST` | `/passes/:id` | Update an existing Google Wallet pass |

---

# Example End-to-End API Usage

## Create

```bash
curl -X POST \
  https://google-wallet-pass-backend.onrender.com/passes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kahium",
    "label": "Balance",
    "value": 40
  }'
```

Example response:

```json
{
  "passId": "PASS-1792255656091",
  "name": "Kahium",
  "label": "Balance",
  "value": 40,
  "saveUrl": "https://pay.google.com/gp/v/save/..."
}
```

## Update

```bash
curl -X POST \
  https://google-wallet-pass-backend.onrender.com/passes/PASS-1792255656091 \
  -H "Content-Type: application/json" \
  -d '{
    "value": 55
  }'
```

Example response:

```json
{
  "passId": "PASS-1792255656091",
  "name": "Kahium",
  "label": "Balance",
  "value": 55,
  "message": "Pass updated successfully"
}
```

---

# Project Status

The core Google Wallet functionality is implemented and deployed.

### Completed

- [x] NestJS backend
- [x] PostgreSQL integration
- [x] TypeORM integration
- [x] Google Cloud configuration
- [x] Google Wallet API integration
- [x] Generic Class creation
- [x] Generic Object creation
- [x] Unique pass ID
- [x] QR code
- [x] Save to Google Wallet URL
- [x] Android Wallet installation
- [x] Existing pass update
- [x] REST API for updating the pass
- [x] Production deployment
- [x] Production API testing

---

# Author

**Kahium Ahamed Fahim**

GitHub:

https://github.com/kahiumahamedfahim

Project Repository:

https://github.com/kahiumahamedfahim/google-wallet-pass-backend

---

# License

This project was created as a technical demonstration of Google Wallet Generic Pass integration using NestJS, PostgreSQL, TypeORM, and the Google Wallet API.
