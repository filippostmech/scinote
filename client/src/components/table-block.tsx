import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";

interface TableBlockProps {
  meta?: Record<string, any>;
  onMetaChange: (meta: Record<string, any>) => void;
}

function createDefaultTable(): string[][] {
  return [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
}

export function TableBlock({ meta, onMetaChange }: TableBlockProps) {
  const [tableData, setTableData] = useState<string[][]>(() => {
    if (meta?.tableData && Array.isArray(meta.tableData)) {
      return meta.tableData;
    }
    return createDefaultTable();
  });

  const isInitRef = useRef(false);

  useEffect(() => {
    if (!isInitRef.current && (!meta?.tableData || !Array.isArray(meta.tableData))) {
      isInitRef.current = true;
      onMetaChange({ ...meta, tableData: createDefaultTable() });
    }
  }, []);

  const updateTable = useCallback(
    (newData: string[][]) => {
      setTableData(newData);
      onMetaChange({ ...meta, tableData: newData });
    },
    [meta, onMetaChange],
  );

  const handleCellChange = useCallback(
    (rowIdx: number, colIdx: number, value: string) => {
      const newData = tableData.map((row, ri) =>
        ri === rowIdx ? row.map((cell, ci) => (ci === colIdx ? value : cell)) : [...row],
      );
      updateTable(newData);
    },
    [tableData, updateTable],
  );

  const addRow = useCallback(() => {
    const cols = tableData[0]?.length || 3;
    updateTable([...tableData, new Array(cols).fill("")]);
  }, [tableData, updateTable]);

  const addColumn = useCallback(() => {
    updateTable(tableData.map((row) => [...row, ""]));
  }, [tableData, updateTable]);

  const removeRow = useCallback(
    (rowIdx: number) => {
      if (tableData.length <= 1) return;
      updateTable(tableData.filter((_, i) => i !== rowIdx));
    },
    [tableData, updateTable],
  );

  const removeColumn = useCallback(
    (colIdx: number) => {
      if ((tableData[0]?.length || 0) <= 1) return;
      updateTable(tableData.map((row) => row.filter((_, i) => i !== colIdx)));
    },
    [tableData, updateTable],
  );

  const cols = tableData[0]?.length || 3;

  return (
    <div className="my-2 overflow-x-auto" data-testid="table-block">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {tableData.map((row, rowIdx) => (
            <tr key={rowIdx} className="group/row">
              {row.map((cell, colIdx) => (
                <td
                  key={colIdx}
                  className={`border border-border px-3 py-2 relative ${rowIdx === 0 ? "bg-accent/40 font-medium" : "bg-background"}`}
                >
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                    className="w-full bg-transparent outline-none text-sm min-w-[60px]"
                    placeholder={rowIdx === 0 ? "Header" : ""}
                    data-testid={`table-cell-${rowIdx}-${colIdx}`}
                  />
                  {colIdx === row.length - 1 && (
                    <button
                      onClick={() => removeRow(rowIdx)}
                      className="absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 items-center justify-center rounded text-muted-foreground/40 hidden group-hover/row:flex transition-colors hover-elevate"
                      data-testid={`button-remove-row-${rowIdx}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={addRow}
          className="flex items-center gap-1 text-xs text-muted-foreground/60 px-2 py-1 rounded transition-colors hover-elevate"
          data-testid="button-add-row"
        >
          <Plus className="w-3 h-3" />
          Row
        </button>
        <button
          onClick={addColumn}
          className="flex items-center gap-1 text-xs text-muted-foreground/60 px-2 py-1 rounded transition-colors hover-elevate"
          data-testid="button-add-column"
        >
          <Plus className="w-3 h-3" />
          Column
        </button>
      </div>
    </div>
  );
}
