const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const imageStorageConfig = {
	provider: 'cloudinary',
	cloudName,
	uploadPreset,
	folder: import.meta.env.VITE_CLOUDINARY_FOLDER || 'kanban',
};

export const getImageUploadEndpoint = () => {
	if (!imageStorageConfig.cloudName || !imageStorageConfig.uploadPreset) {
		throw new Error(
			'Thiếu cấu hình Cloudinary. Hãy thêm VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET vào file .env'
		);
	}

	return `https://api.cloudinary.com/v1_1/${imageStorageConfig.cloudName}/image/upload`;
};