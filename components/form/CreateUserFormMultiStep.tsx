"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { getAdminHeadAccessRole } from "@/lib/admin-head-access";
import { getAllCountries, getStatesByCountry } from "@/lib/location-utils";
import { fetchCityFromPincode } from "@/lib/pincode-utils";
import { CountryCodeSelector } from "@/components/form/CountryCodeSelector";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SingleFileUpload } from "@/components/upload";
// import { useAddressVerification } from "@/hooks/useAddressVerification"; // Address verification disabled
import { useInfiniteRoles, useAssignableRoles } from "@/hooks/query/role.hook";
import { useInfiniteBranches } from "@/hooks/query/useBranch";
import { useSponsorCompanies } from "@/hooks/query/sponsor-company.hook";
import {
  useCreatePersonalInfo,
  useGetCompleteUserInfo,
  useGetContactInfo,
  useGetEmploymentInfo,
  useGetDocumentInfo,
  useGetPersonalInfo,
  useUpdateContactInfo,
  useUpdateDocumentUpload,
  useUpdateEmploymentInfo,
  useUpdateReviewSubmit,
} from "@/hooks/query/user.hook";
import { useAppStore } from "@/stores";
import { APP_ROUTE, API_ROUTE } from "@/routes";
import {
  contactInfoSchema,
  ContactInfoSchema,
  DocumentTypeLabels,
  documentUploadSchema,
  DocumentUploadSchema,
  employmentInfoSchema,
  EmploymentInfoSchema,
  GenderEnum,
  PaymentModeEnum,
  personalInfoSchema,
  PersonalInfoSchema,
  REQUIRED_EMPLOYEE_DOCUMENT_TYPES,
  UserDocumentTypeEnum,
  UserFormStepEnum,
  UserStatusEnum,
  VisaTypeEnum,
} from "@/types";
import Image from "next/image";
import { COUNTRY_CODES } from "@/config/country-code";
import { EMPLOYEE_CURRENCY_OPTIONS } from "@/config/currency-options";

interface CreateUserFormProps {
  onSuccess?: () => void;
}

const DEFAULT_COUNTRY_CODE = "+91";

const createDocumentForType = (
  docType?: UserDocumentTypeEnum,
): DocumentUploadSchema["documents"][number] => ({
  docType: docType as UserDocumentTypeEnum,
  documentNumber: "",
  expiryDate: "",
  frontImg: "",
  backImg: "",
});

const createRequiredDocuments = (): DocumentUploadSchema["documents"] =>
  REQUIRED_EMPLOYEE_DOCUMENT_TYPES.map((documentType) => createDocumentForType(documentType));

const normalizeRequiredDocuments = (
  documents: DocumentUploadSchema["documents"] = [],
): DocumentUploadSchema["documents"] => {
  const normalizedDocuments = [...documents];
  const usedIndexes = new Set<number>();

  const requiredDocuments = REQUIRED_EMPLOYEE_DOCUMENT_TYPES.map((documentType) => {
    const matchedIndex = normalizedDocuments.findIndex(
      (document, index) => !usedIndexes.has(index) && document?.docType === documentType,
    );

    if (matchedIndex === -1) {
      return createDocumentForType(documentType);
    }

    usedIndexes.add(matchedIndex);
    return normalizedDocuments[matchedIndex];
  });

  const extraDocuments = normalizedDocuments.filter((_, index) => !usedIndexes.has(index));
  return [...requiredDocuments, ...extraDocuments];
};

const normalizeCountryCode = (code?: string) => {
  const trimmed = code?.trim();
  if (!trimmed) return DEFAULT_COUNTRY_CODE;
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
};

const buildPhoneWithCountryCode = (countryCode?: string, phone?: string) => {
  const trimmedPhone = phone?.trim();
  if (!trimmedPhone) return "";
  return `${normalizeCountryCode(countryCode)}${trimmedPhone}`;
};

const splitPhoneWithCountryCode = (value?: string) => {
  const raw = value?.trim() || "";
  if (!raw) {
    return { countryCode: DEFAULT_COUNTRY_CODE, phone: "" };
  }

  const matchedCode = [...new Set(COUNTRY_CODES.map((item) => item.dial_code))]
    .sort((left, right) => right.length - left.length)
    .find((dialCode) => raw.startsWith(dialCode));

  if (matchedCode) {
    return {
      countryCode: matchedCode,
      phone: raw.slice(matchedCode.length),
    };
  }

  return {
    countryCode: DEFAULT_COUNTRY_CODE,
    phone: raw.replace(/^\+/, ""),
  };
};

const getApiErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;
  const message = responseData?.message;
  const fieldErrors = responseData?.errors;

  if (fieldErrors && typeof fieldErrors === "object") {
    const flattened = Object.values(fieldErrors)
      .flatMap((value: any) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean);
    if (flattened.length > 0) {
      return flattened.join(", ");
    }
  }

  if (Array.isArray(message) && message.length > 0) {
    return message.join(", ");
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return fallback;
};

export function CreateUserFormMultiStep({ onSuccess }: CreateUserFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [guardianType, setGuardianType] = useState<
    "father" | "mother" | "other" | ""
  >("");
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>("+91"); // Default to India
  const [emergencyContactCountryCode, setEmergencyContactCountryCode] =
    useState<string>("+91"); // Default to India
  const [editableAddressLine, setEditableAddressLine] = useState<string>("");

  // Address verification disabled - OCR checks removed
  // const [verificationStatus, setVerificationStatus] = useState<{
  //   isVerifying: boolean;
  //   error: string | null;
  //   verified: boolean | null;
  //   similarity: number | null;
  //   extractedText?: string;
  //   normalizedExtractedText?: string;
  //   normalizedUserAddress?: string;
  // }>({
  //   isVerifying: false,
  //   error: null,
  //   verified: null,
  //   similarity: null,
  // });

  // Address verification hook disabled
  // const { verifyAddress, isLoading: isVerifying, error: verificationError, clearError: clearVerificationError } = useAddressVerification();

  // Use store for userId and currentStep
  const {
    user,
    formUserId: userId,
    currentFormStep: currentStep,
    setFormUserId,
    setCurrentFormStep,
    loadUserFormFromStorage,
    resetUserForm,
    isHydrated,
  } = useAppStore();

  // HR Head and Account Head should not assign visa sponsor-company metadata from the
  // employee wizard, so that field stays hidden for those roles across create/review steps.
  const accessRole = getAdminHeadAccessRole(user);
  const shouldHideSponsorCompany =
    accessRole === "HR_HEAD" || accessRole === "ACCOUNT_HEAD";

  // Mutations - MUST be called before any conditional returns
  const createPersonalInfoMutation = useCreatePersonalInfo();
  const updateContactInfoMutation = useUpdateContactInfo();
  const updateEmploymentInfoMutation = useUpdateEmploymentInfo();
  const updateDocumentUploadMutation = useUpdateDocumentUpload();
  const updateReviewSubmitMutation = useUpdateReviewSubmit();

  // Helper to sanitize permissions for review submit
  function sanitizePermissionsForReviewSubmit(permissions: any) {
    if (!permissions) return undefined;
    const { designation } = permissions;
    return designation ? { designation } : undefined;
  }

  // Fetch data for each step - MUST be called before any conditional returns
  const { data: personalInfoData, isLoading: loadingPersonalInfo } =
    useGetPersonalInfo(userId || undefined);
  const { data: contactInfoData, isLoading: loadingContactInfo } =
    useGetContactInfo(userId || undefined);
  const { data: employmentInfoData, isLoading: loadingEmploymentInfo } =
    useGetEmploymentInfo(userId || undefined);
  const { data: documentUploadData, isLoading: loadingDocumentUpload } =
    useGetDocumentInfo(userId || undefined);
  const { data: completeUserInfo } = useGetCompleteUserInfo(
    userId || undefined,
  );

  const roleFilters = useMemo(() => ({ page: 1, limit: 100 }), []);
  const {
    data: rolesPages,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteRoles(roleFilters);

  const { data: sponsorCompaniesResponse } = useSponsorCompanies(1, 1000, undefined, !shouldHideSponsorCompany);
  const sponsorCompanyOptions = useMemo(() => {
    const companies = sponsorCompaniesResponse?.data || [];
    const uniqueNames = Array.from(
      new Set(
        companies
          .map((company) => String(company?.nameOfCompany || "").trim())
          .filter(Boolean),
      ),
    );
    return uniqueNames.sort((left, right) => left.localeCompare(right));
  }, [sponsorCompaniesResponse]);

  const availableRoles = useMemo(() => {
    const raw = rolesPages?.pages?.flatMap((p) => p.data ?? []) || [];
    const map = new Map<string, (typeof raw)[number]>();
    for (const r of raw) {
      const key = r?._id;
      if (key && !map.has(key)) {
        map.set(key, r);
      }
    }
    return Array.from(map.values());
  }, [rolesPages]);

  const { data: assignableRolesData, isSuccess: assignableRolesSuccess } = useAssignableRoles();
  const permissionStepRoles = useMemo(() => assignableRolesData ?? [], [assignableRolesData]);

  const branchFilters = useMemo(() => ({ limit: 100 }), []);
  const {
    data: branchesPages,
    hasNextPage: hasNextBranchPage,
    fetchNextPage: fetchNextBranchPage,
    isFetchingNextPage: isFetchingNextBranchPage,
  } = useInfiniteBranches(branchFilters.limit);

  const availableBranches = useMemo(() => {
    const raw = (branchesPages?.pages || []).flatMap((p) => p.data ?? []);
    const map = new Map<string, (typeof raw)[number]>();
    for (const b of raw) {
      const key = b?._id;
      if (key && !map.has(key)) {
        map.set(key, b);
      }
    }
    return Array.from(map.values());
  }, [branchesPages]);


  // Step forms
  const personalInfoForm = useForm<PersonalInfoSchema>({
    resolver: zodResolver(personalInfoSchema),
    mode: "onBlur",
    defaultValues: {
      referenceBy: {
        name: "",
        countryCode: "+91",
        contactNumber: "",
      },
      parentGuardianDetails: {
        fatherMobileCountryCode: "+91",
        motherMobileCountryCode: "+91",
        otherMobileCountryCode: "+91",
      },
    },
  });

  const contactInfoForm = useForm<ContactInfoSchema>({
    resolver: zodResolver(contactInfoSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      phone: "",
      phoneCountryCode: "+91",
      emergencyContact: "",
      emergencyContactCountryCode: "+91",
      currentAddress: {
        country: "",
        state: "",
        city: "",
        pincode: "",
        addressLine: "",
      },
      permanentAddress: {
        country: "",
        state: "",
        city: "",
        pincode: "",
        addressLine: "",
      },
    },
  });

  const employmentInfoForm = useForm<EmploymentInfoSchema>({
    resolver: zodResolver(employmentInfoSchema),
    mode: "onBlur",
    defaultValues: {
      paymentMode: PaymentModeEnum.CASH,
    },
  });

  const paymentMode = employmentInfoForm.watch("paymentMode");
  const shouldCollectBankDetails = paymentMode === PaymentModeEnum.ACCOUNT;

  const [permissionDesignation, setPermissionDesignation] = useState<string>("");
  const [permissionBranchIds, setPermissionBranchIds] = useState<string[]>([]);

  // Prefer assignable roles when API has responded (so HR Head / Visa Head / Account Head see only their allowed designations)
  const permissionRolesForLookup = useMemo(
    () =>
      assignableRolesSuccess && Array.isArray(assignableRolesData)
        ? assignableRolesData
        : permissionStepRoles.length > 0
          ? permissionStepRoles
          : availableRoles,
    [assignableRolesSuccess, assignableRolesData, permissionStepRoles, availableRoles],
  );
  const employeeDesignationId = useMemo(() => {
    const employeeRole = [...permissionRolesForLookup, ...availableRoles].find((role: any) => {
      const roleName = String(role?.roleName || "").trim().toLowerCase();
      return roleName === "employee" || roleName === "employees";
    });

    return employeeRole?._id || "";
  }, [availableRoles, permissionRolesForLookup]);
  const isEmployeeDesignation = useMemo(() => {
    const role = permissionRolesForLookup.find((r: any) => r._id === permissionDesignation);
    return Boolean(role && String(role.roleName || "").toLowerCase() === "employee");
  }, [permissionRolesForLookup, permissionDesignation]);

  useEffect(() => {
    if (!employeeDesignationId) {
      return;
    }

    setPermissionDesignation((previous) => previous || employeeDesignationId);
  }, [employeeDesignationId]);

  useEffect(() => {
    if (currentStep === UserFormStepEnum.PERMISSION) {
      setCurrentFormStep(UserFormStepEnum.DOCUMENT_UPLOAD);
    }
  }, [currentStep, setCurrentFormStep]);

  useEffect(() => {
    if (isEmployeeDesignation) setPermissionBranchIds([]);
  }, [isEmployeeDesignation]);

  // When branch is selected in Employment tab and role is not Employee, pre-select that branch in Permissions
  const employmentBranchId = employmentInfoForm.watch("branchId");
  useEffect(() => {
    const branchId =
      typeof employmentBranchId === "string"
        ? employmentBranchId.trim()
        : (employmentBranchId as any)?.toString?.()?.trim?.() ?? "";
    if (!branchId) return;
    if (isEmployeeDesignation) return;
    setPermissionBranchIds((prev) =>
      prev.includes(branchId) ? prev : [branchId, ...prev]
    );
  }, [employmentBranchId, isEmployeeDesignation]);

  const documentUploadForm = useForm<DocumentUploadSchema>({
    resolver: zodResolver(documentUploadSchema),
    mode: "onBlur",
    defaultValues: {
      documents: createRequiredDocuments(),
    },
  });

  const {
    fields: documentFields,
    append: appendDocument,
    remove: removeDocument,
    replace: replaceDocuments,
  } = useFieldArray({
    control: documentUploadForm.control,
    name: "documents",
  });

  // Load from localStorage on mount
  useEffect(() => {
    // Only load once when component mounts
    loadUserFormFromStorage();
  }, []);

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (hasNextBranchPage && !isFetchingNextBranchPage) {
      fetchNextBranchPage();
    }
  }, [hasNextBranchPage, isFetchingNextBranchPage, fetchNextBranchPage]);

  useEffect(() => {
    if (!shouldCollectBankDetails) {
      employmentInfoForm.setValue("bankAccount.bankName", "");
      employmentInfoForm.setValue("bankAccount.bankHolderName", "");
      employmentInfoForm.setValue("bankAccount.accountNumber", "");
      employmentInfoForm.setValue("bankAccount.ifsc", "");
      // Clear validation errors for bank account fields when switching to CASH
      employmentInfoForm.clearErrors("bankAccount");
    }
  }, [shouldCollectBankDetails, employmentInfoForm]);

  // Populate forms with fetched data
  useEffect(() => {
    if (personalInfoData && currentStep === UserFormStepEnum.PERSONAL_INFO) {
      const formData =
        (personalInfoData as any).currentStepData || personalInfoData;
      const fatherMobile = splitPhoneWithCountryCode(
        formData.parentGuardianDetails?.fatherMobile,
      );
      const motherMobile = splitPhoneWithCountryCode(
        formData.parentGuardianDetails?.motherMobile,
      );
      const otherMobile = splitPhoneWithCountryCode(
        formData.parentGuardianDetails?.otherMobile,
      );
      const referencePhone = splitPhoneWithCountryCode(formData.referencePhone);

      const normalizedFormData = {
        ...formData,
        referenceBy:
          formData.referenceBy || formData.referencePhone
            ? {
                name: formData.referenceBy || "",
                countryCode: referencePhone.countryCode,
                contactNumber: referencePhone.phone,
              }
            : undefined,
        parentGuardianDetails: formData.parentGuardianDetails
          ? {
              ...formData.parentGuardianDetails,
              fatherMobile: fatherMobile.phone,
              fatherMobileCountryCode: fatherMobile.countryCode,
              motherMobile: motherMobile.phone,
              motherMobileCountryCode: motherMobile.countryCode,
              otherMobile: otherMobile.phone,
              otherMobileCountryCode: otherMobile.countryCode,
            }
          : undefined,
      };

      personalInfoForm.reset(normalizedFormData);

      // Explicitly set all fields to ensure they populate
      if (formData.fullName)
        personalInfoForm.setValue("fullName", formData.fullName);
      if (formData.dob) personalInfoForm.setValue("dob", formData.dob);
      if (formData.bloodGroup)
        personalInfoForm.setValue("bloodGroup", formData.bloodGroup);
      if (formData.nationality)
        personalInfoForm.setValue("nationality", formData.nationality);
      if (formData.gender) personalInfoForm.setValue("gender", formData.gender);
      if (formData.maritalStatus)
        personalInfoForm.setValue("maritalStatus", formData.maritalStatus);
      if (formData.parentGuardianDetails) {
        personalInfoForm.setValue(
          "parentGuardianDetails",
          normalizedFormData.parentGuardianDetails,
        );
      }
      if (normalizedFormData.referenceBy) {
        personalInfoForm.setValue("referenceBy", normalizedFormData.referenceBy);
      }

      if (formData.parentGuardianDetails?.fatherName) {
        setGuardianType("father");
      } else if (formData.parentGuardianDetails?.motherName) {
        setGuardianType("mother");
      } else if (formData.parentGuardianDetails?.otherName) {
        setGuardianType("other");
      }
    }
  }, [personalInfoData, currentStep, personalInfoForm]);

  useEffect(() => {
    if (contactInfoData && currentStep === UserFormStepEnum.CONTACT_INFO) {
      // Helper function to normalize country code to "+XX" format
      const normalizeCountryCode = (code: string): string => {
        if (!code) return "";
        // Remove any spaces and ensure it starts with +
        const cleaned = code.trim();
        if (cleaned.startsWith("+")) return cleaned;
        return "+" + cleaned;
      };

      // Helper function to validate country code exists in COUNTRY_CODES
      const validateCountryCode = (code: string): string => {
        const normalized = normalizeCountryCode(code);
        // Check if this code exists in COUNTRY_CODES array
        const exists = COUNTRY_CODES.some((c) => c.dial_code === normalized);
        console.log(
          `Validating code: ${normalized}, exists: ${exists}, all codes:`,
          COUNTRY_CODES.map((c) => c.dial_code),
        );
        return exists ? normalized : "";
      };

      // Extract the actual form data from currentStepData
      const formData =
        (contactInfoData as any).currentStepData || contactInfoData;

      const phoneCode = validateCountryCode(formData.phoneCountryCode || "");
      const emergencyCode = validateCountryCode(
        formData.emergencyContactCountryCode || "",
      );
const joiningDate =
  completeUserInfo?.employmentInfo?.dateOfJoining
    ?.split("T")[0] || "-";
      const contactData = {
        email: formData.email || "",
        phone: formData.phone || "",
        phoneCountryCode: phoneCode,
        emergencyContact: formData.emergencyContact || "",
        emergencyContactCountryCode: emergencyCode,
        currentAddress: {
          country: formData.currentAddress?.country || "",
          state: formData.currentAddress?.state || "",
          city: formData.currentAddress?.city || "",
          pincode: formData.currentAddress?.pincode || "",
          addressLine: formData.currentAddress?.addressLine || "",
        },
        permanentAddress: {
          country: formData.permanentAddress?.country || "",
          state: formData.permanentAddress?.state || "",
          city: formData.permanentAddress?.city || "",
          pincode: formData.permanentAddress?.pincode || "",
          addressLine: formData.permanentAddress?.addressLine || "",
        },
      };

      // Reset form with all the data at once, using proper reset options
      contactInfoForm.reset(contactData, {
        keepDirty: false,
        keepTouched: false,
        keepValues: false,
        keepDefaultValues: false,
        keepErrors: false,
        keepIsSubmitted: false,
        keepIsValidating: false,
        keepSubmitCount: false,
      });

      // Set state variables for country codes - ensure they match COUNTRY_CODES format
      console.log("Setting phoneCountryCode to:", phoneCode);
      console.log("Setting emergencyContactCountryCode to:", emergencyCode);
      setPhoneCountryCode(phoneCode);
      setEmergencyContactCountryCode(emergencyCode);

      // Explicitly set form values for country codes to ensure form state matches
      contactInfoForm.setValue("phoneCountryCode", phoneCode);
      contactInfoForm.setValue("emergencyContactCountryCode", emergencyCode);
    }
  }, [contactInfoData, currentStep, contactInfoForm]);

  useEffect(() => {
    if (
      employmentInfoData &&
      currentStep === UserFormStepEnum.EMPLOYMENT_INFO
    ) {
      const rawFormData =
        (employmentInfoData as any).currentStepData || employmentInfoData;
      const formData = {
        ...rawFormData,
        branchId:
          typeof rawFormData?.branchId === "object"
            ? String((rawFormData?.branchId as any)?._id || (rawFormData?.branchId as any)?.id || "")
            : String(rawFormData?.branchId || ""),
      };
      employmentInfoForm.reset(formData);

      // Explicitly set form values to ensure they populate correctly
      if (formData.branchId)
        employmentInfoForm.setValue("branchId", formData.branchId);
      if (formData.baseSalary)
        employmentInfoForm.setValue("baseSalary", formData.baseSalary);
      if (formData.currency)
        employmentInfoForm.setValue("currency", formData.currency);
      if (formData.dateOfJoining)
        employmentInfoForm.setValue("dateOfJoining", formData.dateOfJoining);
      if (formData.paymentMode)
        employmentInfoForm.setValue("paymentMode", formData.paymentMode);
      if (formData.bankAccount)
        employmentInfoForm.setValue("bankAccount", formData.bankAccount);
    }
  }, [employmentInfoData, currentStep, employmentInfoForm]);

  useEffect(() => {
    if (
      documentUploadData &&
      currentStep === UserFormStepEnum.DOCUMENT_UPLOAD
    ) {
      if (documentUploadData.documents && documentUploadData.documents.length > 0) {
        replaceDocuments(normalizeRequiredDocuments(documentUploadData.documents));
      } else {
        replaceDocuments(createRequiredDocuments());
      }
    }
  }, [documentUploadData, currentStep, replaceDocuments]);

  const steps = useMemo(() => [
    { key: UserFormStepEnum.PERSONAL_INFO, label: "Personal Info", number: 1 },
    { key: UserFormStepEnum.CONTACT_INFO, label: "Contact Info", number: 2 },
    { key: UserFormStepEnum.EMPLOYMENT_INFO, label: "Employment Info", number: 3 },
    { key: UserFormStepEnum.DOCUMENT_UPLOAD, label: "Documents", number: 4 },
    { key: UserFormStepEnum.REVIEW_SUBMIT, label: "Review & Submit", number: 5 },
  ], []);

  // Don't render anything until hydrated
  if (!isHydrated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  const isLoading =
    createPersonalInfoMutation.isPending ||
    updateContactInfoMutation.isPending ||
    updateEmploymentInfoMutation.isPending ||
    updateDocumentUploadMutation.isPending ||
    updateReviewSubmitMutation.isPending ||
    loadingPersonalInfo ||
    loadingContactInfo ||
    loadingEmploymentInfo ||
    loadingDocumentUpload;

  // Step handlers
  const handlePersonalInfoSubmit = async (data: PersonalInfoSchema) => {
    const payload: any = {
      ...data,
      referenceBy: data.referenceBy?.name?.trim() || undefined,
      referencePhone: buildPhoneWithCountryCode(
        data.referenceBy?.countryCode,
        data.referenceBy?.contactNumber,
      ) || undefined,
      parentGuardianDetails: data.parentGuardianDetails
        ? {
            ...data.parentGuardianDetails,
            fatherMobile: buildPhoneWithCountryCode(
              data.parentGuardianDetails.fatherMobileCountryCode,
              data.parentGuardianDetails.fatherMobile,
            ) || undefined,
            motherMobile: buildPhoneWithCountryCode(
              data.parentGuardianDetails.motherMobileCountryCode,
              data.parentGuardianDetails.motherMobile,
            ) || undefined,
            otherMobile: buildPhoneWithCountryCode(
              data.parentGuardianDetails.otherMobileCountryCode,
              data.parentGuardianDetails.otherMobile,
            ) || undefined,
          }
        : undefined,
    };

    if (payload.parentGuardianDetails) {
      delete payload.parentGuardianDetails.fatherMobileCountryCode;
      delete payload.parentGuardianDetails.motherMobileCountryCode;
      delete payload.parentGuardianDetails.otherMobileCountryCode;
    }

    createPersonalInfoMutation.mutate(payload, {
      onSuccess: (response) => {
        setFormUserId(response.currentStepData._id);
        setCurrentFormStep(UserFormStepEnum.CONTACT_INFO);
        toast.success("Personal info saved successfully");
      },
      onError: (err: any) => {
        toast.error(getApiErrorMessage(err, "Error saving personal info"));
      },
    });
  };

  const handleContactInfoSubmit = async (data: ContactInfoSchema) => {
    if (!userId) {
      toast.error("User ID not found. Please complete step 1 first.");
      return;
    }

    updateContactInfoMutation.mutate(
      { ...data, email: data.email.trim().toLowerCase(), userId },
      {
        onSuccess: () => {
          toast.success("Contact info saved successfully");
          setCurrentFormStep(UserFormStepEnum.EMPLOYMENT_INFO);
        },
        onError: (err: any) => {
          toast.error(getApiErrorMessage(err, "Error saving contact info"));
        },
      },
    );
  };

  const handleEmploymentInfoSubmit = async (data: EmploymentInfoSchema) => {
    if (!userId) {
      toast.error("User ID not found. Please complete previous steps first.");
      return;
    }

    const submissionData: any = { ...data, userId };

    // Don't send bank account details if payment mode is CASH
    if (data.paymentMode === PaymentModeEnum.CASH) {
      delete submissionData.bankAccount;
    }

    updateEmploymentInfoMutation.mutate(submissionData, {
      onSuccess: () => {
        toast.success("Employment info saved successfully");
        setCurrentFormStep(UserFormStepEnum.DOCUMENT_UPLOAD);
      },
      onError: (err: any) => {
        toast.error(getApiErrorMessage(err, "Error saving employment info"));
      },
    });
  };

  const handlePermissionSubmit = () => {
    toast.success("Permission saved");
    setCurrentFormStep(UserFormStepEnum.DOCUMENT_UPLOAD);
  };

  const handleDocumentUploadSubmit = async (data: DocumentUploadSchema) => {
    if (!userId) {
      toast.error("User ID not found. Please complete previous steps first.");
      return;
    }

    // OCR-based address verification is disabled
    // Documents will be uploaded without address verification

    try {
      const hasDocuments = data.documents && data.documents.length > 0;

      if (!hasDocuments) {
        toast.error("Please upload at least one document.");
        return;
      }

      // Proceed directly with document upload
      updateDocumentUploadMutation.mutate(
        { ...data, userId },
        {
          onSuccess: () => {
            toast.success("Documents uploaded successfully");
            setCurrentFormStep(UserFormStepEnum.REVIEW_SUBMIT);
          },
          onError: (err: any) => {
            toast.error(getApiErrorMessage(err, "Error uploading documents"));
          },
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const handleReviewSubmit = async () => {
    if (!userId) {
      toast.error("User ID not found. Please complete previous steps first.");
      return;
    }

    const resolvedPermissionDesignation = permissionDesignation || employeeDesignationId;
    // Only send designation for review submit
    const permissionsPayload = sanitizePermissionsForReviewSubmit({ designation: resolvedPermissionDesignation });

    updateReviewSubmitMutation.mutate(
      { userId, status: UserStatusEnum.ACTIVE, permissions: permissionsPayload },
      {
        onSuccess: () => {
          toast.success("User created successfully");
          setPermissionDesignation("");
          setPermissionBranchIds([]);
          // Invalidate and refetch users list so new user appears without manual refresh
          queryClient.invalidateQueries({ queryKey: [API_ROUTE.USER.ALL.ID] });
          queryClient.refetchQueries({ queryKey: [API_ROUTE.USER.ALL.ID] });
          // Clear store and all form contexts on success.
          resetUserForm();
          personalInfoForm.reset();
          contactInfoForm.reset({
            email: "",
            phone: "",
            phoneCountryCode: "+91",
            emergencyContact: "",
            emergencyContactCountryCode: "+91",
            currentAddress: {
              country: "",
              state: "",
              city: "",
              pincode: "",
              addressLine: "",
            },
            permanentAddress: {
              country: "",
              state: "",
              city: "",
              pincode: "",
              addressLine: "",
            },
          });
          employmentInfoForm.reset({ paymentMode: PaymentModeEnum.CASH });
          documentUploadForm.reset({ documents: createRequiredDocuments() });
          setGuardianType("");
          setPhoneCountryCode("+91");
          setEmergencyContactCountryCode("+91");
          setEditableAddressLine("");
          onSuccess?.();
          setTimeout(() => router.push(APP_ROUTE.USER.ALL.PATH), 400);
        },
        onError: (err: any) => {
          toast.error(getApiErrorMessage(err, "Error completing user creation"));
        },
      },
    );
  };

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-primary hover:underline flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        {userId && (
          <button
            type="button"
            onClick={() => {
              resetUserForm();
          personalInfoForm.reset();
          contactInfoForm.reset();
          employmentInfoForm.reset();
          documentUploadForm.reset({ documents: createRequiredDocuments() });
          setPermissionDesignation("");
          setPermissionBranchIds([]);
          toast.info("Form reset successfully");
            }}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
          >
            Clear Form
          </button>
        )}
      </div>

      {/* Step Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center flex-1">
                {/* Step */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      currentStepIndex > index
                        ? "bg-green-500 text-white"
                        : currentStepIndex === index
                          ? "bg-primary text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    }`}
                  >
                    {currentStepIndex > index ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>

                  <span
                    className={`mt-2 text-xs font-medium ${
                      currentStepIndex === index
                        ? "text-primary"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 flex items-center">
                    <div
                      className={`h-1 w-full mx-2 ${
                        currentStepIndex > index
                          ? "bg-green-500"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Render current step - continuing in next message due to length */}
      {currentStep === UserFormStepEnum.PERSONAL_INFO && (
        <PersonalInfoStep
          form={personalInfoForm}
          onSubmit={handlePersonalInfoSubmit}
          isLoading={isLoading}
          guardianType={guardianType}
          setGuardianType={setGuardianType}
          onCancel={() => router.back()}
        />
      )}

      {currentStep === UserFormStepEnum.CONTACT_INFO && (
        <ContactInfoStep
          form={contactInfoForm}
          onSubmit={handleContactInfoSubmit}
          isLoading={isLoading}
          onBack={() => setCurrentFormStep(UserFormStepEnum.PERSONAL_INFO)}
          phoneCountryCode={phoneCountryCode}
          setPhoneCountryCode={setPhoneCountryCode}
          emergencyContactCountryCode={emergencyContactCountryCode}
          setEmergencyContactCountryCode={setEmergencyContactCountryCode}
        />
      )}

      {currentStep === UserFormStepEnum.EMPLOYMENT_INFO && (
        <EmploymentInfoStep
          form={employmentInfoForm}
          onSubmit={handleEmploymentInfoSubmit}
          isLoading={isLoading}
          shouldCollectBankDetails={shouldCollectBankDetails}
          availableBranches={availableBranches}
          isFetchingNextBranchPage={isFetchingNextBranchPage}
          onBack={() => setCurrentFormStep(UserFormStepEnum.CONTACT_INFO)}
        />
      )}

      {currentStep === UserFormStepEnum.DOCUMENT_UPLOAD && (
        <div>
          <DocumentUploadStep
            form={documentUploadForm}
            onSubmit={handleDocumentUploadSubmit}
            isLoading={isLoading}
            documentFields={documentFields}
            appendDocument={appendDocument}
            removeDocument={removeDocument}
            sponsorCompanyOptions={sponsorCompanyOptions}
            shouldHideSponsorCompany={shouldHideSponsorCompany}
            onBack={() => setCurrentFormStep(UserFormStepEnum.EMPLOYMENT_INFO)}
            // Verification props no longer used - OCR verification disabled
            // verificationStatus={verificationStatus}
            // editableAddressLine={editableAddressLine}
            // setEditableAddressLine={setEditableAddressLine}
            // contactInfoData={contactInfoData}
          />
        </div>
      )}

      {currentStep === UserFormStepEnum.REVIEW_SUBMIT && (
        <ReviewStep
          completeUserInfo={completeUserInfo}
          onSubmit={handleReviewSubmit}
          isLoading={isLoading}
          onBack={() => setCurrentFormStep(UserFormStepEnum.DOCUMENT_UPLOAD)}
          shouldHideSponsorCompany={shouldHideSponsorCompany}
          permissionSummary={undefined}
        />
      )}
    </div>
  );
}

// Helper components for each step
function PersonalInfoStep({
  form,
  onSubmit,
  isLoading,
  guardianType,
  setGuardianType,
  onCancel,
}: any) {
  // Get all countries for nationality dropdown
  const countries = useMemo(() => getAllCountries(), []);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter full name"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label
                htmlFor="dob"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Date of Birth *
              </label>
              <input
                id="dob"
                type="date"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                {...form.register("dob")}
              />
              {form.formState.errors.dob && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {form.formState.errors.dob.message}
                </p>
              )}
            </div>

            {/* Blood Group */}
            <div className="space-y-2">
              <label
                htmlFor="bloodGroup"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Blood Group
              </label>
              <select
                id="bloodGroup"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                {...form.register("bloodGroup")}
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Gender
              </label>
              <select
                id="gender"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                {...form.register("gender")}
              >
                <option value="">Select gender</option>
                <option value={GenderEnum.MALE}>{GenderEnum.MALE}</option>
                <option value={GenderEnum.FEMALE}>{GenderEnum.FEMALE}</option>
                <option value={GenderEnum.OTHER}>{GenderEnum.OTHER}</option>
              </select>
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <label
                htmlFor="nationality"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nationality
              </label>
              <select
                id="nationality"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                {...form.register("nationality")}
              >
                <option value="">Select nationality</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reference By
              </label>
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)] gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Reference Name 
                  </label>
                  <input
                    type="text"
                    placeholder="Enter reference name"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border rounded-md"
                    {...form.register("referenceBy.name")}
                  />
                  {form.formState.errors.referenceBy?.name && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {form.formState.errors.referenceBy.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Country Code 
                  </label>
                  <CountryCodeSelector
                    value={form.watch("referenceBy.countryCode") || "+91"}
                    onValueChange={(val) =>
                      form.setValue("referenceBy.countryCode", val)
                    }
                    className="w-full"
                  />
                  {form.formState.errors.referenceBy?.countryCode && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {form.formState.errors.referenceBy.countryCode.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Contact Number 
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter contact number"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border rounded-md"
                    {...form.register("referenceBy.contactNumber")}
                  />
                  {form.formState.errors.referenceBy?.contactNumber && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {form.formState.errors.referenceBy.contactNumber.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Guardian Type */}
            <div className="space-y-4 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Guardian Type
              </label>
              <select
                value={guardianType}
                onChange={(e) => setGuardianType(e.target.value as any)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select guardian type</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="other">Other</option>
              </select>

              {guardianType === "father" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter father's name"
                      disabled={isLoading}
                      className="w-full px-3 py-2 border rounded-md"
                      {...form.register("parentGuardianDetails.fatherName")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Father's Occupation
                    </label>
                    <input
                      type="text"
                      placeholder="Enter occupation"
                      disabled={isLoading}
                      className="w-full px-3 py-2 border rounded-md"
                      {...form.register("parentGuardianDetails.fatherOccupation")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Father's Mobile
                    </label>
                    <div className="flex gap-2">
                      <CountryCodeSelector
                        value={form.watch("parentGuardianDetails.fatherMobileCountryCode") || "+91"}
                        onValueChange={(val) => form.setValue("parentGuardianDetails.fatherMobileCountryCode", val)}
                        className="w-28"
                      />
                      <input
                        type="tel"
                        placeholder="Enter mobile"
                        disabled={isLoading}
                        className="w-full px-3 py-2 border rounded-md"
                        {...form.register("parentGuardianDetails.fatherMobile")}
                      />
                    </div>
                  </div>
                </div>
              )}

              {guardianType === "mother" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium">
                      Mother's Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter mother's name"
                      disabled={isLoading}
                      className="w-full px-3 py-2 border rounded-md"
                      {...form.register("parentGuardianDetails.motherName")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Mother's Occupation
                    </label>
                    <input
                      type="text"
                      placeholder="Enter occupation"
                      disabled={isLoading}
                      className="w-full px-3 py-2 border rounded-md"
                      {...form.register("parentGuardianDetails.motherOccupation")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Mother's Mobile
                    </label>
                    <div className="flex gap-2">
                      <CountryCodeSelector
                        value={form.watch("parentGuardianDetails.motherMobileCountryCode") || "+91"}
                        onValueChange={(val) => form.setValue("parentGuardianDetails.motherMobileCountryCode", val)}
                        className="w-28"
                      />
                      <input
                        type="tel"
                        placeholder="Enter mobile"
                        disabled={isLoading}
                        className="w-full px-3 py-2 border rounded-md"
                        {...form.register("parentGuardianDetails.motherMobile")}
                      />
                    </div>
                  </div>
                </div>
              )}

              {guardianType === "other" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium">
                      Guardian Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter guardian name"
                      disabled={isLoading}
                      className="w-full px-3 py-2 border rounded-md"
                      {...form.register("parentGuardianDetails.otherName")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Relation
                    </label>
                    <input
                      type="text"
                      placeholder="Enter relation"
                      disabled={isLoading}
                      className="w-full px-3 py-2 border rounded-md"
                      {...form.register("parentGuardianDetails.otherRelation")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Occupation
                    </label>
                    <input
                      type="text"
                      placeholder="Enter occupation"
                      disabled={isLoading}
                      className="w-full px-3 py-2 border rounded-md"
                      {...form.register("parentGuardianDetails.otherOccupation")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Mobile</label>
                    <div className="flex gap-2">
                      <CountryCodeSelector
                        value={form.watch("parentGuardianDetails.otherMobileCountryCode") || "+91"}
                        onValueChange={(val) => form.setValue("parentGuardianDetails.otherMobileCountryCode", val)}
                        className="w-28"
                      />
                      <input
                        type="tel"
                        placeholder="Enter mobile"
                        disabled={isLoading}
                        className="w-full px-3 py-2 border rounded-md"
                        {...form.register("parentGuardianDetails.otherMobile")}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function ContactInfoStep({
  form,
  onSubmit,
  isLoading,
  onBack,
  phoneCountryCode,
  setPhoneCountryCode,
  emergencyContactCountryCode,
  setEmergencyContactCountryCode,
}: any) {
  const [currentPincodeLoading, setCurrentPincodeLoading] = useState(false);
  const [permanentPincodeLoading, setPermanentPincodeLoading] = useState(false);

  // Get all countries and states
  const countries = useMemo(() => getAllCountries(), []);
  const currentCountryCode = useMemo(() => {
    const selectedCountry = form.watch("currentAddress.country");
    return countries.find((c) => c.name === selectedCountry)?.code || null;
  }, [form.watch("currentAddress.country"), countries]);

  const permanentCountryCode = useMemo(() => {
    const selectedCountry = form.watch("permanentAddress.country");
    return countries.find((c) => c.name === selectedCountry)?.code || null;
  }, [form.watch("permanentAddress.country"), countries]);

  const currentStates = useMemo(() => {
    return currentCountryCode ? getStatesByCountry(currentCountryCode) : [];
  }, [currentCountryCode]);

  const permanentStates = useMemo(() => {
    return permanentCountryCode ? getStatesByCountry(permanentCountryCode) : [];
  }, [permanentCountryCode]);

  // Watch form values for controlled Select components
  const currentCountry = form.watch("currentAddress.country");
  const currentState = form.watch("currentAddress.state");
  const permanentCountry = form.watch("permanentAddress.country");
  const permanentState = form.watch("permanentAddress.state");

  // Auto-fill city, state, and country from pincode for current address
  const handleCurrentPincodeChange = async (pincode: string) => {
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      setCurrentPincodeLoading(true);
      const result = await fetchCityFromPincode(pincode);

      if (result) {
        form.setValue("currentAddress.city", result.city, {
          shouldValidate: true,
        });
        form.setValue("currentAddress.state", result.state, {
          shouldValidate: true,
        });
        form.setValue("currentAddress.country", result.country, {
          shouldValidate: true,
        });
        toast.success("City, state, and country auto-filled from pincode");
      } else {
        toast.error("Could not fetch location for this pincode");
      }
      setCurrentPincodeLoading(false);
    }
  };

  // Auto-fill city, state, and country from pincode for permanent address
  const handlePermanentPincodeChange = async (pincode: string) => {
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      setPermanentPincodeLoading(true);
      const result = await fetchCityFromPincode(pincode);
      if (result) {
        form.setValue("permanentAddress.city", result.city, {
          shouldValidate: true,
        });
        form.setValue("permanentAddress.state", result.state, {
          shouldValidate: true,
        });
        form.setValue("permanentAddress.country", result.country, {
          shouldValidate: true,
        });
        toast.success("City, state, and country auto-filled from pincode");
      } else {
        toast.error("Could not fetch location for this pincode");
      }
      setPermanentPincodeLoading(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email *
              </label>
              <input
                type="email"
                placeholder="Enter email"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone *
              </label>
              <div className="flex gap-2">
                <CountryCodeSelector
                  value={phoneCountryCode}
                  onValueChange={(value) => {
                    setPhoneCountryCode(value);
                    form.setValue("phoneCountryCode", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  placeholder="Code"
                  disabled={isLoading}
                  required
                />
                <input
                  type="text"
                  placeholder="Enter phone number (numbers only)"
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  {...form.register("phone")}
                  inputMode="numeric"
                />
              </div>
              {(form.formState.errors.phone ||
                form.formState.errors.phoneCountryCode) && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.phone?.message ||
                    form.formState.errors.phoneCountryCode?.message}
                </p>
              )}
            </div>

            {/* Emergency Contact */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Emergency Contact
              </label>
              <div className="flex gap-2">
                <CountryCodeSelector
                  value={emergencyContactCountryCode || ""}
                  onValueChange={(value) => {
                    setEmergencyContactCountryCode(value);
                    form.setValue("emergencyContactCountryCode", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  placeholder="Code"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  placeholder="Enter emergency contact (numbers only)"
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  {...form.register("emergencyContact")}
                  inputMode="numeric"
                />
              </div>
              {(form.formState.errors.emergencyContact ||
                form.formState.errors.emergencyContactCountryCode) && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.emergencyContact?.message ||
                    form.formState.errors.emergencyContactCountryCode?.message}
                </p>
              )}
            </div>

            {/* Permanent Address Section */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
                Permanent Address (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pincode
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter 6-digit pincode"
                      disabled={isLoading || permanentPincodeLoading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      {...form.register("permanentAddress.pincode")}
                      onChange={(e) => {
                        form.setValue(
                          "permanentAddress.pincode",
                          e.target.value,
                        );
                        handlePermanentPincodeChange(e.target.value);
                      }}
                      maxLength={6}
                    />
                    {permanentPincodeLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
                      </div>
                    )}
                  </div>
                  {form.formState.errors.permanentAddress?.pincode && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.permanentAddress.pincode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    City{" "}
                    <span className="text-xs text-gray-500">
                      (Auto-filled from pincode, editable)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city or use pincode"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    {...form.register("permanentAddress.city")}
                  />
                  {form.formState.errors.permanentAddress?.city && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.permanentAddress.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    State{" "}
                    <span className="text-xs text-gray-500">
                      (Auto-filled from pincode, editable)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter state or use pincode"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    {...form.register("permanentAddress.state")}
                  />
                  {form.formState.errors.permanentAddress?.state && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.permanentAddress.state.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Country{" "}
                    <span className="text-xs text-gray-500">
                      (Auto-filled from pincode, editable)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter country or use pincode"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    {...form.register("permanentAddress.country")}
                  />
                  {form.formState.errors.permanentAddress?.country && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.permanentAddress.country.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address Line
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal block mt-1">
                      (Address should be similar to uploaded document address)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter address line"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    {...form.register("permanentAddress.addressLine")}
                  />
                  {form.formState.errors.permanentAddress?.addressLine && (
                    <p className="text-xs text-red-600">
                      {
                        form.formState.errors.permanentAddress.addressLine
                          .message
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Current Address Section */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
                Current Address (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pincode
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter 6-digit pincode"
                      disabled={isLoading || currentPincodeLoading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      {...form.register("currentAddress.pincode")}
                      onChange={(e) => {
                        form.setValue("currentAddress.pincode", e.target.value);
                        handleCurrentPincodeChange(e.target.value);
                      }}
                      maxLength={6}
                    />
                    {currentPincodeLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
                      </div>
                    )}
                  </div>
                  {form.formState.errors.currentAddress?.pincode && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.currentAddress.pincode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    City{" "}
                    <span className="text-xs text-gray-500">
                      (Auto-filled from pincode, editable)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city or use pincode"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    {...form.register("currentAddress.city")}
                  />
                  {form.formState.errors.currentAddress?.city && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.currentAddress.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    State{" "}
                    <span className="text-xs text-gray-500">
                      (Auto-filled from pincode, editable)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter state or use pincode"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    {...form.register("currentAddress.state")}
                  />
                  {form.formState.errors.currentAddress?.state && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.currentAddress.state.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Country{" "}
                    <span className="text-xs text-gray-500">
                      (Auto-filled from pincode, editable)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter country or use pincode"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    {...form.register("currentAddress.country")}
                  />
                  {form.formState.errors.currentAddress?.country && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.currentAddress.country.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address Line
                  </label>
                  <input
                    type="text"
                    placeholder="Enter address line"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    {...form.register("currentAddress.addressLine")}
                  />
                  {form.formState.errors.currentAddress?.addressLine && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.currentAddress.addressLine.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function EmploymentInfoStep({
  form,
  onSubmit,
  isLoading,
  shouldCollectBankDetails,
  availableBranches,
  isFetchingNextBranchPage,
  onBack,
}: any) {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Employment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branch */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Branch *
              </label>
              <Combobox
                items={availableBranches.map((branch: any) => ({
                  value: branch._id,
                  label: branch.branchName,
                }))}
                value={form.watch("branchId") || undefined}
                onChange={(value) => {
                  form.setValue("branchId", typeof value === "string" ? value : "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                placeholder="Select branch"
                disabled={isLoading || isFetchingNextBranchPage}
                className="w-full"
              />
              <input type="hidden" {...form.register("branchId")} />
              {form.formState.errors.branchId && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.branchId.message}
                </p>
              )}
            </div>

            {/* Basic Salary */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Basic Salary *
              </label>
              <input
                type="number"
                placeholder="Enter basic salary"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                {...form.register("baseSalary", { valueAsNumber: true })}
              />
              {form.formState.errors.baseSalary && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.baseSalary.message}
                </p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Currency *
              </label>
              <select
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                {...form.register("currency")}
              >
                <option value="">Select currency</option>
                {EMPLOYEE_CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Joining Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Joining Date *
              </label>
              <input
                type="date"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                {...form.register("dateOfJoining", {
                  required: "Date of joining is required",
                })}
              />
              {form.formState.errors.dateOfJoining && (
                <p className="text-xs text-red-600">
                  {/* {form.formState.errors.dateOfJoining} */}
                </p>
              )}
            </div>

            {/* Payment Mode */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Mode *
              </label>
              <select
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                {...form.register("paymentMode")}
              >
                <option value="">Select payment mode</option>
                <option value="CASH">Cash</option>
                <option value="ACCOUNT">Bank Account</option>
              </select>
              {form.formState.errors.paymentMode && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.paymentMode.message}
                </p>
              )}
            </div>

            {/* Bank Details - Conditional */}
            {shouldCollectBankDetails && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">
                    Bank Account Details
                  </h3>
                  {form.formState.errors.bankAccount && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.bankAccount.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter bank name"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border rounded-md"
                    {...form.register("bankAccount.bankName")}
                  />
                  {form.formState.errors.bankAccount?.bankName && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.bankAccount.bankName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter account holder name"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border rounded-md"
                    {...form.register("bankAccount.bankHolderName")}
                  />
                  {form.formState.errors.bankAccount?.bankHolderName && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.bankAccount.bankHolderName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter account number"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border rounded-md"
                    {...form.register("bankAccount.accountNumber")}
                  />
                  {form.formState.errors.bankAccount?.accountNumber && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.bankAccount.accountNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter IFSC code"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border rounded-md"
                    {...form.register("bankAccount.ifsc")}
                  />
                  {form.formState.errors.bankAccount?.ifsc && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.bankAccount.ifsc.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function PermissionStep({
  designation,
  setDesignation,
  branchIds,
  setBranchIds,
  availableRoles,
  availableBranches,
  onSubmit,
  onBack,
  isLoading,
}: {
  designation: string;
  setDesignation: (v: string) => void;
  branchIds: string[];
  setBranchIds: (v: string[]) => void;
  availableRoles: any[];
  availableBranches: any[];
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const selectedRole = availableRoles.find((r: any) => r._id === designation);
  const roleNameLower = String(selectedRole?.roleName ?? "").toLowerCase();
  const isEmployeeDesignation = Boolean(
    selectedRole && (roleNameLower === "employee" || roleNameLower === "employees"),
  );

  const toggleBranch = (branchId: string) => {
    setBranchIds(
      branchIds.includes(branchId)
        ? branchIds.filter((id) => id !== branchId)
        : [...branchIds, branchId],
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Set designation and branches for this user.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Designation
          </label>
          <select
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          >
            <option value="">Select designation</option>
            {availableRoles?.map((role: any) => (
              <option key={role._id} value={role._id}>
                {role.roleName}
              </option>
            ))}
          </select>
        </div>
        {!isEmployeeDesignation && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Branches (select one or more)
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {availableBranches?.length === 0 ? (
                <p className="text-sm text-gray-500">No branches available</p>
              ) : (
                availableBranches?.map((branch: any) => (
                  <label
                    key={branch._id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={branchIds.includes(branch._id)}
                      onChange={() => toggleBranch(branch._id)}
                      disabled={isLoading}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{branch.branchName}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button type="button" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? "Saving..." : "Next"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function DocumentUploadStep({
  form,
  onSubmit,
  isLoading,
  documentFields,
  appendDocument,
  removeDocument,
  sponsorCompanyOptions = [],
  shouldHideSponsorCompany = false,
  onBack,
  verificationStatus, // Still passed but no longer used
  editableAddressLine, // Still passed but no longer used
  setEditableAddressLine, // Still passed but no longer used
  contactInfoData, // Still passed but no longer used
}: any) {
  const isRequiredDocumentCard = (index: number) => index < REQUIRED_EMPLOYEE_DOCUMENT_TYPES.length;

  const handleRemoveDocument = (index: number) => {
    if (isRequiredDocumentCard(index)) {
      toast.error(`${DocumentTypeLabels[REQUIRED_EMPLOYEE_DOCUMENT_TYPES[index]]} is required.`);
      return;
    }

    removeDocument(index);
  };

  // Extract place of birth from extracted text - DISABLED (OCR verification removed)
  // const extractPlaceOfBirth = (text: string) => {
  //   if (!text) return "Not found";
  //   const regex = /place\s+of\s+(?:birth|issue)\s+([^/]+)/i;
  //   const match = text.match(regex);
  //   return match ? match[1].trim() : "Not found";
  // };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
    >
      {/* Address verification alerts removed - OCR verification is disabled */}
      {/* {verificationStatus?.verified === true && (
        <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <div className="text-xl">✅</div>
            <div>
              <h3 className="font-semibold text-green-900">Address Verified Successfully</h3>
              <p className="mt-1 text-sm text-green-800">
                Your address matches the document ({(verificationStatus.similarity * 100).toFixed(0)}% similarity)
              </p>
            </div>
          </div>
        </div>
      )} */}

      {/* {verificationStatus?.error && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="text-xl">❌</div>
            <div>
              <h3 className="font-semibold text-red-900">Address Verification Failed</h3>
              <p className="mt-1 text-sm text-red-800">
                Please update your address to match the document and try again.
              </p>
            </div>
          </div>
        </div>
      )} */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {documentFields.map((field: any, index: number) => (
              <div
                key={field.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Document {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(index)}
                    disabled={isLoading || isRequiredDocumentCard(index)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Document Type *
                    </label>
                    <select
                      disabled={isLoading || isRequiredDocumentCard(index)}
                      className="h-11 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      {...form.register(`documents.${index}.docType`, {
                        onChange: (event: any) => {
                          if (event.target.value !== UserDocumentTypeEnum.VISA) {
                            form.setValue(`documents.${index}.visaDetails`, undefined);
                            form.clearErrors(`documents.${index}.visaDetails`);
                          }
                        },
                      })}
                    >
                      <option value="">Select document type</option>
                      {Object.values(UserDocumentTypeEnum).map((value) => (
                        <option key={value} value={value}>
                          {DocumentTypeLabels[value]}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.documents?.[index]?.docType && (
                      <p className="text-xs text-red-600">
                        {
                          form.formState.errors.documents[index]?.docType
                            ?.message
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Document Number *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter document number"
                      disabled={isLoading}
                      className="h-11 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      {...form.register(`documents.${index}.documentNumber`)}
                    />
                    {form.formState.errors.documents?.[index]
                      ?.documentNumber && (
                      <p className="text-xs text-red-600">
                        {
                          form.formState.errors.documents[index]?.documentNumber
                            ?.message
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      disabled={isLoading}
                      className="h-11 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      {...form.register(`documents.${index}.expiryDate`)}
                    />
                    {form.formState.errors.documents?.[index]?.expiryDate && (
                      <p className="text-xs text-red-600">
                        {
                          form.formState.errors.documents[index]?.expiryDate
                            ?.message
                        }
                      </p>
                    )}
                  </div>

                  {form.watch(`documents.${index}.docType`) ===
                    UserDocumentTypeEnum.VISA && (
                    <>
                      <div className="col-span-2 space-y-2 pt-2">
                        <h3 className="border-b border-gray-100 pb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Visa Details
                        </h3>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Visa Type
                        </label>
                        <select
                          disabled={isLoading}
                          className="h-11 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          {...form.register(`documents.${index}.visaDetails.visaType`, {
                            validate: (value: string) => {
                              if (
                                form.watch(`documents.${index}.docType`) === UserDocumentTypeEnum.VISA &&
                                !value
                              ) {
                                return "Visa type is required";
                              }

                              return true;
                            },
                          })}
                        >
                          <option value="">Select visa type</option>
                          {Object.values(VisaTypeEnum).map((value) => (
                            <option key={value} value={value}>
                              {value.charAt(0).toUpperCase() + value.slice(1)}
                            </option>
                          ))}
                        </select>
                        {form.formState.errors.documents?.[index]?.visaDetails
                          ?.visaType && (
                          <p className="text-xs text-red-600">
                            {
                              form.formState.errors.documents[index]
                                ?.visaDetails?.visaType?.message
                            }
                          </p>
                        )}
                      </div>

                      {!shouldHideSponsorCompany && (
                        <div className="space-y-2">
                          {/* Sponsor company comes from the sponsor-company master data and is
                              hidden for roles that are not allowed to manage visa sponsorship. */}
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Sponsor Company
                          </label>
                          <select
                            disabled={isLoading}
                            className="h-11 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            {...form.register(`documents.${index}.visaDetails.sponsorCompany`, {
                              validate: (value: string) => {
                                if (
                                  !shouldHideSponsorCompany &&
                                  form.watch(`documents.${index}.docType`) === UserDocumentTypeEnum.VISA &&
                                  !value
                                ) {
                                  return "Sponsor company is required";
                                }

                                return true;
                              },
                            })}
                          >
                            <option value="">Select sponsor company</option>
                            {sponsorCompanyOptions.map((companyName: string) => (
                              <option key={companyName} value={companyName}>
                                {companyName}
                              </option>
                            ))}
                          </select>
                          {form.formState.errors.documents?.[index]?.visaDetails
                            ?.sponsorCompany && (
                            <p className="text-xs text-red-600">
                              {
                                form.formState.errors.documents[index]
                                  ?.visaDetails?.sponsorCompany?.message
                              }
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-2 md:gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Front Image/Document (Optional)
                    </label>
                    <SingleFileUpload
                      folder="documents"
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                      label="Upload Front Side"
                      helperText="JPEG, PNG, GIF or WebP"
                      showPreview={true}
                      dropzoneClassName="min-h-[150px] rounded-xl border-gray-200 bg-gray-50/40"
                      previewClassName="rounded-xl border-gray-200"
                      onUploadSuccess={(url) => {
                        form.setValue(`documents.${index}.frontImg`, url);
                      }}
                      onUploadError={(error) => {
                        toast.error(`Upload failed: ${error.message}`);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Back Image/Document (Optional)
                    </label>
                    <SingleFileUpload
                      folder="documents"
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                      label="Upload Back Side"
                      helperText="JPEG, PNG, GIF or WebP"
                      showPreview={true}
                      dropzoneClassName="min-h-[150px] rounded-xl border-gray-200 bg-gray-50/40"
                      previewClassName="rounded-xl border-gray-200"
                      onUploadSuccess={(url) => {
                        form.setValue(`documents.${index}.backImg`, url);
                      }}
                      onUploadError={(error) => {
                        toast.error(`Upload failed: ${error.message}`);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                appendDocument(createDocumentForType())
              }
              disabled={isLoading}
              className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Document
            </button>

            {/* Address comparison section removed - OCR verification is disabled */}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t border-gray-100 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function ReviewStep({ completeUserInfo, onSubmit, isLoading, onBack, permissionSummary, shouldHideSponsorCompany = false }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review & Submit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Permission Section (when step was shown) */}
            {permissionSummary && (permissionSummary.designationName || (permissionSummary.branchNames?.length > 0)) && (
              <div className="border-b pb-6">
                <h3 className="font-semibold mb-4">Permission</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissionSummary.designationName && (
                    <div>
                      <p className="text-sm text-gray-500">Designation</p>
                      <p className="font-medium">{permissionSummary.designationName}</p>
                    </div>
                  )}
                  {permissionSummary.branchNames?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Branches</p>
                      <p className="font-medium">{permissionSummary.branchNames.join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Personal Info Section */}
            {completeUserInfo?.personalInfo && (
              <div className="border-b pb-6">
                <h3 className="font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">
                      {completeUserInfo.personalInfo.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">
                     {completeUserInfo?.personalInfo?.dob?.split("T")[0]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium">
                      {completeUserInfo.personalInfo.gender}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Blood Group</p>
                    <p className="font-medium">
                      {completeUserInfo.personalInfo.bloodGroup}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nationality</p>
                    <p className="font-medium">
                      {completeUserInfo.personalInfo.nationality}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Marital Status</p>
                    <p className="font-medium">
                      {completeUserInfo.personalInfo.maritalStatus || "-"}
                    </p>
                  </div>
                </div>

                {/* Guardian Details */}
                {completeUserInfo.personalInfo.parentGuardianDetails && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Guardian Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {completeUserInfo.personalInfo.parentGuardianDetails
                        .fatherName && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">
                              Father's Name
                            </p>
                            <p className="text-sm">
                              {
                                completeUserInfo.personalInfo
                                  .parentGuardianDetails.fatherName
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Father's Occupation
                            </p>
                            <p className="text-sm">
                              {completeUserInfo.personalInfo
                                .parentGuardianDetails.fatherOccupation || "-"}
                            </p>
                          </div>
                        </>
                      )}
                      {completeUserInfo.personalInfo.parentGuardianDetails
                        .motherName && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">
                              Mother's Name
                            </p>
                            <p className="text-sm">
                              {
                                completeUserInfo.personalInfo
                                  .parentGuardianDetails.motherName
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Mother's Occupation
                            </p>
                            <p className="text-sm">
                              {completeUserInfo.personalInfo
                                .parentGuardianDetails.motherOccupation || "-"}
                            </p>
                          </div>
                        </>
                      )}
                      {completeUserInfo.personalInfo.parentGuardianDetails
                        .otherName && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">
                              Guardian Name
                            </p>
                            <p className="text-sm">
                              {
                                completeUserInfo.personalInfo
                                  .parentGuardianDetails.otherName
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Relation</p>
                            <p className="text-sm">
                              {completeUserInfo.personalInfo
                                .parentGuardianDetails.otherRelation || "-"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contact Info Section */}
            {completeUserInfo?.contactInfo && (
              <div className="border-b pb-6">
                <h3 className="font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">
                      {completeUserInfo.contactInfo.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">
                      {completeUserInfo.contactInfo.phoneCountryCode && (
                        <span className="inline">
                          {completeUserInfo.contactInfo.phoneCountryCode}{" "}
                        </span>
                      )}
                      {completeUserInfo.contactInfo.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Emergency Contact</p>
                    <p className="font-medium">
                      {completeUserInfo.contactInfo
                        .emergencyContactCountryCode && (
                        <span className="inline">
                          {
                            completeUserInfo.contactInfo
                              .emergencyContactCountryCode
                          }{" "}
                        </span>
                      )}
                      {completeUserInfo.contactInfo.emergencyContact || "-"}
                    </p>
                  </div>
                </div>

                {/* Address Details */}
                {(completeUserInfo.contactInfo.currentAddress ||
                  completeUserInfo.contactInfo.permanentAddress) && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-4">Address Details</p>
                    {/* Current Address */}
                    {completeUserInfo.contactInfo.currentAddress && (
                      <div className="mb-6">
                        <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                          Current Address
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {completeUserInfo.contactInfo.currentAddress
                            .pincode && (
                            <div>
                              <p className="text-xs text-gray-500">Pincode</p>
                              <p className="text-sm font-medium">
                                {
                                  completeUserInfo.contactInfo.currentAddress
                                    .pincode
                                }
                              </p>
                            </div>
                          )}
                          {completeUserInfo.contactInfo.currentAddress.city && (
                            <div>
                              <p className="text-xs text-gray-500">City</p>
                              <p className="text-sm font-medium">
                                {
                                  completeUserInfo.contactInfo.currentAddress
                                    .city
                                }
                              </p>
                            </div>
                          )}
                          {completeUserInfo.contactInfo.currentAddress
                            .state && (
                            <div>
                              <p className="text-xs text-gray-500">State</p>
                              <p className="text-sm font-medium">
                                {
                                  completeUserInfo.contactInfo.currentAddress
                                    .state
                                }
                              </p>
                            </div>
                          )}
                          {completeUserInfo.contactInfo.currentAddress
                            .country && (
                            <div>
                              <p className="text-xs text-gray-500">Country</p>
                              <p className="text-sm font-medium">
                                {
                                  completeUserInfo.contactInfo.currentAddress
                                    .country
                                }
                              </p>
                            </div>
                          )}
                          {completeUserInfo.contactInfo.currentAddress
                            .addressLine && (
                            <div className="md:col-span-2">
                              <p className="text-xs text-gray-500">
                                Address Line
                              </p>
                              <p className="text-sm font-medium">
                                {
                                  completeUserInfo.contactInfo.currentAddress
                                    .addressLine
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Permanent Address */}
                    {completeUserInfo.contactInfo.permanentAddress && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                          Permanent Address
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {completeUserInfo.contactInfo.permanentAddress
                            .pincode && (
                            <div>
                              <p className="text-xs text-gray-500">Pincode</p>
                              <p className="text-sm font-medium">
                                {
                                  completeUserInfo.contactInfo.permanentAddress
                                    .pincode
                                }
                              </p>
                            </div>
                          )}
                          {completeUserInfo.contactInfo.permanentAddress
                            .city && (
                            <div>
                              <p className="text-xs text-gray-500">City</p>
                              <p className="text-sm font-medium">
                                {
                                  completeUserInfo.contactInfo.permanentAddress
                                    .city
                                }
                              </p>
                            </div>
                          )}
                          {completeUserInfo.contactInfo.permanentAddress
                            .state && (
                            <div>
                              <p className="text-xs text-gray-500">State</p>
                              <p className="text-sm font-medium">
                                {
                                  completeUserInfo.contactInfo.permanentAddress
                                    .state
                                }
                              </p>
                            </div>
                          )}
                          {completeUserInfo.contactInfo.permanentAddress
                            .country && (
                            <div>
                              <p className="text-xs text-gray-500">Country</p>
                              <p className="text-sm font-medium">
                                {
                                  completeUserInfo.contactInfo.permanentAddress
                                    .country
                                }
                              </p>
                            </div>
                          )}
                          {completeUserInfo.contactInfo.permanentAddress
                            .addressLine && (
                            <div className="md:col-span-2">
                              <p className="text-xs text-gray-500">
                                Address Line
                              </p>
                              <p className="text-sm font-medium">
                                {
                                  completeUserInfo.contactInfo.permanentAddress
                                    .addressLine
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Employment Info Section */}
            {completeUserInfo?.employmentInfo && (
              <div className="border-b pb-6">
                <h3 className="font-semibold mb-4">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completeUserInfo.employmentInfo.employeeId && (
                    <div>
                      <p className="text-sm text-gray-500">Employee ID</p>
                      <p className="font-medium">
                        {completeUserInfo.employmentInfo.employeeId}
                      </p>
                    </div>
                  )}
                  {completeUserInfo.employmentInfo.uniqueWorkerId && (
                    <div>
                      <p className="text-sm text-gray-500">Unique Worker ID</p>
                      <p className="font-medium">
                        {completeUserInfo.employmentInfo.uniqueWorkerId}
                      </p>
                    </div>
                  )}
                  {completeUserInfo.employmentInfo.dateOfJoining && (
                    <div>
                      <p className="text-sm text-gray-500">Date of Joining</p>
                      <p className="font-medium">
                        {completeUserInfo?.employmentInfo?.dateOfJoining?.split("T")[0]}
                      </p>
                    </div>
                  )}
                  {completeUserInfo.employmentInfo.branchId && (
                    <div>
                      <p className="text-sm text-gray-500">Branch</p>
                      <p className="font-medium">
                        {completeUserInfo?.employmentInfo?.branchId?.branchName}
                      </p>
                    </div>
                  )}
                  {completeUserInfo.employmentInfo.companyId && (
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium">
                        {completeUserInfo?.employmentInfo?.companyId?.legalName}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Basic Salary</p>
                    <p className="font-medium">
                      {completeUserInfo?.employmentInfo?.baseSalary}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Currency</p>
                    <p className="font-medium">
                      {completeUserInfo?.employmentInfo?.currency}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Section */}
            {completeUserInfo?.documentInfo?.documents &&
              completeUserInfo.documentInfo.documents.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Documents</h3>
                  <div className="space-y-2">
                    {completeUserInfo.documentInfo.documents.map(
                      (doc: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md"
                        >
                          <p className="text-sm mb-2">
                            <span className="font-medium">{doc.docType}:</span>{" "}
                            {doc.documentNumber}
                          </p>
                          {doc.docType === UserDocumentTypeEnum.VISA && doc.visaDetails && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="grid grid-cols-2 gap-2">
                                {doc.visaDetails.visaType && (
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Visa Type
                                    </p>
                                    <p className="text-sm font-medium">
                                      {doc.visaDetails.visaType
                                        .charAt(0)
                                        .toUpperCase() +
                                        doc.visaDetails.visaType.slice(1)}
                                    </p>
                                  </div>
                                )}
                                {!shouldHideSponsorCompany && doc.visaDetails.sponsorCompany && (
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Sponsor Company
                                    </p>
                                    <p className="text-sm font-medium">
                                      {doc.visaDetails.sponsorCompany}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {(doc.frontImg || doc.backImg) && (
                            <div className="flex gap-4 mt-3">
                              {doc.frontImg && (
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs text-gray-500 font-medium">
                                    Front
                                  </p>
                                  <Image
                                    src={doc.frontImg}
                                    alt="Front"
                                    width={96}
                                    height={96}
                                    className="object-cover rounded border"
                                    unoptimized
                                  />
                                </div>
                              )}

                              {doc.backImg && (
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs text-gray-500 font-medium">
                                    Back
                                  </p>
                                  <Image
                                    src={doc.backImg}
                                    alt="Back"
                                    width={96}
                                    height={96}
                                    className="object-cover rounded border"
                                    unoptimized
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
