interface NotificationProps {
    message: string
    type: 'success' | 'error' | 'info'
}

export function Notification({ message, type }: NotificationProps) {
    return (
        <div data-testid="notification" data-type={type}>
            <span data-testid="notification-message">{message}</span>
            <button data-testid="notification-close">닫기</button>
        </div>
    )
}
