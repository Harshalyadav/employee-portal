"use client";

import { Combobox } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PdfUpload } from "@/components/upload/PdfUpload";
import { ReviewSubmitCard } from "@/components/cards/form/ReviewFormCard";
import { useCreateModel } from "@/hooks/query/model.hook";
import { useInfiniteRoles } from "@/hooks/query/role.hook";
import { useAppStore } from "@/stores/main.store";
import {
  saveCreateModelForm,
  clearCreateModelForm,
} from "@/stores/actions/modelForm.action";
import {
  CreateModelDto,
  createModelSchema,
  stepFields,
  type CreateModelSchema,
} from "@/types/model.type";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  CheckCircle2,
  FileText,
  Info,
  Plus,
  Users,
  X,
  Trash2,
  Edit2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

interface CreateModelFormProps {
  onSuccess?: () => void;
}

export function CreateModelForm({ onSuccess }: CreateModelFormProps) {
  const DEFAULT_EQUIPMENT = ["Blender", "Refrigerator", "POS System"];
  const DEFAULT_LICENSES = ["FSSAI", "GST", "Trade License"];

  const router = useRouter();
  const createModelMutation = useCreateModel();
  const isLoading = createModelMutation.isPending;

  // Zustand global state
  const createFormGlobal = useAppStore((s) => s.create ?? {});

  const [equipmentProvided, setEquipmentProvided] = useState<string[]>(
    createFormGlobal.equipmentProvided ?? DEFAULT_EQUIPMENT
  );
  const [newEquipment, setNewEquipment] = useState("");
  const [licensesRequired, setLicensesRequired] = useState<string[]>(
    createFormGlobal.licensesRequired ?? DEFAULT_LICENSES
  );
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>(
    createFormGlobal.licensesRequired ?? []
  );
  const [newLicense, setNewLicense] = useState("");

  // Legal Docs state
  const [legalDocs, setLegalDocs] = useState<any[]>(
    createFormGlobal.legalDocs ?? []
  );
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState({
    name: "",
    description: "",
    fileUrl: "",
    version: "",
    validityYears: "",
    mandatory: true,
  });
  const [docSelectedFile, setDocSelectedFile] = useState<File | null>(null);
  const [docUploadedUrl, setDocUploadedUrl] = useState<string | null>(null);
  const [showDocForm, setShowDocForm] = useState(false);
  const [isChangingDoc, setIsChangingDoc] = useState(true);

  // Multi-step state
  const steps = ["basic", "infra", "ops", "legal", "review"];
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0); // Track the furthest step reached

  // Show JSON state for review step
  const [showJson, setShowJson] = useState(false);

  // StepCard configuration (labels, descriptions, icons)
  const stepCardSteps = [
    {
      label: "Basic Information",
      description: "Model overview & status",
      icon: <Info className="w-5 h-5" />,
    },
    {
      label: "Infrastructure",
      description: "Space, equipment & setup",
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      label: "Operations",
      description: "Staffing & daily operations",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Legal & Policies",
      description: "Agreements, licenses & documents",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: "Review & Submit",
      description: "Verify details before publishing",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    trigger,
    getValues,
  } = useForm<CreateModelSchema>({
    resolver: zodResolver(createModelSchema),
    mode: "onBlur",
    shouldUnregister: false,
    defaultValues: {
      name: createFormGlobal.name ?? "",
      tagline: createFormGlobal.tagline ?? "",
      description: createFormGlobal.description ?? "",
      status: createFormGlobal.status ?? "active",
      minimumArea: createFormGlobal.minimumArea ?? 0,
      seatingCapacity: createFormGlobal.seatingCapacity ?? 0,
      frontage: createFormGlobal.frontage ?? 0,
      interiorTheme: createFormGlobal.interiorTheme ?? "",
      equipmentProvided:
        createFormGlobal.equipmentProvided ?? DEFAULT_EQUIPMENT,
      staffRequired: createFormGlobal.staffRequired ?? 0,
      roleIds: createFormGlobal.roleIds ?? [],
      setupDurationDays: createFormGlobal.setupDurationDays ?? 0,
      operatingHours: createFormGlobal.operatingHours ?? "",
      trainingProvided: createFormGlobal.trainingProvided ?? true,
      agreementValidityYears: createFormGlobal.agreementValidityYears ?? 0,
      renewalPolicy: createFormGlobal.renewalPolicy ?? "",
      exitPolicy: createFormGlobal.exitPolicy ?? "",
      licensesRequired: createFormGlobal.licensesRequired ?? DEFAULT_LICENSES,
      legalDocs: createFormGlobal.legalDocs ?? [],
    },
  });

  // Restore form state from store on mount
  useEffect(() => {
    if (Object.keys(createFormGlobal).length > 0) {
      reset({ ...createFormGlobal });
      setEquipmentProvided(
        createFormGlobal.equipmentProvided ?? DEFAULT_EQUIPMENT
      );
      setLicensesRequired(
        createFormGlobal.licensesRequired ?? DEFAULT_LICENSES
      );
      setSelectedLicenses(createFormGlobal.licensesRequired ?? []);
      setLegalDocs(createFormGlobal.legalDocs ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save form state to store on every change
  useEffect(() => {
    saveCreateModelForm({
      ...getValues(),
      equipmentProvided,
      licensesRequired: selectedLicenses,
      legalDocs,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentProvided, selectedLicenses, legalDocs]);

  useEffect(() => {
    const subscription = watch((values) => {
      saveCreateModelForm({
        ...values,
        equipmentProvided,
        licensesRequired: selectedLicenses,
        legalDocs,
      });
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, equipmentProvided, selectedLicenses, legalDocs]);

  // Sync selectedLicenses to form field for validation
  useEffect(() => {
    setValue("licensesRequired", selectedLicenses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLicenses]);

  // Sync legalDocs to form field for validation
  useEffect(() => {
    setValue("legalDocs", legalDocs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legalDocs]);

  // Clear store on unmount
  useEffect(() => {
    return () => clearCreateModelForm();
  }, []);

  const onSubmit = async (data: CreateModelSchema) => {
    const { name, status, roleIds, licensesRequired, ...restData } = data;

    const payload: CreateModelDto = {
      name,
      status: (status as "active" | "inactive") || "active",
      legalDocs: legalDocs,
      licensesRequired: selectedLicenses,
      trainingProvided: data.trainingProvided ?? true,
      roleIds: roleIds || [],
      equipmentProvided: equipmentProvided || DEFAULT_EQUIPMENT,
      ...restData,
    };
    createModelMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        clearCreateModelForm();
        setLegalDocs([]);
        onSuccess?.();
      },
    });
  };

  const onSaveDraft = () => {
    console.log("Saving as draft...");
  };

  const addEquipment = () => {
    if (newEquipment.trim()) {
      setEquipmentProvided((prev) => [...prev, newEquipment.trim()]);
      setNewEquipment("");
    }
  };

  const removeEquipment = (item: string) => {
    setEquipmentProvided((prev) => prev.filter((eq) => eq !== item));
  };

  const addLicense = () => {
    if (newLicense.trim()) {
      setLicensesRequired((prev) => [...prev, newLicense.trim()]);
      setNewLicense("");
    }
  };

  const toggleLicense = (license: string) => {
    setSelectedLicenses((prev) =>
      prev.includes(license)
        ? prev.filter((l) => l !== license)
        : [...prev, license]
    );
  };

  const addOrUpdateLegalDoc = () => {
    if (!docForm.name.trim() || !docForm.fileUrl.trim()) {
      alert("Document name and file URL are required");
      return;
    }

    if (editingDocId) {
      // Update existing doc
      setLegalDocs((prev) =>
        prev.map((doc) =>
          doc.id === editingDocId
            ? {
                ...doc,
                name: docForm.name,
                description: docForm.description,
                fileUrl: docForm.fileUrl,
                version: docForm.version,
                validityYears: docForm.validityYears
                  ? parseInt(docForm.validityYears)
                  : undefined,
                mandatory: docForm.mandatory,
              }
            : doc
        )
      );
      setEditingDocId(null);
    } else {
      // Add new doc
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: docForm.name,
        description: docForm.description || undefined,
        fileUrl: docForm.fileUrl,
        version: docForm.version || undefined,
        validityYears: docForm.validityYears
          ? parseInt(docForm.validityYears)
          : undefined,
        mandatory: docForm.mandatory,
      };
      setLegalDocs((prev) => [...prev, newDoc]);
    }
    resetDocForm();
    setDocSelectedFile(null);
    setDocUploadedUrl(null);
    setShowDocForm(false);
  };

  const removeLegalDoc = (id: string) => {
    setLegalDocs((prev) => prev.filter((doc) => doc.id !== id));
  };

  const editLegalDoc = (doc: any) => {
    setEditingDocId(doc.id);
    setDocForm({
      name: doc.name,
      description: doc.description || "",
      fileUrl: doc.fileUrl,
      version: doc.version || "",
      validityYears: doc.validityYears ? doc.validityYears.toString() : "",
      mandatory: doc.mandatory !== false,
    });
    setIsChangingDoc(false);
    setShowDocForm(true);
  };

  const resetDocForm = () => {
    setDocForm({
      name: "",
      description: "",
      fileUrl: "",
      version: "",
      validityYears: "",
      mandatory: true,
    });
    setEditingDocId(null);
    setDocSelectedFile(null);
    setDocUploadedUrl(null);
    setShowDocForm(false);
    setIsChangingDoc(false);
  };

  const error = createModelMutation.isError
    ? createModelMutation.error?.message
    : null;

  // Load roles for combobox
  const { data: rolesPages } = useInfiniteRoles({ limit: 50 });
  const roleItems = useMemo(() => {
    const pages = rolesPages?.pages || [];
    const roles = pages.flatMap((p: any) => p.items || []);
    return roles.map((r: any) => ({
      value: r.id,
      label: r.name,
    }));
  }, [rolesPages]);

  // Step content rendering
  const renderStep = () => {
    switch (steps[step]) {
      case "basic":
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                1. Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ...existing basic info fields... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Model Name *</Label>
                  <Input
                    id="modelName"
                    type="text"
                    placeholder="e.g., Chaos, Cafe, Signature, Express"
                    disabled={isLoading}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    type="text"
                    placeholder="e.g., Compact. Fast. Profitable."
                    disabled={isLoading}
                    {...register("tagline")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Enter model description..."
                  disabled={isLoading}
                  {...register("description")}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-24"
                />
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="active"
                      {...register("status")}
                      disabled={isLoading}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="inactive"
                      {...register("status")}
                      disabled={isLoading}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Inactive</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case "infra":
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                2. Infrastructure & Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ...existing infra fields... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="minimumArea">Minimum Area (sq.ft) *</Label>
                  <Input
                    id="minimumArea"
                    type="number"
                    placeholder="Enter minimum area"
                    disabled={isLoading}
                    {...register("minimumArea", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seatingCapacity">Seating Capacity</Label>
                  <Input
                    id="seatingCapacity"
                    type="number"
                    placeholder="Enter seating capacity"
                    disabled={isLoading}
                    {...register("seatingCapacity", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frontage">Frontage (ft)</Label>
                  <Input
                    id="frontage"
                    type="number"
                    placeholder="Enter frontage"
                    disabled={isLoading}
                    {...register("frontage", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interiorTheme">Interior Theme</Label>
                  <Input
                    id="interiorTheme"
                    type="text"
                    placeholder="e.g., Modern, Rustic, Industrial"
                    disabled={isLoading}
                    {...register("interiorTheme")}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Equipment Provided</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {equipmentProvided.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 border rounded-md bg-muted/50"
                    >
                      <span className="text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeEquipment(item)}
                        disabled={isLoading}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add new equipment..."
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    disabled={isLoading}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addEquipment())
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEquipment}
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case "ops":
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                3. Operations & Staffing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ...existing ops fields... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="staffRequired">Staff Required</Label>
                  <Input
                    id="staffRequired"
                    type="number"
                    placeholder="Enter number of staff"
                    disabled={isLoading}
                    {...register("staffRequired", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleIds">Roles -Not </Label>
                  <Combobox
                    items={roleItems}
                    value={(watch("roleIds") as string[]) || []}
                    onChange={(v) =>
                      setValue("roleIds", Array.isArray(v) ? v : v ? [v] : [])
                    }
                    placeholder="Add Roles"
                    disabled={isLoading}
                    multiple
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setupDuration">Setup Duration (days)</Label>
                  <Input
                    id="setupDuration"
                    type="number"
                    placeholder="Enter setup duration"
                    disabled={isLoading}
                    {...register("setupDurationDays", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operatingHours">Operating Hours</Label>
                  <Input
                    id="operatingHours"
                    type="text"
                    placeholder="10:00 AM – 11:00 PM"
                    disabled={isLoading}
                    {...register("operatingHours")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Training Provided</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="training"
                      value="yes"
                      disabled={isLoading}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="training"
                      value="no"
                      disabled={isLoading}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">No</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case "legal":
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                4. Legal & Policy Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ...existing legal fields... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="agreementValidity">
                    Agreement Validity (Years)
                  </Label>
                  <Input
                    id="agreementValidity"
                    type="number"
                    placeholder="Enter validity period"
                    disabled={isLoading}
                    {...register("agreementValidityYears", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renewalPolicy">Renewal Policy</Label>
                  <Input
                    id="renewalPolicy"
                    type="text"
                    placeholder="e.g., Renewable after 5 years"
                    disabled={isLoading}
                    {...register("renewalPolicy")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exitPolicy">Exit Policy</Label>
                <textarea
                  id="exitPolicy"
                  placeholder="Describe exit policy terms..."
                  disabled={isLoading}
                  {...register("exitPolicy")}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-20"
                />
              </div>
              <div className="space-y-3">
                <Label>Licenses Required</Label>
                <div className="space-y-2">
                  {licensesRequired.map((license) => (
                    <label
                      key={license}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLicenses.includes(license)}
                        onChange={() => toggleLicense(license)}
                        disabled={isLoading}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{license}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add new license..."
                    value={newLicense}
                    onChange={(e) => setNewLicense(e.target.value)}
                    disabled={isLoading}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addLicense())
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLicense}
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add More
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Legal Documents</Label>
                  {!showDocForm && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowDocForm(true)}
                      disabled={isLoading}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Document
                    </Button>
                  )}
                </div>

                {/* Add/Edit Legal Doc Form */}
                {showDocForm && (
                  <Card className="bg-muted/30 p-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs" htmlFor="docName">
                            Document Name *
                          </Label>
                          <Input
                            id="docName"
                            type="text"
                            placeholder="e.g., Franchise Agreement, NDA"
                            disabled={isLoading}
                            value={docForm.name}
                            onChange={(e) =>
                              setDocForm({ ...docForm, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs" htmlFor="docVersion">
                            Version
                          </Label>
                          <Input
                            id="docVersion"
                            type="text"
                            placeholder="e.g., v1.0, v2.1"
                            disabled={isLoading}
                            value={docForm.version}
                            onChange={(e) =>
                              setDocForm({
                                ...docForm,
                                version: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs" htmlFor="docDescription">
                          Description
                        </Label>
                        <Input
                          id="docDescription"
                          type="text"
                          placeholder="Brief description of the document"
                          disabled={isLoading}
                          value={docForm.description}
                          onChange={(e) =>
                            setDocForm({
                              ...docForm,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      {/* Show upload for new documents when not selected OR when changing */}
                      {!editingDocId &&
                      !docForm.fileUrl &&
                      !docSelectedFile &&
                      !docUploadedUrl ? (
                        <div className="space-y-1">
                          <Label className="text-xs">Upload Document *</Label>
                          <PdfUpload
                            defaultValue=""
                            folder="models/legal-docs"
                            label="Document File"
                            onUploadSuccess={(url) => {
                              setDocForm({ ...docForm, fileUrl: url });
                              setIsChangingDoc(false);
                            }}
                            selectedFile={docSelectedFile}
                            uploadedUrl={docUploadedUrl}
                            setSelectedFile={setDocSelectedFile}
                            setUploadedUrl={setDocUploadedUrl}
                          />
                          {docForm.fileUrl && (
                            <p className="text-xs text-muted-foreground mt-1">
                              File uploaded: {docForm.fileUrl.split("/").pop()}
                            </p>
                          )}
                        </div>
                      ) : isChangingDoc ? (
                        <div className="space-y-1">
                          <Label className="text-xs">Upload Document *</Label>
                          <PdfUpload
                            defaultValue=""
                            folder="models/legal-docs"
                            label="Document File"
                            onUploadSuccess={(url) => {
                              setDocForm({ ...docForm, fileUrl: url });
                              setIsChangingDoc(false);
                            }}
                            selectedFile={docSelectedFile}
                            uploadedUrl={docUploadedUrl}
                            setSelectedFile={setDocSelectedFile}
                            setUploadedUrl={setDocUploadedUrl}
                          />
                          {docForm.fileUrl && (
                            <p className="text-xs text-muted-foreground mt-1">
                              File uploaded: {docForm.fileUrl.split("/").pop()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setIsChangingDoc(true)}
                          disabled={isLoading}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Change Document
                        </Button>
                      )}
                      {/* Document Preview */}
                      {(docSelectedFile ||
                        docUploadedUrl ||
                        docForm.fileUrl) && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Preview</Label>
                          <div className="border rounded-md p-3 bg-white max-h-96 overflow-auto">
                            <iframe
                              src={
                                docSelectedFile
                                  ? URL.createObjectURL(docSelectedFile)
                                  : docForm.fileUrl.startsWith("http")
                                  ? docForm.fileUrl
                                  : `${process.env.NEXT_PUBLIC_API_BASE_URL}${docForm.fileUrl}`
                              }
                              className="w-full h-72 rounded border"
                              title="Document Preview"
                            />
                          </div>
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label className="text-xs" htmlFor="docValidity">
                          Validity (Years)
                        </Label>
                        <Input
                          id="docValidity"
                          type="number"
                          placeholder="e.g., 5"
                          disabled={isLoading}
                          value={docForm.validityYears}
                          onChange={(e) =>
                            setDocForm({
                              ...docForm,
                              validityYears: e.target.value,
                            })
                          }
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={docForm.mandatory}
                          onChange={(e) =>
                            setDocForm({
                              ...docForm,
                              mandatory: e.target.checked,
                            })
                          }
                          disabled={isLoading}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Mandatory Document</span>
                      </label>
                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={addOrUpdateLegalDoc}
                          disabled={isLoading}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {editingDocId ? "Update" : "Add"} Document
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={resetDocForm}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Legal Docs List */}
                {legalDocs.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Added Documents ({legalDocs.length})
                    </Label>
                    <div className="grid gap-2">
                      {legalDocs.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between p-3 border rounded-md bg-muted/30"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{doc.name}</p>
                              {doc.mandatory && (
                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                  Mandatory
                                </span>
                              )}
                              {doc.version && (
                                <span className="text-xs text-muted-foreground">
                                  v{doc.version}
                                </span>
                              )}
                            </div>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground">
                                {doc.description}
                              </p>
                            )}
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {doc.validityYears && (
                                <span>Validity: {doc.validityYears} years</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => editLegalDoc(doc)}
                              disabled={isLoading}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLegalDoc(doc.id)}
                              disabled={isLoading}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case "review":
        const reviewValues = getValues();
        return (
          <ReviewSubmitCard
            values={{
              ...reviewValues,
              equipmentProvided,
              licensesRequired: selectedLicenses,
              legalDocs,
            }}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  // Navigation handlers
  const handleNext = async () => {
    const currentStep = steps[step];
    if (currentStep !== "review") {
      const fields = stepFields[currentStep];
      const valid = await trigger(fields as any);
      if (!valid) return;
    }
    setStep((s) => {
      const nextStep = Math.min(s + 1, steps.length - 1);
      setMaxStep((prev) => Math.max(prev, nextStep));
      return nextStep;
    });
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-8 max-w-5xl mx-auto"
    >
      {/* Tabs for step navigation */}
      <Tabs
        value={steps[step]}
        className="mb-4"
        onValueChange={(val) => {
          const idx = steps.indexOf(val);
          // Allow navigation to any step up to maxStep
          if (idx !== -1 && idx <= maxStep) setStep(idx);
        }}
      >
        <TabsList className="w-full flex flex-wrap justify-center gap-2">
          {stepCardSteps.map((s, idx) => (
            <TabsTrigger
              key={s.label}
              value={steps[idx]}
              className="min-w-[120px]"
              disabled={idx > maxStep}
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}
      <div key={steps[step]}>{renderStep()}</div>

      <div className="flex gap-3 justify-end pt-6">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={isLoading}
          >
            Previous
          </Button>
        )}
        {step < steps.length - 1 && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleNext}
            disabled={isLoading}
            className="hover:cursor-pointer"
          >
            Next
          </Button>
        )}
        {step === steps.length - 1 && (
          <Button type="submit" disabled={isLoading} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {isLoading ? "Publishing..." : "Submit"}
          </Button>
        )}
      </div>
    </form>
  );
}
