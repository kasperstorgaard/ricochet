import { Panel } from "#/components/panel.tsx";

export function PrintPanel() {
  return (
    <Panel className="not-print:hidden bg-transparent pt-fl-0 border-none mb-fl-3">
      <div className="col-[2/3] grid grid-cols-2 gap-fl-3">
        {[0, 1].map((col) => (
          <div key={col} className="flex flex-col gap-fl-3">
            {Array.from(
              { length: 6 },
              (_, row) => (
                <div key={row} className="flex gap-fl-1 items-end">
                  <span className="border-b border-text-3 px-fl-1 py-fl-1 w-8 font-mono text-00 leading-tight text-text-3/40">
                    {row === 0 ? "moves" : ""}
                  </span>
                  <span className="border-b border-text-3 flex-1 px-fl-1 py-fl-1 font-mono text-00 leading-tight text-text-3/40">
                    {row === 0 ? "name" : ""}
                  </span>
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
