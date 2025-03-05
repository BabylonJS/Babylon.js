import "./configurator.scss";
import * as styles from "../../App.module.scss";
// eslint-disable-next-line import/no-internal-modules
import type { ViewerElement, ViewerDetails, Viewer, PostProcessing, CameraAutoOrbit, HotSpot, ToneMapping, Model } from "viewer/index";
// eslint-disable-next-line import/no-internal-modules
import type { Color3, IInspectableOptions, Nullable, Observable } from "core/index";
import type { DragEndEvent } from "@dnd-kit/core";

import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faCamera, faCopy, faGripVertical, faPlus, faTrashCan, faCheck, faUpload, faRotateLeft, faSquarePlus } from "@fortawesome/free-solid-svg-icons";

import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { MessageLineComponent } from "shared-ui-components/lines/messageLineComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

import { HTML3DAnnotationElement } from "viewer/viewerAnnotationElement";

import { PointerEventTypes } from "core/Events/pointerEvents";
import { Color4 } from "core/Maths/math.color";
import { WithinEpsilon } from "core/Maths/math.scalar.functions";
import { Epsilon } from "core/Maths/math.constants";
import { CreateHotSpotQueryForPickingInfo } from "core/Meshes/abstractMesh.hotSpot";

import { useObservableState } from "../../hooks/observableHooks";
import { LoadModel, PickModel } from "../../modelLoader";

import { useEventfulState } from "../../hooks/observableHooks";
import { FontAwesomeIconButton } from "../misc/FontAwesomeIconButton";

type HotSpotInfo = { name: string; id: string; data: HotSpot };

const toneMappingOptions = [
    { label: "Standard", value: "standard" },
    { label: "None", value: "none" },
    { label: "Aces", value: "aces" },
    { label: "Neutral", value: "neutral" },
] as const satisfies IInspectableOptions[] & { label: string; value: ToneMapping }[];

const hotSpotTypeOptions = [{ label: "Surface", value: "surface" }] as const satisfies IInspectableOptions[];

const hotSpotsDndModifers = [restrictToVerticalAxis, restrictToParentElement];

function createDefaultAnnotation(hotSpotName: string) {
    return `
    <div style="display: flex">
      <svg style="width: 20px; height: 20px; transform: translate(-50%, -50%)">
        <ellipse cx="10" cy="10" rx="8" ry="8" fill="red" stroke="white" stroke-width="3" />
      </svg>
      <span style="color: black; background: white; border-radius: 6px; padding: 0px 3px; transform: translate(0%, -50%)">${hotSpotName}</span>
    </div>`;
}

function useConfiguration<DataType>(defaultValue: DataType) {
    const [value, setValue] = useState(defaultValue);
    const isDefaultValue = useMemo(() => value === defaultValue, [value, defaultValue]);
    const resetValue = useCallback(() => {
        setValue(defaultValue);
    }, [defaultValue]);
    return [value, setValue, resetValue, isDefaultValue] as const;
}

function compareArrays<T>(left: T[], right: T[]) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

function useConfiguration2<T>(
    defaultState: T,
    get: () => T,
    set: ((data: T) => void) | undefined,
    equals: (left: T, right: T) => boolean = (left, right) => left === right,
    observables: Observable<any>[] = [],
    dependencies?: unknown[]
) {
    const memoDefaultState = useMemo(() => defaultState, dependencies ?? []);
    const memoSet = useCallback(set ?? (() => {}), dependencies ?? []);
    const memoGet = useCallback(get, dependencies ?? []);
    const memoEquals = useCallback(equals, []);
    const [configuredState, setConfiguredState] = useState(memoDefaultState);
    const liveState = useObservableState(memoGet, ...observables);
    const [isConfigured, setIsConfigured] = useState(false);

    useEffect(() => {
        memoSet?.(configuredState);
    }, [configuredState, memoSet]);

    const canRevert = useMemo(() => {
        return isConfigured && !memoEquals(liveState, configuredState);
    }, [isConfigured, liveState, configuredState, memoEquals]);

    const canReset = useMemo(() => {
        return isConfigured && !memoEquals(memoDefaultState, configuredState);
    }, [isConfigured, memoDefaultState, configuredState, memoEquals]);

    const revert = useCallback(() => {
        memoSet?.(configuredState);
    }, [configuredState, memoSet]);

    const reset = useCallback(() => {
        setConfiguredState(memoDefaultState);
        setIsConfigured(false);
    }, [memoDefaultState]);

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

    const snapshot = useCallback(() => {
        setConfiguredState(liveState);
        setIsConfigured(true);
    }, [liveState]);

    return [canRevert, canReset, revert, reset, update, snapshot, configuredState] as const;
}

const HotSpotEntry: FunctionComponent<{
    id: string;
    hotspots: HotSpotInfo[];
    setHotspots: React.Dispatch<React.SetStateAction<HotSpotInfo[]>>;
    viewerElement: ViewerElement;
}> = ({ id, hotspots, setHotspots, viewerElement }) => {
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
        };
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
    const [hasPicked, setHasPicked] = useState(false);

    const onHotspotDeleteClick = useCallback(() => {
        if (index >= 0) {
            setHotspots((hotspots) => {
                const newHotspots = [...hotspots];
                newHotspots.splice(index, 1);
                return newHotspots;
            });
        }
    }, [index, setHotspots]);

    const onHotspotPickClick = useCallback(() => {
        if (viewerElement.viewerDetails?.model && hotspot) {
            const originalCursor = getComputedStyle(viewerElement).cursor;
            viewerElement.style.cursor = "crosshair";
            const { scene, model, viewer } = viewerElement.viewerDetails;

            const cleanupActions: (() => void)[] = [() => setIsPicking(false), () => (viewerElement.style.cursor = originalCursor)];

            const cleanup = () => {
                cleanupActions.forEach((action) => action());
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

                            setHasPicked(true);

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
    }, [hotspot, setHotspots]);

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
        <div ref={rootDivRef} style={{ ...dndStyle, borderWidth: 0 }} {...dndAttributes}>
            <div title="Drag to reorder" {...dndListeners}>
                <FontAwesomeIcon icon={faGripVertical} />
            </div>
            <div className="FlexItem" style={{ flex: 5 }}>
                <TextInputLineComponent key={id} value={hotspot?.name} onChange={onHotSpotNameChange} />
            </div>
            <div onClick={onHotspotPickClick} title="Pick from model">
                <FontAwesomeIcon icon={faBullseye} />
            </div>
            <div onClick={onCameraSnapshotClick} title="Snapshot current camera state">
                <FontAwesomeIcon icon={faCamera} />
            </div>
            <FontAwesomeIconButton title="Delete Hot Spot" className="FlexItem" icon={faTrashCan} onClick={onHotspotDeleteClick} />
        </div>
    );
};

export const Configurator: FunctionComponent<{ viewerElement: ViewerElement; viewerDetails: ViewerDetails; viewer: Viewer }> = (props) => {
    const { viewerElement, viewerDetails, viewer } = props;
    const model = useObservableState(() => viewerDetails.model, viewer.onModelChanged, viewer.onModelError);
    const lockObject = useMemo(() => new LockObject(), []);

    useEffect(() => {
        const onDragOver = (event: DragEvent) => event.preventDefault();
        const onDrop = async (event: DragEvent) => {
            const files = event.dataTransfer?.files;
            if (files) {
                event.preventDefault();
                await LoadModel(viewerElement, files);
            }
        };

        viewerElement.addEventListener("dragover", onDragOver);
        viewerElement.addEventListener("drop", onDrop);

        return () => {
            viewerElement.removeEventListener("dragover", onDragOver);
            viewerElement.removeEventListener("drop", onDrop);
        };
    }, [viewerElement]);

    const [modelUrl, setModelUrl] = useState("https://assets.babylonjs.com/meshes/aerobatic_plane.glb");

    const [canRevertLightingUrl, canResetLightingUrl, revertLightingUrl, resetLightingUrl, updateLightingUrl, snapshotLightingUrl, environmentLightingUrl] = useConfiguration2(
        "",
        () => viewerElement.environment.lighting ?? "",
        undefined,
        undefined,
        [viewer.onEnvironmentChanged],
        [viewerElement]
    );
    const [canREvertSkyboxUrl, canResetSkyboxUrl, revertSkyboxUrl, resetSkyboxUrl, updateSkyboxUrl, snapshotSkyboxUrl, environmentSkyboxUrl] = useConfiguration2(
        "",
        () => viewerElement.environment.skybox ?? "",
        () => {},
        undefined,
        [viewer.onEnvironmentChanged],
        [viewerElement]
    );

    const [syncEnvironment, setSyncEnvironment] = useState(true);
    const [needsEnvironmentUpdate, setNeedsEnvironmentUpdate] = useState(false);

    const hasSkybox = useMemo(() => {
        if (syncEnvironment) {
            return !!environmentLightingUrl;
        }
        return !!environmentSkyboxUrl;
    }, [syncEnvironment, environmentLightingUrl, environmentSkyboxUrl]);

    const [canRevertSkyboxBlur, canResetSkyboxBlur, revertSkyboxBlur, resetSkyboxBlur, updateSkyboxBlur, snapshotSkyboxBlur, skyboxBlur] = useConfiguration2(
        viewer.environmentConfig.blur,
        () => viewer.environmentConfig.blur,
        (blur) => (viewer.environmentConfig = { blur }),
        undefined,
        [viewer.onEnvironmentConfigurationChanged],
        [viewer]
    );

    const [canRevertClearColor, canResetClearColor, revertClearColor, resetClearColor, updateClearColor, snapshotClearColor, clearColor] = useConfiguration2(
        viewerDetails.scene.clearColor,
        () => viewerDetails.scene.clearColor,
        (color) => (viewerDetails.scene.clearColor = color),
        (left, right) => left.equals(right),
        [viewerDetails.scene.onClearColorChangedObservable],
        [viewerDetails.scene]
    );

    const [canRevertCamera, canResetCamera, revertCamera, resetCamera, updateCamera, snapshotCamera, cameraState] = useConfiguration2(
        undefined,
        () => {
            return {
                alpha: viewerDetails.camera.alpha,
                beta: viewerDetails.camera.beta,
                radius: viewerDetails.camera.radius,
                target: viewerDetails.camera.target.clone(),
            };
        },
        (cameraState) => {
            if (cameraState) {
                viewerDetails.camera.interpolateTo(cameraState.alpha, cameraState.beta, cameraState.radius, cameraState.target);
            } else {
                viewer.resetCamera();
            }
        },
        (left, right) => {
            return (
                left == right ||
                (!!left &&
                    !!right &&
                    // TODO: Figure out why the final alpha/beta are as far from the goal value as they are.
                    WithinEpsilon(left.alpha, right.alpha, Epsilon * 10) &&
                    WithinEpsilon(left.beta, right.beta, Epsilon * 10) &&
                    WithinEpsilon(left.radius, right.radius, Epsilon) &&
                    left.target.equalsWithEpsilon(right.target, Epsilon))
            );
        },
        [viewerDetails.camera.onViewMatrixChangedObservable],
        [viewer, viewerDetails.camera, model]
    );

    const [canRevertToneMapping, canResetToneMapping, revertToneMapping, resetToneMapping, updateToneMapping, snapshotToneMapping, toneMapping] = useConfiguration2(
        viewer.postProcessing.toneMapping,
        () => viewer.postProcessing.toneMapping,
        (toneMapping) => (viewer.postProcessing = { toneMapping }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );
    const toneMappingWrapper = useMemo(() => {
        return { toneMapping };
    }, [toneMapping]);

    const [canRevertContrast, canResetContrast, revertContrast, resetContrast, updateContrast, snapshotContrast, contrast] = useConfiguration2(
        viewer.postProcessing.contrast,
        () => viewer.postProcessing.contrast,
        (contrast) => (viewer.postProcessing = { contrast }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );

    const [canRevertExposure, canResetExposure, revertExposure, resetExposure, updateExposure, snapshotExposure, exposure] = useConfiguration2(
        viewer.postProcessing.exposure,
        () => viewer.postProcessing.exposure,
        (exposure) => (viewer.postProcessing = { exposure }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );

    const [canRevertAutoOrbit, canResetAutoOrbit, revertAutoOrbit, resetAutoOrbit, updateAutoOrbit, snapshotAutoOrbit, autoOrbit] = useConfiguration2(
        // TODO: Viewer should have autoOrbit false by default at the Viewer layer.
        false,
        () => viewer.cameraAutoOrbit.enabled,
        (enabled) => (viewer.cameraAutoOrbit = { enabled }),
        undefined,
        [viewer.onCameraAutoOrbitChanged],
        [viewer]
    );

    const [canRevertAutoOrbitSpeed, canResetAutoOrbitSpeed, revertAutoOrbitSpeed, resetAutoOrbitSpeed, updateAutoOrbitSpeed, snapshotAutoOrbitSpeed, autoOrbitSpeed] =
        useConfiguration2(
            viewer.cameraAutoOrbit.speed,
            () => viewer.cameraAutoOrbit.speed,
            (speed) => (viewer.cameraAutoOrbit = { speed }),
            undefined,
            [viewer.onCameraAutoOrbitChanged],
            [viewer]
        );

    const [canRevertAutoOrbitDelay, canResetAutoOrbitDelay, revertAutoOrbitDelay, resetAutoOrbitDelay, updateAutoOrbitDelay, snapshotAutoOrbitDelay, autoOrbitDelay] =
        useConfiguration2(
            viewer.cameraAutoOrbit.delay,
            () => viewer.cameraAutoOrbit.delay,
            (delay) => (viewer.cameraAutoOrbit = { delay }),
            undefined,
            [viewer.onCameraAutoOrbitChanged],
            [viewer]
        );

    const [canRevertAnimationState, canResetAnimationState, revertAnimationState, resetAnimationState, updateAnimationState, snapshotAnimationState, animationState] =
        useConfiguration2(
            undefined,
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
            (left, right) => {
                return (
                    left == right || (!!left && !!right && WithinEpsilon(left.animationSpeed, right.animationSpeed, Epsilon) && left.selectedAnimation === right.selectedAnimation)
                );
            },
            [viewer.onAnimationSpeedChanged, viewer.onSelectedAnimationChanged],
            [viewer]
        );

    const [
        canRevertAnimationAutoPlay,
        canResetAnimationAutoPlay,
        revertAnimationAutoPlay,
        resetAnimationAutoPlay,
        updateAnimationAutoPlay,
        snapshotAnimationAutoPlay,
        animationAutoPlay,
    ] = useConfiguration2(
        false,
        () => viewerElement.animationAutoPlay,
        (autoPlay) => {
            viewerElement.animationAutoPlay = autoPlay;
            autoPlay ? viewer.playAnimation() : viewer.pauseAnimation();
        },
        undefined,
        [viewer.onIsAnimationPlayingChanged],
        [viewer, viewerElement]
    );

    const [selectedMaterialVariant, setSelectedMaterialVariant, resetSelectedMaterialVariant, isSelectedMaterialVariantDefault] = useConfiguration("");
    const [canRevertSelectedMaterialVariant, setCanRevertSelectedMaterialVariant] = useState(false);

    useEffect(() => {
        setCanRevertSelectedMaterialVariant(false);
        if (selectedMaterialVariant) {
            const observer = viewer.onSelectedMaterialVariantChanged.add(() => {
                setCanRevertSelectedMaterialVariant(viewer.selectedMaterialVariant !== selectedMaterialVariant);
            });
            return () => observer.remove();
        }
    }, [viewerDetails, selectedMaterialVariant]);

    const [hotspots, setHotspots] = useState<HotSpotInfo[]>([]);

    const dndSensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    useEffect(() => {
        setHotspots([]);
    }, [model]);

    useEffect(() => {
        viewerElement.hotSpots = hotspots.reduce<Record<string, HotSpot>>((hotspots, { name, data }) => {
            hotspots[name] = data;
            return hotspots;
        }, {});
    }, [viewerElement, hotspots]);

    const hasAnimations = useMemo(() => viewer && viewer.animations.length > 0, [viewer.animations]);
    const hasMaterialVariants = useMemo(() => viewer && viewer.materialVariants.length > 0, [viewer.materialVariants]);

    const attributes = useMemo(() => {
        const attributes: string[] = [`source="${modelUrl || "[model url]"}"`];

        if (syncEnvironment) {
            if (environmentLightingUrl) {
                attributes.push(`environment="${environmentLightingUrl}"`);
            }
        } else {
            if (environmentLightingUrl) {
                attributes.push(`environment-lighting="${environmentLightingUrl}"`);
            }

            if (environmentSkyboxUrl) {
                attributes.push(`environment-skybox="${environmentSkyboxUrl}"`);
            }
        }

        if (hasSkybox) {
            if (canResetSkyboxBlur) {
                attributes.push(`skybox-blur="${skyboxBlur}"`);
            }
        } else {
            if (canResetClearColor) {
                attributes.push(`clear-color="${clearColor.toHexString()}"`);
            }
        }

        if (canResetToneMapping) {
            attributes.push(`tone-mapping="${toneMapping}"`);
        }

        if (canResetContrast) {
            attributes.push(`contrast="${contrast.toFixed(1)}"`);
        }

        if (canResetExposure) {
            attributes.push(`exposure="${exposure.toFixed(1)}"`);
        }

        if (cameraState) {
            const { alpha, beta, radius, target } = cameraState;
            attributes.push(`camera-orbit="${alpha.toFixed(3)} ${beta.toFixed(3)} ${radius.toFixed(3)}"`);
            attributes.push(`camera-target="${target.x.toFixed(3)} ${target.y.toFixed(3)} ${target.z.toFixed(3)}"`);
        }

        if (canResetAutoOrbit) {
            attributes.push(`camera-auto-orbit`);
        }

        if (canResetAutoOrbitSpeed) {
            attributes.push(`camera-auto-orbit-speed="${autoOrbitSpeed.toFixed(3)}"`);
        }

        if (canResetAutoOrbitDelay) {
            attributes.push(`camera-auto-orbit-delay="${autoOrbitDelay.toFixed(0)}"`);
        }

        if (hasAnimations) {
            if (animationState && canResetAnimationState) {
                attributes.push(`selected-animation="${animationState.selectedAnimation}"`);
                attributes.push(`animation-speed="${animationState.animationSpeed}"`);
            }

            if (canResetAnimationAutoPlay) {
                attributes.push(`animation-auto-play`);
            }
        }

        if (hasMaterialVariants && selectedMaterialVariant) {
            attributes.push(`material-variant="${selectedMaterialVariant}"`);
        }

        if (hotspots.length > 0) {
            let hotspotsAttribute = `hotspots='{\n`;
            hotspotsAttribute += hotspots
                .map((hotspot) => {
                    let hotspotJson = `    "${hotspot.name}": {\n`;
                    const hotspotAttributes: string[] = [];
                    if (hotspot.data.type === "surface") {
                        hotspotAttributes.push(
                            ...[
                                `      "type": "surface"`,
                                `      "meshIndex": ${hotspot.data.meshIndex}`,
                                `      "pointIndex": [${hotspot.data.pointIndex.join(", ")}]`,
                                `      "barycentric": [${hotspot.data.barycentric.map((value) => value.toFixed(3)).join(", ")}]`,
                            ]
                        );
                    } else {
                        hotspotAttributes.push(
                            ...[
                                `      "type": "world"`,
                                `      "position": [${hotspot.data.position.map((value) => value.toFixed(3)).join(", ")}]`,
                                `      "normal": [${hotspot.data.normal.map((value) => value.toFixed(3)).join(", ")}]`,
                            ]
                        );
                    }
                    if (hotspot.data.cameraOrbit) {
                        const [alpha, beta, radius] = hotspot.data.cameraOrbit;
                        hotspotAttributes.push(`      "cameraOrbit": [${alpha.toFixed(3)}, ${beta.toFixed(3)}, ${radius.toFixed(3)}]`);
                    }
                    hotspotJson += hotspotAttributes.join(",\n");
                    hotspotJson += `\n    }`;
                    return hotspotJson;
                })
                .join(",\n");
            hotspotsAttribute += `\n  }'`;
            attributes.push(hotspotsAttribute);
        }

        return attributes;
    }, [
        modelUrl,
        syncEnvironment,
        environmentLightingUrl,
        environmentSkyboxUrl,
        hasSkybox,
        skyboxBlur,
        clearColor,
        toneMapping,
        contrast,
        exposure,
        cameraState,
        autoOrbit,
        autoOrbitSpeed,
        autoOrbitDelay,
        hasAnimations,
        animationState,
        animationAutoPlay,
        hasMaterialVariants,
        selectedMaterialVariant,
        hotspots,
    ]);

    const children = useMemo(() => {
        if (hotspots.length === 0) {
            return "";
        }
        const annotations = hotspots
            .map((hotspot) => `  <babylon-viewer-annotation hotSpot="${hotspot.name}">${createDefaultAnnotation(hotspot.name)}\n  </babylon-viewer-annotation>`)
            .join("\n");
        return `\n  <!-- Annotations are optional HTML child elements that track hot spots. -->\n${annotations}`;
    }, [hotspots]);

    const htmlSnippet = useMemo(() => {
        const formattedAttributes = attributes.map((attribute) => `\n  ${attribute}`).join("");
        const snippet = `<babylon-viewer ${formattedAttributes}\n>${children}\n</babylon-viewer>`;
        return snippet;
    }, [attributes, children]);

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
        (async () => {
            try {
                await PickModel(viewerElement);
            } catch (error: unknown) {
                if ("message" in (error as Error)) {
                    alert(error);
                }
            }
        })();
    }, []);

    const onModelUrlKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                onModelUrlBlur();
            }
        },
        [onLoadModelClick, onModelUrlBlur]
    );

    const isEnvironmentLightingUrlValid = useMemo(() => {
        return !environmentLightingUrl || URL.canParse(environmentLightingUrl);
    }, [environmentLightingUrl]);

    const onEnvironmentLightingUrlChange = useCallback(
        (value: string) => {
            updateLightingUrl(value);
        },
        [updateLightingUrl]
    );

    const isEnvironmentSkyboxUrlValid = useMemo(() => {
        return !environmentSkyboxUrl || URL.canParse(environmentSkyboxUrl);
    }, [environmentSkyboxUrl]);

    const onEnvironmentSkyboxUrlChange = useCallback(
        (value: string) => {
            updateSkyboxUrl(value);
        },
        [updateSkyboxUrl]
    );

    useEffect(() => {
        if (needsEnvironmentUpdate) {
            if (syncEnvironment) {
                if (isEnvironmentLightingUrlValid) {
                    viewerElement.environment = environmentLightingUrl;
                }
            } else {
                if (isEnvironmentLightingUrlValid) {
                    viewerElement.environmentLighting = environmentLightingUrl;
                }
                if (isEnvironmentSkyboxUrlValid) {
                    viewerElement.environmentSkybox = environmentSkyboxUrl;
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
        environmentLightingUrl,
        isEnvironmentSkyboxUrlValid,
        environmentSkyboxUrl,
    ]);

    const onEnvironmentLightingUrlKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                setNeedsEnvironmentUpdate(true);
            }
        },
        [setNeedsEnvironmentUpdate]
    );

    const onEnvironmentLightingResetClick = useCallback(() => {
        updateLightingUrl("");
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate, updateLightingUrl]);

    const onEnvironmentSkyboxUrlKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                setNeedsEnvironmentUpdate(true);
            }
        },
        [setNeedsEnvironmentUpdate]
    );

    const onEnvironmentSkyboxResetClick = useCallback(() => {
        updateSkyboxUrl("");
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate, updateSkyboxUrl]);

    const onSyncEnvironmentChanged = useCallback(
        (value?: boolean) => {
            setSyncEnvironment(value ?? true);
            setNeedsEnvironmentUpdate(true);
        },
        [setNeedsEnvironmentUpdate, setSyncEnvironment]
    );

    const onSkyboxBlurChange = useCallback(
        (value: number) => {
            updateSkyboxBlur(value);
        },
        [updateSkyboxBlur]
    );

    useEffect(() => {
        viewerElement.skyboxBlur = skyboxBlur;
    }, [viewerElement, skyboxBlur]);

    const onToneMappingChange = useCallback(
        (value: string | number) => {
            updateToneMapping(value as PostProcessing["toneMapping"]);
        },
        [updateToneMapping]
    );

    const onMaterialVariantsSnapshotClick = useCallback(() => {
        setSelectedMaterialVariant(viewer.selectedMaterialVariant ?? "");
    }, [viewer]);

    const onMaterialVariantsRevertClick = useCallback(() => {
        viewer.selectedMaterialVariant = selectedMaterialVariant;
    }, [viewer, selectedMaterialVariant]);

    const onAddHotspotClick = useCallback(() => {
        setHotspots((hotspots) => {
            return [
                ...hotspots,
                {
                    name: `HotSpot ${hotspots.length + 1}`,
                    id: performance.now().toString(),
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

    useEffect(() => {
        viewerElement.innerHTML = "";
        for (const hotspot of hotspots) {
            const annotation = new HTML3DAnnotationElement();
            annotation.hotSpot = hotspot.name;
            annotation.innerHTML = createDefaultAnnotation(hotspot.name);
            viewerElement.appendChild(annotation);
        }
    }, [viewerElement, hotspots]);

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(htmlSnippet);
    }, [htmlSnippet]);

    const canRevertAll = useMemo(
        () => canRevertCamera || canRevertAnimationState || canRevertSelectedMaterialVariant,
        [canRevertCamera, canRevertAnimationState, canRevertSelectedMaterialVariant]
    );

    const onRevertAllClick = useCallback(() => {
        revertAnimationState();
        revertCamera();
        onMaterialVariantsRevertClick();
    }, [revertAnimationState, revertCamera, onMaterialVariantsRevertClick]);

    const onResetAllClick = useCallback(() => {
        onSyncEnvironmentChanged();
        resetSkyboxBlur();
        resetClearColor();
        resetToneMapping();
        resetContrast();
        resetExposure();
        resetCamera();
        resetAutoOrbit();
        resetAutoOrbitSpeed();
        resetAutoOrbitDelay();
        resetAnimationState();
        resetAnimationAutoPlay();
        resetSelectedMaterialVariant();
        setHotspots([]);
    }, [
        onSyncEnvironmentChanged,
        resetSkyboxBlur,
        resetClearColor,
        resetToneMapping,
        resetContrast,
        resetExposure,
        resetCamera,
        resetAutoOrbit,
        resetAutoOrbitSpeed,
        resetAutoOrbitDelay,
        resetAnimationState,
        resetAnimationAutoPlay,
        resetSelectedMaterialVariant,
    ]);

    const clearColorWrapper = { clearColor };

    return (
        <div className="ConfiguratorContainer">
            <div className="Sticky">
                <div className="Header">
                    <img className="Logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div className="Title">VIEWER CONFIGURATOR</div>
                </div>
                <LineContainerComponent title="HTML SNIPPET">
                    <div style={{ height: "auto", borderBottom: "0px" }}>
                        <div className="FlexItem" style={{ flex: 1 }}>
                            <TextInputLineComponent multilines={true} value={htmlSnippet} disabled={true} />
                        </div>
                    </div>
                    <div style={{ paddingTop: "0px" }}>
                        <div className="FlexItem" style={{ flex: 5 }}>
                            <ButtonLineComponent label="Reset" onClick={onResetAllClick} />
                        </div>
                        <FontAwesomeIconButton title="Revert all state to snippet" className="FlexItem" icon={faRotateLeft} onClick={onRevertAllClick} disabled={!canRevertAll} />
                        <FontAwesomeIconButton title="Copy html to clipboard" className="FlexItem" icon={faCopy} onClick={copyToClipboard} />
                    </div>
                </LineContainerComponent>
            </div>
            <div>
                <LineContainerComponent title="MODEL">
                    <div>
                        <div className="FlexItem" style={{ flex: 5 }}>
                            <TextInputLineComponent placeholder="Model url" value={modelUrl} onChange={onModelUrlChange} />
                        </div>
                        <FontAwesomeIconButton title="Load from model url" className="FlexItem" icon={faCheck} onClick={() => onModelUrlBlur()} />
                        <FontAwesomeIconButton title="Load local model" className="FlexItem" icon={faUpload} onClick={onLoadModelClick} />
                    </div>
                </LineContainerComponent>
                <LineContainerComponent title="ENVIRONMENT">
                    <div style={{ height: "auto" }}>
                        <MessageLineComponent text="The same environment can be used for both image based lighting (IBL) and the skybox, or different environments can be used for each." />
                    </div>
                    <div>
                        <CheckBoxLineComponent label="Sync Lighting & Skybox" isSelected={() => syncEnvironment} onSelect={onSyncEnvironmentChanged} />
                    </div>
                    <div>
                        <div className="FlexItem" style={{ flex: 5 }}>
                            <TextInputLineComponent
                                key={syncEnvironment ? "env-url" : "light-url"} // Workaround to force re-render TextInputLine (to update placeholder prop on syncEnvironment change)
                                placeholder={syncEnvironment ? "Environment url" : "Lighting url"}
                                value={environmentLightingUrl}
                                onChange={onEnvironmentLightingUrlChange}
                            />
                        </div>
                        <FontAwesomeIconButton
                            title={syncEnvironment ? "Load environment url" : "Load lighting url"}
                            className="FlexItem"
                            icon={faCheck}
                            disabled={!isEnvironmentLightingUrlValid}
                            onClick={() => setNeedsEnvironmentUpdate(true)}
                        />
                        <FontAwesomeIconButton
                            title={syncEnvironment ? "Reset environment" : "Reset lighting"}
                            className="FlexItem"
                            icon={faTrashCan}
                            disabled={!canResetLightingUrl}
                            onClick={onEnvironmentLightingResetClick}
                        />
                    </div>
                    {!syncEnvironment && (
                        <div>
                            <div className="FlexItem" style={{ flex: 5 }}>
                                <TextInputLineComponent placeholder="Skybox url" value={environmentSkyboxUrl} onChange={onEnvironmentSkyboxUrlChange} />
                            </div>
                            <FontAwesomeIconButton title="Load skybox url" className="FlexItem" icon={faCheck} onClick={() => setNeedsEnvironmentUpdate(true)} />
                            <FontAwesomeIconButton
                                title="Reset skybox"
                                className="FlexItem"
                                icon={faTrashCan}
                                disabled={!canResetSkyboxUrl}
                                onClick={onEnvironmentSkyboxResetClick}
                            />
                        </div>
                    )}
                    {hasSkybox && (
                        <div>
                            <div className="FlexItem" style={{ flex: 1 }}>
                                <SliderLineComponent
                                    label="Skybox Blur"
                                    directValue={skyboxBlur}
                                    minimum={0}
                                    maximum={1}
                                    step={0.01}
                                    decimalCount={2}
                                    target={viewerDetails.scene}
                                    onChange={onSkyboxBlurChange}
                                    lockObject={lockObject}
                                />
                            </div>
                            <FontAwesomeIconButton title="Reset skybox blur" className="FlexItem" icon={faTrashCan} disabled={!canResetSkyboxBlur} onClick={resetSkyboxBlur} />
                        </div>
                    )}
                    <div style={{ height: "auto" }}>
                        <div className="FlexItem" style={{ flex: 1 }}>
                            <Color4LineComponent
                                label="Clear color"
                                target={clearColorWrapper}
                                propertyName="clearColor"
                                onChange={() => updateClearColor(clearColorWrapper.clearColor)}
                                lockObject={lockObject}
                            />
                        </div>
                        <FontAwesomeIconButton
                            title="Reset clear color"
                            className="FlexItem"
                            style={{ alignSelf: "flex-start", marginTop: "2px" }}
                            icon={faTrashCan}
                            disabled={!canResetClearColor}
                            onClick={resetClearColor}
                        />
                    </div>
                </LineContainerComponent>
            </div>
            <LineContainerComponent title="POST PROCESSING">
                <div>
                    <div className="FlexItem" style={{ flex: 5 }}>
                        <OptionsLine
                            label="Tone Mapping"
                            valuesAreStrings={true}
                            options={toneMappingOptions}
                            target={toneMappingWrapper}
                            propertyName={"toneMapping"}
                            noDirectUpdate={true}
                            onSelect={onToneMappingChange}
                        />
                    </div>
                    <FontAwesomeIconButton title="Reset tone mapping" className="FlexItem" icon={faTrashCan} disabled={!canResetToneMapping} onClick={resetToneMapping} />
                </div>
                <div>
                    <div className="FlexItem" style={{ flex: 5 }}>
                        <SliderLineComponent label="Contrast" directValue={contrast} minimum={0} maximum={5} step={0.05} lockObject={lockObject} onChange={updateContrast} />
                    </div>
                    <FontAwesomeIconButton title="Reset contrast" className="FlexItem" icon={faTrashCan} disabled={!canResetContrast} onClick={resetContrast} />
                </div>
                <div>
                    <div className="FlexItem" style={{ flex: 5 }}>
                        <SliderLineComponent label="Exposure" directValue={exposure} minimum={0} maximum={5} step={0.05} lockObject={lockObject} onChange={updateExposure} />
                    </div>
                    <FontAwesomeIconButton title="Reset exposure" className="FlexItem" icon={faTrashCan} disabled={!canResetExposure} onClick={resetExposure} />
                </div>
            </LineContainerComponent>
            <LineContainerComponent title="CAMERA">
                <div style={{ height: "auto" }}>
                    <MessageLineComponent text="Position the camera in the viewer, and then click the button below to add the camera pose to the html snippet." />
                </div>
                <div>
                    <div className="FlexItem" style={{ flex: 5 }}>
                        <ButtonLineComponent label="Use Current Pose" onClick={snapshotCamera} />
                    </div>
                    <FontAwesomeIconButton title="Revert camera pose to snippet" className="FlexItem" disabled={!canRevertCamera} icon={faRotateLeft} onClick={revertCamera} />
                    <FontAwesomeIconButton title="Reset camera pose attributes" className="FlexItem" disabled={!canResetCamera} icon={faTrashCan} onClick={resetCamera} />
                </div>
                <div>
                    <CheckBoxLineComponent label="Auto Orbit" isSelected={() => autoOrbit} onSelect={updateAutoOrbit} />
                </div>
                {autoOrbit && (
                    <>
                        <div>
                            <div className="FlexItem" style={{ flex: 5 }}>
                                <SliderLineComponent
                                    label="Speed"
                                    directValue={autoOrbitSpeed}
                                    minimum={0}
                                    maximum={0.524}
                                    step={0.01}
                                    decimalCount={3}
                                    lockObject={lockObject}
                                    onChange={updateAutoOrbitSpeed}
                                />
                            </div>
                            <FontAwesomeIconButton
                                title="Reset auto orbit speed"
                                className="FlexItem"
                                disabled={!canResetAutoOrbitSpeed}
                                icon={faTrashCan}
                                onClick={resetAutoOrbitSpeed}
                            />
                        </div>
                        <div>
                            <div className="FlexItem" style={{ flex: 5 }}>
                                <SliderLineComponent
                                    label="Delay"
                                    directValue={autoOrbitDelay}
                                    minimum={0}
                                    maximum={5000}
                                    step={1}
                                    lockObject={lockObject}
                                    onChange={updateAutoOrbitDelay}
                                />
                            </div>
                            <FontAwesomeIconButton
                                title="Reset auto orbit delay"
                                className="FlexItem"
                                disabled={!canResetAutoOrbitDelay}
                                icon={faTrashCan}
                                onClick={resetAutoOrbitDelay}
                            />
                        </div>
                    </>
                )}
            </LineContainerComponent>
            {hasAnimations && (
                <LineContainerComponent title="ANIMATION">
                    <div style={{ height: "auto" }}>
                        <MessageLineComponent text="Select the animation and animation speed in the viewer, and then click the button below to add those selections to the html snippet." />
                    </div>
                    <div>
                        <div className="FlexItem" style={{ flex: 5 }}>
                            <ButtonLineComponent label="Use Current Selections" onClick={snapshotAnimationState} isDisabled={!hasAnimations} />
                        </div>
                        <FontAwesomeIconButton
                            title="Revert animation state to snippet"
                            className="FlexItem"
                            disabled={!canRevertAnimationState}
                            icon={faRotateLeft}
                            onClick={revertAnimationState}
                        />
                        <FontAwesomeIconButton
                            title="Reset animation state attributes"
                            className="FlexItem"
                            disabled={!canResetAnimationState}
                            icon={faTrashCan}
                            onClick={resetAnimationState}
                        />
                    </div>
                    <div>
                        <CheckBoxLineComponent label="Auto Play" isSelected={() => animationAutoPlay} onSelect={updateAnimationAutoPlay} />
                    </div>
                </LineContainerComponent>
            )}
            {hasMaterialVariants && (
                <LineContainerComponent title="MATERIAL VARIANTS">
                    <div style={{ height: "auto" }}>
                        <MessageLineComponent text="Select the material variant the viewer, and then click the button below to add that selection to the html snippet." />
                    </div>
                    <div>
                        <div className="FlexItem" style={{ flex: 5 }}>
                            <ButtonLineComponent label="Snapshot Current State" onClick={onMaterialVariantsSnapshotClick} isDisabled={!hasMaterialVariants} />
                        </div>
                        <FontAwesomeIconButton
                            title="Revert selected material variant to snippet"
                            className="FlexItem"
                            disabled={!canRevertSelectedMaterialVariant}
                            icon={faRotateLeft}
                            onClick={onMaterialVariantsRevertClick}
                        />
                        <FontAwesomeIconButton
                            title="Reset material variant attribute"
                            className="FlexItem"
                            icon={faTrashCan}
                            onClick={resetSelectedMaterialVariant}
                            disabled={isSelectedMaterialVariantDefault}
                        />
                    </div>
                </LineContainerComponent>
            )}
            <LineContainerComponent title="HOT SPOTS">
                <div style={{ height: "auto" }}>
                    <MessageLineComponent text="Surface hot spots track a point on the surface of a mesh. After adding a surface hot spot, click the target button and then click a point on the model to choose the surface point. After the hotspot point has been selected, optionally orbit the camera to the desired pose and then click the camera button. Annotations are optional child html elements that track a hotspot, and samples are included in the html snippet." />
                </div>
                <div>
                    <div className="FlexItem" style={{ flex: 5 }}>
                        <OptionsLine label="Hot Spot Type" valuesAreStrings={true} options={hotSpotTypeOptions} target={hotSpotTypeOptions} propertyName="" noDirectUpdate={true} />
                    </div>
                    <div onClick={onAddHotspotClick} title="Add Hot Spot">
                        <FontAwesomeIcon icon={faSquarePlus} />
                    </div>
                </div>
                <DndContext sensors={dndSensors} modifiers={hotSpotsDndModifers} collisionDetection={closestCenter} onDragEnd={onHotSpotsReorder}>
                    <SortableContext items={hotspots} strategy={verticalListSortingStrategy}>
                        {hotspots.map((hotspot) => (
                            <HotSpotEntry key={hotspot.id} id={hotspot.id} hotspots={hotspots} setHotspots={setHotspots} viewerElement={viewerElement} />
                        ))}
                    </SortableContext>
                </DndContext>
            </LineContainerComponent>
        </div>
    );
};
