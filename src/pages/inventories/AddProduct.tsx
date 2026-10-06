/** @format */

import React from "react";
import { Form, Spin, message } from "antd";
import {
  ModalCategory,
  ToogleSupplier,
  MediaPickerModal,
  AddSubProductModal,
} from "../../modals";
import { useAddProductForm } from "./hooks/useAddProductForm";
import { ProductHeaderSection } from "./components/ProductHeaderSection";
import { ProductGeneralInfoSection } from "./components/ProductGeneralInfoSection";
import { ProductSidebarSection } from "./components/ProductSidebarSection";
import { ProductVariantsTableSection } from "./components/ProductVariantsTableSection";

const AddProduct: React.FC = () => {
  const {
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
  } = useAddProductForm();

  if (isInitialLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0" }}>
      <div className="container-fluid px-2 px-md-3">
        <Form
          disabled={isCreating}
          size="large"
          form={form}
          onFinish={handleAddNewProduct}
          layout="vertical"
        >
          {/* Header Bar */}
          <ProductHeaderSection
            isEditMode={Boolean(id)}
            isCreating={isCreating}
            onCancel={() => navigate("/inventory")}
            onSubmit={() => form.submit()}
          />

          <div className="row g-3">
            {/* Cột trái: Tên sản phẩm, mô tả ngắn, TinyMCE Editor */}
            <ProductGeneralInfoSection
              isCreating={isCreating}
              content={content}
              editorRef={editorRef}
              isGeneratingDesc={isGeneratingDesc}
              isGeneratingContent={isGeneratingContent}
              onAiGenerateDescription={handleAiGenerateDescription}
              onAiGenerateContent={handleAiGenerateContent}
            />

            {/* Cột phải: Danh mục, Nhà cung cấp, Ảnh */}
            <ProductSidebarSection
              categories={categories}
              supplierOptions={supplierOptions}
              fileList={fileList}
              fileUrl={fileUrl}
              onFileUrlChange={setFileUrl}
              onOpenAddCategory={() => setIsVisibleAddCategory(true)}
              onOpenAddSupplier={() => setIsVisibleAddSupplier(true)}
              onOpenMediaPicker={() => setMediaPickerOpen(true)}
              onUploadChange={handleUploadChange}
              onRemoveFile={handleRemoveFile}
              onAddImageUrl={handleAddImageUrlToProduct}
            />

            {/* Bảng biến thể (chỉ hiển thị khi đang sửa sản phẩm) */}
            {id && (
              <ProductVariantsTableSection
                subProducts={subProducts}
                loadingSubProducts={loadingSubProducts}
                onOpenCreateModal={() => {
                  setSelectedSubProduct(undefined);
                  setCloneVariant(undefined);
                  setIsVisibleAddSubProduct(true);
                }}
                onCloneVariant={(item) => {
                  const { id: _, ...rest } = item;
                  setCloneVariant({
                    ...rest,
                    images: item.images ? [...item.images] : [],
                    attributes: item.attributes
                      ? { ...item.attributes }
                      : undefined,
                  });
                  setSelectedSubProduct(undefined);
                  setIsVisibleAddSubProduct(true);
                }}
                onEditVariant={(item) => {
                  setCloneVariant(undefined);
                  setSelectedSubProduct(item);
                  setIsVisibleAddSubProduct(true);
                }}
                onDeleteVariant={handleRemoveSubProduct}
              />
            )}
          </div>
        </Form>
      </div>

      {/* Modal danh mục */}
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

      {/* Modal nhà cung cấp */}
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

      {/* Modal chọn ảnh từ thư viện */}
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
          product={
            currentProduct ||
            ({ id, title: form.getFieldValue("title") } as any)
          }
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
