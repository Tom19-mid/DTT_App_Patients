import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, SHADOWS } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useCustomAlert } from "../context/AlertContext";
import { useSettings } from "../context/SettingsContext";
import { apiPatients } from "../services/apiService";

const PatientProfilesScreen = ({ navigation }: any) => {
  const { profiles, currentUser, updateProfile, setIsVerified } = useAuth();
  const { showAlert } = useCustomAlert();
  const { isDarkMode, t } = useSettings();

  // Mỗi khi màn hình được focus, tự động refresh trạng thái xác thực từ server
  // → Bệnh nhân sẽ thấy "Đã xác thực" ngay sau khi Lễ Tân duyệt CCCD mà không cần đăng xuất
  useFocusEffect(
    useCallback(() => {
      const refreshStatuses = async () => {
        if (!currentUser?.patientId) return;
        try {
          const result = await apiPatients.refreshVerificationStatus(
            currentUser.patientId,
          );
          if (
            result.verified &&
            currentUser.verificationStatus !== "verified"
          ) {
            // Cập nhật trạng thái isVerified trong AuthContext → UI toàn app refresh
            setIsVerified(true);
            // Cập nhật trạng thái hồ sơ chủ trong danh sách hồ sơ
            const ownerProfile = profiles.find((p) => p.isOwner);
            if (ownerProfile) {
              updateProfile(ownerProfile.id, {
                verificationStatus: "verified",
                isVerified: true,
              });
            }
          }
        } catch {}
      };
      refreshStatuses();
    }, [currentUser?.patientId, currentUser?.verificationStatus]),
  );

  const handleAddNewProfile = () => {
    navigation.navigate("ProfileDetail", { isNew: true });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, isDarkMode && { backgroundColor: "#1F2937" }]}
    >
      <View
        style={[
          styles.header,
          isDarkMode && {
            backgroundColor: "#1F2937",
            borderBottomColor: "#374151",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkMode ? "#F3F4F6" : COLORS.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && { color: "#F3F4F6" }]}>
          {t("patient_records_management")}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("QRScanner")}
            style={styles.headerBtn}
          >
            <Ionicons
              name="qr-code-outline"
              size={22}
              color={isDarkMode ? "#818CF8" : COLORS.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddNewProfile}
            style={styles.headerBtn}
          >
            <Ionicons
              name="add-circle"
              size={26}
              color={isDarkMode ? "#818CF8" : COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View
          style={[
            styles.alertBox,
            isDarkMode && { backgroundColor: "rgba(14, 165, 233, 0.2)" },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={isDarkMode ? "#38BDF8" : "#0284C7"}
          />
          <Text style={[styles.alertText, isDarkMode && { color: "#38BDF8" }]}>
            {t("manage_records_desc")}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, isDarkMode && { color: "#F3F4F6" }]}>
          {t("records_list")} ({profiles.length})
        </Text>

        {profiles.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            style={[
              styles.profileCard,
              SHADOWS.card,
              isDarkMode && { backgroundColor: "#374151" },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate("ProfileDetail", { profileId: profile.id })
            }
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="person-circle"
                  size={40}
                  color={isDarkMode ? "#818CF8" : COLORS.primary}
                  style={{ marginRight: 10 }}
                />
                <View>
                  <Text
                    style={[
                      styles.profileName,
                      isDarkMode && { color: "#F3F4F6" },
                    ]}
                  >
                    {profile.name}
                  </Text>
                  <Text
                    style={[
                      styles.profileId,
                      isDarkMode && { color: "#9CA3AF" },
                    ]}
                  >
                    {profile.patientId}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      profile.relationship === "Bản thân"
                        ? isDarkMode
                          ? "rgba(99, 102, 241, 0.2)"
                          : "#EEF2FF"
                        : isDarkMode
                          ? "#4B5563"
                          : "#F3F4F6",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color:
                        profile.relationship === "Bản thân"
                          ? isDarkMode
                            ? "#818CF8"
                            : COLORS.primary
                          : isDarkMode
                            ? "#D1D5DB"
                            : COLORS.placeholder,
                    },
                  ]}
                >
                  {/* {profile.relationship === 'Bản thân' ? t('self') : t('father')} */}
                  {profile.relationship === "Bản thân"
                    ? t("self")
                    : profile.relationship || "Người thân"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.cardDivider,
                isDarkMode && { backgroundColor: "#4B5563" },
              ]}
            />

            <View style={styles.cardFooter}>
              {(() => {
                const status =
                  profile.verificationStatus ||
                  (profile.isVerified ? "verified" : "pending");
                let color = isDarkMode ? "#FBBF24" : "#F59E0B";
                let iconName: any = "time";
                let textKey = "unverified";
                let label = t("unverified") || "Đang chờ xác thực";

                if (status === "verified") {
                  color = isDarkMode ? "#34D399" : "#10B981";
                  iconName = "checkmark-circle";
                  label = t("verified") || "Đã xác thực";
                } else if (status === "rejected") {
                  color = isDarkMode ? "#F87171" : "#EF4444";
                  iconName = "close-circle";
                  label = "Bị từ chối";
                }

                return (
                  <View style={styles.statusBox}>
                    <Ionicons name={iconName} size={18} color={color} />
                    <Text style={[styles.statusText, { color }]}>{label}</Text>
                  </View>
                );
              })()}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDarkMode ? "#9CA3AF" : COLORS.placeholder}
              />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.addButton,
            SHADOWS.card,
            isDarkMode && {
              backgroundColor: "#374151",
              borderColor: "#4B5563",
            },
          ]}
          activeOpacity={0.7}
          onPress={handleAddNewProfile}
        >
          <Ionicons
            name="add"
            size={24}
            color={isDarkMode ? "#818CF8" : COLORS.primary}
          />
          <Text
            style={[styles.addButtonText, isDarkMode && { color: "#818CF8" }]}
          >
            {t("add_new_record")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerBtn: { padding: 2 },
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  alertBox: {
    flexDirection: "row",
    backgroundColor: "#E0F2FE",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: "#0369A1",
    lineHeight: 20,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 2,
  },
  profileId: {
    fontSize: 13,
    color: COLORS.placeholder,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 8,
  },
});

export default PatientProfilesScreen;
