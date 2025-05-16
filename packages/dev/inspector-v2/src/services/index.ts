export { ShellServiceIdentity as ShellService } from "./shellService";
import { SceneExplorerServiceDefinitions } from "./panes/hierarchy";
import { SceneExplorerPropertyBindingServiceDefinition } from "./sceneExplorerPropertyBindingService";
import { PropertiesServiceDefinitions } from "./panes/properties";
import { DebugServiceDefinition } from "./panes/debugService";
import { StatsServiceDefinition } from "./panes/statsService";
import { ToolsServiceDefinition } from "./panes/toolsService";
import { SettingsServiceDefinition } from "./panes/settingsService";

const DiagosticServiceDefinitions = [
    ...SceneExplorerServiceDefinitions,
    ...PropertiesServiceDefinitions,
    SceneExplorerPropertyBindingServiceDefinition,
    DebugServiceDefinition,
    StatsServiceDefinition,
    ToolsServiceDefinition,
    SettingsServiceDefinition,
];

export { DiagosticServiceDefinitions };
