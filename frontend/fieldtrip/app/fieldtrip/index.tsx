import { StyleSheet, View, ScrollView, Dimensions, Platform, Alert, Share } from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { MD3Colors, Text, Menu } from 'react-native-paper'
import { BarChart } from 'react-native-chart-kit'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  ContainedButton,
  Page,
  StudentList,
  BulletList,
  EquipmentList,
  EquipmentRequestCard,
} from '@components'
import {
  getFieldtripAttendees,
  getFieldtripMetrics,
  getFieldtripEquipment,
  getFieldtripEquipmentRequests,
  updateFieldtripEquipmentRequest,
} from '@services'
import { FieldtriptContext, HealthChartContext } from '../../shared/context/FieldtripContext'
import { COLORS } from '@colors'
import { StudentAttendee, EquipmentItem, EquipmentRequestItem } from '@types'
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

interface ExportRow {
  category: string
  name: string
  count: number
}

type ExportFormat = 'txt' | 'csv' | 'tsv' | 'json'

const Fieldtrip = () => {
  const { FState } = useContext(FieldtriptContext)
  const { HCState, HCDispatch } = useContext(HealthChartContext)
  const setState = (fieldtripID: number, fieldtripName: string, healthChartOwner: number) => {
    HCDispatch({
      fieldtripID,
      fieldtripName,
      healthChartOwner,
    })
  }

  const [showStudentList, setShowStudentList] = useState(true)
  const [showMetrics, setShowMetrics] = useState(false)
  const [showEquipment, setShowEquipment] = useState(false)
  const [showRequests, setShowRequests] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [students, setStudents] = useState<StudentAttendee[]>([])
  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [equipmentRequests, setEquipmentRequests] = useState<EquipmentRequestItem[]>([])
  const [loading, setLoading] = useState(true) // Estado de carga
  const [equipmentLoading, setEquipmentLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(true)
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

  const buildExportRows = (): ExportRow[] => {
    const diseaseCounts = chartData.diseases.datasets[0]?.data || []
    const allergyCounts = chartData.allergies.datasets[0]?.data || []

    const diseaseRows = chartData.diseases.labels.map((name, index) => ({
      category: 'Enfermedades',
      name,
      count: diseaseCounts[index] || 0,
    }))
    const allergyRows = chartData.allergies.labels.map((name, index) => ({
      category: 'Alergias',
      name,
      count: allergyCounts[index] || 0,
    }))

    return [...diseaseRows, ...allergyRows]
  }

  const filterMetricData = (labels: string[], counts: number[]) => {
    const filteredLabels: string[] = []
    const filteredCounts: number[] = []

    labels.forEach((label, index) => {
      const count = counts[index] || 0
      if (count > 0) {
        filteredLabels.push(label)
        filteredCounts.push(count)
      }
    })

    return {
      labels: filteredLabels,
      counts: filteredCounts,
    }
  }

  const generateTxtExport = (rows: ExportRow[]) => {
    const lines = rows.map((row) => `- [${row.category}] ${row.name}: ${row.count}`)
    return ['Metricas del paseo', '', ...lines].join('\n')
  }

  const generateCsvExport = (rows: ExportRow[]) => {
    const escapeCsv = (value: string | number) => {
      const parsed = String(value).replace(/"/g, '""')
      return '"' + parsed + '"'
    }

    const headers = 'categoria,nombre,cantidad'
    const csvRows: string[] = []
    rows.forEach((row) => {
      csvRows.push([escapeCsv(row.category), escapeCsv(row.name), escapeCsv(row.count)].join(','))
    })
    return [headers, ...csvRows].join('\n')
  }

  const generateTsvExport = (rows: ExportRow[]) => {
    const escapeTsv = (value: string | number) => {
      const parsed = String(value).replace(/\t/g, ' ')
      return parsed.replace(/\n/g, ' ')
    }

    const headers = 'categoria\tnombre\tcantidad'
    const tsvRows: string[] = []
    rows.forEach((row) => {
      tsvRows.push([escapeTsv(row.category), escapeTsv(row.name), escapeTsv(row.count)].join('\t'))
    })
    return [headers, ...tsvRows].join('\n')
  }

  const generateJsonExport = (rows: ExportRow[]) => JSON.stringify(rows, null, 2)

  const sanitizeFileNamePart = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase()

  const getExportData = (rows: ExportRow[], format: ExportFormat) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const selectedFieldtripName = FState.fieldtripName || HCState.fieldtripName || 'paseo'
    const safeFieldtripName = sanitizeFileNamePart(selectedFieldtripName)
    const baseFileName = `${safeFieldtripName}-metricas-${timestamp}`

    switch (format) {
      case 'txt':
        return {
          content: generateTxtExport(rows),
          fileName: `${baseFileName}.txt`,
          mimeType: 'text/plain;charset=utf-8',
          shareTitle: 'Metricas del paseo',
        }
      case 'csv':
        return {
          content: generateCsvExport(rows),
          fileName: `${baseFileName}.csv`,
          mimeType: 'text/csv;charset=utf-8',
          shareTitle: 'Metricas del paseo (CSV)',
        }
      case 'tsv':
        return {
          content: generateTsvExport(rows),
          fileName: `${baseFileName}.tsv`,
          mimeType: 'text/tab-separated-values;charset=utf-8',
          shareTitle: 'Metricas del paseo (TSV)',
        }
      case 'json':
        return {
          content: generateJsonExport(rows),
          fileName: `${baseFileName}.json`,
          mimeType: 'application/json;charset=utf-8',
          shareTitle: 'Metricas del paseo (JSON)',
        }
    }
  }

  const downloadFileWeb = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const handleExportMetrics = async (format: ExportFormat) => {
    setShowExportMenu(false)

    const rows = buildExportRows()
    if (rows.length === 0) {
      Alert.alert('Sin datos', 'No hay metricas para exportar.')
      return
    }

    const exportData = getExportData(rows, format)

    if (Platform.OS === 'web') {
      downloadFileWeb(exportData.content, exportData.fileName, exportData.mimeType)
      return
    }

    await Share.share({
      title: exportData.shareTitle,
      message: exportData.content,
    })
  }

  const handleOpenExportMenu = () => {
    const rows = buildExportRows()
    if (rows.length === 0) {
      Alert.alert('Sin datos', 'No hay metricas para exportar.')
      return
    }

    setShowExportMenu(true)
  }

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      if (!FState.fieldtripID) {
        setLoading(false)
        setEquipmentLoading(false)
        setRequestsLoading(false)
        setShowRequests(false)
        return
      }

      setLoading(true)
      setEquipmentLoading(true)
      setRequestsLoading(true)
      setShowRequests(false)

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

      getFieldtripMetrics(FState.fieldtripID)
        .then((res) => {
          if (res) {
            const diseases = res.diseases?.map((d: Disease) => d.name) || []
            const diseaseCounts = res.diseases?.map((d: Disease) => d.count) || []
            const allergies = res.allergies?.map((a: Allergy) => a.name) || []
            const allergyCounts = res.allergies?.map((a: Allergy) => a.count) || []

            const filteredDiseases = filterMetricData(diseases, diseaseCounts)
            const filteredAllergies = filterMetricData(allergies, allergyCounts)

            setChartData({
              diseases: {
                labels: filteredDiseases.labels,
                datasets: [{ data: filteredDiseases.counts }],
              },
              allergies: {
                labels: filteredAllergies.labels,
                datasets: [{ data: filteredAllergies.counts }],
              },
            })
          }
        })
        .catch((error) => {
          console.log(error)
          throw new Error(error.response?.data?.detail || error.message)
        })

      getFieldtripEquipment(FState.fieldtripID)
        .then((res) => {
          if (res) {
            setEquipment(res)
          }
        })
        .catch((error) => {
          console.log(error)
          throw new Error(error.response?.data?.detail || error.message)
        })
        .finally(() => {
          setEquipmentLoading(false)
        })

      getFieldtripEquipmentRequests(FState.fieldtripID)
        .then((res) => {
          if (res) {
            setEquipmentRequests(res)
            setShowRequests(true)
          }
        })
        .catch((error) => {
          console.log(error)
          setEquipmentRequests([])
          setShowRequests(false)
        })
        .finally(() => {
          setRequestsLoading(false)
        })
    })()
  }, [FState])

  const refreshRequests = async () => {
    if (!FState.fieldtripID) {
      return
    }

    setRequestsLoading(true)
    try {
      const res = await getFieldtripEquipmentRequests(FState.fieldtripID)
      setEquipmentRequests(res)
    } finally {
      setRequestsLoading(false)
    }
  }

  const handleDecision = async (requestId: number, status: 'approved' | 'rejected') => {
    if (!FState.fieldtripID) {
      return
    }

    try {
      await updateFieldtripEquipmentRequest(FState.fieldtripID, requestId, { status })
      await refreshRequests()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar la solicitud.')
    }
  }

  return (
    <Page style={styles.page} showTabs={true}>
      {showRequests ? (
        <>
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
                    backgroundColor: showRequests ? MD3Colors.primary50 : COLORS.gray_100,
                  },
                ]}
                onPress={() => {
                  setShowRequests(true)
                  setShowStudentList(false)
                  setShowMetrics(false)
                  setShowEquipment(false)
                }}
              >
                Solicitudes
              </ContainedButton>
            </View>
          </ScrollView>
          {requestsLoading ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>Cargando solicitudes...</Text>
            </View>
          ) : equipmentRequests.length > 0 ? (
            <View style={styles.requestsWrapper}>
              {equipmentRequests.map((request) => (
                <EquipmentRequestCard
                  key={request.id}
                  request={request}
                  onApprove={(requestId: number) => handleDecision(requestId, 'approved')}
                  onReject={(requestId: number) => handleDecision(requestId, 'rejected')}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No hay solicitudes de equipamiento.</Text>
            </View>
          )}
        </>
      ) : (
        <>
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
                  setShowStudentList(true)
                  setShowMetrics(false)
                  setShowEquipment(false)
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
                  setShowStudentList(false)
                  setShowMetrics(true)
                  setShowEquipment(false)
                }}
              >
                Métricas
              </ContainedButton>
              <ContainedButton
                style={[
                  styles.btnMarginRight,
                  styles.btnMarginBottom,
                  {
                    backgroundColor: showEquipment ? MD3Colors.primary50 : COLORS.gray_100,
                  },
                ]}
                onPress={() => {
                  setShowMetrics(false)
                  setShowStudentList(false)
                  setShowEquipment(true)
                }}
              >
                Equipamiento
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
        </>
      )}
      {!showRequests && showMetrics && (
        <>
          <View style={styles.exportMenuAnchor}>
            <Menu
              visible={showExportMenu}
              onDismiss={() => setShowExportMenu(false)}
              anchorPosition="bottom"
              anchor={
                <ContainedButton style={styles.exportBtn} onPress={handleOpenExportMenu}>
                  Exportar datos
                </ContainedButton>
              }
            >
              <Menu.Item onPress={() => handleExportMetrics('txt')} title="Exportar TXT" />
              <Menu.Item onPress={() => handleExportMetrics('csv')} title="Exportar CSV" />
              <Menu.Item onPress={() => handleExportMetrics('tsv')} title="Exportar TSV" />
              <Menu.Item onPress={() => handleExportMetrics('json')} title="Exportar JSON" />
            </Menu>
          </View>
          {/* Enfermedades */}
          <Text variant="titleMedium" style={{ fontWeight: 600, marginTop: 16 }}>
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
          {chartData.allergies && chartData.allergies.labels.length > 0 ? (
            Platform.OS === 'web' ? (
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
            )
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No se han registrado suficientes estudiantes para mostrar esta información.
              </Text>
            </View>
          )}
        </>
      )}
      {!showRequests &&
        showEquipment &&
        (equipmentLoading ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>Cargando equipamiento...</Text>
          </View>
        ) : (
          <EquipmentList data={equipment} />
        ))}
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
  exportBtn: {
    marginBottom: 0,
  },
  exportMenuAnchor: {
    width: '100%',
    alignItems: 'center',
  },
  requestsWrapper: {
    width: '100%',
    gap: 12,
  },
})

export default Fieldtrip
