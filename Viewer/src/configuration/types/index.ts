import { minimalConfiguration } from './minimal';
import { defaultConfiguration } from './default';

let getConfigurationType = function (type: string) {
    switch (type) {
        case 'default':
            return defaultConfiguration;
        case 'minimal':
            return minimalConfiguration;
        default:
            return defaultConfiguration;
    }

}

export { getConfigurationType, defaultConfiguration, minimalConfiguration }