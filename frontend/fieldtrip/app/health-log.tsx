import { useRouter } from 'expo-router'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { Card, DataTable, MD3Colors, Text } from 'react-native-paper'
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { Page } from '@components'
import { getHealthLog } from '@services'
import { COLORS } from '@colors'
import { Payload } from '@types'

interface IHealthLog {
  id: number
  timestamp: Date
  viewer: number
  fieldtrip: number
}

const HealthLog = () => {
  const router = useRouter()
  const [refresh, setRefresh] = useState(false)
  const [page, setPage] = useState(0)
  const [sortAscending, setSortAscending] = useState(true)
  const [numberOfItemsPerPageList] = useState([5, 10, 15])
  const [itemsPerPage, onItemsPerPageChange] = useState(numberOfItemsPerPageList[0])
  const [items, setItems] = useState<IHealthLog[]>([] as IHealthLog[])
  const [loading, setLoading] = useState(false)

  const sortedItems = items
    .slice()
    .sort((item1, item2) =>
      (sortAscending ? item1.timestamp < item2.timestamp : item2.timestamp < item1.timestamp)
        ? 1
        : -1,
    )
  const from = page * itemsPerPage
  const to = Math.min((page + 1) * itemsPerPage, items.length)

  useEffect(() => {
    setPage(0)
  }, [itemsPerPage])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      const jwt = jwtDecode<Payload>(token)
      getHealthLog(jwt.user_id)
        .then(async (res) => {
          if (res) {
            setItems(res)
            setRefresh(false)
          }
        })
        .catch((error) => {
          throw new Error(error.response?.data?.detail || error.message)
        })
        .finally(() => {
          setLoading(false)
        })
    })()
  }, [refresh, router])

  return (
    <Page style={styles.page} showTabs={true}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary_50} />
      ) : items.length > 0 ? (
        <Card style={{ backgroundColor: COLORS.gray_25 }}>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title textStyle={styles.title}>Usuario</DataTable.Title>
              <DataTable.Title textStyle={styles.title} style={{ marginLeft: 2 }}>
                Fieldtrip
              </DataTable.Title>
              <DataTable.Title
                textStyle={styles.title}
                style={{ marginLeft: 2 }}
                sortDirection={sortAscending ? 'ascending' : 'descending'}
                onPress={() => setSortAscending(!sortAscending)}
              >
                Fecha
              </DataTable.Title>
            </DataTable.Header>

            {sortedItems.slice(from, to).map((item) => (
              <DataTable.Row key={item.id}>
                <DataTable.Cell>{item.viewer}</DataTable.Cell>
                <DataTable.Cell style={{ marginLeft: 2 }}>{item.fieldtrip}</DataTable.Cell>
                <DataTable.Cell style={{ marginLeft: 2 }}>
                  {item.timestamp.toDateString()}
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            <DataTable.Pagination
              page={page}
              numberOfPages={Math.ceil(sortedItems.length / itemsPerPage)}
              onPageChange={(page) => setPage(page)}
              label={`${from + 1}-${to} of ${sortedItems.length}`}
              numberOfItemsPerPageList={numberOfItemsPerPageList}
              numberOfItemsPerPage={itemsPerPage}
              onItemsPerPageChange={onItemsPerPageChange}
              showFastPaginationControls
              selectPageDropdownLabel={'Filas por página'}
            />
          </DataTable>
        </Card>
      ) : (
        <Text>
          No hay datos para mostrar en este momento.{'\n'}Cuando un profesor revise tu ficha de
          salud lo podrás ver aquí.{' '}
        </Text>
      )}
      {!loading && (
        <Icon
          name="reload"
          size={24}
          onPress={() => {
            setRefresh(true)
          }}
          style={{ marginTop: 16, color: COLORS.primary_50 }}
        />
      )}
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
  title: {
    color: MD3Colors.neutral10,
    fontSize: 16,
  },
})

export default HealthLog
