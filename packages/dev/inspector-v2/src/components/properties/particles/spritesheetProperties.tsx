import type { ParticleSystem } from "core/Particles/particleSystem";
import type { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import type { FunctionComponent } from "react";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { BoundProperty } from "../boundProperty";

/**
 * Display spritesheet-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemSpritesheetProperties: FunctionComponent<{ particleSystem: ParticleSystem | GPUParticleSystem }> = (props) => {
    const { particleSystem: system } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Animation sheet enabled" target={system} propertyKey="isAnimationSheetEnabled" />
            <BoundProperty component={NumberInputPropertyLine} label="First sprite index" target={system} propertyKey="startSpriteCellID" min={0} step={1} />
            <BoundProperty component={NumberInputPropertyLine} label="Last sprite index" target={system} propertyKey="endSpriteCellID" min={0} step={1} />
            <BoundProperty component={SwitchPropertyLine} label="Animation loop" target={system} propertyKey="spriteCellLoop" />
            <BoundProperty component={SwitchPropertyLine} label="Random cell start index" target={system} propertyKey="spriteRandomStartCell" />
            <BoundProperty component={NumberInputPropertyLine} label="Cell width" target={system} propertyKey="spriteCellWidth" min={0} step={1} />
            <BoundProperty component={NumberInputPropertyLine} label="Cell height" target={system} propertyKey="spriteCellHeight" min={0} step={1} />
            <BoundProperty component={NumberInputPropertyLine} label="Cell change speed" target={system} propertyKey="spriteCellChangeSpeed" min={0} step={0.01} />
        </>
    );
};
