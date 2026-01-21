import type { ColorGradient, FactorGradient } from "core/index";
import type { Color3Gradient } from "core/Misc/gradients";
import type { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import type { FunctionComponent } from "react";

import { makeStyles, Subtitle2, tokens } from "@fluentui/react-components";
import { useCallback } from "react";
import { Color3 } from "core/Maths/math.color";
import { ParticleSystem } from "core/Particles/particleSystem";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { Color3GradientList, Color4GradientList, FactorGradientList } from "shared-ui-components/fluent/hoc/gradientList";
import { Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { useObservableArray } from "../../../hooks/useObservableArray";

const useStyles = makeStyles({
    subsection: {
        marginTop: tokens.spacingVerticalM,
    },
});

/**
 * Display color-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemColorProperties: FunctionComponent<{ particleSystem: ParticleSystem | GPUParticleSystem }> = (props) => {
    const { particleSystem: system } = props;
    const isCpuParticleSystem = system instanceof ParticleSystem;
    const useRampGradients = useProperty(system, "useRampGradients");

    const colorGradientsGetter = useCallback(() => system.getColorGradients(), [system]);
    const colorGradients = useObservableArray<ParticleSystem | GPUParticleSystem, ColorGradient>(
        system,
        colorGradientsGetter,
        "addColorGradient",
        "removeColorGradient",
        "forceRefreshGradients"
    );

    // Ramp, Color Remap, and Alpha Remap gradients are only supported in CPU particle systems, they will be hidden in the UI for GPU particle systems
    const rampGradientsGetter = useCallback(() => system.getRampGradients(), [system]);
    const rampGradients = useObservableArray<ParticleSystem | GPUParticleSystem, Color3Gradient>(
        system,
        rampGradientsGetter,
        "addRampGradient",
        "removeRampGradient",
        "forceRefreshGradients"
    );

    const colorRemapGradientsGetter = useCallback(() => system.getColorRemapGradients(), [system]);
    const colorRemapGradients = useObservableArray<ParticleSystem | GPUParticleSystem, FactorGradient>(
        system,
        colorRemapGradientsGetter,
        "addColorRemapGradient",
        "removeColorRemapGradient",
        "forceRefreshGradients"
    );

    const alphaRemapGradientsGetter = useCallback(() => system.getAlphaRemapGradients(), [system]);
    const alphaRemapGradients = useObservableArray<ParticleSystem | GPUParticleSystem, FactorGradient>(
        system,
        alphaRemapGradientsGetter,
        "addAlphaRemapGradient",
        "removeAlphaRemapGradient",
        "forceRefreshGradients"
    );

    const hasColorGradients = (colorGradients?.length ?? 0) > 0;
    const hasRampGradients = (rampGradients?.length ?? 0) > 0;
    const hasColorRemapGradients = (colorRemapGradients?.length ?? 0) > 0;
    const hasAlphaRemapGradients = (alphaRemapGradients?.length ?? 0) > 0;

    const classes = useStyles();

    return (
        <>
            <BoundProperty component={Color4PropertyLine} label="Color 1" target={system} propertyKey="color1" />
            <BoundProperty component={Color4PropertyLine} label="Color 2" target={system} propertyKey="color2" />
            <BoundProperty component={Color4PropertyLine} label="Color dead" target={system} propertyKey="colorDead" />

            {!hasColorGradients && (
                <ButtonLine
                    label="Use Color gradients"
                    onClick={() => {
                        system.addColorGradient(0, system.color1, system.color1);
                        system.addColorGradient(1, system.color2, system.color2);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {hasColorGradients && (
                <>
                    <Subtitle2 className={classes.subsection}>Color Gradients</Subtitle2>
                    <Color4GradientList
                        gradients={colorGradients}
                        label="Color Gradient"
                        removeGradient={(gradient: ColorGradient) => {
                            system.removeColorGradient(gradient.gradient);
                            system.forceRefreshGradients();
                        }}
                        addGradient={(gradient?: ColorGradient) => {
                            if (gradient) {
                                system.addColorGradient(gradient.gradient, gradient.color1, gradient.color2);
                            } else {
                                system.addColorGradient(0, system.color1, system.color1);
                                system.addColorGradient(1, system.color2, system.color2);
                            }
                            system.forceRefreshGradients();
                        }}
                        onChange={(_gradient: ColorGradient) => {
                            system.forceRefreshGradients();
                        }}
                    />
                </>
            )}

            {isCpuParticleSystem && <BoundProperty component={SwitchPropertyLine} label="Enable Ramp gradients" target={system} propertyKey="useRampGradients" />}
            {useRampGradients && (
                <>
                    {!hasRampGradients && (
                        <ButtonLine
                            label="Use Ramp gradients"
                            onClick={() => {
                                system.addRampGradient(0, Color3.Black());
                                system.addRampGradient(1, Color3.White());
                                system.forceRefreshGradients();
                            }}
                        />
                    )}

                    {hasRampGradients && (
                        <>
                            <Subtitle2 className={classes.subsection}>Ramp Gradients</Subtitle2>
                            <Color3GradientList
                                gradients={rampGradients}
                                label="Ramp Gradient"
                                removeGradient={(gradient) => {
                                    system.removeRampGradient(gradient.gradient);
                                    system.forceRefreshGradients();
                                }}
                                addGradient={(gradient) => {
                                    if (gradient) {
                                        system.addRampGradient(gradient.gradient, gradient.color);
                                    } else {
                                        system.addRampGradient(0, Color3.Black());
                                        system.addRampGradient(1, Color3.White());
                                    }
                                    system.forceRefreshGradients();
                                }}
                                onChange={() => {
                                    system.forceRefreshGradients();
                                }}
                            />
                        </>
                    )}

                    {!hasColorRemapGradients && (
                        <ButtonLine
                            label="Use Color remap gradients"
                            onClick={() => {
                                system.addColorRemapGradient(0, 0, 1);
                                system.forceRefreshGradients();
                            }}
                        />
                    )}

                    {hasColorRemapGradients && (
                        <>
                            <Subtitle2 className={classes.subsection}>Color Remap Gradients</Subtitle2>
                            <FactorGradientList
                                gradients={colorRemapGradients}
                                label="Color Remap Gradient"
                                removeGradient={(gradient: FactorGradient) => {
                                    system.removeColorRemapGradient(gradient.gradient);
                                    system.forceRefreshGradients();
                                }}
                                addGradient={(gradient?: FactorGradient) => {
                                    if (gradient) {
                                        system.addColorRemapGradient(gradient.gradient, gradient.factor1 ?? 0, gradient.factor2 ?? 1);
                                    } else {
                                        system.addColorRemapGradient(0, 0, 1);
                                    }
                                    system.forceRefreshGradients();
                                }}
                                onChange={(_gradient: FactorGradient) => {
                                    system.forceRefreshGradients();
                                }}
                            />
                        </>
                    )}

                    {!hasAlphaRemapGradients && (
                        <ButtonLine
                            label="Use Alpha remap gradients"
                            onClick={() => {
                                system.addAlphaRemapGradient(0, 0, 1);
                                system.forceRefreshGradients();
                            }}
                        />
                    )}

                    {hasAlphaRemapGradients && (
                        <>
                            <Subtitle2 className={classes.subsection}>Alpha Remap Gradients</Subtitle2>
                            <FactorGradientList
                                gradients={alphaRemapGradients}
                                label="Alpha Remap Gradient"
                                removeGradient={(gradient: FactorGradient) => {
                                    system.removeAlphaRemapGradient(gradient.gradient);
                                    system.forceRefreshGradients();
                                }}
                                addGradient={(gradient?: FactorGradient) => {
                                    if (gradient) {
                                        system.addAlphaRemapGradient(gradient.gradient, gradient.factor1 ?? 0, gradient.factor2 ?? 1);
                                    } else {
                                        system.addAlphaRemapGradient(0, 0, 1);
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
            )}
        </>
    );
};
