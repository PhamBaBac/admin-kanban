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

  // Upload file lên Cloudinary rồi lưu thông tin vào Backend
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

      // Lưu metadata vào DB thông qua backend API
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

  // Thêm ảnh trực tiếp từ đường link URL bên ngoài
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

  // Xóa ảnh
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

  // Copy link ảnh
  const handleCopy = (url: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(url);
    message.success("Đã sao chép đường dẫn ảnh");
  };

  // Format kích thước file
  const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div style={{ padding: isModal ? "0" : "16px" }}>
      {/* Header bar */}
      <Card
        bordered={false}
        className="app-card"
        style={{
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            {!isModal && (
              <Title level={4} style={{ margin: 0 }}>
                Thư viện hình ảnh
              </Title>
            )}
            <Text type="secondary">
              Tổng cộng {totalElements} tệp phương tiện
            </Text>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Input.Search
              placeholder="Tìm kiếm theo tên ảnh..."
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 260 }}
              prefix={<SearchOutlined />}
            />

            <Button
              icon={<LinkOutlined />}
              onClick={() => setUrlModalOpen(true)}
            >
              Thêm từ Link
            </Button>

            <Upload
              customRequest={handleCustomUpload}
              showUploadList={false}
              multiple
              accept="image/*"
            >
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={uploading}
              >
                Tải ảnh lên
              </Button>
            </Upload>
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
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 10 }}>
          <div>
            <Text strong>Đường dẫn hình ảnh (URL)*</Text>
            <Input
              placeholder="https://example.com/image.jpg"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{ marginTop: 6 }}
              allowClear
            />
          </div>
          <div>
            <Text strong>Tên gợi nhớ (không bắt buộc)</Text>
            <Input
              placeholder="Nhập tên ảnh..."
              value={inputFileName}
              onChange={(e) => setInputFileName(e.target.value)}
              style={{ marginTop: 6 }}
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
                  maxHeight: 160,
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
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {medias.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelect && onSelect(item)}
                style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: 8,
                  overflow: "hidden",
                  backgroundColor: "#fff",
                  cursor: onSelect ? "pointer" : "default",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
                    height: 140,
                    backgroundColor: "#f5f5f5",
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
                      top: 6,
                      right: 6,
                      display: "flex",
                      gap: 4,
                      background: "rgba(0,0,0,0.45)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="Xem trước">
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined style={{ color: "#fff" }} />}
                        onClick={() => setPreviewMedia(item)}
                      />
                    </Tooltip>
                    <Tooltip title="Sao chép link">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined style={{ color: "#fff" }} />}
                        onClick={(e) => handleCopy(item.url, e)}
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
                        icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                      />
                    </Popconfirm>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "8px 10px", flex: 1 }}>
                  <Text
                    ellipsis={{ tooltip: item.fileName }}
                    style={{
                      fontWeight: 500,
                      fontSize: 13,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {item.fileName || "Không có tên"}
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: "#8c8c8c",
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
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <Pagination
              current={page}
              pageSize={pageSize}
              total={totalElements}
              onChange={(p, s) => {
                setPage(p);
                setPageSize(s);
              }}
              showSizeChanger
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
        width={700}
        title={previewMedia?.fileName}
      >
        {previewMedia && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <img
              src={previewMedia.url}
              alt={previewMedia.fileName}
              style={{
                maxWidth: "100%",
                maxHeight: 500,
                objectFit: "contain",
                borderRadius: 6,
              }}
            />
            <div style={{ marginTop: 12, textAlign: "left" }}>
              <p>
                <strong>Đường dẫn:</strong>{" "}
                <a
                  href={previewMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {previewMedia.url}
                </a>
              </p>
              <p>
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
