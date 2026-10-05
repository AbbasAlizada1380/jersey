// src/components/financial/FinancialFilters.jsx
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt, FaFilter, FaTimes, FaSync, FaSpinner } from "react-icons/fa";
import { toLocalISODate } from "./shared/format";

const FinancialFilters = ({
  startDate, endDate, setStartDate, setEndDate,
  onApply, onReset, onRefresh,
  hasCustomRange, loading, lastUpdated, show, toggleShow,
}) => (
  <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleShow}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            show
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <FaFilter /> فیلترها
        </button>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <FaSync className={loading ? "animate-spin" : ""} />
          بروزرسانی
        </button>
      </div>
      {lastUpdated && (
        <span className="text-xs text-gray-500">
          آخرین بروزرسانی: {lastUpdated.toLocaleTimeString("fa-AF")}
        </span>
      )}
    </div>

    {show && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
            <div className="relative">
              <DatePicker
                selected={startDate}
                onChange={(d) => d && setStartDate(d)}
                selectsStart startDate={startDate} endDate={endDate} maxDate={endDate}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholderText="انتخاب تاریخ شروع"
                dateFormat="yyyy/MM/dd"
              />
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{toLocalISODate(startDate)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
            <div className="relative">
              <DatePicker
                selected={endDate}
                onChange={(d) => d && setEndDate(d)}
                selectsEnd startDate={startDate} endDate={endDate} minDate={startDate}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholderText="انتخاب تاریخ پایان"
                dateFormat="yyyy/MM/dd"
              />
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{toLocalISODate(endDate)}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onApply}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaFilter />}
              اعمال
            </button>
            {hasCustomRange && (
              <button
                onClick={onReset}
                className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm"
                title="بازنشانی"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </div>
    )}
  </>
);

export default FinancialFilters;