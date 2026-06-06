# Meridian — AI-Powered Academic Productivity Platform

> "I designed and built an AI-powered academic productivity platform with contextual document intelligence and realtime collaboration systems."

---

## Why I Built This

Most academic platforms feel like glorified file storage. Students upload assignments, professors download them, nothing in between adds any intelligence to the process.

I wanted to build something different — a platform where AI actually understands your coursework. Where a student can ask "what is this assignment asking me to do?" and get a real, contextual answer based on the actual assignment PDF. Where deadlines are extracted automatically. Where study plans are generated from course material.

Meridian is my flagship portfolio project for Summer 2026. It is built to production standards — not as a tutorial exercise, but as a real application I intend to ship on the App Store.

The goal is to demonstrate full-stack engineering, iOS expertise, AI integration, realtime systems, and product thinking — all in one cohesive project.

---

## What Makes Meridian Different

This is **not** a Canvas clone.

Meridian is an **assignment intelligence platform**. The core differentiator is an AI assistant called **Sage** — powered by a RAG (Retrieval-Augmented Generation) pipeline that reads assignment PDFs, understands their content, and answers student questions contextually.

Sage can:
- Summarize what an assignment is asking
- Extract deadlines from uploaded documents
- Explain specific requirements
- Create personalized study plans
- Answer questions like "What does requirement 3 mean?"

Sage will **not** complete assignments, generate final answers, or do academic work on behalf of students. Academic integrity is a core design principle.

---

## Tech Stack

### iOS (Frontend)
- SwiftUI
- MVVM Architecture
- async/await networking
- SwiftData for offline caching
- Firebase Storage for file uploads

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- JWT Authentication
- Role-based access control

### AI (Phase 3)
- OpenAI API (GPT-4o + Embeddings)
- Pinecone Vector Database
- Custom RAG Pipeline
- PDF ingestion and chunking

### Realtime & Infrastructure
- Firebase Firestore (messaging)
- Firebase Auth
- APNs / FCM (push notifications)

---

## Architecture

```
iOS Client (SwiftUI)
      ↓
REST API (Node.js + Express + TypeScript)
      ↓
PostgreSQL (users, courses, assignments, submissions)
      ↓
AI Service (RAG pipeline → Pinecone → GPT-4o)
      ↓
Firebase (realtime messaging + file storage)
```

---

## Development Phases

### ✅ Phase 1 — LMS Foundation (Current)
The core academic platform. Authentication, course management, assignment uploads, file submissions.

### 🔜 Phase 2 — Messaging & Notifications
Realtime professor-student messaging with Firestore. Typing indicators, read receipts, push notifications via APNs.

### 🔜 Phase 3 — AI Assistant (Sage)
RAG pipeline with PDF ingestion, vector embeddings, and contextual question answering.

### 🔜 Phase 4 — Polish & App Store
Production UI/UX, error handling, analytics, TestFlight beta, App Store submission.

---

## What's Built — Phase 1

### Backend API (Node.js + Express + TypeScript)

Complete REST API with the following modules:

**Authentication**
- `POST /auth/register` — Register as professor or student
- `POST /auth/login` — Login and receive JWT token
- JWT-based authentication on all protected routes
- Role-based middleware (professor vs student access control)

**Courses**
- `GET /courses` — Get all courses (professors see their own, students see enrolled)
- `POST /courses` — Create a course (professor only)
- `GET /courses/:id` — Get a single course
- `POST /courses/:id/enroll` — Enroll in a course (student only)
- `DELETE /courses/:id/enroll` — Unenroll from a course

**Assignments**
- `GET /courses/:courseId/assignments` — Get all assignments for a course
- `POST /courses/:courseId/assignments` — Create an assignment with optional PDF (professor only)
- `GET /courses/:courseId/assignments/:id` — Get a single assignment
- `PATCH /courses/:courseId/assignments/:id` — Update an assignment
- `DELETE /courses/:courseId/assignments/:id` — Delete an assignment

**Submissions**
- `POST /courses/:courseId/assignments/:assignmentId/submissions` — Submit an assignment (student only)
- `GET /courses/:courseId/assignments/:assignmentId/submissions` — View all submissions (professor only)
- `GET /courses/:courseId/assignments/:assignmentId/submissions/me` — View own submission (student only)
- `PATCH /courses/:courseId/assignments/:assignmentId/submissions/:id` — Grade a submission (professor only)

**Database Schema**
- `users` — professors and students with role enforcement
- `courses` — owned by professors
- `enrollments` — student-course relationships (unique constraint prevents duplicate enrollments)
- `assignments` — belong to courses, optional PDF attachment
- `submissions` — one per student per assignment (unique constraint enforced at DB level)

---

### iOS App (SwiftUI + MVVM)

#### Authentication Screens

**Login Screen**
- Email and password fields
- Role-aware navigation — professors route to professor dashboard, students to student dashboard
- JWT token stored securely in Keychain
- Error states and loading indicators

**Register Screen**
- Full name, email, password fields
- Role picker (Student / Professor)
- Validates all fields before submission

---

#### Student Portal

**Student Dashboard**
- Personalized greeting header
- Upcoming deadlines strip — assignments sorted by due date
- Enrolled courses grid
- Deadline badges: green (>3 days), amber (1–3 days), red (due today/overdue)

**My Courses**
- List of all enrolled courses
- Course code and professor name displayed
- Join Course button — enter a course code to enroll

**Course Detail**
- Course header with title and description
- Assignment list sorted by due date
- Tap any assignment to open detail view

**Assignment Detail**
- Title, description, due date badge
- PDF viewer (native QuickLook)
- Submit button — opens file picker
- Shows submission status if already submitted
- *(Phase 3 hook: Sage AI assistant button)*

**Submit Assignment**
- Native document picker
- Selected file preview
- Upload to Firebase Storage
- Posts download URL to backend

---

#### Professor Portal

**Professor Dashboard**
- Stats row: total courses, assignments, submissions
- My courses list
- Quick actions: Create Course, View Submissions

**Create Course**
- Title, description, course code fields
- Auto-generates shareable course code
- Posts to backend and refreshes dashboard

**Course Detail (Professor)**
- Course info header
- Enrolled students count
- Assignments list
- Add Assignment button

**Create Assignment**
- Title, description fields
- Due date picker
- Optional PDF attachment
- Uploads file to Firebase Storage, posts metadata to backend

**Submissions List**
- Per-assignment view of all student submissions
- Student name, submission time, status badge
- Download link for each submitted file
- Grade input field

---

## Database Schema

```sql
users        — id, email, password_hash, full_name, role, created_at
courses      — id, professor_id, title, description, course_code, is_active, created_at
enrollments  — id, student_id, course_id, enrolled_at
assignments  — id, course_id, title, description, file_url, due_date, created_at
submissions  — id, assignment_id, student_id, file_url, status, grade, submitted_at
```

---

## Key Engineering Decisions

**Why PostgreSQL over NoSQL**
Meridian's data is highly relational — courses belong to professors, assignments belong to courses, submissions belong to both assignments and students. PostgreSQL enforces these relationships at the database level with foreign keys and cascade rules. NoSQL would require enforcing this in application code, which is error-prone.

**Why JWT over session auth**
iOS apps are stateless clients. JWTs allow the server to verify identity without storing session state, making the API horizontally scalable. Tokens are stored in iOS Keychain, never in UserDefaults.

**Why role middleware is centralized**
Role checks live entirely in Express middleware, not scattered through controller logic. This means adding a new protected route is one line — `requireRole('professor')` — rather than an if-statement inside every handler.

**Why Firebase Storage for files**
File bytes never touch the Express server. iOS uploads directly to Firebase Storage and sends only the download URL to the backend. This keeps the API server stateless and fast, and offloads bandwidth costs to Firebase.

**Why nested REST routes**
`/courses/:courseId/assignments/:assignmentId/submissions` makes ownership explicit at the URL level. Middleware can verify course membership before the controller runs, rather than checking inside every handler.

---

## Running Locally

### Backend

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET

# Start development server
npm run dev
```

### Environment Variables

```
DATABASE_URL=postgresql://localhost/meridian
JWT_SECRET=your_secret_key_here
PORT=3000
```

### Database Setup

```sql
-- Run in psql
CREATE DATABASE meridian;
-- Then run migrations in /migrations folder
```

---

## Roadmap

- [x] PostgreSQL schema design
- [x] JWT authentication with role-based access
- [x] Courses module (CRUD + enrollment)
- [x] Assignments module (CRUD + file attachment)
- [x] Submissions module (submit + grade)
- [ ] iOS SwiftUI app — Login + Register
- [ ] iOS SwiftUI app — Student dashboard
- [ ] iOS SwiftUI app — Professor dashboard
- [ ] iOS SwiftUI app — Assignment detail + PDF viewer
- [ ] iOS SwiftUI app — File submission flow
- [ ] Firebase Firestore realtime messaging
- [ ] Push notifications (APNs)
- [ ] RAG pipeline (PDF ingestion + Pinecone)
- [ ] Sage AI assistant
- [ ] App Store submission

---

## About

Built by Omkar Sapkal — iOS and full-stack engineer.

This project is being built in public. Follow the journey on LinkedIn.
