import { Button, Empty, message, Modal, Space, Typography } from "antd";
import { Edit2, UserRemove } from "iconsax-react";
import { useEffect, useState } from "react";
import TableComponet from "../components/TableComponent";
import { ToogleSupplier } from "../modals";
import { FormModel } from "../models/FormModel";
import { SupplierModel } from "../models/SupplierModel";
import { useSuppliers } from "../hooks/useSuppliers";

const { confirm } = Modal;

const Suppliers = () => {
  const {
    getSuppliers: fetchSuppliers,
    deleteSupplier,
    loading,
    error,
    getSupplierForm,
  } = useSuppliers();
  const [isVisibleModalAddNew, setIsVisibleModalAddNew] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierModel[]>([]);
  const [supplierSelected, setSupplierSelected] = useState<SupplierModel>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState<number>(10);
  const [forms, setForms] = useState<FormModel>();

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    fetchSuppliersData();
  }, [page, pageSize]);

  const getData = async () => {
    try {
      await getFroms();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const getFroms = async () => {
    // Sử dụng hook để lấy form supplier
    const data = await getSupplierForm();
    data && setForms(data);
  };

  const fetchSuppliersData = async () => {
    try {
      const res = await fetchSuppliers({ page, pageSize });

      if (res.data) {
        const updatedSuppliers = res.data.map((item: any, index: number) => ({
          index: (page - 1) * pageSize + (index + 1),
          ...item,
        }));
        setSuppliers(updatedSuppliers);
        setTotal(res.totalElements);
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const removeSuppiler = async (id: string) => {
    try {
      await deleteSupplier(id);
      await fetchSuppliersData();
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
        loading={loading}
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
          setSupplierSelected(undefined);
          setIsVisibleModalAddNew(false);
        }}
        onAddNew={async () => {
          await fetchSuppliersData();
        }}
        supplier={supplierSelected}
      />
    </div>
  ) : (
    <Empty />
  );
};

export default Suppliers;
