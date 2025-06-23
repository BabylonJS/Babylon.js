// eslint-disable-next-line import/no-internal-modules
import type { DirectionalLight } from "core/index";

import type { FunctionComponent } from "react";

export const DirectionalLightGeneralProperties: FunctionComponent<{ context: DirectionalLight }> = ({ context: directionalLight }) => {
    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="DirectionalLightIsEnabled">Is enabled: {directionalLight.isEnabled(false).toString()}</div>
        </>
    );
};
