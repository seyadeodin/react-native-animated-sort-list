import Animated, {
  SharedValue,
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

import { TaskData } from '../../App';
import { Card, CARD_HEIGHT } from './Card';
import { useState } from 'react';

interface MovableCardProps {
  data: TaskData;
  cardsPosition: SharedValue<number[]>;
  scrollY: SharedValue<number>;
  cardsCount: number;
}

export function MovableCard({
  data,
  cardsPosition,
  scrollY,
  cardsCount,
}: MovableCardProps) {
  const [moving, setMoving] = useState(false);

  const top = useSharedValue(cardsPosition.value[data.id] * CARD_HEIGHT);

  function objectMove(positions: number[], from: number, to: number) {
    const newPositions = Object.assign({}, positions);

    for (const id in positions) {
      if (positions[id] === from) {
        newPositions[id] = to;
      }

      if (positions[id] === to) {
        newPositions[id] = from;
      }
    }

    return newPositions;
  }

  const longPressGesture = Gesture.LongPress()
    .onStart(() => {
      runOnJS(setMoving)(true);
      console.log('Pressionada longa');
    })
    .minDuration(200);

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((_, state) => {
      moving ? state.activate() : state.fail();
    })
    .onUpdate(event => {
      const positionY = event.absoluteY + scrollY.value;
      top.value = positionY - CARD_HEIGHT;

      const startPositionList = 0;
      const endPositionList = cardsCount - 1;
      const currentPosition = Math.floor(positionY / CARD_HEIGHT);

      const newPosition = Math.max(
        startPositionList,
        Math.min(currentPosition, endPositionList),
      );

      if (newPosition !== cardsPosition.value[data.id]) {
        cardsPosition.value = obJectMove(cardsPosition.value, cardsPosition.value[data.id], newPosition);
      }
    })
    .onEnd(() => runOnJS(setMoving)(false));

  const animatedStyle = useAnimatedStyle(() => {
    return {
      top: top.value - CARD_HEIGHT,
      zIndex: moving ? 1 : 0,
      opacity: withSpring(moving ? 0.4 : 1),
    };
  }, [moving]);

  return (
    <Animated.View className="absolute left-0 right-0" style={animatedStyle}>
      <GestureDetector gesture={Gesture.Race(panGesture, longPressGesture)}>
        <Card data={data} />
      </GestureDetector>
    </Animated.View>
  );
}