/** @format */

import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Divider,
  List,
  message,
  Modal,
  Radio,
  Space,
  Typography,
} from "antd";
import { FileExcelOutlined, CalendarOutlined, CheckSquareOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { FormModel } from "../models/FormModel";
import handleAPI from "../apis/handleAPI";
import { DateTime } from "../utils/dateTime";
import { hanldExportExcel } from "../utils/hanldExportExcel";

interface Props {
  visible: boolean;
  onClose: () => void;
  api: string;
  name?: string;
}

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const ModalExportData = (props: Props) => {
  const { visible, onClose, api, name } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [isGetting, setIsGetting] = useState(false);
  const [forms, setForms] = useState<FormModel>();
  const [checkedValues, setCheckedValues] = useState<string[]>([]);
  const [timeSelected, setTimeSelected] = useState<string>("all");
  const [dates, setDates] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    if (visible && api) {
      getFormFields();
    }
  }, [visible, api]);

  const getFormFields = async () => {
    setIsGetting(true);
    try {
      const res: any = await handleAPI(`/${api}/get-form`);
      if (res?.data) {
        setForms(res.data);
        const allKeys = res.data.formItems?.map((it: any) => it.value || it.key) || [];
        setCheckedValues(allKeys);
      }
    } catch {
    } finally {
      setIsGetting(false);
    }
  };

  const handleChangeCheckedValue = (val: string) => {
    const items = [...checkedValues];
    const index = items.findIndex((element) => element === val);

    if (index !== -1) {
      items.splice(index, 1);
    } else {
      items.push(val);
    }

    setCheckedValues(items);
  };

  const handleToggleSelectAll = () => {
    if (!forms?.formItems) return;
    const allKeys = forms.formItems.map((it: any) => it.value || it.key);
    if (checkedValues.length === allKeys.length) {
      setCheckedValues([]);
    } else {
      setCheckedValues(allKeys);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);

      let exportUrl = `/${api}/export`;
      let fileName = `${api || "export"}-data.xlsx`;

      if (timeSelected === "ranger") {
        if (!dates.start || !dates.end) {
          message.warning("Vui lòng chọn khoảng thời gian bắt đầu và kết thúc!");
          setIsLoading(false);
          return;
        }
        exportUrl += `?start=${encodeURIComponent(dates.start)}&end=${encodeURIComponent(dates.end)}`;
        fileName = `${api || "export"}-from-${dates.start.slice(0, 10)}-to-${dates.end.slice(0, 10)}.xlsx`;
      }

      const link = document.createElement("a");
      link.href = exportUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      message.success("Bắt đầu tải tệp dữ liệu Excel!");
      onClose();
    } catch (error: any) {
      message.error(error?.message || "Lỗi khi xuất tệp dữ liệu!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      loading={isGetting}
      open={visible}
      onCancel={onClose}
      onOk={handleExport}
      okButtonProps={{
        loading: isLoading,
        icon: <FileExcelOutlined />,
        style: { background: "#16a34a", borderColor: "#16a34a", fontWeight: 600 },
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#16a34a",
              flexShrink: 0,
            }}
          >
            <FileExcelOutlined style={{ fontSize: 22 }} />
          </div>
          <div>
            <Title level={5} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
              Xuất dữ liệu Excel {name ? `(${name})` : ""}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Trích xuất dữ liệu bảng ra tệp tin định dạng Microsoft Excel (.xlsx)
            </Text>
          </div>
        </div>
      }
      okText="Xuất file Excel"
      cancelText="Hủy bỏ"
      width={600}
      style={{ top: 40 }}
    >
      <div style={{ marginTop: 14 }}>
        <Card
          size="small"
          title={
            <Space size={8}>
              <CalendarOutlined style={{ color: "#16a34a" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Phạm vi thời gian xuất</span>
            </Space>
          }
          style={{ marginBottom: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}
          headStyle={{ backgroundColor: "#f8fafc", padding: "8px 16px" }}
        >
          <Radio.Group
            value={timeSelected}
            onChange={(e) => setTimeSelected(e.target.value)}
            style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}
          >
            <Radio value="all">
              <span style={{ fontWeight: 500, color: "#1e293b" }}>
                Toàn bộ thời gian (Tất cả bản ghi trong hệ thống)
              </span>
            </Radio>
            <Radio value="ranger">
              <span style={{ fontWeight: 500, color: "#1e293b" }}>Theo khoảng thời gian tùy chọn</span>
            </Radio>
          </Radio.Group>

          {timeSelected === "ranger" && (
            <div style={{ marginTop: 12, paddingLeft: 24 }}>
              <RangePicker
                placeholder={["Từ ngày", "Đến ngày"]}
                style={{ width: "100%" }}
                onChange={(val: any) =>
                  setDates(
                    val && val[0] && val[1]
                      ? {
                          start: `${DateTime.CalendarDate(val[0])} 00:00:00`,
                          end: `${DateTime.CalendarDate(val[1])} 23:59:59`,
                        }
                      : {
                          start: "",
                          end: "",
                        }
                  )
                }
              />
            </div>
          )}
        </Card>

        {forms?.formItems && forms.formItems.length > 0 && (
          <Card
            size="small"
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space size={8}>
                  <CheckSquareOutlined style={{ color: "#16a34a" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                    Chọn các trường dữ liệu cần xuất
                  </span>
                </Space>
                <Button
                  size="small"
                  type="link"
                  onClick={handleToggleSelectAll}
                  style={{ padding: 0, fontWeight: 600, fontSize: 12, color: "#16a34a" }}
                >
                  {checkedValues.length === forms.formItems.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </Button>
              </div>
            }
            style={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
            headStyle={{ backgroundColor: "#f8fafc", padding: "8px 16px" }}
          >
            <List
              dataSource={forms.formItems}
              renderItem={(item) => {
                const FIELD_NAMES_VI: Record<string, string> = {
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
                const labelVi = FIELD_NAMES_VI[item.key] || FIELD_NAMES_VI[item.value] || item.label;

                return (
                  <List.Item key={item.key} style={{ padding: "8px 0" }}>
                    <Checkbox
                      checked={checkedValues.includes(item.value || item.key)}
                      onChange={() => handleChangeCheckedValue(item.value || item.key)}
                    >
                      <span style={{ fontSize: 13, color: "#334155" }}>{labelVi}</span>
                    </Checkbox>
                  </List.Item>
                );
              }}
            />
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default ModalExportData;

