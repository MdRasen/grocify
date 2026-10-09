import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import { LogBox } from "react-native";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useSettingsStore } from "../store/settings-store";
import "../../global.css";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useColorScheme();
  const { isDarkMode, keepScreenAwake } = useSettingsStore();

  useEffect(() => {
    setColorScheme(isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    if (keepScreenAwake) {
      activateKeepAwakeAsync().catch(() => {});
    } else {
      deactivateKeepAwake();
    }
  }, [keepScreenAwake]);

  return <>{children}</>;
}

export default function RootLayout() {
  // Suppress the specific Clerk development keys warning
  LogBox.ignoreLogs(["Clerk: Clerk has been loaded with development keys"]);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SettingsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="sso-callback" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
      </SettingsProvider>
    </ClerkProvider>
  );
}
