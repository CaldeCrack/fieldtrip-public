import { Api } from '../api/ApiConfig'

interface PromoteToGroupLeaderResponse {
  message: string
}

const promoteToGroupLeader = async (
  userId: number,
  fieldtripId: number,
): Promise<PromoteToGroupLeaderResponse | undefined> => {
  try {
    const response = await Api.post(`promote-group-leader/${userId}/`, {
      fieldtrip_id: fieldtripId,
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export default promoteToGroupLeader