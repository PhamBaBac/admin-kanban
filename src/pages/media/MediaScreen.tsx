import { useState, useEffect } from "react";
import {
  Card,
  Input,
  Button,
  Upload,
  Pagination,
  Spin,
  Empty,
  Modal,
  message,
  Typography,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  UploadOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { MediaModel } from "../../models/MediaModel";
import mediaAPI from "../../apis/mediaAPI";
import {
  getImageUploadEndpoint,
  imageStorageConfig,
} from "../../cloudinary/cloudinaryConfig";
import { replaceName } from "../../utils/replaceName";

const { Title, Text } = Typography;

interface MediaScreenProps {
  onSelect?: (media: MediaModel) => void;
  isModal?: boolean;
}

const MediaScreen = ({ onSelect, isModal = false }: MediaScreenProps) => {
  const [medias, setMedias] = useState<MediaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [totalElements, setTotalElements] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<MediaModel | null>(null);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [inputFileName, setInputFileName] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);

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

  const fetchMedias = async (currentPage = page, searchQuery = search) => {
    try {
      setLoading(true);
      const res = await mediaAPI.getAllMedias({
        page: currentPage,
        size: pageSize,
        search: searchQuery.trim() || undefined,
      });

      if (res) {
        setMedias(res.data || []);
        setTotalElements(res.totalElements || 0);
      }
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || "Không thể tải danh sách media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedias(page, search);
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchMedias(1, search);
  };

  const handleCustomUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      setUploading(true);

      const filename = replaceName(file.name);
      const uploadEndpoint = getImageUploadEndpoint();
      const formData = new FormData();

      formData.append("file", file, filename);
      formData.append("upload_preset", imageStorageConfig.uploadPreset);
      formData.append("folder", imageStorageConfig.folder);
      formData.append("public_id", `${Date.now()}-${filename}`);

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Tải ảnh lên Cloudinary thất bại");
      }

      const cloudData = await response.json();

      const savedMedia = await mediaAPI.saveMedia({
        url: cloudData.secure_url,
        publicId: cloudData.public_id,
        fileName: file.name,
        fileType: cloudData.format || file.type,
        fileSize: cloudData.bytes || file.size,
        width: cloudData.width,
        height: cloudData.height,
      });

      message.success("Tải ảnh lên thành công");
      onSuccess?.(savedMedia);
      fetchMedias(1, search);
    } catch (error: any) {
      console.error(error);
      message.error(error.message || "Upload thất bại");
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrlMedia = async () => {
    if (!inputUrl.trim()) {
      message.warning("Vui lòng nhập đường dẫn (URL) ảnh");
      return;
    }

    try {
      setAddingUrl(true);
      const urlTrimmed = inputUrl.trim();
      let defaultName = inputFileName.trim();
      if (!defaultName) {
        try {
          const parsed = new URL(urlTrimmed);
          const pathSegments = parsed.pathname.split("/").filter(Boolean);
          defaultName = pathSegments[pathSegments.length - 1] || "image_from_url";
        } catch {
          defaultName = "image_from_url";
        }
      }

      await mediaAPI.saveMedia({
        url: urlTrimmed,
        fileName: defaultName,
        fileType: "image/url",
      });

      message.success("Đã thêm ảnh vào thư viện");
      setInputUrl("");
      setInputFileName("");
      setUrlModalOpen(false);
      fetchMedias(1, search);
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || "Không thể lưu ảnh từ URL");
    } finally {
      setAddingUrl(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await mediaAPI.deleteMedia(id);
      message.success("Đã xóa ảnh");
      fetchMedias(page, search);
    } catch (err: any) {
      message.error(err?.message || "Xóa ảnh thất bại");
    }
  };

  const handleCopy = (url: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(url);
    message.success("Đã sao chép đường dẫn ảnh");
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div style={{ padding: isModal ? "0" : isMobile ? "8px 8px 24px" : "16px" }}>
      {/* Header bar */}
      <Card
        bordered={false}
        className="app-card"
        style={{
          marginBottom: 16,
          borderRadius: 12,
        }}
        bodyStyle={{
          padding: isMobile ? "12px 14px" : "20px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            flexDirection: isMobile ? "column" : "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            {!isModal && (
              <Title
                level={isMobile ? 5 : 4}
                style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}
              >
                Thư viện hình ảnh
              </Title>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tổng cộng {totalElements} tệp phương tiện
            </Text>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 10,
              alignItems: isMobile ? "stretch" : "center",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <Input.Search
              placeholder="Tìm kiếm theo tên ảnh..."
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={handleSearch}
              style={{ width: isMobile ? "100%" : 260 }}
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            />

            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                width: isMobile ? "100%" : "auto",
              }}
            >
              <Button
                icon={<LinkOutlined />}
                onClick={() => setUrlModalOpen(true)}
                style={{ flex: isMobile ? 1 : "initial", borderRadius: 8 }}
              >
                Thêm từ Link
              </Button>

              <Upload
                customRequest={handleCustomUpload}
                showUploadList={false}
                multiple
                accept="image/*"
                style={{ flex: isMobile ? 1 : "initial" }}
              >
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  loading={uploading}
                  style={{
                    width: isMobile ? "100%" : "auto",
                    borderRadius: 8,
                    background: "#1677ff",
                    fontWeight: 500,
                  }}
                >
                  Tải ảnh lên
                </Button>
              </Upload>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal Thêm ảnh bằng URL */}
      <Modal
        title="Thêm ảnh từ đường dẫn (URL)"
        open={urlModalOpen}
        onCancel={() => {
          setUrlModalOpen(false);
          setInputUrl("");
          setInputFileName("");
        }}
        onOk={handleAddUrlMedia}
        confirmLoading={addingUrl}
        okText="Lưu vào Thư viện"
        cancelText="Hủy"
        width={isMobile ? "100%" : 520}
        style={{
          top: isMobile ? 16 : 40,
          maxWidth: isMobile ? "calc(100vw - 16px)" : 520,
          margin: "0 auto",
        }}
        bodyStyle={{
          padding: isMobile ? "12px 14px" : "20px 24px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 10 }}>
          <div>
            <Text strong>Đường dẫn hình ảnh (URL)*</Text>
            <Input
              placeholder="https://example.com/image.jpg"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{ marginTop: 6, borderRadius: 8 }}
              allowClear
            />
          </div>
          <div>
            <Text strong>Tên gợi nhớ (không bắt buộc)</Text>
            <Input
              placeholder="Nhập tên ảnh..."
              value={inputFileName}
              onChange={(e) => setInputFileName(e.target.value)}
              style={{ marginTop: 6, borderRadius: 8 }}
              allowClear
            />
          </div>
          {inputUrl.trim() && (
            <div style={{ marginTop: 6, textAlign: "center" }}>
              <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
                Xem trước:
              </Text>
              <img
                src={inputUrl}
                alt="Preview"
                style={{
                  maxHeight: isMobile ? 130 : 160,
                  maxWidth: "100%",
                  objectFit: "contain",
                  borderRadius: 6,
                  border: "1px solid #f0f0f0",
                }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Grid list ảnh */}
      <Spin spinning={loading}>
        {medias.length === 0 ? (
          <Empty
            description="Không có hình ảnh nào"
            style={{ padding: "40px 0" }}
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2, 1fr)"
                : "repeat(auto-fill, minmax(180px, 1fr))",
              gap: isMobile ? 10 : 16,
              marginBottom: 20,
            }}
          >
            {medias.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelect && onSelect(item)}
                style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: 10,
                  overflow: "hidden",
                  backgroundColor: "#fff",
                  cursor: onSelect ? "pointer" : "default",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#1677ff";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e8e8e8";
                  e.currentTarget.style.transform = "none";
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    height: isMobile ? 115 : 140,
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.fileName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    loading="lazy"
                  />
                  {/* Overlay buttons */}
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      display: "flex",
                      gap: 2,
                      background: "rgba(0,0,0,0.55)",
                      padding: "2px 4px",
                      borderRadius: 6,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="Xem trước">
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined style={{ color: "#fff", fontSize: 13 }} />}
                        onClick={() => setPreviewMedia(item)}
                        style={{ padding: "0 4px", height: 24, minWidth: 24 }}
                      />
                    </Tooltip>
                    <Tooltip title="Sao chép link">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined style={{ color: "#fff", fontSize: 13 }} />}
                        onClick={(e) => handleCopy(item.url, e)}
                        style={{ padding: "0 4px", height: 24, minWidth: 24 }}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Xóa ảnh này?"
                      description="Bạn có chắc muốn xóa ảnh này khỏi hệ thống?"
                      onConfirm={(e) => handleDelete(item.id, e)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined style={{ color: "#ff4d4f", fontSize: 13 }} />}
                        style={{ padding: "0 4px", height: 24, minWidth: 24 }}
                      />
                    </Popconfirm>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: isMobile ? "6px 8px" : "8px 10px", flex: 1 }}>
                  <Text
                    ellipsis={{ tooltip: item.fileName }}
                    style={{
                      fontWeight: 600,
                      fontSize: isMobile ? 12 : 13,
                      display: "block",
                      marginBottom: 2,
                      color: "#1e293b",
                    }}
                  >
                    {item.fileName || "Không có tên"}
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: isMobile ? 10 : 11,
                      color: "#94a3b8",
                    }}
                  >
                    <span>{formatBytes(item.fileSize)}</span>
                    {item.width && item.height && (
                      <span>
                        {item.width}x{item.height}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Phân trang */}
        {totalElements > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: isMobile ? "center" : "space-between",
              alignItems: "center",
              gap: 10,
              marginTop: 16,
              background: isMobile ? "#fff" : "transparent",
              padding: isMobile ? "12px 14px" : "0",
              borderRadius: isMobile ? 10 : 0,
              border: isMobile ? "1px solid #e2e8f0" : "none",
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Hiển thị{" "}
              <strong style={{ color: "#0f172a" }}>
                {(page - 1) * pageSize + 1} -{" "}
                {Math.min(page * pageSize, totalElements)}
              </strong>{" "}
              trong tổng số{" "}
              <strong style={{ color: "#1677ff" }}>{totalElements}</strong> tệp
            </div>

            <Pagination
              size={isMobile ? "small" : "default"}
              current={page}
              pageSize={pageSize}
              total={totalElements}
              onChange={(p, s) => {
                setPage(p);
                setPageSize(s);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              showSizeChanger={!isMobile}
              pageSizeOptions={["12", "18", "24", "48"]}
            />
          </div>
        )}
      </Spin>

      {/* Modal Preview */}
      <Modal
        open={Boolean(previewMedia)}
        footer={null}
        onCancel={() => setPreviewMedia(null)}
        width={isMobile ? "100%" : 700}
        style={{
          top: isMobile ? 12 : 40,
          maxWidth: isMobile ? "calc(100vw - 16px)" : 700,
          margin: "0 auto",
        }}
        bodyStyle={{
          maxHeight: isMobile ? "calc(100vh - 120px)" : "calc(100vh - 160px)",
          overflowY: "auto",
          padding: isMobile ? "12px 14px" : "20px 24px",
        }}
        title={previewMedia?.fileName}
      >
        {previewMedia && (
          <div style={{ textAlign: "center", padding: "6px 0" }}>
            <img
              src={previewMedia.url}
              alt={previewMedia.fileName}
              style={{
                maxWidth: "100%",
                maxHeight: isMobile ? 260 : 500,
                objectFit: "contain",
                borderRadius: 6,
                border: "1px solid #f0f0f0",
              }}
            />
            <div
              style={{
                marginTop: 12,
                textAlign: "left",
                backgroundColor: "#f8fafc",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                border: "1px solid #e2e8f0",
              }}
            >
              <p style={{ margin: "0 0 6px 0", wordBreak: "break-all" }}>
                <strong>Đường dẫn:</strong>{" "}
                <a
                  href={previewMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2563eb" }}
                >
                  {previewMedia.url}
                </a>
              </p>
              <p style={{ margin: 0, color: "#64748b" }}>
                <strong>Kích thước:</strong> {previewMedia.width} x{" "}
                {previewMedia.height} ({formatBytes(previewMedia.fileSize)})
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MediaScreen;
