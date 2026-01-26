import type { Vector3 } from "core/Maths/math.vector";
import { Attractor } from "core/Particles/attractor";
import type { ParticleSystem } from "core/Particles/particleSystem";
import type { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
import { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";
import { UpdateAttractorBlock } from "core/Particles/Node/Blocks/Update/updateAttractorBlock";

/**
 * Represents an attractor in a normalized way that works for both CPU and Node particle systems.
 */
export interface IAttractorData {
    /** The position of the attractor */
    position: Vector3;
    /** The strength of the attractor (null if dynamically computed) */
    strength: number | null;
    /** Sets the strength of the attractor */
    setStrength: (value: number) => void;
    /** The original attractor object (CPU) or UpdateAttractorBlock (Node) */
    source: Attractor | UpdateAttractorBlock;
    /** Whether this attractor is read-only (position and strength cannot be edited in inspector) */
    isReadOnly: boolean;
}

/**
 * Interface for an attractor source that provides attractors from different particle system types.
 */
export interface IAttractorSource {
    /** The attractors from the source */
    attractors: IAttractorData[];
    /** Add a new attractor (only for CPU particle systems) */
    addAttractor?: (attractor?: Attractor) => void;
    /** Remove an attractor (only for CPU particle systems) */
    removeAttractor?: (attractor: Attractor) => void;
}

/**
 * Creates an IAttractorData adapter from a CPU particle system Attractor.
 * @param attractor The CPU particle system attractor
 * @returns The IAttractorData adapter
 */
export function CreateCPUAttractorData(attractor: Attractor): IAttractorData {
    return {
        position: attractor.position,
        strength: attractor.strength,
        setStrength: (value: number) => {
            attractor.strength = value;
        },
        source: attractor,
        isReadOnly: false,
    };
}

/**
 * Creates an IAttractorData adapter from a Node particle system UpdateAttractorBlock.
 * @param block The UpdateAttractorBlock from a Node particle system
 * @returns The IAttractorData adapter
 */
export function CreateNodeAttractorData(block: UpdateAttractorBlock): IAttractorData {
    // Get the connected blocks - only use values if they are InputBlocks (constant values)
    // If the value is a dynamic calculation, fall back to the block's default values
    const attractorConnected = block.attractor.connectedPoint?.ownerBlock;
    const strengthConnected = block.strength.connectedPoint?.ownerBlock;

    const attractorInput = attractorConnected instanceof ParticleInputBlock ? attractorConnected : undefined;
    const strengthInput = strengthConnected instanceof ParticleInputBlock ? strengthConnected : undefined;

    // Use InputBlock values if available, null if dynamic, otherwise use the block's default values
    const position = attractorInput?.value ?? block.attractor.value;
    const strength = strengthInput?.value ?? (strengthConnected ? null : block.strength.value);

    return {
        position: position,
        strength: strength,
        setStrength: (value: number) => {
            if (strengthInput) {
                strengthInput.value = value;
            }
        },
        source: block,
        isReadOnly: true,
    };
}

/**
 * Creates an IAttractorSource for a CPU particle system.
 * @param system The CPU particle system
 * @param attractors The current attractors array (from useObservableArray hook)
 * @returns The IAttractorSource adapter
 */
export function CreateCPUAttractorSource(system: ParticleSystem, attractors: Attractor[]): IAttractorSource {
    return {
        attractors: attractors.map(CreateCPUAttractorData),
        addAttractor: (attractor?: Attractor) => system.addAttractor(attractor ?? new Attractor()),
        removeAttractor: (attractor: Attractor) => system.removeAttractor(attractor),
    };
}

/**
 * Creates an IAttractorSource for a Node particle system.
 * @param nodeSet The NodeParticleSystemSet
 * @returns The IAttractorSource adapter
 */
export function CreateNodeAttractorSource(nodeSet: NodeParticleSystemSet): IAttractorSource {
    const attractorBlocks = nodeSet.attachedBlocks.filter((block): block is UpdateAttractorBlock => block instanceof UpdateAttractorBlock);

    return {
        attractors: attractorBlocks.map(CreateNodeAttractorData),
    };
}
