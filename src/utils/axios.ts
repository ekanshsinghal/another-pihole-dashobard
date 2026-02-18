// src/lib/axios.ts
import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

class ApiClient {
	private client: AxiosInstance;
	private csrfToken: string | null = null;

	constructor(baseURL: string) {
		this.client = axios.create({
			baseURL,
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		this.setupInterceptors();
		this.restoreCsrfToken();
	}

	private setupInterceptors() {
		// Request interceptor
		this.client.interceptors.request.use(
			(config) => {
				if (this.csrfToken && config.headers) {
					config.headers['X-CSRF-TOKEN'] = this.csrfToken;
				}
				return config;
			},
			(error: AxiosError) => Promise.reject(error),
		);
		// Response interceptor
		this.client.interceptors.response.use(
			(response) => {
				// Check if this is an /api/auth response containing CSRF token
				if (response.config.url?.includes('auth') && response.data) {
					const csrfToken = response.data.session?.csrf;
					if (csrfToken) {
						this.csrfToken = csrfToken;
						// Also store in localStorage for persistence
						localStorage.setItem('csrf-token', csrfToken);
					}
				}
				return response;
			},
			(error: AxiosError) => {
				if (error.response?.status === 401) {
					console.log('redirectin to login');
					this.csrfToken = null;
					localStorage.removeItem('csrf-token');
					window.location.href = '/login';
				}
				return Promise.reject(error);
			},
		);
	}

	restoreCsrfToken(): void {
		const storedToken = localStorage.getItem('csrf-token');
		if (storedToken) {
			this.csrfToken = storedToken;
		}
	}

	get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
		return this.client.get(url, config).then((res) => res);
	}

	post<T>(url: string, data?: T, config?: AxiosRequestConfig): Promise<AxiosResponse> {
		return this.client.post(url, data, config).then((res) => res);
	}

	put<T>(url: string, data?: T, config?: AxiosRequestConfig): Promise<AxiosResponse> {
		return this.client.put(url, data, config).then((res) => res);
	}

	patch<T>(url: string, data?: T, config?: AxiosRequestConfig): Promise<AxiosResponse> {
		return this.client.patch(url, data, config).then((res) => res);
	}

	delete(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
		return this.client.delete(url, config).then((res) => res);
	}
}

// Single instance - configure baseURL in .env
const apiClient = new ApiClient('/api');

export default apiClient;
