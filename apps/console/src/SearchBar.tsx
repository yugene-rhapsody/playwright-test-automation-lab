import { useState } from 'react'

interface SearchBarProps {
    onSearch: (query: string) => void
    placeholder?: string
}

export function SearchBar({ onSearch, placeholder = '검색어 입력' }: SearchBarProps) {
    const [query, setQuery] = useState('')

    const handleSubmit = () => {
        if (query.trim()) {
            onSearch(query.trim())
        }
    }

    const handleClear = () => {
        setQuery('')
        onSearch('')
    }

    return (
        <div data-testid="search-bar">
            <input
                data-testid="search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={placeholder}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button onClick={handleSubmit} data-testid="search-submit">검색</button>
            {query && <button onClick={handleClear} data-testid="search-clear">초기화</button>}
        </div>
    )
}
