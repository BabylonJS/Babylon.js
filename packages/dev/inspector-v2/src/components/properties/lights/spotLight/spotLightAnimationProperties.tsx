// eslint-disable-next-line import/no-internal-modules
import type { SpotLight } from "core/index";

import type { FunctionComponent } from "react";

export const SpotLightAnimationProperties: FunctionComponent<{ context: SpotLight }> = ({ context: spotLight }) => {
    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="SpotLightIsEnabled">Is enabled: {spotLight.isEnabled(false).toString()}</div>
        </>
    );
};
