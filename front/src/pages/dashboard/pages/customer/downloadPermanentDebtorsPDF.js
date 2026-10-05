// src/components/customers/downloadPermanentDebtorsPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";
import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn";

moment.locale("en");

const fmt = (n) =>
  new Intl.NumberFormat("en-US").format(Number(n || 0));

export function downloadPermanentDebtorsPDF({
  permanent = [],
  temporary,        // ignored — kept only for API compatibility
  grandTotals,      // ignored — we recompute from `permanent`
  filters = {},
}) {
  const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  doc.setR2L(false);

  doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
  doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
  doc.setFont("Vazirmatn");

  const pageWidth = doc.internal.pageSize.getWidth();
  const today = moment().format("YYYY/MM/DD");

  /* ---------- Title ---------- */
  doc.setFontSize(15);
  doc.text("گزارش بدهی مشتریان دائمی", pageWidth - 40, 55, {
    align: "right",
  });

  /* ---------- Subtitle ---------- */
  const parts = [];
  if (filters.from) parts.push(`از: ${filters.from}`);
  if (filters.to) parts.push(`تا: ${filters.to}`);
  parts.push(`تاریخ صدور: ${today}`);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(parts.join("  •  "), pageWidth - 40, 75, { align: "right" });

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1);
  doc.line(40, 85, pageWidth - 40, 85);
  doc.setTextColor(0, 0, 0);

  /* ---------- Table renderer ---------- */
  const renderTable = (title, rows, startY) => {
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text(title, pageWidth - 40, startY, { align: "right" });
    doc.setTextColor(0, 0, 0);

    if (!rows || rows.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text("هیچ بدهی ثبت نشده است", pageWidth - 40, startY + 20, {
        align: "right",
      });
      doc.setTextColor(0, 0, 0);
      return startY + 40;
    }

    /* ✅ Single source of truth for column order — logical order */
    const COLUMNS = [
      "باقی مانده",
      "پرداخت شده",
      "مجموع",
      "تعداد بل",
      "تماس",
      "مشتری",
    ];

    /* ✅ head — with .reverse() to match RTL visual order */
    const head = [COLUMNS.slice().reverse()];

    /* ✅ body — same logical order, then reversed */
    const body = rows.map((r) =>
      [
        fmt(r.totalRemaining),
        fmt(r.totalPaid),
        fmt(r.totalAmount),
        String(r.bills.length),
        r.phoneNumber || "—",
        r.name,
      ].reverse()
    );

    /* ---------- Totals row ---------- */
    const t = rows.reduce(
      (acc, r) => {
        acc.amount += r.totalAmount;
        acc.paid += r.totalPaid;
        acc.remaining += r.totalRemaining;
        acc.bills += r.bills.length;
        return acc;
      },
      { amount: 0, paid: 0, remaining: 0, bills: 0 }
    );

    /* ✅ foot — MUST also be reversed to match head/body order */
    const foot = [
      [
        { content: "مجموع", styles: { font: "Vazirmatn", fontStyle: "normal" } },
        "",
        String(t.bills),
        fmt(t.amount),
        fmt(t.paid),
        fmt(t.remaining),
      ],
    ];

    autoTable(doc, {
      startY: startY + 8,
      head,
      body,
      foot,
      theme: "grid",
      styles: {
        font: "Vazirmatn",
        fontSize: 9,
        halign: "center",
        valign: "middle",
        cellPadding: 6,
      },
      headStyles: {
        font: "Vazirmatn",
        fontStyle: "normal",
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        halign: "center",
      },
      footStyles: {
        font: "Vazirmatn",
        fillColor: [240, 240, 240],
        textColor: [30, 30, 30],
        fontStyle: "bold",
        halign: "center",
      },
      didDrawCell: (data) => {
        if (data.cell) data.cell.styles.font = "Vazirmatn";
      },
    });

    return doc.lastAutoTable.finalY + 25;
  };

  /* ---------- Single permanent table ---------- */
  let y = renderTable("مشتریان دائمی بدهکار", permanent, 110);

  /* ---------- Grand totals ---------- */
  if (y > doc.internal.pageSize.getHeight() - 120) {
    doc.addPage();
    y = 60;
  }

  /* Recompute totals from `permanent` only */
  const totals = permanent.reduce(
    (acc, r) => {
      acc.customers += 1;
      acc.bills += r.bills?.length || 0;
      acc.amount += Number(r.totalAmount || 0);
      acc.paid += Number(r.totalPaid || 0);
      acc.remaining += Number(r.totalRemaining || 0);
      return acc;
    },
    { customers: 0, bills: 0, amount: 0, paid: 0, remaining: 0 }
  );

  doc.setFillColor(245, 245, 245);
  doc.rect(40, y, pageWidth - 80, 75, "F");

  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text("خلاصه کلی", pageWidth - 50, y + 20, { align: "right" });
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.text(
    `تعداد مشتریان بدهکار: ${totals.customers}`,
    pageWidth - 50,
    y + 38,
    { align: "right" }
  );
  doc.text(
    `تعداد بل‌ها: ${totals.bills}`,
    pageWidth - 50,
    y + 52,
    { align: "right" }
  );
  doc.text(
    `مجموع کل: ${fmt(totals.amount)} افغانی  —  پرداخت شده: ${fmt(
      totals.paid
    )} افغانی  —  باقی مانده: ${fmt(totals.remaining)} افغانی`,
    pageWidth - 50,
    y + 66,
    { align: "right" }
  );

  /* ---------- Save ---------- */
  doc.save(`Permanent_Customer_Debt_${today}.pdf`);
}