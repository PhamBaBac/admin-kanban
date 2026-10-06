/** @format */

import React from "react";
import { Form, Input, Button, Typography } from "antd";
import { Editor } from "@tinymce/tinymce-react";
import { BsStars } from "react-icons/bs";

const { Text } = Typography;

interface ProductGeneralInfoSectionProps {
  isCreating: boolean;
  content: string;
  editorRef: React.MutableRefObject<any>;
  isGeneratingDesc: boolean;
  isGeneratingContent: boolean;
  onAiGenerateDescription: () => void;
  onAiGenerateContent: () => void;
}

export const ProductGeneralInfoSection: React.FC<ProductGeneralInfoSectionProps> = ({
  isCreating,
  content,
  editorRef,
  isGeneratingDesc,
  isGeneratingContent,
  onAiGenerateDescription,
  onAiGenerateContent,
}) => {
  return (
    <div className="col-12 col-lg-8">
      <Form.Item
        name="title"
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
        name="description"
        label={
          <div className="d-flex align-items-center" style={{ gap: 8 }}>
            <Text strong>Mô tả ngắn</Text>
            <Button
              type="link"
              size="small"
              icon={<BsStars size={16} />}
              loading={isGeneratingDesc}
              onClick={onAiGenerateDescription}
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
          onClick={onAiGenerateContent}
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
        onInit={(_evt, editor) => (editorRef.current = editor)}
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
    </div>
  );
};
