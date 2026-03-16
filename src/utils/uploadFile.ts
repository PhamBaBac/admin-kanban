/** @format */

import { UploadProps } from "antd";
import {
  getImageUploadEndpoint,
  imageStorageConfig,
} from "../cloudinary/cloudinaryConfig";
import { replaceName } from "./replaceName";
import Resizer from "react-image-file-resizer";

const MAX_FILE_SIZE_MB = 15;

export const uploadFile = async (file: any) => {
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    throw new Error(
      `Ảnh quá lớn (${fileSizeMB.toFixed(1)} MB). Vui lòng chọn ảnh dưới ${MAX_FILE_SIZE_MB} MB.`
    );
  }

  const newFile: any = await handleResize(file);
  const filename = replaceName(newFile.name);
  const uploadEndpoint = getImageUploadEndpoint();
  const formData = new FormData();

  formData.append("file", newFile, filename);
  formData.append("upload_preset", imageStorageConfig.uploadPreset);
  formData.append("folder", imageStorageConfig.folder);
  formData.append("public_id", `${Date.now()}-${filename}`);

  const response = await fetch(uploadEndpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Upload image thất bại");
  }

  const data = await response.json();

  if (data.secure_url) {
    return data.secure_url as string;
  }

  throw new Error("Không lấy được URL ảnh sau khi upload");
};

export const handleResize = (file: any) =>
  new Promise((resolve, reject) => {
    try {
      Resizer.imageFileResizer(
        file,
        800,
        600,
        "JPEG",
        75,
        0,
        (newfile) => {
          if (newfile) {
            resolve(newfile);
          } else {
            reject(new Error("Resize ảnh thất bại"));
          }
        },
        "file"
      );
    } catch (err) {
      reject(err);
    }
  });

export const handleChangeFile: UploadProps["onChange"] = ({
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

  return items;
};
