import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

const RegisterScreen = ({ navigation }: any) => {
  const { isDarkMode, t } = useSettings();

  return (
    <AuthLayout>
      <View style={styles.formContainer}>
        <CustomInput placeholder={t('phone_placeholder')} keyboardType="phone-pad" />
        <CustomInput placeholder={t('email')} keyboardType="email-address" autoCapitalize="none" />
        <CustomInput placeholder={t('password_placeholder')} secureTextEntry />
        <CustomInput placeholder={t('confirm_password_placeholder')} secureTextEntry />
        
        <CustomButton 
          title={t('register_btn')} 
          onPress={() => navigation.navigate('OTP')} 
          style={styles.registerBtn}
        />

        <View style={styles.bottomLinks}>
          <Text style={[styles.linkPrompt, isDarkMode && { color: '#D1D5DB' }]}>{t('have_account')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.linkText, isDarkMode && { color: '#60A5FA' }]}>{t('login_btn')}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPassBtn}>
          <Text style={[styles.forgotPassText, isDarkMode && { color: '#D1D5DB' }]}>{t('forgot_password_btn')}</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  registerBtn: {
    marginTop: 20,
    marginBottom: 20,
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  linkPrompt: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  linkText: {
    fontSize: 12,
    color: COLORS.link,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  forgotPassBtn: {
    alignItems: 'center',
  },
  forgotPassText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
