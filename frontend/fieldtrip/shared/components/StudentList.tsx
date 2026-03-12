import { useRouter } from 'expo-router'
import { Divider, List, MD3Colors } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'

import { StyleSheet, View } from 'react-native'
import { useEffect, useState } from 'react'
import ConfirmationModal from './ConfirmationModal'
import { Payload } from '@types'
import { promoteToAuxiliar, demoteFromAuxiliar } from '../services'

type StudentItem = {
  id: number
  name: string
  signupComplete?: boolean
  fieldtripID?: number
  isAuxiliar?: boolean
}

type Props = {
  data: StudentItem[]
  setState: (_fieldtripID: number, _name: string, _id: number) => void
}

const StudentList = ({ data, setState }: Props) => {
  const router = useRouter()

  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [auxiliarUpdates, setAuxiliarUpdates] = useState<Record<number, boolean>>({})
  const _toggleModal = (name: string) => () => setVisible({ ...visible, [name]: !visible[name] })
  const _getVisible = (name: string) => !!visible[name]

  // Merge original data with local auxiliar updates
  const mergedData = data.map((item) => ({
    ...item,
    isAuxiliar: auxiliarUpdates.hasOwnProperty(item.id)
      ? auxiliarUpdates[item.id]
      : item.isAuxiliar,
  }))

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      const jwt = jwtDecode<Payload>(token)
      if (!jwt.custom_data.is_teacher) {
        router.replace('/')
      }
    })()
  }, [router])

  return (
    <View style={styles.wrapper}>
      <List.Section style={styles.section}>
        {mergedData
          .sort((a, b) => {
            // Sort auxiliars first
            if (a.isAuxiliar && !b.isAuxiliar) return -1
            if (!a.isAuxiliar && b.isAuxiliar) return 1
            return 0
          })
          .map((item) => (
            <View key={String(item.id)}>
              <List.Accordion
                title={item.name}
                style={styles.accordion}
                right={() => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.isAuxiliar && (
                      <List.Icon
                        color={MD3Colors.tertiary50}
                        icon="account-star"
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <List.Icon
                      color={item.signupComplete ? MD3Colors.primary50 : MD3Colors.error50}
                      icon={item.signupComplete ? 'check' : 'alert-circle-outline'}
                    />
                  </View>
                )}
              >
                <List.Item
                  title="Estado de inscripción"
                  left={(props) => (
                    <List.Icon
                      {...props}
                      color={item.signupComplete ? MD3Colors.primary50 : MD3Colors.error50}
                      icon={item.signupComplete ? 'check' : 'alert-circle-outline'}
                    />
                  )}
                />
                <List.Item
                  onPress={_toggleModal(`modal-${item.id}`)}
                  title="Ver ficha de salud"
                  left={(props) => <List.Icon {...props} icon="account-heart" />}
                />
                <List.Item
                  onPress={_toggleModal(`auxiliar-${item.id}`)}
                  title={item.isAuxiliar ? 'Remover auxiliar' : 'Promover a auxiliar'}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={item.isAuxiliar ? 'account-star-outline' : 'account-star'}
                    />
                  )}
                />
                <ConfirmationModal
                  visible={_getVisible(`modal-${item.id}`)}
                  close={_toggleModal(`modal-${item.id}`)}
                  open={() => {
                    setState(item.fieldtripID!, item.name, item.id)
                    setVisible({ ...visible, [`modal-${item.id}`]: false })
                    router.push('/fieldtrip/chart')
                  }}
                  title={`¿Está seguro/a que desea ver la información de salud de ${item.name}?`}
                  description={`Esta acción quedará registrada y podrá ser vista por ${item.name}.`}
                />
                <ConfirmationModal
                  visible={_getVisible(`auxiliar-${item.id}`)}
                  close={_toggleModal(`auxiliar-${item.id}`)}
                  open={async () => {
                    try {
                      const result = item.isAuxiliar
                        ? await demoteFromAuxiliar(item.id, item.fieldtripID!)
                        : await promoteToAuxiliar(item.id, item.fieldtripID!)
                      if (result) {
                        console.log(result.message)
                        // Update local state to reflect the change immediately
                        setAuxiliarUpdates((prev) => ({
                          ...prev,
                          [item.id]: !item.isAuxiliar,
                        }))
                        // TODO: Show success message to user
                      }
                    } catch (error) {
                      console.error(
                        `Error ${item.isAuxiliar ? 'demoting from' : 'promoting to'} auxiliar:`,
                        error,
                      )
                      // TODO: Show error message to user
                    }
                    setVisible({ ...visible, [`auxiliar-${item.id}`]: false })
                  }}
                  title={
                    item.isAuxiliar
                      ? `¿Está seguro/a que desea remover a ${item.name} como auxiliar?`
                      : `¿Está seguro/a que desea promover a ${item.name} a auxiliar?`
                  }
                  description={
                    item.isAuxiliar
                      ? `${item.name} ya no será auxiliar para esta salida a campo.`
                      : `${item.name} será marcado como auxiliar para esta salida a campo.`
                  }
                />
              </List.Accordion>
              <Divider style={styles.divider} />
            </View>
          ))}
      </List.Section>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  section: {
    width: '100%',
    paddingVertical: 0,
  },
  accordion: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 0,
  },
  divider: {
    backgroundColor: MD3Colors.primary50,
  },
})

export default StudentList
