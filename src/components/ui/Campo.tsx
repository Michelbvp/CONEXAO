export function Campo({
  label,
  htmlFor,
  obrigatorio,
  ajuda,
  children,
}: {
  label: string
  htmlFor: string
  obrigatorio?: boolean
  ajuda?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-grafite-800">
        {label}
        {obrigatorio && <span className="text-prata-500"> *</span>}
      </label>
      {children}
      {ajuda && <p className="mt-1 text-xs text-prata-500">{ajuda}</p>}
    </div>
  )
}
