import { ViewerConfiguration } from './configuration';
/**
 * This is the mapper's interface. Implement this function to create your own mapper and register it at the mapper manager
 */
export interface IMapper {
    map(rawSource: any): ViewerConfiguration;
}
/**
 * The MapperManager manages the different implemented mappers.
 * It allows the user to register new mappers as well and use them to parse their own configuration data
 */
export declare class MapperManager {
    private _mappers;
    /**
     * The default mapper is the JSON mapper.
     */
    static DefaultMapper: string;
    constructor();
    /**
     * Get a specific configuration mapper.
     *
     * @param type the name of the mapper to load
     */
    getMapper(type: string): IMapper;
    /**
     * Use this functio to register your own configuration mapper.
     * After a mapper is registered, it can be used to parse the specific type fo configuration to the standard ViewerConfiguration.
     * @param type the name of the mapper. This will be used to define the configuration type and/or to get the mapper
     * @param mapper The implemented mapper
     */
    registerMapper(type: string, mapper: IMapper): void;
    /**
     * Dispose the mapper manager and all of its mappers.
     */
    dispose(): void;
}
/**
 * mapperManager is a singleton of the type MapperManager.
 * The mapperManager can be disposed directly with calling mapperManager.dispose()
 * or indirectly with using BabylonViewer.disposeAll()
 */
export declare let mapperManager: MapperManager;
