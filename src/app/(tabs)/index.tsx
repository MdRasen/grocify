import { useEffect } from "react";
import { useGroceryStore } from "@/store/grocery-store";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

import PendingItemCard from "../../components/list/PendingItemCard";
import CompletedItems from "../../components/list/CompletedItems";
import ListHeroCard from "../../components/list/ListHeroCard";
import TabScreenBackground from "../../components/TabScreenBackground";

export default function ListScreen() {
  const { items, loadItems, isLoading } = useGroceryStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadItems();
  }, []);

  const pendingItems = items.filter((item) => !item.purchased);

  return (
    <View className="flex-1 bg-background">
      {/* Fixed background bubbles */}
      <TabScreenBackground />

      <Animated.FlatList
        className="flex-1"
        data={pendingItems}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          padding: 20, 
          paddingTop: insets.top + 20,
          gap: 14 
        }}
        itemLayoutAnimation={Layout.springify()}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <PendingItemCard item={item} />
          </Animated.View>
        )}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.springify()} style={{ gap: 16, paddingBottom: 10 }}>
            <ListHeroCard />
            
            <View className="flex-row items-end justify-between px-2 pt-4">
              <Text className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                Shopping items
              </Text>
              <View className="rounded-full bg-secondary/50 px-3 py-1">
                <Text className="text-xs font-semibold text-secondary-foreground">
                  {pendingItems.length} active
                </Text>
              </View>
            </View>
          </Animated.View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <Animated.View entering={FadeInDown.delay(200)} className="mt-8 items-center justify-center p-6 opacity-60">
              <Text className="text-lg font-bold text-muted-foreground">All caught up!</Text>
              <Text className="mt-2 text-center text-sm text-muted-foreground">
                Your grocery board is clear. Time to relax or add some new items.
              </Text>
            </Animated.View>
          ) : null
        }
        ListFooterComponent={
          <Animated.View layout={Layout.springify()}>
            <CompletedItems />
          </Animated.View>
        }
      />
    </View>
  );
}
