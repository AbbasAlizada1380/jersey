// components/ReceiptEditor.jsx
import React, { useEffect, useState } from "react";
import { normalizeReceipt, sumReceipt } from "./ReceiptCell";

/**
 * Props:
 *   - value:    the current receipt (any shape accepted by normalizeReceipt)
 *   - onCommit: (arrayOfNumbers) => void   -- called on blur/Enter with parsed array
 *   - disabled: boolean
 */
export default function ReceiptEditor({ value, onCommit, disabled = false }) {
  const [text, setText] = useState(toText(value));

  // Keep local text in sync when parent value changes (e.g. after save)
  useEffect(() => {
    setText(toText(value));
  }, [value]);

  const commit = () => {
    const arr = parse(text);
    onCommit?.(arr);
    setText(arr.join(",")); // normalize display
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
    if (e.key === "Escape") {
      setText(toText(value));
      e.target.blur();
    }
  };

  const total = sumReceipt(parse(text));

  return (
    <div className="flex flex-col items-start gap-1">
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        placeholder="5000 یا 1000,2000,2000"
        className="w-40 font-mono text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-gray-100"
        dir="ltr"
      />
      <span className="text-[10px] text-gray-500" dir="ltr">
        مجموع: {total}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */
function toText(value) {
  const arr = normalizeReceipt(value);
  return arr.join(",");
}

function parse(text) {
  if (!text || !text.trim()) return [];
  return text
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
}