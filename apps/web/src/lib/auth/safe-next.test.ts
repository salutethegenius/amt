import assert from "node:assert/strict";
import { test } from "node:test";
import { postLoginPath, safeNextPath } from "./safe-next";

test("safeNextPath rejects open redirects", () => {
  assert.equal(safeNextPath("/portal/invoices/abc"), "/portal/invoices/abc");
  assert.equal(safeNextPath("//evil.com"), null);
  assert.equal(safeNextPath("https://evil.com"), null);
  assert.equal(safeNextPath("portal"), null);
});

test("postLoginPath sends admins to the dashboard invoice", () => {
  assert.equal(
    postLoginPath("admin", "/portal/invoices/3fc2102e-33e9-41c8-b313-32619d2da0f2"),
    "/dashboard/invoices/3fc2102e-33e9-41c8-b313-32619d2da0f2"
  );
  assert.equal(
    postLoginPath("customer", "/portal/invoices/3fc2102e-33e9-41c8-b313-32619d2da0f2"),
    "/portal/invoices/3fc2102e-33e9-41c8-b313-32619d2da0f2"
  );
  assert.equal(postLoginPath("admin", "/login"), "/dashboard");
});
