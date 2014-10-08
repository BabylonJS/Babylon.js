module BABYLON{
   /**
    * Class to store Deformation info & evaluate how complete it should be.
    */
    export class ReferenceDeformation {
        private _syncPartner : ReferenceDeformation; // not part of constructor, since cannot be in both partners constructors, use setSyncPartner()

        // time and state management members
        private _startTime = -1;
        private _currentDurationRatio = ReferenceDeformation._COMPLETE;
        
        // wallclock prorating members, used for acceleration / deceleration across AutomaonEventSeries runs
        private _proratedMilliDuration : number;
        private _proratedMillisBefore : number;

        /**
         * @param {string} shapeKeyGroupName -  Used by Automaton to place in the correct ShapeKeyGroup queue(s).
         * @param {string} referenceStateName - Name of state key to be used as a reference, so that a endStateRatio can be used
         * @param {string} endStateName - Name of state key to deform to
         * @param {number} milliDuration - The number of milli seconds the deformation is to be completed in
         * @param {number} millisBefore - Fixed wait period, once a syncPartner (if any) is also ready (default 0)
         * @param {number} endStateRatio - ratio of the end state to be obtained from reference state: -1 (mirror) to 1 (default 1)
         * @param {Vector3} movePOV - Mesh movement relative to its current position/rotation to be performed at the same time (default null)
         *                  right-up-forward
         * @param {Vector3} rotatePOV - Incremental Mesh rotation to be performed at the same time (default null)
         *                  flipBack-twirlClockwise-tiltRight
         * @param {Pace} pace - Any Object with the function: getCompletionMilestone(currentDurationRatio) (default Pace.LINEAR)
         */
        constructor(
            public  shapeKeyGroupName   : string, 
            private _referenceStateName : string, 
            private _endStateName       : string, 
            private _milliDuration      : number, 
            private _millisBefore       : number = 0, 
            private _endStateRatio      : number = 1, 
            public  movePOV             : Vector3 = null, 
            public  rotatePOV           : Vector3 = null,  
            private _pace               : Pace = Pace.LINEAR)
        {
            // argument validations
            if (this._referenceStateName === this._endStateName) throw "Deformation: reference state cannot be the same as the end state";
            if (this._milliDuration <= 0) throw "Deformation: milliDuration must > 0";
            if (this._millisBefore < 0) throw "Deformation: millisBefore cannot be negative";
            if (this._endStateRatio < -1 || this._endStateRatio > 1) throw "Deformation: endStateRatio range  > -1 and < 1";

            // mixed case group & state names not supported
            this.shapeKeyGroupName   = this.shapeKeyGroupName  .toUpperCase(); 
            this._referenceStateName = this._referenceStateName.toUpperCase();
            this._endStateName       = this._endStateName      .toUpperCase();
            
            this.setProratedWallClocks(1); // ensure values actually used for timings are initialized
        }
        // =================================== run time processing ===================================    
        /**
         * Indicate readiness by caller to start processing event.  
         * @param {number} lateStartMilli - indication of how far behind already 
         */
        public activate(lateStartMilli = 0) : void {
            this._startTime = Automaton.now();
            if (lateStartMilli > 0){
                // apply 20% of the late start or 10% of duration which ever is less
                lateStartMilli /= 5;
                this._startTime -= (lateStartMilli < this._milliDuration / 10) ? lateStartMilli : this._milliDuration / 10;
            }
            this._currentDurationRatio = (this._syncPartner) ? ReferenceDeformation._BLOCKED : 
                                         ((this._proratedMillisBefore > 0) ? ReferenceDeformation._WAITING : ReferenceDeformation._READY);
        }
    
        /** called by ShapeKeyGroup.incrementallyDeform() to determine how much of the deformation should be performed right now */
        public getCompletionMilestone() : number {
            if (this._currentDurationRatio === ReferenceDeformation._COMPLETE){
                return ReferenceDeformation._COMPLETE;
            }

            // BLOCK only occurs when there is a sync partner
            if (this._currentDurationRatio === ReferenceDeformation._BLOCKED){                
                // change both to WAITING & start clock, once both are BLOCKED
                if (this._syncPartner.isBlocked() ){
                    this._startTime = Automaton.now(); // reset the start clock
                    this._currentDurationRatio = ReferenceDeformation._WAITING;
                    this._syncPartner.syncReady(this._startTime);
                }
                else return ReferenceDeformation._BLOCKED;
            }
        
            var millisSoFar = Automaton.now() - this._startTime;
        
            if (this._currentDurationRatio === ReferenceDeformation._WAITING){
                millisSoFar -= this._proratedMillisBefore;
                if (millisSoFar >= 0){
                    this._startTime = Automaton.now() - millisSoFar;  // prorate start for time served   
                }
                else return ReferenceDeformation._WAITING;
            }
        
            this._currentDurationRatio = millisSoFar / this._proratedMilliDuration;
            if (this._currentDurationRatio > ReferenceDeformation._COMPLETE)
                this._currentDurationRatio = ReferenceDeformation._COMPLETE;
        
            return this._pace.getCompletionMilestone(this._currentDurationRatio);
        }
       
        /** support game pausing / resuming.  There is no need to actively pause a Deformation. */
        public resumePlay() : void {
            if (this._currentDurationRatio === ReferenceDeformation._COMPLETE ||
                this._currentDurationRatio === ReferenceDeformation._BLOCKED  ||
                this._currentDurationRatio === ReferenceDeformation._COMPLETE) return;
            
            // back into a start time which reflects the currentDurationRatio
            this._startTime = Automaton.now() - (this._proratedMilliDuration * this._currentDurationRatio);            
        }
        // =================================== sync partner methods ===================================    
        /**
         * @param {Deformation} syncPartner - Deformation which should start at the same time as this one.  MUST be in a different shape key group!
         */
        public setSyncPartner(syncPartner : ReferenceDeformation) : void{
            this._syncPartner = syncPartner;            
        }
        /** 
         *  Called by the first of the syncPartners to detect that both are waiting for each other.
         *  Only intended to be called from getCompletionMilestone() of the partner.
         *  @param {number} startTime - passed from partner, so both are in sync as close as possible.
         */
        public syncReady(startTime : number) : void{
            this._startTime = startTime;
            this._currentDurationRatio = ReferenceDeformation._WAITING;
        }
        // ==================================== Getters & setters ====================================    
        public isBlocked () : boolean { return this._currentDurationRatio === ReferenceDeformation._BLOCKED ; }
        public isComplete() : boolean { return this._currentDurationRatio === ReferenceDeformation._COMPLETE; }
       
        public getReferenceStateName() : string { return this._referenceStateName; }     
        public getEndStateName() : string { return this._endStateName; }     
        public getMilliDuration() : number { return this._milliDuration; }      
        public getMillisBefore() : number { return this._millisBefore; }     
        public getEndStateRatio() :number {return this._endStateRatio; }
        public getPace() : Pace {return this._pace; }
        public getSyncPartner() : ReferenceDeformation{return this._syncPartner; }
       
        /**
         * Called by the Automaton Event Series, before Deformation is passed to the ShapeKeyGroup.  This
         * is to support acceleration / deceleration across event series repeats.
         * @param {number} factor - amount to multiply the constructor supplied duration & time before by.
         */
        public setProratedWallClocks(factor : number) : void {
            this._proratedMilliDuration = this._milliDuration * factor;
            this._proratedMillisBefore = this._millisBefore * factor;
        }
        // ========================================== Enums  =========================================    
        private static _BLOCKED  = -20;
        private static _WAITING  = -10;
        private static _READY    =   0;
        private static _COMPLETE =   1;

        public static get BLOCKED (): number { return ReferenceDeformation._BLOCKED ; }
        public static get WAITING (): number { return ReferenceDeformation._WAITING ; }
        public static get READY   (): number { return ReferenceDeformation._READY   ; }
        public static get COMPLETE(): number { return ReferenceDeformation._COMPLETE; }
    }
}