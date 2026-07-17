import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface CustomInputProps extends TextInputProps {}

const CustomInput: React.FC<CustomInputProps> = ({ style, ...props }) => {
  return (
    <View style={[styles.container, SHADOWS.input]}>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={COLORS.placeholder}
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
