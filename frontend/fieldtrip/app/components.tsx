import { useRouter, Link } from 'expo-router'
import { useState, useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import { TextInput, MD3Colors, Button } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { PaperSelect } from 'react-native-paper-select'
import { DatePickerModal } from 'react-native-paper-dates'
import { ListItem } from 'react-native-paper-select/lib/typescript/interface/paperSelect.interface'
import { CalendarDate } from 'react-native-paper-dates/lib/typescript/Date/Calendar'

import {
  Page,
  SimpleInput,
  IconInput,
  CheckboxItem,
  ConfirmationModal,
  ContainedButton,
} from '@components'

interface Params {
  date: CalendarDate
}

const Components = () => {
  const router = useRouter()
  const [checked, setChecked] = useState(true)
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  const _toggleModal = (name: string) => () => setVisible({ ...visible, [name]: !visible[name] })

  const _getVisible = (name: string) => !!visible[name]

  const [date, setDate] = useState<CalendarDate>()
  const [open, setOpen] = useState(false)

  const onDismissSingle = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const onConfirmSingle = useCallback(
    (params: Params) => {
      setOpen(false)
      setDate(params.date)
    },
    [setOpen, setDate],
  )

  const [gender, setGender] = useState({
    value: '',
    list: [
      { _id: '1', value: 'MALE' },
      { _id: '2', value: 'FEMALE' },
      { _id: '3', value: 'OTHERS' },
    ],
    selectedList: [] as ListItem[],
    error: '',
  })

  return (
    <Page style={{ alignItems: 'center' }}>
      <ContainedButton onPress={() => router.back()}>Go back!</ContainedButton>
      <SimpleInput label="simple input" />
      <CheckboxItem
        label="checkbox item"
        status={checked ? 'checked' : 'unchecked'}
        onPress={() => setChecked(!checked)}
      />
      <IconInput iconName="home" label="icon input" />
      <PaperSelect
        label="Placeholder"
        value={gender.value}
        onSelection={(value) => {
          setGender({
            ...gender,
            value: value.text,
            selectedList: value.selectedList,
            error: '',
          })
        }}
        arrayList={[...gender.list]}
        selectedArrayList={gender.selectedList}
        errorText={gender.error}
        multiEnable={false}
        hideSearchBox={false}
        searchText="Escriba algo"
        dialogCloseButtonText="Cerrar"
        dialogDoneButtonText="Terminar"
        selectAllEnable={false}
        selectAllText="Seleccionar todo"
        textInputMode="outlined"
        textInputProps={{
          outlineColor: MD3Colors.neutralVariant50,
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
                    setGender({
                      ...gender,
                      value: '',
                      selectedList: [],
                      error: '',
                    })
                  }
                />
              )}
            />
          ),
        }}
        checkboxProps={{
          checkboxColor: '#00796b',
          checkboxUncheckedColor: MD3Colors.neutral90,
        }}
        containerStyle={{
          maxWidth: 300,
          marginBottom: 14,
        }}
      />
      <ContainedButton onPress={_toggleModal('modal')}>Abrir modal</ContainedButton>
      <ConfirmationModal
        visible={_getVisible('modal')}
        close={_toggleModal('modal')}
        open={() => {}}
        title="Modal con confirmación"
        description="Aquí va la descripción"
      />
      <Link
        href={{
          //href='/profile?name=Carola'
          pathname: '/components',
          params: { name: 'Romina' },
        }}
      >
        Ver componentes
      </Link>

      <View style={{ justifyContent: 'center', flex: 1, alignItems: 'center' }}>
        <Button onPress={() => setOpen(true)} uppercase={false} mode="outlined">
          Pick single date
        </Button>
        <DatePickerModal
          locale="en"
          mode="single"
          visible={open}
          onDismiss={onDismissSingle}
          date={date}
          onConfirm={onConfirmSingle}
        />
      </View>
    </Page>
  )
}

const styles = StyleSheet.create({
  icon: {
    alignContent: 'center',
  },
})

export default Components
