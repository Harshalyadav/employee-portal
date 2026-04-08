"use client";
import { useRouter } from "next/navigation";
import PageHeader from "../sections/PageHeader";
import PermissionTable from "@/components/datatable/permission/PermissionTable";
import { Button } from "../ui/button";

const PermissionPage = () => {
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title="Permissions"
        options={
          <Button onClick={() => router.push("/permission/new")}>
            Create Permission
          </Button>
        }
      />
      <PermissionTable />
    </div>
  );
};

export default PermissionPage;
