import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

const DocumentViewerScreen = ({ route, navigation }: any) => {
  const { title, specialty, date, patientName, recordData } = route.params || {
    title: 'Phiếu khám',
    specialty: 'Chuyên khoa',
    date: '26/07/2026',
    patientName: 'Nguyễn Văn Bệnh Nhân'
  };

  const actualPatientName = recordData?.patientName || patientName || 'Nguyễn Văn Bệnh Nhân';
  const actualDoctorName = recordData?.doctor || 'BS. CKII PHẠM TUẤN KIỆT';
  const actualCode = recordData?.code || 'PK-20260726-001';
  const actualDiagnosis = recordData?.diagnosis || 'Khám sức khỏe tổng quát';
  const actualSymptoms = recordData?.symptoms || 'Khám định kỳ';
  const actualTreatment = recordData?.treatmentPlan || 'Nghỉ ngơi nhiều, cấp toa thuốc về nhà theo dõi thêm.';
  
  const bp = recordData?.bloodPressure ? `Huyết áp: ${recordData.bloodPressure}` : 'Huyết áp: 120/80 mmHg';
  const pulse = recordData?.heartRate ? `Mạch: ${recordData.heartRate} bpm` : 'Mạch: 80 bpm';
  const temp = recordData?.temperature ? `Thân nhiệt: ${recordData.temperature}°C` : 'Thân nhiệt: 36.8°C';

  const actualPrescriptions = recordData?.prescriptionItems && recordData.prescriptionItems.length > 0 
    ? recordData.prescriptionItems 
    : [
        { name: 'Amoxicillin 500mg', usage: 'Số lượng: 20 Viên. Uống ngày 2 lần, mỗi lần 1 viên sau ăn.' },
        { name: 'Paracetamol 500mg', usage: 'Số lượng: 10 Viên. Uống khi sốt cao > 38.5°C' }
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
            <Text style={styles.docCode}>Mã số: {actualCode}</Text>

            {/* Patient Info */}
            <View style={styles.infoSection}>
              <Text style={styles.infoRow}><Text style={styles.bold}>Họ và tên người bệnh:</Text> {actualPatientName}</Text>
              <Text style={styles.infoRow}><Text style={styles.bold}>Chuyên khoa khám:</Text> {recordData?.specialtyName || specialty}</Text>
              <Text style={styles.infoRow}><Text style={styles.bold}>Ngày khám:</Text> {date}</Text>
            </View>

            {/* Content specific to document type */}
            <View style={styles.contentSection}>
              {title === 'Toa thuốc' ? (
                <>
                  <Text style={styles.bold}>CHỈ ĐỊNH ĐIỀU TRỊ / ĐƠN THUỐC:</Text>
                  {actualPrescriptions.map((item: any, index: number) => (
                    <View key={index} style={styles.prescriptionItem}>
                      <Text style={styles.itemTitle}>{index + 1}. {item.name}</Text>
                      <Text style={styles.itemUsage}>{item.usage}</Text>
                    </View>
                  ))}
                  <Text style={styles.note}><Text style={styles.bold}>Lời dặn:</Text> {actualTreatment}</Text>
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
                      <Text style={[styles.tableCol, {flex: 1, textAlign: 'right'}]}>250.000đ</Text>
                    </View>
                    {recordData?.totalAmount && recordData.totalAmount > 250000 ? (
                      <View style={styles.tableRow}>
                        <Text style={[styles.tableCol, {flex: 3}]}>Thuốc & Dịch vụ kèm theo</Text>
                        <Text style={[styles.tableCol, {flex: 1, textAlign: 'right'}]}>{(recordData.totalAmount - 250000).toLocaleString('vi-VN')}đ</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.totalText}><Text style={styles.bold}>Tổng cộng:</Text> {recordData?.totalAmount ? `${Number(recordData.totalAmount).toLocaleString('vi-VN')} VNĐ` : '250.000 VNĐ'}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.bold}>KẾT QUẢ KHÁM BỆNH:</Text>
                  <Text style={styles.diagnosisText}>- Lý do khám: {actualSymptoms}</Text>
                  <Text style={styles.diagnosisText}>- Sinh hiệu: {pulse}, {bp}, {temp}</Text>
                  <Text style={styles.diagnosisText}>- Chẩn đoán chính: {actualDiagnosis}</Text>
                  <Text style={styles.diagnosisText}>- Phương hướng điều trị: {actualTreatment}</Text>
                </>
              )}
            </View>

            {/* Signature */}
            <View style={styles.signatureSection}>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureDate}>Ngày {date}</Text>
                <Text style={styles.signatureRole}>Bác sĩ điều trị</Text>
                <View style={styles.signatureMock} />
                <Text style={styles.signatureName}>{actualDoctorName}</Text>
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
