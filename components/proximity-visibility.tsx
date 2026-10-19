"use client";

export function ProximityVisibility({visible,onChange}:{visible:boolean;onChange:(visible:boolean)=>void}) {
  return <label className="check-label"><input type="checkbox" checked={!visible} onChange={event=>onChange(!event.target.checked)}/>Ocultar puntos de proximidad de fechas</label>;
}
