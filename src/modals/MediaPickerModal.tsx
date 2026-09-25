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
  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundColor: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1677ff",
            }}
          >
            <PictureOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
              Thư viện tài nguyên Media
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Chọn hình ảnh từ thư viện lưu trữ tập trung
            </Text>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1040}
      style={{ top: 20 }}
      destroyOnClose
    >
      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 4, marginTop: 12 }}>
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

