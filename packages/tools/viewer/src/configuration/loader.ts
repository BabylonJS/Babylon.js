import { RenderOnlyConfigurationLoader } from "./renderOnlyLoader";
// eslint-disable-next-line import/no-internal-modules
import { getConfigurationType } from "./types/index";

export class ConfigurationLoader extends RenderOnlyConfigurationLoader {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected getExtendedConfig(type: string | undefined) {
        return getConfigurationType(type || "extended");
    }
}
