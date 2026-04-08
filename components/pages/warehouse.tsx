"use client";
import { useRouter } from "next/navigation";
import WarehouseTable from "../datatable/warehouse/WarehouseTable";
import PageHeader from "../sections/PageHeader";
import { Button } from "../ui/button";

const WarehousePage = () => {
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title="Warehouse"
        options={
          <Button onClick={() => router.push("/warehouse/new")}>
            Create Warehouse
          </Button>
        }
      />
      <WarehouseTable />
    </div>
  );
};

export default WarehousePage;
