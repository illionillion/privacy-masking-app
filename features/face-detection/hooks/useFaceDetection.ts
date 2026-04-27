"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
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
 * face-api.js の ssdMobilenetv1 を使用して、
 * モデルのロードと顔検出処理を提供する。
 *
 * @returns {UseFaceDetectionReturn} 顔検出の状態と実行関数
 */
export function useFaceDetection(): UseFaceDetectionReturn {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
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
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        if (isMountedRef.current) {
          setIsModelLoading(false);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "モデルのロードに失敗しました";
        toast.error(`モデルロードエラー: ${message}`);
        if (isMountedRef.current) {
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
   * 顔検出に失敗した場合は例外を再スローする。
   * 呼び出し元（MaskingGallery 等）で catch して通知・状態管理を行うこと。
   *
   * @param imageElement - 検出対象の HTMLImageElement
   * @returns 検出された顔領域の配列
   * @throws 顔検出に失敗した場合
   */
  const detectFaces = useCallback(
    async (imageElement: HTMLImageElement): Promise<FaceDetectionResult[]> => {
      if (!isMountedRef.current) {
        return [];
      }

      inFlightRef.current++;

      if (isMountedRef.current) {
        setIsDetecting(true);
      }
      try {
        const faceapi = await getFaceApi();
        const results = await faceapi.detectAllFaces(
          imageElement,
          new faceapi.SsdMobilenetv1Options()
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
        /** 呼び出し元（MaskingGallery 等）で顔検出失敗を検知できるよう再スロー */
        throw err;
      } finally {
        inFlightRef.current--;
        if (inFlightRef.current === 0) {
          if (isMountedRef.current) setIsDetecting(false);
        }
      }
    },
    []
  );

  return { isModelLoading, isDetecting, detectFaces };
}
