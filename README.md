# AI CMS - Multi-User Content Management System

A fully-featured, production-ready CMS built with Next.js 14, Prisma, Supabase, and Tailwind CSS. Features a robust multi-user system with role-based access control and a beautiful public-facing frontend.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fai-cms)

## 🌟 Features

### 🔐 Multi-User System
- **4 User Roles**: Admin, Editor, Author, and Viewer
- **Role-Based Access Control (RBAC)**
  - **Admin**: Full system access, user management, all content operations
  - **Editor**: Create, edit, and publish all content, manage categories
  - **Author**: Create and manage own content
  - **Viewer**: Read-only access

### 📝 Content Management
- Rich markdown editor for post creation
- Categories and tags for content organization
- Draft and published states
- Cover images and excerpts
- Comment system (backend ready)
- SEO-friendly slugs
- Full-text content rendering with syntax highlighting

### 🎨 Public Frontend
- **Beautiful Article Pages**: Modern, magazine-style layouts
- **Homepage**: Hero section with featured posts and category browsing
- **Article List**: Paginated article browsing with filters
- **Category Pages**: Browse articles by category
- **Tag Pages**: Explore content by tags
- **About Page**: Customizable about page
- **Responsive Design**: Perfect on mobile, tablet, and desktop
- **Dark Mode Ready**: Automatic theme support

### 📁 Media Management
- File upload system
- Media library with preview
- Image and file support
- Per-user upload tracking
- URL copy functionality

### 💎 User Interface
- Modern, responsive design with Tailwind CSS
- Clean admin dashboard with statistics
- Intuitive content editor
- Real-time data updates
- Gradient accents and smooth transitions

## 🚀 Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + Custom Components
- **Language**: TypeScript
- **Deployment**: Vercel
- **Markdown**: React Markdown

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier available)
- Vercel account (optional, for deployment)

### Local Development Setup

1. **Clone the repository**:
```bash
git clone https://github.com/your-username/ai-cms.git
cd ai-cms
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up Supabase**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Get your database connection strings from Settings > Database
   - Copy `.env.example` to `.env` and add your Supabase credentials

4. **Configure environment variables**:
```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App
APP_NAME="AI CMS"
APP_URL="http://localhost:3000"
```

5. **Initialize the database**:
```bash
npx prisma generate
npx prisma db push
```

6. **Start the development server**:
```bash
npm run dev
```

7. **Seed the database** (optional):
Visit `http://localhost:3000/api/seed` in your browser to create demo users.

8. **Access the application**:
   - **Public Frontend**: http://localhost:3000
   - **Admin Dashboard**: http://localhost:3000/admin
   - **Login**: http://localhost:3000/login

### Demo Accounts

After seeding, you can login with:

- **Admin**: admin@example.com / admin123
- **Editor**: editor@example.com / editor123
- **Author**: author@example.com / author123

## 🌐 Deployment to Vercel

### 🚀 Zero-Touch Deployment (Recommended - No Local Commands!)

Deploy and initialize your database entirely through the web - no local terminal commands needed!

1. **Push to GitHub**:
```bash
git push origin main
```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Add environment variables (from your Supabase project):
     ```env
     DATABASE_URL=postgresql://postgres.xxx:password@aws-x-region.pooler.supabase.com:6543/postgres
     NEXTAUTH_URL=https://your-app.vercel.app
     NEXTAUTH_SECRET=your-random-secret
     SETUP_SECRET=your-setup-secret
     ```
   - Click "Deploy"

3. **Automatic Database Setup**:
   The build process automatically:
   - ✅ Generates Prisma Client
   - ✅ Pushes schema to database
   - ✅ Builds the application

   **No manual commands needed!**

4. **Initialize Data (Choose One)**:

   **Option A: Setup Page** (Recommended)
   - Visit: `https://your-app.vercel.app/setup`
   - Enter your `SETUP_SECRET`
   - Click "Initialize Database"
   - Click "Seed Database"

   **Option B: Direct API**
   - Visit: `https://your-app.vercel.app/api/seed`

5. **Done! 🎉**
   - Login: `https://your-app.vercel.app/login`
   - Use: `admin@example.com` / `admin123`

**📖 For complete zero-touch setup guide, see [SETUP-GUIDE.md](SETUP-GUIDE.md)**

**📖 For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

### Automatic Updates

Once deployed, Vercel automatically:
- ✅ Builds on every push to `main` branch
- ✅ Creates preview deployments for pull requests
- ✅ Runs database migrations
- ✅ Invalidates cache as needed

## 📂 Project Structure

```
ai-cms/
├── app/                      # Next.js app directory
│   ├── (public)/            # Public-facing pages
│   │   ├── articles/        # Article pages
│   │   ├── categories/      # Category pages
│   │   ├── tags/           # Tag pages
│   │   └── about/          # About page
│   ├── api/                # API routes
│   │   ├── auth/          # Authentication
│   │   ├── posts/         # Posts CRUD
│   │   ├── users/         # User management
│   │   ├── categories/    # Categories
│   │   ├── tags/          # Tags
│   │   ├── media/         # Media upload
│   │   └── seed/          # Database seeding
│   ├── admin/             # Admin dashboard
│   │   ├── posts/        # Post management
│   │   ├── users/        # User management
│   │   ├── categories/   # Category management
│   │   └── media/        # Media library
│   ├── login/            # Login page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Homepage
├── components/            # React components
│   ├── ui/              # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── admin/           # Admin components
│   │   ├── admin-nav.tsx
│   │   ├── post-editor.tsx
│   │   └── ...
│   └── public/          # Public components
│       ├── public-nav.tsx
│       ├── footer.tsx
│       ├── article-card.tsx
│       └── markdown-renderer.tsx
├── lib/                 # Utility functions
│   ├── prisma.ts       # Prisma client
│   ├── auth.ts         # Auth configuration
│   └── utils.ts        # Helper functions
├── prisma/             # Database schema
│   └── schema.prisma   # Prisma schema
├── types/              # TypeScript types
│   └── next-auth.d.ts
├── public/             # Static assets
│   └── uploads/        # User uploads
├── .env.example        # Environment variables template
├── vercel.json         # Vercel configuration
├── DEPLOYMENT.md       # Deployment guide
└── README.md           # This file
```

## 🎯 Key Features Explained

### Role-Based Permissions

| Feature | Admin | Editor | Author | Viewer |
|---------|-------|--------|--------|--------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Public Site | ✅ | ✅ | ✅ | ✅ |
| Create Posts | ✅ | ✅ | ✅ | ❌ |
| Edit Own Posts | ✅ | ✅ | ✅ | ❌ |
| Edit All Posts | ✅ | ✅ | ❌ | ❌ |
| Delete Own Posts | ✅ | ✅ | ✅ | ❌ |
| Delete All Posts | ✅ | ❌ | ❌ | ❌ |
| Manage Categories | ✅ | ✅ | ❌ | ❌ |
| Create Tags | ✅ | ✅ | ✅ | ❌ |
| Upload Media | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |

### Public Pages

| Page | Route | Description |
|------|-------|-------------|
| Homepage | `/` | Hero section, featured posts, categories |
| Articles | `/articles` | Paginated article list |
| Article Detail | `/articles/[slug]` | Full article with Markdown rendering |
| Categories | `/categories` | All categories |
| Category Page | `/categories/[slug]` | Articles in category |
| Tag Page | `/tags/[slug]` | Articles with tag |
| About | `/about` | About page |

### Admin Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin` | Statistics and recent posts |
| Posts | `/admin/posts` | Manage all posts |
| New Post | `/admin/posts/new` | Create new post |
| Edit Post | `/admin/posts/[id]/edit` | Edit existing post |
| Users | `/admin/users` | User management (Admin only) |
| Categories | `/admin/categories` | Manage categories and tags |
| Media | `/admin/media` | Media library |

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

**Utilities**
- `POST /api/seed` - Seed database with demo data

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes to database
- `npx prisma migrate dev` - Create and apply migration

### Database Schema

The CMS uses the following main models:

- **User**: User accounts with role-based access
- **Post**: Content with markdown support
- **Category**: Content categorization
- **Tag**: Content tagging
- **Media**: File uploads
- **Comment**: Post comments (ready for implementation)

### Environment Variables

Required environment variables:

```env
DATABASE_URL          # Supabase pooled connection
DIRECT_URL            # Supabase direct connection
NEXTAUTH_URL          # Application URL
NEXTAUTH_SECRET       # Auth secret key
APP_NAME              # Application name
APP_URL               # Application URL
```

## 🔒 Security

- ✅ Passwords hashed with bcrypt
- ✅ API routes protected with NextAuth middleware
- ✅ Role-based access control on all operations
- ✅ SQL injection prevention via Prisma
- ✅ CSRF protection via NextAuth
- ✅ Environment variables for sensitive data
- ✅ Secure session management

## 🎨 Customization

### Branding

Update the following files to customize branding:

1. **Logo & Name**:
   - `components/public/public-nav.tsx`
   - `components/public/footer.tsx`

2. **Colors**:
   - `tailwind.config.ts` - Update color scheme
   - `app/globals.css` - Update CSS variables

3. **Content**:
   - `app/(public)/about/page.tsx` - Update about page
   - `app/page.tsx` - Update homepage content

### Adding Features

1. **Add new API route**: Create in `app/api/[feature]/route.ts`
2. **Add new admin page**: Create in `app/admin/[feature]/page.tsx`
3. **Add new public page**: Create in `app/(public)/[feature]/page.tsx`
4. **Update schema**: Modify `prisma/schema.prisma`

## 📈 Performance

- ✅ Server-side rendering (SSR)
- ✅ Static generation for public pages
- ✅ Image optimization with Next.js Image
- ✅ Connection pooling with Supabase
- ✅ Efficient database queries with Prisma
- ✅ Edge-ready with Vercel deployment

## 🐛 Troubleshooting

See [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting) for common issues and solutions.

## 📝 Future Enhancements

- [ ] Email verification
- [ ] Password reset flow
- [ ] Comment moderation UI
- [ ] Post versioning
- [ ] Advanced media editing
- [ ] Analytics dashboard
- [ ] Export/import functionality
- [ ] Multi-language support
- [ ] SEO meta tags
- [ ] RSS feed
- [ ] Search functionality
- [ ] Email notifications

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

For issues and questions:
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Review [Next.js docs](https://nextjs.org/docs)
- Consult [Prisma docs](https://www.prisma.io/docs)
- Visit [Supabase docs](https://supabase.com/docs)

---

**Built with ❤️ using Next.js, Prisma, Supabase, and Tailwind CSS.**

Deploy your own instance with one click: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fai-cms)
