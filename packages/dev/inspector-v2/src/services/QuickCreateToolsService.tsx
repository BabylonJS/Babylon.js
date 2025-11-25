import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISceneContext } from "./sceneContext";
import type { IShellService } from "./shellService";
import { Accordion as BabylonAccordion, AccordionSection as BabylonAccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { makeStyles, tokens } from "@fluentui/react-components";
import { ShellServiceIdentity } from "./shellService";
import { CollectionsAdd20Regular } from "@fluentui/react-icons";
import { SceneContextIdentity } from "./sceneContext";
import { useObservableState } from "../hooks/observableHooks";
import { useState, useRef } from "react";
import type { ChangeEvent, FunctionComponent, PropsWithChildren } from "react";
import type { Scene } from "core/scene";

// Babylon.js imports
import { MeshBuilder } from "core/Meshes";
import { FilesInput } from "core/Misc/filesInput";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { PointLight } from "core/Lights/pointLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { SpotLight } from "core/Lights/spotLight";
import { Vector3 } from "core/Maths/math.vector";
import { ParticleSystem } from "core/Particles/particleSystem";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
import { Texture } from "core/Materials/Textures/texture";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { UniversalCamera } from "core/Cameras/universalCamera";

// Side-effect import needed for GPUParticleSystem
import "core/Particles/webgl2ParticleSystem";

// UI Components
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SpinButtonPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
import { CheckboxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { Popover, PopoverTrigger, PopoverSurface } from "@fluentui/react-components";
import { Settings20Regular } from "@fluentui/react-icons";

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
    row: { display: "flex", alignItems: "center", gap: "4px" },
});



export const SettingsPopover: FunctionComponent<PropsWithChildren<{}>> = (props) => {
    const { children } = props;
    const [popoverOpen, setPopoverOpen] = useState(false);

    return (
        <Popover open={popoverOpen} onOpenChange={(_, data) => setPopoverOpen(data.open)} positioning="below-start" trapFocus>
            <PopoverTrigger disableButtonEnhancement>
                <button
                    type="button"
                    onClick={() => setPopoverOpen(true)}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "5px 8px",
                        borderRadius: "4px",
                    }}
                >
                    <Settings20Regular />
                </button>
            </PopoverTrigger>
            <PopoverSurface>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, minWidth: 300, maxWidth: 400 }}>{children}</div>
            </PopoverSurface>
        </Popover>
    );
};

// Mesh Types
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

const SetCamera = function (scene: Scene) {
    const camera = scene.activeCamera as ArcRotateCamera;
    if (camera && camera.radius !== undefined) {
        camera.radius = 5;
    }
};

const MeshesContent: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const classes = useStyles();
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
        setSphereParams((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const [boxParams, setBoxParams] = useState<BoxParams>({
        name: "Box",
        size: 1,
        width: 1,
        height: 1,
        depth: 1,
    });

    const handleBoxParamChange = <K extends keyof BoxParams>(key: K, value: BoxParams[K]) => {
        setBoxParams((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

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
        setCylinderParams((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

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

    const [coneUp, setConeUp] = useState(true);

    const handleConeParamChange = <K extends keyof ConeParams>(key: K, value: ConeParams[K]) => {
        setConeParams((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const [groundParams, setGroundParams] = useState<GroundParams>({
        name: "Ground",
        width: 10,
        height: 10,
        subdivisions: 1,
        subdivisionsX: 1,
        subdivisionsY: 1,
    });

    const handleGroundParamChange = <K extends keyof GroundParams>(key: K, value: GroundParams[K]) => {
        setGroundParams((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [importMeshName, setImportMeshName] = useState("ImportedMesh");

    const handleLocalMeshImport = (event: ChangeEvent<HTMLInputElement>) => {
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
            null,
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

    return (
        <div className={classes.section}>
            <div className={classes.row}>
                <Button
                    onClick={() => {
                        MeshBuilder.CreateSphere("Sphere", {}, scene);
                        SetCamera(scene);
                    }}
                    label="Sphere"
                />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={sphereParams.name} onChange={(val: string) => handleSphereParamChange("name", val)} />
                    <SpinButtonPropertyLine label="Segments" value={sphereParams.segments} min={0} onChange={(val: number) => handleSphereParamChange("segments", val)} />
                    <SpinButtonPropertyLine
                        label="Diameter"
                        value={sphereParams.diameter}
                        min={0}
                        step={0.1}
                        onChange={(val: number) => handleSphereParamChange("diameter", val)}
                        disabled={!sphereParams.uniform}
                    />
                    <CheckboxPropertyLine label="Uniform" value={sphereParams.uniform} onChange={(checked) => handleSphereParamChange("uniform", checked)} />
                    <SpinButtonPropertyLine
                        label="Diameter X"
                        value={sphereParams.diameterX}
                        min={0}
                        step={0.1}
                        onChange={(val: number) => handleSphereParamChange("diameterX", val)}
                        disabled={sphereParams.uniform}
                    />
                    <SpinButtonPropertyLine
                        label="Diameter Y"
                        value={sphereParams.diameterY}
                        min={0}
                        step={0.1}
                        onChange={(val: number) => handleSphereParamChange("diameterY", val)}
                        disabled={sphereParams.uniform}
                    />
                    <SpinButtonPropertyLine
                        label="Diameter Z"
                        value={sphereParams.diameterZ}
                        min={0}
                        step={0.1}
                        onChange={(val: number) => handleSphereParamChange("diameterZ", val)}
                        disabled={sphereParams.uniform}
                    />
                    <SpinButtonPropertyLine label="Arc" value={sphereParams.arc} min={0} max={1} step={0.1} onChange={(val: number) => handleSphereParamChange("arc", val)} />
                    <SpinButtonPropertyLine label="Slice" value={sphereParams.slice} min={0} max={1} step={0.1} onChange={(val: number) => handleSphereParamChange("slice", val)} />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                        <Button
                            appearance="primary"
                            onClick={() => {
                                const createParams: Partial<SphereParams> = {
                                    segments: sphereParams.segments,
                                    arc: sphereParams.arc,
                                    slice: sphereParams.slice,
                                };
                                if (sphereParams.uniform) {
                                    createParams.diameter = sphereParams.diameter;
                                } else {
                                    createParams.diameterX = sphereParams.diameterX;
                                    createParams.diameterY = sphereParams.diameterY;
                                    createParams.diameterZ = sphereParams.diameterZ;
                                }
                                MeshBuilder.CreateSphere(sphereParams.name, createParams, scene);
                                SetCamera(scene);
                            }}
                            label="Create"
                        />
                    </div>
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button
                    onClick={() => {
                        MeshBuilder.CreateBox("Box", {}, scene);
                        SetCamera(scene);
                    }}
                    label="Box"
                />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={boxParams.name} onChange={(val: string) => handleBoxParamChange("name", val)} />
                    <SpinButtonPropertyLine label="Size" value={boxParams.size} min={0} step={0.1} onChange={(val: number) => handleBoxParamChange("size", val)} />
                    <SpinButtonPropertyLine label="Width" value={boxParams.width} min={0} step={0.1} onChange={(val: number) => handleBoxParamChange("width", val)} />
                    <SpinButtonPropertyLine label="Height" value={boxParams.height} min={0} step={0.1} onChange={(val: number) => handleBoxParamChange("height", val)} />
                    <SpinButtonPropertyLine label="Depth" value={boxParams.depth} min={0} step={0.1} onChange={(val: number) => handleBoxParamChange("depth", val)} />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                        <Button
                            appearance="primary"
                            onClick={() => {
                                MeshBuilder.CreateBox(boxParams.name, boxParams, scene);
                                SetCamera(scene);
                            }}
                            label="Create"
                        />
                    </div>
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button
                    onClick={() => {
                        MeshBuilder.CreateCylinder("Cylinder", {}, scene);
                        SetCamera(scene);
                    }}
                    label="Cylinder"
                />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={cylinderParams.name} onChange={(val: string) => handleCylinderParamChange("name", val)} />
                    <SpinButtonPropertyLine label="Height" value={cylinderParams.height} min={0} step={0.1} onChange={(val: number) => handleCylinderParamChange("height", val)} />
                    <SpinButtonPropertyLine
                        label="Diameter Top"
                        value={cylinderParams.diameterTop}
                        min={0}
                        step={0.1}
                        onChange={(val: number) => handleCylinderParamChange("diameterTop", val)}
                    />
                    <SpinButtonPropertyLine
                        label="Diameter Bottom"
                        value={cylinderParams.diameterBottom}
                        min={0}
                        step={0.1}
                        onChange={(val: number) => handleCylinderParamChange("diameterBottom", val)}
                    />
                    <SpinButtonPropertyLine
                        label="Diameter"
                        value={cylinderParams.diameter}
                        min={0}
                        step={0.1}
                        onChange={(val: number) => handleCylinderParamChange("diameter", val)}
                    />
                    <SpinButtonPropertyLine
                        label="Tessellation"
                        value={cylinderParams.tessellation}
                        min={3}
                        onChange={(val: number) => handleCylinderParamChange("tessellation", val)}
                    />
                    <SpinButtonPropertyLine
                        label="Subdivisions"
                        value={cylinderParams.subdivisions}
                        min={1}
                        onChange={(val: number) => handleCylinderParamChange("subdivisions", val)}
                    />
                    <SpinButtonPropertyLine label="Arc" value={cylinderParams.arc} min={0} max={1} step={0.1} onChange={(val: number) => handleCylinderParamChange("arc", val)} />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                        <Button
                            appearance="primary"
                            onClick={() => {
                                MeshBuilder.CreateCylinder(cylinderParams.name, cylinderParams, scene);
                                SetCamera(scene);
                            }}
                            label="Create"
                        />
                    </div>
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button
                    onClick={() => {
                        MeshBuilder.CreateCylinder("Cone", { diameterTop: 0 }, scene);
                        SetCamera(scene);
                    }}
                    label="Cone"
                />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={coneParams.name} onChange={(val: string) => handleConeParamChange("name", val)} />
                    <SpinButtonPropertyLine label="Height" value={coneParams.height} min={0} step={0.1} onChange={(val: number) => handleConeParamChange("height", val)} />
                    <SpinButtonPropertyLine label="Diameter" value={coneParams.diameter} min={0} step={0.1} onChange={(val: number) => handleConeParamChange("diameter", val)} />
                    <SpinButtonPropertyLine label="Tessellation" value={coneParams.tessellation} min={3} onChange={(val: number) => handleConeParamChange("tessellation", val)} />
                    <SpinButtonPropertyLine label="Subdivisions" value={coneParams.subdivisions} min={1} onChange={(val: number) => handleConeParamChange("subdivisions", val)} />
                    <SpinButtonPropertyLine label="Arc" value={coneParams.arc} min={0} max={1} step={0.1} onChange={(val: number) => handleConeParamChange("arc", val)} />
                    <CheckboxPropertyLine label="Up" value={coneUp} onChange={(val: boolean) => setConeUp(val)} />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                        <Button
                            appearance="primary"
                            onClick={() => {
                                const coneParamsToUse = {
                                    ...coneParams,
                                    diameterTop: coneUp ? 0 : coneParams.diameterTop,
                                    diameterBottom: coneUp ? coneParams.diameterBottom : 0,
                                };
                                MeshBuilder.CreateCylinder(coneParams.name, coneParamsToUse, scene);
                                SetCamera(scene);
                            }}
                            label="Create"
                        />
                    </div>
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button
                    onClick={() => {
                        MeshBuilder.CreateGround("Ground", {}, scene);
                        SetCamera(scene);
                    }}
                    label="Ground"
                />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={groundParams.name} onChange={(val: string) => handleGroundParamChange("name", val)} />
                    <SpinButtonPropertyLine label="Width" value={groundParams.width} min={0} step={0.1} onChange={(val: number) => handleGroundParamChange("width", val)} />
                    <SpinButtonPropertyLine label="Height" value={groundParams.height} min={0} step={0.1} onChange={(val: number) => handleGroundParamChange("height", val)} />
                    <SpinButtonPropertyLine
                        label="Subdivisions"
                        value={groundParams.subdivisions}
                        min={1}
                        onChange={(val: number) => handleGroundParamChange("subdivisions", val)}
                    />
                    <SpinButtonPropertyLine
                        label="Subdivisions X"
                        value={groundParams.subdivisionsX}
                        min={1}
                        onChange={(val: number) => handleGroundParamChange("subdivisionsX", val)}
                    />
                    <SpinButtonPropertyLine
                        label="Subdivisions Y"
                        value={groundParams.subdivisionsY}
                        min={1}
                        onChange={(val: number) => handleGroundParamChange("subdivisionsY", val)}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                        <Button
                            appearance="primary"
                            onClick={() => {
                                MeshBuilder.CreateGround(groundParams.name, groundParams, scene);
                                SetCamera(scene);
                            }}
                            label="Create"
                        />
                    </div>
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button
                    onClick={() => {
                        fileInputRef.current?.click();
                    }}
                    label="Import Mesh"
                />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={importMeshName} onChange={(val: string) => setImportMeshName(val)} />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <Button
                            appearance="primary"
                            onClick={() => {
                                fileInputRef.current?.click();
                            }}
                            label="Import"
                        />
                    </div>
                </SettingsPopover>
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
    );
};

const MaterialsContent: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const classes = useStyles();
    const [nodeMaterialName, setNodeMaterialName] = useState("Node Material");
    const [nodeMaterialSnippetId, setNodeMaterialSnippetId] = useState("");
    const [pbrMaterialName, setPbrMaterialName] = useState("PBR Material");
    const [standardMaterialName, setStandardMaterialName] = useState("Standard Material");

    const handleCreateNodeMaterialAsync = async () => {
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
    };

    const handleCreatePBRMaterial = () => {
        new PBRMaterial(pbrMaterialName, scene);
    };

    const handleCreateStandardMaterial = () => {
        new StandardMaterial(standardMaterialName, scene);
    };

    return (
        <div className={classes.section}>
            <div className={classes.row}>
                <Button onClick={handleCreateNodeMaterialAsync} label="Node Material" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={nodeMaterialName} onChange={(value) => setNodeMaterialName(value)} />
                    <TextInputPropertyLine label="Snippet ID" value={nodeMaterialSnippetId} onChange={(value) => setNodeMaterialSnippetId(value)} />
                    <Button appearance="primary" onClick={handleCreateNodeMaterialAsync} label="Create" />
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button onClick={handleCreatePBRMaterial} label="PBR Material" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={pbrMaterialName} onChange={(value) => setPbrMaterialName(value)} />
                    <Button appearance="primary" onClick={handleCreatePBRMaterial} label="Create" />
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button onClick={handleCreateStandardMaterial} label="Standard Material" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={standardMaterialName} onChange={(value) => setStandardMaterialName(value)} />
                    <Button appearance="primary" onClick={handleCreateStandardMaterial} label="Create" />
                </SettingsPopover>
            </div>
        </div>
    );
};

const LightsContent: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const classes = useStyles();
    const [pointLightName, setPointLightName] = useState("Point Light");
    const [pointLightPosition, setPointLightPosition] = useState(new Vector3(0, 5, 0));
    const [directionalLightName, setDirectionalLightName] = useState("Directional Light");
    const [directionalLightDirection, setDirectionalLightDirection] = useState(new Vector3(1, -1, 0));
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
        <div className={classes.section}>
            <div className={classes.row}>
                <Button onClick={handleCreatePointLight} label="Point Light" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={pointLightName} onChange={(value) => setPointLightName(value)} />
                    <Vector3PropertyLine label="Position" value={pointLightPosition} onChange={(value) => setPointLightPosition(value)} />
                    <Button appearance="primary" onClick={handleCreatePointLight} label="Create" />
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button onClick={handleCreateDirectionalLight} label="Directional Light" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={directionalLightName} onChange={(value) => setDirectionalLightName(value)} />
                    <Vector3PropertyLine label="Direction" value={directionalLightDirection} onChange={(value) => setDirectionalLightDirection(value)} />
                    <Button appearance="primary" onClick={handleCreateDirectionalLight} label="Create" />
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button onClick={handleCreateSpotlight} label="Spotlight" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={spotlightName} onChange={(value) => setSpotlightName(value)} />
                    <Vector3PropertyLine label="Position" value={spotlightPosition} onChange={(value) => setSpotlightPosition(value)} />
                    <Vector3PropertyLine label="Direction" value={spotlightDirection} onChange={(value) => setSpotlightDirection(value)} />
                    <SpinButtonPropertyLine label="Angle" value={spotlightAngle} onChange={(value) => setSpotlightAngle(value)} min={0} max={Math.PI} step={0.1} />
                    <SpinButtonPropertyLine label="Exponent" value={spotlightExponent} onChange={(value) => setSpotlightExponent(value)} min={0} max={10} step={0.1} />
                    <Button appearance="primary" onClick={handleCreateSpotlight} label="Create" />
                </SettingsPopover>
            </div>
        </div>
    );
};

const ParticlesContent: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const classes = useStyles();
    const [cpuParticleSystemName, setCpuParticleSystemName] = useState("Particle System");
    const [cpuParticleSystemCapacity, setCpuParticleSystemCapacity] = useState(2000);
    const [gpuParticleSystemName, setGpuParticleSystemName] = useState("GPU Particle System");
    const [gpuParticleSystemCapacity, setGpuParticleSystemCapacity] = useState(2000);
    const [nodeParticleSystemName, setNodeParticleSystemName] = useState("Node Particle System");
    const [nodeParticleSystemSnippetId, setNodeParticleSystemSnippetId] = useState("");

    const handleCreateCPUParticleSystem = () => {
        setTimeout(() => {
            const system = new ParticleSystem(cpuParticleSystemName, cpuParticleSystemCapacity, scene);
            system.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
            system.start();
        }, 0);
    };

    const handleCreateGPUParticleSystem = () => {
        if (GPUParticleSystem.IsSupported) {
            setTimeout(() => {
                const system = new GPUParticleSystem(gpuParticleSystemName, { capacity: gpuParticleSystemCapacity }, scene);
                system.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
                system.start();
            }, 0);
        } else {
            alert("GPU Particle System is not supported.");
        }
    };

    const handleCreateNodeParticleSystemAsync = async () => {
        try {
            let nodeParticleSet;
            const snippetId = nodeParticleSystemSnippetId.trim();
            if (snippetId) {
                nodeParticleSet = await NodeParticleSystemSet.ParseFromSnippetAsync(snippetId);
                nodeParticleSet.name = nodeParticleSystemName;
            } else {
                nodeParticleSet = NodeParticleSystemSet.CreateDefault(nodeParticleSystemName);
            }
            const particleSystemSet = await nodeParticleSet.buildAsync(scene);
            for (const system of particleSystemSet.systems) {
                system.name = nodeParticleSystemName;
            }
            particleSystemSet.start();
        } catch (e) {
            global.console.error("Error creating Node Particle System:", e);
            alert("Failed to create Node Particle System: " + e);
        }
    };

    return (
        <div className={classes.section}>
            <div className={classes.row}>
                <Button onClick={handleCreateCPUParticleSystem} label="CPU Particle System" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={cpuParticleSystemName} onChange={(value) => setCpuParticleSystemName(value)} />
                    <SpinButtonPropertyLine
                        label="Capacity"
                        value={cpuParticleSystemCapacity}
                        onChange={(value) => setCpuParticleSystemCapacity(value)}
                        min={1}
                        max={100000}
                        step={100}
                    />
                    <Button appearance="primary" onClick={handleCreateCPUParticleSystem} label="Create" />
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button onClick={handleCreateGPUParticleSystem} label="GPU Particle System" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={gpuParticleSystemName} onChange={(value) => setGpuParticleSystemName(value)} />
                    <SpinButtonPropertyLine
                        label="Capacity"
                        value={gpuParticleSystemCapacity}
                        onChange={(value) => setGpuParticleSystemCapacity(value)}
                        min={1}
                        max={1000000}
                        step={1000}
                    />
                    <Button appearance="primary" onClick={handleCreateGPUParticleSystem} label="Create" />
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button onClick={handleCreateNodeParticleSystemAsync} label="Node Particle System" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={nodeParticleSystemName} onChange={(value) => setNodeParticleSystemName(value)} />
                    <TextInputPropertyLine label="Snippet ID" value={nodeParticleSystemSnippetId} onChange={(value) => setNodeParticleSystemSnippetId(value)} />
                    <Button appearance="primary" onClick={handleCreateNodeParticleSystemAsync} label="Create" />
                </SettingsPopover>
            </div>
        </div>
    );
};

const CamerasContent: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const classes = useStyles();
    const [arcRotateCameraName, setArcRotateCameraName] = useState("ArcRotate Camera");
    const [arcRotateCameraTarget, setArcRotateCameraTarget] = useState(new Vector3(0, 0, 0));
    const [arcRotateCameraRadius, setArcRotateCameraRadius] = useState(10);
    const [arcRotateCameraAlpha, setArcRotateCameraAlpha] = useState(0);
    const [arcRotateCameraBeta, setArcRotateCameraBeta] = useState(45);
    const [arcRotateCameraUseRadians, setArcRotateCameraUseRadians] = useState(false);
    const [universalCameraName, setUniversalCameraName] = useState("Universal Camera");
    const [universalCameraPosition, setUniversalCameraPosition] = useState(new Vector3(0, 1, -10));

    const handleCreateArcRotateCamera = () => {
        const alpha = arcRotateCameraUseRadians ? arcRotateCameraAlpha : (arcRotateCameraAlpha * Math.PI) / 180;
        const beta = arcRotateCameraUseRadians ? arcRotateCameraBeta : (arcRotateCameraBeta * Math.PI) / 180;
        const camera = new ArcRotateCamera(arcRotateCameraName, alpha, beta, arcRotateCameraRadius, arcRotateCameraTarget, scene);
        camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
        if (!scene.activeCamera) {
            scene.activeCamera = camera;
        }
    };

    const handleCreateUniversalCamera = () => {
        const camera = new UniversalCamera(universalCameraName, universalCameraPosition, scene);
        camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
        if (!scene.activeCamera) {
            scene.activeCamera = camera;
        }
    };

    return (
        <div className={classes.section}>
            <div className={classes.row}>
                <Button onClick={handleCreateArcRotateCamera} label="ArcRotate Camera" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={arcRotateCameraName} onChange={(value) => setArcRotateCameraName(value)} />
                    <Vector3PropertyLine label="Target" value={arcRotateCameraTarget} onChange={(value) => setArcRotateCameraTarget(value)} />
                    <SpinButtonPropertyLine label="Radius" value={arcRotateCameraRadius} onChange={(value) => setArcRotateCameraRadius(value)} min={0.1} max={1000} step={0.5} />
                    <SpinButtonPropertyLine
                        label={`Alpha ${arcRotateCameraUseRadians ? "(rad)" : "(deg)"}`}
                        value={arcRotateCameraAlpha}
                        onChange={(value) => setArcRotateCameraAlpha(value)}
                        min={arcRotateCameraUseRadians ? -Math.PI * 2 : -360}
                        max={arcRotateCameraUseRadians ? Math.PI * 2 : 360}
                        step={arcRotateCameraUseRadians ? 0.1 : 5}
                    />
                    <SpinButtonPropertyLine
                        label={`Beta ${arcRotateCameraUseRadians ? "(rad)" : "(deg)"}`}
                        value={arcRotateCameraBeta}
                        onChange={(value) => setArcRotateCameraBeta(value)}
                        min={arcRotateCameraUseRadians ? 0 : 0}
                        max={arcRotateCameraUseRadians ? Math.PI : 180}
                        step={arcRotateCameraUseRadians ? 0.1 : 5}
                    />
                    <CheckboxPropertyLine label="Use Radians" value={arcRotateCameraUseRadians} onChange={(value) => setArcRotateCameraUseRadians(value)} />
                    <Button appearance="primary" onClick={handleCreateArcRotateCamera} label="Create" />
                </SettingsPopover>
            </div>
            <div className={classes.row}>
                <Button onClick={handleCreateUniversalCamera} label="Universal Camera" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={universalCameraName} onChange={(value) => setUniversalCameraName(value)} />
                    <Vector3PropertyLine label="Position" value={universalCameraPosition} onChange={(value) => setUniversalCameraPosition(value)} />
                    <Button appearance="primary" onClick={handleCreateUniversalCamera} label="Create" />
                </SettingsPopover>
            </div>
        </div>
    );
};

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

                return (
                    <div className={classes.container}>
                        <div className={classes.scrollArea}>
                            {/* <BabylonAccordion multiple> */}
                            <BabylonAccordion>
                                <BabylonAccordionSection title="Meshes">{scene && <MeshesContent scene={scene} />}</BabylonAccordionSection>
                                <BabylonAccordionSection title="Materials">{scene && <MaterialsContent scene={scene} />}</BabylonAccordionSection>
                                <BabylonAccordionSection title="Lights">{scene && <LightsContent scene={scene} />}</BabylonAccordionSection>
                                <BabylonAccordionSection title="Particles">{scene && <ParticlesContent scene={scene} />}</BabylonAccordionSection>
                                <BabylonAccordionSection title="Cameras">{scene && <CamerasContent scene={scene} />}</BabylonAccordionSection>
                            </BabylonAccordion>
                        </div>
                    </div>
                );
            },
        });
        return {
            dispose: () => registration.dispose(),
        };
    },
};

export default {
    serviceDefinitions: [CreateToolsServiceDefinition],
} as const;
