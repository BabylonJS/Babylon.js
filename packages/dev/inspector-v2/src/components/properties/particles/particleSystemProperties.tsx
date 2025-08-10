import type { FactorGradient, ColorGradient as Color4Gradient, IValueGradient, ParticleSystem } from "core/index";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { GizmoManager } from "core/index";

import { Color3, Color4 } from "core/Maths/math.color";
import { useCallback } from "react";
import type { FunctionComponent } from "react";

import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { Color4GradientList, FactorGradientList } from "shared-ui-components/fluent/hoc/gradientList";
import { AttractorList } from "./attractorList";

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

export const ParticleSystemAttractorProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;
    const gizmoManager = new GizmoManager(system.getScene()!);

    const attractors = useParticleSystemProperty(system, "attractors", "property", "addAttractor", "removeAttractor");

    return (
        <>
            <AttractorList gizmoManager={gizmoManager} attractors={attractors} scene={system.getScene()!} system={system} />
        </>
    );
};

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
