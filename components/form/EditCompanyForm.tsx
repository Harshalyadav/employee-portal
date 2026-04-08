"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEditCompany } from "@/hooks/query/company.hook";
import {
  Company,
  CreateCompanyDto,
  createCompanySchema,
  DocumentTypeEnum,
  CompanyDocumentInputDto,
} from "@/types/company.type";
import { PdfUpload } from "@/components/upload/PdfUpload";
import { useState } from "react";
import { X, Plus } from "lucide-react";

interface EditCompanyFormProps {
  defaultValues: Company;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: CreateCompanyDto["status"][] = [
  "Active",
  "Suspended",
  "Expired",
];

const DOC_TYPE_OPTIONS = Object.values(DocumentTypeEnum);

export function EditCompanyForm({
  defaultValues,
  onSuccess,
}: EditCompanyFormProps) {
  const mutation = useEditCompany();
  const [documents, setDocuments] = useState<CompanyDocumentInputDto[]>([]);
  const [pendingDoc, setPendingDoc] = useState<
    Partial<CompanyDocumentInputDto> & { tempId?: string }
  >({
    documentType: DocumentTypeEnum.TRADING_LICENSE,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateCompanyDto>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      legalName: defaultValues.legalName,
      trn: defaultValues.trn,
      companyRegistrationNo: defaultValues.companyRegistrationNo,
      companyAddress: defaultValues.companyAddress,
      country: defaultValues.country,
      state: defaultValues.state,
      city: defaultValues.city,
      companyQuota: defaultValues.companyQuota,
      status: (defaultValues.status as any) ?? "Active",
    },
  });

  const handleDocumentUploadSuccess = (url: string, key: string) => {
    setPendingDoc((prev) => ({
      ...prev,
      documentUrl: url,
    }));
  };

  const addDocument = () => {
    if (
      !pendingDoc.documentType ||
      !pendingDoc.documentName ||
      !pendingDoc.documentUrl
    ) {
      alert("Please fill all required document fields");
      return;
    }

    const newDoc: CompanyDocumentInputDto = {
      documentType: pendingDoc.documentType,
      documentName: pendingDoc.documentName,
      documentUrl: pendingDoc.documentUrl,
      fileSize: pendingDoc.fileSize,
      mimeType: pendingDoc.mimeType,
      expiryDate: pendingDoc.expiryDate || undefined,
      notes: pendingDoc.notes || undefined,
    };

    setDocuments([...documents, newDoc]);
    setPendingDoc({
      documentType: DocumentTypeEnum.TRADING_LICENSE,
    });
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: CreateCompanyDto) => {
    await mutation.mutateAsync({
      id: defaultValues._id,
      payload: {
        ...values,
        documents: documents.length > 0 ? documents : undefined,
      },
    });
    onSuccess?.();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Edit Company</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="legalName">Legal Name *</Label>
            <Input
              id="legalName"
              placeholder="ACME LLC"
              {...register("legalName")}
            />
            {errors.legalName && (
              <p className="text-xs text-destructive">
                {errors.legalName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trn">TRN</Label>
            <Input id="trn" placeholder="123456789" {...register("trn")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyRegistrationNo">Registration No</Label>
            <Input
              id="companyRegistrationNo"
              placeholder="CR-2024-001"
              {...register("companyRegistrationNo")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyQuota">Company Quota</Label>
            <Input
              id="companyQuota"
              type="number"
              placeholder="50"
              {...register("companyQuota", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="United Arab Emirates"
              {...register("country")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" placeholder="Dubai" {...register("state")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Dubai" {...register("city")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              defaultValue={(defaultValues.status as any) ?? "Active"}
              onValueChange={(v) =>
                setValue("status", v as CreateCompanyDto["status"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status || ""}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="companyAddress">Company Address</Label>
            <Textarea
              id="companyAddress"
              placeholder="Street, City, Country"
              {...register("companyAddress")}
            />
          </div>

          {/* Document Upload Section */}
          <div className="space-y-4 md:col-span-2 border-t pt-4">
            <h3 className="text-lg font-semibold">Company Documents</h3>

            {/* Pending Document Form */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select
                    value={pendingDoc.documentType || ""}
                    onValueChange={(value) =>
                      setPendingDoc((prev) => ({
                        ...prev,
                        documentType: value as DocumentTypeEnum,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentName">Document Name *</Label>
                  <Input
                    id="documentName"
                    placeholder="e.g., Trading License 2024"
                    value={pendingDoc.documentName || ""}
                    onChange={(e) =>
                      setPendingDoc((prev) => ({
                        ...prev,
                        documentName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Upload File *</Label>
                  <PdfUpload
                    folder="company-documents"
                    label="Upload PDF Document"
                    onUploadSuccess={handleDocumentUploadSuccess}
                  />
                  {pendingDoc.documentUrl && (
                    <p className="text-xs text-green-600">
                      File uploaded: {pendingDoc.documentUrl}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={pendingDoc.expiryDate || ""}
                    onChange={(e) =>
                      setPendingDoc((prev) => ({
                        ...prev,
                        expiryDate: e.target.value || undefined,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Additional notes"
                    value={pendingDoc.notes || ""}
                    onChange={(e) =>
                      setPendingDoc((prev) => ({
                        ...prev,
                        notes: e.target.value || undefined,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addDocument}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Document
              </Button>
            </div>

            {/* Document List */}
            {documents.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">
                  Added Documents ({documents.length})
                </h4>
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {doc.documentName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {doc.documentType}
                        </p>
                        {doc.expiryDate && (
                          <p className="text-xs text-gray-500">
                            Expires: {doc.expiryDate}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Update Company"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
