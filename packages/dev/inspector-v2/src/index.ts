// Export the parts of Inspector that are intended to be part of the public API.
export * from "./index.common";

// Export the Full Inspector APIs.
export * from "./components/properties/boundProperty";
export * from "./components/properties/linkToEntityPropertyLine";
export type { EntityDisplayInfo, SceneExplorerCommand, SceneExplorerCommandProvider, SceneExplorerSection } from "./components/scene/sceneExplorer";
export * from "./hooks/compoundPropertyHooks";
export type { ISceneExplorerService } from "./services/panes/scene/sceneExplorerService";
export { SceneExplorerServiceIdentity } from "./services/panes/scene/sceneExplorerService";
export type { IDebugService } from "./services/panes/debugService";
export { DebugServiceIdentity } from "./services/panes/debugService";
export type { IStatsService } from "./services/panes/statsService";
export { StatsServiceIdentity } from "./services/panes/statsService";
export type { IToolsService } from "./services/panes/toolsService";
export { ToolsServiceIdentity } from "./services/panes/toolsService";
export type { IGizmoService, GizmoMode } from "./services/gizmoService";
export { GizmoServiceIdentity } from "./services/gizmoService";
export * from "./services/sceneContext";
export { inspectorAssetNotFoundHandler } from "./services/smartAssetHandler";
export { ShowInspector } from "./inspector";
export { StartInspectable, type InspectableToken, type InspectableOptions } from "./inspectable";
export { ConvertOptions, Inspector } from "./legacy/inspector";
export { AttachDebugLayer, DetachDebugLayer } from "./legacy/debugLayer";

// Export the Babylon-specific UI controls that can be used for extending the Full Inspector.
export * from "shared-ui-components/fluent/primitives/colorPicker";
export * from "shared-ui-components/fluent/primitives/gradient";
export * from "shared-ui-components/fluent/primitives/materialSelector";
export * from "shared-ui-components/fluent/primitives/nodeSelector";
export * from "shared-ui-components/fluent/primitives/skeletonSelector";
export * from "shared-ui-components/fluent/primitives/textureSelector";
export * from "shared-ui-components/fluent/hoc/gradientList";
export * from "shared-ui-components/fluent/hoc/textureUpload";
export * from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import { AttachDebugLayer } from "./legacy/debugLayer";

// Attach Inspector v2 to Scene.debugLayer as a side effect for back compat.
AttachDebugLayer();
