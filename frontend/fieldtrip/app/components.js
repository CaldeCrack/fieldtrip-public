import { useRouter, useSearchParams, Stack, Link } from 'expo-router'
import React, { useState } from 'react'
import { TextInput } from 'react-native-paper'
import { StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { MD3Colors } from 'react-native-paper'
import { PaperSelect } from 'react-native-paper-select'

import { View, Text } from 'react-native'
import { Button } from 'react-native-paper'
import { DatePickerModal } from 'react-native-paper-dates'

import {
  Page,
  SimpleInput,
  IconInput,
  CheckboxItem,
  ConfirmationModal,
  ContainedButton,
} from '@components'

export const selectValidator = (value) => {
  if (!value || value.length <= 0) {
    return 'Please select a value.'
  }

  return ''
}

const Components = () => {
  const router = useRouter()
  const { name } = useSearchParams()

  const [checked, setChecked] = useState(true)

  const [visible, setVisible] = useState({})

  const _toggleModal = (name) => () =>
    setVisible({ ...visible, [name]: !visible[name] })

  const _getVisible = (name) => !!visible[name]

  const [date, setDate] = React.useState(undefined)
  const [open, setOpen] = React.useState(false)

  const onDismissSingle = React.useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const onConfirmSingle = React.useCallback(
    (params) => {
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
    selectedList: [],
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
      <ContainedButton onPress={_toggleModal('modal')}>
        Abrir modal
      </ContainedButton>
      <ConfirmationModal
        visible={_getVisible('modal')}
        close={_toggleModal('modal')}
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
