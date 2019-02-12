import { RenderOnlyConfigurationLoader } from "./renderOnlyLoader";
import { getConfigurationType } from "./types";

export class ConfigurationLoader extends RenderOnlyConfigurationLoader {
    protected getExtendedConfig(type:string|undefined){
        return getConfigurationType(type || "extended");
    }
}