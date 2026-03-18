import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Text, TextInput, MD3Colors } from 'react-native-paper'
import { PaperSelect } from 'react-native-paper-select'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { ListItem } from 'react-native-paper-select/lib/typescript/interface/paperSelect.interface'

import { ContainedButton, Page, SimpleInput } from '@components'
import { COLORS } from '@colors'
import { getDiets, updatePersonalInfo } from '@services'
import { useGlobalSnackbar } from '../shared/context/useGlobalSnackbar'

interface DietItem {
  id: number
  type: string
}

const PersonalInfo = () => {
  const { showSnackbar } = useGlobalSnackbar()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyNumber, setEmergencyNumber] = useState('')
  const [dietInfo, setDietInfo] = useState('')
  const [diet, setDiet] = useState({
    value: '',
    list: [] as ListItem[],
    selectedList: [] as ListItem[],
  })

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      getDiets()
        .then((res) => {
          const diets = res.map((item: DietItem) => ({
            _id: String(item.id),
            value: item.type,
          }))
          setDiet((prev) => ({
            ...prev,
            list: diets,
          }))
        })
        .catch(() => {
          showSnackbar('No se pudo obtener la lista de dietas.', { isError: true })
        })
        .finally(() => {
          setLoading(false)
        })
    })()
  }, [showSnackbar])

  const handleSave = async () => {
    if (!emergencyContact.trim() || !emergencyNumber.trim() || !diet.value.trim()) {
      showSnackbar('Debe completar contacto, numero de emergencia y tipo de dieta.', {
        isError: true,
      })
      return
    }

    if (!/^\d{9}$/.test(emergencyNumber.trim())) {
      showSnackbar('El numero de emergencia debe tener exactamente 9 digitos.', {
        isError: true,
      })
      return
    }

    const selectedDiet = diet.list.find((item) => item.value === diet.value)
    if (!selectedDiet) {
      showSnackbar('Debe seleccionar un tipo de dieta valido.', { isError: true })
      return
    }

    setSaving(true)
    try {
      await updatePersonalInfo({
        emergency_contact: emergencyContact.trim(),
        emergency_number: Number(emergencyNumber.trim()),
        diet_type: Number(selectedDiet._id),
        diet_info: dietInfo.trim(),
      })
      showSnackbar('Informacion personal actualizada correctamente.', { isError: false })
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'No se pudo actualizar la informacion personal.'
      showSnackbar(msg, { isError: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page style={styles.page}>
      <View style={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Editar informacion personal
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary_50} style={styles.loader} />
        ) : (
          <>
            <SimpleInput
              label="Contacto de emergencia"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
            />
            <SimpleInput
              label="Numero de emergencia"
              value={emergencyNumber}
              onChangeText={setEmergencyNumber}
              keyboardType="number-pad"
            />
            <PaperSelect
              dialogStyle={styles.select}
              label="Tipo de dieta"
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
            <SimpleInput
              label="Informacion extra de alimentacion"
              value={dietInfo}
              onChangeText={setDietInfo}
              multiline={true}
              numberOfLines={3}
              style={styles.multilineInput}
            />

            <ContainedButton
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.btn}
            >
              Guardar cambios
            </ContainedButton>
          </>
        )}
      </View>
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
    width: '100%',
  },
  title: {
    marginBottom: 20,
    fontWeight: 600,
  },
  loader: {
    marginTop: 24,
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
  multilineInput: {
    height: 96,
    textAlignVertical: 'top',
  },
  btn: {
    marginTop: 8,
    backgroundColor: COLORS.primary_50,
  },
})

export default PersonalInfo
