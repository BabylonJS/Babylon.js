
import * as React from "react";
import { IAnimationKey } from 'babylonjs/Animations/animationKey';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretRight, faCaretLeft, faStepBackward, faStepForward } from "@fortawesome/free-solid-svg-icons";

interface ITimelineProps {
   keyframes: IAnimationKey[];
   selected: IAnimationKey;
   currentFrame: number;
   onCurrentFrameChange: (frame: number) => void;
}


export class Timeline extends React.Component<ITimelineProps, {selected: IAnimationKey }>{ 
    readonly _frames: object[] = Array(300).fill({});
    constructor(props: ITimelineProps) {
        super(props);
        this.state = { selected: this.props.selected };
    }

    handleInputChange(event: React.ChangeEvent<HTMLInputElement>){
        this.props.onCurrentFrameChange(parseInt(event.target.value));
        event.preventDefault();
    }

    nextFrame(event: React.MouseEvent<HTMLDivElement>){
        event.preventDefault();
        this.props.onCurrentFrameChange(this.props.currentFrame + 1)

    }

    previousFrame(event: React.MouseEvent<HTMLDivElement>){
        event.preventDefault();
        if (this.props.currentFrame !== 0) {
        this.props.onCurrentFrameChange(this.props.currentFrame - 1)
        }
    }

    nextKeyframe(event: React.MouseEvent<HTMLDivElement>){
        event.preventDefault();
        // implement jumpTo keyframe
        this.props.onCurrentFrameChange(this.state.selected.frame);
    }

    previousKeyframe(event: React.MouseEvent<HTMLDivElement>){
        event.preventDefault();
         // implement jumpTo keyframe
        this.props.onCurrentFrameChange(this.state.selected.frame);
    }

    scrollToFrame() {
        // scroll to current frame
    }

    selectKeyframe(frame: number){
        let selected = this.props.keyframes[frame];
        this.setState({ selected: selected });
    }
    
    render() {
        return (
        <>
           <div className="timeline">
               <div className="display-line">
                   <svg viewBox="0 0 2000 100" style={{width: 2000}}>
                
                   <line x1={this.props.currentFrame*10} y1="10" x2={this.props.currentFrame*10} y2="20" style={{stroke: '#12506b',strokeWidth:6}} /> 

                   { 
                    this.props.keyframes.map((kf, i) => {

                        return <svg key={`kf_${i}`}> 
                        <line x1={kf.frame*10} y1="10" x2={kf.frame*10} y2="20" style={{stroke: 'red',strokeWidth:6}} /> 
                        </svg> 

                    })
                    }

                    { 
                    this._frames.map((frame, i) => {
                    
                    return <svg key={`tl_${i}`}> 
                        { i % 10 === 0 ? <text x={(i*10) - 3} y="8" style={{fontSize:10}}>{i}</text> : null }
                        <line x1={i*10} y1="10" x2={i*10} y2="20" style={{stroke: 'black',strokeWidth:0.5}} /> 
                        </svg> 
                    
                    }) 
                    }
                   
                   </svg>
               </div>
                <div className="controls">
                    <div className="input-frame">
                        <input type="number" value={this.props.currentFrame} onChange={(e) => this.handleInputChange(e)}></input>
                    </div>
                     <div className="previous-frame button" onClick={(e) => this.previousFrame(e)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                     </div>
                     <div className="previous-key-frame button" onClick={(e) => this.previousKeyframe(e)}>
                        <FontAwesomeIcon icon={faStepBackward} />
                     </div>
                     <div className="next-key-frame button" onClick={(e) => this.nextKeyframe(e)}>
                        <FontAwesomeIcon icon={faStepForward} />
                     </div>
                     <div className="next-frame button" onClick={(e) => this.nextFrame(e)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                     </div>
                </div>
           </div>
        </>
        )
    }
} 
