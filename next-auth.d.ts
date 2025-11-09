import { Role } from '@prisma/client'
import 'next-auth'
import 'next-auth/next'

declare module 'next-auth' {
  interface User {
    id: string
    role: Role
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: Role
      image?: string | null
    }
  }
}

declare module 'next-auth/next' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: Role
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}
