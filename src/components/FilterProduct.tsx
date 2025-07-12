/** @format */

import {
  Button,
  Card,
  Empty,
  Form,
  Select,
  Slider,
  Space,
  Spin,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import handleAPI from "../apis/handleAPI";
import { SelectModel } from "../models/SelectModel";

export interface FilterProductValue {
  colors?: string[];
  catIds?: string[];
  size?: string;
  price?: number[];
}

interface Props {
  values: FilterProductValue;
  onFilter: (vals: FilterProductValue) => void;
}

const FilterProduct = (props: Props) => {
  const { values, onFilter } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [selectDatas, setSelectDatas] = useState<{
    catIds: SelectModel[];
    colors: string[];
    prices: number[];
    sizes: SelectModel[];
  }>();
  const [colorSelected, setColorSelected] = useState<string[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [catIds, filterValues] = await Promise.all([
          getCategories(),
          getFilterValues(),
        ]);

        const { colors, sizes, prices } = filterValues;

        setSelectDatas({
          catIds: catIds,
          colors,
          sizes,
          prices,
        });
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (values) {
      form.setFieldsValue(values);
      if (values.colors) {
        setColorSelected(
          Array.isArray(values.colors) ? values.colors : [values.colors]
        );
      }
    }
  }, [values, form]);

  const getCategories = async (): Promise<SelectModel[]> => {
    const res: any = await handleAPI(`/public/categories/all`);
    return res.result && res.result.length > 0
      ? res.result.map((item: any) => ({
          label: item.title,
          value: item.id,
        }))
      : [];
  };

  const getFilterValues = async (): Promise<{
    colors: string[];
    sizes: SelectModel[];
    prices: number[];
  }> => {
    const res: any = await handleAPI("/subProducts/get-filter-values");

    const raw = res.result;

    return {
      colors: raw.colors || [],
      prices: raw.prices || [],
      sizes: (raw.sizes || []).map((size: string) => ({
        label: size,
        value: size,
      })),
    };
  };

  const handleFilter = (formValues: any) => {
    const result: FilterProductValue = {
      ...formValues,
      colors: colorSelected.length > 0 ? colorSelected : undefined,
    };
    onFilter(result);
  };

  return (
    <Card
      size="small"
      title="Filter values"
      className="filter-card"
      style={{ width: 320 }}
    >
      {isLoading ? (
        <Spin />
      ) : selectDatas ? (
        <>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilter}
            initialValues={values}
          >
            <Form.Item name="catIds" label="Categories">
              <Select
                placeholder="Categories"
                allowClear
                mode="multiple"
                options={selectDatas.catIds}
              />
            </Form.Item>

            {selectDatas.colors && selectDatas.colors.length > 0 && (
              <Space wrap className="mb-3">
                {selectDatas.colors.map((color) => (
                  <Button
                    onClick={() => {
                      const items = [...colorSelected];
                      const index = items.findIndex((el) => el === color);
                      if (index !== -1) {
                        items.splice(index, 1);
                      } else {
                        items.push(color);
                      }
                      setColorSelected(items);
                    }}
                    key={color}
                    style={{
                      borderColor: colorSelected.includes(color)
                        ? color
                        : undefined,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 2,
                        backgroundColor: color,
                        marginRight: 6,
                      }}
                    />
                    {/* <Typography.Text style={{ color }}>{color}</Typography.Text> */}
                  </Button>
                ))}
              </Space>
            )}

            <Form.Item name="size" label="Sizes">
              <Select
                options={selectDatas.sizes}
                allowClear
                placeholder="Size"
              />
            </Form.Item>

            {selectDatas.prices && selectDatas.prices.length > 0 && (
              <Form.Item name={"price"} label="Price">
                <Slider
                  range
                  min={Math.min(...selectDatas.prices)}
                  max={Math.max(...selectDatas.prices)}
                />
              </Form.Item>
            )}
          </Form>

          <div className="mt-4 text-right">
            <Button type="primary" onClick={() => form.submit()}>
              Filter
            </Button>
          </div>
        </>
      ) : (
        <Empty />
      )}
    </Card>
  );
};

export default FilterProduct;
