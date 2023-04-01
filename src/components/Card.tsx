import { TouchableOpacity, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TaskData } from '../../App';

interface CardProps {
  data: TaskData;
}

export const CARD_HEIGHT = 56 + 12;

export function Card({ data }: CardProps) {
  return (
    <GestureHandlerRootView className="flex-1">
      <View className="h-16 rounded-md flex flex-row justify-between items-center bg-zinc-800 p-4 relative">
        <Text className="text-white">{data.title}</Text>
        <TouchableOpacity className="flex-row">
          <MaterialCommunityIcons name="dots-grid" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}
