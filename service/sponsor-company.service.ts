import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import {
  CreateSponsorCompanyDto,
  SponsorCompany,
  SponsorCompanyResponse,
  UpdateSponsorCompanyDto,
} from "@/types/sponsor-company.type";

export async function getSponsorCompanies(
  page: number = 1,
  limit: number = 10,
  search?: string,
): Promise<SponsorCompanyResponse> {
  const response = await axiosInstance.get<SponsorCompanyResponse>(
    API_ROUTE.SPONSOR_COMPANY.ALL.PATH,
    {
      params: { page, limit, search: search || undefined },
    },
  );
  return response.data;
}

export async function getSponsorCompanyById(id: string): Promise<SponsorCompany> {
  const response = await axiosInstance.get<{ data: SponsorCompany }>(
    API_ROUTE.SPONSOR_COMPANY.VIEW.PATH(id),
  );
  return response.data.data;
}

export async function createSponsorCompany(
  data: CreateSponsorCompanyDto,
): Promise<SponsorCompany> {
  const response = await axiosInstance.post<{ data: SponsorCompany }>(
    API_ROUTE.SPONSOR_COMPANY.CREATE.PATH,
    data,
  );
  return response.data.data;
}

export async function updateSponsorCompany(
  id: string,
  data: UpdateSponsorCompanyDto,
): Promise<SponsorCompany> {
  const response = await axiosInstance.patch<{ data: SponsorCompany }>(
    API_ROUTE.SPONSOR_COMPANY.UPDATE.PATH(id),
    data,
  );
  return response.data.data;
}

export async function deleteSponsorCompany(id: string): Promise<void> {
  await axiosInstance.delete(API_ROUTE.SPONSOR_COMPANY.DELETE.PATH(id));
}
