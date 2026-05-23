"use client";

import clsx from "clsx";
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
import type { EditorMode, PaintStroke, StampRegion, StampType } from "../types";
import { stagePointerToContentSpace } from "../lib/viewZoom";
import { useEditorViewport } from "../hooks/useEditorViewport";
import { useEditorViewportGestures } from "../hooks/useEditorViewportGestures";
import { EditorStampRegionNode } from "./EditorStampRegionNode";
import { EditorViewportControls } from "./EditorViewportControls";

interface EditorCanvasProps {
  imageUrl: string;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  stampRegions: StampRegion[];
  paintStrokes: PaintStroke[];
  selectedId: string | null;
  mode: EditorMode;
  selectedStampType: StampType;
  brushSize: number;
  onSelectItem: (id: string | null) => void;
  onAddStampRegion: (region: Omit<StampRegion, "id">) => void;
  onAddPaintStroke: (stroke: Omit<PaintStroke, "id">) => void;
  onUpdateStampRegion: (id: string, updates: Partial<Omit<StampRegion, "id">>) => void;
  onUpdatePaintStroke: (id: string, updates: Partial<Omit<PaintStroke, "id">>) => void;
  /** stamp-face 種別用のスタンプ画像マップ（ファイル名をキーにした HTMLImageElement の Map） */
  stampImages: Map<string, HTMLImageElement>;
  /** 現在選択中の stamp-face 画像のファイル名 */
  selectedStampFileName: string;
  /** 選択中アイテムを削除するコールバック */
  onDeleteSelected: () => void;
  /** true のとき表示ズームバーをキャンバス外に固定し、Stage のみスクロールする（モーダル編集向け） */
  pinViewportControls?: boolean;
  /** ルート要素に追加するクラス（モーダル内で flex-1 など） */
  className?: string;
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

/** 矩形描画の最小サイズ閾値（px）。この値以下の矩形は追加しない */
const MIN_RECT_SIZE = 5;

/** 矩形プレビューの種別ごとの表示色 */
const RECT_PREVIEW_BY_STAMP_TYPE: Record<StampType, { fill: string; stroke: string }> = {
  "fill-black": { fill: "rgba(0,0,0,0.3)", stroke: "#000000" },
  "stamp-face": { fill: "rgba(251,146,60,0.3)", stroke: "#f97316" },
  mosaic: { fill: "rgba(107,114,128,0.3)", stroke: "#6b7280" },
  blur: { fill: "rgba(147,197,253,0.3)", stroke: "#93c5fd" },
};

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
export function EditorCanvas({
  imageUrl,
  imageNaturalWidth,
  imageNaturalHeight,
  stampRegions,
  paintStrokes,
  selectedId,
  mode,
  selectedStampType,
  brushSize,
  onSelectItem,
  onAddStampRegion,
  onAddPaintStroke,
  onUpdateStampRegion,
  onUpdatePaintStroke,
  stampImages,
  selectedStampFileName,
  onDeleteSelected,
  pinViewportControls = false,
  className,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
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
  const {
    viewZoom,
    viewCenter,
    contentCenter,
    canPan,
    resetViewport,
    zoomAt,
    setZoomAt,
    panByStageDelta,
  } = useEditorViewport(imageNaturalWidth, imageNaturalHeight, scaleX, scaleY);

  const gestures = useEditorViewportGestures({
    stageContainerRef,
    stageWidth,
    stageHeight,
    viewZoom,
    mode,
    canPan,
    zoomAt,
    setZoomAt,
    panByStageDelta,
    onClearSelection: () => onSelectItem(null),
  });

  /**
   * キーボードショートカット
   *
   * - Escape: 選択解除
   * - Delete / Backspace: 選択中アイテムを削除
   * - 0: 等倍・中央にリセット
   */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onSelectItem(null);
      } else if (e.key === "0") {
        resetViewport();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId !== null) {
        onDeleteSelected();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, onSelectItem, onDeleteSelected, resetViewport]);

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
    const w0 = container.clientWidth || 600;
    setStageWidth(w0);
    return () => observer.disconnect();
  }, [imageNaturalHeight, imageNaturalWidth]);

  /** 背景画像を読み込む */
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = imageUrl;
  }, [imageUrl]);

  /**
   * 選択変化・領域サイズ変化・表示中心／表示倍率変化時に Transformer を再アタッチする
   *
   * 親 Group の offset/scale が変わると、同じ selectedId でも
   * Transformer の対象ノードを付け直した方がハンドル表示が安定する。
   */
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (!selectedId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const stage = transformer.getStage();
    const node =
      stage?.findOne(
        (n: Konva.Node) =>
          n.id() === selectedId && n.getType() !== "Stage" && n.getType() !== "Layer"
      ) ?? null;

    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [
    selectedId,
    stampRegions,
    paintStrokes,
    viewZoom,
    viewCenter.x,
    viewCenter.y,
    stageWidth,
    stageHeight,
    mode,
  ]);

  /**
   * ステージのマウスダウン/タッチスタートハンドラ
   */
  function handlePointerDown(e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) {
    if (gestures.tryConsumeStagePointerDown(e)) return;
    if (gestures.hasActivePanSession() || gestures.isGestureCapturing) return;

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = pointerToContentSpace(stage);
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
    if (gestures.tryConsumeStagePointerMove(e)) return;
    if (!isDrawing.current) return;
    // canvas / .konvajs-content は touch-action が継承されないため SP でページスクロールと競合する。
    // Konva が passive:false で登録している touchmove でも念のため抑止する。
    if ((mode === "rect" || mode === "paint") && "touches" in e.evt && e.evt.cancelable) {
      e.evt.preventDefault();
    }
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = pointerToContentSpace(stage);
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
    if (gestures.tryConsumeStagePointerUp()) return;
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (mode === "rect" && drawingRect) {
      if (drawingRect.width > MIN_RECT_SIZE && drawingRect.height > MIN_RECT_SIZE) {
        const imgX = drawingRect.x / scaleX;
        const imgY = drawingRect.y / scaleY;
        const imgW = drawingRect.width / scaleX;
        const imgH = drawingRect.height / scaleY;

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
  function handleDragEnd(id: string, node: Konva.Node) {
    const newX = node.x() / scaleX;
    const newY = node.y() / scaleY;
    onUpdateStampRegion(id, { x: newX, y: newY });
  }

  /**
   * ペイントストロークのドラッグ終了時に、ノードの x/y オフセットを points 配列に
   * 焼き込んで state を更新する。
   *
   * Konva.Line は points が node のローカル座標で保持されるため、
   * ドラッグ後の x/y を points に加算してからノードの x/y をリセットする。
   *
   * @param id - ストロークのID
   * @param node - Konva.Line ノード
   */
  function handlePaintStrokeDragEnd(id: string, node: Konva.Line) {
    const dx = node.x();
    const dy = node.y();
    if (dx === 0 && dy === 0) return;

    const localPoints = node.points();
    const newImagePoints: { x: number; y: number }[] = [];
    for (let i = 0; i < localPoints.length; i += 2) {
      newImagePoints.push({
        x: ((localPoints[i] ?? 0) + dx) / scaleX,
        y: ((localPoints[i + 1] ?? 0) + dy) / scaleY,
      });
    }

    node.x(0);
    node.y(0);
    node.points(newImagePoints.flatMap((p) => [p.x * scaleX, p.y * scaleY]));

    onUpdatePaintStroke(id, { points: newImagePoints });
  }

  /**
   * ペイントストロークのトランスフォーム終了時に、回転・拡縮・移動を points と
   * brushSize に焼き込んで state を更新する。
   *
   * brushSize は scaleX/scaleY の絶対値の平均で再計算する（非一様スケール時の近似）。
   *
   * @param id - ストロークのID
   * @param stroke - 元のストローク
   * @param node - Konva.Line ノード
   */
  function handlePaintStrokeTransformEnd(id: string, stroke: PaintStroke, node: Konva.Line) {
    const transform = node.getTransform();
    const localPoints = node.points();
    const scaleAbsX = Math.abs(node.scaleX());
    const scaleAbsY = Math.abs(node.scaleY());

    const newImagePoints: { x: number; y: number }[] = [];
    for (let i = 0; i < localPoints.length; i += 2) {
      const worldPoint = transform.point({
        x: localPoints[i] ?? 0,
        y: localPoints[i + 1] ?? 0,
      });
      newImagePoints.push({
        x: worldPoint.x / scaleX,
        y: worldPoint.y / scaleY,
      });
    }

    node.x(0);
    node.y(0);
    node.scaleX(1);
    node.scaleY(1);
    node.rotation(0);
    node.points(newImagePoints.flatMap((p) => [p.x * scaleX, p.y * scaleY]));

    const newBrushSize = stroke.brushSize * ((scaleAbsX + scaleAbsY) / 2);
    onUpdatePaintStroke(id, { points: newImagePoints, brushSize: newBrushSize });
  }

  /**
   * 形状のトランスフォーム終了時にサイズ・位置を元画像空間に変換して更新する
   *
   * @param id - 領域のID
   * @param kind - 領域の種別
   * @param node - Konva ノード
   */
  function handleTransformEnd(id: string, node: Konva.Node) {
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

    onUpdateStampRegion(id, { x: newX, y: newY, width: newW, height: newH });
  }

  const isInteractive = mode === "select";

  /**
   * ステージ上のポインタを、ズーム補正後のコンテンツ座標（領域描画と同じ系）に変換する
   *
   * @param stage - Konva ステージ
   * @returns コンテンツ座標、取得できない場合は null
   */
  function pointerToContentSpace(stage: Konva.Stage): { x: number; y: number } | null {
    const stagePos = getStagePos(stage);
    if (!stagePos) return null;
    return stagePointerToContentSpace(stagePos, stageWidth, stageHeight, viewZoom, contentCenter);
  }

  const layerContent = (
    <>
      {/* 背景画像 */}
      {bgImage && (
        <KonvaImage image={bgImage} width={stageWidth} height={stageHeight} listening={false} />
      )}

      {/* マスキング領域 */}
      {stampRegions.map((region) => (
        <EditorStampRegionNode
          key={region.id}
          region={region}
          scaleX={scaleX}
          scaleY={scaleY}
          isInteractive={isInteractive}
          selected={selectedId === region.id}
          stampImages={stampImages}
          bgImage={bgImage}
          stageWidth={stageWidth}
          stageHeight={stageHeight}
          onSelect={() => onSelectItem(region.id)}
          onDragEnd={(node) => handleDragEnd(region.id, node)}
          onTransformEnd={(node) => handleTransformEnd(region.id, node)}
        />
      ))}

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
          hitStrokeWidth={Math.max(stroke.brushSize * scaleX, 12)}
          draggable={isInteractive}
          onClick={() => isInteractive && onSelectItem(stroke.id)}
          onTap={() => isInteractive && onSelectItem(stroke.id)}
          onDragEnd={(e) => handlePaintStrokeDragEnd(stroke.id, e.target as Konva.Line)}
          onTransformEnd={(e) =>
            handlePaintStrokeTransformEnd(stroke.id, stroke, e.target as Konva.Line)
          }
        />
      ))}

      {/* 描画中の矩形プレビュー */}
      {drawingRect && mode === "rect" && (
        <Rect
          x={drawingRect.x}
          y={drawingRect.y}
          width={drawingRect.width}
          height={drawingRect.height}
          fill={RECT_PREVIEW_BY_STAMP_TYPE[selectedStampType].fill}
          stroke={RECT_PREVIEW_BY_STAMP_TYPE[selectedStampType].stroke}
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
    </>
  );

  const viewportControls = (
    <EditorViewportControls viewZoom={viewZoom} onResetViewport={resetViewport} />
  );

  const stageCursor =
    canPan && mode === "select"
      ? gestures.isGestureCapturing || gestures.hasActivePanSession()
        ? "grabbing"
        : "grab"
      : MODE_CURSORS[mode];

  /** モーダル内: 選択モードは縦スクロールを優先、描画モードはタッチ操作をキャンバスに取る */
  const stageTouchAction =
    pinViewportControls && (mode === "paint" || mode === "rect")
      ? "none"
      : pinViewportControls
        ? "pan-y"
        : "none";

  const stageArea = (
    <div
      ref={stageContainerRef}
      {...gestures.stageContainerProps}
      className={
        pinViewportControls ? undefined : "[&_.konvajs-content]:touch-none [&_canvas]:touch-none"
      }
    >
      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{ cursor: stageCursor, touchAction: stageTouchAction }}
      >
        <Layer>
          <Group
            x={stageWidth / 2}
            y={stageHeight / 2}
            offsetX={contentCenter.x}
            offsetY={contentCenter.y}
            scaleX={viewZoom}
            scaleY={viewZoom}
          >
            {layerContent}
          </Group>
        </Layer>
      </Stage>
    </div>
  );

  if (pinViewportControls) {
    return (
      <div
        ref={containerRef}
        className={clsx([
          "flex min-h-0 w-full flex-col rounded-xl border border-zinc-200",
          className,
        ])}
      >
        <div className="shrink-0">{viewportControls}</div>
        <div className="min-h-0 flex-1 overflow-auto">{stageArea}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={clsx(["w-full overflow-hidden rounded-xl border border-zinc-200", className])}
    >
      {viewportControls}
      {stageArea}
    </div>
  );
}
