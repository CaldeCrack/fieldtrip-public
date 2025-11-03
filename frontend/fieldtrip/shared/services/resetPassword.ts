import { Api } from '../api/ApiConfig'

interface ResetPasswordResponse {
  [key: string]: string | number | boolean
}

const resetPassword = async (email: string): Promise<ResetPasswordResponse> => {
  try {
    const response = await Api.post(
      'reset-password/',
      JSON.stringify({
        email,
      }),
    )
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default resetPassword
