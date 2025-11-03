import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface InvitationBody {
  invitation_code: string
  user: string | number
}

interface InvitationResponse {
  id?: string | number
  alreadyRegistered?: boolean
}

const acceptFieldtripInvitation = async (body: InvitationBody): Promise<InvitationResponse> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.post('fieldtrip-attendee/', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error: any) {
    if (error.status === 409) {
      return {
        alreadyRegistered: true,
      }
    }
    throw new Error(error.response?.data?.detail || error.message)
  }
}

export default acceptFieldtripInvitation
