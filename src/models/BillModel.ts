/** @format */

export interface BillModel {
  id: string;
  userName: string;
  nameRecipient: string | null;
  address: string | null;
  phoneNumber: string | null;
  email: string;
  paymentType: string;
  orderStatus: string;
  orderResponses: OrderItem[];
  cancelReason?: string;
  trackingCode?: string;
  shippingStatus?: string;
  createdAt: string;
}

export interface OrderItem {
  orderItemId?: string;
  image: string;
  title: string;
  size?: string;
  color?: string;
  attributes?: Record<string, any>;
  qty: number;
  price: number;
  totalPrice: number;
  status?: string | null;
}

export interface ShipmentItemModel {
  id: string;
  orderItemId: string;
  productTitle: string;
  variantName: string;
  quantity: number;
  price: number;
}

export interface ShipmentModel {
  id: string;
  orderId: string;
  shipmentCode: string;
  carrier: string;
  trackingCode?: string;
  shippingStatus?: string;
  shippingStatusName?: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  codAmount: number;
  shippingFee: number;
  note?: string;
  requiredNote?: string;
  pickedDate?: string;
  deliveredDate?: string;
  createdAt: string;
  items: ShipmentItemModel[];
}

// Legacy interface for backward compatibility
export interface BillItem {
  image: string;
  title: string;
  size: string;
  qty: number;
  price: number;
  totalPrice: number;
  status: string | null;
}

export enum BillStatus {
  //   PENDING, // Bill is created but not yet paid
  //   PAID, // Bill has been paid
  //   COMPLETED, // Bill has been completed
  //   CANCELLED, // Bill has been cancelled
  //   REFUNDED, // Bill has been refunded
  PENDING = 0,
  PAID = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  REFUNDED = 4,
}

export const BillStatusColor = {
  [BillStatus.PENDING]: "warning",
  [BillStatus.PAID]: "success",
  [BillStatus.COMPLETED]: "success",
  [BillStatus.CANCELLED]: "error",
  [BillStatus.REFUNDED]: "error",
};

export const PaymentStatusColor = {
  UNPAID: "error",
  PAID: "success",
  PENDING: "warning",
  CANCELLED: "default",
};

export const PaymentTypeColor = {
  COD: "orange",
  VNPAY: "blue",
  MOMO: "pink",
  ZALOPAY: "orange",
};

export const OrderStatusColor = {
  PENDING: "processing",
  CONFIRMED: "warning",
  SHIPPING: "processing",
  DELIVERED: "success",
  CANCELLED: "error",
};
export interface Product {
  id: string;
  createdBy: string;
  count: number;
  cost: number;
  subProductId: string;
  image: string;
  size: string;
  color: string;
  price: number;
  qty: number;
  productId: string;
  title: string;
  __v: number;
}

export interface ShippingAddress {
  address: string;
  id: string;
}
