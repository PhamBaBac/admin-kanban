/** @format */

import { Modal, Typography } from "antd";
import { FolderAddOutlined } from "@ant-design/icons";
import { AddCategory } from "../components";
import { TreeModel } from "../models/FormModel";

const { Title, Text } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddNew: (val: any) => void;
  values: TreeModel[];
}

const ModalCategory = (props: Props) => {
  const { visible, onClose, onAddNew, values } = props;

  const handleClose = () => {
    onClose();
  };

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
            <FolderAddOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
              Thêm danh mục sản phẩm mới
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tạo nhánh danh mục để phân loại và quản lý cây sản phẩm
            </Text>
          </div>
        </div>
      }
      open={visible}
      width={640}
      style={{ top: 30 }}
      destroyOnClose
      onCancel={handleClose}
      footer={null}
    >
      <div style={{ marginTop: 12 }}>
        <AddCategory
          values={values}
          onAddNew={(val) => {
            onAddNew(val);
            onClose();
          }}
        />
      </div>
    </Modal>
  );
};

export default ModalCategory;