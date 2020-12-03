
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';
import { Vector2LineComponent } from '../../sharedComponents/vector2LineComponent';

export class TextPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
        this.line = this.props.guiBlock as BABYLON.GUI.Line;
        this.point1 = new BABYLON.Vector2(parseInt(this.line.x1.toString()), parseInt(this.line.y1.toString()));
        this.point2 = new BABYLON.Vector2(parseInt(this.line.x2.toString()), parseInt(this.line.y2.toString()));
    }

    private line : BABYLON.GUI.Line;
    public point1: BABYLON.Vector2;
    public point2: BABYLON.Vector2;

    render() {

        //need to add array for dash.
        return (
            <>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} guiBlock={this.props.guiBlock}/>
                <LineContainerComponent title="PROPERTIES">
                <FloatLineComponent isInteger={true} globalState={this.props.globalState} label="Line Width" target={this.line} propertyName="lineWidth"/>
                <Vector2LineComponent label="Point1 (x,y)" target={this} propertyName="point1" globalState={this.props.globalState} onChange={evt => {
                    this.line.x1 = evt.x;
                    this.line.y1 = evt.y; }}/>
                <Vector2LineComponent label="Point2 (x,y)" target={this} propertyName="point2" globalState={this.props.globalState} onChange={evt => {
                    this.line.x2 = evt.x;
                    this.line.y2 = evt.y; }}/>
                </LineContainerComponent>            
            </>
        );
    }
}