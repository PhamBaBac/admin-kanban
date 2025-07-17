import { Category } from "../services/categoryService";
import { CategoyModel } from "../models/Products";

export const mapCategoryToCategoyModel = (category: Category): CategoyModel => {
  return {
    id: category.id,
    title: category.title || category.name || "", // Ưu tiên title, fallback về name
    parentId: category.parentId || "",
    slug:
      category.slug ||
      (category.title || category.name)?.toLowerCase().replace(/\s+/g, "-") ||
      "",
    description: category.description || "",
    children: category.children?.map(mapCategoryToCategoyModel),
    createdAt: category.createdAt || "",
    updatedAt: category.updatedAt || "",
    __v: (category as any).__v || 0,
  };
};

export const mapCategoriesToCategoyModels = (
  categories: Category[]
): CategoyModel[] => {
  return categories.map(mapCategoryToCategoyModel);
};
