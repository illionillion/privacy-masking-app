import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SITE_DEFAULT_DESCRIPTION } from "@/lib/siteSeo";
import { getSiteUrl } from "@/lib/siteUrl";
import { JsonLdWebApplication } from "./JsonLdWebApplication";

describe("JsonLdWebApplication", () => {
  it("application/ld+json の script と WebApplication 構造を出力する", () => {
    const { container } = render(<JsonLdWebApplication />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).not.toBeNull();
    expect(script).toHaveAttribute("type", "application/ld+json");

    const jsonLd = JSON.parse(script?.textContent ?? "") as {
      "@type": string;
      name: string;
      alternateName: string;
      url: string;
      description: string;
      featureList: string[];
    };

    expect(jsonLd["@type"]).toBe("WebApplication");
    expect(jsonLd.name).toBe("伏せ太郎");
    expect(jsonLd.alternateName).toBe("Fusely");
    expect(jsonLd.url).toBe(getSiteUrl());
    expect(jsonLd.description).toBe(SITE_DEFAULT_DESCRIPTION);
    expect(jsonLd.featureList).toContain("検出できない部分の手動調整");
  });
});
