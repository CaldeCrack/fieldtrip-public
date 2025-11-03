import { Api } from '../api/ApiConfig'

interface HealthItem {
  item: string
  value: string
}

interface FieldtripChart {
  inTreatmentFor: string
  takingMeds: string
  hasPresented: string[]
  presents: string[]
  healthSpecific: HealthItem[]
}

const getUsersHealthChart = async (
  fieldtripID: number,
  userID: number | null,
): Promise<FieldtripChart | undefined> => {
  try {
    const response = await Api.get(`/fieldtrip/${fieldtripID}/chart/${userID}/`)
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export default getUsersHealthChart
