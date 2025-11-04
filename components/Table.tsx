import { HTMLAttributes } from 'react'

export function Table({ className = '', children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto scrollbar-thin">
      <table className={`w-full border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-stone-50 border-b border-stone-200 ${className}`} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-stone-100 ${className}`} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ className = '', children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`hover:bg-stone-50 transition-fintech ${className}`} {...props}>
      {children}
    </tr>
  )
}

export function TableHead({ className = '', children, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider ${className}`}
      style={{ lineHeight: '1.5' }}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ className = '', children, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`px-4 py-3.5 text-sm text-stone-900 ${className}`}
      style={{ lineHeight: '1.5' }}
      {...props}
    >
      {children}
    </td>
  )
}
