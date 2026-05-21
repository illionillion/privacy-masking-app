import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { MASKING_DEMO_SAMPLES } from "@/lib/maskingDemoSamples";

/** Before/After デモセクション */
export function DemoSection() {
  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            こんな感じでマスキングできます
          </h2>
          <p className="mt-3 text-zinc-500">
            画像を選択すると、顔・文字を検出してマスキングできます。手動での調整も可能です
          </p>
        </div>

        <div className="space-y-10">
          {MASKING_DEMO_SAMPLES.map(
            ({ label, description, beforeSrc, afterSrc, beforeAlt, afterAlt }) => (
              <div key={label}>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="inline-block w-fit rounded-full bg-indigo-600 px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">
                    {label}
                  </span>
                  <span className="text-sm font-medium text-zinc-700 sm:text-base">
                    {description}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
                      <span className="text-sm font-semibold text-zinc-500">処理前</span>
                    </div>
                    <div className="p-5">
                      <div className="overflow-hidden rounded-xl">
                        <Image
                          src={beforeSrc}
                          alt={beforeAlt}
                          width={600}
                          height={400}
                          sizes="(min-width: 640px) calc(50vw - 3rem), calc(100vw - 2.5rem)"
                          className="w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-md ring-2 ring-indigo-100">
                    <div className="border-b border-indigo-100 bg-indigo-50 px-5 py-3">
                      <span className="text-sm font-semibold text-indigo-700">処理後</span>
                    </div>
                    <div className="p-5">
                      <div className="relative overflow-hidden rounded-xl">
                        <Image
                          src={afterSrc}
                          alt={afterAlt}
                          width={600}
                          height={400}
                          sizes="(min-width: 640px) calc(50vw - 3rem), calc(100vw - 2.5rem)"
                          className="w-full object-cover"
                        />
                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold text-white shadow">
                          <CheckCircle className="h-3 w-3" aria-hidden="true" />
                          マスク済み
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
