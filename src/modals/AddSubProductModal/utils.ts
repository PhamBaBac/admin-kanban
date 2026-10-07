/** @format */

export interface ParsedAttribute {
  name: string;
  value: string;
}

const SYSTEM_KEYS = new Set([
  "discounttype",
  "discountvalue",
  "discountamount",
  "discount",
  "price",
  "cost",
  "stock",
  "qty",
]);

/**
 * Parse and normalize custom attributes from rawAttrs (JSON string or object/array).
 * Filter out system financial keys (price, discountType, etc.) while preserving all product attributes.
 */
export const parseVariantAttributes = (
  rawAttrs: any,
  fallbackColor?: string,
  fallbackSize?: string
): ParsedAttribute[] => {
  if (typeof rawAttrs === "string") {
    try {
      rawAttrs = JSON.parse(rawAttrs);
    } catch {
      rawAttrs = {};
    }
  }

  let list: ParsedAttribute[] = [];

  if (Array.isArray(rawAttrs)) {
    list = rawAttrs
      .map((item: any) => ({
        name: String(item.name || item.key || "").trim(),
        value: String(item.value ?? "").trim(),
      }))
      .filter((item) => item.name);
  } else if (rawAttrs && typeof rawAttrs === "object") {
    list = Object.entries(rawAttrs)
      .filter(([k]) => !SYSTEM_KEYS.has(k.trim().toLowerCase()))
      .map(([name, value]) => ({
        name: name.trim(),
        value: String(value ?? "").trim(),
      }))
      .filter((item) => item.name);
  }

  // Ensure fallback color is included if not already present
  const hasColorAttr = list.some((item) => {
    const lower = item.name.toLowerCase();
    return (
      lower === "màu sắc" ||
      lower === "mau sac" ||
      lower === "màu" ||
      lower === "mau" ||
      lower === "color"
    );
  });
  if (!hasColorAttr && fallbackColor && String(fallbackColor).trim()) {
    list.unshift({
      name: "Màu sắc",
      value: String(fallbackColor).trim(),
    });
  }

  // Ensure fallback size is included if not already present
  const hasSizeAttr = list.some((item) => {
    const lower = item.name.toLowerCase();
    return (
      lower === "size" ||
      lower === "kích thước" ||
      lower === "kich thuoc" ||
      lower === "kích cỡ" ||
      lower === "kich co"
    );
  });
  if (!hasSizeAttr && fallbackSize && String(fallbackSize).trim()) {
    list.push({
      name: "Size",
      value: String(fallbackSize).trim(),
    });
  }

  return list;
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

/**
 * Sinh mã SKU mới khi sao chép / nhân bản biến thể:
 * Thay đổi 4 số cuối của mã SKU gốc thay vì thêm hậu tố "-COPY".
 */
export const generateClonedSku = (originalSku?: string): string => {
  if (!originalSku || !originalSku.trim()) return "";

  const cleanSku = originalSku.trim().replace(/[-_]?(COPY|copy)$/i, "");

  const random4Digits = Math.floor(1000 + Math.random() * 9000).toString();

  if (/\d{4}$/.test(cleanSku)) {
    return cleanSku.replace(/\d{4}$/, random4Digits);
  }

  if (/[-_][a-zA-Z0-9]{4}$/.test(cleanSku)) {
    return cleanSku.replace(/([-_])[a-zA-Z0-9]{4}$/, `$1${random4Digits}`);
  }

  if (/[-_]\d+$/.test(cleanSku)) {
    return cleanSku.replace(/([-_])\d+$/, `$1${random4Digits}`);
  }

  return `${cleanSku}-${random4Digits}`;
};
