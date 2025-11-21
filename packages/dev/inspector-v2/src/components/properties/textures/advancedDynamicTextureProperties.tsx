import type { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";

import { useCallback } from "react";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { useObservableState } from "../../../hooks/observableHooks";
import { usePollingObservable } from "../../../hooks/pollingHooks";
import { useResource } from "../../../hooks/resourceHooks";
import { BoundProperty } from "../boundProperty";
import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";

export const AdvancedDynamicTextureGeneralProperties = MakeLazyComponent(
    async () => {
        // Defer importing anything from the gui package until this component is actually mounted.
        const { AdvancedDynamicTextureInstrumentation } = await import("gui/2D/adtInstrumentation");

        return (props: { texture: AdvancedDynamicTexture }) => {
            const { texture } = props;

            const instrumentation = useResource(
                useCallback(() => {
                    const instrumentation = new AdvancedDynamicTextureInstrumentation(texture);
                    instrumentation.captureRenderTime = true;
                    instrumentation.captureLayoutTime = true;
                    return instrumentation;
                }, [texture])
            );

            const layoutTime = useObservableState(
                useCallback(() => instrumentation.layoutTimeCounter.current, [instrumentation.layoutTimeCounter]),
                usePollingObservable(1000)
            );

            const renderTime = useObservableState(
                useCallback(() => instrumentation.renderTimeCounter.current, [instrumentation.renderTimeCounter]),
                usePollingObservable(1000)
            );

            return (
                <>
                    <StringifiedPropertyLine label="Last Layout Time" value={layoutTime} precision={2} units="ms" />
                    <StringifiedPropertyLine label="Last Render Time" value={renderTime} precision={2} units="ms" />
                    <BoundProperty component={SyncedSliderPropertyLine} label="Render Scale" target={texture} propertyKey="renderScale" min={0.1} max={5} step={0.1} />
                    <BoundProperty component={SwitchPropertyLine} label="Premultiply Alpha" target={texture} propertyKey="premulAlpha" />
                    <BoundProperty component={NumberInputPropertyLine} label="Ideal Width" target={texture} propertyKey="idealWidth" />
                    <BoundProperty component={NumberInputPropertyLine} label="Ideal Height" target={texture} propertyKey="idealHeight" />
                    <BoundProperty component={SwitchPropertyLine} label="Use Smallest Ideal" target={texture} propertyKey="useSmallestIdeal" />
                    <BoundProperty component={SwitchPropertyLine} label="Render at Ideal Size" target={texture} propertyKey="renderAtIdealSize" />
                    <BoundProperty component={SwitchPropertyLine} label="Invalidate Rect Optimization" target={texture} propertyKey="useInvalidateRectOptimization" />
                </>
            );
        };
    },
    { spinnerSize: "extra-tiny", spinnerLabel: "Loading..." }
);
