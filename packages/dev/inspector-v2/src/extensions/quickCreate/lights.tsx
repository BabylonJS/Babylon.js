import { PointLight } from "core/Lights/pointLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { SpotLight } from "core/Lights/spotLight";
import { Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SpinButtonPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { QuickCreateSection, QuickCreateItem } from "./quickCreateLayout";
import type { ISelectionService } from "../../services/selectionService";

type LightsContentProps = {
    scene: Scene;
    selectionService: ISelectionService;
};

/**
 * Lights content component
 * @param props - Component props
 * @returns React component
 */
export const LightsContent: FunctionComponent<LightsContentProps> = ({ scene, selectionService }) => {
    // Point Light state
    const [pointLightName, setPointLightName] = useState("Point Light");
    const [pointLightPosition, setPointLightPosition] = useState(new Vector3(0, 5, 0));

    // Directional Light state
    const [directionalLightName, setDirectionalLightName] = useState("Directional Light");
    const [directionalLightDirection, setDirectionalLightDirection] = useState(new Vector3(1, -1, 0));

    // Spotlight state
    const [spotlightName, setSpotlightName] = useState("Spotlight");
    const [spotlightPosition, setSpotlightPosition] = useState(new Vector3(0, 5, 0));
    const [spotlightDirection, setSpotlightDirection] = useState(new Vector3(0, -1, 0));
    const [spotlightAngle, setSpotlightAngle] = useState(1);
    const [spotlightExponent, setSpotlightExponent] = useState(1);

    const createPointLight = () => {
        const light = new PointLight(pointLightName, pointLightPosition, scene);
        light.intensity = 1.0;
        return light;
    };

    const createDirectionalLight = () => {
        const dirLight = new DirectionalLight(directionalLightName, directionalLightDirection, scene);
        dirLight.intensity = 1.0;
        return dirLight;
    };

    const createSpotlight = () => {
        const spotlight = new SpotLight(spotlightName, spotlightPosition, spotlightDirection, spotlightAngle, spotlightExponent, scene);
        spotlight.intensity = 1.0;
        return spotlight;
    };

    return (
        <QuickCreateSection>
            {/* Point Light */}
            <QuickCreateItem selectionService={selectionService} label="Point Light" onCreate={() => createPointLight()}>
                <TextInputPropertyLine label="Name" value={pointLightName} onChange={(value) => setPointLightName(value)} />
                <Vector3PropertyLine label="Position" value={pointLightPosition} onChange={(value) => setPointLightPosition(value)} />
            </QuickCreateItem>

            {/* Directional Light */}
            <QuickCreateItem selectionService={selectionService} label="Directional Light" onCreate={() => createDirectionalLight()}>
                <TextInputPropertyLine label="Name" value={directionalLightName} onChange={(value) => setDirectionalLightName(value)} />
                <Vector3PropertyLine label="Direction" value={directionalLightDirection} onChange={(value) => setDirectionalLightDirection(value)} />
            </QuickCreateItem>

            {/* Spotlight */}
            <QuickCreateItem selectionService={selectionService} label="Spotlight" onCreate={() => createSpotlight()}>
                <TextInputPropertyLine label="Name" value={spotlightName} onChange={(value) => setSpotlightName(value)} />
                <Vector3PropertyLine label="Position" value={spotlightPosition} onChange={(value) => setSpotlightPosition(value)} />
                <Vector3PropertyLine label="Direction" value={spotlightDirection} onChange={(value) => setSpotlightDirection(value)} />
                <SpinButtonPropertyLine label="Angle" value={spotlightAngle} onChange={(value) => setSpotlightAngle(value)} min={0} max={Math.PI} step={0.1} />
                <SpinButtonPropertyLine label="Exponent" value={spotlightExponent} onChange={(value) => setSpotlightExponent(value)} min={0} max={10} step={0.1} />
            </QuickCreateItem>
        </QuickCreateSection>
    );
};
