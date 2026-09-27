import axios from 'axios';
import { SnackServicesResponse } from '../types/snackServices';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export const fetchSnackServices = async (
  search?: string,
  status?: string,
  grade?: string,
): Promise<SnackServicesResponse> => {
  const response = await axios.get<SnackServicesResponse>(`${API_BASE_URL}/snack-services`, {
    params: {
      search,
      status: status !== 'ALL' ? status : undefined,
      grade: grade !== 'ALL' ? grade : undefined,
    },
  });
  return response.data;
};
