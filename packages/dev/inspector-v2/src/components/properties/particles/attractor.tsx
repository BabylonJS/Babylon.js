// import { makeStyles } from "@fluentui/react-components";
import { makeStyles, tokens } from "@fluentui/react-components";
import { ArrowMoveFilled, EyeFilled, EyeOffFilled } from "@fluentui/react-icons";
import { FontAsset } from "addons/msdfText/fontAsset";
import { TextRenderer } from "addons/msdfText/textRenderer";
import { GizmoManager } from "core/Gizmos";
import { StandardMaterial } from "core/Materials";
import { Color3, Color4, Matrix } from "core/Maths";
import type { AbstractMesh } from "core/Meshes";
import { CreateSphere } from "core/Meshes";
import type { Observer } from "core/Misc";
import { Attractor } from "core/Particles";
import type { ParticleSystem } from "core/Particles";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { useCallback, useEffect, useRef, useState, type FunctionComponent } from "react";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { List } from "shared-ui-components/fluent/primitives/list";
import type { ListItem } from "shared-ui-components/fluent/primitives/list";
import { SyncedSliderInput } from "shared-ui-components/fluent/primitives/syncedSlider";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";

type AttractorProps = {
    attractor: Attractor;
    impostor?: AbstractMesh;
    controlled: boolean;
    shown: boolean;
    onShow: (val: boolean) => void;
    onControl: (val: boolean) => void;
};
export const AttractorComponent: FunctionComponent<AttractorProps> = (props) => {
    const { attractor } = props;
    const classes = useAttractorStyles();
    const [shown, setShown] = useState(props.shown);
    const [controlled, setControlled] = useState(props.controlled);
    useEffect(() => {
        setShown(props.shown);
    }, [props.shown]);
    useEffect(() => {
        setControlled(props.controlled);
    }, [props.controlled]);

    return (
        <div className={classes.container}>
            <SyncedSliderInput value={attractor.strength} onChange={(value) => (attractor.strength = value)} min={-10} max={10} step={0.1} />
            <ToggleButton title="Show / hide particle attractor." enabledIcon={<EyeFilled />} disabledIcon={<EyeOffFilled />} value={shown} onChange={props.onShow} />
            <ToggleButton title="Add / remove position gizmo from particle attractor" enabledIcon={<ArrowMoveFilled />} value={controlled} onChange={props.onControl} />
        </div>
    );
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

// For each Attractor, create a listItem consisting of the attractor and its debugging impostor mesh
function AttractorsToListItems(attractors: Nullable<Array<Attractor>>) {
    return (
        attractors?.map((attractor, index) => {
            return {
                id: index,
                data: attractor,
                sortBy: 0,
            };
        }) ?? []
    );
}

function useFontAsset(jsonUrl: string, imageUrl: string) {
    const fontAssetRef = useRef<FontAsset>();
    const loadingRef = useRef<Promise<FontAsset>>();

    const getFontAsset = useCallback(async (): Promise<FontAsset> => {
        if (fontAssetRef.current) {
            return fontAssetRef.current;
        }

        if (loadingRef.current) {
            return await loadingRef.current;
        }

        loadingRef.current = (async () => {
            const definition = await (await fetch(jsonUrl)).text();
            const asset = new FontAsset(definition, imageUrl);
            fontAssetRef.current = asset;
            loadingRef.current = undefined;
            return asset;
        })();

        return await loadingRef.current;
    }, [jsonUrl, imageUrl]);

    // Cleanup
    useEffect(() => {
        return () => {
            fontAssetRef.current?.dispose();
        };
    }, []);

    return getFontAsset;
}

type AttractorListProps = {
    scene: Scene;
    gizmoManager: GizmoManager;
    attractors: Array<Attractor>;
    system: ParticleSystem;
};

type AttractorDebugProperties = {
    impostor: AbstractMesh;
    label?: TextRenderer;
};
export const AttractorList: FunctionComponent<AttractorListProps> = (props) => {
    const { scene, system } = props;
    const [items, setItems] = useState<Array<ListItem<Attractor>>>([]);

    // All impostors share a scale/color... for now!
    const [impostorScale, setImpostorScale] = useState(1);
    const [impostorColor, setImpostorColor] = useState<Color3>(Color3.White());
    const [controlledImpostor, setControlledImpostor] = useState<Nullable<AbstractMesh>>(null);
    const getFontAsset = useFontAsset("https://assets.babylonjs.com/fonts/roboto-regular.json", "https://assets.babylonjs.com/fonts/roboto-regular.png");

    const gizmoManagerRef = useRef<GizmoManager>(new GizmoManager(props.scene));
    const impostorMaterialRef = useRef<StandardMaterial>();
    const impostorMapRef = useRef<Map<Attractor, AttractorDebugProperties>>(new Map());
    const sceneOnAfterRenderObserverRef = useRef<Observer<Scene>>();

    // Initial setup and cleanup logic
    useEffect(() => {
        // Setup
        gizmoManagerRef.current.positionGizmoEnabled = true;
        //        gizmoManagerRef.current.attachableMeshes = [];

        impostorMaterialRef.current = new StandardMaterial("Attractor impostor material", scene);
        impostorMaterialRef.current.reservedDataStore = { hidden: true }; // Ensure scene explorer doesn't show the material

        // setItems(AttractorsToListItems(props.attractors));

        return () => {
            // Cleanup
            gizmoManagerRef.current.dispose();
            impostorMaterialRef.current?.dispose();
            disposeImpostors();
            sceneOnAfterRenderObserverRef.current?.remove();
        };
    }, []);

    // If impostor color or scale changes, update all impostors
    useEffect(() => {
        impostorMaterialRef.current && (impostorMaterialRef.current.diffuseColor = impostorColor);
        impostorMapRef.current.forEach((element) => {
            element.impostor.scaling.setAll(impostorScale);
            if (element.label) {
                element.label.color = Color4.FromColor3(impostorColor, 1.0);
                element.label.render(scene.getViewMatrix(), scene.getProjectionMatrix());
            }
        });
    }, [impostorScale, impostorColor]);

    const disposeImpostors = () => {
        impostorMapRef.current.forEach((item) => {
            item.impostor.dispose(true, true);
            item.label?.dispose();
        });
        impostorMapRef.current.clear();
    };

    const createImpostors = (attractors: Attractor[]) => {
        attractors.forEach((attractor, index) => {
            const impostor = CreateSphere("Attractor impostor #" + index, { diameter: 1 }, scene);
            impostor.scaling.setAll(impostorScale);
            impostor.position.copyFrom(attractor.position);
            const material = impostorMaterialRef.current;
            material && (impostor.material = material);
            // impostorMaterialRef.current && (impostorMaterialRef.current.diffuseColor = impostorColor);
            // impostorMaterialRef.current && (impostor.material = impostorMaterialRef.current);

            const debugProperties = { impostor };
            impostorMapRef.current.set(attractor, debugProperties);
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            addLabelAsync(debugProperties, index);
        });

        setItems(AttractorsToListItems(attractors));
    };

    // If attractors change, dispose impostors before recreating items. Reset the onAfterRenderObservable
    useEffect(() => {
        disposeImpostors();
        createImpostors(props.attractors);

        sceneOnAfterRenderObserverRef.current?.remove();
        sceneOnAfterRenderObserverRef.current = scene.onAfterRenderObservable.add(() => {
            impostorMapRef.current.forEach((item, key) => {
                key.position.copyFrom(item.impostor.position);
                if (item.label) {
                    item.label.color = Color4.FromColor3(impostorMaterialRef.current?.diffuseColor || impostorColor, 1.0);
                    item.label.render(scene.getViewMatrix(), scene.getProjectionMatrix());
                }
            });
        });
    }, [props.attractors]);

    const addLabelAsync = async (debugProperties: AttractorDebugProperties, index: number) => {
        const fontAsset = await getFontAsset();
        const textRenderer = await TextRenderer.CreateTextRendererAsync(fontAsset, scene.getEngine());

        textRenderer.addParagraph("#" + index, {}, Matrix.Scaling(0.5, 0.5, 0.5).multiply(Matrix.Translation(0, 1, 0)));
        textRenderer.isBillboard = true;
        textRenderer.color = Color4.FromColor3(impostorMaterialRef.current?.diffuseColor || impostorColor, 1.0);
        textRenderer.render(scene.getViewMatrix(), scene.getProjectionMatrix());
        textRenderer.parent = debugProperties.impostor;

        debugProperties.label = textRenderer;
    };

    const onControlImpostor = (shouldControl: boolean, impostor: AbstractMesh) => {
        // If true, attach the gizmo to the current impostor, otherwise detach
        const impostorToControl = shouldControl ? impostor : null;
        gizmoManagerRef.current.attachToMesh(impostorToControl);
        setControlledImpostor(impostorToControl);
    };

    const onShowImpostor = (shouldShow: boolean, impostor: AbstractMesh) => {
        if (shouldShow) {
            impostor.setEnabled(true);
            impostor.visibility = 1;
        } else {
            impostor.setEnabled(false);
            impostor.visibility = 0;
        }
    };

    return (
        <>
            {items.length > 0 && (
                <>
                    <Color3PropertyLine label="Attractor debug color" value={impostorColor} onChange={setImpostorColor} />
                    <SyncedSliderPropertyLine label="Attractor debug size" value={impostorScale} onChange={setImpostorScale} min={0} max={10} step={0.1} />
                </>
            )}
            <List
                addButtonLabel={`Add new attractor`}
                items={items}
                onDelete={(item, _index) => system.removeAttractor(item.data)}
                onAdd={(item) => system.addAttractor(item?.data ?? new Attractor())}
                renderItem={(item) => {
                    const attractor = item.data;
                    const impostor = impostorMapRef.current.get(attractor)?.impostor;
                    if (!impostor) {
                        throw new Error("Should never be rendering an attractorComponent without associated impostor");
                    }
                    return (
                        <AttractorComponent
                            attractor={attractor}
                            controlled={impostor === controlledImpostor}
                            shown={impostor.isEnabled()}
                            onShow={(val) => onShowImpostor(val, impostor)}
                            onControl={(val) => onControlImpostor(val, impostor)}
                        />
                    );
                }}
            />
        </>
    );
};
