import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, SafeAreaView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableChat from '../components/DraggableChat';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const specialties = [
  { id: 1, name: 'Nội Tổng quát', icon: 'stethoscope', type: 'fa5' },
  { id: 2, name: 'Nhi khoa', icon: 'baby', type: 'fa5' },
  { id: 3, name: 'Phụ & Sản\nkhoa', icon: 'human-female', type: 'mci' },
  { id: 4, name: 'Cơ xương\nkhớp', icon: 'bone', type: 'fa5' },
  { id: 5, name: 'Tim mạch', icon: 'heartbeat', type: 'fa5' },
  { id: 6, name: 'Thần kinh', icon: 'brain', type: 'fa5' },
  { id: 7, name: 'Da liễu', icon: 'hand-sparkles', type: 'fa5' },
  { id: 8, name: 'Chẩn đoán\nhình ảnh...', icon: 'bullseye', type: 'fa5' },
];

const services = [
  { id: 1, name: 'Tra cứu kết\nquả', icon: 'file-medical-alt', type: 'fa5' },
  { id: 2, name: 'Hóa đơn &\nBiên lai', icon: 'file-invoice-dollar', type: 'fa5' },
  { id: 3, name: 'Thông tin\nhướng dẫn', icon: 'book-medical', type: 'fa5' },
  { id: 4, name: 'Thông tin y\nkhoa', icon: 'clipboard-list', type: 'fa5' },
];

const HomeScreen = () => {
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const renderIcon = (item: any) => {
    if (item.type === 'fa5') {
      return <FontAwesome5 name={item.icon} size={36} color={COLORS.primary} />;
    }
    return <MaterialCommunityIcons name={item.icon} size={40} color={COLORS.primary} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={[styles.iconButton, SHADOWS.input]}>
              <Ionicons name="moon-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.userGreeting}>
              <View style={styles.smallAvatar}>
                <Text style={styles.smallAvatarText}>TD</Text>
              </View>
              <View>
                <Text style={styles.greetingText}>Xin chào</Text>
                <Text style={styles.userNameText}>User (SĐT)</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerCenter}>
            <Image
              source={require('../../assets/logo.png')}
              style={[styles.logoImage, SHADOWS.input]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerRight}>
            <View style={[styles.langToggle, SHADOWS.input]}>
              <TouchableOpacity style={styles.langBtnActive}>
                <Text style={styles.langTextActive}>VI</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.langBtnInactive}>
                <Text style={styles.langTextInactive}>EN</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.iconButton, SHADOWS.input, { marginTop: 25 }]}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, SHADOWS.input]}>
          <Ionicons name="search-outline" size={24} color={COLORS.placeholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm: Bác sĩ, chuyên khoa, toa thuốc,..."
            placeholderTextColor={COLORS.placeholder}
          />
          <Ionicons name="mic-outline" size={24} color={COLORS.placeholder} style={styles.micIcon} />
        </View>

        {/* Specialties Grid */}
        <View style={styles.gridContainer}>
          {specialties.map(item => (
            <TouchableOpacity key={item.id} style={styles.gridItem}>
              <View style={[styles.iconBox, SHADOWS.input]}>
                {renderIcon(item)}
              </View>
              <Text style={styles.itemText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Đặt lịch khám ngay?</Text>
        </View>

        {/* Services Grid */}
        <View style={styles.gridContainer}>
          {services.map(item => (
            <TouchableOpacity key={item.id} style={styles.gridItem}>
              <View style={[styles.iconBox, SHADOWS.input]}>
                {renderIcon(item)}
              </View>
              <Text style={styles.itemText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom padding for floating tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Buttons */}
      <View style={styles.floatingButtonsContainer}>
        <TouchableOpacity style={[styles.floatingScrollTopButton, SHADOWS.card]} activeOpacity={0.8} onPress={scrollToTop}>
          <Ionicons name="arrow-up" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <DraggableChat />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  smallAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  greetingText: {
    fontSize: 12,
    color: COLORS.text,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 25,
    padding: 4,
    alignItems: 'center',
  },
  langBtnActive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  langTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
  },
  langBtnInactive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  langTextInactive: {
    fontSize: 14,
    color: COLORS.placeholder,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 25,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  micIcon: {
    marginLeft: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    color: COLORS.text,
  },
  banner: {
    width: '100%',
    height: 120,
    backgroundColor: '#EEF2FF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#D0D7F5',
  },
  bannerText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  floatingButtonsContainer: {
    position: 'absolute',
    bottom: 110, // tab bar height(60) + bottom offset(20) + extra(30) clearance
    right: 20,
    alignItems: 'center',
  },
  floatingScrollTopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
