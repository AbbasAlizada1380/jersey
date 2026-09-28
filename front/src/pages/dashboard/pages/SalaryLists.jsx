import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaFileInvoiceDollar,
  FaUser,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimes,
  FaEye,
  FaChevronRight,
  FaMoneyBillWave,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const DAYS = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
];

const DAY_LABELS_FA = {
  Saturday: "شنبه",
  Sunday: "یکشنبه",
  Monday: "دوشنبه",
  Tuesday: "سه‌شنبه",
  Wednesday: "چهارشنبه",
  Thursday: "پنجشنبه",
};

export default function SalaryLists({ onClose, setShowModel }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [selectedList, setSelectedList] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingId, setSavingId] = useState(null);

  /* ---------------- Fetch salary lists ---------------- */
  const fetchLists = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/salary-lists`);
      setLists(res.data.salaryLists || res.data || []);
      setError(null);
    } catch (err) {
      setError(
        err?.response?.data?.error || err.message || "خطا در دریافت لیست معاش"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  /* ---------------- Fetch attendance for a list ---------------- */
  const openAttendance = async (list) => {
    setSelectedList(list);
    setLoadingAttendance(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}/attendance`, {
        params: { list: list.id },
      });
      const rows = res.data.attendances || res.data || [];
      setAttendances(rows);
    } catch (err) {
      setError(
        err?.response?.data?.error || err.message || "خطا در دریافت حاضری"
      );
      setAttendances([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const closeAttendance = () => {
    setSelectedList(null);
    setAttendances([]);
  };

  /* ---------------- Toggle attendance / overtime ---------------- */
  const updateLocalAttendance = (id, day, field, value) => {
    setAttendances((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const nextAttendance = { ...(row.attendance || {}) };
        nextAttendance[day] = {
          ...(nextAttendance[day] || { attendance: false, overtime: 0 }),
          [field]: value,
        };
        return { ...row, attendance: nextAttendance };
      })
    );
  };

  const saveAttendance = async (row) => {
    setSavingId(row.id);
    setError(null);
    try {
      const res = await axios.put(`${BASE_URL}/attendance/${row.id}`, {
        attendance: row.attendance,
      });
      // Backend recalculates salary/overtime/total, so merge response
      const updated = res.data.record || res.data;
      setAttendances((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                salary: updated.salary ?? r.salary,
                overtime: updated.overtime ?? r.overtime,
                total: updated.total ?? r.total,
              }
            : r
        )
      );
      setSuccessMessage("حاضری ذخیره شد");
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err) {
      setError(
        err?.response?.data?.error || err.message || "خطا در ذخیره حاضری"
      );
    } finally {
      setSavingId(null);
    }
  };

  /* ---------------- Helpers ---------------- */
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "۰ افغانی";
    return new Intl.NumberFormat("fa-AF").format(Number(amount)) + " افغانی";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "نامشخص";
    return new Intl.DateTimeFormat("fa-AF", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };

  /* ---------------- Loading state ---------------- */
  if (loading && lists.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری لیست معاش...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 print:p-0">
      {/* Success Toast */}
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
      <div className="bg-white relative rounded-md p-6 print:shadow-none print:border-b">
        {setShowModel && (
          <button
            onClick={() => setShowModel(false)}
            className="fixed top-10 right-16 z-20 text-gray-600 hover:text-red-500 text-xl"
          >
            ✕
          </button>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="p-3 bg-primary/20 rounded-md">
              <FaFileInvoiceDollar className="text-primary text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">لیست معاش</h1>
              <p className="text-sm text-gray-500">
                برای مشاهده حاضری، روی هر لیست کلیک کنید
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                title="بستن"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* SalaryLists table */}
      <div className="bg-gray-200 shadow-lg overflow-hidden print:shadow-none mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="print:bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider">
                  شماره
                </th>
                <th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider">
                  نام لیست
                </th>
                <th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider">
                  بازه
                </th>
                <th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider">
                  تعداد کارمندان
                </th>
                <th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider">
                  مجموع
                </th>
                <th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider">
                  تاریخ ثبت
                </th>
                <th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider print:hidden">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lists.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    هیچ لیست معاشی ثبت نشده است
                  </td>
                </tr>
              ) : (
                lists.map((list) => {
                  const staffCount = Array.isArray(list.staffIds)
                    ? list.staffIds.length
                    : 0;
                  return (
                    <tr
                      key={list.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => openAttendance(list)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-primary">
                          #{list.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {list.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="flex items-center gap-2 text-sm text-gray-700"
                          dir="ltr"
                        >
                          <FaCalendarAlt className="text-gray-400" />
                          {list.range || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {staffCount} نفر
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(list.total)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(list.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="px-3 py-1.5 bg-primary text-white rounded-md hover:opacity-90 transition-opacity text-sm flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAttendance(list);
                          }}
                        >
                          <FaEye />
                          مشاهده حاضری
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance modal */}
      {selectedList && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
          <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeAttendance}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  title="بازگشت"
                >
                  <FaArrowRight />
                </button>
                <div>
                  <h2 className="text-lg font-bold">
                    حاضری: {selectedList.name}
                  </h2>
                  <p className="text-sm text-white/80" dir="ltr">
                    {selectedList.range}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAttendance}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-4 md:p-6 max-h-[75vh] overflow-y-auto">
              {loadingAttendance ? (
                <div className="py-16 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600">در حال بارگذاری حاضری...</p>
                </div>
              ) : attendances.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  هیچ رکورد حاضری برای این لیست یافت نشد
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                          کارمند
                        </th>
                        {DAYS.map((day) => (
                          <th
                            key={day}
                            className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase"
                          >
                            {DAY_LABELS_FA[day]}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                          معاش
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                          اضافه‌کاری
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                          مجموع
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">
                          عملیات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendances.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          {/* Staff cell */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-primary/10 rounded-full">
                                <FaUser className="text-primary text-xs" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {row.staff?.name || `کارمند #${row.staffId}`}
                                </div>
                                {row.staff?.NIC && (
                                  <div className="text-xs text-gray-500">
                                    {row.staff.NIC}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Days */}
                          {DAYS.map((day) => {
                            const dayData = row.attendance?.[day] || {
                              attendance: false,
                              overtime: 0,
                            };
                            return (
                              <td
                                key={day}
                                className="px-2 py-3 text-center align-top"
                              >
                                <label className="flex flex-col items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!dayData.attendance}
                                    onChange={(e) =>
                                      updateLocalAttendance(
                                        row.id,
                                        day,
                                        "attendance",
                                        e.target.checked
                                      )
                                    }
                                    className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={dayData.overtime || 0}
                                    onChange={(e) =>
                                      updateLocalAttendance(
                                        row.id,
                                        day,
                                        "overtime",
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="w-12 text-xs border border-gray-200 rounded px-1 py-0.5 text-center focus:ring-1 focus:ring-primary"
                                    title="ساعات اضافه‌کاری"
                                  />
                                </label>
                              </td>
                            );
                          })}

                          {/* Totals */}
                          <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {formatCurrency(row.salary)}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <FaClock className="text-gray-400 text-xs" />
                              {formatCurrency(row.overtime)}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm font-bold text-primary whitespace-nowrap">
                            {formatCurrency(row.total)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => saveAttendance(row)}
                              disabled={savingId === row.id}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1 mx-auto ${
                                savingId === row.id
                                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                  : "bg-primary text-white hover:opacity-90"
                              }`}
                            >
                              {savingId === row.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  ذخیره...
                                </>
                              ) : (
                                "ذخیره"
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}