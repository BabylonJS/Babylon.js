import type { ShadowLight } from "core/index";

import type { FunctionComponent } from "react";

import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty, Property } from "../boundProperty";

export const ShadowsSetupProperties: FunctionComponent<{ context: ShadowLight }> = ({ context: shadowLight }) => {
    const shadowsEnabled = useProperty(shadowLight, "shadowEnabled");
    const shadowsMinZ = useProperty(shadowLight, "shadowMinZ");
    const shadowsMaxZ = useProperty(shadowLight, "shadowMaxZ");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Shadows Enabled" target={shadowLight} propertyKey="shadowEnabled" />
            <Collapse visible={shadowsEnabled}>
                <>
                    <Property
                        component={NumberInputPropertyLine}
                        label="Shadows Near Plane"
                        propertyPath="shadowMinZ"
                        value={shadowsMinZ ?? 0}
                        onChange={(value) => (shadowLight.shadowMinZ = value)}
                    />
                    <Property
                        component={NumberInputPropertyLine}
                        label="Shadows Far Plane"
                        propertyPath="shadowMaxZ"
                        value={shadowsMaxZ ?? 0}
                        onChange={(value) => (shadowLight.shadowMaxZ = value)}
                    />
                </>
            </Collapse>
        </>
    );
};
