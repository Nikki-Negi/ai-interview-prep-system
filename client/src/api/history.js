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

export async function getUserHistory(email) {
  const response = await api.get(`/history/${encodeURIComponent(email)}`, {
    headers: getAuthHeaders(),
  })
  return response.data
}

export async function getInterviewDetail(email, recordId) {
  const response = await api.get(
    `/history/${encodeURIComponent(email)}/${encodeURIComponent(recordId)}`,
    {
      headers: getAuthHeaders(),
    },
  )
  return response.data
}
