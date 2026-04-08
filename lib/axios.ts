import axios from 'axios';
import { getCookie } from 'cookies-next';

// No baseURL needed - we use the Next.js proxy (/api routes)
const axiosInstance = axios.create(
    {
        // baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-rashoihq.ezsoftapp.in',
        // Configure for large file uploads
        timeout: 300000, // 5 minutes timeout
        maxContentLength: 1024 * 1024 * 1024, // 1GB
        maxBodyLength: 1024 * 1024 * 1024, // 1GB
        headers: {
            'Content-Type': 'application/json',
        }
    }
);

// Add a request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Add access token to all requests
        const token = getCookie('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Do something with request error
        return Promise.reject(error);
    }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized errors globally — but NOT for login request
        // (failed login should show error on the login page, not redirect)
        const isLoginRequest =
            error.config?.url?.includes('/auth/login') ||
            error.config?.url?.includes('/api/auth/login');

        if (error.response?.status === 401 && !isLoginRequest) {
            console.error('Unauthorized access - redirecting to login');

            if (typeof window !== 'undefined') {
                import('./session').then(({ clearSession }) => {
                    clearSession();
                    window.location.href = '/home';
                });
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
