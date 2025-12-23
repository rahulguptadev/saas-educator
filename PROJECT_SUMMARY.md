# Project Summary

## Overview
A complete Jitsi-based classroom platform with role-based access control for Admin, Teacher, and Student profiles. Built as a monolith with both frontend and backend in a single repository.

## Key Features Implemented

### ✅ Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Teacher, Student)
- Protected routes with role verification
- Secure password hashing with bcrypt

### ✅ Admin Dashboard
- Platform statistics overview
- User management (view all teachers and students)
- Activate/deactivate users
- View all classes across the platform
- Full access to all user information

### ✅ Teacher Dashboard
- Create and schedule classes
- Select multiple students for each class
- View upcoming and past classes
- Join video sessions directly from dashboard
- Delete classes
- Student data privacy: Cannot see student email/phone numbers

### ✅ Student Dashboard
- View scheduled classes
- See class details (teacher name, time, duration)
- Join video sessions
- View past classes

### ✅ Jitsi Integration
- Embedded Jitsi Meet video conferencing
- Automatic room name generation
- Seamless integration with class scheduling
- Fallback to external link if embedded fails
- User information passed to Jitsi (name, email)

### ✅ Data Privacy
- Student email and phone numbers hidden from teachers
- Only admins can see full user information
- Role-based data filtering in API responses

### ✅ UI/UX
- Modern, responsive design
- Gradient color scheme
- Smooth transitions and animations
- Mobile-friendly layout
- Intuitive navigation
- Loading states and error handling

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### Frontend
- **React** with React Router
- **Axios** for API calls
- **Jitsi Meet External API** for video conferencing
- **React Icons** for icons
- **date-fns** for date formatting
- **CSS3** for styling

## Project Structure

```
jitsi/
├── backend/
│   ├── models/
│   │   ├── User.js          # User model with roles
│   │   └── Class.js          # Class model with Jitsi integration
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── users.js         # User management routes
│   │   ├── classes.js       # Class CRUD operations
│   │   └── admin.js         # Admin-specific routes
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── server.js            # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js    # Main layout with navbar
│   │   │   ├── PrivateRoute.js
│   │   │   └── RoleRoute.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── TeacherDashboard.js
│   │   │   ├── StudentDashboard.js
│   │   │   └── ClassRoom.js  # Jitsi integration
│   │   ├── services/
│   │   │   ├── api.js       # Axios configuration
│   │   │   ├── authService.js
│   │   │   ├── classService.js
│   │   │   ├── userService.js
│   │   │   └── adminService.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   └── App.js
│   └── package.json
└── package.json             # Root package with scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Classes
- `GET /api/classes` - Get classes (role-based filtering)
- `POST /api/classes` - Create class (teacher only)
- `GET /api/classes/:id` - Get class details
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class
- `POST /api/classes/:id/join` - Join class (student)

### Users
- `GET /api/users/students` - Get all students (teacher/admin)
- `GET /api/users/teachers` - Get all teachers (admin only)
- `GET /api/users/:id` - Get user by ID (with privacy filtering)

### Admin
- `GET /api/admin/stats` - Platform statistics
- `PUT /api/admin/users/:id/status` - Toggle user status
- `DELETE /api/admin/users/:id` - Delete user

## Security Features

1. **Password Security**: Passwords are hashed using bcrypt before storage
2. **JWT Tokens**: Secure token-based authentication
3. **Role-Based Access**: Routes protected by role verification
4. **Data Privacy**: Student contact info hidden from teachers
5. **Input Validation**: All inputs validated using express-validator
6. **CORS**: Configured for secure cross-origin requests

## Getting Started

See [SETUP.md](./SETUP.md) for detailed installation instructions.

Quick start:
1. `npm run install-all`
2. Set up backend `.env` file
3. `npm run dev`

## Future Enhancements (Optional)

- Email notifications for class schedules
- Calendar integration
- File sharing during classes
- Class recordings
- Chat functionality
- Attendance tracking
- Grade management
- Assignment submission

## License

MIT

