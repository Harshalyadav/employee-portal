"use client";
import { useRouter } from "next/navigation";
import PageHeader from "../sections/PageHeader";
import ModelTable from "@/components/datatable/model/ModelTable";
import { Button } from "../ui/button";

const ModelPage = () => {
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title="Models"
        options={
          <Button onClick={() => router.push("/models/new")}>
            Create Model
          </Button>
        }
      />
      <ModelTable />
    </div>
  );
};

export default ModelPage;
