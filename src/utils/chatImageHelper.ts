import { uploadFile } from "./uploadFile";

export const MAX_CHAT_IMAGES = 5;
export const MAX_CHAT_IMAGE_SIZE_MB = 10;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export interface FileValidationResult {
  validFiles: File[];
  errors: string[];
}

/**
 * Kiểm tra định dạng (JPG, PNG, WEBP, GIF), dung lượng (<=10MB) và số lượng (tối đa 5 ảnh)
 */
export const validateChatImages = (
  newFiles: File[],
  currentCount: number
): FileValidationResult => {
  const validFiles: File[] = [];
  const errors: string[] = [];

  for (const file of newFiles) {
    // 1. Kiểm tra định dạng file ảnh
    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      errors.push(
        `File "${file.name}" không đúng định dạng ảnh (chỉ chấp nhận JPG, PNG, WEBP, GIF).`
      );
      continue;
    }

    // 2. Kiểm tra dung lượng file (<= 10MB)
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_CHAT_IMAGE_SIZE_MB) {
      errors.push(
        `Ảnh "${file.name}" (${sizeMB.toFixed(1)}MB) vượt quá dung lượng tối đa ${MAX_CHAT_IMAGE_SIZE_MB}MB.`
      );
      continue;
    }

    // 3. Kiểm tra số lượng tối đa 5 ảnh
    if (currentCount + validFiles.length >= MAX_CHAT_IMAGES) {
      errors.push(
        `Chỉ được gửi tối đa ${MAX_CHAT_IMAGES} ảnh cùng lúc. Đã bỏ qua các ảnh vượt mức.`
      );
      break;
    }

    validFiles.push(file);
  }

  return { validFiles, errors };
};

/**
 * Tải 1 ảnh lên Cloudinary khi người dùng bấm GỬI (Lazy upload)
 */
export const uploadChatImageToCloudinary = async (file: File): Promise<string> => {
  return await uploadFile(file);
};
