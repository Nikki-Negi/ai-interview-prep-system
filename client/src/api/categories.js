import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

export async function getCategories() {
  const response = await api.get('/categories')
  return response.data
}
