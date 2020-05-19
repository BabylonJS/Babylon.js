
import * as React from "react";
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';

interface IGraphActionsBarProps {
   addKeyframe: () => void;
   removeKeyframe: () => void;
   handleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
   handleFrameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
   flatTangent: () => void;
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
               <input type="number" value={this.props.currentFrame} onChange={this.props.handleFrameChange}/>
               </div>
               <div className="action-input">
               <label>Value</label>
               <input type="number" value={this.props.currentValue.toFixed(3)} onChange={this.props.handleValueChange}/>
               </div>
              <ButtonLineComponent label={"Add Keyframe"} onClick={this.props.addKeyframe} />
              <ButtonLineComponent label={"Remove Keyframe"} onClick={this.props.removeKeyframe} />
              <ButtonLineComponent label={"Flat Tangent"} onClick={this.props.flatTangent} />
           </div>
        )
    }
} 