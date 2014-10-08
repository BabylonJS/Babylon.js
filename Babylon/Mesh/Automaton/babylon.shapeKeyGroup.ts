module BABYLON {
    export class ShapeKeyGroup {
        // position elements converted to typed array
        private _affectedPositionElements : Uint16Array;
        private _nPosElements : number;
        
        // arrays for the storage of each state
        private _states  = new Array<Float32Array>();
        private _normals = new Array<Float32Array>();
        private _stateNames = new Array<string>();      

        // event series queue & reference vars for current seris & step within
        private _queue = new Array<AutomatonEventSeries>();
        private _currentSeries : AutomatonEventSeries = null;
        private _currentStepInSeries : ReferenceDeformation = null;
        private _endOfLastFrameTs = -1;

        // affected vertices are used for normals, since all the entire vertex is involved, even if only the x of a position is affected
        private _affectedVertices : Uint16Array;
        private _nVertices;
            
        // reference vars for the current & prior deformation; assigned either an item of (_states / _normals) or one of the reusables
        private _currFinalPositionVals  : Float32Array; 
        private _priorFinalPositionVals : Float32Array;
        private _currFinalNormalVals    : Float32Array;
        private _priorFinalNormalVals   : Float32Array;
        
        // typed arrays are more expense to create, pre-allocate pairs for reuse
        private _reusablePositionFinals = new Array<Float32Array>();  
        private _reusableNormalFinals   = new Array<Float32Array>();  
        private _lastReusablePosUsed  = 0;
        private _lastReusableNormUsed = 0;
        
        // rotation control members
        private _doingRotation = false;
        private _rotationStartVec : Vector3;
        private _rotationEndVec   : Vector3;
        
        // position control members
        private _doingMovePOV = false;
        private _positionStartVec : Vector3;  // for lerp(ing) when NOT also rotating too
        private _positionEndVec   : Vector3;  // for lerp(ing) when NOT also rotating too
        private _fullAmtRight     : number;   // for when also rotating
        private _fullAmtUp        : number;   // for when also rotating
        private _fullAmtForward   : number;   // for when also rotating
        private _amtRightSoFar    : number;   // for when also rotating
        private _amtUpSoFar       : number;   // for when also rotating
        private _amtForwardSoFar  : number;   // for when also rotating
        
        // misc
        private _activeLockedCamera : any = null; // any, or would require casting to FreeCamera & no point in JavaScript
        private _mirrorAxis = -1; // when in use x = 1, y = 2, z = 3
 
        /**
         * @param {Automaton} _automaton - reference of Automaton this ShapeKeyGroup is a part of
         * @param {String} _name - Name of the Key Group, upper case only
         * @param {Array} affectedPositionElements - index of either an x, y, or z of positions.  Not all 3 of a vertex need be present.  Ascending order.
         * @param {Array} basisState - original state of the affectedPositionElements of positions
         */
        constructor(private _automaton : Automaton, private _name : string, affectedPositionElements : Array<number>, basisState : Array<number>){
            if (!(affectedPositionElements instanceof Array) || affectedPositionElements.length === 0                ) throw "ShapeKeyGroup: invalid affectedPositionElements arg";
            if (!(basisState               instanceof Array) || basisState.length !== affectedPositionElements.length) throw "ShapeKeyGroup: invalid basisState arg";

            // validation that position elements are in ascending order; normals relies on this being true
            this._affectedPositionElements = new Uint16Array(affectedPositionElements);        
            this._nPosElements = affectedPositionElements.length;
            for (var i = 0; i + 1 < this._nPosElements; i++)
                if (!(this._affectedPositionElements[i] < this._affectedPositionElements[i + 1])) throw "ShapeKeyGroup: affectedPositionElements must be in ascending order";
            
            // initialize 2 position reusables, the size needed
            this._reusablePositionFinals.push(new Float32Array(this._nPosElements));
            this._reusablePositionFinals.push(new Float32Array(this._nPosElements));
            
            // determine affectedVertices for updating cooresponding normals
            var affectedVert = new Array<number>(); // final size unknown, so use a push-able array & convert to Uint16Array at end
            var vertIdx  = -1;
            var nextVertIdx : number;
            
            // go through each position element 
            for (var i = 0; i < this._nPosElements; i++){
                // the vertex index is 1/3 the position element index
                nextVertIdx = Math.floor(this._affectedPositionElements[i] / 3);
                
                // since position element indexes in ascending order, check if vertex not already added by the x, or y elements
                if (vertIdx !== nextVertIdx){
                    vertIdx = nextVertIdx;
                    affectedVert.push(vertIdx);
                }
            }
            this._affectedVertices = new Uint16Array(affectedVert);
            this._nVertices = this._affectedVertices.length;
            
            // initialize 2 normal reusables, the size needed
            this._reusableNormalFinals.push(new Float32Array(this._nVertices * 3));
            this._reusableNormalFinals.push(new Float32Array(this._nVertices * 3));               
        
            // push 'BASIS' to _states & _stateNames, then initialize _currFinalVals to 'BASIS' state
            this.addShapeKey("BASIS", basisState);
            this._currFinalPositionVals  = this._states [0];       
            this._currFinalNormalVals    = this._normals[0];   
        }
        // =============================== Shape-Key adding & deriving ===============================
        private getDerivedName(referenceIdx : number, endStateIdx : number, endStateRatio : number) : string{
            return referenceIdx + "-" + endStateIdx + "@" + endStateRatio;
        }
        /**
         * add a derived key from the data contained in a deformation; wrapper for addDerivedKey()
         * @param {ReferenceDeformation} deformation - mined for its reference & end state names, and end state ratio
         */
        public addDerivedKeyFromDeformation(deformation : ReferenceDeformation) : void{
            this.addDerivedKey(deformation.getReferenceStateName(), deformation.getEndStateName(), deformation.getEndStateRatio());
        }
        
        /**
         * add a derived key from the arguments
         * @param {string} referenceStateName - Name of the reference state to be based on
         * @param {string} endStateName - Name of the end state to be based on
         * @param {number} endStateRatio - Unvalidated, but if -1 < or > 1, then can never be called, since Deformation validates
         */
        public addDerivedKey(referenceStateName : string, endStateName : string, endStateRatio : number) : void{
            var referenceIdx = this.getIdxForState(referenceStateName.toUpperCase());
            var endStateIdx  = this.getIdxForState(endStateName      .toUpperCase());
            if (referenceIdx === -1 || endStateIdx === -1) throw "ShapeKeyGroup: invalid source state name(s)";
            if (endStateRatio === 1) throw "ShapeKeyGroup: deriving a shape key where the endStateRatio is 1 is pointless";
            
            var stateName = this.getDerivedName(referenceIdx, endStateIdx, endStateRatio);
            var stateKey  = new Float32Array(this._nPosElements);
            this.buildPosEndPoint(stateKey, referenceIdx, endStateIdx, endStateRatio);
            this.addShapeKeyInternal(stateName, stateKey);
        }
        
        /** called in construction code from TOB, but outside the constructor, except for 'BASIS'.  Unlikely to be called by application code. */
        public addShapeKey(stateName : string, stateKey : Array<number>) : void {
            if (!(stateKey instanceof Array) || stateKey.length !== this._nPosElements) throw "ShapeKeyGroup: invalid stateKey arg";
            this.addShapeKeyInternal(stateName, new Float32Array(stateKey) );
        }

        /** worker method for both the addShapeKey() & addDerivedKey() methods */
        private addShapeKeyInternal(stateName : string, stateKey : Float32Array) : void {
            if (typeof stateName !== 'string' || stateName.length === 0) throw "ShapeKeyGroup: invalid stateName arg";
            if (this.getIdxForState(stateName) !== -1) throw "ShapeKeyGroup: stateName " + stateName + " is a duplicate";

            this._states.push(stateKey);
            this._stateNames.push(stateName);
                                
            var coorespondingNormals = new Float32Array(this._nVertices * 3);
            this.buildNormEndPoint(coorespondingNormals, stateKey);
            this._normals.push(coorespondingNormals);

            if (this._automaton.debug) console.log("Shape key: " + stateName + " added to group: " + this._name + " on Automaton: " + this._automaton.name);
        }
        // =================================== inside before render ==================================
        /**
         * Called by the beforeRender() registered by this._automaton
         * @param {Float32Array} positions - Array of the positions for the entire mesh, portion updated based on _affectedIndices
         * @param {Float32Array } normals  - Array of the normals for the entire mesh, if not null, portion updated based on _affectedVertices
         */
        public incrementallyDeform(positions : Float32Array, normals :Float32Array) : boolean {
            // series level of processing; get another series from the queue when none or last is done
            if (this._currentSeries === null || !this._currentSeries.hasMoreEvents() ){
                if (! this._nextEventSeries()) return false;
            }
            
            // ok, have an active event series, now get the next deformation in series if required
            while (this._currentStepInSeries === null || this._currentStepInSeries.isComplete() ){
                var next : any = this._currentSeries.nextEvent(this._name);
                
                if (next === null) return false; // being blocked, this must be a multi-group series, not ready for us
                if (next instanceof Action){
                    (<Action> next).execute(ActionEvent.CreateNew(this._automaton));    
                }
                else if (typeof next === "function"){
                    next.call();
                }
                else{
                   this._nextDeformation(<ReferenceDeformation> next);  // must be a new deformation. _currentStepInSeries assigned if valid
                }  
            }
            
            // have a deformation to process
            var ratioComplete = this._currentStepInSeries.getCompletionMilestone();
            if (ratioComplete < 0) return false; // Deformation.BLOCKED or Deformation.WAITING
        
            // update the positions
            for (var i = 0; i < this._nPosElements; i++){
                positions[this._affectedPositionElements[i]] = this._priorFinalPositionVals[i] + ((this._currFinalPositionVals[i] - this._priorFinalPositionVals[i]) * ratioComplete);
            }
            
            // update the normals
            var mIdx : number, kIdx : number;
            for (var i = 0; i < this._nVertices; i++){
                mIdx = 3 * this._affectedVertices[i] // offset for this vertex in the entire mesh
                kIdx = 3 * i;                        // offset for this vertex in the shape key group
                normals[mIdx    ] = this._priorFinalNormalVals[kIdx    ] + ((this._currFinalNormalVals[kIdx    ] - this._priorFinalNormalVals[kIdx    ]) * ratioComplete);
                normals[mIdx + 1] = this._priorFinalNormalVals[kIdx + 1] + ((this._currFinalNormalVals[kIdx + 1] - this._priorFinalNormalVals[kIdx + 1]) * ratioComplete);
                normals[mIdx + 2] = this._priorFinalNormalVals[kIdx + 2] + ((this._currFinalNormalVals[kIdx + 2] - this._priorFinalNormalVals[kIdx + 2]) * ratioComplete);
            }
            
            if (this._doingRotation){
                this._automaton.rotation = BABYLON.Vector3.Lerp(this._rotationStartVec, this._rotationEndVec, ratioComplete);
            }
            
            if (this._doingMovePOV === true){
                if (this._doingRotation){
                    // some of these amounts, could be negative, if has a Pace with a hiccup
                    var amtRight   = (this._fullAmtRight   * ratioComplete) - this._amtRightSoFar;
                    var amtUp      = (this._fullAmtUp      * ratioComplete) - this._amtUpSoFar;
                    var amtForward = (this._fullAmtForward * ratioComplete) - this._amtForwardSoFar;
                    
                    this._automaton.movePOV(amtRight, amtUp, amtForward);
                    
                    this._amtRightSoFar   += amtRight;
                    this._amtUpSoFar      += amtUp;
                    this._amtForwardSoFar += amtForward;
                }else{
                    this._automaton.position = BABYLON.Vector3.Lerp(this._positionStartVec, this._positionEndVec, ratioComplete);
                }
                
                if (this._activeLockedCamera !== null) this._activeLockedCamera._getViewMatrix();
            }
            this._endOfLastFrameTs = Automaton.now();       
            return true;
        }
       
        public resumePlay() : void {
            if (this._currentStepInSeries !== null) this._currentStepInSeries.resumePlay();
        }
        // ============================ Event Series Queueing & retrieval ============================
        public queueEventSeries(eSeries : AutomatonEventSeries) :void {
            this._queue.push(eSeries);
        }
    
        private _nextEventSeries() : boolean {
            var ret = this._queue.length > 0;
            if (ret){
                this._currentSeries = this._queue.shift();
                this._currentSeries.activate(this._name);
            }
            return ret;
        }
        // ===================================== deformation prep ====================================    
        private _nextDeformation(deformation : ReferenceDeformation) : void {
            // do this as soon as possible to get the clock started, retroactively, when sole group in the series, and within 50 millis of last deform
            var lateStart = Automaton.now() - this._endOfLastFrameTs;
            deformation.activate((this._currentSeries.nGroups === 1 && lateStart - this._endOfLastFrameTs < 50) ? lateStart : 0);
            
            this._currentStepInSeries = deformation;
            this._priorFinalPositionVals = this._currFinalPositionVals;
            this._priorFinalNormalVals   = this._currFinalNormalVals  ;
            
            var referenceIdx = this.getIdxForState(deformation.getReferenceStateName() );
            var endStateIdx  = this.getIdxForState(deformation.getEndStateName      () );
            if (referenceIdx === -1 || endStateIdx === -1) throw "ShapeKeyGroup " + this._name + ": invalid deformation, source state name(s) not found";

            var endStateRatio = deformation.getEndStateRatio();
            if (endStateRatio < 0 && this._mirrorAxis === -1) throw "ShapeKeyGroup " + this._name + ": invalid deformation, negative end state ratios when not mirroring";
           
            // when endStateRatio is 1 or 0, just assign _currFinalVals directly from _states
            if (endStateRatio === 1 || endStateRatio === 0){
                 if (endStateRatio === 0) endStateIdx = referenceIdx; // really just the reference when 0
                 this._currFinalPositionVals = this._states [endStateIdx];
                 this._currFinalNormalVals   = this._normals[endStateIdx];
            }else{
                // check there was not a pre-built derived key to assign
                var derivedIdx = this.getIdxForState(this.getDerivedName(referenceIdx, endStateIdx, endStateRatio) );
                if (derivedIdx !== -1){
                    this._currFinalPositionVals = this._states [derivedIdx];
                    this._currFinalNormalVals   = this._normals[derivedIdx];
                } else{
                    // need to build _currFinalVals, toggling the _lastReusableUsed
                    this._lastReusablePosUsed = (this._lastReusablePosUsed === 1) ? 0 : 1;
                    this.buildPosEndPoint(this._reusablePositionFinals[this._lastReusablePosUsed], referenceIdx, endStateIdx, endStateRatio, this._automaton.debug);
                    this._currFinalPositionVals = this._reusablePositionFinals[this._lastReusablePosUsed];
                    
                    // need to build _currFinalNormalVals, toggling the _lastReusableUsed
                    this._lastReusableNormUsed = (this._lastReusableNormUsed === 1) ? 0 : 1;
                    this.buildNormEndPoint(this._reusableNormalFinals[this._lastReusableNormUsed], this._currFinalPositionVals);
                    this._currFinalNormalVals = this._reusableNormalFinals[this._lastReusableNormUsed];
                }
            }

            // prepare for rotation, if deformation calls for
            this._doingRotation = deformation.rotatePOV !== null;
            if (this._doingRotation){
                this._rotationStartVec = this._automaton.rotation; // no clone required, since Lerp() returns a new Vec3 written over .rotation
                this._rotationEndVec   = this._rotationStartVec.add(this._automaton.calcRotatePOV(deformation.rotatePOV.x, deformation.rotatePOV.y, deformation.rotatePOV.z));
            }
            
            // prepare for POV move, if deformation calls for
            this._doingMovePOV = deformation.movePOV !== null;
            if (this._doingMovePOV){
                this._fullAmtRight   = deformation.movePOV.x; this._amtRightSoFar   = 0;
                this._fullAmtUp      = deformation.movePOV.y; this._amtUpSoFar      = 0;
                this._fullAmtForward = deformation.movePOV.z; this._amtForwardSoFar = 0;
                
                // less resources to calcMovePOV() once then Lerp(), but calcMovePOV() uses rotation, so can only go fast when not rotating too
                if (!this._doingRotation){
                    this._positionStartVec = this._automaton.position; // no clone required, since Lerp() returns a new Vec3 written over .position
                    this._positionEndVec   = this._positionStartVec.add(this._automaton.calcMovePOV(this._fullAmtRight, this._fullAmtUp, this._fullAmtForward));
                }
            }
            
            // determine if camera needs to be woke up for tracking
            this._activeLockedCamera = null; // assigned for failure
            
            if (this._doingRotation || this._doingMovePOV){
                var activeCamera = <any> this._automaton.getScene().activeCamera;
                if(activeCamera.lockedTarget && activeCamera.lockedTarget === this._automaton)
                     this._activeLockedCamera = activeCamera;
            }
        }
        /**
         * Called by addShapeKeyInternal() & _nextDeformation() to build the positions for an end point
         * @param {Float32Array} targetArray - location of output. One of the _reusablePositionFinals for _nextDeformation().  Bound for: _states[], if addShapeKeyInternal().
         * @param {number} referenceIdx - the index into _states[] to use as a reference
         * @param {number} endStateIdx - the index into _states[] to use as a target
         * @param {number} endStateRatio - the ratio of the target state to achive, relative to the reference state
         * @param {boolean} log - write console message of action, when true (Default false)
         * 
         */
        private buildPosEndPoint(targetArray : Float32Array, referenceIdx: number, endStateIdx : number, endStateRatio : number, log = false) : void {            
            var refEndState = this._states[referenceIdx];
            var newEndState = this._states[endStateIdx];
            
            // compute each of the new final values of positions
            var deltaToRefState : number;
            for (var i = 0; i < this._nPosElements; i++){
                deltaToRefState = (newEndState[i] - refEndState[i]) * endStateRatio;
                
                // reverse sign on appropriate elements of referenceDelta when ratio neg & mirroring
                if (endStateRatio < 0 && this._mirrorAxis !== (i + 1) % 3){
                    deltaToRefState *= -1;
                }            
                targetArray[i] = refEndState[i] + deltaToRefState;            
            }
            if (log) console.log(this._name + " end Point built for referenceIdx: " + referenceIdx + ",  endStateIdx: " + endStateIdx + ", endStateRatio: " + endStateRatio);
        }
        
        /**
         * Called by addShapeKeyInternal() & _nextDeformation() to build the normals for an end point
         * @param {Float32Array} targetArray - location of output. One of the _reusableNormalFinals for _nextDeformation().  Bound for: _normals[], if addShapeKeyInternal().
         * @param {Float32Array} endStatePos - postion data to build the normals for.  Output from buildPosEndPoint, or data passed in from addShapeKey()
         */
        private buildNormEndPoint(targetArray : Float32Array, endStatePos : Float32Array) : void {
            // build a full, mesh sized, set of positions & populate with the left-over initial data 
            var futurePos = new Float32Array(this._automaton.getVerticesData(VertexBuffer.PositionKind));
            
            // populate the changes that this state has
            for (var i = 0; i < this._nPosElements; i++){
                futurePos[this._affectedPositionElements[i]] = endStatePos[i];
            }
            
            // compute using method in _automaton
            this._automaton.normalsforVerticesInPlace(this._affectedVertices, targetArray, futurePos);
        }
        // ==================================== Getters & setters ====================================    
        private getIdxForState(stateName : string) : number{
            for (var i = this._stateNames.length - 1; i >= 0; i--){
                if (this._stateNames[i] === stateName){
                    return i;
                }
            }
            return -1;
        }

        public getName() : string { return this._name; }
        public getNPosElements() : number { return this._nPosElements; }
        public getNStates() : number { return this._stateNames.length; }
        public toString() : string { return 'ShapeKeyGroup: ' + this._name + ', n position elements: ' + this._nPosElements + ',\nStates: ' + this._stateNames; }
       
        public mirrorAxisOnX() : void {this._mirrorAxis = 1;}
        public mirrorAxisOnY() : void {this._mirrorAxis = 2;}
        public mirrorAxisOnZ() : void {this._mirrorAxis = 3;}
    }
}