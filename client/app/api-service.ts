import axios from 'axios';
import { ApiResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const analyzeText = async (text: string, mode: 'single' | 'conversation' = 'single'): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
      text,
      mode
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    }
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to the server'
      }
    };
  }
};
