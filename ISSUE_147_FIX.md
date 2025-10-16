# Fix for Issue #147: onChangeText event fired with empty value when placeholder changed conditionally

## Problem
When using `MaskedTextInput` with a dynamic placeholder:
1. Render input with `placeholder={undefined}`
2. On focus, change to `placeholder={"test"}`
3. The `onChangeText("")` event is incorrectly fired with an empty string

This happens even though the user hasn't actually changed the text - only the placeholder prop changed.

## Root Cause
When a React component re-renders due to a prop change (like `placeholder`), React Native's reconciliation may re-call native prop setters even if those specific props haven't changed.

### iOS Issue
The `didSet` hooks in `AdvancedTextInputMaskDecoratorView.swift` didn't check if the old value equals the new value. This caused them to always trigger text updates via `updateTextWithoutNotification()` or `maybeUpdateText()`, which set text on the UITextField. Setting text on UITextField triggers its delegate methods, which then fire the `onAdvancedMaskTextChange` callback.

### Android Issue  
While Android had guards on most setters, `applyDefaultValue()` and `maybeUpdateText()` didn't use the `isSettingFromJS` flag to prevent change events from firing.

## Solution

### iOS Changes
Added `guard oldValue != newValue else { return }` checks in all `didSet` hooks that update text:
- `defaultValue`
- `value`
- `primaryMaskFormat`
- `isRTL`
- `allowedKeys`

This prevents unnecessary text updates when prop values haven't actually changed.

### Android Changes
Added `isSettingFromJS` flag protection to:
- `applyDefaultValue()` - wraps setText call with flag
- `maybeUpdateText()` - wraps setText call with flag

This flag prevents the `valueListener` from dispatching change events when text is being set programmatically from JS prop updates.

## Testing the Fix
To verify this fix works:

```tsx
import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { MaskedTextInput } from 'react-native-advanced-input-mask';

export default function TestPlaceholderChange() {
  const [placeholder, setPlaceholder] = useState<string | undefined>(undefined);
  const [changeCount, setChangeCount] = useState(0);

  const handleFocus = () => {
    setPlaceholder("test");
  };

  const handleChangeText = (formatted: string) => {
    console.log('onChangeText called with:', formatted);
    setChangeCount(prev => prev + 1);
  };

  return (
    <View>
      <MaskedTextInput
        mask="+1 ([000]) [000]-[0000]"
        placeholder={placeholder}
        onFocus={handleFocus}
        onChangeText={handleChangeText}
      />
      <Text>Change count: {changeCount}</Text>
    </View>
  );
}
```

**Before the fix**: When the input is focused, `onChangeText` is called with an empty string, incrementing the change count even though the user didn't type anything.

**After the fix**: When the input is focused, `onChangeText` is NOT called. The change count only increments when the user actually types text.
