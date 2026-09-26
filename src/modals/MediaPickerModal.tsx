import { useState, useEffect } from "react";
import { Modal, Typography } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import MediaScreen from "../pages/media/MediaScreen";
import { MediaModel } from "../models/MediaModel";

const { Title, Text } = Typography;

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaModel) => void;
}

const MediaPickerModal = ({
  open,
  onClose,
  onSelect,
}: MediaPickerModalProps) => {
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

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: isMobile ? 32 : 38,
              height: isMobile ? 32 : 38,
              borderRadius: 8,
              backgroundColor: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1677ff",
              flexShrink: 0,
            }}
          >
            <PictureOutlined style={{ fontSize: isMobile ? 18 : 20 }} />
          </div>
          <div>
            <Title
              level={5}
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: isMobile ? 15 : 16,
              }}
            >
              Thư viện tài nguyên Media
            </Title>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                display: isMobile ? "none" : "block",
              }}
            >
              Chọn hình ảnh từ thư viện lưu trữ tập trung
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? "100%" : 1040}
      style={{
        top: isMobile ? 10 : 20,
        maxWidth: isMobile ? "calc(100vw - 16px)" : 1040,
        margin: "0 auto",
      }}
      bodyStyle={{
        padding: isMobile ? "10px 8px" : "16px 24px",
      }}
      destroyOnClose
    >
      <div
        style={{
          maxHeight: isMobile ? "80vh" : "75vh",
          overflowY: "auto",
          paddingRight: 4,
          marginTop: isMobile ? 6 : 12,
        }}
      >
        <MediaScreen
          isModal={true}
          onSelect={(media) => {
            onSelect(media);
            onClose();
          }}
        />
      </div>
    </Modal>
  );
};

export default MediaPickerModal;

