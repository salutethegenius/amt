import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <svg width="36" height="36" viewBox="0 0 72 72" fill="none">
            <path d="M36 4L68 36L36 68L4 36Z" stroke="#162B52" strokeWidth="2.2" fill="none" />
            <rect x="19" y="22" width="8" height="28" fill="#162B52" />
            <rect x="32" y="18" width="8" height="36" fill="#162B52" />
            <rect x="45" y="22" width="8" height="28" fill="#162B52" />
            <line x1="19" y1="50" x2="53" y2="50" stroke="#162B52" strokeWidth="2" />
          </svg>
          <span className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            AMT <span className="text-blue-600">Imports</span>
          </span>
        </Link>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export const authInputClass =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2.5 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export const authButtonClass =
  "w-full rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50";
