import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import data from './data.json';
import { Text, View } from 'react-native';
import { MovableCard } from './src/components/MovableCard';
import { CARD_HEIGHT } from './src/components/Card';

export type TaskData = {
  id: number;
  title: string;
};

export default function App() {
  const scrollY = useSharedValue(0);
  const cardsPosition = useSharedValue(listToObject(data));

  const handleScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  function listToObject(list: typeof data) {
    const listOfCards = Object.values(list);

    const object: any = [];

    listOfCards.forEach((card, index) => {
      object[card.id] = index;
    });

    return object;
  }

  return (
    <GestureHandlerRootView className="flex-1 bg-zinc-800 justify-center text-center">
      <StatusBar style="auto" />
      <View className="pt-10 pb-2">
        <Text className="text-white font-semibold text-xl text-center">
          Tarefas
        </Text>
        <Text className="text-gray-200 text-center">
          Organize sua lista de tarefas
        </Text>
      </View>
      <Animated.ScrollView
        className="gap-x-4 px-10 bg-zinc-900 pt-4"
        contentContainerStyle={{
          height: data.length * CARD_HEIGHT,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        cardsPosition={cardsPosition}
      >
        {data.map((task: TaskData) => (
          <MovableCard
            key={task.id}
            data={task}
            scrollY={scrollY}
            cardsPosition={cardsPosition}
            cardsCount={data.length}
          />
        ))}
      </Animated.ScrollView>
    </GestureHandlerRootView>
  );
}
