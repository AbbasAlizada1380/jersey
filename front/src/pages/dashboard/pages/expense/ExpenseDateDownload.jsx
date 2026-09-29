import { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";

import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";

moment.locale("en");

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ExpenseDateDownload = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!from || !to) {
      alert("لطفاً بازه زمانی را انتخاب کنید");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.get(`${BASE_URL}/expense/date_range`, {
        params: { from, to },
      });

      if (!data?.expenses || data.expenses.length === 0) {
        alert("هیچ هزینه‌ای در این بازه یافت نشد");
        return;
      }

      const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

      // RTL disabled (Vazirmatn handles shaping)
      doc.setR2L(false);

      // Font
      doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
      doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
      doc.setFont("Vazirmatn");

      const formattedFrom = moment(from).format("YYYY/MM/DD");
      const formattedTo = moment(to).format("YYYY/MM/DD");
      const today = moment().format("YYYY/MM/DD");

      // Title
      doc.setFontSize(14);
      doc.text(
        `گزارش هزینه‌ها از ${formattedFrom} تا ${formattedTo}`,
        doc.internal.pageSize.getWidth() - 40,
        120,
        { align: "right" }
      );

      // Table
      const headers = [["مبلغ", "توضیحات", "توسط", "تاریخ", "شماره"]];

      const body = data.expenses.map((expense) => [
        Number(expense.amount).toLocaleString(),
        expense.description || "—",
        expense.by || "نامشخص",
        moment(expense.createdAt).format("YYYY/MM/DD"),
        expense.id.toString(),
      ]);

      autoTable(doc, {
        startY: 140,
        head: headers,
        body: body,
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
          // ✅ primary — matches your theme color
          fillColor: [30, 64, 175], // primary-800 RGB (adjust if your primary is different)
          textColor: [255, 255, 255],
          fontSize: 10,
          halign: "center",
        },
        didDrawCell: (data) => {
          if (data.cell) data.cell.styles.font = "Vazirmatn";
        },
      });

      const y = doc.lastAutoTable.finalY + 30;
      const pageWidth = doc.internal.pageSize.getWidth();

      // Summary
      const totalAmount = data.expenses.reduce(
        (sum, exp) => sum + Number(exp.amount),
        0
      );

      doc.setFontSize(11);
      doc.text(
        `تعداد هزینه‌ها: ${data.expenses.length}`,
        pageWidth - 40,
        y,
        { align: "right" }
      );
      doc.text(
        `مجموع کل: ${totalAmount.toLocaleString()}`,
        pageWidth - 40,
        y + 20,
        { align: "right" }
      );
      doc.text(
        `تاریخ صدور: ${today}`,
        pageWidth - 40,
        y + 40,
        { align: "right" }
      );

      // Save
      doc.save(`Expenses_${formattedFrom}_to_${formattedTo}_${today}.pdf`);
    } catch (err) {
      console.error(err);
      alert("خطا در دریافت اطلاعات هزینه‌ها");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
      <div className="flex items-center gap-2 w-full sm:w-auto text-black">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border border-gray-300 p-2 rounded-lg w-full sm:w-auto bg-white focus:ring-2 focus:ring-primary focus:border-primary transition"
        />
        <span className="text-white">تا</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border border-gray-300 p-2 rounded-lg w-full sm:w-auto bg-white focus:ring-2 focus:ring-primary focus:border-primary transition"
        />
      </div>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-6 py-2 rounded-lg font-medium shadow-md transition w-full sm:w-auto
          disabled:bg-gray-400 disabled:cursor-not-allowed
          bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white"
      >
        {loading ? "در حال ساخت PDF..." : "دانلود گزارش هزینه‌ها"}
      </button>
    </div>
  );
};

export default ExpenseDateDownload;