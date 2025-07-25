// middleware.ts
import { clerkMiddleware, createRouteMatcher, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/bets(.*)',
  '/payments(.*)',
  '/api(.*)'
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)'
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (!userId && isProtectedRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (userId && isAdminRoute(req)) {
    try {
      // Use Clerk's clerkClient to get user data (edge-compatible)
      const { clerkClient } = await import('@clerk/nextjs/server');
      const user = await (await clerkClient()).users.getUser(userId);
      
      const isAdmin = user.publicMetadata?.role === 'admin' || 
                     user.privateMetadata?.role === 'admin' ||
                     user.unsafeMetadata?.role === 'admin';
      
      console.log('Admin check from Clerk user metadata:', isAdmin, 'for user:', userId);
      
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/not-authorized", req.url));
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      return NextResponse.redirect(new URL("/not-authorized", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Include root path - CRITICAL for Clerk middleware detection
    '/'
  ],
};
// // middleware.ts

// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// // **HARDCODED ADMIN LIST - Temporary Solution**
// const ADMIN_USER_IDS = [
//   'user_3026WL0oVnjICjYuPDNZHsIPm1r',
//   // Add more admin user IDs here as needed
//   // 'user_XXXXXX',
//   // 'user_YYYYYY',
// ];

// // Create route matchers
// const isProtectedRoute = createRouteMatcher([
//   '/dashboard(.*)',
//   '/bets(.*)',
//   '/payments(.*)',
//   '/api(.*)'
// ]);

// const isAdminRoute = createRouteMatcher([
//   '/admin(.*)',
//   '/api/admin(.*)'
// ]);

// const isPublicRoute = createRouteMatcher([
//   '/',
//   '/sign-in(.*)',
//   '/sign-up(.*)'
// ]);

// export default clerkMiddleware(async (auth, req) => {
//   const { userId } = await auth();
//   const { pathname } = req.nextUrl;

//   // Allow public access to public routes
//   if (isPublicRoute(req)) {
//     return NextResponse.next();
//   }

//   // If unauthenticated and accessing protected routes
//   if (!userId && isProtectedRoute(req)) {
//     const signInUrl = new URL("/sign-in", req.url);
//     signInUrl.searchParams.set("redirect_url", req.url);
//     return NextResponse.redirect(signInUrl);
//   }

//   // **SIMPLIFIED ADMIN CHECK - Using hardcoded array**
//   if (userId && isAdminRoute(req)) {
//     const isAdmin = ADMIN_USER_IDS.includes(userId);
//     console.log('Hardcoded admin check result:', isAdmin, 'for user:', userId);
    
//     if (!isAdmin) {
//       return NextResponse.redirect(new URL("/not-authorized", req.url));
//     }
//   }

//   return NextResponse.next();
// });

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//     // Include root path - CRITICAL for Clerk middleware detection
//     '/'
//   ],
// };
