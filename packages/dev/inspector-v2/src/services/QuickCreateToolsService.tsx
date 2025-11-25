import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISceneContext } from "./sceneContext";
import type { IShellService } from "./shellService";

import { makeStyles, tokens, Accordion, AccordionItem, AccordionHeader, AccordionPanel, Text, Popover, PopoverTrigger, PopoverSurface, Input, Button as FluentButton } from "@fluentui/react-components";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { Checkbox } from "shared-ui-components/fluent/primitives/checkbox";
import type { InputOnChangeData } from "@fluentui/react-components";
import { ShellServiceIdentity } from "./shellService";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { CollectionsAdd20Regular, Settings20Regular } from "@fluentui/react-icons";
import { SceneContextIdentity } from "./sceneContext";
import { useObservableState } from "../hooks/observableHooks";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { PointLight } from "core/Lights/pointLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { SpotLight } from "core/Lights/spotLight";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { UniversalCamera } from "core/Cameras/universalCamera";
import { FilesInput } from "core/Misc/filesInput";
import { ParticleSystem } from "core/Particles/particleSystem";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
import { Texture } from "core/Materials/Textures/texture";

// Side-effect import needed for GPUParticleSystem
import "core/Particles/webgl2ParticleSystem";

type XYZ = { x: number; y: number; z: number };

type SphereParams = {
    name: string;
    segments: number;
    diameter: number;
    diameterX: number;
    diameterY: number;
    diameterZ: number;
    arc: number;
    slice: number;
    uniform: boolean;
};

type BoxParams = {
    name: string;
    size: number;
    width: number;
    height: number;
    depth: number;
};

type CylinderParams = {
    name: string;
    height: number;
    diameterTop: number;
    diameterBottom: number;
    diameter: number;
    tessellation: number;
    subdivisions: number;
    arc: number;
};

type ConeParams = {
    name: string;
    height: number;
    diameter: number;
    diameterTop: number;
    diameterBottom: number;
    tessellation: number;
    subdivisions: number;
    arc: number;
};

type GroundParams = {
    name: string;
    width: number;
    height: number;
    subdivisions: number;
    subdivisionsX: number;
    subdivisionsY: number;
};

type SpotlightParams = {
    name: string;
    position: XYZ;
    direction: XYZ;
    angle: number;
    exponent: number;
};

type ArcRotateCameraParams = {
    name: string;
    target: XYZ;
    radius: number;
    alpha: number;
    beta: number;
    useRadians: boolean;
};

type UniversalCameraParams = {
    name: string;
    position: XYZ;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
    },
    scrollArea: {
        flex: 1,
        overflowY: "auto",
        paddingRight: tokens.spacingHorizontalS,
        paddingBottom: tokens.spacingVerticalS,
    },
    section: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
    },
});

const setCamera = function(scene:Scene) {
    const camera = scene.activeCamera as ArcRotateCamera;
    if (camera && camera.radius !== undefined) {
        camera.radius = 5;
    }
}

// TODO: This is just a placeholder for a dynamically installed extension that brings in asset creation tools (node materials, etc.).
export const CreateToolsServiceDefinition: ServiceDefinition<[], [IShellService, ISceneContext]> = {
    friendlyName: "Creation Tools",
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    factory: (shellService, sceneContext) => {
        const registration = shellService.addSidePane({
            key: "Create",
            title: "Creation Tools",
            icon: CollectionsAdd20Regular,
            horizontalLocation: "left",
            verticalLocation: "top",
            content: () => {
                const classes = useStyles();

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                // eslint-disable-next-line no-console
                console.log(scene);

                const [spherePopoverOpen, setSpherePopoverOpen] = useState(false);
                const [sphereParams, setSphereParams] = useState<SphereParams>({
                    name: "Sphere",
                    segments: 32,
                    diameter: 1,
                    diameterX: 1,
                    diameterY: 1,
                    diameterZ: 1,
                    arc: 1,
                    slice: 1,
                    uniform: true,
                });

                const handleSphereParamChange = <K extends keyof SphereParams>(key: K, value: SphereParams[K]) => {
                    setSphereParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const [boxPopoverOpen, setBoxPopoverOpen] = useState(false);
                const [boxParams, setBoxParams] = useState<BoxParams>({
                    name: "Box",
                    size: 1,
                    width: 1,
                    height: 1,
                    depth: 1,
                });

                const handleBoxParamChange = <K extends keyof BoxParams>(key: K, value: BoxParams[K]) => {
                    setBoxParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const [cylinderPopoverOpen, setCylinderPopoverOpen] = useState(false);
                const [cylinderParams, setCylinderParams] = useState<CylinderParams>({
                    name: "Cylinder",
                    height: 2,
                    diameterTop: 1,
                    diameterBottom: 1,
                    diameter: 1,
                    tessellation: 32,
                    subdivisions: 1,
                    arc: 1,
                });

                const handleCylinderParamChange = <K extends keyof CylinderParams>(key: K, value: CylinderParams[K]) => {
                    setCylinderParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const [conePopoverOpen, setConePopoverOpen] = useState(false);
                const [coneParams, setConeParams] = useState<ConeParams>({
                    name: "Cone",
                    height: 2,
                    diameter: 1,
                    diameterTop: 0,
                    diameterBottom: 1,
                    tessellation: 32,
                    subdivisions: 1,
                    arc: 1,
                });

                const [isUpChecked, setIsUpChecked] = useState(false);
                const [isDownChecked, setIsDownChecked] = useState(false);

                const handleConeParamChange = <K extends keyof ConeParams>(key: K, value: ConeParams[K]) => {
                    setConeParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const [groundPopoverOpen, setGroundPopoverOpen] = useState(false);
                const [groundParams, setGroundParams] = useState<GroundParams>({
                    name: "Ground",
                    width: 10,
                    height: 10,
                    subdivisions: 1,
                    subdivisionsX: 1,
                    subdivisionsY: 1,
                });

                const handleGroundParamChange = <K extends keyof GroundParams>(key: K, value: GroundParams[K]) => {
                    setGroundParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const [nodeMaterialPopoverOpen, setNodeMaterialPopoverOpen] = useState(false);
                const [nodeMaterialName, setNodeMaterialName] = useState("NodeMaterial");
                const [nodeMaterialSnippetId, setNodeMaterialSnippetId] = useState("");

                const [pointLightPopoverOpen, setPointLightPopoverOpen] = useState(false);
                const [pointLightName, setPointLightName] = useState("PointLight");
                const [pointLightPosition, setPointLightPosition] = useState<XYZ>({ x: 0, y: 5, z: 0 });

                const [directionalLightPopoverOpen, setDirectionalLightPopoverOpen] = useState(false);
                const [directionalLightName, setDirectionalLightName] = useState("DirectionalLight");
                const [directionalLightDirection, setDirectionalLightDirection] = useState<XYZ>({ x: 1, y: -1, z: 0 });

                const [spotlightPopoverOpen, setSpotlightPopoverOpen] = useState(false);
                const [spotlightParams, setSpotlightParams] = useState<SpotlightParams>({
                    name: "Spotlight",
                    position: { x: 0, y: 5, z: 0 },
                    direction: { x: 0, y: -1, z: 0 },
                    angle: 1,
                    exponent: 1,
                });

                const fileInputRef = useRef<HTMLInputElement | null>(null);
                const [importMeshPopoverOpen, setImportMeshPopoverOpen] = useState(false);
                const [importMeshName, setImportMeshName] = useState("ImportedMesh");

                const [cpuParticleSystemPopoverOpen, setCpuParticleSystemPopoverOpen] = useState(false);
                const [cpuParticleSystemName, setCpuParticleSystemName] = useState("ParticleSystem");
                const [cpuParticleSystemCapacity, setCpuParticleSystemCapacity] = useState(2000);

                const [gpuParticleSystemPopoverOpen, setGpuParticleSystemPopoverOpen] = useState(false);
                const [gpuParticleSystemName, setGpuParticleSystemName] = useState("GPUParticleSystem");
                const [gpuParticleSystemCapacity, setGpuParticleSystemCapacity] = useState(2000);

                const [nodeParticleSystemPopoverOpen, setNodeParticleSystemPopoverOpen] = useState(false);
                const [nodeParticleSystemName, setNodeParticleSystemName] = useState("NodeParticleSystem");
                const [nodeParticleSystemSnippetId, setNodeParticleSystemSnippetId] = useState("");

                // Camera state
                const [arcRotateCameraPopoverOpen, setArcRotateCameraPopoverOpen] = useState(false);
                const [arcRotateCameraParams, setArcRotateCameraParams] = useState<ArcRotateCameraParams>({
                    name: "ArcRotateCamera",
                    target: { x: 0, y: 0, z: 0 },
                    radius: 10,
                    alpha: 0,
                    beta: 45,
                    useRadians: false,
                });

                const handleArcRotateCameraParamChange = <K extends keyof ArcRotateCameraParams>(key: K, value: ArcRotateCameraParams[K]) => {
                    setArcRotateCameraParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const [universalCameraPopoverOpen, setUniversalCameraPopoverOpen] = useState(false);
                const [universalCameraParams, setUniversalCameraParams] = useState<UniversalCameraParams>({
                    name: "UniversalCamera",
                    position: { x: 0, y: 1, z: -10 },
                });

                const handleUniversalCameraParamChange = <K extends keyof UniversalCameraParams>(key: K, value: UniversalCameraParams[K]) => {
                    setUniversalCameraParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const handleLocalMeshImport = (event: ChangeEvent<HTMLInputElement>) => {
                    if (!scene) {
                        alert("No scene available.");
                        event.target.value = "";
                        return;
                    }

                    const files = event.target.files;
                    if (!files || files.length === 0) {
                        return;
                    }

                    const filesArray = Array.from(files);
                    if (importMeshName.trim().length > 0 && filesArray.length > 0) {
                        const originalFile = filesArray[0];
                        const extensionIndex = originalFile.name.lastIndexOf(".");
                        const extension = extensionIndex >= 0 ? originalFile.name.substring(extensionIndex) : "";
                        const sanitizedName = importMeshName.trim();
                        const desiredFileName = sanitizedName.toLowerCase().endsWith(extension.toLowerCase()) ? sanitizedName : `${sanitizedName}${extension}`;
                        filesArray[0] = new File([originalFile], desiredFileName, { type: originalFile.type, lastModified: originalFile.lastModified });
                    }

                    const filesInput = new FilesInput(
                        scene.getEngine(),
                        scene,
                        () => {
                            setCamera(scene);
                        },
                        null,
                        null,
                        null,
                        null,
                        null,
                        (_sceneFile, _scene, message) => {
                            alert(message ? `Failed to import mesh: ${message}` : "Failed to import mesh.");
                        },
                        true
                    );

                    filesInput.displayLoadingUI = false;
                    filesInput.loadFiles({ target: { files: filesArray } });
                    filesInput.dispose();

                    event.target.value = "";
                };

                const handleSpotlightParamChange = <K extends keyof SpotlightParams>(key: K, value: SpotlightParams[K]) => {
                    setSpotlightParams(prev => ({
                        ...prev,
                        [key]: value,
                    }));
                };

                const handleSpotlightPositionChange = (axis: keyof XYZ, value: number) => {
                    setSpotlightParams(prev => ({
                        ...prev,
                        position: {
                            ...prev.position,
                            [axis]: value,
                        },
                    }));
                };

                const handleSpotlightDirectionChange = (axis: keyof XYZ, value: number) => {
                    setSpotlightParams(prev => ({
                        ...prev,
                        direction: {
                            ...prev.direction,
                            [axis]: value,
                        },
                    }));
                };

                const [pbrMaterialPopoverOpen, setPbrMaterialPopoverOpen] = useState(false);
                const [pbrMaterialName, setPbrMaterialName] = useState("PBRMaterial");

                const [standardMaterialPopoverOpen, setStandardMaterialPopoverOpen] = useState(false);
                const [standardMaterialName, setStandardMaterialName] = useState("StandardMaterial");

                return (
                    <div className={classes.container}>
                        <div className={classes.scrollArea}>
                        <Accordion collapsible multiple>
                            <AccordionItem key="Meshes" value="Meshes">
                                <AccordionHeader expandIconPosition="end">
                                    <Text size={500}>Meshes</Text>
                                </AccordionHeader>
                                <AccordionPanel>
                                    <div className={classes.section}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        MeshBuilder.CreateSphere("Sphere", {}, scene);
                                                        setCamera(scene);
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                                label="Sphere"
                                            />
                                            <Popover
                                                open={spherePopoverOpen}
                                                onOpenChange={(_, data) => setSpherePopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="Sphere Options"
                                                        style={{
                                                            borderTopLeftRadius: 0,
                                                            borderBottomLeftRadius: 0,
                                                            marginLeft: -1, // visually connects the buttons
                                                            height: "100%", // match main button height
                                                        }}
                                                        onClick={() => setSpherePopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Name and Segments */}
            { ([
                { label: "Name", key: "name" },
                { label: "Segments", key: "segments" },
            ] as const).map(({ label, key }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                    <Input
                        type={key === "name" ? "text" : "number"}
                        value={String(sphereParams[key])}
                        onChange={(_, data: InputOnChangeData) => handleSphereParamChange(key, key === "name" ? data.value : Number(data.value))}
                        aria-label={label}
                        style={{ flex: "1 1 auto" }}
                    />
                </div>
            ))}
            {/* Diameter */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ flex: "0 0 100px" }}>Diameter</label>
                <Input
                    type="number"
                    value={sphereParams.diameter.toString()}
                    onChange={(_, data: InputOnChangeData) => handleSphereParamChange("diameter", Number(data.value))}
                    aria-label="Diameter"
                    style={{ flex: "1 1 auto" }}
                    disabled={!sphereParams.uniform}
                />
            </div>
            {/* Uniform checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 108, marginTop: -8, marginBottom: 4 }}>
                <Checkbox
                    value={sphereParams.uniform}
                    onChange={(checked) => handleSphereParamChange("uniform", checked)}
                    aria-label="Uniform"
                />
                <span style={{ fontSize: 13 }}>Uniform</span>
            </div>
            {/* Diameter X/Y/Z in a single row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ flex: "0 0 100px" }}>Diameter X/Y/Z</label>
                <Input
                    type="number"
                    value={sphereParams.diameterX.toString()}
                    onChange={(_, data: InputOnChangeData) => handleSphereParamChange("diameterX", Number(data.value))}
                    aria-label="Diameter X"
                    style={{ width: 60 }}
                    placeholder="X"
                    disabled={sphereParams.uniform}
                />
                <Input
                    type="number"
                    value={sphereParams.diameterY.toString()}
                    onChange={(_, data: InputOnChangeData) => handleSphereParamChange("diameterY", Number(data.value))}
                    aria-label="Diameter Y"
                    style={{ width: 60 }}
                    placeholder="Y"
                    disabled={sphereParams.uniform}
                />
                <Input
                    type="number"
                    value={sphereParams.diameterZ.toString()}
                    onChange={(_, data: InputOnChangeData) => handleSphereParamChange("diameterZ", Number(data.value))}
                    aria-label="Diameter Z"
                    style={{ width: 60 }}
                    placeholder="Z"
                    disabled={sphereParams.uniform}
                />
            </div>
            {/* Arc and Slice */}
            { ([
                { label: "Arc", key: "arc" },
                { label: "Slice", key: "slice" },
            ] as const).map(({ label, key }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                    <Input
                        type="number"
                        value={String(sphereParams[key])}
                        onChange={(_, data: InputOnChangeData) => handleSphereParamChange(key, Number(data.value))}
                        aria-label={label}
                        style={{ flex: "1 1 auto" }}
                    />
                </div>
            ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={() => setSpherePopoverOpen(false)} label="Cancel" />
            <Button
                appearance={"primary" as any}
                onClick={() => {
                    if (scene) {
                        // Create params object based on uniform checkbox
                        const createParams: Partial<SphereParams> = {
                            segments: sphereParams.segments,
                            arc: sphereParams.arc,
                            slice: sphereParams.slice,
                        };
                        
                        if (sphereParams.uniform) {
                            // If uniform is checked, use diameter
                            createParams.diameter = sphereParams.diameter;
                        } else {
                            // If uniform is unchecked, use individual diameters
                            createParams.diameterX = sphereParams.diameterX;
                            createParams.diameterY = sphereParams.diameterY;
                            createParams.diameterZ = sphereParams.diameterZ;
                        }
                        
                        MeshBuilder.CreateSphere(sphereParams.name, createParams, scene);
                        setCamera(scene);
                    }
                    setSpherePopoverOpen(false);
                }}
                label="Create"
            />
        </div>
    </div>
</PopoverSurface>
                                            </Popover>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        MeshBuilder.CreateBox("Box", {}, scene);
                                                        setCamera(scene);
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                                label="Box"
                                            />
                                            <Popover
                                                open={boxPopoverOpen}
                                                onOpenChange={(_, data) => setBoxPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="Box Options"
                                                        onClick={() => setBoxPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            {([
                                                                { label: "Name", key: "name" },
                                                                { label: "Size", key: "size" },
                                                                { label: "Width", key: "width" },
                                                                { label: "Height", key: "height" },
                                                                { label: "Depth", key: "depth" },
                                                            ] as const).map(({ label, key }) => (
                                                                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                                                                    <Input
                                                                        type={key === "name" ? "text" : "number"}
                                                                        value={String(boxParams[key])}
                                                                        onChange={(_, data: InputOnChangeData) => handleBoxParamChange(key, key === "name" ? data.value : Number(data.value))}
                                                                        aria-label={label}
                                                                        style={{ flex: "1 1 auto" }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button onClick={() => setBoxPopoverOpen(false)} label="Cancel" />
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        MeshBuilder.CreateBox(boxParams.name, boxParams, scene);
                                                                        setCamera(scene);
                                                                    }
                                                                    setBoxPopoverOpen(false);
                                                                }}
                                                                label="Create"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        MeshBuilder.CreateCylinder("Cylinder", {}, scene);
                                                        setCamera(scene);
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                                label="Cylinder"
                                            />
                                            <Popover
                                                open={cylinderPopoverOpen}
                                                onOpenChange={(_, data) => setCylinderPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="Cylinder Options"
                                                        onClick={() => setCylinderPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            {([
                                                                { label: "Name", key: "name" },
                                                                { label: "Height", key: "height" },
                                                                { label: "Diameter Top", key: "diameterTop" },
                                                                { label: "Diameter Bottom", key: "diameterBottom" },
                                                                { label: "Diameter", key: "diameter" },
                                                                { label: "Tessellation", key: "tessellation" },
                                                                { label: "Subdivisions", key: "subdivisions" },
                                                                { label: "Arc", key: "arc" },
                                                            ] as const).map(({ label, key }) => (
                                                                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                                                                    <Input
                                                                        type={key === "name" ? "text" : "number"}
                                                                        value={String(cylinderParams[key])}
                                                                        onChange={(_, data: InputOnChangeData) => handleCylinderParamChange(key, key === "name" ? data.value : Number(data.value))}
                                                                        aria-label={label}
                                                                        style={{ flex: "1 1 auto" }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button onClick={() => setCylinderPopoverOpen(false)} label="Cancel" />
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        MeshBuilder.CreateCylinder(cylinderParams.name, cylinderParams, scene);
                                                                        setCamera(scene);
                                                                    }
                                                                    setCylinderPopoverOpen(false);
                                                                }}
                                                                label="Create"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        MeshBuilder.CreateCylinder("Cone", { diameterTop: 0 }, scene);
                                                        setCamera(scene);
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                                label="Cone"
                                            />
                                            <Popover
                                                open={conePopoverOpen}
                                                onOpenChange={(_, data) => setConePopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="Cone Options"
                                                        onClick={() => setConePopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            {([
                                                                { label: "Name", key: "name" },
                                                                { label: "Height", key: "height" },
                                                                { label: "Diameter", key: "diameter" },
                                                                { label: "Tessellation", key: "tessellation" },
                                                                { label: "Subdivisions", key: "subdivisions" },
                                                                { label: "Arc", key: "arc" },
                                                            ] as const).map(({ label, key }) => (
                                                                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                                                                    <Input
                                                                        type={key === "name" ? "text" : "number"}
                                                                        value={String(coneParams[key])}
                                                                        onChange={(_, data: InputOnChangeData) => handleConeParamChange(key, key === "name" ? data.value : Number(data.value))}
                                                                        aria-label={label}
                                                                        style={{ flex: "1 1 auto" }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <label style={{ flex: "0 0 100px" }}>Up</label>
                                                            <Checkbox
                                                                value={isUpChecked}
                                                                onChange={() => {
                                                                    setIsUpChecked(true);
                                                                    setIsDownChecked(false);
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <label style={{ flex: "0 0 100px" }}>Down</label>
                                                            <Checkbox
                                                                value={isDownChecked}
                                                                onChange={() => {
                                                                    setIsUpChecked(false);
                                                                    setIsDownChecked(true);
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button onClick={() => setConePopoverOpen(false)} label="Cancel" />
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        const coneParamsToUse = {
                                                                            ...coneParams,
                                                                            diameterTop: isUpChecked ? 0 : coneParams.diameterTop,
                                                                            diameterBottom: isDownChecked ? 0 : coneParams.diameterBottom,
                                                                        };
                                                                        MeshBuilder.CreateCylinder(coneParams.name, coneParamsToUse, scene);
                                                                        setCamera(scene);
                                                                    }
                                                                    setConePopoverOpen(false);
                                                                }}
                                                                label="Create"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        MeshBuilder.CreateGround("Ground", {}, scene);
                                                        setCamera(scene);
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                                label="Ground"
                                            />
                                            <Popover
                                                open={groundPopoverOpen}
                                                onOpenChange={(_, data) => setGroundPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="Ground Options"
                                                        onClick={() => setGroundPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            {([
                                                                { label: "Name", key: "name" },
                                                                { label: "Width", key: "width" },
                                                                { label: "Height", key: "height" },
                                                                { label: "Subdivisions", key: "subdivisions" },
                                                                { label: "Subdivisions X", key: "subdivisionsX" },
                                                                { label: "Subdivisions Y", key: "subdivisionsY" },
                                                            ] as const).map(({ label, key }) => (
                                                                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                                                                    <Input
                                                                        type={key === "name" ? "text" : "number"}
                                                                        value={String(groundParams[key])}
                                                                        onChange={(_, data: InputOnChangeData) => handleGroundParamChange(key, key === "name" ? data.value : Number(data.value))}
                                                                        aria-label={label}
                                                                        style={{ flex: "1 1 auto" }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button onClick={() => setGroundPopoverOpen(false)} label="Cancel" />
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        MeshBuilder.CreateGround(groundParams.name, groundParams, scene);
                                                                        setCamera(scene);
                                                                    }
                                                                    setGroundPopoverOpen(false);
                                                                }}
                                                                label="Create"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (!scene) {
                                                        alert("No scene available.");
                                                        return;
                                                    }
                                                    fileInputRef.current?.click();
                                                }}
                                                label="Import Mesh"
                                            />
                                            <Popover
                                                open={importMeshPopoverOpen}
                                                onOpenChange={(_, data) => setImportMeshPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="Import Mesh Options"
                                                        style={{
                                                            borderTopLeftRadius: 0,
                                                            borderBottomLeftRadius: 0,
                                                            marginLeft: -1,
                                                            height: "100%",
                                                        }}
                                                        onClick={() => setImportMeshPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <label style={{ flex: "0 0 100px" }}>Name</label>
                                                            <Input
                                                                type="text"
                                                                value={importMeshName}
                                                                onChange={(_, data: InputOnChangeData) => setImportMeshName(data.value)}
                                                                aria-label="Import Mesh Name"
                                                                style={{ flex: "1 1 auto" }}
                                                            />
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={() => {
                                                                    if (!scene) {
                                                                        alert("No scene available.");
                                                                        return;
                                                                    }
                                                                    setImportMeshPopoverOpen(false);
                                                                    fileInputRef.current?.click();
                                                                }}
                                                                label="Import"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".babylon,.glb,.gltf,.obj,.stl,.ply,.mesh,.babylonmeshdata"
                                                multiple
                                                style={{ display: "none" }}
                                                onChange={handleLocalMeshImport}
                                            />
                                        </div>
                                    </div>
                                </AccordionPanel>
                            </AccordionItem>
                            <AccordionItem key="Materials" value="Materials">
    <AccordionHeader expandIconPosition="end">
        <Text size={500}>Materials</Text>
    </AccordionHeader>
    <AccordionPanel>
        <div className={classes.section}>
            {/* Node Material */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Button
                    onClick={async () => {
                        if (scene) {
                            if (nodeMaterialSnippetId) {
                                try {
                                    // Try to load from snippet
                                    const nodeMaterial = await NodeMaterial.ParseFromSnippetAsync(nodeMaterialSnippetId, scene);
                                    nodeMaterial.name = nodeMaterialName;
                                } catch (e) {
                                    alert("Failed to load Node Material from snippet: " + e);
                                }
                            } else {
                                // Create default node material
                                const nodeMaterial = new NodeMaterial(nodeMaterialName, scene);
                                nodeMaterial.build();
                            }
                        } else {
                            alert("No scene available.");
                        }
                    }}
                    label="Node Material"
                />
                <Popover
                    open={nodeMaterialPopoverOpen}
                    onOpenChange={(_, data) => setNodeMaterialPopoverOpen(data.open)}
                    positioning={{
                        align: "start",
                        overflowBoundary: document.body,
                        autoSize: true,
                    }}
                    trapFocus
                >
                    <PopoverTrigger disableButtonEnhancement>
                        <FluentButton
                            icon={<Settings20Regular />}
                            appearance="subtle"
                            title="Node Material Options"
                            style={{
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                                marginLeft: -1,
                                height: "100%",
                            }}
                            onClick={() => setNodeMaterialPopoverOpen(true)}
                        />
                    </PopoverTrigger>
                    <PopoverSurface>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <label style={{ flex: "0 0 100px" }}>Name</label>
                                    <Input
                                        type="text"
                                        value={nodeMaterialName}
                                        onChange={e => setNodeMaterialName(e.target.value)}
                                        aria-label="Name"
                                        style={{ flex: "1 1 auto" }}
                                    />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <label style={{ flex: "0 0 100px" }}>Snippet ID</label>
                                    <Input
                                        type="text"
                                        value={nodeMaterialSnippetId}
                                        onChange={e => setNodeMaterialSnippetId(e.target.value)}
                                        aria-label="Snippet ID"
                                        style={{ flex: "1 1 auto" }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                <Button onClick={() => setNodeMaterialPopoverOpen(false)} label="Cancel" />
                                <Button
                                    appearance={"primary" as any}
                                    onClick={async () => {
                                        if (scene) {
                                            if (nodeMaterialSnippetId) {
                                                try {
                                                    const nodeMaterial = await NodeMaterial.ParseFromSnippetAsync(nodeMaterialSnippetId, scene);
                                                    nodeMaterial.name = nodeMaterialName;
                                                } catch (e) {
                                                    alert("Failed to load Node Material from snippet: " + e);
                                                }
                                            } else {
                                                const nodeMaterial = new NodeMaterial(nodeMaterialName, scene);
                                                nodeMaterial.build();
                                            }
                                        } else {
                                            alert("No scene available.");
                                        }
                                        setNodeMaterialPopoverOpen(false);
                                    }}
                                    label="Create"
                                />
                            </div>
                        </div>
                    </PopoverSurface>
                </Popover>
            </div>

            {/* PBR Material */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Button
                    onClick={() => {
                        if (scene) {
                            new PBRMaterial(pbrMaterialName, scene);
                            // Optionally, you can add the material to the scene or log it
                        } else {
                            alert("No scene available.");
                        }
                    }}
                    label="PBR Material"
                />
                <Popover
                    open={pbrMaterialPopoverOpen}
                    onOpenChange={(_, data) => setPbrMaterialPopoverOpen(data.open)}
                    positioning={{
                        align: "start",
                        overflowBoundary: document.body,
                        autoSize: true,
                    }}
                    trapFocus
                >
                    <PopoverTrigger disableButtonEnhancement>
                        <FluentButton
                            icon={<Settings20Regular />}
                            appearance="subtle"
                            title="PBR Material Options"
                            style={{
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                                marginLeft: -1,
                                height: "100%",
                            }}
                            onClick={() => setPbrMaterialPopoverOpen(true)}
                        />
                    </PopoverTrigger>
                    <PopoverSurface>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <label style={{ flex: "0 0 100px" }}>Name</label>
                                    <Input
                                        type="text"
                                        value={pbrMaterialName}
                                        onChange={e => setPbrMaterialName(e.target.value)}
                                        aria-label="Name"
                                        style={{ flex: "1 1 auto" }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                <Button onClick={() => setPbrMaterialPopoverOpen(false)} label="Cancel" />
                                <Button
                                    appearance={"primary" as any}
                                    onClick={() => {
                                        if (scene) {
                                            new PBRMaterial(pbrMaterialName, scene);
                                            // Optionally, you can add the material to the scene or log it
                                        } else {
                                            alert("No scene available.");
                                        }
                                        setPbrMaterialPopoverOpen(false);
                                    }}
                                    label="Create"
                                />
                            </div>
                        </div>
                    </PopoverSurface>
                </Popover>
            </div>

            {/* Standard Material */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Button
                    onClick={() => {
                        if (scene) {
                            new StandardMaterial(standardMaterialName, scene);
                            // Optionally, you can add the material to the scene or log it
                        } else {
                            alert("No scene available.");
                        }
                    }}
                    label="Standard Material"
                />
                <Popover
                    open={standardMaterialPopoverOpen}
                    onOpenChange={(_, data) => setStandardMaterialPopoverOpen(data.open)}
                    positioning={{
                        align: "start",
                        overflowBoundary: document.body,
                        autoSize: true,
                    }}
                    trapFocus
                >
                    <PopoverTrigger disableButtonEnhancement>
                        <FluentButton
                            icon={<Settings20Regular />}
                            appearance="subtle"
                            title="Standard Material Options"
                            style={{
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                                marginLeft: -1,
                                height: "100%",
                            }}
                            onClick={() => setStandardMaterialPopoverOpen(true)}
                        />
                    </PopoverTrigger>
                    <PopoverSurface>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <label style={{ flex: "0 0 100px" }}>Name</label>
                                    <Input
                                        type="text"
                                        value={standardMaterialName}
                                        onChange={e => setStandardMaterialName(e.target.value)}
                                        aria-label="Name"
                                        style={{ flex: "1 1 auto" }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                <Button onClick={() => setStandardMaterialPopoverOpen(false)} label="Cancel" />
                                <Button
                                    appearance={"primary" as any}
                                    onClick={() => {
                                        if (scene) {
                                            new StandardMaterial(standardMaterialName, scene);
                                            // Optionally, you can add the material to the scene or log it
                                        } else {
                                            alert("No scene available.");
                                        }
                                        setStandardMaterialPopoverOpen(false);
                                    }}
                                    label="Create"
                                />
                            </div>
                        </div>
                    </PopoverSurface>
                </Popover>
            </div>
        </div>
    </AccordionPanel>
</AccordionItem>
                            <AccordionItem key="Lights" value="Lights">
                                <AccordionHeader expandIconPosition="end">
                                    <Text size={500}>Lights</Text>
                                </AccordionHeader>
                                <AccordionPanel>
                                    <div className={classes.section}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        const light = new PointLight("PointLight", new Vector3(0, 5, 0), scene);
                                                        light.intensity = 1.0;
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                                label="Point Light"
                                            />
                                            <Popover
                                                open={pointLightPopoverOpen}
                                                onOpenChange={(_, data) => setPointLightPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="Point Light Options"
                                                        style={{
                                                            borderTopLeftRadius: 0,
                                                            borderBottomLeftRadius: 0,
                                                            marginLeft: -1,
                                                            height: "100%",
                                                        }}
                                                        onClick={() => setPointLightPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Name</label>
                                                                <Input
                                                                    type="text"
                                                                    value={pointLightName}
                                                                    onChange={(_, data: InputOnChangeData) => setPointLightName(data.value)}
                                                                    aria-label="Name"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Position</label>
                                                                <div style={{ display: "flex", gap: 8 }}>
                                                                    {(["x", "y", "z"] as const).map(axis => (
                                                                        <div key={axis} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                            <label>{axis}</label>
                                                                            <Input
                                                                                type="number"
                                                                                value={pointLightPosition[axis].toString()}
                                                                                onChange={(_, data: InputOnChangeData) =>
                                                                                    setPointLightPosition(prev => ({
                                                                                        ...prev,
                                                                                        [axis]: Number(data.value),
                                                                                    }))
                                                                                }
                                                                                aria-label={`Position ${axis.toUpperCase()}`}
                                                                                style={{ width: 60 }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button onClick={() => setPointLightPopoverOpen(false)} label="Cancel" />
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        const light = new PointLight(pointLightName, new Vector3(pointLightPosition.x, pointLightPosition.y, pointLightPosition.z), scene);
                                                                        light.intensity = 1.0;
                                                                    } else {
                                                                        alert("No scene available.");
                                                                    }
                                                                    setPointLightPopoverOpen(false);
                                                                }}
                                                                label="Create"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        const dirLight = new DirectionalLight("DirectionalLight", new Vector3(1, -1, 0), scene);
                                                        dirLight.intensity = 1;
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                                label="Directional Light"
                                            />
                                            <Popover
                                                open={directionalLightPopoverOpen}
                                                onOpenChange={(_, data) => setDirectionalLightPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="Directional Light Options"
                                                        onClick={() => setDirectionalLightPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Name</label>
                                                                <Input
                                                                    type="text"
                                                                    value={directionalLightName}
                                                                    onChange={(_, data: InputOnChangeData) => setDirectionalLightName(data.value)}
                                                                    aria-label="Name"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Direction</label>
                                                                <div style={{ display: "flex", gap: 8 }}>
                                                                    {(["x", "y", "z"] as const).map(axis => (
                                                                        <div key={axis} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                            <label>{axis}</label>
                                                                            <Input
                                                                                type="number"
                                                                                value={directionalLightDirection[axis].toString()}
                                                                                onChange={(_, data: InputOnChangeData) =>
                                                                                    setDirectionalLightDirection(prev => ({
                                                                                        ...prev,
                                                                                        [axis]: Number(data.value),
                                                                                    }))
                                                                                }
                                                                                aria-label={`Direction ${axis.toUpperCase()}`}
                                                                                style={{ width: 60 }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button onClick={() => setDirectionalLightPopoverOpen(false)} label="Cancel" />
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        const dirLight = new DirectionalLight(
                                                                            directionalLightName,
                                                                            new Vector3(directionalLightDirection.x, directionalLightDirection.y, directionalLightDirection.z),
                                                                            scene
                                                                        );
                                                                        dirLight.intensity = 1.0;
                                                                    } else {
                                                                        alert("No scene available.");
                                                                    }
                                                                    setDirectionalLightPopoverOpen(false);
                                                                }}
                                                                label="Create"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        const spotlight = new SpotLight(
                                                            "SpotLight",
                                                            new Vector3(0, 5, 0),
                                                            new Vector3(0, -1, 0),
                                                            1,
                                                            1,
                                                            scene
                                                        );
                                                        spotlight.intensity = 1.0;
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                                label="Spotlight"
                                            />
                                            <Popover
                                                open={spotlightPopoverOpen}
                                                onOpenChange={(_, data) => setSpotlightPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="Spotlight Options"
                                                        onClick={() => setSpotlightPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
    <div
        style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: 16,
            width: 300, // Fixed width to match other popovers
        }}
    >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ flex: "0 0 100px" }}>Name</label>
                <Input
                    type="text"
                    value={spotlightParams.name}
                    onChange={e => handleSpotlightParamChange("name", e.target.value)}
                    aria-label="Name"
                    style={{ flex: "1 1 auto" }}
                />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ flex: "0 0 100px" }}>Position</label>
                {(["x", "y", "z"] as const).map(axis => (
                    <Input
                        key={axis}
                        type="number"
                        value={spotlightParams.position[axis].toString()}
                        onChange={(_, data: InputOnChangeData) => handleSpotlightPositionChange(axis, Number(data.value))}
                        aria-label={`Position ${axis.toUpperCase()}`}
                        style={{ width: 60 }} // Consistent width for inputs
                    />
                ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ flex: "0 0 100px" }}>Direction</label>
                {(["x", "y", "z"] as const).map(axis => (
                    <Input
                        key={axis}
                        type="number"
                        value={spotlightParams.direction[axis].toString()}
                        onChange={(_, data: InputOnChangeData) => handleSpotlightDirectionChange(axis, Number(data.value))}
                        aria-label={`Direction ${axis.toUpperCase()}`}
                        style={{ width: 60 }} // Consistent width for inputs
                    />
                ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ flex: "0 0 100px" }}>Angle</label>
                <Input
                    type="number"
                    value={spotlightParams.angle.toString()}
                    onChange={(_, data: InputOnChangeData) => handleSpotlightParamChange("angle", Number(data.value))}
                    aria-label="Angle"
                    style={{ flex: "1 1 auto" }}
                />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ flex: "0 0 100px" }}>Exponent</label>
                <Input
                    type="number"
                    value={spotlightParams.exponent.toString()}
                    onChange={(_, data: InputOnChangeData) => handleSpotlightParamChange("exponent", Number(data.value))}
                    aria-label="Exponent"
                    style={{ flex: "1 1 auto" }}
                />
            </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={() => setSpotlightPopoverOpen(false)} label="Cancel" />
            <Button
                appearance={"primary" as any}
                onClick={() => {
                    if (scene) {
                        const spotlight = new SpotLight(
                            spotlightParams.name,
                            new Vector3(
                                spotlightParams.position.x,
                                spotlightParams.position.y,
                                spotlightParams.position.z
                            ),
                            new Vector3(
                                spotlightParams.direction.x,
                                spotlightParams.direction.y,
                                spotlightParams.direction.z
                            ),
                            spotlightParams.angle,
                            spotlightParams.exponent,
                            scene
                        );
                        spotlight.intensity = 1.0;
                    } else {
                        alert("No scene available.");
                    }
                    setSpotlightPopoverOpen(false);
                }}
                label="Create"
            />
        </div>
    </div>
</PopoverSurface>
                                            </Popover>
                                        </div>
                                    </div>
                                </AccordionPanel>
                            </AccordionItem>
                            <AccordionItem key="Particles" value="Particles">
                                <AccordionHeader expandIconPosition="end">
                                    <Text size={500}>Particles</Text>
                                </AccordionHeader>
                                <AccordionPanel>
                                    <div className={classes.section}>
                                        {/* CPU Particle System */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        setTimeout(() => {
                                                            const system = new ParticleSystem("ParticleSystem", 2000, scene);
                                                            system.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
                                                            system.start();
                                                        }, 0);
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                                label="CPU Particle System"
                                            />
                                            <Popover
                                                open={cpuParticleSystemPopoverOpen}
                                                onOpenChange={(_, data) => setCpuParticleSystemPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="CPU Particle System Options"
                                                        style={{
                                                            borderTopLeftRadius: 0,
                                                            borderBottomLeftRadius: 0,
                                                            marginLeft: -1,
                                                            height: "100%",
                                                        }}
                                                        onClick={() => setCpuParticleSystemPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Name</label>
                                                                <Input
                                                                    type="text"
                                                                    value={cpuParticleSystemName}
                                                                    onChange={(_, data: InputOnChangeData) => setCpuParticleSystemName(data.value)}
                                                                    aria-label="Name"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Capacity</label>
                                                                <Input
                                                                    type="number"
                                                                    value={cpuParticleSystemCapacity.toString()}
                                                                    onChange={(_, data: InputOnChangeData) => setCpuParticleSystemCapacity(Number(data.value))}
                                                                    aria-label="Capacity"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button onClick={() => setCpuParticleSystemPopoverOpen(false)} label="Cancel" />
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        setTimeout(() => {
                                                                            const system = new ParticleSystem(cpuParticleSystemName, cpuParticleSystemCapacity, scene);
                                                                            system.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
                                                                            system.start();
                                                                        }, 0);
                                                                    } else {
                                                                        alert("No scene available.");
                                                                    }
                                                                    setCpuParticleSystemPopoverOpen(false);
                                                                }}
                                                                label="Create"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                        </div>

                                        {/* GPU Particle System */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        if (GPUParticleSystem.IsSupported) {
                                                            // Create without adding to scene
                                                            const system = new GPUParticleSystem("GPUParticleSystem", { capacity: 2000 }, scene.getEngine());
                                                            system.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
                                                            // Manually add to scene to trigger observable
                                                            scene.addParticleSystem(system);
                                                            system.start();
                                                        } else {
                                                            alert("GPU Particle System is not supported.");
                                                        }
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                                label="GPU Particle System"
                                            />
                                            <Popover
                                                open={gpuParticleSystemPopoverOpen}
                                                onOpenChange={(_, data) => setGpuParticleSystemPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="GPU Particle System Options"
                                                        style={{
                                                            borderTopLeftRadius: 0,
                                                            borderBottomLeftRadius: 0,
                                                            marginLeft: -1,
                                                            height: "100%",
                                                        }}
                                                        onClick={() => setGpuParticleSystemPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Name</label>
                                                                <Input
                                                                    type="text"
                                                                    value={gpuParticleSystemName}
                                                                    onChange={(_, data: InputOnChangeData) => setGpuParticleSystemName(data.value)}
                                                                    aria-label="Name"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Capacity</label>
                                                                <Input
                                                                    type="number"
                                                                    value={gpuParticleSystemCapacity.toString()}
                                                                    onChange={(_, data: InputOnChangeData) => setGpuParticleSystemCapacity(Number(data.value))}
                                                                    aria-label="Capacity"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button onClick={() => setGpuParticleSystemPopoverOpen(false)} label="Cancel" />
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        if (GPUParticleSystem.IsSupported) {
                                                                            // Create without adding to scene
                                                                            const system = new GPUParticleSystem(gpuParticleSystemName, { capacity: gpuParticleSystemCapacity }, scene.getEngine());
                                                                            system.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
                                                                            // Manually add to scene to trigger observable
                                                                            scene.addParticleSystem(system);
                                                                            system.start();
                                                                        } else {
                                                                            alert("GPU Particle System is not supported.");
                                                                        }
                                                                    } else {
                                                                        alert("No scene available.");
                                                                    }
                                                                    setGpuParticleSystemPopoverOpen(false);
                                                                }}
                                                                label="Create"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                                            </Popover>
                                        </div>

                                        {/* Node Particle System */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={async () => {
                                                    if (scene) {
                                                        // Always create default when clicking main button
                                                        const nodeParticleSet = NodeParticleSystemSet.CreateDefault("Node Particle System");
                                                        const particleSystemSet = await nodeParticleSet.buildAsync(scene);
                                                        // Rename the particle systems to use a descriptive name
                                                        for (const system of particleSystemSet.systems) {
                                                            system.name = "Node Particle System";
                                                        }
                                                        particleSystemSet.start();
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                                label="Node Particle System"
                                            />
                                            <Popover
                                                open={nodeParticleSystemPopoverOpen}
                                                onOpenChange={(_, data) => setNodeParticleSystemPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="Node Particle System Options"
                                                        style={{
                                                            borderTopLeftRadius: 0,
                                                            borderBottomLeftRadius: 0,
                                                            marginLeft: -1,
                                                            height: "100%",
                                                        }}
                                                        onClick={() => setNodeParticleSystemPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Name</label>
                                                                <Input
                                                                    type="text"
                                                                    value={nodeParticleSystemName}
                                                                    onChange={(_, data: InputOnChangeData) => setNodeParticleSystemName(data.value)}
                                                                    aria-label="Name"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Snippet ID</label>
                                                                <Input
                                                                    type="text"
                                                                    value={nodeParticleSystemSnippetId}
                                                                    onChange={(_, data: InputOnChangeData) => setNodeParticleSystemSnippetId(data.value)}
                                                                    aria-label="Snippet ID"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button onClick={() => setNodeParticleSystemPopoverOpen(false)} label="Cancel" />
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={async () => {
                                                                    if (scene) {
                                                                        try {
                                                                            let nodeParticleSet;
                                                                            const snippetId = nodeParticleSystemSnippetId.trim();
                                                                            if (snippetId) {
                                                                                // Pass snippet ID directly - ParseFromSnippetAsync handles the format
                                                                                // Supports formats like "#KNJOQO#1" or "KNJOQO#1"
                                                                                nodeParticleSet = await NodeParticleSystemSet.ParseFromSnippetAsync(snippetId);
                                                                                // Override the name with user's custom name
                                                                                nodeParticleSet.name = nodeParticleSystemName;
                                                                            } else {
                                                                                nodeParticleSet = NodeParticleSystemSet.CreateDefault(nodeParticleSystemName);
                                                                            }
                                                                            const particleSystemSet = await nodeParticleSet.buildAsync(scene);
                                                                            // Rename the particle systems
                                                                            for (const system of particleSystemSet.systems) {
                                                                                system.name = nodeParticleSystemName;
                                                                            }
                                                                            particleSystemSet.start();
                                                                        } catch (e) {
                                                                            console.error("Error creating Node Particle System:", e);
                                                                            alert("Failed to create Node Particle System: " + e);
                                                                        }
                                                                    } else {
                                                                        alert("No scene available.");
                                                                    }
                                                                    setNodeParticleSystemPopoverOpen(false);
                                                                }}
                                                                label="Create"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                        </div>
                                    </div>
                                </AccordionPanel>
                            </AccordionItem>

                            {/* Cameras */}
                            <AccordionItem key="Cameras" value="Cameras">
                                <AccordionHeader expandIconPosition="end">
                                    <Text size={500}>Cameras</Text>
                                </AccordionHeader>
                                <AccordionPanel>
                                    <div className={classes.section}>
                                        {/* ArcRotate Camera */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        // Convert degrees to radians if needed
                                                        const alpha = arcRotateCameraParams.useRadians 
                                                            ? arcRotateCameraParams.alpha 
                                                            : (arcRotateCameraParams.alpha * Math.PI) / 180;
                                                        const beta = arcRotateCameraParams.useRadians 
                                                            ? arcRotateCameraParams.beta 
                                                            : (arcRotateCameraParams.beta * Math.PI) / 180;
                                                        
                                                        const camera = new ArcRotateCamera(
                                                            arcRotateCameraParams.name,
                                                            alpha,
                                                            beta,
                                                            arcRotateCameraParams.radius,
                                                            new Vector3(
                                                                arcRotateCameraParams.target.x,
                                                                arcRotateCameraParams.target.y,
                                                                arcRotateCameraParams.target.z
                                                            ),
                                                            scene
                                                        );
                                                        camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
                                                        // Set as active camera if none exists
                                                        if (!scene.activeCamera) {
                                                            scene.activeCamera = camera;
                                                        }
                                                    }
                                                }}
                                                label="ArcRotate Camera"
                                            />
                                            <Popover
                                                open={arcRotateCameraPopoverOpen}
                                                onOpenChange={(_, data) => setArcRotateCameraPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="ArcRotate Camera Options"
                                                        style={{
                                                            borderTopLeftRadius: 0,
                                                            borderBottomLeftRadius: 0,
                                                            marginLeft: -1,
                                                            height: "100%",
                                                        }}
                                                        onClick={() => setArcRotateCameraPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Name</label>
                                                                <Input
                                                                    type="text"
                                                                    value={arcRotateCameraParams.name}
                                                                    onChange={(_, data: InputOnChangeData) => handleArcRotateCameraParamChange("name", data.value)}
                                                                    aria-label="Name"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <Text weight="semibold" size={200}>Target Point</Text>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>X</label>
                                                                <Input
                                                                    type="number"
                                                                    value={arcRotateCameraParams.target.x.toString()}
                                                                    onChange={(_, data: InputOnChangeData) => handleArcRotateCameraParamChange("target", { ...arcRotateCameraParams.target, x: parseFloat(data.value) || 0 })}
                                                                    aria-label="Target X"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Y</label>
                                                                <Input
                                                                    type="number"
                                                                    value={arcRotateCameraParams.target.y.toString()}
                                                                    onChange={(_, data: InputOnChangeData) => handleArcRotateCameraParamChange("target", { ...arcRotateCameraParams.target, y: parseFloat(data.value) || 0 })}
                                                                    aria-label="Target Y"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Z</label>
                                                                <Input
                                                                    type="number"
                                                                    value={arcRotateCameraParams.target.z.toString()}
                                                                    onChange={(_, data: InputOnChangeData) => handleArcRotateCameraParamChange("target", { ...arcRotateCameraParams.target, z: parseFloat(data.value) || 0 })}
                                                                    aria-label="Target Z"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <Text weight="semibold" size={200}>Camera Settings</Text>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Radius</label>
                                                                <Input
                                                                    type="number"
                                                                    value={arcRotateCameraParams.radius.toString()}
                                                                    onChange={(_, data: InputOnChangeData) => handleArcRotateCameraParamChange("radius", parseFloat(data.value) || 10)}
                                                                    aria-label="Radius"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Alpha {arcRotateCameraParams.useRadians ? "(rad)" : "(deg)"}</label>
                                                                <Input
                                                                    type="number"
                                                                    value={arcRotateCameraParams.alpha.toString()}
                                                                    onChange={(_, data: InputOnChangeData) => handleArcRotateCameraParamChange("alpha", parseFloat(data.value) || 0)}
                                                                    aria-label="Alpha"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Beta {arcRotateCameraParams.useRadians ? "(rad)" : "(deg)"}</label>
                                                                <Input
                                                                    type="number"
                                                                    value={arcRotateCameraParams.beta.toString()}
                                                                    onChange={(_, data: InputOnChangeData) => handleArcRotateCameraParamChange("beta", parseFloat(data.value) || 0)}
                                                                    aria-label="Beta"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                <Checkbox
                                                                    value={arcRotateCameraParams.useRadians}
                                                                    onChange={(checked) => handleArcRotateCameraParamChange("useRadians", checked)}
                                                                />
                                                                <span>Switch to radians</span>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button onClick={() => setArcRotateCameraPopoverOpen(false)} label="Cancel" />
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        // Convert degrees to radians if needed
                                                                        const alpha = arcRotateCameraParams.useRadians 
                                                                            ? arcRotateCameraParams.alpha 
                                                                            : (arcRotateCameraParams.alpha * Math.PI) / 180;
                                                                        const beta = arcRotateCameraParams.useRadians 
                                                                            ? arcRotateCameraParams.beta 
                                                                            : (arcRotateCameraParams.beta * Math.PI) / 180;
                                                                        
                                                                        const camera = new ArcRotateCamera(
                                                                            arcRotateCameraParams.name,
                                                                            alpha,
                                                                            beta,
                                                                            arcRotateCameraParams.radius,
                                                                            new Vector3(
                                                                                arcRotateCameraParams.target.x,
                                                                                arcRotateCameraParams.target.y,
                                                                                arcRotateCameraParams.target.z
                                                                            ),
                                                                            scene
                                                                        );
                                                                        camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
                                                                        // Set as active camera if none exists
                                                                        if (!scene.activeCamera) {
                                                                            scene.activeCamera = camera;
                                                                        }
                                                                    }
                                                                    setArcRotateCameraPopoverOpen(false);
                                                                }}
                                                                label="Create"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                        </div>

                                        {/* Universal Camera */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        const camera = new UniversalCamera(
                                                            universalCameraParams.name,
                                                            new Vector3(
                                                                universalCameraParams.position.x,
                                                                universalCameraParams.position.y,
                                                                universalCameraParams.position.z
                                                            ),
                                                            scene
                                                        );
                                                        camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
                                                        // Set as active camera if none exists
                                                        if (!scene.activeCamera) {
                                                            scene.activeCamera = camera;
                                                        }
                                                    }
                                                }}
                                                label="Universal Camera"
                                            />
                                            <Popover
                                                open={universalCameraPopoverOpen}
                                                onOpenChange={(_, data) => setUniversalCameraPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <FluentButton
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        title="Universal Camera Options"
                                                        style={{
                                                            borderTopLeftRadius: 0,
                                                            borderBottomLeftRadius: 0,
                                                            marginLeft: -1,
                                                            height: "100%",
                                                        }}
                                                        onClick={() => setUniversalCameraPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Name</label>
                                                                <Input
                                                                    type="text"
                                                                    value={universalCameraParams.name}
                                                                    onChange={(_, data: InputOnChangeData) => handleUniversalCameraParamChange("name", data.value)}
                                                                    aria-label="Name"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <Text weight="semibold" size={200}>Position</Text>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>X</label>
                                                                <Input
                                                                    type="number"
                                                                    value={universalCameraParams.position.x.toString()}
                                                                    onChange={(_, data: InputOnChangeData) => handleUniversalCameraParamChange("position", { ...universalCameraParams.position, x: parseFloat(data.value) || 0 })}
                                                                    aria-label="Position X"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Y</label>
                                                                <Input
                                                                    type="number"
                                                                    value={universalCameraParams.position.y.toString()}
                                                                    onChange={(_, data: InputOnChangeData) => handleUniversalCameraParamChange("position", { ...universalCameraParams.position, y: parseFloat(data.value) || 0 })}
                                                                    aria-label="Position Y"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Z</label>
                                                                <Input
                                                                    type="number"
                                                                    value={universalCameraParams.position.z.toString()}
                                                                    onChange={(_, data: InputOnChangeData) => handleUniversalCameraParamChange("position", { ...universalCameraParams.position, z: parseFloat(data.value) || 0 })}
                                                                    aria-label="Position Z"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button onClick={() => setUniversalCameraPopoverOpen(false)} label="Cancel" />
                                                            <Button
                                                                appearance={"primary" as any}
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        const camera = new UniversalCamera(
                                                                            universalCameraParams.name,
                                                                            new Vector3(
                                                                                universalCameraParams.position.x,
                                                                                universalCameraParams.position.y,
                                                                                universalCameraParams.position.z
                                                                            ),
                                                                            scene
                                                                        );
                                                                        camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
                                                                        // Set as active camera if none exists
                                                                        if (!scene.activeCamera) {
                                                                            scene.activeCamera = camera;
                                                                        }
                                                                    }
                                                                    setUniversalCameraPopoverOpen(false);
                                                                }}
                                                                label="Create"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                        </div>
                                    </div>
                                </AccordionPanel>
                            </AccordionItem>
                        </Accordion>
                        </div>
                    </div>
                );
            },
        });        return {
            dispose: () => registration.dispose(),
        };
    },
};

export default {
    serviceDefinitions: [CreateToolsServiceDefinition],
} as const;

