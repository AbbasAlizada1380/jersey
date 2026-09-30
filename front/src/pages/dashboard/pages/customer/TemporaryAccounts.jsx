import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaUserClock,
  FaFilter,
  FaDownload,
  FaSpinner,
  FaTimes,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaEdit,
} from "react-icons/fa";
import { downloadTemporaryAccountsPDF } from "./downloadTemporaryAccountsPDF";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const LIMIT = 15;

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

/* ---------------- main component ---------------- */
export default function TemporaryAccounts({ refreshKey = 0, onEdit }) {
  /* filters */
  const [statuses, setStatuses] = useState(["unpaid", "partial"]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  /* data */
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({
    totalBills: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalRemaining: 0,
    unpaidCount: 0,
    partialCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /* ---------------- fetch ---------------- */
  const fetchDebtors = useCallback(
    async (p = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = { page: p, limit: LIMIT };
        if (statuses.length > 0 && statuses.length < 2) {
          params.status = statuses.join(",");
        }
        if (from) params.from = from;
        if (to) params.to = to;

        const res = await axios.get(
          `${BASE_URL}/bills/temporary-debtors`,
          { params }
        );

        setBills(res.data.bills || []);
        setSummary(res.data.summary || {});
        setPage(res.data.pagination?.currentPage || p);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalItems(res.data.pagination?.totalItems || 0);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "خطا در دریافت حساب‌ها"
        );
        setBills([]);
      } finally {
        setLoading(false);
      }
    },
    [statuses, from, to]
  );

  useEffect(() => {
    fetchDebtors(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, from, to, refreshKey]);

  /* ---------------- handlers ---------------- */
  const toggleStatus = (s) => {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const clearFilters = () => {
    setStatuses(["unpaid", "partial"]);
    setFrom("");
    setTo("");
  };

  /* ---------------- edit ---------------- */
  const handleEditClick = async (billId, e) => {
    e?.stopPropagation();
    if (!onEdit) return;

    try {
      // Fetch the full bill (with orders) before handing it up
      const res = await axios.get(`${BASE_URL}/bills/${billId}`);
      onEdit(res.data);
    } catch (err) {
      alert("خطا در دریافت اطلاعات بل");
    }
  };

  /* ---------------- download ---------------- */
  const handleDownload = async () => {
    try {
      setDownloading(true);

      const params = { page: 1, limit: 10000 };
      if (statuses.length > 0 && statuses.length < 2) {
        params.status = statuses.join(",");
      }
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await axios.get(
        `${BASE_URL}/bills/temporary-debtors`,
        { params }
      );
      const allBills = res.data.bills || [];

      if (allBills.length === 0) {
        alert("هیچ حسابی برای دانلود وجود ندارد");
        return;
      }

      downloadTemporaryAccountsPDF({
        bills: allBills,
        summary: res.data.summary || {},
        filters: {
          status: statuses.join(",") || null,
          from: from || null,
          to: to || null,
        },
      });
    } catch (err) {
      alert("خطا در آماده‌سازی گزارش");
    } finally {
      setDownloading(false);
    }
  };

  /* ---------------- render ---------------- */
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <FaUserClock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">حساب مشتریان موقت</h3>
            <p className="text-xs text-white/80">
              بدهکاران با بل پرداخت‌نشده یا بخشی
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading || bills.length === 0}
          className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition self-start md:self-auto ${
            downloading || bills.length === 0
              ? "bg-white/20 text-white/60 cursor-not-allowed"
              : "bg-white text-primary hover:bg-white/90"
          }`}
          title="دانلود گزارش PDF"
        >
          {downloading ? (
            <>
              <FaSpinner className="animate-spin" />
              در حال آماده‌سازی...
            </>
          ) : (
            <>
              <FaDownload />
              دانلود PDF
            </>
          )}
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-gray-50 border-b border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
          <FaFilter className="text-primary text-xs" />
          فیلترها
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggleStatus("unpaid")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              statuses.includes("unpaid")
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-red-700 border-gray-300 hover:border-red-500"
            }`}
          >
            پرداخت نشده
          </button>
          <button
            type="button"
            onClick={() => toggleStatus("partial")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              statuses.includes("partial")
                ? "bg-yellow-500 text-white border-yellow-500"
                : "bg-white text-yellow-700 border-gray-300 hover:border-yellow-500"
            }`}
          >
            بخشی
          </button>
          {(from || to || statuses.length !== 2) && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-200 transition flex items-center gap-1"
            >
              <FaTimes className="text-[10px]" />
              پاک کردن
            </button>
          )}
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">از تاریخ</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">تا تاریخ</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 border-b border-gray-100">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-500 mb-1">تعداد بل‌های بدهکار</p>
          <p className="text-lg font-bold text-gray-900">
            {summary.totalBills || 0}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            {summary.unpaidCount || 0} پرداخت‌نشده •{" "}
            {summary.partialCount || 0} بخشی
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-1">مجموع کل</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(summary.totalAmount)}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs text-emerald-600 mb-1">پرداخت شده</p>
          <p className="text-lg font-bold text-emerald-700">
            {formatCurrency(summary.totalPaid)}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-600 mb-1 flex items-center gap-1">
            <FaExclamationTriangle className="text-[10px]" />
            باقی مانده
          </p>
          <p className="text-lg font-bold text-red-700">
            {formatCurrency(summary.totalRemaining)}
          </p>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="p-4">
        {loading ? (
          <div className="py-12 text-center">
            <FaSpinner className="text-3xl text-primary animate-spin mx-auto mb-3" />
            <p className="text-gray-600">در حال بارگذاری...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <FaUserClock className="text-primary text-2xl" />
            </div>
            <p className="text-gray-500">
              هیچ حساب بدهکاری برای مشتریان موقت وجود ندارد
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
                    مشتری
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                    شماره تماس
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                    مجموع
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                    پرداخت شده
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
                  {onEdit && (
                    <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase">
                      عملیات
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {bills.map((b) => {
                  const paid = Array.isArray(b.receipt)
                    ? b.receipt.reduce((a, x) => a + Number(x || 0), 0)
                    : 0;
                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-primary/5 transition"
                    >
                      <td className="px-3 py-3 text-sm font-semibold text-primary">
                        #{b.id}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">
                        {b.name || "—"}
                      </td>
                      <td
                        className="px-3 py-3 text-sm text-gray-700"
                        dir="ltr"
                      >
                        {b.phoneNumber || "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-800">
                        {formatCurrency(b.total)}
                      </td>
                      <td className="px-3 py-3 text-sm text-emerald-700 font-medium">
                        {formatCurrency(paid)}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-red-600">
                        {formatCurrency(b.remaind)}
                      </td>
                      <td className="px-3 py-3">{statusBadge(b.status)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        {formatDate(b.createdAt)}
                      </td>
                      {onEdit && (
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={(e) => handleEditClick(b.id, e)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                            title="ویرایش"
                          >
                            <FaEdit />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3">
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
  );
}