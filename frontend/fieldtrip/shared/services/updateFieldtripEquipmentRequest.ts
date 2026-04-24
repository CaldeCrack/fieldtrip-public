import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'

interface UpdateFieldtripEquipmentRequestBody {
  status: 'approved' | 'rejected'
}

interface UpdateFieldtripEquipmentRequestResponse {
  id: number
  status: string
}

const updateFieldtripEquipmentRequest = async (
  fieldtripId: number,
  requestId: number,
  body: UpdateFieldtripEquipmentRequestBody,
): Promise<UpdateFieldtripEquipmentRequestResponse> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.patch(`fieldtrip/${fieldtripId}/equipment-requests/${requestId}/`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default updateFieldtripEquipmentRequest
