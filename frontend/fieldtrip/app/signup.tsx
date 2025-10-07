import { Text, TextInput, MD3Colors } from 'react-native-paper'
import { PaperSelect } from 'react-native-paper-select'
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  NativeSyntheticEvent,
  TextInputChangeEventData,
} from 'react-native'
import { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ListItem } from 'react-native-paper-select/lib/typescript/interface/paperSelect.interface'

import {
  signup,
  getSubstanceAllergies,
  getMedAllergies,
  getDiets,
} from '@services'
import {
  ContainedButton,
  SimpleInput,
  Page,
  TextButton,
  CheckboxItem,
} from '@components'
import { COLORS } from '@colors'

interface Item {
  id: number
  type: string
}

const Signup = () => {
  const router = useRouter()
  const [errorMsgs, setErrorMsgs] = useState({
    default: 'No se pudo iniciar sesión.\nInténtelo nuevamente.',
  })
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [textSecure] = useState(true)
  const [names, setNames] = useState('')
  const [surnames, setSurnames] = useState('')
  const [RUT, setRUT] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyNumber, setEmergencyNumber] = useState('')
  const [checked, setChecked] = useState(false)
  const [diet, setDiet] = useState({
    value: '',
    list: [] as ListItem[],
    selectedList: [] as ListItem[],
  })
  const BLOOD_TYPES = [
    { _id: '1', value: 'A' },
    { _id: '2', value: 'B' },
    { _id: '3', value: 'AB' },
    { _id: '4', value: 'O' },
  ]
  const [bloodType, setBloodType] = useState({
    value: '',
    list: BLOOD_TYPES,
    selectedList: [] as ListItem[],
  })
  const [substanceAllergy, setSubstanceAllergy] = useState({
    value: '',
    list: [],
    selectedList: [] as ListItem[],
  })
  const [medAllergy, setMedAllergy] = useState({
    value: '',
    list: [],
    selectedList: [] as ListItem[],
  })

  const [signupFailed, setSignupFailed] = useState(false)
  const sendSignupRequest = async () => {
    if (
      email.length > 0 &&
      password.length > 0 &&
      names.length > 0 &&
      surnames.length > 0 &&
      RUT.length > 0 &&
      registrationNumber.length > 0 &&
      emergencyContact.length > 0 &&
      emergencyNumber.length > 0 &&
      diet.value.length > 0 &&
      bloodType.value.length > 0 &&
      medAllergy.selectedList.length > 0 &&
      substanceAllergy.selectedList.length > 0
    ) {
      setLoading(true)
      signup({
        email,
        password,
        names,
        surnames,
        registration_number: registrationNumber,
        RUT,
        diet_type: diet.list.find(
          (obj: { value: string }) => obj.value === diet.value,
        )!._id,
        blood_type: bloodType.list.find(
          (obj: { value: string }) => obj.value === bloodType.value,
        )!._id,
        med_allergies: medAllergy.selectedList,
        substance_allergies: substanceAllergy.selectedList,
        emergency_contact: emergencyContact,
        emergency_number: emergencyNumber,
        has_previous_experience: checked,
        role: 'student',
      })
        .then(async (res) => {
          if (res !== undefined && res.hasOwnProperty('tokens')) {
            await AsyncStorage.setItem('access_token', res.tokens.access)
            await AsyncStorage.setItem('refresh_token', res.tokens.refresh)
            await AsyncStorage.setItem('names', names)
            await AsyncStorage.setItem('names', surnames)
            await AsyncStorage.setItem('email', email)
            router.replace('/')
          } else {
            setSignupFailed(true)
          }
        })
        .catch((error) => {
          setSignupFailed(true)
          setErrorMsgs(error.response.data)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      alert('Debe completar todos los campos')
    }
  }

  useEffect(() => {
    ;(async () => {
      getDiets().then(async (res) => {
        if (res.length > 0) {
          const diets = res.map((item: Item) => {
            return { _id: item.id, value: item.type }
          })
          setDiet({
            ...diet,
            list: diets,
          })
        }
      })
      getSubstanceAllergies().then(async (res) => {
        if (res.length > 0) {
          const substanceAllergies = res.map((item: Item) => {
            return { _id: item.id, value: item.type }
          })
          setSubstanceAllergy({
            ...substanceAllergy,
            list: substanceAllergies,
          })
        }
      })
      getMedAllergies().then(async (res) => {
        if (res.length > 0) {
          const medAllergies = res.map((item: Item) => {
            return { _id: item.id, value: item.type }
          })
          setMedAllergy({
            ...medAllergy,
            list: medAllergies,
          })
        }
      })
    })()
  }, [diet, medAllergy, substanceAllergy])

  return (
    <Page style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text variant="headlineLarge" style={styles.title}>
          Fieldtrip
        </Text>
        <View>
          <View style={styles.bottomMargin}>
            <SimpleInput
              label="Email *"
              onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) =>
                setEmail(e.nativeEvent.text)
              }
              onChangeText={(val: string) => setEmail(val)}
              value={email}
            />
            <SimpleInput
              label="Contraseña *"
              secureTextEntry={textSecure}
              onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) =>
                setPassword(e.nativeEvent.text)
              }
              onChangeText={(val: string) => setPassword(val)}
              value={password}
            />
            <View style={{ marginLeft: 16 }}>
              <Text variant="bodySmall">
                Su contraseña debe contener al menos 8 caracteres.
              </Text>
              <Text variant="bodySmall">
                Su contraseña no puede asemejarse tanto a su otra información
                personal.
              </Text>
            </View>
          </View>

          <View style={styles.bottomMargin}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Datos personales
            </Text>
            <SimpleInput
              label="Nombres *"
              onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) =>
                setNames(e.nativeEvent.text)
              }
              onChangeText={(val: string) => setNames(val)}
              value={names}
            />
            <SimpleInput
              label="Apellidos *"
              onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) =>
                setSurnames(e.nativeEvent.text)
              }
              onChangeText={(val: string) => setSurnames(val)}
              value={surnames}
            />
            <SimpleInput
              label="RUT *"
              onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) =>
                setRUT(e.nativeEvent.text)
              }
              onChangeText={(val: string) => setRUT(val)}
              value={RUT}
            />
            <View style={{ marginLeft: 16, marginBottom: 8 }}>
              <Text variant="bodySmall">
                Ingrese su RUT en el siguiente formato: 12.345.678-9.
              </Text>
            </View>
            <SimpleInput
              label="N° de matrícula *"
              onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) =>
                setRegistrationNumber(e.nativeEvent.text)
              }
              onChangeText={(val: string) => setRegistrationNumber(val)}
              value={registrationNumber}
            />
            <View style={{ marginLeft: 16 }}>
              <Text variant="bodySmall">Sólo ingrese valores númericos.</Text>
            </View>
          </View>

          <View style={styles.bottomMargin}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Información de salud
            </Text>
            <PaperSelect
              dialogStyle={styles.select}
              label="Tipo de dieta *"
              value={diet.value}
              onSelection={(value) => {
                setDiet({
                  ...diet,
                  value: value.text,
                  selectedList: value.selectedList,
                })
              }}
              arrayList={[...diet.list]}
              selectedArrayList={diet.selectedList}
              hideSearchBox={true}
              multiEnable={false}
              dialogTitleStyle={{ textAlign: 'center' }}
              dialogTitle="Seleccione su tipo de dieta"
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
                          setDiet({
                            ...diet,
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
              label="Tipo sanguíneo *"
              value={bloodType.value}
              onSelection={(value) => {
                setBloodType({
                  ...bloodType,
                  value: value.text,
                  selectedList: value.selectedList,
                })
              }}
              arrayList={[...bloodType.list]}
              selectedArrayList={bloodType.selectedList}
              hideSearchBox={true}
              multiEnable={false}
              dialogTitleStyle={{ textAlign: 'center' }}
              dialogTitle="Seleccione su tipo sanguíneo"
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
                          setBloodType({
                            ...bloodType,
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
              label="Alergias a sustancias *"
              value={substanceAllergy.value}
              onSelection={(value) => {
                setSubstanceAllergy({
                  ...substanceAllergy,
                  value: value.text,
                  selectedList: value.selectedList,
                })
              }}
              arrayList={[...substanceAllergy.list]}
              selectedArrayList={substanceAllergy.selectedList}
              searchText="Escriba algo"
              multiEnable={true}
              selectAllEnable={true}
              searchStyle={styles.searchBox}
              selectAllText="Seleccionar todo"
              dialogTitleStyle={{ textAlign: 'center' }}
              dialogTitle="Seleccione sus alergias"
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
                          setSubstanceAllergy({
                            ...substanceAllergy,
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
              label="Alergias a medicamentos *"
              value={medAllergy.value}
              onSelection={(value) => {
                setMedAllergy({
                  ...medAllergy,
                  value: value.text,
                  selectedList: value.selectedList,
                })
              }}
              arrayList={[...medAllergy.list]}
              selectedArrayList={medAllergy.selectedList}
              searchText="Escriba algo"
              multiEnable={true}
              selectAllEnable={true}
              searchStyle={styles.searchBox}
              selectAllText="Seleccionar todo"
              dialogTitleStyle={{ textAlign: 'center' }}
              dialogTitle="Seleccione sus alergias"
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
                          setMedAllergy({
                            ...medAllergy,
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
          </View>

          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Contacto de emergencia
            </Text>
            <SimpleInput
              label="Nombre completo *"
              onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) =>
                setEmergencyContact(e.nativeEvent.text)
              }
              onChangeText={(val: string) => setEmergencyContact(val)}
              value={emergencyContact}
            />
            <SimpleInput
              label="Número telefónico *"
              onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) =>
                setEmergencyNumber(e.nativeEvent.text)
              }
              maxLength={9}
              keyboardType="numeric"
              onChangeText={(val: string) => setEmergencyNumber(val)}
              value={emergencyNumber}
            />
            <View style={{ marginLeft: 16, marginBottom: 30 }}>
              <Text variant="bodySmall">Sólo ingrese valores númericos.</Text>
            </View>
          </View>
          <View style={styles.checkbox}>
            <CheckboxItem
              label="¿Tiene experiencia previa en salidas a campo?"
              status={checked ? 'checked' : 'unchecked'}
              onPress={() => setChecked(!checked)}
            />
          </View>
          {signupFailed && (
            <View style={{ marginLeft: 8 }}>
              <Text variant="bodyMedium" style={{ color: MD3Colors.error50 }}>
                {errorMsgs !== undefined
                  ? `Ha recibido los siguientes errores:\n- ${Object.values(
                      errorMsgs,
                    )
                      .reduce(
                        (acc, currentValue) => acc.concat(currentValue),
                        [] as string[],
                      )
                      .join('\n- ')}`
                  : ''}
              </Text>
            </View>
          )}
        </View>
        <ContainedButton
          style={styles.mainBtn}
          labelStyle={{ fontSize: 18, lineHeight: 20 }}
          onPress={sendSignupRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            'Registrarse'
          )}
        </ContainedButton>
        <View style={styles.login}>
          <Text variant="bodyLarge">¿Ya tienes una cuenta?</Text>
          <TextButton
            onPress={() => router.replace('/login')}
            style={styles.underline}
            labelStyle={styles.label}
          >
            Inicia sesión aquí
          </TextButton>
        </View>
      </ScrollView>
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
  },
  title: {
    textAlign: 'center',
    fontWeight: 700,
    marginBottom: 70,
    marginTop: 70,
    color: COLORS.primary_50,
    letterSpacing: 1,
  },
  bottomMargin: {
    marginBottom: 30,
  },
  maxWidth: {
    maxWidth: 300,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  showPassword: {
    alignContent: 'center',
    paddingTop: 8,
  },
  mainBtn: {
    marginTop: 46,
    marginBottom: 150,
    width: '100%',
  },
  scrollView: {
    flexGrow: 0,
    marginBottom: 16,
  },
  select: {
    borderRadius: 28,
    backgroundColor: '#fafafa',
    maxWidth: 400,
    marginHorizontal: 'auto',
  },
  icon: {
    alignItems: 'center',
  },
  underline: {
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.primary_50,
  },
  login: {
    maxHeight: 40,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  /*
  select: {
    borderRadius: 28,
    backgroundColor: '#fafafa',
    maxWidth: 400,
    marginHorizontal: 'auto',
  },*/
  checkbox: {},
  searchBox: {
    borderRadius: 4,
    borderColor: COLORS.gray_100,
    backgroundColor: MD3Colors.primary100,
  },
  label: {
    fontSize: 16,
    fontWeight: 400,
    marginHorizontal: 5,
    marginVertical: 10,
    color: COLORS.primary_50,
  },
})

export default Signup
