import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, Text, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

interface CustomInputProps extends TextInputProps {
  label?: string;
  iconName?: any;
  isPassword?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({ 
  style, 
  label, 
  iconName, 
  isPassword, 
  secureTextEntry,
  ...props 
}) => {
  const { isDarkMode } = useSettings();
  const [isSecure, setIsSecure] = useState(isPassword || secureTextEntry);

  const toggleSecure = () => {
    setIsSecure(!isSecure);
  };

  return (
    <View style={styles.outerContainer}>
      {label ? (
        <Text style={[styles.label, isDarkMode && { color: '#D1D5DB' }]}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.container, SHADOWS.input, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563' }]}>
        {iconName ? (
          <Ionicons 
            name={iconName} 
            size={22} 
            color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} 
            style={styles.leftIcon} 
          />
        ) : null}
        <TextInput
          style={[styles.input, style, isDarkMode && { color: '#F3F4F6' }]}
          placeholderTextColor={isDarkMode ? '#9CA3AF' : COLORS.placeholder}
          textAlign="left"
          secureTextEntry={isSecure}
          {...props}
        />
        {(isPassword || secureTextEntry) ? (
          <TouchableOpacity onPress={toggleSecure} style={styles.rightIcon} activeOpacity={0.7}>
            <Ionicons 
              name={isSecure ? "eye-off-outline" : "eye-outline"} 
              size={22} 
              color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} 
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginVertical: SIZES.base,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginLeft: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 30,
    height: 55,
    paddingHorizontal: SIZES.large,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    padding: 8,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: SIZES.medium,
    fontWeight: '500',
    color: COLORS.text,
    height: '100%',
  },
});

export default CustomInput;
