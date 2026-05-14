import { StyleSheet, View, ScrollView } from 'react-native'
import { useState } from 'react'
import { MD3Colors } from 'react-native-paper'

import { ContainedButton, Page } from '@components'
import { COLORS } from '@colors'

const Equipment = () => {
  const [showItems, setShowItems] = useState(true)
  const [showStock, setShowStock] = useState(false)

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
                backgroundColor: showItems ? MD3Colors.primary50 : COLORS.gray_100,
              },
            ]}
            onPress={() => {
              setShowItems(true)
              setShowStock(false)
            }}
          >
            Items
          </ContainedButton>
          <ContainedButton
            style={[
              styles.btnMarginRight,
              styles.btnMarginBottom,
              {
                backgroundColor: showStock ? MD3Colors.primary50 : COLORS.gray_100,
              },
            ]}
            onPress={() => {
              setShowItems(false)
              setShowStock(true)
            }}
          >
            Stock
          </ContainedButton>
        </View>
      </ScrollView>
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
