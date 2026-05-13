/* eslint-disable @typescript-eslint/naming-convention */
import { type ReflectionProbe, type ReflectionProbeParse } from "./reflectionProbe.pure";

type ReflectionProbeParseType = typeof ReflectionProbeParse;
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * The list of reflection probes added to the scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/reflectionProbes
         */
        reflectionProbes: Array<ReflectionProbe>;

        /**
         * Removes the given reflection probe from this scene.
         * @param toRemove The reflection probe to remove
         * @returns The index of the removed reflection probe
         */
        removeReflectionProbe(toRemove: ReflectionProbe): number;

        /**
         * Adds the given reflection probe to this scene.
         * @param newReflectionProbe The reflection probe to add
         */
        addReflectionProbe(newReflectionProbe: ReflectionProbe): void;
    }
}

declare module "./reflectionProbe.pure" {
    namespace ReflectionProbe {
        export let Parse: ReflectionProbeParseType;
    }
}
