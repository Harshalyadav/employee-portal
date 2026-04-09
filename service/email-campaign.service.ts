import axiosInstance from '@/lib/axios';
import { API_ROUTE } from '@/routes';

export interface CreateEmailCampaignDto {
  name: string;
  subject: string;
  senderName?: string;
  senderEmail?: string;
  type?: 'classic';
  htmlContent: string;
  listIds: number[];
  scheduledAt?: string;
}

export interface CreateEmailCampaignResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    id?: number;
    name: string;
    subject: string;
    sender: {
      name: string;
      email: string;
    };
    recipients: {
      listIds: number[];
    };
    scheduledAt?: string;
  };
}

export async function createEmailCampaign(
  dto: CreateEmailCampaignDto,
): Promise<CreateEmailCampaignResponse> {
  const response = await axiosInstance.post<CreateEmailCampaignResponse>(
    API_ROUTE.EMAIL_CAMPAIGN.CREATE.PATH,
    dto,
  );

  return response.data;
}