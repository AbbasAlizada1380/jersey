import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { FaPhone, FaPrint, FaTimes, FaSpinner } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const BRAND = import.meta.env.VITE_BRAND_NAME;
const PrintOrderBill = ({ isOpen, onClose, orderId, autoPrint }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* -------- Fetch bill whenever orderId or isOpen changes -------- */
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

  /* -------- Auto-print once the data is loaded -------- */
  useEffect(() => {
    if (autoPrint && isOpen && order) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, isOpen, order]);

  if (!isOpen) return null;

  /* -------- Loading / error states -------- */
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg">
          <FaSpinner className="animate-spin text-primary" />
          <span className="text-sm text-gray-700">در حال بارگذاری فاکتور…</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl px-6 py-4 shadow-lg max-w-sm w-full text-center space-y-3">
          <p className="text-sm text-red-600">
            {error || "بل یافت نشد"}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg inline-flex items-center gap-2"
          >
            <FaTimes size={14} /> بستن
          </button>
        </div>
      </div>
    );
  }

  /* -------- Normalize the fetched bill for display -------- */
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

  const today = moment().format("YYYY/MM/DD");
  const billNumber = order.id
    ? `${order.id}`
    : `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const formatNumber = (num) => Number(num || 0).toLocaleString("en-US");
  const formatCurrency = (num) => formatNumber(num) + " افغانی";
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 print:bg-transparent print:p-0">
      <div>
        <div
          id="printable-area"
          className="bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col print:shadow-none print:rounded-none"
          style={{ width: "148mm", height: "210mm", direction: "rtl" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-l from-primary to-primary/80 text-white p-4 text-center border-b-4 border-primary">
            <h1 className="text-xl font-bold mb-1">  {BRAND}</h1>
            <div className="flex justify-between items-center mt-2 text-xs">
              <span>شماره: {formatNumber(billNumber)}</span>
              <span>تاریخ: {today}</span>
            </div>
          </div>

          {/* Customer */}
          <div className="p-3 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1 border-gray-300">
              معلومات مشتری
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-semibold">نام:</span>{" "}
                {order.name || order.customer?.name || "—"}
              </div>
              <div>
                <span className="font-semibold">شماره تماس:</span>{" "}
                <span dir="ltr" className="inline-block">
                  {order.phoneNumber || order.customer?.phone_number || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 p-3 overflow-auto">
            {items.length > 0 ? (
              <div className="mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-gray-300">
                    <thead className="bg-primary/10">
                      <tr>
                        <th className="border border-gray-300 p-1 text-center w-6">#</th>
                        <th className="border border-gray-300 p-1 text-center">شرح</th>
                        <th className="border border-gray-300 p-1 text-center w-12">تعداد</th>
                        <th className="border border-gray-300 p-1 text-center w-20">قیمت واحد</th>
                        <th className="border border-gray-300 p-1 text-center w-20">مبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((d, i) => (
                        <tr key={i} className="hover:bg-primary/5">
                          <td className="border border-gray-300 p-1 text-center">
                            {formatNumber(i + 1)}
                          </td>
                          <td className="border border-gray-300 p-1 text-right">
                            {d.name}
                          </td>
                          <td className="border border-gray-300 p-1 text-center">
                            {formatNumber(d.quantity)}
                          </td>
                          <td className="border border-gray-300 p-1 text-center">
                            {formatCurrency(d.price_per_unit)}
                          </td>
                          <td className="border border-gray-300 p-1 text-center font-semibold">
                            {formatCurrency(d.money)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-1 text-xs font-bold text-primary">
                  مجموع: {formatCurrency(total)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
                هیچ محصولی ثبت نشده است
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border-t border-gray-300 bg-gray-50 p-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-bold border-t border-gray-300 pt-1 text-sm">
                <span>مجموع کل:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>مقدار پرداختی:</span>
                <span className="text-green-600">
                  {formatCurrency(paid)}
                </span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                <span className={remained > 0 ? "text-red-600" : "text-green-600"}>
                  باقیمانده:
                </span>
                <span className={remained > 0 ? "text-red-600" : "text-green-600"}>
                  {formatCurrency(remained)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-primary text-white p-3 text-center text-xs">
            <div className="flex items-center justify-center gap-2">
              <FaPhone className="text-white" />
              <span>تماس: 0777777777</span>
            </div>
          </div>
        </div>
      </div>

      {!autoPrint && (
        <div className="absolute bottom-6 left-6 flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors"
          >
            <FaTimes size={14} /> بستن
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors"
          >
            <FaPrint size={14} /> چاپ فاکتور
          </button>
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 0;
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