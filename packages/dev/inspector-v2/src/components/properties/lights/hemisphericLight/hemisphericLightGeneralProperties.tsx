// eslint-disable-next-line import/no-internal-modules
import type { HemisphericLight } from "core/index";

import type { FunctionComponent } from "react";

import { useInterceptObservable } from "../../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../../hooks/observableHooks";

export const HemisphericLightGeneralProperties: FunctionComponent<{ context: HemisphericLight }> = ({ context: hemisphericLight }) => {
    // There is no observable for computeBonesUsingShaders, so we use an interceptor to listen for changes.
    const direction = useObservableState(() => hemisphericLight.direction, useInterceptObservable("property", hemisphericLight, "direction"));

    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <VectorPropertyLine label="Direction" vector={direction} onCopy={() => {}} />;
        </>
    );
};
