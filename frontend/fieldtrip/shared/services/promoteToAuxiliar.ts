import { Api } from '../api/ApiConfig'

interface PromoteToAuxiliarResponse {
  message: string
}

const promoteToAuxiliar = async (
  userId: number,
  fieldtripId: number,
): Promise<PromoteToAuxiliarResponse | undefined> => {
  try {
    const response = await Api.post(`promote-auxiliar/${userId}/`, {
      fieldtrip_id: fieldtripId,
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export default promoteToAuxiliar
