import type { FactorGradient, IParticleSystem, IValueGradient } from "core/index";
import { useCallback } from "react";
import type { FunctionComponent } from "react";

import { useInterceptObservable } from "inspector-v2/hooks/instrumentationHooks";
import { useObservableState } from "inspector-v2/hooks/observableHooks";
import { FactorGradientList } from "shared-ui-components/fluent/hoc/gradientList";

export const ParticleSystemProperties: FunctionComponent<{ particleSystem: IParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const emitRateGradients = useObservableState(
        useCallback(() => system.getEmitRateGradients(), [system]),
        useInterceptObservable("function", system, "addEmitRateGradient"),
        useInterceptObservable("function", system, "removeEmitRateGradient")
    );

    return (
        <>
            {!system.isNodeGenerated && (
                <FactorGradientList
                    gradients={emitRateGradients}
                    label="Emit rate gradients"
                    removeGradient={(gradient: IValueGradient) => {
                        system.removeEmitRateGradient(gradient.gradient);
                        system.forceRefreshGradients();
                    }}
                    addGradient={(gradient?: FactorGradient) => {
                        gradient ? system.addEmitRateGradient(gradient.gradient, gradient.factor1, gradient.factor2) : system.addEmitRateGradient(0, 50, 50);
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
