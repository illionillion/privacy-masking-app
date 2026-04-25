"use client";

import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef, useState } from "react";
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Transformer,
} from "react-konva";
import type {
  EditorMode,
  FillRegion,
  PaintStroke,
  RectAddTarget,
  StampRegion,
  StampType,
} from "../types";

interface EditorCanvasProps {
  imageUrl: string;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  stampRegions: StampRegion[];
  fillRegions: FillRegion[];
  paintStrokes: PaintStroke[];
  selectedId: string | null;
  mode: EditorMode;
  selectedStampType: StampType;
  rectTarget: RectAddTarget;
  brushSize: number;
  onSelectItem: (id: string | null) => void;
  onAddStampRegion: (region: Omit<StampRegion, "id">) => void;
  onAddFillRegion: (region: Omit<FillRegion, "id">) => void;
  onAddPaintStroke: (stroke: Omit<PaintStroke, "id">) => void;
  onUpdateStampRegion: (id: string, updates: Partial<Omit<StampRegion, "id">>) => void;
  onUpdateFillRegion: (id: string, updates: Partial<Omit<FillRegion, "id">>) => void;
  /** stamp-face 種別用のスタンプ画像マップ（ファイル名をキーにした HTMLImageElement の Map） */
  stampImages: Map<string, HTMLImageElement>;
  /** 現在選択中の stamp-face 画像のファイル名 */
  selectedStampFileName: string;
}

/** 描画中の矩形プレビュー用状態 */
interface DrawingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 描画中のストローク用状態 */
interface DrawingStroke {
  points: { x: number; y: number }[];
}

/** スタンプ種別ごとの表示色 */
const STAMP_TYPE_COLORS: Record<StampType, string> = {
  "fill-black": "#000000",
  mosaic: "#6b7280",
  blur: "#93c5fd",
  "stamp-face": "#fb923c",
};

/** 矩形描画の最小サイズ閾値（px）。この値以下の矩形は追加しない */
const MIN_RECT_SIZE = 5;

/** Transformer のリサイズ最小サイズ（px）。この値未満へのリサイズを禁止する */
const MIN_TRANSFORM_SIZE = 10;

/** モードごとの CSS カーソル種別 */
const MODE_CURSORS: Record<EditorMode, string> = {
  select: "default",
  rect: "crosshair",
  paint: "cell",
};

/**
 * Konva ステージ上でのポインタ座標を取得する
 *
 * @param stage - Konva ステージ
 * @returns ステージ座標、取得できない場合は null
 */
function getStagePos(stage: Konva.Stage): { x: number; y: number } | null {
  return stage.getPointerPosition();
}

/**
 * ステージ座標を元画像ピクセル空間に変換する
 *
 * @param stagePos - ステージ座標
 * @param scaleX - X 方向スケール
 * @param scaleY - Y 方向スケール
 */
function toImageSpace(
  stagePos: { x: number; y: number },
  scaleX: number,
  scaleY: number
): { x: number; y: number } {
  return {
    x: stagePos.x / scaleX,
    y: stagePos.y / scaleY,
  };
}

/**
 * エディタキャンバスコンポーネント（React Konva ベース）
 *
 * 選択・矩形追加・ペイントの 3 モードをサポートし、
 * 顔検出・OCR 結果からマスキング領域をインタラクティブに編集できる。
 */
/**
 * スタンプ画像マップから画像を選択する
 *
 * region.stampFileName が設定されている場合はそれを優先し、
 * 未設定の場合は region.id ハッシュで決定的に選択する。
 *
 * @param region - StampRegion
 * @param stampImages - ファイル名をキーにした HTMLImageElement の Map
 * @returns 選択された HTMLImageElement、見つからない場合は null
 */
function pickStampImage(
  region: StampRegion,
  stampImages: Map<string, HTMLImageElement>
): HTMLImageElement | null {
  if (region.stampFileName) {
    return stampImages.get(region.stampFileName) ?? null;
  }
  const values = Array.from(stampImages.values());
  if (values.length === 0) return null;
  const idHash = region.id.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
  return values[Math.abs(idHash) % values.length] ?? null;
}

export function EditorCanvas({
  imageUrl,
  imageNaturalWidth,
  imageNaturalHeight,
  stampRegions,
  fillRegions,
  paintStrokes,
  selectedId,
  mode,
  selectedStampType,
  rectTarget,
  brushSize,
  onSelectItem,
  onAddStampRegion,
  onAddFillRegion,
  onAddPaintStroke,
  onUpdateStampRegion,
  onUpdateFillRegion,
  stampImages,
  selectedStampFileName,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [stageWidth, setStageWidth] = useState(600);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);
  const [drawingStroke, setDrawingStroke] = useState<DrawingStroke | null>(null);
  const isDrawing = useRef(false);
  const drawStart = useRef<{ x: number; y: number } | null>(null);

  const stageHeight =
    imageNaturalWidth > 0 ? stageWidth * (imageNaturalHeight / imageNaturalWidth) : 400;
  const scaleX = imageNaturalWidth > 0 ? stageWidth / imageNaturalWidth : 1;
  const scaleY = imageNaturalHeight > 0 ? stageHeight / imageNaturalHeight : 1;

  /** コンテナの幅変化を ResizeObserver で監視 */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setStageWidth(entry.contentRect.width || 600);
      }
    });
    observer.observe(container);
    setStageWidth(container.offsetWidth || 600);
    return () => observer.disconnect();
  }, []);

  /** 背景画像を読み込む */
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = imageUrl;
  }, [imageUrl]);

  /**
   * 選択変化・領域サイズ変化時に Transformer を再アタッチする
   *
   * stampRegions / fillRegions を依存に含めることで、
   * リサイズ後に React state が更新された際に Transformer が
   * キャッシュ済みのバウンディングボックスを再計算する。
   */
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    if (selectedId) {
      const stage = transformer.getStage();
      const node = stage?.findOne(
        (n: Konva.Node) =>
          n.id() === selectedId && n.getType() !== "Stage" && n.getType() !== "Layer"
      );
      if (node) {
        transformer.nodes([node]);
      } else {
        transformer.nodes([]);
      }
    } else {
      transformer.nodes([]);
    }
  }, [selectedId, stampRegions, fillRegions]);

  /**
   * ステージのマウスダウン/タッチスタートハンドラ
   */
  function handlePointerDown(e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getStagePos(stage);
    if (!pos) return;

    if (mode === "select") {
      if (e.target === stage || e.target.getType() === "Stage") {
        onSelectItem(null);
      }
      return;
    }

    isDrawing.current = true;
    drawStart.current = pos;

    if (mode === "rect") {
      setDrawingRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (mode === "paint") {
      const imgPos = toImageSpace(pos, scaleX, scaleY);
      setDrawingStroke({ points: [imgPos] });
    }
  }

  /**
   * ステージのマウス移動/タッチ移動ハンドラ
   */
  function handlePointerMove(e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getStagePos(stage);
    if (!pos || !drawStart.current) return;

    if (mode === "rect") {
      setDrawingRect({
        x: Math.min(pos.x, drawStart.current.x),
        y: Math.min(pos.y, drawStart.current.y),
        width: Math.abs(pos.x - drawStart.current.x),
        height: Math.abs(pos.y - drawStart.current.y),
      });
    } else if (mode === "paint") {
      const imgPos = toImageSpace(pos, scaleX, scaleY);
      setDrawingStroke((prev) =>
        prev ? { points: [...prev.points, imgPos] } : { points: [imgPos] }
      );
    }
  }

  /**
   * ステージのマウスアップ/タッチエンドハンドラ
   */
  function handlePointerUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (mode === "rect" && drawingRect) {
      if (drawingRect.width > MIN_RECT_SIZE && drawingRect.height > MIN_RECT_SIZE) {
        const imgX = drawingRect.x / scaleX;
        const imgY = drawingRect.y / scaleY;
        const imgW = drawingRect.width / scaleX;
        const imgH = drawingRect.height / scaleY;

        if (rectTarget === "fill") {
          onAddFillRegion({
            x: imgX,
            y: imgY,
            width: imgW,
            height: imgH,
            isEnabled: true,
            source: "manual",
          });
        } else {
          onAddStampRegion({
            x: imgX,
            y: imgY,
            width: imgW,
            height: imgH,
            stampType: selectedStampType,
            stampFileName: selectedStampType === "stamp-face" ? selectedStampFileName : undefined,
            isEnabled: true,
            source: "manual",
          });
        }
      }
      setDrawingRect(null);
      drawStart.current = null;
    } else if (mode === "paint" && drawingStroke) {
      if (drawingStroke.points.length >= 2) {
        onAddPaintStroke({
          points: drawingStroke.points,
          brushSize,
          isEnabled: true,
        });
      }
      setDrawingStroke(null);
      drawStart.current = null;
    }
  }

  /**
   * 形状のドラッグ終了時に座標を元画像空間に変換して更新する
   *
   * @param id - 領域のID
   * @param kind - 領域の種別
   * @param node - Konva ノード
   */
  function handleDragEnd(id: string, kind: "stamp" | "fill", node: Konva.Node) {
    const newX = node.x() / scaleX;
    const newY = node.y() / scaleY;
    if (kind === "stamp") {
      onUpdateStampRegion(id, { x: newX, y: newY });
    } else {
      onUpdateFillRegion(id, { x: newX, y: newY });
    }
  }

  /**
   * 形状のトランスフォーム終了時にサイズ・位置を元画像空間に変換して更新する
   *
   * @param id - 領域のID
   * @param kind - 領域の種別
   * @param node - Konva ノード
   */
  function handleTransformEnd(id: string, kind: "stamp" | "fill", node: Konva.Node) {
    // Group は width()/height() が常に 0 を返すため、スケールリセット前に
    // getClientRect() でビジュアル上の実サイズ・位置を取得する
    const parent = node.getParent();
    const clientRect = parent
      ? node.getClientRect({ relativeTo: parent, skipStroke: true })
      : node.getClientRect({ skipStroke: true });

    node.scaleX(1);
    node.scaleY(1);

    const newX = clientRect.x / scaleX;
    const newY = clientRect.y / scaleY;
    const newW = clientRect.width / scaleX;
    const newH = clientRect.height / scaleY;

    if (kind === "stamp") {
      onUpdateStampRegion(id, { x: newX, y: newY, width: newW, height: newH });
    } else {
      onUpdateFillRegion(id, { x: newX, y: newY, width: newW, height: newH });
    }
  }

  const isInteractive = mode === "select";

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-xl border border-zinc-200">
      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{ cursor: MODE_CURSORS[mode] }}
      >
        <Layer>
          {/* 背景画像 */}
          {bgImage && <KonvaImage image={bgImage} width={stageWidth} height={stageHeight} />}

          {/* 塗りつぶし領域 */}
          {fillRegions.map((region) => (
            <Group
              key={region.id}
              id={region.id}
              x={region.x * scaleX}
              y={region.y * scaleY}
              draggable={isInteractive}
              onClick={() => isInteractive && onSelectItem(region.id)}
              onTap={() => isInteractive && onSelectItem(region.id)}
              onDragEnd={(e) => handleDragEnd(region.id, "fill", e.target)}
              onTransformEnd={(e) => handleTransformEnd(region.id, "fill", e.target)}
            >
              <Rect
                width={region.width * scaleX}
                height={region.height * scaleY}
                fill={region.isEnabled ? "#000000" : undefined}
                stroke={region.isEnabled ? "#3b82f6" : "#9ca3af"}
                strokeWidth={1}
                dash={region.isEnabled ? undefined : [6, 3]}
                opacity={region.isEnabled ? 1 : 0.6}
              />
            </Group>
          ))}

          {/* スタンプ領域 */}
          {stampRegions.map((region) => {
            const w = region.width * scaleX;
            const h = region.height * scaleY;
            const stampImg =
              region.stampType === "stamp-face" ? pickStampImage(region, stampImages) : null;
            return (
              <Group
                key={region.id}
                id={region.id}
                x={region.x * scaleX}
                y={region.y * scaleY}
                draggable={isInteractive}
                onClick={() => isInteractive && onSelectItem(region.id)}
                onTap={() => isInteractive && onSelectItem(region.id)}
                onDragEnd={(e) => handleDragEnd(region.id, "stamp", e.target)}
                onTransformEnd={(e) => handleTransformEnd(region.id, "stamp", e.target)}
              >
                {stampImg ? (
                  /* stamp-face: スタンプ画像を実際に表示 */
                  <KonvaImage
                    image={stampImg}
                    width={w}
                    height={h}
                    opacity={region.isEnabled ? 1 : 0.4}
                    stroke={selectedId === region.id ? "#1d4ed8" : "#6b7280"}
                    strokeWidth={1}
                  />
                ) : (
                  /* fill-black / mosaic / blur: プレビュー用の色付き矩形（ラベルなし） */
                  <Rect
                    width={w}
                    height={h}
                    fill={STAMP_TYPE_COLORS[region.stampType]}
                    opacity={0.7}
                    stroke={selectedId === region.id ? "#1d4ed8" : "#6b7280"}
                    strokeWidth={1}
                  />
                )}
              </Group>
            );
          })}

          {/* ペイントストローク */}
          {paintStrokes.map((stroke) => (
            <Line
              key={stroke.id}
              id={stroke.id}
              points={stroke.points.flatMap((p) => [p.x * scaleX, p.y * scaleY])}
              stroke="#000000"
              strokeWidth={stroke.brushSize * scaleX}
              lineCap="round"
              lineJoin="round"
              opacity={stroke.isEnabled ? 1 : 0.3}
              onClick={() => isInteractive && onSelectItem(stroke.id)}
              onTap={() => isInteractive && onSelectItem(stroke.id)}
            />
          ))}

          {/* 描画中の矩形プレビュー */}
          {drawingRect && mode === "rect" && (
            <Rect
              x={drawingRect.x}
              y={drawingRect.y}
              width={drawingRect.width}
              height={drawingRect.height}
              fill={rectTarget === "fill" ? "rgba(0,0,0,0.3)" : "rgba(251,146,60,0.3)"}
              stroke={rectTarget === "fill" ? "#3b82f6" : "#f97316"}
              strokeWidth={1}
              dash={[6, 3]}
            />
          )}

          {/* 描画中のペイントプレビュー */}
          {drawingStroke && mode === "paint" && drawingStroke.points.length >= 2 && (
            <Line
              points={drawingStroke.points.flatMap((p) => [p.x * scaleX, p.y * scaleY])}
              stroke="#000000"
              strokeWidth={brushSize * scaleX}
              lineCap="round"
              lineJoin="round"
              opacity={0.6}
            />
          )}

          {/* ペイント中のカーソルインジケーター */}
          {drawingStroke && mode === "paint" && drawingStroke.points.length >= 1 && (
            <Circle
              x={(drawingStroke.points[drawingStroke.points.length - 1]?.x ?? 0) * scaleX}
              y={(drawingStroke.points[drawingStroke.points.length - 1]?.y ?? 0) * scaleY}
              radius={(brushSize * scaleX) / 2}
              fill="rgba(0,0,0,0.2)"
              listening={false}
            />
          )}

          {/* Transformer（選択モードのみ） */}
          {mode === "select" && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < MIN_TRANSFORM_SIZE || newBox.height < MIN_TRANSFORM_SIZE)
                  return oldBox;
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
