/** @format */

import { add0toNumber } from './add0toNumber';

export class DateTime {
	static CalendarDate = (val: any) => {
		const date = new Date(val);

		return `${date.getFullYear()}-${add0toNumber(
			date.getMonth() + 1
		)}-${add0toNumber(date.getDate())}`;
	};

	static getShortDate = (val: any) => {
		const date = new Date(val);
		return `${add0toNumber(date.getDate())}/${add0toNumber(
			date.getMonth() + 1
		)}`;
	};
}

/**
 * Chuyển đổi và format chuỗi thời gian an toàn, hỗ trợ cả định dạng "dd/MM/yyyy HH:mm:ss" của backend
 * và định dạng chuẩn ISO/Timestamp, tránh hoàn toàn lỗi "Invalid Date".
 */
export const formatDateTime = (val?: any): string => {
	if (!val) return "—";
	if (typeof val === "string") {
		const trimmed = val.trim();
		if (!trimmed) return "—";

		// Nếu backend đã format sẵn dạng dd/MM/yyyy HH:mm:ss hoặc dd/MM/yyyy
		if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
			return trimmed;
		}

		// Nếu là chuỗi ISO hoặc định dạng thông thường
		const date = new Date(trimmed);
		if (!isNaN(date.getTime())) {
			return date.toLocaleString("vi-VN");
		}
		return trimmed;
	}

	if (val instanceof Date) {
		return isNaN(val.getTime()) ? "—" : val.toLocaleString("vi-VN");
	}

	if (typeof val === "number") {
		const date = new Date(val);
		return isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
	}

	return "—";
};