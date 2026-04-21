import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'
import { EquipmentItem } from '@types'

interface EquipmentListResponse {
  equipment: EquipmentItem[]
}

const getEquipmentList = async (courseId: number): Promise<EquipmentItem[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get<EquipmentListResponse>(`equipment/list/${courseId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data.equipment || []
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getEquipmentList
