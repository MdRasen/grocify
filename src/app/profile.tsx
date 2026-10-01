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
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notSignedInContainer}>
          <View style={styles.warningIconCircle}>
            <Ionicons name="lock-closed" size={32} color="#dc2626" />
          </View>
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      setNameSuccessMessage("Your profile name has been updated!");
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
          ? "Password updated successfully!"
          : "Password created successfully! You can now log in with email."
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
      router.replace("/sign-in");
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
  const displayName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    primaryEmail.split("@")[0] ||
    "Shopper";
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
        {/* Modern Top Header */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            hitSlop={12}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/settings");
              }
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#059669" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.pageTitle}>Edit Profile</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Profile Photo Section */}
          <View style={styles.heroCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarRing}>
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

              {/* Floating Camera Button */}
              <TouchableOpacity
                style={styles.cameraBadge}
                onPress={handlePickImage}
                disabled={isUploadingImage}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroName}>{displayName}</Text>
            <View style={styles.heroBadgeRow}>
              <View style={styles.statusPill}>
                <Ionicons name="checkmark-circle" size={13} color="#059669" />
                <Text style={styles.statusPillText}>Active Account</Text>
              </View>
            </View>

            {user.hasImage && (
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={handleRemoveImage}
                disabled={isUploadingImage}
              >
                <Text style={styles.removePhotoText}>Remove photo</Text>
              </TouchableOpacity>
            )}

            {imageSuccessMessage && (
              <View style={styles.bannerSuccess}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#047857" />
                <Text style={styles.bannerSuccessText}>{imageSuccessMessage}</Text>
              </View>
            )}

            {imageErrorMessage && (
              <View style={styles.bannerError}>
                <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
                <Text style={styles.bannerErrorText}>{imageErrorMessage}</Text>
              </View>
            )}
          </View>

          {/* 1. Personal Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconSquircle, { backgroundColor: "#ecfdf5" }]}>
                <Ionicons name="person-outline" size={20} color="#059669" />
              </View>
              <View style={styles.cardHeaderTexts}>
                <Text style={styles.cardTitle}>Personal Information</Text>
                <Text style={styles.cardSubtitle}>Your public display name</Text>
              </View>
            </View>

            {nameSuccessMessage && (
              <View style={styles.bannerSuccess}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#047857" />
                <Text style={styles.bannerSuccessText}>{nameSuccessMessage}</Text>
              </View>
            )}

            {nameErrorMessage && (
              <View style={styles.bannerError}>
                <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
                <Text style={styles.bannerErrorText}>{nameErrorMessage}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.textInputField}
                  placeholder="Enter first name"
                  placeholderTextColor="#94a3b8"
                  value={firstName}
                  onChangeText={(t) => {
                    setFirstName(t);
                    setNameSuccessMessage(null);
                    setNameErrorMessage(null);
                  }}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.textInputField}
                  placeholder="Enter last name"
                  placeholderTextColor="#94a3b8"
                  value={lastName}
                  onChangeText={(t) => {
                    setLastName(t);
                    setNameSuccessMessage(null);
                    setNameErrorMessage(null);
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isSavingName && styles.buttonDisabled]}
              onPress={handleUpdateName}
              disabled={isSavingName}
              activeOpacity={0.85}
            >
              {isSavingName ? (
                <View style={styles.buttonLoadingContent}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.primaryButtonText}>Saving Changes...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 2. Password & Security Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconSquircle, { backgroundColor: "#fef3c7" }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#d97706" />
              </View>
              <View style={styles.cardHeaderTexts}>
                <Text style={styles.cardTitle}>Password & Security</Text>
                <Text style={styles.cardSubtitle}>
                  {user.passwordEnabled
                    ? "Update your existing account password"
                    : "Create password for direct email sign-in"}
                </Text>
              </View>
              <View
                style={[
                  styles.badgePill,
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
                  {user.passwordEnabled ? "Active" : "OAuth"}
                </Text>
              </View>
            </View>

            {passwordSuccessMessage && (
              <View style={styles.bannerSuccess}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#047857" />
                <Text style={styles.bannerSuccessText}>{passwordSuccessMessage}</Text>
              </View>
            )}

            {passwordErrorMessage && (
              <View style={styles.bannerError}>
                <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
                <Text style={styles.bannerErrorText}>{passwordErrorMessage}</Text>
              </View>
            )}

            {user.passwordEnabled && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                  <TextInput
                    style={styles.textInputField}
                    placeholder="Enter current password"
                    placeholderTextColor="#94a3b8"
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
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748b"
                    />
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {user.passwordEnabled ? "New Password" : "Create Password"}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.textInputField}
                  placeholder="Min 8 characters"
                  placeholderTextColor="#94a3b8"
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
                  hitSlop={8}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748b"
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.textInputField}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    setPasswordSuccessMessage(null);
                    setPasswordErrorMessage(null);
                  }}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748b"
                  />
                </Pressable>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isUpdatingPassword && styles.buttonDisabled,
              ]}
              onPress={handleUpdatePassword}
              disabled={isUpdatingPassword}
              activeOpacity={0.85}
            >
              {isUpdatingPassword ? (
                <View style={styles.buttonLoadingContent}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.primaryButtonText}>Updating...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>
                  {user.passwordEnabled ? "Update Password" : "Set Password"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Account & Connected Logins Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconSquircle, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="finger-print-outline" size={20} color="#0284c7" />
              </View>
              <View style={styles.cardHeaderTexts}>
                <Text style={styles.cardTitle}>Account Details</Text>
                <Text style={styles.cardSubtitle}>Email & authentication</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <Ionicons name="mail-outline" size={18} color="#64748b" />
                <View>
                  <Text style={styles.infoRowLabel}>Email Address</Text>
                  <Text style={styles.infoRowValue}>{primaryEmail}</Text>
                </View>
              </View>
              <View style={styles.verifiedChip}>
                <Ionicons name="checkmark-circle" size={13} color="#059669" />
                <Text style={styles.verifiedChipText}>Verified</Text>
              </View>
            </View>

            {user.externalAccounts && user.externalAccounts.length > 0 && (
              <View style={styles.socialAccountsBox}>
                <Text style={styles.infoRowLabel}>Connected Social Logins</Text>
                <View style={styles.providersWrap}>
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
                        ? "#1e293b"
                        : "#1877f2";

                    return (
                      <View key={account.id} style={styles.providerChip}>
                        <Ionicons
                          name={iconName as any}
                          size={14}
                          color={iconColor}
                        />
                        <Text style={styles.providerChipText}>{providerName}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.idFooter}>
              <Text style={styles.idText}>User ID: {user.id}</Text>
            </View>
          </View>

          {/* 4. Sign Out Button */}
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
                <Text style={styles.signOutBtnText}>Sign Out of Grocify</Text>
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
    backgroundColor: "#f8fafc",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  notSignedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  warningIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  notSignedInTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  notSignedInSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "#ecfdf5",
  },
  backButtonText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "700",
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerRightPlaceholder: {
    width: 64,
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
    backgroundColor: "#dcfce7",
    borderWidth: 3,
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
    fontSize: 32,
    fontWeight: "800",
    color: "#059669",
  },
  avatarLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#059669",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  heroBadgeRow: {
    marginTop: 6,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  removePhotoBtn: {
    marginTop: 10,
    paddingVertical: 4,
  },
  removePhotoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ef4444",
  },
  card: {
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
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconSquircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderTexts: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: "#ecfdf5",
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  badgeInfo: {
    backgroundColor: "#f1f5f9",
  },
  badgeInfoText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  textInputField: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    height: "100%",
  },
  primaryButton: {
    backgroundColor: "#059669",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonLoadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  bannerSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bannerSuccessText: {
    flex: 1,
    color: "#047857",
    fontSize: 13,
    fontWeight: "600",
  },
  bannerError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bannerErrorText: {
    flex: 1,
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRowValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    marginTop: 2,
  },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  socialAccountsBox: {
    gap: 8,
  },
  providersWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  providerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  providerChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  idFooter: {
    paddingTop: 4,
  },
  idText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  signOutBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fee2e2",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
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
});
