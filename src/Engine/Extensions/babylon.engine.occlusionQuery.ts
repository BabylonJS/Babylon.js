module BABYLON {
    export interface Engine {       
        /**
         * Create a new webGL query (you must be sure that queries are supported by checking getCaps() function)
         * @return the new query
         */
        createQuery(): WebGLQuery;

        /**
         * Delete and release a webGL query
         * @param query defines the query to delete
         * @return the current engine
         */
        deleteQuery(query: WebGLQuery): Engine;

        /**
         * Check if a given query has resolved and got its value
         * @param query defines the query to check
         * @returns true if the query got its value
         */
        isQueryResultAvailable(query: WebGLQuery): boolean;

        /**
         * Gets the value of a given query
         * @param query defines the query to check
         * @returns the value of the query
         */
        getQueryResult(query: WebGLQuery): number;        

        /**
         * Initiates an occlusion query
         * @param algorithmType defines the algorithm to use
         * @param query defines the query to use
         * @returns the current engine
         * @see http://doc.babylonjs.com/features/occlusionquery
         */
        beginOcclusionQuery(algorithmType: number, query: WebGLQuery): Engine;

        /**
         * Ends an occlusion query
         * @see http://doc.babylonjs.com/features/occlusionquery
         * @param algorithmType defines the algorithm to use
         * @returns the current engine
         */
        endOcclusionQuery(algorithmType: number): Engine;   

        /**
         * Starts a time query (used to measure time spent by the GPU on a specific frame)
         * Please note that only one query can be issued at a time
         * @returns a time token used to track the time span
         */
        startTimeQuery(): Nullable<_TimeToken>;

        /**
         * Ends a time query
         * @param token defines the token used to measure the time span
         * @returns the time spent (in ns)
         */
        endTimeQuery(token: _TimeToken): int;

        /** @hidden */
        _currentNonTimestampToken: Nullable<_TimeToken>;
        
        /** @hidden */
        _createTimeQuery(): WebGLQuery;

        /** @hidden */
        _deleteTimeQuery(query: WebGLQuery): void;

        /** @hidden */
        _getGlAlgorithmType(algorithmType: number): number;

        /** @hidden */
        _getTimeQueryResult(query: WebGLQuery): any;

        /** @hidden */
        _getTimeQueryAvailability(query: WebGLQuery): any;
    }

    Engine.prototype.createQuery = function(): WebGLQuery {
        return this._gl.createQuery();
    }

    Engine.prototype.deleteQuery = function(query: WebGLQuery): Engine {
        this._gl.deleteQuery(query);

        return this;
    }

    Engine.prototype.isQueryResultAvailable = function(query: WebGLQuery): boolean {
        return this._gl.getQueryParameter(query, this._gl.QUERY_RESULT_AVAILABLE) as boolean;
    }

    Engine.prototype.getQueryResult = function(query: WebGLQuery): number {
        return this._gl.getQueryParameter(query, this._gl.QUERY_RESULT) as number;
    }

    Engine.prototype.beginOcclusionQuery = function(algorithmType: number, query: WebGLQuery): Engine {
        var glAlgorithm = this._getGlAlgorithmType(algorithmType);
        this._gl.beginQuery(glAlgorithm, query);

        return this;
    }

    Engine.prototype.endOcclusionQuery = function(algorithmType: number): Engine {
        var glAlgorithm = this._getGlAlgorithmType(algorithmType);
        this._gl.endQuery(glAlgorithm);

        return this;
    }

    Engine.prototype._createTimeQuery = function(): WebGLQuery {
        let timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

        if (timerQuery.createQueryEXT) {
            return timerQuery.createQueryEXT();
        }

        return this.createQuery();
    }

    Engine.prototype._deleteTimeQuery = function(query: WebGLQuery): void {
        let timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

        if (timerQuery.deleteQueryEXT) {
            timerQuery.deleteQueryEXT(query);
            return;
        }

        this.deleteQuery(query);
    }

    Engine.prototype._getTimeQueryResult = function(query: WebGLQuery): any {
        let timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

        if (timerQuery.getQueryObjectEXT) {
            return timerQuery.getQueryObjectEXT(query, timerQuery.QUERY_RESULT_EXT);
        }
        return this.getQueryResult(query);
    }

    Engine.prototype._getTimeQueryAvailability = function(query: WebGLQuery): any {
        let timerQuery = <EXT_disjoint_timer_query>this.getCaps().timerQuery;

        if (timerQuery.getQueryObjectEXT) {
            return timerQuery.getQueryObjectEXT(query, timerQuery.QUERY_RESULT_AVAILABLE_EXT);
        }
        return this.isQueryResultAvailable(query);
    }

    Engine.prototype.startTimeQuery = function(): Nullable<_TimeToken> {
        let caps = this.getCaps();
        let timerQuery = caps.timerQuery;
        if (!timerQuery) {
            return null;
        }

        let token = new _TimeToken();
        this._gl.getParameter(timerQuery.GPU_DISJOINT_EXT);
        if (caps.canUseTimestampForTimerQuery) {
            token._startTimeQuery = this._createTimeQuery();

            timerQuery.queryCounterEXT(token._startTimeQuery, timerQuery.TIMESTAMP_EXT);
        } else {
            if (this._currentNonTimestampToken) {
                return this._currentNonTimestampToken;
            }

            token._timeElapsedQuery = this._createTimeQuery();
            if (timerQuery.beginQueryEXT) {
                timerQuery.beginQueryEXT(timerQuery.TIME_ELAPSED_EXT, token._timeElapsedQuery);
            } else {
                this._gl.beginQuery(timerQuery.TIME_ELAPSED_EXT, token._timeElapsedQuery);
            }

            this._currentNonTimestampToken = token;
        }
        return token;
    }

    Engine.prototype.endTimeQuery = function(token: _TimeToken): int {
        let caps = this.getCaps();
        let timerQuery = caps.timerQuery;
        if (!timerQuery || !token) {
            return -1;
        }

        if (caps.canUseTimestampForTimerQuery) {
            if (!token._startTimeQuery) {
                return -1;
            }
            if (!token._endTimeQuery) {
                token._endTimeQuery = this._createTimeQuery();
                timerQuery.queryCounterEXT(token._endTimeQuery, timerQuery.TIMESTAMP_EXT);
            }
        } else if (!token._timeElapsedQueryEnded) {
            if (!token._timeElapsedQuery) {
                return -1;
            }
            if (timerQuery.endQueryEXT) {
                timerQuery.endQueryEXT(timerQuery.TIME_ELAPSED_EXT);
            } else {
                this._gl.endQuery(timerQuery.TIME_ELAPSED_EXT);
            }
            token._timeElapsedQueryEnded = true;
        }

        let disjoint = this._gl.getParameter(timerQuery.GPU_DISJOINT_EXT);
        let available: boolean = false;
        if (token._endTimeQuery) {
            available = this._getTimeQueryAvailability(token._endTimeQuery);
        } else if (token._timeElapsedQuery) {
            available = this._getTimeQueryAvailability(token._timeElapsedQuery);
        }

        if (available && !disjoint) {
            let result = 0;
            if (caps.canUseTimestampForTimerQuery) {
                if (!token._startTimeQuery || !token._endTimeQuery) {
                    return -1;
                }
                let timeStart = this._getTimeQueryResult(token._startTimeQuery);
                let timeEnd = this._getTimeQueryResult(token._endTimeQuery);

                result = timeEnd - timeStart;
                this._deleteTimeQuery(token._startTimeQuery);
                this._deleteTimeQuery(token._endTimeQuery);
                token._startTimeQuery = null;
                token._endTimeQuery = null;
            } else {
                if (!token._timeElapsedQuery) {
                    return -1;
                }

                result = this._getTimeQueryResult(token._timeElapsedQuery);
                this._deleteTimeQuery(token._timeElapsedQuery);
                token._timeElapsedQuery = null;
                token._timeElapsedQueryEnded = false;
                this._currentNonTimestampToken = null;
            }
            return result;
        }

        return -1;
    }

    Engine.prototype._getGlAlgorithmType = function(algorithmType: number): number {
        return algorithmType === AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE ? this._gl.ANY_SAMPLES_PASSED_CONSERVATIVE : this._gl.ANY_SAMPLES_PASSED;
    }
}