import { useEffect, useState } from 'react'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'

type FieldProps = { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode; className?: string }
export function FormField({ label, required, hint, error, children, className = '' }: FieldProps) {
  return <label className={`field form-field ${className}`}><span>{label}{required && <b className="required-mark"> *</b>}</span>{children}{hint && <small className="field-hint">{hint}</small>}{error && <small className="field-error">{error}</small>}</label>
}

type InputProps = InputHTMLAttributes<HTMLInputElement>
export function TextInput(props: InputProps) { return <input {...props} className={`ui-input ${props.className || ''}`} /> }
export function NumberInput(props: InputProps) { return <input type="number" {...props} className={`ui-input ${props.className || ''}`} /> }
export function EmailInput(props: InputProps) { return <input type="email" {...props} className={`ui-input ${props.className || ''}`} /> }
export function PasswordInput(props: InputProps) { return <input type="password" {...props} className={`ui-input ${props.className || ''}`} /> }
export function PhoneInput(props: InputProps) { return <input type="tel" inputMode="tel" {...props} className={`ui-input ${props.className || ''}`} /> }
export function FileInput(props: InputProps) { return <input type="file" {...props} className={`ui-input ui-file-input ${props.className || ''}`} /> }

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>
export function SelectInput(props: SelectProps) { return <select {...props} className={`ui-input ui-select ${props.className || ''}`} /> }
type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>
export function TextArea(props: AreaProps) { return <textarea {...props} className={`ui-input ui-textarea ${props.className || ''}`} /> }
export function SearchInput(props: InputProps) { return <input type="search" {...props} className={`ui-input ui-search-input ${props.className || ''}`} /> }

type DateInputProps = Omit<InputProps, 'type' | 'value' | 'onChange'> & { value: string; onChange: (value: string) => void }
const pad = (value: number) => String(value).padStart(2, '0')
const toIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
export function DateInput({ value, onChange, ...props }: DateInputProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => value ? new Date(`${value}T12:00:00`) : new Date())
  useEffect(() => { if (value) setView(new Date(`${value}T12:00:00`)) }, [value])
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const days = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate()
  const offset = (first.getDay()+6)%7
  const cells = Array.from({length: Math.ceil((offset+days)/7)*7}, (_,i) => {
    const day = i-offset+1
    return day > 0 && day <= days ? day : null
  })
  const monthLabel = view.toLocaleDateString('en-IN', {month:'long', year:'numeric'})
  const display = value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''
  return <div className="date-input-wrap">
    <button type="button" className="ui-input date-trigger" onClick={() => setOpen(v=>!v)} aria-expanded={open}>
      <span className={display ? '' : 'date-placeholder'}>{display || props.placeholder || 'Choose a date'}</span><CalendarDays size={17}/>
    </button>
    {open && <div className="date-popover">
      <div className="date-calendar-head"><button type="button" aria-label="Previous month" onClick={()=>setView(new Date(view.getFullYear(),view.getMonth()-1,1))}><ChevronLeft size={17}/></button><strong>{monthLabel}</strong><button type="button" aria-label="Next month" onClick={()=>setView(new Date(view.getFullYear(),view.getMonth()+1,1))}><ChevronRight size={17}/></button></div>
      <div className="date-calendar-grid">{['Mo','Tu','We','Th','Fr','Sa','Su'].map(day=><span className="date-weekday" key={day}>{day}</span>)}{cells.map((day,index)=>day ? <button type="button" key={index} className={value===toIso(new Date(view.getFullYear(),view.getMonth(),day))?'selected':''} onClick={()=>{onChange(toIso(new Date(view.getFullYear(),view.getMonth(),day)));setOpen(false)}}>{day}</button> : <span key={index}/>)}</div>
      <div className="date-calendar-foot"><button type="button" onClick={()=>{onChange(toIso(new Date()));setView(new Date());setOpen(false)}}>Today</button><button type="button" onClick={()=>{onChange('');setOpen(false)}}>Clear date</button></div>
    </div>}
  </div>
}
