import React from "react";

export function KpiCard({ n, l, dLabel, dType }: { n: string | React.ReactNode, l: string, dLabel: string, dType: 'up' | 'warn' | 'neutral' }) {
  const dColors = {
    up: "bg-depot-soft text-depot",
    warn: "bg-signal-soft text-[#B8501E]",
    neutral: "bg-[#EEF0F4] text-muted-text"
  };

  return (
    <div className="bg-panel border border-line rounded-[10px] p-[16px]">
      <div className="font-disp text-[26px] font-bold">{n}</div>
      <div className="text-[11.5px] text-muted-text mt-[2px]">{l}</div>
      <div className={`font-mono text-[10.5px] mt-[8px] inline-block px-[7px] py-[2px] rounded-[4px] ${dColors[dType]}`}>
        {dLabel}
      </div>
    </div>
  );
}

export function Panel({ children, title, hint, className = "" }: { children: React.ReactNode, title?: string, hint?: string, className?: string }) {
  return (
    <div className={`bg-panel border border-line rounded-[10px] mb-[18px] overflow-hidden ${className}`}>
      {(title || hint) && (
        <div className="px-[18px] py-[14px] border-b border-line flex items-center justify-between">
          {title && <h3 className="font-disp text-[14.5px] font-semibold m-0">{title}</h3>}
          {hint && <span className="text-[11.5px] text-muted-text">{hint}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Badge({ children, color = "grey" }: { children: React.ReactNode, color?: 'blue' | 'orange' | 'green' | 'red' | 'grey' }) {
  const colors = {
    blue: "bg-route-soft text-route",
    orange: "bg-signal-soft text-[#B8501E]",
    green: "bg-depot-soft text-depot",
    red: "bg-alert-soft text-alert",
    grey: "bg-[#EEF0F4] text-muted-text"
  };
  return (
    <span className={`font-body text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px] inline-block ${colors[color]}`}>
      {children}
    </span>
  );
}

export function ProtoButton({ children, variant = "primary", onClick, style }: { children: React.ReactNode, variant?: 'primary' | 'ghost' | 'dark', onClick?: () => void, style?: React.CSSProperties }) {
  const variants = {
    primary: "bg-signal text-[#1B1200]",
    ghost: "bg-transparent border border-line text-ink",
    dark: "bg-ink text-white"
  };
  return (
    <button 
      onClick={onClick} 
      style={style}
      className={`font-body font-semibold text-[12.5px] border-none rounded-[7px] px-[14px] py-[8px] cursor-pointer flex items-center justify-center gap-2 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export function RouteTrack({ stages, currentIdx }: { stages: string[], currentIdx: number }) {
  const isFinal = currentIdx >= stages.length - 1;
  return (
    <div className="flex flex-col">
      <div className="flex items-center mx-0 h-[16px] mt-2">
        {stages.map((stage, i) => (
          <React.Fragment key={i}>
            <div className="relative group cursor-pointer flex items-center justify-center">
              {/* Dot */}
              <div 
                className={`rounded-full shrink-0 transition-all ${
                  i === currentIdx 
                    ? isFinal ? 'bg-emerald-500 w-[14px] h-[14px] ring-4 ring-emerald-100 z-10' : 'bg-amber-400 w-[14px] h-[14px] ring-4 ring-amber-100 z-10' 
                    : i < currentIdx 
                      ? 'bg-blue-500 w-[8px] h-[8px] z-10' 
                      : 'bg-slate-200 w-[8px] h-[8px] z-10'
                }`} 
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-800 text-white text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {stage}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            </div>
            
            {/* Line */}
            {i < stages.length - 1 && (
              <div 
                className={`flex-1 h-[2px] -mx-[1px] ${
                  i < currentIdx ? 'bg-blue-500' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Current Stage Label */}
      <div className="mt-2 text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
        Current: <span className={isFinal ? 'text-emerald-600 font-bold' : 'text-amber-600'}>{stages[currentIdx] || 'Unknown'}</span>
      </div>
    </div>
  );
}

export function ProtoTable({ headers, children }: { headers: React.ReactNode[], children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse text-[12.8px]">
      <thead className="sticky top-0 z-10">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="text-left font-body font-semibold text-[11px] tracking-[0.3px] uppercase text-muted-text px-[18px] py-[10px] border-b border-line bg-[#FAFBFD] shadow-sm">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {children}
      </tbody>
    </table>
  );
}

export function Td({ children, className = "", title, colSpan }: { children: React.ReactNode, className?: string, title?: string, colSpan?: number }) {
  return <td className={`px-[18px] py-[11px] ${className}`} title={title} colSpan={colSpan}>{children}</td>;
}
