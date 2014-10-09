var BABYLON;
(function (BABYLON) {
    /**
    * Class to store Deformation info & evaluate how complete it should be.
    */
    var ReferenceDeformation = (function () {
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
        function ReferenceDeformation(shapeKeyGroupName, _referenceStateName, _endStateName, _milliDuration, _millisBefore, _endStateRatio, movePOV, rotatePOV, _pace) {
            if (typeof _millisBefore === "undefined") { _millisBefore = 0; }
            if (typeof _endStateRatio === "undefined") { _endStateRatio = 1; }
            if (typeof movePOV === "undefined") { movePOV = null; }
            if (typeof rotatePOV === "undefined") { rotatePOV = null; }
            if (typeof _pace === "undefined") { _pace = BABYLON.Pace.LINEAR; }
            this.shapeKeyGroupName = shapeKeyGroupName;
            this._referenceStateName = _referenceStateName;
            this._endStateName = _endStateName;
            this._milliDuration = _milliDuration;
            this._millisBefore = _millisBefore;
            this._endStateRatio = _endStateRatio;
            this.movePOV = movePOV;
            this.rotatePOV = rotatePOV;
            this._pace = _pace;
            // time and state management members
            this._startTime = -1;
            this._currentDurationRatio = ReferenceDeformation._COMPLETE;
            // argument validations
            if (this._referenceStateName === this._endStateName)
                throw "Deformation: reference state cannot be the same as the end state";
            if (this._milliDuration <= 0)
                throw "Deformation: milliDuration must > 0";
            if (this._millisBefore < 0)
                throw "Deformation: millisBefore cannot be negative";
            if (this._endStateRatio < -1 || this._endStateRatio > 1)
                throw "Deformation: endStateRatio range  > -1 and < 1";

            // mixed case group & state names not supported
            this.shapeKeyGroupName = this.shapeKeyGroupName.toUpperCase();
            this._referenceStateName = this._referenceStateName.toUpperCase();
            this._endStateName = this._endStateName.toUpperCase();

            this.setProratedWallClocks(1); // ensure values actually used for timings are initialized
        }
        // =================================== run time processing ===================================
        /**
        * Indicate readiness by caller to start processing event.
        * @param {number} lateStartMilli - indication of how far behind already
        */
        ReferenceDeformation.prototype.activate = function (lateStartMilli) {
            if (typeof lateStartMilli === "undefined") { lateStartMilli = 0; }
            this._startTime = BABYLON.Automaton.now();
            if (lateStartMilli > 0) {
                // apply 20% of the late start or 10% of duration which ever is less
                lateStartMilli /= 5;
                this._startTime -= (lateStartMilli < this._milliDuration / 10) ? lateStartMilli : this._milliDuration / 10;
            }
            this._currentDurationRatio = (this._syncPartner) ? ReferenceDeformation._BLOCKED : ((this._proratedMillisBefore > 0) ? ReferenceDeformation._WAITING : ReferenceDeformation._READY);
        };

        /** called by ShapeKeyGroup.incrementallyDeform() to determine how much of the deformation should be performed right now */
        ReferenceDeformation.prototype.getCompletionMilestone = function () {
            if (this._currentDurationRatio === ReferenceDeformation._COMPLETE) {
                return ReferenceDeformation._COMPLETE;
            }

            // BLOCK only occurs when there is a sync partner
            if (this._currentDurationRatio === ReferenceDeformation._BLOCKED) {
                // change both to WAITING & start clock, once both are BLOCKED
                if (this._syncPartner.isBlocked()) {
                    this._startTime = BABYLON.Automaton.now(); // reset the start clock
                    this._currentDurationRatio = ReferenceDeformation._WAITING;
                    this._syncPartner.syncReady(this._startTime);
                } else
                    return ReferenceDeformation._BLOCKED;
            }

            var millisSoFar = BABYLON.Automaton.now() - this._startTime;

            if (this._currentDurationRatio === ReferenceDeformation._WAITING) {
                millisSoFar -= this._proratedMillisBefore;
                if (millisSoFar >= 0) {
                    this._startTime = BABYLON.Automaton.now() - millisSoFar; // prorate start for time served
                } else
                    return ReferenceDeformation._WAITING;
            }

            this._currentDurationRatio = millisSoFar / this._proratedMilliDuration;
            if (this._currentDurationRatio > ReferenceDeformation._COMPLETE)
                this._currentDurationRatio = ReferenceDeformation._COMPLETE;

            return this._pace.getCompletionMilestone(this._currentDurationRatio);
        };

        /** support game pausing / resuming.  There is no need to actively pause a Deformation. */
        ReferenceDeformation.prototype.resumePlay = function () {
            if (this._currentDurationRatio === ReferenceDeformation._COMPLETE || this._currentDurationRatio === ReferenceDeformation._BLOCKED || this._currentDurationRatio === ReferenceDeformation._COMPLETE)
                return;

            // back into a start time which reflects the currentDurationRatio
            this._startTime = BABYLON.Automaton.now() - (this._proratedMilliDuration * this._currentDurationRatio);
        };

        // =================================== sync partner methods ===================================
        /**
        * @param {Deformation} syncPartner - Deformation which should start at the same time as this one.  MUST be in a different shape key group!
        */
        ReferenceDeformation.prototype.setSyncPartner = function (syncPartner) {
            this._syncPartner = syncPartner;
        };

        /**
        *  Called by the first of the syncPartners to detect that both are waiting for each other.
        *  Only intended to be called from getCompletionMilestone() of the partner.
        *  @param {number} startTime - passed from partner, so both are in sync as close as possible.
        */
        ReferenceDeformation.prototype.syncReady = function (startTime) {
            this._startTime = startTime;
            this._currentDurationRatio = ReferenceDeformation._WAITING;
        };

        // ==================================== Getters & setters ====================================
        ReferenceDeformation.prototype.isBlocked = function () {
            return this._currentDurationRatio === ReferenceDeformation._BLOCKED;
        };
        ReferenceDeformation.prototype.isComplete = function () {
            return this._currentDurationRatio === ReferenceDeformation._COMPLETE;
        };

        ReferenceDeformation.prototype.getReferenceStateName = function () {
            return this._referenceStateName;
        };
        ReferenceDeformation.prototype.getEndStateName = function () {
            return this._endStateName;
        };
        ReferenceDeformation.prototype.getMilliDuration = function () {
            return this._milliDuration;
        };
        ReferenceDeformation.prototype.getMillisBefore = function () {
            return this._millisBefore;
        };
        ReferenceDeformation.prototype.getEndStateRatio = function () {
            return this._endStateRatio;
        };
        ReferenceDeformation.prototype.getPace = function () {
            return this._pace;
        };
        ReferenceDeformation.prototype.getSyncPartner = function () {
            return this._syncPartner;
        };

        /**
        * Called by the Automaton Event Series, before Deformation is passed to the ShapeKeyGroup.  This
        * is to support acceleration / deceleration across event series repeats.
        * @param {number} factor - amount to multiply the constructor supplied duration & time before by.
        */
        ReferenceDeformation.prototype.setProratedWallClocks = function (factor) {
            this._proratedMilliDuration = this._milliDuration * factor;
            this._proratedMillisBefore = this._millisBefore * factor;
        };

        Object.defineProperty(ReferenceDeformation, "BLOCKED", {
            get: function () {
                return ReferenceDeformation._BLOCKED;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ReferenceDeformation, "WAITING", {
            get: function () {
                return ReferenceDeformation._WAITING;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ReferenceDeformation, "READY", {
            get: function () {
                return ReferenceDeformation._READY;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ReferenceDeformation, "COMPLETE", {
            get: function () {
                return ReferenceDeformation._COMPLETE;
            },
            enumerable: true,
            configurable: true
        });
        ReferenceDeformation._BLOCKED = -20;
        ReferenceDeformation._WAITING = -10;
        ReferenceDeformation._READY = 0;
        ReferenceDeformation._COMPLETE = 1;
        return ReferenceDeformation;
    })();
    BABYLON.ReferenceDeformation = ReferenceDeformation;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.referenceDeformation.js.map
