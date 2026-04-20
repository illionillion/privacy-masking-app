"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FaceDetectionResult, UseFaceDetectionReturn } from "../types";

/**
 * `NEXT_PUBLIC_BASE_PATH` を考慮した公開アセットURLを生成する。
 *
 * @param assetPath - `public` 配下のアセット相対パス
 * @returns ベースパスを考慮した公開URL
 */
const buildPublicAssetPath = (assetPath: string): string => {
  const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const normalizedBasePath =
    rawBasePath === "/" || rawBasePath.length === 0
      ? ""
      : `/${rawBasePath.replace(/^\/+|\/+$/g, "")}`;
  const normalizedAssetPath = assetPath.replace(/^\/+/, "");
  return `${normalizedBasePath}/${normalizedAssetPath}`;
};

/** モデルのロードURLパス */
const MODEL_URL = buildPublicAssetPath("models");

/** face-api モジュールのキャッシュ（全フックインスタンスで共有） */
let faceapiCache: typeof import("@vladmandic/face-api") | null = null;

/**
 * face-api モジュールを取得する。初回のみ dynamic import し以降はキャッシュを返す。
 *
 * @returns face-api モジュール
 */
async function getFaceApi() {
  if (!faceapiCache) {
    faceapiCache = await import("@vladmandic/face-api");
  }
  return faceapiCache;
}

/**
 * 顔検出フック
 *
 * face-api.js の TinyFaceDetector を使用して、
 * モデルのロードと顔検出処理を提供する。
 *
 * @returns {UseFaceDetectionReturn} 顔検出の状態と実行関数
 */
export function useFaceDetection(): UseFaceDetectionReturn {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 最後に開始した検出呼び出しのID（古い結果の state 上書きを防ぐ） */
  const detectRequestRef = useRef(0);
  /** 現在処理中の検出呼び出し数（1つでも走っている間は isDetecting を true に保つ） */
  const inFlightRef = useRef(0);
  /** アンマウント後の state 更新を防ぐフラグ */
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    /** face-api モデルをロードする */
    const loadModel = async () => {
      try {
        const faceapi = await getFaceApi();
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        if (isMountedRef.current) {
          setIsModelLoading(false);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "モデルのロードに失敗しました");
          setIsModelLoading(false);
        }
      }
    };

    void loadModel();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * 画像内の顔を検出する
   *
   * @param imageElement - 検出対象の HTMLImageElement
   */
  const detectFaces = useCallback(
    async (imageElement: HTMLImageElement): Promise<FaceDetectionResult[]> => {
      const callId = ++detectRequestRef.current;
      inFlightRef.current++;
      setIsDetecting(true);
      setError(null);
      try {
        const faceapi = await getFaceApi();
        const results = await faceapi.detectAllFaces(
          imageElement,
          new faceapi.TinyFaceDetectorOptions()
        );
        const mappedDetections: FaceDetectionResult[] = results.map((d) => ({
          x: d.box.x,
          y: d.box.y,
          width: d.box.width,
          height: d.box.height,
          score: d.score,
        }));
        return mappedDetections;
      } catch (err) {
        if (callId === detectRequestRef.current) {
          if (isMountedRef.current)
            setError(err instanceof Error ? err.message : "顔検出中にエラーが発生しました");
        }
        return [];
      } finally {
        inFlightRef.current--;
        if (inFlightRef.current === 0) {
          if (isMountedRef.current) setIsDetecting(false);
        }
      }
    },
    []
  );

  return { isModelLoading, isDetecting, error, detectFaces };
}
