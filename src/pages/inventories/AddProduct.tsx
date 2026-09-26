/** @format */

import { Editor } from "@tinymce/tinymce-react";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  TreeSelect,
  Typography,
  Upload,
  UploadProps,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { SelectModel, TreeModel } from "../../models/FormModel";
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import { useSuppliers } from "../../hooks/useSuppliers";
import { replaceName } from "../../utils/replaceName";
import { Add, Edit2, Trash } from "iconsax-react";
import {
  CopyOutlined,
  PictureOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  ModalCategory,
  ToogleSupplier,
  MediaPickerModal,
  AddSubProductModal,
} from "../../modals";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { getTreeValues } from "../../utils/getTreeValues";
import { mapCategoriesToCategoyModels } from "../../utils/categoryMapper";
import { uploadFile } from "../../utils/uploadFile";
import { mediaAPI } from "../../apis/mediaAPI";
import { BsStars } from "react-icons/bs";
import { aiService } from "../../services";
import { ProductModel, SubProductModel } from "../../models/Products";
import { VND } from "../../utils/handleCurrency";
import { colors } from "../../constants/colors";
import { ColorBadge } from "../../utils/colorHelper";

const { Text, Title, Paragraph } = Typography;

const AddProduct = () => {
  const navigate = useNavigate();
  const {
    getProductById,
    createProduct,
    updateProduct,
    getSubProducts,
    deleteSubProduct,
    loading: productsLoading,
  } = useProducts();
  const { getAllCategories: fetchCategories, loading: categoriesLoading } =
    useCategories();
  const { getSuppliers: fetchSuppliers, loading: suppliersLoading } =
    useSuppliers();

  const [content, setcontent] = useState("");
  const [supplierOptions, setSupplierOptions] = useState<SelectModel[]>([]);
  const [isVisibleAddCategory, setIsVisibleAddCategory] = useState(false);
  const [categories, setCategories] = useState<TreeModel[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileList, setFileList] = useState<any[]>([]);
  const [isVisibleAddSupplier, setIsVisibleAddSupplier] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // SubProducts variant management state
  const [subProducts, setSubProducts] = useState<SubProductModel[]>([]);
  const [loadingSubProducts, setLoadingSubProducts] = useState(false);
  const [isVisibleAddSubProduct, setIsVisibleAddSubProduct] = useState(false);
  const [selectedSubProduct, setSelectedSubProduct] = useState<
    SubProductModel | undefined
  >();
  const [cloneVariant, setCloneVariant] = useState<
    Partial<SubProductModel> | undefined
  >();
  const [currentProduct, setCurrentProduct] = useState<ProductModel | undefined>();

  const [searchParams] = useSearchParams();
  const location = useLocation();

  const id = searchParams.get("id");
  const slug = location.state?.slug;
  const productFromState = location.state?.product;

  const editorRef = useRef<any>(null);
  const [form] = Form.useForm();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (id && productFromState) {
      setProductDetailFromState(productFromState);
      setCurrentProduct(productFromState);
      fetchSubProducts(id);
    } else if (id) {
      getProductDetail(id);
      fetchSubProducts(id);
    } else if (!id) {
      form.resetFields();
      setSubProducts([]);
      setCurrentProduct(undefined);
    }
  }, [id, slug, productFromState]);

  const fetchSubProducts = async (productId: string) => {
    try {
      setLoadingSubProducts(true);
      const res = await getSubProducts(productId);
      if (Array.isArray(res)) {
        setSubProducts(res);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách biến thể:", error);
    } finally {
      setLoadingSubProducts(false);
    }
  };

  const setProductDetailFromState = (product: any) => {
    form.setFieldsValue({
      title: product.title || "",
      description: product.description || "",
      categories: product.categories?.map((category: any) => category.id) || [],
      supplier: product.supplierId || null,
    });
    setcontent(product.content || "");
    setFileList(
      product.images?.map((image: any, index: number) => ({
        url: image,
        uid: index,
      })) || []
    );
  };

  const getData = async () => {
    try {
      setIsInitialLoading(true);
      await Promise.all([getSuppliers(), getCategories()]);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const getProductDetail = async (id: string) => {
    try {
      const response = await getProductById(slug || "product", id);

      if (response && response.product) {
        const item = response.product;
        setCurrentProduct(item);
        form.setFieldsValue({
          title: item.title || "",
          description: item.description || "",
          categories:
            item.categories?.map((category: any) => category.id) || [],
          supplier: item.supplierId || item.supplier || null,
        });
        setcontent(item.content || "");
        if (item.images && item.images.length > 0) {
          setFileList(
            item.images.map((image: any, index: number) => ({
              url: image,
              uid: index,
            }))
          );
        } else {
          setFileList([]);
        }
      }
    } catch (error) {
      console.log("Error fetching product detail:", error);
    }
  };

  const handleAddNewProduct = async (values: any) => {
    const detailContent = editorRef.current?.getContent() || content || "";
    const data: any = {};
    setIsCreating(true);

    data.title = values.title || "";
    data.description = values.description || "";
    data.content = detailContent;
    data.slug = replaceName(values.title);
    data.images = [];
    data.supplierId = values.supplier || null;

    if (
      values.categories &&
      Array.isArray(values.categories) &&
      values.categories.length > 0
    ) {
      data.categories = values.categories
        .map((cat: any) => {
          if (typeof cat === "string") {
            return cat;
          } else if (cat && typeof cat === "object" && cat.value) {
            return cat.value;
          } else if (cat && typeof cat === "object" && cat.id) {
            return cat.id;
          }
          return cat;
        })
        .filter(Boolean);
    } else {
      data.categories = [];
    }

    const fileListSafe = [...(fileList || [])];
    if (
      fileUrl &&
      fileUrl.trim() &&
      (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))
    ) {
      fileListSafe.push({
        uid: `${Date.now()}`,
        url: fileUrl.trim(),
        status: "done",
      });
    }

    if (fileListSafe.length > 0) {
      try {
        const uploadPromises = fileListSafe.map(async (file) => {
          if (file.originFileObj) {
            return await uploadFile(file.originFileObj);
          } else {
            return file.url;
          }
        });

        const urls = await Promise.all(uploadPromises);
        data.images = urls.filter((url) => url);
      } catch (error) {
        console.error("Error uploading files:", error);
        setIsCreating(false);
        return;
      }
    }

    try {
      if (id) {
        await updateProduct({ ...data, id }, slug);
        message.success("Cập nhật thông tin sản phẩm thành công!");
        navigate("/inventory", { state: { refresh: true } });
      } else {
        const createdProd: any = await createProduct(data);
        message.success("Tạo sản phẩm mới thành công!");

        Modal.confirm({
          title: "Sản phẩm đã tạo thành công!",
          content:
            "Bạn có muốn thiết lập các biến thể phân loại (Mã SKU, Màu sắc, Dung lượng/Size, Giá bán & Tồn kho) cho sản phẩm này ngay không?",
          okText: "Thêm biến thể ngay",
          cancelText: "Về danh sách kho",
          onOk: () => {
            if (createdProd && createdProd.id) {
              const targetSlug = createdProd.slug || data.slug || "product";
              navigate(`/inventory/detail/${targetSlug}?id=${createdProd.id}`);
            } else {
              navigate("/inventory", { state: { refresh: true } });
            }
          },
          onCancel: () => {
            navigate("/inventory", { state: { refresh: true } });
          },
        });
      }
    } catch (error) {
      console.log("Error creating/updating product:", error);
      message.error("Lưu sản phẩm thất bại, vui lòng kiểm tra lại thông tin");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveSubProduct = async (subProductId: string) => {
    try {
      await deleteSubProduct(subProductId);
      setSubProducts((prev) => prev.filter((item) => item.id !== subProductId));
      message.success("Đã xóa biến thể thành công!");
    } catch (error) {
      console.error(error);
      message.error("Xóa biến thể thất bại");
    }
  };

  const getSuppliers = async () => {
    try {
      const response = await fetchSuppliers();
      const options = response.data.map((item: any) => ({
        value: item.id,
        label: item.name,
      }));
      setSupplierOptions(options);
    } catch (error) {
      console.log(error);
    }
  };

  const getCategories = async () => {
    try {
      const response = await fetchCategories();
      const mappedCategories = mapCategoriesToCategoyModels(response);
      const data =
        mappedCategories.length > 0
          ? getTreeValues(mappedCategories, true)
          : [];
      setCategories(data);
    } catch (error) {
      console.log(error);
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
    setFileList(items);
  };

  const handleAddImageUrlToProduct = () => {
    if (!fileUrl || !fileUrl.trim()) {
      message.warning("Vui lòng nhập đường link ảnh hợp lệ!");
      return;
    }
    const url = fileUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      message.warning("Đường link ảnh phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    const newItem = {
      uid: `${Date.now()}`,
      name: `image-${(fileList || []).length + 1}.png`,
      status: "done",
      url: url,
    };
    setFileList((prev) => [...(prev || []), newItem]);

    mediaAPI
      .saveMedia({
        url: url,
        fileName: `image-${(fileList || []).length + 1}.png`,
        fileType: "image/url",
      })
      .catch((err) => console.warn("Lưu media ngầm thất bại:", err));

    setFileUrl("");
    message.success("Đã nạp ảnh từ đường link thành công!");
  };

  const handleAiGenerateDescription = async () => {
    const title = form.getFieldValue("title");
    if (!title || !title.trim()) {
      message.warning("Vui lòng nhập tên sản phẩm trước khi dùng AI viết mô tả!");
      return;
    }

    try {
      setIsGeneratingDesc(true);
      const res = await aiService.generateContent({
        type: "product_description",
        title: title.trim(),
      });
      if (res) {
        form.setFieldValue("description", res);
        message.success("AI đã viết xong mô tả sản phẩm!");
      }
    } catch (error: any) {
      console.error("AI generate description error:", error);
      message.error(error?.message || "Lỗi khi AI tạo mô tả sản phẩm");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleAiGenerateContent = async () => {
    const title = form.getFieldValue("title");
    if (!title || !title.trim()) {
      message.warning("Vui lòng nhập tên sản phẩm trước khi dùng AI viết bài chi tiết!");
      return;
    }

    try {
      setIsGeneratingContent(true);
      const desc = form.getFieldValue("description");
      const res = await aiService.generateContent({
        type: "product_content",
        title: title.trim(),
        context: desc ? `Mô tả ngắn: ${desc}` : undefined,
      });
      if (res) {
        setcontent(res);
        if (editorRef.current) {
          editorRef.current.setContent(res);
        }
        message.success("AI đã viết xong bài viết chi tiết!");
      }
    } catch (error: any) {
      console.error("AI generate content error:", error);
      message.error(error?.message || "Lỗi khi AI tạo bài viết chi tiết");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Subproduct columns for inline table
  const subProductColumns = [
    {
      key: "images",
      title: "Ảnh",
      dataIndex: "images",
      width: 60,
      render: (imgs: string[] | null | undefined) => (
        <Avatar
          src={imgs && imgs.length > 0 ? imgs[0] : undefined}
          size={36}
          shape="square"
        />
      ),
    },
    {
      title: "Mã SKU",
      key: "sku",
      dataIndex: "sku",
      render: (sku: string, item: SubProductModel) => (
        <Text copyable strong style={{ fontSize: 12, color: colors.primary500 }}>
          {sku || item.id?.substring(0, 8).toUpperCase() || "—"}
        </Text>
      ),
    },
    {
      title: "Phân loại",
      key: "attributes",
      render: (_: any, item: SubProductModel) => {
        const isSystemAttr = (k: string) => {
          const lower = k.trim().toLowerCase();
          return (
            lower === "discounttype" ||
            lower === "discountvalue" ||
            lower === "discountamount" ||
            lower === "discount" ||
            lower === "price" ||
            lower === "cost" ||
            lower === "stock" ||
            lower === "qty"
          );
        };

        const attrs = item.attributes;
        const validEntries = attrs
          ? Object.entries(attrs).filter(([key]) => !isSystemAttr(key))
          : [];

        if (validEntries.length > 0) {
          return (
            <Space wrap size={[4, 4]}>
              {validEntries.map(([key, val]) => {
                const isColor =
                  key.toLowerCase() === "color" || key.toLowerCase() === "màu sắc";
                const isHexColor = isColor && typeof val === "string" && val.startsWith("#");
                return (
                  <Tag
                    key={key}
                    color={isHexColor ? val : undefined}
                    style={{
                      border: isHexColor ? "1px solid #bbb" : undefined,
                      fontSize: 11,
                    }}
                  >
                    {key}: {val}
                  </Tag>
                );
              })}
            </Space>
          );
        }
        return (
          <Space wrap size={[4, 4]}>
            {item.color && <ColorBadge color={item.color} size={14} />}
            {item.size && <Tag style={{ margin: 0 }}>Size {item.size}</Tag>}
          </Space>
        );
      },
    },
    {
      key: "cost",
      title: "Giá vốn",
      dataIndex: "cost",
      render: (cost: number) => (cost ? VND.format(cost) : "—"),
      align: "right" as const,
    },
    {
      key: "price",
      title: "Giá gốc",
      dataIndex: "price",
      render: (price: number, item: SubProductModel) => {
        const hasDiscount = typeof item.discount === "number" && item.discount > 0 && item.discount < item.price;
        return (
          <Text style={{ textDecoration: hasDiscount ? "line-through" : undefined, color: hasDiscount ? "#8c8c8c" : undefined }}>
            {VND.format(price)}
          </Text>
        );
      },
      align: "right" as const,
    },
    {
      key: "discount",
      title: "Khuyến mãi",
      render: (_: any, item: SubProductModel) => {
        const hasDiscount = typeof item.discount === "number" && item.discount > 0 && item.discount < item.price;
        if (!hasDiscount || item.discount === undefined) return <Text type="secondary">—</Text>;
        const discountAmount = item.price - item.discount;
        const discountPercent = Math.round((discountAmount / item.price) * 100);
        return (
          <Space direction="vertical" size={0} align="end">
            <Text style={{ color: "#cf1322", fontWeight: 500, fontSize: 11 }}>
              -{VND.format(discountAmount)}
            </Text>
            <Tag color="red" style={{ margin: 0, fontSize: 10 }}>
              -{discountPercent}%
            </Tag>
          </Space>
        );
      },
      align: "right" as const,
    },
    {
      key: "salePrice",
      title: "Giá bán thực tế",
      render: (_: any, item: SubProductModel) => {
        const hasDiscount = typeof item.discount === "number" && item.discount > 0 && item.discount < item.price;
        const actualPrice = hasDiscount && item.discount !== undefined ? item.discount : item.price;
        return (
          <Text strong style={{ color: "#1677ff", fontSize: 12 }}>
            {VND.format(actualPrice)}
          </Text>
        );
      },
      align: "right" as const,
    },
    {
      key: "profit",
      title: "Lãi gộp ước tính",
      render: (_: any, item: SubProductModel) => {
        const hasDiscount = typeof item.discount === "number" && item.discount > 0 && item.discount < item.price;
        const actualPrice = hasDiscount && item.discount !== undefined ? item.discount : item.price;
        const cost = item.cost || 0;
        const profit = actualPrice - cost;
        const margin = actualPrice > 0 ? (profit / actualPrice) * 100 : 0;
        if (!item.cost) return <Text type="secondary">—</Text>;
        return (
          <Space direction="vertical" size={0} align="end">
            <Text style={{ fontWeight: 600, color: profit >= 0 ? "#52c41a" : "#cf1322", fontSize: 12 }}>
              {profit >= 0 ? `+${VND.format(profit)}` : VND.format(profit)}
            </Text>
            <Tag color={profit < 0 ? "error" : margin < 15 ? "warning" : "success"} style={{ margin: 0, fontSize: 10 }}>
              {margin.toFixed(0)}%
            </Tag>
          </Space>
        );
      },
      align: "right" as const,
    },
    {
      key: "stock",
      title: "Tồn kho",
      dataIndex: "stock",
      render: (stock: number) => stock?.toLocaleString() ?? 0,
      align: "right" as const,
    },
    {
      key: "actions",
      title: "Thao tác",
      align: "center" as const,
      render: (item: SubProductModel) => (
        <Space size={2}>
          <Tooltip title="Nhân bản">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: colors.primary500 }} />}
              onClick={() => {
                const { id: _, ...rest } = item;
                setCloneVariant({
                  ...rest,
                  images: item.images ? [...item.images] : [],
                  attributes: item.attributes ? { ...item.attributes } : undefined,
                });
                setSelectedSubProduct(undefined);
                setIsVisibleAddSubProduct(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<Edit2 variant="Bold" color={colors.primary500} size={15} />}
              onClick={() => {
                setCloneVariant(undefined);
                setSelectedSubProduct(item);
                setIsVisibleAddSubProduct(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash variant="Bold" size={15} />}
              onClick={() =>
                Modal.confirm({
                  title: "Xác nhận xóa biến thể",
                  content: "Bạn có chắc chắn muốn xóa biến thể phân loại này không?",
                  okText: "Xóa",
                  cancelText: "Hủy",
                  okButtonProps: { danger: true },
                  onOk: () => handleRemoveSubProduct(item.id),
                })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return isInitialLoading ? (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "60vh" }}
    >
      <Spin size="large" />
    </div>
  ) : (
    <div>
      <div className="container">
        <Form
          disabled={isCreating}
          size="large"
          form={form}
          onFinish={handleAddNewProduct}
          layout="vertical"
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Title level={3} style={{ margin: 0 }}>
              {id ? "Cập nhật sản phẩm" : "Thêm mới sản phẩm"}
            </Title>
            <Space>
              <Button
                loading={isCreating}
                size="middle"
                onClick={() => navigate("/inventory")}
              >
                Hủy bỏ
              </Button>
              <Button
                loading={isCreating}
                type="primary"
                size="middle"
                onClick={() => form.submit()}
              >
                {id ? "Lưu thay đổi" : "Tạo sản phẩm"}
              </Button>
            </Space>
          </div>

          <div className="row">
            <div className="col-8">
              <Form.Item
                name={"title"}
                label={<Text strong>Tên sản phẩm</Text>}
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên sản phẩm",
                  },
                ]}
              >
                <Input
                  allowClear
                  maxLength={150}
                  showCount
                  placeholder="Nhập tên sản phẩm (VD: iPhone 15 Pro Max 256GB)"
                />
              </Form.Item>
              <Form.Item
                name={"description"}
                label={
                  <div className="d-flex align-items-center" style={{ gap: 8 }}>
                    <Text strong>Mô tả ngắn</Text>
                    <Button
                      type="link"
                      size="small"
                      icon={<BsStars size={16} />}
                      loading={isGeneratingDesc}
                      onClick={handleAiGenerateDescription}
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
                <Input.TextArea
                  maxLength={1000}
                  showCount
                  rows={4}
                  allowClear
                  placeholder="Mô tả tóm tắt đặc điểm nổi bật của sản phẩm..."
                />
              </Form.Item>
              <div className="d-flex align-items-center mb-2" style={{ gap: 8 }}>
                <Text strong>Nội dung chi tiết sản phẩm</Text>
                <Button
                  type="link"
                  size="small"
                  icon={<BsStars size={16} />}
                  loading={isGeneratingContent}
                  onClick={handleAiGenerateContent}
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
                  AI viết bài chi tiết
                </Button>
              </div>
              <Editor
                disabled={isCreating}
                apiKey="ikfkh2oosyq8z4b77hhj1ssxu7js46chtdrcq9j5lqum494c"
                onInit={(evt, editor) => (editorRef.current = editor)}
                initialValue={content !== "" ? content : ""}
                init={{
                  height: 450,
                  menubar: true,
                  plugins: [
                    "advlist",
                    "autolink",
                    "lists",
                    "link",
                    "image",
                    "charmap",
                    "preview",
                    "anchor",
                    "searchreplace",
                    "visualblocks",
                    "code",
                    "fullscreen",
                    "insertdatetime",
                    "media",
                    "table",
                    "code",
                    "help",
                    "wordcount",
                  ],
                  toolbar:
                    "undo redo | blocks | " +
                    "bold italic forecolor | alignleft aligncenter " +
                    "alignright alignjustify | bullist numlist outdent indent | " +
                    "removeformat | help",
                  content_style:
                    "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                }}
              />

              {/* CARD QUẢN LÝ BIẾN THỂ TRỰC TIẾP KHI Ở CHẾ ĐỘ SỬA SẢN PHẨM */}
              {id && (
                <Card
                  title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text strong>Danh sách biến thể phân loại (SKU & Tồn kho)</Text>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => {
                          setSelectedSubProduct(undefined);
                          setCloneVariant(undefined);
                          setIsVisibleAddSubProduct(true);
                        }}
                      >
                        Thêm biến thể mới
                      </Button>
                    </div>
                  }
                  style={{ marginTop: 20 }}
                >
                  <Table
                    bordered
                    columns={subProductColumns}
                    dataSource={subProducts}
                    rowKey="id"
                    loading={loadingSubProducts}
                    pagination={false}
                    size="small"
                    locale={{
                      emptyText: (
                        <Empty
                          description="Sản phẩm này chưa có biến thể phân loại nào"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setSelectedSubProduct(undefined);
                              setCloneVariant(undefined);
                              setIsVisibleAddSubProduct(true);
                            }}
                          >
                            Tạo biến thể đầu tiên
                          </Button>
                        </Empty>
                      ),
                    }}
                  />
                </Card>
              )}
            </div>

            <div className="col-4">
              <Card size="small" title="Danh mục ngành hàng">
                <Form.Item name={"categories"} initialValue={[]}>
                  <TreeSelect
                    treeData={categories}
                    multiple
                    placeholder="Chọn danh mục"
                    popupRender={(menu) => (
                      <>
                        {menu}
                        <Divider className="m-0" />
                        <Button
                          htmlType="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsVisibleAddCategory(true);
                          }}
                          type="link"
                          icon={<Add size={20} />}
                          style={{ padding: "0 16px" }}
                        >
                          Thêm danh mục mới
                        </Button>
                      </>
                    )}
                  />
                </Form.Item>
              </Card>

              <Card size="small" className="mt-3" title="Nhà cung cấp">
                <Form.Item
                  name={"supplier"}
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn nhà cung cấp",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder="Chọn nhà cung cấp"
                    popupRender={(menu) => (
                      <>
                        {menu}
                        <Divider className="m-0" />
                        <Button
                          htmlType="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsVisibleAddSupplier(true);
                          }}
                          type="link"
                          icon={<Add size={20} />}
                          style={{ padding: "0 16px" }}
                        >
                          Thêm nhà cung cấp mới
                        </Button>
                      </>
                    )}
                    filterOption={(input, option) =>
                      replaceName(option?.label ? String(option.label) : "").includes(
                        replaceName(input)
                      )
                    }
                    options={supplierOptions}
                  />
                </Form.Item>
              </Card>

              <Card
                size="small"
                className="mt-3"
                title="Hình ảnh đại diện sản phẩm"
                extra={
                  <Button
                    type="link"
                    icon={<PictureOutlined />}
                    onClick={() => setMediaPickerOpen(true)}
                    style={{ padding: 0 }}
                  >
                    Thư viện ảnh
                  </Button>
                }
              >
                <Upload
                  multiple
                  fileList={fileList}
                  accept="image/*"
                  listType="picture-card"
                  onChange={handleChange}
                  onRemove={(file) => {
                    setFileList((prev) =>
                      (prev || []).filter((item) => item.uid !== file.uid)
                    );
                  }}
                >
                  <div>
                    <div style={{ fontSize: 20, lineHeight: 1 }}>+</div>
                    <div style={{ marginTop: 4, fontSize: 13 }}>Chọn ảnh</div>
                  </div>
                </Upload>
                <div className="mt-3">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Hoặc dán trực tiếp đường link ảnh (URL):
                  </Text>
                  <Space.Compact style={{ width: "100%", marginTop: 6 }}>
                    <Input
                      placeholder="https://example.com/image.png"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      onPressEnter={(e) => {
                        e.preventDefault();
                        handleAddImageUrlToProduct();
                      }}
                      allowClear
                    />
                    <Button type="primary" onClick={handleAddImageUrlToProduct}>
                      Dán link
                    </Button>
                  </Space.Compact>
                </div>
              </Card>
            </div>
          </div>
        </Form>
      </div>

      <ModalCategory
        visible={isVisibleAddCategory}
        onClose={() => setIsVisibleAddCategory(false)}
        onAddNew={async (val) => {
          await getCategories();
          if (val && val.id) {
            form.setFieldsValue({
              categories: [...(form.getFieldValue("categories") || []), val.id],
            });
          }
        }}
        values={categories}
      />

      <ToogleSupplier
        visible={isVisibleAddSupplier}
        onClose={() => setIsVisibleAddSupplier(false)}
        onAddNew={async (val?: any) => {
          await getSuppliers();
          if (val && val.id) {
            form.setFieldsValue({
              supplier: val.id,
            });
          }
          setIsVisibleAddSupplier(false);
        }}
      />

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(media) => {
          const newItem = {
            uid: `media-${media.id || Date.now()}`,
            name: media.fileName || `image-${(fileList || []).length + 1}.png`,
            status: "done",
            url: media.url,
          };
          setFileList((prev) => [...(prev || []), newItem]);
          message.success("Đã thêm ảnh từ thư viện");
        }}
      />

      {/* Modal thêm/sửa biến thể trực tiếp */}
      {id && (
        <AddSubProductModal
          visible={isVisibleAddSubProduct}
          onClose={() => {
            setSelectedSubProduct(undefined);
            setCloneVariant(undefined);
            setIsVisibleAddSubProduct(false);
          }}
          product={currentProduct || ({ id, title: form.getFieldValue("title") } as any)}
          subProduct={selectedSubProduct}
          initialValues={cloneVariant}
          onAddNew={async () => {
            if (id) {
              await fetchSubProducts(id);
            }
          }}
        />
      )}
    </div>
  );
};

export default AddProduct;
