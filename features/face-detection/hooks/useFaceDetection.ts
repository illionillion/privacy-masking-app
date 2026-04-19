"use client";

import { useState, useEffect } from "react";
import type { FaceDetectionResult, UseFaceDetectionReturn } from "../types";

/** モデルのロードURLパス */
const MODEL_URL = "/models";

/**
 * 顔検出フックs
 *
 * face-api.js の TinyFaceDetector を使用して、
 * モデルのロードと顔検出処理を提供する。
 *
 * @returns {UseFaceDetectionReturn} 顔検出の状態と実行関数
 */
export function useFaceDetection(): UseFaceDetectionReturn {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<FaceDetectionResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    /** face-api モデルをロードする */
    const loadModel = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        if (isMounted) {
          setIsModelLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "モデルのロードに失敗しました");
          setIsModelLoading(false);
        }
      }
    };

    void loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * 画像内の顔を検出する
   *
   * @param imageElement - 検出対象の HTMLImageElement
   */
  const detectFaces = async (imageElement: HTMLImageElement): Promise<void> => {
    setIsDetecting(true);
    setError(null);
    try {
      const faceapi = await import("@vladmandic/face-api");
      const results = await faceapi.detectAllFaces(
        imageElement,
        new faceapi.TinyFaceDetectorOptions()
      );
      setDetections(
        results.map((d) => ({
          x: d.box.x,
          y: d.box.y,
          width: d.box.width,
          height: d.box.height,
          score: d.score,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "顔検出中にエラーが発生しました");
    } finally {
      setIsDetecting(false);
    }
  };

  return { isModelLoading, isDetecting, detections, error, detectFaces };
}
