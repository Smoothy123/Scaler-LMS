# PRO-SCALER

A web-based e-learning platform that supports both **instructors** and **students**.
Instructors can create courses and lectures, while students can browse courses, view lectures, and track their progress.

---

## Features

### Login

* Users can sign up or login.
* Supports both **students** and **instructors**.

### Instructor

* Create, update, and delete courses.
* Add lectures with content, type, week, and YouTube links.
* Manage course images and descriptions.

### Student

* Browse available courses (search option also available).
* Access lecture content.
* Week-wise implementation:

  1. Video Content
  2. Reading
  3. Quiz
* Track progress across courses.

---

## Database (AWS DynamoDB)

Implemented **3 tables**:

1. **Courses** – `courseId`, `title`, `description`, `image`, `instructorId`, `youtubeLink`
2. **Lectures** – `courseId`, `lectureId`, `title`, `content`, `status`, `type`, `week`, `youtubeUrl`
3. **Users** – `username`, `password`, `userId`

---

## Folder Structure

```
PRO-SCALER
│
├── backend/
│   ├── config/
│   │   └── db.js            # Database connection
│   ├── middlewares/
│   │   └── auth.js          # Authentication middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── courses.js
│   │   └── lectures.js
│   ├── server.js            # Backend server
│   ├── package.json
│   └── .env                 # Environment variables (use your own AWS credentials)
│
├── frontend/
│   ├── index.html
│   ├── course.html
│   ├── login.html
│   ├── signup.html
│   ├── student.html
│   ├── instructor-dashboard.html
│   ├── progress.html
│   ├── instructor.js
│   ├── progress.js
│   ├── app.js
│   ├── instructor.css
│   ├── progress.css
│   ├── server.js
│   └── assets/
│       └── bg.jpg
```

---

## Deployment

This project is deployed on an **Amazon EC2 t2.micro** instance.
Both the **backend (Node.js/Express)** and **frontend** are hosted on the same instance.

---

## Access URLs

* **Backend (API server)** → [http://18.209.46.24:5000/](http://18.209.46.24:5000/)
* **Frontend (App)** → [http://18.209.46.24:3000/](http://18.209.46.24:3000/)

---

## Ports

* **Port 5000** → Backend server (Express/Node.js)
* **Port 3000** → Frontend development server


