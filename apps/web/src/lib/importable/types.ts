export type LevyType = "PERCENTAGE" | "FIXED";

export interface ImportableTariffRates {
  code: string;
  general_rate: number | null;
  excise_rate: number | null;
  specific_rate: number | null;
  specific_rate_type: string | null;
  environmental_levy: number | null;
  environmental_levy_type: LevyType | null;
}

export interface ImportableSearchHit {
  id: string;
  description: string;
  attributes: string | null;
}

export interface ImportableItem extends ImportableSearchHit {
  tariff: ImportableTariffRates;
}

export interface DutyBreakdown {
  declaredValueCents: number;
  quantity: number;
  freightCents: number;
  dutyCents: number;
  processingFeeCents: number;
  levyCents: number;
  vatCents: number;
  totalChargesCents: number;
}
