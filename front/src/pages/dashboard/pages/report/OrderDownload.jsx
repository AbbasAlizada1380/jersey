import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-jalaali";
import {
  Download,
  Calendar,
  Filter,
  FileText,
  TrendingUp,
  RefreshCw,
  HelpCircle,
  Zap,
  CheckCircle,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_BASE_URL;
import VazirmatnTTF from "../../../../../public/ttf/Vazirmatn.js";
import Regulation from "../Regulations.jsx";

const OrderDownload = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transitWays, setTransitWays] = useState([]);
  const [selectedTransitWay, setSelectedTransitWay] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalWeight: 0,
    totalCash: 0,
  });

  // 🔹 Load transit ways on mount
  useEffect(() => {
    const fetchTransitWays = async () => {
      try {
        setFetching(true);
        const res = await axios.get(`${BASE_URL}/packages/transitWays`);
        setTransitWays(res.data.data || []);
      } catch (error) {
        console.error("Error fetching transit ways:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchTransitWays();
  }, []);

  const handleDownload = async () => {
    if (!startDate || !endDate || !selectedTransitWay) {
      alert("لطفاً تاریخ‌ها و ترانزیت‌وی را انتخاب کنید");
      return;
    }

    try {
      setLoading(true);

      // 🔹 Send transitWay in API request
      const response = await axios.get(
        `${BASE_URL}/packages/Range?startDate=${startDate}&endDate=${endDate}&transitWay=${selectedTransitWay}`
      );
      console.log(response.data);
      const orders = response.data.data;
      if (!orders || orders.length === 0) {
        alert("هیچ سفارشی مطابق این فیلترها یافت نشد");
        return;
      }

      // Calculate statistics
      const totalWeight = orders.reduce(
        (sum, order) => sum + (order.totalWeight || 0),
        0
      );
      const totalCash = orders.reduce(
        (sum, order) => sum + (order.OTotalCash || 0),
        0
      );

      setStats({
        totalOrders: orders.length,
        totalWeight,
        totalCash,
      });

      // ===================== PDF Generation =====================
      const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4",
      });

      doc.addFileToVFS("Vazirmatn.ttf", VazirmatnTTF);
      doc.addFont("Vazirmatn.ttf", "Vazirmatn", "normal");
      doc.setFont("Vazirmatn");

      // Header
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, doc.internal.pageSize.width, 60, "F");

      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text("گزارش سفارشات ترانزیت", doc.internal.pageSize.width - 40, 35, {
        align: "right",
      });

      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `از ${moment(startDate).format("jYYYY/jMM/jDD")} تا ${moment(
          endDate
        ).format("jYYYY/jMM/jDD")} - ${selectedTransitWay}`,
        doc.internal.pageSize.width - 40,
        55,
        { align: "right" }
      );

      // Table headers with better styling
      const headers = [
        [
          "تعداد",
          "تاریخ",
          "مجموع",
          "وزن",
          "قیمت",
          "نام فرستنده",
          "نام گیرنده",
          "شماره بیل",
        ],
      ];

      const data = orders.map((order) => [
        (order.piece || 0).toLocaleString("fa-AF") + " بسته",
        moment(order.createdAt).format("jYYYY/jMM/jDD"),
        (order.OTotalCash || 0).toLocaleString("fa-AF") + " دالر",
        (order.totalWeight || 0).toLocaleString("fa-AF") + " کیلوگرم",
        (order.OPerKgCash || 0).toLocaleString("fa-AF") + " دالر",
        order.Sender?.name || "-",
        order.Receiver?.name || "-",
        order.id,
      ]);

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 80,
        margin: { right: 40, left: 40 },
        styles: {
          font: "Vazirmatn",
          fontStyle: "normal",
          halign: "center",
          fontSize: 9,
          cellPadding: 8,
          lineColor: [229, 231, 235],
          lineWidth: 0.5,
        },
        headStyles: {
          font: "Vazirmatn",
          fontStyle: "bold",
          halign: "center",
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontSize: 10,
          cellPadding: 10,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        didParseCell: function (data) {
          data.cell.styles.font = "Vazirmatn";
          data.cell.styles.fontStyle = "normal";
        },
        theme: "striped",
      });

      // Footer with summary
      const finalY = doc.lastAutoTable.finalY + 30;

      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text("خلاصه گزارش:", doc.internal.pageSize.width - 40, finalY, {
        align: "right",
      });

      doc.setFontSize(10);
      doc.text(
        `تعداد سفارشات: ${
          orders.length
        } | وزن کل: ${totalWeight} کیلوگرم | مجموع مبالغ: ${totalCash.toLocaleString(
          "fa-AF"
        )} افغانی`,
        doc.internal.pageSize.width - 40,
        finalY + 20,
        { align: "right" }
      );

      // Signature
      doc.text("امضاء و مهر:", doc.internal.pageSize.width - 40, finalY + 50, {
        align: "right",
      });
      doc.line(
        doc.internal.pageSize.width - 200,
        finalY + 55,
        doc.internal.pageSize.width - 40,
        finalY + 55
      );

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `تاریخ تولید: ${moment().format("jYYYY/jMM/jDD HH:mm")}`,
        40,
        doc.internal.pageSize.height - 20,
        { align: "left" }
      );
      doc.text(
        "سیستم مدیریت ترانزیت",
        doc.internal.pageSize.width - 40,
        doc.internal.pageSize.height - 20,
        { align: "right" }
      );

      // Save PDF
      doc.save(
        `orders_report_${selectedTransitWay}_${startDate}_to_${endDate}.pdf`
      );
    } catch (error) {
      console.error("Error downloading:", error);
      alert("خطا در دریافت اطلاعات!");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStartDate("");
    setEndDate("");
    setSelectedTransitWay("");
    setStats({ totalOrders: 0, totalWeight: 0, totalCash: 0 });
  };

  return (
    <div className="min-h-screen  w-full P-4 ">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 p-6 bg-white backdrop-blur-sm rounded-md shadow-soft border border-white/40">
            <div className="flex items-center gap-4">
              <div className="relative p-2 md:p-3 bg-primary rounded-2xl shadow-xl">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-gray-900 bg-clip-text text-transparent">
                  گزارش‌گیری سفارشات ترانزیت
                </h1>
                <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">
                  فیلتر و دانلود گزارش سفارشات بر اساس تاریخ و طریق ترانزیت با
                  دقت و جزئیات کامل
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3  px-4 py-3 rounded-md bg-primary border border-gray-200/60">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="text-right space-y-1">
                <div className="text-xs text-gray-100 font-medium">
                  آخرین بروزرسانی
                </div>
                <div className="text-sm font-semibold text-gray-100">
                  امروز {new Date().toLocaleDateString("fa-IR")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Filters */}
          <div className="lg:col-span-2 space-y-8">
            {/* Filters Card */}
            <div className="relative overflow-hidden bg-white rounded-md shadow-md">
              <div className="relative z-10 p-6">
                {/* Header with Icon */}
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200/60">
                  <div className="relative">
                    <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md shadow-lg">
                      <Filter className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      فیلترهای گزارش
                    </h2>
                    <p className="text-gray-600 mt-2 text-sm">
                      محدوده تاریخ و ترانزیت‌وی مورد نظر را انتخاب کنید
                    </p>
                  </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                  {/* Date Range */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center  bg-primary rounded-md">
                        <Calendar className="w-6 h-6 text-gray-100" />
                      </div>
                      <div>
                        <label className="block text-lg font-semibold text-gray-800">
                          محدوده تاریخ
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                          انتخاب تاریخ شروع و پایان گزارش
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="relative group">
                        <div className="relative space-y-2">
                          <div className="  px-3 py-1 text-gray-500 text-xs ">
                            تاریخ شروع
                          </div>
                          <input
                            type="date"
                            className="w-full px-5 py-2.5 bg-gray-200  border-gray-300/60 rounded-md 
                        focus:outline-none focus:ring-1 ring-primary 
                        transition-all duration-300 text-gray-800 text-md font-medium
                        hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-100/50
                        placeholder-gray-400/70 appearance-none"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="relative group">
                        <div className="relative">
                          <div className="  px-3 py-1 text-gray-500 text-xs ">
                            تاریخ پایان
                          </div>
                          <input
                            type="date"
                            className="w-full px-5 py-2.5 bg-gray-200  border-gray-300/60 rounded-md 
                        focus:outline-none focus:ring-1 ring-primary 
                        transition-all duration-300 text-gray-800 text-md font-medium
                        hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-100/50
                        placeholder-gray-400/70 appearance-none"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transit Way Selector */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center bg-primary rounded-md">
                        <div className="relative">
                          <TrendingUp className="w-7 h-7 text-gray-100" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-lg font-semibold text-gray-800">
                          انتخاب ترانزیت‌وی
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                          روش ترانزیت مورد نظر را انتخاب کنید
                        </p>
                      </div>
                    </div>

                    <div className="relative group">
                      <div className="relative space-y-2">
                        <div className="  px-3 py-1 text-gray-500 text-xs ">
                          روش ترانزیت
                        </div>
                        <select
                          value={selectedTransitWay}
                          onChange={(e) =>
                            setSelectedTransitWay(e.target.value)
                          }
                          className="w-full px-5 py-2.5 bg-gray-200  border-gray-300/60 rounded-md 
                        focus:outline-none focus:ring-1 ring-primary 
                        transition-all duration-300 text-gray-800 text-md font-medium
                        hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-100/50
                        placeholder-gray-400/70 appearance-none"
                        >
                          <option value="" className="text-gray-400 py-2">
                            {fetching
                              ? "در حال بارگذاری..."
                              : "انتخاب طریق ترانزیت..."}
                          </option>
                          {transitWays.map((way, index) => (
                            <option
                              key={index}
                              value={way}
                              className="text-gray-800 py-2 bg-white"
                            >
                              {way}
                            </option>
                          ))}
                        </select>

                        <div className="absolute left-4 top-11 transform  pointer-events-none">
                          <svg
                            className="w-5 h-5 text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    {/* {selectedTransitWay && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50/60 rounded-2xl border border-emerald-200/60">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-emerald-800">
                              ترانزیت‌وی انتخاب شده
                            </div>
                            <div className="text-lg font-bold text-gray-800 mt-1">
                              {selectedTransitWay}
                            </div>
                          </div>
                        </div>
                      </div>
                    )} */}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-5 pt-8 border-t border-gray-200/60">
                  <button
                    onClick={handleDownload}
                    disabled={
                      loading || !startDate || !endDate || !selectedTransitWay
                    }
                    className="group relative flex-1 flex items-center justify-center bg-primary cursor-pointer  gap-4 
                text-white py-5 px-8 rounded-md font-bold text-md
                transition-all duration-300 
              overflow-hidden"
                  >
                    {/* Background animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                    {loading ? (
                      <>
                        <div className="relative z-10 w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="relative z-10">
                          در حال تولید گزارش...
                        </span>
                      </>
                    ) : (
                      <>
                        <Download className="w-6 h-6 relative z-10" />
                        <span className="relative z-10">دانلود گزارش PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetForm}
                    className="group relative flex items-center justify-center gap-3 px-8 py-5 
              bg-purple-500 text-white 
                rounded-md font-bold text-lg transition-all duration-300  cursor-pointer
                overflow-hidden"
                  >
                    {/* Background animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent  via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                    <RefreshCw className="w-6 h-6 relative z-10 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="relative z-10">بازنشانی</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            {stats.totalOrders > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative group overflow-hidden bg-gradient-to-br from-white to-emerald-50/60 rounded-3xl p-8 border border-emerald-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100/40 to-teal-100/30 rounded-full -translate-y-10 translate-x-10"></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        تعداد سفارشات
                      </p>
                      <p className="text-4xl font-bold text-gray-800">
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                          {stats.totalOrders.toLocaleString("fa-AF")}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-emerald-600 font-medium">
                          گزارش فعال
                        </span>
                      </div>
                    </div>
                    <div className="relative w-16 h-16 flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FileText className="w-8 h-8 text-white" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-xs font-bold text-white">📈</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group overflow-hidden bg-gradient-to-br from-white to-blue-50/60 rounded-3xl p-8 border border-blue-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/40 to-indigo-100/30 rounded-full -translate-y-10 translate-x-10"></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        وزن کل
                      </p>
                      <p className="text-4xl font-bold text-gray-800">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                          {stats.totalWeight.toLocaleString("fa-AF")}
                        </span>
                        <span className="text-lg font-normal text-gray-500 mr-2">
                          کیلوگرم
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-600 font-medium">
                          وزن قابل محاسبه
                        </span>
                      </div>
                    </div>
                    <div className="relative w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-8 h-8 text-white" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-xs font-bold text-white">⚖️</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group overflow-hidden bg-gradient-to-br from-white to-amber-50/60 rounded-3xl p-8 border border-amber-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100/40 to-orange-100/30 rounded-full -translate-y-10 translate-x-10"></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        مجموع مبالغ
                      </p>
                      <p className="text-4xl font-bold text-gray-800">
                        <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                          {stats.totalCash.toLocaleString("fa-AF")}
                        </span>
                        <span className="text-lg font-normal text-gray-500 mr-2">
                          افغانی
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-amber-600 font-medium">
                          موجودی گزارش
                        </span>
                      </div>
                    </div>
                    <div className="relative w-16 h-16 flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                      </svg>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-xs font-bold text-white">💰</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Instructions */}
          <div className="space-y-8 bg-white rounded-md">
            {/* Instructions Card */}
            <div className=" rounded-md p-8 ">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl">
                  <HelpCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    راهنمای استفاده
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    مراحل تولید گزارش
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                    <span className="text-blue-600 font-bold">۱</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      انتخاب تاریخ
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      محدوده تاریخ گزارش را مشخص کنید
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                    <span className="text-indigo-600 font-bold">۲</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      انتخاب ترانزیت
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      روش ترانزیت مورد نظر را انتخاب کنید
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl">
                    <span className="text-emerald-600 font-bold">۳</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      دانلود گزارش
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      گزارش را در قالب PDF دریافت کنید
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDownload;
