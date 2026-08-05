import { config } from "../config/index.js";
import { sendEmail } from "../integrations/smtpClient.js";
import {
  findOrderNotificationByPublicId,
  listOrderItems,
} from "../models/orderModel.js";

export const orderEmailEvents = Object.freeze({
  confirmed: "confirmed",
  completed: "completed",
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(amountAgorot, currency) {
  return new Intl.NumberFormat("en-IL", {
    style: "currency",
    currency: currency || "ILS",
  }).format(Number(amountAgorot) / 100);
}

function dateTime(value) {
  return new Intl.DateTimeFormat("en-IL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}

function label(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function emailCopy(event, order) {
  if (event === orderEmailEvents.confirmed) {
    return {
      subject: `Order ${order.order_number} confirmed`,
      heading: "Your order is confirmed",
      message: `Your payment was accepted and ${order.vendor_name} received the order.`,
    };
  }
  if (event === orderEmailEvents.completed) {
    const pickup = order.fulfillment_type === "pickup";
    return {
      subject: `${pickup ? "Collection" : "Delivery"} confirmed for ${order.order_number}`,
      heading: pickup ? "Order collected" : "Order delivered",
      message: pickup
        ? "Your collection was confirmed. Thank you for ordering with LevGo."
        : "Your delivery was confirmed. Thank you for ordering with LevGo.",
    };
  }
  throw new TypeError(`Unsupported order email event: ${event}`);
}

function fulfillmentText(order) {
  if (order.fulfillment_type === "pickup") {
    return `Pickup from ${order.vendor_name}`;
  }
  return [order.delivery_building_name, order.delivery_location]
    .filter(Boolean)
    .join(" · ");
}

function textItems(items, currency) {
  return items.map((item) => (
    `${item.quantity} × ${item.product_name} — ${money(item.line_total_agorot, currency)}`
  ));
}

function htmlItems(items, currency) {
  return items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e2e8f0">
        <strong>${escapeHtml(item.quantity)} × ${escapeHtml(item.product_name)}</strong>
        <div style="margin-top:3px;color:#64748b;font-size:12px">${escapeHtml(item.sku)} · ${escapeHtml(money(item.unit_price_agorot, currency))} each</div>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;white-space:nowrap">
        ${escapeHtml(money(item.line_total_agorot, currency))}
      </td>
    </tr>`).join("");
}

export function buildOrderEmail(event, order, items) {
  const copy = emailCopy(event, order);
  const orderUrl = `${config.clientOrigin.replace(/\/$/, "")}/orders/${encodeURIComponent(order.public_id)}`;
  const location = fulfillmentText(order);
  const deliveryFee = Number(order.delivery_fee_agorot) > 0
    ? money(order.delivery_fee_agorot, order.currency)
    : "Free";
  const pickupCode = event === orderEmailEvents.confirmed
    && order.fulfillment_type === "pickup"
    && order.pickup_code
    ? order.pickup_code
    : null;

  return {
    subject: copy.subject,
    text: [
      copy.heading,
      "",
      `Hello ${order.customer_name},`,
      copy.message,
      "",
      "ORDER DETAILS",
      `Order: ${order.order_number}`,
      `Ordered: ${dateTime(order.created_at)}`,
      `Vendor: ${order.vendor_name}`,
      `Fulfillment: ${label(order.fulfillment_type)}`,
      `Location: ${location}`,
      `Payment: ${label(order.payment_method)}`,
      pickupCode ? `Pickup code: ${pickupCode}` : null,
      "",
      "ITEMS",
      ...textItems(items, order.currency),
      "",
      `Subtotal: ${money(order.subtotal_agorot, order.currency)}`,
      `Delivery: ${deliveryFee}`,
      `Total: ${money(order.total_agorot, order.currency)}`,
      "",
      `View order: ${orderUrl}`,
    ].filter((line) => line !== null).join("\n"),
    html: `<!doctype html>
      <html lang="en">
        <body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#071b4d">
          <div style="max-width:640px;margin:0 auto;padding:32px 16px">
            <div style="padding:28px;border-radius:18px;background:#ffffff;border:1px solid #e2e8f0">
              <div style="font-size:20px;font-weight:800;color:#342080">LevGo</div>
              <h1 style="margin:24px 0 10px;font-size:28px">${escapeHtml(copy.heading)}</h1>
              <p style="font-size:16px;line-height:1.6">Hello ${escapeHtml(order.customer_name)},</p>
              <p style="font-size:16px;line-height:1.6">${escapeHtml(copy.message)}</p>
              ${pickupCode ? `
                <div style="margin:24px 0;padding:16px;border-radius:12px;background:#eef7ff;text-align:center">
                  <div style="font-size:12px;color:#54657d;text-transform:uppercase;letter-spacing:.08em">Pickup code</div>
                  <div style="font-size:28px;font-weight:800;color:#071b4d">${escapeHtml(pickupCode)}</div>
                </div>` : ""}
              <div style="margin:24px 0;padding:16px;border-radius:12px;background:#f8fafc;line-height:1.55">
                <div><strong>Order:</strong> ${escapeHtml(order.order_number)}</div>
                <div><strong>Ordered:</strong> ${escapeHtml(dateTime(order.created_at))}</div>
                <div><strong>Vendor:</strong> ${escapeHtml(order.vendor_name)}</div>
                <div><strong>Fulfillment:</strong> ${escapeHtml(label(order.fulfillment_type))}</div>
                <div><strong>Location:</strong> ${escapeHtml(location)}</div>
                <div><strong>Payment:</strong> ${escapeHtml(label(order.payment_method))}</div>
              </div>
              <h2 style="margin:24px 0 4px;font-size:18px">Items</h2>
              <table role="presentation" style="width:100%;border-collapse:collapse">${htmlItems(items, order.currency)}</table>
              <table role="presentation" style="width:100%;margin:18px 0 24px;border-collapse:collapse">
                <tr><td style="padding:4px 0;color:#64748b">Subtotal</td><td style="text-align:right">${escapeHtml(money(order.subtotal_agorot, order.currency))}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Delivery</td><td style="text-align:right">${escapeHtml(deliveryFee)}</td></tr>
                <tr><td style="padding:10px 0 0;font-size:18px;font-weight:800">Total</td><td style="padding:10px 0 0;text-align:right;font-size:18px;font-weight:800">${escapeHtml(money(order.total_agorot, order.currency))}</td></tr>
              </table>
              <a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#342080;color:#fff;text-decoration:none;font-weight:700">View order</a>
            </div>
            <p style="text-align:center;color:#64748b;font-size:12px">This is an automatic LevGo order notification.</p>
          </div>
        </body>
      </html>`,
  };
}

export async function sendOrderEmail(orderPublicId, event) {
  if (!config.smtp.enabled) return { skipped: true, reason: "smtp_disabled" };
  try {
    const order = await findOrderNotificationByPublicId(orderPublicId);
    if (!order) return { skipped: true, reason: "order_not_found" };
    const items = await listOrderItems(order.id);
    const email = buildOrderEmail(event, order, items);
    const result = await sendEmail({
      to: order.customer_email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    console.log(JSON.stringify({
      level: "info",
      message: "Order email sent through SMTP",
      orderPublicId,
      event,
      itemCount: items.length,
      messageId: result.messageId,
    }));
    return result;
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      message: "Order SMTP email failed",
      orderPublicId,
      event,
      errorCode: error.code ?? "SMTP_SEND_FAILED",
      details: error.details ?? [],
    }));
    return {
      skipped: false,
      failed: true,
      code: error.code ?? "SMTP_SEND_FAILED",
      details: error.details ?? [],
    };
  }
}
