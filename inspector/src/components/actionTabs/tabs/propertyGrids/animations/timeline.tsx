
import * as React from "react";
import { IAnimationKey } from 'babylonjs/Animations/animationKey';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretRight, faCaretLeft, faStepBackward, faStepForward } from "@fortawesome/free-solid-svg-icons";

interface ITimelineProps {
   keyframes: IAnimationKey[];
   selected: IAnimationKey;
}


export class Timeline extends React.Component<ITimelineProps, {selected: IAnimationKey}>{ 
    constructor(props: ITimelineProps) {
        super(props);
        this.state = { selected: this.props.selected };
    }

    handleInputChange(event: React.ChangeEvent<HTMLInputElement>){
        event.preventDefault();
    }

    nextFrame(event: React.MouseEvent<HTMLDivElement>){
        event.preventDefault();

    }

    previousFrame(event: React.MouseEvent<HTMLDivElement>){
        event.preventDefault();
    }

    nextKeyframe(event: React.MouseEvent<HTMLDivElement>){
        event.preventDefault();
    }

    previousKeyframe(event: React.MouseEvent<HTMLDivElement>){
        event.preventDefault();
    }
    
    render() {
        return (
        <>
            
           
           <div className="timeline">
               <div className="display-line">
                   <svg>

                   </svg>
               </div>
                <div className="input-frame">
                    <input type="text" value={this.state.selected.frame} onChange={() => this.handleInputChange}></input>
                </div>
                <div className="controls">
                     <div className="previous-frame" onClick={(e) => this.previousFrame(e)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                     </div>
                     <div className="previous-key-frame" onClick={(e) => this.previousKeyframe(e)}>
                        <FontAwesomeIcon icon={faStepBackward} />
                     </div>
                     <div className="next-key-frame" onClick={(e) => this.nextKeyframe(e)}>
                        <FontAwesomeIcon icon={faStepForward} />
                     </div>
                     <div className="next-frame" onClick={(e) => this.nextFrame(e)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                     </div>
                </div>
           </div>
        </>
        )
    }
} 
