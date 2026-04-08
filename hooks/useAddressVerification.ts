import { useState } from 'react';
import axios, { AxiosError } from 'axios';

export interface AddressVerificationResponse {
  match: boolean;
  extractedText: string;
  normalizedExtractedText: string;
  normalizedUserAddress: string;
  similarityScore: number;
  threshold: number;
  message: string;
}

export interface AddressVerificationError {
  message: string;
  status?: number;
}

export function useAddressVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AddressVerificationError | null>(null);

  const verifyAddress = async (
    fileOrUrl: File | string,
    address: string,
  ): Promise<AddressVerificationResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!fileOrUrl) {
        throw new Error('No file or URL provided');
      }

      if (!address || address.trim().length === 0) {
        throw new Error('Please enter an address');
      }

      // Create FormData for multipart request
      const formData = new FormData();
      
      // Handle both File objects and S3 URL strings
      if (fileOrUrl instanceof File) {
        formData.append('file', fileOrUrl);
      } else {
        // It's an S3 URL string - send it directly
        formData.append('documentUrl', fileOrUrl);
      }
      
      formData.append('address', address.trim());

      // Call the backend API
      const response = await axios.post<any>(
        '/api/user/verify-address',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      // Extract the verification data from the wrapped response
      // API returns { success, statusCode, message, data: {...verification data...} }
      const verificationData = response.data?.data || response.data;
      return verificationData;
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        (err instanceof Error ? err.message : 'Address verification failed');

      setError({
        message: errorMessage,
        status: axiosError.response?.status,
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    verifyAddress,
    isLoading,
    error,
    clearError,
  };
}
