import { Api } from '../api/ApiConfig'

interface PersonalInfoResponse {
  emergency_contact: string | null
  emergency_number: number | null
  diet_type: number | null
  diet_info: string
}

const getPersonalInfo = async (): Promise<PersonalInfoResponse | undefined> => {
  try {
    const response = await Api.get('personal-info/')
    return response.data
  } catch (error) {
    throw error
  }
}

export default getPersonalInfo
