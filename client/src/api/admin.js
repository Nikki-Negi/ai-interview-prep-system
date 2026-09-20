import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

const TOKEN_KEY = 'ai_interview_prep_token'

function getAuthHeaders() {
  const token =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)

  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function checkIsAdmin(email) {
  const response = await api.get(`/admin/check/${encodeURIComponent(email)}`, {
    headers: getAuthHeaders(),
  })
  return response.data
}

export async function getAllInterviews() {
  const response = await api.get('/admin/all-interviews', {
    headers: getAuthHeaders(),
  })
  return response.data
}

export async function getAllUsers() {
  const response = await api.get('/admin/all-users', {
    headers: getAuthHeaders(),
  })
  return response.data
}

export async function deleteUser(email) {
  const response = await api.delete(`/admin/users/${encodeURIComponent(email)}`, {
    headers: getAuthHeaders(),
  })
  return response.data
}
