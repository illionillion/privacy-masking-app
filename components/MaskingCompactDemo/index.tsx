import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { PRIMARY_MASKING_DEMO } from "@/lib/maskingDemoSamples";

/**
 * マスキングツールページ用のコンパクト Before/After デモ（1 ペアのみ）。
 */
export function MaskingCompactDemo() {
  const { label, description, beforeSrc, afterSrc, beforeAlt, afterAlt } = PRIMARY_MASKING_DEMO;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <span className="inline-block w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
          {label}
        </span>
        <p className="text-sm text-zinc-600">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <div className="border-b border-zinc-100 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-500">
            処理前
          </div>
          <div className="p-2">
            <Image
              src={beforeSrc}
              alt={beforeAlt}
              width={600}
              height={400}
              sizes="(min-width: 640px) 280px, calc(100vw - 3rem)"
              className="w-full rounded-md object-cover"
            />
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-indigo-200 ring-1 ring-indigo-100">
          <div className="border-b border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            処理後
          </div>
          <div className="relative p-2">
            <Image
              src={afterSrc}
              alt={afterAlt}
              width={600}
              height={400}
              sizes="(min-width: 640px) 280px, calc(100vw - 3rem)"
              className="w-full rounded-md object-cover"
            />
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              <CheckCircle className="h-3 w-3" aria-hidden="true" />
              マスク済み
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
