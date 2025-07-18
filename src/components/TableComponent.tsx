/** @format */

import { Button, Space, Table, Typography } from "antd";
import { FormModel } from "../models/FormModel";
import { useEffect, useState } from "react";
import { ColumnProps } from "antd/es/table";
import { Sort } from "iconsax-react";
import { colors } from "../constants/colors";
import { Resizable } from "re-resizable";
import { ModalExportData } from "../modals";
import handleAPI from "../apis/handleAPI";

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

    forms.formItems.forEach((item: any) => {
      if (item.key === "products" || item.key === "categories") {
        items.push({
          key: item.key,
          dataIndex: item.value,
          title: item.label,
          width: item.displayLength,
          render: (value: string[] | any[]) => (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {value?.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: "2px 4px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "4px",
                    marginRight: "4px",
                    marginBottom: "4px",
                  }}
                >
                  {typeof item === "string" ? item : item.title || item.name}
                </div>
              ))}
            </div>
          ),
        });
      } else {
        items.push({
          key: item.key,
          dataIndex: item.value,
          title: item.label,
          width: item.displayLength,
        });
      }
    });

    items.unshift({
      key: "index",
      dataIndex: "index",
      title: "#",
      align: "center",
      width: 100,
    });

    if (extraColumn) {
      items.push({
        key: "actions",
        dataIndex: "",
        fixed: "right",
        title: "Action",
        align: "right",
        render: (item: any) => extraColumn(item),
        width: 100,
      });
    }

    setColumns(items);
  }
}, [forms]);

  const RenderTitle = (props: any) => {
    const { children, ...restProps } = props;
    return (
      <th
        {...restProps}
        style={{
          padding: "6px 12px",
        }}
      >
        <Resizable
          enable={{ right: true }}
          onResizeStop={(_e, _direction, _ref, d) => {
            const item = columns.find(
              (element) => element.title === children[1]
            );
            if (item) {
              const items = [...columns];
              const newWidth = (item.width as number) + d.width;
              const index = columns.findIndex(
                (element) => element.key === item.key
              );

              if (index !== -1) {
                items[index].width = newWidth;
              }

              setColumns(items);
            }
          }}
        >
          {children}
        </Resizable>
      </th>
    );
  };

  return (
    <>
      <Table
        pagination={{
          showSizeChanger: true,
          onShowSizeChange: (current, size) => {
            setPageInfo({ ...pageInfo, pageSize: size });
          },
          total,
          onChange(page, pageSize) {
            setPageInfo({
              ...pageInfo,
              page,
            });
          },
          showQuickJumper: true,
        }}
        scroll={{
          y: scrollHeight ? scrollHeight : "calc(100vh - 300px)",
        }}
        loading={loading}
        dataSource={records}
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
            <Title level={5} style={{ margin: 0 }}>
              {forms.title}
            </Title>
            <Space>
              <Button type="primary" onClick={onAddNew}>
                Add Supplier
              </Button>
              <Button icon={<Sort size={20} color={colors.gray600} />}>
                Filters
              </Button>
              <Button onClick={() => setIsVisibleModalExport(true)}>
                Export Excel
              </Button>
            </Space>
          </div>
        )}
        components={{
          header: {
            cell: RenderTitle,
          },
        }}
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
