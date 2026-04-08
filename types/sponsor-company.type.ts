import { z } from "zod";

export const sponsorCompanySchema = z.object({
  nameOfCompany: z.string().min(1, "Name of company is required"),
  nameOfOwner: z.string().min(1, "Name of owner is required"),
  tradeLicenceNo: z.string().min(1, "Trade licence number is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  tradeLicenseUrl: z.string().min(1, "Trade license upload is required"),
  moaUrl: z.string().optional().nullable(),
  labourCardUrl: z.string().optional().nullable(),
});

export type SponsorCompanySchema = z.infer<typeof sponsorCompanySchema>;

export interface SponsorCompany {
  _id: string;
  nameOfCompany: string;
  nameOfOwner: string;
  tradeLicenceNo: string;
  expiryDate: string;
  tradeLicenseUrl: string;
  moaUrl?: string | null;
  labourCardUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: any;
  updatedBy?: any;
}

export interface SponsorCompanyResponse {
  message?: string;
  data: SponsorCompany[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface CreateSponsorCompanyDto {
  nameOfCompany: string;
  nameOfOwner: string;
  tradeLicenceNo: string;
  expiryDate: string;
  tradeLicenseUrl: string;
  moaUrl?: string | null;
  labourCardUrl?: string | null;
}

export type UpdateSponsorCompanyDto = Partial<CreateSponsorCompanyDto>;
