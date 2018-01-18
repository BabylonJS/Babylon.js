namespace BABYLON {
  /**
   * This represents a GPU particle system in Babylon.
   * This os the fastest particle system in Babylon as it uses the GPU to update the individual particle data.
   */
  export class GPUParticleSystem implements IDisposable, IParticleSystem {
    /**
     * The id of the Particle system.
     */
    public id: string;

    /**
     * The friendly name of the Particle system.
     */
    public name: string;

    /**
     * The emitter represents the Mesh or position we are attaching the particle system to.
     */
    public emitter: Nullable<AbstractMesh | Vector3> = null;

    /**
     * The rendering group used by the Particle system to chose when to render.
     */
    public renderingGroupId = 0;

    /**
     * The layer mask we are rendering the particles through.
     */
    public layerMask: number = 0x0fffffff; // TODO

    private _capacity: number;
    private _renderEffect: Effect;
    private _updateEffect: Effect;

    private _updateBuffer: Buffer;
    private _updateVAO: WebGLVertexArrayObject;
    private _updateVertexBuffers: { [key: string]: VertexBuffer } = {};
    private _renderBuffer: Buffer;
    private _renderVAO: WebGLVertexArrayObject;
    private _renderVertexBuffers: { [key: string]: VertexBuffer } = {};

    private _sourceVAO: WebGLVertexArrayObject;
    private _targetVAO: WebGLVertexArrayObject;
    private _sourceBuffer: Buffer;
    private _targetBuffer: Buffer;

    private _scene: Scene;
    private _engine: Engine;

    private _currentRenderId = -1;
    private _started = true;

    /**
     * An event triggered when the system is disposed.
     */
    public onDisposeObservable = new Observable<GPUParticleSystem>();

    /**
     * Gets Wether the system has been started.
     * @returns True if it has been started, otherwise false.
     */
    public isStarted(): boolean {
      return this._started;
    }

    /**
     * Starts the particle system and begins to emit.
     */
    public start(): void {
      this._started = true;
    }

    /**
     * Stops the particle system.
     */
    public stop(): void {
      this._started = false;
    }

    /**
     * Instantiates a GPU particle system.
     * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
     * @param name The name of the particle system
     * @param capacity The max number of particles alive at the same time
     * @param scene The scene the particle system belongs to
     */
    constructor(name: string, capacity: number, scene: Scene) {
      this.id = name;
      this.name = name;
      this._scene = scene || Engine.LastCreatedScene;
      this._capacity = capacity;
      this._engine = this._scene.getEngine();

      this._scene.particleSystems.push(this);

      this._renderEffect = new Effect(
        "gpuRenderParticles",
        ["position", "age", "life", "velocity"],
        [],
        [],
        this._scene.getEngine()
      );

      let updateEffectOptions: EffectCreationOptions = {
        attributes: ["position", "age", "life", "velocity"],
        uniformsNames: [],
        uniformBuffersNames: [],
        samplers: [],
        defines: "",
        fallbacks: null,
        onCompiled: null,
        onError: null,
        indexParameters: null,
        maxSimultaneousLights: 0,
        transformFeedbackVaryings: [
          "outPosition",
          "outAge",
          "outLife",
          "outVelocity"
        ]
      };

      this._updateEffect = new Effect(
        "gpuUpdateParticles",
        updateEffectOptions,
        this._scene.getEngine()
      );
    }

    /**
     * Animates the particle system for the current frame by emitting new particles and or animating the living ones.
     */
    public animate(): void {
      // Do nothing
    }

    private _initialize(): void {
      if (this._renderVAO) {
        return;
      }

      var data = new Array<float>();
      for (
        var particleIndex = 0;
        particleIndex < this._capacity;
        particleIndex++
      ) {
        // position
        data.push(0.0);
        data.push(0.0);
        data.push(0.0);

        var life = 1 + Math.random() * 10; // TODO: var
        data.push(life + 1); // create the particle as a dead one to create a new one at start
        data.push(life);

        // velocity
        data.push(0.0);
        data.push(0.0);
        data.push(0.0);
      }

      // Update VAO
      this._updateBuffer = new Buffer(this._scene.getEngine(), data, false, 0);
      this._updateVertexBuffers[
        "position"
      ] = this._updateBuffer.createVertexBuffer("position", 0, 3, 3);
      this._updateVertexBuffers["age"] = this._updateBuffer.createVertexBuffer(
        "age",
        3,
        1,
        1
      );
      this._updateVertexBuffers["life"] = this._updateBuffer.createVertexBuffer(
        "life",
        4,
        1,
        1
      );
      this._updateVertexBuffers[
        "velocity"
      ] = this._updateBuffer.createVertexBuffer("velocity", 5, 3, 3);

      this._updateVAO = this._engine.recordVertexArrayObject(
        this._updateVertexBuffers,
        null,
        this._updateEffect
      );
      this._engine.bindArrayBuffer(null);

      // Render VAO
      this._renderBuffer = new Buffer(this._scene.getEngine(), data, false, 0);
      this._renderVertexBuffers[
        "position"
      ] = this._renderBuffer.createVertexBuffer("position", 0, 3, 3);
      this._renderVertexBuffers["age"] = this._renderBuffer.createVertexBuffer(
        "age",
        3,
        1,
        1
      );
      this._renderVertexBuffers["life"] = this._renderBuffer.createVertexBuffer(
        "life",
        4,
        1,
        1
      );
      this._renderVertexBuffers[
        "velocity"
      ] = this._renderBuffer.createVertexBuffer("velocity", 5, 3, 3);

      this._renderVAO = this._engine.recordVertexArrayObject(
        this._renderVertexBuffers,
        null,
        this._renderEffect
      );
      this._engine.bindArrayBuffer(null);

      // Links
      this._sourceVAO = this._updateVAO;
      this._targetVAO = this._renderVAO;

      this._sourceBuffer = this._updateBuffer;
      this._targetBuffer = this._renderBuffer;
    }

    /**
     * Renders the particle system in its current state.
     * @returns the current number of particles.
     */
    public render(): number {
      if (
        !this.emitter ||
        !this._updateEffect.isReady() ||
        !this._renderEffect.isReady()
      ) {
        return 0;
      }

      // Get everything ready to render
      this._initialize();

      if (this._currentRenderId === this._scene.getRenderId()) {
        return 0;
      }

      this._currentRenderId = this._scene.getRenderId();

      // Enable update effect
      this._engine.enableEffect(this._updateEffect);
      this._engine.setState(false);

      // Bind source VAO
      this._engine.bindVertexArrayObject(this._sourceVAO, null);

      // Update
      this._engine.bindTransformFeedbackBuffer(this._targetBuffer.getBuffer());
      this._engine.setRasterizerState(false);
      this._engine.beginTransformFeedback();
      this._engine.drawArraysType(
        Material.PointListDrawMode,
        0,
        this._capacity
      );
      this._engine.endTransformFeedback();
      this._engine.setRasterizerState(true);
      this._engine.bindTransformFeedbackBuffer(null);

      // Enable render effect
      this._engine.enableEffect(this._renderEffect);

      // Bind source VAO
      this._engine.bindVertexArrayObject(this._targetVAO, null);

      // Render
      this._engine.drawArraysType(
        Material.PointListDrawMode,
        0,
        this._capacity
      );

      // Switch VAOs
      let tmpVAO = this._sourceVAO;
      this._sourceVAO = this._targetVAO;
      this._targetVAO = tmpVAO;

      // Switch buffers
      let tmpBuffer = this._sourceBuffer;
      this._sourceBuffer = this._targetBuffer;
      this._targetBuffer = tmpBuffer;

      return 0;
    }

    /**
     * Rebuilds the particle system
     */
    public rebuild(): void {}

    /**
     * Disposes the particle system and free the associated resources.
     */
    public dispose(): void {
      var index = this._scene.particleSystems.indexOf(this);
      if (index > -1) {
        this._scene.particleSystems.splice(index, 1);
      }

      //TODO: this._dataBuffer.dispose();

      // Callback
      this.onDisposeObservable.notifyObservers(this);
      this.onDisposeObservable.clear();
    }

    //TODO: Clone / Parse / serialize

    /**
     * Clones the particle system.
     * @param name The name of the cloned object
     * @param newEmitter The new emitter to use
     * @returns the cloned particle system
     */
    public clone(name: string, newEmitter: any): Nullable<GPUParticleSystem> {
      return null;
    }

    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    public serialize(): any {}
  }
}
