import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import Swal from "sweetalert2";
import axios from "axios";
import Pagination from "../components/Pagination";

function PriceListEditor() {
    const [priceList, setPriceList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
const [hideMenu, setHideMenu] = useState(false);
    const { t } = useTranslation();
    const { user, token } = useAuth();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    
    // Use ref to track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);

    const fetchPriceList = useCallback(async () => {
        // Early return if no token or user (prevents API calls during logout)
        if (!token || !user) {
            console.log("No token or user available, skipping API call");
            return;
        }

        // Check if component is still mounted
        if (!isMountedRef.current) {
            console.log("Component unmounted, skipping API call");
            return;
        }

        setLoading(true);
        
        // Create AbortController for cleanup
        const abortController = new AbortController();
        
        try {
            const apiUrl = `${API_BASE_URL}/price-list`;
            const params = new URLSearchParams({
                page: page,
                pageSize: pageSize,
                search: searchTerm,
                sortBy: "id",
                sortOrder: "asc"
            });

            const response = await axios.get(`${apiUrl}?${params}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                signal: abortController.signal, // Add abort signal
            });

            console.log("API Response:", response.data);

            // Check if component is still mounted before updating state
            if (!isMountedRef.current) {
                return;
            }

            // Your API returns: { page, pageSize, totalRecords, totalPages, data: [] }
            if (response.data && Array.isArray(response.data.data)) {
                setPriceList(response.data.data);
                setTotalPages(response.data.totalPages || 1);
                setTotalRecords(response.data.totalRecords || 0);
            } else if (Array.isArray(response.data)) {
                // Fallback if data is directly an array
                setPriceList(response.data);
                setTotalRecords(response.data.length);
            } else {
                console.warn("Unexpected response format:", response.data);
                setPriceList([]);
                setTotalRecords(0);
            }
        } catch (err) {
            // Don't show error if request was aborted (component unmounted)
            if (axios.isCancel(err) || err.name === 'CanceledError') {
                console.log("Request was cancelled");
                return;
            }

            // Don't show error if component is unmounted
            if (!isMountedRef.current) {
                return;
            }

            console.error("Error fetching price list:", err);
            setPriceList([]);
            setTotalRecords(0);
            
            // Only show error if it's not a 401 (which would be handled by logout)
            if (err.response?.status !== 401) {
                Swal.fire({
                    title: "Error",
                    text: err.response?.data?.message || "Failed to fetch price list data",
                    icon: "error",
                    confirmButtonText: "OK",
                });
            }
        } finally {
            // Check if component is still mounted before updating loading state
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [page, pageSize, searchTerm, API_BASE_URL, token, user]);

    useEffect(() => {
        // Set mounted flag
        isMountedRef.current = true;
        
        // Only fetch if we have both token and user
        if (token && user) {
            fetchPriceList();
        }

        // Cleanup function
        return () => {
            isMountedRef.current = false;
        };
    }, [fetchPriceList, token, user]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    //RBAC
    const rbacMgr = new RbacManager(user?.userType === "employee" && user?.roles[0] !== "admin" ? user?.designation : user?.roles[0], "priceListEditor");

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    // Add safety check to ensure priceList is always an array
    const safePriceList = Array.isArray(priceList) ? priceList : [];

    // Don't render anything if user is not authenticated
    if (!user || !token) {
        return null;
    }

    return (
        <Sidebar
hideMobileBottomMenu={hideMenu} title={t("Price List Viewer")}>
            <div className="rbac-editor-content">
                {/* Header with Search */}
                <div className="logs-header">
                    <div className="logs-header-controls">
                        <div className="search-container" style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                            <input
                                type="text"
                                placeholder="Search price list..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="form-control"
                                style={{
                                    fontSize: "12px",
                                    padding: "8px 12px",
                                    height: "40px",
                                    border: "1px solid #ccc",
                                    borderRadius: "8px",
                                    width: "400px",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Loading Indicator */}
                {loading && (
                    <div className="loading-indicator" style={{ textAlign: "center", padding: "20px" }}>
                        Loading...
                    </div>
                )}

                {/* Data Table */}
                <div className="table-container" style={{ marginTop: "20px", overflowX: "auto" }}>
                    <table className="data-table" style={{ width: "100%", minWidth: "1200px" }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Reference ID</th>
                                <th>Relation</th>
                                <th>Customer Type</th>
                                <th>Customer Group</th>
                                <th>Customer ID</th>
                                <th>ERP Customer ID</th>
                                <th>Product Type</th>
                                <th>Product Group</th>
                                <th>Entity</th>
                                <th>Product ID</th>
                                <th>ERP Product ID</th>
                                <th>Price</th>
                                <th>Currency</th>
                                <th>From Date</th>
                                <th>To Date</th>
                                <th>Discount Rate</th>
                                <th>From Quantity</th>
                                <th>To Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safePriceList.map((item, index) => (
                                <tr key={item.id || index}>
                                    <td>{item.id || "-"}</td>
                                    <td>{item.refId || "-"}</td>
                                    <td>{item.relation || "-"}</td>
                                    <td>{item.custType || "-"}</td>
                                    <td>{item.customerGroup || "-"}</td>
                                    <td>{item.custId || "-"}</td>
                                    <td>{item.erpCustId || "-"}</td>
                                    <td>{item.prodType || "-"}</td>
                                    <td>{item.prodGroup || "-"}</td>
                                    <td>{item.prodId || "-"}</td>
                                    <td>{item.erpProdId || "-"}</td>
                                    <td>{item.entity || "-"}</td>
                                    <td>{item.fromDate ? new Date(item.fromDate).toLocaleDateString() : "-"}</td>
                                    <td>{item.toDate ? new Date(item.toDate).toLocaleDateString() : "-"}</td>
                                    <td>{item.discountRate || "-"}</td>
                                    <td>{item.fromQuantity || "-"}</td>
                                    <td>{item.toQuantity || "-"}</td>
                                    <td style={{ fontWeight: "bold", color: "#2196F3" }}>
                                        {item.price ? parseFloat(item.price).toFixed(2) : "-"}
                                    </td>
                                    <td>{item.currency || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {safePriceList.length === 0 && !loading && (
                        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                            No price list data found
                        </div>
                    )}
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={String(totalPages)}
                    onPageChange={setPage}
                />

                {/* Summary Information */}
                {safePriceList.length > 0 && (
                    <div style={{
                        marginTop: "20px",
                        padding: "10px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        fontSize: "14px",
                        color: "#495057"
                    }}>
                        <strong>Total Records:</strong> {totalRecords || safePriceList.length} entries
                    </div>
                )}
            </div>
        </Sidebar>
    );
}

export default PriceListEditor;
