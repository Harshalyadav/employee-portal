"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PdfUpload } from "@/components/upload/PdfUpload";
import { APP_ROUTE } from "@/routes";
import {
  sponsorCompanySchema,
  SponsorCompanySchema,
  SponsorCompany,
} from "@/types/sponsor-company.type";
import { useCreateSponsorCompany, useUpdateSponsorCompany } from "@/hooks";
import { useDeleteSponsorCompany } from "@/hooks/query/sponsor-company.hook";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function CreateSponsorCompanyForm({
  sponsorCompany,
  embeddedInPageShell = false,
}: {
  sponsorCompany?: SponsorCompany;
  /** When true, hides top back + title row (page provides header like /advances/.../edit). */
  embeddedInPageShell?: boolean;
}) {
  const router = useRouter();
  const isEditMode = !!sponsorCompany;
  const { mutateAsync: deleteMutate, isPending: isDeleting } = useDeleteSponsorCompany();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { mutateAsync: createMutate, isPending: isCreating } = useCreateSponsorCompany();
  const { mutateAsync: updateMutate, isPending: isUpdating } = useUpdateSponsorCompany();
  const [tradeLicenseUrl, setTradeLicenseUrl] = useState<string | null>(
    sponsorCompany?.tradeLicenseUrl || null,
  );
  const [moaUrl, setMoaUrl] = useState<string | null>(sponsorCompany?.moaUrl || null);
  const [labourCardUrl, setLabourCardUrl] = useState<string | null>(
    sponsorCompany?.labourCardUrl || null,
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SponsorCompanySchema>({
    resolver: zodResolver(sponsorCompanySchema),
    defaultValues: {
      nameOfCompany: sponsorCompany?.nameOfCompany || "",
      nameOfOwner: sponsorCompany?.nameOfOwner || "",
      tradeLicenceNo: sponsorCompany?.tradeLicenceNo || "",
      expiryDate: sponsorCompany?.expiryDate
        ? new Date(sponsorCompany.expiryDate).toISOString().slice(0, 10)
        : "",
      tradeLicenseUrl: sponsorCompany?.tradeLicenseUrl || "",
      moaUrl: sponsorCompany?.moaUrl || "",
      labourCardUrl: sponsorCompany?.labourCardUrl || "",
    },
  });

  useEffect(() => {
    setValue("tradeLicenseUrl", tradeLicenseUrl || "");
  }, [setValue, tradeLicenseUrl]);

  useEffect(() => {
    setValue("moaUrl", moaUrl || "");
  }, [setValue, moaUrl]);

  useEffect(() => {
    setValue("labourCardUrl", labourCardUrl || "");
  }, [setValue, labourCardUrl]);

  const isSubmitting = isCreating || isUpdating;

  const onSubmit = async (values: SponsorCompanySchema) => {
    try {
      if (!tradeLicenseUrl) {
        toast.error("Trade license upload is required");
        return;
      }

      const payload = {
        nameOfCompany: values.nameOfCompany,
        nameOfOwner: values.nameOfOwner,
        tradeLicenceNo: values.tradeLicenceNo,
        expiryDate: values.expiryDate,
        tradeLicenseUrl,
        moaUrl: moaUrl || null,
        labourCardUrl: labourCardUrl || null,
      };

      if (isEditMode && sponsorCompany?._id) {
        await updateMutate({ id: sponsorCompany._id, data: payload });
        toast.success("Sponsor company updated successfully");
      } else {
        await createMutate(payload);
        toast.success("Sponsor company created successfully");
      }
      router.push(APP_ROUTE.SPONSOR_COMPANY.ALL.PATH);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save sponsor company");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {!embeddedInPageShell && (
          <div className="flex items-center gap-4 mb-6">
            <Button type="button" variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {isEditMode ? "Edit Sponsor Company" : "Create Sponsor Company"}
            </h1>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Sponsor Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ...existing code for form fields... */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Name of Company <span className="text-red-500">*</span>
              </label>
              <input
                {...register("nameOfCompany")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.nameOfCompany && (
                <p className="text-red-500 text-sm mt-1">{errors.nameOfCompany.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Name of Owner <span className="text-red-500">*</span>
              </label>
              <input
                {...register("nameOfOwner")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.nameOfOwner && (
                <p className="text-red-500 text-sm mt-1">{errors.nameOfOwner.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Trade Licence No. <span className="text-red-500">*</span>
              </label>
              <input
                {...register("tradeLicenceNo")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.tradeLicenceNo && (
                <p className="text-red-500 text-sm mt-1">{errors.tradeLicenceNo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("expiryDate")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.expiryDate && (
                <p className="text-red-500 text-sm mt-1">{errors.expiryDate.message}</p>
              )}
            </div>

            <PdfUpload
              folder="sponsor-company/trade-license"
              label="Trade License (Required)"
              defaultValue={sponsorCompany?.tradeLicenseUrl || undefined}
              setUploadedUrl={setTradeLicenseUrl}
            />

            <PdfUpload
              folder="sponsor-company/moa"
              label="Upload MOA (Optional)"
              defaultValue={sponsorCompany?.moaUrl || undefined}
              setUploadedUrl={setMoaUrl}
            />

            <PdfUpload
              folder="sponsor-company/labour-card"
              label="Upload Labour Card (Optional)"
              defaultValue={sponsorCompany?.labourCardUrl || undefined}
              setUploadedUrl={setLabourCardUrl}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          {isEditMode && (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete record</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this record? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
                    onClick={async (e) => {
                      e.preventDefault();
                      if (!sponsorCompany?._id) return;
                      try {
                        await deleteMutate(sponsorCompany._id);
                        toast.success("Sponsor company deleted successfully");
                        setDeleteDialogOpen(false);
                        router.push(APP_ROUTE.SPONSOR_COMPANY.ALL.PATH);
                      } catch (error: any) {
                        toast.error(error?.response?.data?.message || "Failed to delete sponsor company");
                      }
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </>
  );
}
