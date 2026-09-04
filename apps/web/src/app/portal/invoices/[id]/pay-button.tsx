"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function PayButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "popup" | "done">("idle");
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "cng-payment-success") {
        popupRef.current?.close();
        setStatus("done");
        setLoading(false);
        router.refresh();
      }
      if (event.data?.type === "cng-payment-cancel") {
        popupRef.current?.close();
        setStatus("idle");
        setLoading(false);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  async function handlePay() {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/cng/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      const redirectPath: string | undefined = data.redirectPath;
      if (!redirectPath) {
        alert(data.error || "Failed to create checkout session");
        setLoading(false);
        return;
      }

      const popup = window.open(
        redirectPath,
        "cng_checkout",
        "width=500,height=700,scrollbars=yes,resizable=yes"
      );
      if (popup) {
        popupRef.current = popup;
        setStatus("popup");
        setLoading(false);
      } else {
        window.location.href = redirectPath;
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handlePay}
        disabled={loading || status === "popup"}
        className="w-full sm:w-auto rounded-lg bg-blue-600 text-white px-8 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading
          ? "Opening Cash N' Go..."
          : status === "popup"
            ? "Complete payment in the popup..."
            : status === "done"
              ? "Submitted — confirmation may take a moment"
              : "Pay Now"}
      </button>
      {status === "popup" && (
        <p className="text-sm text-zinc-500">
          Finish the card and signature in the Cash N&apos; Go window. Allow popups if it did not open.
        </p>
      )}
      {status === "done" && (
        <p className="text-sm text-zinc-500">
          You can close the window — confirmation may take a moment.
        </p>
      )}
    </div>
  );
}
