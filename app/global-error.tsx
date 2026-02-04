"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-900">
          <h1 className="text-4xl font-bold text-red-600">Critical Error</h1>
          <p className="mt-2 text-gray-600">
            A critical system error occurred. Please try refreshing.
          </p>
          <button
            onClick={() => reset()}
            className="mt-6 rounded-md bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </body>
    </html>
  );
}
