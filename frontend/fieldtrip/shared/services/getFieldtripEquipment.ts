import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'
import { EquipmentItem } from '@types'

interface FieldtripEquipmentResponse {
  equipment?: EquipmentItem[]
}

const getFieldtripEquipment = async (id: number | null): Promise<EquipmentItem[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get<FieldtripEquipmentResponse>(`fieldtrip/${id}/equipment/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data.equipment || []
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getFieldtripEquipment
