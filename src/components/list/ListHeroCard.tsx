import { Text, View } from "react-native";
import { useGroceryStore } from "../../store/grocery-store";

const ListHeroCard = () => {
  const { items } = useGroceryStore();

  const completedCount = items.filter((item) => item.purchased).length;
  const pendingCount = items.length - completedCount;
  const completionRate = items.length
    ? Math.round((completedCount / items.length) * 100)
    : 0;

  return (
    <View className="rounded-[32px] bg-primary p-7 shadow-lg shadow-primary/40">
      <Text className="text-xs font-bold uppercase tracking-[1.5px] text-white/70">
        Today
      </Text>

      <Text className="mt-1 text-3xl font-extrabold text-white">
        Your Grocery Board
      </Text>

      <Text className="mt-1.5 text-sm font-medium text-white/80">
        {pendingCount} pending · {completedCount} completed
      </Text>

      <View className="mt-6 overflow-hidden rounded-full bg-black/10">
        <View
          className="h-2 rounded-full bg-white"
          style={{ width: `${completionRate}%` }}
        />
      </View>
    </View>
  );
};

export default ListHeroCard;
