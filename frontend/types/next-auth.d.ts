import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    role: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      sessionToken?: string
      accountStatus?: string
      isActive?: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    sessionToken?: string
    accountStatus?: string
    isActive?: boolean
    isValid?: boolean
  }
}
