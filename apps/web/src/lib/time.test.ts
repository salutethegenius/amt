import assert from "node:assert/strict";
import { test } from "node:test";
import { BUSINESS_TIMEZONE, startOfDayInTimeZone } from "./time";

test("start of day in Nassau during EDT (UTC-4)", () => {
  const now = new Date("2026-08-29T16:00:00.000Z");
  assert.equal(
    startOfDayInTimeZone(now, BUSINESS_TIMEZONE).toISOString(),
    "2026-08-29T04:00:00.000Z"
  );
});

test("Nassau evening before UTC midnight is still the previous Nassau day", () => {
  const now = new Date("2026-08-29T03:00:00.000Z");
  assert.equal(
    startOfDayInTimeZone(now, BUSINESS_TIMEZONE).toISOString(),
    "2026-08-28T04:00:00.000Z"
  );
});

test("start of day in Nassau during EST (UTC-5)", () => {
  const now = new Date("2026-01-15T16:00:00.000Z");
  assert.equal(
    startOfDayInTimeZone(now, BUSINESS_TIMEZONE).toISOString(),
    "2026-01-15T05:00:00.000Z"
  );
});
