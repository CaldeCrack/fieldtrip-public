import { StyleSheet, View } from 'react-native'
import { Divider, List, MD3Colors, Text } from 'react-native-paper'

import { EquipmentItem } from '@types'

type Props = {
  data: EquipmentItem[]
}

const EquipmentList = ({ data = [] }: Props) => {
  const filteredEquipment = data.filter((item) => item.quantity > 0)

  if (filteredEquipment.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>No se ha registrado equipamiento en uso.</Text>
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      <List.Section style={styles.section}>
        {filteredEquipment.map((item) => (
          <View key={String(item.id)}>
            <List.Item
              title={item.name}
              description="Equipamiento en uso"
              left={(props) => <List.Icon {...props} icon="tools" color={MD3Colors.primary50} />}
              right={() => <Text style={styles.quantity}>x{item.quantity}</Text>}
            />
            <Divider style={styles.divider} />
          </View>
        ))}
      </List.Section>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  section: {
    width: '100%',
    paddingVertical: 0,
  },
  divider: {
    backgroundColor: MD3Colors.primary50,
  },
  quantity: {
    alignSelf: 'center',
    fontWeight: '700',
    marginRight: 4,
  },
  emptyStateContainer: {
    marginTop: 24,
    width: 300,
    alignSelf: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
  },
})

export default EquipmentList
