import type { FactorGradient, ColorGradient as Color4Gradient, IParticleSystem, IValueGradient } from "core/index";

import { Color4 } from "core/Maths/math.color";
import { useCallback } from "react";
import type { FunctionComponent } from "react";

import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";
import { Color4GradientList, FactorGradientList } from "shared-ui-components/fluent/hoc/gradientList";

export const ParticleSystemProperties: FunctionComponent<{ particleSystem: IParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const emitRateGradients = useObservableState(
        useCallback(() => {
            const gradients = system.getEmitRateGradients();
            return [...(gradients ?? [])];
        }, [system]),
        useInterceptObservable("function", system, "addEmitRateGradient"),
        useInterceptObservable("function", system, "removeEmitRateGradient")
    );

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
                <FactorGradientList
                    gradients={emitRateGradients}
                    label="Emit rate gradient"
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
            {!system.isNodeGenerated && (
                <Color4GradientList
                    gradients={colorGradients}
                    label="Color gradient"
                    removeGradient={(gradient: IValueGradient) => {
                        system.removeEmitRateGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: Color4Gradient) => {
                        if (gradient) {
                            system.addColorGradient(gradient.gradient, gradient.color1, gradient.color2);
                        } else {
                            system.addColorGradient(0, new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1));
                            system.addColorGradient(1, new Color4(1, 1, 1, 1), new Color4(1, 1, 1, 1));
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
