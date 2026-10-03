import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";
import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";

moment.locale("en");

const fmt = (n) =>
  new Intl.NumberFormat("en-US").format(Number(n || 0));

const fmtDateTime = (d) => {
  if (!d) return "—";
  return moment(d).format("YYYY/MM/DD HH:mm");
};

/**
 * @param {Object} options
 * @param {Array}  options.rows      - valet rows
 * @param {Object} options.totals    - { count, totalDeposit, totalWithdraw, net }
 * @param {Object} options.filters   - { holderName, type, from, to, search }
 */
export function downloadValetsReportPDF({
  rows,
  totals = {},
  filters = {},
}) {
  if (!rows || rows.length === 0) {
    alert("داده‌ای برای دانلود وجود ندارد");
    return;
  }

  const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  doc.setR2L(false);

  doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
  doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
  doc.setFont("Vazirmatn");

  const pageWidth = doc.internal.pageSize.getWidth();
  const today = moment().format("YYYY/MM/DD");

  /* ---------- Title ---------- */
  doc.setFontSize(15);
  doc.text("گزارش تراکنش‌ها", pageWidth - 40, 55, {
    align: "right",
  });

  /* ---------- Subtitle: applied filters ---------- */
  const parts = [];
  if (filters.holderName) parts.push(`حامل: ${filters.holderName}`);
  if (filters.type) {
    parts.push(
      `نوع: ${filters.type === "deposit" ? "واریز" : "برداشت"}`
    );
  }
  if (filters.from) parts.push(`از: ${filters.from}`);
  if (filters.to) parts.push(`تا: ${filters.to}`);
  if (filters.search) parts.push(`جستجو: ${filters.search}`);
  parts.push(`تاریخ صدور: ${today}`);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(parts.join("  •  "), pageWidth - 40, 75, { align: "right" });

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1);
  doc.line(40, 85, pageWidth - 40, 85);
  doc.setTextColor(0, 0, 0);

  /* ---------- Table ---------- */
  /* Columns are reversed for RTL layout (rightmost first when read) */
  const head = [
    ["تاریخ", "توضیحات", "منبع", "مبلغ", "نوع", "حامل", "#"].reverse(),
  ];

  const body = rows.map((v) => {
    const holderName = v.holderInfo?.fullName || `#${v.holder}`;
    const holderNic = v.holderInfo?.NIC || "";
    const typeLabel = v.type === "deposit" ? "واریز" : "برداشت";
    const sourceLabel = v.source
      ? v.source === "valet"
        ? "والټ"
        : "کسب‌وکار"
      : "—";
    const sign = v.type === "deposit" ? "+" : "−";

    return [
      fmtDateTime(v.createdAt),
      v.description || "—",
      sourceLabel,
      `${sign}${fmt(v.amount)}`,
      typeLabel,
      holderNic ? `${holderName}\n${holderNic}` : holderName,
      `#${v.id}`,
    ].reverse();
  });

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
    columnStyles: {
      // Column index depends on the reversed array:
      // index 0 = تاریخ | 1 = توضیحات | 2 = منبع | 3 = مبلغ | 4 = نوع | 5 = حامل | 6 = #
      0: { cellWidth: 80 },   // تاریخ
      1: { cellWidth: 140 },  // توضیحات
      2: { cellWidth: 60 },   // منبع
      3: { cellWidth: 70 },   // مبلغ
      4: { cellWidth: 50 },   // نوع
      5: { cellWidth: 110 },  // حامل
      6: { cellWidth: 35 },   // #
    },
    didDrawCell: (data) => {
      if (data.cell) data.cell.styles.font = "Vazirmatn";
    },
    didParseCell: (data) => {
      // Colorize the amount column
      if (data.section === "body" && data.column.index === 3) {
        const text = String(data.cell.raw || "");
        if (text.startsWith("+")) {
          data.cell.styles.textColor = [4, 120, 87]; // emerald
          data.cell.styles.fontStyle = "bold";
        } else if (text.startsWith("−")) {
          data.cell.styles.textColor = [185, 28, 28]; // red
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  /* ---------- Summary block ---------- */
  const y = (doc.lastAutoTable?.finalY || 140) + 30;
  const boxHeight = 90;

  doc.setFillColor(245, 245, 245);
  doc.rect(40, y, pageWidth - 80, boxHeight, "F");

  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175);
  doc.text("خلاصه", pageWidth - 50, y + 20, { align: "right" });
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.text(
    `تعداد تراکنش‌ها: ${totals.count ?? rows.length}`,
    pageWidth - 50,
    y + 40,
    { align: "right" }
  );
  doc.text(
    `مجموع واریز: ${fmt(totals.totalDeposit)} افغانی`,
    pageWidth - 50,
    y + 55,
    { align: "right" }
  );
  doc.text(
    `مجموع برداشت: ${fmt(totals.totalWithdraw)} افغانی`,
    pageWidth - 50,
    y + 70,
    { align: "right" }
  );

  /* Net on the left of the box */
  doc.setFontSize(12);
  const netColor =
    Number(totals.net) >= 0 ? [4, 120, 87] : [185, 28, 28];
  doc.setTextColor(...netColor);
  doc.text(
    `خالص: ${fmt(totals.net)} افغانی`,
    pageWidth / 2 + 40,
    y + 70,
    { align: "center" }
  );
  doc.setTextColor(0, 0, 0);

  /* ---------- Save ---------- */
  doc.save(`Valets_Report_${today}.pdf`);
}