import type { ShadowLight } from "core/index";

import type { FunctionComponent } from "react";

import { Collapse } from "@fluentui/react-motion-components-preview";

import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

export const ShadowsSetupProperties: FunctionComponent<{ context: ShadowLight }> = ({ context: shadowLight }) => {
    const shadowsEnabled = useProperty(shadowLight, "shadowEnabled");
    const shadowsMinZ = useProperty(shadowLight, "shadowMinZ");
    const shadowsMaxZ = useProperty(shadowLight, "shadowMaxZ");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Shadows Enabled" target={shadowLight} propertyKey="shadowEnabled" />
            <Collapse visible={shadowsEnabled}>
                <div>
                    <FloatInputPropertyLine label="Shadows Near Plane" value={shadowsMinZ ?? 0} onChange={(value) => (shadowLight.shadowMinZ = value)} />
                    <FloatInputPropertyLine label="Shadows Far Plane" value={shadowsMaxZ ?? 0} onChange={(value) => (shadowLight.shadowMaxZ = value)} />
                </div>
            </Collapse>
        </>
    );
};
