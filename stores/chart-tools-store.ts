import { create } from "zustand";

export type ChartTool =
  | "cursor"
  | "trend"
  | "horizontal"
  | "ruler"
  | "brush"
  | "text"
  | "emoji"
  | "eraser"
  | "magnet"
  | "rectangle";

export type ChartShapeBase = {
  id: string;
  tool: ChartTool;
};

export type LineShape = ChartShapeBase & {
  tool: "trend" | "ruler";
  a: { x: number; y: number };
  b: { x: number; y: number };
};

export type HorizontalShape = ChartShapeBase & {
  tool: "horizontal";
  y: number;
};

export type RectangleShape = ChartShapeBase & {
  tool: "rectangle";
  a: { x: number; y: number };
  b: { x: number; y: number };
};

export type FreehandShape = ChartShapeBase & {
  tool: "brush";
  points: Array<{ x: number; y: number }>;
};

export type TextShape = ChartShapeBase & {
  tool: "text" | "emoji";
  x: number;
  y: number;
  value: string;
};

export type ChartShape =
  | LineShape
  | HorizontalShape
  | RectangleShape
  | FreehandShape
  | TextShape;

type ChartToolsState = {
  activeTool: ChartTool;
  shapes: ChartShape[];
  locked: boolean;
  magnet: boolean;
  setTool: (tool: ChartTool) => void;
  addShape: (shape: ChartShape) => void;
  updateShape: (id: string, updater: (shape: ChartShape) => ChartShape) => void;
  removeShape: (id: string) => void;
  clear: () => void;
  toggleLock: () => void;
  toggleMagnet: () => void;
};

export const useChartToolsStore = create<ChartToolsState>((set) => ({
  activeTool: "cursor",
  shapes: [],
  locked: false,
  magnet: false,
  setTool: (tool) =>
    set((state) => ({
      activeTool: tool,
      magnet: tool === "magnet" ? true : state.magnet,
    })),
  addShape: (shape) => set((state) => ({ shapes: [...state.shapes, shape] })),
  updateShape: (id, updater) =>
    set((state) => ({
      shapes: state.shapes.map((shape) => (shape.id === id ? updater(shape) : shape)),
    })),
  removeShape: (id) =>
    set((state) => ({ shapes: state.shapes.filter((shape) => shape.id !== id) })),
  clear: () => set({ shapes: [] }),
  toggleLock: () => set((state) => ({ locked: !state.locked })),
  toggleMagnet: () => set((state) => ({ magnet: !state.magnet })),
}));
