import { FontAwesome6 } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useGroceryStore } from "../../store/grocery-store";

const CompletedItems = () => {
  const { removeItem, togglePurchased, items } = useGroceryStore();
  const completedItems = items.filter((item) => item.purchased);

  if (!completedItems.length) return null;

  return (
    <View className="mt-3 rounded-[28px] border border-slate-100 bg-secondary/50 p-5">
      <Text className="text-xs font-bold uppercase tracking-[1.5px] text-slate-500 mb-3">
        Completed
      </Text>

      {completedItems.map((item) => (
        <View
          key={item.id}
          className="mb-2 flex-row items-center justify-between rounded-2xl border border-white/50 bg-white px-4 py-3 shadow-sm shadow-slate-200/40"
        >
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => togglePurchased(item.id)}
              className="h-6 w-6 items-center justify-center rounded-full bg-slate-200 active:opacity-70"
            >
              <FontAwesome6 name="rotate-left" size={10} color="#64748b" />
            </Pressable>
            <Text className="text-[15px] font-medium text-slate-400 line-through">
              {item.name}
            </Text>
          </View>

          <Pressable
            onPress={() => removeItem(item.id)}
            className="h-8 w-8 items-center justify-center rounded-full bg-red-50 active:opacity-70"
          >
            <FontAwesome6 name="trash" size={12} color="#ef4444" />
          </Pressable>
        </View>
      ))}
    </View>
  );
};
export default CompletedItems;
