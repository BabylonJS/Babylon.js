import { Body1, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowMoveFilled, EyeFilled, EyeOffFilled } from "@fluentui/react-icons";
import { FontAsset } from "addons/msdfText/fontAsset";
import { TextRenderer } from "addons/msdfText/textRenderer";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import type { Color3 } from "core/Maths/math.color";
import { Color4 } from "core/Maths/math.color";
import { Matrix } from "core/Maths/math.vector";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import type { Scene } from "core/scene";
import { useCallback, useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import { SyncedSliderInput } from "shared-ui-components/fluent/primitives/syncedSlider";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { useAsyncResource, useResource } from "../../../hooks/resourceHooks";
import type { IAttractorData } from "./attractorAdapter";

type AttractorProps = {
    attractorData: IAttractorData;
    id: number;
    impostorScale: number;
    impostorColor: Color3;
    impostorMaterial: StandardMaterial;
    scene: Scene;
    isControlled: (impostor: AbstractMesh) => boolean;
    onControl: (impostor?: AbstractMesh) => void;
};

const useAttractorStyles = makeStyles({
    container: {
        // top-level div used for lineContainer, in UI overhaul update to just use linecontainer
        width: "100%",
        display: "flex", // Makes this a flex container
        flexDirection: "row", // Arranges children horizontally, main-axis=horizontal
        padding: `${tokens.spacingVerticalXS} 0px`,
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    },
    strengthLabel: {
        flex: 1,
        display: "flex",
        alignItems: "center",
    },
});

const CreateImpostor = (id: number, scene: Scene, attractorData: IAttractorData, initialScale: number, initialMaterial: StandardMaterial) => {
    const impostor = CreateSphere("Attractor impostor #" + id, { diameter: 1 }, scene);
    impostor.scaling.setAll(initialScale);
    impostor.position.copyFrom(attractorData.position);
    impostor.material = initialMaterial;
    impostor.reservedDataStore = { hidden: true };
    return impostor;
};

async function CreateTextRendererAsync(id: number, scene: Scene, impostor: AbstractMesh, color: Color3) {
    const sdfFontDefinition = await (await fetch("https://assets.babylonjs.com/fonts/roboto-regular.json")).text();
    const fontAsset = new FontAsset(sdfFontDefinition, "https://assets.babylonjs.com/fonts/roboto-regular.png");

    const textRenderer = await TextRenderer.CreateTextRendererAsync(fontAsset, scene.getEngine());
    textRenderer.addParagraph("#" + id, {}, Matrix.Scaling(0.5, 0.5, 0.5).multiply(Matrix.Translation(0, 1, 0)));
    textRenderer.isBillboard = true;
    textRenderer.color = Color4.FromColor3(color, 1.0);
    textRenderer.parent = impostor;
    return textRenderer;
}

/**
 * Represents the UX of an attractor, a sphere with a color/size whose position matches that of the underlying attractor
 * @param props
 * @returns
 */
export const AttractorComponent: FunctionComponent<AttractorProps> = (props) => {
    const { attractorData, id, impostorScale, impostorMaterial, impostorColor, scene, onControl, isControlled } = props;
    const classes = useAttractorStyles();
    // For read-only attractors (Node particles), start hidden by default
    const [shown, setShown] = useState(!attractorData.isReadOnly);

    // We only want to recreate the impostor mesh and associated if id, scene, or attractor/impostor changes
    const impostor = useResource(useCallback(() => CreateImpostor(id, scene, attractorData, impostorScale, impostorMaterial), [id, scene, attractorData]));
    const label = useAsyncResource(useCallback(async () => await CreateTextRendererAsync(id, scene, impostor, impostorColor), [id, scene, impostor]));

    // Set initial visibility based on whether it should be shown
    useEffect(() => {
        impostor.visibility = shown ? 1 : 0;
    }, [impostor, shown]);

    // If impostor, color, or label change, recreate the observer function so that it isnt hooked to old state
    // For read-only attractors, don't sync position back (it can't be moved)
    useEffect(() => {
        const onAfterRender = scene.onAfterRenderObservable.add(() => {
            if (!attractorData.isReadOnly) {
                attractorData.position.copyFrom(impostor.position);
            }
            if (label) {
                label.color = Color4.FromColor3(impostorColor);
                label.render(scene.getViewMatrix(), scene.getProjectionMatrix());
            }
        });
        return () => {
            onAfterRender.remove();
        };
    }, [impostor, scene, label, impostorColor, attractorData]);

    // If impostor or impostorScale change, update impostor scaling
    useEffect(() => {
        impostor.scaling.setAll(impostorScale);
    }, [impostor, impostorScale]);

    return (
        <div className={classes.container}>
            {attractorData.isReadOnly ? (
                <Body1 className={classes.strengthLabel}>Strength: {attractorData.strength !== null ? attractorData.strength : "Dynamic"}</Body1>
            ) : (
                <SyncedSliderInput value={attractorData.strength!} onChange={(value) => attractorData.setStrength(value)} min={-10} max={10} step={0.1} />
            )}
            <ToggleButton
                title="Show / hide particle attractor."
                checkedIcon={EyeFilled}
                uncheckedIcon={EyeOffFilled}
                value={shown}
                onChange={(show: boolean) => {
                    impostor.visibility = show ? 1 : 0;
                    setShown(show);
                }}
            />
            {!attractorData.isReadOnly && (
                <ToggleButton
                    title="Add / remove position gizmo from particle attractor"
                    checkedIcon={ArrowMoveFilled}
                    value={isControlled(impostor)}
                    onChange={(control: boolean) => onControl(control ? impostor : undefined)}
                />
            )}
        </div>
    );
};
