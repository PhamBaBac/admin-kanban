/** @format */

import { useMemo } from "react";

export interface PriceMarginResult {
  discountAmount: number;
  discountPercent: number;
  effectivePrice: number;
  profitPerUnit: number;
  marginPercent: number;
  isLoss: boolean;
  isThinMargin: boolean;
  isGoodMargin: boolean;
}

export const usePriceMarginCalc = (
  price: number = 0,
  cost: number = 0,
  discountType: string = "NONE",
  discountValue: number = 0
): PriceMarginResult => {
  return useMemo(() => {
    let discountAmount = 0;
    let discountPercent = 0;

    const basePrice = Math.max(0, price || 0);
    const baseCost = Math.max(0, cost || 0);

    if (discountType === "PERCENT") {
      discountPercent = Math.min(100, Math.max(0, discountValue || 0));
      discountAmount = Math.round((basePrice * discountPercent) / 100);
    } else if (discountType === "DISCOUNT") {
      discountAmount = Math.min(basePrice, Math.max(0, discountValue || 0));
      discountPercent = basePrice > 0 ? (discountAmount / basePrice) * 100 : 0;
    }

    const effectivePrice = Math.max(0, basePrice - discountAmount);
    const profitPerUnit = effectivePrice - baseCost;
    const marginPercent = effectivePrice > 0 ? (profitPerUnit / effectivePrice) * 100 : 0;

    const isLoss = baseCost > 0 && profitPerUnit < 0;
    const isThinMargin = baseCost > 0 && profitPerUnit >= 0 && marginPercent < 15;
    const isGoodMargin = baseCost > 0 && marginPercent >= 15;

    return {
      discountAmount,
      discountPercent,
      effectivePrice,
      profitPerUnit,
      marginPercent,
      isLoss,
      isThinMargin,
      isGoodMargin,
    };
  }, [price, cost, discountType, discountValue]);
};
