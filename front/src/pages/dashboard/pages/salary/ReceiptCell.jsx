// components/ReceiptCell.jsx
import React from "react";

/**
 * Displays a receipt as a comma-joined string.
 * Accepts:
 *   - number          → 5000
 *   - string          → "1000,2000,2000"
 *   - array of nums   → [1000, 2000, 2000]
 *   - null/undefined  → "0"
 */
export default function ReceiptCell({ receipt, className = "" }) {
  const text = formatReceipt(receipt);

  return (
    <span
      className={`inline-block font-mono text-xs text-gray-700 bg-gray-100 border border-gray-200 rounded px-2 py-1 ${className}`}
      dir="ltr"
    >
      {text}
    </span>
  );
}

/* ---------------------------------------------------------
   Normalize any receipt shape to a comma-joined string.
   --------------------------------------------------------- */
export function formatReceipt(receipt) {
  const arr = normalizeReceipt(receipt);
  if (arr.length === 0) return "0";
  return arr.join(",");
}

/* ---------------------------------------------------------
   Return an array of numbers, no matter the input shape.
   --------------------------------------------------------- */
export function normalizeReceipt(receipt) {
  if (receipt == null) return [];

  // Already an array
  if (Array.isArray(receipt)) {
    return receipt.map((n) => Number(n) || 0);
  }

  // Single number
  if (typeof receipt === "number") {
    return [Number(receipt) || 0];
  }

  // String like "1000,2000,2000"
  if (typeof receipt === "string") {
    return receipt
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
  }

  return [];
}

/* ---------------------------------------------------------
   Sum of all payments in the receipt.
   --------------------------------------------------------- */
export function sumReceipt(receipt) {
  return normalizeReceipt(receipt).reduce((a, b) => a + b, 0);
}