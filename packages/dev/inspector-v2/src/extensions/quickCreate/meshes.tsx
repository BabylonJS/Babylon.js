import { MeshBuilder } from "core/Meshes/meshBuilder";
import type { Scene } from "core/scene";
import { useState, useRef, type ChangeEvent } from "react";
import type { FunctionComponent } from "react";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SpinButtonPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
import { FilesInput } from "core/Misc/filesInput";
import { SettingsPopover } from "./settingsPopover";
import { CheckboxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
import type { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { QuickCreateSection, QuickCreateRow, QuickCreateItem } from "./quickCreateLayout";
import type { ISelectionService } from "../../services/selectionService";
import { registerBuiltInLoaders } from "loaders/dynamic";

registerBuiltInLoaders();

const SetCamera = function (scene: Scene) {
    const camera = scene.activeCamera as ArcRotateCamera;
    if (camera && camera.radius !== undefined) {
        camera.radius = 5;
    }
};

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

/**
 * @internal
 */
export const MeshesContent: FunctionComponent<{ scene: Scene; selectionService: ISelectionService }> = ({ scene, selectionService }) => {
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
        <QuickCreateSection>
            <QuickCreateItem
                selectionService={selectionService}
                label="Sphere"
                onCreate={() => {
                    const mesh = MeshBuilder.CreateSphere("Sphere", {}, scene);
                    SetCamera(scene);
                    return mesh;
                }}
                onSettingsCreate={() => {
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

                    const mesh = MeshBuilder.CreateSphere(sphereParams.name, createParams, scene);
                    SetCamera(scene);
                    return mesh;
                }}
            >
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
            </QuickCreateItem>
            <QuickCreateItem
                selectionService={selectionService}
                label="Box"
                onCreate={() => {
                    const mesh = MeshBuilder.CreateBox("Box", {}, scene);
                    SetCamera(scene);
                    return mesh;
                }}
                onSettingsCreate={() => {
                    const mesh = MeshBuilder.CreateBox(boxParams.name, boxParams, scene);
                    SetCamera(scene);
                    return mesh;
                }}
            >
                <TextInputPropertyLine label="Name" value={boxParams.name} onChange={(val: string) => handleBoxParamChange("name", val)} />
                <SpinButtonPropertyLine label="Size" value={boxParams.size} min={0} step={0.1} onChange={(val: number) => handleBoxParamChange("size", val)} />
                <SpinButtonPropertyLine label="Width" value={boxParams.width} min={0} step={0.1} onChange={(val: number) => handleBoxParamChange("width", val)} />
                <SpinButtonPropertyLine label="Height" value={boxParams.height} min={0} step={0.1} onChange={(val: number) => handleBoxParamChange("height", val)} />
                <SpinButtonPropertyLine label="Depth" value={boxParams.depth} min={0} step={0.1} onChange={(val: number) => handleBoxParamChange("depth", val)} />
            </QuickCreateItem>
            <QuickCreateItem
                selectionService={selectionService}
                label="Cylinder"
                onCreate={() => {
                    const mesh = MeshBuilder.CreateCylinder("Cylinder", {}, scene);
                    SetCamera(scene);
                    return mesh;
                }}
                onSettingsCreate={() => {
                    const mesh = MeshBuilder.CreateCylinder(cylinderParams.name, cylinderParams, scene);
                    SetCamera(scene);
                    return mesh;
                }}
            >
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
            </QuickCreateItem>
            <QuickCreateItem
                selectionService={selectionService}
                label="Cone"
                onCreate={() => {
                    const mesh = MeshBuilder.CreateCylinder("Cone", { diameterTop: 0 }, scene);
                    SetCamera(scene);
                    return mesh;
                }}
                onSettingsCreate={() => {
                    const coneParamsToUse = {
                        ...coneParams,
                        diameterTop: coneUp ? 0 : coneParams.diameterTop,
                        diameterBottom: coneUp ? coneParams.diameterBottom : 0,
                    };
                    const mesh = MeshBuilder.CreateCylinder(coneParams.name, coneParamsToUse, scene);
                    SetCamera(scene);
                    return mesh;
                }}
            >
                <TextInputPropertyLine label="Name" value={coneParams.name} onChange={(val: string) => handleConeParamChange("name", val)} />
                <SpinButtonPropertyLine label="Height" value={coneParams.height} min={0} step={0.1} onChange={(val: number) => handleConeParamChange("height", val)} />
                <SpinButtonPropertyLine label="Diameter" value={coneParams.diameter} min={0} step={0.1} onChange={(val: number) => handleConeParamChange("diameter", val)} />
                <SpinButtonPropertyLine label="Tessellation" value={coneParams.tessellation} min={3} onChange={(val: number) => handleConeParamChange("tessellation", val)} />
                <SpinButtonPropertyLine label="Subdivisions" value={coneParams.subdivisions} min={1} onChange={(val: number) => handleConeParamChange("subdivisions", val)} />
                <SpinButtonPropertyLine label="Arc" value={coneParams.arc} min={0} max={1} step={0.1} onChange={(val: number) => handleConeParamChange("arc", val)} />
                <CheckboxPropertyLine label="Up" value={coneUp} onChange={(val: boolean) => setConeUp(val)} />
            </QuickCreateItem>
            <QuickCreateItem
                selectionService={selectionService}
                label="Ground"
                onCreate={() => {
                    const mesh = MeshBuilder.CreateGround("Ground", {}, scene);
                    SetCamera(scene);
                    return mesh;
                }}
                onSettingsCreate={() => {
                    const mesh = MeshBuilder.CreateGround(groundParams.name, groundParams, scene);
                    SetCamera(scene);
                    return mesh;
                }}
            >
                <TextInputPropertyLine label="Name" value={groundParams.name} onChange={(val: string) => handleGroundParamChange("name", val)} />
                <SpinButtonPropertyLine label="Width" value={groundParams.width} min={0} step={0.1} onChange={(val: number) => handleGroundParamChange("width", val)} />
                <SpinButtonPropertyLine label="Height" value={groundParams.height} min={0} step={0.1} onChange={(val: number) => handleGroundParamChange("height", val)} />
                <SpinButtonPropertyLine label="Subdivisions" value={groundParams.subdivisions} min={1} onChange={(val: number) => handleGroundParamChange("subdivisions", val)} />
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
            </QuickCreateItem>
            <QuickCreateRow>
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
            </QuickCreateRow>
        </QuickCreateSection>
    );
};
