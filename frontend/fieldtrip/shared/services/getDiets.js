import { Api } from '../api/ApiConfig'

export default getDiets = async () => {
  try {
    const response = await Api.get(`user/diet/`)
    return response.data
  } catch (error) {
    console.log(error)
  }
}
