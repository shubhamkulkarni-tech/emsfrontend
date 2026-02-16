import axios from "axios";

const BASE_URL = "https://emsbackend-2w9c.onrender.com/api/notifications";

const getTokenHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// ✅ My Notifications
export const getMyNotifications = (token, page = 1, limit = 10) => {
  return axios.get(`${BASE_URL}/my?page=${page}&limit=${limit}`, getTokenHeader(token));
};

// ✅ Unread Count
export const getUnreadCount = (token) => {
  return axios.get(`${BASE_URL}/unread-count`, getTokenHeader(token));
};

// ✅ Mark all read
export const markAllRead = (token) => {
  return axios.put(`${BASE_URL}/read-all`, {}, getTokenHeader(token));
};

// ✅ Mark one read
export const markOneRead = (token, id) => {
  return axios.put(`${BASE_URL}/read/${id}`, {}, getTokenHeader(token));
};

// ✅ Delete one notification
export const deleteOneNotification = (token, id) => {
  return axios.delete(`${BASE_URL}/${id}`, getTokenHeader(token));
};
