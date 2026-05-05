import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'

interface FieldtripUserEquipmentResponse {
  equipment?: { id: number; name: string; quantity: number }[]
}

const getFieldtripUserEquipment = async (
  fieldtripId: number | null,
  userId: number,
): Promise<{ id: number; quantity: number }[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get<FieldtripUserEquipmentResponse>(
      `fieldtrip/${fieldtripId}/user-equipment/`,
      {
        params: { user_id: userId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    return (response.data.equipment || []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
    }))
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getFieldtripUserEquipment
