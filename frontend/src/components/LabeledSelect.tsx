import type { SelectOption } from '../types'

interface LabeledSelectProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function LabeledSelect({ label, value, options, onChange, disabled }: LabeledSelectProps) {
  return (
    <label className="year-picker">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`Select ${label.toLowerCase()}`}
        disabled={disabled ?? options.length === 0}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
