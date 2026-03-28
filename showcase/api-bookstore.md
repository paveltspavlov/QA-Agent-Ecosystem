# Workflow 7 -- Full API Test Coverage for DemoQA Bookstore

Run Workflow 7 — Full API Test Coverage.

## API Specification

DemoQA Bookstore API -- a RESTful API for managing user accounts and book collections.

Base URL: https://demoqa.com

### Account Endpoints

- POST /Account/v1/User -- Create a new user
  - Body: `{ "userName": "string", "password": "string" }`
  - Password must contain: uppercase, lowercase, number, special char, min 8 chars
  - Returns: `{ "userID": "uuid", "username": "string", "books": [] }`

- POST /Account/v1/GenerateToken -- Generate auth token
  - Body: `{ "userName": "string", "password": "string" }`
  - Returns: `{ "token": "string", "expires": "datetime", "status": "Success|Failed", "result": "string" }`

- POST /Account/v1/Authorized -- Check if user is authorized
  - Body: `{ "userName": "string", "password": "string" }`
  - Returns: `true` or `false`

- GET /Account/v1/User/{UUID} -- Get user details (requires auth)
  - Headers: `Authorization: Bearer {token}`
  - Returns: user object with books array

- DELETE /Account/v1/User/{UUID} -- Delete user (requires auth)
  - Headers: `Authorization: Bearer {token}`
  - Returns: 204 No Content

### BookStore Endpoints

- GET /BookStore/v1/Books -- Get all books
  - Returns: `{ "books": [{ "isbn", "title", "subTitle", "author", "publish_date", "publisher", "pages", "description", "website" }] }`

- GET /BookStore/v1/Book?ISBN={isbn} -- Get book by ISBN
  - Returns: single book object

- POST /BookStore/v1/Books -- Add books to user collection (requires auth)
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ "userId": "uuid", "collectionOfIsbns": [{ "isbn": "string" }] }`
  - Returns: `{ "books": [{ "isbn": "string" }] }`

- PUT /BookStore/v1/Books/{ISBN} -- Replace a book in collection (requires auth)
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ "userId": "uuid", "isbn": "new-isbn" }`

- DELETE /BookStore/v1/Book -- Remove a book from collection (requires auth)
  - Headers: `Authorization: Bearer {token}`
  - Body: `{ "isbn": "string", "userId": "uuid" }`

- DELETE /BookStore/v1/Books?UserId={UUID} -- Remove all books from collection (requires auth)
  - Headers: `Authorization: Bearer {token}`

## Authentication

- Method: Bearer token via /Account/v1/GenerateToken
- Test user: Create a new user via POST /Account/v1/User (use a unique username per run)
- Password requirement: Must match `^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$`
- Example password: `TestPass123!`

## Test Scenarios to Cover

### Account Management
1. Create a new user with valid credentials -- 201
2. Create user with duplicate username -- 406
3. Create user with weak password (no special char) -- 400
4. Generate token with valid credentials -- 200, status "Success"
5. Generate token with invalid password -- 200, status "Failed"
6. Check authorization with valid credentials -- true
7. Check authorization with wrong password -- false
8. Get user details with valid token -- 200
9. Get user details without token -- 401
10. Get user details with expired/invalid token -- 401
11. Delete user account -- 204
12. Delete non-existent user -- 200 (idempotent)

### Book Operations
1. Get all books -- 200, verify book count and schema
2. Get book by valid ISBN -- 200, verify all fields present
3. Get book by invalid ISBN -- 400
4. Add a book to user collection -- 201
5. Add duplicate book to collection -- 400
6. Add book with invalid ISBN -- 400
7. Replace book in collection -- 200
8. Remove a specific book -- 204
9. Remove all books from collection -- 204
10. Perform book operations without auth token -- 401

### End-to-End Flow
1. Create user -> Generate token -> Add 2 books -> Get user (verify books) -> Remove 1 book -> Get user (verify 1 book) -> Delete all books -> Delete user

## Existing API Tests

- Path: playwright/tests/api/ (empty -- generating from scratch)

## Priority

Focus on the auth flow first (create user, generate token, verify auth), then book CRUD operations, then edge cases and error handling.
