import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'
import { EquipmentRequestItem } from '@types'

interface FieldtripEquipmentRequestsResponse {
  requests?: EquipmentRequestItem[]
}

const getFieldtripEquipmentRequests = async (id: number | null): Promise<EquipmentRequestItem[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get<FieldtripEquipmentRequestsResponse>(`fieldtrip/${id}/equipment-requests/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data.requests || []
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getFieldtripEquipmentRequests
