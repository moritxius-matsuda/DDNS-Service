import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to DDNS Service</h1>
      <SignedIn>
        <p className="mb-4">You are signed in. Please go to the dashboard to manage your DDNS records.</p>
        <a href="/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90">
          Go to Dashboard
        </a>
      </SignedIn>
      <SignedOut>
        <p className="mb-4">Please sign in to manage your DDNS records.</p>
        <SignInButton mode="modal" />
      </SignedOut>
    </main>
  );
}
