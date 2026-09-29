import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { type Href, Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!isLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsSigningOut(false);
    }
  };

  // 1. Not signed in: Clean welcome screen with Log In and Sign Up buttons
  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.brandEmoji}>🛒</Text>
            </View>
            <Text style={styles.brandTitle}>Grocify</Text>
            <Text style={styles.subtitle}>Fresh Groceries Delivered Fast</Text>
          </View>

          <View style={styles.buttonGroup}>
            <Link href={"/sign-in" as Href} asChild>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Log In</Text>
              </TouchableOpacity>
            </Link>

            <Link href={"/sign-up" as Href} asChild>
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Signed in: Clean user state & Profile navigation
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Signed In User";

  const displayName =
    user?.fullName || user?.firstName || primaryEmail.split("@")[0] || "Shopper";

  const userInitials =
    ((user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")).toUpperCase() ||
    primaryEmail.charAt(0).toUpperCase() ||
    "U";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.brandEmoji}>🛒</Text>
          </View>
          <Text style={styles.brandTitle}>Grocify</Text>
          <Text style={styles.statusBadge}>Active Account</Text>
        </View>

        {/* User Greeting & Avatar Card */}
        <View style={styles.card}>
          <View style={styles.userHeader}>
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
            <View style={styles.userInfo}>
              <Text style={styles.greetingText}>Welcome back,</Text>
              <Text style={styles.userNameText} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {primaryEmail}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <Link href={"/profile" as Href} asChild>
            <TouchableOpacity style={styles.profileNavButton} activeOpacity={0.8}>
              <View style={styles.profileNavLeft}>
                <Ionicons name="person-circle-outline" size={22} color="#16a34a" />
                <Text style={styles.profileNavText}>My Profile & Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </Link>
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, isSigningOut && styles.buttonDisabled]}
          onPress={handleSignOut}
          disabled={isSigningOut}
          activeOpacity={0.8}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#dc2626" size="small" />
          ) : (
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  brandEmoji: {
    fontSize: 36,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginTop: 6,
  },
  statusBadge: {
    fontSize: 13,
    color: "#15803d",
    fontWeight: "600",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  buttonGroup: {
    gap: 14,
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#16a34a",
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#dcfce7",
    borderWidth: 2,
    borderColor: "#16a34a",
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
    color: "#16a34a",
  },
  userInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  userNameText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  userEmail: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  profileNavButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  profileNavLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileNavText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  cardLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: "#fee2e2",
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  signOutButtonText: {
    color: "#dc2626",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
