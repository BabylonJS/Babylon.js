import { BlockNodeData } from "./blockNodeData.js";
import type { ConnectionPoint, SmartFilter, RuntimeData } from "smart-filters";
import { InputBlock, ConnectionPointType, createStrongRef, createImageTexture } from "smart-filters";
import type { GlobalState } from "../globalState";
import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import type { ThinEngine } from "core/Engines/thinEngine";

import "core/Engines/Extensions/engine.dynamicTexture.js";
import "core/Engines/Extensions/engine.videoTexture.js";
import type { Nullable } from "core/types.js";

/**
 * Creates a default value for the input block of a certain type
 * @param type - defines the type of the input block
 * @param engine - defines the engine to use to create a texture (if relevant)
 * @returns a strong ref containing the default value
 */
export function CreateDefaultValue<U extends ConnectionPointType>(type: U, engine: Nullable<ThinEngine>): RuntimeData<U> {
    // conversion needed due to https://github.com/microsoft/TypeScript/issues/33014
    switch (type) {
        case ConnectionPointType.Boolean:
            return createStrongRef(false) as RuntimeData<U>;
        case ConnectionPointType.Float:
            return createStrongRef(0) as RuntimeData<U>;
        case ConnectionPointType.Color3:
            return createStrongRef({ r: 0, g: 0, b: 0 }) as RuntimeData<U>;
        case ConnectionPointType.Color4:
            return createStrongRef({ r: 0, g: 0, b: 0, a: 0 }) as RuntimeData<U>;
        case ConnectionPointType.Vector2:
            return createStrongRef({ x: 0, y: 0 }) as RuntimeData<U>;
        case ConnectionPointType.Texture:
            return createStrongRef(engine ? createImageTexture(engine, "/assets/logo.png") : null) as RuntimeData<U>;
        default:
            throw new Error(`Unknown connection point type ${type}`);
    }
}

/**
 * Creates a default input block for a certain type
 * @param smartFilter - defines the smart filter to attach the input block to
 * @param type - defines the type of the input block
 * @param engine - defines the engine to use to create a texture (if relevant)
 * @returns
 */
export function CreateDefaultInput<U extends ConnectionPointType>(smartFilter: SmartFilter, type: U, engine: Nullable<ThinEngine>): InputBlock<U> {
    const name = ConnectionPointType[type] ?? "Unknown";
    const inputBlock = new InputBlock(smartFilter, name, type, CreateDefaultValue(type, engine));
    return inputBlock;
}

/**
 * Creates a default input block for a certain connection point
 * @param smartFilter - defines the smart filter to attach the input block to
 * @param point - defines the connection point to create the input block for
 * @param engine - defines the engine to use to create a texture (if relevant)
 * @returns The created input block
 */
export function CreateDefaultInputForConnectionPoint<U extends ConnectionPointType>(
    smartFilter: SmartFilter,
    point: ConnectionPoint<U>,
    engine: Nullable<ThinEngine>
): InputBlock<U> {
    const name = point.name;
    const inputBlock = new InputBlock(
        smartFilter,
        name,
        point.type,
        point.defaultRuntimeData ? createStrongRef(structuredClone(point.defaultRuntimeData.value)) : CreateDefaultValue(point.type, engine)
    );
    return inputBlock;
}

export const RegisterDefaultInput = (stateManager: StateManager) => {
    stateManager.createDefaultInputData = (rootData: any, portData: IPortData, nodeContainer: INodeContainer) => {
        const point = portData.data as ConnectionPoint;
        // const customInputBlock = point.createCustomInputBlock();
        const pointName = "output";
        // let emittedBlock;

        const globalState = rootData as GlobalState;

        const smartFilter = globalState.smartFilter;
        // if (!customInputBlock) {
        // if (point.type === SmartFilterConnectionPointTypes.AutoDetect) {
        //     return null;
        // }
        const emittedBlock = CreateDefaultInputForConnectionPoint(smartFilter, point, globalState.engine);
        // } else {
        //     [emittedBlock, pointName] = customInputBlock;
        // }

        // TODO. Dynamic block creation
        // smartFilter.attachedBlocks.push(emittedBlock);
        // if (!emittedBlock.isInput) {
        //     emittedBlock.autoConfigure(smartFilter);
        // }

        return {
            data: new BlockNodeData(emittedBlock, nodeContainer),
            name: pointName,
        };
    };
};
