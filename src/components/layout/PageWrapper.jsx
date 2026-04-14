export default function PageWrapper({ title, subtitle, actions, children }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Page header */}
      {(title || actions) && (
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div>
            {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
        </div>
      )}

      {/* Page content */}
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  )
}
