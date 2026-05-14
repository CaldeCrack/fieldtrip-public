import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'

interface CreateFieldtripEquipmentRequestsBody {
  equipment: { id: number; quantity: number }[]
}

interface CreateFieldtripEquipmentRequestsResponse {
  updated?: number
}

const createFieldtripEquipmentRequests = async (
  fieldtripId: number,
  equipment: { id: number; quantity: number }[],
): Promise<CreateFieldtripEquipmentRequestsResponse> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const body: CreateFieldtripEquipmentRequestsBody = {
      equipment,
    }

    const response = await Api.post<CreateFieldtripEquipmentRequestsResponse>(
      `fieldtrip/${fieldtripId}/equipment-requests/`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default createFieldtripEquipmentRequests
