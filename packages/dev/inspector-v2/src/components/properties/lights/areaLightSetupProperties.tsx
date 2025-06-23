// eslint-disable-next-line import/no-internal-modules
import type { AreaLight } from "core/index";

import type { FunctionComponent } from "react";

export const AreaLightSetupProperties: FunctionComponent<{ context: AreaLight }> = ({ context: areaLight }) => {
    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="AreaLightIsEnabled">Is enabled: {areaLight.isEnabled(false).toString()}</div>
        </>
    );
};
