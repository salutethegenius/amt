import type { DutyBreakdown, ImportableTariffRates, LevyType } from "./types";

export const BAHAMAS_VAT_RATE = 0.1;
export const PROCESSING_FEE_RATE = 0.01;
export const PROCESSING_FEE_MINIMUM_CENTS = 1000;

export function processingFeeCents(valueCents: number): number {
  if (valueCents <= 0) return 0;
  return Math.max(Math.round(valueCents * PROCESSING_FEE_RATE), PROCESSING_FEE_MINIMUM_CENTS);
}

export function dutyCents(valueCents: number, generalRate: number | null): number {
  if (valueCents <= 0 || generalRate == null || generalRate <= 0) return 0;
  return Math.round(valueCents * generalRate);
}

export function levyAmountCents(
  valueCents: number,
  quantity: number,
  levy: number | null,
  levyType: LevyType | null
): number {
  if (levy == null || levy <= 0) return 0;
  const qty = Math.max(1, quantity);
  if (levyType === "PERCENTAGE") {
    const rate = levy > 1 ? levy / 100 : levy;
    return Math.round(valueCents * rate);
  }
  return Math.round(levy * 100) * qty;
}

export function calculateDuty(input: {
  unitValueCents: number;
  quantity: number;
  freightCents?: number;
  includeVat?: boolean;
  tariff: ImportableTariffRates;
}): DutyBreakdown {
  const quantity = Math.max(1, input.quantity);
  const declaredValueCents = input.unitValueCents * quantity;
  const freightCents = Math.max(0, input.freightCents ?? 0);
  const duty = dutyCents(declaredValueCents, input.tariff.general_rate);
  const processing = processingFeeCents(declaredValueCents);
  const levy = levyAmountCents(
    declaredValueCents,
    quantity,
    input.tariff.environmental_levy,
    input.tariff.environmental_levy_type
  );
  const vatBase = declaredValueCents + duty + processing + levy + freightCents;
  const vat = input.includeVat === false ? 0 : Math.round(vatBase * BAHAMAS_VAT_RATE);
  const totalChargesCents = duty + processing + levy + freightCents + vat;

  return {
    declaredValueCents,
    quantity,
    freightCents,
    dutyCents: duty,
    processingFeeCents: processing,
    levyCents: levy,
    vatCents: vat,
    totalChargesCents,
  };
}

export function formatRate(rate: number | null): string {
  if (rate == null) return "n/a";
  if (rate === 0) return "duty free";
  return `${Math.round(rate * 1000) / 10}%`;
}

export function formatLevy(levy: number | null, type: LevyType | null): string | null {
  if (levy == null) return null;
  if (type === "PERCENTAGE") {
    const rate = levy > 1 ? levy : levy * 100;
    return `${rate}% env. levy`;
  }
  return `$${levy.toFixed(2)} env. levy`;
}
