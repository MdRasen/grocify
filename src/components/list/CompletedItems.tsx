import { FontAwesome6 } from "@expo/vector-icons";
import { TouchableOpacity, Text, View } from "react-native";
import { useGroceryStore } from "../../store/grocery-store";
import { useSettingsStore } from "../../store/settings-store";
import { useColorScheme } from "nativewind";

const CompletedItems = () => {
  const { removeItem, togglePurchased, items } = useGroceryStore();
  const { hideCompleted } = useSettingsStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const completedItems = items.filter((item) => item.purchased);

  if (hideCompleted || !completedItems.length) return null;

  return (
    <View className="mt-3 rounded-[28px] border p-5" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(241,245,249,0.5)", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9" }}>
      <Text style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>
        Completed
      </Text>

      {completedItems.map((item) => (
        <View
          key={item.id}
          className="mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3 shadow-sm"
          style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderColor: isDark ? "#334155" : "rgba(255,255,255,0.5)", shadowColor: isDark ? "transparent" : "rgba(226,232,240,0.4)" }}
        >
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => togglePurchased(item.id)}
              className="h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? "#334155" : "#e2e8f0" }}
            >
              <FontAwesome6 name="rotate-left" size={10} color={isDark ? "#94a3b8" : "#64748b"} />
            </TouchableOpacity>
            <Text style={{ fontSize: 15, fontWeight: "500", color: isDark ? "#64748b" : "#94a3b8", textDecorationLine: "line-through" }}>
              {item.name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => removeItem(item.id)}
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "#fef2f2" }}
          >
            <FontAwesome6 name="trash" size={12} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};
export default CompletedItems;
