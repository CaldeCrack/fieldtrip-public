import { StyleSheet, View, ScrollView } from 'react-native'
import { useState } from 'react'
import { MD3Colors } from 'react-native-paper'

import { ContainedButton, EducationalInstitutionList, Page } from '@components'
import { COLORS } from '@colors'

type EducationalInstitution = {
  id: number
  name: string
}

const Equipment = () => {
  const [showInventory, setShowInventory] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const institutions: EducationalInstitution[] = [
    { id: 1, name: 'Institucion Central' },
    { id: 2, name: 'Institucion Tecnica Norte' },
    { id: 3, name: 'Institucion Agricola Sur' },
  ]

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
      {showInventory && <EducationalInstitutionList data={institutions} />}
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
})

export default Equipment
