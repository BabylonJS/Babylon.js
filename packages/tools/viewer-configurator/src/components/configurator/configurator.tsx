import "./configurator.scss";
import * as styles from "../../App.module.scss";
// eslint-disable-next-line import/no-internal-modules
import type { ViewerElement, ViewerDetails, Viewer, PostProcessing, CameraAutoOrbit, HotSpot, ToneMapping } from "viewer/index";
// eslint-disable-next-line import/no-internal-modules
import type { Color3, IInspectableOptions, Nullable, Vector3 } from "core/index";
import type { DragEndEvent } from "@dnd-kit/core";

import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faCamera, faGripVertical, faPlus } from "@fortawesome/free-solid-svg-icons";

import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
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
import deleteIcon from "shared-ui-components/imgs/deleteGridElementDark.svg";
import checkboxIcon from "shared-ui-components/imgs/checkboxIconDark.svg";
import adtIcon from "shared-ui-components/imgs/adtIcon.svg";

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
            <img title="Delete Hot Spot" className="ImageButton FlexItem" style={{ alignSelf: "flex-end" }} src={deleteIcon} onClick={onHotspotDeleteClick} />
        </div>
    );
};

export const Configurator: FunctionComponent<{ viewerElement: ViewerElement; viewerDetails: ViewerDetails; viewer: Viewer }> = (props) => {
    const { viewerElement, viewerDetails, viewer } = props;
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

    const originalSkyboxBlur = useMemo(() => viewer?.environmentConfig.blur, [viewer]);
    const originalClearColor = useMemo(() => viewerDetails?.scene.clearColor, [viewerDetails]);
    const originalToneMapping = useMemo(() => viewer?.postProcessing.toneMapping, [viewer]);
    const originalContrast = useMemo(() => viewer?.postProcessing.contrast, [viewer]);
    const originalExposure = useMemo(() => viewer?.postProcessing.exposure, [viewer]);
    // TODO: Viewer should have autoOrbit false by default at the Viewer layer.
    //const originalAutoOrbit = useMemo(() => viewer?.cameraAutoOrbit.enabled, [viewer]);
    const originalAutoOrbit = false;
    const originalAutoOrbitSpeed = useMemo(() => viewer?.cameraAutoOrbit.speed, [viewer]);
    const originalAutoOrbitDelay = useMemo(() => viewer?.cameraAutoOrbit.delay, [viewer]);

    const model = useObservableState(() => viewerDetails?.model, viewer?.onModelChanged);
    const hasAnimations = useMemo(() => viewer && viewer.animations.length > 0, [viewer?.animations]);
    const hasMaterialVariants = useMemo(() => viewer && viewer.materialVariants.length > 0, [viewer?.materialVariants]);

    const [modelUrl, setModelUrl] = useState("https://assets.babylonjs.com/meshes/ufo.glb");
    const [syncEnvironment, setSyncEnvironment] = useState(true);
    const [environmentLightingUrl, setEnvironmentLightingUrl, , isEnvironmentLightingUrlDefault] = useConfiguration("");
    const [environmentSkyboxUrl, setEnvironmentSkyboxUrl, , isEnvironmentSkyboxUrlDefault] = useConfiguration("");
    const [needsEnvironmentUpdate, setNeedsEnvironmentUpdate] = useState(false);
    const hasSkybox = useMemo(() => {
        if (syncEnvironment) {
            return !!environmentLightingUrl;
        }
        return !!environmentSkyboxUrl;
    }, [syncEnvironment, environmentLightingUrl, environmentSkyboxUrl]);
    const [skyboxBlur, setSkyboxBlur, resetSkyboxBlur, isSkyboxBlurDefault] = useConfiguration(originalSkyboxBlur);
    const [clearColor, setClearColor] = useState(originalClearColor);
    const [cameraState, setCameraState] = useState<Readonly<{ alpha: number; beta: number; radius: number; target: Vector3 }>>();
    const isCameraStateDefault = useMemo(() => cameraState == null, [cameraState]);
    const [canRevertCameraState, setCanRevertCameraState] = useState(false);

    useEffect(() => {
        const disposeActions: (() => void)[] = [];
        setCanRevertCameraState(false);
        if (cameraState) {
            setCanRevertCameraState(false);
            const observer = viewerDetails.camera.onViewMatrixChangedObservable.add(() => {
                // TODO: Figure out why the final alpha/beta are as far from the goal value as they are.
                setCanRevertCameraState(
                    !WithinEpsilon(viewerDetails.camera.alpha, cameraState.alpha, Epsilon * 10) ||
                        !WithinEpsilon(viewerDetails.camera.beta, cameraState.beta, Epsilon * 10) ||
                        !WithinEpsilon(viewerDetails.camera.radius, cameraState.radius, Epsilon) ||
                        !viewerDetails.camera.target.equalsWithEpsilon(cameraState.target, Epsilon)
                );
            });
            disposeActions.push(() => observer.remove());
        }
        return () => disposeActions.forEach((dispose) => dispose());
    }, [viewerDetails, cameraState]);

    const [postProcessingState, setPostProcessingState] = useState<Readonly<PostProcessing>>({
        toneMapping: originalToneMapping,
        contrast: originalContrast,
        exposure: originalExposure,
    });

    const isPostProcessingDefaultState = useMemo(() => {
        return {
            toneMapping: postProcessingState.toneMapping === originalToneMapping,
            contrast: postProcessingState.contrast === originalContrast,
            exposure: postProcessingState.exposure === originalExposure,
        };
    }, [postProcessingState]);

    const [autoOrbitState, setAutoOrbitState] = useState<Readonly<CameraAutoOrbit>>({ enabled: originalAutoOrbit, speed: originalAutoOrbitSpeed, delay: originalAutoOrbitDelay });
    const [animationState, setAnimationState] = useState<Readonly<{ animationSpeed: number; selectedAnimation: number }>>();
    const isAnimationStateDefault = useMemo(() => animationState == null, [animationState]);
    const [canRevertAnimationState, setCanRevertAnimationState] = useState(false);

    useEffect(() => {
        const disposeActions: (() => void)[] = [];
        setCanRevertAnimationState(false);
        if (animationState) {
            setCanRevertAnimationState(false);

            const updateCanResetAnimationState = () => {
                setCanRevertAnimationState(animationState.animationSpeed !== viewer.animationSpeed || animationState.selectedAnimation !== viewer.selectedAnimation);
            };

            const selectedAnimationObserver = viewer.onSelectedAnimationChanged.add(updateCanResetAnimationState);
            disposeActions.push(() => selectedAnimationObserver.remove());

            const animationSpeedObserver = viewer.onAnimationSpeedChanged.add(updateCanResetAnimationState);
            disposeActions.push(() => animationSpeedObserver.remove());
        }
        return () => disposeActions.forEach((dispose) => dispose());
    }, [viewer, animationState]);

    const [animationAutoPlay, setAnimationAutoPlay] = useState(false);
    const [selectedMaterialVariant, setSelectedMaterialVariant] = useState<string>();

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
            if (!isSkyboxBlurDefault) {
                attributes.push(`skybox-blur="${skyboxBlur}"`);
            }
        } else {
            if (!clearColor.equals(originalClearColor)) {
                attributes.push(`clear-color="${clearColor.toHexString()}"`);
            }
        }

        if (postProcessingState.toneMapping !== originalToneMapping) {
            attributes.push(`tone-mapping="${postProcessingState.toneMapping}"`);
        }

        if (postProcessingState.contrast !== originalContrast) {
            attributes.push(`contrast="${postProcessingState.contrast.toFixed(1)}"`);
        }

        if (postProcessingState.exposure !== originalExposure) {
            attributes.push(`exposure="${postProcessingState.exposure.toFixed(1)}"`);
        }

        if (cameraState) {
            const { alpha, beta, radius, target } = cameraState;
            attributes.push(`camera-orbit="${alpha.toFixed(3)} ${beta.toFixed(3)} ${radius.toFixed(3)}"`);
            attributes.push(`camera-target="${target.x.toFixed(3)} ${target.y.toFixed(3)} ${target.z.toFixed(3)}"`);
        }

        if (autoOrbitState.enabled !== originalAutoOrbit) {
            attributes.push(`camera-auto-orbit`);
        }

        if (autoOrbitState.enabled && autoOrbitState.speed !== originalAutoOrbitSpeed) {
            attributes.push(`camera-auto-orbit-speed="${autoOrbitState.speed.toFixed(3)}"`);
        }

        if (autoOrbitState.enabled && autoOrbitState.delay !== originalAutoOrbitDelay) {
            attributes.push(`camera-auto-orbit-delay="${autoOrbitState.delay.toFixed(0)}"`);
        }

        if (hasAnimations) {
            if (animationState) {
                const { animationSpeed, selectedAnimation } = animationState;
                attributes.push(`animation-speed="${animationSpeed}"`);
                attributes.push(`selected-animation="${selectedAnimation}"`);
            }

            if (animationAutoPlay) {
                attributes.push(`animation-auto-play`);
            }
        }

        if (hasMaterialVariants && selectedMaterialVariant != null) {
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
        postProcessingState,
        cameraState,
        autoOrbitState,
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
            setEnvironmentLightingUrl(value);
        },
        [setEnvironmentLightingUrl]
    );

    const isEnvironmentSkyboxUrlValid = useMemo(() => {
        return !environmentSkyboxUrl || URL.canParse(environmentSkyboxUrl);
    }, [environmentSkyboxUrl]);

    const onEnvironmentSkyboxUrlChange = useCallback(
        (value: string) => {
            setEnvironmentSkyboxUrl(value);
        },
        [setEnvironmentSkyboxUrl]
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
        setEnvironmentLightingUrl("");
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate, setEnvironmentLightingUrl]);

    const onEnvironmentSkyboxUrlKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                setNeedsEnvironmentUpdate(true);
            }
        },
        [setNeedsEnvironmentUpdate]
    );

    const onEnvironmentSkyboxResetClick = useCallback(() => {
        setEnvironmentSkyboxUrl("");
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate, setEnvironmentSkyboxUrl]);

    const onSyncEnvironmentChanged = useCallback(
        (value?: boolean) => {
            setSyncEnvironment(value ?? true);
            setNeedsEnvironmentUpdate(true);
        },
        [setNeedsEnvironmentUpdate, setSyncEnvironment]
    );

    const onSkyboxBlurChange = useCallback(
        (value?: number) => {
            setSkyboxBlur(value ?? originalSkyboxBlur);
        },
        [setSkyboxBlur]
    );

    useEffect(() => {
        viewerElement.skyboxBlur = skyboxBlur;
    }, [viewerElement, skyboxBlur]);

    const onClearColorChange = useCallback(
        (color?: Color3 | Color4) => {
            let clearColor = originalClearColor;
            if (color) {
                if ("a" in color) {
                    clearColor = color;
                } else {
                    clearColor = Color4.FromColor3(color);
                }
            }

            setClearColor((previous) => {
                if (previous.equals(clearColor)) {
                    return previous;
                }
                return clearColor;
            });
        },
        [setClearColor]
    );

    useEffect(() => {
        viewerElement.clearColor = clearColor;
    }, [viewerElement, clearColor]);

    const onToneMappingChange = useCallback(
        (value?: string | number) => {
            setPostProcessingState((postProcessingState) => {
                return { ...postProcessingState, toneMapping: (value as PostProcessing["toneMapping"]) ?? originalToneMapping };
            });
        },
        [setPostProcessingState]
    );

    const onContrastChange = useCallback(
        (value?: number) => {
            setPostProcessingState((postProcessingState) => {
                return { ...postProcessingState, contrast: value ?? originalContrast };
            });
        },
        [setPostProcessingState]
    );

    const onExposureChange = useCallback(
        (value?: number) => {
            setPostProcessingState((postProcessingState) => {
                return { ...postProcessingState, exposure: value ?? originalExposure };
            });
        },
        [setPostProcessingState]
    );

    useEffect(() => {
        viewer.postProcessing = postProcessingState;
    }, [viewer, postProcessingState]);

    const onCameraSnapshotClick = useCallback(() => {
        const { alpha, beta, radius, target } = viewerDetails.camera;
        setCameraState({ alpha, beta, radius, target });
    }, [viewerDetails]);

    const onCameraRevertClick = useCallback(() => {
        if (cameraState) {
            viewerDetails.camera.interpolateTo(cameraState.alpha, cameraState.beta, cameraState.radius, cameraState.target);
            setCanRevertCameraState(false);
        }
    }, [viewerDetails, cameraState]);

    const onCameraResetClick = useCallback(() => {
        setCameraState(undefined);
    }, []);

    const onAutoOrbitChanged = useCallback(
        (value?: boolean) => {
            setAutoOrbitState((autoOrbitState) => {
                return { ...autoOrbitState, enabled: value ?? originalAutoOrbit };
            });
        },
        [setAutoOrbitState]
    );

    const onAutoOrbitSpeedChange = useCallback(
        (value?: number) => {
            setAutoOrbitState((autoOrbitState) => {
                return { ...autoOrbitState, speed: value ?? originalAutoOrbitSpeed };
            });
        },
        [setAutoOrbitState]
    );

    const onAutoOrbitDelayChange = useCallback(
        (value?: number) => {
            setAutoOrbitState((autoOrbitState) => {
                return { ...autoOrbitState, delay: value ?? originalAutoOrbitDelay };
            });
        },
        [setAutoOrbitState]
    );

    useEffect(() => {
        viewer.cameraAutoOrbit = autoOrbitState;
    }, [viewer, autoOrbitState]);

    const onAnimationSnapshotClick = useCallback(() => {
        setAnimationState({ animationSpeed: viewer.animationSpeed, selectedAnimation: viewer.selectedAnimation });
    }, [viewer]);

    const onAnimationAutoPlayChanged = useCallback(
        (value?: boolean) => {
            setAnimationAutoPlay(value ?? false);
        },
        [setAutoOrbitState]
    );

    const onAnimationRevertClick = useCallback(() => {
        if (animationState) {
            viewer.selectedAnimation = animationState.selectedAnimation;
            viewer.animationSpeed = animationState.animationSpeed;
        }
    }, [viewer, animationState]);

    const onAnimationResetClick = useCallback(() => {
        setAnimationState(undefined);
    }, []);

    const onMaterialVariantsSnapshotClick = useCallback(() => {
        setSelectedMaterialVariant(viewer.selectedMaterialVariant ?? undefined);
    }, [viewer]);

    const onMaterialVariantsResetClick = useCallback(() => {
        setSelectedMaterialVariant(undefined);
    }, []);

    useEffect(() => {
        animationAutoPlay ? viewer.playAnimation() : viewer.pauseAnimation();
    }, [viewer, animationAutoPlay]);

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

    const canRevertAll = useMemo(() => canRevertAnimationState || canRevertCameraState, [canRevertAnimationState, canRevertCameraState]);

    const onRevertAllClick = useCallback(() => {
        onAnimationRevertClick();
        onCameraRevertClick();
    }, [onCameraRevertClick, onAnimationRevertClick]);

    const onResetAllClick = useCallback(() => {
        onSyncEnvironmentChanged();
        onSkyboxBlurChange();
        onClearColorChange();
        onToneMappingChange();
        onContrastChange();
        onExposureChange();
        onCameraResetClick();
        onAutoOrbitChanged();
        onAutoOrbitSpeedChange();
        onAutoOrbitDelayChange();
        onAnimationResetClick();
        onAnimationAutoPlayChanged();
        onMaterialVariantsResetClick();
        setHotspots([]);
    }, [
        onSyncEnvironmentChanged,
        onToneMappingChange,
        onContrastChange,
        onExposureChange,
        onCameraResetClick,
        onAutoOrbitChanged,
        onAutoOrbitSpeedChange,
        onAutoOrbitDelayChange,
        onAnimationResetClick,
        onAnimationAutoPlayChanged,
        onMaterialVariantsResetClick,
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
                        <img className="ImageButton FlexItem" style={{ alignSelf: "flex-end" }} src={deleteIcon} onClick={onRevertAllClick} />
                        <img className="ImageButton FlexItem" style={{ alignSelf: "flex-end" }} src={deleteIcon} onClick={copyToClipboard} />
                    </div>
                </LineContainerComponent>
            </div>
            <div>
                <LineContainerComponent title="MODEL">
                    <div>
                        <div className="FlexItem" style={{ flex: 5 }}>
                            <TextInputLineComponent placeholder="Model url" value={modelUrl} onChange={onModelUrlChange} />
                        </div>
                        <img title="Load from model url" className="FlexItem ImageButton" style={{ alignSelf: "flex-end" }} src={checkboxIcon} onClick={() => onModelUrlBlur()} />
                        <img title="Load local model" className="FlexItem ImageButton" style={{ alignSelf: "flex-end" }} src={adtIcon} onClick={onLoadModelClick} />
                    </div>
                </LineContainerComponent>
                <LineContainerComponent title="ENVIRONMENT">
                    <div>
                        <CheckBoxLineComponent label="Sync Lighting & Skybox" isSelected={() => syncEnvironment} onSelect={onSyncEnvironmentChanged} />
                    </div>
                    <div>
                        <div className="FlexItem" style={{ flex: 5 }}>
                            <TextInputLineComponent
                                placeholder={syncEnvironment ? "Environment url" : "Lighting url"}
                                value={environmentLightingUrl}
                                onChange={onEnvironmentLightingUrlChange}
                            />
                        </div>
                        <img
                            title={syncEnvironment ? "Load environment url" : "Load lighting url"}
                            className="FlexItem ImageButton"
                            style={{ alignSelf: "flex-end" }}
                            src={checkboxIcon}
                            onClick={() => setNeedsEnvironmentUpdate(true)}
                        />
                        <img
                            title={syncEnvironment ? "Reset environment" : "Reset lighting"}
                            className="FlexItem ImageButton"
                            style={{ alignSelf: "flex-end" }}
                            src={deleteIcon}
                            onClick={onEnvironmentLightingResetClick}
                        />
                    </div>
                    {!syncEnvironment && (
                        <div>
                            <div className="FlexItem" style={{ flex: 5 }}>
                                <TextInputLineComponent placeholder="Skybox url" value={environmentSkyboxUrl} onChange={onEnvironmentSkyboxUrlChange} />
                            </div>
                            <img
                                title="Load skybox url"
                                className="FlexItem ImageButton"
                                style={{ alignSelf: "flex-end" }}
                                src={checkboxIcon}
                                onClick={() => setNeedsEnvironmentUpdate(true)}
                            />
                            <img title="Reset skybox" className="FlexItem ImageButton" style={{ alignSelf: "flex-end" }} src={deleteIcon} onClick={onEnvironmentSkyboxResetClick} />
                        </div>
                    )}
                    {hasSkybox && (
                        <div>
                            <div className="FlexItem" style={{ flex: 5 }}>
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
                            <img
                                title="Reset skybox blur"
                                className="FlexItem ImageButton"
                                style={{ alignSelf: "flex-end" }}
                                src={deleteIcon}
                                onClick={() => onSkyboxBlurChange()}
                            />
                        </div>
                    )}
                    <div style={{ height: "auto" }}>
                        <Color3LineComponent
                            label="Clear color"
                            target={clearColorWrapper}
                            propertyName="clearColor"
                            onChange={() => onClearColorChange(clearColorWrapper.clearColor)}
                            lockObject={lockObject}
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
                            target={postProcessingState}
                            propertyName={"toneMapping"}
                            noDirectUpdate={true}
                            onSelect={onToneMappingChange}
                        />
                    </div>
                    <img title="Reset tone mapping" className="ImageButton FlexItem" style={{ alignSelf: "flex-end" }} src={deleteIcon} onClick={() => onToneMappingChange()} />
                </div>
                <div>
                    <div className="FlexItem" style={{ flex: 5 }}>
                        <SliderLineComponent
                            label="Contrast"
                            directValue={postProcessingState.contrast}
                            minimum={0}
                            maximum={5}
                            step={0.05}
                            lockObject={lockObject}
                            onChange={onContrastChange}
                        />
                    </div>
                    <img title="Reset contrast" className="ImageButton FlexItem" style={{ alignSelf: "flex-end" }} src={deleteIcon} onClick={() => onContrastChange()} />
                </div>
                <div>
                    <div className="FlexItem" style={{ flex: 5 }}>
                        <SliderLineComponent
                            label="Exposure"
                            directValue={postProcessingState.exposure}
                            minimum={0}
                            maximum={5}
                            step={0.05}
                            lockObject={lockObject}
                            onChange={onExposureChange}
                        />
                    </div>
                    <img title="Reset exposure" className="ImageButton FlexItem" style={{ alignSelf: "flex-end" }} src={deleteIcon} onClick={() => onExposureChange()} />
                </div>
            </LineContainerComponent>
            <LineContainerComponent title="CAMERA">
                <div>
                    <div className="FlexItem" style={{ flex: 5 }}>
                        <ButtonLineComponent label="Use Current Pose" onClick={onCameraSnapshotClick} />
                    </div>
                    <img
                        title="Revert camera pose to snippet"
                        className="ImageButton FlexItem"
                        style={{ alignSelf: "flex-end", cursor: !canRevertCameraState ? "not-allowed" : undefined }}
                        src={deleteIcon}
                        onClick={onCameraRevertClick}
                    />
                    <img
                        title="Reset camera pose attributes"
                        className="ImageButton FlexItem"
                        style={{ alignSelf: "flex-end", cursor: isCameraStateDefault ? "not-allowed" : undefined }}
                        src={deleteIcon}
                        onClick={onCameraResetClick}
                    />
                </div>
                <div>
                    <CheckBoxLineComponent label="Auto Orbit" isSelected={() => autoOrbitState.enabled} onSelect={onAutoOrbitChanged} />
                </div>
                {autoOrbitState.enabled && (
                    <>
                        <div>
                            <div className="FlexItem" style={{ flex: 5 }}>
                                <SliderLineComponent
                                    label="Speed"
                                    directValue={autoOrbitState.speed}
                                    minimum={0}
                                    maximum={0.524}
                                    step={0.01}
                                    decimalCount={3}
                                    lockObject={lockObject}
                                    onChange={onAutoOrbitSpeedChange}
                                />
                            </div>
                            <img
                                title="Reset auto orbit speed"
                                className="ImageButton FlexItem"
                                style={{ alignSelf: "flex-end" }}
                                src={deleteIcon}
                                onClick={() => onAutoOrbitSpeedChange()}
                            />
                        </div>
                        <div>
                            <div className="FlexItem" style={{ flex: 5 }}>
                                <SliderLineComponent
                                    label="Delay"
                                    directValue={autoOrbitState.delay}
                                    minimum={0}
                                    maximum={5000}
                                    step={1}
                                    lockObject={lockObject}
                                    onChange={onAutoOrbitDelayChange}
                                />
                            </div>
                            <img
                                title="Reset auto orbit delay"
                                className="ImageButton FlexItem"
                                style={{ alignSelf: "flex-end" }}
                                src={deleteIcon}
                                onClick={() => onAutoOrbitDelayChange()}
                            />
                        </div>
                    </>
                )}
            </LineContainerComponent>
            {hasAnimations && (
                <LineContainerComponent title="ANIMATION">
                    <div>
                        <div className="FlexItem" style={{ flex: 5 }}>
                            <ButtonLineComponent label="Use Current Selections" onClick={onAnimationSnapshotClick} isDisabled={!hasAnimations} />
                        </div>
                        <img
                            title="Revert animation state to snippet"
                            className="ImageButton FlexItem"
                            style={{ alignSelf: "flex-end", cursor: !canRevertAnimationState ? "not-allowed" : undefined }}
                            src={deleteIcon}
                            onClick={onAnimationRevertClick}
                        />
                        <img
                            title="Reset animation state attributes"
                            className="ImageButton FlexItem"
                            style={{ alignSelf: "flex-end", cursor: isAnimationStateDefault ? "not-allowed" : undefined }}
                            src={deleteIcon}
                            onClick={onAnimationResetClick}
                        />
                    </div>
                    <div>
                        <CheckBoxLineComponent label="Auto Play" isSelected={() => animationAutoPlay} onSelect={onAnimationAutoPlayChanged} />
                    </div>
                </LineContainerComponent>
            )}
            {hasMaterialVariants && (
                <LineContainerComponent title="MATERIAL VARIANTS">
                    <div>
                        <div className="FlexItem" style={{ flex: 5 }}>
                            <ButtonLineComponent label="Snapshot Current State" onClick={onMaterialVariantsSnapshotClick} isDisabled={!hasMaterialVariants} />
                        </div>
                        <img
                            title="Reset material variant attribute"
                            className="ImageButton FlexItem"
                            style={{ alignSelf: "flex-end" }}
                            src={deleteIcon}
                            onClick={onMaterialVariantsResetClick}
                        />
                    </div>
                </LineContainerComponent>
            )}
            <LineContainerComponent title="HOT SPOTS">
                <div>
                    <div className="FlexItem" style={{ flex: 5 }}>
                        <OptionsLine label="Hot Spot Type" valuesAreStrings={true} options={hotSpotTypeOptions} target={hotSpotTypeOptions} propertyName="" noDirectUpdate={true} />
                    </div>
                    <div onClick={onAddHotspotClick} title="Add Hot Spot">
                        <FontAwesomeIcon icon={faPlus} />
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
