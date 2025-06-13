import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { Nullable } from "@babylonjs/core/types";
import {
    type SmartFilter,
    type BaseBlock,
    CustomShaderBlock,
    type SerializedShaderBlockDefinition,
    importCustomBlockDefinition,
    type SerializedBlockDefinition,
    CustomAggregateBlock,
    type SmartFilterDeserializer,
    Logger,
} from "@babylonjs/smart-filters";
import { CustomBlocksNamespace, getBlockKey } from "@babylonjs/smart-filters-editor-control";

const SavedCustomBlockKeysName = "Custom-Block-List";
const SavedCustomBlockDefinitionNameSuffix = "-Definition";

/**
 * Loads and saves SerializedBlockDefinitions from local storage, and
 * creates CustomShaderBlocks and CustomAggregateBlocks from them.
 */
export class CustomBlockManager {
    /**
     * Map of block keys to custom block definitions.
     */
    private readonly _customBlockDefinitions = new Map<string, SerializedBlockDefinition>();

    /**
     * Creates a new CustomBlockManager.
     */
    constructor() {
        this.loadBlockDefinitions();
    }

    /**
     * Gets a block definition from the custom block definitions.
     * @param blockType - The block type to get
     * @param namespace - The namespace of the block to get
     * @returns - The block definition, or null if it does not exist
     */
    public getBlockDefinition(blockType: string, namespace: Nullable<string>): Nullable<SerializedBlockDefinition> {
        namespace = namespace || CustomBlocksNamespace;
        return this._customBlockDefinitions.get(getBlockKey(blockType, namespace)) || null;
    }

    /**
     * Instantiates a block from a block type.
     * @param smartFilter - The Smart Filter to create the block for
     * @param engine - The engine to use
     * @param blockType - The block type to create
     * @param namespace - The namespace of the block to create
     * @param name - The name to assign to this new instance of the block, or null to use the default name
     * @param smartFilterDeserializer - The deserializer to use
     * @returns The instantiated block, or null if the block type is not registered
     */
    public async createBlockFromBlockTypeAndNamespace(
        smartFilter: SmartFilter,
        engine: ThinEngine,
        blockType: string,
        namespace: Nullable<string>,
        name: Nullable<string>,
        smartFilterDeserializer: SmartFilterDeserializer
    ): Promise<Nullable<BaseBlock>> {
        namespace = namespace || CustomBlocksNamespace;
        const blockDefinition = this._customBlockDefinitions.get(getBlockKey(blockType, namespace));
        if (!blockDefinition) {
            return null;
        }

        return this.createBlockFromBlockDefinition(smartFilter, engine, blockDefinition, name, smartFilterDeserializer);
    }

    /**
     * Instantiates a block from a saved block definition.
     * @param smartFilter - The Smart Filter to create the block for
     * @param engine - The engine to use
     * @param blockDefinition - The serialized block definition
     * @param name - The name to assign to this new instance of the block, or null to use the default name
     * @param smartFilterDeserializer - The deserializer to use
     * @returns The instantiated block, or null if the block type is not registered
     */
    public async createBlockFromBlockDefinition(
        smartFilter: SmartFilter,
        engine: ThinEngine,
        blockDefinition: SerializedBlockDefinition,
        name: Nullable<string>,
        smartFilterDeserializer: SmartFilterDeserializer
    ): Promise<BaseBlock> {
        switch (blockDefinition.format) {
            case "shaderBlockDefinition":
                return CustomShaderBlock.Create(
                    smartFilter,
                    name || this._getDefaultName(blockDefinition),
                    blockDefinition
                );
            case "smartFilter":
                return CustomAggregateBlock.Create(
                    smartFilter,
                    engine,
                    name || this._getDefaultName(blockDefinition),
                    blockDefinition,
                    smartFilterDeserializer
                );
        }
    }

    /**
     * Given a BlockDefinition, returns a default name for the block.
     * @param blockDefinition - The block definition
     * @returns - The default name for the block
     */
    private _getDefaultName(blockDefinition: SerializedBlockDefinition): string {
        return blockDefinition.blockType.replace("Block", "");
    }

    /**
     * Returns a list of all the loaded custom block definitions.
     * @returns The list of custom block definitions
     */
    public getCustomBlockDefinitions(): SerializedBlockDefinition[] {
        return Array.from(this._customBlockDefinitions.values());
    }

    /**
     * Loads all block definitions from local storage.
     */
    public loadBlockDefinitions() {
        this._customBlockDefinitions.clear();

        const blockKeys = this._readBlockKeysFromLocalStorage();

        for (const blockKey of blockKeys) {
            const blockDefinitionJson = localStorage.getItem(blockKey + SavedCustomBlockDefinitionNameSuffix);
            if (blockDefinitionJson) {
                const blockDefinition: SerializedShaderBlockDefinition = JSON.parse(blockDefinitionJson);
                // If the block definition doesn't include a namespace, add it to the CustomBlocksNamespace
                if (!blockDefinition.namespace) {
                    blockDefinition.namespace = CustomBlocksNamespace;
                }
                this._customBlockDefinitions.set(
                    getBlockKey(blockDefinition.blockType, blockDefinition.namespace),
                    blockDefinition
                );
            }
        }
    }

    /**
     * Deletes a block definition from local storage.
     * @param blockType - The block type to delete
     * @param namespace - The namespace of the block to delete
     */
    public deleteBlockDefinition(blockType: string, namespace: Nullable<string>) {
        namespace = namespace || CustomBlocksNamespace;
        const blockKeyList = this._readBlockKeysFromLocalStorage();
        const blockKey = getBlockKey(blockType, namespace);

        this._customBlockDefinitions.delete(getBlockKey(blockType, namespace));

        const index = blockKeyList.indexOf(blockKey);
        if (index > -1) {
            blockKeyList.splice(index, 1);
            localStorage.setItem(SavedCustomBlockKeysName, JSON.stringify(blockKeyList));
            localStorage.removeItem(blockKey + SavedCustomBlockDefinitionNameSuffix);
        }
    }

    /**
     * Saves a block definition to local storage.
     * @param serializedData - The serialized block definition - either a SerializedBlockDefinition object in a JSON string, or a glsl shader
     * @returns The block definition that was saved
     */
    public saveBlockDefinition(serializedData: string): SerializedBlockDefinition {
        const blockDefinition = importCustomBlockDefinition(serializedData);

        let blockType: string;
        switch (blockDefinition.format) {
            case "shaderBlockDefinition": {
                blockType = blockDefinition.blockType;
                break;
            }
            case "smartFilter": {
                blockType = blockDefinition.name;
                break;
            }
        }

        if (!blockDefinition.namespace) {
            blockDefinition.namespace = CustomBlocksNamespace;
        }

        this.deleteBlockDefinition(blockType, blockDefinition.namespace);
        const blockKey = getBlockKey(blockType, blockDefinition.namespace);

        // Add to the stored list of block keys in local storage
        const blockKeyList = this._readBlockKeysFromLocalStorage();
        blockKeyList.push(blockKey);
        localStorage.setItem(SavedCustomBlockKeysName, JSON.stringify(blockKeyList));

        // Store the definition in local storage
        localStorage.setItem(blockKey + SavedCustomBlockDefinitionNameSuffix, JSON.stringify(blockDefinition));

        // Store the definition in memory
        this._customBlockDefinitions.set(blockKey, blockDefinition);

        return blockDefinition;
    }

    private _readBlockKeysFromLocalStorage(): string[] {
        const blockTypeListJson = localStorage.getItem(SavedCustomBlockKeysName);
        let blockKeysList: string[] = [];
        if (blockTypeListJson) {
            try {
                blockKeysList = JSON.parse(blockTypeListJson);
            } catch {
                Logger.Warn("Failed to parse Custom Block list from local storage");
            }
        }

        // Back compat - if the list has any entries that don't have a namespace, add them to the Custom_Blocks namespace
        // Also, if any are null or otherwise invalid, ignore them
        let updatedAnyKeys = false;
        blockKeysList = blockKeysList
            .filter((blockKey) => blockKey !== null && blockKey.indexOf("[undefined]") === -1)
            .map((blockKey) => {
                if (blockKey.indexOf("].[") === -1) {
                    updatedAnyKeys = true;
                    const key = getBlockKey(blockKey, CustomBlocksNamespace);
                    const oldDefinition = localStorage.getItem(blockKey + SavedCustomBlockDefinitionNameSuffix);
                    if (oldDefinition) {
                        localStorage.setItem(key + SavedCustomBlockDefinitionNameSuffix, oldDefinition);
                        localStorage.removeItem(blockKey + SavedCustomBlockDefinitionNameSuffix);
                    }
                    return key;
                }
                return blockKey;
            });
        if (updatedAnyKeys) {
            localStorage.setItem(SavedCustomBlockKeysName, JSON.stringify(blockKeysList));
        }

        return blockKeysList;
    }
}
