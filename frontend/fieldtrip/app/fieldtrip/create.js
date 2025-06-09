import { StyleSheet, View, Button, ScrollView, ActivityIndicator } from 'react-native'
import { TextInput, MD3Colors, Text } from 'react-native-paper'
import { PaperSelect } from 'react-native-paper-select'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'

import {
  Page,
  SimpleInput,
  DatePicker,
  ContainedButton,
  Modal,
} from '@components'
import { getTeachers, getCourses, newFieldtrip } from '@services'
import { COLORS } from '@colors'

const CreateFieldtrip = () => {
  const router = useRouter()

  const [name, setName] = useState('')
  const [proffesor, setProffesor] = useState({
    value: '',
    list: [],
    selectedList: [],
  })
  const [course, setCourse] = useState({
    value: '',
    list: [],
    selectedList: [],
  })
  const [sector, setSector] = useState('')
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [formDone, setFormDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creatingFieldtrip, setCreatingFieldtrip] = useState(false)

  const [mobileStartDate, setMobileStartDate] = useState(new Date())
  const [mobileEndDate, setMobileEndDate] = useState(new Date())
  const [showS, setShowS] = useState(false)
  const [showE, setShowE] = useState(false)

  const onChangeS = (event, selectedDate) => {
    if (event.type === 'set') {
      const currentDate = selectedDate || mobileStartDate
      setMobileStartDate(currentDate)
    }
    setShowS(false)
  }

  const onChangeE = (event, selectedDate) => {
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
    showModeS('mobileStartDate')
  }

  const showDatepickerE = () => {
    showModeE('mobileEndDate')
  }

  const [visible, setVisible] = useState({})
  const _toggleModal = (name) => () =>
    setVisible({ ...visible, [name]: !visible[name] })
  const _getVisible = (name) => !!visible[name]

  useEffect(() => {
    ;(async () => {
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

  useEffect(() => {
    if (
      sector.length > 0 &&
      course.value.length > 0 &&
      proffesor.value.length > 0 &&
      name.length > 0
    ) {
      setFormDone(true)
    }
  }, [sector, course, proffesor, name])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const teachers = await getTeachers()
        if (teachers.length > 0) {
          const proffesors = teachers.map((item) => {
            return { _id: item.id, value: `${item.names} ${item.surnames}` }
          })
          setProffesor({
            ...proffesor,
            list: proffesors,
          })
        }

        const courses = await getCourses()
        if (courses.length > 0) {
          const courseList = courses.map((item) => {
            return { _id: item.id, value: item.name }
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
  }, [])

  function formatDateToYYYYMMDD(date) {
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
        teacher_id: proffesor.list.find((obj) => obj.value === proffesor.value)
          ._id,
        course_id: course.list.find((obj) => obj.value === course.value)._id,
        start_date: formatDateToYYYYMMDD(new Date()),
        end_date: formatDateToYYYYMMDD(new Date()),
      })
        .then(async (res) => {
          if (res.id) {
            router.replace('/')
          }
        })
        .catch((error) => {
          throw new Error(error.response?.data?.detail || error.message)
        })
        .finally(() => {
          setCreatingFieldtrip(false)})
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
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={{ minWidth: '100%', height: 32 }}>
          <SimpleInput
            label="Nombre de la salida *"
            onChange={(e) => setName(e.target.value)}
            onChangeText={(val) => setName(val)}
            value={name}
          />
          <View style={[styles.bottomMargin, styles.maxWidth]}>
            <PaperSelect
              dialogStyle={styles.select}
              label="Profesor a cargo *"
              value={proffesor.value}
              onSelection={(value) => {
                setProffesor({
                  ...proffesor,
                  value: value.text,
                  selectedList: value.selectedList,
                })
              }}
              arrayList={[...proffesor.list]}
              selectedArrayList={proffesor.selectedList}
              hideSearchBox={true}
              dialogTitleStyle={{ textAlign: 'center' }}
              dialogTitle="Seleccione el profesor a cargo"
              dialogCloseButtonText="Cerrar"
              dialogDoneButtonText="Terminar"
              textInputMode="outlined"
              textInputProps={{
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
                        style={styles.icon}
                        onPress={() =>
                          setProffesor({
                            ...proffesor,
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
            <PaperSelect
              dialogStyle={styles.select}
              label="Curso *"
              value={course.value}
              onSelection={(value) => {
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
              onChange={(e) => setSector(e.target.value)}
              onChangeText={(val) => setSector(val)}
              value={sector}
            />
            {Platform.OS === 'web' ? (
              <>
                <DatePicker
                  label="Fecha de inicio"
                  value={startDate}
                  onChange={(d) => setStartDate(d)}
                  onChangeText={(val) => setStartDate(val)}
                />
                <DatePicker
                  label="Fecha de término"
                  value={endDate}
                  onChange={(d) => setEndDate(d)}
                  onChangeText={(val) => setEndDate(val)}
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
        {creatingFieldtrip ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          'Crear Salida'
        )}
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
})

export default CreateFieldtrip
