# productman
a product management api with axum and admin control


# Application Setup Guide

## Project Overview

This application consists of:
- **Backend**: Axum (Rust web framework) have rust install
- **Database**: PostgreSQL with SQLx have sqlx install

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd test3/backend/src
```

### 2. Environment Configuration
- Copy `.env_example` to `.env`
- Update database credentials and admin settings in `.env`

### 3. Database Setup

#### Install SQLx CLI
```bash
cargo install sqlx-cli
```

#### Create Database
ensure your .env is set up with DATABASE_URL if not error
```bash 
sqlx database create
```

#### Run Migrations
```bash
sqlx migrate run
```

### 4. Create Admin User
```bash
cargo run --bin admin
```

### 5. Start the Server
```bash
cargo run --bin start
```

### 6. Test the API
The server runs on `localhost:3000` by default.

**Option 1: Postman Collection**
- Import the Postman collection file: `E-commerce Catalog API.postman_collection.json` (located in root directory of project )

**Option 2: Online Postman Workspace**
- [Access the Postman workspace](https://web.postman.co/workspace/online-pastor~2ba54e12-d0fd-4992-a4b4-9110b0e0ea4b/collection/29491484-2e4ac831-8696-439b-acad-b56ca8fa8fdd?action=share&source=copy-link&creator=29491484)
- 
### usage

note to login as admin us the details use provided in your .env or use the app default
email == adminm@example.com
passwrod == adminpassword


## Improvement that can be done

### Backend Improvements
- **Error Handling**: Better error handling for edge cases
- **Search System**: More effective and optimized search functionality
- **Code Organization**: Move routers to separate files (currently in main.rs)
- **Testing**: Comprehensive test coverage for all API endpoints (Postman collection provides good coverage)
- **Containerization**: Dockerize the application for easier deployment
- **API Documentation**: Add Swagger API documentation (though less critical for internal APIs with Postman available)
- ** add supperusers so changing roles or creating admin can be easy
