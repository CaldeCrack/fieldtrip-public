import { StyleSheet, View, ScrollView, Dimensions, Platform } from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { MD3Colors, Text } from 'react-native-paper'
import { BarChart } from 'react-native-chart-kit'

import { ContainedButton, Page, StudentList, BulletList } from '@components'
import { getFieldtripAttendees, getFieldtripMetrics } from '@services'
import { FieldtriptContext, HealthChartContext } from '../../shared/context/FieldtripContext'
import { COLORS } from '@colors'
import StudentAttendee from 'types/StudentAttendee'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'

interface Allergy {
  name: string
  count: number
}

interface Disease {
  name: string
  count: number
}

interface chartData {
  diseases: {
    labels: string[]
    datasets: [{ data: number[] }]
  }
  allergies: {
    labels: string[]
    datasets: [{ data: number[] }]
  }
}

const Fieldtrip = () => {
  const { FState } = useContext(FieldtriptContext)
  const { HCDispatch } = useContext(HealthChartContext)
  const setState = (fieldtripID: number, fieldtripName: string, healthChartOwner: number) => {
    HCDispatch({
      fieldtripID,
      fieldtripName,
      healthChartOwner,
    })
  }

  const [showStudentList, setShowStudentList] = useState(true)
  const [showMetrics, setShowMetrics] = useState(false)
  const [students, setStudents] = useState<StudentAttendee[]>([])
  const [loading, setLoading] = useState(true) // Estado de carga
  const [chartData, setChartData] = useState<chartData>({
    diseases: {
      labels: [
        /*
        'Obesidad mórbida',
        'Enfermedades respiratorias',
        'Cólicos',
        'Asma',*/
      ],
      datasets: [
        {
          //data: [5, 2, 3, 1],
          data: [],
        },
      ],
    },
    allergies: {
      labels: [
        /*
        'Obesidad mórbida',
        'Enfermedades respiratorias',
        'Cólicos',
        'Asma',*/
      ],
      datasets: [
        {
          //data: [5, 2, 3, 1],
          data: [],
        },
      ],
    },
  })
  const chartConfig = {
    backgroundGradientFrom: '#fafafa',
    backgroundGradientTo: '#fafafa',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    propsForLabels: {
      fontSize: 16,
      fontWeight: '700',
    },
    propsForDataLabels: {
      fontSize: 14,
      fontWeight: '700',
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
    },
  }

  const chartWidth =
    Platform.OS === 'web'
      ? Math.min(Dimensions.get('window').width - 32, 600)
      : Dimensions.get('window').width
  const chartRenderWidth =
    Platform.OS === 'web' ? Math.max(chartWidth - 48, 280) : Math.max(chartWidth - 24, 280)

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      if (FState.fieldtripID) {
        setLoading(true)
        try {
          const res = await getFieldtripAttendees(FState.fieldtripID)
          if (res) {
            setStudents(res)
          }
        } catch (error) {
          // @ts-ignore
          throw new Error(error.response?.data?.detail || error.message)
        } finally {
          setLoading(false)
        }
      }
      getFieldtripMetrics(FState.fieldtripID)
        .then((res) => {
          if (res) {
            const diseases = res.diseases?.map((d: Disease) => d.name) || []
            const diseaseCounts = res.diseases?.map((d: Disease) => d.count) || []
            const allergies = res.allergies?.map((a: Allergy) => a.name) || []
            const allergyCounts = res.allergies?.map((a: Allergy) => a.count) || []

            setChartData({
              diseases: {
                labels: diseases,
                datasets: [{ data: diseaseCounts }],
              },
              allergies: {
                labels: allergies,
                datasets: [{ data: allergyCounts }],
              },
            })
          }
        })
        .catch((error) => {
          console.log(error)
          throw new Error(error.response?.data?.detail || error.message)
        })
    })()
  }, [FState])

  return (
    <Page style={styles.page} showTabs={true}>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={{ maxHeight: 40 }}
      >
        <View style={styles.btns}>
          <ContainedButton
            style={[
              styles.btnMarginRight,
              styles.btnMarginBottom,
              {
                backgroundColor: showStudentList ? MD3Colors.primary50 : COLORS.gray_100,
              },
            ]}
            onPress={() => {
              setShowStudentList(!showStudentList)
              setShowMetrics(false)
            }}
          >
            Asistentes
          </ContainedButton>
          <ContainedButton
            style={[
              styles.btnMarginRight,
              styles.btnMarginBottom,
              {
                backgroundColor: showMetrics ? MD3Colors.primary50 : COLORS.gray_100,
              },
            ]}
            onPress={() => {
              setShowMetrics(!showMetrics)
              setShowStudentList(false)
            }}
          >
            Métricas
          </ContainedButton>
        </View>
      </ScrollView>
      {loading ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Cargando asistentes...</Text>
        </View>
      ) : (
        <>
          {showStudentList && students.length > 0 && (
            <StudentList data={students} setState={setState} />
          )}
          {showStudentList && students.length <= 0 && (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No se ha registrado ningún estudiante.</Text>
            </View>
          )}
        </>
      )}
      {showMetrics && (
        <>
          {/* Enfermedades */}
          <Text variant="titleMedium" style={{ fontWeight: 600, marginTop: 8 }}>
            Enfermedades
          </Text>
          {chartData.diseases && chartData.diseases.labels.length > 0 ? (
            Platform.OS === 'web' ? (
              <View style={styles.chartWrapper}>
                <BarChart
                  fromZero={true}
                  data={chartData.diseases}
                  showValuesOnTopOfBars={true}
                  height={250}
                  width={chartRenderWidth}
                  chartConfig={chartConfig}
                  withHorizontalLabels={false}
                  verticalLabelRotation={0}
                  xLabelsOffset={0}
                  yAxisLabel=""
                  yAxisSuffix=""
                />
              </View>
            ) : (
              <BulletList data={chartData.diseases.labels} />
            )
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No se han registrado suficientes estudiantes para mostrar esta información.
              </Text>
            </View>
          )}

          {/* Alergias */}
          <Text variant="titleMedium" style={{ fontWeight: 600, marginTop: 16 }}>
            Alergias
          </Text>
          {Platform.OS === 'web' ? (
            <View style={styles.chartWrapper}>
              <BarChart
                fromZero={true}
                data={chartData.allergies || { labels: [], datasets: [{ data: [] }] }}
                showValuesOnTopOfBars={true}
                height={250}
                width={chartRenderWidth}
                chartConfig={chartConfig}
                withHorizontalLabels={false}
                verticalLabelRotation={0}
                xLabelsOffset={0}
                yAxisLabel=""
                yAxisSuffix=""
              />
            </View>
          ) : (
            <BulletList data={chartData.allergies?.labels || []} />
          )}
        </>
      )}
      {/*{showEquipment && <StudentList data={fieldtripData.students} />}*/}
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
  scrollView: {
    flexGrow: 0,
    marginBottom: 16,
  },
  btns: {
    flexDirection: 'row',
    paddingHorizontal: 0,
  },
  btnMarginRight: {
    marginRight: 10,
  },
  btnMarginBottom: {
    marginBottom: 0,
  },
  emptyStateContainer: {
    marginTop: 24,
    width: 300,
  },
  emptyStateText: {
    textAlign: 'center',
  },
  icon: {
    marginInlineStart: 'auto',
  },
  divider: {
    marginTop: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.primary_50,
    width: '100%',
  },
  chartWrapper: {
    width: '100%',
    alignItems: 'center',
  },
})

export default Fieldtrip
