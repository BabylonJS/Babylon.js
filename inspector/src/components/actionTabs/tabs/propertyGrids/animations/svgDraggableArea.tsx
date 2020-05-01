import * as React from "react";
import { Vector2 } from 'babylonjs/Maths/math.vector';

interface ISvgDraggableAreaProps {
    points: Vector2[];
}

export class SvgDraggableArea extends React.Component<ISvgDraggableAreaProps,{ points: Vector2[]}>{ 

    private _active: Vector2;

    constructor(props: ISvgDraggableAreaProps) {
        super(props);
        this.state = { points: this.props.points }
    }

   
    dragStart(e: React.TouchEvent<SVGSVGElement>, point: Vector2) : void;
    dragStart(e: React.MouseEvent<SVGSVGElement, MouseEvent>, point: Vector2) : void;
    dragStart(e: any, point: Vector2): void {
        e.preventDefault();    
            this._active = ;
          
    }

    drag(e: React.TouchEvent<SVGSVGElement>, point: Vector2) : void;
    drag(e: React.MouseEvent<SVGSVGElement, MouseEvent>, point: Vector2) : void;
    drag(e: any, point: Vector2): void {
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

    dragEnd(e: React.TouchEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement, MouseEvent>, point: Vector2) {
        this._active = false;  
    }



    getMousePosition(e: React.TouchEvent<SVGSVGElement>, point: Vector2) : Vector2;
    getMousePosition(e: React.MouseEvent<SVGSVGElement, MouseEvent>, point: Vector2) : Vector2;
    getMousePosition(e: any, point: Vector2): Vector2 {

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

     
      }



    render() {
        return (
        <>
            <svg className="linear" viewBox="0 0 100 100" preserveAspectRatio="none">

            { this.state.points.map((point, i) => {
            <svg key={i} className="draggable" x={point.x} y={point.y} style={{overflow:'visible'}}
            onTouchMove = {(e, point) => this.drag(e, point)} 
            onTouchStart = {(e,point) => this.dragStart(e, point)}
            onTouchEnd  ={(e, point) => this.dragEnd(e, point)}
            onMouseMove={(e, point) => this.drag(e, point)} 
            onMouseDown ={(e, point) => this.dragStart(e, point)}
            onMouseUp  ={(e, point) => this.dragEnd(e, point)}
            onMouseLeave = {(e, point) => this.dragEnd(e, point)}
            >
            <circle cx="0" cy="0"  r="2" stroke="none" strokeWidth="0" fill="red" />


            </svg>



            })}
                        
      
        </svg>
        </>)
    }


}



 

