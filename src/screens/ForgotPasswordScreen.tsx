import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/theme';

const ForgotPasswordScreen = ({ navigation }: any) => {
  return (
    <AuthLayout>
      <View style={styles.formContainer}>
        <CustomInput placeholder="Số điện thoại" keyboardType="phone-pad" />
        
        <CustomButton 
          title="Lấy mật khẩu" 
          onPress={() => {}} 
          style={styles.submitBtn}
        />

        <View style={styles.bottomLinks}>
          <Text style={styles.linkPrompt}>Bạn chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginBtn}>
          <Text style={styles.loginText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
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
