import { RenderOnlyConfigurationLoader } from "./renderOnlyLoader";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { getConfigurationType } from "./types/index";

export class ConfigurationLoader extends RenderOnlyConfigurationLoader {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected override getExtendedConfig(type: string | undefined) {
        return getConfigurationType(type || "extended");
    }
}
