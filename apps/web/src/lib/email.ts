type BookingData = {
  full_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  role_title?: string;
  industry?: string;
  team_size?: string;
  current_tools?: string;
  pain_points: string[];
  goals: string[];
  project_types: string[];
  features_needed: string[];
  budget_range?: string;
  timeline?: string;
  project_description?: string;
  additional_notes?: string;
};

function formatList(items: string[]): string {
  return items.length ? items.map((i) => `  • ${i}`).join("\n") : "  (none selected)";
}

function buildEmailBody(data: BookingData): string {
  return `
New Strategy Session Request
${"=".repeat(40)}

CONTACT
  Name:    ${data.full_name}
  Email:   ${data.email}
  Phone:   ${data.phone || "—"}
  Company: ${data.company_name || "—"}
  Role:    ${data.role_title || "—"}

BUSINESS PROFILE
  Industry:      ${data.industry || "—"}
  Team Size:     ${data.team_size || "—"}
  Current Tools: ${data.current_tools || "—"}

PAIN POINTS
${formatList(data.pain_points)}

GOALS
${formatList(data.goals)}

PROJECT TYPES
${formatList(data.project_types)}

FEATURES NEEDED
${formatList(data.features_needed)}

BUDGET & TIMELINE
  Budget:   ${data.budget_range || "—"}
  Timeline: ${data.timeline || "—"}

PROJECT DESCRIPTION
${data.project_description || "(not provided)"}

ADDITIONAL NOTES
${data.additional_notes || "(not provided)"}
`.trim();
}

/**
 * Sends a booking summary email. Swap the implementation below
 * for any provider (Resend, SendGrid, Nodemailer, etc.).
 *
 * Currently logs to console if no email provider is configured.
 */
export async function sendBookingEmail(data: BookingData): Promise<void> {
  const to = process.env.BOOKING_NOTIFICATION_EMAIL;
  const body = buildEmailBody(data);

  if (!to) {
    console.warn(
      "[email] BOOKING_NOTIFICATION_EMAIL not set — printing to console:\n\n" +
        body
    );
    return;
  }

  // ── Plug in your email provider here ──
  // Example with Resend:
  //
  // const { Resend } = await import("resend");
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "KemisDigital <noreply@kemisdigital.com>",
  //   to,
  //   subject: `Strategy Session: ${data.full_name} — ${data.company_name || "Individual"}`,
  //   text: body,
  // });

  console.log(
    `[email] Would send to ${to}:\nSubject: Strategy Session: ${data.full_name}\n\n${body}`
  );
}
