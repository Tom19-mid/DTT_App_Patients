import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text';
  isLoading?: boolean;
  disabled?: boolean;
  style?: object;
  textStyle?: object;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        variant === 'primary' && styles.primary,
        variant === 'primary' && SHADOWS.input,
        variant === 'outline' && styles.outline,
        variant === 'text' && styles.textVariant,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : COLORS.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'primary' && styles.primaryText,
            variant === 'outline' && styles.outlineText,
            variant === 'text' && styles.textVariantText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SIZES.base,
    paddingHorizontal: SIZES.medium,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  textVariant: {
    backgroundColor: 'transparent',
    height: 'auto',
    paddingHorizontal: 0,
    marginVertical: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 20,
  },
  outlineText: {
    color: COLORS.primary,
  },
  textVariantText: {
    color: COLORS.link,
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default CustomButton;
