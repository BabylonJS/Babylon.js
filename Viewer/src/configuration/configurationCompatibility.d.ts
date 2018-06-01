import { ViewerConfiguration } from './';
/**
 * This function will make sure the configuration file is taking deprecated fields into account
 * and is setting them to the correct keys and values.
 *
 * @param configuration The configuration to process. Mutable!
 */
export declare function processConfigurationCompatibility(configuration: ViewerConfiguration): void;
