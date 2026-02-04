import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-900">
      <h1 className="text-6xl font-bold text-blue-600">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-gray-600">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-md bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
      >
        Go Back Home
      </Link>
    </div>
  );
}
