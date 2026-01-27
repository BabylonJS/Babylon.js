import type { FactorGradient } from "core/index";
import type { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import type { FunctionComponent } from "react";

import { makeStyles, Subtitle2, tokens } from "@fluentui/react-components";
import { ParticleSystem } from "core/Particles/particleSystem";
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
 * Display emission-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemEmissionProperties: FunctionComponent<{ particleSystem: ParticleSystem | GPUParticleSystem }> = (props) => {
    const { particleSystem: system } = props;
    const isCpuParticleSystem = system instanceof ParticleSystem;

    // Emit rate gradient is not supported in GPU particle systems, so the UI will be hidden below
    const emitRateGradientsGetter = useCallback(() => system.getEmitRateGradients(), [system]);
    const emitRateGradients = useObservableArray<ParticleSystem | GPUParticleSystem, FactorGradient>(
        system,
        emitRateGradientsGetter,
        "addEmitRateGradient",
        "removeEmitRateGradient",
        "forceRefreshGradients"
    );

    const velocityGradientsGetter = useCallback(() => system.getVelocityGradients(), [system]);
    const velocityGradients = useObservableArray<ParticleSystem | GPUParticleSystem, FactorGradient>(
        system,
        velocityGradientsGetter,
        "addVelocityGradient",
        "removeVelocityGradient",
        "forceRefreshGradients"
    );

    const limitVelocityGradientsGetter = useCallback(() => system.getLimitVelocityGradients(), [system]);
    const limitVelocityGradients = useObservableArray<ParticleSystem | GPUParticleSystem, FactorGradient>(
        system,
        limitVelocityGradientsGetter,
        "addLimitVelocityGradient",
        "removeLimitVelocityGradient",
        "forceRefreshGradients"
    );

    const dragGradientsGetter = useCallback(() => system.getDragGradients(), [system]);
    const dragGradients = useObservableArray<ParticleSystem | GPUParticleSystem, FactorGradient>(
        system,
        dragGradientsGetter,
        "addDragGradient",
        "removeDragGradient",
        "forceRefreshGradients"
    );

    const useEmitRateGradients = (emitRateGradients?.length ?? 0) > 0;
    const useVelocityGradients = (velocityGradients?.length ?? 0) > 0;
    const useLimitVelocityGradients = (limitVelocityGradients?.length ?? 0) > 0;
    const useDragGradients = (dragGradients?.length ?? 0) > 0;

    const classes = useStyles();

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Emit rate" target={system} propertyKey="emitRate" min={0} step={1} />

            {isCpuParticleSystem && !useEmitRateGradients && (
                <ButtonLine
                    label="Use Emit rate gradients"
                    onClick={() => {
                        system.addEmitRateGradient(0, system.emitRate, system.emitRate);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {useEmitRateGradients && (
                <>
                    <Subtitle2 className={classes.subsection}>Emit Rate Gradients</Subtitle2>
                    <FactorGradientList
                        gradients={emitRateGradients}
                        label="Emit Rate Gradient"
                        removeGradient={(gradient: FactorGradient) => {
                            system.removeEmitRateGradient(gradient.gradient);
                            system.forceRefreshGradients();
                        }}
                        addGradient={(gradient?: FactorGradient) => {
                            if (gradient) {
                                system.addEmitRateGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                            } else {
                                system.addEmitRateGradient(0, system.emitRate, system.emitRate);
                            }
                            system.forceRefreshGradients();
                        }}
                        onChange={(_gradient: FactorGradient) => {
                            system.forceRefreshGradients();
                        }}
                    />
                </>
            )}

            <BoundProperty component={NumberInputPropertyLine} label="Min Emit Power" target={system} propertyKey="minEmitPower" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max Emit Power" target={system} propertyKey="maxEmitPower" min={0} step={0.1} />

            {!useVelocityGradients && (
                <ButtonLine
                    label="Use Velocity gradients"
                    onClick={() => {
                        system.addVelocityGradient(0, 1, 1);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {useVelocityGradients && (
                <>
                    <Subtitle2 className={classes.subsection}>Velocity Gradients</Subtitle2>
                    <FactorGradientList
                        gradients={velocityGradients}
                        label="Velocity Gradient"
                        removeGradient={(gradient: FactorGradient) => {
                            system.removeVelocityGradient(gradient.gradient);
                            system.forceRefreshGradients();
                        }}
                        addGradient={(gradient?: FactorGradient) => {
                            if (gradient) {
                                system.addVelocityGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                            } else {
                                system.addVelocityGradient(0, 1, 1);
                            }
                            system.forceRefreshGradients();
                        }}
                        onChange={(_gradient: FactorGradient) => {
                            system.forceRefreshGradients();
                        }}
                    />
                </>
            )}

            {!useLimitVelocityGradients && (
                <ButtonLine
                    label="Use Limit Velocity gradients"
                    onClick={() => {
                        system.addLimitVelocityGradient(0, 1, 1);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {useLimitVelocityGradients && (
                <>
                    <Subtitle2 className={classes.subsection}>Limit Velocity Gradients</Subtitle2>
                    <FactorGradientList
                        gradients={limitVelocityGradients}
                        label="Limit Velocity Gradient"
                        removeGradient={(gradient: FactorGradient) => {
                            system.removeLimitVelocityGradient(gradient.gradient);
                            system.forceRefreshGradients();
                        }}
                        addGradient={(gradient?: FactorGradient) => {
                            if (gradient) {
                                system.addLimitVelocityGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                            } else {
                                system.addLimitVelocityGradient(0, 1, 1);
                            }
                            system.forceRefreshGradients();
                        }}
                        onChange={(_gradient: FactorGradient) => {
                            system.forceRefreshGradients();
                        }}
                    />
                </>
            )}

            {!useDragGradients && (
                <ButtonLine
                    label="Use Drag gradients"
                    onClick={() => {
                        system.addDragGradient(0, 1, 1);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {useDragGradients && (
                <>
                    <Subtitle2 className={classes.subsection}>Drag Gradients</Subtitle2>
                    <FactorGradientList
                        gradients={dragGradients}
                        label="Drag Gradient"
                        removeGradient={(gradient: FactorGradient) => {
                            system.removeDragGradient(gradient.gradient);
                            system.forceRefreshGradients();
                        }}
                        addGradient={(gradient?: FactorGradient) => {
                            if (gradient) {
                                system.addDragGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                            } else {
                                system.addDragGradient(0, 1, 1);
                            }
                            system.forceRefreshGradients();
                        }}
                        onChange={(_gradient: FactorGradient) => {
                            system.forceRefreshGradients();
                        }}
                    />
                </>
            )}
        </>
    );
};
