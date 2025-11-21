import type { FunctionComponent } from "react";

import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { BoundProperty } from "../boundProperty";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

/**
 * Displays the lighting and color properties of a PBR material.
 * @param props - The required properties
 * @returns A JSX element representing the lighting and color properties.
 */
export const PBRMaterialLightingAndColorProperties: FunctionComponent<{ material: PBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={Color3PropertyLine} label="Albedo" target={material} propertyKey="albedoColor" isLinearMode />
            <BoundProperty component={SyncedSliderPropertyLine} label="Base Weight" target={material} propertyKey="baseWeight" min={0} max={1} step={0.01} />
            <BoundProperty component={Color3PropertyLine} label="Reflectivity" target={material} propertyKey="reflectivityColor" isLinearMode />
            <BoundProperty component={SyncedSliderPropertyLine} label="Micro-Surface" target={material} propertyKey="microSurface" min={0} max={1} step={0.01} />
            <BoundProperty component={Color3PropertyLine} label="Emissive" target={material} propertyKey="emissiveColor" isLinearMode />
            <BoundProperty component={Color3PropertyLine} label="Ambient" target={material} propertyKey="ambientColor" isLinearMode />
            <BoundProperty component={SwitchPropertyLine} label="Use Physical Light Falloff" target={material} propertyKey="usePhysicalLightFalloff" />
        </>
    );
};
