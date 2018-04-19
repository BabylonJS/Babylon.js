import { minimalConfiguration } from './minimal';
import { defaultConfiguration } from './default';
import { extendedConfiguration } from './extended';
import { ViewerConfiguration } from '../configuration';
import { shadowDirectionalLightConfiguration, shadowSpotlLightConfiguration } from './shadowLight';
import { environmentMapConfiguration } from './environmentMap';
import * as deepmerge from '../../../assets/deepmerge.min.js';

let getConfigurationType = function (types: string): ViewerConfiguration {
    let config: ViewerConfiguration = {};
    let typesSeparated = types.split(",");
    typesSeparated.forEach(type => {
        switch (type.trim()) {
            case 'environmentMap':
                config = deepmerge(config, environmentMapConfiguration);
                break;
            case 'shadowDirectionalLight':
                config = deepmerge(config, shadowDirectionalLightConfiguration);
                break;
            case 'shadowSpotLight':
                config = deepmerge(config, shadowSpotlLightConfiguration);
                break;
            case 'extended':
                config = deepmerge(config, extendedConfiguration);
                break;
            case 'minimal':
                config = deepmerge(config, minimalConfiguration);
                break;
            case 'none':
                break;
            case 'default':
            default:
                config = deepmerge(config, defaultConfiguration);
                break;
        }

        if (config.extends) {
            config = deepmerge(config, getConfigurationType(config.extends));
        }
    });
    return config;

}

export { getConfigurationType, defaultConfiguration, minimalConfiguration }