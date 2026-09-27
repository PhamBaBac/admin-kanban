const CHANNEL_NAME = "admin_notification_sync_channel";

export interface SyncMessage {
  type: "READ" | "READ_ALL" | "DELETED" | "CLEAR_READ" | "NEW";
  payload?: any;
}

let channel: BroadcastChannel | null = null;

try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn("BroadcastChannel not supported", e);
}

export const postNotificationSync = (message: SyncMessage) => {
  try {
    if (channel) {
      channel.postMessage(message);
    }
  } catch (e) {
    console.warn("Failed to post message to notification broadcast channel", e);
  }
};

export const subscribeNotificationSync = (callback: (msg: SyncMessage) => void) => {
  if (!channel) return () => {};
  const handler = (event: MessageEvent<SyncMessage>) => {
    if (event.data) {
      callback(event.data);
    }
  };
  channel.addEventListener("message", handler);
  return () => {
    channel?.removeEventListener("message", handler);
  };
};
