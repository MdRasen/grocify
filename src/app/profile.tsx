import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { type Href, Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();

  if (!isAuthLoaded || !isUserLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notSignedInContainer}>
          <Text style={styles.notSignedInTitle}>Session Expired</Text>
          <Text style={styles.notSignedInSubtitle}>
            Please sign in to access your profile settings.
          </Text>
          <Link href={"/sign-in" as Href} asChild>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Go to Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ProfileContent
      user={user}
      key={`${user.id}-${user.updatedAt?.getTime() ?? 0}`}
    />
  );
}

function ProfileContent({
  user,
}: {
  user: NonNullable<ReturnType<typeof useUser>["user"]>;
}) {
  const { signOut } = useAuth();
  const router = useRouter();

  // Personal info state
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSuccessMessage, setNameSuccessMessage] = useState<string | null>(
    null
  );
  const [nameErrorMessage, setNameErrorMessage] = useState<string | null>(null);

  // Profile image state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageSuccessMessage, setImageSuccessMessage] = useState<string | null>(
    null
  );
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(
    null
  );

  // Password reset/update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<
    string | null
  >(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<
    string | null
  >(null);

  // Sign out state
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Handle Photo Selection & Upload
  const handlePickImage = async () => {
    setImageSuccessMessage(null);
    setImageErrorMessage(null);

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setImageErrorMessage(
          "Permission to access your photos is required to change your profile picture."
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]?.base64) {
        return;
      }

      setIsUploadingImage(true);
      const asset = pickerResult.assets[0];
      const mimeType = asset.mimeType || "image/jpeg";
      const base64Data = `data:${mimeType};base64,${asset.base64}`;

      await user.setProfileImage({
        file: base64Data,
      });

      await user.reload();
      setImageSuccessMessage("Profile photo updated successfully!");
    } catch (err: unknown) {
      console.error("Error setting profile image:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to update profile image. Please try again.";
      setImageErrorMessage(msg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle Photo Removal
  const handleRemoveImage = async () => {
    setImageSuccessMessage(null);
    setImageErrorMessage(null);

    try {
      setIsUploadingImage(true);
      await user.setProfileImage({ file: null });
      await user.reload();
      setImageSuccessMessage("Profile photo removed.");
    } catch (err: unknown) {
      console.error("Error removing profile image:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to remove profile image.";
      setImageErrorMessage(msg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle First & Last Name Update
  const handleUpdateName = async () => {
    setNameSuccessMessage(null);
    setNameErrorMessage(null);

    if (!firstName.trim() && !lastName.trim()) {
      setNameErrorMessage("Please enter at least a first or last name.");
      return;
    }

    try {
      setIsSavingName(true);
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      await user.reload();
      setNameSuccessMessage("Your name was updated successfully!");
    } catch (err: unknown) {
      console.error("Error updating name:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to update name. Please check your connection.";
      setNameErrorMessage(msg);
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle Password Reset / Update
  const handleUpdatePassword = async () => {
    setPasswordSuccessMessage(null);
    setPasswordErrorMessage(null);

    if (user.passwordEnabled && !currentPassword) {
      setPasswordErrorMessage("Current password is required.");
      return;
    }

    if (!newPassword) {
      setPasswordErrorMessage("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordErrorMessage(
        "New password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMessage("New passwords do not match.");
      return;
    }

    try {
      setIsUpdatingPassword(true);

      if (user.passwordEnabled) {
        await user.updatePassword({
          currentPassword,
          newPassword,
          signOutOfOtherSessions: false,
        });
      } else {
        // Set initial password for OAuth user
        await user.updatePassword({
          newPassword,
        });
      }

      await user.reload();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccessMessage(
        user.passwordEnabled
          ? "Password changed successfully!"
          : "Password created successfully! You can now log in using email & password."
      );
    } catch (err: unknown) {
      console.error("Error updating password:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to update password. Please check your credentials.";
      setPasswordErrorMessage(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.replace("/");
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const primaryEmail =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    "";
  const userInitials =
    ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() ||
    primaryEmail.charAt(0).toUpperCase() ||
    "U";

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Bar */}
          <View style={styles.topBar}>
            <Link href={"/" as Href} asChild>
              <Pressable style={styles.backButton} hitSlop={8}>
                <Ionicons name="arrow-back" size={18} color="#16a34a" />
                <Text style={styles.backButtonText}>Home</Text>
              </Pressable>
            </Link>
            <Text style={styles.pageTitle}>Profile & Settings</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* 1. Profile Picture Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile Picture</Text>
            <Text style={styles.cardSubtitle}>
              Update your photo across your Grocify account
            </Text>

            {imageSuccessMessage && (
              <View style={styles.bannerSuccess}>
                <Text style={styles.bannerSuccessText}>
                  {imageSuccessMessage}
                </Text>
              </View>
            )}

            {imageErrorMessage && (
              <View style={styles.bannerError}>
                <Text style={styles.bannerErrorText}>{imageErrorMessage}</Text>
              </View>
            )}

            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                {user.imageUrl ? (
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

                {isUploadingImage && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator color="#ffffff" size="small" />
                  </View>
                )}
              </View>

              <View style={styles.avatarActions}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    isUploadingImage && styles.buttonDisabled,
                  ]}
                  onPress={handlePickImage}
                  disabled={isUploadingImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera-outline" size={18} color="#374151" />
                  <Text style={styles.secondaryButtonText}>
                    {isUploadingImage ? "Uploading..." : "Change Photo"}
                  </Text>
                </TouchableOpacity>

                {user.hasImage && (
                  <TouchableOpacity
                    style={[
                      styles.textDangerButton,
                      isUploadingImage && styles.buttonDisabled,
                    ]}
                    onPress={handleRemoveImage}
                    disabled={isUploadingImage}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.textDangerButtonLabel}>Remove photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* 2. Personal Information Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <Text style={styles.cardSubtitle}>
              Update your first and last name
            </Text>

            {nameSuccessMessage && (
              <View style={styles.bannerSuccess}>
                <Text style={styles.bannerSuccessText}>{nameSuccessMessage}</Text>
              </View>
            )}

            {nameErrorMessage && (
              <View style={styles.bannerError}>
                <Text style={styles.bannerErrorText}>{nameErrorMessage}</Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor="#9ca3af"
                value={firstName}
                onChangeText={(t) => {
                  setFirstName(t);
                  setNameSuccessMessage(null);
                  setNameErrorMessage(null);
                }}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                placeholderTextColor="#9ca3af"
                value={lastName}
                onChangeText={(t) => {
                  setLastName(t);
                  setNameSuccessMessage(null);
                  setNameErrorMessage(null);
                }}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isSavingName && styles.buttonDisabled,
              ]}
              onPress={handleUpdateName}
              disabled={isSavingName}
              activeOpacity={0.8}
            >
              {isSavingName ? (
                <View style={styles.buttonLoadingContent}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.primaryButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Save Name Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Password Reset / Change Options Card */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>Password & Security</Text>
              <View
                style={[
                  styles.badge,
                  user.passwordEnabled ? styles.badgeSuccess : styles.badgeInfo,
                ]}
              >
                <Text
                  style={
                    user.passwordEnabled
                      ? styles.badgeSuccessText
                      : styles.badgeInfoText
                  }
                >
                  {user.passwordEnabled ? "Password Set" : "OAuth Only"}
                </Text>
              </View>
            </View>

            <Text style={styles.cardSubtitle}>
              {user.passwordEnabled
                ? "Update your existing account password"
                : "Add a password to your account so you can also log in with email"}
            </Text>

            {passwordSuccessMessage && (
              <View style={styles.bannerSuccess}>
                <Text style={styles.bannerSuccessText}>
                  {passwordSuccessMessage}
                </Text>
              </View>
            )}

            {passwordErrorMessage && (
              <View style={styles.bannerError}>
                <Text style={styles.bannerErrorText}>
                  {passwordErrorMessage}
                </Text>
              </View>
            )}

            {/* Current Password - Only if password is enabled */}
            {user.passwordEnabled && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter current password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={(t) => {
                      setCurrentPassword(t);
                      setPasswordSuccessMessage(null);
                      setPasswordErrorMessage(null);
                    }}
                  />
                  <Pressable
                    onPress={() => setShowCurrentPassword((prev) => !prev)}
                    style={styles.showPasswordButton}
                    hitSlop={8}
                  >
                    <Text style={styles.showPasswordText}>
                      {showCurrentPassword ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* New Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {user.passwordEnabled ? "New Password" : "Create Password"}
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={(t) => {
                    setNewPassword(t);
                    setPasswordSuccessMessage(null);
                    setPasswordErrorMessage(null);
                  }}
                />
                <Pressable
                  onPress={() => setShowNewPassword((prev) => !prev)}
                  style={styles.showPasswordButton}
                  hitSlop={8}
                >
                  <Text style={styles.showPasswordText}>
                    {showNewPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showNewPassword}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setPasswordSuccessMessage(null);
                  setPasswordErrorMessage(null);
                }}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isUpdatingPassword && styles.buttonDisabled,
              ]}
              onPress={handleUpdatePassword}
              disabled={isUpdatingPassword}
              activeOpacity={0.8}
            >
              {isUpdatingPassword ? (
                <View style={styles.buttonLoadingContent}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.primaryButtonText}>
                    Updating Password...
                  </Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>
                  {user.passwordEnabled
                    ? "Update Password"
                    : "Set Account Password"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 4. Account Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Details</Text>

            <View style={styles.accountRow}>
              <View style={styles.accountRowLeft}>
                <Ionicons name="mail-outline" size={20} color="#6b7280" />
                <View>
                  <Text style={styles.accountLabel}>Email Address</Text>
                  <Text style={styles.accountValue}>{primaryEmail}</Text>
                </View>
              </View>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>Verified</Text>
              </View>
            </View>

            {/* External OAuth Connections */}
            {user.externalAccounts && user.externalAccounts.length > 0 && (
              <View style={styles.externalAccountsContainer}>
                <Text style={styles.accountLabel}>Connected Social Logins</Text>
                <View style={styles.providersRow}>
                  {user.externalAccounts.map((account) => {
                    const providerName =
                      account.provider === "google"
                        ? "Google"
                        : account.provider === "github"
                        ? "GitHub"
                        : account.provider === "facebook"
                        ? "Facebook"
                        : account.provider;

                    const iconName =
                      account.provider === "google"
                        ? "logo-google"
                        : account.provider === "github"
                        ? "logo-github"
                        : "logo-facebook";

                    const iconColor =
                      account.provider === "google"
                        ? "#ea4335"
                        : account.provider === "github"
                        ? "#24292f"
                        : "#1877f2";

                    return (
                      <View key={account.id} style={styles.providerBadge}>
                        <Ionicons
                          name={iconName as any}
                          size={14}
                          color={iconColor}
                        />
                        <Text style={styles.providerBadgeText}>
                          {providerName}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.accountFooter}>
              <Text style={styles.userIdText}>User ID: {user.id}</Text>
            </View>
          </View>

          {/* 5. Sign Out Button */}
          <TouchableOpacity
            style={[styles.signOutButton, isSigningOut && styles.buttonDisabled]}
            onPress={handleSignOut}
            disabled={isSigningOut}
            activeOpacity={0.8}
          >
            {isSigningOut ? (
              <ActivityIndicator color="#dc2626" size="small" />
            ) : (
              <View style={styles.buttonLoadingContent}>
                <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                <Text style={styles.signOutButtonText}>Sign Out of Grocify</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 18,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  notSignedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  notSignedInTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  notSignedInSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#ecfdf5",
    borderRadius: 16,
  },
  backButtonText: {
    color: "#16a34a",
    fontSize: 14,
    fontWeight: "700",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: -4,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 4,
  },
  avatarWrapper: {
    position: "relative",
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
    backgroundColor: "#dcfce7",
    borderWidth: 2.5,
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
    fontSize: 28,
    fontWeight: "800",
    color: "#16a34a",
  },
  avatarLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActions: {
    flex: 1,
    gap: 8,
    justifyContent: "center",
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  passwordContainer: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 64,
  },
  showPasswordButton: {
    position: "absolute",
    right: 14,
    paddingVertical: 4,
  },
  showPasswordText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16a34a",
  },
  primaryButton: {
    backgroundColor: "#16a34a",
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    width: "100%",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  textDangerButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  textDangerButtonLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#dc2626",
  },
  bannerSuccess: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  bannerSuccessText: {
    color: "#047857",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  bannerError: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  bannerErrorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccessText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16a34a",
  },
  badgeInfo: {
    backgroundColor: "#eff6ff",
  },
  badgeInfoText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  accountRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  accountValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    marginTop: 2,
  },
  externalAccountsContainer: {
    gap: 8,
    paddingVertical: 6,
  },
  providersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  providerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  providerBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  accountFooter: {
    marginTop: 4,
  },
  userIdText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  signOutButton: {
    backgroundColor: "#fee2e2",
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  signOutButtonText: {
    color: "#dc2626",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonLoadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
