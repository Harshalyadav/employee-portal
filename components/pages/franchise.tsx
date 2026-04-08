"use client";
import { useRouter } from "next/navigation";
import PageHeader from "../sections/PageHeader";
import FranchiseTable from "@/components/datatable/franchise/FranchiseTable";
import { Button } from "../ui/button";

const FranchisePage = () => {
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title="Franchises"
        options={
          <Button onClick={() => router.push("/franchises/new")}>
            Create Franchise
          </Button>
        }
      />
      <FranchiseTable />
    </div>
  );
};

export default FranchisePage;
