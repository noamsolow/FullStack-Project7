import { config } from "../config/index.js";
import { sendEmail } from "../integrations/resendClient.js";
import { findOrderNotificationByPublicId } from "../models/orderModel.js";

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

function eventContent(event, order) {
  const pickup = order.fulfillment_type === "pickup";
  const content = {
    placed: {
      subject: `Order ${order.order_number} received`,
      heading: "We received your order",
      message: `${order.vendor_name} has received your order and will begin processing it soon.`,
    },
    paid: {
      subject: `Payment confirmed for ${order.order_number}`,
      heading: "Payment confirmed",
      message: `We received your ${money(order.total_agorot, order.currency)} payment. ${order.vendor_name} now has your order.`,
    },
    accepted: {
      subject: `Order ${order.order_number} accepted`,
      heading: "Your order was accepted",
      message: `${order.vendor_name} accepted your order and will begin preparing it.`,
    },
    preparing: {
      subject: `Order ${order.order_number} is being prepared`,
      heading: "Your order is being prepared",
      message: `${order.vendor_name} is now preparing your order.`,
    },
    ready: {
      subject: `Order ${order.order_number} is ready for pickup`,
      heading: "Ready for pickup",
      message: `Your order is ready at ${order.vendor_name}. Show pickup code ${order.pickup_code} when you collect it.`,
    },
    out_for_delivery: {
      subject: `Order ${order.order_number} is on the way`,
      heading: "Your delivery is on the way",
      message: `${order.vendor_name} has sent your order for delivery.`,
    },
    completed: {
      subject: pickup
        ? `Pickup confirmed for ${order.order_number}`
        : `Delivery confirmed for ${order.order_number}`,
      heading: pickup ? "Pickup complete" : "Delivery complete",
      message: pickup
        ? "Your pickup was confirmed. Thank you for ordering with LevGo."
        : "Your delivery was confirmed. Thank you for ordering with LevGo.",
    },
    cancellation_requested: {
      subject: `Cancellation requested for ${order.order_number}`,
      heading: "Cancellation request received",
      message: "An administrator will review the request and any required refund.",
    },
    cancelled: {
      subject: `Order ${order.order_number} was cancelled`,
      heading: "Order cancelled",
      message: "This order is no longer active. Check LevGo for the latest payment or refund details.",
    },
    needs_attention: {
      subject: `Order ${order.order_number} needs attention`,
      heading: "Your order needs attention",
      message: `${order.vendor_name} needs help completing this order. Open LevGo to review its latest status.`,
    },
  };
  return content[event] ?? {
    subject: `Update for order ${order.order_number}`,
    heading: "Your order was updated",
    message: `The new order status is ${String(event).replaceAll("_", " ")}.`,
  };
}

function buildEmail(event, order) {
  const content = eventContent(event, order);
  const orderUrl = `${config.clientOrigin.replace(/\/$/, "")}/orders/${encodeURIComponent(order.public_id)}`;
  const pickupCode = event === "ready"
    ? `<div style="margin:24px 0;padding:16px;border-radius:12px;background:#eef7ff;text-align:center">
        <div style="font-size:12px;color:#54657d;text-transform:uppercase;letter-spacing:.08em">Pickup code</div>
        <div style="font-size:28px;font-weight:800;color:#071b4d">${escapeHtml(order.pickup_code)}</div>
      </div>`
    : "";

  return {
    subject: content.subject,
    text: [
      content.heading,
      "",
      `Hello ${order.customer_name},`,
      content.message,
      `Order: ${order.order_number}`,
      `Vendor: ${order.vendor_name}`,
      `Total: ${money(order.total_agorot, order.currency)}`,
      event === "ready" ? `Pickup code: ${order.pickup_code}` : null,
      "",
      `View order: ${orderUrl}`,
    ].filter((line) => line !== null).join("\n"),
    html: `<!doctype html>
      <html lang="en">
        <body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#071b4d">
          <div style="max-width:600px;margin:0 auto;padding:32px 16px">
            <div style="padding:28px;border-radius:18px;background:#ffffff;border:1px solid #e2e8f0">
              <div style="font-size:20px;font-weight:800;color:#342080">LevGo</div>
              <h1 style="margin:24px 0 10px;font-size:28px">${escapeHtml(content.heading)}</h1>
              <p style="font-size:16px;line-height:1.6">Hello ${escapeHtml(order.customer_name)},</p>
              <p style="font-size:16px;line-height:1.6">${escapeHtml(content.message)}</p>
              ${pickupCode}
              <div style="margin:24px 0;padding:16px;border-radius:12px;background:#f8fafc">
                <div><strong>Order:</strong> ${escapeHtml(order.order_number)}</div>
                <div style="margin-top:8px"><strong>Vendor:</strong> ${escapeHtml(order.vendor_name)}</div>
                <div style="margin-top:8px"><strong>Total:</strong> ${escapeHtml(money(order.total_agorot, order.currency))}</div>
              </div>
              <a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#342080;color:#fff;text-decoration:none;font-weight:700">View order</a>
            </div>
            <p style="text-align:center;color:#64748b;font-size:12px">This is an automatic LevGo order update.</p>
          </div>
        </body>
      </html>`,
  };
}

export async function sendOrderUpdateEmail(orderPublicId, event) {
  if (!config.email.enabled) return { skipped: true };
  try {
    const order = await findOrderNotificationByPublicId(orderPublicId);
    if (!order) {
      console.error(JSON.stringify({
        level: "warn",
        message: "Order email skipped because the order was not found",
        orderPublicId,
        event,
      }));
      return { skipped: true };
    }
    const email = buildEmail(event, order);
    const result = await sendEmail({
      to: order.customer_email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      idempotencyKey: `order-${event}-${order.public_id}`,
      tags: [
        { name: "category", value: "order_update" },
        { name: "event", value: event },
      ],
    });
    console.log(JSON.stringify({
      level: "info",
      message: "Order update email sent",
      orderPublicId,
      event,
      providerMessageId: result.id,
    }));
    return result;
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      message: "Order update email failed",
      orderPublicId,
      event,
      errorCode: error.code ?? "EMAIL_SEND_FAILED",
      errorName: error.name ?? "Error",
    }));
    return { skipped: false, failed: true };
  }
}
