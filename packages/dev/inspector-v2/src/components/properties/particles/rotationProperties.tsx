import type { FactorGradient } from "core/index";
import type { ParticleSystem } from "core/Particles/particleSystem";
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
 * Display rotation-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemRotationProperties: FunctionComponent<{ particleSystem: ParticleSystem | GPUParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    const angularSpeedGradientsGetter = useCallback(() => system.getAngularSpeedGradients(), [system]);
    const angularSpeedGradients = useObservableArray<ParticleSystem | GPUParticleSystem, FactorGradient>(
        system,
        angularSpeedGradientsGetter,
        "addAngularSpeedGradient",
        "removeAngularSpeedGradient",
        "forceRefreshGradients"
    );
    const useAngularSpeedGradients = (angularSpeedGradients?.length ?? 0) > 0;

    const classes = useStyles();

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Min Angular speed" target={system} propertyKey="minAngularSpeed" step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="Max Angular speed" target={system} propertyKey="maxAngularSpeed" step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="Min initial rotation" target={system} propertyKey="minInitialRotation" step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="Max initial rotation" target={system} propertyKey="maxInitialRotation" step={0.01} />

            {!useAngularSpeedGradients && (
                <ButtonLine
                    label="Use Angular speed gradients"
                    onClick={() => {
                        system.addAngularSpeedGradient(0, system.minAngularSpeed, system.maxAngularSpeed);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {useAngularSpeedGradients && (
                <>
                    <Subtitle2 className={classes.subsection}>Angular Speed Gradients</Subtitle2>
                    <FactorGradientList
                        gradients={angularSpeedGradients}
                        label="Angular Speed Gradient"
                        removeGradient={(gradient: FactorGradient) => {
                            system.removeAngularSpeedGradient(gradient.gradient);
                            system.forceRefreshGradients();
                        }}
                        addGradient={(gradient?: FactorGradient) => {
                            if (gradient) {
                                system.addAngularSpeedGradient(gradient.gradient, gradient.factor1 ?? 0, gradient.factor2);
                            } else {
                                system.addAngularSpeedGradient(0, system.minAngularSpeed, system.maxAngularSpeed);
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
