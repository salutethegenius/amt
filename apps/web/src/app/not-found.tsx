import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Page not found</h1>
        <p className="text-sm text-zinc-500 mb-6">
          The page you requested does not exist or you do not have access to it.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
