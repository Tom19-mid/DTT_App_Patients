import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

import { useSettings } from '../context/SettingsContext';

interface CustomInputProps extends TextInputProps {}

const CustomInput: React.FC<CustomInputProps> = ({ style, ...props }) => {
  const { isDarkMode } = useSettings();

  return (
    <View style={[styles.container, SHADOWS.input, isDarkMode && { backgroundColor: '#374151' }]}>
      <TextInput
        style={[styles.input, style, isDarkMode && { color: '#F3F4F6' }]}
        placeholderTextColor={isDarkMode ? '#9CA3AF' : COLORS.placeholder}
        textAlign="left"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.base,
    backgroundColor: COLORS.card,
    borderRadius: 30,
    height: 55,
  },
  input: {
    flex: 1,
    paddingHorizontal: SIZES.large,
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});

export default CustomInput;
