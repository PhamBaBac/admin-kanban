import { Modal } from "antd";
import MediaScreen from "../pages/media/MediaScreen";
import { MediaModel } from "../models/MediaModel";

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
      title="Thư viện hình ảnh"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
      destroyOnClose
    >
      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 4 }}>
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
