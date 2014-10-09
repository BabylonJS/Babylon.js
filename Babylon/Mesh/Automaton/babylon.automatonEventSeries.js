var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    /** Internal helper class used by AutomatonEventSeries to support a multi-shape group EventSeries */
    var ParticipatingGroup = (function () {
        function ParticipatingGroup(groupName) {
            this.groupName = groupName;
            this._indexInRun = -99;
            this._highestIndexInRun = -1;
        }
        ParticipatingGroup.prototype.isReady = function () {
            return this._indexInRun === -1;
        };
        ParticipatingGroup.prototype.runComplete = function () {
            return this._indexInRun > this._highestIndexInRun;
        };
        ParticipatingGroup.prototype.activate = function () {
            this._indexInRun = -1;
        };
        return ParticipatingGroup;
    })();

    /** Provide an action for an AutomatonEventSeries, for integration into action manager */
    var AutomatonEventSeriesAction = (function (_super) {
        __extends(AutomatonEventSeriesAction, _super);
        function AutomatonEventSeriesAction(triggerOptions, _target, _eSeries, condition) {
            _super.call(this, triggerOptions, condition);
            this._target = _target;
            this._eSeries = _eSeries;
        }
        AutomatonEventSeriesAction.prototype.execute = function (evt) {
            this._target.queueEventSeries(this._eSeries);
        };
        return AutomatonEventSeriesAction;
    })(BABYLON.Action);
    BABYLON.AutomatonEventSeriesAction = AutomatonEventSeriesAction;

    /** main class of file */
    var AutomatonEventSeries = (function () {
        /**
        * Validate each of the events passed and build unique shapekey groups particpating.
        * @param {Array} _eventSeries - Elements must either be a ReferenceDeformation, Action, or function.  Min # of Deformations: 1
        * @param {number} _nRepeats - Number of times to run through series elements.  There is sync across runs. (Default 1)
        * @param {number} _initialWallclockProrating - The factor to multiply the duration of a Deformation before passing to a
        *                 ShapeKeyGroup.  Amount is decreased or increased across repeats, so that it is 1 for the final repeat.
        *                 Facilitates acceleration when > 1, & deceleration when < 1. (Default 1)
        * @param {string} _debug - Write progress messages to console when true (Default false)
        */
        function AutomatonEventSeries(_eventSeries, _nRepeats, _initialWallclockProrating, _debug) {
            if (typeof _nRepeats === "undefined") { _nRepeats = 1; }
            if (typeof _initialWallclockProrating === "undefined") { _initialWallclockProrating = 1.0; }
            if (typeof _debug === "undefined") { _debug = false; }
            this._eventSeries = _eventSeries;
            this._nRepeats = _nRepeats;
            this._initialWallclockProrating = _initialWallclockProrating;
            this._debug = _debug;
            this._groups = new Array();
            this._nEvents = _eventSeries.length;

            for (var i = 0; i < this._nEvents; i++) {
                if (this._eventSeries[i] instanceof BABYLON.ReferenceDeformation || this._eventSeries[i] instanceof BABYLON.Action || typeof this._eventSeries[i] === "function") {
                    if (this._eventSeries[i] instanceof BABYLON.ReferenceDeformation) {
                        var groupName = this._eventSeries[i].shapeKeyGroupName;
                        var pGroup = null;

                        for (var g = this._groups.length - 1; g >= 0; g--) {
                            if (this._groups[g].groupName === groupName) {
                                pGroup = this._groups[g];
                                break;
                            }
                        }
                        if (pGroup === null) {
                            pGroup = new ParticipatingGroup(groupName);
                            this._groups.push(pGroup);
                        }
                        pGroup._highestIndexInRun = i;
                    } else {
                        // Actions & function()s all run from group 0 (may not have been assigned yet)
                        if (this._groups.length > 0)
                            this._groups[0]._highestIndexInRun = i;
                        if (this._eventSeries[i] instanceof BABYLON.Action)
                            this._eventSeries[i]._prepare();
                    }
                } else {
                    throw "AutomatonEventSeries:  eventSeries elements must either be a Deformation, Action, or function";
                }
            }

            // make sure at least 1 Deformation passed, not just Actions or functions, since there will be no group to assign them to
            this.nGroups = this._groups.length;
            if (this.nGroups === 0)
                throw "AutomatonEventSeries: Must have at least 1 Deformation in series.";

            if (this._debug && this._nRepeats === 1 && this._initialWallclockProrating !== 1)
                console.log("AutomatonEventSeries: clock prorating ignored when # of repeats is 1");
        }
        /**
        * called by Automaton, to figure out which shape key group(s) this should be queued on.
        * @param {string} groupName - This is the group name to see if it has things to do in event series.
        */
        AutomatonEventSeries.prototype.isShapeKeyGroupParticipating = function (groupName) {
            for (var g = 0; g < this.nGroups; g++) {
                if (this._groups[g].groupName === groupName)
                    return true;
            }
            return false;
        };

        /**
        * Signals that a ParticipatingGroup is ready to start processing.  Also evaluates if everyBodyReady.
        * @param {string} groupName - This is the group name saying it is ready.
        */
        AutomatonEventSeries.prototype.activate = function (groupName) {
            this._everyBodyReady = true;
            for (var g = 0; g < this.nGroups; g++) {
                if (this._groups[g].groupName === groupName)
                    this._groups[g].activate();
                else
                    this._everyBodyReady = this._everyBodyReady && this._groups[g].isReady();
            }
            if (this._debug)
                console.log("series activated by " + groupName + ", _everyBodyReady: " + this._everyBodyReady);
            this._repeatCounter = 0;
            this._proRatingThisRepeat = (this._nRepeats > 1) ? this._initialWallclockProrating : 1.0;
        };

        /**
        * Called by a shape key group to know if series is complete.  nextEvent() may still
        * return null if other groups not yet completed their events in a run, or this group has
        * no more to do, but is being blocked from starting its next series till all are done here.
        */
        AutomatonEventSeries.prototype.hasMoreEvents = function () {
            return this._repeatCounter < this._nRepeats;
        };

        /**
        * Called by a shape key group to get its next event of the series.  Returns null if
        * blocked, while waiting for other groups.
        * @param {string} groupName - Name of the group calling for its next event
        *
        */
        AutomatonEventSeries.prototype.nextEvent = function (groupName) {
            // return nothing till all groups signal they are ready to start
            if (!this._everyBodyReady)
                return null;

            var pGroup;
            var isGroupForActions = false;
            var allGroupsRunComplete = true;

            for (var g = 0; g < this.nGroups; g++) {
                allGroupsRunComplete = allGroupsRunComplete && this._groups[g].runComplete();

                // no break statement inside block, so allGroupsRunComplete is valid
                if (this._groups[g].groupName === groupName) {
                    pGroup = this._groups[g];
                    isGroupForActions = g === 0;
                }
            }

            if (allGroupsRunComplete) {
                // increment repeat counter, reset for next run unless no more repeats
                if (++this._repeatCounter < this._nRepeats) {
                    for (var g = 0; g < this.nGroups; g++) {
                        this._groups[g].activate();
                    }
                    if (this._initialWallclockProrating !== 1) {
                        this._proRatingThisRepeat = this._initialWallclockProrating + ((1 - this._initialWallclockProrating) * ((this._repeatCounter + 1) / this._nRepeats));
                    }
                    if (this._debug)
                        console.log("set for repeat # " + this._repeatCounter);
                } else {
                    if (this._debug)
                        console.log("Series complete");
                    this._everyBodyReady = false; // ensure that nothing happens until all groups call activate() again
                }
            }

            if (!pGroup.runComplete()) {
                // test if should declare complete
                if (pGroup._indexInRun === pGroup._highestIndexInRun) {
                    pGroup._indexInRun++;
                    return null;
                }
                for (var i = pGroup._indexInRun + 1; i < this._nEvents; i++) {
                    if (this._eventSeries[i] instanceof BABYLON.ReferenceDeformation) {
                        var name = this._eventSeries[i].shapeKeyGroupName;
                        if (pGroup.groupName === name) {
                            pGroup._indexInRun = i;
                            this._eventSeries[i].setProratedWallClocks(this._proRatingThisRepeat);
                            if (this._debug)
                                console.log(i + " in series returned: " + name + ", allGroupsRunComplete " + allGroupsRunComplete + ", everyBodyReady " + this._everyBodyReady);
                            return this._eventSeries[i];
                        }
                    } else if (isGroupForActions) {
                        pGroup._indexInRun = i;
                        return this._eventSeries[i];
                    }
                }
            } else
                return null;
        };
        return AutomatonEventSeries;
    })();
    BABYLON.AutomatonEventSeries = AutomatonEventSeries;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.automatonEventSeries.js.map
