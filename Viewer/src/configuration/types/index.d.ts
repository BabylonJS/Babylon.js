import { minimalConfiguration } from './minimal';
import { defaultConfiguration } from './default';
import { ViewerConfiguration } from '../configuration';
/**
 * Get the configuration type you need to use as the base for your viewer.
 * The types can either be a single string, or comma separated types that will extend each other. for example:
 *
 * "default, environmentMap" will first load the default configuration and will extend it using the environmentMap configuration.
 *
 * @param types a comma-separated string of the type(s) or configuration to load.
 */
declare let getConfigurationType: (types: string) => ViewerConfiguration;
export { getConfigurationType, defaultConfiguration, minimalConfiguration };
