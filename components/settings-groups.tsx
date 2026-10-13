"use client";
import { Children, isValidElement, type ReactNode } from "react";

export function SettingsGroups({ children }: { children: ReactNode }) {
  const groups: { heading: ReactNode; content: ReactNode[] }[] = [];
  Children.forEach(children, child => {
    if (isValidElement(child) && child.type === "h2") groups.push({ heading: child, content: [] });
    else groups.at(-1)?.content.push(child);
  });
  return <section className="section page-panel settings">
    {groups.map((group, index) => <details className="settings-group" key={index}><summary>{group.heading}<span aria-hidden="true">⌄</span></summary><div>{group.content}</div></details>)}
  </section>;
}
