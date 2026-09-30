import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaUser,
  FaPhone,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimes,
  FaSpinner,
  FaExclamationTriangle,
  FaReceipt,
  FaChevronLeft,
} from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const LIMIT = 20;

/* ---------------- helpers ---------------- */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "۰ افغانی";
  return new Intl.NumberFormat("en-US").format(Number(amount)) + " افغانی";
};

const formatDate = (d) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB").format(new Date(d));
};

const statusBadge = (status) => {
  if (status === "partial") {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        بخشی
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
      پرداخت نشده
    </span>
  );
};

export default function PermanentDebtors({ refreshKey = 0, onPaid }) {
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /* Selected customer + their bills */
  const [selected, setSelected] = useState(null);
  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);

  /* Payment form */
  const [payAmount, setPayAmount] = useState("");
  const [payDescription, setPayDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- Fetch debtors ---------------- */
  const fetchDebtors = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${BASE_URL}/bills`, {
        params: {
          customerType: "permanent",
          status: "unpaid,partial",
          page: p,
          limit: LIMIT,
        },
      });

      // Group bills by customer, so we show one row per debtor
      const rows = res.data.bills || [];
      const byCustomer = new Map();

      for (const b of rows) {
        if (!b.customer) continue;
        if (!byCustomer.has(b.customer)) {
          byCustomer.set(b.customer, {
            customerId: b.customer,
            name: b.name,
            phoneNumber: b.phoneNumber,
            bills: [],
            totalOwed: 0,
          });
        }
        const entry = byCustomer.get(b.customer);
        entry.bills.push(b);
        entry.totalOwed += Number(b.remaind) || 0;
      }

      const grouped = Array.from(byCustomer.values());

      setDebtors(grouped);
      setPage(res.data.pagination?.currentPage || p);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "خطا در دریافت بدهکاران"
      );
      setDebtors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebtors(1);
    setSelected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  /* ---------------- Open a debtor ---------------- */
  const openCustomer = async (debtor) => {
    if (selected?.customerId === debtor.customerId) {
      setSelected(null);
      setBills([]);
      return;
    }

    setSelected(debtor);
    setPayAmount("");
    setPayDescription("");
    setLoadingBills(true);
    setError(null);

    try {
      const res = await axios.get(`${BASE_URL}/bills`, {
        params: {
          customer: debtor.customerId,
          customerType: "permanent",
          status: "unpaid,partial",
          page: 1,
          limit: 100,
        },
      });
      setBills(res.data.bills || []);
    } catch (err) {
      setError("خطا در دریافت بل‌های مشتری");
      setBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  /* ---------------- Derived ---------------- */
  const totalOwed = bills.reduce(
    (sum, b) => sum + Number(b.remaind || 0),
    0
  );
  const numericPayAmount = Number(payAmount) || 0;
  const remainingAfter = Math.max(totalOwed - numericPayAmount, 0);
  const overpay = Math.max(numericPayAmount - totalOwed, 0);

  /* ---------------- Submit payment ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selected) return;
    if (numericPayAmount <= 0) {
      setError("مبلغ پرداختی باید بزرگ‌تر از صفر باشد");
      return;
    }
    if (numericPayAmount > totalOwed) {
      const ok = window.confirm(
        `مبلغ پرداختی از مجموع بدهی (${formatCurrency(
          totalOwed
        )}) بیشتر است. آیا ادامه می‌دهید؟`
      );
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE_URL}/bills/pay-permanent`, {
        customer: selected.customerId,
        amount: numericPayAmount,
        description: payDescription?.trim() || null,
      });

      const data = res.data || {};
      const paid = data.paid ?? numericPayAmount;
      const allocs = Array.isArray(data.allocations) ? data.allocations : [];

      setSuccessMessage(
        `پرداخت ${formatCurrency(paid)} ثبت شد${
          allocs.length > 0 ? ` (${allocs.length} بل)` : ""
        }`
      );

      /* Reset the payment fields */
      setPayAmount("");
      setPayDescription("");

      /* Refresh the bill list for this customer */
      await openCustomerRefresh(selected.customerId);

      /* Notify parent */
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

  /* Refresh open customer's bills without toggling closed */
  const openCustomerRefresh = async (customerId) => {
    try {
      setLoadingBills(true);
      const res = await axios.get(`${BASE_URL}/bills`, {
        params: {
          customer: customerId,
          customerType: "permanent",
          status: "unpaid,partial",
          page: 1,
          limit: 100,
        },
      });
      const nextBills = res.data.bills || [];
      setBills(nextBills);

      /* Update the debtor row's total owed in the list */
      setDebtors((prev) =>
        prev.map((d) =>
          d.customerId === customerId
            ? {
                ...d,
                bills: nextBills,
                totalOwed: nextBills.reduce(
                  (s, b) => s + Number(b.remaind || 0),
                  0
                ),
              }
            : d
        )
      );

      /* If the customer has no more debt, close them */
      if (nextBills.length === 0) {
        setSelected(null);
      }
    } catch (err) {
      console.error("refresh customer bills error:", err);
    } finally {
      setLoadingBills(false);
    }
  };

  /* ---------------- Render ---------------- */
  const hasSelection = Boolean(selected);

  return (
    <div className="space-y-4">
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Grid: debtors list + payment panel */}
      <div
        className={`grid gap-4 ${
          hasSelection ? "lg:grid-cols-5" : "grid-cols-1"
        }`}
      >
        {/* -------- Debtors list -------- */}
        <div className={hasSelection ? "lg:col-span-3" : ""}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <FaExclamationTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    مشتریان دائمی بدهکار
                  </h2>
                  <p className="text-xs text-white/80">
                    {debtors.length} مشتری با بل پرداخت‌نشده یا بخشی
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <FaSpinner className="text-3xl text-primary animate-spin mx-auto mb-3" />
                <p className="text-gray-600">در حال بارگذاری...</p>
              </div>
            ) : debtors.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <FaCheckCircle className="text-primary text-2xl" />
                </div>
                <p className="text-gray-500">
                  هیچ مشتری دائم بدهکاری وجود ندارد
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        مشتری
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        شماره تماس
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        تعداد بل
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        مجموع بدهی
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        عملیات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {debtors.map((d) => {
                      const isSelected = selected?.customerId === d.customerId;
                      return (
                        <tr
                          key={d.customerId}
                          onClick={() => openCustomer(d)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? "bg-primary/10 hover:bg-primary/15"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-primary/10 rounded-full">
                                <FaUser className="text-primary text-xs" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {d.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  #{d.customerId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            className="px-4 py-3 text-sm text-gray-700"
                            dir="ltr"
                          >
                            {d.phoneNumber || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {d.bills.length}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-red-600">
                              {formatCurrency(d.totalOwed)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCustomer(d);
                              }}
                              className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 text-xs font-medium transition flex items-center gap-1 mx-auto"
                            >
                              <FaReceipt className="text-[10px]" />
                              پرداخت
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <button
                  onClick={() => fetchDebtors(page - 1)}
                  disabled={page <= 1}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    page <= 1
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
                  onClick={() => fetchDebtors(page + 1)}
                  disabled={page >= totalPages}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    page >= totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  بعدی
                </button>
              </div>
            )}
          </div>
        </div>

        {/* -------- Payment panel -------- */}
        {hasSelection && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <FaMoneyBillWave className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{selected.name}</h3>
                    <p className="text-xs text-white/80" dir="ltr">
                      {selected.phoneNumber || "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelected(null);
                    setBills([]);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                  title="بستن"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-[11px] text-red-600 mb-1">
                      مجموع بدهی
                    </p>
                    <p className="text-sm font-bold text-red-700">
                      {formatCurrency(totalOwed)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-3">
                    <p className="text-[11px] text-gray-500 mb-1">
                      تعداد بل
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {bills.length}
                    </p>
                  </div>
                </div>

                {/* Payment form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <span className="text-red-500">*</span> مبلغ پرداختی
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="۰"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary"
                      disabled={submitting}
                      required
                    />
                    {/* Quick buttons */}
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setPayAmount(String(totalOwed))}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-primary/10 text-primary hover:bg-primary/20 transition"
                      >
                        پرداخت کامل
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPayAmount(String(Math.round(totalOwed / 2)))
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                      >
                        نصف
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      توضیحات (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={payDescription}
                      onChange={(e) => setPayDescription(e.target.value)}
                      placeholder="مثال: پرداخت نقدی در دفتر"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      disabled={submitting}
                    />
                  </div>

                  {/* Live preview */}
                  {numericPayAmount > 0 && (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          باقی‌مانده پس از پرداخت:
                        </span>
                        <span
                          className={`font-semibold ${
                            remainingAfter > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {formatCurrency(remainingAfter)}
                        </span>
                      </div>
                      {overpay > 0 && (
                        <div className="flex justify-between text-yellow-700">
                          <span>اضافه پرداخت:</span>
                          <span className="font-semibold">
                            {formatCurrency(overpay)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      numericPayAmount <= 0 ||
                      bills.length === 0
                    }
                    className={`w-full px-4 py-3 rounded-xl font-medium shadow-md transition flex items-center justify-center gap-2 ${
                      submitting ||
                      numericPayAmount <= 0 ||
                      bills.length === 0
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
                </form>

                {/* Bills list */}
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                    بل‌های بدهکار ({bills.length})
                  </div>

                  {loadingBills ? (
                    <div className="py-8 text-center">
                      <FaSpinner className="text-xl text-primary animate-spin mx-auto mb-2" />
                      <p className="text-xs text-gray-500">
                        در حال بارگذاری...
                      </p>
                    </div>
                  ) : bills.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-500">
                      هیچ بل بدهکاری باقی نمانده
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                      {bills.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 flex items-center justify-between text-xs hover:bg-gray-50"
                        >
                          <div>
                            <div className="font-semibold text-primary">
                              #{b.id}
                            </div>
                            <div className="text-gray-500">
                              {formatDate(b.createdAt)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-red-600">
                              {formatCurrency(b.remaind)}
                            </div>
                            {statusBadge(b.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}