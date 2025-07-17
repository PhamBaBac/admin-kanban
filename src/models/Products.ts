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
  categories: string[];
  supplier: string;
  createdAt: string;
  updatedAt: string;
  price?: number[];
  __v: number;
  isDeleted: boolean;
  subItems: SubProductModel[];
}

export interface SubProductModel {
	size: string;
	color: string;
	price: number;
	qty: number;
  stock: number;
	cost: number;
	discount: number;
	productId: string;
	images: any[];
	id: string;
	createdAt: string;
	updatedAt: string;
	__v: number;
}