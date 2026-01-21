import type { FactorGradient } from "core/Misc";
import type { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import type { FunctionComponent } from "react";

import { makeStyles, Subtitle2, tokens } from "@fluentui/react-components";
import { ParticleSystem } from "core/Particles/particleSystem";
import { useCallback } from "react";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { FactorGradientList } from "shared-ui-components/fluent/hoc/gradientList";
import { BoundProperty } from "../boundProperty";
import { useObservableArray } from "../../../hooks/useObservableArray";

const useStyles = makeStyles({
    subsection: {
        marginTop: tokens.spacingVerticalM,
    },
});

/**
 * Display size-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemSizeProperties: FunctionComponent<{ particleSystem: ParticleSystem | GPUParticleSystem }> = (props) => {
    const { particleSystem: system } = props;
    const isCpuParticleSystem = system instanceof ParticleSystem;

    // Start size gradient is not supported in GPU particle systems, so the UI will be hidden below
    const starSizeGradientGetter = useCallback(() => system.getStartSizeGradients(), [system]);
    const startSizeGradient = useObservableArray<ParticleSystem | GPUParticleSystem, FactorGradient>(
        system,
        starSizeGradientGetter,
        "addStartSizeGradient",
        "removeStartSizeGradient",
        "forceRefreshGradients"
    );
    const useStartSizeGradients = (startSizeGradient?.length ?? 0) > 0;

    const sizeGradientGetter = useCallback(() => system.getSizeGradients(), [system]);
    const sizeGradient = useObservableArray<ParticleSystem | GPUParticleSystem, FactorGradient>(
        system,
        sizeGradientGetter,
        "addSizeGradient",
        "removeSizeGradient",
        "forceRefreshGradients"
    );
    const useSizeGradients = (sizeGradient?.length ?? 0) > 0;

    const classes = useStyles();

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Min size" target={system} propertyKey="minSize" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max size" target={system} propertyKey="maxSize" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Min scale x" target={system} propertyKey="minScaleX" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max scale x" target={system} propertyKey="maxScaleX" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Min scale y" target={system} propertyKey="minScaleY" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max scale y" target={system} propertyKey="maxScaleY" min={0} step={0.1} />

            {isCpuParticleSystem && !useStartSizeGradients && (
                <ButtonLine
                    label="Use Start Size gradients"
                    onClick={() => {
                        system.addStartSizeGradient(0, system.minSize, system.maxSize);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {useStartSizeGradients && (
                <>
                    <Subtitle2 className={classes.subsection}>Start Size Gradients</Subtitle2>
                    <FactorGradientList
                        gradients={startSizeGradient}
                        label="Start Size Gradient"
                        removeGradient={(gradient: FactorGradient) => {
                            system.removeStartSizeGradient(gradient.gradient);
                            system.forceRefreshGradients();
                        }}
                        addGradient={(gradient?: FactorGradient) => {
                            if (gradient) {
                                system.addStartSizeGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                            } else {
                                system.addStartSizeGradient(0, system.minSize, system.maxSize);
                            }
                            system.forceRefreshGradients();
                        }}
                        onChange={(_gradient: FactorGradient) => {
                            system.forceRefreshGradients();
                        }}
                    />
                </>
            )}

            {!useSizeGradients && (
                <ButtonLine
                    label="Use Size gradients"
                    onClick={() => {
                        system.addSizeGradient(0, system.minSize, system.maxSize);
                        system.forceRefreshGradients();
                    }}
                />
            )}

            {useSizeGradients && (
                <>
                    <Subtitle2 className={classes.subsection}>Size Gradients</Subtitle2>
                    <FactorGradientList
                        gradients={sizeGradient}
                        label="Size Gradient"
                        removeGradient={(gradient: FactorGradient) => {
                            system.removeSizeGradient(gradient.gradient);
                            system.forceRefreshGradients();
                        }}
                        addGradient={(gradient?: FactorGradient) => {
                            if (gradient) {
                                system.addSizeGradient(gradient.gradient, gradient.factor1, gradient.factor2);
                            } else {
                                system.addSizeGradient(0, system.minSize, system.maxSize);
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
