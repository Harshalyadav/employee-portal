"use client";
import { useRouter } from "next/navigation";
import PageHeader from "../sections/PageHeader";
import RawMaterialTable from "@/components/datatable/raw-material/RawMaterialTable";
import { Button } from "../ui/button";

const RawMaterialPage = () => {
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title="Raw Materials"
        options={
          <Button onClick={() => router.push("/raw-materials/new")}>
            Add Raw Material
          </Button>
        }
      />
      <RawMaterialTable />
    </div>
  );
};

export default RawMaterialPage;
