import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

const DocumentViewerScreen = ({ route, navigation }: any) => {
  const { title, specialty, date, patientName } = route.params || {
    title: 'Phiếu khám',
    specialty: 'Chuyên khoa',
    date: '26/07/2026',
    patientName: 'Nguyễn Văn Bệnh Nhân'
  };

  // Generate dynamic mock based on specialty
  const isNhiKhoa = specialty.includes('Nhi');
  const isPhuKhoa = specialty.includes('Phụ') || specialty.includes('Sản');
  const isDaLieu = specialty.includes('Da liễu');
  
  const mockPatientName = isNhiKhoa ? 'Lê Thị Bé Bi' : isPhuKhoa ? 'Trần Thu Thủy' : isDaLieu ? 'Phạm Văn Da' : patientName;
  const mockGender = isPhuKhoa ? 'Nữ' : isNhiKhoa ? 'Nữ' : 'Nam';
  const mockDOB = isNhiKhoa ? '15/08/2020' : isPhuKhoa ? '20/10/1995' : '15/08/1990';
  const mockDoctorName = isNhiKhoa ? 'BS. Lê Thị B' : isPhuKhoa ? 'BS. Nguyễn Thị C' : 'BS. Nguyễn Văn A';
  
  const mockDiagnosis = isNhiKhoa 
    ? 'Viêm tiểu phế quản / Theo dõi sốt xuất huyết.' 
    : isPhuKhoa 
    ? 'Viêm âm đạo do nấm / Khám thai định kỳ.'
    : isDaLieu
    ? 'Viêm da cơ địa / Mề đay mãn tính.'
    : 'Viêm họng cấp / Theo dõi viêm amidan.';

  const mockPrescription = isNhiKhoa ? [
    { name: 'Siro hạ sốt Hapacol 250mg', usage: 'Số lượng: 1 chai. Uống 5ml khi sốt > 38.5 độ.' },
    { name: 'Oresol', usage: 'Số lượng: 5 gói. Pha 1 gói với 200ml nước, uống thay nước lọc.' }
  ] : isPhuKhoa ? [
    { name: 'Vitamin tổng hợp Elevit', usage: 'Số lượng: 30 viên. Ngày 1 viên sau ăn sáng.' },
    { name: 'Sắt Ferrovit', usage: 'Số lượng: 30 viên. Ngày 1 viên sau ăn trưa.' }
  ] : [
    { name: 'Paracetamol 500mg', usage: 'Số lượng: 10 viên. Ngày uống 2 lần, mỗi lần 1 viên sau ăn.' },
    { name: 'Vitamin C 1000mg', usage: 'Số lượng: 10 viên. Ngày uống 1 viên sủi buổi sáng.' }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity style={styles.downloadBtn}>
          <Ionicons name="download-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.pdfBackground}>
          {/* Simulated A4 Paper */}
          <View style={[styles.a4Paper, SHADOWS.card]}>
            {/* Hospital Header */}
            <View style={styles.docHeader}>
              <View style={styles.docLogoBox}>
                <Ionicons name="medical" size={32} color={COLORS.primary} />
              </View>
              <View style={styles.docHeaderInfo}>
                <Text style={styles.docHospitalName}>PHÒNG KHÁM ĐA KHOA DTT HEALTHCARE</Text>
                <Text style={styles.docAddress}>123 Đường Y Tế, Phường 4, Quận 5, TP.HCM</Text>
                <Text style={styles.docAddress}>Hotline: 1900 1234</Text>
              </View>
            </View>

            <View style={styles.docDivider} />

            {/* Document Title */}
            <Text style={styles.docMainTitle}>{title.toUpperCase()}</Text>
            <Text style={styles.docCode}>Mã số: {title === 'Hóa đơn' ? 'HD' : 'PK'}-20260726-001</Text>

            {/* Patient Info */}
            <View style={styles.infoSection}>
              <Text style={styles.infoRow}><Text style={styles.bold}>Họ và tên người bệnh:</Text> {mockPatientName}</Text>
              <Text style={styles.infoRow}><Text style={styles.bold}>Ngày sinh:</Text> {mockDOB}  |  <Text style={styles.bold}>Giới tính:</Text> {mockGender}</Text>
              <Text style={styles.infoRow}><Text style={styles.bold}>Địa chỉ:</Text> 456 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM</Text>
              <Text style={styles.infoRow}><Text style={styles.bold}>Chuyên khoa khám:</Text> {specialty}</Text>
              <Text style={styles.infoRow}><Text style={styles.bold}>Ngày khám:</Text> {date}</Text>
            </View>

            {/* Content specific to document type */}
            <View style={styles.contentSection}>
              {title === 'Toa thuốc' ? (
                <>
                  <Text style={styles.bold}>CHỈ ĐỊNH ĐIỀU TRỊ / ĐƠN THUỐC:</Text>
                  {mockPrescription.map((item, index) => (
                    <View key={index} style={styles.prescriptionItem}>
                      <Text style={styles.itemTitle}>{index + 1}. {item.name}</Text>
                      <Text style={styles.itemUsage}>{item.usage}</Text>
                    </View>
                  ))}
                  <Text style={styles.note}><Text style={styles.bold}>Lời dặn:</Text> Tái khám sau 7 ngày hoặc khi có dấu hiệu bất thường.</Text>
                </>
              ) : title === 'Hóa đơn' ? (
                <>
                  <Text style={styles.bold}>CHI TIẾT THANH TOÁN:</Text>
                  <View style={styles.table}>
                    <View style={styles.tableRowHeader}>
                      <Text style={[styles.tableCol, {flex: 3, fontWeight: 'bold'}]}>Dịch vụ</Text>
                      <Text style={[styles.tableCol, {flex: 1, fontWeight: 'bold', textAlign: 'right'}]}>Thành tiền</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCol, {flex: 3}]}>Công khám {specialty}</Text>
                      <Text style={[styles.tableCol, {flex: 1, textAlign: 'right'}]}>150.000đ</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCol, {flex: 3}]}>Thuốc</Text>
                      <Text style={[styles.tableCol, {flex: 1, textAlign: 'right'}]}>85.000đ</Text>
                    </View>
                  </View>
                  <Text style={styles.totalText}><Text style={styles.bold}>Tổng cộng:</Text> 235.000 VNĐ</Text>
                </>
              ) : (
                <>
                  <Text style={styles.bold}>KẾT QUẢ KHÁM BỆNH:</Text>
                  <Text style={styles.diagnosisText}>- Lý do khám: Bệnh nhân đến khám định kỳ / có triệu chứng mệt mỏi.</Text>
                  <Text style={styles.diagnosisText}>- Sinh hiệu: Mạch: 80 l/p, Huyết áp: 120/80 mmHg, Nhiệt độ: 37°C.</Text>
                  <Text style={styles.diagnosisText}>- Chẩn đoán sơ bộ: {mockDiagnosis}</Text>
                  <Text style={styles.diagnosisText}>- Phương hướng điều trị: Cấp toa thuốc về nhà theo dõi thêm.</Text>
                </>
              )}
            </View>

            {/* Signature */}
            <View style={styles.signatureSection}>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureDate}>Ngày 26 tháng 07 năm 2026</Text>
                <Text style={styles.signatureRole}>Bác sĩ điều trị</Text>
                <View style={styles.signatureMock} />
                <Text style={styles.signatureName}>{mockDoctorName}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#333333' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#222222',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  downloadBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  
  container: { paddingVertical: 24, alignItems: 'center' },
  pdfBackground: { width: '100%', alignItems: 'center' },
  
  a4Paper: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 4,
    minHeight: 600,
  },
  docHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  docLogoBox: { marginRight: 16 },
  docHeaderInfo: { flex: 1 },
  docHospitalName: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  docAddress: { fontSize: 11, color: '#333', marginBottom: 2 },
  
  docDivider: { height: 2, backgroundColor: '#000', marginBottom: 24 },
  
  docMainTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#000', marginBottom: 4 },
  docCode: { fontSize: 12, textAlign: 'center', color: '#666', fontStyle: 'italic', marginBottom: 24 },
  
  infoSection: { marginBottom: 24 },
  infoRow: { fontSize: 13, color: '#000', marginBottom: 6, lineHeight: 20 },
  bold: { fontWeight: 'bold' },
  
  contentSection: { marginBottom: 40, minHeight: 150 },
  diagnosisText: { fontSize: 13, color: '#000', marginTop: 8, lineHeight: 22 },
  
  prescriptionItem: { marginTop: 12 },
  itemTitle: { fontSize: 13, fontWeight: 'bold', color: '#000' },
  itemUsage: { fontSize: 13, color: '#333', marginTop: 4, fontStyle: 'italic', paddingLeft: 12 },
  note: { marginTop: 16, fontSize: 13, color: '#000' },

  table: { marginTop: 12, borderWidth: 1, borderColor: '#000' },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderBottomWidth: 1, borderColor: '#000' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  tableCol: { padding: 8, fontSize: 13, color: '#000' },
  totalText: { fontSize: 14, marginTop: 16, textAlign: 'right' },
  
  signatureSection: { alignItems: 'flex-end', marginTop: 20 },
  signatureBox: { alignItems: 'center', width: 200 },
  signatureDate: { fontSize: 12, fontStyle: 'italic', color: '#000', marginBottom: 4 },
  signatureRole: { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 40 },
  signatureMock: { height: 2, width: 100, backgroundColor: '#ccc', marginBottom: 8 },
  signatureName: { fontSize: 13, fontWeight: 'bold', color: '#000' },
});

export default DocumentViewerScreen;
