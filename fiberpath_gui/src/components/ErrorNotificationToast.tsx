import { useErrorNotification } from "../contexts/ErrorNotificationContext";
import "../styles/notifications.css";

export function ErrorNotificationToast() {
  const { notifications, dismissNotification } = useErrorNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          role="alert"
          aria-live="assertive"
        >
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === "error" && "✕"}
              {notification.type === "warning" && "⚠"}
              {notification.type === "info" && "ℹ"}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
          <button
            className="notification-close"
            onClick={() => dismissNotification(notification.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
