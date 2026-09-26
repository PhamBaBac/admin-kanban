/** @format */

export const getTreeValues = (data: any[], isSelect?: boolean) => {
	const values: any = [];
	const idSet = new Set(data.map((el) => String(el.id)));

	const items = data.filter((element) => {
		const pId = element.parentId ? String(element.parentId).trim() : "";
		return !pId || pId === "" || pId === String(element.id) || !idSet.has(pId);
	});

	const newItems = items.map((item) =>
		isSelect
			? {
					title: item.title,
					label: item.title,
					value: item.id,
			  }
			: { ...item, key: item.id }
	);

	newItems.forEach((item) => {
		const children = changeMenu(
			data,
			isSelect ? item.value : item.id,
			isSelect ?? false
		);
		values.push({
			...item,
			children: children.length > 0 ? children : undefined,
		});
	});

	return values;
};

const changeMenu = (data: any[], id: string, isSelect: boolean) => {
	const items: any = [];
	const datas = data.filter((element) => String(element.parentId) === String(id) && String(element.id) !== String(id));

	datas.forEach((val) => {
		const children = changeMenu(data, val.id, isSelect);
		items.push(
			isSelect
				? {
						title: val.title,
						label: val.title,
						value: val.id,
						children: children.length > 0 ? children : undefined,
				  }
				: {
						...val,
						key: val.id,
						children: children.length > 0 ? children : undefined,
				  }
		);
	});
	return items;
};