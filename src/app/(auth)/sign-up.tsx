import { useSignUp } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { SocialAuthButtons } from "../../components/SocialAuthButtons";
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

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const [clientErrors, setClientErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    code?: string;
    general?: string;
  }>({});

  const isSubmitting = fetchStatus === "fetching";

  // Validate initial sign-up form
  const validateForm = () => {
    const errs: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters long";
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Sign Up initiation
  const handleSignUp = async () => {
    if (!validateForm()) return;
    setClientErrors({});
    setResendMessage(null);

    try {
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        setClientErrors({
          general:
            error.longMessage ||
            error.message ||
            "Unable to sign up with these details.",
        });
        return;
      }

      // Send verification code
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setClientErrors({
          general:
            sendError.longMessage ||
            sendError.message ||
            "Failed to send email verification code.",
        });
        return;
      }

      setIsVerifying(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during sign up.";
      setClientErrors({ general: msg });
    }
  };

  // Validate verification code
  const validateCode = () => {
    const errs: { code?: string } = {};
    if (!code.trim()) {
      errs.code = "Please enter the verification code";
    } else if (code.trim().length < 4) {
      errs.code = "Verification code is incomplete";
    }
    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Verification Code Submit
  const handleVerify = async () => {
    if (!validateCode()) return;
    setClientErrors({});
    setResendMessage(null);

    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });

      if (error) {
        setClientErrors({
          code:
            error.longMessage ||
            error.message ||
            "Invalid or expired verification code.",
        });
        return;
      }

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: () => {
            router.replace("/(tabs)");
          },
        });
      } else {
        setClientErrors({
          general: `Sign-up incomplete (status: ${signUp.status}). Please check remaining requirements.`,
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during verification.";
      setClientErrors({ general: msg });
    }
  };

  // Resend Verification Code
  const handleResendCode = async () => {
    setClientErrors({});
    setResendMessage(null);

    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) {
        setClientErrors({
          general:
            error.longMessage ||
            error.message ||
            "Failed to resend code. Please try again later.",
        });
      } else {
        setResendMessage("A new verification code has been sent to your email!");
      }
    } catch {
      setClientErrors({ general: "Unable to resend code right now." });
    }
  };

  // Reset and edit email
  const handleBackToSignUp = async () => {
    try {
      await signUp.reset();
    } catch {
      // ignore
    }
    setIsVerifying(false);
    setCode("");
    setClientErrors({});
    setResendMessage(null);
  };

  // Determine which view to show
  const showVerificationStep =
    isVerifying ||
    (signUp.status === "missing_requirements" &&
      signUp.unverifiedFields.includes("email_address") &&
      signUp.missingFields.length === 0);

  // Error messages
  const emailErrorMessage =
    clientErrors.email || errors.fields.emailAddress?.message;
  const passwordErrorMessage =
    clientErrors.password || errors.fields.password?.message;
  const codeErrorMessage = clientErrors.code || errors.fields.code?.message;
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
          {/* Back Button */}
          <Link href={"/" as Href} asChild>
            <Pressable style={styles.backButton} hitSlop={8}>
              <Text style={styles.backButtonText}>← Back to Home</Text>
            </Pressable>
          </Link>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.brandEmoji}>
                {showVerificationStep ? "✉️" : "🛒"}
              </Text>
            </View>
            <Text style={styles.brandTitle}>
              {showVerificationStep ? "Verify Email" : "Create Account"}
            </Text>
            <Text style={styles.subtitle}>
              {showVerificationStep
                ? `Enter the code sent to ${email}`
                : "Join Grocify for fresh grocery deliveries"}
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

          {/* Verification Code View */}
          {showVerificationStep ? (
            <View style={styles.formCard}>
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

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <View style={styles.buttonLoadingContent}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.primaryButtonText}>Verifying...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <View style={styles.verificationActions}>
                <Pressable
                  style={styles.textButton}
                  onPress={handleResendCode}
                  disabled={isSubmitting}
                >
                  <Text style={styles.textButtonLabel}>Resend code</Text>
                </Pressable>

                <Pressable
                  style={styles.textButton}
                  onPress={handleBackToSignUp}
                  disabled={isSubmitting}
                >
                  <Text style={styles.textButtonSecondary}>
                    Change email address
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* Sign Up View */
            <View style={styles.formCard}>
              {/* Social Logins */}
              <SocialAuthButtons
                mode="sign-up"
                onError={(msg) => setClientErrors({ general: msg })}
                disabled={isSubmitting}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email */}
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

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
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
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (clientErrors.password) {
                        setClientErrors((prev) => ({
                          ...prev,
                          password: undefined,
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
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    clientErrors.confirmPassword ? styles.inputError : null,
                  ]}
                  placeholder="Re-enter your password"
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

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleSignUp}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <View style={styles.buttonLoadingContent}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.primaryButtonText}>
                      Creating account...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              {/* Expo Web CAPTCHA container */}
              <View nativeID="clerk-captcha" />
            </View>
          )}

          {/* Switch to Sign In */}
          {!showVerificationStep && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href={"/sign-in" as Href} asChild>
                <Pressable hitSlop={8}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          )}
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
    fontSize: 15,
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
  },
  buttonLoadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verificationActions: {
    alignItems: "center",
    gap: 12,
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
