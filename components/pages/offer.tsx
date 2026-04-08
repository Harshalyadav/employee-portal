"use client";

import { useRouter } from "next/navigation";
import PageHeader from "../sections/PageHeader";
import OfferTable from "@/components/datatable/offer/OfferTable";
import { Button } from "../ui/button";

const OfferPage = () => {
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title="Offers"
        options={
          <Button onClick={() => router.push("/offer/new")}>
            Add New Offer
          </Button>
        }
      />
      <OfferTable />
    </div>
  );
};

export default OfferPage;
