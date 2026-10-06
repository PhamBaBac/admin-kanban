/** @format */

export interface ParsedAttribute {
  name: string;
  value: string;
}

const SYSTEM_KEYS = new Set([
  "color",
  "màu sắc",
  "mau sac",
  "màu",
  "mau",
  "discounttype",
  "discountvalue",
  "discountamount",
  "price",
  "cost",
  "stock",
  "qty",
]);

/**
 * Parse and normalize custom attributes from rawAttrs (JSON string or object/array).
 * Filter out system keys (color, price, discountType, etc.)
 */
export const parseVariantAttributes = (rawAttrs: any): ParsedAttribute[] => {
  if (typeof rawAttrs === "string") {
    try {
      rawAttrs = JSON.parse(rawAttrs);
    } catch {
      rawAttrs = {};
    }
  }
  if (!rawAttrs || typeof rawAttrs !== "object") {
    return [];
  }

  if (Array.isArray(rawAttrs)) {
    return rawAttrs
      .map((item: any) => ({
        name: String(item.name || item.key || "").trim(),
        value: String(item.value ?? "").trim(),
      }))
      .filter((item) => item.name);
  }

  return Object.entries(rawAttrs)
    .filter(([k]) => !SYSTEM_KEYS.has(k.trim().toLowerCase()))
    .map(([name, value]) => ({
      name: name.trim(),
      value: String(value ?? "").trim(),
    }));
};

/**
 * Extract existing color from item fields or attributes
 */
export const extractVariantColor = (item: any, rawAttrs?: any): string => {
  return (
    item?.color ||
    rawAttrs?.["Màu sắc"] ||
    rawAttrs?.["Color"] ||
    rawAttrs?.["màu sắc"] ||
    rawAttrs?.["color"] ||
    rawAttrs?.["Mau sac"] ||
    rawAttrs?.["mau sac"] ||
    rawAttrs?.["Màu"] ||
    rawAttrs?.["màu"] ||
    ""
  );
};

/**
 * Extract discount configuration from rawAttrs or price/discount values
 */
export const extractDiscountInfo = (
  price: number,
  discount?: number,
  rawAttrs?: any
): { discountType: string; discountValue: number } => {
  if (rawAttrs?.discountType) {
    return {
      discountType: rawAttrs.discountType,
      discountValue: Number(rawAttrs.discountValue) || 0,
    };
  }

  if (discount && discount < price && discount > 0) {
    const diff = price - discount;
    const pct = Math.round((diff / price) * 100);
    if (pct > 0 && Math.abs((price * pct) / 100 - diff) < 1) {
      return { discountType: "PERCENT", discountValue: pct };
    }
    return { discountType: "DISCOUNT", discountValue: diff };
  }

  return { discountType: "NONE", discountValue: 0 };
};

/**
 * Parse raw images field into Antd Upload file items
 */
export const parseRawImages = (rawImages: any, singleImageFallback?: string) => {
  if (typeof rawImages === "string") {
    try {
      rawImages = JSON.parse(rawImages);
    } catch {
      if (rawImages.startsWith("http")) {
        rawImages = [rawImages];
      } else {
        rawImages = [];
      }
    }
  }

  if (Array.isArray(rawImages) && rawImages.length > 0) {
    return rawImages
      .map((item: any, index: number) => ({
        uid: `sub-img-${index}-${Date.now()}`,
        name: `image-${index + 1}.png`,
        url: typeof item === "string" ? item : item?.url || "",
        status: "done",
      }))
      .filter((item: any) => item.url);
  }

  if (singleImageFallback && typeof singleImageFallback === "string") {
    return [
      {
        uid: `sub-img-0-${Date.now()}`,
        name: "image-1.png",
        url: singleImageFallback,
        status: "done",
      },
    ];
  }

  return [];
};
