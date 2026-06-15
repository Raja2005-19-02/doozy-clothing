// UI helpers — safe accessors for partial / malformed Order documents.

import { Order } from "@/types";

const safeStr = (v: any): string => (typeof v === "string" ? v : "");
const safeNum = (v: any): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

export const orderId = (o?: Partial<Order>) => safeStr(o?.id) || "—";
export const orderCustomer = (o?: Partial<Order>) =>
  safeStr(o?.address?.name) || (o?.isGuest ? "Guest" : "—");
export const orderPhone = (o?: Partial<Order>) => safeStr(o?.address?.phone);
export const orderEmail = (o?: Partial<Order>) => safeStr(o?.address?.email);
export const orderCity = (o?: Partial<Order>) => safeStr(o?.address?.city);
export const orderState = (o?: Partial<Order>) => safeStr(o?.address?.state);
export const orderPostal = (o?: Partial<Order>) => safeStr(o?.address?.postalCode);
export const orderLine1 = (o?: Partial<Order>) => safeStr(o?.address?.line1);

export const orderAddressLine = (o?: Partial<Order>): string => {
  const parts = [
    orderLine1(o),
    orderCity(o),
    orderState(o),
    orderPostal(o),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
};

export const orderItems = (o?: Partial<Order>) =>
  Array.isArray(o?.items) ? o!.items! : [];

export const orderItemCount = (o?: Partial<Order>): number =>
  orderItems(o).reduce((a, i: any) => a + safeNum(i?.quantity), 0);

export const orderTotal = (o?: Partial<Order>): number => {
  const t = safeNum((o as any)?.total);
  if (t > 0) return t;
  return orderItems(o).reduce(
    (a, i: any) => a + safeNum(i?.price) * safeNum(i?.quantity),
    0
  );
};
export const orderSubtotal = (o?: Partial<Order>) => safeNum((o as any)?.subtotal);
export const orderShipping = (o?: Partial<Order>) => safeNum((o as any)?.shipping);
export const orderDiscount = (o?: Partial<Order>) => safeNum((o as any)?.discount);

export const orderPaymentMethod = (o?: Partial<Order>): string =>
  safeStr(o?.paymentMethod) || safeStr(o?.payment?.method) || "—";
export const orderPaymentStatus = (o?: Partial<Order>): string =>
  safeStr(o?.payment?.status) || "—";
export const orderPaymentAmount = (o?: Partial<Order>): number =>
  safeNum(o?.payment?.amount) || orderTotal(o);
export const orderPaymentPaidAt = (o?: Partial<Order>): number =>
  safeNum(o?.payment?.paidAt);
export const orderTxnId = (o?: Partial<Order>): string => {
  const pm = orderPaymentMethod(o);
  if (pm === "Razorpay") return safeStr(o?.payment?.razorpayPaymentId);
  if (pm === "UPI") return safeStr(o?.payment?.upiTransactionId);
  if (pm === "COD") return "COD";
  return "";
};

export const orderStatus = (o?: Partial<Order>): string =>
  safeStr(o?.status) || "Pending";

export const orderCreatedAt = (o?: Partial<Order>): number =>
  safeNum((o as any)?.createdAt);
