import { Api } from '../api/ApiConfig'
import type { ListItem } from 'react-native-paper-select/lib/typescript/interface/paperSelect.interface'

interface SignupRequest {
  email: string
  password: string
  names: string
  surnames: string
  registration_number: string
  RUT: string
  diet_type: string
  blood_type: string
  med_allergies: ListItem[]
  substance_allergies: ListItem[]
  emergency_contact: string
  emergency_number: string
  has_previous_experience: boolean
  role: string
}

interface Tokens {
  access: string
  refresh: string
}

interface SignupResponse {
  tokens: Tokens
}

const signup = async (body: SignupRequest): Promise<SignupResponse | undefined> => {
  try {
    const response = await Api.post('signup/', body)
    return response.data
  } catch (error) {
    throw error
  }
}

export default signup
