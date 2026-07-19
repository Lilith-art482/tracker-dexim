"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  DndContext,
  useDraggable,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FileText, CheckSquare, Trash2 } from "lucide-react";
import type { Block } from "./block-editor";
import type { CanvasState, CanvasConnection } from "@/lib/models";
import { cn } from "@/lib/utils";

const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 3000;
const BLOCK_W = 200;
const BLOCK_H = 60;

function layoutInitial(
  blocks: Block[],
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  let y = 40;
  for (const b of blocks) {
    positions[b.id] = { x: 40, y };
    y += BLOCK_H + 16;
  }
  return positions;
}

function BlockCard({
  block,
  x,
  y,
  isSelected,
  onSelect,
  onStartConnection,
  onDelete,
}: {
  block: Block;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: () => void;
  onStartConnection: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `block-${block.id}`,
    data: { type: "canvasBlock", blockId: block.id },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const typeIcon = () => {
    if (block.type === "todo")
      return <CheckSquare className="h-3 w-3 shrink-0" />;
    return <FileText className="h-3 w-3 shrink-0" />;
  };

  const label = block.content
    ? block.content.length > 40
      ? block.content.slice(0, 40) + "…"
      : block.content
    : block.type;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        left: x,
        top: y,
        width: BLOCK_W,
        position: "absolute",
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        "rounded-lg border px-3 py-2 text-xs cursor-grab active:cursor-grabbing select-none transition-shadow",
        isSelected
          ? "border-primary/50 bg-primary/5 shadow-md ring-1 ring-primary/20"
          : "border-border/40 bg-card shadow-sm hover:shadow-md hover:border-border/60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-muted-foreground/60">{typeIcon()}</span>
          <span className="truncate font-medium">{label}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartConnection();
          }}
          className="shrink-0 h-5 w-5 flex items-center justify-center rounded text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Соединить"
        >
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 h-5 w-5 flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Удалить блок"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function ConnectionsSvg({
  connections,
  positions,
}: {
  connections: CanvasConnection[];
  positions: Record<string, { x: number; y: number }>;
}) {
  const lines = useMemo(() => {
    return connections
      .map((c) => {
        const from = positions[c.fromBlockId];
        const to = positions[c.toBlockId];
        if (!from || !to) return null;
        const x1 = from.x + BLOCK_W;
        const y1 = from.y + BLOCK_H / 2;
        const x2 = to.x;
        const y2 = to.y + BLOCK_H / 2;
        const mx = (x1 + x2) / 2;
        const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
        return { id: `${c.fromBlockId}→${c.toBlockId}`, path, type: c.type };
      })
      .filter(Boolean) as Array<{ id: string; path: string; type: string }>;
  }, [connections, positions]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" />
        </marker>
      </defs>
      {lines.map((l) => (
        <path
          key={l.id}
          d={l.path}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          strokeDasharray={l.type === "dashed" ? "4 3" : undefined}
          markerEnd="url(#arrowhead)"
          className="opacity-50"
        />
      ))}
    </svg>
  );
}

export function CanvasView({
  blocks,
  canvasState,
  onCanvasStateChange,
  uid,
  noteId,
}: {
  blocks: Block[];
  canvasState: CanvasState | null;
  onCanvasStateChange: (state: CanvasState) => void;
  uid: string;
  noteId: string;
}) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const positions = useMemo(() => {
    if (
      canvasState?.positions &&
      Object.keys(canvasState.positions).length > 0
    ) {
      return canvasState.positions;
    }
    return layoutInitial(blocks);
  }, [canvasState, blocks]);

  const connections = useMemo(
    () => canvasState?.connections || [],
    [canvasState],
  );

  const persist = useCallback(
    (
      newPositions: Record<string, { x: number; y: number }>,
      newConnections: CanvasConnection[],
    ) => {
      onCanvasStateChange({
        positions: newPositions,
        connections: newConnections,
      });
    },
    [onCanvasStateChange],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const blockId = active.data.current?.blockId as string | undefined;
      if (!blockId) return;

      const old = positions[blockId];
      if (!old) return;

      const newPositions = {
        ...positions,
        [blockId]: {
          x: Math.max(0, Math.min(CANVAS_WIDTH - BLOCK_W, old.x + delta.x)),
          y: Math.max(0, Math.min(CANVAS_HEIGHT - BLOCK_H, old.y + delta.y)),
        },
      };
      persist(newPositions, connections);
    },
    [positions, connections, persist],
  );

  const handleCanvasClick = useCallback(() => {
    setSelectedBlockId(null);
    setConnectingFrom(null);
  }, []);

  const handleStartConnection = useCallback(
    (blockId: string) => {
      if (connectingFrom === blockId) {
        setConnectingFrom(null);
        return;
      }
      if (connectingFrom) {
        const exists = connections.some(
          (c) => c.fromBlockId === connectingFrom && c.toBlockId === blockId,
        );
        if (!exists && connectingFrom !== blockId) {
          const newConnections = [
            ...connections,
            {
              fromBlockId: connectingFrom,
              toBlockId: blockId,
              type: "arrow" as const,
            },
          ];
          persist(positions, newConnections);
        }
        setConnectingFrom(null);
        return;
      }
      setConnectingFrom(blockId);
    },
    [connectingFrom, connections, positions, persist],
  );

  const handleRemoveConnection = useCallback(
    (fromId: string, toId: string) => {
      const newConnections = connections.filter(
        (c) => !(c.fromBlockId === fromId && c.toBlockId === toId),
      );
      persist(positions, newConnections);
    },
    [connections, persist],
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      const newPositions = { ...positions };
      delete newPositions[blockId];
      const newConnections = connections.filter(
        (c) => c.fromBlockId !== blockId && c.toBlockId !== blockId,
      );
      persist(newPositions, newConnections);
    },
    [positions, connections, persist],
  );

  const sortedBlocks = useMemo(() => {
    const posOrder = [...blocks].sort((a, b) => {
      const pa = positions[a.id];
      const pb = positions[b.id];
      if (!pa || !pb) return 0;
      return pa.y - pb.y || pa.x - pb.x;
    });
    return posOrder;
  }, [blocks, positions]);

  const connectionList = useMemo(
    () =>
      connections.map((c) => ({
        ...c,
        fromTitle:
          blocks.find((b) => b.id === c.fromBlockId)?.content.slice(0, 20) ||
          c.fromBlockId,
        toTitle:
          blocks.find((b) => b.id === c.toBlockId)?.content.slice(0, 20) ||
          c.toBlockId,
      })),
    [connections, blocks],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Canvas toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20 shrink-0 text-xs text-muted-foreground">
        <span className="font-medium">Канвас</span>
        <span className="text-muted-foreground/40">|</span>
        <span>{blocks.length} блоков</span>
        <span className="text-muted-foreground/40">|</span>
        <span>{connections.length} связей</span>
        <span className="text-muted-foreground/40">|</span>
        <span className="text-muted-foreground/50">
          Перетащите блоки для группировки
        </span>

        {/* Connection list */}
        {connectionList.length > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            {connectionList.map((c) => (
              <button
                key={`${c.fromBlockId}-${c.toBlockId}`}
                onClick={() =>
                  handleRemoveConnection(c.fromBlockId, c.toBlockId)
                }
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary/5 text-primary/60 hover:bg-primary/15 hover:text-primary transition-colors"
                title="Удалить связь"
              >
                {c.fromTitle} → {c.toTitle}
                <span className="ml-0.5">×</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto bg-muted/5"
        onClick={handleCanvasClick}
      >
        <div
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            position: "relative",
          }}
          className="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/20 to-transparent"
        >
          {/* Connection mode indicator */}
          {connectingFrom && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary animate-in fade-in">
              Кликните на блок, к которому ведём связь
            </div>
          )}

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <ConnectionsSvg connections={connections} positions={positions} />
            {sortedBlocks.map((block) => (
              <div key={block.id}>
                {connectingFrom === block.id && (
                  <svg
                    className="absolute pointer-events-none"
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    style={{ top: 0, left: 0 }}
                  >
                    <circle
                      cx={positions[block.id]?.x ?? 0}
                      cy={positions[block.id]?.y ?? 0}
                      r={40}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      className="animate-pulse"
                    />
                  </svg>
                )}
                <BlockCard
                  block={block}
                  x={positions[block.id]?.x ?? 0}
                  y={positions[block.id]?.y ?? 0}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => setSelectedBlockId(block.id)}
                  onStartConnection={() => handleStartConnection(block.id)}
                  onDelete={() => handleDeleteBlock(block.id)}
                />
              </div>
            ))}
          </DndContext>
        </div>
      </div>
    </div>
  );
}
