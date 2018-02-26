import { minimalConfiguration } from './minimal';
import { defaultConfiguration } from './default';
import { ViewerConfiguration } from '../configuration';

let getConfigurationType = function (type: string): ViewerConfiguration {
    switch (type) {
        case 'default':
            return defaultConfiguration;
        case 'minimal':
            return minimalConfiguration;
        case 'none':
            return {};
        default:
            return defaultConfiguration;
    }

}

export { getConfigurationType, defaultConfiguration, minimalConfiguration }