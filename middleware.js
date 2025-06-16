import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/api/ddns/update", "/api/ddns/resolve"],
  ignoredRoutes: ["/api/ddns/update", "/api/ddns/resolve"]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};