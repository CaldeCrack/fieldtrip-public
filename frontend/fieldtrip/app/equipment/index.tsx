import { StyleSheet, View, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { useEffect, useState } from 'react'
import { MD3Colors, Text, TextInput } from 'react-native-paper'
import { PaperSelect } from 'react-native-paper-select'
import { ListItem } from 'react-native-paper-select/lib/typescript/interface/paperSelect.interface'
import { useRouter } from 'expo-router'

import { ContainedButton, EducationalInstitutionList, Page } from '@components'
import { COLORS } from '@colors'
import {
  createEducationalInstitutionEquipment,
  getEducationalInstitutions,
  getEquipmentTypes,
} from '@services'
import { EducationalInstitutionItem } from '@types'
import { useGlobalSnackbar } from '../../shared/context/useGlobalSnackbar'

const Equipment = () => {
  const router = useRouter()
  const { showSnackbar } = useGlobalSnackbar()
  const [showInventory, setShowInventory] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [institutions, setInstitutions] = useState<EducationalInstitutionItem[]>([])
  const [loadingInstitutions, setLoadingInstitutions] = useState(true)
  const [institutionsError, setInstitutionsError] = useState(false)
  const [addingEquipment, setAddingEquipment] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoadingInstitutions(true)
    setInstitutionsError(false)

    getEducationalInstitutions()
      .then((data) => {
        if (isMounted) {
          setInstitutions(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setInstitutionsError(true)
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingInstitutions(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleAddEquipment = async (payload: AddEquipmentPayload) => {
    if (addingEquipment) {
      return
    }

    setAddingEquipment(true)
    try {
      await createEducationalInstitutionEquipment(payload.institutionId, {
        name: payload.itemName,
        quantity: payload.amount,
      })
      showSnackbar('Equipamiento agregado correctamente.', { isError: false })
    } catch (error) {
      const message = (error as Error).message || 'No se pudo agregar el equipamiento.'
      showSnackbar(message, { isError: true })
    } finally {
      setAddingEquipment(false)
    }
  }

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
                backgroundColor: showInventory ? MD3Colors.primary50 : COLORS.gray_100,
              },
            ]}
            onPress={() => {
              setShowInventory(true)
              setShowAdd(false)
            }}
          >
            Inventario
          </ContainedButton>
          <ContainedButton
            style={[
              styles.btnMarginRight,
              styles.btnMarginBottom,
              {
                backgroundColor: showAdd ? MD3Colors.primary50 : COLORS.gray_100,
              },
            ]}
            onPress={() => {
              setShowInventory(false)
              setShowAdd(true)
            }}
          >
            Añadir
          </ContainedButton>
        </View>
      </ScrollView>
      {showInventory &&
        (loadingInstitutions ? (
          <ActivityIndicator size="large" color={COLORS.primary_50} style={styles.loading} />
        ) : institutionsError ? (
          <View style={styles.emptyState}>
            <Text>No se pudieron cargar las instituciones educativas.</Text>
          </View>
        ) : (
          <EducationalInstitutionList
            data={institutions}
            onPressItem={(institution) =>
              router.push({
                pathname: '/equipment/educational-institution',
                params: {
                  institutionId: String(institution.id),
                  institutionName: institution.name,
                },
              })
            }
          />
        ))}
      {showAdd && (
        <AddEquipmentForm
          institutions={institutions}
          loadingInstitutions={loadingInstitutions}
          institutionsError={institutionsError}
          submitting={addingEquipment}
          onSubmit={handleAddEquipment}
        />
      )}
    </Page>
  )
}

type AddEquipmentPayload = {
  institutionId: number
  institutionName: string
  itemName: string
  amount: number
}

type AddEquipmentFormProps = {
  institutions: EducationalInstitutionItem[]
  loadingInstitutions: boolean
  institutionsError: boolean
  submitting?: boolean
  onSubmit?: (_payload: AddEquipmentPayload) => void
}

const AddEquipmentForm = ({
  institutions,
  loadingInstitutions,
  institutionsError,
  submitting = false,
  onSubmit,
}: AddEquipmentFormProps) => {
  const [institution, setInstitution] = useState({
    value: '',
    list: [] as ListItem[],
    selectedList: [] as ListItem[],
  })
  const [itemName, setItemName] = useState('')
  const [amount, setAmount] = useState('')
  const [formError, setFormError] = useState('')
  const [equipmentOptions, setEquipmentOptions] = useState<{ id: number; name: string }[]>([])
  const [equipmentLoading, setEquipmentLoading] = useState(true)

  useEffect(() => {
    const list = institutions.map((item) => ({
      _id: String(item.id),
      value: item.name,
    }))

    setInstitution((prev) => ({
      ...prev,
      list,
    }))
  }, [institutions])

  useEffect(() => {
    let isMounted = true
    setEquipmentLoading(true)

    getEquipmentTypes()
      .then((data) => {
        if (isMounted) {
          setEquipmentOptions(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setEquipmentOptions([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setEquipmentLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleInstitutionSelection = (value: { text: string; selectedList: ListItem[] }) => {
    setInstitution((prev) => ({
      ...prev,
      value: value.text,
      selectedList: value.selectedList,
    }))
  }

  const selectedInstitutionId =
    institution.selectedList[0]?._id ||
    institution.list.find((item) => item.value === institution.value)?._id ||
    ''

  const amountValue = Number(amount)
  const normalizedName = itemName.trim().toLowerCase()
  const filteredSuggestions = normalizedName
    ? equipmentOptions
        .filter((item) => item.name.toLowerCase().includes(normalizedName))
        .slice(0, 5)
    : []
  const shouldShowSuggestions =
    filteredSuggestions.length > 0 &&
    !filteredSuggestions.some((item) => item.name.toLowerCase() === normalizedName)
  const canSubmit =
    institution.value.trim().length > 0 &&
    itemName.trim().length > 0 &&
    Number.isFinite(amountValue) &&
    amountValue > 0

  const handleSubmit = () => {
    if (!canSubmit || !selectedInstitutionId) {
      setFormError('Debe completar todos los campos con valores validos.')
      return
    }

    setFormError('')
    onSubmit?.({
      institutionId: Number(selectedInstitutionId),
      institutionName: institution.value,
      itemName: itemName.trim(),
      amount: amountValue,
    })

    setItemName('')
    setAmount('')
    setInstitution((prev) => ({
      ...prev,
      value: '',
      selectedList: [],
    }))
  }

  if (loadingInstitutions) {
    return <ActivityIndicator size="large" color={COLORS.primary_50} style={styles.loading} />
  }

  if (institutionsError) {
    return (
      <View style={styles.emptyState}>
        <Text>No se pudieron cargar las instituciones educativas.</Text>
      </View>
    )
  }

  return (
    <View style={styles.form}>
      <PaperSelect
        dialogStyle={styles.select}
        label="Institucion educativa *"
        value={institution.value}
        onSelection={handleInstitutionSelection}
        arrayList={[...institution.list]}
        selectedArrayList={institution.selectedList}
        hideSearchBox={true}
        dialogTitleStyle={{ textAlign: 'center' }}
        dialogTitle="Seleccione la institucion"
        dialogCloseButtonText="Cerrar"
        dialogDoneButtonText="Terminar"
        textInputMode="outlined"
        textInputProps={{
          outlineColor: COLORS.gray_100,
          activeOutlineColor: MD3Colors.primary50,
        }}
        checkboxProps={{
          checkboxColor: MD3Colors.primary50,
          checkboxUncheckedColor: COLORS.gray_100,
        }}
        containerStyle={styles.formField}
        multiEnable={false}
      />
      <TextInput
        mode="outlined"
        label="Nombre del item *"
        value={itemName}
        onChangeText={setItemName}
        outlineColor={COLORS.gray_100}
        activeOutlineColor={MD3Colors.primary50}
        style={styles.formField}
      />
      {equipmentLoading ? (
        <Text style={styles.suggestionHint}>Cargando sugerencias...</Text>
      ) : shouldShowSuggestions ? (
        <View style={styles.suggestions}>
          {filteredSuggestions.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setItemName(item.name)}
              style={styles.suggestionItem}
            >
              <Text style={styles.suggestionText}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <TextInput
        mode="outlined"
        label="Cantidad *"
        value={amount}
        onChangeText={setAmount}
        outlineColor={COLORS.gray_100}
        activeOutlineColor={MD3Colors.primary50}
        keyboardType="numeric"
        style={styles.formField}
      />
      {formError.length > 0 && <Text style={styles.formError}>{formError}</Text>}
      <ContainedButton onPress={handleSubmit} disabled={!canSubmit || submitting}>
        {submitting ? <ActivityIndicator color="white" size="small" /> : 'Enviar'}
      </ContainedButton>
    </View>
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
  loading: {
    marginTop: 24,
  },
  emptyState: {
    width: 300,
    marginTop: 24,
  },
  form: {
    width: '100%',
    maxWidth: 420,
  },
  formField: {
    marginBottom: 14,
  },
  formError: {
    color: MD3Colors.error50,
    marginBottom: 12,
  },
  suggestions: {
    backgroundColor: COLORS.gray_50,
    borderRadius: 12,
    paddingVertical: 6,
    marginTop: -6,
    marginBottom: 12,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestionText: {
    color: MD3Colors.primary0,
  },
  suggestionHint: {
    color: COLORS.gray_500,
    marginTop: -6,
    marginBottom: 12,
  },
  select: {
    borderRadius: 28,
    backgroundColor: '#fafafa',
    maxWidth: 420,
    marginHorizontal: 'auto',
  },
})

export default Equipment
