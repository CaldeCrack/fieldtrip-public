import { useRouter } from 'expo-router'
import { Surface, Text, Divider } from 'react-native-paper'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { useContext, useEffect, useState } from 'react'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { jwtDecode } from 'jwt-decode'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { BulletList, Page } from '@components'
import { viewHealthChart, getUsersHealthChart } from '@services'
import { HealthChartContext } from '../_layout'
import { COLORS } from '@colors'
import { Payload } from '@types'

interface Item {
  item: string
  value: string
}

const HealthChart = () => {
  const router = useRouter()
  const { HCState } = useContext(HealthChartContext)
  const [loading, setLoading] = useState(true)
  const [constantChartData, setConstantChartData] = useState({
    fullName: '',
    bloodType: '',
    medAllergies: [],
    substanceAllergies: [],
    emergencyContact: {
      name: '',
      phone: '',
    },
  })
  const [fieldtripChartData, setFieldtripChartData] = useState({
    inTreatmentFor: '',
    takingMeds: '',
    hasPresented: [],
    presents: [],
    healthSpecific: [],
  })
  const hasData = constantChartData.fullName && fieldtripChartData.healthSpecific

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const token = await AsyncStorage.getItem('access_token')
        if (!token) {
          router.replace('/login')
          return
        }
        const jwt = jwtDecode<Payload>(token)
        if (HCState.fieldtripID) {
          const [usersHealthChartData, viewHealthChartData] = await Promise.all([
            getUsersHealthChart(HCState.fieldtripID, HCState.healthChartOwner),
            viewHealthChart({
              viewer: jwt.user_id,
              owner: HCState.healthChartOwner,
              fieldtrip: HCState.fieldtripID,
            }),
          ])

          if (usersHealthChartData) {
            setFieldtripChartData(usersHealthChartData)
          }
          if (viewHealthChartData) {
            setConstantChartData(viewHealthChartData)
          }
        }
      } catch (error) {
        console.error(error)
        alert('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    })()
  }, [HCState, router])

  return (
    <Page style={styles.page} showTabs={true}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary_50} style={styles.loader} />
      ) : hasData ? (
        <Surface elevation={0} style={styles.container}>
          <View style={styles.title}>
            <Text variant="titleLarge" style={{ fontWeight: 500 }}>
              {constantChartData.fullName}
            </Text>
            <Icon name="account-heart" style={styles.healthIcon} size={34} />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.section}>
            <Text variant="bodyLarge" style={styles.weight500}>
              Tipo sanguíneo: {constantChartData.bloodType}
            </Text>
          </View>
          <View style={styles.section}>
            <Text variant="bodyLarge" style={styles.weight500}>
              Contacto de emergencia:
            </Text>
            <Text variant="bodyLarge" style={styles.weight500}>
              {constantChartData.emergencyContact.name} ({constantChartData.emergencyContact.phone})
            </Text>
          </View>
          <View style={styles.section}>
            <Text variant="bodyLarge" style={styles.weight500}>
              Es alérgico/a a los siguientes medicamentos:
            </Text>
            <BulletList data={constantChartData.medAllergies} />
          </View>
          <View style={styles.section}>
            <Text variant="bodyLarge" style={styles.weight500}>
              Es alérgico/a a las siguientes sustancias:
            </Text>
            <BulletList data={constantChartData.substanceAllergies} />
          </View>
          <View style={styles.section}>
            <Text variant="bodyLarge" style={styles.weight500}>
              Ha presentado las siguientes enfermedades:
            </Text>
            <BulletList data={fieldtripChartData.hasPresented} />
          </View>
          <View style={styles.section}>
            <Text variant="bodyLarge" style={styles.weight500}>
              Padece de las siguientes enfermedades:
            </Text>
            <BulletList data={fieldtripChartData.presents} />
          </View>
          {fieldtripChartData.healthSpecific && (
            <>
              {fieldtripChartData.healthSpecific.map((item: Item, index) => (
                <View style={styles.section} key={index}>
                  <Text variant="bodyLarge" style={styles.weight500}>
                    {item.item}:
                  </Text>
                  <View style={styles.row}>
                    <Icon name="chevron-right" size={20} color={'#00796b'} />
                    <Text variant="bodyLarge">{item.value}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </Surface>
      ) : (
        <View>
          <Icon name="alert-circle-outline" size={48} color={COLORS.gray_100} />
          <Text>No hay información para mostrar.</Text>
        </View>
      )}
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray_100,
    minWidth: 320,
    width: '100%',
    backgroundColor: COLORS.gray_base,
    flexDirection: 'column',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  title: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  section: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  weight500: {
    fontWeight: 400,
  },
  avatar: {
    marginLeft: 16,
  },
  healthIcon: {
    marginLeft: 'auto',
    color: COLORS.primary_50,
  },
  divider: {
    backgroundColor: COLORS.primary_50,
    marginBottom: 20,
  },
  loader: {
    margin: 10,
  },
})

export default HealthChart
