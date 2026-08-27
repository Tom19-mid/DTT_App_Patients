import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { apiAppointment, apiHealthPackage } from "../services/apiService";
import { useCustomAlert } from "../context/AlertContext";

const PACKAGE_TIME_SLOTS = [
  "07:30 - 08:30",
  "08:30 - 09:30",
  "09:30 - 10:30",
  "10:30 - 11:30",
  "13:30 - 14:30",
  "14:30 - 15:30",
  "15:30 - 16:30",
];

const ConfirmBookingScreen = ({ route, navigation }: any) => {
  const {
    type = "doctor",
    doctorName,
    specialty,
    specialtyName,
    date,
    time,
    timeSlot,
    packageName,
    price,
    fee,
    doctorId,
    specialtyId,
    packageId,
  } = route.params || {};
  const finalSpecialty = specialty || specialtyName || "Nội tổng quát";
  const finalTime = time || timeSlot || "08:30 - 09:30";
  const finalPrice = price || fee || "250.000đ";

  // Tạo danh sách 14 ngày khám tiếp theo bắt đầu từ ngày mai cho Gói khám
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayOfWeek = dayNames[d.getDay()];
      const dateNum = d.getDate().toString().padStart(2, "0");
      const monthNum = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      const formatted = `${dateNum}/${monthNum}/${year}`;

      dates.push({
        key: formatted,
        formatted,
        dayOfWeek,
        dateNum,
        monthNum,
        displayLabel: i === 1 ? "Ngày mai" : dayOfWeek,
        isTomorrow: i === 1,
      });
    }
    return dates;
  }, []);

  // State ngày & giờ đã chọn cho Gói khám (mặc định ngày mai & slot sáng sớm)
  const [selectedPackageDate, setSelectedPackageDate] = useState<string>(
    date || availableDates[0]?.formatted || "26/08/2026",
  );
  const [selectedPackageTime, setSelectedPackageTime] = useState<string>(
    time || timeSlot || "08:30 - 09:30",
  );

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const { addRecentService, currentUser } = useAuth();
  const { showAlert } = useCustomAlert();

  const handleConfirm = async () => {
    // type === 'doctor' phải có doctorId thật — trước đây fallback `doctorId || 1` âm thầm đặt lịch
    // với Bác sĩ #1 bất kể bệnh nhân chọn ai, nếu màn trước đó (vd: "Đã dùng gần đây") lỡ không
    // truyền doctorId qua route params.
    // if (type === "doctor" && !doctorId) {
    // 1. Kiểm tra với lịch khám Bác sĩ
    if (type === "doctor") {
      if (!doctorId) {
        showAlert({
          title: "Thiếu thông tin bác sĩ",
          message:
            "Không xác định được bác sĩ cần đặt lịch. Vui lòng quay lại và chọn bác sĩ/khung giờ lại.",
          type: "error",
        });
        return;
      }
      if (!date) {
        showAlert({
          title: "Thiếu ngày khám",
          message:
            "Không xác định được ngày khám. Vui lòng quay lại và chọn lại khung giờ.",
          type: "error",
        });
        return;
      }
    }
    // 2. Kiểm tra với Gói khám
    else if (type === "package") {
      if (!packageId) {
        showAlert({
          title: "Thiếu thông tin gói khám",
          message:
            "Không xác định được gói khám cần đặt. Vui lòng quay lại và chọn lại gói khám.",
          type: "error",
        });
        return;
      }
      if (!selectedPackageDate) {
        showAlert({
          title: "Chưa chọn ngày khám",
          message: "Vui lòng chọn ngày bạn muốn đến khám gói dịch vụ.",
          type: "error",
        });
        return;
      }
      if (!selectedPackageTime) {
        showAlert({
          title: "Chưa chọn khung giờ",
          message: "Vui lòng chọn khung giờ khám phù hợp.",
          type: "error",
        });
        return;
      }
    }

    // 3. Kiểm tra tài khoản bệnh nhân
    if (!currentUser?.patientId) {
      showAlert({
        title: "Chưa đăng nhập",
        message: "Vui lòng đăng nhập tài khoản bệnh nhân để tiếp tục đặt lịch.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // Connect to Backend ASP.NET Core API -> PostgreSQL Server
      let res: any;
      if (type === "package" && packageId) {
        res = await apiHealthPackage.bookPackage(packageId, {
          patientId: currentUser?.patientId,
          patientName: currentUser?.fullName || "Bệnh nhân",
          preferredDate: selectedPackageDate,
          preferredTimeSlot: selectedPackageTime,
          priceFormatted: finalPrice,
        });
      } else {
        res = await apiAppointment.createAppointment({
          patientId: currentUser?.patientId,
          doctorId,
          doctorName: doctorName || "BS. CK1 Nguyễn Văn A",
          specialtyName: finalSpecialty,
          date,
          timeSlot: finalTime,
          fee: finalPrice,
        });
      }

      setBookingResult(res);

      // Record into dynamic Recent Services
      if (type === "doctor") {
        addRecentService({
          name: doctorName || "Bác sĩ chuyên khoa",
          detail: specialty || "Nội tổng quát",
          icon: "user-md",
          type: "doctor",
          doctorName,
          specialtyName: specialty,
          doctorId,
          specialtyId,
        });
      } else {
        addRecentService({
          name: packageName || "Gói khám sức khỏe",
          detail: price || "DTT Healthcare",
          icon: "medkit",
          type: "package",
        });
      }

      setSuccessModalVisible(true);
    } catch (error: any) {
      console.log("Error creating appointment:", error);
      // KHÔNG được hiện modal "Đặt lịch thành công" giả khi request thực sự thất bại (vd: lỗi mạng,
      // 403 do phiên đăng nhập có vấn đề) — trước đây luôn hiện thành công với queueNumber giả, khiến
      // bệnh nhân tưởng đã có lịch hẹn trong khi thực tế chưa được đặt.
      showAlert({
        title: "Đặt lịch thất bại",
        message:
          error?.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    navigation.navigate("MainTabs", { screen: "Calendar" });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === "package" ? "Xác nhận Đặt gói khám" : "Xác nhận Đặt lịch"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Thông tin Gói khám / Bác sĩ ── */}
        <Text style={styles.sectionTitle}>
          {type === "package" ? "Thông tin Gói khám" : "Thông tin Lịch khám"}
        </Text>

        <View style={[styles.card, SHADOWS.card]}>
          {type === "doctor" ? (
            <>
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.infoText}>
                  <Text style={styles.label}>Bác sĩ: </Text>
                  {doctorName || "BS. CK1 Nguyễn Văn A"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="medkit-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.infoText}>
                  <Text style={styles.label}>Chuyên khoa: </Text>
                  {finalSpecialty}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.infoText}>
                  <Text style={styles.label}>Ngày khám: </Text>
                  {date || "25/07/2026"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.infoText}>
                  <Text style={styles.label}>Khung giờ: </Text>
                  {finalTime}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons
                  name="medkit-outline"
                  size={22}
                  color={COLORS.primary}
                />
                <Text style={styles.infoText}>
                  <Text style={styles.label}>Tên gói khám: </Text>
                  {packageName}
                </Text>
              </View>
            </>
          )}

          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Phí khám (Dự kiến)</Text>
            <Text style={styles.priceValue}>{finalPrice}</Text>
          </View>
        </View>

        {/* ── Bộ chọn Ngày & Giờ dành riêng cho Gói khám ── */}
        {type === "package" && (
          <>
            {/* Chọn Ngày Khám */}
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="calendar" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitleWithIcon}>
                Chọn ngày khám mong muốn
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScrollContainer}
            >
              {availableDates.map((item) => {
                const isSelected = selectedPackageDate === item.formatted;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dateCard,
                      isSelected && styles.dateCardActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPackageDate(item.formatted)}
                  >
                    <Text
                      style={[
                        styles.dateDayName,
                        isSelected && styles.dateDayNameActive,
                      ]}
                    >
                      {item.displayLabel}
                    </Text>
                    <Text
                      style={[
                        styles.dateNumber,
                        isSelected && styles.dateNumberActive,
                      ]}
                    >
                      {item.dateNum}
                    </Text>
                    <Text
                      style={[
                        styles.dateMonth,
                        isSelected && styles.dateMonthActive,
                      ]}
                    >
                      Th{item.monthNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Chọn Khung Giờ Khám */}
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="time" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitleWithIcon}>
                Chọn khung giờ khám
              </Text>
            </View>

            <View style={styles.timeSlotsGrid}>
              {PACKAGE_TIME_SLOTS.map((slot) => {
                const isSelected = selectedPackageTime === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeSlotChip,
                      isSelected && styles.timeSlotChipActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPackageTime(slot)}
                  >
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "time-outline"}
                      size={15}
                      color={isSelected ? "#fff" : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextActive,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tóm tắt lịch hẹn đã chọn */}
            <View style={styles.summaryBox}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.summaryText}>
                Lịch khám đã chọn:{" "}
                <Text style={styles.summaryBold}>{selectedPackageDate}</Text>{" "}
                (khung giờ{" "}
                <Text style={styles.summaryBold}>{selectedPackageTime}</Text>)
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>
              {type === "package"
                ? "Xác nhận Đặt gói khám"
                : "Xác nhận Đặt lịch"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleSuccessClose}
        >
          <View
            style={[styles.modalBox, SHADOWS.card]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.successIconBox}>
              <Ionicons
                name="checkmark-circle-sharp"
                size={64}
                color="#10B981"
              />
            </View>
            <Text style={styles.modalTitle}>Đặt lịch thành công!</Text>
            <Text style={styles.modalMessage}>
              {type === "package"
                ? `Gói khám "${packageName || "sức khỏe"}" đã được đăng ký thành công vào ngày ${selectedPackageDate} (${selectedPackageTime}).\n\nMã số thứ tự của bạn là `
                : `Lịch khám của bạn đã được ghi nhận trên hệ thống DTT Healthcare vào ngày ${date} (${finalTime}).\n\nMã số thứ tự của bạn là `}
              <Text style={{ fontWeight: "bold", color: COLORS.primary }}>
                #{bookingResult?.queueNumber || 1}
              </Text>
              .
            </Text>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={handleSuccessClose}
            >
              <Text style={styles.modalBtnText}>Xem lịch khám của tôi</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  container: {
    padding: 16,
    paddingBottom: 36,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitleWithIcon: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  label: {
    fontWeight: "600",
    color: COLORS.subtext,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.subtext,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  dateScrollContainer: {
    paddingVertical: 4,
    marginBottom: 16,
    gap: 8,
  },
  dateCard: {
    width: 68,
    height: 84,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
    marginRight: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.03 }],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dateDayName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.subtext,
    marginBottom: 2,
  },
  dateDayNameActive: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  dateNumberActive: {
    color: "#fff",
  },
  dateMonth: {
    fontSize: 11,
    color: COLORS.subtext,
  },
  dateMonthActive: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  timeSlotChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  timeSlotChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  timeSlotTextActive: {
    color: "#fff",
  },
  summaryBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 8,
  },
  summaryText: {
    fontSize: 13,
    color: "#1E40AF",
    flex: 1,
    lineHeight: 18,
  },
  summaryBold: {
    fontWeight: "700",
    color: "#1E3A8A",
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 4,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 340,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
  },
  successIconBox: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBtn: {
    backgroundColor: COLORS.primary,
    width: "100%",
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default ConfirmBookingScreen;
