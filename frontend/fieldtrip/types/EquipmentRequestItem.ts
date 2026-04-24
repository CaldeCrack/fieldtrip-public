interface EquipmentRequestItem {
  id: number
  name: string
  quantity: number
  status: 'pending' | 'approved' | 'rejected' | string
}

export default EquipmentRequestItem
