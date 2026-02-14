# Focus and Habit Tracker

A full-stack productivity application to help you track your daily activities, habits, and focus sessions. Built with a modern MERN stack (MongoDB, Express, React, Node.js) and Vite for blazing-fast frontend development.

---

## 🚀 Features

- **User Authentication**: Secure registration, login, and JWT-based session management.
- **Activity Logging**: Track activities by category (Work, Study, Exercise, Break, Other) with duration and timestamps.
- **Analytics Dashboard**: Visualize your productivity with weekly analytics, bar/line charts, and best day/category highlights.
- **Calendar History**: Browse and filter your activity history by date and category.
- **Responsive UI**: Modern, mobile-friendly design with smooth animations.

---

## 🗂️ Project Structure

```
Focus and Habit Tracker/
│
├── backend/                  # Node.js + Express + MongoDB backend
│   ├── src/
│   │   ├── controller/       # Route controllers (activity.controller.js, user.controller.js)
│   │   ├── db/               # Database connection (db_connect.js)
│   │   ├── middlewares/      # Auth, multer, etc. (auth.middleware.js, multer.middleware.js)
│   │   ├── models/           # Mongoose models (activity.model.js, user.models.js)
│   │   ├── routes/           # Express routes (activity.route.js, user.route.js)
│   │   ├── utils/            # Utility functions (apiError.utils.js, apiResponse.utils.js, asyncHandler.utils.js)
│   │   ├── app.js            # Express app setup
│   │   ├── constant.js       # Constants
│   │   └── index.js          # Entry point
│   ├── package.json
│   ├── vercel.json
│   └── public/               # Static/public files
│
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── api/              # Axios instance
│   │   ├── components/       # UI components
│   │   ├── pages/            # Main pages (History, Login, Signup)
│   │   └── store/            # Redux slices
│   ├── package.json
│   └── vercel.json
│
└── README.md                 # Project documentation
```

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, date-fns, Axios
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, multer, Cloudinary
- **Deployment**: Vercel (for both frontend and backend)

---

## ⚙️ Environment Setup

### 1. Backend (`backend`)

#### Install dependencies
```bash
cd backend
npm install
```

#### Environment Variables
Create a `.env` file in `backend/` with the following:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DB_NAME=focus_habit_db
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Run the backend
```bash
npm start
```

---

### 2. Frontend (`frontend`)

#### Install dependencies
```bash
cd frontend
npm install
```

#### Environment Variables
Create a `.env` file in `frontend/` with the following:

```
VITE_API_URL=http://localhost:5000
```

#### Run the frontend
```bash
npm run dev
```

---

## 🌐 API Endpoints

### Auth
- `POST /users/register` — Register a new user
- `POST /users/login` — Login
- `POST /users/logout` — Logout
- `POST /users/refresh-token` — Refresh JWT
- `GET /users/me` — Get current user profile

### Activities
- `POST /activities/create-Activity` — Log a new activity
- `GET /activities` — Get all activities
- `GET /activities/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` — Activities in date range
- `GET /activities/weekly-analytics` — Weekly analytics data
- `DELETE /activities/:activityId` — Delete an activity

---

## 📦 Deployment

- Both frontend and backend are ready for Vercel deployment. See `vercel.json` in each folder for configuration.

---

## 📝 Notes

- All dates are stored in MongoDB as UTC. The frontend and backend use JavaScript's `Date` object for all date handling to ensure consistency.
- Profile images are uploaded to Cloudinary. You must set up a Cloudinary account and provide the credentials in your backend `.env`.
- For local development, ensure both frontend and backend are running and the API URL is set correctly in the frontend `.env`.

---

## 🙏 Credits

- Built by Abhijeet and contributors.
- Inspired by productivity and habit-tracking best practices.

---

## 📧 Contact

For questions, suggestions, or contributions, please open an issue or contact the maintainer.
