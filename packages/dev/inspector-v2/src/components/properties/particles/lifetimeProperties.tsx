import type { FactorGradient } from "core/index";
import { ParticleSystem } from "core/Particles/particleSystem";
import type { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import type { FunctionComponent } from "react";

import { makeStyles, Subtitle2, tokens } from "@fluentui/react-components";
import { useCallback } from "react";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { FactorGradientList } from "shared-ui-components/fluent/hoc/gradientList";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { BoundProperty } from "../boundProperty";
import { useObservableArray } from "../../../hooks/useObservableArray";

const useStyles = makeStyles({
    subsection: {
        marginTop: tokens.spacingVerticalM,
    },
});

/**
 * Display lifetime-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemLifetimeProperties: FunctionComponent<{ particleSystem: ParticleSystem | GPUParticleSystem }> = (props) => {
    const { particleSystem: system } = props;
    const isCpuParticleSystem = system instanceof ParticleSystem;

    // Lifetime gradient is not supported in GPU particle systems, so the UI will be hidden below
    const lifeTimeGradientsGetter = useCallback(() => system.getLifeTimeGradients(), [system]);
    const lifeTimeGradients = useObservableArray<ParticleSystem | GPUParticleSystem, FactorGradient>(
        system,
        lifeTimeGradientsGetter,
        "addLifeTimeGradient",
        "removeLifeTimeGradient",
        "forceRefreshGradients"
    );
    const useLifeTimeGradients = (lifeTimeGradients?.length ?? 0) > 0;

    const classes = useStyles();

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Min lifetime" target={system} propertyKey="minLifeTime" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max lifetime" target={system} propertyKey="maxLifeTime" min={0} step={0.1} />

            {isCpuParticleSystem && !useLifeTimeGradients && (
                <ButtonLine
                    label="Use Lifetime gradients"
                    onClick={() => {
                        system.addLifeTimeGradient(0, system.minLifeTime, system.maxLifeTime);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {useLifeTimeGradients && (
                <>
                    <Subtitle2 className={classes.subsection}>Lifetime Gradients</Subtitle2>
                    <FactorGradientList
                        gradients={lifeTimeGradients}
                        label="Lifetime Gradient"
                        removeGradient={(gradient: FactorGradient) => {
                            system.removeLifeTimeGradient(gradient.gradient);
                            system.forceRefreshGradients();
                        }}
                        addGradient={(gradient?: FactorGradient) => {
                            if (gradient) {
                                system.addLifeTimeGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                            } else {
                                system.addLifeTimeGradient(0, system.minLifeTime, system.maxLifeTime);
                            }
                            system.forceRefreshGradients();
                        }}
                        onChange={(_gradient: FactorGradient) => {
                            system.forceRefreshGradients();
                        }}
                    />
                </>
            )}

            <BoundProperty component={NumberInputPropertyLine} label="Target stop duration" target={system} propertyKey="targetStopDuration" min={0} step={0.1} />
        </>
    );
};
