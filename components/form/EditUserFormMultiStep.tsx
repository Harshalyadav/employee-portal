"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getAdminHeadAccessRole } from "@/lib/admin-head-access";

import { getAllCountries, getStatesByCountry } from "@/lib/location-utils";
import { fetchCityFromPincode } from "@/lib/pincode-utils";
import { CountryCodeSelector } from "@/components/form/CountryCodeSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SingleFileUpload } from "@/components/upload";
import { useInfiniteRoles, useAssignableRoles } from "@/hooks/query/role.hook";
import { useInfiniteBranches } from "@/hooks/query/useBranch";
import { useSponsorCompanies } from "@/hooks/query/sponsor-company.hook";
import { useVerifyUserDocument } from "@/hooks/query/user-document.hook";
import {
  useGetCompleteUserInfo,
  useUpdateContactInfo,
  useUpdateDocumentUpload,
  useUpdateEmploymentInfo,
  useUpdatePersonalInfo,
  useUpdateReviewSubmit,
  useUpdatePermissions,
} from "@/hooks/query/user.hook";
import { getSession } from "@/lib/session";
import { APP_ROUTE, API_ROUTE } from "@/routes";
import {
  contactInfoSchema,
  ContactInfoSchema,
  editContactInfoSchema,
  EditContactInfoSchema,
  DocumentTypeLabels,
  documentUploadSchema,
  DocumentUploadSchema,
  employmentInfoSchema,
  EmploymentInfoSchema,
  GenderEnum,
  PaymentModeEnum,
  personalInfoSchema,
  personalInfoSchemaAdminOptional,
  PersonalInfoSchema,
  REQUIRED_EMPLOYEE_DOCUMENT_TYPES,
  UserDocumentTypeEnum,
  UserFormStepEnum,
  UserStatusEnum,
  VerificationStatusEnum,
  VerificationStatusLabels,
  VisaTypeEnum,
} from "@/types";
import { LoadingState } from "../LoadingState";
import Image from "next/image";
import { Badge } from "../ui";
import { EMPLOYEE_CURRENCY_OPTIONS } from "@/config/currency-options";
import { formatDate } from "@/lib/utils";
import { COUNTRY_CODES } from "@/config/country-code";
import { useAppStore } from "@/stores";

interface EditUserFormMultiStepProps {
  userId: string;
  onSuccess?: () => void;
  /** When true, hides the top Back link (page provides header like /advances/.../edit). */
  embeddedInPageShell?: boolean;
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
  verificationStatus: VerificationStatusEnum.PENDING,
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

const normalizeUserDocumentType = (
  value?: string | UserDocumentTypeEnum | null,
): UserDocumentTypeEnum | "" => {
  const rawValue = String(value || "").trim().toLowerCase();
  if (Object.values(UserDocumentTypeEnum).includes(rawValue as UserDocumentTypeEnum)) {
    return rawValue as UserDocumentTypeEnum;
  }
  return "";
};

export function EditUserFormMultiStep({
  userId,
  onSuccess,
  embeddedInPageShell = false,
}: EditUserFormMultiStepProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const [guardianType, setGuardianType] = useState<
    "father" | "mother" | "other" | ""
  >("");
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>("");
  const [emergencyContactCountryCode, setEmergencyContactCountryCode] =
    useState<string>("");

  // Get initial step from URL params, default to PERSONAL_INFO
  const initialStepParam = searchParams?.get("initialStep");
  const [currentStep, setCurrentStep] = useState<UserFormStepEnum>(
    initialStepParam === "DOCUMENT_UPLOAD"
      ? UserFormStepEnum.DOCUMENT_UPLOAD
      : UserFormStepEnum.PERSONAL_INFO,
  );

  // Mutations - MUST be called before any conditional returns
  const updatePersonalInfoMutation = useUpdatePersonalInfo();
  const updateContactInfoMutation = useUpdateContactInfo();
  const updateEmploymentInfoMutation = useUpdateEmploymentInfo();
  const updateDocumentUploadMutation = useUpdateDocumentUpload();

  const updateReviewSubmitMutation = useUpdateReviewSubmit();
  const updatePermissionsMutation = useUpdatePermissions();
  // Fetch complete user data
  const {
    data: completeUserInfo,
    isLoading: loadingUserInfo,
    refetch: refetchUserInfo,
  } = useGetCompleteUserInfo(userId || undefined);

  // Derive isPendingUser from user status
  const isPendingUser = completeUserInfo?.status === UserStatusEnum.PENDING;

  // Resolve access through the shared helper so populated role objects and permissions.designation
  // behave the same way here as they do in the rest of the admin UI.
  const accessRole = getAdminHeadAccessRole(user);
  const shouldHideSponsorCompany =
    accessRole === "HR_HEAD" || accessRole === "ACCOUNT_HEAD";
  const isHrHeadReadonly = accessRole === "HR_HEAD";

  const [permissionDesignation, setPermissionDesignation] = useState<string>("");
  const [permissionBranchIds, setPermissionBranchIds] = useState<string[]>([]);

  const roleFilters = useMemo(() => ({ page: 1, limit: 100 }), []);
  const {
    data: rolesPages,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteRoles(roleFilters);

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

  const isEmployeeDesignationEdit = useMemo(() => {
    const role = permissionRolesForLookup.find((r: any) => r._id === permissionDesignation);
    return Boolean(role && String(role.roleName || "").toLowerCase() === "employee");
  }, [permissionRolesForLookup, permissionDesignation]);

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

  useEffect(() => {
    if (isEmployeeDesignationEdit) setPermissionBranchIds([]);
  }, [isEmployeeDesignationEdit]);

  // Create a ref to track if we should enforce strict validation for referenceBy
  const shouldValidateReferencByRef = useRef<boolean>(true);

  // Update the ref whenever isEmployeeDesignationEdit changes
  useEffect(() => {
    shouldValidateReferencByRef.current = isEmployeeDesignationEdit;
  }, [isEmployeeDesignationEdit]);

  // Step forms
  // Use a custom validator that adapts based on user role
  const getPersonalInfoSchema = () => {
    return shouldValidateReferencByRef.current ? personalInfoSchema : personalInfoSchemaAdminOptional;
  };

  const personalInfoForm = useForm<PersonalInfoSchema>({
    resolver: async (data, context, options) => {
      const schema = getPersonalInfoSchema();
      return zodResolver(schema)(data, context, options);
    },
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

  const contactInfoForm = useForm<EditContactInfoSchema>({
    resolver: zodResolver(editContactInfoSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      phone: "",
      phoneCountryCode: "",
      emergencyContact: "",
      emergencyContactCountryCode: "",
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

  // Auto-navigate to current step for pending users
  useEffect(() => {
    if (isPendingUser && completeUserInfo?.nextStepKey) {
      setCurrentStep(
        completeUserInfo.nextStepKey === UserFormStepEnum.PERMISSION
          ? UserFormStepEnum.DOCUMENT_UPLOAD
          : (completeUserInfo.nextStepKey as UserFormStepEnum),
      );
    }
  }, [isPendingUser, completeUserInfo?.nextStepKey]);

  useEffect(() => {
    if (currentStep === UserFormStepEnum.PERMISSION) {
      setCurrentStep(UserFormStepEnum.DOCUMENT_UPLOAD);
    }
  }, [currentStep]);

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

  // Clear validation for Reference By fields if user is NOT an employee (admin user)
  useEffect(() => {
    if (!isEmployeeDesignationEdit) {
      // Admin users don't need Reference By fields - clear any validation errors
      if (personalInfoForm.formState.errors.referenceBy) {
        personalInfoForm.clearErrors("referenceBy");
      }
    }
  }, [isEmployeeDesignationEdit, personalInfoForm]);

  // Populate forms with fetched data
  useEffect(() => {
    if (
      completeUserInfo?.personalInfo &&
      currentStep === UserFormStepEnum.PERSONAL_INFO
    ) {
      const personalData = completeUserInfo.personalInfo;
      // Format DOB for input[type="date"] (YYYY-MM-DD)
      const formattedDob = personalData.dob
        ? new Date(personalData.dob).toISOString().split("T")[0]
        : "";
      const fatherMobile = splitPhoneWithCountryCode(
        personalData.parentGuardianDetails?.fatherMobile,
      );
      const motherMobile = splitPhoneWithCountryCode(
        personalData.parentGuardianDetails?.motherMobile,
      );
      const otherMobile = splitPhoneWithCountryCode(
        personalData.parentGuardianDetails?.otherMobile,
      );
      const referencePhone = splitPhoneWithCountryCode(
        (personalData as any).referencePhone,
      );
      const normalizedPersonalData = {
        ...personalData,
        referenceBy:
          (personalData as any).referenceBy || (personalData as any).referencePhone
            ? {
                name: (personalData as any).referenceBy || "",
                countryCode: referencePhone.countryCode,
                contactNumber: referencePhone.phone,
              }
            : undefined,
        parentGuardianDetails: personalData.parentGuardianDetails
          ? {
              ...personalData.parentGuardianDetails,
              fatherMobile: fatherMobile.phone,
              fatherMobileCountryCode: fatherMobile.countryCode,
              motherMobile: motherMobile.phone,
              motherMobileCountryCode: motherMobile.countryCode,
              otherMobile: otherMobile.phone,
              otherMobileCountryCode: otherMobile.countryCode,
            }
          : undefined,
      };

      personalInfoForm.reset({
        ...normalizedPersonalData,
        dob: formattedDob,
      });

      // Explicitly set all fields to ensure they populate correctly
      if (personalData.fullName)
        personalInfoForm.setValue("fullName", personalData.fullName);
      if (personalData.dob) personalInfoForm.setValue("dob", formattedDob);
      if (personalData.bloodGroup)
        personalInfoForm.setValue("bloodGroup", personalData.bloodGroup);
      if (personalData.nationality)
        personalInfoForm.setValue("nationality", personalData.nationality);
      if (personalData.gender)
        personalInfoForm.setValue("gender", personalData.gender);
      if (personalData.maritalStatus)
        personalInfoForm.setValue("maritalStatus", personalData.maritalStatus);
      if (personalData.parentGuardianDetails) {
        personalInfoForm.setValue(
          "parentGuardianDetails",
          normalizedPersonalData.parentGuardianDetails,
        );
      }
      if (normalizedPersonalData.referenceBy) {
        personalInfoForm.setValue("referenceBy", normalizedPersonalData.referenceBy);
      }

      if (completeUserInfo.personalInfo.parentGuardianDetails?.fatherName) {
        setGuardianType("father");
      } else if (
        completeUserInfo.personalInfo.parentGuardianDetails?.motherName
      ) {
        setGuardianType("mother");
      } else if (
        completeUserInfo.personalInfo.parentGuardianDetails?.otherName
      ) {
        setGuardianType("other");
      }
    }
  }, [completeUserInfo, currentStep, personalInfoForm]);

  useEffect(() => {
    if (
      completeUserInfo?.contactInfo &&
      currentStep === UserFormStepEnum.CONTACT_INFO
    ) {
      // Normalize country codes - ensure they start with "+"
      const normalizeCode = (code: string | undefined): string => {
        if (!code) return "";
        const cleaned = code.trim();
        return cleaned.startsWith("+") ? cleaned : "+" + cleaned;
      };

      const phoneCode = normalizeCode(
        (completeUserInfo.contactInfo as any).phoneCountryCode,
      );
      const emergencyCode = normalizeCode(
        (completeUserInfo.contactInfo as any).emergencyContactCountryCode,
      );

      const contactData = {
        email: completeUserInfo.contactInfo.email || "",
        phone: completeUserInfo.contactInfo.phone || "",
        phoneCountryCode: phoneCode,
        emergencyContact: completeUserInfo.contactInfo.emergencyContact || "",
        emergencyContactCountryCode: emergencyCode,
        currentAddress: {
          country:
            (completeUserInfo.contactInfo as any).currentAddress?.country || "",
          state:
            (completeUserInfo.contactInfo as any).currentAddress?.state || "",
          city:
            (completeUserInfo.contactInfo as any).currentAddress?.city || "",
          pincode:
            (completeUserInfo.contactInfo as any).currentAddress?.pincode || "",
          addressLine:
            (completeUserInfo.contactInfo as any).currentAddress?.addressLine ||
            "",
        },
        permanentAddress: {
          country:
            (completeUserInfo.contactInfo as any).permanentAddress?.country ||
            "",
          state:
            (completeUserInfo.contactInfo as any).permanentAddress?.state || "",
          city:
            (completeUserInfo.contactInfo as any).permanentAddress?.city || "",
          pincode:
            (completeUserInfo.contactInfo as any).permanentAddress?.pincode ||
            "",
          addressLine:
            (completeUserInfo.contactInfo as any).permanentAddress
              ?.addressLine || "",
        },
      };

      // Set state variables first - this ensures they're ready before form renders
      setPhoneCountryCode(phoneCode);
      setEmergencyContactCountryCode(emergencyCode);

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
    }
  }, [completeUserInfo?.contactInfo, currentStep]);

  useEffect(() => {
    if (
      completeUserInfo?.employmentInfo &&
      currentStep === UserFormStepEnum.EMPLOYMENT_INFO
    ) {
      const employmentData = {
        branchId:
          typeof completeUserInfo.employmentInfo.branchId === "object"
            ? String((completeUserInfo.employmentInfo.branchId as any)?._id || (completeUserInfo.employmentInfo.branchId as any)?.id || "")
            : String(completeUserInfo.employmentInfo.branchId || ""),
        baseSalary: completeUserInfo.employmentInfo.baseSalary || 0,
        currency: completeUserInfo.employmentInfo.currency || "",
        dateOfJoining: (() => {
          const raw = (completeUserInfo.employmentInfo as any).dateOfJoining;
          return typeof raw === "string" && raw.includes("T")
            ? raw.split("T")[0]
            : raw || "";
        })(),
        paymentMode:
          (completeUserInfo.employmentInfo as any).paymentMode?.mode ||
          (completeUserInfo.employmentInfo as any).paymentMode ||
          PaymentModeEnum.CASH,
        bankAccount: (completeUserInfo.employmentInfo as any).paymentMode
          ?.bankAccount ||
          (completeUserInfo.employmentInfo as any).bankAccount || {
          bankName: "",
          bankHolderName: "",
          accountNumber: "",
          ifsc: "",
        },
      };
      employmentInfoForm.reset(employmentData);

      // Explicitly set form values to ensure they populate correctly
      if (employmentData.branchId)
        employmentInfoForm.setValue("branchId", employmentData.branchId);
      if (employmentData.baseSalary)
        employmentInfoForm.setValue("baseSalary", employmentData.baseSalary);
      if (employmentData.currency)
        employmentInfoForm.setValue("currency", employmentData.currency);
      if (employmentData.dateOfJoining)
        employmentInfoForm.setValue(
          "dateOfJoining",
          employmentData.dateOfJoining,
        );
      if (employmentData.paymentMode)
        employmentInfoForm.setValue("paymentMode", employmentData.paymentMode);
      if (employmentData.bankAccount)
        employmentInfoForm.setValue("bankAccount", employmentData.bankAccount);
    }
  }, [completeUserInfo, currentStep, employmentInfoForm]);

  useEffect(() => {
    if (
      completeUserInfo &&
      currentStep === UserFormStepEnum.DOCUMENT_UPLOAD
    ) {
      const existingDocuments = completeUserInfo.documentInfo?.documents || [];

      if (existingDocuments.length > 0) {
        replaceDocuments(
          normalizeRequiredDocuments(
            existingDocuments.map((doc: any) => ({
              verificationStatus:
                doc.verificationStatus || VerificationStatusEnum.PENDING,
              id: doc._id || "",
              docType: normalizeUserDocumentType(doc.docType || doc.documentType),
              documentNumber: doc.documentNumber || "",
              expiryDate: doc.expiryDate || "",
              frontImg: doc.frontImg || "",
              backImg: doc.backImg || "",
              ...(doc.visaDetails && { visaDetails: doc.visaDetails }),
            })),
          ),
        );
      } else {
        replaceDocuments(createRequiredDocuments());
      }
    }
  }, [completeUserInfo, currentStep, replaceDocuments]);

  // Populate Permission step from API when complete user info is loaded
  useEffect(() => {
    if (!completeUserInfo) return;
    const p = (completeUserInfo as any).permissions;
    if (!p) return;
    const designationId =
      p.designation != null
        ? typeof p.designation === "object" && p.designation.id != null
          ? String(p.designation.id)
          : String(p.designation)
        : "";
    if (designationId) setPermissionDesignation(designationId);
    const branchIds = Array.isArray(p.branches)
      ? p.branches.map((b: any) => String(b?.id ?? b?._id ?? "").trim()).filter(Boolean)
      : [];
    setPermissionBranchIds(branchIds);
  }, [completeUserInfo]);

  const isLoading =
    updatePersonalInfoMutation.isPending ||
    updateContactInfoMutation.isPending ||
    updateEmploymentInfoMutation.isPending ||
    updateDocumentUploadMutation.isPending ||
    updateReviewSubmitMutation.isPending ||
    updatePermissionsMutation.isPending ||
    loadingUserInfo;

  // Step handlers
  const handlePersonalInfoSubmit = async (data: PersonalInfoSchema) => {
    const submitData: any = {
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

    if (isHrHeadReadonly && completeUserInfo?.personalInfo) {
      // HR Head can review employee records, but full name and nationality stay locked here so
      // those identity fields remain controlled by broader admin ownership rules.
      submitData.fullName = completeUserInfo.personalInfo.fullName;
      submitData.nationality = completeUserInfo.personalInfo.nationality;
    }

    if (submitData.parentGuardianDetails) {
      delete submitData.parentGuardianDetails.fatherMobileCountryCode;
      delete submitData.parentGuardianDetails.motherMobileCountryCode;
      delete submitData.parentGuardianDetails.otherMobileCountryCode;
    }

    updatePersonalInfoMutation.mutate(
      { data: submitData, id: userId },
      {
        onSuccess: () => {
          toast.success("Personal info updated successfully");
          if (isPendingUser) {
            setCurrentStep(UserFormStepEnum.CONTACT_INFO);
          }
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message;
          toast.error(
            Array.isArray(message)
              ? message.join(", ")
              : message || "Error updating personal info",
          );
        },
      },
    );
  };

  const handleContactInfoSubmit = async (data: ContactInfoSchema) => {
    updateContactInfoMutation.mutate(
      { ...data, email: data.email.trim().toLowerCase(), userId },
      {
        onSuccess: () => {
          toast.success("Contact info updated successfully");
          if (isPendingUser) {
            setCurrentStep(UserFormStepEnum.EMPLOYMENT_INFO);
          }
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message;
          toast.error(
            Array.isArray(message)
              ? message.join(", ")
              : message || "Error updating contact info",
          );
        },
      },
    );
  };

  const handleEmploymentInfoSubmit = async (data: EmploymentInfoSchema) => {
    const submissionData: any = { ...data, userId };

    // Don't send bank account details if payment mode is CASH
    if (data.paymentMode === PaymentModeEnum.CASH) {
      delete submissionData.bankAccount;
    }

    updateEmploymentInfoMutation.mutate(submissionData, {
      onSuccess: () => {
        toast.success("Employment info updated successfully");
        if (isPendingUser) {
          setCurrentStep(UserFormStepEnum.DOCUMENT_UPLOAD);
        }
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message;
        const errorMsg = Array.isArray(message)
          ? message.join(", ")
          : message || "Error updating employment info";
        toast.error(errorMsg);
      },
    });
  };

  const handlePermissionSubmit = () => {
    if (!userId) return;
    const permissionsPayload = {
      designation: permissionDesignation ?? undefined,
      branches: permissionBranchIds
        .map((id) => {
          const b = availableBranches.find((x: any) => x._id === id);
          return b ? { id: b._id, name: (b as any).branchName || "" } : null;
        })
        .filter(Boolean) as { id: string; name: string }[],
    };
    updatePermissionsMutation.mutate(
      { userId, permissions: permissionsPayload },
      {
        onSuccess: () => {
          toast.success("Permissions updated successfully");
          refetchUserInfo();
          if (isPendingUser) setCurrentStep(UserFormStepEnum.DOCUMENT_UPLOAD);
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message;
          toast.error(Array.isArray(message) ? message.join(", ") : message || "Error updating permissions");
        },
      },
    );
  };

  const handleDocumentUploadSubmit = async (data: DocumentUploadSchema) => {
    updateDocumentUploadMutation.mutate(
      { ...data, userId },
      {
        onSuccess: async (mutationResult: any) => {
          toast.success("Documents updated successfully");
          if (isPendingUser) {
            setCurrentStep(UserFormStepEnum.REVIEW_SUBMIT);
          }
          const mapDocsToForm = (docs: any[]) =>
            (docs || []).map((doc: any) => ({
              id: doc._id ?? doc.id ?? "",
              verificationStatus:
                doc.verificationStatus || VerificationStatusEnum.PENDING,
              docType: normalizeUserDocumentType(doc.docType || doc.documentType),
              documentNumber: doc.documentNumber || "",
              expiryDate: doc.expiryDate || "",
              frontImg: doc.frontImg || "",
              backImg: doc.backImg || "",
              ...(doc.visaDetails && { visaDetails: doc.visaDetails }),
            }));

          let docsToShow: any[] | null = null;
          if (mutationResult?.currentStepData?.documents?.length) {
            docsToShow = mutationResult.currentStepData.documents;
          } else if (mutationResult?.data?.currentStepData?.documents?.length) {
            docsToShow = mutationResult.data.currentStepData.documents;
          }
          if (docsToShow?.length) {
            replaceDocuments(normalizeRequiredDocuments(mapDocsToForm(docsToShow)));
          }

          const queryKey = [API_ROUTE.USER.STEP5_REVIEW.GET.ID, userId] as const;
          try {
            queryClient.invalidateQueries({ queryKey });
            await queryClient.refetchQueries({ queryKey });
            const freshPayload =
              queryClient.getQueryData<{ documentInfo?: { documents?: any[] } }>(queryKey);
            const docs =
              freshPayload?.documentInfo?.documents ??
              (freshPayload as any)?.data?.documentInfo?.documents;
            if (docs && Array.isArray(docs) && docs.length > 0) {
              replaceDocuments(normalizeRequiredDocuments(mapDocsToForm(docs)));
            }
          } catch {
            // Refetch failed; list may already be updated from mutation result above
          }
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message;
          toast.error(
            Array.isArray(message)
              ? message.join(", ")
              : message || "Error updating documents",
          );
        },
      },
    );
  };

  const handleReviewSubmit = async () => {
    if (!userId) {
      toast.error("User ID not found. Please complete previous steps first.");
      return;
    }

    updateReviewSubmitMutation.mutate(
      { userId, status: UserStatusEnum.ACTIVE },
      {
        onSuccess: () => {
          toast.success("Profile completed successfully");
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(APP_ROUTE.USER.ALL.PATH);
          }
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message;
          toast.error(
            Array.isArray(message)
              ? message.join(", ")
              : message || "Error completing user profile",
          );
        },
      },
    );
  };

  const steps = useMemo(() => [
    { key: UserFormStepEnum.PERSONAL_INFO, label: "Personal Info", number: 1 },
    { key: UserFormStepEnum.CONTACT_INFO, label: "Contact Info", number: 2 },
    { key: UserFormStepEnum.EMPLOYMENT_INFO, label: "Employment Info", number: 3 },
    { key: UserFormStepEnum.DOCUMENT_UPLOAD, label: "Documents", number: 4 },
    { key: UserFormStepEnum.REVIEW_SUBMIT, label: "Review & Submit", number: 5 },
  ], []);

  const nonPendingSteps = useMemo(() => steps.slice(0, steps.length - 1), [steps]); // Exclude Review & Submit for non-pending
  const displaySteps = isPendingUser ? steps : nonPendingSteps;
  const currentStepIndex = displaySteps.findIndex((s) => s.key === currentStep);

  // Show loading state while fetching user data
  if (loadingUserInfo) {
    return <LoadingState message="Loading employee details..." />;
  }

  // Show error if no user data
  if (!completeUserInfo) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">
          Failed to load employee details. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!embeddedInPageShell && (
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
        </div>
      )}

      {/* Progress Indicator for Pending Users / Tabs for Non-Pending */}
      {isPendingUser ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center flex-1">
                  {/* Step */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${currentStepIndex > index
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
                      className={`mt-2 text-xs font-medium ${currentStepIndex === index
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
                        className={`h-1 w-full mx-2 ${currentStepIndex > index
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
      ) : (
        <Card className="pb-0">
          <CardContent className="p-0">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {nonPendingSteps.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setCurrentStep(tab.key)}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${currentStep === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    } cursor-pointer`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render current step */}
      {currentStep === UserFormStepEnum.PERSONAL_INFO && (
        <PersonalInfoStep
          form={personalInfoForm}
          onSubmit={handlePersonalInfoSubmit}
          isLoading={isLoading}
          guardianType={guardianType}
          setGuardianType={setGuardianType}
          isHrHeadReadonly={isHrHeadReadonly}
          onCancel={() => router.back()}
          showNext={isPendingUser}
          isPendingUser={isPendingUser}
        />
      )}

      {currentStep === UserFormStepEnum.CONTACT_INFO && (
        <ContactInfoStep
          form={contactInfoForm}
          onSubmit={handleContactInfoSubmit}
          isLoading={isLoading}
          onCancel={() => router.back()}
          showNext={isPendingUser}
          showBack={isPendingUser}
          isPendingUser={isPendingUser}
          onBack={() => setCurrentStep(UserFormStepEnum.PERSONAL_INFO)}
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
          onCancel={() => router.back()}
          showNext={isPendingUser}
          showBack={isPendingUser}
          isPendingUser={isPendingUser}
          onBack={() => setCurrentStep(UserFormStepEnum.CONTACT_INFO)}
        />
      )}

      {currentStep === UserFormStepEnum.DOCUMENT_UPLOAD && (
        <DocumentUploadStep
          form={documentUploadForm}
          onSubmit={handleDocumentUploadSubmit}
          isLoading={isLoading}
          documentFields={documentFields}
          appendDocument={appendDocument}
          removeDocument={removeDocument}
          sponsorCompanyOptions={sponsorCompanyOptions}
          shouldHideSponsorCompany={shouldHideSponsorCompany}
          onCancel={() => router.back()}
          showNext={isPendingUser}
          showBack={isPendingUser}
          isPendingUser={isPendingUser}
          onBack={() => setCurrentStep(UserFormStepEnum.EMPLOYMENT_INFO)}
          refetchUserInfo={refetchUserInfo}
        />
      )}

      {currentStep === UserFormStepEnum.REVIEW_SUBMIT && isPendingUser && (
        <ReviewStep
          completeUserInfo={completeUserInfo}
          onSubmit={handleReviewSubmit}
          isLoading={isLoading}
          shouldHideSponsorCompany={shouldHideSponsorCompany}
          onBack={() => setCurrentStep(UserFormStepEnum.DOCUMENT_UPLOAD)}
        />
      )}
    </div>
  );
}

// Helper components (same as CreateUserFormMultiStep)
function PersonalInfoStep({
  form,
  onSubmit,
  isLoading,
  guardianType,
  setGuardianType,
  isHrHeadReadonly,
  onCancel,
  showNext,
  isPendingUser,
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
                readOnly={isHrHeadReadonly}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                {...form.register("fullName")}
              />
              {isHrHeadReadonly && (
                <p className="text-xs text-muted-foreground">
                  HR Head can review this field but cannot edit the employee's master name.
                </p>
              )}
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
              {isHrHeadReadonly ? (
                <>
                  {/* HR Head should not edit nationality from the employee editor, so the field
                      stays visible as read-only without exposing the selectable country list. */}
                  <input
                    id="nationality"
                    type="text"
                    readOnly
                    value={form.watch("nationality") || ""}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-muted-foreground">
                    HR Head can review this field but cannot edit nationality here.
                  </p>
                </>
              ) : (
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
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reference By
              </label>
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)] gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Reference Name <span className="text-gray-500">(Optional)</span>
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
                    Country Code <span className="text-gray-500">(Optional)</span>
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
                    Contact Number <span className="text-gray-500">(Optional)</span>
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : showNext ? "Save & Next" : "Save"}
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
  showNext,
  showBack,
  isPendingUser,
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
                  value={phoneCountryCode || "+91"}
                  onValueChange={(value) => {
                    console.log("Selected phone country code:", value);
                    if (value) {
                      setPhoneCountryCode(value);
                      form.setValue("phoneCountryCode", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
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
                  value={emergencyContactCountryCode || "+91"}
                  onValueChange={(value) => {
                    if (value) {
                      setEmergencyContactCountryCode(value);
                      form.setValue("emergencyContactCountryCode", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
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
                Permanent Address *
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pincode *
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
                    City *{" "}
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
                    State *{" "}
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
                    Country *{" "}
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
                    Address Line *
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
        <CardFooter className="flex justify-between gap-3">
          {showBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className={!showBack ? "ml-auto" : ""}
          >
            {isLoading ? "Saving..." : showNext ? "Save & Next" : "Save"}
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
  showNext,
  showBack,
  isPendingUser,
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
                Joining Date
              </label>
              <input
                type="date"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                {...form.register("dateOfJoining")}
              />
              {form.formState.errors.dateOfJoining && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.dateOfJoining.message}
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
        <CardFooter className="flex justify-between gap-3">
          {showBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className={!showBack ? "ml-auto" : ""}
          >
            {isLoading ? "Saving..." : showNext ? "Save & Next" : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function PermissionStepEdit({
  designation,
  setDesignation,
  branchIds,
  setBranchIds,
  availableRoles,
  availableBranches,
  onSubmit,
  onBack,
  isLoading,
  isPendingUser,
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
  isPendingUser: boolean;
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
          {isLoading ? "Saving..." : isPendingUser ? "Next" : "Save"}
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
  showNext,
  showBack,
  isPendingUser,
  refetchUserInfo,
}: any) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newDocumentIndex, setNewDocumentIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const { mutate: verifyDocument, isPending: isVerifying } =
    useVerifyUserDocument();

  // Helper function to determine document status based on expiry date
  const getDocStatus = (expiryDate?: string | null) => {
    if (!expiryDate) return "no-expiry";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays <= 0) return "blocked";
    if (diffDays <= 30) return "critical";
    if (diffDays <= 90) return "warning";
    return "valid";
  };

  // Helper function to get status display for document
  const getStatusDisplay = (status: string, expiryDate?: string) => {
    if (status === "no-expiry") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          No Expiry
        </span>
      );
    }

    if (status === "blocked") {
      return (
        <div className="flex flex-col items-start gap-0.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
            Expired
          </span>
        </div>
      );
    }

    if (status === "critical") {
      const diffDays = Math.ceil(
        (new Date(expiryDate!).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
      );
      return (
        <div className="flex flex-col items-start gap-0.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
            Critical
          </span>
          <span className="text-xs text-orange-500 font-medium whitespace-nowrap">
            {diffDays} days left
          </span>
        </div>
      );
    }

    if (status === "warning") {
      const diffDays = Math.ceil(
        (new Date(expiryDate!).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
      );
      return (
        <div className="flex flex-col items-start gap-0.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            Warning
          </span>
          <span className="text-xs text-yellow-600 font-medium whitespace-nowrap">
            {diffDays} days left
          </span>
        </div>
      );
    }

    // valid
    const diffDays = Math.ceil(
      (new Date(expiryDate!).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
    );
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          Valid
        </span>
        <span className="text-xs text-green-600 font-medium whitespace-nowrap">
          {diffDays} days left
        </span>
      </div>
    );
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleVerify = (index: number) => {
    const documentData = form.getValues(`documents.${index}`);
    const documentId = documentData.id;

    if (!documentId) {
      toast.error("Document ID not found. Please save the document first.");
      return;
    }

    // Show confirmation dialog
    if (window.confirm("Are you sure you want to verify this document?")) {
      const session = getSession();
      const verifiedBy = session?.userId || "";

      if (!verifiedBy) {
        toast.error("User session not found");
        return;
      }

      verifyDocument(
        { id: documentId, verifiedBy },
        {
          onSuccess: (res) => {
            toast.success("Document verified successfully");
            refetchUserInfo();
            // Update the form data to reflect verification status
            form.setValue(
              `documents.${index}.verificationStatus`,
              res.verificationStatus || "active",
            );
            // Refetch user data to get updated information
          },
          onError: (error: any) => {
            toast.error(error?.message || "Failed to verify document");
          },
        },
      );
    }
  };

  const handleSave = async (index: number) => {
    // Validate and save the specific document
    const documentData = form.getValues(`documents.${index}`);
    await onSubmit({ documents: [documentData] });
    setEditingIndex(null);
    setNewDocumentIndex(null);
  };

  const handleCancel = (index: number) => {
    // If this is a newly added document that hasn't been saved, remove it
    if (newDocumentIndex === index) {
      removeDocument(index);
      setNewDocumentIndex(null);
    }
    setEditingIndex(null);
  };

  const handleAddDocument = () => {
    const newIndex = documentFields.length;
    appendDocument(createDocumentForType());
    setEditingIndex(newIndex);
    setNewDocumentIndex(newIndex);
  };

  useEffect(() => {
    if (documentFields.length < REQUIRED_EMPLOYEE_DOCUMENT_TYPES.length) {
      return;
    }

    const documentData = form.getValues("documents.0");
    const isEmptyDocument =
      !documentData?.id &&
      !documentData?.docType &&
      !documentData?.documentNumber &&
      !documentData?.expiryDate &&
      !documentData?.frontImg &&
      !documentData?.backImg;

    if (isEmptyDocument && editingIndex === null) {
      setEditingIndex(0);
      setNewDocumentIndex(0);
    }
  }, [documentFields.length, editingIndex, form]);

  const isRequiredDocumentCard = (index: number) => index < REQUIRED_EMPLOYEE_DOCUMENT_TYPES.length;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
    >
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Note: Only document data will be shown. Use Edit button to modify
            documents.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {documentFields.map((field: any, index: number) => {
              const isEditing = editingIndex === index;
              const documentData = form.watch(`documents.${index}`);

              return (
                <div key={field.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">
                        Document {index + 1}{" "}
                        {getDocStatus(documentData?.expiryDate) !==
                          "blocked" && (
                            <Badge
                              variant={
                                documentData.verificationStatus ===
                                  VerificationStatusEnum.VERIFIED
                                  ? "success"
                                  : "default"
                              }
                            >
                              {
                                VerificationStatusLabels[
                                documentData.verificationStatus as VerificationStatusEnum
                                ]
                              }
                            </Badge>
                          )}
                      </h4>
                      {/* Status Display */}
                      {getStatusDisplay(
                        getDocStatus(documentData?.expiryDate),
                        documentData?.expiryDate,
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!isEditing ? (
                        <>
                          {documentData.verificationStatus ===
                            VerificationStatusEnum.PENDING &&
                            getDocStatus(documentData?.expiryDate) !==
                            "blocked" && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerify(index)}
                                disabled={isVerifying || isLoading}
                              >
                                {isVerifying ? "Verifying..." : "Verify"}
                              </Button>
                            )}
                          {getDocStatus(documentData?.expiryDate) !==
                            "blocked" && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(index)}
                              >
                                Edit
                              </Button>
                            )}
                          <button
                            type="button"
                            onClick={() => {
                              if (isRequiredDocumentCard(index)) {
                                toast.error(`${DocumentTypeLabels[REQUIRED_EMPLOYEE_DOCUMENT_TYPES[index]]} is required.`);
                                return;
                              }

                              removeDocument(index);
                            }}
                            disabled={isLoading || isRequiredDocumentCard(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(index)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSave(index)}
                            disabled={isLoading}
                          >
                            {isLoading ? "Saving..." : "Save"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing ? (
                    // View Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Document Type</p>
                          <p className="font-medium">
                            {DocumentTypeLabels[
                              documentData?.docType as UserDocumentTypeEnum
                            ] ||
                              documentData?.docType ||
                              "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Document Number
                          </p>
                          <p className="font-medium">
                            {documentData?.documentNumber || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Expiry Date</p>
                          <p className="font-medium">
                            {documentData?.expiryDate
                              ? formatDate(documentData.expiryDate)
                              : "-"}
                          </p>
                        </div>
                      </div>

                      {/* Visa Details - Show only if document type is VISA */}
                      {documentData.docType === UserDocumentTypeEnum.VISA &&
                        documentData.visaDetails && (
                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-4">
                              {documentData.visaDetails.visaType && (
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Visa Type
                                  </p>
                                  <p className="font-medium">
                                    {documentData.visaDetails.visaType
                                      .charAt(0)
                                      .toUpperCase() +
                                      documentData.visaDetails.visaType.slice(
                                        1,
                                      )}
                                  </p>
                                </div>
                              )}
                              {!shouldHideSponsorCompany && documentData.visaDetails.sponsorCompany && (
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Sponsor Company
                                  </p>
                                  <p className="font-medium">
                                    {documentData.visaDetails.sponsorCompany}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {(documentData.frontImg || documentData.backImg) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        {/* Front Image */}
                        {documentData.frontImg && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Front Image
                          </p>
                            <div className="flex flex-col gap-1">
                              <p className="text-xs text-gray-500 font-medium">
                                Front
                              </p>
                              <Image
                                onClick={() =>
                                  setPreviewImage({
                                    url: documentData.frontImg,
                                    title: `${documentData?.docType || "Document"} - Front Image`,
                                  })
                                }
                                src={documentData.frontImg}
                                alt="Front"
                                width={96}
                                height={96}
                                className="object-cover rounded border  hover:cursor-pointer hover:shadow-lg"
                                unoptimized
                              />
                            </div>
                        </div>
                        )}

                        {/* Back Image */}
                        {documentData.backImg && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Back Image
                          </p>
                            <div className="flex flex-col gap-1">
                              <p className="text-xs text-gray-500 font-medium">
                                Back
                              </p>
                              <Image
                                onClick={() =>
                                  setPreviewImage({
                                    url: documentData.backImg,
                                    title: `${documentData?.docType || "Document"} - Back Image`,
                                  })
                                }
                                src={documentData.backImg}
                                alt="Back"
                                width={96}
                                height={96}
                                className="object-cover rounded border hover:cursor-pointer hover:shadow-lg"
                                unoptimized
                              />
                            </div>
                        </div>
                        )}
                      </div>
                      )}
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                      <div className="space-y-2 col-span-1">
                        <label className="block text-sm font-medium">
                          Document Type *
                        </label>
                        <select
                          disabled={isLoading || isRequiredDocumentCard(index)}
                          className="h-11 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          {...form.register(`documents.${index}.docType`, {
                            onChange: (event: any) => {
                              if (event.target.value !== UserDocumentTypeEnum.VISA) {
                                form.setValue(`documents.${index}.visaDetails`, undefined);
                              }
                            },
                          })}
                        >
                          <option value="">Select document type</option>
                          {Object.values(UserDocumentTypeEnum).map((value) => (
                            <option key={value} value={value}>
                              {DocumentTypeLabels[value] || value}
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

                      <div className="space-y-2  col-span-1">
                        <label className="block text-sm font-medium">
                          Document Number *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter document number"
                          disabled={isLoading}
                          className="h-11 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          {...form.register(
                            `documents.${index}.documentNumber`,
                          )}
                        />
                        {form.formState.errors.documents?.[index]
                          ?.documentNumber && (
                            <p className="text-xs text-red-600">
                              {
                                form.formState.errors.documents[index]
                                  ?.documentNumber?.message
                              }
                            </p>
                          )}
                      </div>
                      <div className="col-span-2 md:max-w-[calc(50%-10px)]">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium">
                            Expiry Date *
                          </label>
                          <input
                            type="date"
                            disabled={isLoading}
                            className="h-11 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            {...form.register(`documents.${index}.expiryDate`)}
                          />
                          {form.formState.errors.documents?.[index]
                            ?.expiryDate && (
                              <p className="text-xs text-red-600">
                                {
                                  form.formState.errors.documents[index]
                                    ?.expiryDate?.message
                                }
                              </p>
                            )}
                        </div>
                      </div>

                      {/* Visa Details - Show only if document type is VISA */}
                      {documentData.docType === UserDocumentTypeEnum.VISA && (
                        <>
                          <div className="space-y-2 col-span-2 pt-2">
                            <h3 className="font-medium text-gray-700 dark:text-gray-300">
                              Visa Details
                            </h3>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium">
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
                                  {value.charAt(0).toUpperCase() +
                                    value.slice(1)}
                                </option>
                              ))}
                            </select>
                            {form.formState.errors.documents?.[index]
                              ?.visaDetails?.visaType && (
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
                              {/* Sponsor company is sourced from the sponsor-company master data and is hidden
                                  from HR Head / Account Head to enforce role-based visibility restrictions. */}
                              <label className="block text-sm font-medium">
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
                              {form.formState.errors.documents?.[index]
                                ?.visaDetails?.sponsorCompany && (
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

                      <div className="col-span-2 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-2 md:gap-5">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium">
                            Front Image/Document
                          </label>
                          {documentData.frontImg && (
                            <div className="flex flex-col gap-1">
                              <Image
                                onClick={() =>
                                  setPreviewImage({
                                    url: documentData.frontImg,
                                    title: `${documentData?.docType || "Document"} - Front Image`,
                                  })
                                }
                                src={documentData.frontImg}
                                alt="Front"
                                width={96}
                                height={96}
                                className="object-cover rounded border  hover:cursor-pointer hover:shadow-lg"
                                unoptimized
                              />
                            </div>
                          )}
                          <SingleFileUpload
                            folder="documents"
                            accept=".jpg,.jpeg,.png,.gif,.webp"
                            label="Upload New Front Side"
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

                        <div className="space-y-2 ">
                          <label className="block text-sm font-medium">
                            Back Image/Document
                          </label>
                          {documentData.backImg && (
                            <div className="flex flex-col gap-1">
                              <Image
                                onClick={() =>
                                  setPreviewImage({
                                    url: documentData.backImg,
                                    title: `${documentData?.docType || "Document"} - Back Image`,
                                  })
                                }
                                src={documentData.backImg}
                                alt="Back"
                                width={96}
                                height={96}
                                className="object-cover rounded border  hover:cursor-pointer hover:shadow-lg"
                                unoptimized
                              />
                            </div>
                          )}
                          <SingleFileUpload
                            folder="documents"
                            accept=".jpg,.jpeg,.png,.gif,.webp"
                            label="Upload New Back Side"
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
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddDocument}
              disabled={isLoading}
              className="flex items-center gap-2 text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4" />
              Add Document
            </button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-3">
          {showBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className={!showBack ? "ml-auto" : ""}
          >
            {isLoading ? "Saving..." : showNext ? "Save & Next" : "Save"}
          </Button>
        </CardFooter>
      </Card>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">{previewImage.title}</h3>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[70vh]">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => window.open(previewImage.url, "_blank")}
                >
                  Open in New Tab
                </Button>
                <Button onClick={() => setPreviewImage(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

// Review Step Component
function ReviewStep({ completeUserInfo, onSubmit, isLoading, onBack, shouldHideSponsorCompany = false }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review & Submit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
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
                      {completeUserInfo.personalInfo.dob}
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
                      {completeUserInfo.contactInfo.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Emergency Contact</p>
                    <p className="font-medium">
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
                        {completeUserInfo.employmentInfo.dateOfJoining}
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
