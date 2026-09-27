import React from "react";
import moment from "moment-jalaali";
import { FaPhone, FaPrint, FaTimes } from "react-icons/fa";
import Regulation from "./Regulations";

const PrintShippingBill = ({ isOpen, onClose, data }) => {
	console.log(data);

	if (!isOpen || !data) return null;

	const formatCurrency = (num) => {
		const number = Number(num || 0);
		return number.toLocaleString("eng-en") + " دالر";
	};

	const formatNumber = (num) => {
		return Number(num || 0).toLocaleString("eng-en");
	};

	const handlePrint = () => window.print();

	const billNumber = data.id
		? `${data.id}`
		: `${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

	const dueDate = moment(data.date).format("YYYY/MM/DD");

	return (
		<div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50  print:bg-transparent print:p-0">
			<div>
				<div
					id="printable-area"
					className="scale-[0.65] print:scale-[1] bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col print:shadow-none print:rounded-none"
					style={{
						width: "210mm",
						height: "297mm",
						direction: "rtl",
					}}
				>
					{/* Header */}
					<div className="bg- text-black border-b p-4  flex items-center justify-between">
						{/* Logo and Company Name */}
						<div className="flex items-center gap-3 mb-3 md:mb-0">
							<img
								src="/logo.png"
								alt="your Cargo Logo"
								className="h-16 w-16 object-contain rounded-full border-2 border-white"
							/>
							<div className="flex flex-col text-center md:text-left">
								<h1 className="text-2xl font-bold leading-tight">
									کارگوی شما
								</h1>
								<p className="text-sm opacity-90">your Cargo Services</p>
							</div>
						</div>

						{/* Bill Info */}
						<div className="flex flex-col items-center md:items-end text-xs">
							<span className="mb-1">
								<strong>شماره بل:</strong> {formatNumber(billNumber)}
							</span>
							<span>
								<strong>تاریخ:</strong> {dueDate}
							</span>
						</div>
					</div>

					<div className="grid md:grid-cols-2 gap-4 p-3">
						{/* Sender Info */}
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
							<div className=" px-3 py-2">
								<h2 className="text-sm font-bold text-black flex items-center gap-2">
									اطلاعات ارسال‌کننده
								</h2>
							</div>
							<div className="p-3">
								<div className="grid grid-cols-1 gap-2 text-sm">
									<div className="flex items-center gap-2">
										<span className="font-semibold text-gray-600 min-w-[70px]">نام:</span>
										<span className="text-gray-800">{data.Sender.name}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="font-semibold text-gray-600 min-w-[70px]">تماس:</span>
										<span className="text-gray-800" dir="ltr">
											{data.Sender.phoneNumber|| "-"}
										</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="font-semibold text-gray-600 min-w-[70px]">آدرس:</span>
										<span className="text-gray-800 flex-1">{data.Sender.address}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="font-semibold text-gray-600 min-w-[70px]">ایمیل:</span>
										<span className="text-gray-800">{data.Sender.email || "-"}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="font-semibold text-gray-600 min-w-[70px]">کشور:</span>
										<span className="text-gray-800">{data.Sender.country || "-"}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Receiver Info */}
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
							<div className=" px-3 py-2">
								<h2 className="text-sm font-bold text-black flex items-center gap-2">
									اطلاعات دریافت‌کننده
								</h2>
							</div>
							<div className="p-3">
								<div className="grid grid-cols-1 gap-2 text-sm">
									<div className="flex items-center gap-2">
										<span className="font-semibold text-gray-600 min-w-[70px]">نام:</span>
										<span className="text-gray-800">{data.Receiver.name}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="font-semibold text-gray-600 min-w-[70px]">تماس:</span>
										<span className="text-gray-800" dir="ltr">
											{data.Receiver.phoneNumber|| "-"}
										</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="font-semibold text-gray-600 min-w-[70px]">آدرس:</span>
										<span className="text-gray-800 flex-1">{data.Receiver.address}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="font-semibold text-gray-600 min-w-[70px]">ایمیل:</span>
										<span className="text-gray-800">{data.Receiver.email || "-"}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="font-semibold text-gray-600 min-w-[70px]">کشور:</span>
										<span className="text-gray-800">{data.Receiver.country || "-"}</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Goods Details */}
					<div className="flex-1 p-3">
						<h3 className="text-sm font-bold text-blue-700 mb-2 bg-blue-50 p-2 rounded border-r-4 border-blue-500">
							جزئیات محموله
						</h3>
						<table className="w-full text-xs border border-gray-300">
							<tbody>
								<tr>
									<td className="border border-gray-300 p-1 font-semibold">
										وزن:
									</td>
									<td className="border border-gray-300 p-1">
										{formatNumber(data.totalWeight)} کیلوگرام
									</td>
								</tr>
								<tr>
									<td className="border border-gray-300 p-1 font-semibold">
										تعداد:
									</td>
									<td className="border border-gray-300 p-1">
										{formatNumber(data.piece)}
									</td>
								</tr>
								<tr>
									<td className="border border-gray-300 p-1 font-semibold">
										قیمت هر کیلو/دانه:
									</td>
									<td className="border border-gray-300 p-1">
										{formatCurrency(data.perKgCash)}
									</td>
								</tr>
								<tr>
									<td className="border border-gray-300 p-1 font-semibold">
										ارزش اجناس:
									</td>
									<td className="border border-gray-300 p-1">
										{formatCurrency(data.value)}
									</td>
								</tr>
							</tbody>
						</table>

						<div className="mt-6">
							<div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 ">
								<h3 className="text-white font-bold text-sm flex items-center gap-2">
									<svg
										className="w-4 h-4"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
									</svg>
									لیست بسته‌بندی
								</h3>
							</div>

							{/* Split tables if more than 7 items */}
							{data.packList && data.packList.length > 7 ? (
								<div className="grid grid-cols-2 gap-4 border border-gray-300 p-4">
									{/* First Table - Items 1-7 */}
									<div>
										<div className="overflow-x-auto">
											<table className="w-full text-xs">
												<thead>
													<tr className="bg-gray-100">
														<th className="py-2 px-3 text-center font-bold text-gray-700 border border-gray-300">
															#
														</th>
														<th className="py-2 px-3 text-right font-bold text-gray-700 border border-gray-300">
															نام جنس
														</th>
														<th className="py-2 px-3 text-center font-bold text-gray-700 border border-gray-300">
															تعداد
														</th>
														<th className="py-2 px-3 text-center font-bold text-gray-700 border border-gray-300">
															وزن
														</th>
														<th className="py-2 px-3 text-center font-bold text-gray-700 border border-gray-300">
															ارزش ($)
														</th>
													</tr>
												</thead>
												<tbody>
													{data.packList.slice(0, 7).map((item, index) => (
														<tr
															key={index}
															className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
																} hover:bg-blue-50`}
														>
															<td className="py-2 px-3 text-center font-bold text-gray-800 border border-gray-300">
																{formatNumber(index + 1)}
															</td>
															<td className="py-2 px-3 text-right border border-gray-300 font-medium">
																{item.description}
															</td>
															<td className="py-2 px-3 text-center border border-gray-300">
																<span className="w-16 px-2 py-1 border border-gray-400 rounded text-center inline-block">
																	{formatNumber(item.qty || 0)}
																</span>
															</td>
															<td className="py-2 px-3 text-center border border-gray-300">
																<span className="w-16 px-2 py-1 border border-gray-400 rounded text-center inline-block">
																	{formatNumber(item.weight || 0)}
																</span>
															</td>
															<td className="py-2 px-3 text-center border border-gray-300">
																<span className="w-20 px-2 py-1 border border-gray-400 rounded text-center inline-block">
																	${formatNumber(item.value || 0)}
																</span>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>

									{/* Second Table - Items 8+ */}
									<div>
										<div className="overflow-x-auto">
											<table className="w-full text-xs">
												<thead>
													<tr className="bg-gray-100">
														<th className="py-2 px-3 text-center font-bold text-gray-700 border border-gray-300">
															#
														</th>
														<th className="py-2 px-3 text-right font-bold text-gray-700 border border-gray-300">
															نام جنس
														</th>
														<th className="py-2 px-3 text-center font-bold text-gray-700 border border-gray-300">
															تعداد
														</th>
														<th className="py-2 px-3 text-center font-bold text-gray-700 border border-gray-300">
															وزن
														</th>
														<th className="py-2 px-3 text-center font-bold text-gray-700 border border-gray-300">
															ارزش ($)
														</th>
													</tr>
												</thead>
												<tbody>
													{data.packList.slice(7).map((item, index) => (
														<tr
															key={index + 7}
															className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
																} hover:bg-blue-50`}
														>
															<td className="py-2 px-3 text-center font-bold text-gray-800 border border-gray-300">
																{formatNumber(index + 8)}
															</td>
															<td className="py-2 px-3 text-right border border-gray-300 font-medium">
																{item.description}
															</td>
															<td className="py-2 px-3 text-center border border-gray-300">
																<span className="w-16 px-2 py-1 border border-gray-400 rounded text-center inline-block">
																	{formatNumber(item.qty || 0)}
																</span>
															</td>
															<td className="py-2 px-3 text-center border border-gray-300">
																<span className="w-16 px-2 py-1 border border-gray-400 rounded text-center inline-block">
																	{formatNumber(item.weight || 0)}
																</span>
															</td>
															<td className="py-2 px-3 text-center border border-gray-300">
																<span className="w-20 px-2 py-1 border border-gray-400 rounded text-center inline-block">
																	${formatNumber(item.value || 0)}
																</span>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							) : (
								<div className="overflow-x-auto border border-gray-300">
									<table className="w-full text-xs">
										<thead>
											<tr className="bg-gray-100">
												<th className="py-2 px-3 text-center font-bold text-gray-700 border-l border-gray-300">
													#
												</th>
												<th className="py-2 px-3 text-right font-bold text-gray-700 border-l border-gray-300">
													نام جنس
												</th>
												<th className="py-2 px-3 text-center font-bold text-gray-700 border-l border-gray-300">
													تعداد
												</th>
												<th className="py-2 px-3 text-center font-bold text-gray-700 border-l border-gray-300">
													وزن (کیلو)
												</th>
												<th className="py-2 px-3 text-center font-bold text-gray-700 border-l border-gray-300">
													ارزش ($)
												</th>
											</tr>
										</thead>
										<tbody>
											{data.packList.map((item, index) => (
												<tr
													key={index}
													className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
														} hover:bg-blue-50`}
												>
													<td className="py-2 px-3 text-center font-bold text-gray-800 border-t border-gray-300 border-l">
														{formatNumber(index + 1)}
													</td>
													<td className="py-2 px-3 text-right border-t border-gray-300 border-l font-medium">
														{item.description}
													</td>
													<td className="py-2 px-3 text-center border border-gray-300">
														<span className="w-16 px-2 py-1 border border-gray-400 rounded text-center inline-block">
															{formatNumber(item.qty || 0)}
														</span>
													</td>
													<td className="py-2 px-3 text-center border-t border-gray-300 border-l">
														<span className="w-16 px-2 py-1 border border-gray-400 rounded text-center inline-block">
															{formatNumber(item.weight || 0)}
														</span>
													</td>
													<td className="py-2 px-3 text-center border-t border-gray-300 border-l">
														<span className="w-20 px-2 py-1 border border-gray-400 rounded text-center inline-block">
															{formatCurrency(item.value || 0)}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>

					{/* Bill Summary */}
					<div className="flex border-t h-[110px] border-gray-300 bg-gray-50">
						{/* LEFT 1/3 — Totals Section */}
						<div className="w-1/3 border-l border-gray-300 p-4">
							<div className="space-y-1 text-xs">
								<div className="flex justify-between font-bold border-t border-gray-300 pt-1 text-sm">
									<span>مجموع کل:</span>
									<span className="text-cyan-800">
										{formatCurrency(data.totalCash)}
									</span>
								</div>
								<div className="flex justify-between font-bold border-t border-gray-300 pt-1 text-sm">
									<span>دریافتی:</span>
									<span className="text-green-600">
										{formatCurrency(data.received || 0)}
									</span>
								</div>
								<div className="flex justify-between font-bold border-t border-gray-300 pt-1">
									<span
										className={
											data.remain > 0 ? "text-red-600" : "text-green-600"
										}
									>
										باقیمانده:
									</span>
									<span
										className={
											data.remain > 0 ? "text-red-600" : "text-green-600"
										}
									>
										{formatCurrency(data.remain)}
									</span>
								</div>
							</div>
						</div>

						{/* RIGHT 2/3 — Signature Section */}
						<div className="w-2/3 flex border-r border-gray-300">
							{/* Office Signature */}
							<div className="w-1/2 flex flex-col items-center justify-center p-4 text-center border-gray-300">
								<div className="w-full border border-gray-400 h-28 rounded-lg flex flex-col items-center justify-center bg-gray-50">
									<p className="text-gray-600 text-sm font-semibold mb-2">
										محل امضاء و مُهر اداره
									</p>
									<p className="text-gray-500 text-xs">امضای مسئول</p>
								</div>
							</div>

							{/* Customer Signature */}
							<div className="w-1/2 flex flex-col items-center justify-center p-4 text-center">
								<div className="w-full border border-gray-400 h-28 rounded-lg flex flex-col items-center justify-center bg-gray-50">
									<p className="text-gray-600 text-sm font-semibold mb-2">
										محل امضاء فرستنده
									</p>
									<p className="text-gray-500 text-xs">امضای مشتری</p>
								</div>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div id="footer-area" className="border-t text-black  px-4 py-4 ">
						{/* Phone Numbers */}
						<div className="flex items-center  text-base gap-2 pb-2 ">
							<span>تماس: ۰۷۸۰۱۷۷۰۶۰ - ۰۷۷۹۷۱۰۹۹۶ </span>
						</div>

						{/* Address */}
						<p className="text-black font-semibold text-base  pb-2">
							آدرس: مارکیت بهار سراب، تانک تیل، دشت برچی، کابل، افغانستان
						</p>
					</div>
				</div>
			</div>

			{/* Buttons */}
			<div className="absolute bottom-6 left-6 flex gap-3 print:hidden">
				<button
					onClick={onClose}
					className="px-2 h-12 align-center bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center shadow-lg transition-colors"
				>
					<FaTimes size={14} /> بستن
				</button>
				<button
					onClick={handlePrint}
					className="px-2 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center shadow-lg transition-colors"
				>
					<FaPrint size={14} /> چاپ بل
				</button>
				<button className="h-12 text-white rounded-lg flex items-center transition-colors">
					<Regulation data={data} />
				</button>
			</div>

			{/* Print Styles */}
			<style jsx global>{`
				@media print {
					@page {
						size: A4 portrait;
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
						padding-right: 20mm;
						width: 210mm !important;
						height: 297mm !important;
						box-shadow: none !important;
					}
				}
			`}</style>
		</div>
	);
};

export default PrintShippingBill;
