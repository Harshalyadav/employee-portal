import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import {
    CompanyDocument,
    CompanyDocumentsResponse,
    CompanyDocumentFilters,
    CompanyDocumentResponse,
    CreateCompanyDocumentDto,
    UpdateCompanyDocumentDto,
} from "@/types/company.type";

const mapDocumentsResponse = (body: any): CompanyDocumentsResponse => {
    const payload = body?.data ?? body;
    const documents = payload?.data ?? payload?.items ?? payload ?? [];
    const pagination = payload?.pagination ?? payload?.meta ?? body?.pagination;

    return {
        success: body?.success,
        statusCode: body?.statusCode,
        message: body?.message ?? "Documents fetched successfully",
        data: Array.isArray(documents) ? documents : [],
        pagination,
        meta: pagination,
        latestSeq: payload?.latestSeq,
    };
};

const mapDocumentResponse = (body: any): CompanyDocumentResponse => {
    const payload = body?.data ?? body;
    const data = payload?.data ?? payload;
    return {
        success: body?.success,
        statusCode: body?.statusCode,
        message: body?.message ?? "Document fetched successfully",
        data,
    };
};

export async function createCompanyDocument(data: CreateCompanyDocumentDto): Promise<CompanyDocument> {
    const response = await axiosInstance.post<CompanyDocumentResponse>(
        API_ROUTE.COMPANY_DOCUMENT.CREATE.PATH,
        data
    );
    return mapDocumentResponse(response.data).data;
}

export async function getAllCompanyDocuments(filters?: CompanyDocumentFilters): Promise<CompanyDocumentsResponse> {
    const response = await axiosInstance.get<CompanyDocumentsResponse>(
        API_ROUTE.COMPANY_DOCUMENT.ALL.PATH,
        {
            params: {
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
            },
        }
    );
    return mapDocumentsResponse(response.data);
}

export async function getDocumentsByCompanyId(companyId: string, filters?: CompanyDocumentFilters): Promise<CompanyDocumentsResponse> {
    const response = await axiosInstance.get<CompanyDocumentsResponse>(
        API_ROUTE.COMPANY_DOCUMENT.BY_COMPANY.PATH(companyId),
        {
            params: {
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
            },
        }
    );
    return mapDocumentsResponse(response.data);
}

export async function getLatestDocument(companyId: string, documentType: string): Promise<CompanyDocument> {
    const response = await axiosInstance.get<CompanyDocumentResponse>(
        API_ROUTE.COMPANY_DOCUMENT.LATEST_BY_TYPE.PATH(companyId, documentType)
    );
    return mapDocumentResponse(response.data).data;
}

export async function getAllDocumentsByType(companyId: string, documentType: string, filters?: CompanyDocumentFilters): Promise<CompanyDocumentsResponse> {
    const response = await axiosInstance.get<CompanyDocumentsResponse>(
        API_ROUTE.COMPANY_DOCUMENT.ALL_BY_TYPE.PATH(companyId, documentType),
        {
            params: {
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
            },
        }
    );
    return mapDocumentsResponse(response.data);
}

export async function getDocumentsByType(documentType: string, filters?: CompanyDocumentFilters): Promise<CompanyDocumentsResponse> {
    const response = await axiosInstance.get<CompanyDocumentsResponse>(
        API_ROUTE.COMPANY_DOCUMENT.BY_TYPE.PATH(documentType),
        {
            params: {
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
            },
        }
    );
    return mapDocumentsResponse(response.data);
}

export async function getDocumentsByStatus(status: string, filters?: CompanyDocumentFilters): Promise<CompanyDocumentsResponse> {
    const response = await axiosInstance.get<CompanyDocumentsResponse>(
        API_ROUTE.COMPANY_DOCUMENT.BY_STATUS.PATH(status),
        {
            params: {
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
            },
        }
    );
    return mapDocumentsResponse(response.data);
}

export async function getExpiringDocuments(daysBeforeExpiry = 30): Promise<CompanyDocumentsResponse> {
    const response = await axiosInstance.get<CompanyDocumentsResponse>(
        API_ROUTE.COMPANY_DOCUMENT.EXPIRING.PATH,
        {
            params: {
                daysBeforeExpiry,
            },
        }
    );
    return mapDocumentsResponse(response.data);
}

export async function getExpiredDocuments(): Promise<CompanyDocumentsResponse> {
    const response = await axiosInstance.get<CompanyDocumentsResponse>(
        API_ROUTE.COMPANY_DOCUMENT.EXPIRED.PATH
    );
    return mapDocumentsResponse(response.data);
}

export async function getDocumentById(id: string): Promise<CompanyDocument> {
    const response = await axiosInstance.get<CompanyDocumentResponse>(
        API_ROUTE.COMPANY_DOCUMENT.VIEW.PATH(id)
    );
    return mapDocumentResponse(response.data).data;
}

export async function updateCompanyDocument(id: string, data: UpdateCompanyDocumentDto): Promise<CompanyDocument> {
    const response = await axiosInstance.put<CompanyDocumentResponse>(
        API_ROUTE.COMPANY_DOCUMENT.UPDATE.PATH(id),
        data
    );
    return mapDocumentResponse(response.data).data;
}

export async function verifyCompanyDocument(id: string): Promise<CompanyDocument> {
    const response = await axiosInstance.post<CompanyDocumentResponse>(
        API_ROUTE.COMPANY_DOCUMENT.VERIFY.PATH(id)
    );
    return mapDocumentResponse(response.data).data;
}

export async function rejectCompanyDocument(id: string, notes: string): Promise<CompanyDocument> {
    const response = await axiosInstance.post<CompanyDocumentResponse>(
        API_ROUTE.COMPANY_DOCUMENT.REJECT.PATH(id),
        { notes }
    );
    return mapDocumentResponse(response.data).data;
}

export async function deleteCompanyDocument(id: string): Promise<void> {
    await axiosInstance.delete(API_ROUTE.COMPANY_DOCUMENT.DELETE.PATH(id));
}
