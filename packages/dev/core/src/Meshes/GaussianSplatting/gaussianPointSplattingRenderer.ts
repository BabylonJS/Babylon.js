/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianPointSplattingRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianPointSplattingRenderer.pure";

import "../../ShadersWGSL/gpsPreprocess.compute";
import "../../ShadersWGSL/gpsScanBlocks.compute";
import "../../ShadersWGSL/gpsScanSums.compute";
import "../../ShadersWGSL/gpsScanAdd.compute";
import "../../ShadersWGSL/gpsPartition.compute";
import "../../ShadersWGSL/gpsSplat.compute";
import "../../ShadersWGSL/gpsResolve.compute";
import "../../ShadersWGSL/gpsHiZBuild.compute";
