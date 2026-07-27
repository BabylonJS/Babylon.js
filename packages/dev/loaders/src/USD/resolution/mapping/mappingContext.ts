import { type ISdfLayer, type ISdfPrimSpec } from "../sdf/index";
import { type IResolvedDiagnostic, type IResolvedMaterial, type IResolvedMesh } from "../resolvedStage";

/** Shared state used while mapping one flattened Sdf layer into a resolved stage. */
export interface IStageMappingContext {
    /** Source layer being mapped. */
    layer: ISdfLayer;
    /** Absolute prim-path lookup for relationship and shader-network resolution. */
    primByPath: ReadonlyMap<string, ISdfPrimSpec>;
    /** Shared mesh pool owned by the resolved stage under construction. */
    meshes: IResolvedMesh[];
    /** Shared material pool owned by the resolved stage under construction. */
    materials: IResolvedMaterial[];
    /** Mesh pool lookup by deterministic geometry key. */
    meshIndexByKey: Map<string, number>;
    /** Material pool lookup by Material prim path. */
    materialIndexByPath: Map<string, number>;
    /** Non-fatal diagnostics collected during mapping. */
    diagnostics: IResolvedDiagnostic[];
    /** Set once the stage-wide unauthored-default subdivision advisory has been emitted, so it is reported only once per stage. */
    emittedUnauthoredSubdivisionDiagnostic?: boolean;
}
