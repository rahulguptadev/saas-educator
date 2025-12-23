# Jitsi Classroom Platform

A comprehensive online classroom platform built with Jitsi Meet integration, featuring role-based access for Admin, Teacher, and Student profiles.

## Features

- **Admin Dashboard**: Manage users, view statistics, and oversee all classes
- **Teacher Profile**: Create and schedule classes, manage students, conduct video sessions
- **Student Profile**: View scheduled classes, join video sessions
- **Data Privacy**: Student contact information (email, phone) is hidden from teachers
- **Jitsi Integration**: Seamless video conferencing using Jitsi Meet (free and open-source)

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, React Router
- **Video**: Jitsi Meet
- **Authentication**: JWT

## Setup Instructions

For detailed setup instructions, see [SETUP.md](./SETUP.md)

**New to MongoDB?** Check out [MONGODB_SETUP.md](./MONGODB_SETUP.md) for a step-by-step guide to create a free MongoDB Atlas cluster.

### Quick Start

1. **Install dependencies:**
```bash
npm run install-all
```

2. **Set up backend environment:**
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

3. **Start the application:**
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5001
- Frontend app on http://localhost:3000

4. **Create your first account:**
- Open http://localhost:3000
- Register with role "Admin" for full access

## Default Routes

- Backend API: http://localhost:5001/api
- Frontend: http://localhost:3000

## Project Structure

```
jitsi/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.js       # Main app component
│   └── public/
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Classes
- `GET /api/classes` - Get classes (role-based)
- `POST /api/classes` - Create class (teacher)
- `GET /api/classes/:id` - Get class details
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class
- `POST /api/classes/:id/join` - Join class (student)

### Users
- `GET /api/users/students` - Get all students
- `GET /api/users/teachers` - Get all teachers (admin)
- `GET /api/users/:id` - Get user by ID

### Admin
- `GET /api/admin/stats` - Get platform statistics
- `PUT /api/admin/users/:id/status` - Toggle user status
- `DELETE /api/admin/users/:id` - Delete user

## License

MIT

