import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaUsers,
  FaUserClock,
  FaFilter,
  FaDownload,
  FaSpinner,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
} from "react-icons/fa";
import { downloadAllCustomerDebtPDF } from "./downloadAllCustomerDebtPDF";

const BASE_URL = import.meta.env.VITE_BASE_URL;

/* ---------- helpers ---------- */
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
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800">
        بخشی
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
      پرداخت نشده
    </span>
  );
};

/* ---------- group bills into "customer" entries ---------- */
function groupPermanentBills(bills) {
  const map = new Map();
  for (const b of bills) {
    if (!b.customer) continue;
    const key = `p-${b.customer}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        type: "permanent",
        customerId: b.customer,
        name: b.name || "—",
        phoneNumber: b.phoneNumber || null,
        bills: [],
        totalAmount: 0,
        totalPaid: 0,
        totalRemaining: 0,
        unpaidCount: 0,
        partialCount: 0,
        latestAt: b.createdAt,
      });
    }
    const e = map.get(key);
    e.bills.push(b);
    e.totalAmount += Number(b.total) || 0;
    e.totalPaid += Array.isArray(b.receipt)
      ? b.receipt.reduce((s, n) => s + (Number(n) || 0), 0)
      : 0;
    e.totalRemaining += Number(b.remaind) || 0;
    if (b.status === "unpaid") e.unpaidCount += 1;
    else if (b.status === "partial") e.partialCount += 1;
    if (new Date(b.createdAt) > new Date(e.latestAt)) e.latestAt = b.createdAt;
  }
  return Array.from(map.values());
}

function groupTemporaryBills(bills) {
  const map = new Map();
  for (const b of bills) {
    const key = `t-${(b.name || "").trim()}|${(b.phoneNumber || "").trim()}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        type: "temporary",
        customerId: null,
        name: b.name || "—",
        phoneNumber: b.phoneNumber || null,
        bills: [],
        totalAmount: 0,
        totalPaid: 0,
        totalRemaining: 0,
        unpaidCount: 0,
        partialCount: 0,
        latestAt: b.createdAt,
      });
    }
    const e = map.get(key);
    e.bills.push(b);
    e.totalAmount += Number(b.total) || 0;
    e.totalPaid += Array.isArray(b.receipt)
      ? b.receipt.reduce((s, n) => s + (Number(n) || 0), 0)
      : 0;
    e.totalRemaining += Number(b.remaind) || 0;
    if (b.status === "unpaid") e.unpaidCount += 1;
    else if (b.status === "partial") e.partialCount += 1;
    if (new Date(b.createdAt) > new Date(e.latestAt)) e.latestAt = b.createdAt;
  }
  return Array.from(map.values());
}

/* =========================================================
   One debt table (reusable for permanent or temporary)
   ========================================================= */
function DebtTable({ title, icon, rows, accent, onViewBills }) {
  const totals = rows.reduce(
    (acc, r) => {
      acc.amount += r.totalAmount;
      acc.paid += r.totalPaid;
      acc.remaining += r.totalRemaining;
      acc.bills += r.bills.length;
      return acc;
    },
    { amount: 0, paid: 0, remaining: 0, bills: 0 }
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Table header */}
      <div
        className={`bg-gradient-to-r ${accent} text-white p-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">{icon}</div>
          <div>
            <h3 className="font-bold">{title}</h3>
            <p className="text-xs text-white/80">
              {rows.length} مشتری • {totals.bills} بل
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-white/80">مجموع باقی‌مانده</div>
          <div className="font-bold text-base">
            {formatCurrency(totals.remaining)}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <FaCheckCircle className="text-primary text-xl" />
          </div>
          <p className="text-gray-500 text-sm">هیچ بدهی ثبت نشده است</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                    مشتری
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                    شماره تماس
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                    تعداد بل
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                    مجموع
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                    پرداخت شده
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                    باقی مانده
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">
                    وضعیت
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.key} className="hover:bg-primary/5 transition">
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {r.name}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        آخرین بل: {formatDate(r.latestAt)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700" dir="ltr">
                      {r.phoneNumber || "—"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700">
                      {r.bills.length}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-800">
                      {formatCurrency(r.totalAmount)}
                    </td>
                    <td className="px-3 py-3 text-sm text-emerald-700 font-medium">
                      {formatCurrency(r.totalPaid)}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-red-600">
                      {formatCurrency(r.totalRemaining)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.unpaidCount > 0 && statusBadge("unpaid")}
                        {r.partialCount > 0 && statusBadge("partial")}
                        {r.unpaidCount > 0 && (
                          <span className="text-[10px] text-gray-500 ml-1">
                            ×{r.unpaidCount}
                          </span>
                        )}
                        {r.partialCount > 0 && (
                          <span className="text-[10px] text-gray-500 ml-1">
                            ×{r.partialCount}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </>
      )}
    </div>
  );
}

/* =========================================================
   Main component
   ========================================================= */
export default function AllCustomerDebt({ refreshKey = 0, onViewBills }) {
  const [permanent, setPermanent] = useState([]);
  const [temporary, setTemporary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  /* filter */
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  /* ---------- Fetch both sets ---------- */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const baseParams = { page: 1, limit: 10000, status: "unpaid,partial" };
      if (from) baseParams.from = from;
      if (to) baseParams.to = to;

      const [permRes, tempRes] = await Promise.all([
        axios.get(`${BASE_URL}/bills`, {
          params: { ...baseParams, customerType: "permanent" },
        }),
        axios.get(`${BASE_URL}/bills`, {
          params: { ...baseParams, customerType: "temporary" },
        }),
      ]);

      const permBills = permRes.data.bills || [];
      const tempBills = tempRes.data.bills || [];

      setPermanent(groupPermanentBills(permBills));
      setTemporary(groupTemporaryBills(tempBills));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        "خطا در دریافت بدهی مشتریان"
      );
      setPermanent([]);
      setTemporary([]);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, refreshKey]);

  /* ---------- Derived grand totals ---------- */
  const grandTotals = [...permanent, ...temporary].reduce(
    (acc, r) => {
      acc.amount += r.totalAmount;
      acc.paid += r.totalPaid;
      acc.remaining += r.totalRemaining;
      acc.bills += r.bills.length;
      acc.customers += 1;
      return acc;
    },
    { amount: 0, paid: 0, remaining: 0, bills: 0, customers: 0 }
  );

  /* ---------- PDF ---------- */
  const handleDownload = () => {
    if (permanent.length === 0 && temporary.length === 0) {
      alert("هیچ بدهی برای دانلود وجود ندارد");
      return;
    }
    try {
      setDownloading(true);
      downloadAllCustomerDebtPDF({
        permanent,
        temporary,
        grandTotals,
        filters: {
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

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/20 rounded-xl">
            <FaExclamationTriangle className="text-primary text-lg" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              بدهی همه مشتریان
            </h2>
            <p className="text-xs text-gray-500">
              {grandTotals.customers} مشتری • {grandTotals.bills} بل بدهکار
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${showFilters
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            <FaFilter className="text-xs" />
            فیلتر تاریخ
          </button>

          <button
            onClick={handleDownload}
            disabled={
              downloading ||
              (permanent.length === 0 && temporary.length === 0)
            }
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${downloading ||
              (permanent.length === 0 && temporary.length === 0)
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-white"
              }`}
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
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
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
          {(from || to) && (
            <button
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition flex items-center gap-1"
            >
              <FaTimes className="text-[10px]" />
              پاک کردن
            </button>
          )}
        </div>
      )}

      {/* Grand summary tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">تعداد مشتری بدهکار</p>
          <p className="text-xl font-bold text-gray-900">
            {grandTotals.customers}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            {grandTotals.bills} بل در مجموع
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">مجموع کل</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(grandTotals.amount)}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs text-emerald-600 mb-1">پرداخت شده</p>
          <p className="text-xl font-bold text-emerald-700">
            {formatCurrency(grandTotals.paid)}
          </p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-red-600 mb-1 flex items-center gap-1">
            <FaExclamationTriangle className="text-[10px]" />
            باقی مانده
          </p>
          <p className="text-xl font-bold text-red-700">
            {formatCurrency(grandTotals.remaining)}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
          <FaSpinner className="text-3xl text-primary animate-spin mx-auto mb-3" />
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      ) : (
        <>
          {/* Permanent table */}
          <DebtTable
            title="مشتریان دائمی بدهکار"
            icon={<FaUsers className="h-5 w-5" />}
            rows={permanent}
            accent="from-primary to-primary/80"
            onViewBills={onViewBills}
          />

          {/* Temporary table */}
          <DebtTable
            title="مشتریان موقت بدهکار"
            icon={<FaUserClock className="h-5 w-5" />}
            rows={temporary}
            accent="from-primary to-primary/80"
            onViewBills={onViewBills}
          />
        </>
      )}
    </div>
  );
}