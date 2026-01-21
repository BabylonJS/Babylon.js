import { PointLight } from "core/Lights/pointLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { SpotLight } from "core/Lights/spotLight";
import { Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SpinButtonPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { SettingsPopover } from "./settingsPopover";
import { QuickCreateSection, QuickCreateRow } from "./quickCreateLayout";

type LightsContentProps = {
    scene: Scene;
};

/**
 * Lights content component
 * @param props - Component props
 * @returns React component
 */
export const LightsContent: FunctionComponent<LightsContentProps> = ({ scene }) => {
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

    const handleCreatePointLight = () => {
        const light = new PointLight(pointLightName, pointLightPosition, scene);
        light.intensity = 1.0;
    };

    const handleCreateDirectionalLight = () => {
        const dirLight = new DirectionalLight(directionalLightName, directionalLightDirection, scene);
        dirLight.intensity = 1.0;
    };

    const handleCreateSpotlight = () => {
        const spotlight = new SpotLight(spotlightName, spotlightPosition, spotlightDirection, spotlightAngle, spotlightExponent, scene);
        spotlight.intensity = 1.0;
    };

    return (
        <QuickCreateSection>
            {/* Point Light */}
            <QuickCreateRow>
                <Button onClick={handleCreatePointLight} label="Point Light" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={pointLightName} onChange={(value) => setPointLightName(value)} />
                    <Vector3PropertyLine label="Position" value={pointLightPosition} onChange={(value) => setPointLightPosition(value)} />
                    <Button appearance="primary" onClick={handleCreatePointLight} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>

            {/* Directional Light */}
            <QuickCreateRow>
                <Button onClick={handleCreateDirectionalLight} label="Directional Light" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={directionalLightName} onChange={(value) => setDirectionalLightName(value)} />
                    <Vector3PropertyLine label="Direction" value={directionalLightDirection} onChange={(value) => setDirectionalLightDirection(value)} />
                    <Button appearance="primary" onClick={handleCreateDirectionalLight} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>

            {/* Spotlight */}
            <QuickCreateRow>
                <Button onClick={handleCreateSpotlight} label="Spotlight" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={spotlightName} onChange={(value) => setSpotlightName(value)} />
                    <Vector3PropertyLine label="Position" value={spotlightPosition} onChange={(value) => setSpotlightPosition(value)} />
                    <Vector3PropertyLine label="Direction" value={spotlightDirection} onChange={(value) => setSpotlightDirection(value)} />
                    <SpinButtonPropertyLine label="Angle" value={spotlightAngle} onChange={(value) => setSpotlightAngle(value)} min={0} max={Math.PI} step={0.1} />
                    <SpinButtonPropertyLine label="Exponent" value={spotlightExponent} onChange={(value) => setSpotlightExponent(value)} min={0} max={10} step={0.1} />
                    <Button appearance="primary" onClick={handleCreateSpotlight} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>
        </QuickCreateSection>
    );
};
