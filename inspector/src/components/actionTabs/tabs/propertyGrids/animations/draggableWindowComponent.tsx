import * as React from "react";

interface IDraggableWindowComponentProps {
    label: string;
    isOpen: boolean;
    closeWindow: Function;
}

export class DraggableWindowComponent extends React.Component<IDraggableWindowComponentProps, { isOpen: boolean }> {

    private _active = false;
    private _currentX: number;
    private _currentY: number;
    private _initialX: number;
    private _initialY: number;
    private _xOffset: number = 0;
    private _yOffset: number = 0;
    private _draggable: React.RefObject<HTMLDivElement>;

    constructor(props: IDraggableWindowComponentProps) {
        super(props);
        this.state = { isOpen: this.props.isOpen};
        this._draggable = React.createRef();  
    }

    closeWindow() {
        this.props.closeWindow();
    }

    dragStart(e: React.TouchEvent<HTMLDivElement>) : void;
    dragStart(e: React.MouseEvent<HTMLDivElement, MouseEvent>) : void;
    dragStart(e: any): void {
        e.preventDefault();
        if (e.type === 'touchstart') {
            this._initialX = e.touches[0].clientX - this._xOffset;
            this._initialY = e.touches[0].clientY - this._yOffset;
          } else {
            this._initialX = e.clientX - this._xOffset;
            this._initialY = e.clientY - this._yOffset;
          }
    
          if (e.currentTarget.parentElement === this._draggable.current) {
            this._active = true;
                if (this._draggable.current){
                this._draggable.current.draggable = true;
                }
          }
          
    }

    drag(e: React.TouchEvent<HTMLDivElement>) : void;
    drag(e: React.MouseEvent<HTMLDivElement, MouseEvent>) : void;
    drag(e: any): void {
        if (this._active) {
        
          e.preventDefault();

          if (e.type === "touchmove") {
             this._currentX = e.touches[0].clientX - this._initialX;
             this._currentY = e.touches[0].clientY - this._initialY;
          } else {
            this._currentX = e.clientX - this._initialX;
            this._currentY = e.clientY - this._initialY;
          }
  
          this._xOffset = this._currentX;
          this._yOffset = this._currentY;
  
          this.setTranslate(this._currentX, this._currentY, this._draggable);

        }
    }

    dragEnd(e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement, MouseEvent>) {
        this._initialX = this._currentX;
        this._initialY = this._currentY;
        this._active = false;
        if (this._draggable.current){
            this._draggable.current.draggable = false;
        }   
    }

    setTranslate(xPos: number, yPos: number, el: React.RefObject<HTMLDivElement>) {
        if (el.current){
            el.current.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        }   
    }

    render() {
        return (
            <div ref={this._draggable} className={`draggable-window ${this.state.isOpen ? '' : 'hidden'}`} draggable={false}>
                <div className="window-header" 
                onTouchMove = {(e) => this.drag(e)} 
                onTouchStart = {(e) => this.dragStart(e)}
                onTouchEnd  ={(e) => this.dragEnd(e)}
                onMouseMove={(e) => this.drag(e)} 
                onMouseDown ={(e) => this.dragStart(e)}
                onMouseUp  ={(e) => this.dragEnd(e)}
                onMouseLeave = {(e) => this.dragEnd(e)}
                >
                <div>{this.props.label}</div>
                <button onClick={() => this.closeWindow() }>X</button>
                </div>
                <div className="window-content">
                    {this.props.children}
               </div>
            </div>
        );
    }
}