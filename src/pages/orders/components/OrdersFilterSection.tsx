/** @format */

import React from "react";
import {
  Card,
  Typography,
  Space,
  Tooltip,
  Button,
  Tag,
  Input,
  DatePicker,
  Tabs,
  Badge,
  Alert,
} from "antd";
import { Trash, FilterSearch } from "iconsax-react";

interface OrdersFilterSectionProps {
  filterStatus: string;
  statusCounts: { [key: string]: number };
  searchKey: string;
  selectedRowKeys: any[];
  orderIdFromUrl: string | null;
  total: number;
  tabsContainerRef: React.RefObject<HTMLDivElement | null>;
  onStatusChange: (status: string) => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onDateRangeChange: (dates: any, dateStrings: [string, string]) => void;
  onBatchDelete: () => void;
  onClearUrlOrderFilter: () => void;
  onResetFilters: () => void;
}

export const OrdersFilterSection: React.FC<OrdersFilterSectionProps> = ({
  filterStatus,
  statusCounts,
  searchKey,
  selectedRowKeys,
  orderIdFromUrl,
  total,
  tabsContainerRef,
  onStatusChange,
  onSearchChange,
  onSearchSubmit,
  onDateRangeChange,
  onBatchDelete,
  onClearUrlOrderFilter,
  onResetFilters,
}) => {
  return (
    <>
      <Card
        className="app-card"
        style={{ marginBottom: "16px" }}
        bordered={false}
      >
        <div
          className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3"
          style={{ marginBottom: 14 }}
        >
          <div>
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Quản lý đơn hàng
            </Typography.Title>
          </div>
          <div className="d-flex align-items-center flex-wrap gap-2 w-100 w-lg-auto justify-content-start justify-content-lg-end">
            {selectedRowKeys.length > 0 && (
              <Tooltip title="Xóa các đơn hàng đã chọn">
                <Button
                  danger
                  type="primary"
                  icon={<Trash size={16} />}
                  onClick={onBatchDelete}
                >
                  Xóa ({selectedRowKeys.length})
                </Button>
              </Tooltip>
            )}
            {orderIdFromUrl && (
              <Tag
                closable
                color="blue"
                onClose={onClearUrlOrderFilter}
                style={{
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Đang xem đơn #
                {orderIdFromUrl.length > 8
                  ? orderIdFromUrl.substring(0, 8).toUpperCase()
                  : orderIdFromUrl}
              </Tag>
            )}
            <Input.Search
              value={searchKey}
              onChange={(e) => onSearchChange(e.target.value)}
              onSearch={onSearchSubmit}
              placeholder="Tìm kiếm theo mã đơn, khách hàng, sản phẩm..."
              allowClear
              style={{ minWidth: 240, flex: 1, maxWidth: 360 }}
            />
            <DatePicker.RangePicker
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ minWidth: 220, flex: 1, maxWidth: 280 }}
              onChange={onDateRangeChange}
            />
          </div>
        </div>

        <div ref={tabsContainerRef} className="orders-status-tabs-container">
          <Tabs
            activeKey={filterStatus}
            className="orders-status-tabs"
            onChange={onStatusChange}
            items={[
              {
                key: "ALL",
                label: (
                  <Space size={6}>
                    <span>Tất cả</span>
                    <Badge
                      count={statusCounts["ALL"] || 0}
                      overflowCount={999}
                      color="#64748b"
                    />
                  </Space>
                ),
              },
              {
                key: "PENDING",
                label: (
                  <Space size={6}>
                    <span>Chờ xử lý</span>
                    {(statusCounts["PENDING"] || 0) > 0 && (
                      <Badge count={statusCounts["PENDING"]} color="#f04438" />
                    )}
                  </Space>
                ),
              },
              {
                key: "PROCESSING",
                label: (
                  <Space size={6}>
                    <span>Đang chuẩn bị</span>
                    {(statusCounts["PROCESSING"] || 0) > 0 && (
                      <Badge
                        count={statusCounts["PROCESSING"]}
                        color="#1570ef"
                      />
                    )}
                  </Space>
                ),
              },
              {
                key: "COMPLETED",
                label: (
                  <Space size={6}>
                    <span>Hoàn thành</span>
                    {(statusCounts["COMPLETED"] || 0) > 0 && (
                      <Badge
                        count={statusCounts["COMPLETED"]}
                        color="#12b76a"
                      />
                    )}
                  </Space>
                ),
              },
              {
                key: "CANCELLED",
                label: (
                  <Space size={6}>
                    <span>Đã hủy</span>
                    {(statusCounts["CANCELLED"] || 0) > 0 && (
                      <Badge
                        count={statusCounts["CANCELLED"]}
                        color="#98a2b3"
                      />
                    )}
                  </Space>
                ),
              },
              {
                key: "REFUNDED",
                label: (
                  <Space size={6}>
                    <span>Hoàn tiền</span>
                    {(statusCounts["REFUNDED"] || 0) > 0 && (
                      <Badge count={statusCounts["REFUNDED"]} color="#f79009" />
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </div>
      </Card>

      {filterStatus !== "ALL" && (
        <Alert
          message={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FilterSearch size={16} color="#1570ef" variant="Bold" />
                Đang lọc danh sách theo:{" "}
                <strong>
                  {filterStatus === "PENDING"
                    ? "Đơn hàng chờ xác nhận"
                    : filterStatus === "PROCESSING"
                    ? "Đơn hàng đang chuẩn bị"
                    : filterStatus === "COMPLETED"
                    ? "Đơn hàng hoàn thành"
                    : filterStatus === "CANCELLED"
                    ? "Đơn hàng đã hủy"
                    : filterStatus === "REFUNDED"
                    ? "Đơn hàng hoàn tiền"
                    : filterStatus}
                </strong>{" "}
                ({total} đơn)
              </span>
              <Button size="small" type="link" onClick={onResetFilters}>
                Xóa bộ lọc (Xem tất cả)
              </Button>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}
    </>
  );
};
