import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";
import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";

moment.locale("en");

const fmt = (n) =>
  new Intl.NumberFormat("en-US").format(Number(n || 0));

export function downloadReceiptsReportPDF({
  rows,
  columns,
  totals,
  groupBy,
  filters = {},
}) {
  const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  doc.setR2L(false);

  doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
  doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
  doc.setFont("Vazirmatn");

  const pageWidth = doc.internal.pageSize.getWidth();
  const today = moment().format("YYYY/MM/DD");

  /* Title */
  const titleMap = {
    none: "گزارش رسیدها",
    customer: "گزارش رسیدها — بر اساس مشتری",
    day: "گزارش رسیدها — بر اساس روز",
    month: "گزارش رسیدها — بر اساس ماه",
  };
  doc.setFontSize(15);
  doc.text(titleMap[groupBy] || "گزارش رسیدها", pageWidth - 40, 55, {
    align: "right",
  });

  /* Subtitle: applied filters */
  const parts = [];
  if (filters.customer) parts.push(`مشتری: ${filters.customer}`);
  if (filters.from) parts.push(`از: ${filters.from}`);
  if (filters.to) parts.push(`تا: ${filters.to}`);
  if (filters.search) parts.push(`جستجو: ${filters.search}`);
  if (filters.minAmount) parts.push(`حداقل: ${filters.minAmount}`);
  if (filters.maxAmount) parts.push(`حداکثر: ${filters.maxAmount}`);
  parts.push(`تاریخ صدور: ${today}`);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(parts.join("  •  "), pageWidth - 40, 75, { align: "right" });

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1);
  doc.line(40, 85, pageWidth - 40, 85);
  doc.setTextColor(0, 0, 0);

  /* Table */
  const head = [columns.map((c) => c.label).reverse()];

  const body = rows.map((row) =>
    columns
      .map((c) => {
        const v = c.value(row);
        if (c.key === "total" || c.key === "amount") return fmt(v);
        if (typeof v === "number") return v.toLocaleString("en-US");
        return v ?? "";
      })
      .reverse()
  );

  autoTable(doc, {
    startY: 100,
    head,
    body,
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
    didDrawCell: (data) => {
      if (data.cell) data.cell.styles.font = "Vazirmatn";
    },
  });

  /* Totals */
  const y = (doc.lastAutoTable?.finalY || 140) + 30;

  doc.setFillColor(245, 245, 245);
  doc.rect(40, y, pageWidth - 80, 65, "F");

  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175);
  doc.text("خلاصه", pageWidth - 50, y + 20, { align: "right" });
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.text(
    `تعداد ردیف‌ها: ${rows.length}`,
    pageWidth - 50,
    y + 38,
    { align: "right" }
  );
  doc.text(
    `تعداد رسیدها: ${totals.count}`,
    pageWidth - 50,
    y + 52,
    { align: "right" }
  );
  doc.text(
    `مجموع مبالغ: ${fmt(totals.amount)} افغانی`,
    pageWidth - 50,
    y + 66,
    { align: "right" }
  );

  doc.save(`Receipts_Report_${today}.pdf`);
}