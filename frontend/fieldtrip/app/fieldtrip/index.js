import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { MD3Colors, Text } from 'react-native-paper'
import { BarChart } from 'react-native-chart-kit'

import { ContainedButton, Page, StudentList, BulletList } from '@components'
import { getFieldtripAttendees, getFieldtripMetrics } from '@services'
import { FieldtriptContext, HealthChartContext } from '../_layout'
import { COLORS } from '../../styles/colors'

const Fieldtrip = () => {
  const { FState } = useContext(FieldtriptContext)
  const { HCDispatch } = useContext(HealthChartContext)
  const setState = (fieldtripID, fieldtripName, healthChartOwner) => {
    HCDispatch({
      fieldtripID,
      fieldtripName,
      healthChartOwner,
    })
  }

  const [showStudentList, setShowStudentList] = useState(true)
  const [showMetrics, setShowMetrics] = useState(false)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true) // Estado de carga
  const [chartData, setChartData] = useState({
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
  })
  const chartConfig = {
    backgroundGradientFrom: '#fafafa',
    backgroundGradientTo: '#fafafa',
    color: (opacity = 1) => `rgba(127, 103, 190, ${opacity})`,
    decimalPlaces: 0,

    propsForBackgroundLines: {
      strokeWidth: 0,
    },
  }

  useEffect(() => {
    ;(async () => {
      if (FState.fieldtripID) {
        setLoading(true)
        try {
          const res = await getFieldtripAttendees(FState.fieldtripID)
          if (res) {
            setStudents(res)
          }
        } catch (error) {
          throw new Error(error.response?.data?.detail || error.message)
        } finally {
          setLoading(false)
        }
      }
      getFieldtripMetrics(FState.fieldtripID)
        .then((res) => {
          if (res) {
            // { diseases: [{name, count}], allergies: [{name, count}] }
            const diseases = res.diseases?.map((d) => d.name) || []
            const diseaseCounts = res.diseases?.map((d) => d.count) || []
            const allergies = res.allergies?.map((a) => a.name) || []
            const allergyCounts = res.allergies?.map((a) => a.count) || []

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
                backgroundColor: showStudentList
                  ? MD3Colors.primary50
                  : COLORS.gray_100,
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
                backgroundColor: showMetrics
                  ? MD3Colors.primary50
                  : COLORS.gray_100,
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
              <Text style={styles.emptyStateText}>
                No se ha registrado ningún estudiante.
              </Text>
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
              <BarChart
                fromZero={true}
                data={chartData.diseases}
                showValuesOnTopOfBars={true}
                height={200}
                width={Dimensions.get('window').width}
                chartConfig={chartConfig}
                withHorizontalLabels={false}
                verticalLabelRotation={0}
                style={{
                  paddingLeft: 0,
                  paddingRight: 10,
                  width: '100%',
                }}
              />
            ) : (
              <BulletList data={chartData.diseases.labels} />
            )
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No se han registrado suficientes estudiantes para mostrar esta
                información.
              </Text>
            </View>
          )}

          {/* Alergias */}
          <Text
            variant="titleMedium"
            style={{ fontWeight: 600, marginTop: 16 }}
          >
            Alergias
          </Text>
          {Platform.OS === 'web' ? (
            <BarChart
              fromZero={true}
              data={
                chartData.allergies || { labels: [], datasets: [{ data: [] }] }
              }
              showValuesOnTopOfBars={true}
              height={200}
              width={Dimensions.get('window').width}
              chartConfig={chartConfig}
              withHorizontalLabels={false}
              verticalLabelRotation={0}
              style={{
                paddingLeft: 0,
                paddingRight: 10,
                width: '100%',
              }}
            />
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
})

export default Fieldtrip
