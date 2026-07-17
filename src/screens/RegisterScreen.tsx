import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/theme';

const RegisterScreen = ({ navigation }: any) => {
  return (
    <AuthLayout>
      <View style={styles.formContainer}>
        <CustomInput placeholder="Số điện thoại" keyboardType="phone-pad" />
        <CustomInput placeholder="Mật khẩu" secureTextEntry />
        <CustomInput placeholder="Xác nhận mật khẩu" secureTextEntry />
        
        <CustomButton 
          title="Đăng ký" 
          onPress={() => {}} 
          style={styles.registerBtn}
        />

        <View style={styles.bottomLinks}>
          <Text style={styles.linkPrompt}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Đăng nhập</Text>
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
