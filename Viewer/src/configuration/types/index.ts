import { minimalConfiguration } from './minimal';
import { defaultConfiguration } from './default';
import { extendedConfiguration } from './extended';
import { ViewerConfiguration } from '../configuration';
import { shadowDirectionalLightConfiguration, shadowSpotlLightConfiguration } from './shadowLight';
import { environmentMapConfiguration } from './environmentMap';
import { deepmerge } from '../../helper/';

/**
 * Get the configuration type you need to use as the base for your viewer.
 * The types can either be a single string, or comma separated types that will extend each other. for example:
 *
 * "default, environmentMap" will first load the default configuration and will extend it using the environmentMap configuration.
 *
 * @param types a comma-separated string of the type(s) or configuration to load.
 */
let getConfigurationType = function(types: string): ViewerConfiguration {
    let config: ViewerConfiguration = {};
    let typesSeparated = types.split(",");
    typesSeparated.forEach((type) => {
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
            case 'default':
                config = deepmerge(config, defaultConfiguration);
                break;
            case 'minimal':
                config = deepmerge(config, minimalConfiguration);
                break;
            case 'none':
                break;
            case 'extended':
            default:
                config = deepmerge(config, extendedConfiguration);
                break;
        }

        if (config.extends) {
            config = deepmerge(config, getConfigurationType(config.extends));
        }
    });
    return config;

};

export { getConfigurationType, defaultConfiguration, minimalConfiguration };