import React, { useState } from 'react';
import axios from 'axios';
import { 
  FaTruck, 
  FaCheck, 
  FaTimes, 
  FaSpinner, 
  FaPaperPlane,
  FaCopy,
  FaWindowClose
} from 'react-icons/fa';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const UpdatePackageTracking = ({ packageId, setIsTOpen, onSuccess, initialTrackingNumber = '' }) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!trackingNumber.trim()) {
      setError('شماره رهگیری الزامی است');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await axios.put(
        `${BASE_URL}/packages/track/${packageId}`,
        { track_number: trackingNumber.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setResult(response.data);
        
        // Notify parent component if callback provided
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.data.error || 'خطا در بروزرسانی شماره رهگیری');
      }
    } catch (err) {
      console.error('Update tracking error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'خطا در بروزرسانی شماره رهگیری. لطفاً دوباره تلاش کنید.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(trackingNumber)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  const handleClose = () => {
    if (setIsTOpen) {
      setIsTOpen(false);
    }
  };

  const handleCloseSuccess = () => {
    if (setIsTOpen) {
      setIsTOpen(false);
    }
    // Also call onSuccess if provided
    if (onSuccess && result) {
      onSuccess(result);
    }
  };

  const renderSuccessDetails = () => {
    if (!result) return null;

    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 print:bg-transparent print:p-0">
       

        {/* شماره رهگیری جدید */}
        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleCopyTracking}
              className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
            >
              {copied ? <FaCheck /> : <FaCopy />}
              {copied ? 'کپی شد!' : 'کپی'}
            </button>
            <div className="text-left">
              <h5 className="font-medium text-gray-700">شماره رهگیری جدید</h5>
              <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
                {result.tracking_info?.new_tracking_number || trackingNumber}
              </div>
            </div>
          </div>
        </div>

        {/* خلاصه اعلان‌های ایمیل */}
        {result.notifications && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-700 mb-3 text-right">اعلان‌های ایمیل ارسال شده</h5>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600">گیرنده</div>
                <div className="text-xl font-bold text-green-700">
                  {result.notifications.receiverEmailsSent ? '✓' : '✗'}
                </div>
                <div className="text-xs text-green-500 mt-1">
                  {result.notifications.receiverEmailsSent ? 'ارسال شد' : 'ایمیل ندارد'}
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600">فرستنده</div>
                <div className="text-xl font-bold text-blue-700">
                  {result.notifications.senderEmailsSent ? '✓' : '✗'}
                </div>
                <div className="text-xs text-blue-500 mt-1">
                  {result.notifications.senderEmailsSent ? 'ارسال شد' : 'ایمیل ندارد'}
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600">ادمین</div>
                <div className="text-xl font-bold text-purple-700">
                  {result.notifications.adminEmailsSent}
                </div>
                <div className="text-xs text-purple-500 mt-1">ارسال شد</div>
              </div>
            </div>
          </div>
        )}

        {/* دکمه بستن */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleCloseSuccess}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 flex-1"
          >
            <FaCheck />
            بستن
          </button>
        </div>
      </div>
    );
  };

  return (
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 print:bg-transparent print:p-0">
  {/* Modal Window Container */}
  <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto animate-in fade-in-0 zoom-in-95 duration-300 overflow-hidden">
    
    {/* Header with close button in corner */}
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FaTruck className="text-blue-600 text-xl" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg text-right">
            {success ? 'رهگیری بروزرسانی شد' : 'بروزرسانی شماره رهگیری'}
          </h3>
          <p className="text-gray-500 text-sm text-right">
            {success 
              ? 'اطلاعات رهگیری بروزرسانی شد' 
              : `بروزرسانی رهگیری برای بسته شماره #${packageId}`
            }
          </p>
        </div>
      </div>

      {/* Close button in left corner - positioned relative to header */}
      <button
        onClick={handleClose}
        className="absolute left-6 top-6 text-gray-400 hover:text-gray-600 transition-colors"
        title="بستن"
      >
        <FaTimes className="text-xl" />
      </button>
    </div>

    {/* Main content */}
    <div className="px-6 pb-6">
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* فیلد شماره رهگیری */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              شماره رهگیری
              <span className="text-red-500 mr-1">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="شماره رهگیری را وارد کنید"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-right pr-10 pl-10"
                disabled={loading}
                autoFocus
                dir="ltr"
              />
              {trackingNumber && (
                <button
                  type="button"
                  onClick={handleCopyTracking}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="کپی به کلیپ‌بورد"
                >
                  <FaCopy />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">
              شماره رهگیری را برای بسته شماره #{packageId} وارد کنید
            </p>
          </div>

          {/* پیام خطا */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 text-right">
                <FaTimes />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* دکمه‌های عمل */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  در حال بروزرسانی...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  بروزرسانی رهگیری
                </>
              )}
            </button>
            
            {/* دکمه لغو */}
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaTimes />
              لغو
            </button>
          </div>
        </form>
      ) : (
        renderSuccessDetails()
      )}
    </div>
  </div>
</div>
  );
};

export default UpdatePackageTracking;