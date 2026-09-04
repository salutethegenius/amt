import { Resend } from "resend";
import { formatCents } from "@/lib/types";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

function fromEmail() {
  const from = process.env.EMAIL_FROM;
  if (!from || /onboarding@resend\.dev/i.test(from)) {
    throw new Error("Set EMAIL_FROM to a verified sending domain before sending mail");
  }
  return from;
}

function adminEmail() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    throw new Error("ADMIN_EMAIL is not set");
  }
  return email;
}

function wrap(body: string): string {
  return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        ${body}
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 12px;">A.M.T Imports Courier Services</p>
      </div>
    `;
}

export async function sendInvoiceEmail({
  to,
  customerName,
  invoiceNumber,
  amount,
  currency,
  payUrl,
}: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  payUrl: string;
}) {
  const safeName = escapeHtml(customerName);
  const safeNumber = escapeHtml(invoiceNumber);
  const safeUrl = escapeHtml(payUrl);

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: `Invoice ${invoiceNumber} from A.M.T Imports`,
    html: wrap(`
        <h2 style="color: #18181b; margin-bottom: 8px;">Invoice ${safeNumber}</h2>
        <p style="color: #71717a; font-size: 14px;">Hi ${safeName},</p>
        <p style="color: #71717a; font-size: 14px;">
          You have a new invoice from A.M.T Imports for <strong style="color: #18181b;">${formatCents(amount, currency)}</strong>.
        </p>
        <div style="margin: 32px 0;">
          <a href="${safeUrl}" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            View &amp; Pay Invoice
          </a>
        </div>
        <p style="color: #a1a1aa; font-size: 12px;">
          If you have questions about this invoice, please contact us at info@amtimports.com.
        </p>
    `),
  });
}

export async function sendPaymentConfirmation({
  to,
  customerName,
  invoiceNumber,
  amount,
  currency,
}: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
}) {
  const safeName = escapeHtml(customerName);
  const safeNumber = escapeHtml(invoiceNumber);

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: `Payment Received - ${invoiceNumber}`,
    html: wrap(`
        <h2 style="color: #18181b; margin-bottom: 8px;">Payment Confirmed</h2>
        <p style="color: #71717a; font-size: 14px;">Hi ${safeName},</p>
        <p style="color: #71717a; font-size: 14px;">
          We've received your payment of <strong style="color: #18181b;">${formatCents(amount, currency)}</strong>
          for invoice <strong>${safeNumber}</strong>.
        </p>
        <p style="color: #71717a; font-size: 14px;">Thank you for your business!</p>
    `),
  });
}

export async function sendPaymentReceived({
  invoiceNumber,
  customerName,
  amount,
  currency,
}: {
  invoiceNumber: string;
  customerName: string;
  amount: number;
  currency: string;
}) {
  const safeName = escapeHtml(customerName);
  const safeNumber = escapeHtml(invoiceNumber);

  await getResend().emails.send({
    from: fromEmail(),
    to: adminEmail(),
    subject: `Payment Received: ${invoiceNumber}`,
    html: wrap(`
        <h2 style="color: #18181b; margin-bottom: 8px;">Payment Received</h2>
        <p style="color: #71717a; font-size: 14px;">
          <strong>${safeName}</strong> has paid <strong style="color: #18181b;">${formatCents(amount, currency)}</strong>
          for invoice <strong>${safeNumber}</strong>.
        </p>
    `),
  });
}

export async function sendOrderStatusUpdate({
  to,
  customerName,
  orderDescription,
  status,
}: {
  to: string;
  customerName: string;
  orderDescription: string;
  status: OrderStatus;
}) {
  const statusLabel = ORDER_STATUS_LABELS[status];
  const safeName = escapeHtml(customerName);
  const safeDescription = escapeHtml(orderDescription);

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: `Order Update: ${statusLabel}`,
    html: wrap(`
        <h2 style="color: #18181b; margin-bottom: 8px;">Order Status Update</h2>
        <p style="color: #71717a; font-size: 14px;">Hi ${safeName},</p>
        <p style="color: #71717a; font-size: 14px;">
          Your order <strong>&quot;${safeDescription}&quot;</strong> has been updated to:
        </p>
        <div style="margin: 24px 0; padding: 16px; background: #f4f4f5; border-radius: 8px; text-align: center;">
          <span style="font-size: 18px; font-weight: 700; color: #2563eb;">${escapeHtml(statusLabel)}</span>
        </div>
        <p style="color: #a1a1aa; font-size: 12px;">
          Log in to your portal for more details.
        </p>
    `),
  });
}

export async function sendPortalInvite({
  to,
  customerName,
  inviteUrl,
}: {
  to: string;
  customerName: string;
  inviteUrl: string;
}) {
  const safeName = escapeHtml(customerName);
  const safeUrl = escapeHtml(inviteUrl);

  await getResend().emails.send({
    from: fromEmail(),
    to,
    subject: "Your A.M.T Imports customer portal",
    html: wrap(`
        <h2 style="color: #18181b; margin-bottom: 8px;">Customer portal access</h2>
        <p style="color: #71717a; font-size: 14px;">Hi ${safeName},</p>
        <p style="color: #71717a; font-size: 14px;">
          An account has been created so you can view invoices, track orders, and pay online.
        </p>
        <div style="margin: 32px 0;">
          <a href="${safeUrl}" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Set up your login
          </a>
        </div>
    `),
  });
}
