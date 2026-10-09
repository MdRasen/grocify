import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TabScreenBackground from "../../components/TabScreenBackground";
import { GroceryCategory, useGroceryStore } from "../../store/grocery-store";

const CATEGORY_COLORS: Record<GroceryCategory, string> = {
  Dairy: "bg-blue-400",
  Produce: "bg-emerald-400",
  Snacks: "bg-pink-400",
  Pantry: "bg-purple-400",
  Bakery: "bg-orange-400",
};

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  
  const { items, clearPurchased, loadItems } = useGroceryStore();

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const {
    total,
    completed,
    pending,
    completionRate,
    highPriority,
    categoryStats,
  } = useMemo(() => {
    const totalCount = items.length;
    const completedCount = items.filter((i) => i.purchased).length;
    const pendingCount = items.filter((i) => !i.purchased).length;
    const rate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const highPriorityCount = items.filter(
      (i) => i.priority === "high" && !i.purchased
    ).length;

    const catCounts: Partial<Record<GroceryCategory, number>> = {};
    items.forEach((item) => {
      catCounts[item.category] = (catCounts[item.category] || 0) + 1;
    });

    const statsArray = Object.entries(catCounts)
      .map(([cat, count]) => ({
        name: cat as GroceryCategory,
        count: count as number,
        colorClass: CATEGORY_COLORS[cat as GroceryCategory] || "bg-gray-400",
      }))
      .sort((a, b) => b.count - a.count);

    return {
      total: totalCount,
      completed: completedCount,
      pending: pendingCount,
      completionRate: rate,
      highPriority: highPriorityCount,
      categoryStats: statsArray,
    };
  }, [items]);

  const maxCategoryCount =
    categoryStats.length > 0 ? categoryStats[0].count : 1;

  return (
    <View className="flex-1 bg-background">
      <TabScreenBackground />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
        }}
      >
        {/* Top Hero Card (Glassmorphic) */}
        <Animated.View entering={FadeInDown.springify()}>
          <View className="rounded-[32px] border border-white/50 bg-white/70 p-6 shadow-sm shadow-slate-200/50">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500">
                  Grocery Insights
                </Text>
                <Text className="mt-2 text-3xl font-extrabold text-slate-800 leading-9">
                  Track your shopping habits.
                </Text>
              </View>
              <View
                style={{
                  marginTop: 4,
                  height: 48,
                  width: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 16,
                  backgroundColor: "#3b82f6",
                  shadowColor: "#3b82f6",
                  shadowOpacity: 0.4,
                  shadowRadius: 2,
                  shadowOffset: { width: 0, height: 1 },
                }}
              >
                <Ionicons name="stats-chart" size={24} color="#ffffff" />
              </View>
            </View>

            <Text className="mt-4 text-sm font-medium text-slate-500">
              See how much you've accomplished and what's left on your list.
            </Text>

            {/* Stat Boxes */}
            <View className="mt-6 flex-row gap-2">
              <View className="flex-1 rounded-2xl border border-slate-100 bg-white/60 p-3 shadow-sm shadow-slate-200/20">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Pending
                </Text>
                <Text className="mt-1 text-2xl font-extrabold text-slate-800">
                  {pending}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-slate-100 bg-white/60 p-3 shadow-sm shadow-slate-200/20">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Completed
                </Text>
                <Text className="mt-1 text-2xl font-extrabold text-slate-800">
                  {completed}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-slate-100 bg-white/60 p-3 shadow-sm shadow-slate-200/20">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total
                </Text>
                <Text className="mt-1 text-2xl font-extrabold text-slate-800">
                  {total}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Breakdown Card */}
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <View className="mt-6 rounded-[32px] border border-white/50 bg-white/80 p-6 shadow-sm shadow-slate-200/50">
            {/* Completion Rate */}
            <View className="mb-8">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-800">
                  Completion rate
                </Text>
                <Text className="text-sm font-bold text-emerald-500">
                  {Math.round(completionRate)}%
                </Text>
              </View>
              <View className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <View
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${completionRate}%` }}
                />
              </View>
            </View>

            {/* Categories */}
            <View className="mb-8">
              <View className="mb-5 flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-800">
                  Items by category
                </Text>
                <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500">
                  {categoryStats.length} GROUPS
                </Text>
              </View>

              <View className="gap-4">
                {categoryStats.length > 0 ? (
                  categoryStats.map((cat) => (
                    <View key={cat.name}>
                      <View className="mb-2 flex-row items-center justify-between">
                        <Text className="text-sm font-semibold text-slate-700">
                          {cat.name}
                        </Text>
                        <Text className="text-sm font-semibold text-emerald-500">
                          {cat.count}
                        </Text>
                      </View>
                      <View className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <View
                          className={`h-full rounded-full ${cat.colorClass}`}
                          style={{
                            width: `${(cat.count / maxCategoryCount) * 100}%`,
                          }}
                        />
                      </View>
                    </View>
                  ))
                ) : (
                  <View className="py-2 items-center">
                    <Text className="text-center text-sm text-slate-500">
                      No items in your list yet. Start adding items to see
                      category breakdown!
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* High priority remaining */}
            <View className="mb-2">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-800">
                  High priority remaining
                </Text>
                <View className="rounded-lg bg-red-100 px-2.5 py-1">
                  <Text className="text-[10px] font-bold tracking-[1.5px] text-red-600">
                    ACTION
                  </Text>
                </View>
              </View>
              <Text className="mb-1 text-3xl font-extrabold text-slate-800">
                {highPriority}
              </Text>
              <Text className="text-sm font-medium text-slate-500">
                Handle these first for a smoother trip.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Clear Button */}
        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <TouchableOpacity
            onPress={clearPurchased}
            className="mt-6 h-14 w-full items-center justify-center rounded-2xl bg-slate-900 shadow-sm"
            activeOpacity={0.8}
          >
            <Text className="text-base font-bold text-white">
              Clear completed items
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
