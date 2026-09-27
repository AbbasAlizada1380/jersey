import React, { useState, useEffect } from "react";
import axios from "axios";
import {
	FaBoxOpen,
	FaUser,
	FaPhone,
	FaMapMarkerAlt,
	FaMoneyBillWave,
	FaClock,
	FaFilter,
	FaDownload,
	FaPrint,
	FaTimes,
	FaSearch,
	FaSort,
	FaSortUp,
	FaSortDown,
	FaEye,
	FaFileExcel,
	FaFilePdf,
	FaChartLine,
	FaWeight,
	FaCube,
	FaDollarSign,
	FaCheckCircle,
	FaEdit,
	FaReceipt,
	FaCheck,
	FaBan,
	FaHistory,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSelector } from "react-redux";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const RemainingPackages = ({ onClose, setShowModel }) => {
	const [packages, setPackages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [successMessage, setSuccessMessage] = useState(null);
	const [filters, setFilters] = useState({
		search: "",
		startDate: null,
		endDate: null,
		location: "",
		senderName: "",
		receiverName: "",
		minAmount: "",
		maxAmount: "",
	});
	const [sortConfig, setSortConfig] = useState({
		key: "createdAt",
		direction: "desc",
	});
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedPackage, setSelectedPackage] = useState(null);
	const [paymentAmount, setPaymentAmount] = useState(0);
	const [paymentMethod, setPaymentMethod] = useState("cash");
	const [paymentNote, setPaymentNote] = useState("");
	const [paymentLoading, setPaymentLoading] = useState(false);
	const [showAllRemaining, setShowAllRemaining] = useState(false);
	const [bulkPaymentMode, setBulkPaymentMode] = useState(false);
	const [selectedPackages, setSelectedPackages] = useState([]);
	const { currentUser } = useSelector((state) => state.user);

	const itemsPerPage = 20;

	const fetchRemainingPackages = async () => {
		try {
			setLoading(true);
			const params = {
				page: currentPage,
				limit: itemsPerPage,
				showAllRemaining: showAllRemaining, // Send this flag to API
			};

			// Apply filters
			if (filters.search) params.search = filters.search;
			if (filters.startDate)
				params.startDate = filters.startDate.toISOString().split("T")[0];
			if (filters.endDate)
				params.endDate = filters.endDate.toISOString().split("T")[0];
			if (filters.location) params.location = filters.location;
			if (filters.senderName) params.senderName = filters.senderName;
			if (filters.receiverName) params.receiverName = filters.receiverName;
			if (filters.minAmount) params.minRemain = filters.minAmount;
			if (filters.maxAmount) params.maxRemain = filters.maxAmount;

			const response = await axios.get(`${BASE_URL}/packages/remaining`, {
				params,
			});
			console.log("API Response:", response.data);

			setPackages(response.data.packages || []);
			setTotalPages(response.data.totalPages || 1);
			setTotalPackages(response.data.totalPackages || 0);
			setError(null);
		} catch (err) {
			setError("خطا در دریافت اطلاعات بسته‌های باقیمانده");
			console.error("Error fetching remaining packages:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRemainingPackages();
	}, [currentPage, sortConfig, showAllRemaining]);

	const handleSort = (key) => {
		setSortConfig((prev) => ({
			key,
			direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
		}));
	};

	const formatCurrency = (amount) => {
		if (!amount && amount !== 0) return "۰ دالر";
		return new Intl.NumberFormat("fa-AF").format(amount) + " دالر";
	};

	const formatDate = (dateString) => {
		if (!dateString) return "نامشخص";
		return new Intl.DateTimeFormat("fa-AF", {
			year: "numeric",
			month: "long",
			day: "numeric",
		}).format(new Date(dateString));
	};
	// Handle quick payment (set to 0 with one click)
	const handleQuickPayment = async (pkg) => {
		if (
			!window.confirm(
				`آیا از پرداخت کامل مبلغ ${formatCurrency(pkg.remain)} برای سفارش #${
					pkg.id
				} اطمینان دارید؟`
			)
		) {
			return;
		}

		try {
			const response = await axios.post(
				`${BASE_URL}/packages/updateRemaining/${pkg.id}/`,
				{
					userId: currentUser.id,
					note: "پرداخت سریع از داشبورد",
				}
			);

			if (response.data.success) {
				setSuccessMessage(`سفارش #${pkg.id} به طور کامل پرداخت شد`);

				// Update local state
				setPackages((prev) =>
					prev.map((item) =>
						item.id === pkg.id
							? { ...item, remain: 0, received: item.totalCash }
							: item
					)
				);

				setTimeout(() => setSuccessMessage(null), 3000);
			}
		} catch (err) {
			setError("خطا در پرداخت سفارش");
			console.error("Error completing payment:", err);
		}
	};

	// Bulk selection handlers
	const handleSelectPackage = (pkgId) => {
		if (selectedPackages.includes(pkgId)) {
			setSelectedPackages((prev) => prev.filter((id) => id !== pkgId));
		} else {
			setSelectedPackages((prev) => [...prev, pkgId]);
		}
	};

	const handleSelectAll = () => {
		if (selectedPackages.length === packages.length) {
			setSelectedPackages([]);
		} else {
			setSelectedPackages(packages.map((pkg) => pkg.id));
		}
	};

	const handleBulkPayment = async () => {
		if (selectedPackages.length === 0) {
			setError("لطفاً حداقل یک سفارش را انتخاب کنید");
			return;
		}

		const totalAmount = packages
			.filter((pkg) => selectedPackages.includes(pkg.id))
			.reduce((total, pkg) => total + (pkg.remain || 0), 0);

		if (
			!window.confirm(
				`آیا از پرداخت کامل ${
					selectedPackages.length
				} سفارش به مبلغ کل ${formatCurrency(totalAmount)} اطمینان دارید؟`
			)
		) {
			return;
		}

		try {
			setPaymentLoading(true);
			const response = await axios.post(`${BASE_URL}/orders/bulk-payment`, {
				orderIds: selectedPackages,
				userId: currentUser.id,
				paymentMethod: "cash",
				note: "پرداخت گروهی از داشبورد",
			});

			if (response.data.success) {
				setSuccessMessage(
					`پرداخت ${selectedPackages.length} سفارش با موفقیت ثبت شد`
				);

				// Update local state
				setPackages((prev) =>
					prev.map((item) =>
						selectedPackages.includes(item.id)
							? { ...item, remain: 0, received: item.totalCash }
							: item
					)
				);

				setSelectedPackages([]);
				setBulkPaymentMode(false);
				setTimeout(() => setSuccessMessage(null), 3000);
			}
		} catch (err) {
			setError("خطا در پرداخت گروهی");
			console.error("Error processing bulk payment:", err);
		} finally {
			setPaymentLoading(false);
		}
	};

	const exportToExcel = () => {
		// ... existing exportToExcel code ...
	};

	const SortIcon = ({ columnKey }) => {
		if (sortConfig.key !== columnKey)
			return <FaSort className="text-gray-400" />;
		return sortConfig.direction === "asc" ? (
			<FaSortUp className="text-blue-600" />
		) : (
			<FaSortDown className="text-blue-600" />
		);
	};

	// Sort packages based on sortConfig
	const sortedPackages = [...packages].sort((a, b) => {
		let aValue = a[sortConfig.key];
		let bValue = b[sortConfig.key];

		// Handle nested properties
		if (sortConfig.key === "senderName") {
			aValue = a.Sender?.name;
			bValue = b.Sender?.name;
		} else if (sortConfig.key === "receiverName") {
			aValue = a.Receiver?.name;
			bValue = b.Receiver?.name;
		} else if (sortConfig.key === "phone") {
			aValue = a.Sender?.phoneNumber || a.Receiver?.phoneNumber;
			bValue = b.Sender?.phoneNumber || b.Receiver?.phoneNumber;
		}

		if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
		if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
		return 0;
	});

	if (loading && packages.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">
						در حال بارگذاری بسته‌های باقیمانده...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen  p-4 md:p-6 print:p-0">
			{/* Success Message */}
			{successMessage && (
				<div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 animate-slideDown">
					<div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-green-100 rounded-lg">
								<FaCheckCircle className="text-green-600" />
							</div>
							<div className="flex-1">
								<p className="text-green-700">{successMessage}</p>
							</div>
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
			<div className="bg-white relative rounded-md  p-6  print:shadow-none print:border-b">
				<button
					onClick={() => setShowModel(false)}
					className="fixed top-10 right-16 z-20 text-gray-600 hover:text-red-500 text-xl"
				>
					✕
				</button>
				<div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
					<div className="flex items-center gap-3 mb-4 md:mb-0">
						<div className="p-3 bg-primary/20 rounded-md">
							<FaBoxOpen className="text-primary text-2xl" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								بسته‌ های باقیمانده
							</h1>
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

				{/* Bulk Payment Panel */}
				{bulkPaymentMode && (
					<div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4 animate-slideDown">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-purple-100 rounded-lg">
									<FaReceipt className="text-purple-600" />
								</div>
								<div>
									<h3 className="font-semibold text-purple-900">
										حالت پرداخت گروهی
									</h3>
									<p className="text-sm text-purple-700">
										{selectedPackages.length} سفارش از {packages.length} انتخاب
										شده‌اند
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<button
									onClick={handleSelectAll}
									className="px-4 py-2 border border-purple-300 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors"
								>
									{selectedPackages.length === packages.length
										? "لغو انتخاب همه"
										: "انتخاب همه"}
								</button>
								<button
									onClick={handleBulkPayment}
									disabled={selectedPackages.length === 0 || paymentLoading}
									className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
										selectedPackages.length === 0
											? "bg-gray-300 text-gray-500 cursor-not-allowed"
											: "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
									}`}
								>
									{paymentLoading ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
											در حال پرداخت...
										</>
									) : (
										<>
											<FaCheckCircle />
											پرداخت انتخاب‌شده‌ها (
											{formatCurrency(
												packages
													.filter((pkg) => selectedPackages.includes(pkg.id))
													.reduce((total, pkg) => total + (pkg.remain || 0), 0)
											)}
											)
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					{/* ... existing summary cards ... */}
				</div>

				{/* Search and Filters */}
				{/* ... existing search and filters code ... */}
			</div>

			{/* Packages Table */}
			<div className="bg-gray-200 shadow-lg overflow-hidden print:shadow-none">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className=" print:bg-gray-100">
							<tr>
								<th className="px-6 py-3 text-left font-medium text-gray-700 uppercase tracking-wider cursor-pointer print:px-3">
									<div className="flex items-center justify-end gap-2">
										شماره
									</div>
								</th>
								<th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider cursor-pointer print:px-3">
									<div className=" gap-2">فرستنده</div>
								</th>
								<th className="px-6 py-3 text-right  font-medium text-gray-700 uppercase tracking-wider cursor-pointer print:px-3">
									<div className=" gap-2">گیرنده</div>
								</th>
								<th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider cursor-pointer print:px-3">
									<div className=" gap-2">مکان</div>
								</th>
								<th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider print:px-3">
									<div className=" gap-2">قطعات</div>
								</th>
								<th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider print:px-3">
									<div className=" gap-2">وزن</div>
								</th>
								<th className="px-6 py-3 text-right  font-medium text-gray-700 uppercase tracking-wider print:px-3">
									<div className=" gap-2">مبلغ کل</div>
								</th>
								<th className="px-6 py-3 text-right  font-medium text-gray-700 uppercase tracking-wider cursor-pointer print:px-3">
									<div className=" gap-2">باقیمانده</div>
								</th>
								<th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider cursor-pointer print:px-3">
									<div className=" gap-2">تاریخ ثبت</div>
								</th>
								<th className="px-6 py-3 text-right  font-medium text-gray-700 uppercase tracking-wider print:hidden">
									عملیات
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{sortedPackages.map((pkg) => (
								<tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
									{bulkPaymentMode && (
										<td className="px-6 py-4 print:px-3 text-center">
											<input
												type="checkbox"
												checked={selectedPackages.includes(pkg.id)}
												onChange={() => handleSelectPackage(pkg.id)}
												className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
											/>
										</td>
									)}
									<td className="px-6 py-4 print:px-3">
										<div className="text-sm font-medium text-primary">
											#{pkg.id || pkg.trackingNumber || "-"}
										</div>
									</td>
									<td className="px-6 py-4 print:px-3">
										<div className="flex items-center gap-3">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{pkg.Sender?.name || "نامشخص"}
												</div>
												<div className="text-xs text-gray-500">
													{pkg.Sender?.phoneNumber || "بدون شماره"}
												</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 print:px-3">
										<div className="flex items-center gap-3">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{pkg.Receiver?.name || "نامشخص"}
												</div>
												<div className="text-xs text-gray-500">
													{pkg.Receiver?.phoneNumber || "بدون شماره"}
												</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 print:px-3">
										<div className=" gap-2">
											<span className="text-sm text-gray-900">
												{pkg.location || "نامشخص"}
											</span>
										</div>
									</td>
									<td className="px-6 py-4 print:px-3">
										<div className="text-center">
											<div className="text-lg font-bold text-gray-900">
												{pkg.piece || 0}
											</div>
											<div className="text-xs text-gray-500">بسته</div>
										</div>
									</td>
									<td className="px-6 py-4 print:px-3">
										<div className="flex items-center gap-2">
											<span className="text-sm text-gray-900">
												{pkg.totalWeight || 0} کیلوگرم
											</span>
										</div>
									</td>
									<td className="px-6 py-4 print:px-3">
										<div className="text-lg font-bold text-gray-900">
											{formatCurrency(pkg.totalCash || 0)}
										</div>
										<div className="text-xs text-gray-500">
											{formatCurrency(pkg.received || 0)} دریافتی
										</div>
									</td>
									<td className="px-6 py-4 print:px-3">
										<div className="flex items-center gap-2">
											<div>
												<div className="text-lg font-bold text-red-500">
													{formatCurrency(pkg.remain || 0)}
												</div>
												<div className="text-xs text-gray-500">باقیمانده</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 print:px-3">
										<div className="flex items-center gap-2">
											<div>
												<div className="text-sm text-gray-900">
													{formatDate(pkg.createdAt)}
												</div>
												<div className="text-xs text-gray-500">
													ارسال: {formatDate(pkg.date)}
												</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 print:px-3">
										<div className="flex flex-wrap gap-2">
											{/* Quick Full Payment Button */}
											{pkg.remain > 0 && (
												<button
													onClick={() => handleQuickPayment(pkg)}
													disabled={paymentLoading}
													className="px-2 py-1.5 bg-primary cursor-pointer text-white rounded-md hover:to-emerald-700 transition-all text-sm flex items-center gap-2"
													title="پرداخت کامل"
												>
													پرداخت کامل
												</button>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default RemainingPackages;
