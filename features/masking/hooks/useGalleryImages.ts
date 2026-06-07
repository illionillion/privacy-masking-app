"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import { useConfirmStore } from "@/lib/confirmStore";
import { clearAllImageEditorSnapshots } from "../lib/imageEditorCache";
import type { MaskingImageItem } from "../types";

/** useGalleryImages の戻り値 */
export interface UseGalleryImagesReturn {
  images: MaskingImageItem[];
  setImages: Dispatch<SetStateAction<MaskingImageItem[]>>;
  imagesRef: RefObject<MaskingImageItem[]>;
  isMountedRef: RefObject<boolean>;
  activeImageId: string | null;
  setActiveImageId: Dispatch<SetStateAction<string | null>>;
  editingImageId: string | null;
  setEditingImageId: Dispatch<SetStateAction<string | null>>;
  editingImage: MaskingImageItem | undefined;
  handleOpenEdit: (imageId: string) => void;
  handleRendered: (imageId: string, blobUrl: string) => void;
  handleClearAll: () => Promise<void>;
}

/**
 * ギャラリー画像コレクションの state と Blob URL lifecycle を管理する
 *
 * @returns 画像 state・編集状態・操作ハンドラ
 */
export function useGalleryImages(): UseGalleryImagesReturn {
  const [images, setImagesState] = useState<MaskingImageItem[]>([]);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const imagesRef = useRef(images);
  const isMountedRef = useRef(true);

  /** setImages 更新時に imagesRef も即同期し、effect 実行前の stale を防ぐ */
  const setImages = useCallback((action: SetStateAction<MaskingImageItem[]>) => {
    setImagesState((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      imagesRef.current = next;
      return next;
    });
  }, []);

  /** コンポーネント破棄時に imageUrl の Blob URL をすべて解放し isMountedRef を false にする */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      imagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.imageUrl);
        if (image.maskedBlobUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(image.maskedBlobUrl);
        }
      });
      clearAllImageEditorSnapshots();
    };
  }, []);

  const handleOpenEdit = useCallback((imageId: string) => {
    const target = imagesRef.current.find((image) => image.id === imageId);
    if (!target || target.isProcessing || target.processingError) return;
    setEditingImageId(imageId);
    setActiveImageId(imageId);
  }, []);

  const handleRendered = useCallback(
    (imageId: string, blobUrl: string) => {
      setImages((prev) =>
        prev.map((image) => {
          if (image.id !== imageId || image.maskedBlobUrl === blobUrl || image.processingError) {
            return image;
          }

          return {
            ...image,
            maskedBlobUrl: blobUrl,
          };
        })
      );
    },
    [setImages]
  );

  const handleClearAll = useCallback(async () => {
    try {
      const ok = await useConfirmStore.getState().open("すべての画像と編集内容をクリアしますか？");
      if (!ok) return;
      if (!isMountedRef.current) return;
      imagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.imageUrl);
        if (image.maskedBlobUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(image.maskedBlobUrl);
        }
      });
      clearAllImageEditorSnapshots();
      setImages([]);
      setActiveImageId(null);
      setEditingImageId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "クリアに失敗しました";
      toast.error(message);
    }
  }, [setImages]);

  const editingImage = editingImageId
    ? images.find((image) => image.id === editingImageId)
    : undefined;

  return {
    images,
    setImages,
    imagesRef,
    isMountedRef,
    activeImageId,
    setActiveImageId,
    editingImageId,
    setEditingImageId,
    editingImage,
    handleOpenEdit,
    handleRendered,
    handleClearAll,
  };
}
