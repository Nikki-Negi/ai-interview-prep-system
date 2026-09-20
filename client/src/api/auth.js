import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

export async function registerUser(name, email, password) {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
  })

  return response.data
}

export async function loginUser(email, password) {
  const response = await api.post('/auth/login', {
    email,
    password,
  })

  return response.data
}

