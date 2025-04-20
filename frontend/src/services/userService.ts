import api from './api';

export interface User {
  _id: string;
  username: string;
  email: string;
  profilePic?: string;
}

export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    const response = await api.get(`/api/users/search?query=${encodeURIComponent(query)}`);
    return response.data.users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await api.get(`/api/users/${userId}`);
    return response.data.user;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};