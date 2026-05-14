interface EquipmentRequestItem {
  id: number
  typeId: number
  name: string
  quantity: number
  status: 'pending' | 'approved' | 'rejected' | string
}

export default EquipmentRequestItem
