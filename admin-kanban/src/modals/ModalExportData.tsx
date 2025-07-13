/** @format */

import {
  Button,
  Checkbox,
  DatePicker,
  Divider,
  List,
  message,
  Modal,
  Space,
} from "antd";
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

const ModalExportData = (props: Props) => {
  const { visible, onClose, api, name } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [isGetting, setIsGetting] = useState(false);
  const [forms, setForms] = useState<FormModel>();
  const [checkedValues, setCheckedValues] = useState<string[]>([]);
  const [timeSelected, setTimeSelected] = useState<string>("ranger");
  const [dates, setDates] = useState({
    start: "",
    end: "",
  });


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

  const handleExport = async () => {
    if (timeSelected === "all") {
      // ✅ Nếu chọn "Get all" → gọi GET API và tự động tải file
      const exportUrl = `/${api}/export`;

      const link = document.createElement("a");
      link.href = exportUrl;
      link.setAttribute("download", "suppliersxx.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();

      onClose();
      return;
    }

    // if (!dates.start || !dates.end) {
    //   message.error("Please select date range!");
    //   return;
    // }

    // if (new Date(dates.start).getTime() > new Date(dates.end).getTime()) {
    //   message.error("Invalid date range!");
    //   return;
    // }

    // if (checkedValues.length === 0) {
    //   message.error("Please select at least one field");
    //   return;
    // }

    // const url = `/${api}/get-export-data?start=${dates.start}&end=${dates.end}`;

    // setIsLoading(true);
    // try {
    //   const res = await handleAPI(url, checkedValues, "post");

    //   res.data && (await hanldExportExcel(res.data, api));
    //   onClose();
    // } catch (error: any) {
    //   message.error(error.message);
    // } finally {
    //   setIsLoading(false);
    // }
  };
  

  return (
    <Modal
      loading={isGetting}
      open={visible}
      onCancel={onClose}
      onClose={onClose}
      onOk={handleExport}
      okButtonProps={{
        loading: isLoading,
      }}
      title="Export to excel"
    >
      <div>
        <div>
          <Checkbox
            checked={timeSelected === "all"}
            onChange={(val) =>
              setTimeSelected(timeSelected === "all" ? "ranger" : "all")
            }
          >
            Get all
          </Checkbox>
        </div>
        <div className="mt-2">
          <Checkbox
            checked={timeSelected === "ranger"}
            onChange={(val) =>
              setTimeSelected(timeSelected === "all" ? "ranger" : "all")
            }
          >
            Date ranger
          </Checkbox>
        </div>
        <div className="mt-2">
          {timeSelected === "ranger" && (
            <Space>
              <RangePicker
                onChange={(val: any) =>
                  setDates(
                    val && val[0] && val[1]
                      ? {
                          start: `${DateTime.CalendarDate(val[0])} 00:00:00`,
                          end: `${DateTime.CalendarDate(val[1])} 00:00:00`,
                        }
                      : {
                          start: "",
                          end: "",
                        }
                  )
                }
              />
            </Space>
          )}
        </div>
      </div>
      <Divider />
      <div className="mt-2">
        <List
          dataSource={forms?.formItems}
          renderItem={(item) => (
            <List.Item key={item.key}>
              <Checkbox
                checked={checkedValues.includes(item.value)}
                onChange={() => handleChangeCheckedValue(item.value)}
              >
                {item.label}
              </Checkbox>
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
};

export default ModalExportData;
