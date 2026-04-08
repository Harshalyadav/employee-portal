"use client";
import { useRouter } from "next/navigation";
import PageHeader from "../sections/PageHeader";
import MenuTable from "@/components/datatable/menu/MenuTable";
import { Button } from "../ui/button";

const MenuPage = () => {
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title="Menus"
        options={
          <Button onClick={() => router.push("/menus/new")}>Create Menu</Button>
        }
      />
      <MenuTable />
    </div>
  );
};

export default MenuPage;
