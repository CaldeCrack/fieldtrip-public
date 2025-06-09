import { Api } from '../api/ApiConfig'

export default resetPassword = async (email) => {
  try {
    const response = await Api.post(
      `reset-password/`,
      JSON.stringify({
        email,
      }),
    )
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.message)
  }
}
