/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create radio button controls
     */
    export class RadioButton extends Control {
        private _isChecked = false;
        private _background = "black";   
        private _checkSizeRatio = 0.8;
        private _thickness = 1;
        
        /** Gets or sets border thickness */
        public get thickness(): number {
            return this._thickness;
        }

        public set thickness(value: number) {
            if (this._thickness === value) {
                return;
            }

            this._thickness = value;
            this._markAsDirty();
        }           

        /** Gets or sets group name */
        public group = "";        

        /** Observable raised when isChecked is changed */
        public onIsCheckedChangedObservable = new Observable<boolean>();

        /** Gets or sets a value indicating the ratio between overall size and check size */
        public get checkSizeRatio(): number {
            return this._checkSizeRatio;
        }

        public set checkSizeRatio(value: number) {
            value = Math.max(Math.min(1, value), 0);

            if (this._checkSizeRatio === value) {
                return;
            }

            this._checkSizeRatio = value;
            this._markAsDirty();
        }             

        /** Gets or sets background color */
        public get background(): string {
            return this._background;
        }

        public set background(value: string) {
            if (this._background === value) {
                return;
            }

            this._background = value;
            this._markAsDirty();
        }     

        /** Gets or sets a boolean indicating if the checkbox is checked or not */
        public get isChecked(): boolean {
            return this._isChecked;
        }

        public set isChecked(value: boolean) {
            if (this._isChecked === value) {
                return;
            }

            this._isChecked = value;
            this._markAsDirty();

            this.onIsCheckedChangedObservable.notifyObservers(value);

            if (this._isChecked && this._host) {
                // Update all controls from same group
                this._host.executeOnAllControls((control) => {
                    if (control === this) {
                        return;
                    }

                    if ((<any>control).group === undefined) {
                        return;
                    }
                    var childRadio = (<RadioButton>control);
                    if (childRadio.group === this.group) {
                        childRadio.isChecked = false;
                    }
                });
            }
        }                             

        /**
         * Creates a new RadioButton
         * @param name defines the control name
         */        
        constructor(public name?: string) {
            super(name);

            this.isPointerBlocker = true;
        }

        protected _getTypeName(): string {
            return "RadioButton";
        }              

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            this._applyStates(context);
            if (this._processMeasures(parentMeasure, context)) {
                let actualWidth = this._currentMeasure.width - this._thickness;
                let actualHeight = this._currentMeasure.height - this._thickness;

                if(this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY){
                    context.shadowColor = this.shadowColor;
                    context.shadowBlur = this.shadowBlur;
                    context.shadowOffsetX = this.shadowOffsetX;
                    context.shadowOffsetY = this.shadowOffsetY;
                }
                
                // Outer
                Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, 
                            this._currentMeasure.width / 2 - this._thickness / 2, this._currentMeasure.height / 2 - this._thickness / 2, context);
                
                context.fillStyle = this._background;
                context.fill();

                if(this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY){
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }

                context.strokeStyle = this.color;
                context.lineWidth = this._thickness;

                context.stroke();

                // Inner
                if (this._isChecked) {
                    context.fillStyle = this.color;
                    let offsetWidth = actualWidth * this._checkSizeRatio;
                    let offseHeight = actualHeight * this._checkSizeRatio;

                    Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, 
                                    offsetWidth / 2 - this._thickness / 2, offseHeight / 2  - this._thickness / 2, context);

                    context.fill();
                }

            }
            context.restore();
        }

        // Events
        public _onPointerDown(target: Control, coordinates: Vector2, pointerId:number, buttonIndex: number): boolean {
            if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex)) {
                return false;
            }
            
            if (!this.isChecked) {
                this.isChecked = true;
            }

            return true;
        }
    }    
}
