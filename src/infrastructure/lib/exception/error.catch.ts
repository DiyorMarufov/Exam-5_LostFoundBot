interface ErrorResponse {
  status?: number;
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface ErrorCatchResult {
  success: boolean;
  statusCode: number;
  message: string;
}
export const errorCatch = (err: any): ErrorCatchResult => {
  const error = err as ErrorResponse;

  const statusCode = error?.status || 500;

  const message =
    error?.response?.data?.message || error?.message || 'Something went wrong';

  return {
    success: false,
    statusCode,
    message,
  };
};
