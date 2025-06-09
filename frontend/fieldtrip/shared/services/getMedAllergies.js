import { Api } from '../api/ApiConfig'

export default getMedAllergies = async () => {
  try {
    const response = await Api.get(`user/med-allergy/`)
    return response.data
  } catch (error) {
    console.log(error)
  }
}
