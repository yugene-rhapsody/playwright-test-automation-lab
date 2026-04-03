import { useState } from 'react'

export function Counter() {
    const [count, setCount] = useState(0)
    const [step, setStep] = useState(1)

    return (
        <div>
            <h2>Counter</h2>
            <p data-testid="count">Count: {count}</p>
            <div>
                <label>
                    Step:
                    <input
                        data-testid="step-input"
                        type="number"
                        value={step}
                        onChange={e => setStep(Number(e.target.value))}
                        min={1}
                    />
                </label>
            </div>
            <button onClick={() => setCount(count + step)}>Increment</button>
            <button onClick={() => setCount(count - step)}>Decrement</button>
            <button onClick={() => setCount(0)}>Reset</button>
            <button onClick={() => setCount(count * 2)}>Double</button>
        </div>
    )
}
