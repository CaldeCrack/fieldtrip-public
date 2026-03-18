import { Api } from '../api/ApiConfig'

interface UpdatePersonalInfoRequest {
  emergency_contact: string
  emergency_number: number
  diet_type: number
  diet_info: string
}

interface UpdatePersonalInfoResponse {
  emergency_contact: string
  emergency_number: number
  diet_type: number | null
  diet_info: string
}

const updatePersonalInfo = async (
  body: UpdatePersonalInfoRequest,
): Promise<UpdatePersonalInfoResponse | undefined> => {
  try {
    const response = await Api.patch('personal-info/', body)
    return response.data
  } catch (error) {
    throw error
  }
}

export default updatePersonalInfo
