import { useState } from 'react'

interface Todo {
    id: number
    text: string
    completed: boolean
}

export function TodoList() {
    const [todos, setTodos] = useState<Todo[]>([])
    const [input, setInput] = useState('')

    const addTodo = () => {
        if (!input.trim()) return
        setTodos([...todos, { id: Date.now(), text: input, completed: false }])
        setInput('')
    }

    const toggleTodo = (id: number) => {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    }

    const deleteTodo = (id: number) => {
        setTodos(todos.filter(t => t.id !== id))
    }

    return (
        <div>
            <h2>Todo List</h2>
            <div>
                <input
                    data-testid="todo-input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="할 일 입력"
                />
                <button onClick={addTodo}>추가</button>
            </div>
            <ul data-testid="todo-list">
                {todos.map(todo => (
                    <li key={todo.id} data-testid={`todo-${todo.id}`}>
                        <span
                            style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
                            onClick={() => toggleTodo(todo.id)}
                        >
                            {todo.text}
                        </span>
                        <button onClick={() => deleteTodo(todo.id)}>삭제</button>
                    </li>
                ))}
            </ul>
            <p data-testid="todo-count">{todos.filter(t => !t.completed).length}개 남음</p>
        </div>
    )
}
