import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Top Right Controls */}
          <View style={styles.topControls}>
            <View style={[styles.langToggle, SHADOWS.input]}>
              <TouchableOpacity style={styles.langBtnActive}>
                <Text style={styles.langTextActive}>VI</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.langBtnInactive}>
                <Text style={styles.langTextInactive}>EN</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={[styles.themeToggle, SHADOWS.input]}>
              <Ionicons name="moon-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Main Card */}
          <View style={[styles.card, SHADOWS.card]}>
            {/* Real Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>

            {children}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
    marginTop: 20,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 4,
    marginRight: 15,
    alignItems: 'center',
  },
  langBtnActive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  langTextActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  divider: {
    width: 1,
    height: 15,
    backgroundColor: '#E0E0E0',
  },
  langBtnInactive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  langTextInactive: {
    fontSize: 12,
    color: COLORS.placeholder,
    fontWeight: 'bold',
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 30,
    padding: 30,
    paddingTop: 50,
    paddingBottom: 40,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: -20,
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
});

export default AuthLayout;
