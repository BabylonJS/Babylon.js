// import { makeStyles } from "@fluentui/react-components";
import { makeStyles, tokens } from "@fluentui/react-components";
import { ArrowMoveFilled, EyeFilled, EyeOffFilled } from "@fluentui/react-icons";
import type { FontAsset } from "addons/msdfText/fontAsset";
import type { TextRenderer } from "addons/msdfText/textRenderer";
import type { StandardMaterial } from "core/Materials";
import type { Color3 } from "core/Maths";
import { Color4 } from "core/Maths";
import type { AbstractMesh } from "core/Meshes";
import { CreateSphere } from "core/Meshes";
import type { Observer } from "core/Misc";
import type { Attractor } from "core/Particles";
import type { Scene } from "core/scene";
import { useEffect, useRef, useState, type FunctionComponent } from "react";
import { SyncedSliderInput } from "shared-ui-components/fluent/primitives/syncedSlider";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { useResource } from "../../../hooks/resourceHooks";

type AttractorProps = {
    attractor: Attractor;
    id: number;
    impostorScale: number;
    impostorColor: Color3;
    impostorMaterial: StandardMaterial;
    fontAsset?: FontAsset;
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
});

const CreateImpostor = (id: number, scene: Scene, attractor: Attractor, impostorScale: number, impostorMaterial: StandardMaterial) => {
    const impostor = CreateSphere("Attractor impostor #" + id, { diameter: 1 }, scene);
    impostor.scaling.setAll(impostorScale);
    impostor.position.copyFrom(attractor.position);
    impostor.material = impostorMaterial;
    // impostor.reservedDataStore = { hidden: true };
    return impostor;
};
/**
 * Represents the UX of an attractor, a sphere with a color/size whose position matches that of the underlying attractor
 * @param props
 * @returns
 */
export const AttractorComponent: FunctionComponent<AttractorProps> = (props) => {
    const { attractor, id, impostorScale, impostorMaterial, scene } = props;
    const classes = useAttractorStyles();
    const impostor = useResource(() => CreateImpostor(id, scene, attractor, impostorScale, impostorMaterial));
    const [shown, setShown] = useState(false);
    const sceneOnAfterRenderObserverRef = useRef<Observer<Scene>>();
    const label = useRef<TextRenderer>();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Cleanup
            sceneOnAfterRenderObserverRef.current?.remove();
            label.current?.dispose();
        };
    }, []);

    useEffect(() => {
        // If impostor color or scale change, we need to update the observer run on every render to ensure the label gets updated color/scale
        sceneOnAfterRenderObserverRef.current?.remove();
        sceneOnAfterRenderObserverRef.current = scene.onAfterRenderObservable.add(() => {
            attractor.position.copyFrom(impostor.position);
            if (label.current) {
                label.current.color = Color4.FromColor3(props.impostorColor);
                label.current.render(scene.getViewMatrix(), scene.getProjectionMatrix());
            }
        });
    }, [props.impostorColor, props.impostorScale, label.current]);

    useEffect(() => {
        if (props.fontAsset) {
            // const textRenderer = await TextRenderer.CreateTextRendererAsync(props.fontAsset, scene.getEngine());
            // textRenderer.addParagraph("#" + props.id, {}, Matrix.Scaling(0.5, 0.5, 0.5).multiply(Matrix.Translation(0, 1, 0)));
            // textRenderer.isBillboard = true;
            // textRenderer.color = props.impostorColor;
            // textRenderer.render(scene.getViewMatrix(), scene.getProjectionMatrix());
            // textRenderer.parent = impostor;
            // label.current = textRenderer;
        }
    }, [props.fontAsset]);

    const handleControlChange = (control: boolean) => {
        props.onControl(control ? impostor : undefined);
    };

    return (
        <div className={classes.container}>
            <SyncedSliderInput value={attractor.strength} onChange={(value) => (attractor.strength = value)} min={-10} max={10} step={0.1} />
            <ToggleButton
                title="Show / hide particle attractor."
                enabledIcon={<EyeFilled />}
                disabledIcon={<EyeOffFilled />}
                value={shown}
                onChange={(show) => {
                    show ? (impostor.visibility = 1) : (impostor.visibility = 0);
                    setShown(show);
                }}
            />
            <ToggleButton
                title="Add / remove position gizmo from particle attractor"
                enabledIcon={<ArrowMoveFilled />}
                value={props.isControlled(impostor)}
                onChange={handleControlChange}
            />
        </div>
    );
};
