import type { GuideTable } from "@/lib/guides";
import { card } from "@/components/ui";
import RichText from "./rich-text";

const th = "text-start align-bottom font-bold text-ink px-2 md:px-4 py-2.5 bg-soft";
const td = "text-start align-top px-2 md:px-4 py-2.5 border-t border-line";

/** a table that wraps its cells to fit a phone; only if it still can't fit, it scrolls inside its own box */
export default function Table({ table }: { table: GuideTable }) {
  return (
    <div className={`${card} overflow-x-auto`}>
      <table className="w-full text-[14px] md:text-[16px] leading-snug tabular-nums">
        {table.caption && (
          <caption className="text-start font-bold text-ink text-[14px] md:text-[15px] px-2 md:px-4 pt-3 pb-2.5">
            <RichText text={table.caption} />
          </caption>
        )}
        <thead>
          <tr>
            {table.head.map((h, i) => h
              ? <th key={i} scope="col" className={th}><RichText text={h} /></th>
              : <td key={i} className={th} />)}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((c, ci) => ci === 0
                ? <th key={ci} scope="row" className={`${td} font-bold text-ink`}><RichText text={c} /></th>
                : <td key={ci} className={`${td} text-body`}><RichText text={c} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
