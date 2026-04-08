import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import {
    Company,
    CompaniesResponse,
    CompanyFilters,
    CompanyResponse,
    CreateCompanyDto,
    UpdateCompanyDto,
} from "@/types/company.type";

const mapCompaniesResponse = (body: any): CompaniesResponse => {
    const payload = body?.data ?? body;
    const companies = payload?.data ?? payload?.items ?? payload ?? [];
    const pagination = payload?.pagination ?? payload?.meta ?? body?.pagination;

    return {
        success: body?.success,
        statusCode: body?.statusCode,
        message: body?.message ?? "Companies fetched successfully",
        data: Array.isArray(companies) ? companies : [],
        pagination,
        meta: pagination,
    };
};

const mapCompanyResponse = (body: any): CompanyResponse => {
    const payload = body?.data ?? body;
    const data = payload?.data ?? payload;
    return {
        success: body?.success,
        statusCode: body?.statusCode,
        message: body?.message ?? "Company fetched successfully",
        data,
    };
};

export async function getAllCompanies(filters?: CompanyFilters): Promise<CompaniesResponse> {
    const response = await axiosInstance.get<CompaniesResponse>(API_ROUTE.COMPANY.ALL.PATH, {
        params: {
            page: filters?.page ?? 1,
            limit: filters?.limit ?? 10,
            status: filters?.status,
        },
    });
    return mapCompaniesResponse(response.data);
}

export async function getCompaniesByStatus(status: string, filters?: CompanyFilters): Promise<CompaniesResponse> {
    const response = await axiosInstance.get<CompaniesResponse>(
        API_ROUTE.COMPANY.BY_STATUS.PATH(status),
        {
            params: {
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
            },
        }
    );
    return mapCompaniesResponse(response.data);
}

export async function getCompanyByName(legalName: string): Promise<CompanyResponse> {
    const response = await axiosInstance.get<CompanyResponse>(
        API_ROUTE.COMPANY.BY_NAME.PATH(legalName)
    );
    return mapCompanyResponse(response.data);
}

export async function getCompanyById(id: string): Promise<Company> {
    const response = await axiosInstance.get<CompanyResponse>(
        API_ROUTE.COMPANY.VIEW.PATH(id)
    );
    return mapCompanyResponse(response.data).data;
}

export async function createCompany(data: CreateCompanyDto): Promise<Company> {
    const response = await axiosInstance.post<CompanyResponse>(
        API_ROUTE.COMPANY.CREATE.PATH,
        data
    );
    return mapCompanyResponse(response.data).data;
}

export async function updateCompany(id: string, data: UpdateCompanyDto): Promise<Company> {
    const response = await axiosInstance.put<CompanyResponse>(
        API_ROUTE.COMPANY.UPDATE.PATH(id),
        data
    );
    return mapCompanyResponse(response.data).data;
}

export async function deleteCompany(id: string): Promise<void> {
    await axiosInstance.delete(API_ROUTE.COMPANY.DELETE.PATH(id));
}
