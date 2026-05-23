import Razorpay from "razorpay";
import crypto from "node:crypto";

let _instance: Razorpay | null = null;
export function razorpay() {
  if (!_instance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay keys missing");
    }
    _instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return _instance;
}

// Verify a Razorpay Checkout payment-success signature (client-side success
// handler relays orderId+paymentId+signature; the server confirms).
export function verifyCheckoutSignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const body = `${args.orderId}|${args.paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(args.signature));
}

// Verify the webhook body signature using the dedicated webhook secret.
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
