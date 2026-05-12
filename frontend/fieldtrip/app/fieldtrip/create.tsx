import {
  StyleSheet,
  View,
  Button,
  ScrollView,
  ActivityIndicator,
  Platform,
  NativeSyntheticEvent,
  TextInputChangeEventData,
} from 'react-native'
import { TextInput, MD3Colors, Text } from 'react-native-paper'
import { PaperSelect } from 'react-native-paper-select'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'

import {
  Page,
  SimpleInput,
  DatePicker,
  ContainedButton,
  Modal,
  EquipmentSelectionModal,
} from '@components'
import { getCourses, newFieldtrip, getEquipmentList } from '@services'
import { COLORS } from '@colors'
import { ListItem } from 'react-native-paper-select/lib/typescript/interface/paperSelect.interface'
import { Payload, SelectState, EquipmentItem } from '@types'
import { useGlobalSnackbar } from '../../shared/context/useGlobalSnackbar'

const CreateFieldtrip = () => {
  const router = useRouter()
  const { showSnackbar } = useGlobalSnackbar()

  const [name, setName] = useState<string>('')
  const [teacherId, setTeacherId] = useState<number | null>(null)
  const [course, setCourse] = useState<SelectState>({
    value: '',
    list: [],
    selectedList: [],
  })
  const [sector, setSector] = useState<string>('')
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [formDone, setFormDone] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [creatingFieldtrip, setCreatingFieldtrip] = useState<boolean>(false)

  const [mobileStartDate, setMobileStartDate] = useState<Date>(new Date())
  const [mobileEndDate, setMobileEndDate] = useState<Date>(new Date())
  const [showS, setShowS] = useState<boolean>(false)
  const [showE, setShowE] = useState<boolean>(false)

  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<{ id: number; quantity: number }[]>([])
  const [equipmentLoading, setEquipmentLoading] = useState<boolean>(false)
  const [showEquipmentModal, setShowEquipmentModal] = useState<boolean>(false)

  const hasSelectedCourse = course.value.length > 0
  const canOpenEquipmentModal = hasSelectedCourse && !equipmentLoading

  const onChangeS = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set') {
      const currentDate = selectedDate || mobileStartDate
      setMobileStartDate(currentDate)
    }
    setShowS(false)
  }

  const onChangeE = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set') {
      const currentDate = selectedDate || mobileEndDate
      setMobileEndDate(currentDate)
    }
    setShowE(false)
  }

  const showModeS = () => {
    setShowS(true)
  }

  const showModeE = () => {
    setShowE(true)
  }

  const showDatepickerS = () => {
    showModeS()
  }

  const showDatepickerE = () => {
    showModeE()
  }

  const loadEquipmentForCourse = async (courseId: string) => {
    try {
      setEquipmentLoading(true)
      const selectedCourse = course.list.find((c) => String(c._id) === String(courseId))
      if (selectedCourse) {
        const equipment = await getEquipmentList(parseInt(String(selectedCourse._id), 10))
        setEquipmentList(equipment)
      } else {
        setEquipmentList([])
      }
    } catch (error) {
      console.error('Error loading equipment:', error)
      showSnackbar('Error al cargar el equipamiento', { isError: true })
      setEquipmentList([])
    } finally {
      setEquipmentLoading(false)
    }
  }

  const handleCourseSelection = (value: { text: string; selectedList: ListItem[] }) => {
    const selectedCourseId =
      value.selectedList[0]?._id || course.list.find((item) => item.value === value.text)?._id || ''

    setCourse({
      ...course,
      value: value.text,
      selectedList: value.selectedList,
    })

    setSelectedEquipment([])

    if (selectedCourseId) {
      loadEquipmentForCourse(String(selectedCourseId))
    } else {
      setEquipmentList([])
    }
  }

  const handleEquipmentConfirm = (equipment: { id: number; quantity: number }[]) => {
    setSelectedEquipment(equipment)
    setShowEquipmentModal(false)
  }

  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const _toggleModal = (name: string) => () => setVisible({ ...visible, [name]: !visible[name] })
  const _getVisible = (name: string) => !!visible[name]

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
        return
      }
      setTeacherId(jwt.user_id)
    })()
  }, [router])

  useEffect(() => {
    if (
      sector.length > 0 &&
      course.value.length > 0 &&
      name.length > 0 &&
      selectedEquipment.length > 0 &&
      teacherId !== null
    ) {
      setFormDone(true)
    } else {
      setFormDone(false)
    }
  }, [sector, course, name, selectedEquipment, teacherId])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const courses = await getCourses()
        if (courses.length > 0) {
          const courseList = courses.map((item) => {
            return { _id: String(item.id), value: item.name }
          })
          setCourse({
            ...course,
            list: courseList,
          })
        }
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const sendCreateFieldtripRequest = async () => {
    if (formDone) {
      setCreatingFieldtrip(true)
      newFieldtrip({
        name,
        sector,
        teacher_id: teacherId ?? undefined,
        course_id: course.list.find((obj) => obj.value === course.value)?._id,
        start_date: formatDateToYYYYMMDD(new Date()),
        end_date: formatDateToYYYYMMDD(new Date()),
        equipment: selectedEquipment,
      })
        .then(async (res: { id: number }) => {
          if (res.id) {
            showSnackbar('¡Salida de campo creada exitosamente!', { isError: false })
            router.replace('/')
          }
        })
        .catch((error) => {
          showSnackbar(error.message || 'Error al crear la salida', { isError: true })
        })
        .finally(() => {
          setCreatingFieldtrip(false)
        })
    } else {
      showSnackbar('Debe completar todo el formulario, incluyendo equipamiento', { isError: true })
    }
  }

  if (loading) {
    return (
      <Page style={styles.page} showTabs={true}>
        <ActivityIndicator size="large" color="#00796b" />
      </Page>
    )
  }

  return (
    <Page style={styles.page} showTabs={true}>
      <ScrollView>
        <View style={{ minWidth: '100%' }}>
          <SimpleInput
            label="Nombre de la salida *"
            onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) =>
              setName(e.nativeEvent.text)
            }
            onChangeText={(val: string) => setName(val)}
            value={name}
          />
          <View style={[styles.bottomMargin, styles.maxWidth]}>
            <PaperSelect
              dialogStyle={styles.select}
              label="Curso *"
              value={course.value}
              onSelection={handleCourseSelection}
              arrayList={[...course.list]}
              selectedArrayList={course.selectedList}
              hideSearchBox={true}
              dialogTitleStyle={{ textAlign: 'center' }}
              dialogTitle="Seleccione el curso"
              dialogCloseButtonText="Cerrar"
              dialogDoneButtonText="Terminar"
              textInputMode="outlined"
              textInputProps={{
                outlineColor: COLORS.gray_100,
                activeOutlineColor: MD3Colors.primary50,
                left: (
                  <TextInput.Icon
                    icon={() => (
                      <Icon
                        name={'delete'}
                        size={24}
                        color={MD3Colors.primary0}
                        style={styles.icon}
                        onPress={() =>
                          (() => {
                            setCourse({
                              ...course,
                              value: '',
                              selectedList: [],
                            })
                            setEquipmentList([])
                            setSelectedEquipment([])
                          })()
                        }
                      />
                    )}
                  />
                ),
              }}
              checkboxProps={{
                checkboxColor: '#00796b',
                checkboxUncheckedColor: COLORS.gray_100,
              }}
              containerStyle={{
                marginBottom: 14,
              }}
              multiEnable={false}
            />
            <View style={styles.equipmentSection}>
              <Text style={styles.equipmentLabel}>Equipamiento *</Text>
              <Button
                title={
                  hasSelectedCourse
                    ? `Seleccionar Equipamiento ${selectedEquipment.length > 0 ? `(${selectedEquipment.length} seleccionado)` : ''}`
                    : 'Seleccione un curso primero'
                }
                onPress={() => setShowEquipmentModal(true)}
                color={MD3Colors.primary50}
                disabled={!canOpenEquipmentModal}
              />
            </View>
            <SimpleInput
              label="Sector al que se irá *"
              onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) =>
                setSector(e.nativeEvent.text)
              }
              onChangeText={(val: string) => setSector(val)}
              value={sector}
            />
            {Platform.OS === 'web' ? (
              <>
                <DatePicker
                  label="Fecha de inicio"
                  value={startDate}
                  onChange={(d: Date) => setStartDate(d)}
                  onChangeText={(val: Date) => setStartDate(val)}
                />
                <DatePicker
                  label="Fecha de término"
                  value={endDate}
                  onChange={(d: Date) => setEndDate(d)}
                  onChangeText={(val: Date) => setEndDate(val)}
                />
              </>
            ) : (
              <>
                <Button onPress={showDatepickerS} title="Fecha de inicio" />
                <Text>selected: {mobileStartDate.toLocaleString()}</Text>
                {showS && (
                  <DateTimePicker
                    value={mobileStartDate}
                    mode="date"
                    display="default"
                    onChange={onChangeS}
                  />
                )}
                <Button onPress={showDatepickerE} title="Fecha de termino" />
                <Text>selected: {mobileEndDate.toLocaleString()}</Text>
                {showE && (
                  <DateTimePicker
                    value={mobileEndDate}
                    mode="date"
                    display="default"
                    onChange={onChangeE}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <EquipmentSelectionModal
        visible={showEquipmentModal}
        onClose={() => setShowEquipmentModal(false)}
        onConfirm={handleEquipmentConfirm}
        equipmentList={equipmentList}
        initialSelectedEquipment={selectedEquipment}
        loading={equipmentLoading}
      />

      <Modal
        visible={_getVisible('confirmationModal')}
        close={_toggleModal('confirmationModal')}
        title="Operacion exitosa"
        description="La nueva salida ha sido creada exitosamente"
      >
        <Text>Link</Text>
        <View style={styles.modalBtn}>
          <ContainedButton onPress={() => router.replace('/')}>Volver al inicio</ContainedButton>
        </View>
      </Modal>

      <ContainedButton
        style={styles.mainBtn}
        labelStyle={{ fontSize: 20, lineHeight: 24 }}
        onPress={sendCreateFieldtripRequest}
        disabled={creatingFieldtrip}
      >
        {creatingFieldtrip ? <ActivityIndicator color="white" size="small" /> : 'Crear Salida'}
      </ContainedButton>
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
  bottomMargin: {
    marginBottom: 30,
  },
  maxWidth: {},
  select: {
    borderRadius: 28,
    backgroundColor: '#fafafa',
    maxWidth: 400,
    marginHorizontal: 'auto',
  },
  selectInput: {
    fontSize: 16,
  },
  mainBtn: {
    position: 'relative',
    marginBottom: 16,
    width: '100%',
  },
  modalBtn: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  icon: {
    // Optionally add icon style if needed
  },
  equipmentSection: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 14,
  },
  equipmentLabel: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 12,
    color: '#6b7280',
  },
})

export default CreateFieldtrip
