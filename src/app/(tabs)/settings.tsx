import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { type Href, Link } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Grocery list preferences states
  const [autoSort, setAutoSort] = useState(true);
  const [keepScreenAwake, setKeepScreenAwake] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState(true);

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
        { text: "Clear Items", style: "destructive", onPress: () => {} },
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Manage your account and grocery preferences
          </Text>
        </View>

        {/* Profile Hero Card */}
        <Link href={"/profile" as Href} asChild>
          <TouchableOpacity style={styles.profileHeroCard} activeOpacity={0.85}>
            <View style={styles.avatarWrapper}>
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{userInitials}</Text>
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#059669" />
                </View>
              </View>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {primaryEmail}
              </Text>
              <View style={styles.editProfilePill}>
                <Text style={styles.editProfileText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={13} color="#059669" />
              </View>
            </View>

            <View style={styles.profileChevron}>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        </Link>

        {/* Section 1: Shopping & List Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Shopping List Preferences</Text>

          <View style={styles.cardGroup}>
            <View style={styles.menuRow}>
              <View style={[styles.iconSquircle, { backgroundColor: "#ecfdf5" }]}>
                <Ionicons name="layers-outline" size={20} color="#059669" />
              </View>
              <View style={styles.menuRowTexts}>
                <Text style={styles.menuTitle}>Auto-sort by Aisle</Text>
                <Text style={styles.menuSubtitle}>
                  Organize by Produce, Dairy, Bakery, Pantry
                </Text>
              </View>
              <Switch
                value={autoSort}
                onValueChange={setAutoSort}
                trackColor={{ false: "#e2e8f0", true: "#a7f3d0" }}
                thumbColor={autoSort ? "#059669" : "#ffffff"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.menuRow}>
              <View style={[styles.iconSquircle, { backgroundColor: "#fef3c7" }]}>
                <Ionicons name="sunny-outline" size={20} color="#d97706" />
              </View>
              <View style={styles.menuRowTexts}>
                <Text style={styles.menuTitle}>Keep Screen Awake</Text>
                <Text style={styles.menuSubtitle}>
                  Keep display active while shopping in store
                </Text>
              </View>
              <Switch
                value={keepScreenAwake}
                onValueChange={setKeepScreenAwake}
                trackColor={{ false: "#e2e8f0", true: "#a7f3d0" }}
                thumbColor={keepScreenAwake ? "#059669" : "#ffffff"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.menuRow}>
              <View style={[styles.iconSquircle, { backgroundColor: "#e0e7ff" }]}>
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={20}
                  color="#4f46e5"
                />
              </View>
              <View style={styles.menuRowTexts}>
                <Text style={styles.menuTitle}>Hide Completed Items</Text>
                <Text style={styles.menuSubtitle}>
                  Move bought items to bottom or hide them
                </Text>
              </View>
              <Switch
                value={hideCompleted}
                onValueChange={setHideCompleted}
                trackColor={{ false: "#e2e8f0", true: "#a7f3d0" }}
                thumbColor={hideCompleted ? "#059669" : "#ffffff"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.menuRow}>
              <View style={[styles.iconSquircle, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="sparkles-outline" size={20} color="#0284c7" />
              </View>
              <View style={styles.menuRowTexts}>
                <Text style={styles.menuTitle}>Smart Grocery Suggestions</Text>
                <Text style={styles.menuSubtitle}>
                  Suggest frequently purchased essentials
                </Text>
              </View>
              <Switch
                value={smartSuggestions}
                onValueChange={setSmartSuggestions}
                trackColor={{ false: "#e2e8f0", true: "#a7f3d0" }}
                thumbColor={smartSuggestions ? "#059669" : "#ffffff"}
              />
            </View>
          </View>
        </View>

        {/* Section 2: List Management & Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>List Management</Text>

          <View style={styles.cardGroup}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleShareList}
              activeOpacity={0.7}
            >
              <View style={[styles.iconSquircle, { backgroundColor: "#f0fdf4" }]}>
                <Ionicons name="share-social-outline" size={20} color="#059669" />
              </View>
              <View style={styles.menuRowTexts}>
                <Text style={styles.menuTitle}>Share Grocery List</Text>
                <Text style={styles.menuSubtitle}>
                  Send your list to family, partners, or roommates
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleClearCompleted}
              activeOpacity={0.7}
            >
              <View style={[styles.iconSquircle, { backgroundColor: "#fef2f2" }]}>
                <Ionicons name="trash-outline" size={20} color="#dc2626" />
              </View>
              <View style={styles.menuRowTexts}>
                <Text style={[styles.menuTitle, { color: "#dc2626" }]}>
                  Clear Completed Items
                </Text>
                <Text style={styles.menuSubtitle}>
                  Remove all checked-off items from the list
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: App & Account */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account & Security</Text>

          <View style={styles.cardGroup}>
            <Link href={"/profile" as Href} asChild>
              <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
                <View style={[styles.iconSquircle, { backgroundColor: "#f1f5f9" }]}>
                  <Ionicons name="key-outline" size={20} color="#334155" />
                </View>
                <View style={styles.menuRowTexts}>
                  <Text style={styles.menuTitle}>Password & Security</Text>
                  <Text style={styles.menuSubtitle}>
                    Manage login credentials & security
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutBtn, isSigningOut && styles.buttonDisabled]}
          onPress={handleSignOut}
          disabled={isSigningOut}
          activeOpacity={0.8}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#dc2626" size="small" />
          ) : (
            <View style={styles.signOutBtnContent}>
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* App Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Grocify • Smart Grocery List</Text>
          <Text style={styles.versionSubtext}>Version 1.0.0 (Build 42)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 20,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  profileHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#dcfce7",
    borderWidth: 2.5,
    borderColor: "#10b981",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: "800",
    color: "#059669",
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  verifiedBadge: {
    marginTop: 1,
  },
  profileEmail: {
    fontSize: 13,
    color: "#64748b",
  },
  editProfilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 4,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  profileChevron: {
    paddingLeft: 4,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  iconSquircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuRowTexts: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginLeft: 68,
  },
  signOutBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fee2e2",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  signOutBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signOutBtnText: {
    color: "#dc2626",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  versionContainer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
    gap: 2,
  },
  versionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  versionSubtext: {
    fontSize: 12,
    color: "#94a3b8",
  },
});
