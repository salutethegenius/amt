"use server";

import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { sendBookingEmail } from "@/lib/email";

const BookingSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  role_title: z.string().optional(),

  industry: z.string().optional(),
  team_size: z.string().optional(),
  current_tools: z.string().optional(),

  pain_points: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  project_types: z.array(z.string()).default([]),
  features_needed: z.array(z.string()).default([]),

  budget_range: z.string().optional(),
  timeline: z.string().optional(),

  project_description: z.string().optional(),
  additional_notes: z.string().optional(),

  source_url: z.string().optional(),
  user_agent: z.string().optional(),
});

export type BookingState = {
  ok: boolean;
  message: string;
} | null;

export async function bookStrategySession(
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  const raw: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (
      ["pain_points", "goals", "project_types", "features_needed"].includes(key)
    ) {
      if (!raw[key]) raw[key] = [];
      (raw[key] as string[]).push(value as string);
    } else {
      raw[key] = value as string;
    }
  }

  const result = BookingSchema.safeParse(raw);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return { ok: false, message: firstError?.message ?? "Invalid form data" };
  }

  const data = result.data;

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("strategy_sessions").insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      company_name: data.company_name || null,
      role_title: data.role_title || null,
      industry: data.industry || null,
      team_size: data.team_size || null,
      current_tools: data.current_tools || null,
      pain_points: data.pain_points,
      goals: data.goals,
      project_types: data.project_types,
      features_needed: data.features_needed,
      budget_range: data.budget_range || null,
      timeline: data.timeline || null,
      project_description: data.project_description || null,
      additional_notes: data.additional_notes || null,
      source_url: data.source_url || null,
      user_agent: data.user_agent || null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return { ok: false, message: "Something went wrong. Please try again." };
    }

    await sendBookingEmail(data).catch((err) =>
      console.error("Email send error (non-blocking):", err)
    );

    return {
      ok: true,
      message:
        "Thank you! Your strategy session request has been received. We'll be in touch within 24 hours.",
    };
  } catch (err) {
    console.error("bookStrategySession error:", err);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
