# TaskMate — Real-Time Collaborative Project Management Platform

TaskMate is a full-stack, real-time collaborative project management platform designed to help teams organize their work efficiently. The system provides features such as interactive Kanban boards, real-time group chat with media sharing and polls, video conferencing, workspace-based team management, analytics dashboards, and a premium subscription system with Khalti payment integration.

---

## Project Objective

The main objective of this project is to develop a comprehensive, all-in-one workspace solution that streamlines team collaboration and project management. TaskMate aims to eliminate the need for multiple disconnected tools by combining task management, communication, and video meetings into a single, real-time platform with an intuitive and modern user interface.

---

## Features

The system provides the following features:

- User registration with email OTP verification
- User login and authentication with JWT (HTTP-only cookies)
- Two-Factor Authentication (2FA) for enhanced security
- Forgot password and reset password via email
- Workspace creation and management with role-based access (Owner, Admin, Member)
- Workspace member invitation via email links
- Project creation with status, priority, tags, color coding, and calendar integration
- Interactive Kanban board with drag-and-drop task management (To Do, In Progress, Done)
- Task cards with assignees, priorities, due dates, subtasks, comments, attachments, and activity logs
- @mention notifications in task comments
- My Tasks view — see all tasks assigned to you across projects
- Workspace calendar with event scheduling
- Real-time group chat with public and private channels
- Direct messaging (DM) between workspace members
- WhatsApp-style file attachments (photos, videos, documents, audio)
- Interactive polls in chat channels
- Video and audio conferencing powered by ZegoCloud
- Meeting scheduling and management
- Analytics dashboard with task completion metrics and workload distribution (Pro plan)
- Billing and subscription management with Khalti payment gateway
- Free and Pro workspace plans with feature gating
- Real-time notifications via Socket.IO
- User profile management with avatar upload
- Cloudinary-powered media storage
- Responsive, modern UI with dark theme support
- Secure logout system

---

## Technologies Used

### Frontend

- React 19
- Vite (build tool)
- Tailwind CSS v4
- Styled Components
- Zustand (state management)
- React Router v7
- Axios (HTTP client)
- Socket.IO Client (real-time communication)
- @dnd-kit (drag-and-drop for Kanban boards)
- Recharts (data visualization and analytics)
- react-big-calendar with date-fns (calendar integration)
- Lucide React (icons)
- React Hot Toast (notifications)
- ZegoCloud UIKit (video/audio conferencing)

### Backend

- Node.js
- Express.js v5
- Mongoose ODM
- Socket.IO Server (WebSocket communication)
- JSON Web Token (JWT) for authentication
- bcrypt.js (password hashing)
- Resend API (transactional email delivery)
- Cloudinary with Multer (file upload and media storage)
- express-rate-limit (DDoS and brute-force protection)
- express-validator (input validation and sanitization)
- Morgan (HTTP request logging)
- cookie-parser (JWT cookie handling)
- ioredis (Redis client for OTP and session management)

### Database

- MongoDB Atlas (cloud-hosted NoSQL database)
- Redis / Upstash (OTP storage and caching)

### Deployment

- Vercel (frontend hosting)
- Digital Ocean (backend hosting)

---

## System Requirements

### Hardware

- Computer or smartphone
- Internet connection

### Software

- Web browser such as Google Chrome, Firefox, or Microsoft Edge
- Node.js (v18 or higher)
- npm (v9 or higher)
- Git

---

## Installation and Setup

Steps to run the project locally.

### 1. Clone the repository

```bash
git clone https://github.com/Anuj-Dhungana/TaskMate.git
```

### 2. Go to the project folder

```bash
cd TaskMate
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Configure backend environment variables

Create a `.env` file inside the `backend` folder with the following variables:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ZEGO_APP_ID=your_zego_app_id
ZEGO_SERVER_SECRET=your_zego_server_secret
ZEGO_TOKEN_EXPIRES_IN=3600

KHALTI_SECRET_KEY=your_khalti_secret_key
KHALTI_BASE_URL=https://dev.khalti.com/api/v2
PRO_PRICE_PAISA=1000

REDIS_URL=your_redis_connection_url
```

### 5. Run the backend server

```bash
npm run dev
```

The backend server will start at `http://localhost:5000`.

### 6. Install frontend dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 7. Configure frontend environment variables

Create a `.env` file inside the `frontend` folder:

```env
VITE_API_URL=http://localhost:5000
```

### 8. Run the frontend application

```bash
npm run dev
```

The frontend will start at `http://localhost:5173`.

---

## Live Project

Live URL of the deployed system:

- **Frontend:** https://task-mate.tech
    
---

## Project Structure

```
TaskMate/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/                  # Axios API configuration
│       ├── assets/               # Static assets (images, icons)
│       ├── components/
│       │   ├── analytics/        # Analytics charts and widgets
│       │   ├── board/            # Kanban board, lists, and cards
│       │   ├── calendar/         # Calendar components
│       │   ├── chat/             # Chat channels, messages, polls
│       │   ├── common/           # Shared UI components
│       │   ├── dashboard/        # Dashboard widgets
│       │   ├── layout/           # Sidebar, header, navigation
│       │   ├── members/          # Member management components
│       │   ├── modals/           # Modal dialogs
│       │   ├── notification/     # Notification bell and dropdown
│       │   ├── tasks/            # My Tasks view components
│       │   └── workspace/        # Workspace cards and forms
│       ├── constants/            # App-wide constants
│       ├── hooks/                # Custom React hooks
│       ├── lib/                  # Utility libraries
│       ├── pages/                # Route-level page components
│       │   └── auth/             # Authentication pages
│       ├── store/                # Zustand state management stores
│       ├── styles/               # Global and component styles
│       └── utils/                # Helper/utility functions
│
├── backend/
│   └── src/
│       ├── config/               # Database, Cloudinary, plan configs
│       ├── controllers/          # Route handler logic
│       ├── middleware/           # Auth, rate limiting, file upload
│       ├── models/              # Mongoose schemas
│       ├── routes/              # Express route definitions
│       ├── services/            # Business logic layer
│       ├── utils/               # Email sender, helpers
│       └── validators/          # Input validation rules
│
└── README.md
```

---



## Future Improvements

Possible improvements for the system:

- Mobile application version (React Native)
- Improved user interface with more theme options
- Additional security features (OAuth, SSO)
- Advanced analytics with exportable reports
- File versioning and document collaboration
- Integration with third-party tools (Slack, GitHub, Google Calendar)
- AI-powered task prioritization and workload balancing
- Push notifications for mobile and desktop
- Gantt chart view for project timelines
- Time tracking per task

---

## Authors

**Anuj Dhungana**
BSc (Hons) Computing
Final Year Project

---

## License

This project is created for educational purposes as part of a Final Year Project.
