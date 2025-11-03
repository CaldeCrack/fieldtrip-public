import { Api } from '../api/ApiConfig'

interface LoginCredentials {
  email: string
  password: string
}

interface Tokens {
  access: string
  refresh: string
}

interface LoginResponse {
  tokens: Tokens
  names: string
  surnames: string
}

const login = async (body: LoginCredentials): Promise<LoginResponse | undefined> => {
  try {
    const response = await Api.post('login/', body)
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export default login
