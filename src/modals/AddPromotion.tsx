/** @format */

import {
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Upload,
  UploadProps,
  Button,
  Space,
} from "antd";
import { useEffect, useState } from "react";
import handleAPI from "../apis/handleAPI";
import { uploadFile } from "../utils/uploadFile";
import { PromotionModel } from "../models/PromotionModel";
import dayjs from "dayjs";
import { usePromotions } from "../hooks/usePromotions";
import { BsStars } from "react-icons/bs";
import { aiService } from "../services";

interface Props {
  visible: boolean;
  onClose: () => void;
  promotion?: PromotionModel;
  onAddNew: (val: PromotionModel) => void;
}

const AddPromotion = (props: Props) => {
  const { visible, onClose, promotion, onAddNew } = props;

  const [imageUpload, setImageUpload] = useState<any[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [form] = Form.useForm();

  const {
    createPromotion,
    updatePromotion,
    loading: promotionLoading,
  } = usePromotions();

  useEffect(() => {
    if (visible && promotion) {
      form.setFieldsValue({
        ...promotion,
        startAt: promotion.startAt ? dayjs(promotion.startAt) : undefined,
        endAt: promotion.endAt ? dayjs(promotion.endAt) : undefined,
      });

      if (promotion.imageURL) {
        setImageUpload([
          { uid: "-1", name: "promotion-image.png", url: promotion.imageURL, status: "done" },
        ]);
        setImageUrlInput(promotion.imageURL);
      }
    } else if (visible && !promotion) {
      form.resetFields();
      setImageUpload([]);
      setImageUrlInput("");
    }
  }, [visible, promotion]);

  const handleClose = () => {
    form.resetFields();
    setImageUpload([]);
    setImageUrlInput("");
    onClose();
  };

  const handleAddImageFromUrl = () => {
    if (!imageUrlInput || !imageUrlInput.trim()) {
      message.warning("Vui lòng nhập đường link ảnh hợp lệ!");
      return;
    }
    const url = imageUrlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      message.warning("Đường link ảnh phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    setImageUpload([
      {
        uid: "-1",
        name: "image-from-url.png",
        status: "done",
        url: url,
      },
    ]);
    message.success("Đã nạp ảnh từ đường link thành công!");
  };

  const handleAiGenerate = async () => {
    const title = form.getFieldValue("title");
    if (!title || !title.trim()) {
      message.warning("Vui lòng nhập tiêu đề khuyến mãi trước khi dùng AI viết mô tả!");
      return;
    }

    const code = form.getFieldValue("code");
    const value = form.getFieldValue("value");
    const type = form.getFieldValue("type");
    const contextParts: string[] = [];
    if (code) contextParts.push(`Mã code: ${code}`);
    if (value) contextParts.push(`Mức giảm: ${value}`);
    if (type) contextParts.push(`Loại: ${type}`);

    try {
      setIsGenerating(true);
      const res = await aiService.generateContent({
        type: "promotion_description",
        title: title.trim(),
        context: contextParts.length > 0 ? contextParts.join(", ") : undefined,
      });
      if (res) {
        form.setFieldValue("description", res);
        message.success("AI đã viết xong mô tả khuyến mãi!");
      }
    } catch (error: any) {
      console.error("AI generate promotion description error:", error);
      message.error(error?.message || "Lỗi khi AI tạo mô tả khuyến mãi");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    const items = newFileList.map((item) =>
      item.originFileObj
        ? {
            ...item,
            url: item.originFileObj
              ? URL.createObjectURL(item.originFileObj)
              : "",
            status: "done",
          }
        : { ...item }
    );

    setImageUpload(items);
  };

  const handleAddNewPromotion = async (values: any) => {
    let finalImageUrl = "";
    if (imageUpload.length > 0) {
      if (imageUpload[0].originFileObj) {
        finalImageUrl = await uploadFile(imageUpload[0].originFileObj);
      } else if (imageUpload[0].url) {
        finalImageUrl = imageUpload[0].url;
      }
    } else if (imageUrlInput && imageUrlInput.trim()) {
      finalImageUrl = imageUrlInput.trim();
    }

    if (!finalImageUrl) {
      message.error("Vui lòng tải lên hoặc dán link ảnh khuyến mãi!");
      return;
    }

    const start = values.startAt;
    const end = values.endAt;

    if (start && end && new Date(end).getTime() < new Date(start).getTime()) {
      message.error("Thời gian kết thúc phải lớn hơn thời gian bắt đầu");
      return;
    }

    const data: any = {};

    for (const i in values) {
      data[i] = values[i] ?? "";
    }

    if (start) data.startAt = new Date(start);
    if (end) data.endAt = new Date(end);

    setIsLoading(true);

    try {
      data.imageURL = finalImageUrl;

      let res;
      if (promotion) {
        res = await updatePromotion({ ...data, id: promotion.id });
      } else {
        res = await createPromotion(data);
      }
      onAddNew(res);
      handleClose();
    } catch (error) {
      console.error("Save promotion error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={promotion ? "Edit promotion/discount" : "Add new promotion/discount"}
      open={visible}
      destroyOnClose
      onCancel={handleClose}
      okButtonProps={{
        loading: isLoading || promotionLoading,
      }}
      cancelButtonProps={{
        loading: isLoading || promotionLoading,
      }}
      onOk={() => form.submit()}
    >
      <div className="mb-3">
        <label className="d-block mb-1" style={{ fontWeight: 500 }}>
          Hình ảnh khuyến mãi
        </label>
        <div className="d-flex align-items-start gap-3">
          <Upload
            accept="image/*"
            fileList={imageUpload}
            listType="picture-card"
            onChange={handleChange}
            onRemove={() => {
              setImageUpload([]);
              setImageUrlInput("");
            }}
          >
            {imageUpload.length === 0 ? "+ Tải ảnh lên" : null}
          </Upload>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, color: "#666" }}>
              Hoặc dán trực tiếp đường link (URL) của ảnh:
            </span>
            <Space.Compact style={{ width: "100%", marginTop: 6 }}>
              <Input
                placeholder="https://example.com/image.png"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onPressEnter={(e) => {
                  e.preventDefault();
                  handleAddImageFromUrl();
                }}
                allowClear
              />
              <Button type="primary" onClick={handleAddImageFromUrl}>
                Dán link
              </Button>
            </Space.Compact>
          </div>
        </div>
      </div>
      <Form
        form={form}
        disabled={isLoading || promotionLoading}
        size="large"
        onFinish={handleAddNewPromotion}
        layout="vertical"
      >
        <Form.Item
          name={"title"}
          label="Title"
          rules={[{ required: true, message: "Please enter promotion" }]}
        >
          <Input placeholder="title" allowClear />
        </Form.Item>
        <Form.Item
          name={"description"}
          label={
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
              <span>Description</span>
              <Button
                type="link"
                size="small"
                icon={<BsStars size={16} />}
                loading={isGenerating}
                onClick={handleAiGenerate}
                style={{
                  padding: 0,
                  height: "auto",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#7928CA",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                AI viết mô tả
              </Button>
            </div>
          }
        >
          <Input.TextArea rows={4} placeholder="Description" allowClear />
        </Form.Item>
        <div className="row">
          <div className="col">
            <Form.Item name="code" label="CODE" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </div>
          <div className="col">
            <Form.Item name="value" label="Value" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <Form.Item name="numOfAvailable" label="Num of value">
              <Input type="number" />
            </Form.Item>
          </div>
          <div className="col">
            <Form.Item name="type" label="Type" initialValue={"DISCOUNT"}>
              <Select
                options={[
                  {
                    label: "Discount",
                    value: "DISCOUNT",
                  },
                  {
                    label: "Percent",
                    value: "PERCENT",
                  },
                ]}
              />
            </Form.Item>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <Form.Item name={"startAt"} label="Start">
              <DatePicker showTime format={"DD/MM/YYYY HH:mm:ss"} />
            </Form.Item>
          </div>
          <div className="col">
            <Form.Item name={"endAt"} label="End">
              <DatePicker showTime format={"DD/MM/YYYY HH:mm:ss"} />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default AddPromotion;
