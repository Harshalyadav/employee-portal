"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { CountryCodeSelector } from "@/components/form/CountryCodeSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useInfiniteBranches } from "@/hooks";
import { useAppStore } from "@/stores";
import { isPrivilegedAdminUser } from "@/lib/admin-head-access";
import { COUNTRY_CODES } from "@/config/country-code";
import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import { createAdminHead, createManagerByHead, getAdminHeadById, updateAdminHead } from "@/service";
import { adminUserSchema, AdminUserSchema } from "@/types/admin-user.type";
import { IAdminHead, IRole, IPaginatedResponse } from "@/types";
import { toast } from "sonner";
import { Check, Eye, EyeOff } from "lucide-react";

type RoleOption = {
  value:
    | "HR_HEAD"
    | "ACCOUNT_HEAD"
    | "VISA_HEAD"
    | "HR_MANAGER"
    | "ACCOUNT_MANAGER"
    | "VISA_MANAGER";
  label: string;
  headRole:
    | "HR_HEAD"
    | "ACCOUNT_HEAD"
    | "VISA_HEAD"
    | "HR_MANAGER"
    | "ACCOUNT_MANAGER"
    | "VISA_MANAGER";
};

const HEAD_ROLE_OPTIONS: RoleOption[] = [
  { value: "HR_HEAD", label: "HR Head", headRole: "HR_HEAD" },
  { value: "ACCOUNT_HEAD", label: "Account Head", headRole: "ACCOUNT_HEAD" },
  { value: "VISA_HEAD", label: "Visa Head", headRole: "VISA_HEAD" },
];

const MANAGER_ROLE_OPTIONS: RoleOption[] = [
  { value: "HR_MANAGER", label: "HR Manager", headRole: "HR_MANAGER" },
  { value: "ACCOUNT_MANAGER", label: "Account Manager", headRole: "ACCOUNT_MANAGER" },
  { value: "VISA_MANAGER", label: "Visa Manager", headRole: "VISA_MANAGER" },
];

const ROLE_OPTIONS: RoleOption[] = [...HEAD_ROLE_OPTIONS, ...MANAGER_ROLE_OPTIONS];

const BASIC_INFO_FIELDS: Array<keyof AdminUserSchema> = ["name", "email", "phoneCountryCode", "phone", "address"];
const ACCESS_CONTROL_FIELDS: Array<keyof AdminUserSchema> = ["role", "permissions"];

const normalizeRoleName = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, "_");
const normalizeBranchKey = (value?: string) => String(value || "").trim().toLowerCase();

const getRoleTokens = (value: string) => {
  const normalized = normalizeRoleName(value);
  const uppercase = normalized.toUpperCase();
  return new Set([value, normalized, uppercase]);
};

const getNormalizedCurrentRoleName = (user: unknown) => {
  const roleName = String(
    (user as any)?.role?.roleName ??
      (((user as any)?.roleId && typeof (user as any).roleId === "object")
        ? (user as any).roleId?.roleName
        : "") ??
      "",
  );

  return normalizeRoleName(roleName);
};

const getOptionTokens = (option: RoleOption) =>
  [option.value, option.label, option.headRole]
    .filter((item): item is string => Boolean(item))
    .flatMap((item) => Array.from(getRoleTokens(item)));

const getRoleValue = (role: unknown) => {
  if (!role) {
    return "";
  }

  if (typeof role === "string") {
    const tokens = getRoleTokens(role);
    return ROLE_OPTIONS.find((option) => {
      const optionTokens = getOptionTokens(option);
      return optionTokens.some((token) => tokens.has(token));
    })?.value || "";
  }

  if (typeof role === "object") {
    const roleName = (role as { roleName?: string; name?: string }).roleName || (role as { roleName?: string; name?: string }).name;
    if (roleName) {
      const tokens = getRoleTokens(roleName);
      return ROLE_OPTIONS.find((option) => {
        const optionTokens = getOptionTokens(option);
        return optionTokens.some((token) => tokens.has(token));
      })?.value || "";
    }
  }

  return "";
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    if (typeof message === "string") {
      return message;
    }
  }

  return "Error saving admin user.";
};

const getValidationErrorMessage = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  if ("message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }

  for (const value of Object.values(error as Record<string, unknown>)) {
    const nestedMessage = getValidationErrorMessage(value);
    if (nestedMessage) {
      return nestedMessage;
    }
  }

  return undefined;
};

const getAddressValue = (adminHead: {
  address?: string;
  permanentAddress?: { addressLine?: string };
  currentAddress?: { addressLine?: string };
}) => {
  return adminHead.address || adminHead.permanentAddress?.addressLine || adminHead.currentAddress?.addressLine || "";
};

const AVAILABLE_DIAL_CODES = Array.from(new Set(COUNTRY_CODES.map((country) => country.dial_code))).sort(
  (left, right) => right.length - left.length,
);

const splitPhoneNumber = (phoneValue?: string) => {
  const sanitizedPhone = (phoneValue || "").trim().replace(/\s+/g, "");
  if (!sanitizedPhone) {
    return { phoneCountryCode: "+91", phone: "" };
  }

  const matchedDialCode = AVAILABLE_DIAL_CODES.find((dialCode) => sanitizedPhone.startsWith(dialCode));
  if (!matchedDialCode) {
    return { phoneCountryCode: "+91", phone: sanitizedPhone };
  }

  return {
    phoneCountryCode: matchedDialCode,
    phone: sanitizedPhone.slice(matchedDialCode.length),
  };
};

const normalizePhoneForSubmit = (phoneCountryCode: string, phone: string) => {
  const sanitizedPhone = phone.trim().replace(/\s+/g, "");
  if (!sanitizedPhone) {
    return "";
  }

  const matchedDialCode = AVAILABLE_DIAL_CODES.find((dialCode) => sanitizedPhone.startsWith(dialCode));
  const localPhone = matchedDialCode ? sanitizedPhone.slice(matchedDialCode.length) : sanitizedPhone;
  return `${phoneCountryCode}${localPhone}`;
};

const getEntityId = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return typeof value === "string" ? value : "";
  }

  const entity = value as {
    _id?: string;
    id?: string;
    branchId?: string | { _id?: string; id?: string };
    branch?: { _id?: string; id?: string };
  };

  if (typeof entity.branchId === "object" && entity.branchId !== null) {
    return entity.branchId._id || entity.branchId.id || entity._id || entity.id || "";
  }

  return entity._id || entity.id || (typeof entity.branchId === "string" ? entity.branchId : "") || entity.branch?._id || entity.branch?.id || "";
};

const getEntityName = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return typeof value === "string" ? value : "";
  }

  const entity = value as {
    name?: string;
    roleName?: string;
    branchName?: string;
    branchId?: string | { name?: string; branchName?: string };
    branch?: { name?: string; branchName?: string };
  };

  if (typeof entity.branchId === "object" && entity.branchId !== null) {
    return entity.branchId.name || entity.branchId.branchName || entity.name || entity.roleName || entity.branchName || "";
  }

  return (
    entity.name ||
    entity.roleName ||
    entity.branchName ||
    entity.branch?.name ||
    entity.branch?.branchName ||
    ""
  );
};

const getPermissionDesignation = (adminHead: IAdminHead) => {
  const permissionValue = adminHead.permissions;
  if (permissionValue && !Array.isArray(permissionValue) && typeof permissionValue === "object") {
    const designation = permissionValue.designation;
    const id = getEntityId(designation);
    const name = getEntityName(designation);
    if (id || name) {
      return { id, name };
    }
  }

  const fallbackRole = adminHead.role || adminHead.roleId;
  return {
    id: getEntityId(fallbackRole),
    name: getEntityName(fallbackRole),
  };
};

const getPermissionBranches = (adminHead: IAdminHead) => {
  const permissionValue = adminHead.permissions;
  const rawBranches =
    permissionValue && !Array.isArray(permissionValue) && typeof permissionValue === "object"
      ? permissionValue.branches
      : adminHead.branches;

  return (rawBranches || [])
    .map((branch) => ({
      id: getEntityId(branch),
      name: getEntityName(branch),
    }))
    .filter((branch) => branch.id || branch.name);
};
const inputClassName = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900";
const labelClassName = "block text-sm font-medium text-gray-700";
const cardClassName = "rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-sm";
const outlineButtonClassName = "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900";


export function AdminUserForm({ mode, userId }: { mode: "create" | "edit"; userId?: string }) {
  const router = useRouter();
  const { user } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roleIds, setRoleIds] = useState<Record<string, string>>({});
  const [existingRoleId, setExistingRoleId] = useState("");
  const {
    data: branchPages,
    hasNextPage: hasNextBranchPage,
    isFetchingNextPage: isFetchingNextBranchPage,
    fetchNextPage: fetchNextBranchPage,
  } = useInfiniteBranches(100);

  const form = useForm<AdminUserSchema>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneCountryCode: "+91",
      phone: "",
      address: "",
      password: "",
      role: "",
      permissions: {
        designation: { id: "", name: "" },
        branches: [],
      },
    },
  });

  useEffect(() => {
    if (hasNextBranchPage && !isFetchingNextBranchPage) {
      fetchNextBranchPage();
    }
  }, [fetchNextBranchPage, hasNextBranchPage, isFetchingNextBranchPage]);

  const availableBranches = useMemo(
    () =>
      branchPages?.pages
        .flatMap((page) => page.data)
        .map((branch) => ({
          ...branch,
          normalizedId: getEntityId(branch),
          normalizedName: getEntityName(branch) || (branch as { branchName?: string }).branchName || "",
        }))
        .filter((branch, index, array) => {
          const branchId = branch.normalizedId;
          return branchId && array.findIndex((candidate) => candidate.normalizedId === branchId) === index;
        }) || [],
    [branchPages],
  );

  const selectedPermissionBranches = form.watch("permissions.branches");
  const selectedRoleValue = form.watch("role");
  const currentRoleName = getNormalizedCurrentRoleName(user);
  const isPrivilegedAdmin = isPrivilegedAdminUser(user);
  const headToManagerValue: Record<string, RoleOption["value"]> = {
    hr_head: "HR_MANAGER",
    visa_head: "VISA_MANAGER",
    account_head: "ACCOUNT_MANAGER",
  };
  const allowedCreateRoleValues = useMemo(() => {
    if (isPrivilegedAdmin) {
      return HEAD_ROLE_OPTIONS.map((role) => role.value);
    }
    const mapped = headToManagerValue[currentRoleName];
    return mapped ? [mapped] : [];
  }, [currentRoleName, isPrivilegedAdmin]);
  const roleOptionsForForm = useMemo(
    () =>
      mode === "create"
        ? ROLE_OPTIONS.filter((role) => allowedCreateRoleValues.includes(role.value))
        : ROLE_OPTIONS,
    [allowedCreateRoleValues, mode],
  );

  useEffect(() => {
    if (selectedPermissionBranches.length === 0 || availableBranches.length === 0) {
      return;
    }

    const normalizedBranches = selectedPermissionBranches.map((selectedBranch) => {
      const matchedBranch = availableBranches.find((branch) => {
        if (selectedBranch.id && branch.normalizedId === selectedBranch.id) {
          return true;
        }

        return normalizeBranchKey(branch.normalizedName) === normalizeBranchKey(selectedBranch.name);
      });

      return matchedBranch
        ? {
            id: matchedBranch.normalizedId,
            name: matchedBranch.normalizedName || selectedBranch.name,
          }
        : selectedBranch;
    });

    const hasChanged = normalizedBranches.some(
      (branch, index) =>
        branch.id !== selectedPermissionBranches[index]?.id || branch.name !== selectedPermissionBranches[index]?.name,
    );

    if (hasChanged) {
      form.setValue("permissions.branches", normalizedBranches, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [availableBranches, form, selectedPermissionBranches]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const roleResponse = await axiosInstance.get<IPaginatedResponse<IRole>>(API_ROUTE.ROLE.ALL.PATH, { params: { page: 1, limit: 100 } });

        const roles = Array.isArray(roleResponse.data?.data) ? roleResponse.data.data : [];
        const nextRoleIds = ROLE_OPTIONS.reduce<Record<string, string>>((accumulator, option) => {
          const optionTokens = getOptionTokens(option);
          const matchedRole = roles.find((role) => {
            const roleTokens = Array.from(getRoleTokens(role.roleName));
            return roleTokens.some((token) => optionTokens.includes(token));
          });
          if (matchedRole) {
            accumulator[option.value] = matchedRole._id || matchedRole.id;
          }
          return accumulator;
        }, {});

        setRoleIds(nextRoleIds);

        if (mode === "edit" && userId) {
          setLoading(true);
          const userResponse = await getAdminHeadById(userId);
          const permissionDesignation = getPermissionDesignation(userResponse);
          const permissionBranches = getPermissionBranches(userResponse);
          const phoneValues = splitPhoneNumber(userResponse?.phoneNumber || userResponse?.phone || "");
          const resolvedRoleId = getEntityId(userResponse?.roleId) || getEntityId(userResponse?.role) || permissionDesignation.id;

          setExistingRoleId(resolvedRoleId);

          form.reset({
            name: userResponse?.name || userResponse?.fullName || "",
            email: userResponse?.email || "",
            phoneCountryCode: phoneValues.phoneCountryCode,
            phone: phoneValues.phone,
            address: getAddressValue(userResponse),
            password: "",
            role: getRoleValue(userResponse?.role || userResponse?.roleId),
            permissions: {
              designation: permissionDesignation,
              branches: permissionBranches,
            },
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [form, mode, userId]);

  useEffect(() => {
    if (mode !== "create") return;
    if (roleOptionsForForm.length !== 1) return;
    const onlyRole = roleOptionsForForm[0];
    if (form.getValues("role") !== onlyRole.value) {
      form.setValue("role", onlyRole.value, { shouldDirty: false, shouldValidate: true });
    }
  }, [form, mode, roleOptionsForForm]);

  useEffect(() => {
    if (!selectedRoleValue) {
      return;
    }

    const selectedRole = ROLE_OPTIONS.find((option) => option.value === selectedRoleValue);
    const selectedRoleId = roleIds[selectedRoleValue] || "";

    if (!selectedRole || !selectedRoleId) {
      return;
    }

    const currentDesignation = form.getValues("permissions.designation");
    if (currentDesignation.id === selectedRoleId && currentDesignation.name === selectedRole.label) {
      return;
    }

    form.setValue(
      "permissions.designation",
      { id: selectedRoleId, name: selectedRole.label },
      { shouldDirty: false, shouldValidate: true },
    );
  }, [form, roleIds, selectedRoleValue]);

  const onSubmit = async (values: AdminUserSchema) => {
    setLoading(true);
    try {
      const normalizedPhoneNumber = normalizePhoneForSubmit(values.phoneCountryCode, values.phone);
      const selectedRole = ROLE_OPTIONS.find((option) => option.value === values.role);
      const roleId = roleIds[values.role];
      const resolvedRoleId = roleId || existingRoleId || values.permissions.designation.id;
      const designationPayload = resolvedRoleId
        ? {
            id: resolvedRoleId,
            name: selectedRole?.label || values.permissions.designation.name || "",
          }
        : undefined;
      // For step5 review-submit, branches should not be included in permissions
      // Remove branches from permissions for step5 review-submit
      const permissionsPayload = designationPayload
        ? {
            designation: designationPayload,
            branches: (values.permissions.branches || []).filter((branch) => branch.id),
          }
        : undefined;

      if (mode === "create") {
        if (!selectedRole) {
          toast.error("Selected role is not available.");
          return;
        }

        if (!resolvedRoleId) {
          toast.error("Selected role is not available.");
          return;
        }

        const payload = {
          name: values.name,
          email: values.email,
          password: values.password,
          phoneNumber: normalizedPhoneNumber,
          address: values.address,
          status: "active",
          permissions: permissionsPayload,
        };

        if (selectedRole.headRole.endsWith("_MANAGER")) {
          await createManagerByHead(selectedRole.headRole, payload);
        } else {
          await createAdminHead(selectedRole.headRole, payload);
        }
      } else {
        if (!userId) {
          toast.error("Admin user ID is required.");
          return;
        }

        await updateAdminHead(userId, {
          name: values.name,
          email: values.email,
          phoneNumber: normalizedPhoneNumber,
          address: values.address,
          status: "active",
          ...(values.password ? { password: values.password } : {}),
          ...(permissionsPayload ? { permissions: permissionsPayload } : {}),
        });
      }

      toast.success(mode === "create" ? "Admin user created successfully" : "Admin user updated successfully");

      if (mode === "create" || mode === "edit") {
        router.push("/admin-users");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onInvalidSubmit = () => {
    const validationMessage = getValidationErrorMessage(form.formState.errors);
    toast.error(validationMessage || "Please complete the required fields before updating the admin user.");
  };

  const [step, setStep] = useState(1);
  const currentStepIndex = step - 1;
  const steps = [
    { key: "basic-info", label: "Basic Info", number: 1 },
    { key: "permission", label: "Permission", number: 2 },
    { key: "review-submit", label: "Review & Submit", number: 3 },
  ];

  const goToAccessControl = async () => {
    const fields: Array<keyof AdminUserSchema> = mode === "create"
      ? [...BASIC_INFO_FIELDS, "password"]
      : BASIC_INFO_FIELDS;
    const isValid = await form.trigger(fields);
    if (isValid) {
      setStep(2);
    }
  };

  const goToReview = async () => {
    const isValid = await form.trigger(ACCESS_CONTROL_FIELDS);
    if (isValid) {
      setStep(3);
    }
  };

  const handleBranchToggle = (branchId: string, branchName: string) => {
    const nextBranches = selectedPermissionBranches.some((branch) => branch.id === branchId)
      ? selectedPermissionBranches.filter((branch) => branch.id !== branchId)
      : [...selectedPermissionBranches, { id: branchId, name: branchName }];

    form.setValue("permissions.branches", nextBranches, { shouldDirty: true, shouldValidate: true });
  };

  const selectableBranches = useMemo(
    () =>
      availableBranches
        .map((branch) => ({
          id: branch.normalizedId,
          name: branch.normalizedName || "Unnamed Branch",
        }))
        .filter((branch): branch is { id: string; name: string } => Boolean(branch.id)),
    [availableBranches],
  );

  const selectedBranchIds = useMemo(
    () =>
      new Set(
        selectedPermissionBranches
          .map((branch) => branch.id?.trim())
          .filter((branchId): branchId is string => Boolean(branchId)),
      ),
    [selectedPermissionBranches],
  );

  const allBranchesSelected =
    selectableBranches.length > 0 && selectableBranches.every((branch) => selectedBranchIds.has(branch.id));

  const handleSelectAllBranches = () => {
    if (allBranchesSelected) {
      form.setValue("permissions.branches", [], { shouldDirty: true, shouldValidate: true });
      return;
    }

    form.setValue("permissions.branches", selectableBranches, { shouldDirty: true, shouldValidate: true });
  };

  const permissionBranchNames = form.getValues("permissions.branches").map((branch) => branch.name).filter(Boolean);

  if (mode === "create" && roleOptionsForForm.length === 0) {
    return (
      <Card className={cardClassName}>
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">
            You are not allowed to create admin users with your current role.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
      <Card className={cardClassName}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((current, index) => (
              <div key={current.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-medium ${
                      currentStepIndex > index
                        ? "bg-green-500 text-white"
                        : currentStepIndex === index
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStepIndex > index ? <Check className="h-5 w-5" /> : current.number}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      currentStepIndex === index ? "text-primary" : "text-gray-500"
                    }`}
                  >
                    {current.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex flex-1 items-center">
                    <div
                      className={`mx-2 h-1 w-full ${
                        currentStepIndex > index ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {step === 1 && (
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className={labelClassName}>Full Name</label>
                <input {...form.register("name")} className={inputClassName} placeholder="Enter full name" />
                {form.formState.errors.name && <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={labelClassName}>Email</label>
                <input {...form.register("email")} className={inputClassName} placeholder="Enter email" type="email" />
                {form.formState.errors.email && <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className={labelClassName}>Phone</label>
                <div className="flex gap-2">
                  <CountryCodeSelector
                    value={form.watch("phoneCountryCode")}
                    onValueChange={(value) => {
                      form.setValue("phoneCountryCode", value, { shouldDirty: true, shouldValidate: true });
                    }}
                    placeholder="Code"
                    disabled={loading}
                  />
                  <input {...form.register("phone")} className={`${inputClassName} flex-1`} placeholder="Enter phone number" />
                </div>
                {(form.formState.errors.phone || form.formState.errors.phoneCountryCode) && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.phone?.message || form.formState.errors.phoneCountryCode?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={labelClassName}>Address (Optional)</label>
                <input {...form.register("address")} className={inputClassName} placeholder="Enter address" />
                {form.formState.errors.address && <p className="text-xs text-red-600">{form.formState.errors.address.message}</p>}
              </div>
              <div className="space-y-2">
                <label className={labelClassName}>
                  Password {mode === "edit" ? "(Optional)" : ""}
                </label>
                <div className="relative">
                  <input
                    {...form.register("password")}
                    type={showPassword ? "text" : "password"}
                    className={`${inputClassName} pr-10`}
                    placeholder={mode === "edit" ? "Leave blank to keep existing password" : "Enter password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" className={outlineButtonClassName} disabled={loading} onClick={() => router.push("/admin-users")}>Cancel</Button>
            <Button type="button" disabled={loading} onClick={goToAccessControl}>Next</Button>
          </CardFooter>
        </Card>
      )}
      {step === 2 && (
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>Permission</CardTitle>
            <p className="mt-1 text-sm text-gray-500">Set branch permissions for this user.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className={labelClassName}>Admin Role</label>
                {mode === "edit" ? (
                  <input
                    value={ROLE_OPTIONS.find((role) => role.value === form.watch("role"))?.label || "-"}
                    className={inputClassName}
                    disabled
                    readOnly
                  />
                ) : (
                  <select {...form.register("role")} className={inputClassName}>
                    <option value="">Select designation</option>
                    {roleOptionsForForm.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                )}
                {mode === "edit" && <p className="text-xs text-gray-500">Role cannot be changed after creation.</p>}
                {form.formState.errors.role && <p className="text-xs text-red-600">{form.formState.errors.role.message}</p>}
              </div>
              <div className="space-y-3 md:col-span-2">
                <div>
                  <label className={labelClassName}>Branches</label>
                  <p className="mt-1 text-xs text-gray-500">
                    Select one or more branches for this admin user.
                  </p>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-gray-300 bg-white p-3">
                  {availableBranches.length === 0 ? (
                    <p className="text-sm text-gray-500">No branches available.</p>
                  ) : (
                    <>
                      <label className="flex items-center gap-3 rounded-md px-2 py-1 text-sm font-medium text-gray-800 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={allBranchesSelected}
                          onChange={handleSelectAllBranches}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span>Select All</span>
                      </label>
                      <div className="my-1 h-px bg-gray-200" />
                      {selectableBranches.map((branch) => {
                        const isSelected =
                          selectedBranchIds.has(branch.id) ||
                          selectedPermissionBranches.some(
                            (selectedBranch) =>
                              normalizeBranchKey(selectedBranch.name) === normalizeBranchKey(branch.name),
                          );

                        return (
                          <label key={branch.id} className="flex items-center gap-3 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleBranchToggle(branch.id, branch.name)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span>{branch.name}</span>
                          </label>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" className={outlineButtonClassName} disabled={loading} onClick={() => setStep(1)}>Back</Button>
            <Button type="button" disabled={loading} onClick={goToReview}>Next</Button>
          </CardFooter>
        </Card>
      )}
      {step === 3 && (
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>Review &amp; Submit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div>
                <h3 className="mb-4 font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{form.getValues("name") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{form.getValues("email") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{`${form.getValues("phoneCountryCode") || "+91"} ${form.getValues("phone") || ""}`.trim() || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{form.getValues("address") || "-"}</p>
                  </div>
                  {(mode === "create" || form.getValues("password")) && (
                    <div>
                      <p className="text-sm text-gray-500">Password</p>
                      <p className="font-medium">******</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-4 font-semibold">Access Control</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">Admin Role</p>
                    <p className="font-medium">{ROLE_OPTIONS.find((role) => role.value === form.getValues("role"))?.label || "-"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Branches</p>
                    <p className="font-medium">{permissionBranchNames.length > 0 ? permissionBranchNames.join(", ") : "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" className={outlineButtonClassName} disabled={loading} onClick={() => setStep(2)}>Back</Button>
            <Button type="submit" disabled={loading}>{mode === "create" ? "Create Admin User" : "Update Admin User"}</Button>
          </CardFooter>
        </Card>
      )}
    </form>
  );
}
