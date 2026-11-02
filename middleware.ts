import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtected = createRouteMatcher(["/(auth)(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isProtected(req)) {
    // Clerk v6 types incorrectly declare auth() as async here; it's sync in middleware
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth as any)().protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
