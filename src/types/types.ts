import { NextFunction, Request, Response } from "express";

export interface NewUSerRequestBody {
  name: string;
  email: string;
  photo: string;
  gender: string;
  dob: string;
  _id: string;
}

export interface NewProductRequestBody {
  name: string;
  price: number;
  stock: number;
  category: string;
}

export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export interface SearchRequestQuery {
  search?: string;
  category?: string;
  price?: string;
  sort?: string;
  page?: string;
}

export interface BaseQuery {
  name?: {
    $regex: string;
    $options: string;
  };
  category?: string;
  price?: {
    $lte: number;
  };
}

export type InvalidateCacheProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  userId?: string;
  orderId?: string;
  productId?: string | string[];
};

export type OrderItemType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
};

export type ShippingInfoType = {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: number;
};

export interface NewOrderRequestBody {
  shippingInfo: ShippingInfoType;
  user: string;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  orderItems: OrderItemType[];
}

export type rateLimiterProps = {
  limit: number;
  timer: number;
  key: string;
};
