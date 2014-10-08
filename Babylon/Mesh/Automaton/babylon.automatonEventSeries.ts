module BABYLON {
    /** Internal helper class used by AutomatonEventSeries to support a multi-shape group EventSeries */
    class ParticipatingGroup{
        _indexInRun  = -99; // ensure isReady() initially returns false
        _highestIndexInRun = -1;
        
        constructor (public groupName : string) {}
        public isReady    () : boolean { return this._indexInRun === -1; }
        public runComplete() : boolean { return this._indexInRun > this._highestIndexInRun; }
        public activate() : void{
            this._indexInRun = -1;
        }
    }
    
    /** Provide an action for an AutomatonEventSeries, for integration into action manager */
    export class AutomatonEventSeriesAction extends Action{
        constructor(triggerOptions: any, private _target: Automaton, private _eSeries : AutomatonEventSeries, condition?: Condition) {
            super(triggerOptions, condition);
        }
        public execute(evt: ActionEvent): void {
            this._target.queueEventSeries(this._eSeries);
        }
    }

    /** main class of file */
    export class AutomatonEventSeries {
        private _nEvents : number; // events always loop in ascending order; reduces .length calls        
        private _groups = new Array<ParticipatingGroup>();
        public  nGroups : number;  // public for ShapeKeyGroup, so it can determine if it the sole sole participating, === 1
        private _everyBodyReady : boolean;
        private _repeatCounter : number;
        private _proRatingThisRepeat;
        
        /**
         * Validate each of the events passed and build unique shapekey groups particpating.
         * @param {Array} _eventSeries - Elements must either be a ReferenceDeformation, Action, or function.  Min # of Deformations: 1
         * @param {number} _nRepeats - Number of times to run through series elements.  There is sync across runs. (Default 1)
         * @param {number} _initialWallclockProrating - The factor to multiply the duration of a Deformation before passing to a
         *                 ShapeKeyGroup.  Amount is decreased or increased across repeats, so that it is 1 for the final repeat.
         *                 Facilitates acceleration when > 1, & deceleration when < 1. (Default 1)
         * @param {string} _debug - Write progress messages to console when true (Default false)
         */
        constructor(private _eventSeries : Array<any>, private _nRepeats = 1, private _initialWallclockProrating = 1.0, private _debug = false) {
            this._nEvents = _eventSeries.length;

            // go through each event in series, building up the unique set shape key groups participating, this._groups
            for (var i = 0; i < this._nEvents; i++){
                if (this._eventSeries[i] instanceof ReferenceDeformation || this._eventSeries[i] instanceof Action || typeof this._eventSeries[i] === "function"){
                    
                    if (this._eventSeries[i] instanceof ReferenceDeformation){
                        var groupName = (<ReferenceDeformation> this._eventSeries[i]).shapeKeyGroupName;
                        var pGroup : ParticipatingGroup = null;
                    
                        for (var g = this._groups.length - 1; g >= 0; g--){
                            if (this._groups[g].groupName === groupName){
                                pGroup = this._groups[g];               
                                break;               
                            }
                        }
                        if (pGroup === null){
                            pGroup = new ParticipatingGroup(groupName);
                            this._groups.push(pGroup);
                        } 
                        pGroup._highestIndexInRun = i;
                    }
                    else{
                        // Actions & function()s all run from group 0 (may not have been assigned yet)
                        if (this._groups.length > 0) this._groups[0]._highestIndexInRun = i;
                        if (this._eventSeries[i] instanceof Action) (<Action> this._eventSeries[i])._prepare();
                    }
                    
                }else{
                     throw "AutomatonEventSeries:  eventSeries elements must either be a Deformation, Action, or function";
                }
            }
            // make sure at least 1 Deformation passed, not just Actions or functions, since there will be no group to assign them to
            this.nGroups = this._groups.length;
            if (this.nGroups === 0) throw "AutomatonEventSeries: Must have at least 1 Deformation in series.";
            
            if (this._debug && this._nRepeats === 1 && this._initialWallclockProrating !== 1)
                console.log("AutomatonEventSeries: clock prorating ignored when # of repeats is 1");
        }
        
        /** 
         * called by Automaton, to figure out which shape key group(s) this should be queued on.
         * @param {string} groupName - This is the group name to see if it has things to do in event series.
         */
        public isShapeKeyGroupParticipating(groupName : string) : boolean{
            for (var g = 0; g < this.nGroups; g++){
                if (this._groups[g].groupName === groupName) return true;
            }
            return false;
        }
        
        /**
         * Signals that a ParticipatingGroup is ready to start processing.  Also evaluates if everyBodyReady.
         * @param {string} groupName - This is the group name saying it is ready.
         */
        public activate(groupName : string) : void{
            this._everyBodyReady = true;
            for (var g = 0; g < this.nGroups; g++){
                if (this._groups[g].groupName === groupName) 
                    this._groups[g].activate();
                else this._everyBodyReady = this._everyBodyReady && this._groups[g].isReady();
            }
            if (this._debug) console.log("series activated by " + groupName + ", _everyBodyReady: " + this._everyBodyReady);
            this._repeatCounter = 0;
            this._proRatingThisRepeat = (this._nRepeats > 1) ? this._initialWallclockProrating : 1.0;
        }
        
        /**
         * Called by a shape key group to know if series is complete.  nextEvent() may still
         * return null if other groups not yet completed their events in a run, or this group has
         * no more to do, but is being blocked from starting its next series till all are done here.
         */
        public hasMoreEvents(){
            return this._repeatCounter < this._nRepeats;
        }
        
        /**
         * Called by a shape key group to get its next event of the series.  Returns null if
         * blocked, while waiting for other groups.
         * @param {string} groupName - Name of the group calling for its next event
         * 
         */
        public nextEvent(groupName : string) : any {
            // return nothing till all groups signal they are ready to start
            if (!this._everyBodyReady) return null;
            
            var pGroup : ParticipatingGroup;
            var isGroupForActions    = false; // actions are processed on group 0
            var allGroupsRunComplete = true; 
            
            // look up the appropriate ParticipatingGroup for below & set allGroupsRunComplete
            for (var g = 0; g < this.nGroups; g++){
                allGroupsRunComplete = allGroupsRunComplete && this._groups[g].runComplete();   
                         
                // no break statement inside block, so allGroupsRunComplete is valid
                if (this._groups[g].groupName === groupName){
                    pGroup = this._groups[g]; 
                    isGroupForActions = g === 0;
                }
            }
            
            if (allGroupsRunComplete){
                // increment repeat counter, reset for next run unless no more repeats
                if (++this._repeatCounter < this._nRepeats){
                    for (var g = 0; g < this.nGroups; g++){
                        this._groups[g].activate();
                    }
                    if (this._initialWallclockProrating !== 1){
                        this._proRatingThisRepeat = this._initialWallclockProrating + ((1 - this._initialWallclockProrating) * ((this._repeatCounter + 1) / this._nRepeats) );
                    }
                    if (this._debug) console.log("set for repeat # " + this._repeatCounter);
                }else{
                 if (this._debug) console.log("Series complete");
                 this._everyBodyReady = false; // ensure that nothing happens until all groups call activate() again
                }
            }
            
            if (!pGroup.runComplete()){
                // test if should declare complete
                if (pGroup._indexInRun === pGroup._highestIndexInRun){
                    pGroup._indexInRun++;
                    return null;
                }
                for (var i = pGroup._indexInRun + 1; i < this._nEvents; i++){
                    if (this._eventSeries[i] instanceof ReferenceDeformation){
                        var name = (<ReferenceDeformation> this._eventSeries[i]).shapeKeyGroupName;
                        if (pGroup.groupName === name){
                            pGroup._indexInRun = i;
                            (<ReferenceDeformation>this._eventSeries[i]).setProratedWallClocks(this._proRatingThisRepeat);
                            if (this._debug) 
                                console.log(i + " in series returned: " + name + ", allGroupsRunComplete " + allGroupsRunComplete + ", everyBodyReady " + this._everyBodyReady);
                            return this._eventSeries[i];
                        }
                    }else if (isGroupForActions){
                        pGroup._indexInRun = i;
                        return this._eventSeries[i];
                    }
                }
            }else return null; 
        }
    }
}