interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    return (
        <nav data-testid="pagination">
            <button
                data-testid="prev-page"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                이전
            </button>
            <span data-testid="page-info">{currentPage} / {totalPages}</span>
            <button
                data-testid="next-page"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                다음
            </button>
        </nav>
    )
}
