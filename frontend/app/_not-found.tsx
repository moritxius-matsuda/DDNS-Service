import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Not Found",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-4">The page you're looking for doesn't exist.</p>
      <a
        href="/"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
      >
        Go to Home
      </a>
    </div>
  );
}
