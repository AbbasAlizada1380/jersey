// src/components/.../downloadAllCustomerDebtPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";
import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn";

moment.locale("en");

const fmt = (n) =>
  new Intl.NumberFormat("en-US").format(Number(n || 0));

export function downloadAllCustomerDebtPDF({
  permanent,
  temporary,
  grandTotals,
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
  doc.text("گزارش بدهی همه مشتریان", pageWidth - 40, 55, {
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

  /* ---------- Helper: draw one table ---------- */
  const renderTable = (title, rows, startY) => {
    // Section header
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

    const head = [
      ["باقی مانده", "پرداخت شده", "مجموع", "تعداد بل", "تماس", "مشتری"],
    ];
    const body = rows.map((r) => [
      fmt(r.totalRemaining),
      fmt(r.totalPaid),
      fmt(r.totalAmount),
      r.bills.length,
      r.phoneNumber || "—",
      r.name,
    ]);

    // Table totals row
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

    const foot = [
      [fmt(t.remaining), fmt(t.paid), fmt(t.amount), t.bills, "", "مجموع"],
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

  /* ---------- Table 1: Permanent ---------- */
  let y = renderTable("مشتریان دائمی بدهکار", permanent, 110);

  /* ---------- Table 2: Temporary ---------- */
  // If we're near the bottom of the page, add a new page
  if (y > doc.internal.pageSize.getHeight() - 200) {
    doc.addPage();
    y = 60;
  }
  y = renderTable("مشتریان موقت بدهکار", temporary, y);

  /* ---------- Grand totals ---------- */
  if (y > doc.internal.pageSize.getHeight() - 120) {
    doc.addPage();
    y = 60;
  }

  doc.setFillColor(245, 245, 245);
  doc.rect(40, y, pageWidth - 80, 75, "F");

  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text("خلاصه کلی", pageWidth - 50, y + 20, { align: "right" });
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.text(
    `تعداد مشتریان بدهکار: ${grandTotals.customers || 0}`,
    pageWidth - 50,
    y + 38,
    { align: "right" }
  );
  doc.text(
    `تعداد بل‌ها: ${grandTotals.bills || 0}`,
    pageWidth - 50,
    y + 52,
    { align: "right" }
  );
  doc.text(
    `مجموع کل: ${fmt(grandTotals.amount)} افغانی  —  پرداخت شده: ${fmt(
      grandTotals.paid
    )} افغانی  —  باقی مانده: ${fmt(grandTotals.remaining)} افغانی`,
    pageWidth - 50,
    y + 66,
    { align: "right" }
  );

  /* ---------- Save ---------- */
  doc.save(`All_Customer_Debt_${today}.pdf`);
}