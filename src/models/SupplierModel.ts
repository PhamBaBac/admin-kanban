/** @format */

export interface SupplierModel {
  index: number;
  name: string;
  slug: string;
  product: string;
  categories: string[];
  price: number;
  contact: string;
  isTaking: number | boolean;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  active: number | string | boolean;
  id: string;
}
