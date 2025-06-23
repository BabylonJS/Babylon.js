// eslint-disable-next-line import/no-internal-modules
import type { PointLight } from "core/index";

import type { FunctionComponent } from "react";

export const PointLightSetupProperties: FunctionComponent<{ context: PointLight }> = ({ context: pointLight }) => {
    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="PointLightIsEnabled">Is enabled: {pointLight.isEnabled(false).toString()}</div>
        </>
    );
};
