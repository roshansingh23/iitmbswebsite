import QRCode from "qrcode";
import crypto from "node:crypto";

export function randomQrCode() {
  // 12 base32-ish chars. Encoded into the QR image; resolves to /u/[qrCode].
  return crypto.randomBytes(8).toString("base64url").slice(0, 12);
}

export async function renderQrSvg(payload: string) {
  return QRCode.toString(payload, {
    type: "svg",
    margin: 1,
    color: { dark: "#1C1B19", light: "#FFFFFF" },
    errorCorrectionLevel: "M"
  });
}

export async function renderQrPng(payload: string) {
  return QRCode.toBuffer(payload, {
    margin: 1,
    color: { dark: "#1C1B19", light: "#FFFFFF" },
    width: 800
  });
}
