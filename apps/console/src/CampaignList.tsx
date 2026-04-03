import { useState } from 'react'

interface Campaign {
    id: string
    name: string
    status: 'draft' | 'active' | 'paused'
    budget: number
}

export function CampaignList() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [filter, setFilter] = useState<string>('all')

    const filtered = filter === 'all'
        ? campaigns
        : campaigns.filter(c => c.status === filter)

    const totalBudget = filtered.reduce((sum, c) => sum + c.budget, 0)

    return (
        <div>
            <h2>캠페인 관리</h2>
            <div>
                <button onClick={() => setFilter('all')} data-testid="filter-all">전체</button>
                <button onClick={() => setFilter('active')} data-testid="filter-active">활성</button>
                <button onClick={() => setFilter('paused')} data-testid="filter-paused">일시정지</button>
            </div>
            <p data-testid="campaign-count">{filtered.length}개 캠페인</p>
            <p data-testid="total-budget">총 예산: {totalBudget.toLocaleString()}원</p>
            <ul data-testid="campaign-list">
                {filtered.map(c => (
                    <li key={c.id} data-testid={`campaign-${c.id}`}>
                        <span>{c.name}</span>
                        <span data-testid={`status-${c.id}`}>{c.status}</span>
                        <span>{c.budget.toLocaleString()}원</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
