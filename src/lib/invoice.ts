import { Order, SiteSettings } from "@/types";
import { exportPDF, exportExcel } from "./export";

const inrFmt = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(typeof n === "number" && Number.isFinite(n) ? n : 0);

const fmtDate = (ts: number | null | undefined) =>
  typeof ts === "number" && ts > 0
    ? new Date(ts).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function invoiceHTML(order: Order, settings?: SiteSettings | null): string {
  const biz = settings?.business;
  const brand = biz?.legalName || settings?.websiteName || "DOOZY CLOTHING";
  const prefix = biz?.invoicePrefix || "DZ-INV";
  const invoiceNo = `${prefix}-${order?.id || "ORDER"}`;
  const note = biz?.invoiceFooterNote || "Thank you for shopping with DOOZY.";
  const contact = settings?.contact;

  const addr = order?.address || ({} as any);
  const items = Array.isArray(order?.items) ? order.items : [];
  const totals = {
    subtotal: typeof order?.subtotal === "number" ? order.subtotal : 0,
    shipping: typeof order?.shipping === "number" ? order.shipping : 0,
    discount: typeof order?.discount === "number" ? order.discount : 0,
    total: typeof order?.total === "number" ? order.total : 0,
  };

  const paymentLine =
    order?.paymentMethod === "Razorpay"
      ? `Razorpay · ${order?.payment?.razorpayPaymentId || "—"}`
      : order?.paymentMethod === "UPI"
      ? `UPI (${order?.payment?.upiApp || "—"}) · ${order?.payment?.upiTransactionId || "—"}`
      : `Cash on Delivery · ${order?.payment?.status === "Collected" ? "Collected" : "Pending"}`;

  return `
  <div class="brand">
    <div>
      <div class="logo">${brand}</div>
      <div class="muted" style="font-size:11px;margin-top:4px;">
        ${contact?.address || ""}${contact?.address ? " · " : ""}${contact?.email || ""}${contact?.phone ? " · " + contact.phone : ""}
        ${biz?.gstin ? `<br/>GSTIN: ${biz.gstin}` : ""}
      </div>
    </div>
    <div style="text-align:right;">
      <div class="eyebrow">Tax Invoice</div>
      <div style="font-size:18px;font-weight:700;letter-spacing:.05em;margin-top:4px;">${invoiceNo}</div>
      <div class="muted" style="font-size:11px;margin-top:4px;">Order ${order?.id || "—"} · ${fmtDate(order?.createdAt)}</div>
    </div>
  </div>

  <div class="grid">
    <div class="box">
      <div class="eyebrow">Billed To</div>
      <div style="font-weight:600;margin-top:6px;">${addr.name || (order?.isGuest ? "Guest" : "—")}</div>
      <div style="font-size:13px;color:#374151;margin-top:4px;">
        ${addr.line1 || ""}${addr.line1 ? "<br/>" : ""}
        ${[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}<br/>
        ${addr.phone || ""}${addr.email ? "<br/>" + addr.email : ""}
      </div>
    </div>
    <div class="box">
      <div class="eyebrow">Order Details</div>
      <div style="font-size:13px;margin-top:6px;">
        <div><strong>Status:</strong> ${order?.status || "—"}</div>
        <div style="margin-top:4px;"><strong>Payment:</strong> ${paymentLine}</div>
        ${order?.couponCode ? `<div style="margin-top:4px;"><strong>Coupon:</strong> ${order.couponCode}</div>` : ""}
        ${order?.isGuest ? `<div style="margin-top:4px;"><span class="pill">Guest Checkout</span></div>` : ""}
      </div>
    </div>
  </div>

  <h2>Items</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>Size</th>
        <th>Color</th>
        <th class="right">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map((it: any, i: number) => {
          const price = typeof it?.price === "number" ? it.price : 0;
          const qty = typeof it?.quantity === "number" ? it.quantity : 0;
          return `
        <tr>
          <td>${i + 1}</td>
          <td>${it?.name || "Item"}</td>
          <td>${it?.size || "—"}</td>
          <td>${it?.color || "—"}</td>
          <td class="right">${qty}</td>
          <td class="right">${inrFmt(price)}</td>
          <td class="right">${inrFmt(price * qty)}</td>
        </tr>`;
        })
        .join("")}
    </tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-top:18px;">
    <table class="totals" style="width:320px;">
      <tr><td>Subtotal</td><td class="right">${inrFmt(totals.subtotal)}</td></tr>
      <tr><td>Shipping</td><td class="right">${totals.shipping === 0 ? "Free" : inrFmt(totals.shipping)}</td></tr>
      ${totals.discount > 0 ? `<tr><td>Discount</td><td class="right">− ${inrFmt(totals.discount)}</td></tr>` : ""}
      <tr class="total"><td>Total</td><td class="right">${inrFmt(totals.total)}</td></tr>
    </table>
  </div>

  <div style="display:flex;justify-content:space-between;margin-top:60px;align-items:flex-end;">
    <div class="muted" style="font-size:11px;max-width:400px;">
      ${note}
    </div>
    <div style="text-align:center;">
      <div style="border-top:1px solid #111;width:200px;padding-top:6px;font-size:11px;">
        Authorized Signature
      </div>
    </div>
  </div>`;
}

export function printInvoice(order: Order, settings?: SiteSettings | null) {
  exportPDF(
    `Invoice ${order.id}`,
    invoiceHTML(order, settings)
  );
}

export function invoiceToExcel(order: Order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const subtotal = typeof order?.subtotal === "number" ? order.subtotal : 0;
  const shipping = typeof order?.shipping === "number" ? order.shipping : 0;
  const discount = typeof order?.discount === "number" ? order.discount : 0;
  const total = typeof order?.total === "number" ? order.total : 0;

  const rows = items.map((it: any, i: number) => {
    const price = typeof it?.price === "number" ? it.price : 0;
    const qty = typeof it?.quantity === "number" ? it.quantity : 0;
    return {
      "S.No": i + 1,
      Product: it?.name || "Item",
      Size: it?.size || "—",
      Color: it?.color || "—",
      Quantity: qty,
      "Unit Price": price,
      Amount: price * qty,
    };
  });
  rows.push(
    { "S.No": "", Product: "", Size: "", Color: "", Quantity: "", "Unit Price": "Subtotal", Amount: subtotal } as any,
    { "S.No": "", Product: "", Size: "", Color: "", Quantity: "", "Unit Price": "Shipping", Amount: shipping } as any,
    { "S.No": "", Product: "", Size: "", Color: "", Quantity: "", "Unit Price": "Discount", Amount: -discount } as any,
    { "S.No": "", Product: "", Size: "", Color: "", Quantity: "", "Unit Price": "Total", Amount: total } as any
  );
  exportExcel(`invoice-${order?.id || "order"}`, rows as any);
}
