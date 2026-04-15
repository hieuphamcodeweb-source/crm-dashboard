export default function StatsCard({ icon, label, value, trend, trendLabel, extra }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl px-6 py-5 flex-1 min-w-0">
      <div className="w-14 h-14 rounded-full bg-[#e6faf2] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-800 leading-none mb-1">{value}</p>
        {trend && (
          <div className="flex items-center gap-1">
            {trend === 'up' ? (
              <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
            <span className={`text-xs font-semibold ${trend === 'up' ? 'text-emerald-500' : 'text-red-400'}`}>
              {trendLabel}
            </span>
            <span className="text-xs text-gray-400">this month</span>
          </div>
        )}
        {extra && <div className="mt-1">{extra}</div>}
      </div>
    </div>
  );
}
