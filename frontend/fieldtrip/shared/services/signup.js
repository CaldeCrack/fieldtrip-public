import { Api } from '../api/ApiConfig'

export default signup = async (body) => {
  try {
    const response = await Api.post(
      `signup/`,
      body,
    )
    return response.data
  } catch (error) {
    throw error
  }
}
