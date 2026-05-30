import { MediaAsset, SelectionPolicyInput } from "../../shared-contracts/mediaCompositionTypes";

export function selectHybridAssets(input: SelectionPolicyInput): MediaAsset[] {
  const maxAssets = Math.max(1, input.maxAssets);
  const stockCount = Math.max(1, Math.round(maxAssets * input.preferredMixRatio.stockWeight));
  const aiCount = Math.max(0, maxAssets - stockCount);

  const rankedStock = [...input.stockAssets].sort((a, b) => b.score - a.score).slice(0, stockCount);
  const rankedAi = [...input.aiAssets].sort((a, b) => b.score - a.score).slice(0, aiCount);

  const combined = [...rankedStock, ...rankedAi];
  return combined.slice(0, maxAssets);
}
