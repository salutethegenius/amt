export function PortalAccountPending({ title }: { title: string }) {
  return (
    <div className="text-center py-16">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{title}</h1>
      <p className="text-zinc-500">
        Your account is being set up. Sign in with the same email as your invoice, or contact A.M.T Imports.
      </p>
    </div>
  );
}
