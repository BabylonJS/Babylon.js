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
            { label: "Point", value: 4 },
            { label: "Sphere", value: 5 },
        ];

        return (
            <div className="pane">
                <CustomPropertyGridComponent globalState={this.props.globalState} target={system}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="ID" value={system.id} />
                    <TextLineComponent label="Class" value={system.getClassName()} />  
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
                <LineContainerComponent globalState={this.props.globalState} title="Emitter">
                    <OptionsLineComponent 
                        label="Type" 
                        options={particleEmitterTypeOptions} 
                        target={system}
                        propertyName="particleEmitterType"
                        noDirectUpdate={true}
                        onSelect={(value: number) => {
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
                                    system.particleEmitterType = new PointParticleEmitter();
                                    break;   

                                case 5:
                                    system.particleEmitterType = new SphereParticleEmitter();
                                    break;
                            }
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
                                case "PointParticleEmitter":
                                    return 4;
                                case "SphereParticleEmitter":
                                    return 5;                                                                                                          
                            }

                            return 0;
                        }}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />

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
                <LineContainerComponent globalState={this.props.globalState} title="EMISSION">
                    <FloatLineComponent lockObject={this.props.lockObject} label="Rate" target={system} propertyName="emitRate" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Min emit power" target={system} propertyName="minEmitPower" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Max emit power" target={system} propertyName="maxEmitPower" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
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