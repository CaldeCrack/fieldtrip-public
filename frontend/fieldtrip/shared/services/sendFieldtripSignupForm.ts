import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface ChecklistStatus {
  item: number
  status: boolean
}

interface HealthItem {
  item: string | number
  status: boolean
}

interface HealthSpecificItem {
  item: number
  value: string
}

interface FieldtripSignupFormRequest {
  user: number
  fieldtrip: number | null
  checklist_status: ChecklistStatus[]
  health_general: HealthItem[]
  health_specific: HealthSpecificItem[]
}

interface FieldtripSignupFormResponse {
  [key: string]: string | number | boolean
}

const sendFieldtripSignupForm = async (
  body: FieldtripSignupFormRequest,
): Promise<FieldtripSignupFormResponse> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.post('fieldtrip/signup/', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default sendFieldtripSignupForm
