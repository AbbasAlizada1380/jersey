// src/components/order/PrintOrderBill.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment-jalaali";
import { FaPrint, FaTimes, FaSpinner } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

/* ✅ Load Persian locale once */
moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

const PrintOrderBill = ({ isOpen, onClose, orderId, autoPrint=false }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* -------- Fetch bill -------- */
  useEffect(() => {
    if (!isOpen || !orderId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${BASE_URL}/bills/${orderId}`);
        if (!cancelled) setOrder(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err.message ||
              "خطا در دریافت اطلاعات بل"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, orderId]);

  /* -------- Auto print -------- */
  useEffect(() => {
    if (autoPrint && isOpen && order) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, isOpen, order]);

  if (!isOpen) return null;

  /* -------- Loading -------- */
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg">
          <FaSpinner className="animate-spin text-gray-700" />
          <span className="text-sm text-gray-700">در حال بارگذاری فاکتور…</span>
        </div>
      </div>
    );
  }

  /* -------- Error -------- */
  if (error || !order) {
    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl px-6 py-4 shadow-lg max-w-sm w-full text-center space-y-3">
          <p className="text-sm text-gray-800">{error || "بل یافت نشد"}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg inline-flex items-center gap-2"
          >
            <FaTimes size={14} /> بستن
          </button>
        </div>
      </div>
    );
  }

  /* -------- Normalize -------- */
  const paid = Array.isArray(order.receipt)
    ? order.receipt.reduce((a, b) => a + Number(b || 0), 0)
    : Number(order.received || 0);

  const items = Array.isArray(order.orders)
    ? order.orders.map((o) => {
        const price = Number(o.price || 0);
        const qty = Number(o.quantity || 0);
        const lineTotal =
          Number(o.total) > 0 ? Number(o.total) : price * qty;

        const description = [
          o.jerseyType,
          o.size ? `سایز ${o.size}` : null,
          o.logo ? `لوگو: ${o.logo}` : null,
          o.athleteNumber ? `شماره: ${o.athleteNumber}` : null,
          o.codeNumber ? `کد: ${o.codeNumber}` : null,
        ]
          .filter(Boolean)
          .join(" | ");

        return {
          name: description || "—",
          quantity: qty,
          price_per_unit: price,
          money: lineTotal,
        };
      })
    : [];

  const total = items.reduce((sum, d) => sum + Number(d.money || 0), 0);
  const remained = total - paid;

  const today = moment().format("jYYYY/jMM/jDD");
  const billNumber = order.id
    ? `${order.id}`
    : `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const formatNumber = (num) => Number(num || 0).toLocaleString("en-US");
  const formatCurrency = (num) => formatNumber(num) + " افغانی";
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 print:bg-transparent print:p-0">
      {/* ---------- Printable A5 page ---------- */}
      <div
        id="printable-area"
        className="bg-white shadow-2xl overflow-hidden flex flex-col print:shadow-none"
        style={{
          width: "148mm",
          height: "210mm",
          direction: "rtl",
          fontFamily: "'Vazirmatn', 'Tahoma', sans-serif",
          color: "#111",
        }}
      >
        <div
          className="flex-1 flex flex-col"
          style={{
            paddingTop: "50mm",
            paddingBottom: "30mm",
            paddingLeft: "10mm",
            paddingRight: "10mm",
          }}
        >
                    {/* -------- Bill meta: شماره بل on top of تاریخ -------- */}
          {/* -------- Customer info (TOP of paper) -------- */}
          <div className="mb-2 pr-8">
            <div
              className="text-center gap-x-3 gap-y-0.5 text-[10px] leading-relaxed pt-1"             
            >
             <div
            className="flex flex-col text-[10px] pb-1 gap-0.5"
          
          >           
            <span>
             <span className="font-bold">شماره بل:</span>{" "}  {formatNumber(billNumber)}
            </span>
          </div>
            </div>
          </div>
          <div className="mb-2 pr-8">
            <div
              className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-[10px] leading-relaxed pt-1"
             
            >
              <div>
                <span className="font-semibold">نام مشتری :</span>{" "}
                {order.name || order.customer?.name || "—"}
              </div>
              <div>
                <span className="font-semibold">شماره تماس:</span>{" "}
                <span dir="ltr" className="inline-block">
                  {order.phoneNumber || order.customer?.phone_number || "—"}
                </span>
              </div>
             <div
            className="flex flex-col text-[10px] pb-1 gap-0.5"
          
          >
            
            <span>
              <span className="font-bold">تاریخ:</span> {today}
            </span>
          </div>
            </div>
          </div>

          {/* -------- Items table -------- */}
          <div className="flex-1">
            {items.length > 0 ? (
              <table
                className="w-full text-[10px] border-collapse"
                style={{ border: "1px solid #111" }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f3f3f3" }}>
                    <th
                      className="p-1 text-center font-bold"
                      style={{ border: "1px solid #111", width: "8mm" }}
                    >
                      #
                    </th>
                    <th
                      className="p-1 text-center font-bold"
                      style={{ border: "1px solid #111" }}
                    >
                      شرح
                    </th>
                    <th
                      className="p-1 text-center font-bold"
                      style={{ border: "1px solid #111", width: "12mm" }}
                    >
                      تعداد
                    </th>
                    <th
                      className="p-1 text-center font-bold"
                      style={{ border: "1px solid #111", width: "20mm" }}
                    >
                      قیمت واحد
                    </th>
                    <th
                      className="p-1 text-center font-bold"
                      style={{ border: "1px solid #111", width: "22mm" }}
                    >
                      مبلغ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d, i) => (
                    <tr key={i}>
                      <td
                        className="p-1 text-center"
                        style={{ border: "1px solid #111" }}
                      >
                        {formatNumber(i + 1)}
                      </td>
                      <td
                        className="p-1 text-right"
                        style={{ border: "1px solid #111" }}
                      >
                        {d.name}
                      </td>
                      <td
                        className="p-1 text-center"
                        style={{ border: "1px solid #111" }}
                      >
                        {formatNumber(d.quantity)}
                      </td>
                      <td
                        className="p-1 text-center"
                        style={{ border: "1px solid #111" }}
                      >
                        {formatCurrency(d.price_per_unit)}
                      </td>
                      <td
                        className="p-1 text-center font-semibold"
                        style={{ border: "1px solid #111" }}
                      >
                        {formatCurrency(d.money)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div
                className="text-center py-6 text-gray-600 text-[10px]"
                style={{ border: "1px dashed #999" }}
              >
                هیچ محصولی ثبت نشده است
              </div>
            )}
          </div>

          {/* -------- Summary: signature left, financials right -------- */}
          <div className="mt-3 text-[10px] flex justify-between items-start gap-4">
            {/* Financial data */}
            <div className="min-w-[200px]">
              <div
                className="flex justify-between py-1 font-bold text-[11px]"
                style={{ borderTop: "1.5px solid #111" }}
              >
                <span>مجموع کل:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div
                className="flex justify-between py-1"
                style={{ borderTop: "1px dashed #999" }}
              >
                <span>مقدار پرداختی:</span>
                <span>{formatCurrency(paid)}</span>
              </div>
              <div
                className="flex justify-between py-1 font-bold text-[11px]"
                style={{ borderTop: "1px dashed #999" }}
              >
                <span>باقیمانده:</span>
                <span>{formatCurrency(remained)}</span>
              </div>
            </div>

            {/* Signature section */}
            <div className="flex flex-col items-center justify-end pt-8">
              <div className="w-32 border-t border-dashed border-gray-500 mt-8"></div>
              <span className="text-[10px] text-gray-600 mt-1">امضاء</span>
            </div>
          </div>
        </div>
      </div>

      {/* -------- Buttons (screen only) -------- */}
      {!autoPrint && (
        <div className="absolute bottom-6 left-6 flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors"
          >
            <FaTimes size={14} /> بستن
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors"
          >
            <FaPrint size={14} /> چاپ فاکتور
          </button>
        </div>
      )}

      {/* -------- Print rules -------- */}
      <style jsx global>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 0;
          }
          html,
          body {
            background: #fff !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 148mm !important;
            height: 210mm !important;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          ::-webkit-scrollbar {
            display: none;
          }
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default PrintOrderBill;