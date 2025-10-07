import { Text } from 'react-native-paper'
import { StyleSheet, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

type BulletListProps = {
  data: string[]
}

const BulletList = ({ data = [] }: BulletListProps) => {
  if (!data || data.length === 0) {
    return <Icon name="close" size={20} color={'#00796b'} />
  }

  return (
    <>
      {data.map((item, index) => (
        <View style={styles.list} key={index}>
          <Icon name="chevron-right" size={20} color={'#00796b'} />
          <Text variant="bodyLarge">{item}</Text>
        </View>
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default BulletList
