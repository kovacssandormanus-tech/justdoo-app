# JustDoo Task Manager

An elegant, focused task management application built with React, TypeScript, and tRPC. JustDoo helps you organize your tasks into four intuitive views and stay productive.

## Features

### Four Task Views

- **Inbox** - Capture unscheduled tasks without worrying about dates
- **Mai feladatok (Today)** - Focus on what needs to be done today
- **Következő 10 nap (Next 10 days)** - Plan ahead with upcoming tasks
- **Valamikor talán (Someday/Maybe)** - Keep track of ideas for the future

### Project Management

- Create unlimited projects with custom colors
- Assign tasks to projects for better organization
- Quick visual identification with color-coded badges
- Full CRUD operations for projects

### Task Management

- Create tasks with title, description, and due date
- Edit tasks anytime to update details
- Mark tasks as complete with a single click
- Delete tasks with confirmation
- Assign tasks to projects
- View task details with project and due date information

### User Experience

- Clean, elegant interface with thoughtful design
- Responsive layout for desktop and mobile
- Smooth animations and transitions
- Intuitive sidebar navigation
- Real-time updates across all views

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **tRPC** - Type-safe API calls
- **Wouter** - Lightweight routing
- **Sonner** - Toast notifications

### Backend
- **Express 4** - Web server
- **tRPC 11** - RPC framework
- **Drizzle ORM** - Database abstraction
- **MySQL/TiDB** - Database (Neon.tech PostgreSQL compatible)
- **Manus OAuth** - Authentication

### DevTools
- **Vite** - Build tool
- **Vitest** - Unit testing
- **Prettier** - Code formatting
- **TypeScript** - Type checking

## Getting Started

### Prerequisites

- Node.js 18+ with pnpm
- MySQL/TiDB database (or Neon.tech PostgreSQL)
- Manus OAuth credentials

### Local Development

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Add your database connection string
   - Add your Manus OAuth credentials

3. **Run database migrations**
   ```bash
   pnpm drizzle-kit generate
   pnpm db:push
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Open in browser**
   - Navigate to http://localhost:3000
   - Click "Get Started" to log in

### Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
justdoo_app/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── lib/              # Utilities and helpers
│   │   ├── contexts/         # React contexts
│   │   └── App.tsx           # Main app component
│   └── index.html            # HTML entry point
├── server/                    # Backend Express application
│   ├── routers.ts            # tRPC procedure definitions
│   ├── db.ts                 # Database query helpers
│   └── _core/                # Framework internals
├── drizzle/                   # Database schema and migrations
│   └── schema.ts             # Drizzle ORM schema
├── shared/                    # Shared types and constants
├── package.json              # Dependencies
└── DEPLOYMENT.md             # Deployment guide
```

## Database Schema

### Users Table
- `id` - Primary key
- `openId` - Manus OAuth identifier
- `name` - User's name
- `email` - User's email
- `role` - User role (admin/user)
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### Projects Table
- `id` - Primary key
- `userId` - Owner user ID
- `name` - Project name
- `color` - Hex color code
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Tasks Table
- `id` - Primary key
- `userId` - Owner user ID
- `projectId` - Associated project (nullable)
- `title` - Task title
- `description` - Task description (nullable)
- `dueDate` - Due date (nullable)
- `status` - Task status (pending/completed)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## API Endpoints

All API calls use tRPC and are type-safe. The following procedures are available:

### Tasks
- `tasks.listByView(view)` - List tasks by view (inbox/today/next10days/someday)
- `tasks.create(input)` - Create a new task
- `tasks.update(input)` - Update task details
- `tasks.delete(id)` - Delete a task
- `tasks.toggleStatus(id)` - Toggle task completion status

### Projects
- `projects.list()` - List all user projects
- `projects.create(input)` - Create a new project
- `projects.update(input)` - Update project details
- `projects.delete(id)` - Delete a project

### Authentication
- `auth.me()` - Get current user info
- `auth.logout()` - Log out current user

## Testing

Run the test suite:

```bash
pnpm test
```

Tests are written with Vitest and cover:
- Task CRUD operations
- Project CRUD operations
- View filtering logic
- Authentication flows

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Quick summary:
1. Set up Neon.tech PostgreSQL database
2. Deploy to Railway.com
3. Configure environment variables
4. Run database migrations
5. Access your deployed application

## Performance Optimization

- **Database**: Uses connection pooling for efficiency
- **Frontend**: Code splitting with Vite
- **Caching**: tRPC query caching for reduced API calls
- **Images**: Optimized with lazy loading
- **CSS**: Tailwind CSS purges unused styles

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management
- Color contrast compliance

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

To contribute to JustDoo:

1. Create a feature branch
2. Make your changes
3. Write tests for new features
4. Run `pnpm test` to verify
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests:
- Check existing GitHub issues
- Create a new issue with detailed description
- Include steps to reproduce for bugs

## Roadmap

Planned features for future releases:

- [ ] Task recurring/repeat functionality
- [ ] Task priority levels
- [ ] Collaborative task sharing
- [ ] Mobile app (React Native)
- [ ] Task templates
- [ ] Advanced filtering and search
- [ ] Calendar view
- [ ] Integration with calendar apps
- [ ] Email notifications
- [ ] Dark mode theme

## Changelog

### Version 1.0.0 (Initial Release)
- Four task views (Inbox, Today, Next 10 days, Someday)
- Project management with custom colors
- Full task CRUD operations
- User authentication with Manus OAuth
- Elegant UI with Tailwind CSS
- Responsive design
- Complete test coverage

## Acknowledgments

Built with:
- React and TypeScript communities
- shadcn/ui component library
- Tailwind CSS framework
- tRPC for type-safe APIs
- Drizzle ORM for database abstraction

---

**JustDoo** - Focus on what matters. Organize with elegance.
