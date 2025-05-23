/** @format */

export const getTreeValues = (data: any[], isSelect?: boolean) => {
	const values: any = [];
	const items = data.filter((element) => !element.parentId);
	console.log("items", items);
	const newItems = items.map((item) =>
		isSelect
			? {
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
			children,
		});
	});

	return values;
};

const changeMenu = (data: any[], id: string, isSelect: boolean) => {
	const items: any = [];
	const datas = data.filter((element) => element.parentId === id);

	datas.forEach((val) =>
		items.push(
			isSelect
				? {
						label: val.title,
						value: val.id,
						children: changeMenu(data, val.id, isSelect),
				  }
				: {
						...val,
						key: val.id,
						children: changeMenu(data, val.id, isSelect),
				  }
		)
	);
	return items;
};