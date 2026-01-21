import type { Attractor } from "core/Particles/attractor";
import type { ParticleSystem } from "core/Particles/particleSystem";
import type { FunctionComponent } from "react";

import { useCallback } from "react";

import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { AttractorList } from "./attractorList";
import { useObservableArray } from "../../../hooks/useObservableArray";

/**
 * Display attractor-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemAttractorProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const attractorsGetter = useCallback(() => system.attractors ?? [], [system]);
    const attractors = useObservableArray<ParticleSystem, Attractor>(system, attractorsGetter, "addAttractor", "removeAttractor");
    const scene = system.getScene();

    return (
        <>
            {scene ? (
                <AttractorList attractors={attractors} scene={scene} system={system} />
            ) : (
                // Handle missing scene defensively.
                <MessageBar intent="info" title="No Scene Available" message="Cannot display attractors without a scene" />
            )}
        </>
    );
};
