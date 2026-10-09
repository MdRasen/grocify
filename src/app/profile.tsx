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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";

export default function ProfileScreen() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();

  if (!isAuthLoaded || !isUserLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-2">
            <Ionicons name="lock-closed" size={32} color="#dc2626" />
          </View>
          <Text className="text-2xl font-extrabold text-foreground">Session Expired</Text>
          <Text className="text-sm text-muted-foreground text-center mb-4">
            Please sign in to access your profile settings.
          </Text>
          <Link href={"/sign-in" as Href} asChild>
            <TouchableOpacity className="bg-primary h-12 px-6 rounded-2xl items-center justify-center shadow-sm">
              <Text className="text-white text-[15px] font-bold">Go to Log In</Text>
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Personal info state
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSuccessMessage, setNameSuccessMessage] = useState<string | null>(null);
  const [nameErrorMessage, setNameErrorMessage] = useState<string | null>(null);

  // Profile image state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageSuccessMessage, setImageSuccessMessage] = useState<string | null>(null);
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(null);

  // Password reset/update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);

  // Sign out state
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Handle Photo Selection & Upload
  const handlePickImage = async () => {
    setImageSuccessMessage(null);
    setImageErrorMessage(null);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setImageErrorMessage("Permission to access your photos is required to change your profile picture.");
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
      setImageErrorMessage(err instanceof Error ? err.message : "Failed to update profile image. Please try again.");
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
      setImageErrorMessage(err instanceof Error ? err.message : "Failed to remove profile image.");
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
      setNameErrorMessage(err instanceof Error ? err.message : "Failed to update name. Please check your connection.");
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
      setPasswordErrorMessage("New password must be at least 8 characters long.");
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
      setPasswordErrorMessage(err instanceof Error ? err.message : "Failed to update password. Please check your credentials.");
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
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Modern Top Header */}
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-border bg-card">
          <Pressable
            className="flex-row items-center gap-1 py-1.5 px-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30"
            hitSlop={12}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/settings");
              }
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#10b981" />
            <Text className="text-primary text-sm font-bold">Back</Text>
          </Pressable>
          <Text className="text-[17px] font-bold text-foreground">Edit Profile</Text>
          <View className="w-16" />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Profile Photo Section */}
          <View className="items-center bg-card rounded-[24px] py-6 px-5 border border-border shadow-sm">
            <View className="relative mb-3">
              <View className="w-24 h-24 rounded-full overflow-hidden bg-accent border-[3px] border-primary items-center justify-center">
                {user.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <Text className="text-[32px] font-extrabold text-primary">{userInitials}</Text>
                )}

                {isUploadingImage && (
                  <View className="absolute inset-0 bg-slate-900/50 items-center justify-center">
                    <ActivityIndicator color="#ffffff" size="small" />
                  </View>
                )}
              </View>

              {/* Floating Camera Button */}
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center border-[2.5px] border-card shadow-sm"
                onPress={handlePickImage}
                disabled={isUploadingImage}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text className="text-xl font-extrabold text-foreground tracking-tight">{displayName}</Text>
            <View className="mt-1.5 flex-row items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full">
              <Ionicons name="checkmark-circle" size={13} color="#10b981" />
              <Text className="text-xs font-bold text-primary">Active Account</Text>
            </View>

            {user.hasImage && (
              <TouchableOpacity
                className="mt-3 py-1"
                onPress={handleRemoveImage}
                disabled={isUploadingImage}
              >
                <Text className="text-[13px] font-semibold text-red-500">Remove photo</Text>
              </TouchableOpacity>
            )}

            {imageSuccessMessage && (
              <View className="flex-row items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl py-2.5 px-3 mt-4 w-full">
                <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
                <Text className="flex-1 text-primary text-[13px] font-semibold">{imageSuccessMessage}</Text>
              </View>
            )}

            {imageErrorMessage && (
              <View className="flex-row items-center gap-2 bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl py-2.5 px-3 mt-4 w-full">
                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                <Text className="flex-1 text-red-600 dark:text-red-400 text-[13px] font-medium">{imageErrorMessage}</Text>
              </View>
            )}
          </View>

          {/* 1. Personal Information Card */}
          <View className="bg-card rounded-[22px] p-[18px] border border-border shadow-sm gap-3.5">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 items-center justify-center">
                <Ionicons name="person-outline" size={20} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">Personal Information</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">Your public display name</Text>
              </View>
            </View>

            {nameSuccessMessage && (
              <View className="flex-row items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl py-2.5 px-3">
                <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
                <Text className="flex-1 text-primary text-[13px] font-semibold">{nameSuccessMessage}</Text>
              </View>
            )}

            {nameErrorMessage && (
              <View className="flex-row items-center gap-2 bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl py-2.5 px-3">
                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                <Text className="flex-1 text-red-600 dark:text-red-400 text-[13px] font-medium">{nameErrorMessage}</Text>
              </View>
            )}

            <View className="gap-1.5 mt-1">
              <Text className="text-[13px] font-semibold text-card-foreground">First Name</Text>
              <View className="flex-row items-center gap-2.5 bg-secondary border border-border rounded-2xl px-3.5 h-12">
                <Ionicons name="person-outline" size={18} color={isDark ? "#64748b" : "#94a3b8"} />
                <TextInput
                  className="flex-1 text-sm text-foreground h-full"
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

            <View className="gap-1.5">
              <Text className="text-[13px] font-semibold text-card-foreground">Last Name</Text>
              <View className="flex-row items-center gap-2.5 bg-secondary border border-border rounded-2xl px-3.5 h-12">
                <Ionicons name="person-outline" size={18} color={isDark ? "#64748b" : "#94a3b8"} />
                <TextInput
                  className="flex-1 text-sm text-foreground h-full"
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
              className={`bg-primary h-12 rounded-2xl items-center justify-center mt-2 shadow-sm ${isSavingName ? 'opacity-65' : ''}`}
              onPress={handleUpdateName}
              disabled={isSavingName}
              activeOpacity={0.85}
            >
              {isSavingName ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text className="text-white text-[15px] font-bold">Saving Changes...</Text>
                </View>
              ) : (
                <Text className="text-white text-[15px] font-bold">Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 2. Password & Security Card */}
          <View className="bg-card rounded-[22px] p-[18px] border border-border shadow-sm gap-3.5">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 items-center justify-center">
                <Ionicons name="shield-checkmark-outline" size={20} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">Password & Security</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {user.passwordEnabled
                    ? "Update your existing account password"
                    : "Create password for direct email sign-in"}
                </Text>
              </View>
              <View className={`px-2 py-1 rounded-xl ${user.passwordEnabled ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <Text className={`text-[11px] font-bold ${user.passwordEnabled ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                  {user.passwordEnabled ? "Active" : "OAuth"}
                </Text>
              </View>
            </View>

            {passwordSuccessMessage && (
              <View className="flex-row items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl py-2.5 px-3">
                <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
                <Text className="flex-1 text-primary text-[13px] font-semibold">{passwordSuccessMessage}</Text>
              </View>
            )}

            {passwordErrorMessage && (
              <View className="flex-row items-center gap-2 bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl py-2.5 px-3">
                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                <Text className="flex-1 text-red-600 dark:text-red-400 text-[13px] font-medium">{passwordErrorMessage}</Text>
              </View>
            )}

            {user.passwordEnabled && (
              <View className="gap-1.5 mt-1">
                <Text className="text-[13px] font-semibold text-card-foreground">Current Password</Text>
                <View className="flex-row items-center gap-2.5 bg-secondary border border-border rounded-2xl px-3.5 h-12">
                  <Ionicons name="lock-closed-outline" size={18} color={isDark ? "#64748b" : "#94a3b8"} />
                  <TextInput
                    className="flex-1 text-sm text-foreground h-full"
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
                  <Pressable onPress={() => setShowCurrentPassword((prev) => !prev)} hitSlop={8}>
                    <Ionicons name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} size={20} color={isDark ? "#94a3b8" : "#64748b"} />
                  </Pressable>
                </View>
              </View>
            )}

            <View className="gap-1.5">
              <Text className="text-[13px] font-semibold text-card-foreground">
                {user.passwordEnabled ? "New Password" : "Create Password"}
              </Text>
              <View className="flex-row items-center gap-2.5 bg-secondary border border-border rounded-2xl px-3.5 h-12">
                <Ionicons name="key-outline" size={18} color={isDark ? "#64748b" : "#94a3b8"} />
                <TextInput
                  className="flex-1 text-sm text-foreground h-full"
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
                <Pressable onPress={() => setShowNewPassword((prev) => !prev)} hitSlop={8}>
                  <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={20} color={isDark ? "#94a3b8" : "#64748b"} />
                </Pressable>
              </View>
            </View>

            <View className="gap-1.5">
              <Text className="text-[13px] font-semibold text-card-foreground">Confirm New Password</Text>
              <View className="flex-row items-center gap-2.5 bg-secondary border border-border rounded-2xl px-3.5 h-12">
                <Ionicons name="key-outline" size={18} color={isDark ? "#64748b" : "#94a3b8"} />
                <TextInput
                  className="flex-1 text-sm text-foreground h-full"
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
                <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)} hitSlop={8}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={isDark ? "#94a3b8" : "#64748b"} />
                </Pressable>
              </View>
            </View>

            <TouchableOpacity
              className={`bg-primary h-12 rounded-2xl items-center justify-center mt-2 shadow-sm ${isUpdatingPassword ? 'opacity-65' : ''}`}
              onPress={handleUpdatePassword}
              disabled={isUpdatingPassword}
              activeOpacity={0.85}
            >
              {isUpdatingPassword ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text className="text-white text-[15px] font-bold">Updating...</Text>
                </View>
              ) : (
                <Text className="text-white text-[15px] font-bold">
                  {user.passwordEnabled ? "Update Password" : "Set Password"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Account & Connected Logins Card */}
          <View className="bg-card rounded-[22px] p-[18px] border border-border shadow-sm gap-3.5">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 items-center justify-center">
                <Ionicons name="finger-print-outline" size={20} color="#0ea5e9" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">Account Details</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">Email & authentication</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between bg-secondary rounded-2xl p-3 border border-border">
              <View className="flex-row items-center gap-2.5 flex-1">
                <Ionicons name="mail-outline" size={18} color={isDark ? "#64748b" : "#94a3b8"} />
                <View>
                  <Text className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Email Address</Text>
                  <Text className="text-sm text-foreground font-semibold mt-0.5">{primaryEmail}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-xl">
                <Ionicons name="checkmark-circle" size={13} color="#10b981" />
                <Text className="text-[11px] font-bold text-primary">Verified</Text>
              </View>
            </View>

            {user.externalAccounts && user.externalAccounts.length > 0 && (
              <View className="gap-2">
                <Text className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Connected Social Logins</Text>
                <View className="flex-row flex-wrap gap-2">
                  {user.externalAccounts.map((account) => {
                    const providerName =
                      account.provider === "google" ? "Google"
                        : account.provider === "github" ? "GitHub"
                          : account.provider === "facebook" ? "Facebook" : account.provider;

                    const iconName =
                      account.provider === "google" ? "logo-google"
                        : account.provider === "github" ? "logo-github"
                          : "logo-facebook";

                    const iconColor =
                      account.provider === "google" ? "#ea4335"
                        : account.provider === "github" ? (isDark ? "#ffffff" : "#1e293b")
                          : "#1877f2";

                    return (
                      <View key={account.id} className="flex-row items-center gap-1.5 bg-secondary border border-border py-1.5 px-2.5 rounded-xl">
                        <Ionicons name={iconName as any} size={14} color={iconColor} />
                        <Text className="text-xs font-semibold text-card-foreground">{providerName}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View className="pt-1">
              <Text className="text-[11px] text-muted-foreground">User ID: {user.id}</Text>
            </View>
          </View>

          {/* 4. Sign Out Button */}
          <TouchableOpacity
            className={`bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 h-14 rounded-2xl items-center justify-center mt-2 ${isSigningOut ? 'opacity-65' : ''}`}
            onPress={handleSignOut}
            disabled={isSigningOut}
            activeOpacity={0.8}
          >
            {isSigningOut ? (
              <ActivityIndicator color="#ef4444" size="small" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text className="text-red-500 text-[15px] font-bold">Sign Out of Grocify</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
