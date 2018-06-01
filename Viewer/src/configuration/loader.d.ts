import { ViewerConfiguration } from './configuration';
/**
 * The configuration loader will load the configuration object from any source and will use the defined mapper to
 * parse the object and return a conform ViewerConfiguration.
 * It is a private member of the scene.
 */
export declare class ConfigurationLoader {
    private _enableCache;
    private _configurationCache;
    private _loadRequests;
    constructor(_enableCache?: boolean);
    /**
     * load a configuration object that is defined in the initial configuration provided.
     * The viewer configuration can extend different types of configuration objects and have an extra configuration defined.
     *
     * @param initConfig the initial configuration that has the definitions of further configuration to load.
     * @param callback an optional callback that will be called sync, if noconfiguration needs to be loaded or configuration is payload-only
     * @returns A promise that delivers the extended viewer configuration, when done.
     */
    loadConfiguration(initConfig?: ViewerConfiguration, callback?: (config: ViewerConfiguration) => void): Promise<ViewerConfiguration>;
    /**
     * Dispose the configuration loader. This will cancel file requests, if active.
     */
    dispose(): void;
    private _loadFile(url);
}
