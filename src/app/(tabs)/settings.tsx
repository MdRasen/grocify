import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { type Href, Link } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettingsStore } from "../../store/settings-store";
import { useGroceryStore } from "../../store/grocery-store";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { clearPurchased } = useGroceryStore();

  const {
    keepScreenAwake,
    setKeepScreenAwake,
    hideCompleted,
    setHideCompleted,
    isDarkMode,
    setIsDarkMode,
  } = useSettingsStore();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of Grocify?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            setIsSigningOut(true);
            await signOut();
          } catch (err) {
            console.error("Sign out error:", err);
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleClearCompleted = () => {
    Alert.alert(
      "Clear Completed Items",
      "Are you sure you want to remove all checked items from your grocery list?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear Items", 
          style: "destructive", 
          onPress: () => {
            clearPurchased();
          } 
        },
      ]
    );
  };

  const handleShareList = () => {
    Alert.alert(
      "Share Grocery List",
      "Sharing functionality will generate a link to share your grocery list with family or roommates.",
      [{ text: "OK" }]
    );
  };

  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Signed In User";

  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    primaryEmail.split("@")[0] ||
    "Shopper";

  const userInitials =
    ((user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")).toUpperCase() ||
    primaryEmail.charAt(0).toUpperCase() ||
    "U";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View className="mb-1">
          <Text className="text-3xl font-extrabold text-foreground tracking-tight">Settings</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            Manage your account and grocery preferences
          </Text>
        </View>

        {/* Profile Hero Card */}
        <Link href={"/profile" as Href} asChild>
          <TouchableOpacity className="flex-row items-center bg-card rounded-3xl p-5 border border-border shadow-sm gap-4" activeOpacity={0.85}>
            <View className="w-16 h-16 rounded-full overflow-hidden bg-accent border-[2.5px] border-primary items-center justify-center">
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <Text className="text-2xl font-extrabold text-primary">{userInitials}</Text>
              )}
            </View>

            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[17px] font-bold text-card-foreground" numberOfLines={1}>
                  {displayName}
                </Text>
                <Ionicons name="checkmark-circle" size={13} color="#10b981" />
              </View>
              <Text className="text-[13px] text-muted-foreground" numberOfLines={1}>
                {primaryEmail}
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Text className="text-xs font-bold text-primary">Edit Profile</Text>
                <Ionicons name="chevron-forward" size={13} color="#10b981" />
              </View>
            </View>

            <View className="pl-1">
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        </Link>

        {/* Section 1: Shopping & List Preferences */}
        <View className="gap-2">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Shopping List Preferences</Text>

          <View className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <View className="flex-row items-center py-3.5 px-4 gap-3.5">
              <View className="w-10 h-10 rounded-xl bg-amber-100 items-center justify-center">
                <Ionicons name="sunny" size={20} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-card-foreground">Keep Screen Awake</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">Keep display active in store</Text>
              </View>
              <Switch
                value={keepScreenAwake}
                onValueChange={setKeepScreenAwake}
                trackColor={{ false: "#e2e8f0", true: "#a7f3d0" }}
                thumbColor={keepScreenAwake ? "#10b981" : "#ffffff"}
              />
            </View>

            <View className="h-[1px] bg-secondary ml-[68px]" />

            <View className="flex-row items-center py-3.5 px-4 gap-3.5">
              <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center">
                <Ionicons name="checkmark-done-circle" size={20} color="#4f46e5" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-card-foreground">Hide Completed Items</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">Don't show checked items</Text>
              </View>
              <Switch
                value={hideCompleted}
                onValueChange={setHideCompleted}
                trackColor={{ false: "#e2e8f0", true: "#a7f3d0" }}
                thumbColor={hideCompleted ? "#10b981" : "#ffffff"}
              />
            </View>

            <View className="h-[1px] bg-secondary ml-[68px]" />

            <View className="flex-row items-center py-3.5 px-4 gap-3.5">
              <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center">
                <Ionicons name="moon" size={20} color="#f8fafc" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-card-foreground">Dark Mode</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">Toggle dark appearance</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: "#e2e8f0", true: "#334155" }}
                thumbColor={isDarkMode ? "#0f172a" : "#ffffff"}
              />
            </View>
          </View>
        </View>

        {/* Section 2: List Management & Sharing */}
        <View className="gap-2">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">List Management</Text>

          <View className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <TouchableOpacity className="flex-row items-center py-3.5 px-4 gap-3.5" onPress={handleShareList} activeOpacity={0.7}>
              <View className="w-10 h-10 rounded-xl bg-green-50 items-center justify-center">
                <Ionicons name="share-social" size={20} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-card-foreground">Share Grocery List</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">Send list to family or roommates</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <View className="h-[1px] bg-secondary ml-[68px]" />

            <TouchableOpacity className="flex-row items-center py-3.5 px-4 gap-3.5" onPress={handleClearCompleted} activeOpacity={0.7}>
              <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
                <Ionicons name="trash" size={20} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-red-500">Clear Completed Items</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">Remove checked-off items permanently</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: App & Account */}
        <View className="gap-2">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Account & Security</Text>

          <View className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <Link href={"/profile" as Href} asChild>
              <TouchableOpacity className="flex-row items-center py-3.5 px-4 gap-3.5" activeOpacity={0.7}>
                <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
                  <Ionicons name="key" size={20} color="#334155" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-card-foreground">Password & Security</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">Manage login credentials</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          className={`bg-red-50 border border-red-100 h-14 rounded-2xl items-center justify-center mt-2 ${isSigningOut ? 'opacity-60' : ''}`}
          onPress={handleSignOut}
          disabled={isSigningOut}
          activeOpacity={0.8}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#ef4444" size="small" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="text-red-500 text-[15px] font-bold">Sign Out</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* App Version Info */}
        <View className="items-center pt-2 pb-4 gap-0.5">
          <Text className="text-[13px] font-bold text-muted-foreground">Grocify • Smart Grocery List</Text>
          <Text className="text-xs text-slate-400">Version 1.0.0 (Build 42)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
