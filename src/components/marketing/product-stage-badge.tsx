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
