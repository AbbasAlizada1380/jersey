import React, { useEffect, useState, useCallback, useRef } from "react";
import { packageService, zoneService } from "../services/packageService";
import PackageList from "./PackageList";
import {
  FaUser,
  FaBox,
  FaTruck,
  FaMoneyBillWave,
  FaShoppingCart,
  FaGlobeAmericas,
  FaCheck,
  FaEdit,
  FaTrash,
  FaCalculator,
  FaFilePdf,
  FaTimes,
  FaDownload,
  FaSpinner,
} from "react-icons/fa";
import PackingListAndDetails from "./PackingListAndDetails";
import Calculator from "../Calculator/Calculator.jsx";

const PackageCrud = () => {
  const [packages, setPackages] = useState([]);
  const [zones, setZones] = useState([]);
  const [Mode, setMode] = useState("crude");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [priceList, setPriceList] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  const fileInputRef = useRef(null);

  const [calculatedTotals, setCalculatedTotals] = useState({
    totalWeight: 0,
    totalPieces: 0,
    totalValue: 0,
  });

  const [form, setForm] = useState({
    // Sender fields
    senderName: "",
    senderAddress: "",
    senderEmail: "",
    senderPhoneNumber: "",
    senderCountry: "",
    senderCity: "",
    senderState: "",
    senderZipCode: "",
    // Receiver fields
    receiverName: "",
    receiverAddress: "",
    receiverEmail: "",
    receiverPhoneNumber: "",
    receiverCountry: "",
    receiverCity: "",
    receiverState: "",
    receiverZipCode: "",
    // Package fields
    perKgCash: "",
    OPerKgCash: "",
    OTotalCash: "",
    transitWay: "",
    totalCash: "",
    remain: "",
    received: "",
    IdCard: "",
    extraCharges: "0",
    run: "",
    date: "",
    track_number: "",
    // File upload fields
    idDocumentPath: "",
    idDocumentName: "",
    idDocumentMetadata: {},
    // These will be auto-calculated from packList
    totalWeight: "0",
    piece: "0",
    pieceDetails: {},
    value: "0",
    // Pack list will be stored here
    packList: [],
  });

  const [resetPackingListTrigger, setResetPackingListTrigger] = useState(Date.now());

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('لطفاً فقط فایل PDF انتخاب کنید');
        fileInputRef.current.value = '';
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alert('حجم فایل نباید بیشتر از ۱۰ مگابایت باشد');
        fileInputRef.current.value = '';
        return;
      }

      setSelectedFile(file);
      setUploadedFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download file
  const handleDownloadFile = (filePath, fileName) => {
    if (filePath) {
      window.open(filePath, '_blank');
    }
  };

  // Sync transitWay with selected option when priceList changes
  useEffect(() => {
    if (selectedOptionId && priceList && priceList.data) {
      const selectedOption = priceList.data.find(
        (option) => option.id === selectedOptionId
      );
      if (selectedOption && selectedOption.Transit.name !== form.transitWay) {
        setForm((prev) => ({
          ...prev,
          transitWay: selectedOption.Transit.name,
        }));
      }
    }
  }, [selectedOptionId, priceList]);

  // Fetch initial data
  useEffect(() => {
    fetchPackages(currentPage);
    fetchZones();
  }, []);

  // Fetch price list when receiver country or weight changes
  useEffect(() => {
    const fetchPriceList = async () => {
      if (
        form.receiverCountry &&
        form.totalWeight &&
        parseFloat(form.totalWeight) > 0
      ) {
        const weight = parseFloat(form.totalWeight);
        try {
          setLoading(true);
          const priceData = await zoneService.getPriceListByCountryAndWeight(
            weight,
            form.receiverCountry
          );
          setPriceList(priceData);

          // Auto-fill with the cheapest option if available
          if (priceData && priceData.data && priceData.data.length > 0) {
            const options = priceData.data;
            const cheapestOption = options.reduce((min, current) =>
              parseFloat(current.price) < parseFloat(min.price) ? current : min
            );

            const price = parseFloat(cheapestOption.price);
            const totalWeight = parseFloat(form.totalWeight) || 0;

            // Calculate but don't override user input for perKgCash
            const OTotalCash = (totalWeight * price).toFixed(2);

            setForm((prevForm) => ({
              ...prevForm,
              OPerKgCash: cheapestOption.price,
              transitWay: cheapestOption.Transit.name,
              OTotalCash: OTotalCash,
            }));

            setSelectedOptionId(cheapestOption.id);
          } else {
            // Reset transit info if no options available
            setForm((prevForm) => ({
              ...prevForm,
              OPerKgCash: "",
              transitWay: "",
              OTotalCash: "",
            }));
            setSelectedOptionId(null);
          }
        } catch (err) {
          console.error("خطا در دریافت لیست قیمت: ", err);
          setPriceList(null);
          setSelectedOptionId(null);
          // Reset transit info on error
          setForm((prevForm) => ({
            ...prevForm,
            OPerKgCash: "",
            transitWay: "",
            OTotalCash: "",
          }));
        } finally {
          setLoading(false);
        }
      } else {
        setPriceList(null);
        setSelectedOptionId(null);
        // Reset transit info if no weight or country
        setForm((prevForm) => ({
          ...prevForm,
          OPerKgCash: "",
          transitWay: "",
          OTotalCash: "",
        }));
      }
    };

    const debounceTimer = setTimeout(fetchPriceList, 500);
    return () => clearTimeout(debounceTimer);
  }, [form.receiverCountry, form.totalWeight]);

  // Auto-calculate totalCash, remain, and OTotalCash whenever dependencies change
  useEffect(() => {
    const weight = parseFloat(form.totalWeight) || 0;
    const perKg = parseFloat(form.perKgCash) || 0;
    const received = parseFloat(form.received) || 0;
    const OPerKg = parseFloat(form.OPerKgCash) || 0;
    const extraCharges = parseFloat(form.extraCharges) || 0;

    // Calculate totalCash (perKgCash * totalWeight) + extraCharges
    const totalCash = ((weight * perKg) + extraCharges).toFixed(2);

    // Calculate remain (totalCash - received)
    const remain = (parseFloat(totalCash) - received).toFixed(2);

    // Calculate OTotalCash (OPerKgCash * totalWeight) + extraCharges
    const OTotalCash = ((weight * OPerKg) + extraCharges).toFixed(2);

    // Only update if values have changed
    setForm((prev) => {
      if (
        prev.totalCash !== totalCash ||
        prev.remain !== remain ||
        prev.OTotalCash !== OTotalCash
      ) {
        return {
          ...prev,
          totalCash,
          remain,
          OTotalCash,
        };
      }
      return prev;
    });
  }, [form.totalWeight, form.perKgCash, form.received, form.OPerKgCash, form.extraCharges]);

  // Separate effect for validating received amount
  useEffect(() => {
    const totalCash = parseFloat(form.totalCash) || 0;
    const received = parseFloat(form.received) || 0;

    if (received > totalCash) {
      setForm((prev) => ({
        ...prev,
        received: totalCash.toString(),
      }));
    }
  }, [form.totalCash, form.received]);

  const fetchPackages = async (page) => {
    try {
      setLoading(true);
      const data = await packageService.getAllPackages(page);
      setPackages(data.packages);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("خطا در دریافت بسته‌ها:", err);
      alert("خطا در دریافت بسته‌ها");
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const data = await zoneService.getAllZones();
      setZones(data.countries);
    } catch (err) {
      console.error("خطا در دریافت مناطق:", err);
      alert("خطا در دریافت اطلاعات مناطق");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Validate numeric inputs
    if (name.includes("Cash") || name === "value" || name === "received" || name === "extraCharges") {
      // Allow only numbers and one decimal point
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setForm((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
      return;
    }

    // Special handling for transitWay changes from dropdown
    if (name === "transitWay") {
      // Find the selected option from priceList
      if (priceList && priceList.data) {
        const selectedOption = priceList.data.find(
          (option) => option.Transit.name === value
        );

        if (selectedOption) {
          const price = parseFloat(selectedOption.price);
          const weight = parseFloat(form.totalWeight) || 0;
          const extraCharges = parseFloat(form.extraCharges) || 0;
          const OTotalCash = ((weight * price) + extraCharges).toFixed(2);

          // Update form with the selected option
          setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
            OPerKgCash: selectedOption.price,
            OTotalCash: OTotalCash,
          }));

          // Update selected option ID to highlight the correct card
          setSelectedOptionId(selectedOption.id);
          return;
        }
      }
    }

    // For other fields
    setForm((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const selectPriceOption = useCallback(
    (option) => {
      const price = parseFloat(option.price);
      const weight = parseFloat(form.totalWeight) || 0;
      const extraCharges = parseFloat(form.extraCharges) || 0;
      const OTotalCash = ((weight * price) + extraCharges).toFixed(2);

      setForm((prevForm) => ({
        ...prevForm,
        OPerKgCash: option.price,
        transitWay: option.Transit.name,
        OTotalCash: OTotalCash,
        // Don't update perKgCash - user will enter manually
      }));
      setSelectedOptionId(option.id);
    },
    [form.totalWeight, form.extraCharges]
  );

  const onPageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      fetchPackages(pageNumber);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFileUploading(true);

    if (!form.perKgCash || parseFloat(form.perKgCash) <= 0) {
      alert("لطفاً نرخ مشتری هر کیلو را وارد کنید");
      setLoading(false);
      setFileUploading(false);
      return;
    }

    const sender = {
      name: form.senderName,
      address: form.senderAddress,
      email: form.senderEmail,
      phoneNumber: form.senderPhoneNumber,
      country: form.senderCountry,
      city: form.senderCity,
      state: form.senderState,
      zipCode: form.senderZipCode,
    };

    const receiver = {
      name: form.receiverName,
      address: form.receiverAddress,
      email: form.receiverEmail,
      phoneNumber: form.receiverPhoneNumber,
      country: form.receiverCountry,
      city: form.receiverCity,
      state: form.receiverState,
      zipCode: form.receiverZipCode,
    };

    const packageData = {
      totalWeight: parseFloat(form.totalWeight) || 0,
      piece: parseInt(form.piece) || 0,
      value: parseFloat(form.value) || 0,
      perKgCash: parseFloat(form.perKgCash) || 0,
      OPerKgCash: parseFloat(form.OPerKgCash) || 0,
      OTotalCash: parseFloat(form.OTotalCash) || 0,
      transitWay: form.transitWay,
      totalCash: parseFloat(form.totalCash) || 0,
      remain: parseFloat(form.remain) || 0,
      received: parseFloat(form.received) || 0,
      run: form.run ? parseFloat(form.run) : null,
      extraCharges: parseFloat(form.extraCharges) || 0,
      date: form.date || null,
      track_number: form.track_number || "",
      packList: form.packList || [],
      pieceDetails: form.pieceDetails || {},
    };

const payload = { sender, receiver, packageData }; 
    // Append file if selected
    if (selectedFile) {
      formData.append('idDocument', selectedFile);
    }

    try {
      console.log(sender);
      console.log(receiver);
      console.log(packageData);

      if (editingId) {
        // For update, you might need to handle file separately
        await packageService.updatePackage(editingId, {
          sender,
          receiver,
          packageData,
        });
        setEditingId(null);
        alert("بسته با موفقیت ویرایش شد");
      } else {
        await packageService.createPackage(payload, {
        });
        alert("بسته با موفقیت ایجاد شد");
      }

      resetForm();
      fetchPackages(currentPage);
    } catch (err) {
      console.error("خطا در ذخیره:", err);
      alert("خطا در ذخیره بسته: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setFileUploading(false);
    }
  };

  const resetForm = () => {
    setForm({
      senderName: "",
      senderAddress: "",
      senderEmail: "",
      senderPhoneNumber: "",
      senderCountry: "",
      senderCity: "",
      senderState: "",
      senderZipCode: "",
      receiverName: "",
      receiverAddress: "",
      receiverEmail: "",
      receiverPhoneNumber: "",
      receiverCountry: "",
      receiverCity: "",
      receiverState: "",
      receiverZipCode: "",
      totalWeight: "0",
      piece: "0",
      value: "0",
      perKgCash: "",
      OPerKgCash: "",
      OTotalCash: "",
      transitWay: "",
      totalCash: "",
      remain: "",
      received: "",
      extraCharges: "0",
      run: "",
      date: "",
      track_number: "",
      packList: [],
      pieceDetails: {},
      idDocumentPath: "",
      idDocumentName: "",
      idDocumentMetadata: {},
    });
    setPriceList(null);
    setSelectedOptionId(null);
    setCalculatedTotals({
      totalWeight: 0,
      totalPieces: 0,
      totalValue: 0,
    });
    setResetPackingListTrigger(Date.now());
    handleRemoveFile(); // Clear selected file
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg.id);

    // Format date if it exists (handle database format)
    let formattedDate = pkg.date || "";
    if (formattedDate && typeof formattedDate === 'string') {
      // Handle format: "2026-02-11 00:00:00" (from database)
      if (formattedDate.includes(' ')) {
        const [datePart] = formattedDate.split(' ');
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          formattedDate = datePart;
        }
      }
      // Handle ISO format
      else if (formattedDate.includes('T')) {
        try {
          const date = new Date(formattedDate);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
          }
        } catch (error) {
          console.error("Error formatting date:", error);
        }
      }
    }

    // Set uploaded file info if exists
    if (pkg.idDocumentPath) {
      setUploadedFileInfo({
        name: pkg.idDocumentName || 'Document',
        path: pkg.idDocumentPath,
        metadata: pkg.idDocumentMetadata,
      });
    }

    setForm({
      // Sender fields
      senderName: pkg.Sender?.name || "",
      senderAddress: pkg.Sender?.address || "",
      senderEmail: pkg.Sender?.email || "",
      senderPhoneNumber: pkg.Sender?.phoneNumber || "",
      senderCountry: pkg.Sender?.country || "",
      senderCity: pkg.Sender?.city || "",
      senderState: pkg.Sender?.state || "",
      senderZipCode: pkg.Sender?.zipCode || "",

      // Receiver fields
      receiverName: pkg.Receiver?.name || "",
      receiverAddress: pkg.Receiver?.address || "",
      receiverEmail: pkg.Receiver?.email || "",
      receiverPhoneNumber: pkg.Receiver?.phoneNumber || "",
      receiverCountry: pkg.Receiver?.country || "",
      receiverCity: pkg.Receiver?.city || "",
      receiverState: pkg.Receiver?.state || "",
      receiverZipCode: pkg.Receiver?.zipCode || "",

      // Package fields
      totalWeight: pkg.totalWeight?.toString() || "0",
      piece: pkg.piece?.toString() || "0",
      value: pkg.value?.toString() || "0",
      perKgCash: pkg.perKgCash?.toString() || "",
      OPerKgCash: pkg.OPerKgCash?.toString() || "",
      OTotalCash: pkg.OTotalCash?.toString() || "0",
      transitWay: pkg.transitWay || "",
      totalCash: pkg.totalCash?.toString() || "0",
      remain: pkg.remain?.toString() || "0",
      received: pkg.received?.toString() || "0",
      extraCharges: pkg.extraCharges?.toString() || "0",
      run: pkg.run?.toString() || "",
      date: formattedDate,
      track_number: pkg.track_number || "",
      packList: pkg.packList || [],
      pieceDetails: pkg.pieceDetails || {},
      idDocumentPath: pkg.idDocumentPath || "",
      idDocumentName: pkg.idDocumentName || "",
      idDocumentMetadata: pkg.idDocumentMetadata || {},
    });

    // Set selected option if priceList is available
    if (priceList && priceList.data && pkg.OPerKgCash) {
      const option = priceList.data.find(
        opt => opt.price === pkg.OPerKgCash.toString() &&
          opt.Transit.name === pkg.transitWay
      );
      if (option) {
        setSelectedOptionId(option.id);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("آیا از حذف این بسته اطمینان دارید؟")) return;

    try {
      await packageService.deletePackage(id);
      fetchPackages(currentPage);
      alert("بسته با موفقیت حذف شد");
    } catch (err) {
      console.error("خطا در حذف:", err);
      alert("خطا در حذف بسته");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="">
        {/* Header */}
        <div className="mb-8 bg-white rounded-md shadow-md p-6 ">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex text-gray-700 items-center gap-4">
                <FaBox className="text-4xl text-primary" />
                {editingId ? "ویرایش بسته" : " اضافه کردن بسته جدید"}
              </h1>
              <p className="text-gray-500 mt-2 mr-12">
                مدیریت ارسال بسته‌ها با محاسبات قیمت خودکار
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Scrollable Window containing both Transit Options and Calculator */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-md shadow-md overflow-hidden sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col">
              {/* Fixed Header */}
              <div className="bg-blue-600 p-4 flex-shrink-0">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  <FaTruck />
                  گزینه‌های حمل و نقل
                </h3>
                <p className="text-white-100 text-sm mt-1">
                  {form.receiverCountry ? (
                    <>مقصد: {form.receiverCountry} • وزن: {form.totalWeight || '0'} کیلوگرم</>
                  ) : (
                    'لطفاً کشور گیرنده را انتخاب کنید'
                  )}
                </p>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Transit Options - Only show if data exists */}
                {priceList && priceList.data && priceList.data.length > 0 && (
                  <div className="space-y-3">
                    {priceList.data.map((option) => {
                      const isCheapest =
                        priceList.data.reduce((min, current) =>
                          parseFloat(current.price) < parseFloat(min.price)
                            ? current
                            : min
                        ).id === option.id;

                      const isSelected = selectedOptionId === option.id;
                      const weight = parseFloat(form.totalWeight) || 0;
                      const price = parseFloat(option.price);
                      const extraCharges = parseFloat(form.extraCharges) || 0;
                      const totalPrice = ((weight * price) + extraCharges).toFixed(2);

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => selectPriceOption(option)}
                          className={`w-full p-4 rounded-lg border-2 transition-all transform hover:scale-[1.02] text-right ${isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-blue-300"
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${isSelected ? "bg-blue-500" : "bg-gray-300"
                                    }`}
                                ></div>
                                <span className="font-semibold text-gray-900">
                                  {option.Transit.name}
                                </span>
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <FaGlobeAmericas className="text-xs" />
                                  منطقه: {option.zoneId}
                                </div>
                                {isCheapest && (
                                  <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-green-800 text-xs rounded-full">
                                    <FaCheck className="text-xs" />
                                    ارزانترین گزینه
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="text-2xl font-bold text-blue-600">
                                ${option.price}
                                <span className="text-sm font-normal text-gray-500 mr-1">
                                  /کیلو
                                </span>
                              </div>
                              {form.totalWeight && weight > 0 && (
                                <div className="text-sm text-gray-500 mt-1">
                                  مجموع:{" "}
                                  <span className="font-semibold">
                                    ${totalPrice}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <div className="flex items-center justify-center text-blue-600 font-medium">
                                <FaCheck className="ml-2" />
                                انتخاب شده
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {/* Selection Summary */}
                    {form.transitWay && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-blue-800 font-medium">
                              گزینه انتخاب شده
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {form.transitWay}
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="text-2xl font-bold text-blue-600">
                              ${form.OPerKgCash || "0.00"}/کیلو
                            </div>
                            {form.totalWeight && (
                              <div className="text-sm text-gray-600">
                                مجموع دفتری:{" "}
                                <span className="font-bold">
                                  ${form.OTotalCash || "0.00"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State - Show when no transit options */}
                {(!priceList || !priceList.data || priceList.data.length === 0) && (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <FaGlobeAmericas className="text-5xl text-gray-300 mb-3" />
                      <p className="text-gray-600 font-medium mb-2">
                        {!form.receiverCountry
                          ? "لطفاً کشور گیرنده را انتخاب کنید"
                          : !form.totalWeight || parseFloat(form.totalWeight) <= 0
                            ? "لطفاً وزن بسته را وارد کنید"
                            : "هیچ گزینه حمل و نقلی یافت نشد"
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {!form.receiverCountry
                          ? "برای مشاهده گزینه‌های حمل و نقل، ابتدا کشور مقصد را انتخاب کنید"
                          : !form.totalWeight || parseFloat(form.totalWeight) <= 0
                            ? "برای مشاهده گزینه‌های حمل و نقل، وزن بسته را وارد کنید"
                            : "برای کشور و وزن وارد شده، گزینه حمل و نقلی موجود نیست"
                        }
                      </p>

                      {/* Show current values */}
                      <div className="mt-4 w-full bg-gray-50 rounded-lg p-3 text-right">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">کشور گیرنده:</span>
                          <span className="font-medium text-gray-800">
                            {form.receiverCountry || 'انتخاب نشده'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">وزن بسته:</span>
                          <span className="font-medium text-gray-800">
                            {form.totalWeight || '0'} کیلوگرم
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider - Only show if both sections are present */}
                {priceList && priceList.data && priceList.data.length > 0 && (
                  <div className="border-t border-gray-200 my-2"></div>
                )}

                {/* Calculator Section - Always visible */}
                {/* <div>
                    <Calculator />
                  </div> */}
              </div>
            </div>
          </div>

          {/* Package Form - Right Side (takes 2/3 of the space) */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-md shadow-md p-6"
            >
              {/* Form Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Sender Section */}
                <div className="md:col-span-1 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <FaUser className="text-gray-500" size={24} />
                    اطلاعات فرستنده
                  </h4>
                  <div className="space-y-4">
                    <FormInput
                      label="نام فرستنده"
                      name="senderName"
                      value={form.senderName}
                      onChange={handleChange}
                      required
                      placeholder="نام کامل"
                    />

                    <FormInput
                      label="آدرس فرستنده"
                      name="senderAddress"
                      value={form.senderAddress}
                      onChange={handleChange}
                      required
                      placeholder="آدرس کامل"
                    />
                    <FormInput
                      icon={<FaGlobeAmericas />}
                      label="شهر فرستنده"
                      name="senderCity"
                      value={form.senderCity}
                      onChange={handleChange}
                      required
                      placeholder="نام شهر را وارد کنید"
                    />

                    <FormInput
                      icon={<FaGlobeAmericas />}
                      label="ولایت/استان فرستنده"
                      name="senderState"
                      value={form.senderState}
                      onChange={handleChange}
                      required
                      placeholder="نام ولایت یا استان را وارد کنید"
                    />

                    <FormInput
                      icon={<FaGlobeAmericas />}
                      label="کد پستی فرستنده"
                      name="senderZipCode"
                      value={form.senderZipCode}
                      onChange={handleChange}
                      required
                      placeholder="کد پستی را وارد کنید"
                    />

                    <FormInput
                      label="ایمیل"
                      name="senderEmail"
                      type="email"
                      value={form.senderEmail}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />

                    <FormInput
                      label="شماره تماس"
                      name="senderPhoneNumber"
                      value={form.senderPhoneNumber}
                      onChange={handleChange}
                      required
                      placeholder="+1234567890"
                    />

                    <FormInput
                      label="کشور فرستنده"
                      name="senderCountry"
                      value={form.senderCountry}
                      onChange={handleChange}
                      required
                      placeholder="نام کشور"
                    />
                  </div>
                </div>

                {/* Receiver Section */}
                <div className="md:col-span-1 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <FaUser className="text-gray-500" size={24} />
                    اطلاعات گیرنده
                  </h4>
                  <div className="space-y-4">
                    <FormInput
                      icon={<FaUser />}
                      label="نام گیرنده"
                      name="receiverName"
                      value={form.receiverName}
                      onChange={handleChange}
                      required
                      placeholder="نام کامل"
                    />
                    <FormInput
                      icon={<FaGlobeAmericas />}
                      label="آدرس گیرنده"
                      name="receiverAddress"
                      value={form.receiverAddress}
                      onChange={handleChange}
                      required
                      placeholder="آدرس کامل"
                    />

                    <FormInput
                      icon={<FaGlobeAmericas />}
                      label="شهر گیرنده"
                      name="receiverCity"
                      value={form.receiverCity}
                      onChange={handleChange}
                      required
                      placeholder="نام شهر"
                    />

                    <FormInput
                      icon={<FaGlobeAmericas />}
                      label="ولایت/استان گیرنده"
                      name="receiverState"
                      value={form.receiverState}
                      onChange={handleChange}
                      required
                      placeholder="نام ولایت/استان"
                    />

                    <FormInput
                      icon={<FaGlobeAmericas />}
                      label="کد پستی گیرنده"
                      name="receiverZipCode"
                      value={form.receiverZipCode}
                      onChange={handleChange}
                      required
                      placeholder="کد پستی"
                    />

                    <FormInput
                      icon={<FaUser />}
                      label="ایمیل"
                      name="receiverEmail"
                      type="email"
                      value={form.receiverEmail}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />

                    <FormInput
                      icon={<FaUser />}
                      label="شماره تماس"
                      name="receiverPhoneNumber"
                      value={form.receiverPhoneNumber}
                      onChange={handleChange}
                      required
                      placeholder="+1234567890"
                    />

                    <FormSelect
                      icon={<FaGlobeAmericas />}
                      label="کشور گیرنده"
                      name="receiverCountry"
                      value={form.receiverCountry}
                      onChange={handleChange}
                      options={zones}
                      required
                    />
                  </div>
                </div>

                {/* File Upload Section */}
                

                {/* Packing List and Details Section */}
                <div className="md:col-span-2">
                  <PackingListAndDetails
                    form={form}
                    handleChange={handleChange}
                    setForm={setForm}
                    resetTrigger={resetPackingListTrigger}
                    isEditing={!!editingId}
                  />
                </div>

                {/* Pricing Section */}
                <div className="md:col-span-2 bg-gray-100 p-4 rounded-md">
                  {/* Input Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <FormInput
                      icon={<FaMoneyBillWave />}
                      label="نرخ مشتری هر کیلو ($)"
                      name="perKgCash"
                      type="text"
                      value={form.perKgCash}
                      onChange={handleChange}
                      required
                      placeholder="0.00"
                      pattern="\d*\.?\d*"
                      title="لطفاً عدد وارد کنید"
                    />

                    <div>
                      <label className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          روش حمل و نقل
                        </span>
                        <div className="relative">
                          <select
                            name="transitWay"
                            value={form.transitWay}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-md bg-gray-200 focus:ring-2 focus:ring-primary outline-none appearance-none transition-all"
                            disabled={!priceList || !priceList.data || priceList.data.length === 0}
                          >
                            <option value="">انتخاب روش حمل و نقل</option>
                            {priceList &&
                              priceList.data &&
                              priceList.data.map((option) => (
                                <option
                                  key={option.id}
                                  value={option.Transit.name}
                                >
                                  {option.Transit.name} (${option.price}/کیلو)
                                </option>
                              ))}
                          </select>
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </label>

                      {/* Display selected option info */}
                      {form.transitWay && priceList && priceList.data && (
                        <div className="mt-2 text-sm text-blue-600">
                          <div className="flex items-center gap-1">
                            <FaCheck className="text-xs" />
                            انتخاب شده: {form.transitWay} - $
                            {form.OPerKgCash || "0.00"}/کیلو
                          </div>
                          {form.totalWeight && form.OPerKgCash && (
                            <div className="text-xs text-gray-600 mt-1">
                              مجموع دفتری: ${form.OTotalCash || "0.00"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <FormInput
                      icon={<FaShoppingCart />}
                      label="نرخ دفتری هر کیلو ($)"
                      name="OPerKgCash"
                      type="text"
                      value={form.OPerKgCash}
                      onChange={handleChange}
                      placeholder="0.00"
                      pattern="\d*\.?\d*"
                      title="لطفاً عدد وارد کنید"
                      className="bg-gray-100"
                    />
                  </div>

                  {/* Input Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-5 bg-white rounded-md shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500 mb-1">
                          مجموع دفتری ($)
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          (وزن × نرخ دفتری) + هزینه اضافی =
                          {(Number(form.totalWeight) || 0).toFixed(2)} ×{" "}
                          {(Number(form.OPerKgCash) || 0).toFixed(2)} +{" "}
                          {(Number(form.extraCharges) || 0).toFixed(2)}
                        </div>

                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        ${form.OTotalCash || "0.00"}
                      </div>
                    </div>

                    <div className="p-5 bg-white rounded-md shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500 mb-1">
                          مجموع کل ($)
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          (وزن × نرخ دستی) + هزینه اضافی = {form.totalWeight || "0"} ×{" "}
                          {form.perKgCash || "0"} + {form.extraCharges || "0"}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        ${form.totalCash || "0.00"}
                      </div>
                    </div>
                    <div className="col-span-2 mt-3">
                      <FormInput
                        icon={<FaMoneyBillWave />}
                        label="هزینه اضافی ($)"
                        name="extraCharges"
                        type="text"
                        value={form.extraCharges}
                        onChange={handleChange}
                        placeholder="0.00"
                        pattern="\d*\.?\d*"
                        title="لطفاً عدد وارد کنید"
                      />
                    </div>
                    <div className="col-span-2 mt-3">
                      <FormInput
                        icon={<FaMoneyBillWave />}
                        label="دریافتی ($)"
                        name="received"
                        type="text"
                        value={form.received}
                        onChange={handleChange}
                        placeholder="0.00"
                        pattern="\d*\.?\d*"
                        title="لطفاً عدد وارد کنید"
                      />
                    </div>
                  </div>

                  {/* Remain Section */}
                  <div className="p-4 bg-white rounded-md shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          مانده حساب ($)
                        </div>
                        <div className="text-3xl font-bold text-orange-600">
                          ${form.remain || "0.00"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          (مجموع کل - دریافتی) = {form.totalCash || "0.00"} -{" "}
                          {form.received || "0.00"}
                        </div>
                        <div
                          className={`text-xs mt-2 px-3 py-1 rounded-full ${parseFloat(form.remain) > 0
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                            }`}
                        >
                          {parseFloat(form.remain) > 0
                            ? "پرداخت نشده"
                            : "تسویه شده"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#0F3A76] text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {fileUploading ? "در حال آپلود فایل..." : "در حال پردازش..."}
                      </>
                    ) : editingId ? (
                      <>
                        <FaEdit />
                        ویرایش بسته
                      </>
                    ) : (
                      <>
                        <FaBox />
                        ایجاد بسته جدید
                      </>
                    )}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        resetForm();
                      }}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      لغو ویرایش
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border-2 bg-gray-200 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    بازنشانی فرم
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Full Package List */}
        <div className="mt-8">
          <PackageList
            setPackages={setPackages}
            packages={packages}
            onEdit={handleEdit}
            onDelete={handleDelete}
            mode={Mode}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
};

const FormSelect = ({ icon, label, options, ...props }) => (
  <label className="flex flex-col">
    <span className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
      {label}
      {props.required && <span className="text-red-500">*</span>}
    </span>
    <div className="relative">
      <select
        {...props}
        className="w-full px-4 py-3 bg-gray-200 rounded-md focus:ring-1 focus:ring-primary outline-none appearance-none transition-all"
      >
        <option value="">انتخاب {label}</option>
        {options &&
          Array.isArray(options) &&
          options.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const labelText =
              typeof option === "string" ? option : option.label;
            return (
              <option key={value} value={value}>
                {labelText}
              </option>
            );
          })}
      </select>
    </div>
  </label>
);

const FormInput = ({ icon, label, readOnly, className, ...props }) => (
  <label className="flex flex-col">
    <span className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
      {label}
      {props.required && <span className="text-red-500">*</span>}
    </span>
    <div className="relative">
      <input
        {...props}
        readOnly={readOnly}
        className={`w-full px-4 py-3 bg-gray-200 rounded-md focus:ring-1 focus:ring-primary outline-none transition-all ${readOnly ? "bg-gray-100 cursor-not-allowed" : ""
          } ${className || ""}`}
      />
    </div>
  </label>
);

export default PackageCrud;