import { Button, Space, Table, Tag, Typography } from "antd";
import { FormModel } from "../models/FormModel";
import { useEffect, useState } from "react";
import { ColumnProps } from "antd/es/table";
import { Sort } from "iconsax-react";
import { colors } from "../constants/colors";
import { ModalExportData } from "../modals";

interface Props {
  forms: FormModel;
  loading?: boolean;
  records: any[];
  onPageChange: (val: { page: number; pageSize: number }) => void;
  onAddNew: () => void;
  scrollHeight?: string;
  total: number;
  extraColumn?: (item: any) => void;
  api: string;
}

const { Title } = Typography;

const TableComponent = (props: Props) => {
  const {
    forms,
    loading,
    records,
    onPageChange,
    onAddNew,
    total,
    scrollHeight,
    extraColumn,
    api,
  } = props;

  const [pageInfo, setPageInfo] = useState<{
    page: number;
    pageSize: number;
  }>({
    page: 1,
    pageSize: 10,
  });
  const [columns, setColumns] = useState<ColumnProps<any>[]>([]);
  const [isVisibleModalExport, setIsVisibleModalExport] = useState(false);

  useEffect(() => {
    onPageChange(pageInfo);
  }, [pageInfo]);

  useEffect(() => {
    if (forms && forms.formItems && forms.formItems.length > 0) {
      const items: any[] = [];

      const COLUMN_LABEL_VI: Record<string, string> = {
        name: "Tên nhà cung cấp",
        email: "Email",
        active: "Kích hoạt",
        products: "Sản phẩm",
        categories: "Danh mục",
        price: "Giá nhập",
        contact: "Số điện thoại",
        type: "Hợp tác",
        isTaking: "Hợp tác",
      };

      const COLUMN_WIDTH_CONFIG: Record<string, number> = {
        name: 240,
        email: 200,
        active: 110,
        products: 320,
        categories: 200,
        price: 140,
        contact: 150,
        type: 140,
        isTaking: 140,
      };

      forms.formItems.forEach((item: any) => {
        const viTitle = COLUMN_LABEL_VI[item.key] || COLUMN_LABEL_VI[item.value] || item.label;
        const colWidth = COLUMN_WIDTH_CONFIG[item.key] || COLUMN_WIDTH_CONFIG[item.value] || item.displayLength || 160;

        if (item.key === "products" || item.key === "categories") {
          items.push({
            key: item.key,
            dataIndex: item.value,
            title: viTitle,
            width: colWidth,
            render: (value: string[] | any[]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) {
                return <span style={{ color: "#94a3b8" }}>—</span>;
              }
              const list = Array.isArray(value) ? value : [value];
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {list.map((subItem, index) => {
                    const itemKey =
                      typeof subItem === "string"
                        ? subItem
                        : subItem?.id || subItem?._id || `${item.key}-${index}`;
                    const labelText =
                      typeof subItem === "string"
                        ? subItem
                        : subItem?.title || subItem?.name || "";
                    if (!labelText) return null;
                    return (
                      <Tag
                        color={item.key === "categories" ? "purple" : "blue"}
                        key={itemKey}
                        style={{
                          margin: 0,
                          maxWidth: "100%",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          lineHeight: "1.4",
                          padding: "4px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {labelText}
                      </Tag>
                    );
                  })}
                </div>
              );
            },
          });
        } else if (item.value === "isTaking" || item.key === "type") {
          items.push({
            key: item.key,
            dataIndex: item.value,
            title: viTitle,
            width: colWidth,
            align: "center",
            render: (val: any) =>
              val === 1 || val === true ? (
                <Tag color="success">Đang lấy hàng</Tag>
              ) : (
                <Tag color="default">Ngừng lấy</Tag>
              ),
          });
        } else if (item.key === "price") {
          items.push({
            key: item.key,
            dataIndex: item.value,
            title: viTitle,
            width: colWidth,
            align: "right",
            render: (val: any) =>
              val !== undefined && val !== null && val !== ""
                ? `${Number(val).toLocaleString("vi-VN")} đ`
                : "—",
          });
        } else if (item.key === "active") {
          items.push({
            key: item.key,
            dataIndex: item.value,
            title: viTitle,
            width: colWidth,
            align: "center",
            render: (val: any) =>
              val === 1 || val === "1" ? (
                <Tag color="processing">Hoạt động</Tag>
              ) : (
                <Tag color="error">Khóa</Tag>
              ),
          });
        } else {
          items.push({
            key: item.key,
            dataIndex: item.value,
            title: viTitle,
            width: colWidth,
            render: (val: any) =>
              val ? (
                <span style={{ wordBreak: "break-word" }}>{val}</span>
              ) : (
                <span style={{ color: "#94a3b8" }}>—</span>
              ),
          });
        }
      });

      items.unshift({
        key: "index",
        dataIndex: "index",
        title: "#",
        align: "center",
        width: 60,
        render: (_: any, __: any, index: number) =>
          (pageInfo.page - 1) * pageInfo.pageSize + index + 1,
      });

      if (extraColumn) {
        items.push({
          key: "actions",
          dataIndex: "",
          fixed: "right",
          title: "Thao tác",
          align: "center",
          render: (item: any) => extraColumn(item),
          width: 100,
        });
      }

      setColumns(items);
    }
  }, [forms, pageInfo, extraColumn]);

  return (
    <>
      <Table
        pagination={{
          showSizeChanger: true,
          onShowSizeChange: (current, size) => {
            setPageInfo({ ...pageInfo, pageSize: size });
          },
          total,
          showTotal: (tot, range) => `${range[0]}-${range[1]} trong tổng số ${tot} nhà cung cấp`,
          onChange(page, pageSize) {
            setPageInfo({
              ...pageInfo,
              page,
            });
          },
          showQuickJumper: true,
        }}
        scroll={{
          x: 1600,
          y: scrollHeight ? scrollHeight : "calc(100vh - 300px)",
        }}
        loading={loading}
        dataSource={records?.map((item, index) => ({
          ...item,
          key: item.id || item._id || `row-${index}`,
        }))}
        columns={columns}
        bordered
        title={() => (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
              {forms.title === "Suppliers" || forms.title === "Supplier" ? "Danh sách nhà cung cấp" : forms.title}
            </Title>
            <Space>
              <Button type="primary" onClick={onAddNew}>
                Thêm nhà cung cấp
              </Button>
              <Button icon={<Sort size={18} color={colors.gray600} />}>
                Bộ lọc
              </Button>
              <Button onClick={() => setIsVisibleModalExport(true)}>
                Xuất Excel
              </Button>
            </Space>
          </div>
        )}
      />
      <ModalExportData
        visible={isVisibleModalExport}
        onClose={() => setIsVisibleModalExport(false)}
        api={api}
        name={api}
      />
    </>
  );
};

export default TableComponent;
