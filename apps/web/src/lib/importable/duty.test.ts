import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateDuty,
  dutyCents,
  levyAmountCents,
  processingFeeCents,
} from "./duty";
import type { ImportableTariffRates } from "./types";

const tvTariff: ImportableTariffRates = {
  code: "8528.7200",
  general_rate: 0.35,
  excise_rate: null,
  specific_rate: null,
  specific_rate_type: null,
  environmental_levy: 5,
  environmental_levy_type: "FIXED",
};

describe("processingFeeCents", () => {
  it("uses the $10 minimum when 1% is smaller", () => {
    assert.equal(processingFeeCents(50_000), 1000);
  });

  it("uses 1% when that is greater than $10", () => {
    assert.equal(processingFeeCents(200_000), 2000);
  });
});

describe("dutyCents", () => {
  it("applies the general rate to declared value", () => {
    assert.equal(dutyCents(50_000, 0.35), 17_500);
  });

  it("is zero for duty-free codes", () => {
    assert.equal(dutyCents(50_000, 0), 0);
  });
});

describe("levyAmountCents", () => {
  it("treats FIXED levy as dollars per unit", () => {
    assert.equal(levyAmountCents(50_000, 2, 5, "FIXED"), 1000);
  });
});

describe("calculateDuty", () => {
  it("matches the Importable TV example (value $500, qty 1, no freight)", () => {
    const result = calculateDuty({
      unitValueCents: 50_000,
      quantity: 1,
      tariff: tvTariff,
      includeVat: true,
    });
    assert.equal(result.dutyCents, 17_500);
    assert.equal(result.processingFeeCents, 1000);
    assert.equal(result.levyCents, 500);
    assert.equal(result.vatCents, 6900);
    assert.equal(result.totalChargesCents, 25_900);
  });
});
