import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { CustomPropertyGridComponent } from '../customPropertyGridComponent';
import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';
import { FloatLineComponent } from '../../../lines/floatLineComponent';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { TextureLinkLineComponent } from '../../../lines/textureLinkLineComponent';
import { OptionsLineComponent } from '../../../lines/optionsLineComponent';
import { ParticleSystem } from 'babylonjs/Particles/particleSystem';
import { Color4LineComponent } from '../../../lines/color4LineComponent';
import { Vector3LineComponent } from '../../../lines/vector3LineComponent';
import { CheckBoxLineComponent } from '../../../lines/checkBoxLineComponent';
import { SliderLineComponent } from '../../../lines/sliderLineComponent';
import { BoxParticleEmitter } from 'babylonjs/Particles/EmitterTypes/boxParticleEmitter';
import { ConeParticleEmitter } from 'babylonjs/Particles/EmitterTypes/coneParticleEmitter';
import { CylinderParticleEmitter } from 'babylonjs/Particles/EmitterTypes/cylinderParticleEmitter';
import { HemisphericParticleEmitter } from 'babylonjs/Particles/EmitterTypes/hemisphericParticleEmitter';
import { PointParticleEmitter } from 'babylonjs/Particles/EmitterTypes/pointParticleEmitter';
import { SphereParticleEmitter } from 'babylonjs/Particles/EmitterTypes/sphereParticleEmitter';
import { BoxEmitterGridComponent } from './boxEmitterGridComponent';
import { ConeEmitterGridComponent } from './coneEmitterGridComponent';
import { CylinderEmitterGridComponent } from './cylinderEmitterGridComponent';
import { HemisphericEmitterGridComponent } from './hemisphericEmitterGridComponent';
import { PointEmitterGridComponent } from './pointEmitterGridComponent';
import { SphereEmitterGridComponent } from './sphereEmitterGridComponent';
import { Vector3 } from 'babylonjs/Maths/math.vector';
import { AbstractMesh } from 'babylonjs/Meshes/abstractMesh';
import { MeshParticleEmitter } from 'babylonjs/Particles/EmitterTypes/meshParticleEmitter';
import { MeshEmitterGridComponent } from './meshEmitterGridComponent';
import { ValueGradientGridComponent, GradientGridMode } from './valueGradientGridComponent';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { GPUParticleSystem } from 'babylonjs/Particles/gpuParticleSystem';
import { Tools } from 'babylonjs/Misc/tools';
import { FileButtonLineComponent } from '../../../lines/fileButtonLineComponent';
import { TextInputLineComponent } from '../../../lines/textInputLineComponent';
import { ParticleHelper } from 'babylonjs/Particles/particleHelper';

interface IParticleSystemPropertyGridComponentProps {
    globalState: GlobalState;
    system: IParticleSystem,
    lockObject: LockObject,
    onSelectionChangedObservable?: Observable<any>,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class ParticleSystemPropertyGridComponent extends React.Component<IParticleSystemPropertyGridComponentProps> {
    private _snippetUrl = "https://snippet.babylonjs.com";

    constructor(props: IParticleSystemPropertyGridComponentProps) {
        super(props);
    }

    renderEmitter() {
        const system = this.props.system;
        const replaySource = "particlesystem.particleEmitterType";
        switch(system.particleEmitterType?.getClassName()) {
            case "BoxParticleEmitter":
                return (
                    <BoxEmitterGridComponent replaySourceReplacement={replaySource}
                        globalState={this.props.globalState} emitter={system.particleEmitterType as BoxParticleEmitter} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                );
            case "ConeParticleEmitter":
                return (
                    <ConeEmitterGridComponent replaySourceReplacement={replaySource}
                        globalState={this.props.globalState} emitter={system.particleEmitterType as ConeParticleEmitter} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                );
            case "CylinderParticleEmitter":
                return (
                    <CylinderEmitterGridComponent replaySourceReplacement={replaySource}
                        lockObject={this.props.lockObject} globalState={this.props.globalState} emitter={system.particleEmitterType as CylinderParticleEmitter} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                );        
            case "HemisphericParticleEmitter":
                return (
                    <HemisphericEmitterGridComponent replaySourceReplacement={replaySource}
                        lockObject={this.props.lockObject} globalState={this.props.globalState} emitter={system.particleEmitterType as HemisphericParticleEmitter} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                );  
            case "MeshParticleEmitter":
                return (
                    <MeshEmitterGridComponent replaySourceReplacement={replaySource} 
                    lockObject={this.props.lockObject} scene={system.getScene()} globalState={this.props.globalState} emitter={system.particleEmitterType as MeshParticleEmitter} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                );                 
            case "PointParticleEmitter":
                return (
                    <PointEmitterGridComponent replaySourceReplacement={replaySource}
                        lockObject={this.props.lockObject} globalState={this.props.globalState} emitter={system.particleEmitterType as PointParticleEmitter} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                );  
            case "SphereParticleEmitter":
                return (
                    <SphereEmitterGridComponent replaySourceReplacement={replaySource}
                        lockObject={this.props.lockObject} globalState={this.props.globalState} emitter={system.particleEmitterType as SphereParticleEmitter} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
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
            initialValue: previousValue
        });
    }

    renderControls() {
        const system = this.props.system;

        if (system instanceof GPUParticleSystem) {
            let isStarted = system.isStarted() && !system.isStopped();
            return (
                <ButtonLineComponent label={isStarted ? "Stop" : "Start"} onClick={() => {
                    if (isStarted) {
                        system.stop();
                        system.reset();
                    } else {
                        system.start();
                    }
                    this.forceUpdate();
                }} />
            );
        }

        let isStarted = system.isStarted();
        return (
            <>
                {
                    !system.isStopping() && 
                    <ButtonLineComponent label={isStarted ? "Stop" : "Start"} onClick={() => {
                        if (isStarted) {
                            system.stop();
                        } else {
                            system.start();
                        }
                        this.forceUpdate();
                    }} />
                }
                {
                    system.isStopping() && 
                    <TextLineComponent label="System is stoppping..." ignoreValue={true}/>
                }
            </>
        )
    }

    saveToFile() {        
        const system = this.props.system;
        let content = JSON.stringify(system.serialize(true));

        Tools.Download(new Blob([content]), "particleSystem.json");
    }

    loadFromFile(file: File) {
        const system = this.props.system;
        const scene = system.getScene();

        Tools.ReadFile(file, (data) => {
            let decoder = new TextDecoder("utf-8");
            let jsonObject = JSON.parse(decoder.decode(data));
            let isGpu = system instanceof GPUParticleSystem;
            
            system.dispose();            
            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

            let newSystem = isGpu ? GPUParticleSystem.Parse(jsonObject, scene, "") : ParticleSystem.Parse(jsonObject, scene, "");
            this.props.globalState.onSelectionChangedObservable.notifyObservers(newSystem);
        }, undefined, true);
    }

    loadFromSnippet() {
        const system = this.props.system;
        const scene = system.getScene();
        let isGpu = system instanceof GPUParticleSystem;

        let snippedID = window.prompt("Please enter the snippet ID to use");

        if (!snippedID) {
            return;
        }
        
        system.dispose();            
        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

        ParticleHelper.CreateFromSnippetAsync(snippedID, scene, isGpu).then((newSystem) => {
            this.props.globalState.onSelectionChangedObservable.notifyObservers(newSystem);
        }).catch(err => {
            alert("Unable to load your particle system: " + err);
        });
    }

    saveToSnippet() {
        const system = this.props.system;
        let content = JSON.stringify(system.serialize(true));

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    var snippet = JSON.parse(xmlHttp.responseText);
                    const oldId = system.snippetId || "_BLANK";
                    system.snippetId = snippet.id;
                    if (snippet.version && snippet.version != "0") {
                        system.snippetId += "#" + snippet.version;
                    }
                    this.forceUpdate();
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(system.snippetId);
                    }

                    let windowAsAny = window as any;

                    if (windowAsAny.Playground && oldId) {
                        windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                            regex: new RegExp(`ParticleHelper.CreateFromSnippetAsync\\("${oldId}`, "g"),
                            replace: `ParticleHelper.CreateFromSnippetAsync("${system.snippetId}`
                        });
                    }

                    alert("Particle system saved with ID: " + system.snippetId + " (please note that the id was also saved to your clipboard)");
                }
                else {
                    alert("Unable to save your particle system");
                }
            }
        }

        xmlHttp.open("POST", this._snippetUrl + (system.snippetId ? "/" + system.snippetId : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        var dataToSend = {
            payload : JSON.stringify({
                particleSystem: content
            }),
            name: "",
            description: "",
            tags: ""
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    }

    render() {
        const system = this.props.system;

        var blendModeOptions = [
            { label: "Add", value: ParticleSystem.BLENDMODE_ADD },
            { label: "Multiply", value: ParticleSystem.BLENDMODE_MULTIPLY },
            { label: "Multiply Add", value: ParticleSystem.BLENDMODE_MULTIPLYADD },
            { label: "OneOne", value: ParticleSystem.BLENDMODE_ONEONE },
            { label: "Standard", value: ParticleSystem.BLENDMODE_STANDARD },
        ];   
        
        var particleEmitterTypeOptions = [
            { label: "Box", value: 0 },
            { label: "Cone", value: 1 },
            { label: "Cylinder", value: 2 },
            { label: "Hemispheric", value: 3 },
            { label: "Mesh", value: 4 },
            { label: "Point", value: 5 },
            { label: "Sphere", value: 6 },
        ];


        var meshEmitters = this.props.system.getScene().meshes.filter(m => !!m.name);

        var emitterOptions = [
            { label: "None", value: -1 },
            { label: "Vector3", value: 0 }
        ];

        meshEmitters.sort((a, b) => a.name.localeCompare(b.name));

        emitterOptions.push(...meshEmitters.map((v, i) => {
            return {label: v.name, value: i + 1}
        }));

        return (
            <div className="pane">
                <CustomPropertyGridComponent globalState={this.props.globalState} target={system}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="ID" value={system.id} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={system} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <TextLineComponent label="Class" value={system.getClassName()} />  
                    <TextLineComponent label="Capacity" value={system.getCapacity().toString()} />  
                    <TextLineComponent label="Active count" value={system.getActiveCount().toString()} />  
                    <TextureLinkLineComponent label="Texture" texture={system.particleTexture} onSelectionChangedObservable={this.props.onSelectionChangedObservable}/>
                    <OptionsLineComponent label="Blend mode" options={blendModeOptions} target={system} propertyName="blendMode" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="World offset" target={system} propertyName="worldOffset"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Gravity" target={system} propertyName="gravity"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Is billboard" target={system} propertyName="isBillboardBased" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Is local" target={system} propertyName="isLocal" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Force depth write" target={system} propertyName="forceDepthWrite" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Update speed" target={system} propertyName="updateSpeed" minimum={0} maximum={0.1} decimalCount={3} step={0.001} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>                      
                <LineContainerComponent globalState={this.props.globalState} title="COMMANDS">
                    {this.renderControls()}
                    <ButtonLineComponent label={"Dispose"} onClick={() => {
                        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                        system.dispose();
                    }} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="FILE">
                    <FileButtonLineComponent label="Load" onClick={(file) => this.loadFromFile(file)} accept=".json" />
                    <ButtonLineComponent label="Save" onClick={() => this.saveToFile()} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="SNIPPET">
                    {
                        system.snippetId &&
                        <TextLineComponent label="Snippet ID" value={system.snippetId} />
                    }
                    <ButtonLineComponent label="Load from snippet server" onClick={() => this.loadFromSnippet()} />
                    <ButtonLineComponent label="Save to snippet server" onClick={() => this.saveToSnippet()} />
                </LineContainerComponent>                
                <LineContainerComponent globalState={this.props.globalState} title="EMITTER" closed={true}>
                <OptionsLineComponent 
                        label="Emitter" 
                        options={emitterOptions} 
                        target={system}
                        propertyName="emitter"
                        noDirectUpdate={true}
                        onSelect={(value: number) => {
                            switch(value) {
                                case -1:
                                    this.raiseOnPropertyChanged("emitter", null, system.emitter);
                                    system.emitter = null;                                    
                                    break;
                                case 0:
                                    this.raiseOnPropertyChanged("emitter", Vector3.Zero(), system.emitter);
                                    system.emitter = Vector3.Zero();
                                    break;
                                default:
                                    
                                    this.raiseOnPropertyChanged("emitter", meshEmitters[value - 1], system.emitter);
                                    system.emitter = meshEmitters[value - 1];
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

                            let meshIndex = meshEmitters.indexOf(system.emitter as AbstractMesh)

                            if (meshIndex > -1) {
                                return meshIndex + 1;
                            }

                            return -1;
                        }}
                        />   
                    {
                        system.emitter && ((system.emitter as Vector3).x === undefined) &&
                        <TextLineComponent label="Link to emitter" value={(system.emitter as AbstractMesh).name} onLink={() => this.props.globalState.onSelectionChangedObservable.notifyObservers(system.emitter)}/>
                    }                  
                    {
                        system.emitter && ((system.emitter as Vector3).x !== undefined) &&
                        <Vector3LineComponent label="Position" target={system} propertyName="emitter" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    }                                                     
                    <OptionsLineComponent 
                        label="Type" 
                        options={particleEmitterTypeOptions} 
                        target={system}
                        propertyName="particleEmitterType"
                        noDirectUpdate={true}
                        onSelect={(value: number) => {
                            const currentType = system.particleEmitterType;
                            switch(value) {
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
                            this.raiseOnPropertyChanged("particleEmitterType", system.particleEmitterType, currentType)
                            this.forceUpdate();
                        }}
                        extractValue={() => {
                            switch(system.particleEmitterType?.getClassName()) {
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
                        }}/>
                    {
                        this.renderEmitter()
                    }
                </LineContainerComponent>       
                <LineContainerComponent globalState={this.props.globalState} title="EMISSION" closed={true}>
                    <FloatLineComponent lockObject={this.props.lockObject} label="Rate" target={system} propertyName="emitRate" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        system instanceof ParticleSystem && 
                        <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getEmitRateGradients()!} 
                            label="Velocity gradients"                        
                            docLink="https://doc.babylonjs.com/babylon101/particles#emit-rate-over-time"
                            onCreateRequired={() => {
                                system.addEmitRateGradient(0, 50, 50);
                                this.props.globalState.onCodeChangedObservable.notifyObservers({
                                    object: system,
                                    code: `TARGET.addEmitRateGradient(0, 50, 50);`
                                });
                            }}
                            mode={GradientGridMode.Factor}
                            host={system}    
                            codeRecorderPropertyName="getEmitRateGradients()"
                            lockObject={this.props.lockObject}/>                  
                    }
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min emit power" target={system} propertyName="minEmitPower" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max emit power" target={system} propertyName="maxEmitPower" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />               
                    <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getVelocityGradients()!} 
                        label="Velocity gradients"                        
                        docLink="https://doc.babylonjs.com/babylon101/particles#velocity-over-time"
                        onCreateRequired={() => {
                            system.addVelocityGradient(0, 0.1, 0.1);
                            this.props.globalState.onCodeChangedObservable.notifyObservers({
                                object: system,
                                code: `TARGET.addVelocityGradient(0, 0.1, 0.1);`
                            });                            
                        }}                        
                        mode={GradientGridMode.Factor}
                        host={system}    
                        codeRecorderPropertyName="getVelocityGradients()"
                        lockObject={this.props.lockObject}/>
                    <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getLimitVelocityGradients()!} 
                        label="Limit velocity gradients"
                        docLink="https://doc.babylonjs.com/babylon101/particles#limit-velocity-over-time"
                        onCreateRequired={() => {
                            system.addLimitVelocityGradient(0, 0.1, 0.1);
                            this.props.globalState.onCodeChangedObservable.notifyObservers({
                                object: system,
                                code: `TARGET.addLimitVelocityGradient(0, 0.1, 0.1);`
                            });                             
                        }}           
                        mode={GradientGridMode.Factor}
                        host={system}    
                        codeRecorderPropertyName="getLimitVelocityGradients()"                        
                        lockObject={this.props.lockObject}/>
                    <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getDragGradients()!} 
                        label="Drag gradients"                        
                        docLink="https://doc.babylonjs.com/babylon101/particles#drag-factor"
                        onCreateRequired={() => {
                            system.addDragGradient(0, 0.1, 0.1);
                            this.props.globalState.onCodeChangedObservable.notifyObservers({
                                object: system,
                                code: `TARGET.addDragGradient(0, 0.1, 0.1);`
                            });                                
                        }}
                        host={system}    
                        codeRecorderPropertyName="getDragGradients()"                         
                        mode={GradientGridMode.Factor}                        
                        lockObject={this.props.lockObject}/>
                </LineContainerComponent>                  
                <LineContainerComponent globalState={this.props.globalState} title="SIZE" closed={true}>
                    {
                        (!system.getSizeGradients() || system.getSizeGradients()?.length === 0)&& 
                        <>
                            <FloatLineComponent lockObject={this.props.lockObject} label="Min size" target={system} propertyName="minSize" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <FloatLineComponent lockObject={this.props.lockObject} label="Max size" target={system} propertyName="maxSize" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        </>
                    }
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min scale X" target={system} propertyName="minScaleX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max scale X" target={system} propertyName="maxScaleX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min scale Y" target={system} propertyName="minScaleY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max scale Y" target={system} propertyName="maxScaleY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        system instanceof ParticleSystem && 
                        <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getStartSizeGradients()!} 
                            label="Start size gradients"
                            docLink="https://doc.babylonjs.com/babylon101/particles#start-size-over-time"
                            onCreateRequired={() => {
                                system.addStartSizeGradient(0, 1, 1);
                                this.props.globalState.onCodeChangedObservable.notifyObservers({
                                    object: system,
                                    code: `TARGET.addStartSizeGradient(0, 1, 1);`
                                });                                
                            }}       
                            host={system}    
                            codeRecorderPropertyName="getStartSizeGradients()"
                            mode={GradientGridMode.Factor}
                            lockObject={this.props.lockObject}/>                                    
                    }
                    <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getSizeGradients()!} 
                        label="Size gradients"
                        docLink="https://doc.babylonjs.com/babylon101/particles#size"
                        onCreateRequired={() => {
                            system.addSizeGradient(0, 1, 1);
                            this.props.globalState.onCodeChangedObservable.notifyObservers({
                                object: system,
                                code: `TARGET.addSizeGradient(0, 1, 1);`
                            });                             
                        }}
                        host={system}    
                        codeRecorderPropertyName="getSizeGradients()"                            
                        mode={GradientGridMode.Factor}                        
                        lockObject={this.props.lockObject}/>
                </LineContainerComponent>          
                <LineContainerComponent globalState={this.props.globalState} title="LIFETIME" closed={true}>
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min lifetime" target={system} propertyName="minLifeTime" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max lifetime" target={system} propertyName="maxLifeTime" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Target stop duration" target={system} propertyName="targetStopDuration" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        system instanceof ParticleSystem &&                     
                        <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getLifeTimeGradients()!} 
                            label="Lifetime gradients"
                            docLink="https://doc.babylonjs.com/babylon101/particles#lifetime"
                            onCreateRequired={() => {
                                system.addLifeTimeGradient(0, 1, 1);
                                this.props.globalState.onCodeChangedObservable.notifyObservers({
                                    object: system,
                                    code: `TARGET.addLifeTimeGradient(0, 1, 1);`
                                });                               
                            }}
                            host={system}    
                            codeRecorderPropertyName="getLifeTimeGradients()"                          
                            mode={GradientGridMode.Factor}                        
                            lockObject={this.props.lockObject}/>
                    }                    
                </LineContainerComponent>    
                <LineContainerComponent globalState={this.props.globalState} title="COLORS" closed={true}>
                    {
                        (!system.getColorGradients() || system.getColorGradients()?.length === 0) &&
                        <>
                            <Color4LineComponent label="Color 1" target={system} propertyName="color1" 
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <Color4LineComponent label="Color 2" target={system} propertyName="color2" 
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <Color4LineComponent label="Color dead" target={system} propertyName="colorDead" 
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable} />  
                        </>
                    }
                    <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getColorGradients()!} 
                        label="Color gradients"
                        docLink="https://doc.babylonjs.com/babylon101/particles#particle-colors"
                        onCreateRequired={() => {
                            system.addColorGradient(0, new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1));
                            system.addColorGradient(1, new Color4(1, 1, 1, 1), new Color4(1, 1, 1, 1));
                            this.props.globalState.onCodeChangedObservable.notifyObservers({
                                object: system,
                                code: `TARGET.addColorGradient(0, new BABYLON.Color4(0, 0, 0, 1), new BABYLON.Color4(0, 0, 0, 1));`
                            });     
                            this.props.globalState.onCodeChangedObservable.notifyObservers({
                                object: system,
                                code: `TARGET.addColorGradient(1, new BABYLON.Color4(1, 1, 1, 1), new BABYLON.Color4(1, 1, 1, 1));`
                            });                            
                        }}
                        host={system}    
                        codeRecorderPropertyName="getColorGradients()"                              
                        mode={GradientGridMode.Color4}                        
                        lockObject={this.props.lockObject}/>                    
                    {
                        system instanceof ParticleSystem && 
                        <>
                            <CheckBoxLineComponent label="Enable ramp grandients" target={system} propertyName="useRampGradients"/>
                            {
                                system.useRampGradients &&
                                <>
                                    <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getRampGradients()!} 
                                    label="Ramp gradients"
                                    docLink="https://doc.babylonjs.com/babylon101/particles#ramp-gradients"
                                    onCreateRequired={() => {
                                        system.addRampGradient(0, Color3.White());
                                        system.addRampGradient(1, Color3.Black());
                                        this.props.globalState.onCodeChangedObservable.notifyObservers({
                                            object: system,
                                            code: `TARGET.addRampGradient(0, BABYLON.Color3.White());`
                                        });          
                                        this.props.globalState.onCodeChangedObservable.notifyObservers({
                                            object: system,
                                            code: `TARGET.addRampGradient(1, BABYLON.Color3.Black());`
                                        });                          
                                    }}
                                    mode={GradientGridMode.Color3}      
                                    host={system}    
                                    codeRecorderPropertyName="getRampGradients()"                                                   
                                    lockObject={this.props.lockObject}/>                    
                                                                        
                                <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getColorRemapGradients()!} 
                                    label="Color remap gradients"
                                    docLink="https://doc.babylonjs.com/babylon101/particles#ramp-gradients"
                                    onCreateRequired={() => {
                                        system.addColorRemapGradient(0, 1, 1);
                                        this.props.globalState.onCodeChangedObservable.notifyObservers({
                                            object: system,
                                            code: `TARGET.addColorRemapGradient(0, 1, 1);`
                                        });
                                    }}
                                    host={system}    
                                    codeRecorderPropertyName="getColorRemapGradients()"      
                                    mode={GradientGridMode.Factor}                        
                                    lockObject={this.props.lockObject}/>                    
                                <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getAlphaRemapGradients()!} 
                                    label="Alpha remap gradients"
                                    docLink="https://doc.babylonjs.com/babylon101/particles#ramp-gradients"
                                    onCreateRequired={() => {
                                        system.addAlphaRemapGradient(0, 1, 1);
                                        this.props.globalState.onCodeChangedObservable.notifyObservers({
                                            object: system,
                                            code: `TARGET.addAlphaRemapGradient(0, 1, 1);`
                                        });                            
                                    }}
                                    host={system}    
                                    codeRecorderPropertyName="getAlphaRemapGradients()"                             
                                    mode={GradientGridMode.Factor}                        
                                    lockObject={this.props.lockObject}/>
                                </>
                            }                           
                        </>
                    }                                   
                </LineContainerComponent>                     
                <LineContainerComponent globalState={this.props.globalState} title="ROTATION" closed={true}>
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min angular speed" target={system} propertyName="minAngularSpeed" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max angular speed" target={system} propertyName="maxAngularSpeed" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min initial rotation" target={system} propertyName="minInitialRotation" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max initial rotation" target={system} propertyName="maxInitialRotation" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <ValueGradientGridComponent globalState={this.props.globalState} gradients={system.getAngularSpeedGradients()!} 
                        label="Angular speed gradients"                        
                        docLink="hhttps://doc.babylonjs.com/babylon101/particles#rotation"
                        onCreateRequired={() => {
                            system.addAngularSpeedGradient(0, 0.1, 0.1);
                            this.props.globalState.onCodeChangedObservable.notifyObservers({
                                object: system,
                                code: `TARGET.addAngularSpeedGradient(0, 0.1, 0.1);`
                            });                               
                        }}                        
                        host={system}    
                        codeRecorderPropertyName="getAngularSpeedGradients()"    
                        mode={GradientGridMode.Factor}                        
                        lockObject={this.props.lockObject}/>                    
                </LineContainerComponent>  
                <LineContainerComponent globalState={this.props.globalState} title="SPRITESHEET" closed={true}>
                    <CheckBoxLineComponent label="Animation sheet enabled" target={system} propertyName="isAnimationSheetEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="First sprite index" isInteger={true} target={system} propertyName="startSpriteCellID" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="Last sprite index" isInteger={true} target={system} propertyName="endSpriteCellID" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Random start cell index" target={system} propertyName="spriteRandomStartCell" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="Cell width" isInteger={true} target={system} propertyName="spriteCellWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="Cell height" isInteger={true} target={system} propertyName="spriteCellHeight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Cell change speed" target={system} propertyName="spriteCellChangeSpeed" minimum={0} maximum={10} step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}