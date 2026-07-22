import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

const OTPScreen = ({ navigation }: any) => {
  const { isDarkMode, t } = useSettings();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChangeText = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to next input if there is a value
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    
    // Dismiss keyboard if it's the last input
    if (text && index === 5) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = () => {
    // Navigate to Login or MainTabs after successful registration
    navigation.navigate('Login');
  };

  return (
    <AuthLayout>
      <View style={styles.container}>
        <Text style={[styles.title, isDarkMode && { color: '#60A5FA' }]}>{t('otp_title')}</Text>
        <Text style={[styles.subtitle, isDarkMode && { color: '#9CA3AF' }]}>
          {t('otp_desc')}
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={[styles.otpInput, isDarkMode && { backgroundColor: '#374151', color: '#F3F4F6', borderColor: '#4B5563' }]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChangeText(text.replace(/[^0-9]/g, ''), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              selectTextOnFocus
            />
          ))}
        </View>

        <CustomButton
          title={t('confirm')}
          onPress={handleConfirm}
          style={styles.confirmBtn}
        />

        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, isDarkMode && { color: '#D1D5DB' }]}>{t('not_received')}</Text>
          <TouchableOpacity onPress={() => { /* Handle resend */ }}>
            <Text style={[styles.resendLink, isDarkMode && { color: '#60A5FA' }]}>{t('resend')}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, isDarkMode && { color: '#9CA3AF' }]}>{t('back_to_register')}</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    backgroundColor: '#F8F9FA',
  },
  confirmBtn: {
    width: '100%',
    marginBottom: 20,
  },
  resendContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.text,
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  backBtn: {
    padding: 10,
  },
  backText: {
    fontSize: 14,
    color: COLORS.text,
    textDecorationLine: 'underline',
  },
});

export default OTPScreen;
