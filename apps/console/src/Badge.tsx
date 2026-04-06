interface BadgeProps {
    label: string
    variant?: 'default' | 'success' | 'warning' | 'error'
    count?: number
}

export function Badge({ label, variant = 'default', count }: BadgeProps) {
    return (
        <span data-testid="badge" data-variant={variant}>
            <span data-testid="badge-label">{label}</span>
            {count !== undefined && count > 0 && (
                <span data-testid="badge-count">{count > 99 ? '99+' : count}</span>
            )}
        </span>
    )
}
