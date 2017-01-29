module BABYLON {

    /**
     * The base class for all implementation of a Primitive Collision Manager
     */
    export abstract class PrimitiveCollisionManagerBase {
        constructor(owner: Canvas2D) {
            this._owner = owner;
        }

        abstract _addActor(actor: Prim2DBase, deep: boolean): ActorInfoBase;
        abstract _removeActor(actor: Prim2DBase);

        abstract _update();

        /**
         * If collisionManagerUseBorders is true during the Canvas creation, this dictionary contains all the primitives intersecting with the left border
         */
        abstract get leftBorderIntersectedActors(): ObservableStringDictionary<Prim2DBase>;

        /**
         * If collisionManagerUseBorders is true during the Canvas creation, this dictionary contains all the primitives intersecting with the bottom border
         */
        abstract get bottomBorderIntersectedActors(): ObservableStringDictionary<Prim2DBase>;

        /**
         * If collisionManagerUseBorders is true during the Canvas creation, this dictionary contains all the primitives intersecting with the right border
         */
        abstract get rightBorderIntersectedActors(): ObservableStringDictionary<Prim2DBase>;

        /**
         * If collisionManagerUseBorders is true during the Canvas creation, this dictionary contains all the primitives intersecting with the top border
         */
        abstract get topBorderIntersectedActors(): ObservableStringDictionary<Prim2DBase>;

        /**
         * This dictionary contains all the couple of intersecting primitives
         */
        abstract get intersectedActors(): ObservableStringDictionary<{ a: Prim2DBase, b: Prim2DBase }>;

        /**
         * Renders the World AABB of all Actors
         */
        abstract get debugRenderAABB(): boolean;
        abstract set debugRenderAABB(val: boolean);

        /**
         * Renders the area of the Clusters
         */
        abstract get debugRenderClusters(): boolean;
        abstract set debugRenderClusters(val: boolean);

        /**
         * Display stats about the PCM on screen
         */
        abstract get debugStats(): boolean;
        abstract set debugStats(val: boolean);

        public static allocBasicPCM(owner: Canvas2D, enableBorders: boolean): PrimitiveCollisionManagerBase {
            return new BasicPrimitiveCollisionManager(owner, enableBorders);
        }

        protected _owner: Canvas2D;
    }

    /**
     * Base class of an Actor
     */
    export abstract class ActorInfoBase {
        /**
         * Access the World AABB of the Actor, the vector4 is x:left, y: bottom, z: right, w: top
         */
        abstract get worldAABB(): Vector4;

        /**
         * Return true if the actor is enable, false otherwise
         */
        abstract get isEnabled(): boolean;

        /**
         * Return true is the actor boundingInfo is use, false if its levelBoundingInfo is used.
         */
        abstract get isDeep(): boolean;

        /**
         * Return the primitive of the actor
         */
        abstract get prim(): Prim2DBase;

        /**
         * Return a dictionary containing all the actors intersecting with this one
         */
        abstract get intersectWith(): ObservableStringDictionary<ActorInfoBase>;
    }

    class ActorInfo extends ActorInfoBase {
        constructor(owner: BasicPrimitiveCollisionManager, actor: Prim2DBase, deep: boolean) {
            super();
            this.owner = owner;
            this.prim = actor;
            this.flags = 0;
            this.presentInClusters = new StringDictionary<ClusterInfo>();
            this.intersectWith = new ObservableStringDictionary<ActorInfo>(false);
            this.setFlags((deep ? ActorInfo.flagDeep : 0) | ActorInfo.flagDirty);

            let bi = (deep ? actor.boundingInfo : actor.levelBoundingInfo);

            // Dirty Actor if its WorldAABB changed
            bi.worldAABBDirtyObservable.add((e, d) => {
                this.owner.actorDirty(this);
            });

            // Dirty Actor if it's getting enabled/disabled
            actor.propertyChanged.add((e, d) => {
                if (d.mask === -1) {
                    return;
                }
                this.setFlagsValue(ActorInfo.flagEnabled, e.newValue === true);
                this.owner.actorDirty(this);
            }, Prim2DBase.isVisibleProperty.flagId);
        }

        setFlags(flags: number) {
            this.flags |= flags;
        }

        clearFlags(flags: number) {
            this.flags &= ~flags;
        }

        isAllFlagsSet(flags: number) {
            return (this.flags & flags) === flags;
        }

        isSomeFlagsSet(flags: number) {
            return (this.flags & flags) !== 0;
        }

        setFlagsValue(flags: number, value: boolean) {
            if (value) {
                this.flags |= flags;
            } else {
                this.flags &= ~flags;
            }
        }

        get worldAABB(): Vector4 {
            return (this.isSomeFlagsSet(ActorInfo.flagDeep) ? this.prim.boundingInfo : this.prim.levelBoundingInfo).worldAABB;
        }

        get isEnabled(): boolean {
            return this.isSomeFlagsSet(ActorInfo.flagEnabled);
        }

        get isDeep(): boolean {
            return this.isSomeFlagsSet(ActorInfo.flagDeep);
        }

        get isDirty(): boolean {
            return this.isSomeFlagsSet(ActorInfo.flagDirty);
        }

        get isRemoved(): boolean {
            return this.isSomeFlagsSet(ActorInfo.flagRemoved);
        }

        prim: Prim2DBase;
        flags: number;
        owner: BasicPrimitiveCollisionManager;
        presentInClusters: StringDictionary<ClusterInfo>;
        intersectWith: ObservableStringDictionary<ActorInfoBase>;

        public static flagDeep       = 0x0001;      // set if the actor boundingInfo must be used instead of the levelBoundingInfo
        public static flagEnabled    = 0x0002;      // set if the actor is enabled and should be considered for intersection tests
        public static flagDirty      = 0x0004;      // set if the actor's AABB is dirty
        public static flagRemoved    = 0x0008;      // set if the actor was removed from the PCM
    }

    class ClusterInfo {
        constructor() {
            this.actors = new StringDictionary<ActorInfo>();
        }

        clear() {
            this.actors.clear();
        }

        actors: StringDictionary<ActorInfo>;
    }

    class BasicPrimitiveCollisionManager extends PrimitiveCollisionManagerBase {

        constructor(owner: Canvas2D, enableBorders: boolean) {
            super(owner);
            this._actors = new StringDictionary<ActorInfo>();
            this._dirtyActors = new StringDictionary<ActorInfo>();
            this._clusters = null;
            this._maxActorByCluster = 0;
            this._AABBRenderPrim = null;
            this._canvasSize = Size.Zero();
            this._ClusterRenderPrim = null;
            this._debugTextBackground = null;
            this._clusterDirty = true;
            this._clusterSize = new Size(2, 2);
            this._clusterStep = Vector2.Zero();
            this._lastClusterResizeCounter = 0;
            this._freeClusters = new Array<ClusterInfo>();
            this._enableBorder = enableBorders;
            this._debugUpdateOpCount = new PerfCounter();
            this._debugUpdateTime = new PerfCounter();
            this._intersectedActors = new ObservableStringDictionary<{ a: Prim2DBase; b: Prim2DBase }>(false);
            this._borderIntersecteddActors = new Array<ObservableStringDictionary<Prim2DBase>>(4);
            for (let j = 0; j < 4; j++) {
                this._borderIntersecteddActors[j] = new ObservableStringDictionary<Prim2DBase>(false);
            }
            let flagId = Canvas2D.actualSizeProperty.flagId;

            if (!BasicPrimitiveCollisionManager.WAABBCorners) {
                BasicPrimitiveCollisionManager.WAABBCorners = new Array<Vector2>(4);
                for (let i = 0; i < 4; i++) {
                    BasicPrimitiveCollisionManager.WAABBCorners[i] = Vector2.Zero();
                }
                BasicPrimitiveCollisionManager.WAABBCornersCluster = new Array<Vector2>(4);
                for (let i = 0; i < 4; i++) {
                    BasicPrimitiveCollisionManager.WAABBCornersCluster[i] = Vector2.Zero();
                }
            }

            owner.propertyChanged.add((e: PropertyChangedInfo, d) => {
                if (d.mask === -1) {
                    return;
                }
                this._clusterDirty = true;
                console.log("canvas size changed");
            }, flagId);

            this.debugRenderAABB = false;
            this.debugRenderClusters = false;
            this.debugStats = false;
        }

        _addActor(actor: Prim2DBase, deep: boolean): ActorInfoBase {
            return this._actors.getOrAddWithFactory(actor.uid, () => {
                let ai = new ActorInfo(this, actor, deep);
                this.actorDirty(ai);
                return ai;
            });
        }

        _removeActor(actor: Prim2DBase) {
            let ai = this._actors.getAndRemove(actor.uid);
            ai.setFlags(ActorInfo.flagRemoved);
            this.actorDirty(ai);
        }

        actorDirty(actor: ActorInfo) {
            actor.setFlags(ActorInfo.flagDirty);
            this._dirtyActors.add(actor.prim.uid, actor);
        }

        _update() {
            this._canvasSize.copyFrom(this._owner.actualSize);

            // Should we update the WireFrame2D Primitive that displays the WorldAABB ?
            if (this.debugRenderAABB) {
                if (this._dirtyActors.count > 0 || this._debugRenderAABBDirty) {
                    this._updateAABBDisplay();
                }
            }
            if (this._AABBRenderPrim) {
                this._AABBRenderPrim.levelVisible = this.debugRenderAABB;
            }

            let cw = this._clusterSize.width;
            let ch = this._clusterSize.height;

            // Check for Cluster resize
            if (((this._clusterSize.width < 16 && this._clusterSize.height < 16 && this._maxActorByCluster >= 10) ||
                 (this._clusterSize.width > 2 && this._clusterSize.height > 2 && this._maxActorByCluster <= 7)) &&
                this._lastClusterResizeCounter > 100) {

                if (this._maxActorByCluster >= 10) {
                    ++cw;
                    ++ch;
                } else {
                    --cw;
                    --ch;
                }
                console.log(`Change cluster size to ${cw}:${ch}, max actor ${this._maxActorByCluster}`);
                this._clusterDirty = true;
            }

            // Should we update the WireFrame2D Primitive that displays the clusters
            if (this.debugRenderClusters && this._clusterDirty) {
                this._updateClusterDisplay(cw, ch);
            }
            if (this._ClusterRenderPrim) {
                this._ClusterRenderPrim.levelVisible = this.debugRenderClusters;
            }


            let updateStats = this.debugStats && (this._dirtyActors.count > 0 || this._clusterDirty);

            this._debugUpdateTime.beginMonitoring();

            // If the Cluster Size changed: rebuild it and add all actors. Otherwise add only new (dirty) actors
            if (this._clusterDirty) {
                this._initializeCluster(cw, ch);
                this._rebuildAllActors();
            } else {
                this._rebuildDirtyActors();
                ++this._lastClusterResizeCounter;
            }

            // Proceed to the collision detection between primitives
            this._collisionDetection();

            this._debugUpdateTime.endMonitoring();

            if (updateStats) {
                this._updateDebugStats();
            }

            if (this._debugTextBackground) {
                this._debugTextBackground.levelVisible = updateStats;
            }

            // Reset the dirty actor list: everything is processed
            this._dirtyActors.clear();
        }

        /**
         * Renders the World AABB of all Actors
         */
        public get debugRenderAABB(): boolean {
            return this._debugRenderAABB;
        }

        public set debugRenderAABB(val: boolean) {
            if (this._debugRenderAABB === val) {
                return;
            }

            this._debugRenderAABB = val;
            this._debugRenderAABBDirty = true;
        }

        /**
         * Renders the area of the Clusters
         */
        public debugRenderClusters: boolean;

        /**
         * Display stats about the PCM on screen
         */
        public debugStats: boolean;

        get intersectedActors(): ObservableStringDictionary<{ a: Prim2DBase; b: Prim2DBase }> {
            return this._intersectedActors;
        }

        get leftBorderIntersectedActors(): ObservableStringDictionary<Prim2DBase> {
            return this._borderIntersecteddActors[0];
        }

        get bottomBorderIntersectedActors(): ObservableStringDictionary<Prim2DBase> {
            return this._borderIntersecteddActors[1];
        }

        get rightBorderIntersectedActors(): ObservableStringDictionary<Prim2DBase> {
            return this._borderIntersecteddActors[2];
        }

        get topBorderIntersectedActors(): ObservableStringDictionary<Prim2DBase> {
            return this._borderIntersecteddActors[3];
        }

        private _initializeCluster(countW: number, countH: number) {
            // Check for free
            if (this._clusters) {
                for (let w = 0; w < this._clusterSize.height; w++) {
                    for (let h = 0; h < this._clusterSize.width; h++) {
                        this._freeClusterInfo(this._clusters[w][h]);
                    }
                }
            }

            // Allocate
            this._clusterSize.copyFromFloats(countW, countH);
            this._clusters = [];
            for (let w = 0; w < this._clusterSize.height; w++) {
                this._clusters[w] = [];
                for (let h = 0; h < this._clusterSize.width; h++) {
                    let ci = this._allocClusterInfo();
                    this._clusters[w][h] = ci;
                }
            }

            this._clusterStep.copyFromFloats(this._owner.actualWidth / countW, this._owner.actualHeight / countH);
            this._maxActorByCluster = 0;
            this._lastClusterResizeCounter = 0;

            this._clusterDirty = false;
        }

        private _rebuildAllActors() {
            this._actors.forEach((k, ai) => {
                this._processActor(ai);
            });
        }

        private _rebuildDirtyActors() {
            this._dirtyActors.forEach((k, ai) => {
                this._processActor(ai);
            });
        }

        static WAABBCorners: Array<Vector2> = null;
        static WAABBCornersCluster: Array<Vector2> = null;

        private _processActor(actor: ActorInfo) {
            // Check if the actor is being disabled or removed
            if (!actor.isEnabled || actor.isRemoved) {
                actor.presentInClusters.forEach((k, ci) => {
                    ci.actors.remove(actor.prim.uid);
                });
                actor.presentInClusters.clear();
                return;
            }

            let wab = actor.worldAABB;

            // Build the worldAABB corners
            let wac = BasicPrimitiveCollisionManager.WAABBCorners;
            wac[0].copyFromFloats(wab.x, wab.y); // Bottom/Left
            wac[1].copyFromFloats(wab.z, wab.y); // Bottom/Right
            wac[2].copyFromFloats(wab.z, wab.w); // Top/Right
            wac[3].copyFromFloats(wab.x, wab.w); // Top/Left

            let cs = this._clusterStep;
            let wacc = BasicPrimitiveCollisionManager.WAABBCornersCluster;
            for (let i = 0; i < 4; i++) {
                let p = wac[i];
                let cx = (p.x - (p.x % cs.x)) / cs.x;
                let cy = (p.y - (p.y % cs.y)) / cs.y;
                wacc[i].copyFromFloats(Math.floor(cx), Math.floor(cy));
            }

            let opCount = 0;
            let totalClusters = 0;
            let newCI = new Array<ClusterInfo>();
            let sx = Math.max(0, wacc[0].x);                              // Start Cluster X
            let sy = Math.max(0, wacc[0].y);                              // Start Cluster Y
            let ex = Math.min(this._clusterSize.width - 1,  wacc[2].x);   // End Cluster X
            let ey = Math.min(this._clusterSize.height - 1, wacc[2].y);   // End Cluster Y

            if (this._enableBorder) {
                if (wac[0].x < 0) {
                    this._borderIntersecteddActors[0].add(actor.prim.uid, actor.prim);
                } else {
                    this._borderIntersecteddActors[0].remove(actor.prim.uid);
                }
                if (wac[0].y < 0) {
                    this._borderIntersecteddActors[1].add(actor.prim.uid, actor.prim);
                } else {
                    this._borderIntersecteddActors[1].remove(actor.prim.uid);
                }
                if (wac[2].x >= this._canvasSize.width) {
                    this._borderIntersecteddActors[2].add(actor.prim.uid, actor.prim);
                } else {
                    this._borderIntersecteddActors[2].remove(actor.prim.uid);
                }
                if (wac[2].y >= this._canvasSize.height) {
                    this._borderIntersecteddActors[3].add(actor.prim.uid, actor.prim);
                } else {
                    this._borderIntersecteddActors[3].remove(actor.prim.uid);
                }
            }

            for (var y = sy; y <= ey; y++) {
                for (let x = sx; x <= ex; x++) {
                    let k = `${x}:${y}`;
                    let cx = x, cy = y;
                    let ci = actor.presentInClusters.getOrAddWithFactory(k,
                        (k) => {
                            let nci = this._getCluster(cx, cy);
                            nci.actors.add(actor.prim.uid, actor);
                            this._maxActorByCluster = Math.max(this._maxActorByCluster, nci.actors.count);
                            ++opCount;
                            ++totalClusters;
                            return nci;
                        });
                    newCI.push(ci);
                }
            }

            // Check if there were no change
            if (opCount === 0 && actor.presentInClusters.count === totalClusters) {
                return;
            }

            // Build the array of the cluster where the actor is no longer in
            let clusterToRemove = new Array<string>();
            actor.presentInClusters.forEach((k, ci) => {
                if (newCI.indexOf(ci) === -1) {
                    clusterToRemove.push(k);
                    // remove the primitive from the Cluster Info object
                    ci.actors.remove(actor.prim.uid);
                }
            });

            // Remove these clusters from the actor's dictionary
            for (let key of clusterToRemove) {
                actor.presentInClusters.remove(key);
            }
        }

        private static CandidatesActors = new StringDictionary<ActorInfoBase>();
        private static PreviousIntersections = new StringDictionary<ActorInfoBase>();

        // The algorithm is simple, we have previously partitioned the Actors in the Clusters: each actor has a list of the Cluster(s) it's inside.
        // Then for a given Actor that is dirty we evaluate the intersection with all the other actors present in the same Cluster(s)
        // So it's basically O(n²), BUT only inside a Cluster and only for dirty Actors.
        private _collisionDetection() {
            let hash = BasicPrimitiveCollisionManager.CandidatesActors;
            let prev = BasicPrimitiveCollisionManager.PreviousIntersections;
            let opCount = 0;

            this._dirtyActors.forEach((k1, ai1) => {
                ++opCount;

                // Build the list of candidates
                hash.clear();
                ai1.presentInClusters.forEach((k, ci) => {
                    ++opCount;
                    ci.actors.forEach((k, v) => hash.add(k, v));
                });

                let wab1 = ai1.worldAABB;

                // Save the previous intersections
                prev.clear();
                prev.copyFrom(ai1.intersectWith);

                ai1.intersectWith.clear();

                // For each candidate
                hash.forEach((k2, ai2) => {
                    ++opCount;

                    // Check if we're testing against itself
                    if (k1 === k2) {
                        return;
                    }

                    let wab2 = ai2.worldAABB;
                     
                    if (wab2.z >= wab1.x && wab2.x <= wab1.z && wab2.w >= wab1.y && wab2.y <= wab1.w) {

                        if (ai1.prim.intersectOtherPrim(ai2.prim)) {
                            ++opCount;
                            ai1.intersectWith.add(k2, ai2);

                            if (k1 < k2) {
                                this._intersectedActors.add(`${k1};${k2}`, { a: ai1.prim, b: ai2.prim });
                            } else {
                                this._intersectedActors.add(`${k2};${k1}`, { a: ai2.prim, b: ai1.prim });
                            }
                        }
                    }
                });

                // Check and remove the associations that no longer exist in the main intersection list
                prev.forEach((k, ai) => {
                    if (!ai1.intersectWith.contains(k)) {
                        ++opCount;
                        this._intersectedActors.remove(`${k<k1 ? k : k1};${k<k1 ? k1 : k}`);
                    }
                });

            });

            this._debugUpdateOpCount.fetchNewFrame();
            this._debugUpdateOpCount.addCount(opCount, true);
        }

        private _getCluster(x: number, y: number): ClusterInfo {
            return this._clusters[x][y];
        }

        private _updateDebugStats() {

            let format = (v: number) => (Math.round(v*100)/100).toString();
            let txt =   `Primitive Collision Stats\n` + 
                        ` - PCM Execution Time: ${format(this._debugUpdateTime.lastSecAverage)}ms\n` +
                        ` - Operation Count: ${format(this._debugUpdateOpCount.current)}, (avg:${format(this._debugUpdateOpCount.lastSecAverage)}, t:${format(this._debugUpdateOpCount.total)})\n` +
                        ` - Max Actor per Cluster: ${this._maxActorByCluster}\n` +
                        ` - Intersections count: ${this.intersectedActors.count}`;

            if (!this._debugTextBackground) {

                this._debugTextBackground = new Rectangle2D({
                    id: "###DEBUG PMC STATS###", parent: this._owner, marginAlignment: "h: left, v: top", fill: "#C0404080", padding: "10", margin: "10", roundRadius: 10, children: [
                        new Text2D(txt, { id: "###DEBUG PMC TEXT###", fontName: "12pt Lucida Console" })
                    ]
                });
                    
            } else {
                this._debugTextBackground.levelVisible = true;
                let text2d = this._debugTextBackground.children[0] as Text2D;
                text2d.text = txt;
            }
        }

        private _updateAABBDisplay() {
            let g = new WireFrameGroup2D("main", new Color4(0.5, 0.8, 1.0, 1.0));

            let v = Vector2.Zero();

            this._actors.forEach((k, ai) => {
                if (ai.isEnabled) {
                    let ab = ai.worldAABB;

                    v.x = ab.x;
                    v.y = ab.y;
                    g.startLineStrip(v);

                    v.x = ab.z;
                    g.pushVertex(v);

                    v.y = ab.w;
                    g.pushVertex(v);

                    v.x = ab.x;
                    g.pushVertex(v);

                    v.y = ab.y;
                    g.endLineStrip(v);
                }
            });

            if (!this._AABBRenderPrim) {
                this._AABBRenderPrim = new WireFrame2D([g], { parent: this._owner, alignToPixel: false, id: "###DEBUG PCM AABB###" });
            } else {
                this._AABBRenderPrim.wireFrameGroups.set("main", g);
                this._AABBRenderPrim.wireFrameGroupsDirty();
            }

            this._debugRenderAABBDirty = false;
        }

        private _updateClusterDisplay(cw: number, ch: number) {
            let g = new WireFrameGroup2D("main", new Color4(0.8, 0.1, 0.5, 1.0));

            let v1 = Vector2.Zero();
            let v2 = Vector2.Zero();

            // Vertical lines
            let step = (this._owner.actualWidth-1) / cw;
            v1.y = 0;
            v2.y = this._owner.actualHeight;
            for (let x = 0; x <= cw; x++) {
                g.pushVertex(v1);
                g.pushVertex(v2);

                v1.x += step;
                v2.x += step;
            }

            // Horizontal lines
            step = (this._owner.actualHeight-1) / ch;
            v1.x = v1.y = v2.y = 0;
            v2.x = this._owner.actualWidth;
            for (let y = 0; y <= ch; y++) {
                g.pushVertex(v1);
                g.pushVertex(v2);

                v1.y += step;
                v2.y += step;
            }

            if (!this._ClusterRenderPrim) {
                this._ClusterRenderPrim = new WireFrame2D([g], { parent: this._owner, alignToPixel: true, id: "###DEBUG PCM Clusters###" });
            } else {
                this._ClusterRenderPrim.wireFrameGroups.set("main", g);
                this._ClusterRenderPrim.wireFrameGroupsDirty();
            }
        }

        // Basically: we don't want to spend our time playing with the GC each time the Cluster Array is rebuilt, so we keep a list of available
        //  ClusterInfo object and we have two method to allocate/free them. This way we always deal with the same objects.
        // The free array never shrink, always grows...For the better...and the worst!
        private _allocClusterInfo(): ClusterInfo {
            if (this._freeClusters.length === 0) {
                for (let i = 0; i < 8; i++) {
                    this._freeClusters.push(new ClusterInfo());
                }
            }

            return this._freeClusters.pop();
        }

        private _freeClusterInfo(ci: ClusterInfo) {
            ci.clear();
            this._freeClusters.push(ci);
        }

        private _canvasSize: Size;
        private _clusterDirty: boolean;
        private _clusterSize: Size;
        private _clusterStep: Vector2;
        private _clusters: ClusterInfo[][];
        private _maxActorByCluster: number;
        private _lastClusterResizeCounter: number;
        private _actors: StringDictionary<ActorInfo>;
        private _dirtyActors: StringDictionary<ActorInfo>;

        private _freeClusters: Array<ClusterInfo>;
        private _enableBorder: boolean;
        private _intersectedActors: ObservableStringDictionary<{ a: Prim2DBase; b: Prim2DBase }>;
        private _borderIntersecteddActors: ObservableStringDictionary<Prim2DBase>[];
        private _debugUpdateOpCount: PerfCounter;
        private _debugUpdateTime: PerfCounter;
        private _debugRenderAABB: boolean;
        private _debugRenderAABBDirty: boolean;
        private _AABBRenderPrim: WireFrame2D;
        private _ClusterRenderPrim: WireFrame2D;
        private _debugTextBackground: Rectangle2D;
    }
}