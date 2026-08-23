/**
 * signalrService.ts
 *
 * Kênh real-time (SignalR) tới DTT_API_Back_end/Hubs/NotificationHub.cs — trước đây toàn bộ app chỉ
 * có REST polling (chỉ thấy thông báo mới/khi tự mở lại màn hình), đúng như QA report "Ko có hiện
 * thông báo real-time" và "Tài khoản đã xác thực hoặc từ chối ko có hiện real-time".
 *
 * Chỉ 2 sự kiện: "NotificationsChanged" (có thông báo mới — component tự gọi lại REST GET để lấy nội
 * dung mới nhất, tránh trùng lặp DTO giữa REST và hub) và "VerificationStatusChanged" (trạng thái xác
 * thực CCCD vừa đổi, kèm sẵn giá trị mới để cập nhật UI ngay không cần gọi thêm API).
 */
import * as signalR from '@microsoft/signalr';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from './apiService';

const TOKEN_KEY = 'dtt_user_token';
const HUB_URL = `${BASE_URL.replace(/\/api\/?$/, '')}/hubs/notifications`;

let connection: signalR.HubConnection | null = null;

export const connectNotificationHub = async (handlers: {
  onNotificationsChanged?: () => void;
  onVerificationStatusChanged?: (data: { verificationStatus: string }) => void;
}): Promise<void> => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return;

    if (connection) {
      await disconnectNotificationHub();
    }

    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
        // React Native's fetch/XHR shims xử lý handshake "negotiate" + SSE/LongPolling fallback không
        // ổn định — bỏ qua negotiate, dùng thẳng WebSocket (RN có sẵn WebSocket native, đáng tin cậy hơn).
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    if (handlers.onNotificationsChanged) {
      connection.on('NotificationsChanged', handlers.onNotificationsChanged);
    }
    if (handlers.onVerificationStatusChanged) {
      connection.on('VerificationStatusChanged', handlers.onVerificationStatusChanged);
    }

    await connection.start();
  } catch (err) {
    // Real-time là tính năng tăng cường, KHÔNG được để lỗi kết nối làm crash app hay chặn luồng
    // chính — app vẫn hoạt động bình thường qua REST polling nếu hub không kết nối được (offline,
    // server chưa hỗ trợ WebSocket qua proxy, v.v).
    console.log('[SignalR] Connection failed (non-fatal, falls back to polling):', err);
  }
};

export const disconnectNotificationHub = async (): Promise<void> => {
  if (connection) {
    try {
      await connection.stop();
    } catch { /* ignore */ }
    connection = null;
  }
};
