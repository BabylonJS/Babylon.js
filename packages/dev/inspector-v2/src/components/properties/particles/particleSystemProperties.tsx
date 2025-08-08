import type { FactorGradient, ColorGradient as Color4Gradient, IParticleSystem, IValueGradient } from "core/index";

import { Color3, Color4 } from "core/Maths/math.color";
import { useCallback } from "react";
import type { FunctionComponent } from "react";

import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { Color4GradientList, FactorGradientList } from "shared-ui-components/fluent/hoc/gradientList";

export const ParticleSystemEmissionProperties: FunctionComponent<{ particleSystem: IParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    // TODO-iv2: Perhaps a common enough pattern to create a custom hook
    const emitRateGradients = useObservableState(
        useCallback(() => {
            const gradients = system.getEmitRateGradients();
            return [...(gradients ?? [])];
        }, [system]),
        useInterceptObservable("function", system, "addEmitRateGradient"),
        useInterceptObservable("function", system, "removeEmitRateGradient"),
        useInterceptObservable("function", system, "forceRefreshGradients")
    );

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

export const ParticleSystemColorProperties: FunctionComponent<{ particleSystem: IParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const colorGradients = useObservableState(
        useCallback(() => {
            const gradients = system.getColorGradients();
            return [...(gradients ?? [])];
        }, [system]),
        useInterceptObservable("function", system, "addColorGradient"),
        useInterceptObservable("function", system, "removeColorGradient"),
        useInterceptObservable("function", system, "forceRefreshGradients")
    );

    return (
        <>
            {!system.isNodeGenerated && (
                <Color4GradientList
                    gradients={colorGradients}
                    label="Color Gradient"
                    removeGradient={(gradient: IValueGradient) => {
                        system.removeEmitRateGradient(gradient.gradient);
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
