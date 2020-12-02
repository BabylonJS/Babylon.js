
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';

export class ShapePropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
        
        this.mode = this.props.guiBlock.getClassName();
    }

    getAsType()
    {
        switch (this.mode) {
            case "Rectangle":
                return this.props.guiBlock as BABYLON.GUI.Rectangle;
            case "Ellipse":
                return this.props.guiBlock as BABYLON.GUI.Ellipse;       
            default:
                return null;
        }
    }

    private mode : string;

    render() {
        return (
            <>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} guiBlock={this.props.guiBlock}/>
                <LineContainerComponent title="PROPERTIES">
                <FloatLineComponent globalState={this.props.globalState} label="Thinkness" target={this.getAsType()} propertyName="thickness"/>
                {this.mode === "Rectangle" &&
                 <FloatLineComponent globalState={this.props.globalState} label="Corner Radius" target={this.getAsType()} propertyName="cornerRadius"/>}
                </LineContainerComponent>            
            </>
        );
    }
}