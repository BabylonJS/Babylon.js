import type { FactorGradient, ColorGradient as Color4Gradient, IValueGradient, ParticleSystem } from "core/index";

import { Color3, Color4 } from "core/Maths/math.color";
import { useCallback, useEffect, useState } from "react";
import type { FunctionComponent } from "react";

import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { Color4GradientList, FactorGradientList } from "shared-ui-components/fluent/hoc/gradientList";
import { AttractorList } from "./attractorList";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { BoundProperty } from "../boundProperty";
import { BlendModeOptions, ParticleBillboardModeOptions } from "shared-ui-components/constToOptionsMaps";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

/**
 * Displays general (high-level) information about a particle system.
 * @param props component props
 * @returns the rendered property lines
 */
export const ParticleSystemGeneralProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const scene = system.getScene();

    const isBillboardBased = useProperty(system, "isBillboardBased");

    const capacity = useObservableState(() => system.getCapacity());
    const activeCount = useObservableState(() => system.getActiveCount(), scene?.onBeforeRenderObservable);

    const isAlive = useObservableState(() => system.isAlive(), scene?.onBeforeRenderObservable);
    const isStopping = useObservableState(() => system.isStopping(), scene?.onBeforeRenderObservable);

    const [stopRequested, setStopRequested] = useState(false);

    useEffect(() => {
        if (!stopRequested) {
            return;
        }

        // Clear the local stop flag once the system is no longer alive (fully stopped).
        if (!isAlive && !isStopping) {
            setStopRequested(false);
        }
    }, [stopRequested, isAlive, isStopping]);

    return (
        <>
            <StringifiedPropertyLine label="Capacity" description="Maximum number of particles in the system." value={capacity} />
            <StringifiedPropertyLine label="Active Particles" description="Current number of active particles." value={activeCount} />

            <BoundProperty component={NumberDropdownPropertyLine} label="Blend Mode" target={system} propertyKey="blendMode" options={BlendModeOptions} />
            <BoundProperty component={Vector3PropertyLine} label="World Offset" target={system} propertyKey="worldOffset" />
            <BoundProperty component={Vector3PropertyLine} label="Gravity" target={system} propertyKey="gravity" />
            <BoundProperty component={SwitchPropertyLine} label="Is Billboard" target={system} propertyKey="isBillboardBased" />
            {isBillboardBased && (
                <BoundProperty component={NumberDropdownPropertyLine} label="Billboard Mode" target={system} propertyKey="billboardMode" options={ParticleBillboardModeOptions} />
            )}
            <BoundProperty component={SwitchPropertyLine} label="Is Local" target={system} propertyKey="isLocal" />
            <BoundProperty component={SwitchPropertyLine} label="Force Depth Write" target={system} propertyKey="forceDepthWrite" />
            <BoundProperty component={NumberInputPropertyLine} label="Update Speed" target={system} propertyKey="updateSpeed" min={0} step={0.01} />

            <ButtonLine
                label="View in Node Particle Editor (coming soon)"
                disabled={true}
                onClick={() => {
                    // TODO: waiting for node editors styling
                }}
            />

            {isStopping ? (
                <TextPropertyLine label="System is stopping..." value="" />
            ) : isAlive ? (
                <ButtonLine
                    label="Stop"
                    onClick={() => {
                        setStopRequested(true);
                        system.stop();
                    }}
                />
            ) : (
                <ButtonLine
                    label="Start"
                    onClick={() => {
                        setStopRequested(false);
                        system.start();
                    }}
                />
            )}
        </>
    );
};

/**
 * Displays emission-related properties for a particle system.
 * @param props component props
 * @returns the rendered property lines
 */
export const ParticleSystemEmissionProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const emitRateGradients = useParticleSystemProperty(system, "getEmitRateGradients", "function", "addEmitRateGradient", "removeEmitRateGradient", "forceRefreshGradients");

    return (
        <>
            {!system.isNodeGenerated && (
                <FactorGradientList
                    gradients={emitRateGradients}
                    label="Emit Rate Gradient"
                    removeGradient={(gradient: IValueGradient) => {
                        system.removeEmitRateGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: FactorGradient) => {
                        gradient ? system.addEmitRateGradient(gradient.gradient, gradient.factor1, gradient.factor2) : system.addEmitRateGradient(Math.random(), 50, 50);
                        system.forceRefreshGradients();
                    }}
                    onChange={(_gradient: FactorGradient) => {
                        system.forceRefreshGradients();
                    }}
                />
            )}
        </>
    );
};

/**
 * Displays color-related properties for a particle system.
 * @param props component props
 * @returns the rendered property lines
 */
export const ParticleSystemColorProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const colorGradients = useParticleSystemProperty(system, "getColorGradients", "function", "addColorGradient", "removeColorGradient", "forceRefreshGradients");
    return (
        <>
            {!system.isNodeGenerated && (
                <Color4GradientList
                    gradients={colorGradients}
                    label="Color Gradient"
                    removeGradient={(gradient: IValueGradient) => {
                        system.removeColorGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: Color4Gradient) => {
                        if (gradient) {
                            system.addColorGradient(gradient.gradient, gradient.color1, gradient.color2);
                        } else {
                            system.addColorGradient(0, Color4.FromColor3(Color3.Black()), Color4.FromColor3(Color3.Black()));
                            system.addColorGradient(1, Color4.FromColor3(Color3.White()), Color4.FromColor3(Color3.White()));
                        }
                        system.forceRefreshGradients();
                    }}
                    onChange={(_gradient: Color4Gradient) => {
                        system.forceRefreshGradients();
                    }}
                />
            )}
        </>
    );
};

/**
 * Displays attractor-related properties for a particle system.
 * @param props component props
 * @returns the rendered property lines
 */
export const ParticleSystemAttractorProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const attractors = useParticleSystemProperty(system, "attractors", "property", "addAttractor", "removeAttractor");
    const scene = system.getScene();

    return (
        <>
            {scene ? (
                <AttractorList attractors={attractors} scene={scene} system={system} />
            ) : (
                // Should never get here since sceneExplorer only displays if there is a scene, but adding UX in case that assumption changes in future
                <MessageBar intent="info" title="No Scene Available" message="Cannot display attractors without a scene" />
            )}
        </>
    );
};

// TODO-iv2: This can be more generic to work for not just particleSystems
const useParticleSystemProperty = (
    system: ParticleSystem,
    propertyKey: keyof ParticleSystem,
    observableType: "function" | "property",
    addFn: keyof ParticleSystem,
    removeFn: keyof ParticleSystem,
    changeFn?: keyof ParticleSystem
) => {
    return useObservableState(
        useCallback(() => {
            const value = observableType === "function" ? system[propertyKey]() : system[propertyKey];
            return [...(value ?? [])];
        }, [system, propertyKey]),
        useInterceptObservable("function", system, addFn),
        useInterceptObservable("function", system, removeFn),
        changeFn ? useInterceptObservable("function", system, changeFn) : undefined
    );
};
