# AI CMS - Multi-User Content Management System

A fully-featured, modern CMS built with Next.js 14, Prisma, and Basecoat UI principles. Features a robust multi-user system with role-based access control.

## Features

### Multi-User System
- **4 User Roles**: Admin, Editor, Author, and Viewer
- **Role-Based Access Control (RBAC)**
  - **Admin**: Full system access, user management, all content operations
  - **Editor**: Create, edit, and publish all content, manage categories
  - **Author**: Create and manage own content
  - **Viewer**: Read-only access

### Content Management
- Rich markdown editor for post creation
- Categories and tags for content organization
- Draft and published states
- Cover images and excerpts
- Comment system (backend ready)
- SEO-friendly slugs

### Media Management
- File upload system
- Media library with preview
- Image and file support
- Per-user upload tracking

### User Interface
- Modern, responsive design with Tailwind CSS
- Clean admin dashboard
- Intuitive content editor
- Real-time data updates
- Dark mode ready

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite (easily switchable to PostgreSQL)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + Custom Components (Basecoat UI principles)
- **Language**: TypeScript

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up the database**:
```bash
npx prisma generate
npx prisma db push
```

3. **Seed the database with demo users**:
```bash
curl -X POST http://localhost:3000/api/seed
```

Or visit `http://localhost:3000/api/seed` in your browser after starting the dev server.

4. **Start the development server**:
```bash
npm run dev
```

5. **Open your browser**:
Navigate to `http://localhost:3000`

### Demo Accounts

After seeding, you can login with:

- **Admin**: admin@example.com / admin123
- **Editor**: editor@example.com / editor123
- **Author**: author@example.com / author123

## Project Structure

```
ai-cms/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── posts/        # Post CRUD operations
│   │   ├── users/        # User management
│   │   ├── categories/   # Category management
│   │   ├── tags/         # Tag management
│   │   └── media/        # Media upload/management
│   ├── admin/            # Admin dashboard pages
│   │   ├── posts/       # Post management UI
│   │   ├── users/       # User management UI
│   │   ├── categories/  # Category/tag management
│   │   └── media/       # Media library UI
│   └── login/           # Login page
├── components/           # React components
│   ├── ui/             # Base UI components
│   └── admin/          # Admin-specific components
├── lib/                # Utility functions
│   ├── prisma.ts      # Prisma client
│   ├── auth.ts        # Auth configuration
│   └── utils.ts       # Helper functions
├── prisma/            # Database schema
│   └── schema.prisma  # Prisma schema definition
└── types/             # TypeScript type definitions
```

## Key Features Explained

### Role-Based Permissions

| Feature | Admin | Editor | Author | Viewer |
|---------|-------|--------|--------|--------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Create Posts | ✅ | ✅ | ✅ | ❌ |
| Edit Own Posts | ✅ | ✅ | ✅ | ❌ |
| Edit All Posts | ✅ | ✅ | ❌ | ❌ |
| Delete Own Posts | ✅ | ✅ | ✅ | ❌ |
| Delete All Posts | ✅ | ❌ | ❌ | ❌ |
| Manage Categories | ✅ | ✅ | ❌ | ❌ |
| Manage Tags | ✅ | ✅ | ✅ | ❌ |
| Upload Media | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |

### API Endpoints

**Authentication**
- `POST /api/auth/[...nextauth]` - Authentication

**Posts**
- `GET /api/posts` - List all posts
- `POST /api/posts` - Create post
- `GET /api/posts/[id]` - Get post by ID
- `PATCH /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post

**Users** (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/[id]` - Get user
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

**Categories**
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category

**Tags**
- `GET /api/tags` - List tags
- `POST /api/tags` - Create tag

**Media**
- `GET /api/media` - List media files
- `POST /api/media` - Upload file

## Database Schema

The CMS uses the following main models:

- **User**: User accounts with role-based access
- **Post**: Content with markdown support
- **Category**: Content categorization
- **Tag**: Content tagging
- **Media**: File uploads
- **Comment**: Post comments (ready for implementation)

## Configuration

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
APP_NAME="AI CMS"
```

### Database Migration

To switch from SQLite to PostgreSQL:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

3. Run migration:
```bash
npx prisma migrate dev
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes to database

### Adding New Features

1. **Add API Route**: Create in `app/api/[feature]/route.ts`
2. **Add UI Page**: Create in `app/admin/[feature]/page.tsx`
3. **Update Schema**: Modify `prisma/schema.prisma` if needed
4. **Add Components**: Create in `components/admin/`

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

1. Build the project: `npm run build`
2. Set up PostgreSQL database
3. Run migrations: `npx prisma migrate deploy`
4. Start: `npm start`

## Security Considerations

- Passwords are hashed with bcrypt
- API routes protected with NextAuth middleware
- Role-based access control on all operations
- SQL injection prevention via Prisma
- CSRF protection via NextAuth

## Future Enhancements

- [ ] Email verification
- [ ] Password reset flow
- [ ] Comment moderation UI
- [ ] Post versioning
- [ ] Advanced media editing
- [ ] Analytics dashboard
- [ ] Export/import functionality
- [ ] Multi-language support

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Prisma, and modern web technologies.
