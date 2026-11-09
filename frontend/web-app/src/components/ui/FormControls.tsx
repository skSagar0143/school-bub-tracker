import { useEffect, useState } from 'react'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ChevronDown } from 'lucide-react'

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


type TimeInputProps = {
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  id?: string
  placeholder?: string
}
export function TimeInput({ value, onChange, required, disabled, id, placeholder = 'Select time' }: TimeInputProps) {
  const [open, setOpen] = useState(false)
  const [parsedHour, parsedMinute] = value.split(':').map(Number)
  const hour24 = Number.isFinite(parsedHour) ? parsedHour : 7
  const minuteValue = Number.isFinite(parsedMinute) ? parsedMinute : 0
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  const display = value ? `${String(hour12).padStart(2, '0')}:${String(minuteValue).padStart(2, '0')} ${period}` : ''
  const updateTime = (hour: number, minute: number, meridiem: string) => {
    const normalizedHour = hour % 12 + (meridiem === 'PM' ? 12 : 0)
    onChange(`${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  }

  return <div className="time-input-wrap">
    <button
      type="button"
      id={id}
      className="ui-input time-trigger"
      onClick={() => setOpen(current => !current)}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-required={required}
      disabled={disabled}
    >
      <span className={display ? '' : 'date-placeholder'}>{display || placeholder}</span>
      <span className="time-trigger-icon"><Clock3 size={17}/><ChevronDown size={14}/></span>
    </button>
    {open && <div className="time-popover" role="dialog" aria-label="Choose time">
      <div className="time-popover-heading">Choose a time</div>
      <div className="time-selectors">
        <label><span>Hour</span><select aria-label="Hour" value={hour12} onChange={event => updateTime(Number(event.target.value), minuteValue, period)}>{Array.from({length:12},(_,index)=>index+1).map(hour=><option key={hour} value={hour}>{String(hour).padStart(2,'0')}</option>)}</select></label>
        <span className="time-separator">:</span>
        <label><span>Minute</span><select aria-label="Minute" value={minuteValue} onChange={event => updateTime(hour12, Number(event.target.value), period)}>{Array.from({length:60},(_,minute)=>minute).map(minute=><option key={minute} value={minute}>{String(minute).padStart(2,'0')}</option>)}</select></label>
        <label className="time-period"><span>Period</span><select aria-label="AM or PM" value={period} onChange={event => updateTime(hour12, minuteValue, event.target.value)}><option value="AM">AM</option><option value="PM">PM</option></select></label>
      </div>
      <div className="time-popover-footer">
        <button type="button" onClick={() => { const now = new Date(); onChange(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`); setOpen(false) }}>Use current time</button>
        <button type="button" className="time-done" onClick={() => setOpen(false)}>Done</button>
      </div>
    </div>}
  </div>
}

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
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: Math.max(141, currentYear + 21 - Math.min(1900, view.getFullYear())) }, (_, index) => Math.min(1900, view.getFullYear()) + index)
  const display = value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''
  return <div className="date-input-wrap">
    <button type="button" className="ui-input date-trigger" onClick={() => setOpen(v=>!v)} aria-expanded={open} aria-required={props.required} disabled={props.disabled} id={props.id}>
      <span className={display ? '' : 'date-placeholder'}>{display || props.placeholder || 'Choose a date'}</span><CalendarDays size={17}/>
    </button>
    {open && <div className="date-popover">
      <div className="date-calendar-head"><button type="button" aria-label="Previous month" onClick={()=>setView(new Date(view.getFullYear(),view.getMonth()-1,1))}><ChevronLeft size={17}/></button><div className="date-calendar-selectors"><select aria-label="Select month" value={view.getMonth()} onChange={event=>setView(new Date(view.getFullYear(),Number(event.target.value),1))}>{Array.from({length:12},(_,month)=><option key={month} value={month}>{new Date(2000,month,1).toLocaleDateString("en-IN",{month:"long"})}</option>)}</select><select aria-label="Select year" value={view.getFullYear()} onChange={event=>setView(new Date(Number(event.target.value),view.getMonth(),1))}>{years.map(year=><option key={year} value={year}>{year}</option>)}</select></div><button type="button" aria-label="Next month" onClick={()=>setView(new Date(view.getFullYear(),view.getMonth()+1,1))}><ChevronRight size={17}/></button></div>
      <div className="date-calendar-grid">{['Mo','Tu','We','Th','Fr','Sa','Su'].map(day=><span className="date-weekday" key={day}>{day}</span>)}{cells.map((day,index)=>day ? <button type="button" key={index} className={value===toIso(new Date(view.getFullYear(),view.getMonth(),day))?'selected':''} onClick={()=>{onChange(toIso(new Date(view.getFullYear(),view.getMonth(),day)));setOpen(false)}}>{day}</button> : <span key={index}/>)}</div>
      <div className="date-calendar-foot"><button type="button" onClick={()=>{onChange(toIso(new Date()));setView(new Date());setOpen(false)}}>Today</button><button type="button" onClick={()=>{onChange('');setOpen(false)}}>Clear date</button></div>
    </div>}
  </div>
}
