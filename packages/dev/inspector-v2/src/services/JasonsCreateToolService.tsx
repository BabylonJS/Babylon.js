import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISceneContext } from "./sceneContext";
import type { IShellService } from "./shellService";

import { makeStyles, tokens, Accordion, AccordionItem, AccordionHeader, AccordionPanel, Text, Button, Popover, PopoverTrigger, PopoverSurface, Input, Checkbox } from "@fluentui/react-components";
import { ShellServiceIdentity } from "./shellService";

import { useState } from "react";
import { CollectionsAdd20Regular, Settings20Regular } from "@fluentui/react-icons";
import { SceneContextIdentity } from "./sceneContext";
import { useObservableState } from "../hooks/observableHooks";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { NodeGeometry } from "core/Meshes/Node/nodeGeometry";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { PointLight } from "core/Lights/pointLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { SpotLight } from "core/Lights/spotLight";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    section: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
    },
});

const setCamera = function(scene:Scene) {
    const camera = scene.activeCamera;
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
            content: () => {
                const classes = useStyles();

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                // eslint-disable-next-line no-console
                console.log(scene);

                const [spherePopoverOpen, setSpherePopoverOpen] = useState(false);
                const [sphereParams, setSphereParams] = useState({
                    name: "Sphere",
                    segments: 32,
                    diameter: 1,
                    diameterX: 1,
                    diameterY: 1,
                    diameterZ: 1,
                    arc: 1,
                    slice: 1,
                    uniform: true, // Add this line
                });

                const handleSphereParamChange = (key, value) => {
                    setSphereParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const [boxPopoverOpen, setBoxPopoverOpen] = useState(false);
                const [boxParams, setBoxParams] = useState({
                    name: "Box",
                    size: 1,
                    width: 1,
                    height: 1,
                    depth: 1,
                });

                const handleBoxParamChange = (key, value) => {
                    setBoxParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const [cylinderPopoverOpen, setCylinderPopoverOpen] = useState(false);
                const [cylinderParams, setCylinderParams] = useState({
                    name: "Cylinder",
                    height: 2,
                    diameterTop: 1,
                    diameterBottom: 1,
                    diameter: 1,
                    tessellation: 32,
                    subdivisions: 1,
                    arc: 1,
                });

                const handleCylinderParamChange = (key, value) => {
                    setCylinderParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const [conePopoverOpen, setConePopoverOpen] = useState(false);
                const [coneParams, setConeParams] = useState({
                    name: "Cone",
                    height: 2,
                    diameter: 1,
                    tessellation: 32,
                    subdivisions: 1,
                    arc: 1,
                });

                const [isUpChecked, setIsUpChecked] = useState(false);
                const [isDownChecked, setIsDownChecked] = useState(false);

                const handleConeParamChange = (key, value) => {
                    setConeParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const [groundPopoverOpen, setGroundPopoverOpen] = useState(false);
                const [groundParams, setGroundParams] = useState({
                    name: "Ground",
                    width: 10,
                    height: 10,
                    subdivisions: 1,
                    subdivisionsX: 1,
                    subdivisionsY: 1,
                });

                const handleGroundParamChange = (key, value) => {
                    setGroundParams(prev => ({
                        ...prev,
                        [key]: value
                    }));
                };

                const [nodeGeometryPopoverOpen, setNodeGeometryPopoverOpen] = useState(false);
                const [nodeGeometryName, setNodeGeometryName] = useState("NodeGeometry");
                const [nodeGeometrySnippetId, setNodeGeometrySnippetId] = useState("");

                const [nodeMaterialPopoverOpen, setNodeMaterialPopoverOpen] = useState(false);
                const [nodeMaterialName, setNodeMaterialName] = useState("NodeMaterial");
                const [nodeMaterialSnippetId, setNodeMaterialSnippetId] = useState("");

                const [pointLightPopoverOpen, setPointLightPopoverOpen] = useState(false);
                const [pointLightName, setPointLightName] = useState("PointLight");
                const [pointLightPosition, setPointLightPosition] = useState({ x: 0, y: 5, z: 0 });

                const [directionalLightPopoverOpen, setDirectionalLightPopoverOpen] = useState(false);
                const [directionalLightName, setDirectionalLightName] = useState("DirectionalLight");
                const [directionalLightDirection, setDirectionalLightDirection] = useState(new Vector3(1, -1, 0));

                const [spotlightPopoverOpen, setSpotlightPopoverOpen] = useState(false);
                const [spotlightParams, setSpotlightParams] = useState({
                    name: "Spotlight",
                    position: { x: 0, y: 5, z: 0 },
                    direction: { x: 0, y: -1, z: 0 },
                    angle: 1,
                    exponent: 1,
                });

                const handleSpotlightParamChange = (key, value) => {
                    setSpotlightParams(prev => ({
                        ...prev,
                        [key]: value,
                    }));
                };

                const handleSpotlightPositionChange = (axis, value) => {
                    setSpotlightParams(prev => ({
                        ...prev,
                        position: {
                            ...prev.position,
                            [axis]: value,
                        },
                    }));
                };

                const handleSpotlightDirectionChange = (axis, value) => {
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
                    <>
                        <Accordion collapsible multiple defaultOpenItems={["Meshes", "Materials", "Lights"]}>
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
                                            >
                                                Sphere
                                            </Button>
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
                                                    <Button
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        size="small"
                                                        aria-label="Sphere Options"
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
            { [
                { label: "Name", key: "name" },
                { label: "Segments", key: "segments" },
            ].map(({ label, key }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                    <Input
                        type={key === "name" ? "text" : "number"}
                        value={sphereParams[key]}
                        onChange={e => handleSphereParamChange(key, key === "name" ? e.target.value : Number(e.target.value))}
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
                    value={sphereParams.diameter}
                    onChange={e => handleSphereParamChange("diameter", Number(e.target.value))}
                    aria-label="Diameter"
                    style={{ flex: "1 1 auto" }}
                    disabled={!sphereParams.uniform}
                />
            </div>
            {/* Uniform checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 108, marginTop: -8, marginBottom: 4 }}>
                <Checkbox
                    checked={sphereParams.uniform}
                    onChange={(_, data) => handleSphereParamChange("uniform", data.checked)}
                    aria-label="Uniform"
                    size="small"
                />
                <span style={{ fontSize: 13 }}>Uniform</span>
            </div>
            {/* Diameter X/Y/Z in a single row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ flex: "0 0 100px" }}>Diameter X/Y/Z</label>
                <Input
                    type="number"
                    value={sphereParams.diameterX}
                    onChange={e => handleSphereParamChange("diameterX", Number(e.target.value))}
                    aria-label="Diameter X"
                    style={{ width: 60 }}
                    placeholder="X"
                    disabled={sphereParams.uniform}
                />
                <Input
                    type="number"
                    value={sphereParams.diameterY}
                    onChange={e => handleSphereParamChange("diameterY", Number(e.target.value))}
                    aria-label="Diameter Y"
                    style={{ width: 60 }}
                    placeholder="Y"
                    disabled={sphereParams.uniform}
                />
                <Input
                    type="number"
                    value={sphereParams.diameterZ}
                    onChange={e => handleSphereParamChange("diameterZ", Number(e.target.value))}
                    aria-label="Diameter Z"
                    style={{ width: 60 }}
                    placeholder="Z"
                    disabled={sphereParams.uniform}
                />
            </div>
            {/* Arc and Slice */}
            { [
                { label: "Arc", key: "arc" },
                { label: "Slice", key: "slice" },
            ].map(({ label, key }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                    <Input
                        type="number"
                        value={sphereParams[key]}
                        onChange={e => handleSphereParamChange(key, Number(e.target.value))}
                        aria-label={label}
                        style={{ flex: "1 1 auto" }}
                    />
                </div>
            ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button size="small" onClick={() => setSpherePopoverOpen(false)}>
                Cancel
            </Button>
            <Button
                size="small"
                appearance="primary"
                onClick={() => {
                    if (scene) {
                        // Create params object based on uniform checkbox
                        const createParams = {
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
            >
                Create
            </Button>
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
                                            >
                                                Box
                                            </Button>
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
                                                    <Button
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        size="small"
                                                        aria-label="Box Options"
                                                        onClick={() => setBoxPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            {[
                                                                { label: "Name", key: "name" },
                                                                { label: "Size", key: "size" },
                                                                { label: "Width", key: "width" },
                                                                { label: "Height", key: "height" },
                                                                { label: "Depth", key: "depth" },
                                                            ].map(({ label, key }) => (
                                                                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                                                                    <Input
                                                                        type={key === "name" ? "text" : "number"}
                                                                        value={boxParams[key]}
                                                                        onChange={e => handleBoxParamChange(key, key === "name" ? e.target.value : Number(e.target.value))}
                                                                        aria-label={label}
                                                                        style={{ flex: "1 1 auto" }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button size="small" onClick={() => setBoxPopoverOpen(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                appearance="primary"
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        MeshBuilder.CreateBox(boxParams.name, boxParams, scene);
                                                                        setCamera(scene);
                                                                    }
                                                                    setBoxPopoverOpen(false);
                                                                }}
                                                            >
                                                                Create
                                                            </Button>
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
                                            >
                                                Cylinder
                                            </Button>
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
                                                    <Button
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        size="small"
                                                        aria-label="Cylinder Options"
                                                        onClick={() => setCylinderPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            {[
                                                                { label: "Name", key: "name" },
                                                                { label: "Height", key: "height" },
                                                                { label: "Diameter Top", key: "diameterTop" },
                                                                { label: "Diameter Bottom", key: "diameterBottom" },
                                                                { label: "Diameter", key: "diameter" },
                                                                { label: "Tessellation", key: "tessellation" },
                                                                { label: "Subdivisions", key: "subdivisions" },
                                                                { label: "Arc", key: "arc" },
                                                            ].map(({ label, key }) => (
                                                                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                                                                    <Input
                                                                        type={key === "name" ? "text" : "number"}
                                                                        value={cylinderParams[key]}
                                                                        onChange={e => handleCylinderParamChange(key, key === "name" ? e.target.value : Number(e.target.value))}
                                                                        aria-label={label}
                                                                        style={{ flex: "1 1 auto" }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button size="small" onClick={() => setCylinderPopoverOpen(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                appearance="primary"
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        MeshBuilder.CreateCylinder(cylinderParams.name, cylinderParams, scene);
                                                                        setCamera(scene);
                                                                    }
                                                                    setCylinderPopoverOpen(false);
                                                                }}
                                                            >
                                                                Create
                                                            </Button>
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
                                            >
                                                Cone
                                            </Button>
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
                                                    <Button
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        size="small"
                                                        aria-label="Cone Options"
                                                        onClick={() => setConePopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            {[
                                                                { label: "Name", key: "name" },
                                                                { label: "Height", key: "height" },
                                                                { label: "Diameter", key: "diameter" },
                                                                { label: "Tessellation", key: "tessellation" },
                                                                { label: "Subdivisions", key: "subdivisions" },
                                                                { label: "Arc", key: "arc" },
                                                            ].map(({ label, key }) => (
                                                                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                                                                    <Input
                                                                        type={key === "name" ? "text" : "number"}
                                                                        value={coneParams[key]}
                                                                        onChange={e => handleConeParamChange(key, key === "name" ? e.target.value : Number(e.target.value))}
                                                                        aria-label={label}
                                                                        style={{ flex: "1 1 auto" }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <label style={{ flex: "0 0 100px" }}>Up</label>
                                                            <Checkbox
                                                                checked={isUpChecked}
                                                                onChange={() => {
                                                                    setIsUpChecked(true);
                                                                    setIsDownChecked(false);
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <label style={{ flex: "0 0 100px" }}>Down</label>
                                                            <Checkbox
                                                                checked={isDownChecked}
                                                                onChange={() => {
                                                                    setIsUpChecked(false);
                                                                    setIsDownChecked(true);
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button size="small" onClick={() => setConePopoverOpen(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                appearance="primary"
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
                                                            >
                                                                Create
                                                            </Button>
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
                                            >
                                                Ground
                                            </Button>
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
                                                    <Button
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        size="small"
                                                        aria-label="Ground Options"
                                                        onClick={() => setGroundPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            {[
                                                                { label: "Name", key: "name" },
                                                                { label: "Width", key: "width" },
                                                                { label: "Height", key: "height" },
                                                                { label: "Subdivisions", key: "subdivisions" },
                                                                { label: "Subdivisions X", key: "subdivisionsX" },
                                                                { label: "Subdivisions Y", key: "subdivisionsY" },
                                                            ].map(({ label, key }) => (
                                                                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <label style={{ flex: "0 0 100px" }}>{label}</label>
                                                                    <Input
                                                                        type={key === "name" ? "text" : "number"}
                                                                        value={groundParams[key]}
                                                                        onChange={e => handleGroundParamChange(key, key === "name" ? e.target.value : Number(e.target.value))}
                                                                        aria-label={label}
                                                                        style={{ flex: "1 1 auto" }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button size="small" onClick={() => setGroundPopoverOpen(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                appearance="primary"
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        MeshBuilder.CreateGround(groundParams.name, groundParams, scene);
                                                                        setCamera(scene);
                                                                    }
                                                                    setGroundPopoverOpen(false);
                                                                }}
                                                            >
                                                                Create
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Button
                                                onClick={() => {
                                                    if (scene) {
                                                        const nodeGeometry = NodeGeometry.CreateDefault("NodeGeometry");
                                                        nodeGeometry.build();
                                                        nodeGeometry.createMesh("NodeGeometry");
                                                        setCamera(scene);
                                                    } else {
                                                        alert("No scene available.");
                                                    }
                                                }}
                                            >
                                                Node Geometry
                                            </Button>
                                            <Popover
                                                open={nodeGeometryPopoverOpen}
                                                onOpenChange={(_, data) => setNodeGeometryPopoverOpen(data.open)}
                                                positioning={{
                                                    align: "start",
                                                    overflowBoundary: document.body,
                                                    autoSize: true,
                                                }}
                                                trapFocus
                                            >
                                                <PopoverTrigger disableButtonEnhancement>
                                                    <Button
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        size="small"
                                                        aria-label="Node Geometry Options"
                                                        onClick={() => setNodeGeometryPopoverOpen(true)}
                                                    />
                                                </PopoverTrigger>
                                                <PopoverSurface>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, minWidth: 300 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Name</label>
                                                                <Input
                                                                    type="text"
                                                                    value={nodeGeometryName}
                                                                    onChange={e => setNodeGeometryName(e.target.value)}
                                                                    aria-label="Name"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Snippet ID</label>
                                                                <Input
                                                                    type="text"
                                                                    value={nodeGeometrySnippetId}
                                                                    onChange={e => setNodeGeometrySnippetId(e.target.value)}
                                                                    aria-label="Snippet ID"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button size="small" onClick={() => setNodeGeometryPopoverOpen(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                appearance="primary"
                                                                onClick={async () => {
                                                                    if (scene) {
                                                                        try {
                                                                            let nodeGeometry;
                                                                            if (nodeGeometrySnippetId.trim() === "") {
                                                                                nodeGeometry = NodeGeometry.CreateDefault(nodeGeometryName || "NodeGeometry");
                                                                            } else {
                                                                                nodeGeometry = await NodeGeometry.ParseFromSnippetAsync(nodeGeometrySnippetId.trim());
                                                                            }
                                                                            nodeGeometry.build();
                                                                            nodeGeometry.createMesh(nodeGeometryName || "NodeGeometry");
                                                                            setCamera(scene);
                                                                        } catch (error) {
                                                                            alert("Failed to load Node Geometry from snippet ID.");
                                                                        }
                                                                    } else {
                                                                        alert("No scene available.");
                                                                    }
                                                                    setNodeGeometryPopoverOpen(false);
                                                                }}
                                                            >
                                                                Create
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverSurface>
                                            </Popover>
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
                >
                    Node Material
                </Button>
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
                        <Button
                            icon={<Settings20Regular />}
                            appearance="subtle"
                            size="small"
                            aria-label="Node Material Options"
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
                                <Button size="small" onClick={() => setNodeMaterialPopoverOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    size="small"
                                    appearance="primary"
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
                                >
                                    Create
                                </Button>
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
                            const pbrMaterial = new PBRMaterial(pbrMaterialName, scene);
                            // Optionally, you can add the material to the scene or log it
                        } else {
                            alert("No scene available.");
                        }
                    }}
                >
                    PBR Material
                </Button>
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
                        <Button
                            icon={<Settings20Regular />}
                            appearance="subtle"
                            size="small"
                            aria-label="PBR Material Options"
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
                                <Button size="small" onClick={() => setPbrMaterialPopoverOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    size="small"
                                    appearance="primary"
                                    onClick={() => {
                                        if (scene) {
                                            const pbrMaterial = new PBRMaterial(pbrMaterialName, scene);
                                            // Optionally, you can add the material to the scene or log it
                                        } else {
                                            alert("No scene available.");
                                        }
                                        setPbrMaterialPopoverOpen(false);
                                    }}
                                >
                                    Create
                                </Button>
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
                            const standardMaterial = new StandardMaterial(standardMaterialName, scene);
                            // Optionally, you can add the material to the scene or log it
                        } else {
                            alert("No scene available.");
                        }
                    }}
                >
                    Standard Material
                </Button>
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
                        <Button
                            icon={<Settings20Regular />}
                            appearance="subtle"
                            size="small"
                            aria-label="Standard Material Options"
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
                                <Button size="small" onClick={() => setStandardMaterialPopoverOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    size="small"
                                    appearance="primary"
                                    onClick={() => {
                                        if (scene) {
                                            const standardMaterial = new StandardMaterial(standardMaterialName, scene);
                                            // Optionally, you can add the material to the scene or log it
                                        } else {
                                            alert("No scene available.");
                                        }
                                        setStandardMaterialPopoverOpen(false);
                                    }}
                                >
                                    Create
                                </Button>
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
                                            >
                                                Point Light
                                            </Button>
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
                                                    <Button
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        size="small"
                                                        aria-label="Point Light Options"
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
                                                                    onChange={e => setPointLightName(e.target.value)}
                                                                    aria-label="Name"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Position</label>
                                                                <div style={{ display: "flex", gap: 8 }}>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                        <label>x</label>
                                                                        <Input
                                                                            type="number"
                                                                            value={pointLightPosition.x}
                                                                            onChange={e => setPointLightPosition({ ...pointLightPosition, x: parseFloat(e.target.value) })}
                                                                            aria-label="Position X"
                                                                            style={{ width: 60 }}
                                                                        />
                                                                    </div>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                        <label>y</label>
                                                                        <Input
                                                                            type="number"
                                                                            value={pointLightPosition.y}
                                                                            onChange={e => setPointLightPosition({ ...pointLightPosition, y: parseFloat(e.target.value) })}
                                                                            aria-label="Position Y"
                                                                            style={{ width: 60 }}
                                                                        />
                                                                    </div>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                        <label>z</label>
                                                                        <Input
                                                                            type="number"
                                                                            value={pointLightPosition.z}
                                                                            onChange={e => setPointLightPosition({ ...pointLightPosition, z: parseFloat(e.target.value) })}
                                                                            aria-label="Position Z"
                                                                            style={{ width: 60 }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button size="small" onClick={() => setPointLightPopoverOpen(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                appearance="primary"
                                                                onClick={() => {
                                                                    if (scene) {
                                                                        const light = new PointLight(pointLightName, new Vector3(pointLightPosition.x, pointLightPosition.y, pointLightPosition.z), scene);
                                                                        light.intensity = 1.0;
                                                                    } else {
                                                                        alert("No scene available.");
                                                                    }
                                                                    setPointLightPopoverOpen(false);
                                                                }}
                                                            >
                                                                Create
                                                            </Button>
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
                                            >
                                                Directional Light
                                            </Button>
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
                                                    <Button
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        size="small"
                                                        aria-label="Directional Light Options"
                                                        style={{
                                                            borderTopLeftRadius: 0,
                                                            borderBottomLeftRadius: 0,
                                                            marginLeft: -1,
                                                            height: "100%",
                                                        }}
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
                                                                    onChange={e => setDirectionalLightName(e.target.value)}
                                                                    aria-label="Name"
                                                                    style={{ flex: "1 1 auto" }}
                                                                />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <label style={{ flex: "0 0 100px" }}>Direction</label>
                                                                <div style={{ display: "flex", gap: 8 }}>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                        <label>x</label>
                                                                        <Input
                                                                            type="number"
                                                                            value={directionalLightDirection.x}
                                                                            onChange={e => setDirectionalLightDirection({ ...directionalLightDirection, x: parseFloat(e.target.value) })}
                                                                            aria-label="Direction X"
                                                                            style={{ width: 60 }}
                                                                        />
                                                                    </div>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                        <label>y</label>
                                                                        <Input
                                                                            type="number"
                                                                            value={directionalLightDirection.y}
                                                                            onChange={e => setDirectionalLightDirection({ ...directionalLightDirection, y: parseFloat(e.target.value) })}
                                                                            aria-label="Direction Y"
                                                                            style={{ width: 60 }}
                                                                        />
                                                                    </div>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                        <label>z</label>
                                                                        <Input
                                                                            type="number"
                                                                            value={directionalLightDirection.z}
                                                                            onChange={e => setDirectionalLightDirection({ ...directionalLightDirection, z: parseFloat(e.target.value) })}
                                                                            aria-label="Direction Z"
                                                                            style={{ width: 60 }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                                                            <Button size="small" onClick={() => setDirectionalLightPopoverOpen(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                appearance="primary"
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
                                                            >
                                                                Create
                                                            </Button>
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
                                            >
                                                Spotlight
                                            </Button>
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
                                                    <Button
                                                        icon={<Settings20Regular />}
                                                        appearance="subtle"
                                                        size="small"
                                                        aria-label="Spotlight Options"
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
                {["x", "y", "z"].map(axis => (
                    <Input
                        key={axis}
                        type="number"
                        value={spotlightParams.position[axis]}
                        onChange={e => handleSpotlightPositionChange(axis, Number(e.target.value))}
                        aria-label={`Position ${axis.toUpperCase()}`}
                        style={{ width: 60 }} // Consistent width for inputs
                    />
                ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ flex: "0 0 100px" }}>Direction</label>
                {["x", "y", "z"].map(axis => (
                    <Input
                        key={axis}
                        type="number"
                        value={spotlightParams.direction[axis]}
                        onChange={e => handleSpotlightDirectionChange(axis, Number(e.target.value))}
                        aria-label={`Direction ${axis.toUpperCase()}`}
                        style={{ width: 60 }} // Consistent width for inputs
                    />
                ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ flex: "0 0 100px" }}>Angle</label>
                <Input
                    type="number"
                    value={spotlightParams.angle}
                    onChange={e => handleSpotlightParamChange("angle", Number(e.target.value))}
                    aria-label="Angle"
                    style={{ flex: "1 1 auto" }}
                />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ flex: "0 0 100px" }}>Exponent</label>
                <Input
                    type="number"
                    value={spotlightParams.exponent}
                    onChange={e => handleSpotlightParamChange("exponent", Number(e.target.value))}
                    aria-label="Exponent"
                    style={{ flex: "1 1 auto" }}
                />
            </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button size="small" onClick={() => setSpotlightPopoverOpen(false)}>
                Cancel
            </Button>
            <Button
                size="small"
                appearance="primary"
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
            >
                Create
            </Button>
        </div>
    </div>
</PopoverSurface>
                                            </Popover>
                                        </div>
                                    </div>
                                </AccordionPanel>
                            </AccordionItem>
                        </Accordion>
                    </>
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
