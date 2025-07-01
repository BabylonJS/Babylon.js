import { serialize } from "core/Misc/decorators";
import { ParticleSystemSet } from "../particleSystemSet";
import { SystemBlock } from "./Blocks/systemBlock";
import type { Scene } from "core/scene";
import { NodeParticleBuildState } from "./nodeParticleBuildState";
import type { NodeParticleBlock } from "./nodeParticleBlock";
import { SerializationHelper } from "core/Misc/decorators.serialization";
import { Observable } from "core/Misc/observable";
import { GetClass } from "core/Misc/typeStore";
import { WebRequest } from "core/Misc/webRequest";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools";
import { AbstractEngine } from "core/Engines/abstractEngine";
import { ParticleInputBlock } from "./Blocks/particleInputBlock";
import { ParticleTextureSourceBlock } from "./Blocks/particleSourceTextureBlock";
import { NodeParticleContextualSources } from "./Enums/nodeParticleContextualSources";
import { UpdatePositionBlock } from "./Blocks/Update/updatePositionBlock";
import { ParticleMathBlock, ParticleMathBlockOperations } from "./Blocks/particleMathBlock";
import type { ParticleTeleportOutBlock } from "./Blocks/Teleport/particleTeleportOutBlock";
import type { ParticleTeleportInBlock } from "./Blocks/Teleport/particleTeleportInBlock";
import { BoxShapeBlock } from "./Blocks/Emitters/boxShapeBlock";
import { CreateParticleBlock } from "./Blocks/Emitters/createParticleBlock";

/**
 * Defines a set of particle systems defined as a node graph.
 * @experimental This API is experimental and may change in future releases.
 * NPE: #K6F1ZB#1
 * PG: #ZT509U#1
 */
export class NodeParticleSystemSet {
    private _systemBlocks: SystemBlock[] = [];
    private _buildId: number = 0;

    /** Define the Url to load node editor script */
    public static EditorURL = `${Tools._DefaultCdnUrl}/v${AbstractEngine.Version}/nodeParticleEditor/babylon.nodeParticleEditor.js`;

    /** Define the Url to load snippets */
    public static SnippetUrl = Constants.SnippetUrl;

    /**
     * Snippet ID if the material was created from the snippet server
     */
    public snippetId: string;

    /**
     * Gets an array of blocks that needs to be serialized even if they are not yet connected
     */
    public attachedBlocks: NodeParticleBlock[] = [];

    /**
     * Gets or sets data used by visual editor
     * @see https://npe.babylonjs.com
     */
    public editorData: any = null;

    /**
     * Observable raised when the particle set is built
     */
    public onBuildObservable = new Observable<NodeParticleSystemSet>();

    /**
     * The name of the set
     */
    @serialize()
    public name: string;

    /**
     * A free comment about the set
     */
    @serialize("comment")
    public comment: string;

    /**
     * Gets the system blocks
     */
    public get systemBlocks(): SystemBlock[] {
        return this._systemBlocks;
    }

    /**
     * Gets the list of input blocks attached to this material
     * @returns an array of InputBlocks
     */
    public get inputBlocks() {
        const blocks: ParticleInputBlock[] = [];
        for (const block of this.attachedBlocks) {
            if (block.isInput) {
                blocks.push(block as ParticleInputBlock);
            }
        }

        return blocks;
    }

    /**
     * Creates a new set
     * @param name defines the name of the set
     */
    public constructor(name: string) {
        this.name = name;
    }

    /**
     * Gets the current class name of the geometry e.g. "NodeParticleSystemSet"
     * @returns the class name
     */
    public getClassName(): string {
        return "NodeParticleSystemSet";
    }

    private _initializeBlock(node: NodeParticleBlock, autoConfigure = true) {
        if (this.attachedBlocks.indexOf(node) === -1) {
            this.attachedBlocks.push(node);
        }

        for (const input of node.inputs) {
            const connectedPoint = input.connectedPoint;
            if (connectedPoint) {
                const block = connectedPoint.ownerBlock;
                if (block !== node) {
                    this._initializeBlock(block, autoConfigure);
                }
            }
        }
    }

    /**
     * Builds the particle system set from the defined blocks.
     * @param scene defines the hosting scene
     * @param verbose defines whether to log detailed information during the build process (false by default)
     * @returns a promise that resolves to the built particle system set
     */
    public async buildAsync(scene: Scene, verbose = false): Promise<ParticleSystemSet> {
        return await new Promise<ParticleSystemSet>((resolve) => {
            const output = new ParticleSystemSet();

            // Initialize all blocks
            for (const block of this._systemBlocks) {
                this._initializeBlock(block);
            }

            // Build the blocks
            for (const block of this.systemBlocks) {
                const state = new NodeParticleBuildState();
                state.buildId = this._buildId++;
                state.scene = scene;
                state.verbose = verbose;

                const system = block.createSystem(state);

                // Errors
                state.emitErrors();

                output.systems.push(system);
            }

            this.onBuildObservable.notifyObservers(this);

            resolve(output);
        });
    }

    /**
     * Clear the current geometry
     */
    public clear() {
        this.attachedBlocks.length = 0;
        this._systemBlocks.length = 0;
    }

    /**
     * Clear the current set and restore it to a default state
     */
    public setToDefault() {
        this.clear();

        this.editorData = null;

        // Main system
        const system = new SystemBlock("Particle system");

        // Update position
        const updatePositionBlock = new UpdatePositionBlock("Update position");
        updatePositionBlock.output.connectTo(system.particle);

        // Contextual inputs
        const positionBlock = new ParticleInputBlock("Position");
        positionBlock.contextualValue = NodeParticleContextualSources.Position;
        const directionBlock = new ParticleInputBlock("Scaled direction");
        directionBlock.contextualValue = NodeParticleContextualSources.ScaledDirection;

        // Add
        const addBlock = new ParticleMathBlock("Add");
        addBlock.operation = ParticleMathBlockOperations.Add;
        positionBlock.output.connectTo(addBlock.left);
        directionBlock.output.connectTo(addBlock.right);
        addBlock.output.connectTo(updatePositionBlock.position);

        // Create particle
        const createParticleBlock = new CreateParticleBlock("Create particle");

        // Shape
        const emitterShape = new BoxShapeBlock("Box shape");
        createParticleBlock.particle.connectTo(emitterShape.particle);
        emitterShape.output.connectTo(updatePositionBlock.particle);

        // Texture
        const textureBlock = new ParticleTextureSourceBlock("Texture");
        textureBlock.texture.connectTo(system.texture);
        textureBlock.url = "https://assets.babylonjs.com/textures/flare.png";

        this._systemBlocks.push(system);
    }

    /**
     * Remove a block from the current system set
     * @param block defines the block to remove
     */
    public removeBlock(block: NodeParticleBlock) {
        const attachedBlockIndex = this.attachedBlocks.indexOf(block);
        if (attachedBlockIndex > -1) {
            this.attachedBlocks.splice(attachedBlockIndex, 1);
        }

        if (block.isSystem) {
            const index = this._systemBlocks.indexOf(block as SystemBlock);
            if (index > -1) {
                this._systemBlocks.splice(index, 1);
            }
        }
    }

    /**
     * Clear the current graph and load a new one from a serialization object
     * @param source defines the JSON representation of the particle set
     * @param merge defines whether or not the source must be merged or replace the current content
     */
    public parseSerializedObject(source: any, merge = false) {
        if (!merge) {
            this.clear();
        }

        const map: { [key: number]: NodeParticleBlock } = {};

        // Create blocks
        for (const parsedBlock of source.blocks) {
            const blockType = GetClass(parsedBlock.customType);
            if (blockType) {
                const block: NodeParticleBlock = new blockType();
                block._deserialize(parsedBlock);
                map[parsedBlock.id] = block;

                this.attachedBlocks.push(block);

                if (block.isSystem) {
                    this._systemBlocks.push(block as SystemBlock);
                }
            }
        }

        // Reconnect teleportation
        for (const block of this.attachedBlocks) {
            if (block.isTeleportOut) {
                const teleportOut = block as ParticleTeleportOutBlock;
                const id = teleportOut._tempEntryPointUniqueId;
                if (id) {
                    const source = map[id] as ParticleTeleportInBlock;
                    if (source) {
                        source.attachToEndpoint(teleportOut);
                    }
                }
            }
        }

        // Connections - Starts with input blocks only (except if in "merge" mode where we scan all blocks)
        for (let blockIndex = 0; blockIndex < source.blocks.length; blockIndex++) {
            const parsedBlock = source.blocks[blockIndex];
            const block = map[parsedBlock.id];

            if (!block) {
                continue;
            }

            if (block.inputs.length && parsedBlock.inputs.some((i: any) => i.targetConnectionName) && !merge) {
                continue;
            }
            this._restoreConnections(block, source, map);
        }

        // UI related info
        if (source.locations || (source.editorData && source.editorData.locations)) {
            const locations: {
                blockId: number;
                x: number;
                y: number;
                isCollapsed: boolean;
            }[] = source.locations || source.editorData.locations;

            for (const location of locations) {
                if (map[location.blockId]) {
                    location.blockId = map[location.blockId].uniqueId;
                }
            }

            if (merge && this.editorData && this.editorData.locations) {
                locations.concat(this.editorData.locations);
            }

            if (source.locations) {
                this.editorData = {
                    locations: locations,
                };
            } else {
                this.editorData = source.editorData;
                this.editorData.locations = locations;
            }

            const blockMap: number[] = [];

            for (const key in map) {
                blockMap[key] = map[key].uniqueId;
            }

            this.editorData.map = blockMap;
        }

        this.comment = source.comment;
    }

    private _restoreConnections(block: NodeParticleBlock, source: any, map: { [key: number]: NodeParticleBlock }) {
        for (const outputPoint of block.outputs) {
            for (const candidate of source.blocks) {
                const target = map[candidate.id];

                if (!target) {
                    continue;
                }

                for (const input of candidate.inputs) {
                    if (map[input.targetBlockId] === block && input.targetConnectionName === outputPoint.name) {
                        const inputPoint = target.getInputByName(input.inputName);
                        if (!inputPoint || inputPoint.isConnected) {
                            continue;
                        }

                        outputPoint.connectTo(inputPoint, true);
                        this._restoreConnections(target, source, map);
                        continue;
                    }
                }
            }
        }
    }

    /**
     * Serializes this geometry in a JSON representation
     * @param selectedBlocks defines the list of blocks to save (if null the whole geometry will be saved)
     * @returns the serialized geometry object
     */
    public serialize(selectedBlocks?: NodeParticleBlock[]): any {
        const serializationObject = selectedBlocks ? {} : SerializationHelper.Serialize(this);
        serializationObject.editorData = JSON.parse(JSON.stringify(this.editorData)); // Copy

        let blocks: NodeParticleBlock[] = [];

        if (selectedBlocks) {
            blocks = selectedBlocks;
        } else {
            serializationObject.customType = "BABYLON.NodeParticleSystemSet";
        }

        // Blocks
        serializationObject.blocks = [];

        for (const block of blocks) {
            serializationObject.blocks.push(block.serialize());
        }

        if (!selectedBlocks) {
            for (const block of this.attachedBlocks) {
                if (blocks.indexOf(block) !== -1) {
                    continue;
                }
                serializationObject.blocks.push(block.serialize());
            }
        }

        return serializationObject;
    }

    /**
     * Disposes the resources
     */
    public dispose(): void {
        for (const block of this.attachedBlocks) {
            block.dispose();
        }

        this.attachedBlocks.length = 0;
        this.onBuildObservable.clear();
    }

    /**
     * Creates a new node particle set set to default basic configuration
     * @param name defines the name of the particle set
     * @returns a new NodeParticleSystemSet
     */
    public static CreateDefault(name: string) {
        const nodeParticleSet = new NodeParticleSystemSet(name);

        nodeParticleSet.setToDefault();

        return nodeParticleSet;
    }

    /**
     * Creates a node particle set from parsed data
     * @param source defines the JSON representation of the particle set
     * @returns a new node particle set
     */
    public static Parse(source: any): NodeParticleSystemSet {
        const nodeParticleSet = SerializationHelper.Parse(() => new NodeParticleSystemSet(source.name), source, null);

        nodeParticleSet.parseSerializedObject(source);

        return nodeParticleSet;
    }

    /**
     * Creates a node particle set from a snippet saved by the node geometry editor
     * @param snippetId defines the snippet to load
     * @param nodeParticleSet defines a node particle set to update (instead of creating a new one)
     * @returns a promise that will resolve to the new node geometry
     */
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public static ParseFromSnippetAsync(snippetId: string, nodeParticleSet?: NodeParticleSystemSet): Promise<NodeParticleSystemSet> {
        if (snippetId === "_BLANK") {
            return Promise.resolve(NodeParticleSystemSet.CreateDefault("blank"));
        }

        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        const serializationObject = JSON.parse(snippet.nodeParticle);

                        if (!nodeParticleSet) {
                            nodeParticleSet = SerializationHelper.Parse(() => new NodeParticleSystemSet(snippetId), serializationObject, null);
                        }

                        nodeParticleSet.parseSerializedObject(serializationObject);
                        nodeParticleSet.snippetId = snippetId;

                        try {
                            resolve(nodeParticleSet);
                        } catch (err) {
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject(err);
                        }
                    } else {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject("Unable to load the snippet " + snippetId);
                    }
                }
            });

            request.open("GET", this.SnippetUrl + "/" + snippetId.replace(/#/g, "/"));
            request.send();
        });
    }
}
