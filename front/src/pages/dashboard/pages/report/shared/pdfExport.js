// src/components/financial/shared/pdfExport.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";
import VazirmatnTTF from "../../../../../../public/ttf/Vazirmatn.js";

const fmt = (n) => Number(n || 0).toLocaleString();

export async function downloadReportPDF(payload) {
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

  const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
  doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
  doc.setFont("Vazirmatn", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const rightX = pageWidth - 40;
  const MARGIN_BOTTOM = 60;
  const MIN_TOP = 50;
  let currentY = 90;

  const ensureSpace = (needed) => {
    if (currentY + needed > pageHeight - MARGIN_BOTTOM) {
      doc.addPage();
      currentY = MIN_TOP;
    }
  };

  // Title
  doc.setFontSize(16);
  doc.text(
    `گزارش مالی از ${dateRange.from} تا ${dateRange.to}`,
    rightX,
    50,
    { align: "right" }
  );

  /* =========================================================
     ✅ addTable — accepts columns as [{ label, get }, ...]
     ========================================================= */
  const addTable = (title, items, columns, total, count) => {
    ensureSpace(150);

    // Section title
    doc.setFontSize(12);
    doc.text(title, rightX, currentY, { align: "right" });
    currentY += 20;

    if (!items || items.length === 0) {
      doc.setFontSize(10);
      doc.text("داده‌ای یافت نشد.", rightX, currentY, { align: "right" });
      currentY += 20;
      return;
    }

    // ✅ Headers = plain strings from column.label
    const head = [columns.map((c) => c.label)];

    // ✅ Body = run each column's getter for each row
    const body = items.map((it) => columns.map((c) => c.get(it)));

    autoTable(doc, {
      startY: currentY,
      head,
      body,
      theme: "grid",
      styles: {
        font: "Vazirmatn",
        fontSize: 9,
        halign: "center",
        valign: "middle",
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      headStyles: {
        font: "Vazirmatn",
        fontStyle: "normal",
        fillColor: [220, 220, 220],
        textColor: 20,
        fontSize: 10,
        halign: "center",
      },
      margin: { left: 20, right: 20 },
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // Totals line
    doc.setFontSize(10);
    doc.text(`تعداد: ${count} | مجموع: ${fmt(total)}`, rightX, currentY, {
      align: "right",
    });
    currentY += 30;
  };

  /* =========================================================
     Tables — each column is now { label, get }
     ========================================================= */

  /* ---------- 1. Receipts ---------- */
  addTable(
    "رسیدها",
    receipts,
    [
      { label: "مبلغ",  get: (r) => fmt(r.amount) },
      { label: "مشتری", get: (r) => r.name || r.Customer?.fullname || "—" },
      { label: "تاریخ", get: (r) => moment(r.createdAt).format("YYYY/MM/DD") },
    ],
    receipts.reduce((s, r) => s + Number(r.amount || 0), 0),
    receipts.length
  );

  /* ---------- 2. Valet Deposits ---------- */
  addTable(
    "واریز سهام دار‌ها",
    valetDeposits,
    [
      { label: "مبلغ",  get: (v) => fmt(v.amount) },
      { label: "سهام دار",  get: (v) => v.holderInfo?.fullName || "—" },
      { label: "تاریخ", get: (v) => moment(v.createdAt).format("YYYY/MM/DD") },
    ],
    valetDeposits.reduce((s, v) => s + Number(v.amount || 0), 0),
    valetDeposits.length
  );

  /* ---------- 3. Expenses ---------- */
  addTable(
    "مصارف",
    expenses,
    [
      { label: "مبلغ",  get: (e) => fmt(e.amount) },
      { label: "شرح",   get: (e) => e.description || "—" },
      { label: "تاریخ", get: (e) => moment(e.createdAt).format("YYYY/MM/DD") },
    ],
    expenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    expenses.length
  );

  /* ---------- 4. Paid Salaries ---------- */
  addTable(
    "معاشات پرداخت‌شده",
    paidSalaries,
    [
      { label: "مبلغ",   get: (p) => fmt(p.amount) },
      {
        label: "کارمند",
        get: (p) => p.staffName || p.attendance?.staff?.name || "—",
      },
      {
        label: "شرح",
        get: (p) => p.note || "—",
      },
      {
        label: "تاریخ",
        get: (p) => moment(p.paidAt || p.createdAt).format("YYYY/MM/DD"),
      },
    ],
    paidSalaries.reduce((s, p) => s + Number(p.amount || 0), 0),
    paidSalaries.length
  );

  /* ---------- 5. Unpaid Salary Lists ---------- */
  addTable(
    "معاشات پرداخت‌نشده",
    unpaidLists,
    [
      { label: "نام لیست",     get: (u) => u.name || u.range || "—" },
      { label: "کل",           get: (u) => fmt(u.total) },
      { label: "پرداخت‌شده",   get: (u) => fmt(u.paid) },
      {
        label: "باقی‌مانده",
        get: (u) => fmt(Number(u.total || 0) - Number(u.paid || 0)),
      },
      {
        label: "تاریخ",
        get: (u) => moment(u.createdAt).format("YYYY/MM/DD"),
      },
    ],
    unpaidLists.reduce(
      (s, u) => s + (Number(u.total || 0) - Number(u.paid || 0)),
      0
    ),
    unpaidLists.length
  );

  /* ---------- 6. Customer Bills ---------- */
  addTable(
    "باقیات مشتریان",
    bills,
    [
      { label: "مشتری",       get: (b) => b.name || "—" },
      {
        label: "نوع",
        get: (b) => (b.customerType === "permanent" ? "دائمی" : "موقت"),
      },
      { label: "باقی‌مانده",  get: (b) => fmt(b.remaind) },
      { label: "تلفن",        get: (b) => b.phoneNumber || "—" },
    ],
    bills.reduce((s, b) => s + Number(b.remaind || 0), 0),
    bills.length
  );

  /* =========================================================
     Summary
     ========================================================= */
  ensureSpace(300);
  doc.setFontSize(14);
  doc.text("خلاصه مالی", rightX, currentY, { align: "right" });
  currentY += 25;

  doc.setFontSize(10);
  const summaryLines = [
    ["مجموع عواید",        summary.totalIncome],
    ["مجموع خروجی",        summary.totalOutflow],
    ["مانده خالص",         summary.balance],
    ["باقیات معاشات",      summary.unpaid],
    ["باقیات مشتریان",     summary.customerRemainder],
  ];
  summaryLines.forEach(([label, val]) => {
    doc.text(`${label} : ${fmt(val)}`, rightX, currentY, { align: "right" });
    currentY += 16;
  });

  /* =========================================================
     Page numbers
     ========================================================= */
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont("Vazirmatn", "normal");
    doc.text(`${i}/${pageCount}`, pageWidth - 40, pageHeight - 40, {
      align: "right",
    });
  }

  doc.save(`Financial_Report_${dateRange.from}_to_${dateRange.to}.pdf`);
}