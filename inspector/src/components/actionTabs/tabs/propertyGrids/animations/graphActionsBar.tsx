
import * as React from "react";
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';

interface IGraphActionsBarProps {
   addKeyframe: () => void;
   handleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
   flatTangent: () => void;
   currentValue: number;
}

export class GraphActionsBar extends React.Component<IGraphActionsBarProps>{ 
    constructor(props: IGraphActionsBarProps) {
        super(props);
    }
     
    render() { 
       return (
           <div className="actions-wrapper">
               <div className="action-input">
               <label>Value</label>
               <input type="number" value={this.props.currentValue} onChange={this.props.handleValueChange}/>
               </div>
              <ButtonLineComponent label={"Add Keyframe"} onClick={this.props.addKeyframe} />
              <ButtonLineComponent label={"Flat Tangent"} onClick={this.props.flatTangent} />
           </div>
        )
    }
} 