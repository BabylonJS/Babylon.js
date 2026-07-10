/**
 * Generic object pool for reusing instances and reducing garbage collection pressure.
 * Useful for frequently allocated/deallocated objects like Vector3, Matrix4, etc.
 */

/**
 * Configuration for an ObjectPool
 */
export interface ObjectPoolConfig<T> {
    /**
     * Factory function to create new instances
     */
    factory: () => T;
    
    /**
     * Reset function to clear instance state before returning to pool
     */
    reset: (obj: T) => void;
    
    /**
     * Initial pool size (default: 128)
     */
    initialSize?: number;
    
    /**
     * Maximum pool size (default: 1024)
     */
    maxSize?: number;
    
    /**
     * Enable statistics tracking (default: false)
     */
    enableStats?: boolean;
}

/**
 * Statistics for pool performance monitoring
 */
export interface PoolStatistics {
    acquireCount: number;
    releaseCount: number;
    currentPoolSize: number;
    maxReached: number;
}

/**
 * Generic object pool for performance-critical objects.
 * Reduces allocation pressure and GC pauses by reusing objects.
 * 
 * @example
 * const vectorPool = new ObjectPool({
 *   factory: () => new Vector3(),
 *   reset: (v) => v.set(0, 0, 0),
 *   initialSize: 256,
 *   maxSize: 2048
 * });
 * 
 * const vec = vectorPool.acquire();
 * vec.x = 10; // Use it
 * vectorPool.release(vec);
 */
export class ObjectPool<T> {
    private pool: T[];
    private config: Required<ObjectPoolConfig<T>>;
    private stats: PoolStatistics;

    constructor(config: ObjectPoolConfig<T>) {
        this.config = {
            factory: config.factory,
            reset: config.reset,
            initialSize: config.initialSize ?? 128,
            maxSize: config.maxSize ?? 1024,
            enableStats: config.enableStats ?? false,
        };

        this.pool = [];
        this.stats = {
            acquireCount: 0,
            releaseCount: 0,
            currentPoolSize: 0,
            maxReached: 0,
        };

        // Pre-allocate pool with initial size
        for (let i = 0; i < this.config.initialSize; i++) {
            this.pool.push(this.config.factory());
        }
        this.stats.currentPoolSize = this.config.initialSize;
    }

    /**
     * Acquire an object from the pool or create a new one
     */
    acquire(): T {
        let obj: T;
        if (this.pool.length > 0) {
            obj = this.pool.pop()!;
            this.stats.currentPoolSize--;
        } else {
            obj = this.config.factory();
        }

        if (this.config.enableStats) {
            this.stats.acquireCount++;
        }

        return obj;
    }

    /**
     * Release an object back to the pool for reuse
     */
    release(obj: T): void {
        if (this.stats.currentPoolSize < this.config.maxSize) {
            this.config.reset(obj);
            this.pool.push(obj);
            this.stats.currentPoolSize++;

            if (this.config.enableStats) {
                this.stats.releaseCount++;
                this.stats.maxReached = Math.max(this.stats.maxReached, this.stats.currentPoolSize);
            }
        }
    }

    /**
     * Release multiple objects at once
     */
    releaseMany(objects: T[]): void {
        for (const obj of objects) {
            this.release(obj);
        }
    }

    /**
     * Clear all objects from the pool
     */
    clear(): void {
        this.pool.length = 0;
        this.stats.currentPoolSize = 0;
    }

    /**
     * Get current pool statistics
     */
    getStats(): Readonly<PoolStatistics> {
        return Object.freeze({ ...this.stats });
    }

    /**
     * Reset statistics counters
     */
    resetStats(): void {
        this.stats.acquireCount = 0;
        this.stats.releaseCount = 0;
        this.stats.maxReached = 0;
    }

    /**
     * Get current pool size
     */
    get size(): number {
        return this.stats.currentPoolSize;
    }

    /**
     * Get pool capacity
     */
    get capacity(): number {
        return this.config.maxSize;
    }

    /**
     * Check if pool is empty
     */
    get isEmpty(): boolean {
        return this.stats.currentPoolSize === 0;
    }

    /**
     * Check if pool is full
     */
    get isFull(): boolean {
        return this.stats.currentPoolSize >= this.config.maxSize;
    }
}

/**
 * Global pool instances for commonly used math objects
 */
export class GlobalObjectPools {
    private static _vector3Pool: ObjectPool<any>;
    private static _matrix4Pool: ObjectPool<any>;
    private static _quaternionPool: ObjectPool<any>;

    /**
     * Initialize global pools - call once at application startup
     */
    static initialize(Vector3: any, Matrix4: any, Quaternion: any): void {
        this._vector3Pool = new ObjectPool({
            factory: () => new Vector3(),
            reset: (v) => v.set(0, 0, 0),
            initialSize: 256,
            maxSize: 2048,
            enableStats: false,
        });

        this._matrix4Pool = new ObjectPool({
            factory: () => new Matrix4(),
            reset: (m) => Matrix4.Identity(m),
            initialSize: 128,
            maxSize: 1024,
            enableStats: false,
        });

        this._quaternionPool = new ObjectPool({
            factory: () => new Quaternion(),
            reset: (q) => q.set(0, 0, 0, 1),
            initialSize: 128,
            maxSize: 1024,
            enableStats: false,
        });
    }

    static get vector3(): ObjectPool<any> {
        if (!this._vector3Pool) {
            throw new Error("GlobalObjectPools not initialized. Call initialize() first.");
        }
        return this._vector3Pool;
    }

    static get matrix4(): ObjectPool<any> {
        if (!this._matrix4Pool) {
            throw new Error("GlobalObjectPools not initialized. Call initialize() first.");
        }
        return this._matrix4Pool;
    }

    static get quaternion(): ObjectPool<any> {
        if (!this._quaternionPool) {
            throw new Error("GlobalObjectPools not initialized. Call initialize() first.");
        }
        return this._quaternionPool;
    }

    /**
     * Get statistics from all pools
     */
    static getGlobalStats(): Record<string, PoolStatistics> {
        return {
            vector3: this._vector3Pool?.getStats() || { acquireCount: 0, releaseCount: 0, currentPoolSize: 0, maxReached: 0 },
            matrix4: this._matrix4Pool?.getStats() || { acquireCount: 0, releaseCount: 0, currentPoolSize: 0, maxReached: 0 },
            quaternion: this._quaternionPool?.getStats() || { acquireCount: 0, releaseCount: 0, currentPoolSize: 0, maxReached: 0 },
        };
    }

    /**
     * Clear all global pools
     */
    static clearAll(): void {
        this._vector3Pool?.clear();
        this._matrix4Pool?.clear();
        this._quaternionPool?.clear();
    }
}
