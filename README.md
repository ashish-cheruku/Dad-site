# Auth App with React and FastAPI

A simple authentication system with login and signup functionality using React for the frontend and FastAPI for the backend.

## Project Structure

```
.
├── backend/             # FastAPI backend
│   ├── main.py          # Main FastAPI application
│   └── requirements.txt # Python dependencies
│
└── frontend/            # React frontend
    ├── public/          # Static files
    └── src/             # React source code
        ├── components/  # Reusable components
        ├── pages/       # Page components
        └── services/    # API services
```

## Requirements

- Python 3.7+
- Node.js 14+
- MongoDB (database connection string provided)

## Setup and Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment (optional but recommended):
   ```bash
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at `http://localhost:8004`
   
   You can access the automatic API documentation at `http://localhost:8004/docs`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

## API Endpoints

- `POST /register`: Register a new user
- `POST /token`: Login and get access token
- `GET /users/me`: Get current user information

## Features

- User registration with email, username, and password
- User login with JWT authentication
- Protected routes for authenticated users
- MongoDB database integration
- Responsive UI with React

## Security Notes

- Passwords are hashed using BCrypt
- Authentication uses JWT tokens
- Frontend stores tokens in localStorage 