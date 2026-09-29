import { useAuth, useUser } from "@clerk/expo";
import { type Href, Link } from "expo-router";
import React, { useState } from "react";
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
            <Text style={styles.subtitle}>Welcome to Grocify</Text>
          </View>

          <View style={styles.buttonGroup}>
            <Link href={"/sign-in" as Href} asChild>
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>Log In</Text>
              </TouchableOpacity>
            </Link>

            <Link href={"/sign-up" as Href} asChild>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
                <Text style={styles.secondaryButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Signed in: Clean user state & Sign Out
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Signed In User";

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

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Signed in as</Text>
          <Text style={styles.userEmail}>{primaryEmail}</Text>
          {user?.id && <Text style={styles.userId}>ID: {user.id}</Text>}
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
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
