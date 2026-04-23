import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

type FieldtripSignupStatusResponse = {
  signup_complete: boolean
  is_auxiliar: boolean
  selected_checklist_item_id: number | null
}

const getFieldtripSignUpStatus = async (
  id: number | null,
): Promise<FieldtripSignupStatusResponse> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get(`fieldtrip/${id}/signup-status/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getFieldtripSignUpStatus
