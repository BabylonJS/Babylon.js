// eslint-disable-next-line import/no-internal-modules
import type { ShadowLight } from "core/index";
import type { FunctionComponent } from "react";

import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { Checkbox } from "shared-ui-components/fluent/primitives/checkbox";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";

import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";

export const ShadowsSetupProperties: FunctionComponent<{ context: ShadowLight }> = ({ context: pointLight }) => {
    const shadowsEnabled = useObservableState(() => pointLight.shadowEnabled, useInterceptObservable("property", pointLight, "shadowEnabled"));
    const shadowsMaxZ = useObservableState(() => pointLight.shadowMaxZ, useInterceptObservable("property", pointLight, "shadowMaxZ"));
    const shadowsMinZ = useObservableState(() => pointLight.shadowMinZ, useInterceptObservable("property", pointLight, "shadowMinZ"));

    return (
        <>
            <PropertyLine label="Shadows Enabled">
                <Checkbox value={shadowsEnabled} onChange={(checked) => (pointLight.shadowEnabled = !!checked)} />
            </PropertyLine>
            <FloatInputPropertyLine label="Shadows near plane" value={shadowsMinZ ?? 0} onChange={(value) => (pointLight.shadowMinZ = value)} />
            <FloatInputPropertyLine label="Shadows far plane" value={shadowsMaxZ ?? 0} onChange={(value) => (pointLight.shadowMaxZ = value)} />
        </>
    );
};
