# Brothers App (SmokeBreak)

A comprehensive application for managing schedules, notifications, and user status ("In Class" or "Free").

## Project Structure

- **backend/**: Flask API handling business logic, database, and AI services.
- **frontend/**: React web application for user interaction.
- **mobile/**: React Native (Expo) mobile application for on-the-go access.

- **`backend/`**: The core API server built with Python and Flask.
- **`frontend/`**: The web application built with React and Vite.
- **`mobile/`**: The mobile application built with React Native and Expo.
- **`scripts/`**: Utility scripts for testing, debugging, and maintenance.

---

## Backend (`backend/`)

The backend handles data persistence, authentication, and AI processing.

- **Technology Stack**: Python, Flask, SQLAlchemy (MySQL 8.0+), Flask-JWT-Extended, Google Gemini AI.
- **Key Files**:
    - **`app.py`**: The entry point of the application. It initializes the Flask app, database connection, and registers API routes.
    - **`config.py`**: Contains configuration settings like secret keys and database URIs.
    - **`models.py`**: Defines the database schema using SQLAlchemy.
        - `User`: Stores user credentials and relationships.
        - `ScheduleItem`: Stores class schedules.
        - `Notification`: Stores invites and messages.
    - **`routes.py`**: Contains all API endpoints (e.g., `/login`, `/register`, `/schedule`, `/invite`).
    - **`ai_service.py`**: Integrates with Google Gemini to parse schedule images uploaded by users.

## Frontend (`frontend/`)

The web interface for the application.

- **Technology Stack**: React, Vite, Axios, Bootstrap.
- **Key Features**:
    - User Authentication (Login/Register).
    - Dashboard to view friends' status (Free/In Class).
    - Schedule management.

## Mobile (`mobile/`)

The mobile interface, optimized for iOS and Android.

- **Technology Stack**: React Native, Expo.
- **Key Features**:
    - Same features as the web app but with a native look and feel.
    - Optimized for touch interactions.
    - **Note**: Configured to connect to the backend via LAN IP for physical device testing.

---

## Utility Scripts (`scripts/`)

This folder contains helper scripts for development, testing, and debugging.

### General Utilities
- **`serve_apps.sh`**: A Bash script that starts both the Frontend and Mobile web servers in parallel. Useful for quickly spinning up the client-side apps.
- **`init_db.py`**: Initializes the database. Run this once to create the necessary tables defined in `models.py`.

### Debugging & AI
- **`debug_ai.py`**: A standalone script to test the Google Gemini integration. It sends a sample image to the AI service and prints the parsed JSON result. Use this to verify if the AI API key is working and parsing correctly.

### Verification & Testing
These scripts simulate user interactions to verify that specific features are working correctly.

- **`verify_notifications.py`**: Tests the end-to-end notification flow.
    1. Registers two test users.
    2. Logs them in.
    3. User A sends an invite to User B.
    4. User B checks for notifications.
    5. Verifies that the invite was received.
- **`verify_ai_upload.py`**: Tests the schedule upload endpoint. It uploads a sample image to the backend and checks if the server correctly parses and saves the schedule items.
- **`verify_duplicate.py`**: Tests the registration logic to ensure that duplicate usernames or emails are rejected by the server.
- **`verify_email_check.py`**: Tests the `/check-email` endpoint, which is used by the frontend to provide real-time feedback on email availability.
- **`verify_fix.py`**: A regression test script used to verify specific bug fixes related to previous development cycles.
- **`verify_revert.py`**: A script used to verify that state can be reverted or cleaned up after testing.

## Getting Started

1. **Set up MySQL Database**:
   ```sql
   CREATE DATABASE smoke_break CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'smokebreak'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON smoke_break.* TO 'smokebreak'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and update `DATABASE_URL`:
   ```
   DATABASE_URL=mysql+pymysql://smokebreak:your_password@localhost:3306/smoke_break?charset=utf8mb4
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the Backend**:
   ```bash
   python -m backend.app
   ```

5. **Start the Clients**:
   ```bash
   ./scripts/serve_apps.sh
   ```
   *Or run them individually:*
   - Frontend: `cd frontend && npm run dev`
   - Mobile: `cd mobile && npx expo start`
