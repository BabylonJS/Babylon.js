import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../../../sharedUiComponents/lines/lineContainerComponent";
import { TextLineComponent } from "../../../../../sharedUiComponents/lines/textLineComponent";
import { LockObject } from "../../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { GlobalState } from '../../../../globalState';
import { IExplorerExtensibilityGroup } from 'babylonjs/Debug/debugLayer';
import { TextInputLineComponent } from '../../../../../sharedUiComponents/lines/textInputLineComponent';
import { SliderLineComponent } from '../../../../../sharedUiComponents/lines/sliderLineComponent';
import { EffectLayer } from "babylonjs/Layers/effectLayer";

interface ILayerPropertyGridComponentProps {
    globalState: GlobalState;
    layer: EffectLayer;    
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class LayerPropertyGridComponent extends React.Component<ILayerPropertyGridComponentProps> {
    constructor(props: ILayerPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const layer = this.props.layer;

        return (
            <div className="pane">
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="Class" value={layer.getClassName()} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={layer} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <SliderLineComponent label="Intensity" 
                        target={layer} propertyName="intensity"
                        minimum={0} maximum={2} step={0.01} decimalCount={2} 
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />       
                   <SliderLineComponent label="Blur Kernel Size" 
                        target={layer} propertyName="blurKernelSize"                        
                        minimum={0} maximum={64} step={1} decimalCount={0} 
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />                                         
               </LineContainerComponent>
            </div>
        );
    }
}