import type { ParticleSystem } from "core/Particles/particleSystem";
import type { FunctionComponent } from "react";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { BoundProperty } from "../../boundProperty";

/**
 * Display size-related properties for a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemSizeProperties: FunctionComponent<{ particleSystem: ParticleSystem }> = (props) => {
    const { particleSystem: system } = props;
    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Min size" target={system} propertyKey="minSize" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max size" target={system} propertyKey="maxSize" min={0} step={0.1} />

            <BoundProperty component={NumberInputPropertyLine} label="Min scale x" target={system} propertyKey="minScaleX" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max scale x" target={system} propertyKey="maxScaleX" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Min scale y" target={system} propertyKey="minScaleY" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Max scale y" target={system} propertyKey="maxScaleY" min={0} step={0.1} />
        </>
    );
};
