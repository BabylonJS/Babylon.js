import * as React from "react";
import { Vector2 } from 'babylonjs/Maths/math.vector';

interface IKeyframeSvgPointProps {
    point: Vector2;
    index: number;
    onUpdate: (keyframe: Vector2, index: number) => void
}

export class KeyframeSvgPoint extends React.Component<IKeyframeSvgPointProps,{ active: boolean, position: Vector2}>{ 
    
    private _active = false;
    private _offset: Vector2;
    private _draggable: React.RefObject<SVGSVGElement>;
    private _local: Vector2;
    
    constructor(props: IKeyframeSvgPointProps) {
        super(props);
        this._draggable = React.createRef();  
        this.state = { position: this.props.point, active: this._active }
        this._local = new Vector2(0,0);
    }

    dragStart(e: React.TouchEvent<SVGSVGElement>) : void;
    dragStart(e: React.MouseEvent<SVGSVGElement, MouseEvent>) : void;
    dragStart(e: any): void {
        e.preventDefault();    
          if (e.currentTarget === this._draggable.current) {
            this._active = true;
          }
          
    }

    drag(e: React.TouchEvent<SVGSVGElement>) : void;
    drag(e: React.MouseEvent<SVGSVGElement, MouseEvent>) : void;
    drag(e: any): void {
        if (this._active) {
        
          e.preventDefault();

          var coord = this.getMousePosition(e);//.subtract(this._offset)
            this._local = this.getMousePosition(e);
            //console.log(this._local.x, this._local.y)
          //this.setTranslate(coord.x, coord.y, this._draggable);
          //this._local = coord;
          this.setState({ position: coord });

        }
    }

    dragEnd(e: React.TouchEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement, MouseEvent>) {
        this._active = false;  
    }

    setTranslate(xPos: number, yPos: number, el: React.RefObject<SVGSVGElement>) {
        if (el.current){
            el.current.style.transform = "translate(" + xPos + "px, " + yPos + "px)";
        }   
    }

    getMousePosition(e: React.TouchEvent<SVGSVGElement>) : Vector2;
    getMousePosition(e: React.MouseEvent<SVGSVGElement, MouseEvent>) : Vector2;
    getMousePosition(e: any): Vector2 {

        if (e.touches) { e = e.touches[0]; }

        var svg = this._draggable.current as SVGSVGElement;

        // var CTM = svg.getScreenCTM();
        // if (CTM){
        //     return new Vector2((e.clientX - CTM.e) / CTM.a,(e.clientY - CTM.f) / CTM.d)
        // } else {
        //     return new Vector2(e.clientX, e.clientY);
        // }

        var pt = svg.createSVGPoint();

        pt.x = e.clientX;
        pt.y = e.clientY;

        var inverse = svg.getScreenCTM()?.inverse();

        var cursorpt =  pt.matrixTransform(inverse);
        

        return new Vector2(cursorpt.x, cursorpt.y);

        // var pt = svg.createSVGPoint();

        // pt.x = e.clientX;
        // pt.y = e.clientY;

        // var inverse = svg.getScreenCTM()?.inverse();

        // var cursorpt =  pt.matrixTransform(inverse);

     
       //onMouseLeave = {(e) => this.dragEnd(e)}
        
        //return new Vector2(cursorpt.x, cursorpt.y);
      }






    render() {
        return (
        <>
            <svg className="draggable" ref={this._draggable} x={this.state.position.x} y={this.state.position.y} style={{overflow:'visible'}}
                       onTouchMove = {(e) => this.drag(e)} 
                       onTouchStart = {(e) => this.dragStart(e)}
                       onTouchEnd  ={(e) => this.dragEnd(e)}
                       onMouseMove={(e) => this.drag(e)} 
                       onMouseDown ={(e) => this.dragStart(e)}
                       onMouseUp  ={(e) => this.dragEnd(e)}
                       >
                <circle cx="0" cy="0"  r="2" stroke="none" strokeWidth="0" fill="red" />
    

            </svg>
        </>
        )
    }
} 