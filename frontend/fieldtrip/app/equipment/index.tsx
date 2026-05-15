import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { MD3Colors, Text } from 'react-native-paper'
import { useRouter } from 'expo-router'

import { ContainedButton, EducationalInstitutionList, Page } from '@components'
import { COLORS } from '@colors'
import { getEducationalInstitutions } from '@services'
import { EducationalInstitutionItem } from '@types'

const Equipment = () => {
  const router = useRouter()
  const [showInventory, setShowInventory] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [institutions, setInstitutions] = useState<EducationalInstitutionItem[]>([])
  const [loadingInstitutions, setLoadingInstitutions] = useState(true)
  const [institutionsError, setInstitutionsError] = useState(false)

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
  loading: {
    marginTop: 24,
  },
  emptyState: {
    width: 300,
    marginTop: 24,
  },
})

export default Equipment
