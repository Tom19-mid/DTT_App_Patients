import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const { isDarkMode, t } = useSettings();

  return (
    <AuthLayout>
      <View style={styles.formContainer}>
        <Text style={[styles.descText, isDarkMode && { color: '#9CA3AF' }]}>{t('forgot_password_desc')}</Text>
        <CustomInput placeholder={t('phone_placeholder')} keyboardType="phone-pad" />
        
        <CustomButton 
          title={t('send_otp_btn')} 
          onPress={() => {}} 
          style={styles.submitBtn}
        />

        <View style={styles.bottomLinks}>
          <Text style={[styles.linkPrompt, isDarkMode && { color: '#D1D5DB' }]}>{t('no_account')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.linkText, isDarkMode && { color: '#60A5FA' }]}>{t('register_btn')}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginBtn}>
          <Text style={[styles.loginText, isDarkMode && { color: '#60A5FA' }]}>{t('back_to_login')}</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  descText: {
    fontSize: 14,
    color: COLORS.placeholder,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  submitBtn: {
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
  loginBtn: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 12,
    color: COLORS.link,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen;
