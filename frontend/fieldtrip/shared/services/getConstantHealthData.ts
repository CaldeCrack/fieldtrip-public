import { Api } from '../api/ApiConfig'

interface EmergencyContact {
  name: string
  phone: string
}

interface ConstantHealthDataResponse {
  fullName: string
  bloodType: string
  medAllergies: string[]
  substanceAllergies: string[]
  emergencyContact: EmergencyContact
  preferredMedicalInstitution: string | null
}

const getConstantHealthData = async (
  fieldtripID: number,
  userID: number,
): Promise<ConstantHealthDataResponse | undefined> => {
  try {
    const response = await Api.get(`fieldtrip/${fieldtripID}/chart-data/${userID}/`)
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getConstantHealthData
