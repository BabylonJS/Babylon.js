import type { Attractor } from "core/Particles/attractor";
import type { ParticleSystem } from "core/Particles/particleSystem";
import type { FunctionComponent } from "react";

import { useCallback } from "react";

import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { AttractorList } from "./attractorList";
import { useObservableArray } from "../../../hooks/useObservableArray";
import { CreateCPUAttractorSource, CreateNodeAttractorSource } from "./attractorAdapter";

/**
 * Display attractor-related properties for a particle system.
 * Supports both CPU particle systems (editable) and Node particle systems (read-only).
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemAttractorProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;
    const scene = system.getScene();
    const isNodeGenerated = system.isNodeGenerated;

    // For non-node systems - Hook is called but inactive for Node systems
    const attractorsGetter = useCallback(() => system.attractors ?? [], [system]);
    const attractors = useObservableArray<ParticleSystem, Attractor>(isNodeGenerated ? null : system, attractorsGetter, "addAttractor", "removeAttractor");

    // Create appropriate source based on the particle system type
    const attractorSource = isNodeGenerated ? CreateNodeAttractorSource(system.source!) : CreateCPUAttractorSource(system, attractors);

    // Show message for Node systems with no attractors
    if (isNodeGenerated && attractorSource.attractors.length === 0) {
        return <MessageBar intent="info" title="No Attractors" message="No attractor blocks found. Add them in the Node Particle Editor." />;
    }

    return (
        <>
            {scene ? (
                <AttractorList attractorSource={attractorSource} scene={scene} />
            ) : (
                <MessageBar intent="info" title="No Scene Available" message="Cannot display attractors without a scene" />
            )}
        </>
    );
};
