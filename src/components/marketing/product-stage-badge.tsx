/**
 * Inline ProductStage indicator. Maps the four catalog stages (beta,
 * coming-soon, building, exploring) to label + badge variant so the
 * marketplace cards and product page headers all read the same.
 * Single source of truth so adding a new stage means updating both
 * maps here and ProductStage in src/lib/types.ts.
 */
import { Badge } from "@/components/ui/badge";
import type { ProductStage } from "@/lib/types";

const STAGE_LABEL: Record<ProductStage, string> = {
  beta: "Beta",
  "coming-soon": "Coming Soon",
  building: "Building",
  exploring: "Exploring",
};

const STAGE_VARIANT: Record<
  ProductStage,
  "success" | "info" | "warning" | "neutral"
> = {
  beta: "success",
  "coming-soon": "info",
  building: "warning",
  exploring: "neutral",
};

export function ProductStageBadge({ stage }: { stage: ProductStage }) {
  return <Badge variant={STAGE_VARIANT[stage]}>{STAGE_LABEL[stage]}</Badge>;
}

export function stageLabel(stage: ProductStage): string {
  return STAGE_LABEL[stage];
}
