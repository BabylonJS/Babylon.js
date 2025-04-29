export { ShellService } from "./shellService";
import { SceneExplorerServiceDefinition } from "./sceneExplorerService";
import { PropertiesServiceDefinition } from "./propertiesService";
import { DebugServiceDefinition } from "./debugService";
import { StatsServiceDefinition } from "./statsService";
import { ToolsServiceDefinition } from "./toolsService";
import { SettingsServiceDefinition } from "./settingsService";

const DiagosticServiceDefinitions = [
    SceneExplorerServiceDefinition,
    PropertiesServiceDefinition,
    DebugServiceDefinition,
    StatsServiceDefinition,
    ToolsServiceDefinition,
    SettingsServiceDefinition,
];

export { DiagosticServiceDefinitions };
