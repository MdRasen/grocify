import { useSignIn } from "@clerk/expo";
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

export default function ResetPasswordScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const [clientErrors, setClientErrors] = useState<{
    email?: string;
    code?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const isSubmitting = fetchStatus === "fetching";

  // Step 1: Request reset code
  const handleRequestCode = async () => {
    const errs: { email?: string } = {};
    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (Object.keys(errs).length > 0) {
      setClientErrors(errs);
      return;
    }

    setClientErrors({});
    setResendMessage(null);

    try {
      // Initialize sign in with email identifier
      const { error: createError } = await signIn.create({
        identifier: email.trim(),
      });

      if (createError) {
        setClientErrors({
          general:
            createError.longMessage ||
            createError.message ||
            "Unable to find an account with this email.",
        });
        return;
      }

      // Send the password reset code
      const { error: sendError } =
        await signIn.resetPasswordEmailCode.sendCode();

      if (sendError) {
        setClientErrors({
          general:
            sendError.longMessage ||
            sendError.message ||
            "Failed to send password reset code.",
        });
        return;
      }

      setIsCodeSent(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while requesting reset.";
      setClientErrors({ general: msg });
    }
  };

  // Step 2: Verify code and set new password
  const handleResetPassword = async () => {
    const errs: {
      code?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!code.trim()) {
      errs.code = "Verification code is required";
    } else if (code.trim().length < 4) {
      errs.code = "Verification code is incomplete";
    }

    if (!newPassword) {
      errs.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      errs.newPassword = "Password must be at least 8 characters long";
    }

    if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errs).length > 0) {
      setClientErrors(errs);
      return;
    }

    setClientErrors({});
    setResendMessage(null);

    try {
      // 1. Verify code
      const { error: verifyError } =
        await signIn.resetPasswordEmailCode.verifyCode({
          code: code.trim(),
        });

      if (verifyError) {
        setClientErrors({
          code:
            verifyError.longMessage ||
            verifyError.message ||
            "Invalid or expired verification code.",
        });
        return;
      }

      // 2. Submit new password
      const { error: submitError } =
        await signIn.resetPasswordEmailCode.submitPassword({
          password: newPassword,
          signOutOfOtherSessions: true,
        });

      if (submitError) {
        setClientErrors({
          general:
            submitError.longMessage ||
            submitError.message ||
            "Failed to update password with new credentials.",
        });
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: () => {
            router.replace("/(tabs)");
          },
        });
      } else {
        setClientErrors({
          general: `Password reset incomplete (status: ${signIn.status}). Please try again.`,
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during password reset.";
      setClientErrors({ general: msg });
    }
  };

  // Resend reset code
  const handleResendCode = async () => {
    setClientErrors({});
    setResendMessage(null);

    try {
      const { error } = await signIn.resetPasswordEmailCode.sendCode();
      if (error) {
        setClientErrors({
          general:
            error.longMessage ||
            error.message ||
            "Failed to resend reset code.",
        });
      } else {
        setResendMessage("A fresh reset code was sent to your email.");
      }
    } catch {
      setClientErrors({ general: "Unable to resend code right now." });
    }
  };

  // Back to step 1
  const handleBackToStep1 = async () => {
    try {
      await signIn.reset();
    } catch {
      // ignore
    }
    setIsCodeSent(false);
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setClientErrors({});
    setResendMessage(null);
  };

  const emailErrorMessage =
    clientErrors.email || errors.fields.identifier?.message;
  const codeErrorMessage = clientErrors.code || errors.fields.code?.message;
  const passwordErrorMessage =
    clientErrors.newPassword || errors.fields.password?.message;
  const generalErrorMessage =
    clientErrors.general || errors.global?.[0]?.message;

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
          {/* Back to Sign In */}
          <Link href={"/sign-in" as Href} asChild>
            <Pressable style={styles.backButton} hitSlop={8}>
              <Text style={styles.backButtonText}>← Back to Sign In</Text>
            </Pressable>
          </Link>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.brandEmoji}>{isCodeSent ? "📬" : "🔑"}</Text>
            </View>
            <Text style={styles.brandTitle}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {isCodeSent
                ? `Enter the code sent to ${email} and your new password`
                : "Enter your registered email address to receive a recovery code"}
            </Text>
          </View>

          {/* General Error Banner */}
          {generalErrorMessage && (
            <View style={styles.bannerError}>
              <Text style={styles.bannerErrorText}>{generalErrorMessage}</Text>
            </View>
          )}

          {/* Resend Success Banner */}
          {resendMessage && (
            <View style={styles.bannerSuccess}>
              <Text style={styles.bannerSuccessText}>{resendMessage}</Text>
            </View>
          )}

          {/* Form Card */}
          <View style={styles.formCard}>
            {!isCodeSent ? (
              // Step 1: Request Code
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[
                      styles.input,
                      emailErrorMessage ? styles.inputError : null,
                    ]}
                    placeholder="name@example.com"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (clientErrors.email) {
                        setClientErrors((prev) => ({
                          ...prev,
                          email: undefined,
                        }));
                      }
                    }}
                  />
                  {emailErrorMessage && (
                    <Text style={styles.errorText}>{emailErrorMessage}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isSubmitting && styles.buttonDisabled,
                  ]}
                  onPress={handleRequestCode}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <View style={styles.buttonLoadingContent}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.primaryButtonText}>
                        Sending code...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Send Recovery Code
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // Step 2: Code + New Password
              <>
                {/* Code Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.codeInput,
                      codeErrorMessage ? styles.inputError : null,
                    ]}
                    placeholder="123456"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    maxLength={6}
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      if (clientErrors.code) {
                        setClientErrors((prev) => ({
                          ...prev,
                          code: undefined,
                        }));
                      }
                    }}
                  />
                  {codeErrorMessage && (
                    <Text style={styles.errorText}>{codeErrorMessage}</Text>
                  )}
                </View>

                {/* New Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        passwordErrorMessage ? styles.inputError : null,
                      ]}
                      placeholder="At least 8 characters"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        if (clientErrors.newPassword) {
                          setClientErrors((prev) => ({
                            ...prev,
                            newPassword: undefined,
                          }));
                        }
                      }}
                    />
                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={styles.showPasswordButton}
                      hitSlop={8}
                    >
                      <Text style={styles.showPasswordText}>
                        {showPassword ? "Hide" : "Show"}
                      </Text>
                    </Pressable>
                  </View>
                  {passwordErrorMessage && (
                    <Text style={styles.errorText}>{passwordErrorMessage}</Text>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    style={[
                      styles.input,
                      clientErrors.confirmPassword ? styles.inputError : null,
                    ]}
                    placeholder="Re-enter your new password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (clientErrors.confirmPassword) {
                        setClientErrors((prev) => ({
                          ...prev,
                          confirmPassword: undefined,
                        }));
                      }
                    }}
                  />
                  {clientErrors.confirmPassword && (
                    <Text style={styles.errorText}>
                      {clientErrors.confirmPassword}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isSubmitting && styles.buttonDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <View style={styles.buttonLoadingContent}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.primaryButtonText}>
                        Updating password...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Set New Password & Log In
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Secondary Actions */}
                <View style={styles.stepActions}>
                  <Pressable
                    style={styles.textButton}
                    onPress={handleResendCode}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.textButtonLabel}>Resend code</Text>
                  </Pressable>

                  <Pressable
                    style={styles.textButton}
                    onPress={handleBackToStep1}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.textButtonSecondary}>
                      Change email address
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remembered your password? </Text>
            <Link href={"/sign-in" as Href} asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.footerLink}>Log in</Text>
              </Pressable>
            </Link>
          </View>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#ecfdf5",
    borderRadius: 16,
    marginBottom: 16,
  },
  backButtonText: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: "700",
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandEmoji: {
    fontSize: 32,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  bannerError: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bannerErrorText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  bannerSuccess: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bannerSuccessText: {
    color: "#047857",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 16,
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
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  codeInput: {
    letterSpacing: 6,
    fontSize: 22,
    textAlign: "center",
    fontWeight: "700",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
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
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: "#16a34a",
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    width: "100%",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
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
  stepActions: {
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  textButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  textButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a",
  },
  textButtonSecondary: {
    fontSize: 13,
    color: "#6b7280",
    textDecorationLine: "underline",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: "#6b7280",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
  },
});
