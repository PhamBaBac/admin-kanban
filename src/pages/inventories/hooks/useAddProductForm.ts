/** @format */

import { useState, useEffect, useRef } from "react";
import { Form, message, Modal } from "antd";
import type { UploadProps } from "antd";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useProducts } from "../../../hooks/useProducts";
import { useCategories } from "../../../hooks/useCategories";
import { useSuppliers } from "../../../hooks/useSuppliers";
import { ProductModel, SubProductModel } from "../../../models/Products";
import { SelectModel, TreeModel } from "../../../models/FormModel";
import { replaceName } from "../../../utils/replaceName";
import { uploadFile } from "../../../utils/uploadFile";
import { mediaAPI } from "../../../apis/mediaAPI";
import { aiService } from "../../../services";
import { mapCategoriesToCategoyModels } from "../../../utils/categoryMapper";
import { getTreeValues } from "../../../utils/getTreeValues";

export const useAddProductForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const id = searchParams.get("id");
  const slug = location.state?.slug;
  const productFromState = location.state?.product;

  const {
    getProductById,
    createProduct,
    updateProduct,
    getSubProducts,
    deleteSubProduct,
  } = useProducts();
  const { getAllCategories: fetchCategories } = useCategories();
  const { getSuppliers: fetchSuppliers } = useSuppliers();

  const editorRef = useRef<any>(null);
  const [form] = Form.useForm();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [content, setContent] = useState("");

  const [supplierOptions, setSupplierOptions] = useState<SelectModel[]>([]);
  const [categories, setCategories] = useState<TreeModel[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [fileUrl, setFileUrl] = useState("");

  // Modals state
  const [isVisibleAddCategory, setIsVisibleAddCategory] = useState(false);
  const [isVisibleAddSupplier, setIsVisibleAddSupplier] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // AI loading state
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // SubProducts (variants)
  const [subProducts, setSubProducts] = useState<SubProductModel[]>([]);
  const [loadingSubProducts, setLoadingSubProducts] = useState(false);
  const [isVisibleAddSubProduct, setIsVisibleAddSubProduct] = useState(false);
  const [selectedSubProduct, setSelectedSubProduct] = useState<
    SubProductModel | undefined
  >();
  const [cloneVariant, setCloneVariant] = useState<
    Partial<SubProductModel> | undefined
  >();
  const [currentProduct, setCurrentProduct] = useState<
    ProductModel | undefined
  >();

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
      categories:
        product.categories?.map((category: any) =>
          typeof category === "object" ? category?.id : category
        ) || [],
      supplier:
        product.supplierId ||
        ((product as any)?.supplier?.id ?? (product as any)?.supplier) ||
        null,
    });
    setContent(product.content || "");
    if (editorRef.current) {
      try {
        editorRef.current.setContent(product.content || "");
      } catch {}
    }
    setFileList(
      product.images?.map((image: any, index: number) => ({
        url: typeof image === "string" ? image : image?.url || "",
        uid: index,
        status: "done",
      })) || []
    );
  };

  const getProductDetail = async (productId: string) => {
    try {
      const response = await getProductById(slug || "product", productId);

      if (response && response.product) {
        const item = response.product;
        setCurrentProduct(item);
        form.setFieldsValue({
          title: item.title || "",
          description: item.description || "",
          categories:
            item.categories?.map((category: any) =>
              typeof category === "object" ? category?.id : category
            ) || [],
          supplier:
            item.supplierId ||
            ((item as any)?.supplier?.id ?? (item as any)?.supplier) ||
            null,
        });
        setContent(item.content || "");
        if (editorRef.current) {
          try {
            editorRef.current.setContent(item.content || "");
          } catch {}
        }
        if (item.images && item.images.length > 0) {
          setFileList(
            item.images.map((image: any, index: number) => ({
              url: typeof image === "string" ? image : image?.url || "",
              uid: index,
              status: "done",
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

  useEffect(() => {
    getData();
  }, []);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (id && productFromState) {
      setProductDetailFromState(productFromState);
      setCurrentProduct(productFromState);
      fetchSubProducts(id);
    } else if (id) {
      getProductDetail(id);
      fetchSubProducts(id);
    } else if (!id) {
      if (!isFirstRender.current) {
        form.resetFields();
      }
      setSubProducts([]);
      setCurrentProduct(undefined);
    }
    isFirstRender.current = false;
  }, [id, slug, productFromState]);

  const handleUploadChange: UploadProps["onChange"] = ({
    fileList: newFileList,
  }) => {
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

  const handleRemoveFile = (file: any) => {
    setFileList((prev) => (prev || []).filter((item) => item.uid !== file.uid));
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
        setContent(res);
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

  return {
    id,
    navigate,
    form,
    editorRef,
    isInitialLoading,
    isCreating,
    content,
    categories,
    supplierOptions,
    fileList,
    fileUrl,
    setFileList,
    setFileUrl,
    isVisibleAddCategory,
    setIsVisibleAddCategory,
    isVisibleAddSupplier,
    setIsVisibleAddSupplier,
    mediaPickerOpen,
    setMediaPickerOpen,
    isGeneratingDesc,
    isGeneratingContent,
    subProducts,
    loadingSubProducts,
    isVisibleAddSubProduct,
    setIsVisibleAddSubProduct,
    selectedSubProduct,
    setSelectedSubProduct,
    cloneVariant,
    setCloneVariant,
    currentProduct,
    getCategories,
    getSuppliers,
    fetchSubProducts,
    handleUploadChange,
    handleRemoveFile,
    handleAddImageUrlToProduct,
    handleAiGenerateDescription,
    handleAiGenerateContent,
    handleAddNewProduct,
    handleRemoveSubProduct,
  };
};
