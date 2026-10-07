"use client";

import { useEffect } from "react";

/**
 * On phones every .data-table becomes a list of cards (see globals.css). That needs each cell to know its column
 * name, which we copy from the header row. Runs for every table in <main>, including ones rendered later.
 */
export function StackTables() {
  useEffect(() => {
    const label = (table: HTMLTableElement) => {
      const heads = [...table.querySelectorAll("thead th")].map((th) => th.textContent?.trim() ?? "");
      table.classList.add("stack");
      table.querySelectorAll("tbody tr, tfoot tr").forEach((tr) => {
        let col = 0;
        [...tr.children].forEach((cell) => {
          const td = cell as HTMLTableCellElement;
          const span = td.colSpan || 1;
          if (span === 1 && heads[col] && td.getAttribute("data-label") !== heads[col]) td.setAttribute("data-label", heads[col]);
          if (span > 1) td.setAttribute("data-wide", "");
          col += span;
        });
      });
    };
    const run = () => document.querySelectorAll<HTMLTableElement>("main table.data-table").forEach(label);
    run();
    const mo = new MutationObserver(run);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return null;
}
