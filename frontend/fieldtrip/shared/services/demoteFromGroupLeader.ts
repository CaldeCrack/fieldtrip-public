import { Api } from '../api/ApiConfig'

interface DemoteFromGroupLeaderResponse {
  message: string
}

const demoteFromGroupLeader = async (
  userId: number,
  fieldtripId: number,
): Promise<DemoteFromGroupLeaderResponse | undefined> => {
  try {
    const response = await Api.post(`demote-group-leader/${userId}/`, {
      fieldtrip_id: fieldtripId,
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export default demoteFromGroupLeader