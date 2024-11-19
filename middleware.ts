// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  // Manufacturer routes
  '/manufacturer(.*)',
  
  // Supplier routes
  '/supplier(.*)',
  
  // API routes - Fixed pattern without negative lookahead
  '/api/((?!public|webhooks).*)',
  
  // Dashboard routes
  '/dashboard(.*)',
  
  // Product management routes
  '/products(.*)',
  
  // Supply chain routes
  '/supply-chain(.*)',
  
  // Profile and settings
  '/profile(.*)',
  '/settings(.*)',
  
  // Transaction routes
  '/transactions(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.[^/]+$).*)',
    '/api/:path*'
  ]
}