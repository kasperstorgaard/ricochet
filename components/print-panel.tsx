import { Panel } from "#/components/panel.tsx";

export function PrintPanel() {
  return (
    <Panel className="not-print:hidden bg-transparent pt-0 border-none mb-fl-3">
      <table className="col-[2/3] grow border-spacing-fl-2 -m-fl-2 border-separate rounded-none border-none bg-transparent">
        <thead className="text-fl-0">
          <tr>
            <td
              align="left"
              className="rounded-none p-0 pr-fl-2 italic"
            >
              Moves
            </td>
            <td
              align="left"
              className="rounded-none p-0 w-full italic"
            >
              Name
            </td>
          </tr>
        </thead>

        <tbody>
          {Array.from(
            { length: 6 },
            (_, i) => (
              <tr
                key={i}
                className=""
              >
                <td className="rounded-none border-b-1 border-b-text-2 py-fl-2" />
                <td className="rounded-none border-b-1 border-b-text-2 py-fl-2" />
              </tr>
            ),
          )}
        </tbody>
      </table>
    </Panel>
  );
}
