import { type AbstractSound } from "../AudioV2/abstractAudio/abstractSound";
import { type Nullable } from "../types";
import { type FlowGraphContext } from "./flowGraphContext";

/**
 * Describes a sound asset declared by a flow graph coordinator.
 * Declared sound assets are serialized with the coordinator and loaded before its graphs are parsed,
 * so a serialized flow graph can carry the sounds it plays.
 */
export interface IFlowGraphSoundAsset {
    /**
     * The unique name of the sound asset. Audio blocks reference the sound using this name.
     */
    name: string;
    /**
     * The URL of the audio file. This can be a `data:` URL to embed the audio in the serialized graph.
     */
    url: string;
}

/**
 * A value that identifies a sound for the flow graph audio blocks.
 * It can be an Audio V2 sound, the name of a sound asset declared on the coordinator,
 * or a serialized reference (an object with a `name` property) to a declared sound asset.
 */
export type FlowGraphSoundReference = AbstractSound | string | { name: string };

/**
 * Gets the sound asset name referenced by a sound reference.
 * @param reference the sound reference
 * @returns the referenced sound asset name, or null if the reference is not a name or serialized name reference
 */
export function GetFlowGraphSoundAssetName(reference: Nullable<FlowGraphSoundReference> | undefined): Nullable<string> {
    if (!reference) {
        return null;
    }
    if (typeof reference === "string") {
        return reference;
    }
    if (typeof (reference as AbstractSound).play === "function") {
        return null;
    }
    const name = (reference as { name?: unknown }).name;
    return typeof name === "string" ? name : null;
}

/**
 * Resolves a sound reference to an Audio V2 sound.
 * Strings and serialized references are resolved by name against the sound assets declared on the context's coordinator.
 * @param context the flow graph context used to reach the coordinator
 * @param reference the sound reference to resolve
 * @returns the resolved sound, or null if it cannot be resolved
 */
export function ResolveFlowGraphSound(context: FlowGraphContext, reference: Nullable<FlowGraphSoundReference> | undefined): Nullable<AbstractSound> {
    if (reference && typeof (reference as AbstractSound).play === "function") {
        return reference as AbstractSound;
    }
    const name = GetFlowGraphSoundAssetName(reference);
    return name !== null ? context.configuration.coordinator.getSoundAsset(name) : null;
}
