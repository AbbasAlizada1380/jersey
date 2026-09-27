import React, { useState, useEffect } from "react";
import axios from "axios";
import {
	FaMoneyBillWave,
	FaTruck,
	FaClock,
	FaCheckCircle,
	FaChartLine,
	FaCalendarAlt,
	FaSync,
	FaBoxOpen,
	FaWallet,
	FaExclamationTriangle,
	FaDownload,
	FaFilter,
	FaFileExcel,
	FaFilePdf,
	FaChevronDown,
	FaChevronUp,
	FaDollarSign,
	FaBoxes,
	FaPercent,
	FaHistory,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSelector } from "react-redux";
import PackageDownload from "./OrderDownload.jsx";
import RemainingPackages from "../RemainingPackages.jsx";
import RunReportDownload from "./RunReportDownload.jsx";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const DashboardHome = () => {
	const [reportData, setReportData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [lastUpdated, setLastUpdated] = useState(null);
	const [startDate, setStartDate] = useState(null);
	const [endDate, setEndDate] = useState(null);
	const [showFilters, setShowFilters] = useState(false);
	const [reportType, setReportType] = useState("all");
	const [isRefreshing, setIsRefreshing] = useState(false);
	const { currentUser } = useSelector((state) => state.user);
	const [showModel, setShowModel] = useState(false);

	const fetchReportData = async (start = null, end = null, type = "all") => {
		try {
			setLoading(true);
			setIsRefreshing(true);
			const params = {};
			if (start) params.startDate = start.toISOString().split("T")[0];
			if (end) params.endDate = end.toISOString().split("T")[0];
			if (type !== "all") params.type = type;

			const response = await axios.get(`${BASE_URL}/report`, { params });
			setReportData(response.data.data);
			setLastUpdated(new Date());
			setError(null);
		} catch (err) {
			setError("خطا در دریافت اطلاعات");
			console.error("Error fetching report data:", err);
		} finally {
			setLoading(false);
			setIsRefreshing(false);
		}
	};

	useEffect(() => {
		fetchReportData();
	}, []);

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("fa-AF").format(amount) + " دالر  ";
	};

	const formatNumber = (number) => {
		return new Intl.NumberFormat("fa-AF").format(number);
	};

	const formatTime = (date) => {
		return new Intl.DateTimeFormat("fa-AF", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		}).format(date);
	};

	// Loading State
	if (loading && !reportData) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center p-4">
				<div className="text-center max-w-md">
					<div className="relative">
						<div className="w-20 h-20 border-4 border-blue-100 rounded-full mx-auto mb-6"></div>
						<div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
					</div>
					<h3 className="text-xl font-semibold text-gray-700 mb-2">
						در حال بارگذاری داشبورد
					</h3>
					<p className="text-gray-500">دریافت آخرین اطلاعات...</p>
				</div>
			</div>
		);
	}

	// Error State
	if (error && !reportData) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
				<div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center border border-red-100">
					<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<FaExclamationTriangle className="text-red-500 text-2xl" />
					</div>
					<h3 className="text-xl font-bold text-gray-800 mb-3">خطا در اتصال</h3>
					<p className="text-gray-600 mb-6">{error}</p>
					<button
						onClick={() => fetchReportData()}
						className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
					>
						<FaSync className={isRefreshing ? "animate-spin" : ""} />
						تلاش مجدد
					</button>
				</div>
			</div>
		);
	}

	if (!reportData) return null;

	const {
		totalRemainedMoney,
		deliveredOrdersCount,
		notDeliveredOrdersCount,
		totalReceivedMoney,
		totalPendingMoney,
		totalOrdersCount,
		timeRange,
		totalPieces,
		totalIncome,
	} = reportData;

	const deliveryRate =
		totalOrdersCount > 0 ? (deliveredOrdersCount / totalOrdersCount) * 100 : 0;

	const statsCards = [
		{
			title: "کل درآمد",
			value: formatCurrency(totalIncome),
			icon: FaMoneyBillWave,
			color: "from-blue-600 to-blue-800",
			bgColor: "bg-blue-50",
			iconColor: "text-blue-600",
			description: "مجموع درآمد ",
			role: "admin",
			trend: "+12%",
		},
		{
			title: "دریافتی‌ها",
			value: formatCurrency(totalReceivedMoney),
			icon: FaWallet,
			color: "from-emerald-500 to-emerald-700",
			bgColor: "bg-emerald-50",
			iconColor: "text-emerald-600",
			description: "مبلغ دریافت شده",
			role: "admin",
			trend: "+8%",
		},
		{
			title: "مانده حساب",
			value: formatCurrency(totalPendingMoney),
			icon: FaDollarSign,
			color: "from-amber-500 to-amber-700",
			bgColor: "bg-amber-50",
			iconColor: "text-amber-600",
			description: "مبلغ باقیمانده",
			role: "admin",
			trend: "-3%",
		},
		{
			title: "تعداد بسته‌ها",
			value: formatNumber(totalPieces),
			icon: FaBoxes,
			color: "from-purple-500 to-purple-700",
			bgColor: "bg-purple-50",
			iconColor: "text-purple-600",
			description: "تعداد کل بسته های ثبت شده",
			role: "reception",
			trend: "+15%",
		},
	];

	const visibleCards = statsCards.filter(
		(card) => card.role === currentUser.role || currentUser.role === "admin"
	);

	return (
		<div className=" p-3  md:p-6 ">
			{/* Header Section */}
			<div className="mb-8  w-full">
				<div className="">
					{currentUser.role === "admin" && (
						<div className="">
							<PackageDownload />
						</div>
					)}
				</div>
				<div className="">
					<RunReportDownload/>
				</div>

				{/* Filters Panel */}
				{/* {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 animate-slideDown">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاریخ شروع
                </label>
                <div className="relative">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholderText="انتخاب تاریخ شروع"
                  />
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاریخ پایان
                </label>
                <div className="relative">
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholderText="انتخاب تاریخ پایان"
                  />
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع گزارش
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  <option value="all">همه سفارشات</option>
                  <option value="delivered">تحویل شده</option>
                  <option value="pending">در انتظار</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
              <button
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setReportType("all");
                }}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                پاک کردن فیلترها
              </button>
              <button
                onClick={() => fetchReportData(startDate, endDate, reportType)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                اعمال فیلترها
              </button>
            </div>
          </div>
        )} */}
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
				{visibleCards.map((card, index) => {
					const isRemainingCard = card.title === "مانده حساب";

					return (
						<div
							key={index}
							onClick={
								isRemainingCard
									? () => setShowModel((prev) => !prev)
									: undefined
							}
							className={`
        bg-white rounded-md shadow-md border border-gray-100 overflow-hidden
        transition-all duration-300 transform
        ${
					isRemainingCard
						? "cursor-pointer hover:shadow-xl hover:-translate-y-1"
						: "cursor-default"
				}
      `}
						>
							<div className="p-1 bg-gradient-to-r">
								<div className="bg-white rounded-2xl p-5">
									<div className="flex items-start justify-between mb-4">
										<div className="p-3 rounded-xl bg-primary">
											<card.icon className="text-xl text-white" />
										</div>

										<span className="text-sm font-semibold text-gray-600 p-2 rounded-full">
											{card.trend}
										</span>
									</div>

									<div className="mb-3">
										<div className="text-2xl font-bold text-gray-900">
											{card.value}
										</div>
										<p className="text-sm text-gray-600 mt-1">
											{card.description}
										</p>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
				{reportData.locations.map((card, index) => {
					// Generate different colors for each card
					const colorClasses = [
						{
							bg: "from-blue-500 to-blue-600",
							icon: "bg-blue-100",
							text: "text-blue-600",
						},
						{
							bg: "from-emerald-500 to-emerald-600",
							icon: "bg-emerald-100",
							text: "text-emerald-600",
						},
						{
							bg: "from-purple-500 to-purple-600",
							icon: "bg-purple-100",
							text: "text-purple-600",
						},
						{
							bg: "from-amber-500 to-amber-600",
							icon: "bg-amber-100",
							text: "text-amber-600",
						},
						{
							bg: "from-rose-500 to-rose-600",
							icon: "bg-rose-100",
							text: "text-rose-600",
						},
						{
							bg: "from-cyan-500 to-cyan-600",
							icon: "bg-cyan-100",
							text: "text-cyan-600",
						},
						{
							bg: "from-violet-500 to-violet-600",
							icon: "bg-violet-100",
							text: "text-violet-600",
						},
						{
							bg: "from-lime-500 to-lime-600",
							icon: "bg-lime-100",
							text: "text-lime-600",
						},
					];

					const colors = colorClasses[index % colorClasses.length];

					return (
						<div
							key={index}
							className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden group cursor-pointer"
						>
							<div className={`p-1 bg-gradient-to-r ${colors.bg}`}>
								<div className="bg-white rounded-2xl p-6">
									<div className="flex items-start justify-between mb-5">
										<div
											className={`p-3 rounded-xl ${colors.icon} flex items-center justify-center`}
										>
											<span className={`text-lg font-bold ${colors.text}`}>
												{card.location.charAt(0)}
											</span>
										</div>
										<div className="flex flex-col items-end">
											<span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full mb-1">
												شماره {index + 1}
											</span>
											<span className="text-2xl font-bold  bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
												{card.count.toLocaleString("fa-IR")}
											</span>
										</div>
									</div>

									<div className="mb-4">
										<h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
											{card.location}
										</h3>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Detailed Financial Section */}
			{currentUser.role === "admin" && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Financial Summary */}
					<div className="bg-white rounded-md shadow-md p-6 ">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<div className="p-3 bg-primary rounded-md">
									<FaMoneyBillWave className="text-white text-xl" />
								</div>
								<div>
									<h2 className="text-xl font-bold text-gray-900">
										خلاصه مالی
									</h2>
									<p className="text-sm text-gray-500">وضعیت مالی کلی سیستم</p>
								</div>
							</div>
							<div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
								امروز
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex justify-between items-center p-4 rounded-md bg-green-50 border border-green-100">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-green-100 rounded-lg">
										<FaWallet className="text-green-600" />
									</div>
									<div>
										<div className="text-sm text-gray-600">مجموع دریافتی</div>
										<div className="text-lg font-bold text-gray-900">
											{formatCurrency(totalReceivedMoney)}
										</div>
									</div>
								</div>
								<div className="text-sm text-green-600 font-medium">+12%</div>
							</div>

							<div
								onClick={() => setShowModel(!showModel)}
								className="flex justify-between items-center p-4 rounded-md bg-amber-50 border border-amber-100"
							>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-amber-100 rounded-lg">
										<FaClock className="text-amber-600" />
									</div>
									<div>
										<div className="text-sm text-gray-600">مجموع باقیمانده</div>
										<div className="text-lg font-bold text-gray-900">
											{formatCurrency(totalPendingMoney)}
										</div>
									</div>
								</div>
								<div className="text-sm text-amber-600 font-medium">
									در انتظار
								</div>
							</div>

							<div className="flex justify-between items-center p-4 rounded-md bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-blue-100 rounded-lg">
										<FaChartLine className="text-blue-600" />
									</div>
									<div>
										<div className="text-sm text-gray-600">درآمد کل</div>
										<div className="text-xl font-bold text-blue-800">
											{formatCurrency(totalIncome)}
										</div>
									</div>
								</div>
								<div className="text-sm font-medium text-blue-600">
									نمای کلی
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
			{showModel && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="relative w-[95%] h-[95%] bg-white rounded-xl shadow-xl overflow-y-auto">
						{/* Close Button */}

						<RemainingPackages setShowModel={setShowModel} />
					</div>
				</div>
			)}
		</div>
	);
};

export default DashboardHome;
