import { useSignIn } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import { useState } from "react";
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

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientErrors, setClientErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const validate = () => {
    const errs: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (!password) {
      errs.password = "Password is required";
    }

    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setClientErrors({});

    try {
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        setClientErrors({
          general:
            error.longMessage ||
            error.message ||
            "Invalid email or password. Please try again.",
        });
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: () => {
            router.replace("/");
          },
        });
      } else {
        setClientErrors({
          general: `Sign-in incomplete (status: ${signIn.status}). Please check your credentials or verification.`,
        });
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during sign in.";
      setClientErrors({ general: errorMessage });
    }
  };

  const isSubmitting = fetchStatus === "fetching";

  // Check for field-specific errors from Clerk or client-side validation
  const emailErrorMessage =
    clientErrors.email || errors.fields.identifier?.message;
  const passwordErrorMessage =
    clientErrors.password || errors.fields.password?.message;
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

          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.brandEmoji}>🛒</Text>
            </View>
            <Text style={styles.brandTitle}>Grocify</Text>
            <Text style={styles.subtitle}>
              Welcome back! Log in to continue
            </Text>
          </View>

          {/* General Error Banner */}
          {generalErrorMessage && (
            <View style={styles.bannerError}>
              <Text style={styles.bannerErrorText}>{generalErrorMessage}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.formCard}>
            {/* Social Logins */}
            <SocialAuthButtons
              mode="sign-in"
              onError={(msg) => setClientErrors({ general: msg })}
              disabled={isSubmitting}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Field */}
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
                    setClientErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
              />
              {emailErrorMessage && (
                <Text style={styles.errorText}>{emailErrorMessage}</Text>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <Link href={"/reset-password" as Href} asChild>
                  <Pressable hitSlop={6}>
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </Pressable>
                </Link>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    passwordErrorMessage ? styles.inputError : null,
                  ]}
                  placeholder="Enter your password"
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

            {/* Sign In Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <View style={styles.buttonLoadingContent}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.primaryButtonText}>Logging in...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Switch to Sign Up */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{"Don't have an account? "}</Text>
            <Link href={"/sign-up" as Href} asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.footerLink}>Create account / Sign up</Text>
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
    fontSize: 15,
    color: "#6b7280",
    marginTop: 4,
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
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16a34a",
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
