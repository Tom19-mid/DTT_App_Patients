import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { COLORS, SIZES } from '../constants/theme';

const LoginScreen = ({ navigation }: any) => {
  return (
    <AuthLayout>
      <View style={styles.formContainer}>
        <CustomInput placeholder="Số điện thoại" keyboardType="phone-pad" />
        <CustomInput placeholder="Mật khẩu" secureTextEntry />
        
        <CustomButton 
          title="Đăng nhập" 
          onPress={() => navigation.replace('MainTabs')} 
          style={styles.loginBtn}
        />

        <Text style={styles.orText}>Hoặc đăng nhập nhanh bằng</Text>

        <View style={styles.quickLoginContainer}>
          <TouchableOpacity style={styles.quickLoginIcon}>
            <Image source={require('../../assets/face-id.jpg')} style={styles.quickLoginImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLoginIcon}>
            <Image source={require('../../assets/sms-icon.png')} style={styles.quickLoginImage} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomLinks}>
          <Text style={styles.linkPrompt}>Bạn chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPassBtn}>
          <Text style={styles.forgotPassText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  loginBtn: {
    marginTop: 20,
    marginBottom: 20,
  },
  orText: {
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  quickLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 30,
  },
  quickLoginIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLoginImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    resizeMode: 'cover',
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

export default LoginScreen;
