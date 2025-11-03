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

import { Page, SimpleInput, DatePicker, ContainedButton, Modal } from '@components'
import { getTeachers, getCourses, newFieldtrip } from '@services'
import { COLORS } from '@colors'
import { ListItem } from 'react-native-paper-select/lib/typescript/interface/paperSelect.interface'
import { Payload, SelectState } from '@types'

const CreateFieldtrip = () => {
  const router = useRouter()

  const [name, setName] = useState<string>('')
  const [professor, setProfessor] = useState<SelectState>({
    value: '',
    list: [],
    selectedList: [],
  })
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
      }
    })()
  }, [router])

  useEffect(() => {
    if (
      sector.length > 0 &&
      course.value.length > 0 &&
      professor.value.length > 0 &&
      name.length > 0
    ) {
      setFormDone(true)
    }
  }, [sector, course, professor, name])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const teachers = await getTeachers()
        if (teachers.length > 0) {
          const professors = teachers.map(
            (item: { id: number; names: string; surnames: string }) => {
              return { _id: item.id, value: `${item.names} ${item.surnames}` }
            },
          )
          setProfessor({
            ...professor,
            list: professors,
          })
        }

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
        teacher_id: professor.list.find((obj) => obj.value === professor.value)?._id,
        course_id: course.list.find((obj) => obj.value === course.value)?._id,
        start_date: formatDateToYYYYMMDD(new Date()),
        end_date: formatDateToYYYYMMDD(new Date()),
      })
        .then(async (res: { id: number }) => {
          if (res.id) {
            router.replace('/')
          }
        })
        .catch((error) => {
          throw new Error(error.response?.data?.detail || error.message)
        })
        .finally(() => {
          setCreatingFieldtrip(false)
        })
    } else {
      alert('Debe completar todo el formulario')
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
        <View style={{ minWidth: '100%', height: 32 }}>
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
              label="Profesor a cargo *"
              value={professor.value}
              onSelection={(value: { text: string; selectedList: ListItem[] }) => {
                setProfessor({
                  ...professor,
                  value: value.text,
                  selectedList: value.selectedList,
                })
              }}
              arrayList={[...professor.list]}
              selectedArrayList={professor.selectedList}
              hideSearchBox={true}
              dialogTitleStyle={{ textAlign: 'center' }}
              dialogTitle="Seleccione el profesor a cargo"
              dialogCloseButtonText="Cerrar"
              dialogDoneButtonText="Terminar"
              textInputMode="outlined"
              textInputProps={{
                // style: styles.selectInput,
                outlineColor: COLORS.gray_100,
                activeOutlineColor: MD3Colors.primary50,

                left: (
                  <TextInput.Icon
                    icon={() => (
                      <Icon
                        name={'delete'}
                        size={24}
                        color={MD3Colors.primary0}
                        // @ts-ignore: icon style may not exist
                        style={styles.icon}
                        onPress={() =>
                          setProfessor({
                            ...professor,
                            value: '',
                            selectedList: [],
                          })
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
            <PaperSelect
              dialogStyle={styles.select}
              label="Curso *"
              value={course.value}
              onSelection={(value: { text: string; selectedList: ListItem[] }) => {
                setCourse({
                  ...course,
                  value: value.text,
                  selectedList: value.selectedList,
                })
              }}
              arrayList={[...course.list]}
              selectedArrayList={course.selectedList}
              hideSearchBox={true}
              dialogTitleStyle={{ textAlign: 'center' }}
              dialogTitle="Seleccione el curso"
              dialogCloseButtonText="Cerrar"
              dialogDoneButtonText="Terminar"
              textInputMode="outlined"
              textInputProps={{
                // @ts-ignore: PaperSelectTextInputProps may not accept style
                style: styles.selectInput,
                outlineColor: COLORS.gray_100,
                activeOutlineColor: MD3Colors.primary50,

                left: (
                  <TextInput.Icon
                    icon={() => (
                      <Icon
                        name={'delete'}
                        size={24}
                        color={MD3Colors.primary0}
                        // @ts-ignore: icon style may not exist
                        style={styles.icon}
                        onPress={() =>
                          setCourse({
                            ...course,
                            value: '',
                            selectedList: [],
                          })
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
            />
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
                <Button onPress={showDatepickerE} title="Fecha de término" />
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

          <Modal
            visible={_getVisible('confirmationModal')}
            close={_toggleModal('confirmationModal')}
            title="Operación exitosa"
            description="¡La nueva salida ha sido creada exitosamente!"
          >
            <Text>Link</Text>
            <View style={styles.modalBtn}>
              <ContainedButton onPress={() => router.replace('/')}>
                Volver al inicio
              </ContainedButton>
            </View>
          </Modal>
        </View>
      </ScrollView>
      {/* Move modal to the home page*/}
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
})

export default CreateFieldtrip
