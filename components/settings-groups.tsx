"use client";
import { Children, isValidElement, useState, type ReactNode } from "react";

export function SettingsGroups({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const groups: { heading: ReactNode; content: ReactNode[] }[] = [];
  Children.forEach(children, child => {
    if (isValidElement(child) && child.type === "h2") groups.push({ heading: child, content: [] });
    else groups.at(-1)?.content.push(child);
  });
  return <section className="section page-panel settings">
    <button type="button" className="secondary wide" aria-expanded={expanded} aria-controls="settings-groups" onClick={() => setExpanded(!expanded)}>{expanded ? "Plegar todo" : "Desplegar todo"}</button>
    <div id="settings-groups">{groups.map((group, index) => <section className="settings-group" key={index}>{group.heading}<div hidden={!expanded}>{group.content}</div></section>)}</div>
  </section>;
}
