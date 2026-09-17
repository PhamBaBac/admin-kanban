/** @format */

import { Editor } from "@tinymce/tinymce-react";
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  message,
  Select,
  Space,
  Spin,
  TreeSelect,
  Typography,
  Image,
  Upload,
  UploadProps,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { SelectModel, TreeModel } from "../../models/FormModel";
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import { useSuppliers } from "../../hooks/useSuppliers";
import { replaceName } from "../../utils/replaceName";
import { Add } from "iconsax-react";
import { ModalCategory, ToogleSupplier } from "../../modals";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { getTreeValues } from "../../utils/getTreeValues";
import { mapCategoriesToCategoyModels } from "../../utils/categoryMapper";
import { uploadFile } from "../../utils/uploadFile";
import { BsStars } from "react-icons/bs";
import { aiService } from "../../services";

const { Text, Title, Paragraph } = Typography;

const AddProduct = () => {
  const navigate = useNavigate();
  const {
    getProductById,
    createProduct,
    updateProduct,
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
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

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
      // Sử dụng data từ state thay vì gọi API
      setProductDetailFromState(productFromState);
    } else if (id && slug) {
      getProductDetail(id);
    } else if (!id) {
      form.resetFields();
    }
  }, [id, slug, productFromState]);

  const setProductDetailFromState = (product: any) => {
    form.setFieldsValue({
      title: product.title || "",
      description: product.description || "",
      categories: product.categories?.map((category: any) => category.id) || [],
      supplier: product.supplierId || null, // Sử dụng supplierId thay vì supplier
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
    if (!slug) {
      return;
    }

    try {
      const response = await getProductById(slug, id);

      if (response && response.product) {
        const item = response.product;
        form.setFieldsValue({
          title: item.title || "",
          description: item.description || "",
          categories:
            item.categories?.map((category: any) => category.id) || [],
          supplier: item.supplier || null,
        });
        setcontent("");
        setFileList([]);
      } else {
        console.log("Response format is not as expected:", response);
      }
    } catch (error) {
      console.log("Error fetching product detail:", error);
      // Thử fallback API nếu cần
    }
  };
  const handleAddNewProduct = async (values: any) => {
    const content = editorRef.current?.getContent() || "";
    const data: any = {};
    setIsCreating(true);

    // Xử lý dữ liệu cơ bản
    data.title = values.title || "";
    data.description = values.description || "";
    data.content = content;
    data.slug = replaceName(values.title);
    data.images = [];

    // Xử lý supplierId - chỉ gửi supplierId cho backend
    data.supplierId = values.supplier || null;

    // Xử lý categories - đảm bảo là array và đúng format
    if (
      values.categories &&
      Array.isArray(values.categories) &&
      values.categories.length > 0
    ) {
      // TreeSelect có thể trả về array của objects hoặc strings
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
        .filter(Boolean); // Lọc bỏ giá trị null/undefined
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
        data.images = urls.filter((url) => url); // Lọc bỏ giá trị null/undefined
      } catch (error) {
        console.error("Error uploading files:", error);
        setIsCreating(false);
        return;
      }
    }

    try {
      if (id) {
        await updateProduct({ ...data, id }, slug);
        message.success("Product updated successfully!");
      } else {
        await createProduct(data);
        message.success("Product created successfully!");
      }

      // Refresh data khi quay lại Inventories
      navigate("/inventory", { state: { refresh: true } });
    } catch (error) {
      console.log("Error creating/updating product:", error);
      message.error("Failed to save product");
    } finally {
      setIsCreating(false);
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
    setFileUrl("");
    message.success("Đã nạp ảnh từ đường link thành công!");
  };

  // Add this handler function near other handlers
  const handleAddNewSupplier = async (val: any) => {
    await getSuppliers(); // Refresh the supplier list
    setIsVisibleAddSupplier(false);
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
              {id ? "Update Product" : "Add new Product"}
            </Title>
            <Space>
              <Button
                loading={isCreating}
                size="middle"
                onClick={() => navigate("/inventory")}
              >
                Cancel
              </Button>
              <Button
                loading={isCreating}
                type="primary"
                size="middle"
                onClick={() => form.submit()}
              >
                {id ? "Update" : "Submit"}
              </Button>
            </Space>
          </div>

          <div className="row">
            <div className="col-8">
              <Form.Item
                name={"title"}
                label={<Text strong>Title</Text>}
                rules={[
                  {
                    required: true,
                    message: "Please enter product title",
                  },
                ]}
              >
                <Input allowClear maxLength={150} showCount />
              </Form.Item>
              <Form.Item
                name={"description"}
                label={
                  <div className="d-flex align-items-center" style={{ gap: 8 }}>
                    <Text strong>Description</Text>
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
                />
              </Form.Item>
              <div className="d-flex align-items-center mb-2" style={{ gap: 8 }}>
                <Text strong>Content (Chi tiết sản phẩm)</Text>
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
                  height: 500,
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
            </div>
            <div className="col-4">
              <Card size="small" title="Categories">
                <Form.Item name={"categories"} initialValue={[]}>
                  <TreeSelect
                    treeData={categories}
                    multiple
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
                          style={{
                            padding: "0 16px",
                          }}
                        >
                          Add new
                        </Button>
                      </>
                    )}
                  />
                </Form.Item>
              </Card>
              <Card size="small" className="mt-3" title="Suppliers">
                <Form.Item
                  name={"supplier"}
                  rules={[
                    {
                      required: true,
                      message: "Please select a supplier",
                    },
                  ]}
                >
                  <Select
                    showSearch
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
                          style={{
                            padding: "0 16px",
                          }}
                        >
                          Add new
                        </Button>
                      </>
                    )}
                    filterOption={(input, option) =>
                      replaceName(option?.label ? option.label : "").includes(
                        replaceName(input)
                      )
                    }
                    options={supplierOptions}
                  />
                </Form.Item>
              </Card>
              <Card size="small" className="mt-3" title="Images (Hình ảnh sản phẩm)">
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
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Hoặc dán trực tiếp đường link (URL) của ảnh:
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
          // Nếu val là category vừa thêm và có id, tự động chọn luôn
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
          // Nếu val là supplier vừa thêm và có id, tự động chọn luôn
          if (val && val.id) {
            form.setFieldsValue({
              supplier: val.id,
            });
          }
          setIsVisibleAddSupplier(false);
        }}
      />
    </div>
  );
};

export default AddProduct;
