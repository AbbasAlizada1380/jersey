import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaFileInvoiceDollar,
  FaTimes,
  FaSpinner,
  FaEye,
  FaUser,
  FaPhone,
  FaClock,
  FaBoxOpen,
  FaMoneyBillWave,
  FaReceipt,
  FaCheckCircle,
} from "react-icons/fa";
import CustomerReceipts from "./CustomerReceipts";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const LIMIT = 10;

/* ---------------- Formatting helpers ---------------- */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "۰ افغانی";
  return new Intl.NumberFormat("en-US").format(Number(amount)) + " افغانی";
};

const formatDate = (d) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB").format(new Date(d));
};

const statusBadge = (status) => {
  const map = {
    paid: { label: "پرداخت شده", cls: "bg-green-100 text-green-800" },
    partial: { label: "بخشی", cls: "bg-yellow-100 text-yellow-800" },
    unpaid: { label: "پرداخت نشده", cls: "bg-red-100 text-red-800" },
  };
  const s = map[status] || map.unpaid;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
};

const customerTypeBadge = (type) => {
  if (type === "permanent") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <FaUser className="text-[10px]" />
        دائم
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      <FaClock className="text-[10px]" />
      موقت
    </span>
  );
};

/* =========================================================
   Bill detail panel (right column)
   ========================================================= */
function BillDetail({ bill, loading, onClose }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
        <FaSpinner className="text-3xl text-primary animate-spin mx-auto mb-3" />
        <p className="text-gray-600">در حال بارگذاری جزئیات...</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
          <FaEye className="text-primary text-2xl" />
        </div>
        <p className="text-gray-500">یک بل را از لیست انتخاب کنید</p>
        <p className="text-gray-400 text-xs mt-1">
          جزئیات و سفارش‌های آن اینجا نمایش داده می‌شود
        </p>
      </div>
    );
  }

  const paid = Array.isArray(bill.receipt)
    ? bill.receipt.reduce((a, b) => a + Number(b || 0), 0)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <FaFileInvoiceDollar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">بل #{bill.id}</h3>
            <p className="text-xs text-white/80">
              {formatDate(bill.createdAt)}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="بستن جزئیات"
          >
            <FaTimes />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">
              اطلاعات مشتری
            </span>
            {customerTypeBadge(bill.customerType)}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-800">
              <FaUser className="text-primary text-xs" />
              <span className="font-medium">{bill.name || "—"}</span>
            </div>
            {bill.phoneNumber && (
              <div className="flex items-center gap-2 text-gray-600" dir="ltr">
                <FaPhone className="text-primary text-xs" />
                <span>{bill.phoneNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-[11px] text-gray-500 mb-1">مجموع</p>
            <p className="text-sm font-bold text-gray-900">
              {formatCurrency(bill.total)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[11px] text-emerald-600 mb-1">پرداخت شده</p>
            <p className="text-sm font-bold text-emerald-700">
              {formatCurrency(paid)}
            </p>
          </div>
          <div
            className={`rounded-xl border p-3 ${Number(bill.remaind) > 0
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50"
              }`}
          >
            <p className="text-[11px] text-gray-500 mb-1">باقی مانده</p>
            <p
              className={`text-sm font-bold ${Number(bill.remaind) > 0 ? "text-red-600" : "text-green-600"
                }`}
            >
              {formatCurrency(bill.remaind)}
            </p>
          </div>
        </div>

        {Array.isArray(bill.receipt) && bill.receipt.length > 0 && (
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              پرداخت‌ها ({bill.receipt.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {bill.receipt.map((amount, i) => (
                <span
                  key={i}
                  className="inline-block font-mono text-xs bg-gray-100 border border-gray-200 rounded px-2 py-1"
                  dir="ltr"
                >
                  {Number(amount).toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">
              <FaBoxOpen className="text-primary" />
              سفارش‌ها ({bill.orders?.length || 0})
            </p>
            {statusBadge(bill.status)}
          </div>

          {bill.orders && bill.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-right font-medium text-gray-600">
                      سایز
                    </th>
                    <th className="p-2 text-right font-medium text-gray-600">
                      تعداد
                    </th>
                    <th className="p-2 text-right font-medium text-gray-600">
                      شماره
                    </th>
                    <th className="p-2 text-right font-medium text-gray-600">
                      نوع
                    </th>
                    <th className="p-2 text-right font-medium text-gray-600">
                      قیمت
                    </th>
                    <th className="p-2 text-right font-medium text-gray-600">
                      جمع
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bill.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="p-2 text-gray-800 font-medium">
                        {o.size}
                      </td>
                      <td className="p-2 text-gray-700">{o.quantity}</td>
                      <td className="p-2 text-gray-700">
                        {o.athleteNumber || "—"}
                      </td>
                      <td className="p-2 text-gray-700">{o.jerseyType}</td>
                      <td className="p-2 text-gray-700">
                        {Number(o.price).toLocaleString()}
                      </td>
                      <td className="p-2 font-semibold text-primary">
                        {Number(o.total).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">
              سفارشی ثبت نشده
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Main component
   ========================================================= */
export default function CustomerBills({ customer, onClose, onPaid }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [receiptsKey, setReceiptsKey] = useState(0);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* ---------------- Payment state ---------------- */
  const [payAmount, setPayAmount] = useState("");
  const [payDescription, setPayDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  /* ---------------- Summary ---------------- */
  const summary = bills.reduce(
    (acc, b) => {
      acc.total += Number(b.total) || 0;
      acc.paid += (Array.isArray(b.receipt) ? b.receipt : []).reduce(
        (s, n) => s + (Number(n) || 0),
        0
      );
      acc.remaining += Number(b.remaind) || 0;
      return acc;
    },
    { total: 0, paid: 0, remaining: 0 }
  );

  /* Only permanent customers can use the pay endpoint */
  const canPay =
    customer?.id && summary.remaining > 0 && bills.length > 0;

  const numericPayAmount = Number(payAmount) || 0;
  const remainingAfter = Math.max(summary.remaining - numericPayAmount, 0);
  const overpay = Math.max(numericPayAmount - summary.remaining, 0);

  /* ---------------- Fetch bills ---------------- */
  const fetchBills = async (p = 1) => {
    if (!customer?.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${BASE_URL}/bills`, {
        params: {
          customer: customer.id,
          customerType: "permanent",
          page: p,
          limit: LIMIT,
        },
      });
      setBills(res.data.bills || []);
      setPage(res.data.pagination?.currentPage || p);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        "خطا در دریافت بل‌های مشتری"
      );
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(1);
    setSelectedBill(null);
    setPayAmount("");
    setPayDescription("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  /* ---------------- Open bill detail ---------------- */
  const openBillDetail = async (billId) => {
    if (selectedBill?.id === billId) {
      setSelectedBill(null);
      return;
    }
    try {
      setLoadingDetail(true);
      const res = await axios.get(`${BASE_URL}/bills/${billId}`);
      setSelectedBill(res.data);
    } catch (err) {
      setError("خطا در دریافت جزئیات بل");
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ---------------- Submit payment ---------------- */
  const handlePay = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customer?.id) return;
    if (numericPayAmount <= 0) {
      setError("مبلغ پرداختی باید بزرگ‌تر از صفر باشد");
      return;
    }
    if (numericPayAmount > summary.remaining) {
      const ok = window.confirm(
        `مبلغ پرداختی از مجموع بدهی (${formatCurrency(
          summary.remaining
        )}) بیشتر است. آیا ادامه می‌دهید؟`
      );
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE_URL}/bills/pay-permanent`, {
        customer: customer.id,
        amount: numericPayAmount,
        description: payDescription?.trim() || null,
      });

      const data = res.data || {};
      const paidAmount = data.paid ?? numericPayAmount;
      const allocs = Array.isArray(data.allocations) ? data.allocations : [];

      setSuccessMessage(
        `پرداخت ${formatCurrency(paidAmount)} ثبت شد${allocs.length > 0 ? ` (${allocs.length} بل)` : ""
        }`
      );
      setReceiptsKey((k) => k + 1);
      /* Reset form */
      setPayAmount("");
      setPayDescription("");

      /* Refresh the bill list + selected detail */
      await fetchBills(1);
      if (selectedBill) {
        try {
          const refreshed = await axios.get(
            `${BASE_URL}/bills/${selectedBill.id}`
          );
          setSelectedBill(refreshed.data);
        } catch (e) {
          setSelectedBill(null);
        }
      }

      onPaid?.(data);

      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        "خطا در ثبت پرداخت"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!customer) return null;

  const hasSelection = Boolean(selectedBill);

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      {/* Success toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 animate-slideDown">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-600" />
              </div>
              <p className="flex-1 text-green-700">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="p-1 hover:bg-green-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-green-600 text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/20 rounded-full flex-shrink-0">
              <FaFileInvoiceDollar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">
                بل‌های {customer.fullname}
              </h2>
              <p className="text-sm text-white/80">
                {totalItems} بل ثبت شده
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              title="بستن"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Customer strip */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <FaUser className="text-primary text-xs" />
            <span className="font-medium">{customer.fullname}</span>
          </div>
          {customer.phoneNumber && (
            <div className="flex items-center gap-2 text-gray-600" dir="ltr">
              <FaPhone className="text-primary text-xs" />
              <span>{customer.phoneNumber}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 max-h-[75vh] overflow-y-auto space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ---------- Payment bar (only when there's debt) ---------- */}
        {canPay && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-primary/15 rounded-lg">
                <FaMoneyBillWave className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  ثبت پرداخت برای مشتری
                </h3>
                <p className="text-xs text-gray-500">
                  مبلغ به‌صورت خودکار روی قدیمی‌ترین بل‌ها اعمال می‌شود
                </p>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Amount */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <span className="text-red-500">*</span> مبلغ
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="۰"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary"
                    disabled={submitting}
                    required
                  />
                  {/* Quick buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(summary.remaining))}
                      className="px-2 py-1 rounded-lg text-[11px] bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
                      پرداخت کامل
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPayAmount(
                          String(Math.round(summary.remaining / 2))
                        )
                      }
                      className="px-2 py-1 rounded-lg text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    >
                      نصف
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    توضیحات (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={payDescription}
                    onChange={(e) => setPayDescription(e.target.value)}
                    placeholder="مثال: پرداخت نقدی در دفتر"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Live preview */}
              {numericPayAmount > 0 && (
                <div className="rounded-xl bg-white border border-gray-200 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                  <span className="text-gray-600">
                    باقی‌مانده پس از پرداخت:
                    <span
                      className={`font-semibold ml-1 ${remainingAfter > 0
                        ? "text-red-600"
                        : "text-green-600"
                        }`}
                    >
                      {formatCurrency(remainingAfter)}
                    </span>
                  </span>
                  {overpay > 0 && (
                    <span className="text-yellow-700">
                      اضافه پرداخت:{" "}
                      <span className="font-semibold">
                        {formatCurrency(overpay)}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || numericPayAmount <= 0}
                  className={`px-5 py-2.5 rounded-xl font-medium shadow-sm transition flex items-center gap-2 ${submitting || numericPayAmount <= 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-white"
                    }`}
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      در حال ثبت...
                    </>
                  ) : (
                    <>
                      <FaReceipt />
                      ثبت پرداخت
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary cards */}
        {!loading && bills.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-1">مجموع بل‌ها</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(summary.total)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs text-emerald-600 mb-1">پرداخت شده</p>
              <p className="text-lg font-bold text-emerald-700">
                {formatCurrency(summary.paid)}
              </p>
            </div>
            <div
              className={`rounded-xl border p-3 ${summary.remaining > 0
                ? "border-red-200 bg-red-50"
                : "border-green-200 bg-green-50"
                }`}
            >
              <p className="text-xs text-gray-500 mb-1">باقی مانده</p>
              <p
                className={`text-lg font-bold ${summary.remaining > 0
                  ? "text-red-600"
                  : "text-green-600"
                  }`}
              >
                {formatCurrency(summary.remaining)}
              </p>
            </div>
          </div>
        )}
        {/* ---------- Receipts panel ---------- */}
        {customer?.id && (
          <CustomerReceipts
            customer={customer}
            refreshKey={receiptsKey}
            compact
          />
        )}
        {/* Two-column layout */}
        <div
          className={`grid gap-4 ${hasSelection ? "lg:grid-cols-5" : "grid-cols-1"
            }`}
        >
          <div className={hasSelection ? "lg:col-span-3" : ""}>
            {loading ? (
              <div className="py-12 text-center">
                <FaSpinner className="text-3xl text-primary animate-spin mx-auto mb-3" />
                <p className="text-gray-600">در حال بارگذاری بل‌ها...</p>
              </div>
            ) : bills.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <FaFileInvoiceDollar className="text-primary text-2xl" />
                </div>
                <p className="text-gray-500">
                  هیچ بلی برای این مشتری ثبت نشده
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  از صفحه بل‌ها می‌توانید بل جدید بسازید
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-primary to-primary/80">
                    <tr>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                        #
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                        مجموع
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                        باقی
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                        وضعیت
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                        تاریخ
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                        عملیات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {bills.map((b) => {
                      const isSelected = selectedBill?.id === b.id;
                      return (
                        <tr
                          key={b.id}
                          onClick={() => openBillDetail(b.id)}
                          className={`cursor-pointer transition ${isSelected
                            ? "bg-primary/10 hover:bg-primary/15"
                            : "hover:bg-gray-50"
                            }`}
                        >
                          <td className="px-3 py-3 text-sm font-semibold text-primary">
                            #{b.id}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-800">
                            {formatCurrency(b.total)}
                          </td>
                          <td
                            className={`px-3 py-3 text-sm font-semibold ${Number(b.remaind) > 0
                              ? "text-red-600"
                              : "text-green-600"
                              }`}
                          >
                            {formatCurrency(b.remaind)}
                          </td>
                          <td className="px-3 py-3">
                            {statusBadge(b.status)}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600">
                            {formatDate(b.createdAt)}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openBillDetail(b.id);
                              }}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                              title="مشاهده جزئیات"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3">
                <button
                  onClick={() => fetchBills(page - 1)}
                  disabled={page <= 1}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${page <= 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                >
                  قبلی
                </button>
                <span className="text-sm text-gray-600">
                  صفحه {page} از {totalPages}
                </span>
                <button
                  onClick={() => fetchBills(page + 1)}
                  disabled={page >= totalPages}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${page >= totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                >
                  بعدی
                </button>
              </div>
            )}
          </div>

          <div className={hasSelection ? "lg:col-span-2" : "hidden"}>
            {hasSelection && (
              <BillDetail
                bill={selectedBill}
                loading={loadingDetail}
                onClose={() => setSelectedBill(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}