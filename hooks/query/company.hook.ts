"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getAllCompanies,
    getCompaniesByStatus,
    getCompanyById,
    createCompany,
    updateCompany,
    deleteCompany,
} from "@/service/company.service";
import {
    createCompanyDocument,
    deleteCompanyDocument,
    getAllCompanyDocuments,
    getDocumentById,
    getDocumentsByCompanyId,
    getDocumentsByStatus,
    getDocumentsByType,
    getLatestDocument,
    rejectCompanyDocument,
    updateCompanyDocument,
    verifyCompanyDocument,
} from "@/service/company-document.service";
import {
    Company,
    CompanyFilters,
    CompanyDocumentsResponse,
    CompanyDocument,
    CompanyDocumentFilters,
    CreateCompanyDto,
    CreateCompanyDocumentDto,
    UpdateCompanyDocumentDto,
} from "@/types/company.type";
import { API_ROUTE } from "@/routes";

const COMPANIES_QUERY_KEY = API_ROUTE.COMPANY.ALL.ID;
const COMPANY_DOCUMENTS_QUERY_KEY = API_ROUTE.COMPANY_DOCUMENT.ALL.ID;

// ---------------------------
// Company Queries & Mutations
// ---------------------------
export const useInfiniteCompanies = (filters?: CompanyFilters) => {
    return useInfiniteQuery({
        queryKey: [COMPANIES_QUERY_KEY, filters],
        queryFn: ({ pageParam = 1 }) =>
            getAllCompanies({
                ...filters,
                page: pageParam as number,
                limit: filters?.limit ?? 10,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.pagination || lastPage?.meta;
            const currentPage = meta?.page ?? 1;
            const totalPages = meta?.pages  ?? 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
    });
};

export const useGetCompanyDetail = (id?: string) => {
    return useQuery({
        queryKey: [COMPANIES_QUERY_KEY, "detail", id],
        queryFn: async () => {
            if (!id) throw new Error("Company ID is required");
            const company = await getCompanyById(id);
            if (!company) throw new Error("Company not found");
            return company;
        },
        enabled: !!id && id !== "new",
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateCompany = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateCompanyDto) => createCompany(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] });
        },
    });
};

export const useEditCompany = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: CreateCompanyDto }) =>
            updateCompany(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY, "detail", variables.id] });
        },
    });
};

export const useDeleteCompany = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteCompany(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] });
        },
    });
};

export const useCompaniesByStatus = (status?: string, filters?: CompanyFilters) => {
    return useQuery({
        queryKey: [COMPANIES_QUERY_KEY, "status", status, filters],
        queryFn: () => {
            if (!status) throw new Error("Status is required");
            return getCompaniesByStatus(status, filters);
        },
        enabled: !!status,
    });
};

// ---------------------------
// Company Document Queries & Mutations
// ---------------------------
export const useCompanyDocuments = (
    companyId?: string,
    filters?: CompanyDocumentFilters,
) => {
    return useQuery<CompanyDocumentsResponse>({
        queryKey: [COMPANY_DOCUMENTS_QUERY_KEY, companyId, filters],
        queryFn: () => {
            if (!companyId) throw new Error("Company ID is required");
            return getDocumentsByCompanyId(companyId, filters);
        },
        enabled: !!companyId,
    });
};

export const useAllCompanyDocuments = (filters?: CompanyDocumentFilters) => {
    return useInfiniteQuery({
        queryKey: [COMPANY_DOCUMENTS_QUERY_KEY, "all", filters],
        queryFn: ({ pageParam = 1 }) =>
            getAllCompanyDocuments({
                ...filters,
                page: pageParam as number,
                limit: filters?.limit ?? 10,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.pagination || lastPage?.meta;
            const currentPage = meta?.page ?? 1;
            const totalPages = meta?.pages  ?? 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
    });
};

export const useGetCompanyDocumentDetail = (id?: string) => {
    return useQuery<CompanyDocument>({
        queryKey: [COMPANY_DOCUMENTS_QUERY_KEY, "detail", id],
        queryFn: async () => {
            if (!id) throw new Error("Document ID is required");
            const doc = await getDocumentById(id);
            if (!doc) throw new Error("Document not found");
            return doc;
        },
        enabled: !!id && id !== "new",
    });
};

export const useCreateCompanyDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateCompanyDocumentDto) => createCompanyDocument(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [COMPANY_DOCUMENTS_QUERY_KEY] });
        },
    });
};

export const useEditCompanyDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateCompanyDocumentDto }) =>
            updateCompanyDocument(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [COMPANY_DOCUMENTS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [COMPANY_DOCUMENTS_QUERY_KEY, "detail", variables.id] });
        },
    });
};

export const useVerifyCompanyDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => verifyCompanyDocument(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: [COMPANY_DOCUMENTS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [COMPANY_DOCUMENTS_QUERY_KEY, "detail", id] });
        },
    });
};

export const useRejectCompanyDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, notes }: { id: string; notes: string }) => rejectCompanyDocument(id, notes),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [COMPANY_DOCUMENTS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [COMPANY_DOCUMENTS_QUERY_KEY, "detail", variables.id] });
        },
    });
};

export const useDeleteCompanyDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteCompanyDocument(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [COMPANY_DOCUMENTS_QUERY_KEY] });
        },
    });
};

export const useLatestCompanyDocument = (companyId?: string, documentType?: string) => {
    return useQuery<CompanyDocument>({
        queryKey: [COMPANY_DOCUMENTS_QUERY_KEY, "latest", companyId, documentType],
        queryFn: () => {
            if (!companyId || !documentType) throw new Error("Company ID and document type are required");
            return getLatestDocument(companyId, documentType);
        },
        enabled: !!companyId && !!documentType,
    });
};

export const useCompanyDocumentsByType = (documentType?: string, filters?: CompanyDocumentFilters) => {
    return useQuery<CompanyDocumentsResponse>({
        queryKey: [COMPANY_DOCUMENTS_QUERY_KEY, "type", documentType, filters],
        queryFn: () => {
            if (!documentType) throw new Error("Document type is required");
            return getDocumentsByType(documentType, filters);
        },
        enabled: !!documentType,
    });
};

export const useCompanyDocumentsByStatus = (status?: string, filters?: CompanyDocumentFilters) => {
    return useQuery<CompanyDocumentsResponse>({
        queryKey: [COMPANY_DOCUMENTS_QUERY_KEY, "status", status, filters],
        queryFn: () => {
            if (!status) throw new Error("Document status is required");
            return getDocumentsByStatus(status, filters);
        },
        enabled: !!status,
    });
};
