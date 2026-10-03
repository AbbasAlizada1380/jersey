// src/components/wallet/printValetsReport.js

const fmt = (n) =>
  new Intl.NumberFormat("en-US").format(Number(n || 0));

const formatDate = (d) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
};

/**
 * @param {Object} options
 * @param {Array}  options.rows         - the valet rows to print
 * @param {Object} options.totals       - { count, totalDeposit, totalWithdraw, net }
 * @param {Object} options.filters      - { holderName, type, from, to }
 */
export function printValetsReport({ rows = [], totals = {}, filters = {} }) {
  if (!rows.length) {
    alert("داده‌ای برای چاپ وجود ندارد");
    return;
  }

  const today = new Date().toLocaleDateString("en-GB");

  /* ---- Filter line for the header ---- */
  const filterParts = [];
  if (filters.holderName) filterParts.push(`حامل: ${filters.holderName}`);
  if (filters.type) {
    filterParts.push(
      `نوع: ${filters.type === "deposit" ? "واریز" : "برداشت"}`
    );
  }
  if (filters.from) filterParts.push(`از: ${filters.from}`);
  if (filters.to) filterParts.push(`تا: ${filters.to}`);
  filterParts.push(`تاریخ چاپ: ${today}`);

  /* ---- Build the table rows ---- */
  const rowsHtml = rows
    .map((v) => {
      const holderName = v.holderInfo?.fullName || `#${v.holder}`;
      const holderNic = v.holderInfo?.NIC || "";
      const typeLabel = v.type === "deposit" ? "واریز" : "برداشت";
      const sourceLabel = v.source
        ? v.source === "valet"
          ? "از والټ"
          : "از کسب‌وکار"
        : "—";
      const sign = v.type === "deposit" ? "+" : "−";

      return `
        <tr>
          <td>#${v.id}</td>
          <td>
            <div class="name">${holderName}</div>
            ${holderNic ? `<div class="nic">${holderNic}</div>` : ""}
          </td>
          <td>
            <span class="badge ${v.type}">${typeLabel}</span>
            ${v.type === "withdraw" && v.source ? `<div class="src">${sourceLabel}</div>` : ""}
          </td>
          <td class="amount ${v.type}">${sign}${fmt(v.amount)}</td>
          <td class="desc">${v.description || "—"}</td>
          <td class="date">${formatDate(v.createdAt)}</td>
        </tr>
      `;
    })
    .join("");

  /* ---- Full HTML ---- */
  const html = `
  <!DOCTYPE html>
  <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <title>گزارش تراکنش‌ها</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: "Vazirmatn", "Segoe UI", Tahoma, sans-serif;
          color: #1f2937;
          margin: 24px;
          font-size: 12px;
        }
        h1 {
          font-size: 18px;
          margin: 0 0 6px 0;
          color: #1e40af;
        }
        .meta {
          color: #6b7280;
          font-size: 11px;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #1e40af;
        }
        .summary {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .summary .tile {
          flex: 1;
          min-width: 130px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
        }
        .summary .tile .label {
          color: #6b7280;
          font-size: 10px;
          margin-bottom: 4px;
        }
        .summary .tile .value {
          font-size: 14px;
          font-weight: bold;
        }
        .summary .tile.deposit .value { color: #047857; }
        .summary .tile.withdraw .value { color: #b91c1c; }
        .summary .tile.net .value { color: #1e40af; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        thead {
          background: #1e40af;
          color: white;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 6px 8px;
          text-align: right;
          vertical-align: middle;
        }
        th { font-weight: 600; }
        tbody tr:nth-child(even) { background: #f9fafb; }
        td.amount { font-weight: bold; font-family: "Courier New", monospace; }
        td.amount.deposit { color: #047857; }
        td.amount.withdraw { color: #b91c1c; }
        td.desc { max-width: 200px; }
        td.date { white-space: nowrap; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
        }
        .badge.deposit { background: #d1fae5; color: #065f46; }
        .badge.withdraw { background: #fee2e2; color: #991b1b; }
        .nic {
          color: #6b7280;
          font-size: 10px;
          font-family: monospace;
          direction: ltr;
          text-align: right;
        }
        .src {
          color: #6b7280;
          font-size: 10px;
          margin-top: 2px;
        }
        .name { font-weight: 600; }

        @media print {
          body { margin: 12mm; }
          @page { size: A4 portrait; margin: 12mm; }
        }
      </style>
    </head>
    <body>
      <h1>گزارش تراکنش‌ها</h1>
      <div class="meta">${filterParts.join(" • ")}</div>

      

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>حامل</th>
            <th>نوع</th>
            <th>مبلغ</th>
            <th>توضیحات</th>
            <th>تاریخ</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body>
  </html>
  `;

  /* ---- Open in a new window and print ---- */
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("لطفاً اجازه دسترسی به پنجره‌های بازشو را بدهید");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  win.onload = () => {
    win.focus();
    win.print();
  };

  /* Fallback for some browsers */
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch (_) {
      /* already printed or blocked */
    }
  }, 300);
}