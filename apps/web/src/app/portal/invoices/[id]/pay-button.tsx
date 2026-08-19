"use client";

import { useState } from "react";

export function PayButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/cng/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (data.url) {
        console.info("CNG checkout", data.debug);
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full sm:w-auto rounded-lg bg-blue-600 text-white px-8 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      {loading ? "Redirecting to Cash N' Go..." : "Pay Now"}
    </button>
  );
}
