import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'
import { EquipmentItem } from '@types'

interface FieldtripEquipmentOptionsResponse {
  equipment?: EquipmentItem[]
}

const getFieldtripEquipmentOptions = async (id: number | null): Promise<EquipmentItem[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get<FieldtripEquipmentOptionsResponse>(
      `fieldtrip/${id}/equipment-options/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    return response.data.equipment || []
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getFieldtripEquipmentOptions
