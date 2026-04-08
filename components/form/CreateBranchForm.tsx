"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateBranch } from "@/hooks/query/useBranch";
import { Button } from "@/components/ui/button";
import {
  createBranchSchema,
  CreateBranchSchema,
  BranchStatusEnum,
} from "@/types/branch.type";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { SingleFileUpload } from "@/components/upload/SingleFileUpload";
import { useAppStore } from "@/stores";
import { APP_ROUTE } from "@/routes";
import { fetchCityFromPincode } from "@/lib/pincode-utils";

interface CreateBranchFormProps {
  onSuccess?: () => void;
}

export function CreateBranchForm({ onSuccess }: CreateBranchFormProps) {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const createBranchMutation = useCreateBranch();
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateBranchSchema>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      companyId: (user?.company?.id as string) || "",
      branchName: "",
      branchAddress: {
        addressLine: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      },
      addressProof: "",
      status: BranchStatusEnum.ACTIVE,
    },
  });

  const addressProof = watch("addressProof");

  const handlePincodeChange = async (pincode: string) => {
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      setIsPincodeLoading(true);
      const result = await fetchCityFromPincode(pincode);

      if (result) {
        setValue("branchAddress.city", result.city, { shouldValidate: true });
        setValue("branchAddress.state", result.state, { shouldValidate: true });
        setValue("branchAddress.country", result.country, {
          shouldValidate: true,
        });
      }

      setIsPincodeLoading(false);
    }
  };

  const onSubmit = async (data: CreateBranchSchema) => {
    try {
      const submissionData: any = { ...data };

      if (
        !submissionData.addressProof ||
        submissionData.addressProof.trim() === ""
      ) {
        delete submissionData.addressProof;
      }

      if (submissionData.branchAddress) {
        // The backend expects branchAddress as a nested object, so the form only submits it when
        // at least one address field is populated by manual entry or the pincode lookup helper.
        const { addressLine, city, state, country, pincode } =
          submissionData.branchAddress;
        const isEmptyAddress =
          !addressLine?.trim() &&
          !city?.trim() &&
          !state?.trim() &&
          !country?.trim() &&
          !pincode?.trim();

        if (isEmptyAddress) {
          delete submissionData.branchAddress;
        }
      }

      await createBranchMutation.mutateAsync(submissionData);
      onSuccess?.();
      router.push(APP_ROUTE.BRANCH.ALL.PATH);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (
      e.key === "Enter" &&
      ["INPUT", "SELECT"].includes((e.target as HTMLElement).tagName)
    ) {
      e.preventDefault();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={handleKeyDown}
      className="space-y-6"
    >
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input type="hidden" {...register("companyId")} />

          <div>
            <label className="block text-sm font-medium mb-2">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("branchName")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter branch name"
            />
            {errors.branchName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.branchName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Branch Address
            </label>
            {/* Address captures the operational branch location. Pincode can prefill city/state/
                country, while address line remains the manually maintained source of detail. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pincode
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...register("branchAddress.pincode", {
                      onChange: (event) => {
                        const value = event.target.value;
                        setValue("branchAddress.pincode", value, {
                          shouldValidate: true,
                        });
                        handlePincodeChange(value);
                      },
                    })}
                    disabled={isSubmitting || isPincodeLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter pincode"
                    maxLength={6}
                  />
                  {isPincodeLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  {...register("branchAddress.city")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <input
                  type="text"
                  {...register("branchAddress.state")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Country
                </label>
                <input
                  type="text"
                  {...register("branchAddress.country")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter country"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Address Line
                </label>
                <input
                  type="text"
                  {...register("branchAddress.addressLine")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address line"
                />
              </div>
            </div>
          </div>

          {/* <div>
            <label className="block text-sm font-medium mb-2">Status</label>

            <select
              {...register("status")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={BranchStatusEnum.ACTIVE}>Active</option>
              <option value={BranchStatusEnum.CLOSED}>Closed</option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">
                {errors.status.message}
              </p>
            )}
          </div> */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address Proof Document (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload Address Proof
            </label>
            <SingleFileUpload
              folder="branch-documents"
              onUploadSuccess={(url) => setValue("addressProof", url)}
            />
            {addressProof && (
              <div className="mt-2">
                <p className="text-sm text-green-600">
                  ✓ Document uploaded successfully
                </p>
                <a
                  href={addressProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View document
                </a>
              </div>
            )}
            {errors.addressProof && (
              <p className="text-red-500 text-sm mt-1">
                {errors.addressProof.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardFooter className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Branch"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
