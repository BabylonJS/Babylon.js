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
// import { LineContainer } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { List } from "shared-ui-components/fluent/primitives/list";
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

    return (
        <div className={classes.container}>
            <SyncedSliderInput value={attractor.strength} onChange={(value) => (attractor.strength = value)} min={-10} max={10} step={0.1} />
            <ToggleButton title="Show / hide particle attractor." enabledIcon={<EyeFilled />} disabledIcon={<EyeOffFilled />} value={props.shown} onChange={props.onShow} />
            <ToggleButton title="Control particle attractor" enabledIcon={<ArrowMoveFilled />} value={props.controlled} onChange={props.onControl} />
        </div>
    );
};
const useAttractorStyles = makeStyles({
    container: {
        // top-level div used for lineContainer
        width: "100%",
        display: "flex", // Makes this a flex container
        flexDirection: "row", // Arranges children horizontally, main-axis=horizontal
        padding: `${tokens.spacingVerticalXS} 0px`,
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    },
});
// export const AttractorComponent: FunctionComponent<AttractorProps> = (props) => {
//     const { attractor } = props;
//     // // Initialize both the view and control toggles based on whether the attractor is in controlled state
//     // const [controlled, setControlled] = useState(props.controlled);
//     // const [inView, setInView] = useState(props.controlled);

//     // useEffect(() => {
//     //     setControlled(props.controlled);
//     // }, [props.controlled]);

//     // const onView = (val: boolean) => {
//     //     setInView(val);
//     //     props.onView(val);
//     // };
//     // const onControl = (val: boolean) => {
//     //     setControlled(val);
//     //     props.onControl(val);
//     // };
//     return (
//         <LineContainer>
//             <SyncedSliderInput value={attractor.strength} onChange={(value) => (attractor.strength = value)} min={-10} max={10} step={0.1} />
//             <ToggleButton title="Show / hide particle attractor." enabledIcon={<EyeFilled />} disabledIcon={<EyeOffFilled />} value={inView} onChange={onView} />
//             <ToggleButton title="Control particle attractor" enabledIcon={<ArrowMoveFilled />} value={controlled} onChange={onControl} />
//         </LineContainer>
//     );
// };

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
    const [impostorScale, setImpostorScale] = useState(1);
    const [impostorColor, setImpostorColor] = useState<Color3>(Color3.White());
    const gizmoManagerRef = useRef<GizmoManager>(new GizmoManager(props.scene));
    // TODO fix label
    const getFontAsset = useFontAsset("https://assets.babylonjs.com/fonts/roboto-regular.json", "https://assets.babylonjs.com/fonts/roboto-regular.png");
    const impostorMaterialRef = useRef<StandardMaterial>(new StandardMaterial("Attractor impostor material", scene));
    const [items, setItems] = useState(AttractorsToListItems(props.attractors));

    const sceneOnAfterRenderObserver = useRef<Observer<Scene>>();
    const impostorMapRef = useRef<Map<Attractor, AttractorDebugProperties>>(new Map());

    // Initial setup and cleanup logic
    useEffect(() => {
        // Setup
        gizmoManagerRef.current.positionGizmoEnabled = true;
        gizmoManagerRef.current.attachableMeshes = [];

        return () => {
            // Cleanup
            gizmoManagerRef.current.dispose();
            impostorMaterialRef.current.dispose();
            impostorMapRef.current.forEach((item) => {
                item.impostor.dispose(true, true);
                // item.label?.dispose();
            });
            impostorMapRef.current.clear();
            if (sceneOnAfterRenderObserver.current) {
                scene.onAfterRenderObservable.remove(sceneOnAfterRenderObserver.current);
            }
        };
    }, []);

    // If impostor color or scale changes, update all impostors
    useEffect(() => {
        impostorMaterialRef.current.diffuseColor = impostorColor;
        impostorMapRef.current.forEach((element) => {
            element.impostor.scaling.setAll(impostorScale);
        });
    }, [impostorScale, impostorColor]);

    // If attractors change, dispose impostors before recreating items. Reset the onAfterRenderObservable
    useEffect(() => {
        impostorMapRef.current.forEach((item) => {
            item.impostor.dispose(true, true);
            // item.label?.dispose();
        });
        impostorMapRef.current.clear();
        props.attractors.forEach((attractor, index) => {
            const impostor = CreateSphere("Attractor impostor #" + index, { diameter: 1 }, scene);
            impostor.reservedDataStore = { hidden: true };
            impostor.scaling.setAll(impostorScale);
            impostor.position.copyFrom(attractor.position);
            impostorMaterialRef.current.diffuseColor = impostorColor;
            impostor.material = impostorMaterialRef.current;
            impostorMapRef.current.set(attractor, { impostor });
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            addLabelAsync(impostor, index);
        });

        setItems(AttractorsToListItems(props.attractors));

        if (sceneOnAfterRenderObserver.current) {
            scene.onAfterRenderObservable.remove(sceneOnAfterRenderObserver.current);
        }

        sceneOnAfterRenderObserver.current = scene.onAfterRenderObservable.add(() => {
            impostorMapRef.current.forEach((item, key) => {
                key.position.copyFrom(item.impostor.position);
            });
        });
    }, [props.attractors]);

    const isControlled = (impostor?: AbstractMesh) => {
        return gizmoManagerRef.current?.attachedMesh ? gizmoManagerRef.current?.attachedMesh === impostor : false;
    };

    const addLabelAsync = async (impostor: AbstractMesh, index: number) => {
        const fontAsset = await getFontAsset();
        const textRenderer = await TextRenderer.CreateTextRendererAsync(fontAsset, scene.getEngine());

        textRenderer.addParagraph("#" + index, {}, Matrix.Scaling(0.5, 0.5, 0.5).multiply(Matrix.Translation(0, 1, 0)));
        textRenderer.isBillboard = true;
        textRenderer.color = Color4.FromColor3(impostorColor, 1.0);
        textRenderer.parent = impostor;
        textRenderer.render(scene.getViewMatrix(), scene.getProjectionMatrix());
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
                    return (
                        <AttractorComponent
                            attractor={attractor}
                            controlled={isControlled(impostor)}
                            shown={isControlled(impostor)}
                            onShow={(val) => {
                                if (!impostor) {
                                    return;
                                }
                                // If attractor already has an imposter, cleanup. Otherwise, add imposter to make it visible
                                if (val) {
                                    impostor.setEnabled(true);
                                    impostor.visibility = 1;
                                } else {
                                    impostor.setEnabled(false);
                                    impostor.visibility = 0;
                                }
                            }}
                            onControl={(val) => (val ? gizmoManagerRef.current.attachToMesh(impostor!) : gizmoManagerRef.current.attachToMesh(null))}
                        />
                    );
                }}
            />
        </>
    );
};
