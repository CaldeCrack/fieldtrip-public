import { Api } from '../api/ApiConfig'

export default getUsersHealthChart = async (fieldtripID, userID) => {
  try {
    const response = await Api.get(
        `/fieldtrip/${fieldtripID}/chart/${userID}/`
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}
