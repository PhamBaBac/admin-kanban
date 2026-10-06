/** @format */

import React from "react";
import { Modal, Tabs } from "antd";
import { ReceiptItem, WalletMoney } from "iconsax-react";
import { CreateShipmentModal, OrderDetailDrawer } from "../../modals";
import FinancialLedgerTab from "./FinancialLedgerTab";
import { useOrdersManager } from "./hooks/useOrdersManager";
import { OrdersFilterSection } from "./components/OrdersFilterSection";
import { OrdersTable } from "./components/OrdersTable";
import { OrdersMobileCards } from "./components/OrdersMobileCards";
import { OrderStatusModal } from "./components/OrderStatusModal";
import { GHNTrackingModal } from "./components/GHNTrackingModal";

const { confirm } = Modal;

const OrdersScreen: React.FC = () => {
  const {
    bills,
    loading,
    total,
    page,
    limit,
    selectedRowKeys,
    searchKey,
    orderIdFromUrl,
    filterStatus,
    statusCounts,
    dateRange,
    isMobile,
    mainTabKey,
    tabsContainerRef,
    isModalStatusOpen,
    selectedOrder,
    selectedStatus,
    trackingCode,
    cancelReason,
    customReason,
    isUpdatingStatus,
    isTrackingModalOpen,
    trackingOrder,
    trackingData,
    trackingLoading,
    isShipmentModalOpen,
    shipmentOrder,
    isDetailModalOpen,
    selectedDetailOrder,
    setSelectedRowKeys,
    setSearchKey,
    setDateRange,
    setPage,
    setLimit,
    setMainTabKey,
    setIsModalStatusOpen,
    setSelectedOrder,
    setSelectedStatus,
    setTrackingCode,
    setCancelReason,
    setCustomReason,
    setIsTrackingModalOpen,
    setTrackingData,
    setTrackingOrder,
    setIsShipmentModalOpen,
    setShipmentOrder,
    setIsDetailModalOpen,
    setSelectedDetailOrder,
    handleStatusFilterChange,
    handleClearUrlOrderFilter,
    handleResetFilters,
    handleSearchBills,
    handleRemoveBill,
    handleUpdateStatusOrder,
    handleOpenDetailModal,
    handleOpenDetailById,
    handleOpenCreateShipment,
    handleOpenTracking,
    openStatusModal,
    fetchBills,
    fetchStatusCounts,
  } = useOrdersManager();

  const handleBatchDelete = () => {
    confirm({
      title: "Xác nhận xóa hàng loạt",
      content: `Bạn có chắc muốn xóa ${selectedRowKeys.length} đơn hàng đã chọn?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        await Promise.all(selectedRowKeys.map((id) => handleRemoveBill(id)));
        setSelectedRowKeys([]);
        await fetchBills(page, limit, filterStatus, searchKey, dateRange);
        fetchStatusCounts();
      },
      onCancel: () => setSelectedRowKeys([]),
    });
  };

  return (
    <div style={{ padding: "8px 0" }}>
      <Tabs
        activeKey={mainTabKey}
        onChange={setMainTabKey}
        className="orders-main-tabs"
        style={{ marginBottom: 12 }}
        items={[
          {
            key: "orders",
            label: (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <ReceiptItem size={18} />
                Danh sách đơn hàng
              </span>
            ),
            children: (
              <>
                {/* Bộ lọc trạng thái, tìm kiếm, ngày tháng */}
                <OrdersFilterSection
                  filterStatus={filterStatus}
                  statusCounts={statusCounts}
                  searchKey={searchKey}
                  selectedRowKeys={selectedRowKeys}
                  orderIdFromUrl={orderIdFromUrl}
                  total={total}
                  tabsContainerRef={tabsContainerRef}
                  onStatusChange={handleStatusFilterChange}
                  onSearchChange={setSearchKey}
                  onSearchSubmit={handleSearchBills}
                  onDateRangeChange={(dates, dateStrings) => {
                    setPage(1);
                    if (dates && dateStrings[0] && dateStrings[1]) {
                      setDateRange([dateStrings[0], dateStrings[1]]);
                    } else {
                      setDateRange(null);
                    }
                  }}
                  onBatchDelete={handleBatchDelete}
                  onClearUrlOrderFilter={handleClearUrlOrderFilter}
                  onResetFilters={handleResetFilters}
                />

                {/* Danh sách hiển thị theo Mobile Card hoặc Desktop Table */}
                {isMobile ? (
                  <OrdersMobileCards
                    bills={bills}
                    loading={loading}
                    total={total}
                    page={page}
                    limit={limit}
                    selectedRowKeys={selectedRowKeys}
                    onSelectRowKeysChange={setSelectedRowKeys}
                    onPageChange={(p, l) => {
                      setPage(p);
                      if (l && l !== limit) setLimit(l);
                    }}
                    onOpenDetailModal={handleOpenDetailModal}
                    onOpenCreateShipment={handleOpenCreateShipment}
                    onOpenTracking={handleOpenTracking}
                    onOpenStatusModal={openStatusModal}
                    onRemoveBill={handleRemoveBill}
                  />
                ) : (
                  <OrdersTable
                    bills={bills}
                    loading={loading}
                    total={total}
                    page={page}
                    limit={limit}
                    selectedRowKeys={selectedRowKeys}
                    onSelectRowChange={setSelectedRowKeys}
                    onPageChange={(p, l) => {
                      setPage(p);
                      if (l && l !== limit) setLimit(l);
                    }}
                    onOpenDetailModal={handleOpenDetailModal}
                    onOpenCreateShipment={handleOpenCreateShipment}
                    onOpenTracking={handleOpenTracking}
                    onOpenStatusModal={openStatusModal}
                    onRemoveBill={handleRemoveBill}
                  />
                )}
              </>
            ),
          },
          {
            key: "financial-ledger",
            label: (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <WalletMoney size={18} />
                Sổ cái tài chính
              </span>
            ),
            children: (
              <FinancialLedgerTab
                onViewOrderDetail={(orderId) => {
                  setMainTabKey("orders");
                  handleOpenDetailById(orderId);
                }}
              />
            ),
          },
        ]}
      />

      {/* Modal Cập nhật trạng thái đơn hàng */}
      <OrderStatusModal
        open={isModalStatusOpen}
        selectedOrder={selectedOrder}
        selectedStatus={selectedStatus}
        trackingCode={trackingCode}
        cancelReason={cancelReason}
        customReason={customReason}
        isUpdatingStatus={isUpdatingStatus}
        onClose={() => {
          setIsModalStatusOpen(false);
          setSelectedOrder(null);
          setSelectedStatus("");
          setTrackingCode("");
          setCancelReason("");
          setCustomReason("");
        }}
        onStatusChange={setSelectedStatus}
        onTrackingCodeChange={setTrackingCode}
        onCancelReasonChange={setCancelReason}
        onCustomReasonChange={setCustomReason}
        onSubmit={handleUpdateStatusOrder}
      />

      {/* Modal xem lộ trình vận chuyển GHN */}
      <GHNTrackingModal
        open={isTrackingModalOpen}
        trackingOrder={trackingOrder}
        trackingData={trackingData}
        trackingLoading={trackingLoading}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setTrackingData(null);
          setTrackingOrder(null);
        }}
      />

      {/* Modal Kê khai cân nặng, kích thước & Tạo vận đơn GHN */}
      <CreateShipmentModal
        visible={isShipmentModalOpen}
        order={shipmentOrder}
        onClose={() => {
          setIsShipmentModalOpen(false);
          setShipmentOrder(null);
        }}
        onSuccess={() => {
          fetchBills();
        }}
      />

      {/* Drawer Chi tiết đơn hàng 360°, Snapshot, Audit Trail & Sổ cái */}
      <OrderDetailDrawer
        open={isDetailModalOpen}
        order={selectedDetailOrder}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailOrder(null);
        }}
      />
    </div>
  );
};

export default OrdersScreen;
