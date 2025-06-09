import { Api } from '../api/ApiConfig'

export default login = async (body) => {
  try {
    const response = await Api.post(
      `login/`,
      body,
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}
