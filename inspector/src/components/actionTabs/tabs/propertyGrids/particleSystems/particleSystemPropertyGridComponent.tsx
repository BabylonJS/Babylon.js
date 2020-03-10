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

interface IParticleSystemPropertyGridComponentProps {
    globalState: GlobalState;
    system: IParticleSystem,
    lockObject: LockObject,
    onSelectionChangedObservable?: Observable<any>,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class ParticleSystemPropertyGridComponent extends React.Component<IParticleSystemPropertyGridComponentProps> {
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
                    <TextLineComponent label="Class" value={system.getClassName()} />  
                    <TextLineComponent label="Capacity" value={system.getCapacity().toString()} />  
                    <TextureLinkLineComponent label="Texture" texture={system.particleTexture} onSelectionChangedObservable={this.props.onSelectionChangedObservable}/>
                    <OptionsLineComponent label="Blend mode" options={blendModeOptions} target={system} propertyName="blendMode" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector3LineComponent label="Gravity" target={system} propertyName="gravity"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Is billboard" target={system} propertyName="isBillboardBased" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Is local" target={system} propertyName="isLocal" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Update speed" target={system} propertyName="updateSpeed" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>                      
                <LineContainerComponent globalState={this.props.globalState} title="OPTIONS">
                    <ButtonLineComponent label={system.isStarted() ? "Stop" : "Start"} onClick={() => {
                        if (system.isStarted()) {
                            system.stop();
                        } else {
                            system.start();
                        }
                    }} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="EMITTER">
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
                <LineContainerComponent globalState={this.props.globalState} title="EMISSION">
                    <FloatLineComponent lockObject={this.props.lockObject} label="Rate" target={system} propertyName="emitRate" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min emit power" target={system} propertyName="minEmitPower" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max emit power" target={system} propertyName="maxEmitPower" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>  
                <LineContainerComponent globalState={this.props.globalState} title="SIZE">
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min size" target={system} propertyName="minSize" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max size" target={system} propertyName="maxSize" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min scale X" target={system} propertyName="minScaleX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max scale X" target={system} propertyName="maxScaleX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min scale Y" target={system} propertyName="minScaleY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max scale Y" target={system} propertyName="maxScaleY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>          
                <LineContainerComponent globalState={this.props.globalState} title="LIFETIME">
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min lifetime" target={system} propertyName="minLifeTime" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max lifetime" target={system} propertyName="maxLifeTime" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>    
                <LineContainerComponent globalState={this.props.globalState} title="COLORS">
                    <Color4LineComponent label="Color 1" target={system} propertyName="color1" 
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color4LineComponent label="Color 2" target={system} propertyName="color2" 
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color4LineComponent label="Color dead" target={system} propertyName="colorDead" 
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>                     
                <LineContainerComponent globalState={this.props.globalState} title="ROTATION">
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min angular speed" target={system} propertyName="minAngularSpeed" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max angular speed" target={system} propertyName="maxAngularSpeed" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min initial rotation" target={system} propertyName="minInitialRotation" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max initial rotation" target={system} propertyName="maxInitialRotation" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>  
            </div>
        );
    }
}