"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-900">
      <h1 className="text-4xl font-bold text-red-600">Something went wrong!</h1>
      <p className="mt-2 text-gray-600">
        An unexpected error has occurred. Our team has been notified.
      </p>
      <div className="mt-6 flex space-x-4">
        <button
          onClick={reset}
          className="rounded-md bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
        >
          Try Again
        </button>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 transition hover:bg-gray-50"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
