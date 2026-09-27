import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaBox,
  FaUser,
  FaWeightHanging,
  FaCube,
  FaMoneyBillWave,
  FaTruck,
  FaReceipt,
  FaMoneyCheck,
  FaCalendar,
  FaFlag,
  FaPhone,
  FaPrint,
  FaTimes,
  FaMapMarkerAlt,
  FaCheck,
  FaCheckSquare,
  FaSquare,
  FaSearch,
  FaExclamationTriangle,
} from "react-icons/fa";
import PrintShippingBill from "./PrintShippingBill";
import {
  packageService,
  updatePackageLocation,
} from "../services/packageService";
import SearchBar from "../searching/SearchBar";
import UpdatePackageTracking from "./UpdatePackageTracking";
import Pagination from "../pagination/Pagination";

const PackageList = ({
  setPackages,
  packages,
  onEdit,
  onDelete,
  mode,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [originalPackages, setOriginalPackages] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const [selectedPack, setSelectedPack] = useState(null);
  const [isTOpen, setIsTOpen] = useState(false);
  // Store original packages on first load
  useEffect(() => {
    if (packages.length > 0 && originalPackages.length === 0) {
      setOriginalPackages([...packages]);
    }
  }, [packages]);

  // Update select all when packages change
  useEffect(() => {
    if (packages.length > 0 && selectedPackages.length === packages.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedPackages, packages]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR");
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const handlePrintClick = (pkg) => {
    setSelectedPackage(pkg);
    setIsPrintModalOpen(true);
  };

  const handleClosePrintModal = () => {
    setIsPrintModalOpen(false);
    setSelectedPackage(null);
  };

  // Handle package selection
  const handleSelectPackage = (pkgId) => {
    setSelectedPackages((prev) => {
      if (prev.includes(pkgId)) {
        return prev.filter((id) => id !== pkgId);
      } else {
        return [...prev, pkgId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPackages([]);
    } else {
      const allIds = packages.map((pkg) => pkg.id);
      setSelectedPackages(allIds);
    }
    setSelectAll(!selectAll);
  };

  // Open location update modal
  const handleOpenLocationModal = () => {
    if (selectedPackages.length === 0) {
      alert("لطفاً حداقل یک بسته را انتخاب کنید");
      return;
    }
    setIsLocationModalOpen(true);
  };

  // Update location for selected packages
  const handleUpdateLocation = async () => {
    if (!locationName.trim()) {
      alert("لطفاً نام مکان را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const result = await updatePackageLocation(
        selectedPackages,
        locationName
      );

      // Update local packages state
      setPackages((prevPackages) =>
        prevPackages.map((pkg) =>
          selectedPackages.includes(pkg.id)
            ? { ...pkg, location: locationName }
            : pkg
        )
      );

      // Also update original packages if search is not active
      if (!isSearchActive && originalPackages.length > 0) {
        setOriginalPackages((prev) =>
          prev.map((pkg) =>
            selectedPackages.includes(pkg.id)
              ? { ...pkg, location: locationName }
              : pkg
          )
        );
      }

      handleCloseLocationModal();
    } catch (error) {
      console.error("خطا در به‌روزرسانی موقعیت:", error);
    } finally {
      setLoading(false);
    }
  };

  // Close location modal
  const handleCloseLocationModal = () => {
    setIsLocationModalOpen(false);
    setLocationName("");
  };

  // ========== SEARCH FUNCTIONS ==========

  // Handle search results from SearchBar
  const handleSearchResults = (searchResults) => {
    setSearchError(null); // Clear any previous errors

    if (searchResults.length === 0) {
      // No results found
      if (searchTerm.trim() !== "") {
        // User searched something but got no results
        setIsSearchActive(true);
        setPackages([]);
        setSearchError(`هیچ بسته‌ای با مشخصات "${searchTerm}" یافت نشد`);
      } else {
        // User cleared search - show all packages
        setIsSearchActive(false);
        setPackages(originalPackages);
        setSearchTerm("");
      }
    } else {
      // We have search results
      setIsSearchActive(true);
      setPackages(searchResults);
      setSearchError(null);
    }
  };

  // Handle search error from SearchBar
  const handleSearchError = (errorMessage) => {
    console.error("Search error in PackageList:", errorMessage);
    setSearchError("خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.");
    setIsSearchActive(false);

    // Fallback: Show all packages if search fails
    setPackages(originalPackages);
  };

  // Handle search term change (for tracking what user searched)
  const handleSearchTermChange = (term) => {
    setSearchTerm(term);
  };

  // Clear search and show all packages
  const handleClearSearch = () => {
    setIsSearchActive(false);
    setSearchTerm("");
    setSearchError(null);
    setPackages(originalPackages);
    setSelectedPackages([]);
  };

  // Fallback client-side search (if API fails)
  const handleClientSideSearch = () => {
    if (!searchTerm.trim()) {
      setPackages(originalPackages);
      setIsSearchActive(false);
      return;
    }

    setIsSearchActive(true);
    const filtered = originalPackages.filter((pkg) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        pkg.id?.toString().toLowerCase().includes(searchLower) ||
        pkg.Sender?.name?.toLowerCase().includes(searchLower) ||
        pkg.Receiver?.name?.toLowerCase().includes(searchLower) ||
        pkg.location?.toLowerCase().includes(searchLower) ||
        pkg.totalWeight?.toString().includes(searchLower) ||
        pkg.totalCash?.toString().includes(searchLower)
      );
    });

    setPackages(filtered);
    if (filtered.length === 0) {
      setSearchError(
        `هیچ بسته‌ای با مشخصات "${searchTerm}" یافت نشد (جستجوی محلی)`
      );
    } else {
      setSearchError(null);
    }
  };

  return (
    <div className="mt-8">
      <div className="bg-primary rounded-t-md shadow-md p-4 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FaBox className="text-3xl" />
            <div>
              <h2 className="text-2xl font-bold">لیست بسته‌ها</h2>
              <p className="text-blue-100 text-sm mt-1">
                {isSearchActive ? (
                  <span>
                    نتایج جستجو: {packages.length} بسته یافت شد
                    {searchTerm && <span> برای "{searchTerm}"</span>}
                  </span>
                ) : (
                  <span>
                    مجموع: {packages.length} بسته | انتخاب شده:{" "}
                    {selectedPackages.length}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {isSearchActive && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaTimes />
                <span>لغو جستجو</span>
              </button>
            )}
            {selectedPackages.length > 0 && (
              <button
                onClick={handleOpenLocationModal}
                className="px-4 py-3 bg-white cursor-pointer text-[#0F3A76] hover: rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaMapMarkerAlt />
                <span>به‌روزرسانی موقعیت ({selectedPackages.length})</span>
              </button>
            )}
          </div>
          {/* Search Bar */}
          <div className="w-full md:w-[500px]">
            <SearchBar
              onSearchResults={handleSearchResults}
              onSearchError={handleSearchError}
              placeholder="جستجوی بسته (شناسه، فرستنده، گیرنده، موقعیت...)"
              debounceDelay={500}
            />

            {/* Search error message */}
            {searchError && (
              <div className="mt-2 text-sm text-red-300 bg-red-900/30 p-2 rounded-lg">
                <FaExclamationTriangle className="inline ml-1" />
                {searchError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Info Banner */}
      {isSearchActive && packages.length > 0 && (
        <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaSearch className="text-yellow-600" />
              <p className="text-yellow-800">
                در حال نمایش نتایج جستجو {packages.length} بسته یافت شد
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Error Banner */}
      {searchError && !isSearchActive && (
        <div className="bg-red-50 border-r-4 border-red-400 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-red-600" />
              <p className="text-red-800">{searchError}</p>
            </div>
            <button
              onClick={handleClientSideSearch}
              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm flex items-center gap-1 hover:bg-red-200"
            >
              <FaSearch />
              جستجوی محلی
            </button>
          </div>
        </div>
      )}

      {/* Packages Table */}
      <div className="bg-white rounded-b-xl shadow-lg overflow-hidden">
        {packages.length === 0 ? (
          <div className="text-center py-12">
            {isSearchActive || searchError ? (
              <>
                <FaSearch className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  {searchError ||
                    `هیچ بسته‌ای با مشخصات "${searchTerm}" یافت نشد`}
                </p>
                <button
                  onClick={handleClearSearch}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  مشاهده همه بسته‌ها
                </button>
              </>
            ) : (
              <>
                <FaBox className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">بسته‌ای یافت نشد</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 border-b">
                    <button
                      onClick={handleSelectAll}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title={selectAll ? "لغو انتخاب همه" : "انتخاب همه"}
                    >
                      {selectAll ? (
                        <FaCheckSquare className="text-blue-600 text-lg" />
                      ) : (
                        <FaSquare className="text-gray-400 text-lg" />
                      )}
                    </button>
                  </th>

                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                    شناسه
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                    فرستنده
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                    گیرنده
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                    وزن
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                    قطعات
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                    مجموع کل
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                    موقعیت
                  </th>
                   <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                    نمبر رن
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700 border-b">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className={`hover:bg-gray-50  odd:bg-gray-100 even:bg-white transition-colors ${
                      selectedPackages.includes(pkg.id) ? "bg-blue-50" : ""
                    } ${isSearchActive ? "search-result-row" : ""}`}
                  >
                    {/* Checkbox Cell */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleSelectPackage(pkg.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {selectedPackages.includes(pkg.id) ? (
                          <FaCheckSquare className="text-blue-600 text-lg" />
                        ) : (
                          <FaSquare className="text-gray-400 text-lg" />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">
                        {pkg.id}
                        {isSearchActive &&
                          searchTerm &&
                          pkg.id?.toString().includes(searchTerm) && (
                            <span className="mr-2 inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                              ✓
                            </span>
                          )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {pkg.Sender?.name || "نامشخص"}
                      </div>
                      {pkg.Sender?.phone && (
                        <div className="text-sm text-gray-500 mt-1">
                          <FaPhone className="inline ml-1 text-xs" />
                          {pkg.Sender.phone}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {pkg.Receiver?.name || "نامشخص"}
                      </div>
                      {pkg.Receiver?.phone && (
                        <div className="text-sm text-gray-500 mt-1">
                          <FaPhone className="inline ml-1 text-xs" />
                          {pkg.Receiver.phone}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {parseFloat(pkg.totalWeight || 0).toFixed(2)} کیلوگرم
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium">{pkg.piece || 0}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-green-700">
                        {formatCurrency(pkg.totalCash)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {pkg.location || "تعیین نشده"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {pkg.run || "تعیین نشده"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {mode !== "list" && (
                          <button
                            onClick={() => onEdit(pkg)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="ویرایش"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                        )}

                        <button
                          onClick={() => onDelete(pkg.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="حذف"
                        >
                          <FaTrash className="text-sm" />
                        </button>

                        <button
                          onClick={() => handlePrintClick(pkg)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          title="چاپ"
                        >
                          <FaPrint className="text-sm" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPack(pkg.id);
                            setIsTOpen(!isTOpen);
                          }}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          title="جستجو"
                        >
                          <FaSearch className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}

        {/* Mobile Selection Controls */}
        {selectedPackages.length > 0 && (
          <div className="md:hidden fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaCheckSquare className="text-lg" />
                <span>{selectedPackages.length} بسته انتخاب شده</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleOpenLocationModal}
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded flex items-center gap-1 text-sm"
                >
                  <FaMapMarkerAlt />
                  <span>موقعیت</span>
                </button>
                <button
                  onClick={() => setSelectedPackages([])}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 rounded flex items-center gap-1 text-sm"
                >
                  <FaTimes />
                  <span>لغو</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isPrintModalOpen && (
          <PrintShippingBill
            isOpen={isPrintModalOpen}
            onClose={handleClosePrintModal}
            data={selectedPackage}
          />
        )}
      </div>

      {/* Location Update Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaMapMarkerAlt className="text-blue-600" />
                به‌روزرسانی موقعیت
              </h3>
              <button
                onClick={handleCloseLocationModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-bold">{selectedPackages.length}</span>{" "}
                بسته انتخاب شده است
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام مکان جدید
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="مثال: انبار مرکزی، ترانزیت تهران، تحویل مشتری"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateLocation}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    در حال به‌روزرسانی...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    تأیید
                  </>
                )}
              </button>
              <button
                onClick={handleCloseLocationModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                لغو
              </button>
            </div>
          </div>
        </div>
      )}

      {isTOpen && (
        <div>
          <UpdatePackageTracking
            setIsTOpen={setIsTOpen}
            packageId={selectedPack}
          />
        </div>
      )}
    </div>
  );
};

export default PackageList;
