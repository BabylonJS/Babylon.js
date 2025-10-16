// Export the parts of inspector that are intended to be part of the public API.
export * from "./components/properties/boundProperty";
export * from "./components/properties/linkToEntityPropertyLine";
export type { EntityBase, EntityDisplayInfo, SceneExplorerCommand, SceneExplorerCommandProvider, SceneExplorerSection } from "./components/scene/sceneExplorer";
export * from "./components/extensibleAccordion";
export { SidePaneContainer } from "./components/pane";
export * from "./components/teachingMoment";
export * from "./extensibility/extensionFeed";
export * from "./extensibility/builtInsExtensionFeed";
export * from "./hooks/compoundPropertyHooks";
export * from "./hooks/instrumentationHooks";
export * from "./hooks/observableHooks";
export * from "./hooks/pollingHooks";
export * from "./hooks/resourceHooks";
export * from "./hooks/settingsHooks";
export * from "./hooks/teachingMomentHooks";
export * from "./instrumentation/functionInstrumentation";
export * from "./instrumentation/propertyInstrumentation";
export * from "./misc/observableCollection";
export * from "./modularity/serviceDefinition";
export type { IPropertiesService } from "./services/panes/properties/propertiesService";
export { PropertiesServiceIdentity } from "./services/panes/properties/propertiesService";
export type { ISceneExplorerService } from "./services/panes/scene/sceneExplorerService";
export { SceneExplorerServiceIdentity } from "./services/panes/scene/sceneExplorerService";
export type { IDebugService } from "./services/panes/debugService";
export { DebugServiceIdentity } from "./services/panes/debugService";

export type { ISettingsService } from "./services/panes/settingsService";
export { SettingsServiceIdentity } from "./services/panes/settingsService";

export type { IStatsService } from "./services/panes/statsService";
export { StatsServiceIdentity } from "./services/panes/statsService";

export type { IToolsService } from "./services/panes/toolsService";
export { ToolsServiceIdentity } from "./services/panes/toolsService";

export * from "./services/sceneContext";
export * from "./services/selectionService";
export * from "./services/settingsContext";
export type { IShellService, ToolbarItemDefinition, SidePaneDefinition, CentralContentDefinition } from "./services/shellService";
export { ShellServiceIdentity } from "./services/shellService";
export * from "./inspector";

// Export the shared primitive UI controls that can be used for extending the inspector.
export * from "shared-ui-components/fluent/primitives/accordion";
export * from "shared-ui-components/fluent/primitives/button";
export * from "shared-ui-components/fluent/primitives/checkbox";
export * from "shared-ui-components/fluent/primitives/collapse";
export * from "shared-ui-components/fluent/primitives/colorPicker";
export * from "shared-ui-components/fluent/primitives/comboBox";
export * from "shared-ui-components/fluent/primitives/draggable";
export * from "shared-ui-components/fluent/primitives/dropdown";
export * from "shared-ui-components/fluent/primitives/gradient";
export * from "shared-ui-components/fluent/primitives/infoLabel";
export * from "shared-ui-components/fluent/primitives/lazyComponent";
export * from "shared-ui-components/fluent/primitives/link";
export * from "shared-ui-components/fluent/primitives/list";
export * from "shared-ui-components/fluent/primitives/messageBar";
export * from "shared-ui-components/fluent/primitives/positionedPopover";
export * from "shared-ui-components/fluent/primitives/primitive";
export * from "shared-ui-components/fluent/primitives/searchBar";
export * from "shared-ui-components/fluent/primitives/searchBox";
export * from "shared-ui-components/fluent/primitives/spinButton";
export * from "shared-ui-components/fluent/primitives/switch";
export * from "shared-ui-components/fluent/primitives/syncedSlider";
export * from "shared-ui-components/fluent/primitives/textarea";
export * from "shared-ui-components/fluent/primitives/textInput";
export * from "shared-ui-components/fluent/primitives/toggleButton";

// Export the shared hoc UI controls that can be used for extending the inspector.
export * from "shared-ui-components/fluent/hoc/buttonLine";
export * from "shared-ui-components/fluent/hoc/fileUploadLine";
export * from "shared-ui-components/fluent/hoc/gradientList";
export * from "shared-ui-components/fluent/hoc/pane";
export * from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/hexPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/textAreaPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
