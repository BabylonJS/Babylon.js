
import * as React from "react";

interface IPlayheadProps {
   frame: number;
   offset: number;
}

export class Playhead extends React.Component<IPlayheadProps>{ 
    constructor(props: IPlayheadProps) {
        super(props);
    }
     
    render() { 
       return (
           <div className="playhead-wrapper" id="playhead" style={{left: `calc(${this.props.frame * (this.props.offset) }px - 13px)`}}>
            <div className="playhead">{this.props.frame}</div>
            <div className="playhead-triangle"></div>
            <div className="playhead-line"></div>
           </div>
        )
    }
} 


