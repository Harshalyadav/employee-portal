"use client";
import { useRouter } from "next/navigation";
import PageHeader from "../sections/PageHeader";
import StockTable from "@/components/datatable/stock/StockTable";
import { Button } from "../ui/button";

const StockPage = () => {
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title="Stock Management"
        options={
          <Button onClick={() => router.push("/stocks/new")}>Add Stock</Button>
        }
      />
      <StockTable />
    </div>
  );
};

export default StockPage;
