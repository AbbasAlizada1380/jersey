import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaReceipt,
  FaSpinner,
  FaTimes,
  FaFilter,
  FaMoneyBillWave,
  FaPrint,
} from "react-icons/fa";
import Pagination from "../../pagination/Pagination.jsx";
import PrintBill from "./PrintBill.jsx";   // ✅ new import
const BASE_URL = import.meta.env.VITE_BASE_URL;
const LIMIT = 10;

/* ---------------- helpers ---------------- */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "۰ افغانی";
  return new Intl.NumberFormat("en-US").format(Number(amount)) + " افغانی";
};

const formatDateTime = (d) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
};

export default function CustomerReceipts({
  customer,
  refreshKey = 0,
  compact = false,
}) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totals, setTotals] = useState({ count: 0, totalAmount: 0 });
  /* ✅ Print modal state */
const [printReceipt, setPrintReceipt] = useState(null);
const [printOpen, setPrintOpen] = useState(false);
  /* filter */
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchReceipts = useCallback(
    async (p = 1) => {
      if (!customer?.id) return;
      try {
        setLoading(true);
        setError(null);

        const params = {
          customer: customer.id,
          page: p,
          limit: LIMIT,
        };
        if (from) params.from = from;
        if (to) params.to = to;

        const res = await axios.get(`${BASE_URL}/receipts`, { params });
        setReceipts(res.data.receipts || []);
        setPage(res.data.pagination?.currentPage || p);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalItems(res.data.pagination?.totalItems || 0);
        setTotals(res.data.totals || { count: 0, totalAmount: 0 });
      } catch (err) {
        setError(
          err?.response?.data?.message ||
          err.message ||
          "خطا در دریافت رسیدها"
        );
        setReceipts([]);
      } finally {
        setLoading(false);
      }
    },
    [customer?.id, from, to]
  );

  useEffect(() => {
    fetchReceipts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, from, to, refreshKey]);

  const clearFilters = () => {
    setFrom("");
    setTo("");
  };

  if (!customer) return null;

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white overflow-hidden ${compact ? "" : "shadow-sm"
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/15 rounded-lg">
            <FaReceipt className="text-primary text-sm" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              رسیدهای پرداخت
            </h3>
            <p className="text-[11px] text-gray-500">
              {totalItems} رسید — مجموع{" "}
              <span className="font-semibold text-emerald-700">
                {formatCurrency(totals.totalAmount)}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
          title="فیلتر تاریخ"
        >
          <FaFilter className="text-xs" />
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-gray-100 bg-white flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">از</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">تا</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          {(from || to) && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition flex items-center gap-1"
            >
              <FaTimes className="text-[10px]" />
              پاک کردن
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="m-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center">
          <FaSpinner className="text-2xl text-primary animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">در حال بارگذاری...</p>
        </div>
      ) : receipts.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
            <FaReceipt className="text-primary" />
          </div>
          <p className="text-xs text-gray-500">
            هیچ رسیدی برای این مشتری ثبت نشده
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-primary to-primary/80">
              <tr>
                <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                  #
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                  مبلغ
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                  توضیحات
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase">
                  تاریخ و زمان
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-primary/5 transition">
                  <td className="px-3 py-3 text-sm font-semibold text-primary whitespace-nowrap">
                    #{r.id}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-emerald-50 text-emerald-600 rounded">
                        <FaMoneyBillWave className="text-[10px]" />
                      </div>
                      <span className="text-sm font-bold text-emerald-700">
                        {formatCurrency(r.amount)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {r.description ? (
                      <span
                        className="block max-w-xs truncate"
                        title={r.description}
                      >
                        {r.description}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {formatDateTime(r.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setPrintReceipt(r);        // ✅ pass the receipt
                          setPrintOpen(true);
                        }}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                        title="چاپ رسید"
                      >
                        <FaPrint size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="border-t border-gray-200">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => fetchReceipts(p)}
          />
        </div>
      )}
<PrintBill
  isOpen={printOpen}
  onClose={() => {
    setPrintOpen(false);
    setPrintReceipt(null);
  }}
  receipt={printReceipt}
  customer={customer}
/>
    </div>
  );
}