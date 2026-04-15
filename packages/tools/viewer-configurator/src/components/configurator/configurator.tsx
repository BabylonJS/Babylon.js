/* eslint-disable @typescript-eslint/no-floating-promises */
import { type IDisposable, type Nullable, type Observable } from "core/index";
import { type HotSpot, type ShadowQuality, type ToneMapping, type Viewer, type ViewerDetails, type ViewerElement, type ViewerOptions } from "viewer/index";
import { type DragEndEvent, closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { makeStyles, tokens, Textarea } from "@fluentui/react-components";
import {
    TargetRegular,
    CameraRegular,
    CheckmarkRegular,
    CopyRegular,
    ReOrderDotsVerticalRegular,
    ArrowResetRegular,
    SaveRegular,
    AddSquareRegular,
    DeleteRegular,
    ArrowUploadRegular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from "react";

import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { AccordionSection, Accordion } from "shared-ui-components/fluent/primitives/accordion";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { LineContainer, PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { ColorPickerPopup } from "shared-ui-components/fluent/primitives/colorPicker";
import { type DropdownOption, Dropdown } from "shared-ui-components/fluent/primitives/dropdown";
import { Switch } from "shared-ui-components/fluent/primitives/switch";
import { SyncedSliderInput } from "shared-ui-components/fluent/primitives/syncedSlider";
import { TextInput } from "shared-ui-components/fluent/primitives/textInput";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";

import { DefaultViewerOptions, SSAOOptions } from "viewer/viewer";
import { HTML3DAnnotationElement } from "viewer/viewerAnnotationElement";

import { PointerEventTypes } from "core/Events/pointerEvents";
import { Color4 } from "core/Maths/math.color";
import { Epsilon } from "core/Maths/math.constants";
import { Vector3 } from "core/Maths/math.vector";
import { WithinEpsilon } from "core/Maths/math.scalar.functions";
import { CreateHotSpotQueryForPickingInfo } from "core/Meshes/abstractMesh.hotSpot";
import { Logger } from "core/Misc/logger";

import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { PickModel } from "../../modelLoader";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "auto",
    },
    snippetSection: {
        padding: tokens.spacingVerticalS + " " + tokens.spacingHorizontalM,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
        // Pin the snippet section at the top when there is enough vertical space.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "@media (min-height: 600px)": {
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: tokens.colorNeutralBackground1,
        },
    },
    snippetActions: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
    accordionContainer: {},
    propertyContent: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        width: "100%",
    },
    fillControl: {
        flex: 1,
        minWidth: 0,
    },
    fullWidth: {
        width: "100%",
    },
    buttonGroup: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
    },
    headerRow: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
    snippetTextarea: {
        minHeight: "160px",
    },
    snippetTextareaInner: {
        fontFamily: "monospace",
        whiteSpace: "pre",
        overflowX: "auto",
    },
    hotspotRow: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        width: "100%",
        margin: `${tokens.spacingVerticalXS} 0`,
    },
    hotspotNameInput: {
        flex: 1,
    },
});

const DefaultModelUrl = "https://assets.babylonjs.com/meshes/Demos/optimized/acrobaticPlane_variants.glb";

type HotSpotInfo = { name: string; id: string; data: HotSpot };

let CurrentHotSpotId = 0;
function CreateHotSpotId() {
    return (CurrentHotSpotId++).toString();
}

type OutputFormat = "html" | "json";

const OutputOptions = [
    { label: "HTML", value: "html" },
    { label: "JSON", value: "json" },
] as const satisfies readonly DropdownOption<OutputFormat>[];

const ShadowQualityOptions = [
    { label: "None", value: "none" },
    { label: "Normal", value: "normal" },
    { label: "High", value: "high" },
] as const satisfies readonly DropdownOption<ShadowQuality>[];

const SSAOOptions = [
    { label: "Disabled", value: "disabled" },
    { label: "Enabled", value: "enabled" },
    { label: "Auto", value: "auto" },
] as const satisfies readonly DropdownOption<SSAOOptions>[];

const ToneMappingOptions = [
    { label: "Standard", value: "standard" },
    { label: "None", value: "none" },
    { label: "Aces", value: "aces" },
    { label: "Neutral", value: "neutral" },
] as const satisfies readonly DropdownOption<ToneMapping>[];

const HotSpotTypeOptions = [{ label: "Surface", value: "surface" }] as const satisfies readonly DropdownOption<string>[];

const HotSpotsDndModifers = [restrictToVerticalAxis, restrictToParentElement];

// This helper function is used in functions that are naturally void returning, but need to call an async Promise returning function.
// If there is any error (other than AbortError) in the async function, it will be logged.
function ObservePromise(promise: Promise<unknown>): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
        try {
            await promise;
        } catch (error) {
            Logger.Error([error]);
        }
    })();
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function useConfiguration<T>(
    defaultState: T,
    initialConfiguredState: T,
    get: () => T,
    set: ((data: T) => void) | undefined,
    equals: (baseState: T, configuredState: T) => boolean = (baseState, configuredState) => baseState === configuredState,
    observables: Observable<any>[] = [],
    dependencies?: unknown[]
) {
    const memoDefaultState = useMemo(() => defaultState, dependencies ?? []);
    const memoInitialConfiguredState = useMemo(() => initialConfiguredState, dependencies ?? []);
    const memoSet = useCallback(set ?? (() => {}), dependencies ?? []);
    const memoGet = useCallback(get, dependencies ?? []);
    const memoEquals = useCallback(equals, []);
    const liveState = useObservableState(memoGet, ...observables);
    const [configuredState, setConfiguredState] = useState(initialConfiguredState);
    const [isConfigured, setIsConfigured] = useState(!memoEquals(memoDefaultState, memoInitialConfiguredState));

    useEffect(() => {
        memoSet?.(configuredState);
    }, [configuredState, memoSet]);

    // Indicates whether the live state of the viewer can be "reverted" to the configured state.
    const canRevert = useMemo(() => {
        return isConfigured && !memoEquals(liveState, configuredState);
    }, [isConfigured, liveState, configuredState, memoEquals]);

    // Indicates whether the configured state can be "reset" to the default state.
    const canReset = useMemo(() => {
        return isConfigured && !memoEquals(memoDefaultState, configuredState);
    }, [isConfigured, memoDefaultState, configuredState, memoEquals]);

    // Reverts the live state of the viewer to the configured state.
    const revert = useCallback(() => {
        memoSet?.(configuredState);
    }, [configuredState, memoSet]);

    // Resets the configured state to the default state.
    const reset = useCallback(() => {
        setConfiguredState(memoDefaultState);
        setIsConfigured(false);
    }, [memoDefaultState]);

    // Updates the configured state to the specified state.
    const update = useCallback(
        (data: T) => {
            setConfiguredState((previous) => {
                if (memoEquals(previous, data)) {
                    return previous;
                }
                setIsConfigured(true);
                return data;
            });
        },
        [memoEquals]
    );

    // Updates the configured tate to the live state of the viewer.
    const snapshot = useCallback(() => {
        setConfiguredState(liveState);
        setIsConfigured(true);
    }, [liveState]);

    return { canRevert, canReset, revert, reset, update, snapshot, configuredState } as const;
}

const HotSpotEntry: FunctionComponent<{
    id: string;
    hotspots: HotSpotInfo[];
    setHotspots: React.Dispatch<React.SetStateAction<HotSpotInfo[]>>;
    viewerElement: ViewerElement;
}> = ({ id, hotspots, setHotspots, viewerElement }) => {
    const classes = useStyles();
    const index = useMemo(() => {
        return hotspots.findIndex((hotspot) => hotspot.id === id);
    }, [id, hotspots]);

    const hotspot = useMemo<HotSpotInfo | undefined>(() => {
        return hotspots[index];
    }, [index, hotspots]);

    const { attributes: dndAttributes, listeners: dndListeners, setNodeRef: setDndRefNode, transform: dndTransform, transition: dndTransition } = useSortable({ id });

    const dndStyle = useMemo(() => {
        return {
            transform: CSS.Transform.toString(dndTransform),
            transition: dndTransition,
        } as const;
    }, [dndTransform, dndTransition]);

    const rootDivRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (rootDivRef.current) {
            setDndRefNode(rootDivRef.current);
            rootDivRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }

        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const [isPicking, setIsPicking] = useState(false);

    const pickingOperation = useRef<IDisposable>();

    useEffect(() => {
        return () => pickingOperation.current?.dispose();
    }, []);

    const onHotspotDeleteClick = useCallback(() => {
        if (index >= 0) {
            setHotspots((hotspots) => {
                const newHotspots = [...hotspots];
                newHotspots.splice(index, 1);
                return newHotspots;
            });
        }
    }, [index, setHotspots]);

    const onHotspotPickClick = useCallback(
        (checked: boolean) => {
            if (!checked) {
                pickingOperation.current?.dispose();
            } else if (viewerElement.viewerDetails?.model && hotspot) {
                const originalCursor = getComputedStyle(viewerElement).cursor;
                viewerElement.style.cursor = "crosshair";
                const { scene, model, viewer } = viewerElement.viewerDetails;

                const cleanupActions: (() => void)[] = [
                    () => setIsPicking(false),
                    () => (viewerElement.style.cursor = originalCursor),
                    () => (pickingOperation.current = undefined),
                ];

                const cleanup = () => {
                    cleanupActions.forEach((action) => action());
                };
                pickingOperation.current = {
                    dispose: () => {
                        cleanup();
                    },
                };

                const pointerObserver = scene.onPointerObservable.add(async (pointerInfo) => {
                    if (pointerInfo.type === PointerEventTypes.POINTERTAP) {
                        if (viewerElement.viewerDetails) {
                            const pickInfo = await viewerElement.viewerDetails.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY);
                            if (pickInfo?.pickedMesh) {
                                if (hotspot.data.type === "surface") {
                                    hotspot.data.meshIndex = model.assetContainer.meshes.indexOf(pickInfo.pickedMesh);
                                    const hotspotQuery = CreateHotSpotQueryForPickingInfo(pickInfo);
                                    if (hotspotQuery) {
                                        hotspot.data.pointIndex = hotspotQuery.pointIndex;
                                        hotspot.data.barycentric = hotspotQuery.barycentric;
                                    }
                                }

                                setHotspots((hotspots) => {
                                    return [...hotspots];
                                });

                                if (pickInfo.hit && pickInfo.pickedPoint) {
                                    const camera = viewerElement.viewerDetails.camera;
                                    const distance = pickInfo.pickedPoint.subtract(camera.position).dot(camera.getForwardRay().direction);
                                    // Immediately reset the target and the radius based on the distance to the picked point.
                                    // This eliminates unnecessary camera movement on the local z-axis when interpolating.
                                    camera.target = camera.position.add(camera.getForwardRay().direction.scale(distance));
                                    camera.radius = distance;
                                    viewerElement.focusHotSpot(hotspot.name);
                                }

                                cleanup();
                            }
                        }
                    }
                });
                cleanupActions.push(() => scene.onPointerObservable.remove(pointerObserver));

                const handleKeyDown = (e: KeyboardEvent) => {
                    if (e.key === "Escape") {
                        cleanup();
                    }
                };
                document.addEventListener("keydown", handleKeyDown);
                cleanupActions.push(() => document.removeEventListener("keydown", handleKeyDown));

                const modelChangedObserver = viewer.onModelChanged.addOnce(() => {
                    cleanup();
                });
                cleanupActions.push(() => viewer.onModelChanged.remove(modelChangedObserver));

                setIsPicking(true);
            }
        },
        [hotspot, setHotspots]
    );

    const onCameraSnapshotClick = useCallback(() => {
        if (hotspot) {
            const camera = viewerElement.viewerDetails?.camera;
            if (camera) {
                hotspot.data.cameraOrbit = [camera.alpha, camera.beta, camera.radius];
                setHotspots((hotspots) => {
                    return [...hotspots];
                });
            }
        }
    }, [hotspot, setHotspots]);

    const onHotSpotNameChange = useCallback(
        (value: string) => {
            if (hotspot) {
                setHotspots((hotspots) => {
                    hotspots = [...hotspots];
                    hotspots[index] = { ...hotspot, name: value };
                    return hotspots;
                });
            }
        },
        [index, hotspot]
    );

    return (
        <div ref={rootDivRef} className={classes.hotspotRow} style={dndStyle} {...dndAttributes}>
            <ReOrderDotsVerticalRegular title="Drag to reorder" {...dndListeners} />
            <div className={classes.fillControl}>
                <TextInput className={classes.fullWidth} key={id} value={hotspot?.name ?? ""} onChange={onHotSpotNameChange} />
            </div>
            <div className={classes.buttonGroup}>
                <ToggleButton title="Pick from model" appearance="transparent" checkedIcon={TargetRegular} value={isPicking} onChange={onHotspotPickClick} />
                <Button title="Snapshot current camera state" appearance="transparent" icon={CameraRegular} onClick={onCameraSnapshotClick} />
                <Button title="Delete Hot Spot" appearance="transparent" icon={DeleteRegular} onClick={onHotspotDeleteClick} />
            </div>
        </div>
    );
};

export const Configurator: FunctionComponent<{ viewerOptions: ViewerOptions; viewerElement: ViewerElement; viewerDetails: ViewerDetails; viewer: Viewer }> = (props) => {
    const { viewerOptions, viewerElement, viewerDetails, viewer } = props;
    const model = useObservableState(() => viewerDetails.model, viewer.onModelChanged, viewer.onModelError);

    const initialModelUrl = useMemo(() => viewerOptions.source ?? DefaultModelUrl, [viewerOptions.source]);
    const [modelUrl, setModelUrl] = useState(initialModelUrl);

    // Whenever the model changes, update the model URL.
    useEffect(() => {
        viewerElement.source = modelUrl;

        const onModelChange = (event: CustomEvent<Nullable<string | File | unknown>>) => {
            const source = event.detail;
            let sourceUrl = "";
            if (source) {
                if (typeof source === "string") {
                    sourceUrl = source;
                } else if (source instanceof File) {
                    sourceUrl = source.name;
                }
            }
            setModelUrl(sourceUrl);
        };

        const onModelError = () => {
            setModelUrl("");
        };

        viewerElement.addEventListener("modelchange", onModelChange);
        viewerElement.addEventListener("modelerror", onModelError);

        return () => {
            viewerElement.removeEventListener("modelchange", onModelChange);
            viewerElement.removeEventListener("modelerror", onModelError);
        };
    }, [viewerElement]);

    const [outputFormat, setOutputFormat] = useState<OutputFormat>("html");

    const lightingUrlConfig = useConfiguration(
        "",
        viewerOptions.environmentLighting ?? "",
        () => viewerElement.environment.lighting ?? "",
        undefined,
        undefined,
        [viewer.onEnvironmentChanged],
        [viewerElement]
    );
    const skyboxUrlConfig = useConfiguration(
        "",
        viewerOptions.environmentSkybox === viewerOptions.environmentLighting ? "" : (viewerOptions.environmentSkybox ?? ""),
        () => viewerElement.environment.skybox ?? "",
        undefined,
        undefined,
        [viewer.onEnvironmentChanged],
        [viewerElement]
    );

    const [syncEnvironment, setSyncEnvironment] = useState(!!viewerOptions.environmentLighting && viewerOptions.environmentLighting === viewerOptions.environmentSkybox);
    const [needsEnvironmentUpdate, setNeedsEnvironmentUpdate] = useState(false);

    const onEnvironmentUrlSubmit = useCallback(() => {
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate]);

    const hasSkybox = useMemo(() => {
        if (syncEnvironment) {
            return !!lightingUrlConfig.configuredState;
        }
        return !!skyboxUrlConfig.configuredState;
    }, [syncEnvironment, lightingUrlConfig.configuredState, skyboxUrlConfig.configuredState]);

    const skyboxBlurConfig = useConfiguration(
        DefaultViewerOptions.environmentConfig.blur,
        viewerOptions.environmentConfig?.blur ?? DefaultViewerOptions.environmentConfig.blur,
        () => viewer.environmentConfig.blur,
        (blur) => (viewer.environmentConfig = { blur }),
        undefined,
        [viewer.onEnvironmentConfigurationChanged],
        [viewer]
    );

    const environmentIntensityConfig = useConfiguration(
        DefaultViewerOptions.environmentConfig.intensity,
        viewerOptions.environmentConfig?.intensity ?? DefaultViewerOptions.environmentConfig.intensity,
        () => viewer.environmentConfig.intensity,
        (intensity) => (viewer.environmentConfig = { intensity }),
        undefined,
        [viewer.onEnvironmentConfigurationChanged],
        [viewer]
    );

    const environmentRotationConfig = useConfiguration(
        DefaultViewerOptions.environmentConfig.rotation,
        viewerOptions.environmentConfig?.rotation ?? DefaultViewerOptions.environmentConfig.rotation,
        () => viewer.environmentConfig.rotation,
        (rotation) => (viewer.environmentConfig = { rotation }),
        undefined,
        [viewer.onEnvironmentConfigurationChanged],
        [viewer]
    );

    const clearColorConfig = useConfiguration(
        viewerDetails.scene.clearColor,
        new Color4(...(viewerOptions.clearColor ? viewerOptions.clearColor : DefaultViewerOptions.clearColor)),
        () => viewerDetails.scene.clearColor,
        (color) => (viewerDetails.scene.clearColor = color),
        (baseState, configuredState) => baseState.equals(configuredState),
        [viewerDetails.scene.onClearColorChangedObservable],
        [viewerDetails.scene]
    );

    const shadowQualityConfig = useConfiguration(
        DefaultViewerOptions.shadowConfig.quality,
        viewerOptions.shadowConfig?.quality ?? DefaultViewerOptions.shadowConfig.quality,
        () => viewer.shadowConfig.quality,
        (quality) => ObservePromise(viewer.updateShadows({ quality })),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );

    const cameraConfig = useConfiguration(
        {
            alpha: NaN,
            beta: NaN,
            radius: NaN,
            target: new Vector3(NaN, NaN, NaN),
        },
        {
            alpha: viewerOptions.cameraOrbit?.[0] ?? NaN,
            beta: viewerOptions.cameraOrbit?.[1] ?? NaN,
            radius: viewerOptions.cameraOrbit?.[2] ?? NaN,
            target: new Vector3(viewerOptions.cameraTarget?.[0] ?? NaN, viewerOptions.cameraTarget?.[1] ?? NaN, viewerOptions.cameraTarget?.[2] ?? NaN),
        },
        () => {
            return {
                alpha: viewerDetails.camera.alpha,
                beta: viewerDetails.camera.beta,
                radius: viewerDetails.camera.radius,
                target: viewerDetails.camera.target.clone(),
            };
        },
        (cameraState) => {
            if (!cameraState || (isNaN(cameraState.alpha) && isNaN(cameraState.beta) && isNaN(cameraState.radius))) {
                viewerElement.removeAttribute("camera-orbit");
                delete viewerOptions.cameraOrbit;
            } else {
                viewerElement.setAttribute("camera-orbit", `${cameraState.alpha} ${cameraState.beta} ${cameraState.radius}`);
            }

            if (!cameraState || (isNaN(cameraState.target.x) && isNaN(cameraState.target.y) && isNaN(cameraState.target.z))) {
                viewerElement.removeAttribute("camera-target");
                delete viewerOptions.cameraTarget;
            } else {
                viewerElement.setAttribute("camera-target", `${cameraState.target.x} ${cameraState.target.y} ${cameraState.target.z}`);
            }
        },
        (baseState, configuredState) => {
            const valueEquals = (baseState: number, configuredState: number) => {
                return isNaN(configuredState) || baseState === configuredState || WithinEpsilon(baseState, configuredState, Epsilon);
            };

            return (
                baseState == configuredState ||
                (!!baseState &&
                    !!configuredState &&
                    valueEquals(baseState.alpha, configuredState.alpha) &&
                    valueEquals(baseState.beta, configuredState.beta) &&
                    valueEquals(baseState.radius, configuredState.radius) &&
                    valueEquals(baseState.target.x, configuredState.target.x) &&
                    valueEquals(baseState.target.y, configuredState.target.y) &&
                    valueEquals(baseState.target.z, configuredState.target.z))
            );
        },
        [viewerDetails.camera.onViewMatrixChangedObservable],
        [viewer, viewerDetails.camera, model]
    );

    const toneMappingConfig = useConfiguration(
        DefaultViewerOptions.postProcessing.toneMapping,
        viewerOptions.postProcessing?.toneMapping ?? DefaultViewerOptions.postProcessing.toneMapping,
        () => viewer.postProcessing.toneMapping,
        (toneMapping) => (viewer.postProcessing = { toneMapping }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );

    const contrastConfig = useConfiguration(
        DefaultViewerOptions.postProcessing.contrast,
        viewerOptions.postProcessing?.contrast ?? DefaultViewerOptions.postProcessing.contrast,
        () => viewer.postProcessing.contrast,
        (contrast) => (viewer.postProcessing = { contrast }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );

    const exposureConfig = useConfiguration(
        DefaultViewerOptions.postProcessing.exposure,
        viewerOptions.postProcessing?.exposure ?? DefaultViewerOptions.postProcessing.exposure,
        () => viewer.postProcessing.exposure,
        (exposure) => (viewer.postProcessing = { exposure }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );

    const ssaoConfig = useConfiguration(
        DefaultViewerOptions.postProcessing.ssao,
        viewerOptions.postProcessing?.ssao ?? DefaultViewerOptions.postProcessing.ssao,
        () => viewer.postProcessing.ssao,
        (ssao) => (viewer.postProcessing = { ssao }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );

    const autoOrbitConfig = useConfiguration(
        DefaultViewerOptions.cameraAutoOrbit.enabled,
        viewerOptions.cameraAutoOrbit?.enabled ?? DefaultViewerOptions.cameraAutoOrbit.enabled,
        () => viewer.cameraAutoOrbit.enabled,
        (enabled) => (viewer.cameraAutoOrbit = { enabled }),
        undefined,
        [viewer.onCameraAutoOrbitChanged],
        [viewer]
    );

    const autoOrbitSpeedConfig = useConfiguration(
        DefaultViewerOptions.cameraAutoOrbit.speed,
        viewerOptions.cameraAutoOrbit?.speed ?? DefaultViewerOptions.cameraAutoOrbit.speed,
        () => viewer.cameraAutoOrbit.speed,
        (speed) => (viewer.cameraAutoOrbit = { speed }),
        undefined,
        [viewer.onCameraAutoOrbitChanged],
        [viewer]
    );

    const autoOrbitDelayConfig = useConfiguration(
        DefaultViewerOptions.cameraAutoOrbit.delay,
        viewerOptions.cameraAutoOrbit?.delay ?? DefaultViewerOptions.cameraAutoOrbit.delay,
        () => viewer.cameraAutoOrbit.delay,
        (delay) => (viewer.cameraAutoOrbit = { delay }),
        undefined,
        [viewer.onCameraAutoOrbitChanged],
        [viewer]
    );

    const animationStateConfig = useConfiguration(
        {
            animationSpeed: DefaultViewerOptions.animationSpeed,
            selectedAnimation: 0,
        },
        {
            animationSpeed: viewerOptions.animationSpeed ?? DefaultViewerOptions.animationSpeed,
            selectedAnimation: viewerOptions.selectedAnimation ?? 0,
        },
        () => {
            return {
                animationSpeed: viewer.animationSpeed,
                selectedAnimation: viewer.selectedAnimation,
            };
        },
        (animationState) => {
            if (animationState) {
                viewer.animationSpeed = animationState.animationSpeed;
                viewer.selectedAnimation = animationState.selectedAnimation;
            } else {
                viewer.animationSpeed = 1;
                viewer.selectedAnimation = 0;
            }
        },
        (baseState, configuredState) => {
            return (
                baseState == configuredState ||
                (!!baseState &&
                    !!configuredState &&
                    WithinEpsilon(baseState.animationSpeed, configuredState.animationSpeed, Epsilon) &&
                    baseState.selectedAnimation === configuredState.selectedAnimation)
            );
        },
        [viewer.onAnimationSpeedChanged, viewer.onSelectedAnimationChanged],
        [viewer]
    );

    const animationAutoPlayConfig = useConfiguration(
        DefaultViewerOptions.animationAutoPlay,
        viewerOptions.animationAutoPlay ?? DefaultViewerOptions.animationAutoPlay,
        () => viewerElement.animationAutoPlay,
        (autoPlay) => {
            if (autoPlay) {
                viewerElement.setAttribute("animation-auto-play", "");
            } else {
                viewerElement.removeAttribute("animation-auto-play");
            }
            autoPlay ? viewer.playAnimation() : viewer.pauseAnimation();
        },
        undefined,
        [viewer.onIsAnimationPlayingChanged],
        [viewer, viewerElement]
    );

    const selectedMaterialVariantConfig = useConfiguration(
        "",
        viewerOptions.selectedMaterialVariant ?? "",
        () => viewer.selectedMaterialVariant,
        (materialVariant) => {
            if (materialVariant) {
                viewer.selectedMaterialVariant = materialVariant;
            } else {
                viewer.selectedMaterialVariant = viewer.materialVariants[0];
            }
        },
        undefined,
        [viewer.onSelectedMaterialVariantChanged],
        [viewer]
    );

    const [hotspots, setHotspots] = useState<HotSpotInfo[]>(Object.entries(viewerOptions.hotSpots ?? {}).map(([name, data]) => ({ name, id: CreateHotSpotId(), data })));

    useEffect(() => {
        if (modelUrl !== initialModelUrl) {
            setHotspots([]);
        }
    }, [modelUrl, initialModelUrl]);

    useEffect(() => {
        viewerElement.hotSpots = hotspots.reduce<Record<string, HotSpot>>((hotspots, { name, data }) => {
            hotspots[name] = data;
            return hotspots;
        }, {});
    }, [viewerElement, hotspots]);

    // This is part of the drag and drop support for re-ordering hot spots.
    const dndSensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const hasAnimations = useMemo(() => viewer && viewer.animations.length > 0, [viewer.animations]);
    const hasMaterialVariants = useMemo(() => viewer && viewer.materialVariants.length > 0, [viewer.materialVariants]);

    const hotSpotsSnippet = useMemo(() => {
        if (hotspots.length > 0) {
            let hotSpotsJSON = `{\n`;
            hotSpotsJSON += hotspots
                .map((hotspot) => {
                    let hotspotJson = `    "${hotspot.name}": {\n`;
                    const hotspotProperties: string[] = [];
                    if (hotspot.data.type === "surface") {
                        hotspotProperties.push(
                            `      "type": "surface"`,
                            `      "meshIndex": ${hotspot.data.meshIndex}`,
                            `      "pointIndex": [${hotspot.data.pointIndex.join(", ")}]`,
                            `      "barycentric": [${hotspot.data.barycentric.map((value) => value.toFixed(3)).join(", ")}]`
                        );
                    } else {
                        hotspotProperties.push(
                            `      "type": "world"`,
                            `      "position": [${hotspot.data.position.map((value) => value.toFixed(3)).join(", ")}]`,
                            `      "normal": [${hotspot.data.normal.map((value) => value.toFixed(3)).join(", ")}]`
                        );
                    }
                    if (hotspot.data.cameraOrbit) {
                        const [alpha, beta, radius] = hotspot.data.cameraOrbit;
                        hotspotProperties.push(`      "cameraOrbit": [${alpha.toFixed(3)}, ${beta.toFixed(3)}, ${radius.toFixed(3)}]`);
                    }
                    hotspotJson += hotspotProperties.join(",\n");
                    hotspotJson += `\n    }`;
                    return hotspotJson;
                })
                .join(",\n");
            hotSpotsJSON += `\n  }`;

            return hotSpotsJSON;
        } else {
            return null;
        }
    }, [hotspots]);

    // This is all the configured attributes, as an array of strings.
    const attributes = useMemo<readonly string[]>(() => {
        const attributes: string[] = [`source="${modelUrl || "[model url]"}"`];

        if (syncEnvironment) {
            if (lightingUrlConfig.configuredState) {
                attributes.push(`environment="${lightingUrlConfig.configuredState}"`);
            }
        } else {
            if (lightingUrlConfig.configuredState) {
                attributes.push(`environment-lighting="${lightingUrlConfig.configuredState}"`);
            }

            if (skyboxUrlConfig.configuredState) {
                attributes.push(`environment-skybox="${skyboxUrlConfig.configuredState}"`);
            }
        }

        if (hasSkybox) {
            if (skyboxBlurConfig.canReset) {
                attributes.push(`skybox-blur="${skyboxBlurConfig.configuredState}"`);
            }
        } else {
            if (clearColorConfig.canReset) {
                attributes.push(`clear-color="${clearColorConfig.configuredState.toHexString()}"`);
            }
        }
        if (environmentIntensityConfig.canReset) {
            attributes.push(`skybox-intensity="${environmentIntensityConfig.configuredState}"`);
        }
        if (environmentRotationConfig.canReset) {
            attributes.push(`skybox-rotation="${environmentRotationConfig.configuredState}"`);
        }

        if (shadowQualityConfig.canReset) {
            attributes.push(`shadow-quality="${shadowQualityConfig.configuredState}"`);
        }

        if (toneMappingConfig.canReset) {
            attributes.push(`tone-mapping="${toneMappingConfig.configuredState}"`);
        }

        if (contrastConfig.canReset) {
            attributes.push(`contrast="${contrastConfig.configuredState.toFixed(1)}"`);
        }

        if (exposureConfig.canReset) {
            attributes.push(`exposure="${exposureConfig.configuredState.toFixed(1)}"`);
        }

        if (ssaoConfig.canReset) {
            attributes.push(`ssao="${ssaoConfig.configuredState}"`);
        }

        if (cameraConfig.canReset) {
            const { alpha, beta, radius, target } = cameraConfig.configuredState;
            attributes.push(`camera-orbit="${alpha.toFixed(3)} ${beta.toFixed(3)} ${radius.toFixed(3)}"`);
            attributes.push(`camera-target="${target.x.toFixed(3)} ${target.y.toFixed(3)} ${target.z.toFixed(3)}"`);
        }

        if (autoOrbitConfig.canReset) {
            attributes.push(`camera-auto-orbit`);
        }

        if (autoOrbitSpeedConfig.canReset) {
            attributes.push(`camera-auto-orbit-speed="${autoOrbitSpeedConfig.configuredState.toFixed(3)}"`);
        }

        if (autoOrbitDelayConfig.canReset) {
            attributes.push(`camera-auto-orbit-delay="${autoOrbitDelayConfig.configuredState.toFixed(0)}"`);
        }

        if (hasAnimations) {
            if (animationStateConfig.configuredState && animationStateConfig.canReset) {
                attributes.push(`selected-animation="${animationStateConfig.configuredState.selectedAnimation}"`);
                attributes.push(`animation-speed="${animationStateConfig.configuredState.animationSpeed}"`);
            }

            if (animationAutoPlayConfig.canReset) {
                attributes.push(`animation-auto-play`);
            }
        }

        if (hasMaterialVariants && selectedMaterialVariantConfig.configuredState) {
            attributes.push(`material-variant="${selectedMaterialVariantConfig.configuredState}"`);
        }

        if (hotSpotsSnippet) {
            attributes.push(`hotspots='${hotSpotsSnippet}'`);
        }

        return attributes;
    }, [
        modelUrl,
        syncEnvironment,
        lightingUrlConfig.configuredState,
        skyboxUrlConfig.configuredState,
        hasSkybox,
        skyboxBlurConfig.configuredState,
        environmentIntensityConfig.configuredState,
        environmentRotationConfig.configuredState,
        clearColorConfig.configuredState,
        shadowQualityConfig.configuredState,
        toneMappingConfig.configuredState,
        contrastConfig.configuredState,
        exposureConfig.configuredState,
        ssaoConfig.configuredState,
        cameraConfig.configuredState,
        autoOrbitConfig.configuredState,
        autoOrbitSpeedConfig.configuredState,
        autoOrbitDelayConfig.configuredState,
        hasAnimations,
        animationStateConfig.configuredState,
        animationAutoPlayConfig.configuredState,
        hasMaterialVariants,
        selectedMaterialVariantConfig.configuredState,
        hotSpotsSnippet,
    ]);

    // This is all the child annotation elements, as a single string.
    const children = useMemo(() => {
        if (hotspots.length === 0) {
            return "";
        }
        const annotations = hotspots.map((hotspot) => `  <babylon-viewer-annotation hotSpot="${hotspot.name}"></babylon-viewer-annotation>`).join("\n");
        return `\n  <!-- Annotations are optional HTML child elements that track hot spots. -->\n${annotations}`;
    }, [hotspots]);

    // This is the full html snippet (attributes and child elements).
    const htmlSnippet = useMemo(() => {
        const formattedAttributes = attributes.map((attribute) => `\n  ${attribute}`).join("");
        return `<babylon-viewer ${formattedAttributes}\n>${children}\n</babylon-viewer>`;
    }, [attributes, children]);

    // This is the full json snippet
    const jsonSnippet = useMemo(() => {
        const properties: string[] = [`"source": "${modelUrl || "[model url]"}"`];

        if (lightingUrlConfig.canReset) {
            properties.push(`"environmentLighting": "${lightingUrlConfig.configuredState}"`);
        }

        if (syncEnvironment && lightingUrlConfig.canReset) {
            properties.push(`"environmentSkybox": "${lightingUrlConfig.configuredState}"`);
        } else if (skyboxUrlConfig.canReset) {
            properties.push(`"environmentSkybox": "${skyboxUrlConfig.configuredState}"`);
        }

        const environmentConfigProperties: string[] = [];
        if (hasSkybox) {
            if (skyboxBlurConfig.canReset) {
                environmentConfigProperties.push(`"blur": ${skyboxBlurConfig.configuredState}`);
            }
        } else if (clearColorConfig.canReset) {
            properties.push(`"clearColor": "${clearColorConfig.configuredState.toHexString()}"`);
        }
        if (environmentIntensityConfig.canReset) {
            environmentConfigProperties.push(`"intensity": ${environmentIntensityConfig.configuredState}`);
        }
        if (environmentRotationConfig.canReset) {
            environmentConfigProperties.push(`"rotation": ${environmentRotationConfig.configuredState}`);
        }
        if (environmentConfigProperties.length > 0) {
            properties.push(`"environmentConfig": {${environmentConfigProperties.map((property) => `\n    ${property}`).join(",")}\n  }`);
        }

        const postProcessingProperties: string[] = [];
        if (toneMappingConfig.canReset) {
            postProcessingProperties.push(`"toneMapping": ${toneMappingConfig.configuredState}`);
        }
        if (contrastConfig.canReset) {
            postProcessingProperties.push(`"contrast": ${contrastConfig.configuredState.toFixed(1)}`);
        }
        if (exposureConfig.canReset) {
            postProcessingProperties.push(`"exposure": ${exposureConfig.configuredState.toFixed(1)}`);
        }
        if (ssaoConfig.canReset) {
            postProcessingProperties.push(`"ssao": "${ssaoConfig.configuredState}"`);
        }
        if (postProcessingProperties.length > 0) {
            properties.push(`"postProcessing": {${postProcessingProperties.map((property) => `\n    ${property}`).join(",")}\n  }`);
        }

        const shadowProperties: string[] = [];
        if (shadowQualityConfig.canReset) {
            shadowProperties.push(`"quality": "${shadowQualityConfig.configuredState}"`);
        }
        if (shadowProperties.length > 0) {
            properties.push(`"shadowConfig": {${shadowProperties.map((property) => `\n    ${property}`).join(",")}\n  }`);
        }

        if (cameraConfig.canReset) {
            const {
                alpha,
                beta,
                radius,
                target: { x: targetX, y: targetY, z: targetZ },
            } = cameraConfig.configuredState;
            properties.push(`"cameraOrbit": [${alpha.toFixed(3)}, ${beta.toFixed(3)}, ${radius.toFixed(3)}]`);
            properties.push(`"cameraTarget": [${targetX.toFixed(3)}, ${targetY.toFixed(3)}, ${targetZ.toFixed(3)}]`);
        }

        const autoOrbitProperties: string[] = [];
        if (autoOrbitConfig.canReset) {
            autoOrbitProperties.push(`"enabled": ${autoOrbitConfig.configuredState}`);
        }
        if (autoOrbitSpeedConfig.canReset) {
            autoOrbitProperties.push(`"speed": ${autoOrbitSpeedConfig.configuredState}`);
        }
        if (autoOrbitDelayConfig.canReset) {
            autoOrbitProperties.push(`"delay": ${autoOrbitDelayConfig.configuredState}`);
        }
        if (autoOrbitProperties.length > 0) {
            properties.push(`"cameraAutoOrbit": {${autoOrbitProperties.map((property) => `\n    ${property}`).join(",")}\n  }`);
        }

        if (animationStateConfig.canReset) {
            properties.push(`"animationSpeed": ${animationStateConfig.configuredState.animationSpeed}`);
            properties.push(`"selectedAnimation": ${animationStateConfig.configuredState.selectedAnimation}`);
        }

        if (animationAutoPlayConfig.canReset) {
            properties.push(`"animationAutoPlay": ${animationAutoPlayConfig.configuredState}`);
        }

        if (selectedMaterialVariantConfig.canReset) {
            properties.push(`"selectedMaterialVariant": "${selectedMaterialVariantConfig.configuredState}"`);
        }

        if (hotSpotsSnippet) {
            properties.push(`"hotSpots": ${hotSpotsSnippet}`);
        }

        return `{${properties.map((property) => `\n  ${property}`).join(",")}\n}`;
    }, [
        modelUrl,
        syncEnvironment,
        lightingUrlConfig.configuredState,
        skyboxUrlConfig.configuredState,
        hasSkybox,
        environmentIntensityConfig.configuredState,
        environmentRotationConfig.configuredState,
        skyboxBlurConfig.configuredState,
        clearColorConfig.configuredState,
        toneMappingConfig.configuredState,
        contrastConfig.configuredState,
        exposureConfig.configuredState,
        ssaoConfig.configuredState,
        shadowQualityConfig.configuredState,
        cameraConfig.configuredState,
        autoOrbitConfig.configuredState,
        autoOrbitSpeedConfig.configuredState,
        autoOrbitDelayConfig.configuredState,
        animationStateConfig.configuredState,
        animationAutoPlayConfig.configuredState,
        selectedMaterialVariantConfig.configuredState,
        hotSpotsSnippet,
    ]);

    const isModelUrlValid = useMemo(() => {
        return URL.canParse(modelUrl);
    }, [modelUrl]);

    const onModelUrlChange = useCallback(
        (value: string) => {
            setModelUrl(value);
        },
        [setModelUrl]
    );

    const onModelUrlBlur = useCallback(() => {
        if (isModelUrlValid) {
            viewerElement.source = modelUrl;
        }
    }, [viewerElement, isModelUrlValid, modelUrl]);

    const onLoadModelClick = useCallback(() => {
        PickModel(viewerElement);
    }, [viewerElement]);

    const isEnvironmentLightingUrlValid = useMemo(() => {
        return !lightingUrlConfig.configuredState || lightingUrlConfig.configuredState === "auto" || URL.canParse(lightingUrlConfig.configuredState);
    }, [lightingUrlConfig.configuredState]);

    const onEnvironmentLightingUrlChange = useCallback(
        (value: string) => {
            lightingUrlConfig.update(value);
        },
        [lightingUrlConfig.update]
    );

    const isEnvironmentSkyboxUrlValid = useMemo(() => {
        return !skyboxUrlConfig.configuredState || skyboxUrlConfig.configuredState === "auto" || URL.canParse(skyboxUrlConfig.configuredState);
    }, [skyboxUrlConfig.configuredState]);

    const onEnvironmentSkyboxUrlChange = useCallback(
        (value: string) => {
            skyboxUrlConfig.update(value);
        },
        [skyboxUrlConfig.update]
    );

    // This applies the configured environment (lighting and skybox) to the viewer element when needed.
    useEffect(() => {
        if (needsEnvironmentUpdate) {
            if (syncEnvironment) {
                if (isEnvironmentLightingUrlValid) {
                    viewerElement.environment = lightingUrlConfig.configuredState;
                }
            } else {
                if (isEnvironmentLightingUrlValid) {
                    viewerElement.environmentLighting = lightingUrlConfig.configuredState;
                }
                if (isEnvironmentSkyboxUrlValid) {
                    viewerElement.environmentSkybox = skyboxUrlConfig.configuredState;
                }
            }

            setNeedsEnvironmentUpdate(false);
        }
    }, [
        viewerElement,
        needsEnvironmentUpdate,
        setNeedsEnvironmentUpdate,
        syncEnvironment,
        isEnvironmentLightingUrlValid,
        lightingUrlConfig.configuredState,
        isEnvironmentSkyboxUrlValid,
        skyboxBlurConfig.configuredState,
    ]);

    const onEnvironmentLightingResetClick = useCallback(() => {
        lightingUrlConfig.update("");
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate, lightingUrlConfig.update]);

    const onEnvironmentSkyboxResetClick = useCallback(() => {
        skyboxUrlConfig.update("");
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate, skyboxUrlConfig.update]);

    const onSyncEnvironmentChanged = useCallback(
        (value: boolean = false) => {
            setSyncEnvironment(value);
            setNeedsEnvironmentUpdate(true);

            if (value && !lightingUrlConfig.canReset) {
                lightingUrlConfig.update("auto");
                return;
            }

            if (!value && lightingUrlConfig.configuredState === "auto") {
                lightingUrlConfig.reset();
            }
        },
        [setNeedsEnvironmentUpdate, lightingUrlConfig.configuredState, lightingUrlConfig.canReset, lightingUrlConfig.update, lightingUrlConfig.reset, setSyncEnvironment]
    );

    const onAddHotspotClick = useCallback(() => {
        setHotspots((hotspots) => {
            return [
                ...hotspots,
                {
                    name: `HotSpot ${hotspots.length + 1}`,
                    id: CreateHotSpotId(),
                    data: { type: "surface", meshIndex: 0, pointIndex: [0, 0, 0], barycentric: [0, 0, 0] },
                },
            ];
        });
    }, [hotspots, setHotspots]);

    const onHotSpotsReorder = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (over && active.id !== over.id) {
                setHotspots((hotspots) => {
                    const oldIndex = hotspots.findIndex((hotspot) => hotspot.id === active.id);
                    const newIndex = hotspots.findIndex((hotspot) => hotspot.id === over.id);

                    return arrayMove(hotspots, oldIndex, newIndex);
                });
            }
        },
        [setHotspots]
    );

    // This resets and adds <babylon-viewer-annotation> elements to the viewer element for each hot spot.
    useEffect(() => {
        viewerElement.innerHTML = "";
        for (const hotspot of hotspots) {
            const annotation = new HTML3DAnnotationElement();
            annotation.hotSpot = hotspot.name;
            viewerElement.appendChild(annotation);
        }
    }, [viewerElement, hotspots]);

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(htmlSnippet);
    }, [htmlSnippet]);

    const [canSaveSnippet, setCanSaveSnippet] = useState(true);

    const saveSnippet = useCallback(async () => {
        if (canSaveSnippet) {
            setCanSaveSnippet(false);
            try {
                let url = "https://snippet.babylonjs.com";
                if (window.location.hash) {
                    url = `${url}/${window.location.hash.substring(1)}`;
                }

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        payload: jsonSnippet,
                    }),
                });

                const result = await response.json();
                let id = result.id;
                if (result.version) {
                    id = `${id}#${result.version}`;
                }
                window.location.hash = id;
            } catch (error: unknown) {
                alert(`Error saving snippet: ${error}`);
            } finally {
                setCanSaveSnippet(true);
            }
        }
    }, [canSaveSnippet, jsonSnippet]);

    const canRevertAll = useMemo(
        () => cameraConfig.canRevert || animationStateConfig.canRevert || selectedMaterialVariantConfig.canRevert,
        [cameraConfig.canRevert, animationStateConfig.canRevert, selectedMaterialVariantConfig.canRevert]
    );

    const revertAll = useCallback(() => {
        animationStateConfig.revert();
        cameraConfig.revert();
        selectedMaterialVariantConfig.revert();
    }, [animationStateConfig.revert, cameraConfig.revert, selectedMaterialVariantConfig.revert]);

    const resetAll = useCallback(() => {
        lightingUrlConfig.reset();
        skyboxUrlConfig.reset();
        onSyncEnvironmentChanged();
        skyboxBlurConfig.reset();
        environmentIntensityConfig.reset();
        environmentRotationConfig.reset();
        clearColorConfig.reset();
        shadowQualityConfig.reset();
        toneMappingConfig.reset();
        contrastConfig.reset();
        exposureConfig.reset();
        ssaoConfig.reset();
        cameraConfig.reset();
        autoOrbitConfig.reset();
        autoOrbitSpeedConfig.reset();
        autoOrbitDelayConfig.reset();
        animationStateConfig.reset();
        animationAutoPlayConfig.reset();
        selectedMaterialVariantConfig.reset();
        setHotspots([]);
    }, [
        lightingUrlConfig.reset,
        skyboxUrlConfig.reset,
        onSyncEnvironmentChanged,
        skyboxBlurConfig.reset,
        environmentIntensityConfig.reset,
        environmentRotationConfig.reset,
        clearColorConfig.reset,
        shadowQualityConfig.reset,
        toneMappingConfig.reset,
        contrastConfig.reset,
        exposureConfig.reset,
        ssaoConfig.reset,
        cameraConfig.reset,
        autoOrbitConfig.reset,
        autoOrbitSpeedConfig.reset,
        autoOrbitDelayConfig.reset,
        animationStateConfig.reset,
        animationAutoPlayConfig.reset,
        selectedMaterialVariantConfig.reset,
    ]);

    // SSAO is not supported when shadow quality is set to high (IBL).
    const validSSAOOptions = shadowQualityConfig.configuredState !== "high" ? SSAOOptions : SSAOOptions.filter((option) => option.value !== "enabled");
    const validShadowQualityOptions = ssaoConfig.configuredState !== "enabled" ? ShadowQualityOptions : ShadowQualityOptions.filter((option) => option.value !== "high");

    const classes = useStyles();

    return (
        <ToolContext.Provider value={{ toolName: "Viewer Configurator", size: "medium", disableCopy: true, useFluent: true }}>
            <div className={classes.root}>
                <div className={classes.snippetSection}>
                    <PropertyLine label="Format" uniqueId="output-format">
                        <Dropdown options={OutputOptions} value={outputFormat} onChange={(value) => setOutputFormat(value as OutputFormat)} />
                    </PropertyLine>
                    <MessageBar
                        message={outputFormat === "html" ? "The HTML snippet can be used directly in a web page." : "The JSON snippet can be used as the Viewer options."}
                        intent="info"
                    />
                    <Textarea
                        value={outputFormat === "html" ? htmlSnippet : jsonSnippet}
                        readOnly
                        resize="vertical"
                        className={classes.snippetTextarea}
                        textarea={{ className: classes.snippetTextareaInner }}
                    />
                    <div className={classes.snippetActions}>
                        <Button className={classes.fillControl} label="Reset" onClick={resetAll} />
                        <div className={classes.buttonGroup}>
                            <Button title="Revert all state to snippet" appearance="transparent" icon={ArrowResetRegular} onClick={revertAll} disabled={!canRevertAll} />
                            <Button title="Copy html to clipboard" appearance="transparent" icon={CopyRegular} onClick={copyToClipboard} />
                            <Button title="Save as snippet" appearance="transparent" icon={SaveRegular} onClick={saveSnippet} disabled={!canSaveSnippet} />
                        </div>
                    </div>
                </div>
                <div className={classes.accordionContainer}>
                    <Accordion>
                        <AccordionSection title="Model">
                            <LineContainer uniqueId="model-url">
                                <div className={classes.propertyContent}>
                                    <div className={classes.fillControl}>
                                        <TextInput className={classes.fullWidth} value={modelUrl} onChange={onModelUrlChange} />
                                    </div>
                                    <div className={classes.buttonGroup}>
                                        <Button title="Load from model url" appearance="transparent" icon={CheckmarkRegular} onClick={onModelUrlBlur} />
                                        <Button title="Load local model" appearance="transparent" icon={ArrowUploadRegular} onClick={onLoadModelClick} />
                                    </div>
                                </div>
                            </LineContainer>
                        </AccordionSection>
                        <AccordionSection title="Environment">
                            <PropertyLine
                                label="Sync Lighting & Skybox"
                                uniqueId="sync-env"
                                description="The same environment can be used for both image based lighting (IBL) and the skybox, or different environments can be used for each."
                            >
                                <Switch value={syncEnvironment} onChange={onSyncEnvironmentChanged} />
                            </PropertyLine>
                            <LineContainer uniqueId="lighting-url">
                                <div className={classes.propertyContent}>
                                    <div className={classes.fillControl}>
                                        <TextInput
                                            className={classes.fullWidth}
                                            key={syncEnvironment ? "env-url" : "light-url"}
                                            value={lightingUrlConfig.configuredState}
                                            onChange={onEnvironmentLightingUrlChange}
                                        />
                                    </div>
                                    <div className={classes.buttonGroup}>
                                        <Button
                                            title={syncEnvironment ? "Load environment url" : "Load lighting url"}
                                            appearance="transparent"
                                            icon={CheckmarkRegular}
                                            disabled={!isEnvironmentLightingUrlValid}
                                            onClick={onEnvironmentUrlSubmit}
                                        />
                                        <Button
                                            title={syncEnvironment ? "Reset environment" : "Reset lighting"}
                                            appearance="transparent"
                                            icon={DeleteRegular}
                                            disabled={!lightingUrlConfig.canReset}
                                            onClick={onEnvironmentLightingResetClick}
                                        />
                                    </div>
                                </div>
                            </LineContainer>
                            <Collapse visible={!syncEnvironment}>
                                <LineContainer uniqueId="skybox-url">
                                    <div className={classes.propertyContent}>
                                        <div className={classes.fillControl}>
                                            <TextInput className={classes.fullWidth} value={skyboxUrlConfig.configuredState} onChange={onEnvironmentSkyboxUrlChange} />
                                        </div>
                                        <div className={classes.buttonGroup}>
                                            <Button title="Load skybox url" appearance="transparent" icon={CheckmarkRegular} onClick={onEnvironmentUrlSubmit} />
                                            <Button
                                                title="Reset skybox"
                                                appearance="transparent"
                                                icon={DeleteRegular}
                                                disabled={!skyboxUrlConfig.canReset}
                                                onClick={onEnvironmentSkyboxResetClick}
                                            />
                                        </div>
                                    </div>
                                </LineContainer>
                            </Collapse>
                            <Collapse visible={hasSkybox}>
                                <PropertyLine label="Blur" uniqueId="skybox-blur">
                                    <div className={classes.propertyContent}>
                                        <div className={classes.fillControl}>
                                            <SyncedSliderInput value={skyboxBlurConfig.configuredState} min={0} max={1} step={0.01} onChange={skyboxBlurConfig.update} />
                                        </div>
                                        <Button
                                            title="Reset skybox blur"
                                            appearance="transparent"
                                            icon={DeleteRegular}
                                            disabled={!skyboxBlurConfig.canReset}
                                            onClick={skyboxBlurConfig.reset}
                                        />
                                    </div>
                                </PropertyLine>
                            </Collapse>
                            <PropertyLine label="Intensity" uniqueId="env-intensity">
                                <div className={classes.propertyContent}>
                                    <div className={classes.fillControl}>
                                        <SyncedSliderInput
                                            value={environmentIntensityConfig.configuredState}
                                            min={0}
                                            max={5}
                                            step={0.01}
                                            onChange={environmentIntensityConfig.update}
                                        />
                                    </div>
                                    <Button
                                        title="Reset skybox intensity"
                                        appearance="transparent"
                                        icon={DeleteRegular}
                                        disabled={!environmentIntensityConfig.canReset}
                                        onClick={environmentIntensityConfig.reset}
                                    />
                                </div>
                            </PropertyLine>
                            <PropertyLine label="Rotation" uniqueId="env-rotation">
                                <div className={classes.propertyContent}>
                                    <div className={classes.fillControl}>
                                        <SyncedSliderInput
                                            value={environmentRotationConfig.configuredState}
                                            min={0}
                                            max={2 * Math.PI}
                                            step={0.01}
                                            onChange={environmentRotationConfig.update}
                                        />
                                    </div>
                                    <Button
                                        title="Reset skybox rotation"
                                        appearance="transparent"
                                        icon={DeleteRegular}
                                        disabled={!environmentRotationConfig.canReset}
                                        onClick={environmentRotationConfig.reset}
                                    />
                                </div>
                            </PropertyLine>
                            <PropertyLine label="Clear Color" uniqueId="clear-color">
                                <div className={classes.propertyContent}>
                                    <div className={classes.fillControl}>
                                        <ColorPickerPopup value={clearColorConfig.configuredState} onChange={(color) => clearColorConfig.update(color as Color4)} />
                                    </div>
                                    <Button
                                        title="Reset clear color"
                                        appearance="transparent"
                                        icon={DeleteRegular}
                                        disabled={!clearColorConfig.canReset}
                                        onClick={clearColorConfig.reset}
                                    />
                                </div>
                            </PropertyLine>
                        </AccordionSection>
                        <AccordionSection title="Shadows">
                            <PropertyLine label="Quality" uniqueId="shadow-quality">
                                <div className={classes.propertyContent}>
                                    <Dropdown
                                        className={classes.fillControl}
                                        options={validShadowQualityOptions}
                                        value={shadowQualityConfig.configuredState}
                                        onChange={(value) => shadowQualityConfig.update(value as ShadowQuality)}
                                    />
                                    <Button
                                        title="Reset shadow quality"
                                        appearance="transparent"
                                        icon={DeleteRegular}
                                        disabled={!shadowQualityConfig.canReset}
                                        onClick={shadowQualityConfig.reset}
                                    />
                                </div>
                            </PropertyLine>
                        </AccordionSection>
                        <AccordionSection title="Post Processing">
                            <PropertyLine label="Tone Mapping" uniqueId="tone-mapping">
                                <div className={classes.propertyContent}>
                                    <Dropdown
                                        className={classes.fillControl}
                                        options={ToneMappingOptions}
                                        value={toneMappingConfig.configuredState}
                                        onChange={(value) => toneMappingConfig.update(value as ToneMapping)}
                                    />
                                    <Button
                                        title="Reset tone mapping"
                                        appearance="transparent"
                                        icon={DeleteRegular}
                                        disabled={!toneMappingConfig.canReset}
                                        onClick={toneMappingConfig.reset}
                                    />
                                </div>
                            </PropertyLine>
                            <PropertyLine label="Contrast" uniqueId="contrast">
                                <div className={classes.propertyContent}>
                                    <div className={classes.fillControl}>
                                        <SyncedSliderInput value={contrastConfig.configuredState} min={0} max={5} step={0.05} onChange={contrastConfig.update} />
                                    </div>
                                    <Button
                                        title="Reset contrast"
                                        appearance="transparent"
                                        icon={DeleteRegular}
                                        disabled={!contrastConfig.canReset}
                                        onClick={contrastConfig.reset}
                                    />
                                </div>
                            </PropertyLine>
                            <PropertyLine label="Exposure" uniqueId="exposure">
                                <div className={classes.propertyContent}>
                                    <div className={classes.fillControl}>
                                        <SyncedSliderInput value={exposureConfig.configuredState} min={0} max={5} step={0.05} onChange={exposureConfig.update} />
                                    </div>
                                    <Button
                                        title="Reset exposure"
                                        appearance="transparent"
                                        icon={DeleteRegular}
                                        disabled={!exposureConfig.canReset}
                                        onClick={exposureConfig.reset}
                                    />
                                </div>
                            </PropertyLine>
                            <PropertyLine label="SSAO (Ambient Occlusion)" uniqueId="ssao">
                                <div className={classes.propertyContent}>
                                    <Dropdown
                                        className={classes.fillControl}
                                        options={validSSAOOptions}
                                        value={ssaoConfig.configuredState}
                                        onChange={(value) => ssaoConfig.update(value as SSAOOptions)}
                                    />
                                    <Button title="Reset SSAO" appearance="transparent" icon={DeleteRegular} disabled={!ssaoConfig.canReset} onClick={ssaoConfig.reset} />
                                </div>
                            </PropertyLine>
                        </AccordionSection>
                        <AccordionSection title="Camera">
                            <MessageBar message="Position the camera in the viewer, and then click the button below to add the camera pose to the html snippet." intent="info" />
                            <LineContainer uniqueId="camera-pose">
                                <div className={classes.propertyContent}>
                                    <Button className={classes.fillControl} label="Use Current Pose" onClick={cameraConfig.snapshot} />
                                    <div className={classes.buttonGroup}>
                                        <Button
                                            title="Revert camera pose to snippet"
                                            appearance="transparent"
                                            disabled={!cameraConfig.canRevert}
                                            icon={ArrowResetRegular}
                                            onClick={cameraConfig.revert}
                                        />
                                        <Button
                                            title="Reset camera pose attributes"
                                            appearance="transparent"
                                            disabled={!cameraConfig.canReset}
                                            icon={DeleteRegular}
                                            onClick={cameraConfig.reset}
                                        />
                                    </div>
                                </div>
                            </LineContainer>
                            <PropertyLine label="Auto Orbit" uniqueId="auto-orbit">
                                <Switch value={autoOrbitConfig.configuredState} onChange={autoOrbitConfig.update} />
                            </PropertyLine>
                            <Collapse visible={!!autoOrbitConfig.configuredState}>
                                <PropertyLine label="Speed" uniqueId="orbit-speed">
                                    <div className={classes.propertyContent}>
                                        <div className={classes.fillControl}>
                                            <SyncedSliderInput
                                                value={autoOrbitSpeedConfig.configuredState}
                                                min={0}
                                                max={0.524}
                                                step={0.01}
                                                onChange={autoOrbitSpeedConfig.update}
                                            />
                                        </div>
                                        <Button
                                            title="Reset auto orbit speed"
                                            appearance="transparent"
                                            disabled={!autoOrbitSpeedConfig.canReset}
                                            icon={DeleteRegular}
                                            onClick={autoOrbitSpeedConfig.reset}
                                        />
                                    </div>
                                </PropertyLine>
                                <PropertyLine label="Delay" uniqueId="orbit-delay">
                                    <div className={classes.propertyContent}>
                                        <div className={classes.fillControl}>
                                            <SyncedSliderInput value={autoOrbitDelayConfig.configuredState} min={0} max={5000} step={1} onChange={autoOrbitDelayConfig.update} />
                                        </div>
                                        <Button
                                            title="Reset auto orbit delay"
                                            appearance="transparent"
                                            disabled={!autoOrbitDelayConfig.canReset}
                                            icon={DeleteRegular}
                                            onClick={autoOrbitDelayConfig.reset}
                                        />
                                    </div>
                                </PropertyLine>
                            </Collapse>
                        </AccordionSection>
                        {hasAnimations && (
                            <AccordionSection title="Animation">
                                <MessageBar
                                    message="Select the animation and animation speed in the viewer, and then click the button below to add those selections to the html snippet."
                                    intent="info"
                                />
                                <LineContainer uniqueId="animation-state">
                                    <div className={classes.propertyContent}>
                                        <Button className={classes.fillControl} label="Use Current Selections" onClick={animationStateConfig.snapshot} disabled={!hasAnimations} />
                                        <div className={classes.buttonGroup}>
                                            <Button
                                                title="Revert animation state to snippet"
                                                appearance="transparent"
                                                disabled={!animationStateConfig.canRevert}
                                                icon={ArrowResetRegular}
                                                onClick={animationStateConfig.revert}
                                            />
                                            <Button
                                                title="Reset animation state attributes"
                                                appearance="transparent"
                                                disabled={!animationStateConfig.canReset}
                                                icon={DeleteRegular}
                                                onClick={animationStateConfig.reset}
                                            />
                                        </div>
                                    </div>
                                </LineContainer>
                                <PropertyLine label="Auto Play" uniqueId="auto-play">
                                    <Switch value={animationAutoPlayConfig.configuredState} onChange={animationAutoPlayConfig.update} />
                                </PropertyLine>
                            </AccordionSection>
                        )}
                        {hasMaterialVariants && (
                            <AccordionSection title="Material Variants">
                                <MessageBar
                                    message="Select the material variant the viewer, and then click the button below to add that selection to the html snippet."
                                    intent="info"
                                />
                                <LineContainer uniqueId="material-variant-state">
                                    <div className={classes.propertyContent}>
                                        <Button
                                            className={classes.fillControl}
                                            label="Snapshot Current State"
                                            onClick={selectedMaterialVariantConfig.snapshot}
                                            disabled={!hasMaterialVariants}
                                        />
                                        <div className={classes.buttonGroup}>
                                            <Button
                                                title="Revert selected material variant to snippet"
                                                appearance="transparent"
                                                disabled={!selectedMaterialVariantConfig.canRevert}
                                                icon={ArrowResetRegular}
                                                onClick={selectedMaterialVariantConfig.revert}
                                            />
                                            <Button
                                                title="Reset material variant attribute"
                                                appearance="transparent"
                                                icon={DeleteRegular}
                                                disabled={!selectedMaterialVariantConfig.canReset}
                                                onClick={selectedMaterialVariantConfig.reset}
                                            />
                                        </div>
                                    </div>
                                </LineContainer>
                            </AccordionSection>
                        )}
                        <AccordionSection title="Hot Spots">
                            <PropertyLine
                                label="Hot Spot Type"
                                uniqueId="hotspot-type"
                                description="Surface hot spots track a point on the surface of a mesh. After adding a surface hot spot, click the target button and then click a point on the
                                    model to choose the surface point. After the hotspot point has been selected, optionally orbit the camera to the desired pose and then click the
                                    camera button. Annotations are optional child html elements that track a hotspot, and samples are included in the html snippet."
                            >
                                <div className={classes.propertyContent}>
                                    <Dropdown className={classes.fillControl} options={HotSpotTypeOptions} value="surface" onChange={() => {}} />
                                    <Button title="Add Hot Spot" appearance="transparent" icon={AddSquareRegular} onClick={onAddHotspotClick} />
                                </div>
                            </PropertyLine>
                            <DndContext sensors={dndSensors} modifiers={HotSpotsDndModifers} collisionDetection={closestCenter} onDragEnd={onHotSpotsReorder}>
                                <SortableContext items={hotspots} strategy={verticalListSortingStrategy}>
                                    {hotspots.map((hotspot) => (
                                        <HotSpotEntry key={hotspot.id} id={hotspot.id} hotspots={hotspots} setHotspots={setHotspots} viewerElement={viewerElement} />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </AccordionSection>
                    </Accordion>
                </div>
            </div>
        </ToolContext.Provider>
    );
};
