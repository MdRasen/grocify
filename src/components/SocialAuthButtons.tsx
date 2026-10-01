import { useSSO } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Warm up the browser for faster OAuth redirects
WebBrowser.maybeCompleteAuthSession();

type OAuthStrategy = "oauth_google" | "oauth_github" | "oauth_facebook";

interface SocialAuthButtonsProps {
  mode?: "sign-in" | "sign-up";
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function SocialAuthButtons({
  mode = "sign-in",
  onError,
  disabled = false,
}: SocialAuthButtonsProps) {
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const [loadingStrategy, setLoadingStrategy] = useState<OAuthStrategy | null>(
    null
  );

  useEffect(() => {
    // Warm up the browser session on component mount
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleOAuth = async (strategy: OAuthStrategy) => {
    if (disabled || loadingStrategy) return;

    try {
      setLoadingStrategy(strategy);
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "grocify",
        path: "sso-callback",
      });

      const { createdSessionId, setActive, authSessionResult } =
        await startSSOFlow({
          strategy,
          redirectUrl,
        });

      if (createdSessionId) {
        if (setActive) {
          await setActive({ session: createdSessionId });
        }
        router.replace("/(tabs)");
      } else if (
        authSessionResult?.type === "cancel" ||
        authSessionResult?.type === "dismiss"
      ) {
        // User closed or cancelled OAuth sheet - no error needed
      }
    } catch (err: unknown) {
      console.error("SSO Error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to sign in with social provider. Please try again.";
      onError?.(message);
    } finally {
      setLoadingStrategy(null);
    }
  };

  const actionText = mode === "sign-up" ? "Sign up" : "Continue";

  return (
    <View style={styles.container}>
      {/* Google / Gmail Button */}
      <TouchableOpacity
        style={[
          styles.socialButton,
          loadingStrategy === "oauth_google" && styles.buttonActive,
          (disabled || !!loadingStrategy) && styles.buttonDisabled,
        ]}
        onPress={() => handleOAuth("oauth_google")}
        disabled={disabled || !!loadingStrategy}
        activeOpacity={0.8}
      >
        {loadingStrategy === "oauth_google" ? (
          <ActivityIndicator size="small" color="#ea4335" />
        ) : (
          <View style={styles.iconWrapper}>
            <Ionicons name="logo-google" size={20} color="#ea4335" />
          </View>
        )}
        <Text style={styles.socialButtonText}>
          {loadingStrategy === "oauth_google"
            ? "Connecting to Google..."
            : `${actionText} with Google`}
        </Text>
      </TouchableOpacity>

      {/* GitHub Button */}
      <TouchableOpacity
        style={[
          styles.socialButton,
          loadingStrategy === "oauth_github" && styles.buttonActive,
          (disabled || !!loadingStrategy) && styles.buttonDisabled,
        ]}
        onPress={() => handleOAuth("oauth_github")}
        disabled={disabled || !!loadingStrategy}
        activeOpacity={0.8}
      >
        {loadingStrategy === "oauth_github" ? (
          <ActivityIndicator size="small" color="#24292f" />
        ) : (
          <View style={styles.iconWrapper}>
            <Ionicons name="logo-github" size={20} color="#24292f" />
          </View>
        )}
        <Text style={styles.socialButtonText}>
          {loadingStrategy === "oauth_github"
            ? "Connecting to GitHub..."
            : `${actionText} with GitHub`}
        </Text>
      </TouchableOpacity>

      {/* Facebook Button */}
      <TouchableOpacity
        style={[
          styles.socialButton,
          loadingStrategy === "oauth_facebook" && styles.buttonActive,
          (disabled || !!loadingStrategy) && styles.buttonDisabled,
        ]}
        onPress={() => handleOAuth("oauth_facebook")}
        disabled={disabled || !!loadingStrategy}
        activeOpacity={0.8}
      >
        {loadingStrategy === "oauth_facebook" ? (
          <ActivityIndicator size="small" color="#1877f2" />
        ) : (
          <View style={styles.iconWrapper}>
            <Ionicons name="logo-facebook" size={20} color="#1877f2" />
          </View>
        )}
        <Text style={styles.socialButtonText}>
          {loadingStrategy === "oauth_facebook"
            ? "Connecting to Facebook..."
            : `${actionText} with Facebook`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: "100%",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  buttonActive: {
    borderColor: "#16a34a",
    backgroundColor: "#f0fdf4",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  iconWrapper: {
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    letterSpacing: -0.2,
  },
});
