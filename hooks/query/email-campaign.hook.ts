"use client";

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createEmailCampaign, CreateEmailCampaignDto } from '@/service/email-campaign.service';

export const useCreateEmailCampaign = () => {
  return useMutation({
    mutationFn: (dto: CreateEmailCampaignDto) => createEmailCampaign(dto),
    onSuccess: (data) => {
      toast.success(data?.message ?? 'Email campaign created successfully.');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          'Failed to create email campaign',
      );
    },
  });
};