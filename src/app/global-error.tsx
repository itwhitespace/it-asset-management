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
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
          <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
          <pre className="text-xs bg-black/50 p-4 rounded-xl mb-4 max-w-full overflow-auto">
            {error.message}
          </pre>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-blue-600 rounded-lg font-bold"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
