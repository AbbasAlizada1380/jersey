// src/components/customers/CustomerBillsPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";
import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn";

moment.locale("en");

/**
 * @param {Object} options
 * @param {Object} options.customer   - { fullname, phoneNumber }
 * @param {Array}  options.bills      - array of bills to render
 * @param {Object} options.filters    - { status, from, to } (for the header)
 * @param {Number} options.summary    - { total, paid, remaining }
 */
export function downloadCustomerBillsPDF({
  customer,
  bills,
  filters = {},
  summary = { total: 0, paid: 0, remaining: 0 },
}) {
  if (!bills || bills.length === 0) {
    alert("هیچ بلی برای دانلود وجود ندارد");
    return;
  }

  const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  doc.setR2L(false);

  // Font
  doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
  doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
  doc.setFont("Vazirmatn");

  const pageWidth = doc.internal.pageSize.getWidth();
  const today = moment().format("YYYY/MM/DD");

  /* ---------- Title ---------- */
  doc.setFontSize(15);
  doc.text(
    `گزارش بل‌های ${customer?.fullname || "—"}`,
    pageWidth - 40,
    60,
    { align: "right" }
  );

  /* ---------- Subtitle: filters ---------- */
  doc.setFontSize(10);
  const filterParts = [];
  if (filters.status) {
    const statusMap = {
      paid: "پرداخت شده",
      partial: "بخشی",
      unpaid: "پرداخت نشده",
    };
    const statuses = String(filters.status)
      .split(",")
      .map((s) => statusMap[s.trim()] || s.trim())
      .join(" ، ");
    filterParts.push(`وضعیت: ${statuses}`);
  }
  if (filters.from) filterParts.push(`از تاریخ: ${filters.from}`);
  if (filters.to) filterParts.push(`تا تاریخ: ${filters.to}`);
  if (customer?.phoneNumber) filterParts.push(`تماس: ${customer.phoneNumber}`);
  filterParts.push(`تاریخ صدور: ${today}`);

  doc.setTextColor(80, 80, 80);
  doc.text(filterParts.join("  •  "), pageWidth - 40, 82, { align: "right" });

  // Divider
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1);
  doc.line(40, 95, pageWidth - 40, 95);
  doc.setTextColor(0, 0, 0);

  /* ---------- Table ---------- */
  const headers = [
    ["وضعیت", "باقی", "پرداخت شده", "مجموع", "تاریخ", "شماره"],
  ];

  const statusLabel = { paid: "پرداخت شده", partial: "بخشی", unpaid: "پرداخت نشده" };

  const body = bills.map((b) => {
    const paid = Array.isArray(b.receipt)
      ? b.receipt.reduce((a, x) => a + Number(x || 0), 0)
      : 0;
    return [
      statusLabel[b.status] || "—",
      Number(b.remaind || 0).toLocaleString(),
      paid.toLocaleString(),
      Number(b.total || 0).toLocaleString(),
      moment(b.createdAt).format("YYYY/MM/DD"),
      `#${b.id}`,
    ];
  });

  autoTable(doc, {
    startY: 110,
    head: headers,
    body,
    theme: "grid",
    styles: {
      font: "Vazirmatn",
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: 8,
    },
    headStyles: {
      font: "Vazirmatn",
      fontStyle: "normal",
      fillColor: [30, 64, 175], // primary
      textColor: [255, 255, 255],
      fontSize: 10,
      halign: "center",
    },
    didDrawCell: (data) => {
      if (data.cell) data.cell.styles.font = "Vazirmatn";
    },
  });

  /* ---------- Summary ---------- */
  const y = (doc.lastAutoTable?.finalY || 140) + 30;

  doc.setFontSize(11);
  doc.text(
    `تعداد بل‌ها: ${bills.length}`,
    pageWidth - 40,
    y,
    { align: "right" }
  );
  doc.text(
    `مجموع کل: ${Number(summary.total || 0).toLocaleString()} افغانی`,
    pageWidth - 40,
    y + 20,
    { align: "right" }
  );
  doc.text(
    `پرداخت شده: ${Number(summary.paid || 0).toLocaleString()} افغانی`,
    pageWidth - 40,
    y + 40,
    { align: "right" }
  );
  doc.text(
    `باقی مانده: ${Number(summary.remaining || 0).toLocaleString()} افغانی`,
    pageWidth - 40,
    y + 60,
    { align: "right" }
  );

  /* ---------- Save ---------- */
  const safeName = (customer?.fullname || "customer").replace(/\s+/g, "_");
  doc.save(`Bills_${safeName}_${today}.pdf`);
}