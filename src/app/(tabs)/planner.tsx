import { GroceryCategory, GroceryPriority, useGroceryStore } from "@/store/grocery-store";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, Text, TextInput, View, Modal } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import TabScreenBackground from "../../components/TabScreenBackground";

const CATEGORIES: GroceryCategory[] = ["Produce", "Dairy", "Bakery", "Pantry", "Snacks"];
const PRIORITIES: GroceryPriority[] = ["low", "medium", "high"];

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { items, addItem } = useGroceryStore();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState<GroceryCategory>("Produce");
  const [priority, setPriority] = useState<GroceryPriority>("medium");
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [addedItemName, setAddedItemName] = useState("");

  const pendingCount = items.filter((item) => !item.purchased).length;
  const highPriorityCount = items.filter((item) => !item.purchased && item.priority === "high").length;
  const totalUnits = items.filter((item) => !item.purchased).reduce((acc, item) => acc + item.quantity, 0);

  const handleAdd = () => {
    if (!name.trim()) return;
    const addedName = name.trim();
    addItem({
      name: addedName,
      quantity: parseInt(quantity) || 1,
      category,
      priority,
    });
    setAddedItemName(addedName);
    setSuccessModalVisible(true);
    
    setName("");
    setQuantity("1");
  };

  return (
    <View className="flex-1 bg-background">
      <TabScreenBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 20,
            paddingTop: insets.top + 20,
            paddingBottom: 40,
          }}
        >
          {/* Top Hero Card */}
          <Animated.View entering={FadeInDown.springify()}>
            <View
              className="rounded-[32px] border border-border/50 bg-card p-6 shadow-sm shadow-slate-200/50"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-muted-foreground">
                    Grocery Planner
                  </Text>
                  <Text className="mt-2 text-3xl font-extrabold text-foreground leading-9">
                    Plan smarter, shop calmer.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleAdd}
                  style={{ marginTop: 4, height: 48, width: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#10b981', shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}
                >
                  <Ionicons name="color-wand" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <Text className="mt-4 text-sm font-medium text-muted-foreground">
                Organize your next grocery run with categories, quantities, and priority in one place.
              </Text>

              {/* Stat Boxes */}
              <View className="mt-6 flex-row gap-2">
                <View className="flex-1 rounded-2xl border p-3" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9" }}>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Pending
                  </Text>
                  <Text className="mt-1 text-2xl font-extrabold text-foreground">
                    {pendingCount}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl border p-3" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9" }}>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    High Priority
                  </Text>
                  <Text className="mt-1 text-2xl font-extrabold text-foreground">
                    {highPriorityCount}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl border p-3" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9" }}>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Units
                  </Text>
                  <Text className="mt-1 text-2xl font-extrabold text-foreground">
                    {totalUnits}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Grocery Banner Image */}
          <Animated.View entering={FadeIn.delay(200)}>
              <Image
                source={require("../../../assets/images/grocery-banner.jpg")}
                style={{ marginTop: 16, height: 200, width: "100%", borderRadius: 32, backgroundColor: "#e2e8f0", resizeMode: "cover" }}
              />
          </Animated.View>

          {/* Build Your List Section */}
          <Animated.View entering={FadeInUp.delay(300).springify()}>
            <View className="mt-8 px-2">
              <Text className="text-sm font-bold uppercase tracking-[1.5px] text-muted-foreground">
                Build Your List
              </Text>
              <Text style={{ marginTop: 4, fontSize: 14, fontWeight: "500", color: isDark ? "#94a3b8" : "#64748b" }}>
                Add items with the right quantity, category, and urgency.
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).springify()}>
            <View
              className="mt-4 rounded-[32px] border border-border/50 bg-card p-6 shadow-sm shadow-slate-200/50"
            >
              {/* Item Name */}
              <View>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#f8fafc" : "#1e293b" }}>Item name</Text>
                <View className="mt-2 flex-row items-center rounded-2xl border border-border bg-secondary px-4 h-14">
                  <Ionicons name="bag-handle" size={18} color={isDark ? "#94a3b8" : "#64748b"} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ex: Blueberries"
                    placeholderTextColor="#94a3b8"
                    style={{ marginLeft: 12, flex: 1, fontSize: 16, fontWeight: "500", color: isDark ? "#f8fafc" : "#1e293b" }}
                  />
                </View>
              </View>

              {/* Quantity */}
              <View className="mt-5">
                <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#f8fafc" : "#1e293b" }}>Quantity</Text>
                <View className="mt-2 flex-row items-center rounded-2xl border border-border bg-secondary px-4 h-14">
                  <Ionicons name="grid" size={18} color={isDark ? "#94a3b8" : "#64748b"} />
                  <TextInput
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="1"
                    keyboardType="numeric"
                    placeholderTextColor="#94a3b8"
                    style={{ marginLeft: 12, flex: 1, fontSize: 16, fontWeight: "500", color: isDark ? "#f8fafc" : "#1e293b" }}
                  />
                </View>
              </View>

              {/* Category */}
              <View className="mt-5">
                <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#f8fafc" : "#1e293b" }}>Category</Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[{ flexDirection: 'row', alignItems: 'center', borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8 }, isSelected ? { backgroundColor: '#10b981', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } : { backgroundColor: isDark ? '#334155' : 'rgba(241, 245, 249, 0.5)' }]}
                      >
                        <Ionicons
                          name={
                            cat === "Produce" ? "leaf" :
                              cat === "Dairy" ? "water" :
                                cat === "Bakery" ? "restaurant" :
                                  cat === "Pantry" ? "cube" : "pizza"
                          }
                          size={14}
                          color={isSelected ? "#ffffff" : isDark ? "#94a3b8" : "#047857"}
                        />
                        <Text
                          className={`ml-2 text-[13px] font-bold ${isSelected ? "text-white" : "text-muted-foreground"
                            }`}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Priority */}
              <View className="mt-5">
                <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#f8fafc" : "#1e293b" }}>Priority</Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {PRIORITIES.map((pri) => {
                    const isSelected = priority === pri;
                    
                    let bgStyle = {};
                    if (isSelected) {
                      bgStyle = pri === "low" ? { backgroundColor: "#475569" } : pri === "medium" ? { backgroundColor: "#f59e0b" } : { backgroundColor: "#ef4444" };
                    } else {
                      bgStyle = pri === "low" ? { backgroundColor: isDark ? "#334155" : "#f1f5f9" } : pri === "medium" ? { backgroundColor: isDark ? "#451a03" : "#fef3c7" } : { backgroundColor: isDark ? "#450a0a" : "#fee2e2" };
                    }

                    const textClass = pri === "low" ? "text-slate-500 dark:text-slate-300" : pri === "medium" ? "text-amber-700 dark:text-amber-400" : "text-red-600 dark:text-red-400";

                    return (
                      <TouchableOpacity
                        key={pri}
                        onPress={() => setPriority(pri)}
                        style={[{ flexDirection: 'row', alignItems: 'center', borderRadius: 9999, paddingHorizontal: 20, paddingVertical: 8 }, bgStyle]}
                      >
                        <Text
                          className={`text-[13px] font-bold capitalize ${isSelected ? "text-white" : textClass
                            }`}
                        >
                          {pri}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Add Button */}
              <TouchableOpacity
                onPress={handleAdd}
                style={[{ marginTop: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, height: 56 }, name.trim() ? { backgroundColor: isDark ? "#10b981" : "#0f172a" } : { backgroundColor: isDark ? "#334155" : "#cbd5e1" }]}
              >
                <Ionicons name="add-circle" size={20} color={name.trim() ? "#ffffff" : isDark ? "#64748b" : "#94a3b8"} />
                <Text className={`ml-2 text-base font-bold ${name.trim() ? "text-white" : isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Add to Grocery List
                </Text>
              </TouchableOpacity>

            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Premium Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Animated.View entering={FadeInUp.springify()} style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderRadius: 32, padding: 32, alignItems: "center", width: "100%", maxWidth: 340, shadowColor: "#0f172a", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
            <View style={{ height: 64, width: 64, borderRadius: 32, backgroundColor: isDark ? "#064e3b" : "#d1fae5", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <Ionicons name="checkmark" size={32} color="#10b981" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: isDark ? "#f8fafc" : "#1e293b", marginBottom: 8 }}>Success!</Text>
            <Text style={{ fontSize: 15, fontWeight: "500", color: isDark ? "#94a3b8" : "#64748b", textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
              <Text style={{ color: isDark ? "#ffffff" : "#0f172a", fontWeight: "700" }}>{addedItemName}</Text> has been added to your grocery list.
            </Text>
            <TouchableOpacity
              onPress={() => setSuccessModalVisible(false)}
              style={{ backgroundColor: "#10b981", width: "100%", height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>Awesome</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );

}
