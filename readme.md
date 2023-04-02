# Sortlist with RN

### Setup

- We start by initializating a RN project and installing the following packages:
  ```
  npx expo install react-native-gesture-handler
  npx expo install react-native reanimated
  ```
- Add add reanimated to our plugin list:
  ```tsx
  module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: ['nativewind/babel', 'react-native-reanimated/plugin'],
    };
  };
  ```

### Creating our pan animation

- On [[./App.tsx]]:

  - We wrap our elements in GeestureHandlerRootView so gesture handler works:

    ```tsx
    <GestureHandlerRootView className="flex-1 bg-zinc-800 justify-center text-center">
      ...
    </GestureHandlerRootView>
    ```

  - Importing `Animated` we create a animated scrollvieiw:
    - To create our effect a few things are necessary:
      - Our Card must have a fixed length, which we multiply with our data length to determine our list size.
      - `scrollEventThrottle` increase scroll value change speed to make it less nappier and more fluid.
    ```tsx
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
    ```
  - Our `MovableCard` receives a few props to make the calculations necessary to change the position of our items:

    - We import useSharedValue from animated, it is here where we store our values.
    - `scrollY` starts as 0 and will have its value udpdate everytime we scroll to the actuaal posittion thanks to `onScroll`.
    - `cardsPosition` on the other hand will return an object which takes our data and transform it from an array to an object having as key its id and as value its inndex. That will facilitate its manipulation.

    ```tsx
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
    ```

- On [./src/components/MovableCard.tsx]:
- For our longPress gesture:
- This gesture will simply set our state moving as true when we hold it for 2 seconds. Preventing it from changing position othwrwise.
- `runOnS` is what allow us to change states in our component (js thread) without conflicting with our UI thread.

```tsx
const [moving, setMoving] = useState(false);

const longPressGesture = Gesture.LongPress()
  .onStart(() => {
    runOnJS(setMoving)(true);
    console.log('Pressionada longa');
  })
  .minDuration(200);
```

- For our pan gesture:
  - we use `manualActivation` so it is only activated when `onTouchesMove` receives our `moving` as true.
  - To determine our position Y we take the scroll position we receive from the parent component and sum it. From the first we take the position we are relative to the screen and from the second relative to the scroll. Giving us its exact position.
  - Our top, which determines our card position is then updated so our card moves according to new positions of absoloteY and scrollY.
  - `startPositionList` and `endPositionList` mark the index from our first and last item of the array, while `currentPosition` is the one from our actual card, being the result of our `positionY/CARD_HEIGHT` rounded down.
  - `(workleet)` marks the part of our code where we use the javascript thread to update our values.
  - Inside it we calculate the new position of our component in the list, taking whatever value is higher: our `startPositionList` which is 0 or the lesser value between our `currentPosition` and `endPositionList`, which prevents it from being negative ou higher then the number of items we actually have.
  - In case its new position is diffrent from the one we had be fore we update the value of our `cardPosition` with the the function `objectMove` passing our cardsPosition array, actual position and new one.
  - When the movement is finally done `onEnd()` we update the top value with the one from `cardPosition * CARD_HEIGHT` which will snap it to its new position on the list.
  - Then set our move to false.
  - As a last method `simultaneousWithExternalGesture` wil ensure that it runs togetheer with our `longPressGesture` so we don't need to execute it in two different gestures.

```tsx
const top = useSharedValue(cardsPosition.value[data.id] * CARD_HEIGHT);

const panGesture = Gesture.Pan()
  .manualActivation(true)
  .onTouchesMove((_, state) => {
    moving ? state.activate() : state.fail();
  })
  .onUpdate(event => {
    const positionY = event.absoluteY + scrollY.value;
    top.value = positionY - CARD_HEIGHT;

    const startPositionList = 0;
    const endPositionList = cardsCount - 1;
    const currentPosition = Math.floor(positionY / CARD_HEIGHT);

    ('worklet');
    const newPosition = Math.max(
      startPositionList,
      Math.min(currentPosition, endPositionList),
    );

    if (newPosition !== cardsPosition.value[data.id]) {
      cardsPosition.value = objectMove(
        cardsPosition.value,
        cardsPosition.value[data.id],
        newPosition,
      );
    }
  })
  .onEnd(() => {
    const newPosition = cardsPosition.value[data.id] * CARD_HEIGHT;
    top.value = withSpring(newPosition);
    runOnJS(setMoving)(false);
  })
  .simultaneousWithExternalGesture(longPressGesture);
```

- `objectMoves` function:

  - In here we create a object for the new positions.
  - from is the old position and to the new one
  - We run through or old positions, if the actual position === old then its new positiona wll be the new one.
  - On contrary if its equal to the new it now is place in the old.
  - This update the positions from all items in our array, moving away to open the space for the moved card to occupy.

  ```tsx
  function objectMove(positions: number[], from: number, to: number) {
    'worklet';
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
  ```

  - To animate these interactions we have `useAnimateReaction`
    - Will run every time we're move something.
    - Passing our current position as our first argument, it the nuses it to determine whether it moves or not.
    - After our gesture is done it then reposition our items based on its new position using a spring animation.
    - Moving is passed as a dependency here.
    ```tsx
    useAnimatedReaction(
      () => cardsPosition.value[data.id],
      (currentPosition, previousPosition) => {
        if (currentPosition !== previousPosition) {
          if (!moving) {
            top.value = withSpring(currentPosition * CARD_HEIGHT);
          }
        }
      },
      [moving],
    );
    ```
  - Together with its default style we pass to our `MovableCard` `Animated.View` an `animatedStyle` which will be update as we perform the gesture:

    - Our height is our top.value minus our CARD_HEEIGHT to accurately reflect its position
    - When tis moving its index is 1 so we ensure its above the other elements
    - And its opacity is also reduced while moving, we use spring animation to make it smoother.

    ```tsx
    const animatedStyle = useAnimatedStyle(() => {
      return {
        top: top.value - CARD_HEIGHT,
        zIndex: moving ? 1 : 0,
        opacity: withSpring(moving ? 0.4 : 1),
      };
    }, [moving]);
    ```
