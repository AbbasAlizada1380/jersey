import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaBox,
  FaWeight,
  FaCalendarAlt,
  FaPlus,
  FaTrash,
  FaRuler,
  FaCheckSquare,
  FaSquare,
  FaCalculator,
} from "react-icons/fa";

const PackingListAndDetails = ({
  form,
  handleChange,
  setForm,
  resetTrigger,
  isEditing = false,
}) => {
  // Initial list - this should be static with value field added
  const initialPackList = [
    { description: "لباس زنانه", qty: "", weight: "", value: "" },
    { description: "مردانه لباس", qty: "", weight: "", value: "" },
    { description: "چادر", qty: "", weight: "", value: "" },
    { description: "پتلون مردانه", qty: "", weight: "", value: "" },
    { description: "جاکت زنانه", qty: "", weight: "", value: "" },


  ];

  const [packList, setPackList] = useState(initialPackList);
  const [newItemDescription, setNewItemDescription] = useState("");
  const [pieceCards, setPieceCards] = useState([]);
  const [pieceInput, setPieceInput] = useState("");

  const isInitialMount = useRef(true);
  const lastPackListRef = useRef([]);
  const shouldUpdateParent = useRef(true);
  const lastPieceCardsRef = useRef(""); // Add this to track pieceCards changes
  const lastTotalWeightRef = useRef(""); // Add this to track totalWeight changes

  // Format date function
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";

    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

      if (dateString.includes(' ')) {
        const [datePart] = dateString.split(' ');
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          return datePart;
        }
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Reset when resetTrigger changes
  useEffect(() => {
    if (resetTrigger) {
      setPackList(
        initialPackList.map((item) => ({
          description: item.description,
          qty: "",
          weight: "",
          value: "",
        }))
      );
      setNewItemDescription("");
      setPieceCards([]);
      setPieceInput("");
      shouldUpdateParent.current = true;
      lastPackListRef.current = [];
      lastPieceCardsRef.current = "";
      lastTotalWeightRef.current = "";
    }
  }, [resetTrigger]);

  // Initialize component when editing
  useEffect(() => {
    if (isEditing) {
      // Initialize packList from form.packList
      if (form.packList && form.packList.length > 0) {
        const savedItemsMap = {};
        form.packList.forEach(item => {
          if (item.description) {
            savedItemsMap[item.description] = {
              qty: item.qty?.toString() || "",
              weight: item.weight?.toString() || "",
              value: item.value?.toString() || "",
            };
          }
        });

        const updatedPackList = initialPackList.map(item => {
          if (savedItemsMap[item.description]) {
            return {
              ...item,
              qty: savedItemsMap[item.description].qty,
              weight: savedItemsMap[item.description].weight,
              value: savedItemsMap[item.description].value,
            };
          }
          return item;
        });

        const customItems = form.packList.filter(item =>
          item.description && !initialPackList.some(initialItem => initialItem.description === item.description)
        );

        const finalPackList = [...updatedPackList];
        customItems.forEach(customItem => {
          finalPackList.push({
            description: customItem.description,
            qty: customItem.qty?.toString() || "",
            weight: customItem.weight?.toString() || "",
            value: customItem.value?.toString() || "",
          });
        });

        setPackList(finalPackList);
        lastPackListRef.current = form.packList;
      }

      // Initialize piece cards from form.pieceDetails
      if (form.pieceDetails && Object.keys(form.pieceDetails).length > 0) {
        const piecesArray = [];
        Object.keys(form.pieceDetails).forEach(key => {
          const piece = form.pieceDetails[key];
          piecesArray.push({
            id: parseInt(key),
            weight: piece.weight?.toString() || "",
            hasDimensions: !!(piece.height && piece.width && piece.length &&
              piece.height > 0 && piece.width > 0 && piece.length > 0),
            height: piece.height?.toString() || "",
            width: piece.width?.toString() || "",
            length: piece.length?.toString() || "",
            dimensionWeight: piece.dimensionWeight?.toString() || "",
            actualWeight: piece.actualWeight?.toString() || piece.weight?.toString() || "",
          });
        });

        if (piecesArray.length > 0) {
          setPieceCards(piecesArray);
          setPieceInput(piecesArray.length.toString());
          lastPieceCardsRef.current = JSON.stringify(piecesArray);
        }
      }

      // Format date if needed
      if (form.date && typeof form.date === 'string') {
        const formattedDate = formatDateForInput(form.date);
        if (formattedDate !== form.date) {
          setTimeout(() => {
            setForm(prev => ({
              ...prev,
              date: formattedDate
            }));
          }, 0);
        }
      }
    }
  }, [isEditing]); // Remove dependencies to prevent re-runs

  // Handle date change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate total weight including dimension weight
  const calculateTotalWeightWithDimensions = useCallback(() => {
    let totalWeight = 0;
    let dimensionWeightTotal = 0;
    let actualWeightTotal = 0;

    pieceCards.forEach(card => {
      const actualWeight = parseFloat(card.weight) || 0;
      actualWeightTotal += actualWeight;

      if (card.hasDimensions) {
        const height = parseFloat(card.height) || 0;
        const width = parseFloat(card.width) || 0;
        const length = parseFloat(card.length) || 0;

        if (height > 0 && width > 0 && length > 0) {
          const dimensionWeight = (height * width * length) / 5000;
          dimensionWeightTotal += dimensionWeight;
          totalWeight += dimensionWeight;
        } else {
          totalWeight += actualWeight;
        }
      } else {
        totalWeight += actualWeight;
      }
    });

    return {
      totalWeight: totalWeight,
      dimensionWeightTotal: dimensionWeightTotal,
      actualWeightTotal: actualWeightTotal
    };
  }, [pieceCards]);

  // Update pieceDetails in form - FIXED with proper change detection
  useEffect(() => {
    if (pieceCards.length > 0) {
      const { totalWeight } = calculateTotalWeightWithDimensions();

      // Check if totalWeight changed to avoid infinite loop
      const totalWeightStr = totalWeight.toString();
      if (lastTotalWeightRef.current !== totalWeightStr) {
        lastTotalWeightRef.current = totalWeightStr;

        setForm(prev => ({
          ...prev,
          totalWeight: totalWeightStr
        }));
      }

      // Create pieceDetails object
      const pieceDetailsObj = {};
      pieceCards.forEach(card => {
        const height = parseFloat(card.height) || 0;
        const width = parseFloat(card.width) || 0;
        const length = parseFloat(card.length) || 0;
        const actualWeight = parseFloat(card.weight) || 0;
        let dimensionWeight = 0;

        if (card.hasDimensions && height > 0 && width > 0 && length > 0) {
          dimensionWeight = (height * width * length) / 5000;
        }

        pieceDetailsObj[card.id] = {
          width: width,
          height: height,
          length: length,
          weight: actualWeight,
          actualWeight: actualWeight,
          dimensionWeight: dimensionWeight
        };
      });

      // Check if pieceDetails actually changed before updating
      const pieceDetailsStr = JSON.stringify(pieceDetailsObj);
      if (lastPieceCardsRef.current !== pieceDetailsStr) {
        lastPieceCardsRef.current = pieceDetailsStr;

        setForm(prev => ({
          ...prev,
          pieceDetails: pieceDetailsObj,
          piece: pieceCards.length.toString()
        }));
      }
    } else if (form.pieceDetails && Object.keys(form.pieceDetails).length > 0) {
      // Check if we need to clear
      if (lastPieceCardsRef.current !== "{}") {
        lastPieceCardsRef.current = "{}";
        setForm(prev => ({
          ...prev,
          pieceDetails: {},
          piece: "0"
        }));
      }
    }
  }, [pieceCards, calculateTotalWeightWithDimensions]); // Keep dependencies but with change detection

  // Handle editing mode for packList
  useEffect(() => {
    if (isEditing && form.packList && form.packList.length > 0) {
      const formPackListStr = JSON.stringify(form.packList);
      const lastPackListStr = JSON.stringify(lastPackListRef.current);

      if (formPackListStr !== lastPackListStr) {
        const savedItemsMap = {};
        form.packList.forEach(item => {
          if (item.description) {
            savedItemsMap[item.description] = {
              qty: item.qty?.toString() || "",
              weight: item.weight?.toString() || "",
              value: item.value?.toString() || "",
            };
          }
        });

        const updatedPackList = initialPackList.map(item => {
          if (savedItemsMap[item.description]) {
            return {
              ...item,
              qty: savedItemsMap[item.description].qty,
              weight: savedItemsMap[item.description].weight,
              value: savedItemsMap[item.description].value,
            };
          }
          return item;
        });

        const customItems = form.packList.filter(item =>
          item.description && !initialPackList.some(initialItem => initialItem.description === item.description)
        );

        const finalPackList = [...updatedPackList];
        customItems.forEach(customItem => {
          finalPackList.push({
            description: customItem.description,
            qty: customItem.qty?.toString() || "",
            weight: customItem.weight?.toString() || "",
            value: customItem.value?.toString() || "",
          });
        });

        setPackList(finalPackList);
        lastPackListRef.current = form.packList;

        shouldUpdateParent.current = false;
        setTimeout(() => {
          shouldUpdateParent.current = true;
        }, 100);
      }
    }
  }, [isEditing, form.packList]);

  // Update parent form when packList changes
  const updateParentForm = useCallback((currentPackList) => {
    if (!shouldUpdateParent.current) return;

    const filteredList = currentPackList.filter(
      (item) => {
        const qty = parseFloat(item.qty) || 0;
        const weight = parseFloat(item.weight) || 0;
        const value = parseFloat(item.value) || 0;
        const hasDescription = item.description && item.description.trim() !== "";

        return hasDescription && (qty > 0 || weight > 0 || value > 0);
      }
    );

    const formattedList = filteredList.map(item => ({
      description: item.description,
      qty: parseFloat(item.qty) || 0,
      weight: parseFloat(item.weight) || 0,
      value: parseFloat(item.value) || 0,
    }));

    const currentFormList = form.packList || [];
    const currentFormListStr = JSON.stringify(currentFormList);
    const newFormListStr = JSON.stringify(formattedList);

    if (currentFormListStr !== newFormListStr) {
      setForm((prev) => ({
        ...prev,
        packList: formattedList,
      }));
    }
  }, [form.packList, setForm]);

  // Debounced effect to update parent form
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      updateParentForm(packList);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [packList, updateParentForm]);

  // Handle pack list item changes
  const handlePackListChange = (index, field, value) => {
    let cleanValue = value;

    if (field === "qty" || field === "weight" || field === "value") {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        cleanValue = value.replace(/^0+(?=\d)/, "");
      } else {
        return;
      }
    }

    const updatedPackList = [...packList];
    updatedPackList[index][field] = cleanValue;
    setPackList(updatedPackList);
  };

  // Handle piece card changes - FIXED to handle dimension weight properly
  const handlePieceCardChange = (index, field, value) => {
    const updatedCards = [...pieceCards];

    if (field === "hasDimensions") {
      updatedCards[index][field] = !updatedCards[index][field];

      // Reset dimension fields if toggling off
      if (!updatedCards[index][field]) {
        updatedCards[index].height = "";
        updatedCards[index].width = "";
        updatedCards[index].length = "";
        updatedCards[index].dimensionWeight = "";
      } else {
        // When turning on dimensions, just set the flag
        // Don't recalculate anything yet
      }
    } else if (field === "weight" || field === "height" || field === "width" || field === "length") {
      // Allow only numbers and one decimal point
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        // Clean the value
        const cleanValue = value.replace(/^0+(?=\d)/, "");
        updatedCards[index][field] = cleanValue;

        // Auto-calculate dimension weight if all dimensions are filled
        if (field === "height" || field === "width" || field === "length") {
          // Calculate dimension weight for this card
          const card = updatedCards[index];
          const height = parseFloat(card.height) || 0;
          const width = parseFloat(card.width) || 0;
          const length = parseFloat(card.length) || 0;

          if (height > 0 && width > 0 && length > 0) {
            const dimensionWeight = (height * width * length) / 5000;
            updatedCards[index].dimensionWeight = dimensionWeight.toFixed(2);
          } else {
            updatedCards[index].dimensionWeight = "";
          }
        }
      } else {
        return; // Invalid input, don't update
      }
    }

    // Update the state with new cards
    setPieceCards(updatedCards);
  };

  // Handle piece input change
  const handlePieceInputChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setPieceInput(value);
      const count = parseInt(value) || 0;
      applyPieceCount(count);
    }
  };

  // Apply piece count
  const applyPieceCount = (count) => {
    count = count || parseInt(pieceInput) || 0;
    if (count > 0) {
      const newPieceCards = Array.from({ length: count }, (_, index) => {
        if (isEditing && form.pieceDetails && form.pieceDetails[index + 1]) {
          const piece = form.pieceDetails[index + 1];
          return {
            id: index + 1,
            weight: piece.weight?.toString() || "",
            hasDimensions: !!(piece.height && piece.width && piece.length &&
              piece.height > 0 && piece.width > 0 && piece.length > 0),
            height: piece.height?.toString() || "",
            width: piece.width?.toString() || "",
            length: piece.length?.toString() || "",
            dimensionWeight: piece.dimensionWeight?.toString() || "",
            actualWeight: piece.actualWeight?.toString() || piece.weight?.toString() || "",
          };
        }

        return {
          id: index + 1,
          weight: "",
          hasDimensions: false,
          height: "",
          width: "",
          length: "",
          dimensionWeight: "",
          actualWeight: "",
        };
      });

      setPieceCards(newPieceCards);

      // Reset the ref to trigger update
      lastPieceCardsRef.current = "";

      // Update piece count in form
      setForm(prev => ({
        ...prev,
        piece: count.toString()
      }));
    } else if (pieceCards.length > 0) {
      setPieceCards([]);
      lastPieceCardsRef.current = "";
      setForm(prev => ({
        ...prev,
        piece: "0",
        pieceDetails: {}
      }));
    }
  };

  // Clear piece cards
  const clearPieceCards = () => {
    setPieceCards([]);
    setPieceInput("");
    lastPieceCardsRef.current = "";
    setForm(prev => ({
      ...prev,
      piece: "0",
      pieceDetails: {}
    }));
  };

  // Add new item to pack list
  const handleAddNewItem = () => {
    if (newItemDescription.trim() === "") return;

    const newItem = {
      description: newItemDescription.trim(),
      qty: "",
      weight: "",
      value: "",
    };

    setPackList(prev => [...prev, newItem]);
    setNewItemDescription("");
    shouldUpdateParent.current = true;
  };

  // Remove item from pack list
  const handleRemoveItem = (index) => {
    const updatedPackList = packList.filter((_, i) => i !== index);
    setPackList(updatedPackList);
  };

  // Parse number safely for display
  const parseNumber = (value) => {
    return value === "" || value == null ? "" : value;
  };

  const { totalWeight: weightWithDimensions, dimensionWeightTotal, actualWeightTotal } = calculateTotalWeightWithDimensions();

  return (
    <div className="space-y-6">
      {/* Piece Cards Section */}
      <div className="bg-white border rounded-lg">
        {/* Header */}
        <div className="p-5 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaBox className="text-gray-700 text-lg" />
              <div>
                <h4 className="text-gray-800 font-semibold">
                  مدیریت قطعات بسته
                </h4>
                <p className="text-gray-500 text-sm">
                  تعداد قطعات را وارد کرده و مشخصات هر قطعه را پر کنید
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={pieceInput}
                onChange={handlePieceInputChange}
                placeholder="تعداد"
                className="w-24 border rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-gray-400"
              />

              {pieceCards.length > 0 && (
                <button
                  type="button"
                  onClick={clearPieceCards}
                  className="px-3 py-1 text-sm border rounded text-red-600 border-red-300 hover:bg-red-50"
                >
                  پاک کردن
                </button>
              )}
            </div>
          </div>

          {pieceCards.length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              {pieceCards.length} قطعه | وزن کل:{" "}
              <span className="font-medium text-gray-800">
                {weightWithDimensions.toFixed(2)} کیلوگرم
              </span>
            </div>
          )}
        </div>

        {/* Cards */}
        {pieceCards.length > 0 && (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pieceCards.map((card, index) => {
                const actualWeight = parseFloat(card.weight) || 0;
                const dimensionWeight = parseFloat(card.dimensionWeight) || 0;
                const finalWeight =
                  card.hasDimensions && dimensionWeight > 0
                    ? Math.max(actualWeight, dimensionWeight)
                    : actualWeight;

                return (
                  <div key={card.id} className="border rounded-md p-4 bg-gray-50">
                    <div className="flex justify-between mb-3">
                      <h5 className="text-gray-700 font-medium">
                        قطعه #{card.id}
                      </h5>
                      <span className="text-sm text-gray-600">
                        {finalWeight.toFixed(2)} kg
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Weight */}
                      <div>
                        <label className="text-sm text-gray-600">
                          وزن (کیلوگرم)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={card.weight}
                          onChange={(e) =>
                            handlePieceCardChange(index, "weight", e.target.value)
                          }
                          className="w-full border rounded px-2 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </div>

                      {/* Checkbox */}
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            handlePieceCardChange(index, "hasDimensions")
                          }
                          className="text-sm text-gray-700 flex items-center gap-2"
                        >
                          {card.hasDimensions ? (
                            <FaCheckSquare className="text-gray-700" />
                          ) : (
                            <FaSquare className="text-gray-400" />
                          )}
                          ابعاد دارد
                        </button>
                      </div>

                      {/* Dimensions */}
                      {card.hasDimensions && (
                        <div className="border rounded p-3 bg-white space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              step="0.1"
                              value={card.length}
                              onChange={(e) =>
                                handlePieceCardChange(
                                  index,
                                  "length",
                                  e.target.value
                                )
                              }
                              placeholder="طول"
                              className="border rounded px-2 py-1 text-sm"
                            />
                            <input
                              type="number"
                              step="0.1"
                              value={card.width}
                              onChange={(e) =>
                                handlePieceCardChange(
                                  index,
                                  "width",
                                  e.target.value
                                )
                              }
                              placeholder="عرض"
                              className="border rounded px-2 py-1 text-sm"
                            />
                            <input
                              type="number"
                              step="0.1"
                              value={card.height}
                              onChange={(e) =>
                                handlePieceCardChange(
                                  index,
                                  "height",
                                  e.target.value
                                )
                              }
                              placeholder="ارتفاع"
                              className="border rounded px-2 py-1 text-sm"
                            />
                          </div>

                          {card.dimensionWeight && (
                            <div className="text-xs text-gray-600">
                              وزن ابعادی: {card.dimensionWeight} kg
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="mt-6 text-right">
              <div className="text-sm text-gray-600">
                مجموع وزن:
              </div>
              <div className="text-xl font-semibold text-gray-800">
                {weightWithDimensions.toFixed(2)} کیلوگرم
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Date and Tracking Section */}
      <div className="bg-gray-200 rounded-md shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FaCalendarAlt className="text-purple-600 text-xl" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-lg">تاریخ ارسال</h4>
            <p className="text-gray-500 text-sm">
              تاریخ و اطلاعات رهگیری را وارد کنید
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاریخ ارسال
            </label>
            <input
              type="date"
              name="date"
              value={formatDateForInput(form.date)}
              onChange={handleDateChange}
              className="w-full px-4 py-3 bg-white rounded-md focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              شماره رهگیری
            </label>
            <input
              type="text"
              name="track_number"
              value={form.track_number || ""}
              onChange={handleChange}
              placeholder="شماره رهگیری بسته"
              className="w-full px-4 py-3 bg-white rounded-md focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              شماره رن
            </label>
            <input
              type="number"
              name="run"
              value={form.run || ""}
              onChange={handleChange}
              placeholder="شماره رن"
              className="w-full px-4 py-3 bg-white rounded-md focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Original Packing List Section */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="bg-blue-900 p-6">
          <div className="md:flex space-y-3 md:space-y-0 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <FaBox className="text-white text-xl" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">
                  لیست بسته‌بندی (کالاها)
                </h4>
                <p className="text-gray-300 text-sm mt-1">
                  {isEditing ? "ویرایش آیتم‌ها" : "افزودن آیتم‌های بسته"}
                </p>
              </div>
            </div>

            {/* Add New Item */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="نام کالای جدید"
                className="bg-white px-3 py-2 w-full focus:outline-none rounded-md focus:ring-1"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewItem();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddNewItem}
                className="px-4 py-2 bg-white text-[#0F3A76] rounded-lg cursor-pointer transition-colors flex items-center gap-2"
              >
                <FaPlus />
                افزودن
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="py-4 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                  شماره
                </th>
                <th className="py-4 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                  جزئیات
                </th>
                <th className="py-4 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                  تعداد
                </th>
                <th className="py-4 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                  وزن (کیلوگرم)
                </th>
                <th className="py-4 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                  ارزش ($)
                </th>
                <th className="py-4 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {packList.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-4 text-center text-gray-600 font-medium">
                    {index + 1}
                  </td>
                  <td className="py-2 px-4 text-right font-medium text-gray-900">
                    {item.description}
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="number"
                      value={parseNumber(item.qty)}
                      onChange={(e) =>
                        handlePackListChange(index, "qty", e.target.value)
                      }
                      min="0"
                      placeholder="0"
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="number"
                      step="0.01"
                      value={parseNumber(item.weight)}
                      onChange={(e) =>
                        handlePackListChange(index, "weight", e.target.value)
                      }
                      min="0"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border bg-gray-100 border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={parseNumber(item.value)}
                        onChange={(e) =>
                          handlePackListChange(index, "value", e.target.value)
                        }
                        min="0"
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                      />
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        $
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    {index >= initialPackList.length && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1 text-sm"
                      >
                        <FaTrash className="text-xs" />
                        حذف
                      </button>
                    )}
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

export default PackingListAndDetails;