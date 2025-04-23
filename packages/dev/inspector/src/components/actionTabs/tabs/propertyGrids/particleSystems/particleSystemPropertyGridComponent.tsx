import * as React from "react";

import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { CustomPropertyGridComponent } from "../customPropertyGridComponent";
import type { IParticleSystem } from "core/Particles/IParticleSystem";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { ParticleSystem } from "core/Particles/particleSystem";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { BoxParticleEmitter } from "core/Particles/EmitterTypes/boxParticleEmitter";
import { ConeParticleEmitter } from "core/Particles/EmitterTypes/coneParticleEmitter";
import { CylinderParticleEmitter } from "core/Particles/EmitterTypes/cylinderParticleEmitter";
import { HemisphericParticleEmitter } from "core/Particles/EmitterTypes/hemisphericParticleEmitter";
import { PointParticleEmitter } from "core/Particles/EmitterTypes/pointParticleEmitter";
import { SphereParticleEmitter } from "core/Particles/EmitterTypes/sphereParticleEmitter";
import { BoxEmitterGridComponent } from "./boxEmitterGridComponent";
import { ConeEmitterGridComponent } from "./coneEmitterGridComponent";
import { CylinderEmitterGridComponent } from "./cylinderEmitterGridComponent";
import { HemisphericEmitterGridComponent } from "./hemisphericEmitterGridComponent";
import { PointEmitterGridComponent } from "./pointEmitterGridComponent";
import { SphereEmitterGridComponent } from "./sphereEmitterGridComponent";
import { Vector3 } from "core/Maths/math.vector";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { MeshParticleEmitter } from "core/Particles/EmitterTypes/meshParticleEmitter";
import { MeshEmitterGridComponent } from "./meshEmitterGridComponent";
import { ValueGradientGridComponent, GradientGridMode } from "./valueGradientGridComponent";
import { Color3, Color4 } from "core/Maths/math.color";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { Tools } from "core/Misc/tools";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { ParticleHelper } from "core/Particles/particleHelper";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import { Constants } from "core/Engines/constants";
import { Texture } from "core/Materials/Textures/texture";
import { blendModeOptions } from "shared-ui-components/constToOptionsMaps";

interface IParticleSystemPropertyGridComponentProps {
    globalState: GlobalState;
    system: IParticleSystem;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

const particleEmitterTypeOptions = [
    { label: "Box", value: 0 },
    { label: "Cone", value: 1 },
    { label: "Cylinder", value: 2 },
    { label: "Hemispheric", value: 3 },
    { label: "Mesh", value: 4 },
    { label: "Point", value: 5 },
    { label: "Sphere", value: 6 },
];

export class ParticleSystemPropertyGridComponent extends React.Component<IParticleSystemPropertyGridComponentProps> {
    private _snippetUrl = Constants.SnippetUrl;

    constructor(props: IParticleSystemPropertyGridComponentProps) {
        super(props);
    }

    renderEmitter() {
        const system = this.props.system;
        switch (system.particleEmitterType?.getClassName()) {
            case "BoxParticleEmitter":
                return (
                    <BoxEmitterGridComponent
                        lockObject={this.props.lockObject}
                        globalState={this.props.globalState}
                        emitter={system.particleEmitterType as BoxParticleEmitter}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case "ConeParticleEmitter":
                return (
                    <ConeEmitterGridComponent
                        lockObject={this.props.lockObject}
                        globalState={this.props.globalState}
                        emitter={system.particleEmitterType as ConeParticleEmitter}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case "CylinderParticleEmitter":
                return (
                    <CylinderEmitterGridComponent
                        lockObject={this.props.lockObject}
                        globalState={this.props.globalState}
                        emitter={system.particleEmitterType as CylinderParticleEmitter}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case "HemisphericParticleEmitter":
                return (
                    <HemisphericEmitterGridComponent
                        lockObject={this.props.lockObject}
                        globalState={this.props.globalState}
                        emitter={system.particleEmitterType as HemisphericParticleEmitter}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case "MeshParticleEmitter":
                return (
                    <MeshEmitterGridComponent
                        lockObject={this.props.lockObject}
                        scene={system.getScene()!}
                        globalState={this.props.globalState}
                        emitter={system.particleEmitterType as MeshParticleEmitter}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case "PointParticleEmitter":
                return (
                    <PointEmitterGridComponent
                        lockObject={this.props.lockObject}
                        globalState={this.props.globalState}
                        emitter={system.particleEmitterType as PointParticleEmitter}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case "SphereParticleEmitter":
                return (
                    <SphereEmitterGridComponent
                        lockObject={this.props.lockObject}
                        globalState={this.props.globalState}
                        emitter={system.particleEmitterType as SphereParticleEmitter}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
        }

        return null;
    }

    raiseOnPropertyChanged(property: string, newValue: any, previousValue: any) {
        if (!this.props.onPropertyChangedObservable) {
            return;
        }

        const system = this.props.system;
        this.props.onPropertyChangedObservable.notifyObservers({
            object: system,
            property: property,
            value: newValue,
            initialValue: previousValue,
        });
    }

    renderControls() {
        const system = this.props.system;

        if (system instanceof GPUParticleSystem) {
            const isStarted = system.isStarted() && !system.isStopped();
            return (
                <ButtonLineComponent
                    label={isStarted ? "Stop" : "Start"}
                    onClick={() => {
                        if (isStarted) {
                            system.stop();
                            system.reset();
                        } else {
                            system.start();
                        }
                        this.forceUpdate();
                    }}
                />
            );
        }

        const isStarted = system.isStarted();
        return (
            <>
                {!system.isStopping() && (
                    <ButtonLineComponent
                        label={isStarted ? "Stop" : "Start"}
                        onClick={() => {
                            if (isStarted) {
                                system.stop();
                            } else {
                                system.start();
                            }
                            this.forceUpdate();
                        }}
                    />
                )}
                {system.isStopping() && <TextLineComponent label="System is stopping..." ignoreValue={true} />}
            </>
        );
    }

    saveToFile() {
        const system = this.props.system;
        const content = JSON.stringify(system.serialize(true));

        Tools.Download(new Blob([content]), "particleSystem.json");
    }

    loadFromFile(file: File) {
        const system = this.props.system;
        const scene = system.getScene();

        if (!scene) {
            return;
        }

        Tools.ReadFile(
            file,
            (data) => {
                const decoder = new TextDecoder("utf-8");
                const jsonObject = JSON.parse(decoder.decode(data));
                const isGpu = system instanceof GPUParticleSystem;

                system.dispose();
                this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

                const newSystem = isGpu ? GPUParticleSystem.Parse(jsonObject, scene!, "") : ParticleSystem.Parse(jsonObject, scene!, "");
                this.props.globalState.onSelectionChangedObservable.notifyObservers(newSystem);
            },
            undefined,
            true
        );
    }

    loadFromSnippet() {
        const system = this.props.system;
        const scene = system.getScene()!;
        const isGpu = system instanceof GPUParticleSystem;

        const snippedId = window.prompt("Please enter the snippet ID to use");

        if (!snippedId || !scene) {
            return;
        }

        system.dispose();
        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

        ParticleHelper.ParseFromSnippetAsync(snippedId, scene, isGpu)
            .then((newSystem) => {
                this.props.globalState.onSelectionChangedObservable.notifyObservers(newSystem);
            })
            .catch((err) => {
                alert("Unable to load your particle system: " + err);
            });
    }

    saveToSnippet() {
        const system = this.props.system;
        const content = JSON.stringify(system.serialize(true));

        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    const snippet = JSON.parse(xmlHttp.responseText);
                    const oldId = system.snippetId || "_BLANK";
                    system.snippetId = snippet.id;
                    if (snippet.version && snippet.version != "0") {
                        system.snippetId += "#" + snippet.version;
                    }
                    this.forceUpdate();
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(system.snippetId);
                    }

                    const windowAsAny = window as any;

                    if (windowAsAny.Playground && oldId) {
                        windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                            regex: new RegExp(`ParticleHelper.ParseFromSnippetAsync\\("${oldId}`, "g"),
                            replace: `ParticleHelper.ParseFromSnippetAsync("${system.snippetId}`,
                        });
                    }

                    alert("Particle system saved with ID: " + system.snippetId + " (please note that the id was also saved to your clipboard)");
                } else {
                    alert("Unable to save your particle system");
                }
            }
        };

        xmlHttp.open("POST", this._snippetUrl + (system.snippetId ? "/" + system.snippetId : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        const dataToSend = {
            payload: JSON.stringify({
                particleSystem: content,
            }),
            name: "",
            description: "",
            tags: "",
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    }

    updateTexture(file: File) {
        const system = this.props.system;

        Tools.ReadFile(
            file,
            (data) => {
                const blob = new Blob([data], { type: "octet/stream" });
                const url = URL.createObjectURL(blob);

                system.particleTexture = new Texture(url, system.getScene(), false, false);

                this.forceUpdate();
            },
            undefined,
            true
        );
    }

    override render() {
        const system = this.props.system;

        const meshEmitters = this.props.system.getScene()!.meshes.filter((m) => !!m.name);

        const emitterOptions = [
            { label: "None", value: -1 },
            { label: "Vector3", value: 0 },
        ];

        meshEmitters.sort((a, b) => a.name.localeCompare(b.name));

        emitterOptions.push(
            ...meshEmitters.map((v, i) => {
                return { label: v.name, value: i + 1 };
            })
        );

        return (
            <>
                <CustomPropertyGridComponent
                    globalState={this.props.globalState}
                    target={system}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="ID" value={system.id} onCopy />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        target={system}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextLineComponent label="Class" value={system.getClassName()} />
                    <TextLineComponent label="Capacity" value={system.getCapacity().toString()} />
                    <TextLineComponent label="Active count" value={system.getActiveCount().toString()} />
                    {system.particleTexture && (
                        <>
                            <TextureLinkLineComponent label="Texture" texture={system.particleTexture} onSelectionChangedObservable={this.props.onSelectionChangedObservable} />
                            <FileButtonLine label="Load texture from file" onClick={(file) => this.updateTexture(file)} accept=".jpg, .png, .tga, .dds, .env, .exr" />
                        </>
                    )}
                    <OptionsLine
                        label="Blend mode"
                        options={blendModeOptions}
                        target={system}
                        propertyName="blendMode"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="World offset"
                        target={system}
                        propertyName="worldOffset"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Gravity"
                        target={system}
                        propertyName="gravity"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Is billboard"
                        target={system}
                        propertyName="isBillboardBased"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent label="Is local" target={system} propertyName="isLocal" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent
                        label="Force depth write"
                        target={system}
                        propertyName="forceDepthWrite"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Update speed"
                        target={system}
                        propertyName="updateSpeed"
                        minimum={0}
                        maximum={0.1}
                        decimalCount={3}
                        step={0.001}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="COMMANDS" selection={this.props.globalState}>
                    {this.renderControls()}
                    <ButtonLineComponent
                        label={"Dispose"}
                        onClick={() => {
                            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                            system.dispose();
                        }}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="FILE" selection={this.props.globalState}>
                    <FileButtonLine label="Load" onClick={(file) => this.loadFromFile(file)} accept=".json" />
                    <ButtonLineComponent label="Save" onClick={() => this.saveToFile()} />
                </LineContainerComponent>
                <LineContainerComponent title="SNIPPET" selection={this.props.globalState}>
                    {system.snippetId && <TextLineComponent label="Snippet ID" value={system.snippetId} />}
                    <ButtonLineComponent label="Load from snippet server" onClick={() => this.loadFromSnippet()} />
                    <ButtonLineComponent label="Save to snippet server" onClick={() => this.saveToSnippet()} />
                </LineContainerComponent>
                <LineContainerComponent title="EMITTER" closed={true} selection={this.props.globalState}>
                    <OptionsLine
                        label="Emitter"
                        options={emitterOptions}
                        target={system}
                        propertyName="emitter"
                        noDirectUpdate={true}
                        onSelect={(value) => {
                            const valueAsNumber = value as number;
                            switch (valueAsNumber) {
                                case -1:
                                    this.raiseOnPropertyChanged("emitter", null, system.emitter);
                                    system.emitter = null;
                                    break;
                                case 0:
                                    this.raiseOnPropertyChanged("emitter", Vector3.Zero(), system.emitter);
                                    system.emitter = Vector3.Zero();
                                    break;
                                default:
                                    this.raiseOnPropertyChanged("emitter", meshEmitters[valueAsNumber - 1], system.emitter);
                                    system.emitter = meshEmitters[valueAsNumber - 1];
                            }
                            this.forceUpdate();
                        }}
                        extractValue={() => {
                            if (!system.emitter) {
                                return -1;
                            }

                            if ((system.emitter as Vector3).x !== undefined) {
                                return 0;
                            }

                            const meshIndex = meshEmitters.indexOf(system.emitter as AbstractMesh);

                            if (meshIndex > -1) {
                                return meshIndex + 1;
                            }

                            return -1;
                        }}
                    />
                    {system.emitter && (system.emitter as Vector3).x === undefined && (
                        <TextLineComponent
                            label="Link to emitter"
                            value={(system.emitter as AbstractMesh).name}
                            onLink={() => this.props.globalState.onSelectionChangedObservable.notifyObservers(system.emitter)}
                        />
                    )}
                    {system.emitter && (system.emitter as Vector3).x !== undefined && (
                        <Vector3LineComponent
                            lockObject={this.props.lockObject}
                            label="Position"
                            target={system}
                            propertyName="emitter"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    <OptionsLine
                        label="Type"
                        options={particleEmitterTypeOptions}
                        target={system}
                        propertyName="particleEmitterType"
                        noDirectUpdate={true}
                        onSelect={(value) => {
                            const valueAsNumber = value as number;
                            const currentType = system.particleEmitterType;
                            switch (valueAsNumber) {
                                case 0:
                                    system.particleEmitterType = new BoxParticleEmitter();
                                    break;

                                case 1:
                                    system.particleEmitterType = new ConeParticleEmitter();
                                    break;

                                case 2:
                                    system.particleEmitterType = new CylinderParticleEmitter();
                                    break;

                                case 3:
                                    system.particleEmitterType = new HemisphericParticleEmitter();
                                    break;

                                case 4:
                                    system.particleEmitterType = new MeshParticleEmitter();
                                    break;

                                case 5:
                                    system.particleEmitterType = new PointParticleEmitter();
                                    break;

                                case 6:
                                    system.particleEmitterType = new SphereParticleEmitter();
                                    break;
                            }
                            this.raiseOnPropertyChanged("particleEmitterType", system.particleEmitterType, currentType);
                            this.forceUpdate();
                        }}
                        extractValue={() => {
                            switch (system.particleEmitterType?.getClassName()) {
                                case "BoxParticleEmitter":
                                    return 0;
                                case "ConeParticleEmitter":
                                    return 1;
                                case "CylinderParticleEmitter":
                                    return 2;
                                case "HemisphericParticleEmitter":
                                    return 3;
                                case "MeshParticleEmitter":
                                    return 4;
                                case "PointParticleEmitter":
                                    return 5;
                                case "SphereParticleEmitter":
                                    return 6;
                            }

                            return 0;
                        }}
                    />
                    {this.renderEmitter()}
                </LineContainerComponent>
                <LineContainerComponent title="EMISSION" closed={true} selection={this.props.globalState}>
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Rate"
                        target={system}
                        propertyName="emitRate"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {system instanceof ParticleSystem && (
                        <ValueGradientGridComponent
                            globalState={this.props.globalState}
                            gradients={system.getEmitRateGradients()!}
                            label="Velocity gradients"
                            docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/tuning_gradients#change-speed-over-lifetime"
                            onCreateRequired={() => {
                                system.addEmitRateGradient(0, 50, 50);
                            }}
                            mode={GradientGridMode.Factor}
                            host={system}
                            codeRecorderPropertyName="getEmitRateGradients()"
                            lockObject={this.props.lockObject}
                        />
                    )}
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Min emit power"
                        target={system}
                        propertyName="minEmitPower"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Max emit power"
                        target={system}
                        propertyName="maxEmitPower"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <ValueGradientGridComponent
                        globalState={this.props.globalState}
                        gradients={system.getVelocityGradients()!}
                        label="Velocity gradients"
                        docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/tuning_gradients#change-speed-over-lifetime"
                        onCreateRequired={() => {
                            system.addVelocityGradient(0, 0.1, 0.1);
                        }}
                        mode={GradientGridMode.Factor}
                        host={system}
                        codeRecorderPropertyName="getVelocityGradients()"
                        lockObject={this.props.lockObject}
                    />
                    <ValueGradientGridComponent
                        globalState={this.props.globalState}
                        gradients={system.getLimitVelocityGradients()!}
                        label="Limit velocity gradients"
                        docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/tuning_gradients#limit-speed-over-lifetime"
                        onCreateRequired={() => {
                            system.addLimitVelocityGradient(0, 0.1, 0.1);
                        }}
                        mode={GradientGridMode.Factor}
                        host={system}
                        codeRecorderPropertyName="getLimitVelocityGradients()"
                        lockObject={this.props.lockObject}
                    />
                    <ValueGradientGridComponent
                        globalState={this.props.globalState}
                        gradients={system.getDragGradients()!}
                        label="Drag gradients"
                        docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/tuning_gradients#change-drag-over-lifetime"
                        onCreateRequired={() => {
                            system.addDragGradient(0, 0.1, 0.1);
                        }}
                        host={system}
                        codeRecorderPropertyName="getDragGradients()"
                        mode={GradientGridMode.Factor}
                        lockObject={this.props.lockObject}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="SIZE" closed={true} selection={this.props.globalState}>
                    {(!system.getSizeGradients() || system.getSizeGradients()?.length === 0) && (
                        <>
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="Min size"
                                target={system}
                                propertyName="minSize"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="Max size"
                                target={system}
                                propertyName="maxSize"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </>
                    )}
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Min scale X"
                        target={system}
                        propertyName="minScaleX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Max scale X"
                        target={system}
                        propertyName="maxScaleX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Min scale Y"
                        target={system}
                        propertyName="minScaleY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Max scale Y"
                        target={system}
                        propertyName="maxScaleY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {system instanceof ParticleSystem && (
                        <ValueGradientGridComponent
                            globalState={this.props.globalState}
                            gradients={system.getStartSizeGradients()!}
                            label="Start size gradients"
                            docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/tuning_gradients#change-size-over-lifetime"
                            onCreateRequired={() => {
                                system.addStartSizeGradient(0, 1, 1);
                            }}
                            host={system}
                            codeRecorderPropertyName="getStartSizeGradients()"
                            mode={GradientGridMode.Factor}
                            lockObject={this.props.lockObject}
                        />
                    )}
                    <ValueGradientGridComponent
                        globalState={this.props.globalState}
                        gradients={system.getSizeGradients()!}
                        label="Size gradients"
                        docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/tuning_gradients#change-size-over-lifetime"
                        onCreateRequired={() => {
                            system.addSizeGradient(0, 1, 1);
                        }}
                        host={system}
                        codeRecorderPropertyName="getSizeGradients()"
                        mode={GradientGridMode.Factor}
                        lockObject={this.props.lockObject}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="LIFETIME" closed={true} selection={this.props.globalState}>
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Min lifetime"
                        target={system}
                        propertyName="minLifeTime"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Max lifetime"
                        target={system}
                        propertyName="maxLifeTime"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Target stop duration"
                        target={system}
                        propertyName="targetStopDuration"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {system instanceof ParticleSystem && (
                        <ValueGradientGridComponent
                            globalState={this.props.globalState}
                            gradients={system.getLifeTimeGradients()!}
                            label="Lifetime gradients"
                            docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/tuning_gradients#change-lifetime-over-duration"
                            onCreateRequired={() => {
                                system.addLifeTimeGradient(0, 1, 1);
                            }}
                            host={system}
                            codeRecorderPropertyName="getLifeTimeGradients()"
                            mode={GradientGridMode.Factor}
                            lockObject={this.props.lockObject}
                        />
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="COLORS" closed={true} selection={this.props.globalState}>
                    {(!system.getColorGradients() || system.getColorGradients()?.length === 0) && (
                        <>
                            <Color4LineComponent
                                lockObject={this.props.lockObject}
                                label="Color 1"
                                target={system}
                                propertyName="color1"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <Color4LineComponent
                                lockObject={this.props.lockObject}
                                label="Color 2"
                                target={system}
                                propertyName="color2"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <Color4LineComponent
                                lockObject={this.props.lockObject}
                                label="Color dead"
                                target={system}
                                propertyName="colorDead"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </>
                    )}
                    <ValueGradientGridComponent
                        globalState={this.props.globalState}
                        gradients={system.getColorGradients()!}
                        label="Color gradients"
                        docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/tuning_gradients#change-color-over-lifetime"
                        onCreateRequired={() => {
                            system.addColorGradient(0, new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1));
                            system.addColorGradient(1, new Color4(1, 1, 1, 1), new Color4(1, 1, 1, 1));
                        }}
                        host={system}
                        codeRecorderPropertyName="getColorGradients()"
                        mode={GradientGridMode.Color4}
                        lockObject={this.props.lockObject}
                    />
                    {system instanceof ParticleSystem && (
                        <>
                            <CheckBoxLineComponent label="Enable ramp gradients" target={system} propertyName="useRampGradients" />
                            {system.useRampGradients && (
                                <>
                                    <ValueGradientGridComponent
                                        globalState={this.props.globalState}
                                        gradients={system.getRampGradients()!}
                                        label="Ramp gradients"
                                        docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/ramps_and_blends#ramp-gradients"
                                        onCreateRequired={() => {
                                            system.addRampGradient(0, Color3.White());
                                            system.addRampGradient(1, Color3.Black());
                                        }}
                                        mode={GradientGridMode.Color3}
                                        host={system}
                                        codeRecorderPropertyName="getRampGradients()"
                                        lockObject={this.props.lockObject}
                                    />

                                    <ValueGradientGridComponent
                                        globalState={this.props.globalState}
                                        gradients={system.getColorRemapGradients()!}
                                        label="Color remap gradients"
                                        docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/ramps_and_blends#ramp-gradients"
                                        onCreateRequired={() => {
                                            system.addColorRemapGradient(0, 1, 1);
                                        }}
                                        host={system}
                                        codeRecorderPropertyName="getColorRemapGradients()"
                                        mode={GradientGridMode.Factor}
                                        lockObject={this.props.lockObject}
                                    />
                                    <ValueGradientGridComponent
                                        globalState={this.props.globalState}
                                        gradients={system.getAlphaRemapGradients()!}
                                        label="Alpha remap gradients"
                                        docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/ramps_and_blends#ramp-gradients"
                                        onCreateRequired={() => {
                                            system.addAlphaRemapGradient(0, 1, 1);
                                        }}
                                        host={system}
                                        codeRecorderPropertyName="getAlphaRemapGradients()"
                                        mode={GradientGridMode.Factor}
                                        lockObject={this.props.lockObject}
                                    />
                                </>
                            )}
                        </>
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="ROTATION" closed={true} selection={this.props.globalState}>
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Min angular speed"
                        target={system}
                        propertyName="minAngularSpeed"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Max angular speed"
                        target={system}
                        propertyName="maxAngularSpeed"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Min initial rotation"
                        target={system}
                        propertyName="minInitialRotation"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Max initial rotation"
                        target={system}
                        propertyName="maxInitialRotation"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <ValueGradientGridComponent
                        globalState={this.props.globalState}
                        gradients={system.getAngularSpeedGradients()!}
                        label="Angular speed gradients"
                        docLink="https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/tuning_gradients#change-rotation-speed-over-lifetime"
                        onCreateRequired={() => {
                            system.addAngularSpeedGradient(0, 0.1, 0.1);
                        }}
                        host={system}
                        codeRecorderPropertyName="getAngularSpeedGradients()"
                        mode={GradientGridMode.Factor}
                        lockObject={this.props.lockObject}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="SPRITESHEET" closed={true} selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Animation sheet enabled"
                        target={system}
                        propertyName="isAnimationSheetEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="First sprite index"
                        isInteger={true}
                        target={system}
                        propertyName="startSpriteCellID"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Last sprite index"
                        isInteger={true}
                        target={system}
                        propertyName="endSpriteCellID"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Animation Loop"
                        target={system}
                        propertyName="spriteCellLoop"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Random start cell index"
                        target={system}
                        propertyName="spriteRandomStartCell"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Cell width"
                        isInteger={true}
                        target={system}
                        propertyName="spriteCellWidth"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Cell height"
                        isInteger={true}
                        target={system}
                        propertyName="spriteCellHeight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Cell change speed"
                        target={system}
                        propertyName="spriteCellChangeSpeed"
                        minimum={0}
                        maximum={10}
                        step={0.1}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
            </>
        );
    }
}
