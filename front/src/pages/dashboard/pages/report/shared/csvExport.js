// src/components/financial/shared/csvExport.js

const esc = (v) => {
  const s = String(v ?? "").replace(/"/g, '""');
  return `"${s}"`;
};

export function downloadReportCSV(payload) {
  const {
    dateRange,
    summary,
    receipts,
    valetDeposits,
    expenses,
    paidSalaries,
    unpaidLists,
    bills,
  } = payload;

  const lines = [];

  lines.push(`گزارش مالی, از ${dateRange.from} تا ${dateRange.to}`);
  lines.push("");

  /* ---------- Summary ---------- */
  lines.push("### خلاصه مالی ###");
  lines.push(["مجموع عواید", summary.totalIncome].map(esc).join(","));
  lines.push(["مجموع خروجی", summary.totalOutflow].map(esc).join(","));
  lines.push(["مانده خالص", summary.balance].map(esc).join(","));
  lines.push(["باقیات معاشات", summary.unpaid].map(esc).join(","));
  lines.push(["باقیات مشتریان", summary.customerRemainder].map(esc).join(","));
  lines.push("");

  /* ---------- Receipts ---------- */
  lines.push("### رسیدها ###");
  lines.push(["#", "مبلغ", "مشتری", "تاریخ"].map(esc).join(","));
  receipts.forEach((r, i) => {
    lines.push(
      [i + 1, r.amount, r.name || r.Customer?.fullname || "—", r.createdAt]
        .map(esc)
        .join(",")
    );
  });
  lines.push("");

  /* ---------- Valet Deposits ---------- */
  lines.push("### واریز والی‌ها ###");
  lines.push(["#", "مبلغ", "حامل", "تاریخ"].map(esc).join(","));
  valetDeposits.forEach((v, i) => {
    lines.push(
      [i + 1, v.amount, v.holderInfo?.fullName || "—", v.createdAt]
        .map(esc)
        .join(",")
    );
  });
  lines.push("");

  /* ---------- Expenses ---------- */
  lines.push("### مصارف ###");
  lines.push(["#", "مبلغ", "شرح", "تاریخ"].map(esc).join(","));
  expenses.forEach((e, i) => {
    lines.push(
      [i + 1, e.amount, e.description || "—", e.createdAt].map(esc).join(",")
    );
  });
  lines.push("");

  /* ---------- Paid Salaries ---------- */
  lines.push("### معاشات پرداخت‌شده ###");
  lines.push(["#", "مبلغ", "کارمند", "شرح", "تاریخ"].map(esc).join(","));
  paidSalaries.forEach((p, i) => {
    lines.push(
      [
        i + 1,
        p.amount,
        p.staffName || p.attendance?.staff?.name || "—",
        p.note || "—",
        p.paidAt || p.createdAt,
      ]
        .map(esc)
        .join(",")
    );
  });
  lines.push("");

  /* ---------- Unpaid Lists ---------- */
  lines.push("### معاشات پرداخت‌نشده ###");
  lines.push(["#", "نام لیست", "کل", "پرداخت‌شده", "باقی‌مانده", "تاریخ"].map(esc).join(","));
  unpaidLists.forEach((u, i) => {
    const total = Number(u.total || 0);
    const paid = Number(u.paid || 0);
    lines.push(
      [i + 1, u.name || u.range || "—", total, paid, total - paid, u.createdAt]
        .map(esc)
        .join(",")
    );
  });
  lines.push("");

  /* ---------- Customer Bills ---------- */
  lines.push("### باقیات مشتریان ###");
  lines.push(["#", "مشتری", "نوع", "باقی‌مانده", "تلفن"].map(esc).join(","));
  bills.forEach((b, i) => {
    lines.push(
      [
        i + 1,
        b.name || "—",
        b.customerType === "permanent" ? "دائمی" : "موقت",
        b.remaind,
        b.phoneNumber || "—",
      ]
        .map(esc)
        .join(",")
    );
  });

  const csv = "\uFEFF" + lines.join("\n"); // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Financial_Report_${dateRange.from}_to_${dateRange.to}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}