import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const ProfileScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={[styles.logoImage, SHADOWS.input]} 
            resizeMode="contain" 
          />
          <Text style={styles.headerTitle}>Cá nhân</Text>
        </View>

        {/* Main Profile Card */}
        <View style={[styles.card, SHADOWS.card]}>
          
          <View style={styles.profileTop}>
            <View style={styles.largeAvatar}>
              <Ionicons name="person" size={50} color={COLORS.card} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.nameText}>NGUYỄN ABC</Text>
              <Text style={styles.phoneText}>0900031245</Text>
              <TouchableOpacity style={[styles.infoPill, SHADOWS.input]}>
                <Text style={styles.infoPillText}>Thông tin tài khoản</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem}>
              <View style={[styles.statIconBox, SHADOWS.input]}>
                <Ionicons name="people-outline" size={40} color={COLORS.text} />
              </View>
              <Text style={styles.statTextBlue}>Hồ sơ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statItem}>
              <View style={[styles.statIconBox, { borderColor: '#28A745', borderWidth: 2 }]}>
                <Ionicons name="person-circle" size={45} color="#28A745" />
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#28A745" />
                </View>
              </View>
              <Text style={styles.statTextGreen}>Đã duyệt</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitleCenter}>Hồ sơ bệnh nhân</Text>

          <View style={styles.subCard}>
            <View style={styles.subCardLeft}>
              <Ionicons name="person-circle" size={24} color="#6c8cf5" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.subName}>NGUYỄN ABC <Text style={styles.subId}>#000001</Text></Text>
                <Text style={styles.subDetail}>Nam • 28/06/2000</Text>
                <Text style={styles.subDetail}>Trạng thái • <Text style={{ color: '#28A745' }}>Đã duyệt</Text></Text>
              </View>
            </View>
            <TouchableOpacity style={styles.manageBtn}>
              <Text style={styles.manageBtnText}>Quản lý hồ sơ</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Utilities Section */}
        <Text style={styles.sectionTitleLeft}>TIỆN ÍCH</Text>
        <View style={[styles.card, SHADOWS.card, { height: 120 }]} />

        {/* Security Section */}
        <Text style={styles.sectionTitleLeft}>BẢO MẬT</Text>
        <View style={[styles.card, SHADOWS.card, { height: 120 }]} />

        {/* Bottom padding for floating tab bar */}
        <View style={{ height: 100 }} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 15,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  phoneText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  infoPill: {
    backgroundColor: COLORS.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  infoPillText: {
    fontSize: 12,
    color: COLORS.placeholder,
    fontWeight: 'bold',
  },
  divider: {
    height: 2,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  statTextBlue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statTextGreen: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28A745',
  },
  sectionTitleCenter: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  subCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
  },
  subCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  subName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subId: {
    color: COLORS.placeholder,
    fontWeight: 'normal',
  },
  subDetail: {
    fontSize: 10,
    color: COLORS.placeholder,
    marginTop: 2,
  },
  manageBtn: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  manageBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionTitleLeft: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 5,
    marginBottom: 10,
  },
});

export default ProfileScreen;
