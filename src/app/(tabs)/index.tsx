import { useGroceryStore } from "@/store/grocery-store";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";

import CompletedItems from "../../components/list/CompletedItems";
import ListHeroCard from "../../components/list/ListHeroCard";
import PendingItemCard from "../../components/list/PendingItemCard";
import TabScreenBackground from "../../components/TabScreenBackground";

export default function ListScreen() {
  const { items, loadItems, isLoading } = useGroceryStore();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const pendingItems = items.filter((item) => !item.purchased);

  return (
    <View className="flex-1 bg-background">
      {/* Fixed background bubbles */}
      <TabScreenBackground />

      <Animated.FlatList
        style={{ flex: 1 }}
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
              <Text className="text-sm font-bold uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                Shopping items
              </Text>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: isDark ? "#334155" : "#f1f5f9" }}>
                <Text className="text-xs font-semibold" style={{ color: isDark ? "#f8fafc" : "#1e293b" }}>
                  {pendingItems.length} active
                </Text>
              </View>
            </View>
          </Animated.View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <Animated.View entering={FadeInDown.delay(200)} style={{ marginTop: 32, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <View style={{ opacity: 0.6, alignItems: 'center' }}>
                <Text className="text-lg font-bold" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>All caught up!</Text>
                <Text className="mt-2 text-center text-sm" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                  Your grocery board is clear. Time to relax or add some new items.
                </Text>
              </View>
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
