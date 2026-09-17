/** @format */

import {
  Button,
  Card,
  Empty,
  Form,
  InputNumber,
  Select,
  Spin,
} from "antd";
import { useEffect, useState } from "react";
import { SelectModel } from "../models/SelectModel";
import { useCategories } from "../hooks/useCategories";

export interface FilterProductValue {
  catIds?: string[];
  price?: number[];
  minPrice?: number;
  maxPrice?: number;
}

interface Props {
  values: FilterProductValue;
  onFilter: (vals: FilterProductValue) => void;
  onClose?: () => void;
}

const FilterProduct = (props: Props) => {
  const { values, onFilter } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [selectDatas, setSelectDatas] = useState<{
    catIds: SelectModel[];
  }>();
  const [form] = Form.useForm();

  const { getAllCategories } = useCategories();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const catIds = await getCategories();
        setSelectDatas({ catIds });
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
      form.setFieldsValue({
        catIds: values.catIds,
        minPrice:
          values.minPrice !== undefined
            ? values.minPrice
            : values.price
            ? values.price[0]
            : undefined,
        maxPrice:
          values.maxPrice !== undefined
            ? values.maxPrice
            : values.price
            ? values.price[1]
            : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [values, form]);

  const getCategories = async (): Promise<SelectModel[]> => {
    const res = await getAllCategories();
    return res && res.length > 0
      ? res.map((item: any) => ({
          label: item.title,
          value: item.id,
        }))
      : [];
  };

  const handleFilter = (formValues: any) => {
    const { catIds, minPrice, maxPrice } = formValues;
    let price: number[] | undefined = undefined;

    const hasMin = minPrice !== undefined && minPrice !== null && minPrice !== "";
    const hasMax = maxPrice !== undefined && maxPrice !== null && maxPrice !== "";

    if (hasMin && hasMax) {
      price = [Number(minPrice), Number(maxPrice)];
    } else if (hasMin) {
      price = [Number(minPrice), 99999999];
    } else if (hasMax) {
      price = [0, Number(maxPrice)];
    }

    onFilter({
      catIds,
      price,
      minPrice: hasMin ? Number(minPrice) : undefined,
      maxPrice: hasMax ? Number(maxPrice) : undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    onFilter({});
  };

  return (
    <Card
      size="small"
      title="Filter values"
      className="filter-card shadow-sm"
      style={{ width: 320 }}
    >
      {isLoading ? (
        <div className="text-center py-4">
          <Spin />
        </div>
      ) : selectDatas ? (
        <>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilter}
            initialValues={{
              catIds: values.catIds,
              minPrice:
                values.minPrice !== undefined
                  ? values.minPrice
                  : values.price
                  ? values.price[0]
                  : undefined,
              maxPrice:
                values.maxPrice !== undefined
                  ? values.maxPrice
                  : values.price
                  ? values.price[1]
                  : undefined,
            }}
          >
            <Form.Item name="catIds" label="Categories">
              <Select
                placeholder="Select categories"
                allowClear
                mode="multiple"
                options={selectDatas.catIds}
                maxTagCount="responsive"
              />
            </Form.Item>

            <Form.Item label="Price (VND)">
              <div className="d-flex align-items-center" style={{ gap: 8 }}>
                <Form.Item name="minPrice" noStyle>
                  <InputNumber
                    placeholder="Min"
                    min={0}
                    max={99999999}
                    formatter={(value) =>
                      value !== undefined && value !== null
                        ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                        : ""
                    }
                    parser={(value) =>
                      value
                        ? (value.replace(/\./g, "").replace(/,/g, "") as any)
                        : ""
                    }
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <span className="text-muted fw-bold">-</span>
                <Form.Item name="maxPrice" noStyle>
                  <InputNumber
                    placeholder="Max"
                    min={0}
                    max={99999999}
                    formatter={(value) =>
                      value !== undefined && value !== null
                        ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                        : ""
                    }
                    parser={(value) =>
                      value
                        ? (value.replace(/\./g, "").replace(/,/g, "") as any)
                        : ""
                    }
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </div>
            </Form.Item>
          </Form>

          <div className="mt-3 d-flex justify-content-between">
            <Button size="middle" onClick={handleReset}>
              Reset
            </Button>
            <Button type="primary" size="middle" onClick={() => form.submit()}>
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
