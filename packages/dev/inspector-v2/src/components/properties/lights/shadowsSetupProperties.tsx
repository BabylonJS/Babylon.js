// eslint-disable-next-line import/no-internal-modules
import type { ShadowLight } from "core/index";
import type { FunctionComponent } from "react";

import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";
import { Checkbox } from "shared-ui-components/fluent/primitives/checkbox";

import { useProperty } from "../../../hooks/compoundPropertyHooks";

export const ShadowsSetupProperties: FunctionComponent<{ context: ShadowLight }> = ({ context: shadowLight }) => {
    const shadowsEnabled = useProperty(shadowLight, "shadowEnabled");
    const shadowsMinZ = useProperty(shadowLight, "shadowMinZ");
    const shadowsMaxZ = useProperty(shadowLight, "shadowMaxZ");

    return (
        <>
            <PropertyLine label="Shadows Enabled">
                <Checkbox value={shadowsEnabled} onChange={(checked) => (shadowLight.shadowEnabled = !!checked)} />
            </PropertyLine>
            <FloatInputPropertyLine label="Shadows near plane" value={shadowsMinZ ?? 0} onChange={(value) => (shadowLight.shadowMinZ = value)} />
            <FloatInputPropertyLine label="Shadows far plane" value={shadowsMaxZ ?? 0} onChange={(value) => (shadowLight.shadowMaxZ = value)} />
        </>
    );
};
