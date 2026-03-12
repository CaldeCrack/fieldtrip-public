import { Api } from '../api/ApiConfig'

interface DemoteFromAuxiliarResponse {
  message: string
}

const demoteFromAuxiliar = async (
  userId: number,
  fieldtripId: number,
): Promise<DemoteFromAuxiliarResponse | undefined> => {
  try {
    const response = await Api.post(`demote-auxiliar/${userId}/`, {
      fieldtrip_id: fieldtripId,
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export default demoteFromAuxiliar
