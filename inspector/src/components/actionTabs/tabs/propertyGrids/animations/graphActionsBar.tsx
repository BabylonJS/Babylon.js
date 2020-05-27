
import * as React from "react";
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';

interface IGraphActionsBarProps {
   addKeyframe: () => void;
   removeKeyframe: () => void;
   handleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
   handleFrameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
   flatTangent: () => void;
   brokeTangents: () => void;
   brokenMode: boolean;
   currentValue: number;
   currentFrame: number;
}

export class GraphActionsBar extends React.Component<IGraphActionsBarProps>{ 
    constructor(props: IGraphActionsBarProps) {
        super(props);
    }
     
    render() { 
       return (
           <div className="actions-wrapper">
               <div className="action-input">
               <label>Frame</label>
               <input type="number" value={this.props.currentFrame} onChange={this.props.handleFrameChange} step="1"/>
               </div>
               <div className="action-input">
               <label>Value</label>
               <input type="number" value={this.props.currentValue.toFixed(3)} onChange={this.props.handleValueChange} step="0.001"/>
               </div>
              <ButtonLineComponent label={"Add Keyframe"} onClick={this.props.addKeyframe} />
              <ButtonLineComponent label={"Remove Keyframe"} onClick={this.props.removeKeyframe} />
              <ButtonLineComponent label={"Flat Tangents"} onClick={this.props.flatTangent} />
              <ButtonLineComponent label={this.props.brokenMode ? "Broken Mode On" : "Broken Mode Off" } onClick={this.props.brokeTangents} />
           </div>
        )
    }
} 