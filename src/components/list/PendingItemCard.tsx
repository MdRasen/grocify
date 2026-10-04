import { FontAwesome6 } from "@expo/vector-icons";
import { TouchableOpacity, Text, View } from "react-native";
import { GroceryItem, useGroceryStore } from "../../store/grocery-store";

const priorityPillBg = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
};

const priorityPillText = {
  low: "text-priority-low-foreground",
  medium: "text-priority-medium-foreground",
  high: "text-priority-high-foreground",
};

const PendingItemCard = ({ item }: { item: GroceryItem }) => {
  const { removeItem, updateQuantity, togglePurchased } = useGroceryStore();

  return (
    <View className="rounded-[28px] border border-slate-100 bg-card p-[18px] shadow-sm shadow-slate-200/50">
      <View className="flex-row items-start gap-4">
        <TouchableOpacity
          className={`mt-1 h-6 w-6 items-center justify-center rounded-full border-2 ${item.purchased ? 'border-primary bg-primary' : 'border-slate-300 bg-transparent'}`}
          onPress={() => togglePurchased(item.id)}
        >
          {item.purchased && <FontAwesome6 name="check" size={10} color="#ffffff" />}
        </TouchableOpacity>

        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-lg font-bold text-card-foreground">
              {item.name}
            </Text>
            <View
              className={`rounded-full px-3 py-1 ${priorityPillBg[item.priority]}`}
            >
              <Text
                className={`text-[10px] font-bold uppercase tracking-wider ${priorityPillText[item.priority]}`}
              >
                {item.priority}
              </Text>
            </View>
          </View>

          <View className="mt-1.5 flex-row items-center gap-2">
            <View className="rounded-full bg-slate-100 px-3 py-1">
              <Text className="text-xs font-medium text-slate-500">
                {item.category}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center gap-3">
            <TouchableOpacity
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
              onPress={() =>
                updateQuantity(item.id, Math.max(1, item.quantity - 1))
              }
            >
              <FontAwesome6 name="minus" size={12} color="#64748b" />
            </TouchableOpacity>

            <Text className="min-w-[24px] text-center text-base font-semibold text-slate-700">
              {item.quantity}
            </Text>

            <TouchableOpacity
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <FontAwesome6 name="plus" size={12} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-full bg-red-50"
          onPress={() => removeItem(item.id)}
        >
          <FontAwesome6 name="trash" size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PendingItemCard;
