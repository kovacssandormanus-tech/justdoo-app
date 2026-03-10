# JustDoo Task Manager - Feature Checklist

## Database & Schema
- [x] Create tasks table with id, title, description, dueDate, status, projectId, userId, createdAt, updatedAt
- [x] Create projects table with id, name, color, userId, createdAt, updatedAt
- [x] Generate and apply Drizzle migrations

## Backend API (tRPC Procedures)
- [x] Tasks: list tasks by view (inbox, today, next10days, someday)
- [x] Tasks: create new task
- [x] Tasks: update task (title, description, dueDate, projectId, status)
- [x] Tasks: delete task
- [x] Tasks: toggle task completion status
- [x] Projects: list all projects for user
- [x] Projects: create new project
- [x] Projects: update project (name, color)
- [x] Projects: delete project

## Frontend UI - Layout & Navigation
- [x] DashboardLayout with sidebar navigation
- [x] Sidebar showing four main views: Inbox, Mai feladatok, Következő 10 nap, Valamikor talán
- [x] Sidebar showing projects list with project colors
- [x] Active view highlighting in sidebar
- [x] Create project button in sidebar

## Frontend UI - Task Views
- [x] Inbox view: display unscheduled tasks
- [x] Mai feladatok (Today) view: display tasks due today
- [x] Következő 10 nap (Next 10 days) view: display tasks due in next 10 days
- [x] Valamikor talán (Someday) view: display tasks without due date
- [x] Task list display with title, project badge, due date, completion status
- [x] Task item click to open detail/edit modal

## Frontend UI - Task Management
- [x] Create task button in each view
- [x] Create task modal with title, description, dueDate, projectId fields
- [x] Edit task modal with all task fields
- [x] Delete task confirmation dialog
- [x] Toggle task completion with checkbox
- [x] Task filtering by project (optional: add filter UI)

## Frontend UI - Project Management
- [x] Create project modal with name and color picker
- [x] Edit project modal
- [x] Delete project confirmation dialog
- [x] Project color display in task badges

## Design & Styling
- [x] Define elegant color palette and typography
- [x] Apply consistent spacing and shadows
- [x] Responsive design for mobile and desktop
- [x] Smooth transitions and micro-interactions
- [x] Dark/light theme support (optional)

## Testing & Deployment
- [x] Write vitest tests for backend procedures
- [x] Test all CRUD operations
- [x] Configure Railway.com deployment environment variables
- [x] Test with Neon.tech PostgreSQL connection
- [x] Verify all views and features work correctly

## Deployment
- [x] Create comprehensive deployment guide
- [x] Prepare Railway.com deployment instructions
- [x] Document Neon.tech connection setup
- [x] Create railway.toml configuration
- [x] Write README with feature overview
