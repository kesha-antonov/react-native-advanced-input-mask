import * as React from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import TextInput from "../../components/TextInput";

import styles from "./styles";

/**
 * Test screen for issue #147: onChangeText event fired with empty value when placeholder changed conditionally
 *
 * This demonstrates the fix for the issue where changing the placeholder prop
 * would incorrectly trigger onChangeText with an empty string.
 *
 * Expected behavior: onChangeText should only be called when user actually types text,
 * not when the placeholder changes.
 */
const PlaceholderChange = () => {
  const [placeholder, setPlaceholder] = React.useState<string | undefined>(
    undefined,
  );
  const [changeCount, setChangeCount] = React.useState(0);
  const [lastValue, setLastValue] = React.useState("01.01.2025");

  const handleFocus = React.useCallback(() => {
    // Change placeholder on focus to trigger the bug
    setPlaceholder("DD.MM.YYYY");
  }, []);

  const handleBlur = React.useCallback(() => {
    // Reset placeholder on blur
    setPlaceholder(undefined);
  }, []);

  const handleChangeText = React.useCallback(
    (formatted: string, extracted: string) => {
      console.log(
        "onChangeText called with formatted:",
        formatted,
        "extracted:",
        extracted,
      );
      setChangeCount((prev) => prev + 1);
      setLastValue(formatted);
    },
    [],
  );

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.contentContainer}
      style={styles.container}
    >
      <View style={styles.infoContainer}>
        <Text style={styles.title}>Placeholder Change Test (Issue #147)</Text>
        <Text style={styles.description}>
          Focus the input to change placeholder from undefined to a mask.
          {"\n"}
          {"\n"}
          Before fix: onChangeText fires with empty string on focus.
          {"\n"}
          After fix: onChangeText only fires when you type.
        </Text>
      </View>

      <TextInput
        controlled
        initialValue={lastValue}
        keyboardType="number-pad"
        mask="[00].[00].[0000]"
        placeholder={placeholder}
        onBlur={handleBlur}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
      />

      <View style={styles.statsContainer}>
        <Text style={styles.statLabel}>Change count: {changeCount}</Text>
        <Text style={styles.statLabel}>Last value: "{lastValue}"</Text>
        <Text style={styles.statLabel}>
          Current placeholder: {placeholder ?? "undefined"}
        </Text>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default PlaceholderChange;
