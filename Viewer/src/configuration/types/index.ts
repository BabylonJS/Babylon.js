import { minimalConfiguration } from './minimal';
import { defaultConfiguration } from './default';
import { extendedDefaultConfiguration } from './extendedDefault';
import { ViewerConfiguration } from '../configuration';
import * as deepmerge from '../../../assets/deepmerge.min.js';

let getConfigurationType = function (type: string): ViewerConfiguration {
    let config: ViewerConfiguration;
    switch (type) {
        case 'default':
            config = defaultConfiguration;
            break;
        case 'extendedDefault':
            config = extendedDefaultConfiguration;
            break;
        case 'minimal':
            config = minimalConfiguration;
            break;
        case 'none':
            config = {};
            break;
        default:
            config = defaultConfiguration;
    }

    if (config.extends) {
        config = deepmerge(config, getConfigurationType(config.extends));
    }

    return config;

}

export { getConfigurationType, defaultConfiguration, minimalConfiguration }