"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Please try again. If this keeps happening, contact A.M.T Imports.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
