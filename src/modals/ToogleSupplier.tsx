import { Avatar, Button, Form, message, Modal, Space, Typography } from "antd";
import { ShopOutlined, CameraOutlined } from "@ant-design/icons";
import { User } from "iconsax-react";
import { useEffect, useRef, useState } from "react";
import FormItem from "../components/FormItem";
import { colors } from "../constants/colors";
import { FormModel } from "../models/FormModel";
import { SupplierModel } from "../models/SupplierModel";
import { replaceName } from "../utils/replaceName";
import { uploadFile } from "../utils/uploadFile";
import { useSuppliers } from "../hooks/useSuppliers";
import { useCategories } from "../hooks/useCategories";
import { getTreeValues } from "../utils/getTreeValues";
import { mapCategoriesToCategoyModels } from "../utils/categoryMapper";

const { Paragraph, Title, Text } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddNew: (val?: any) => void;
  supplier?: SupplierModel;
}

const ToogleSupplier = (props: Props) => {
  const { visible, onAddNew, onClose, supplier } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [isGetting, setIsGetting] = useState(false);
  const [isTaking, setIsTaking] = useState<boolean>();
  const [formData, setFormData] = useState<FormModel>();
  const [categories, setCategories] = useState<any[]>([]);
  const [flatCategories, setFlatCategories] = useState<any[]>([]);
  const [file, setFile] = useState<any>();

  const [form] = Form.useForm();
  const inpRef = useRef<any>(null);

  const {
    createSupplier,
    updateSupplier,
    getSupplierForm,
    loading: supplierLoading,
  } = useSuppliers();

  const { getAllCategories } = useCategories();

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    getFormData();
    getCategories();
  }, []);

  useEffect(() => {
    if (supplier && flatCategories.length > 0) {
      const categoryIds = (supplier.categories || [])
        .map((catItem: string) => {
          // catItem có thể là ID hoặc là Title/Name
          const found = flatCategories.find(
            (c) => c.id === catItem || c.title === catItem || c.name === catItem
          );
          return found ? found.id : catItem;
        })
        .filter(Boolean);

      form.setFieldsValue({
        ...supplier,
        categories: categoryIds,
      });

      setIsTaking(supplier.isTaking === 1);
    }
  }, [supplier, flatCategories]);

  const addNewSupplier = async (values: any) => {
    setIsLoading(true);

    const data: any = {};

    for (const i in values) {
      data[i] = values[i] ?? "";
    }

    data.price = values.price ? parseInt(values.price) : 0;
    data.isTaking = isTaking ? 1 : 0;

    if (file) {
      data.photoUrl = await uploadFile(file);
    }

    data.slug = replaceName(values.name);

    if (values.categories && Array.isArray(values.categories)) {
      data.categories = values.categories.map((c: any) =>
        typeof c === "object" && c !== null ? c.value || c.id : c
      ).filter(Boolean);
    } else {
      data.categories = [];
    }
    try {
      let res: any;
      if (supplier) {
        res = await updateSupplier({ ...data, id: supplier.id });
      } else {
        res = await createSupplier(data);
      }
      message.success(
        supplier ? "Cập nhật supplier thành công!" : "Thêm supplier thành công!"
      );
      onAddNew(res);
      handleClose();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFormData = async () => {
    setIsGetting(true);
    try {
      const res = await getSupplierForm();
      res && setFormData(res);
    } catch (error) {
      console.log(error);
    } finally {
      setIsGetting(false);
    }
  };

  const getCategories = async () => {
    try {
      const response = await getAllCategories();
      const mapped = mapCategoriesToCategoyModels(response);
      setFlatCategories(mapped);
      const tree = mapped.length > 0 ? getTreeValues(mapped, true) : [];
      setCategories(tree);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setFile(undefined);
    onClose();
  };

  return (
    <Modal
      width={isMobile ? "100%" : 680}
      loading={isGetting}
      closable={!isLoading}
      open={visible}
      destroyOnClose
      onCancel={handleClose}
      onOk={() => form.submit()}
      okButtonProps={{
        loading: isLoading || supplierLoading,
        style: { background: "#1677ff", fontWeight: 600 },
      }}
      style={{
        top: isMobile ? 10 : 30,
        maxWidth: isMobile ? "calc(100vw - 16px)" : 680,
        margin: "0 auto",
        paddingBottom: isMobile ? 16 : 0,
      }}
      bodyStyle={{
        maxHeight: isMobile ? "calc(100vh - 160px)" : "calc(100vh - 200px)",
        overflowY: "auto",
        overflowX: "hidden",
        padding: isMobile ? "12px 14px" : "20px 24px",
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: isMobile ? 36 : 40,
              height: isMobile ? 36 : 40,
              borderRadius: 10,
              backgroundColor: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1677ff",
              flexShrink: 0,
            }}
          >
            <ShopOutlined style={{ fontSize: isMobile ? 18 : 22 }} />
          </div>
          <div>
            <Title
              level={5}
              style={{
                margin: 0,
                fontWeight: 700,
                color: "#0f172a",
                fontSize: isMobile ? 15 : 16,
              }}
            >
              {supplier ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}
            </Title>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                display: isMobile ? "none" : "block",
              }}
            >
              Quản lý thông tin đối tác cung ứng và danh mục hàng hóa hợp tác
            </Text>
          </div>
        </div>
      }
      okText={supplier ? "Lưu cập nhật" : "Thêm nhà cung cấp"}
      cancelText="Hủy bỏ"
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "center" : "center",
          textAlign: isMobile ? "center" : "left",
          gap: 16,
          padding: isMobile ? "12px" : "16px",
          backgroundColor: "#f8fafc",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          marginBottom: 20,
          marginTop: isMobile ? 8 : 14,
        }}
      >
        <div style={{ position: "relative" }}>
          {file ? (
            <Avatar size={76} src={URL.createObjectURL(file)} style={{ border: "2px solid #1677ff" }} />
          ) : supplier?.photoUrl ? (
            <Avatar size={76} src={supplier.photoUrl} style={{ border: "2px solid #e2e8f0" }} />
          ) : (
            <Avatar
              size={76}
              style={{
                backgroundColor: "#ffffff",
                border: "1px dashed #cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={40} color={colors.gray600} />
            </Avatar>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>Ảnh đại diện / Logo nhà cung cấp</div>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 2, display: "block" }}>
            Định dạng PNG, JPG hoặc JPEG (Tối ưu hình vuông tỉ lệ 1:1)
          </Text>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isMobile ? "center" : "flex-start",
              gap: 12,
              marginTop: 6,
            }}
          >
            <Button
              onClick={() => inpRef.current?.click()}
              type="link"
              icon={<CameraOutlined />}
              style={{ padding: 0, height: "auto", fontSize: 12, fontWeight: 500 }}
            >
              Tải ảnh từ thiết bị
            </Button>
            {file && (
              <Button
                type="link"
                danger
                size="small"
                onClick={() => setFile(undefined)}
                style={{ padding: 0, height: "auto", fontSize: 12 }}
              >
                Hủy ảnh đã chọn
              </Button>
            )}
          </div>
        </div>
      </div>

      {formData && (
        <Form
          disabled={isLoading || supplierLoading}
          onFinish={addNewSupplier}
          layout={isMobile ? "vertical" : formData.layout}
          labelCol={{ span: isMobile ? 24 : formData.labelCol }}
          wrapperCol={{ span: isMobile ? 24 : formData.wrapperCol }}
          size={isMobile ? "middle" : "large"}
          form={form}
        >
          {formData.formItems.map((item) => {
            const isCategoryField = item.key === "categories";
            return (
              <FormItem
                key={item.key}
                item={{
                  ...item,
                  lockup_item: isCategoryField ? categories : item.lockup_item,
                }}
              />
            );
          })}
        </Form>
      )}

      <div className="d-none">
        <input
          ref={inpRef}
          accept="image/*"
          type="file"
          id="inpFile"
          onChange={(val: any) => setFile(val.target.files[0])}
        />
      </div>
    </Modal>
  );
};

export default ToogleSupplier;
