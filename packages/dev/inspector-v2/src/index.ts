// Export the parts of inspector that are intended to be part of the public API.
export * from "./components/properties/boundProperty";
export * from "./components/properties/linkToEntityPropertyLine";
export type { EntityDisplayInfo, SceneExplorerCommand, SceneExplorerCommandProvider, SceneExplorerSection } from "./components/scene/sceneExplorer";
export * from "shared-ui-components/modularTool/components/errorBoundary";
export * from "shared-ui-components/modularTool/components/extensibleAccordion";
export { SidePaneContainer } from "shared-ui-components/modularTool/components/pane";
export * from "shared-ui-components/modularTool/components/theme";
export * from "shared-ui-components/modularTool/components/teachingMoment";
export * from "./contexts/propertyContext";
export * from "shared-ui-components/modularTool/extensibility/extensionFeed";
export * from "shared-ui-components/modularTool/extensibility/builtInsExtensionFeed";
export * from "./hooks/compoundPropertyHooks";
export * from "./hooks/instrumentationHooks";
export * from "shared-ui-components/modularTool/hooks/observableHooks";
export * from "./hooks/pollingHooks";
export * from "shared-ui-components/modularTool/hooks/resourceHooks";
export * from "./hooks/settingsHooks";
export * from "shared-ui-components/modularTool/hooks/teachingMomentHooks";
export * from "shared-ui-components/modularTool/hooks/themeHooks";
export * from "./instrumentation/functionInstrumentation";
export * from "./instrumentation/propertyInstrumentation";
export * from "shared-ui-components/modularTool/misc/observableCollection";
export * from "shared-ui-components/modularTool/modularity/serviceDefinition";
export type { IPropertiesService } from "./services/panes/properties/propertiesService";
export { PropertiesServiceIdentity } from "./services/panes/properties/propertiesService";
export type { ISceneExplorerService } from "./services/panes/scene/sceneExplorerService";
export { SceneExplorerServiceIdentity } from "./services/panes/scene/sceneExplorerService";
export type { IDebugService } from "./services/panes/debugService";
export { DebugServiceIdentity } from "./services/panes/debugService";
export type { ISettingsService } from "shared-ui-components/modularTool/services/settingsService";
export { SettingsServiceIdentity } from "shared-ui-components/modularTool/services/settingsService";
export type { IStatsService } from "./services/panes/statsService";
export { StatsServiceIdentity } from "./services/panes/statsService";
export type { IToolsService } from "./services/panes/toolsService";
export { ToolsServiceIdentity } from "./services/panes/toolsService";
export type { IThemeService } from "shared-ui-components/modularTool/services/themeService";
export { ThemeServiceIdentity } from "shared-ui-components/modularTool/services/themeService";
export type { ISettingsStore, SettingDescriptor } from "shared-ui-components/modularTool/services/settingsStore";
export { SettingsStoreIdentity } from "shared-ui-components/modularTool/services/settingsStore";
export type { IGizmoService, GizmoMode } from "./services/gizmoService";
export { GizmoServiceIdentity } from "./services/gizmoService";
export type { IWatcherService } from "./services/watcherService";
export { WatcherServiceIdentity } from "./services/watcherService";

export * from "./services/sceneContext";
export * from "./services/selectionService";
export * from "shared-ui-components/modularTool/services/settingsStore";
export type {
    IShellService,
    ToolbarItemDefinition,
    SidePaneDefinition,
    CentralContentDefinition,
    HorizontalLocation,
    VerticalLocation,
    ShellServiceOptions,
} from "shared-ui-components/modularTool/services/shellService";
export { ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";
export type { ModularToolOptions } from "shared-ui-components/modularTool/modularTool";
export { MakeModularTool } from "shared-ui-components/modularTool/modularTool";
export type { WeaklyTypedServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceContainer";
export * from "./inspector";
export { StartInspectable, type InspectableToken, type InspectableOptions } from "./inspectable";
export type { IInspectableCommandRegistry, InspectableCommandDescriptor, InspectableCommandArg } from "./services/cli/inspectableCommandRegistry";
export { InspectableCommandRegistryIdentity } from "./services/cli/inspectableCommandRegistry";
export { ConvertOptions, Inspector } from "./legacy/inspector";
export { AttachDebugLayer, DetachDebugLayer } from "./legacy/debugLayer";

// Export the shared hooks that can be used for extending the inspector.
export * from "shared-ui-components/fluent/hooks/keyboardHooks";
export * from "shared-ui-components/fluent/hooks/eventHooks";

// Export the shared primitive UI controls that can be used for extending the inspector.
export * from "shared-ui-components/fluent/primitives/accordion";
export * from "shared-ui-components/fluent/primitives/button";
export * from "shared-ui-components/fluent/primitives/checkbox";
export * from "shared-ui-components/fluent/primitives/collapse";
export * from "shared-ui-components/fluent/primitives/colorPicker";
export * from "shared-ui-components/fluent/primitives/comboBox";
export * from "shared-ui-components/fluent/primitives/draggable";
export * from "shared-ui-components/fluent/primitives/dropdown";
export * from "shared-ui-components/fluent/primitives/entitySelector";
export * from "shared-ui-components/fluent/primitives/gradient";
export * from "shared-ui-components/fluent/primitives/infoLabel";
export * from "shared-ui-components/fluent/primitives/lazyComponent";
export * from "shared-ui-components/fluent/primitives/link";
export * from "shared-ui-components/fluent/primitives/list";
export * from "shared-ui-components/fluent/primitives/materialSelector";
export * from "shared-ui-components/fluent/primitives/messageBar";
export * from "shared-ui-components/fluent/primitives/nodeSelector";
export * from "shared-ui-components/fluent/primitives/popover";
export * from "shared-ui-components/fluent/primitives/positionedPopover";
export * from "shared-ui-components/fluent/primitives/primitive";
export * from "shared-ui-components/fluent/primitives/searchBar";
export * from "shared-ui-components/fluent/primitives/searchBox";
export * from "shared-ui-components/fluent/primitives/skeletonSelector";
export * from "shared-ui-components/fluent/primitives/slider";
export * from "shared-ui-components/fluent/primitives/spinButton";
export * from "shared-ui-components/fluent/primitives/switch";
export * from "shared-ui-components/fluent/primitives/syncedSlider";
export * from "shared-ui-components/fluent/primitives/textarea";
export * from "shared-ui-components/fluent/primitives/textInput";
export * from "shared-ui-components/fluent/primitives/textureSelector";
export * from "shared-ui-components/fluent/primitives/toast";
export * from "shared-ui-components/fluent/primitives/toggleButton";
export * from "shared-ui-components/fluent/primitives/tooltip";
export * from "shared-ui-components/fluent/primitives/uploadButton";

// Export the shared hoc UI controls that can be used for extending the inspector.
export * from "shared-ui-components/fluent/hoc/buttonLine";
export * from "shared-ui-components/fluent/hoc/childWindow";
export * from "shared-ui-components/fluent/hoc/fileUploadLine";
export * from "shared-ui-components/fluent/hoc/gradientList";
export * from "shared-ui-components/fluent/hoc/pane";
export * from "shared-ui-components/fluent/hoc/textureUpload";
export * from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
export * from "shared-ui-components/fluent/hoc/propertyLines/comboBoxPropertyLine";
export { NumberDropdownPropertyLine, StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
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

import { AttachDebugLayer } from "./legacy/debugLayer";

// Attach Inspector v2 to Scene.debugLayer as a side effect for back compat.
AttachDebugLayer();
