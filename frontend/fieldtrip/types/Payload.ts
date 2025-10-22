import { JwtPayload } from 'jwt-decode'

interface Payload extends JwtPayload {
  user_id: number
  is_student: boolean
  custom_data: {
    is_student: boolean
    is_teacher: boolean
  }
}

export default Payload
