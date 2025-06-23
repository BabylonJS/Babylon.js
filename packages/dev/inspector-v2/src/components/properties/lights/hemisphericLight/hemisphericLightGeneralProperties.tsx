// eslint-disable-next-line import/no-internal-modules
import type { HemisphericLight } from "core/index";
import type { FunctionComponent } from "react";

export const HemisphericLightGeneralProperties: FunctionComponent<{ context: HemisphericLight }> = ({ context: hemisphericLight }) => {
    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="HemisphericLightIsEnabled">Is enabled: {hemisphericLight.isEnabled(false).toString()}</div>
        </>
    );
};
