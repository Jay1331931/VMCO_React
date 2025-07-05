import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RbacManager from "../utilities/rbac";
import Sidebar from "../components/Sidebar";
import "../styles/components.css";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n";
import Table from "../components/Table";
import SearchInput from "../components/SearchInput";
import axios from "axios";
import formatDate from "../utilities/dateFormatter";
import Pagination from "../components/Pagination";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const BankTransactions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user, logout, loading } = useAuth();
  const currentLanguage = i18n.language;
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  //RBAC
  //use formMode to decide if it is editform or add form
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "BankTransactions"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  const columns = [
    { key: "id", header: "Transaction Id", include: isV("TransactionIdCol") },
    {
      key: "erpCustId",
      header: "ERP Customer Id",
      include: isV("erpCustIdCol"),
    },
    {
      key: "erpOrderId",
      header: "ERP Order Id",
      include: isV("erpOrderIdCol"),
    },
     {
      key: "orderId",
      header: "Order Id",
      include: isV("OrderIdCol"),
    },
    {
      key: currentLanguage == "en" ? "companyNameEn" : "companyNameAr",
      header: "Customer",
      include: isV("customerCol"),
    },
    {
      key: "amountTransferred",
      header: "Amount Transferred",
      include: isV("amountTransferredCol"),
    },

    {
      key: "transactionDate",
      header: "Transaction Date",
      include: isV("transactionDateCol"),
    },
    { key: "createdAt", header: "Created At", include: isV("createdAtCol") },
    { key: "status", header: "Transaction Status", include: isV("statusCol") },
  ];

  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const handleAddTransaction = () => {
    navigate("/bankTransactions/add");
  };

  // Calculate totalPages
  const totalPages =
    pagination.total > 0
      ? Math.ceil(pagination.total / pagination.pageSize)
      : 1;
  const fetchBankTransactions = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/bank-transactions/pagination?page=${pagination.page}&pageSize=${pagination.pageSize}&search=${debouncedSearchQuery}`,
        {
          withCredentials: true,
        }
      );
      const formattedData = data.data?.map(row => ({
  ...row,
  orderId:  row.orderId?.join(", "),
  erpOrderId: row.erpOrderId?.join(", ") ,
}));
      setTransactions(formattedData || []);
      setPagination({
        page: data.pagination.currentPage,
        pageSize: data.pagination.pageSize,
        total: data.pagination.totalRecords,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearchQuery]);

  useEffect(() => {
    fetchBankTransactions();
  }, [fetchBankTransactions]);
  const handleRowClick = (id) => {
    navigate(`/bankTransactions/edit/${id}`);
  };
  const dir = i18n.dir();
  const isRTL = dir === "rtl";
  return (
    <Sidebar title={t("Bank Transactions")}>
      {isV("BankContent") && (
        <div
          className={`bank-transactions-container${isRTL ? " rtl" : ""}`}
          style={{ direction: dir, textAlign: isRTL ? "right" : "left" }}
          dir={dir}
        >
          <div className="support-header">
            {isV("searchInput") && <SearchInput onSearch={handleSearch} />}
            {isV("btnAdd") && (
              <button
                className="support-add-button"
                onClick={handleAddTransaction}
              >
                {t("+ Add")}
              </button>
            )}
          </div>
          {isV("BankTable") && (
            <Table
              columns={columns.filter((col) => col.include !== false)}
              data={transactions?.map((transaction) => ({
                ...transaction,
                createdAt: formatDate(transaction.createdAt, "DD/MM/YYYY"),
                transactionDate:
                  formatDate(transaction.transactionDate, "DD/MM/YYYY") ||
                  "N/A",
              }))}
              onRowClick={(bank) => handleRowClick(bank.id)}
            />
          )}
          <Pagination
            currentPage={pagination.page}
            totalPages={totalPages}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
            startIndex={(pagination.page - 1) * pagination.pageSize + 1}
            endIndex={Math.min(
              pagination.page * pagination.pageSize,
              pagination.total
            )}
            totalItems={pagination.total}
          />
        </div>
      )}
    </Sidebar>
  );
};
export default BankTransactions;
