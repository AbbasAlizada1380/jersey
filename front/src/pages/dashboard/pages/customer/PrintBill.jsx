// src/components/bills/PrintBill.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment-jalaali";
import { FaPhone, FaPrint, FaTimes, FaSpinner } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const BRAND = import.meta.env.VITE_BRAND_NAME || "زرین سپورت";

/* ✅ Load Persian locale once */
moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

const PrintBill = ({
  isOpen,
  onClose,
  billId,
  bill: preloadedBill,
  receipt,
  customer,
  autoPrint,
}) => {
  const [bill, setBill] = useState(preloadedBill || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =========================================================
     Fetch bill whenever billId or isOpen changes
     ========================================================= */
  useEffect(() => {
    if (!isOpen) return;

    // Fast path 1: full bill already given
    if (preloadedBill) {
      setBill(preloadedBill);
      setError(null);
      return;
    }

    // Fast path 2: a single receipt given → no fetch needed
    if (receipt) {
      setError(null);
      return;
    }

    if (!billId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${BASE_URL}/bills/${billId}`);
        if (!cancelled) setBill(res.data);
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
  }, [isOpen, billId, preloadedBill, receipt]);

  /* =========================================================
     Normalize: prefer explicit receipt, then fall back to bill
     ========================================================= */
  const effectiveBill = React.useMemo(() => {
    // --- Mode 1: Single receipt ---
    if (receipt) {
      const amt = Number(receipt.amount || 0);
      return {
        id: receipt.id,
        name:
          customer?.fullname ||
          customer?.name ||
          receipt.customerInfo?.fullname ||
          "—",
        phoneNumber:
          customer?.phoneNumber ||
          customer?.phone_number ||
          receipt.customerInfo?.phoneNumber ||
          "—",
        status: "receipt",
        total: amt,
        receipt: [amt],
        remaind: 0,
        createdAt: receipt.createdAt,
        updatedAt: receipt.createdAt,
        _isReceipt: true,
      };
    }

    // --- Mode 2: Bill ---
    if (bill) {
      return { ...bill, _isReceipt: false };
    }

    return null;
  }, [receipt, customer, bill]);

  /* -------- Auto-print once data is loaded -------- */
  useEffect(() => {
    if (autoPrint && isOpen && effectiveBill) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, isOpen, effectiveBill]);

  if (!isOpen) return null;

  /* -------- Loading state -------- */
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg">
          <FaSpinner className="animate-spin text-primary" />
          <span className="text-sm text-gray-700">در حال بارگذاری رسید…</span>
        </div>
      </div>
    );
  }

  /* -------- Error / not found -------- */
  if (error || !effectiveBill) {
    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl px-6 py-4 shadow-lg max-w-sm w-full text-center space-y-3">
          <p className="text-sm text-red-600">{error || "بل یافت نشد"}</p>
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

  /* =========================================================
     Extract display values
     ========================================================= */
  const receiptArr = Array.isArray(effectiveBill.receipt)
    ? effectiveBill.receipt
    : typeof effectiveBill.receipt === "number"
    ? [effectiveBill.receipt]
    : [];

  const paid = receiptArr.reduce((a, b) => a + Number(b || 0), 0);
  const total = Number(effectiveBill.total || 0);
  const remained = Number(effectiveBill.remaind ?? total - paid);

  /* ✅ Shamsi issue date */
  const today = moment().format("jYYYY/jMM/jDD");
  const billNumber = effectiveBill.id ? `${effectiveBill.id}` : "—";

  const customerName =
    effectiveBill.name ||
    effectiveBill.customer?.fullname ||
    effectiveBill.customer?.name ||
    "—";
  const customerPhone =
    effectiveBill.phoneNumber ||
    effectiveBill.customer?.phoneNumber ||
    effectiveBill.customer?.phone_number ||
    "—";

  const formatNumber = (num) => Number(num || 0).toLocaleString("en-US");
  const formatCurrency = (num) => formatNumber(num) + " افغانی";
  const handlePrint = () => window.print();

  /* =========================================================
     Title & status label
     ========================================================= */
  const documentTitle = effectiveBill._isReceipt
    ? "رسید پرداخت"
    : "بل فروش";

  const statusLabel = effectiveBill._isReceipt
    ? "پرداخت موفق"
    : effectiveBill.status === "paid"
    ? "پرداخت شده"
    : effectiveBill.status === "partial"
    ? "پرداخت بخشی"
    : "پرداخت نشده";

  const statusClasses = effectiveBill._isReceipt
    ? "bg-green-100 text-green-800"
    : effectiveBill.status === "paid"
    ? "bg-green-100 text-green-800"
    : effectiveBill.status === "partial"
    ? "bg-yellow-100 text-yellow-800"
    : "bg-red-100 text-red-800";

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 print:bg-transparent print:p-0">
      <div>
        <div
          id="printable-area"
          className="bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col print:shadow-none print:rounded-none"
          style={{ width: "148mm", height: "210mm", direction: "rtl" }}
        >
          {/* ============ Header ============ */}
          <div className="bg-gradient-to-l from-primary to-primary/80 text-white p-4 text-center border-b-4 border-primary">
            <h1 className="text-xl font-bold mb-1">{BRAND}</h1>
            <p className="text-xs opacity-90 mb-1">{documentTitle}</p>
            <div className="flex justify-between items-center mt-2 text-xs">
              <span>شماره: {formatNumber(billNumber)}</span>
              {/* ✅ Shamsi date */}
              <span>تاریخ: {today}</span>
            </div>
          </div>

          {/* ============ Customer ============ */}
          <div className="p-3 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1 border-gray-300">
              معلومات مشتری
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-semibold">نام:</span> {customerName}
              </div>
              <div>
                <span className="font-semibold">شماره تماس:</span>{" "}
                <span dir="ltr" className="inline-block">
                  {customerPhone}
                </span>
              </div>
            </div>
          </div>

          {/* ============ Status Badge ============ */}
          <div className="px-3 pt-3">
            <div className="flex justify-end">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusClasses}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          {/* ============ Payment Table ============ */}
          <div className="flex-1 p-3 overflow-auto">
            {receiptArr.length > 0 ? (
              <div className="mb-4">
                <h2 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1 border-gray-300">
                  {effectiveBill._isReceipt
                    ? "جزئیات پرداخت"
                    : "پرداخت‌های انجام‌شده"}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-gray-300">
                    <thead className="bg-primary/10">
                      <tr>
                        <th className="border border-gray-300 p-1 text-center w-8">
                          #
                        </th>
                        <th className="border border-gray-300 p-1 text-center">
                          مبلغ پرداختی
                        </th>
                        <th className="border border-gray-300 p-1 text-center w-24">
                          تاریخ ثبت
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptArr.map((amount, i) => (
                        <tr key={i} className="hover:bg-primary/5">
                          <td className="border border-gray-300 p-1 text-center">
                            {formatNumber(i + 1)}
                          </td>
                          <td className="border border-gray-300 p-1 text-center font-semibold text-green-700">
                            {formatCurrency(amount)}
                          </td>
                          <td className="border border-gray-300 p-1 text-center text-gray-600">
                            {/* ✅ Shamsi date */}
                            {moment(
                              effectiveBill.updatedAt ||
                                effectiveBill.createdAt
                            ).format("jYYYY/jMM/jDD")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
                هیچ پرداختی ثبت نشده است
              </div>
            )}

            {/* Description block */}
            {effectiveBill._isReceipt && receipt?.description && (
              <div className="mt-3 text-xs text-gray-600 border border-gray-200 rounded p-2 bg-gray-50">
                <span className="font-semibold">توضیحات: </span>
                {receipt.description}
              </div>
            )}
          </div>

          {/* ============ Summary ============ */}
          <div className="border-t border-gray-300 bg-gray-50 p-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-bold border-t border-gray-300 pt-1 text-sm">
                <span>{effectiveBill._isReceipt ? "مبلغ رسید:" : "مجموع کل:"}</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>

              {!effectiveBill._isReceipt && (
                <>
                  <div className="flex justify-between">
                    <span>مقدار پرداختی:</span>
                    <span className="text-green-600">
                      {formatCurrency(paid)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                    <span
                      className={
                        remained > 0 ? "text-red-600" : "text-green-600"
                      }
                    >
                      باقیمانده:
                    </span>
                    <span
                      className={
                        remained > 0 ? "text-red-600" : "text-green-600"
                      }
                    >
                      {formatCurrency(remained)}
                    </span>
                  </div>
                </>
              )}

              {effectiveBill._isReceipt && (
                <div className="flex justify-between text-green-700 font-semibold border-t border-gray-300 pt-1">
                  <span>وضعیت:</span>
                  <span>پرداخت با موفقیت دریافت شد ✓</span>
                </div>
              )}
            </div>
          </div>

          {/* ============ Footer ============ */}
          <div className="bg-primary text-white p-3 text-center text-xs">
            <div className="flex items-center justify-center gap-2">
              <FaPhone className="text-white" />
              <span>تماس: 0777777777</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Action buttons (hidden in print) ============ */}
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
            <FaPrint size={14} />
            {effectiveBill._isReceipt ? "چاپ رسید" : "چاپ بل"}
          </button>
        </div>
      )}

      {/* ============ Print CSS ============ */}
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

export default PrintBill;