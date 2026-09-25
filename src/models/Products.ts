/** @format */

export interface CategoyModel {
  id: string;
  title: string;
  parentId: string;
  slug: string;
  description: string;
  children?: CategoyModel[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ProductModel {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  categories?: CategoyModel[] | string[] | any[];
  supplier?: string;
  supplierId?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  price?: number[];
  __v?: number;
  isDeleted?: boolean;
  subItems?: SubProductModel[];
  subProducts?: SubProductModel[];
}

export interface SubProductModel {
  id: string;
  sku?: string;
  size?: string;
  color?: string;
  attributes?: Record<string, string>;
  price: number;
  qty?: number;
  stock: number;
  cost?: number;
  discount?: number;
  productId?: string;
  images: any[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}