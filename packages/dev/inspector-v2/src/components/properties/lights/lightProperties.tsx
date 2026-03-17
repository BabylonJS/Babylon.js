import type { FunctionComponent } from "react";

import type { Light } from "core/index";
import type { ISelectionService } from "../../../services/selectionService";

import { useCallback } from "react";

import { ClusteredLightContainer } from "core/Lights/Clustered/clusteredLightContainer";
import { ClusteredLightContainerSelectorPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/entitySelectorPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";

function FindOwnerContainer(light: Light): ClusteredLightContainer | null {
    for (const sceneLight of light.getScene().lights) {
        if (sceneLight instanceof ClusteredLightContainer && sceneLight.lights.includes(light)) {
            return sceneLight;
        }
    }
    return null;
}

function HasClusteredLightContainers(light: Light): boolean {
    return light.getScene().lights.some((l) => l instanceof ClusteredLightContainer);
}

export const LightGeneralProperties: FunctionComponent<{ light: Light; selectionService: ISelectionService }> = ({ light, selectionService }) => {
    const scene = light.getScene();

    // Intercept addLight/removeLight on the prototype so the observable fires after the
    // full operation completes (scene observables fire mid-operation, before the internal
    // lights array is updated).
    const afterAddLight = useInterceptObservable("function", ClusteredLightContainer.prototype, "addLight");
    const afterRemoveLight = useInterceptObservable("function", ClusteredLightContainer.prototype, "removeLight");

    const hasContainers = useObservableState(
        useCallback(() => HasClusteredLightContainers(light), [light]),
        scene.onNewLightAddedObservable,
        scene.onLightRemovedObservable
    );

    const container = useObservableState(
        useCallback(() => FindOwnerContainer(light), [light]),
        afterAddLight,
        afterRemoveLight
    );

    const onChange = (newContainer: ClusteredLightContainer | null) => {
        if (container) {
            container.removeLight(light);
        }
        if (newContainer) {
            newContainer.addLight(light);
        }
    };

    return (
        <Collapse visible={hasContainers && ClusteredLightContainer.IsLightSupported(light)}>
            <ClusteredLightContainerSelectorPropertyLine
                label="Cluster"
                description="The Clustered Light Container that contains this light (if any)."
                value={container}
                onChange={onChange}
                scene={scene}
                defaultValue={null}
                onLink={(entity) => (selectionService.selectedEntity = entity)}
            />
        </Collapse>
    );
};
