import { useEffect, useState } from 'react'

interface NotificationProps {
    message: string
    type: 'success' | 'error' | 'info'
    autoDismiss?: number
    onDismiss?: () => void
}

export function Notification({ message, type, autoDismiss, onDismiss }: NotificationProps) {
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        if (!autoDismiss) return
        const timer = setTimeout(() => {
            setVisible(false)
            onDismiss?.()
        }, autoDismiss)
        return () => clearTimeout(timer)
    }, [autoDismiss, onDismiss])

    if (!visible) return null

    return (
        <div data-testid="notification" data-type={type}>
            <span data-testid="notification-message">{message}</span>
            <button data-testid="notification-close" onClick={() => { setVisible(false); onDismiss?.() }}>닫기</button>
        </div>
    )
}
