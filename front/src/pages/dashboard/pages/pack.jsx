import React, { useState, useEffect } from "react";
import PackageList from "./PackageList";
import { packageService } from "../services/packageService";
import { FaBox } from "react-icons/fa";

const Pack = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [Mode, setMode] = useState("list");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const onPageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      fetchPackages(pageNumber);
    }
  };
  useEffect(() => {
    fetchPackages(currentPage);
  }, []);

  const fetchPackages = async (currentPage) => {
    try {
      setLoading(true);
      const data = await packageService.getAllPackages(currentPage);
      setPackages(data.packages);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      alert("Error loading packages");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg) => {
    // Implement edit logic here
    console.log("Editing package:", pkg);
    alert(`Edit package ${pkg.id}`);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      await packageService.deletePackage(id);
      // Remove from local state
      setPackages(packages.filter((pkg) => pkg.id !== id));
      alert("Package deleted successfully");
    } catch (error) {
      console.error("Error deleting package:", error);
      alert("Error deleting package");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری بسته‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
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
  );
};

export default Pack;
