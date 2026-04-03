interface HeaderProps {
    userName?: string
    onLogout?: () => void
}

export function Header({ userName, onLogout }: HeaderProps) {
    return (
        <header data-testid="header">
            <h1>Adrop Console</h1>
            <nav>
                <a href="/dashboard">Dashboard</a>
                <a href="/campaigns">Campaigns</a>
                <a href="/settings">Settings</a>
            </nav>
            {userName && (
                <div data-testid="user-info">
                    <span data-testid="user-name">{userName}</span>
                    <button data-testid="logout-button" onClick={onLogout}>로그아웃</button>
                </div>
            )}
        </header>
    )
}
