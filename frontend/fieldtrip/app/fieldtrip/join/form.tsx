import { useRouter } from 'expo-router'
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native'
import { MD3Colors, Text, Surface, Divider } from 'react-native-paper'
import { PaperSelect } from 'react-native-paper-select'
import { useState, useEffect, useContext } from 'react'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'

import {
  ContainedButton,
  Page,
  CheckboxItem,
  SimpleInput,
  ConfirmationModal,
  TextButton,
} from '@components'
import {
  getChecklist,
  getPastDiseases,
  getCurrentDiseases,
  getSpecificHealthItems,
  sendFieldtripSignupForm,
  getFieldtripSignUpStatus,
  getLatestFieldtripHealth,
} from '@services'
import { COLORS } from '@colors'
import { FieldtriptContext } from '../../_layout'
import type { ChecklistItem, Payload, SelectOption, SelectState } from '@types'
import HealthInfo from 'types/HealthInfo'
import { SelectedItem } from 'react-native-paper-select/lib/typescript/interface/paperSelect.interface'

type InputItem = {
  label: string
  id: number
  value: string
}

interface Item extends ChecklistItem {
  checked: boolean
}

const JoinFieldtrip = () => {
  const router = useRouter()
  const { FState } = useContext(FieldtriptContext)
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const _toggleModal = (name: string) => () => setVisible({ ...visible, [name]: !visible[name] })
  const [loading, setLoading] = useState<boolean>(true)
  const [signingUp, setSigningUp] = useState<boolean>(false)
  const [signedUp, setSignedUp] = useState(false)

  const _getVisible = (name: string) => !!visible[name]

  const [formDone, setFormDone] = useState<boolean>(false)
  const [showChecklist, setShowChecklist] = useState<boolean>(true)
  const [showMedInfo, setShowMedInfo] = useState<boolean>(false)
  const [checklistData, setChecklistData] = useState<Item[]>([])
  const [hasPresentedData, setHasPresentedData] = useState<SelectState>({
    value: '',
    list: [],
    selectedList: [],
  })
  const [presentsData, setPresentsData] = useState<SelectState>({
    value: '',
    list: [],
    selectedList: [],
  })
  const [inputList, setInputList] = useState<InputItem[]>([])

  const handleInputChange = (index: string | number, text: string) => {
    const updatedInputs = [...inputList]
    const found = updatedInputs.find((obj) => obj.id === index)
    if (found) {
      found.value = text
      setInputList(updatedInputs)
    }
  }

  const renderInputs = () => {
    return inputList.map((input) => (
      <View key={input.id}>
        <SimpleInput
          label={`${input.label} *`}
          value={input.value}
          multiline={true}
          onChangeText={(text: string) => handleInputChange(input.id, text)}
          style={styles.multilineInput}
        />
      </View>
    ))
  }

  const handleToggleCheck = (type: string, itemID: string | number) => {
    switch (type) {
      case 'checklist':
        setChecklistData((prevData) =>
          prevData.map((item) => (item.id === itemID ? { ...item, checked: !item.checked } : item)),
        )
        break
    }
  }

  const sendJoinFieldtripRequest = async () => {
    if (formDone) {
      setSigningUp(true)
      setVisible({ ...visible, ['modal']: !visible['modal'] })
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      const jwt = jwtDecode<Payload>(token)
      const checklistStatusList = checklistData.map((item) => {
        return { item: item.id, status: !!item.checked }
      })
      const healthSpecificList = inputList.map((item) => {
        return { item: item.id, value: item.value }
      })
      const parseHasPresentedData = hasPresentedData.selectedList.map((item) => {
        return { item: item._id, status: true }
      })
      const parsePresentsData = presentsData.selectedList.map((item) => {
        return { item: item._id, status: true }
      })
      const healthGeneralList = [...parseHasPresentedData, ...parsePresentsData]
      sendFieldtripSignupForm({
        user: jwt.user_id,
        fieldtrip: FState.fieldtripID,
        checklist_status: checklistStatusList,
        health_general: healthGeneralList,
        health_specific: healthSpecificList,
      })
        .then(async (res) => {
          if (res) {
            router.replace('/')
            alert('Su información ha sido enviada exitosamente')
          }
        })
        .catch((error) => {
          throw new Error(error.response?.data?.detail || error.message)
        })
        .finally(() => {
          setSigningUp(false)
        })
    } else {
      setVisible({ ...visible, ['modal']: !visible['modal'] })
      alert('Debe completar todo el formulario')
    }
  }

  useEffect(() => {
    if (checklistData.length > 0 && inputList.length > 0) {
      const checklistStatus = checklistData.every((obj) => obj.checked === true)
      const specificDataStatus = inputList.every((obj) => obj.value.length > 0)
      if (checklistStatus && specificDataStatus) {
        setFormDone(true)
      } else {
        setFormDone(false)
      }
    }
  }, [checklistData, inputList])

  useEffect(() => {
    const fetchChecklistAndData = async () => {
      try {
        setLoading(true)
        const [
          checklistRes,
          checklistCompleted,
          healthData,
          pastDiseasesRes,
          currentDiseasesRes,
          specificHealthRes,
        ] = await Promise.all([
          getChecklist(FState.fieldtripID),
          getFieldtripSignUpStatus(FState.fieldtripID),
          getLatestFieldtripHealth(),
          getPastDiseases(),
          getCurrentDiseases(),
          getSpecificHealthItems(),
        ])

        if (checklistCompleted) {
          setSignedUp(true)
          setChecklistData(
            checklistRes.map((item: ChecklistItem) => ({
              ...item,
              checked: true,
            })),
          )
        } else {
          setSignedUp(false)
          setChecklistData(checklistRes)
        }

        const pastList: SelectOption[] =
          pastDiseasesRes?.map((item: ChecklistItem) => ({
            _id: String(item.id),
            value: item.item,
          })) || []
        const currentList: SelectOption[] =
          currentDiseasesRes?.map((item: ChecklistItem) => ({
            _id: String(item.id),
            value: item.item,
          })) || []

        const selectedPast = pastList.filter((disease) =>
          healthData.health_general.some(
            (h: HealthInfo) => h.item === disease.value && h.status === true,
          ),
        )
        const selectedCurrent = currentList.filter((disease) =>
          healthData.health_general.some(
            (h: HealthInfo) => h.item === disease.value && h.status === true,
          ),
        )

        setHasPresentedData((prev) => ({
          ...prev,
          list: pastList,
          selectedList: selectedPast,
          value: selectedPast.map((d) => d.value).join(', '),
        }))

        setPresentsData((prev) => ({
          ...prev,
          list: currentList,
          selectedList: selectedCurrent,
          value: selectedCurrent.map((d) => d.value).join(', '),
        }))

        let filledInputs: InputItem[] = []
        if (specificHealthRes?.length > 0) {
          filledInputs = specificHealthRes.map((item: Item) => {
            const prev = healthData?.health_specific?.find((h: HealthInfo) => h.item === item.item)
            return {
              label: item.item,
              id: item.id,
              value: prev ? prev.value : '',
            }
          })
        }
        setInputList(filledInputs)
      } catch (err) {
        // Log error for debugging and redirect to home
        // eslint-disable-next-line no-console
        console.error(err)
        router.replace('/')
      } finally {
        setLoading(false)
      }
    }

    fetchChecklistAndData()
  }, [FState.fieldtripID, router])

  return (
    <Page style={styles.page} showTabs={true}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary_50} style={styles.loader} />
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
                    backgroundColor: showChecklist ? MD3Colors.primary50 : COLORS.gray_100,
                  },
                ]}
                onPress={() => {
                  setShowChecklist(!showChecklist)
                  setShowMedInfo(false)
                }}
              >
                Checklist
              </ContainedButton>
              <ContainedButton
                style={[
                  styles.btnMarginRight,
                  styles.btnMarginBottom,
                  {
                    backgroundColor: showMedInfo ? MD3Colors.primary50 : COLORS.gray_100,
                  },
                ]}
                onPress={() => {
                  setShowMedInfo(!showMedInfo)
                  setShowChecklist(false)
                }}
              >
                Salud
              </ContainedButton>
            </View>
          </ScrollView>
          <View style={styles.body}>
            {showChecklist && (
              <>
                <Surface elevation={0} style={styles.container}>
                  <View>
                    <Text variant="titleLarge" style={[styles.weight500]}>
                      Checklist
                    </Text>
                    <Divider style={styles.divider} />
                    {checklistData.map((item, i) => (
                      <CheckboxItem
                        key={i}
                        label={item.item}
                        status={item.checked ? 'checked' : 'unchecked'}
                        onPress={() => handleToggleCheck('checklist', item.id)}
                      />
                    ))}
                  </View>
                </Surface>
                <View style={{ justifyContent: 'flex-start', marginBottom: 24 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon
                      name="download-box"
                      size={24}
                      style={{ color: COLORS.primary_50, marginLeft: 8 }}
                      onPress={() => null}
                    />
                    <TextButton
                      onPress={() => null}
                      style={styles.underline}
                      labelStyle={styles.label}
                    >
                      Protocolo de Seguridad en Terreno.
                    </TextButton>
                  </View>
                </View>
              </>
            )}
            {showMedInfo && (
              <>
                <Surface elevation={0} style={styles.container}>
                  <View>
                    <Text variant="titleLarge" style={[styles.weight500]}>
                      Información médica
                    </Text>
                    <Divider style={styles.divider} />
                    <Text variant="titleMedium" style={[styles.weight600, { marginBottom: 10 }]}>
                      Información general de enfermedades
                    </Text>
                    <PaperSelect
                      dialogStyle={styles.select}
                      label="Ha presentado *"
                      value={hasPresentedData.value}
                      onSelection={(value: SelectedItem) => {
                        setHasPresentedData({
                          ...hasPresentedData,
                          value: value.text,
                          selectedList: value.selectedList,
                        })
                      }}
                      arrayList={[...hasPresentedData.list]}
                      selectedArrayList={hasPresentedData.selectedList}
                      searchText="Escriba algo"
                      multiEnable={true}
                      selectAllEnable={true}
                      searchStyle={styles.searchBox}
                      selectAllText="Seleccionar todo"
                      dialogTitleStyle={{ textAlign: 'center' }}
                      dialogTitle="Seleccione las enfermedades que ha presentado en el pasado"
                      dialogCloseButtonText="Cerrar"
                      dialogDoneButtonText="Terminar"
                      textInputMode="outlined"
                      textInputProps={{
                        outlineColor: COLORS.gray_100,
                        activeOutlineColor: MD3Colors.primary50,
                        // left icon removed for now
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
                      label="Presenta actualmente *"
                      value={presentsData.value}
                      onSelection={(value: SelectedItem) => {
                        setPresentsData({
                          ...presentsData,
                          value: value.text,
                          selectedList: value.selectedList,
                        })
                      }}
                      arrayList={[...presentsData.list]}
                      selectedArrayList={presentsData.selectedList}
                      searchText="Escriba algo"
                      multiEnable={true}
                      selectAllEnable={true}
                      searchStyle={styles.searchBox}
                      selectAllText="Seleccionar todo"
                      dialogTitleStyle={{ textAlign: 'center' }}
                      dialogTitle="Seleccione sus enfermedades"
                      dialogCloseButtonText="Cerrar"
                      dialogDoneButtonText="Terminar"
                      textInputMode="outlined"
                      textInputProps={{
                        outlineColor: COLORS.gray_100,
                        activeOutlineColor: MD3Colors.primary50,
                      }}
                      checkboxProps={{
                        checkboxColor: '#00796b',
                        checkboxUncheckedColor: COLORS.gray_100,
                      }}
                      containerStyle={{
                        marginBottom: 14,
                      }}
                    />
                    <Text variant="titleMedium" style={[styles.weight600, { marginTop: 10 }]}>
                      Información específica
                    </Text>
                    <Text variant="bodySmall" style={{ marginBottom: 10 }}>
                      Si algún campo no aplica para usted, debe indicarlo escribiendo 'N/A' o 'No
                      aplica'.
                    </Text>
                    {renderInputs()}
                  </View>
                </Surface>
              </>
            )}
          </View>
        </>
      )}
      <ContainedButton
        style={{ marginTop: 'auto', marginBottom: 16, width: '100%' }}
        labelStyle={{ fontSize: 20, lineHeight: 24 }}
        disabled={loading || signingUp}
        onPress={_toggleModal('modal')}
      >
        {signingUp ? (
          <ActivityIndicator color="white" size="small" />
        ) : loading ? (
          'Cargando...'
        ) : signedUp ? (
          'Actualizar información'
        ) : (
          'Enviar información'
        )}
      </ContainedButton>
      <ConfirmationModal
        visible={_getVisible('modal')}
        close={_toggleModal('modal')}
        open={sendJoinFieldtripRequest}
        title="¿Está seguro/a que desea enviar los datos?"
        description=""
      />
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
  body: {
    width: '100%',
  },
  container: {
    minWidth: 320,
    borderWidth: 0,
    paddingVertical: 10,
    marginBottom: 16,
  },
  divider: {
    backgroundColor: COLORS.primary_50,
    marginBottom: 20,
    marginTop: 20,
  },
  scrollView: {
    flexGrow: 0,
    marginBottom: 16,
  },
  btns: {
    flexDirection: 'row',
    paddingHorizontal: 0,
  },
  searchBox: {
    borderRadius: 4,
    borderColor: COLORS.gray_100,
    backgroundColor: MD3Colors.primary100,
  },
  select: {
    borderRadius: 28,
    backgroundColor: '#fafafa',
    maxWidth: 400,
    marginHorizontal: 'auto',
  },
  btnMarginRight: {
    marginRight: 10,
  },
  btnMarginBottom: {
    marginBottom: 0,
  },
  weight500: {
    fontWeight: 500,
    alignSelf: 'center',
  },
  weight600: {
    fontWeight: 600,
  },
  label: {
    fontSize: 16,
    fontWeight: 400,
    marginHorizontal: 5,
    marginVertical: 10,
    color: COLORS.primary_50,
  },
  underline: {
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.primary_50,
  },
  multilineInput: {
    fontSize: 16,
    height: 56,
    marginBottom: 14,
    backgroundColor: MD3Colors.primary100,
  },
  loader: {
    marginTop: 20,
  },
})

export default JoinFieldtrip
