"use client";

import clsx from "clsx";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  CropRect,
  EditorMode,
  PaintStroke,
  PaintType,
  StampRegion,
  StampType,
} from "../types";
import { clampCropRect, createFullImageCropRect } from "../lib/cropRect";
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_OVERLAY_TEXT,
  DEFAULT_TEXT_COLOR,
} from "../lib/fillText";
import {
  getEditorStageTouchAction,
  shouldShowEditorTransformer,
} from "../lib/editorCanvasInteraction";
import { EditorCropOverlay } from "./EditorCropOverlay";
import {
  isEditableKeyboardTarget,
  isTextInputKeyboardTarget,
} from "../lib/isEditableKeyboardTarget";
import { stampRegionUpdatesFromTransformEnd } from "../lib/stampRegionTransform";
import { stagePointerToContentSpace } from "../lib/viewZoom";
import { useEditorViewport } from "../hooks/useEditorViewport";
import { useEditorViewportGestures } from "../hooks/useEditorViewportGestures";
import { EditorStampRegionNode } from "./EditorStampRegionNode";
import { EditorPaintStrokeNode } from "./EditorPaintStrokeNode";
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
  selectedPaintType: PaintType;
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
  /** 仮想 crop。フル画像は null */
  cropRect?: CropRect | null;
  /** crop をその場で反映する */
  onUpdateCropRect?: (rect: CropRect) => void;
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
  "fill-text": { fill: "rgba(0,0,0,0.3)", stroke: "#000000" },
};

/** ペイント種別ごとの、描画中プレビュー／カーソルの表示色 */
const PAINT_PREVIEW_STROKE_BY_TYPE: Record<PaintType, string> = {
  "fill-black": "#000000",
  mosaic: "#6b7280",
  blur: "#93c5fd",
};

/** Transformer のリサイズ最小サイズ（px）。この値未満へのリサイズを禁止する */
const MIN_TRANSFORM_SIZE = 10;

/** crop 枠 Konva ノード ID */
const EDITOR_CROP_RECT_ID = "editor-crop-rect";

/** モードごとの CSS カーソル種別 */
const MODE_CURSORS: Record<EditorMode, string> = {
  select: "default",
  rect: "crosshair",
  paint: "cell",
  crop: "default",
};

/**
 * rect モードで新規矩形描画を開始してよい空白キャンバス上のヒットかどうかを判定する
 *
 * @param target - Konva イベントのターゲットノード
 * @param stage - Konva ステージ
 */
function isBlankCanvasTarget(target: Konva.Node, stage: Konva.Stage): boolean {
  return target === stage || target.getType() === "Stage";
}

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
 * 選択・矩形追加・ペイント・トリミングをサポートし、
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
  selectedPaintType,
  brushSize,
  onSelectItem,
  onAddStampRegion,
  onAddPaintStroke,
  onUpdateStampRegion,
  onUpdatePaintStroke,
  stampImages,
  selectedStampFileName,
  onDeleteSelected,
  cropRect = null,
  onUpdateCropRect,
  pinViewportControls = false,
  className,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const cropTransformerRef = useRef<Konva.Transformer>(null);
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
    pinViewportControls,
  });

  /**
   * キーボードショートカット
   *
   * - Escape: 選択解除（文字入力中のみ無効。ボタンフォーカス時は有効）
   * - Delete / Backspace: 選択中アイテムを削除
   * - 0: 等倍・中央にリセット
   */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isTextInputKeyboardTarget(e.target)) {
        onSelectItem(null);
      } else if (e.key === "0" && !isEditableKeyboardTarget(e.target)) {
        resetViewport();
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedId !== null &&
        !isEditableKeyboardTarget(e.target)
      ) {
        onDeleteSelected();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, onSelectItem, onDeleteSelected, resetViewport]);

  /** 初回ペイント前にコンテナ幅を同期し、レイアウトシフトを抑える */
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth;
    if (w > 0) {
      setStageWidth(w);
    }
  }, [imageNaturalHeight, imageNaturalWidth]);

  /** コンテナの幅変化を ResizeObserver で継続的に監視する */
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
   * トリミングモードの Transformer を crop 枠へ再アタッチする
   */
  useEffect(() => {
    const transformer = cropTransformerRef.current;
    if (!transformer) return;

    if (mode !== "crop") {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const stage = transformer.getStage();
    const node = stage?.findOne(`#${EDITOR_CROP_RECT_ID}`) ?? null;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [mode, cropRect, viewZoom, viewCenter.x, viewCenter.y, stageWidth, stageHeight]);

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

    if (mode === "crop") {
      return;
    }

    if (mode === "rect" && !isBlankCanvasTarget(e.target, stage)) {
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
          ...(selectedStampType === "fill-text"
            ? {
                overlayText: DEFAULT_OVERLAY_TEXT,
                textColor: DEFAULT_TEXT_COLOR,
                backgroundColor: DEFAULT_BACKGROUND_COLOR,
              }
            : {}),
        });
      }
      setDrawingRect(null);
      drawStart.current = null;
    } else if (mode === "paint" && drawingStroke) {
      if (drawingStroke.points.length >= 2) {
        onAddPaintStroke({
          points: drawingStroke.points,
          brushSize,
          paintType: selectedPaintType,
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
   * @param node - 黒塗り Line またはエフェクト Group
   */
  function handlePaintStrokeDragEnd(id: string, node: Konva.Line | Konva.Group) {
    const dx = node.x();
    const dy = node.y();
    if (dx === 0 && dy === 0) return;

    const line = node instanceof Konva.Line ? node : node.findOne<Konva.Line>(".paint-hit-line");
    if (!line) return;
    const localPoints = line.points();
    const newImagePoints: { x: number; y: number }[] = [];
    for (let i = 0; i < localPoints.length; i += 2) {
      newImagePoints.push({
        x: ((localPoints[i] ?? 0) + dx) / scaleX,
        y: ((localPoints[i + 1] ?? 0) + dy) / scaleY,
      });
    }

    node.x(0);
    node.y(0);
    line.points(newImagePoints.flatMap((p) => [p.x * scaleX, p.y * scaleY]));

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
   * @param node - 黒塗り Line またはエフェクト Group
   */
  function handlePaintStrokeTransformEnd(
    id: string,
    stroke: PaintStroke,
    node: Konva.Line | Konva.Group
  ) {
    const transform = node.getTransform();
    const line = node instanceof Konva.Line ? node : node.findOne<Konva.Line>(".paint-hit-line");
    if (!line) return;
    const localPoints = line.points();
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
    line.points(newImagePoints.flatMap((p) => [p.x * scaleX, p.y * scaleY]));

    const newBrushSize = stroke.brushSize * ((scaleAbsX + scaleAbsY) / 2);
    onUpdatePaintStroke(id, { points: newImagePoints, brushSize: newBrushSize });
  }

  /**
   * 形状のトランスフォーム終了時にサイズ・位置・回転を元画像空間へ保存する
   *
   * AABB（外接矩形）は焼かず、scale は width/height に、rotation は角度として保持する。
   *
   * @param id - 領域のID
   * @param node - Konva ノード
   */
  function handleTransformEnd(id: string, node: Konva.Node) {
    const region = stampRegions.find((r) => r.id === id);
    if (!region) return;

    const updates = stampRegionUpdatesFromTransformEnd(
      region,
      {
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
      },
      scaleX,
      scaleY
    );

    node.scaleX(1);
    node.scaleY(1);
    onUpdateStampRegion(id, updates);
  }

  const isStampRegionInteractive = mode === "select" || mode === "rect";
  const isPaintStrokeInteractive = mode === "select";
  const showTransformer = shouldShowEditorTransformer(mode, selectedId, stampRegions);
  const editingCrop =
    cropRect ??
    (imageNaturalWidth > 0 && imageNaturalHeight > 0
      ? createFullImageCropRect(imageNaturalWidth, imageNaturalHeight)
      : null);
  const overlayCrop = mode === "crop" ? editingCrop : cropRect;

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

      {overlayCrop && (
        <EditorCropOverlay
          crop={overlayCrop}
          stageWidth={stageWidth}
          stageHeight={stageHeight}
          scaleX={scaleX}
          scaleY={scaleY}
        />
      )}

      {/* マスキング領域 */}
      {stampRegions.map((region) => (
        <EditorStampRegionNode
          key={region.id}
          region={region}
          scaleX={scaleX}
          scaleY={scaleY}
          isInteractive={isStampRegionInteractive}
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
        <EditorPaintStrokeNode
          key={stroke.id}
          stroke={stroke}
          scaleX={scaleX}
          scaleY={scaleY}
          bgImage={bgImage}
          stageWidth={stageWidth}
          stageHeight={stageHeight}
          isInteractive={isPaintStrokeInteractive}
          selected={selectedId === stroke.id}
          onSelect={() => onSelectItem(stroke.id)}
          onDragEnd={(node) => handlePaintStrokeDragEnd(stroke.id, node)}
          onTransformEnd={(node) => handlePaintStrokeTransformEnd(stroke.id, stroke, node)}
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

      {/* 描画中のペイントプレビュー（重いエフェクト生成は確定後に行い、描画中は簡易表示） */}
      {drawingStroke && mode === "paint" && drawingStroke.points.length >= 2 && (
        <Line
          points={drawingStroke.points.flatMap((p) => [p.x * scaleX, p.y * scaleY])}
          stroke={PAINT_PREVIEW_STROKE_BY_TYPE[selectedPaintType]}
          strokeWidth={brushSize * scaleX}
          lineCap="round"
          lineJoin="round"
          opacity={0.6}
          listening={false}
        />
      )}

      {/* ペイント中のカーソルインジケーター */}
      {drawingStroke && mode === "paint" && drawingStroke.points.length >= 1 && (
        <Circle
          x={(drawingStroke.points[drawingStroke.points.length - 1]?.x ?? 0) * scaleX}
          y={(drawingStroke.points[drawingStroke.points.length - 1]?.y ?? 0) * scaleY}
          radius={(brushSize * scaleX) / 2}
          fill={PAINT_PREVIEW_STROKE_BY_TYPE[selectedPaintType]}
          opacity={0.25}
          listening={false}
        />
      )}

      {/* Transformer（選択モード、または追加モードでスタンプ領域選択中） */}
      {showTransformer && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < MIN_TRANSFORM_SIZE || newBox.height < MIN_TRANSFORM_SIZE)
              return oldBox;
            return newBox;
          }}
        />
      )}

      {mode !== "crop" && cropRect && (
        <Rect
          x={cropRect.x * scaleX}
          y={cropRect.y * scaleY}
          width={cropRect.width * scaleX}
          height={cropRect.height * scaleY}
          stroke="#fbbf24"
          strokeWidth={2}
          dash={[8, 4]}
          listening={false}
        />
      )}

      {mode === "crop" && editingCrop && onUpdateCropRect && (
        <>
          <Rect
            id={EDITOR_CROP_RECT_ID}
            x={editingCrop.x * scaleX}
            y={editingCrop.y * scaleY}
            width={editingCrop.width * scaleX}
            height={editingCrop.height * scaleY}
            stroke="#fbbf24"
            strokeWidth={2}
            dash={[8, 4]}
            fill="rgba(0,0,0,0)"
            draggable
            dragBoundFunc={(pos) => {
              const w = editingCrop.width * scaleX;
              const h = editingCrop.height * scaleY;
              return {
                x: Math.min(Math.max(0, pos.x), Math.max(0, stageWidth - w)),
                y: Math.min(Math.max(0, pos.y), Math.max(0, stageHeight - h)),
              };
            }}
            onDragEnd={(e) => {
              const node = e.target;
              onUpdateCropRect(
                clampCropRect(
                  {
                    x: node.x() / scaleX,
                    y: node.y() / scaleY,
                    width: node.width() / scaleX,
                    height: node.height() / scaleY,
                  },
                  imageNaturalWidth,
                  imageNaturalHeight
                )
              );
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              const next = clampCropRect(
                {
                  x: node.x() / scaleX,
                  y: node.y() / scaleY,
                  width: (node.width() * node.scaleX()) / scaleX,
                  height: (node.height() * node.scaleY()) / scaleY,
                },
                imageNaturalWidth,
                imageNaturalHeight
              );
              node.scaleX(1);
              node.scaleY(1);
              node.x(next.x * scaleX);
              node.y(next.y * scaleY);
              node.width(next.width * scaleX);
              node.height(next.height * scaleY);
              onUpdateCropRect(next);
            }}
          />
          <Transformer
            ref={cropTransformerRef}
            rotateEnabled={false}
            keepRatio={false}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < MIN_TRANSFORM_SIZE || newBox.height < MIN_TRANSFORM_SIZE) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </>
      )}
    </>
  );

  const viewportControls = (
    <EditorViewportControls
      viewZoom={viewZoom}
      onResetViewport={resetViewport}
      pinViewportControls={pinViewportControls}
    />
  );

  /** 拡大時は空白ドラッグでパンできるため grab。Space 押下中も同カーソル */
  const stageCursor =
    canPan && mode === "select"
      ? gestures.isGestureCapturing || gestures.hasActivePanSession()
        ? "grabbing"
        : "grab"
      : MODE_CURSORS[mode];

  /** モーダル内: 選択モードは縦スクロールを優先、描画・crop はタッチ操作をキャンバスに取る */
  const stageTouchAction = getEditorStageTouchAction(pinViewportControls, mode);

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
