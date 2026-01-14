import type { DirectionalLight, Scene } from "core/index";
import type { FunctionComponent } from "react";
import type { Observer } from "core/Misc/observable";

import { useState } from "react";

import { CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { DirectionalLightFrustumViewer } from "core/Debug/directionalLightFrustumViewer";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import { BoundProperty } from "../boundProperty";

export const DirectionalLightSetupProperties: FunctionComponent<{ context: DirectionalLight }> = ({ context: directionalLight }) => {
    const scene = directionalLight.getScene();
    const camera = scene.activeCamera;

    // Check if using CascadedShadowGenerator to hide autoCalcShadowZBounds
    let generator = directionalLight.getShadowGenerator(camera) ?? null;
    if (generator === null) {
        const shadowGenerators = directionalLight.getShadowGenerators();
        if (shadowGenerators && shadowGenerators.size > 0) {
            generator = shadowGenerators.values().next().value ?? null;
        }
    }
    const hideAutoCalcShadowZBounds = generator instanceof CascadedShadowGenerator;

    return (
        <>
            <BoundProperty label="Position" component={Vector3PropertyLine} target={directionalLight} propertyKey="position" />
            <BoundProperty label="Direction" component={Vector3PropertyLine} target={directionalLight} propertyKey="direction" />
            <BoundProperty label="Diffuse" component={Color3PropertyLine} target={directionalLight} propertyKey="diffuse" />
            <BoundProperty label="Specular" component={Color3PropertyLine} target={directionalLight} propertyKey="specular" />
            <BoundProperty label="Intensity" component={NumberInputPropertyLine} target={directionalLight} propertyKey="intensity" />
            <BoundProperty
                label="Auto Update Extends"
                description="Automatically compute the projection matrix to fit the light's shadow frustum to the scene."
                component={SwitchPropertyLine}
                target={directionalLight}
                propertyKey="autoUpdateExtends"
            />
            {!hideAutoCalcShadowZBounds && (
                <BoundProperty
                    label="Auto Calc Shadow ZBounds"
                    description="Automatically compute the shadow min/max z values."
                    component={SwitchPropertyLine}
                    target={directionalLight}
                    propertyKey="autoCalcShadowZBounds"
                />
            )}
            <BoundProperty label="Ortho Left" component={NumberInputPropertyLine} target={directionalLight} propertyKey="orthoLeft" />
            <BoundProperty label="Ortho Right" component={NumberInputPropertyLine} target={directionalLight} propertyKey="orthoRight" />
            <BoundProperty label="Ortho Bottom" component={NumberInputPropertyLine} target={directionalLight} propertyKey="orthoBottom" />
            <BoundProperty label="Ortho Top" component={NumberInputPropertyLine} target={directionalLight} propertyKey="orthoTop" />
        </>
    );
};

interface IFrustumViewerState {
    viewer: DirectionalLightFrustumViewer;
    observer: Observer<Scene>;
}

const FrustumViewerMap = new WeakMap<DirectionalLight, IFrustumViewerState>();
export const DirectionalLightDebugProperties: FunctionComponent<{ context: DirectionalLight }> = ({ context: directionalLight }) => {
    const [displayFrustum, setDisplayFrustum] = useState(FrustumViewerMap.has(directionalLight));

    const toggleDisplayFrustum = () => {
        const light = directionalLight;
        const camera = light.getScene().activeCamera;
        const existingState = FrustumViewerMap.get(light);

        if (existingState) {
            // Clean up existing frustum viewer
            light.getScene().onAfterRenderObservable.remove(existingState.observer);
            existingState.viewer.dispose();
            FrustumViewerMap.delete(light);
            setDisplayFrustum(false);
        } else {
            // Create new frustum viewer
            const viewer = new DirectionalLightFrustumViewer(light, camera);
            const observer = light.getScene().onAfterRenderObservable.add(() => {
                viewer.update();
            });
            FrustumViewerMap.set(light, { viewer, observer });
            setDisplayFrustum(true);
        }
    };

    return (
        <>
            <SwitchPropertyLine label="Display Frustum" value={displayFrustum} onChange={toggleDisplayFrustum} />
        </>
    );
};
