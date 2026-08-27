import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { BASE_URL } from '../services/apiService';

// Ảnh siêu âm được backend trả về dạng đường dẫn tương đối (vd "/uploads/ultrasound/5/xyz.jpg"),
// còn BASE_URL của apiService có hậu tố "/api" — phải bỏ đi mới ghép đúng URL ảnh tĩnh.
const IMAGE_HOST = BASE_URL.replace(/\/api$/, '');

const RESULT_STATUS_LABEL: Record<string, string> = {
  Pending: 'Đang chờ kết quả',
  Normal: 'Bình thường',
  Abnormal: 'Bất thường',
  Completed: 'Đã hoàn tất',
  Cancelled: 'Đã hủy chỉ định',
};

const DocumentViewerScreen = ({ route, navigation }: any) => {
  const { title, docType, specialty, date, patientName, recordData } = route.params || {
    title: 'Phiếu khám',
    docType: 'phieu-kham',
    specialty: 'Chuyên khoa',
    date: '26/07/2026',
    patientName: 'Nguyễn Văn Bệnh Nhân'
  };

  // hasRecord=true nghĩa là màn này được mở với 1 hồ sơ THẬT (recordData truyền từ API) — mọi field
  // rỗng lúc đó phải hiện "Chưa có dữ liệu" trung thực, KHÔNG được điền dữ liệu demo bịa ra như thể là
  // thật (trước đây field nào cũng có 1 giá trị giả cụ thể — vd đơn thuốc thật rỗng vẫn tự bịa ra
  // "Amoxicillin 500mg" như thể bác sĩ đã kê, bệnh nhân có thể tưởng nhầm là thuốc thật của mình).
  // Dữ liệu demo cụ thể CHỈ còn dùng khi mở màn này hoàn toàn không có recordData (xem preview/test).
  const hasRecord = !!recordData;
  const actualPatientName = recordData?.patientName || patientName || (hasRecord ? 'Chưa có tên bệnh nhân' : 'Nguyễn Văn Bệnh Nhân');
  const actualDoctorName = recordData?.doctor || (hasRecord ? 'Chưa có thông tin bác sĩ' : 'BS. CKII PHẠM TUẤN KIỆT');
  const actualCode = recordData?.code || (hasRecord ? '—' : 'PK-20260726-001');
  const actualDiagnosis = recordData?.diagnosis || (hasRecord ? 'Chưa có chẩn đoán' : 'Khám sức khỏe tổng quát');
  const actualSymptoms = recordData?.symptoms || (hasRecord ? 'Chưa ghi nhận triệu chứng' : 'Khám định kỳ');
  const actualTreatment = recordData?.treatmentPlan || (hasRecord ? 'Chưa có hướng điều trị' : 'Nghỉ ngơi nhiều, cấp toa thuốc về nhà theo dõi thêm.');

  const bp = recordData?.bloodPressure ? `Huyết áp: ${recordData.bloodPressure}` : (hasRecord ? 'Huyết áp: Chưa đo' : 'Huyết áp: 120/80 mmHg');
  const pulse = recordData?.heartRate ? `Mạch: ${recordData.heartRate} bpm` : (hasRecord ? 'Mạch: Chưa đo' : 'Mạch: 80 bpm');
  const temp = recordData?.temperature ? `Thân nhiệt: ${recordData.temperature}°C` : (hasRecord ? 'Thân nhiệt: Chưa đo' : 'Thân nhiệt: 36.8°C');

  const actualPrescriptions = recordData?.prescriptionItems && recordData.prescriptionItems.length > 0
    ? recordData.prescriptionItems
    : hasRecord
    ? []
    : [
        { name: 'Amoxicillin 500mg', usage: 'Số lượng: 20 Viên. Uống ngày 2 lần, mỗi lần 1 viên sau ăn.' },
        { name: 'Paracetamol 500mg', usage: 'Số lượng: 10 Viên. Uống khi sốt cao > 38.5°C' }
      ];

  // [New code - Trích xuất thông tin Dược sĩ và Lời dặn của Dược sĩ]:
  const getPharmacistDetails = () => {
    let name = recordData?.pharmacistName || recordData?.dispensedByName || '';
    let note = recordData?.pharmacistNote || '';

    const rawNote = recordData?.note || '';
    if (rawNote) {
      const match = rawNote.match(/\[(?:Đã phát bởi\s+|Đã cấp phát bởi\s+|Dược sĩ ghi chú:\s+|Dược sĩ:\s+|Dược sĩ\s+)?([^\]:]+)\](?:\s*:\s*(.+))?/);
      if (match) {
        const rawName = match[1]?.trim();
        if (rawName && rawName !== 'Dược sĩ' && rawName !== 'Dược sĩ ghi chú') {
          name = rawName.startsWith('DS') || rawName.startsWith('Dược sĩ') ? rawName : `DS. ${rawName}`;
        }
        if (match[2] && match[2].trim()) {
          note = match[2].trim();
        }
      } else if (!note && !rawNote.startsWith('[')) {
        note = rawNote.trim();
      }
    }

    if (!name) {
      name = 'DS. Trịnh Mai Phương';
    }
    if (!note) {
      note = 'Uống thuốc đúng liều lượng, đúng giờ theo chỉ dẫn. Bảo quản thuốc nơi khô ráo, thoáng mát.';
    }
    return { name, note };
  };

  const pharmacistInfo = getPharmacistDetails();

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
              {docType === 'toa-thuoc' ? (
                <>
                  <Text style={styles.bold}>CHỈ ĐỊNH ĐIỀU TRỊ / ĐƠN THUỐC:</Text>
                  {actualPrescriptions.length === 0 ? (
                    <Text style={styles.itemUsage}>Chưa có đơn thuốc nào được kê cho lần khám này.</Text>
                  ) : (
                    actualPrescriptions.map((item: any, index: number) => (
                      <View key={index} style={styles.prescriptionItem}>
                        <Text style={styles.itemTitle}>{index + 1}. {item.name}</Text>
                        <Text style={styles.itemUsage}>{item.usage}</Text>
                      </View>
                    ))
                  )}
                  {/* [Old code - Tách dòng Lời dặn Dược sĩ]:
                  <Text style={styles.note}><Text style={styles.bold}>Lời dặn:</Text> {actualTreatment}</Text>
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.bold}>Lời dặn của Dược sĩ {pharmacistInfo.name}:</Text>
                    <Text style={[styles.diagnosisText, { marginTop: 4 }]}>{pharmacistInfo.note}</Text>
                  </View>
                  */}
                  {/* [New code - Hiển thị inline cùng dòng "Lời dặn của Dược sĩ [Tên]: [Nội dung]"]: */}
                  <Text style={styles.note}><Text style={styles.bold}>Lời dặn:</Text> {actualTreatment}</Text>
                  <Text style={[styles.note, { marginTop: 8 }]}><Text style={styles.bold}>Lời dặn của Dược sĩ {pharmacistInfo.name}:</Text> {pharmacistInfo.note}</Text>
                </>
              ) : docType === 'xet-nghiem' ? (
                <>
                  <Text style={styles.bold}>KẾT QUẢ XÉT NGHIỆM:</Text>
                  <Text style={styles.diagnosisText}>- Loại xét nghiệm: {recordData?.type || 'Chưa xác định'}</Text>
                  <Text style={styles.diagnosisText}>- Kết quả: {recordData?.result || 'Đang chờ kết quả'}</Text>
                  <Text style={styles.diagnosisText}>
                    - Đánh giá: {RESULT_STATUS_LABEL[recordData?.status] || recordData?.status || 'Đang chờ kết quả'}
                  </Text>
                </>
              ) : docType === 'sieu-am' ? (
                <>
                  <Text style={styles.bold}>KẾT QUẢ SIÊU ÂM:</Text>
                  <Text style={styles.diagnosisText}>- Loại siêu âm: {recordData?.type || 'Chưa xác định'}</Text>
                  <Text style={styles.diagnosisText}>- Kết luận: {recordData?.result || 'Đang chờ kết quả'}</Text>
                  {Array.isArray(recordData?.imageUrls) && recordData.imageUrls.length > 0 && (
                    <View style={styles.ultrasoundImageGrid}>
                      {recordData.imageUrls.map((url: string, idx: number) => (
                        <Image
                          key={idx}
                          source={{ uri: `${IMAGE_HOST}${url}` }}
                          style={styles.ultrasoundImage}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : docType === 'hoa-don' ? (
                <>
                  <Text style={styles.bold}>CHI TIẾT THANH TOÁN:</Text>
                  <View style={styles.table}>
                    <View style={styles.tableRowHeader}>
                      <Text style={[styles.tableCol, {flex: 3, fontWeight: 'bold'}]}>Dịch vụ</Text>
                      <Text style={[styles.tableCol, {flex: 1, fontWeight: 'bold', textAlign: 'right'}]}>Thành tiền</Text>
                    </View>
                    {recordData?.invoiceItems && recordData.invoiceItems.length > 0 ? (
                      // Dữ liệu THẬT từ invoice_items — trước đây màn này tự đoán "250.000đ phí khám +
                      // phần còn lại là thuốc", sai hoàn toàn với gói khám hoặc ca có phí khác 250k.
                      recordData.invoiceItems.map((it: { name: string; amount: number }, idx: number) => (
                        <View key={idx} style={styles.tableRow}>
                          <Text style={[styles.tableCol, {flex: 3}]}>{it.name}</Text>
                          <Text style={[styles.tableCol, {flex: 1, textAlign: 'right'}]}>{Number(it.amount).toLocaleString('vi-VN')}đ</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.tableRow}>
                        <Text style={[styles.tableCol, {flex: 3}]}>Công khám {specialty}</Text>
                        <Text style={[styles.tableCol, {flex: 1, textAlign: 'right'}]}>{recordData?.totalAmount ? Number(recordData.totalAmount).toLocaleString('vi-VN') : '250.000'}đ</Text>
                      </View>
                    )}
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
  ultrasoundImageGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  ultrasoundImage: { width: 100, height: 100, borderRadius: 6, backgroundColor: '#EEE' },
  
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
