import { Button, Empty, message, Modal, Space, Typography } from "antd";
import { Edit2, UserRemove } from "iconsax-react";
import { useEffect, useState } from "react";
import handleAPI from "../apis/handleAPI";
import TableComponet from "../components/TableComponent";
import { ToogleSupplier } from "../modals";
import { FormModel } from "../models/FormModel";
import { SupplierModel } from "../models/SupplierModel";

const { confirm } = Modal;

const Suppliers = () => {
  const [isVisibleModalAddNew, setIsVisibleModalAddNew] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supplierSelected, setSupplierSelected] = useState<SupplierModel>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState<number>(10);
  const [forms, setForms] = useState<FormModel>();

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    getSuppliers();
  }, [page, pageSize]);

  const getData = async () => {
    setIsLoading(true);
    try {
      await getFroms();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };


  const getFroms = async () => {
    const api = `/suppliers/get-form`;
    const res: any = await handleAPI(api);

    res && setForms(res);
  };

  const getSuppliers = async () => {
    const api = `/suppliers/page?page=${page}&pageSize=${pageSize}`;
    console
    setIsLoading(true);
    try {
      const res: any = await handleAPI(api);

      if (res.result) {
        const updatedSuppliers = res.result.data.map(
          (item: any, index: number) => ({
            index: (page - 1) * pageSize + (index + 1),
            ...item,
          })
        );
        setSuppliers(updatedSuppliers);
        setTotal(res.result.totalElements);
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  

  const removeSuppiler = async (id: string) => {
    try {
      await handleAPI(`/suppliers/remove?id=${id}`, undefined, "delete");
      await getSuppliers();
    } catch (error) {
      console.log(error);
    }
  };

  return forms ? (
    <div>
      <TableComponet
        api="supplier"
        onPageChange={(val: any) => {
          setPage(val.page);
          setPageSize(val.pageSize);
        }}
        onAddNew={() => {
          setIsVisibleModalAddNew(true);
        }}
        loading={isLoading}
        forms={forms}
        records={suppliers}
        total={total}
        extraColumn={(item: any) => (
          <Space>
            <Button
              type="text"
              onClick={() => {
                setSupplierSelected(item);
                setIsVisibleModalAddNew(true);
              }}
              icon={<Edit2 size={18} className="text-info" />}
            />
            <Button
              onClick={() =>
                confirm({
                  title: "Comfirm",
                  content: "Are you sure you want to remove this supplier?",
                  onOk: () => removeSuppiler(item.id),
                })
              }
              type="text"
              icon={<UserRemove size={18} className="text-danger" />}
            />
          </Space>
        )}
      />

      <ToogleSupplier
        visible={isVisibleModalAddNew}
        onClose={() => {
          supplierSelected && getSuppliers();
          setSupplierSelected(undefined);
          setIsVisibleModalAddNew(false);
        }}
        onAddNew={(val) => setSuppliers([...suppliers, val])}
        supplier={supplierSelected}
      />
    </div>
  ) : (
    <Empty />
  );
};

export default Suppliers;
