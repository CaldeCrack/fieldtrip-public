import { useRouter } from 'expo-router'
import { Divider, List, MD3Colors } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from "jwt-decode"

import { StyleSheet, View } from 'react-native'
import { useEffect, useState } from 'react'
import ConfirmationModal from './ConfirmationModal'

const StudentList = (props) => {
  const { data, setState } = props
  const router = useRouter()

  const [visible, setVisible] = useState({})
  const _toggleModal = (name) => () =>
    setVisible({ ...visible, [name]: !visible[name] })
  const _getVisible = (name) => !!visible[name]

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      const jwt = jwtDecode(token)
      if (!jwt.custom_data.is_teacher) {
        router.replace('/')
      }
    })()
  }, [])

  return (
    <View style={styles.wrapper}>
      <List.Section style={styles.section}>
        {data.map((item) => (
          <View key={item.id}>
            <List.Accordion
              title={item.name}
              style={styles.accordion}
              right={() => (
                <List.Icon
                  color={
                    item.signupComplete
                      ? MD3Colors.primary50
                      : MD3Colors.error50
                  }
                  icon={item.signupComplete ? 'check' : 'alert-circle-outline'}
                />
              )}
            >
              <List.Item
                title="Estado de inscripción"
                left={(props) => (
                  <List.Icon
                    {...props}
                    color={
                      item.signupComplete
                        ? MD3Colors.primary50
                        : MD3Colors.error50
                    }
                    icon={
                      item.signupComplete ? 'check' : 'alert-circle-outline'
                    }
                  />
                )}
              />
              <List.Item
                onPress={_toggleModal(`modal-${item.id}`)}
                title="Ver ficha de salud"
                left={(props) => <List.Icon {...props} icon="account-heart" />}
              />
              <ConfirmationModal
                visible={_getVisible(`modal-${item.id}`)}
                close={_toggleModal(`modal-${item.id}`)}
                open={() => {
                  setState(item.fieldtripID, item.name, item.id)
                  setVisible({ ...visible, [`modal-${item.id}`]: false })
                  router.push('fieldtrip/chart')
                }}
                title={`¿Está seguro/a que desea ver la información de salud de ${item.name}?`}
                description={`Esta acción quedará registrada y podrá ser vista por ${item.name}.`}
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
    paddingVertical: 0
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
