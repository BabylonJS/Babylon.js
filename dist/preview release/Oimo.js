(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.OIMO = global.OIMO || {})));
}(this, (function (exports) { 'use strict';

	// Polyfills

	if ( Number.EPSILON === undefined ) {

		Number.EPSILON = Math.pow( 2, - 52 );

	}

	//

	if ( Math.sign === undefined ) {

		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign

		Math.sign = function ( x ) {

			return ( x < 0 ) ? - 1 : ( x > 0 ) ? 1 : + x;

		};

	}

	if ( Function.prototype.name === undefined ) {

		// Missing in IE9-11.
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name

		Object.defineProperty( Function.prototype, 'name', {

			get: function () {

				return this.toString().match( /^\s*function\s*([^\(\s]*)/ )[ 1 ];

			}

		} );

	}

	if ( Object.assign === undefined ) {

		// Missing in IE.
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

		( function () {

			Object.assign = function ( target ) {

				'use strict';

				if ( target === undefined || target === null ) {

					throw new TypeError( 'Cannot convert undefined or null to object' );

				}

				var output = Object( target );

				for ( var index = 1; index < arguments.length; index ++ ) {

					var source = arguments[ index ];

					if ( source !== undefined && source !== null ) {

						for ( var nextKey in source ) {

							if ( Object.prototype.hasOwnProperty.call( source, nextKey ) ) {

								output[ nextKey ] = source[ nextKey ];

							}

						}

					}

				}

				return output;

			};

		} )();

	}

	/*
	 * A list of constants built-in for
	 * the physics engine.
	 */

	var REVISION = '1.0.9';

	// BroadPhase
	var BR_NULL = 0;
	var BR_BRUTE_FORCE = 1;
	var BR_SWEEP_AND_PRUNE = 2;
	var BR_BOUNDING_VOLUME_TREE = 3;

	// Body type
	var BODY_NULL = 0;
	var BODY_DYNAMIC = 1;
	var BODY_STATIC = 2;
	var BODY_KINEMATIC = 3;
	var BODY_GHOST = 4;

	// Shape type
	var SHAPE_NULL = 0;
	var SHAPE_SPHERE = 1;
	var SHAPE_BOX = 2;
	var SHAPE_CYLINDER = 3;
	var SHAPE_PLANE = 4;
	var SHAPE_PARTICLE = 5;
	var SHAPE_TETRA = 6;

	// Joint type
	var JOINT_NULL = 0;
	var JOINT_DISTANCE = 1;
	var JOINT_BALL_AND_SOCKET = 2;
	var JOINT_HINGE = 3;
	var JOINT_WHEEL = 4;
	var JOINT_SLIDER = 5;
	var JOINT_PRISMATIC = 6;

	// AABB aproximation
	var AABB_PROX = 0.005;

	var _Math = {

	    sqrt   : Math.sqrt,
	    abs    : Math.abs,
	    floor  : Math.floor,
	    cos    : Math.cos,
	    sin    : Math.sin,
	    acos   : Math.acos,
	    asin   : Math.asin,
	    atan2  : Math.atan2,
	    round  : Math.round,
	    pow    : Math.pow,
	    max    : Math.max,
	    min    : Math.min,
	    random : Math.random,

	    degtorad : 0.0174532925199432957,
	    radtodeg : 57.295779513082320876,
	    PI       : 3.141592653589793,
	    TwoPI    : 6.283185307179586,
	    PI90     : 1.570796326794896,
	    PI270    : 4.712388980384689,

	    INF      : Infinity,
	    EPZ      : 0.00001,
	    EPZ2      : 0.000001,

	    lerp: function ( x, y, t ) { 

	        return ( 1 - t ) * x + t * y; 

	    },

	    randInt: function ( low, high ) { 

	        return low + _Math.floor( _Math.random() * ( high - low + 1 ) ); 

	    },

	    rand: function ( low, high ) { 

	        return low + _Math.random() * ( high - low ); 

	    },
	    
	    generateUUID: function () {

	        // http://www.broofa.com/Tools/Math.uuid.htm

	        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split( '' );
	        var uuid = new Array( 36 );
	        var rnd = 0, r;

	        return function generateUUID() {

	            for ( var i = 0; i < 36; i ++ ) {

	                if ( i === 8 || i === 13 || i === 18 || i === 23 ) {

	                    uuid[ i ] = '-';

	                } else if ( i === 14 ) {

	                    uuid[ i ] = '4';

	                } else {

	                    if ( rnd <= 0x02 ) rnd = 0x2000000 + ( Math.random() * 0x1000000 ) | 0;
	                    r = rnd & 0xf;
	                    rnd = rnd >> 4;
	                    uuid[ i ] = chars[ ( i === 19 ) ? ( r & 0x3 ) | 0x8 : r ];

	                }

	            }

	            return uuid.join( '' );

	        };

	    }(),

	    int: function( x ) { 

	        return _Math.floor(x); 

	    },

	    fix: function( x, n ) { 

	        return x.toFixed(n || 3, 10); 

	    },

	    clamp: function ( value, min, max ) { 

	        return _Math.max( min, _Math.min( max, value ) ); 

	    },
	    
	    //clamp: function ( x, a, b ) { return ( x < a ) ? a : ( ( x > b ) ? b : x ); },

	    

	    distance: function( p1, p2 ){

	        var xd = p2[0]-p1[0];
	        var yd = p2[1]-p1[1];
	        var zd = p2[2]-p1[2];
	        return _Math.sqrt(xd*xd + yd*yd + zd*zd);

	    },

	    /*unwrapDegrees: function ( r ) {

	        r = r % 360;
	        if (r > 180) r -= 360;
	        if (r < -180) r += 360;
	        return r;

	    },

	    unwrapRadian: function( r ){

	        r = r % _Math.TwoPI;
	        if (r > _Math.PI) r -= _Math.TwoPI;
	        if (r < -_Math.PI) r += _Math.TwoPI;
	        return r;

	    },*/

	    acosClamp: function ( cos ) {

	        if(cos>1)return 0;
	        else if(cos<-1)return _Math.PI;
	        else return _Math.acos(cos);

	    },

	    distanceVector: function( v1, v2 ){

	        var xd = v1.x - v2.x;
	        var yd = v1.y - v2.y;
	        var zd = v1.z - v2.z;
	        return xd * xd + yd * yd + zd * zd;

	    },

	    dotVectors: function ( a, b ) {

	        return a.x * b.x + a.y * b.y + a.z * b.z;

	    },

	};

	function printError( clazz, msg ){
	    console.error("[OIMO] " + clazz + ": " + msg);
	}

	// A performance evaluator

	function InfoDisplay(world){

	    this.parent = world;

	    this.infos = new Float32Array( 13 );
	    this.f = [0,0,0];

	    this.times = [0,0,0,0];

	    this.broadPhase = this.parent.broadPhaseType;

	    this.version = REVISION;

	    this.fps = 0;

	    this.tt = 0;

	    this.broadPhaseTime = 0;
	    this.narrowPhaseTime = 0;
	    this.solvingTime = 0;
	    this.totalTime = 0;
	    this.updateTime = 0;

	    this.MaxBroadPhaseTime = 0;
	    this.MaxNarrowPhaseTime = 0;
	    this.MaxSolvingTime = 0;
	    this.MaxTotalTime = 0;
	    this.MaxUpdateTime = 0;
	}

	Object.assign( InfoDisplay.prototype, {

	    setTime: function(n){
	        this.times[ n || 0 ] = performance.now();
	    },

	    resetMax: function(){

	        this.MaxBroadPhaseTime = 0;
	        this.MaxNarrowPhaseTime = 0;
	        this.MaxSolvingTime = 0;
	        this.MaxTotalTime = 0;
	        this.MaxUpdateTime = 0;

	    },

	    calcBroadPhase: function () {

	        this.setTime( 2 );
	        this.broadPhaseTime = this.times[ 2 ] - this.times[ 1 ];

	    },

	    calcNarrowPhase: function () {

	        this.setTime( 3 );
	        this.narrowPhaseTime = this.times[ 3 ] - this.times[ 2 ];

	    },

	    calcEnd: function () {

	        this.setTime( 2 );
	        this.solvingTime = this.times[ 2 ] - this.times[ 1 ];
	        this.totalTime = this.times[ 2 ] - this.times[ 0 ];
	        this.updateTime = this.totalTime - ( this.broadPhaseTime + this.narrowPhaseTime + this.solvingTime );

	        if( this.tt === 100 ) this.resetMax();

	        if( this.tt > 100 ){
	            if( this.broadPhaseTime > this.MaxBroadPhaseTime ) this.MaxBroadPhaseTime = this.broadPhaseTime;
	            if( this.narrowPhaseTime > this.MaxNarrowPhaseTime ) this.MaxNarrowPhaseTime = this.narrowPhaseTime;
	            if( this.solvingTime > this.MaxSolvingTime ) this.MaxSolvingTime = this.solvingTime;
	            if( this.totalTime > this.MaxTotalTime ) this.MaxTotalTime = this.totalTime;
	            if( this.updateTime > this.MaxUpdateTime ) this.MaxUpdateTime = this.updateTime;
	        }


	        this.upfps();

	        this.tt ++;
	        if(this.tt > 500) this.tt = 0;

	    },


	    upfps : function(){
	        this.f[1] = Date.now();
	        if (this.f[1]-1000>this.f[0]){ this.f[0] = this.f[1]; this.fps = this.f[2]; this.f[2] = 0; } this.f[2]++;
	    },

	    show: function(){
	        var info =[
	            "Oimo.js "+this.version+"<br>",
	            this.broadPhase + "<br><br>",
	            "FPS: " + this.fps +" fps<br><br>",
	            "rigidbody "+this.parent.numRigidBodies+"<br>",
	            "contact &nbsp;&nbsp;"+this.parent.numContacts+"<br>",
	            "ct-point &nbsp;"+this.parent.numContactPoints+"<br>",
	            "paircheck "+this.parent.broadPhase.numPairChecks+"<br>",
	            "island &nbsp;&nbsp;&nbsp;"+this.parent.numIslands +"<br><br>",
	            "Time in milliseconds<br><br>",
	            "broadphase &nbsp;"+ _Math.fix(this.broadPhaseTime) + " | " + _Math.fix(this.MaxBroadPhaseTime) +"<br>",
	            "narrowphase "+ _Math.fix(this.narrowPhaseTime)  + " | " + _Math.fix(this.MaxNarrowPhaseTime) + "<br>",
	            "solving &nbsp;&nbsp;&nbsp;&nbsp;"+ _Math.fix(this.solvingTime)+ " | " + _Math.fix(this.MaxSolvingTime) + "<br>",
	            "total &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+ _Math.fix(this.totalTime) + " | " + _Math.fix(this.MaxTotalTime) + "<br>",
	            "updating &nbsp;&nbsp;&nbsp;"+ _Math.fix(this.updateTime) + " | " + _Math.fix(this.MaxUpdateTime) + "<br>"
	        ].join("\n");
	        return info;
	    },

	    toArray: function(){
	        this.infos[0] = this.parent.broadPhase.types;
	        this.infos[1] = this.parent.numRigidBodies;
	        this.infos[2] = this.parent.numContacts;
	        this.infos[3] = this.parent.broadPhase.numPairChecks;
	        this.infos[4] = this.parent.numContactPoints;
	        this.infos[5] = this.parent.numIslands;
	        this.infos[6] = this.broadPhaseTime;
	        this.infos[7] = this.narrowPhaseTime;
	        this.infos[8] = this.solvingTime;
	        this.infos[9] = this.updateTime;
	        this.infos[10] = this.totalTime;
	        this.infos[11] = this.fps;
	        return this.infos;
	    }
	    
	});

	function Vec3 ( x, y, z ) {

	    this.x = x || 0;
	    this.y = y || 0;
	    this.z = z || 0;
	    
	}

	Object.assign( Vec3.prototype, {

	    Vec3: true,

	    set: function( x, y, z ){

	        this.x = x;
	        this.y = y;
	        this.z = z;
	        return this;

	    },

	    add: function ( a, b ) {

	        if ( b !== undefined ) return this.addVectors( a, b );

	        this.x += a.x;
	        this.y += a.y;
	        this.z += a.z;
	        return this;

	    },

	    addVectors: function ( a, b ) {

	        this.x = a.x + b.x;
	        this.y = a.y + b.y;
	        this.z = a.z + b.z;
	        return this;

	    },

	    addEqual: function ( v ) {

	        this.x += v.x;
	        this.y += v.y;
	        this.z += v.z;
	        return this;

	    },

	    sub: function ( a, b ) {

	        if ( b !== undefined ) return this.subVectors( a, b );

	        this.x -= a.x;
	        this.y -= a.y;
	        this.z -= a.z;
	        return this;

	    },

	    subVectors: function ( a, b ) {

	        this.x = a.x - b.x;
	        this.y = a.y - b.y;
	        this.z = a.z - b.z;
	        return this;

	    },

	    subEqual: function ( v ) {

	        this.x -= v.x;
	        this.y -= v.y;
	        this.z -= v.z;
	        return this;

	    },

	    scale: function ( v, s ) {

	        this.x = v.x * s;
	        this.y = v.y * s;
	        this.z = v.z * s;
	        return this;

	    },

	    scaleEqual: function( s ){

	        this.x *= s;
	        this.y *= s;
	        this.z *= s;
	        return this;

	    },

	    multiply: function( v ){

	        this.x *= v.x;
	        this.y *= v.y;
	        this.z *= v.z;
	        return this;

	    },

	    multiplyScalar: function( s ){

	        this.x *= s;
	        this.y *= s;
	        this.z *= s;
	        return this;

	    },

	    /*scaleV: function( v ){

	        this.x *= v.x;
	        this.y *= v.y;
	        this.z *= v.z;
	        return this;

	    },

	    scaleVectorEqual: function( v ){

	        this.x *= v.x;
	        this.y *= v.y;
	        this.z *= v.z;
	        return this;

	    },*/

	    addScaledVector: function ( v, s ) {

	        this.x += v.x * s;
	        this.y += v.y * s;
	        this.z += v.z * s;

	        return this;

	    },

	    subScaledVector: function ( v, s ) {

	        this.x -= v.x * s;
	        this.y -= v.y * s;
	        this.z -= v.z * s;

	        return this;

	    },

	    /*addTime: function ( v, t ) {

	        this.x += v.x * t;
	        this.y += v.y * t;
	        this.z += v.z * t;
	        return this;

	    },
	    
	    addScale: function ( v, s ) {

	        this.x += v.x * s;
	        this.y += v.y * s;
	        this.z += v.z * s;
	        return this;

	    },

	    subScale: function ( v, s ) {

	        this.x -= v.x * s;
	        this.y -= v.y * s;
	        this.z -= v.z * s;
	        return this;

	    },*/
	   
	    cross: function( a, b ) {

	        if ( b !== undefined ) return this.crossVectors( a, b );

	        var x = this.x, y = this.y, z = this.z;

	        this.x = y * a.z - z * a.y;
	        this.y = z * a.x - x * a.z;
	        this.z = x * a.y - y * a.x;

	        return this;

	    },

	    crossVectors: function ( a, b ) {

	        var ax = a.x, ay = a.y, az = a.z;
	        var bx = b.x, by = b.y, bz = b.z;

	        this.x = ay * bz - az * by;
	        this.y = az * bx - ax * bz;
	        this.z = ax * by - ay * bx;

	        return this;

	    },

	    tangent: function ( a ) {

	        var ax = a.x, ay = a.y, az = a.z;

	        this.x = ay * ax - az * az;
	        this.y = - az * ay - ax * ax;
	        this.z = ax * az + ay * ay;

	        return this;

	    },

	    

	    

	    invert: function ( v ) {

	        this.x=-v.x;
	        this.y=-v.y;
	        this.z=-v.z;
	        return this;

	    },

	    negate: function () {

	        this.x = - this.x;
	        this.y = - this.y;
	        this.z = - this.z;

	        return this;

	    },

	    dot: function ( v ) {

	        return this.x * v.x + this.y * v.y + this.z * v.z;

	    },

	    addition: function () {

	        return this.x + this.y + this.z;

	    },

	    lengthSq: function () {

	        return this.x * this.x + this.y * this.y + this.z * this.z;

	    },

	    length: function () {

	        return _Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

	    },

	    copy: function( v ){

	        this.x = v.x;
	        this.y = v.y;
	        this.z = v.z;
	        return this;

	    },

	    /*mul: function( b, a, m ){

	        return this.mulMat( m, a ).add( b );

	    },

	    mulMat: function( m, a ){

	        var e = m.elements;
	        var x = a.x, y = a.y, z = a.z;

	        this.x = e[ 0 ] * x + e[ 1 ] * y + e[ 2 ] * z;
	        this.y = e[ 3 ] * x + e[ 4 ] * y + e[ 5 ] * z;
	        this.z = e[ 6 ] * x + e[ 7 ] * y + e[ 8 ] * z;
	        return this;

	    },*/

	    applyMatrix3: function ( m, transpose ) {

	        //if( transpose ) m = m.clone().transpose();
	        var x = this.x, y = this.y, z = this.z;
	        var e = m.elements;

	        if( transpose ){
	            
	            this.x = e[ 0 ] * x + e[ 1 ] * y + e[ 2 ] * z;
	            this.y = e[ 3 ] * x + e[ 4 ] * y + e[ 5 ] * z;
	            this.z = e[ 6 ] * x + e[ 7 ] * y + e[ 8 ] * z;

	        } else {
	      
	            this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
	            this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
	            this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;
	        }

	        return this;

	    },

	    applyQuaternion: function ( q ) {

	        var x = this.x;
	        var y = this.y;
	        var z = this.z;

	        var qx = q.x;
	        var qy = q.y;
	        var qz = q.z;
	        var qw = q.w;

	        // calculate quat * vector

	        var ix =  qw * x + qy * z - qz * y;
	        var iy =  qw * y + qz * x - qx * z;
	        var iz =  qw * z + qx * y - qy * x;
	        var iw = - qx * x - qy * y - qz * z;

	        // calculate result * inverse quat

	        this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
	        this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
	        this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

	        return this;

	    },

	    testZero: function () {

	        if(this.x!==0 || this.y!==0 || this.z!==0) return true;
	        else return false;

	    },

	    testDiff: function( v ){

	        return this.equals( v ) ? false : true;

	    },

	    equals: function ( v ) {

	        return v.x === this.x && v.y === this.y && v.z === this.z;

	    },

	    clone: function () {

	        return new this.constructor( this.x, this.y, this.z );

	    },

	    toString: function(){

	        return"Vec3["+this.x.toFixed(4)+", "+this.y.toFixed(4)+", "+this.z.toFixed(4)+"]";
	        
	    },

	    multiplyScalar: function ( scalar ) {

	        if ( isFinite( scalar ) ) {
	            this.x *= scalar;
	            this.y *= scalar;
	            this.z *= scalar;
	        } else {
	            this.x = 0;
	            this.y = 0;
	            this.z = 0;
	        }

	        return this;

	    },

	    divideScalar: function ( scalar ) {

	        return this.multiplyScalar( 1 / scalar );

	    },

	    normalize: function () {

	        return this.divideScalar( this.length() );

	    },

	    toArray: function ( array, offset ) {

	        if ( offset === undefined ) offset = 0;

	        array[ offset ] = this.x;
	        array[ offset + 1 ] = this.y;
	        array[ offset + 2 ] = this.z;

	    },

	    fromArray: function( array, offset ){

	        if ( offset === undefined ) offset = 0;
	        
	        this.x = array[ offset ];
	        this.y = array[ offset + 1 ];
	        this.z = array[ offset + 2 ];
	        return this;

	    },


	} );

	function Quat ( x, y, z, w ){

	    this.x = x || 0;
	    this.y = y || 0;
	    this.z = z || 0;
	    this.w = ( w !== undefined ) ? w : 1;

	}

	Object.assign( Quat.prototype, {

	    Quat: true,

	    set: function ( x, y, z, w ) {

	        
	        this.x = x;
	        this.y = y;
	        this.z = z;
	        this.w = w;

	        return this;

	    },

	    addTime: function( v, t ){

	        var ax = v.x, ay = v.y, az = v.z;
	        var qw = this.w, qx = this.x, qy = this.y, qz = this.z;
	        t *= 0.5;    
	        this.x += t * (  ax*qw + ay*qz - az*qy );
	        this.y += t * (  ay*qw + az*qx - ax*qz );
	        this.z += t * (  az*qw + ax*qy - ay*qx );
	        this.w += t * ( -ax*qx - ay*qy - az*qz );
	        this.normalize();
	        return this;

	    },

	    /*mul: function( q1, q2 ){

	        var ax = q1.x, ay = q1.y, az = q1.z, as = q1.w,
	        bx = q2.x, by = q2.y, bz = q2.z, bs = q2.w;
	        this.x = ax * bs + as * bx + ay * bz - az * by;
	        this.y = ay * bs + as * by + az * bx - ax * bz;
	        this.z = az * bs + as * bz + ax * by - ay * bx;
	        this.w = as * bs - ax * bx - ay * by - az * bz;
	        return this;

	    },*/

	    multiply: function ( q, p ) {

	        if ( p !== undefined ) return this.multiplyQuaternions( q, p );
	        return this.multiplyQuaternions( this, q );

	    },

	    multiplyQuaternions: function ( a, b ) {

	        var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
	        var qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

	        this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
	        this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
	        this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
	        this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
	        return this;

	    },

	    setFromUnitVectors: function( v1, v2 ) {

	        var vx = new Vec3();
	        var r = v1.dot( v2 ) + 1;

	        if ( r < _Math.EPS2 ) {

	            r = 0;
	            if ( _Math.abs( v1.x ) > _Math.abs( v1.z ) ) vx.set( - v1.y, v1.x, 0 );
	            else vx.set( 0, - v1.z, v1.y );

	        } else {

	            vx.crossVectors( v1, v2 );

	        }

	        this._x = vx.x;
	        this._y = vx.y;
	        this._z = vx.z;
	        this._w = r;

	        return this.normalize();

	    },

	    arc: function( v1, v2 ){

	        var x1 = v1.x;
	        var y1 = v1.y;
	        var z1 = v1.z;
	        var x2 = v2.x;
	        var y2 = v2.y;
	        var z2 = v2.z;
	        var d = x1*x2 + y1*y2 + z1*z2;
	        if( d==-1 ){
	            x2 = y1*x1 - z1*z1;
	            y2 = -z1*y1 - x1*x1;
	            z2 = x1*z1 + y1*y1;
	            d = 1 / _Math.sqrt( x2*x2 + y2*y2 + z2*z2 );
	            this.w = 0;
	            this.x = x2*d;
	            this.y = y2*d;
	            this.z = z2*d;
	            return this;
	        }
	        var cx = y1*z2 - z1*y2;
	        var cy = z1*x2 - x1*z2;
	        var cz = x1*y2 - y1*x2;
	        this.w = _Math.sqrt( ( 1 + d) * 0.5 );
	        d = 0.5 / this.w;
	        this.x = cx * d;
	        this.y = cy * d;
	        this.z = cz * d;
	        return this;

	    },

	    normalize: function(){

	        var l = this.length();
	        if ( l === 0 ) {
	            this.set( 0, 0, 0, 1 );
	        } else {
	            l = 1 / l;
	            this.x = this.x * l;
	            this.y = this.y * l;
	            this.z = this.z * l;
	            this.w = this.w * l;
	        }
	        return this;

	    },

	    inverse: function () {

	        return this.conjugate().normalize();

	    },

	    invert: function ( q ) {

	        this.x = q.x;
	        this.y = q.y;
	        this.z = q.z;
	        this.w = q.w;
	        this.conjugate().normalize();
	        return this;

	    },

	    conjugate: function () {

	        this.x *= - 1;
	        this.y *= - 1;
	        this.z *= - 1;
	        return this;

	    },

	    length: function(){

	        return _Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w  );

	    },

	    lengthSq: function () {

	        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;

	    },
	    
	    copy: function( q ){
	        
	        this.x = q.x;
	        this.y = q.y;
	        this.z = q.z;
	        this.w = q.w;
	        return this;

	    },

	    clone: function( q ){

	        return new Quat( this.x, this.y, this.z, this.w );

	    },

	    testDiff: function ( q ) {

	        return this.equals( q ) ? false : true;

	    },

	    equals: function ( q ) {

	        return this.x === q.x && this.y === q.y && this.z === q.z && this.w === q.w;

	    },

	    toString: function(){

	        return"Quat["+this.x.toFixed(4)+", ("+this.y.toFixed(4)+", "+this.z.toFixed(4)+", "+this.w.toFixed(4)+")]";
	        
	    },

	    setFromEuler: function ( x, y, z ){

	        var c1 = Math.cos( x * 0.5 );
	        var c2 = Math.cos( y * 0.5 );
	        var c3 = Math.cos( z * 0.5 );
	        var s1 = Math.sin( x * 0.5 );
	        var s2 = Math.sin( y * 0.5 );
	        var s3 = Math.sin( z * 0.5 );

	        // XYZ
	        this.x = s1 * c2 * c3 + c1 * s2 * s3;
	        this.y = c1 * s2 * c3 - s1 * c2 * s3;
	        this.z = c1 * c2 * s3 + s1 * s2 * c3;
	        this.w = c1 * c2 * c3 - s1 * s2 * s3;

	        return this;

	    },
	    
	    setFromAxis: function ( axis, rad ) {

	        axis.normalize();
	        rad = rad * 0.5;
	        var s = _Math.sin( rad );
	        this.x = s * axis.x;
	        this.y = s * axis.y;
	        this.z = s * axis.z;
	        this.w = _Math.cos( rad );
	        return this;

	    },

	    setFromMat33: function ( m ) {

	        var trace = m[0] + m[4] + m[8];
	        var s;

	        if ( trace > 0 ) {

	            s = _Math.sqrt( trace + 1.0 );
	            this.w = 0.5 / s;
	            s = 0.5 / s;
	            this.x = ( m[5] - m[7] ) * s;
	            this.y = ( m[6] - m[2] ) * s;
	            this.z = ( m[1] - m[3] ) * s;

	        } else {

	            var out = [];
	            var i = 0;
	            if ( m[4] > m[0] ) i = 1;
	            if ( m[8] > m[i*3+i] ) i = 2;

	            var j = (i+1)%3;
	            var k = (i+2)%3;
	            
	            s = _Math.sqrt( m[i*3+i] - m[j*3+j] - m[k*3+k] + 1.0 );
	            out[i] = 0.5 * fRoot;
	            s = 0.5 / fRoot;
	            this.w = ( m[j*3+k] - m[k*3+j] ) * s;
	            out[j] = ( m[j*3+i] + m[i*3+j] ) * s;
	            out[k] = ( m[k*3+i] + m[i*3+k] ) * s;

	            this.x = out[1];
	            this.y = out[2];
	            this.z = out[3];

	        }

	        return this;

	    },

	    toArray: function ( array, offset ) {

	        offset = offset || 0;

	        array[ offset ] = this.x;
	        array[ offset + 1 ] = this.y;
	        array[ offset + 2 ] = this.z;
	        array[ offset + 3 ] = this.w;

	    },

	    fromArray: function( array, offset ){

	        offset = offset || 0;
	        this.set( array[ offset ], array[ offset + 1 ], array[ offset + 2 ], array[ offset + 3 ] );
	        return this;

	    }

	});

	function Mat33 ( e00, e01, e02, e10, e11, e12, e20, e21, e22 ){

	    this.elements = [
	        1, 0, 0,
	        0, 1, 0,
	        0, 0, 1
	    ];

	    if ( arguments.length > 0 ) {

	        console.error( 'OIMO.Mat33: the constructor no longer reads arguments. use .set() instead.' );

	    }

	}

	Object.assign( Mat33.prototype, {

	    Mat33: true,

	    set: function ( e00, e01, e02, e10, e11, e12, e20, e21, e22 ){

	        var te = this.elements;
	        te[0] = e00; te[1] = e01; te[2] = e02;
	        te[3] = e10; te[4] = e11; te[5] = e12;
	        te[6] = e20; te[7] = e21; te[8] = e22;
	        return this;

	    },
	    
	    add: function ( a, b ) {

	        if( b !== undefined ) return this.addMatrixs( a, b );

	        var e = this.elements, te = a.elements;
	        e[0] += te[0]; e[1] += te[1]; e[2] += te[2];
	        e[3] += te[3]; e[4] += te[4]; e[5] += te[5];
	        e[6] += te[6]; e[7] += te[7]; e[8] += te[8];
	        return this;

	    },

	    addMatrixs: function ( a, b ) {

	        var te = this.elements, tem1 = a.elements, tem2 = b.elements;
	        te[0] = tem1[0] + tem2[0]; te[1] = tem1[1] + tem2[1]; te[2] = tem1[2] + tem2[2];
	        te[3] = tem1[3] + tem2[3]; te[4] = tem1[4] + tem2[4]; te[5] = tem1[5] + tem2[5];
	        te[6] = tem1[6] + tem2[6]; te[7] = tem1[7] + tem2[7]; te[8] = tem1[8] + tem2[8];
	        return this;

	    },

	    addEqual: function( m ){

	        var te = this.elements, tem = m.elements;
	        te[0] += tem[0]; te[1] += tem[1]; te[2] += tem[2];
	        te[3] += tem[3]; te[4] += tem[4]; te[5] += tem[5];
	        te[6] += tem[6]; te[7] += tem[7]; te[8] += tem[8];
	        return this;

	    },

	    sub: function ( a, b ) {

	        if( b !== undefined ) return this.subMatrixs( a, b );

	        var e = this.elements, te = a.elements;
	        e[0] -= te[0]; e[1] -= te[1]; e[2] -= te[2];
	        e[3] -= te[3]; e[4] -= te[4]; e[5] -= te[5];
	        e[6] -= te[6]; e[7] -= te[7]; e[8] -= te[8];
	        return this;

	    },

	    subMatrixs: function ( a, b ) {

	        var te = this.elements, tem1 = a.elements, tem2 = b.elements;
	        te[0] = tem1[0] - tem2[0]; te[1] = tem1[1] - tem2[1]; te[2] = tem1[2] - tem2[2];
	        te[3] = tem1[3] - tem2[3]; te[4] = tem1[4] - tem2[4]; te[5] = tem1[5] - tem2[5];
	        te[6] = tem1[6] - tem2[6]; te[7] = tem1[7] - tem2[7]; te[8] = tem1[8] - tem2[8];
	        return this;

	    },

	    subEqual: function ( m ) {

	        var te = this.elements, tem = m.elements;
	        te[0] -= tem[0]; te[1] -= tem[1]; te[2] -= tem[2];
	        te[3] -= tem[3]; te[4] -= tem[4]; te[5] -= tem[5];
	        te[6] -= tem[6]; te[7] -= tem[7]; te[8] -= tem[8];
	        return this;

	    },

	    scale: function ( m, s ) {

	        var te = this.elements, tm = m.elements;
	        te[0] = tm[0] * s; te[1] = tm[1] * s; te[2] = tm[2] * s;
	        te[3] = tm[3] * s; te[4] = tm[4] * s; te[5] = tm[5] * s;
	        te[6] = tm[6] * s; te[7] = tm[7] * s; te[8] = tm[8] * s;
	        return this;

	    },

	    scaleEqual: function ( s ){// multiplyScalar

	        var te = this.elements;
	        te[0] *= s; te[1] *= s; te[2] *= s;
	        te[3] *= s; te[4] *= s; te[5] *= s;
	        te[6] *= s; te[7] *= s; te[8] *= s;
	        return this;

	    },

	    multiplyMatrices: function ( m1, m2, transpose ) {

	        if( transpose ) m2 = m2.clone().transpose();

	        var te = this.elements;
	        var tm1 = m1.elements;
	        var tm2 = m2.elements;

	        var a0 = tm1[0], a3 = tm1[3], a6 = tm1[6];
	        var a1 = tm1[1], a4 = tm1[4], a7 = tm1[7];
	        var a2 = tm1[2], a5 = tm1[5], a8 = tm1[8];

	        var b0 = tm2[0], b3 = tm2[3], b6 = tm2[6];
	        var b1 = tm2[1], b4 = tm2[4], b7 = tm2[7];
	        var b2 = tm2[2], b5 = tm2[5], b8 = tm2[8];

	        te[0] = a0*b0 + a1*b3 + a2*b6;
	        te[1] = a0*b1 + a1*b4 + a2*b7;
	        te[2] = a0*b2 + a1*b5 + a2*b8;
	        te[3] = a3*b0 + a4*b3 + a5*b6;
	        te[4] = a3*b1 + a4*b4 + a5*b7;
	        te[5] = a3*b2 + a4*b5 + a5*b8;
	        te[6] = a6*b0 + a7*b3 + a8*b6;
	        te[7] = a6*b1 + a7*b4 + a8*b7;
	        te[8] = a6*b2 + a7*b5 + a8*b8;

	        return this;

	    },

	    /*mul: function ( m1, m2, transpose ) {

	        if( transpose ) m2 = m2.clone().transpose();

	        var te = this.elements;
	        var tm1 = m1.elements;
	        var tm2 = m2.elements;
	        //var tmp;

	        var a0 = tm1[0], a3 = tm1[3], a6 = tm1[6];
	        var a1 = tm1[1], a4 = tm1[4], a7 = tm1[7];
	        var a2 = tm1[2], a5 = tm1[5], a8 = tm1[8];

	        var b0 = tm2[0], b3 = tm2[3], b6 = tm2[6];
	        var b1 = tm2[1], b4 = tm2[4], b7 = tm2[7];
	        var b2 = tm2[2], b5 = tm2[5], b8 = tm2[8];

	        /*if( transpose ){

	            tmp = b1; b1 = b3; b3 = tmp;
	            tmp = b2; b2 = b6; b6 = tmp;
	            tmp = b5; b5 = b7; b7 = tmp;

	        }

	        te[0] = a0*b0 + a1*b3 + a2*b6;
	        te[1] = a0*b1 + a1*b4 + a2*b7;
	        te[2] = a0*b2 + a1*b5 + a2*b8;
	        te[3] = a3*b0 + a4*b3 + a5*b6;
	        te[4] = a3*b1 + a4*b4 + a5*b7;
	        te[5] = a3*b2 + a4*b5 + a5*b8;
	        te[6] = a6*b0 + a7*b3 + a8*b6;
	        te[7] = a6*b1 + a7*b4 + a8*b7;
	        te[8] = a6*b2 + a7*b5 + a8*b8;

	        return this;

	    },*/

	    transpose: function ( m ) {
	        
	        if( m !== undefined ){
	            var a = m.elements;
	            this.set( a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8] );
	            return this;
	        }

	        var te = this.elements;
	        var a01 = te[1], a02 = te[2], a12 = te[5];
	        te[1] = te[3];
	        te[2] = te[6];
	        te[3] = a01;
	        te[5] = te[7];
	        te[6] = a02;
	        te[7] = a12;
	        return this;

	    },



	    /*mulScale: function ( m, sx, sy, sz, Prepend ) {

	        var prepend = Prepend || false;
	        var te = this.elements, tm = m.elements;
	        if(prepend){
	            te[0] = sx*tm[0]; te[1] = sx*tm[1]; te[2] = sx*tm[2];
	            te[3] = sy*tm[3]; te[4] = sy*tm[4]; te[5] = sy*tm[5];
	            te[6] = sz*tm[6]; te[7] = sz*tm[7]; te[8] = sz*tm[8];
	        }else{
	            te[0] = tm[0]*sx; te[1] = tm[1]*sy; te[2] = tm[2]*sz;
	            te[3] = tm[3]*sx; te[4] = tm[4]*sy; te[5] = tm[5]*sz;
	            te[6] = tm[6]*sx; te[7] = tm[7]*sy; te[8] = tm[8]*sz;
	        }
	        return this;

	    },

	    transpose: function ( m ) {

	        var te = this.elements, tm = m.elements;
	        te[0] = tm[0]; te[1] = tm[3]; te[2] = tm[6];
	        te[3] = tm[1]; te[4] = tm[4]; te[5] = tm[7];
	        te[6] = tm[2]; te[7] = tm[5]; te[8] = tm[8];
	        return this;

	    },*/

	    setQuat: function ( q ) {

	        var te = this.elements;
	        var x = q.x, y = q.y, z = q.z, w = q.w;
	        var x2 = x + x,  y2 = y + y, z2 = z + z;
	        var xx = x * x2, xy = x * y2, xz = x * z2;
	        var yy = y * y2, yz = y * z2, zz = z * z2;
	        var wx = w * x2, wy = w * y2, wz = w * z2;
	        
	        te[0] = 1 - ( yy + zz );
	        te[1] = xy - wz;
	        te[2] = xz + wy;

	        te[3] = xy + wz;
	        te[4] = 1 - ( xx + zz );
	        te[5] = yz - wx;

	        te[6] = xz - wy;
	        te[7] = yz + wx;
	        te[8] = 1 - ( xx + yy );

	        return this;

	    },

	    invert: function( m ) {

	        var te = this.elements, tm = m.elements,
	        a00 = tm[0], a10 = tm[3], a20 = tm[6],
	        a01 = tm[1], a11 = tm[4], a21 = tm[7],
	        a02 = tm[2], a12 = tm[5], a22 = tm[8],
	        b01 = a22 * a11 - a12 * a21,
	        b11 = -a22 * a10 + a12 * a20,
	        b21 = a21 * a10 - a11 * a20,
	        det = a00 * b01 + a01 * b11 + a02 * b21;

	        if ( det === 0 ) {
	            console.log( "can't invert matrix, determinant is 0");
	            return this.identity();
	        }

	        det = 1.0 / det;
	        te[0] = b01 * det;
	        te[1] = (-a22 * a01 + a02 * a21) * det;
	        te[2] = (a12 * a01 - a02 * a11) * det;
	        te[3] = b11 * det;
	        te[4] = (a22 * a00 - a02 * a20) * det;
	        te[5] = (-a12 * a00 + a02 * a10) * det;
	        te[6] = b21 * det;
	        te[7] = (-a21 * a00 + a01 * a20) * det;
	        te[8] = (a11 * a00 - a01 * a10) * det;
	        return this;

	    },

	    addOffset: function ( m, v ) {

	        var relX = v.x;
	        var relY = v.y;
	        var relZ = v.z;

	        var te = this.elements;
	        te[0] += m * ( relY * relY + relZ * relZ );
	        te[4] += m * ( relX * relX + relZ * relZ );
	        te[8] += m * ( relX * relX + relY * relY );
	        var xy = m * relX * relY;
	        var yz = m * relY * relZ;
	        var zx = m * relZ * relX;
	        te[1] -= xy;
	        te[3] -= xy;
	        te[2] -= yz;
	        te[6] -= yz;
	        te[5] -= zx;
	        te[7] -= zx;
	        return this;

	    },

	    subOffset: function ( m, v ) {

	        var relX = v.x;
	        var relY = v.y;
	        var relZ = v.z;

	        var te = this.elements;
	        te[0] -= m * ( relY * relY + relZ * relZ );
	        te[4] -= m * ( relX * relX + relZ * relZ );
	        te[8] -= m * ( relX * relX + relY * relY );
	        var xy = m * relX * relY;
	        var yz = m * relY * relZ;
	        var zx = m * relZ * relX;
	        te[1] += xy;
	        te[3] += xy;
	        te[2] += yz;
	        te[6] += yz;
	        te[5] += zx;
	        te[7] += zx;
	        return this;

	    },

	    // OK 

	    multiplyScalar: function ( s ) {

	        var te = this.elements;

	        te[ 0 ] *= s; te[ 3 ] *= s; te[ 6 ] *= s;
	        te[ 1 ] *= s; te[ 4 ] *= s; te[ 7 ] *= s;
	        te[ 2 ] *= s; te[ 5 ] *= s; te[ 8 ] *= s;

	        return this;

	    },

	    identity: function () {

	        this.set( 1, 0, 0, 0, 1, 0, 0, 0, 1 );
	        return this;

	    },


	    clone: function () {

	        return new Mat33().fromArray( this.elements );

	    },

	    copy: function ( m ) {

	        for ( var i = 0; i < 9; i ++ ) this.elements[ i ] = m.elements[ i ];
	        return this;

	    },

	    determinant: function () {

	        var te = this.elements;
	        var a = te[ 0 ], b = te[ 1 ], c = te[ 2 ],
	            d = te[ 3 ], e = te[ 4 ], f = te[ 5 ],
	            g = te[ 6 ], h = te[ 7 ], i = te[ 8 ];

	        return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;

	    },

	    fromArray: function ( array, offset ) {

	        if ( offset === undefined ) offset = 0;

	        for( var i = 0; i < 9; i ++ ) {

	            this.elements[ i ] = array[ i + offset ];

	        }

	        return this;

	    },

	    toArray: function ( array, offset ) {

	        if ( array === undefined ) array = [];
	        if ( offset === undefined ) offset = 0;

	        var te = this.elements;

	        array[ offset ] = te[ 0 ];
	        array[ offset + 1 ] = te[ 1 ];
	        array[ offset + 2 ] = te[ 2 ];

	        array[ offset + 3 ] = te[ 3 ];
	        array[ offset + 4 ] = te[ 4 ];
	        array[ offset + 5 ] = te[ 5 ];

	        array[ offset + 6 ] = te[ 6 ];
	        array[ offset + 7 ] = te[ 7 ];
	        array[ offset + 8 ] = te[ 8 ];

	        return array;

	    }


	} );

	/**
	 * An axis-aligned bounding box.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function AABB( minX, maxX, minY, maxY, minZ, maxZ ){

	    this.elements = new Float32Array( 6 );
	    var te = this.elements;

	    te[0] = minX || 0; te[1] = minY || 0; te[2] = minZ || 0;
	    te[3] = maxX || 0; te[4] = maxY || 0; te[5] = maxZ || 0;

	}

	Object.assign( AABB.prototype, {

		AABB: true,

		set: function(minX, maxX, minY, maxY, minZ, maxZ){

			var te = this.elements;
			te[0] = minX;
			te[3] = maxX;
			te[1] = minY;
			te[4] = maxY;
			te[2] = minZ;
			te[5] = maxZ;
			return this;
		},

		intersectTest: function ( aabb ) {

			var te = this.elements;
			var ue = aabb.elements;
			return te[0] > ue[3] || te[1] > ue[4] || te[2] > ue[5] || te[3] < ue[0] || te[4] < ue[1] || te[5] < ue[2] ? true : false;

		},

		intersectTestTwo: function ( aabb ) {

			var te = this.elements;
			var ue = aabb.elements;
			return te[0] < ue[0] || te[1] < ue[1] || te[2] < ue[2] || te[3] > ue[3] || te[4] > ue[4] || te[5] > ue[5] ? true : false;

		},

		clone: function () {

			return new this.constructor().fromArray( this.elements );

		},

		copy: function ( aabb, margin ) {

			var m = margin || 0;
			var me = aabb.elements;
			this.set( me[ 0 ]-m, me[ 3 ]+m, me[ 1 ]-m, me[ 4 ]+m, me[ 2 ]-m, me[ 5 ]+m );
			return this;

		},

		fromArray: function ( array ) {

			this.elements.set( array );
			return this;

		},

		// Set this AABB to the combined AABB of aabb1 and aabb2.

		combine: function( aabb1, aabb2 ) {

			var a = aabb1.elements;
			var b = aabb2.elements;
			var te = this.elements;

			te[0] = a[0] < b[0] ? a[0] : b[0];
			te[1] = a[1] < b[1] ? a[1] : b[1];
			te[2] = a[2] < b[2] ? a[2] : b[2];

			te[3] = a[3] > b[3] ? a[3] : b[3];
			te[4] = a[4] > b[4] ? a[4] : b[4];
			te[5] = a[5] > b[5] ? a[5] : b[5];

			return this;

		},


		// Get the surface area.

		surfaceArea: function () {

			var te = this.elements;
			var a = te[3] - te[0];
			var h = te[4] - te[1];
			var d = te[5] - te[2];
			return 2 * (a * (h + d) + h * d );

		},


		// Get whether the AABB intersects with the point or not.

		intersectsWithPoint:function(x,y,z){

			var te = this.elements;
			return x>=te[0] && x<=te[3] && y>=te[1] && y<=te[4] && z>=te[2] && z<=te[5];

		},

		/**
		 * Set the AABB from an array
		 * of vertices. From THREE.
		 * @author WestLangley
		 * @author xprogram
		 */

		setFromPoints: function(arr){
			this.makeEmpty();
			for(var i = 0; i < arr.length; i++){
				this.expandByPoint(arr[i]);
			}
		},

		makeEmpty: function(){
			this.set(-Infinity, -Infinity, -Infinity, Infinity, Infinity, Infinity);
		},

		expandByPoint: function(pt){
			var te = this.elements;
			this.set(
				_Math.min(te[ 0 ], pt.x), _Math.min(te[ 1 ], pt.y), _Math.min(te[ 2 ], pt.z),
				_Math.max(te[ 3 ], pt.x), _Math.max(te[ 4 ], pt.y), _Math.max(te[ 5 ], pt.z)
			);
		},

		expandByScalar: function(s){

			var te = this.elements;
			te[0] += -s;
			te[1] += -s;
			te[2] += -s;
			te[3] += s;
			te[4] += s;
			te[5] += s;
		}

	});

	var count = 0;
	function ShapeIdCount() { return count++; }

	/**
	 * A shape is used to detect collisions of rigid bodies.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function Shape ( config ) {

	    this.type = SHAPE_NULL;

	    // global identification of the shape should be unique to the shape.
	    this.id = ShapeIdCount();

	    // previous shape in parent rigid body. Used for fast interations.
	    this.prev = null;

	    // next shape in parent rigid body. Used for fast interations.
	    this.next = null;

	    // proxy of the shape used for broad-phase collision detection.
	    this.proxy = null;

	    // parent rigid body of the shape.
	    this.parent = null;

	    // linked list of the contacts with the shape.
	    this.contactLink = null;

	    // number of the contacts with the shape.
	    this.numContacts = 0;

	    // center of gravity of the shape in world coordinate system.
	    this.position = new Vec3();

	    // rotation matrix of the shape in world coordinate system.
	    this.rotation = new Mat33();

	    // position of the shape in parent's coordinate system.
	    this.relativePosition = new Vec3().copy( config.relativePosition );

	    // rotation matrix of the shape in parent's coordinate system.
	    this.relativeRotation = new Mat33().copy( config.relativeRotation );

	    // axis-aligned bounding box of the shape.
	    this.aabb = new AABB();

	    // density of the shape.
	    this.density = config.density;

	    // coefficient of friction of the shape.
	    this.friction = config.friction;

	    // coefficient of restitution of the shape.
	    this.restitution = config.restitution;

	    // bits of the collision groups to which the shape belongs.
	    this.belongsTo = config.belongsTo;

	    // bits of the collision groups with which the shape collides.
	    this.collidesWith = config.collidesWith;

	}

	Object.assign( Shape.prototype, {

	    Shape: true,

	    // Calculate the mass information of the shape.

	    calculateMassInfo: function( out ){

	        printError("Shape", "Inheritance error.");

	    },

	    // Update the proxy of the shape.

	    updateProxy: function(){

	        printError("Shape", "Inheritance error.");

	    }

	});

	/**
	 * Box shape.
	 * @author saharan
	 * @author lo-th
	 */
	 
	function Box ( config, Width, Height, Depth ) {

	    Shape.call( this, config );

	    this.type = SHAPE_BOX;

	    this.width = Width;
	    this.height = Height;
	    this.depth = Depth;

	    this.halfWidth = Width * 0.5;
	    this.halfHeight = Height * 0.5;
	    this.halfDepth = Depth * 0.5;

	    this.dimentions = new Float32Array( 18 );
	    this.elements = new Float32Array( 24 );

	}

	Box.prototype = Object.assign( Object.create( Shape.prototype ), {

		constructor: Box,

		calculateMassInfo: function ( out ) {

			var mass = this.width * this.height * this.depth * this.density;
			var divid = 1/12;
			out.mass = mass;
			out.inertia.set(
				mass * ( this.height * this.height + this.depth * this.depth ) * divid, 0, 0,
				0, mass * ( this.width * this.width + this.depth * this.depth ) * divid, 0,
				0, 0, mass * ( this.width * this.width + this.height * this.height ) * divid
			);

		},

		updateProxy: function () {

			var te = this.rotation.elements;
			var di = this.dimentions;
			// Width
			di[0] = te[0];
			di[1] = te[3];
			di[2] = te[6];
			// Height
			di[3] = te[1];
			di[4] = te[4];
			di[5] = te[7];
			// Depth
			di[6] = te[2];
			di[7] = te[5];
			di[8] = te[8];
			// half Width
			di[9] = te[0] * this.halfWidth;
			di[10] = te[3] * this.halfWidth;
			di[11] = te[6] * this.halfWidth;
			// half Height
			di[12] = te[1] * this.halfHeight;
			di[13] = te[4] * this.halfHeight;
			di[14] = te[7] * this.halfHeight;
			// half Depth
			di[15] = te[2] * this.halfDepth;
			di[16] = te[5] * this.halfDepth;
			di[17] = te[8] * this.halfDepth;

			var wx = di[9];
			var wy = di[10];
			var wz = di[11];
			var hx = di[12];
			var hy = di[13];
			var hz = di[14];
			var dx = di[15];
			var dy = di[16];
			var dz = di[17];

			var x = this.position.x;
			var y = this.position.y;
			var z = this.position.z;

			var v = this.elements;
			//v1
			v[0] = x + wx + hx + dx;
			v[1] = y + wy + hy + dy;
			v[2] = z + wz + hz + dz;
			//v2
			v[3] = x + wx + hx - dx;
			v[4] = y + wy + hy - dy;
			v[5] = z + wz + hz - dz;
			//v3
			v[6] = x + wx - hx + dx;
			v[7] = y + wy - hy + dy;
			v[8] = z + wz - hz + dz;
			//v4
			v[9] = x + wx - hx - dx;
			v[10] = y + wy - hy - dy;
			v[11] = z + wz - hz - dz;
			//v5
			v[12] = x - wx + hx + dx;
			v[13] = y - wy + hy + dy;
			v[14] = z - wz + hz + dz;
			//v6
			v[15] = x - wx + hx - dx;
			v[16] = y - wy + hy - dy;
			v[17] = z - wz + hz - dz;
			//v7
			v[18] = x - wx - hx + dx;
			v[19] = y - wy - hy + dy;
			v[20] = z - wz - hz + dz;
			//v8
			v[21] = x - wx - hx - dx;
			v[22] = y - wy - hy - dy;
			v[23] = z - wz - hz - dz;

			var w = di[9] < 0 ? -di[9] : di[9];
			var h = di[10] < 0 ? -di[10] : di[10];
			var d = di[11] < 0 ? -di[11] : di[11];

			w = di[12] < 0 ? w - di[12] : w + di[12];
			h = di[13] < 0 ? h - di[13] : h + di[13];
			d = di[14] < 0 ? d - di[14] : d + di[14];

			w = di[15] < 0 ? w - di[15] : w + di[15];
			h = di[16] < 0 ? h - di[16] : h + di[16];
			d = di[17] < 0 ? d - di[17] : d + di[17];

			var p = AABB_PROX;

			this.aabb.set(
				this.position.x - w - p, this.position.x + w + p,
				this.position.y - h - p, this.position.y + h + p,
				this.position.z - d - p, this.position.z + d + p
			);

			if ( this.proxy != null ) this.proxy.update();

		}
	});

	/**
	 * Sphere shape
	 * @author saharan
	 * @author lo-th
	 */

	function Sphere( config, radius ) {

	    Shape.call( this, config );

	    this.type = SHAPE_SPHERE;

	    // radius of the shape.
	    this.radius = radius;

	}

	Sphere.prototype = Object.assign( Object.create( Shape.prototype ), {

		constructor: Sphere,

		volume: function () {

			return _Math.PI * this.radius * 1.333333;

		},

		calculateMassInfo: function ( out ) {

			var mass = this.volume() * this.radius * this.radius * this.density; //1.333 * _Math.PI * this.radius * this.radius * this.radius * this.density;
			out.mass = mass;
			var inertia = mass * this.radius * this.radius * 0.4;
			out.inertia.set( inertia, 0, 0, 0, inertia, 0, 0, 0, inertia );

		},

		updateProxy: function () {

			var p = AABB_PROX;

			this.aabb.set(
				this.position.x - this.radius - p, this.position.x + this.radius + p,
				this.position.y - this.radius - p, this.position.y + this.radius + p,
				this.position.z - this.radius - p, this.position.z + this.radius + p
			);

			if ( this.proxy != null ) this.proxy.update();

		}

	});

	/**
	 * Cylinder shape
	 * @author saharan
	 * @author lo-th
	 */

	function Cylinder ( config, radius, height ) {

	    Shape.call( this, config );

	    this.type = SHAPE_CYLINDER;

	    this.radius = radius;
	    this.height = height;
	    this.halfHeight = height * 0.5;

	    this.normalDirection = new Vec3();
	    this.halfDirection = new Vec3();

	}

	Cylinder.prototype = Object.assign( Object.create( Shape.prototype ), {

	    constructor: Cylinder,

	    calculateMassInfo: function ( out ) {

	        var rsq = this.radius * this.radius;
	        var mass = _Math.PI * rsq * this.height * this.density;
	        var inertiaXZ = ( ( 0.25 * rsq ) + ( 0.0833 * this.height * this.height ) ) * mass;
	        var inertiaY = 0.5 * rsq;
	        out.mass = mass;
	        out.inertia.set( inertiaXZ, 0, 0,  0, inertiaY, 0,  0, 0, inertiaXZ );

	    },

	    updateProxy: function () {

	        var te = this.rotation.elements;
	        var len, wx, hy, dz, xx, yy, zz, w, h, d, p;

	        xx = te[1] * te[1];
	        yy = te[4] * te[4];
	        zz = te[7] * te[7];

	        this.normalDirection.set( te[1], te[4], te[7] );
	        this.halfDirection.scale( this.normalDirection, this.halfHeight );

	        wx = 1 - xx;
	        len = _Math.sqrt(wx*wx + xx*yy + xx*zz);
	        if(len>0) len = this.radius/len;
	        wx *= len;
	        hy = 1 - yy;
	        len = _Math.sqrt(yy*xx + hy*hy + yy*zz);
	        if(len>0) len = this.radius/len;
	        hy *= len;
	        dz = 1 - zz;
	        len = _Math.sqrt(zz*xx + zz*yy + dz*dz);
	        if(len>0) len = this.radius/len;
	        dz *= len;

	        w = this.halfDirection.x < 0 ? -this.halfDirection.x : this.halfDirection.x;
	        h = this.halfDirection.y < 0 ? -this.halfDirection.y : this.halfDirection.y;
	        d = this.halfDirection.z < 0 ? -this.halfDirection.z : this.halfDirection.z;

	        w = wx < 0 ? w - wx : w + wx;
	        h = hy < 0 ? h - hy : h + hy;
	        d = dz < 0 ? d - dz : d + dz;

	        p = AABB_PROX;

	        this.aabb.set(
	            this.position.x - w - p, this.position.x + w + p,
	            this.position.y - h - p, this.position.y + h + p,
	            this.position.z - d - p, this.position.z + d + p
	        );

	        if ( this.proxy != null ) this.proxy.update();

	    }

	});

	/**
	 * Plane shape.
	 * @author lo-th
	 */

	function Plane( config, normal ) {

	    Shape.call( this, config );

	    this.type = SHAPE_PLANE;

	    // radius of the shape.
	    this.normal = new Vec3( 0, 1, 0 );

	}

	Plane.prototype = Object.assign( Object.create( Shape.prototype ), {

	    constructor: Plane,

	    volume: function () {

	        return Number.MAX_VALUE;

	    },

	    calculateMassInfo: function ( out ) {

	        out.mass = this.density;//0.0001;
	        var inertia = 1;
	        out.inertia.set( inertia, 0, 0, 0, inertia, 0, 0, 0, inertia );

	    },

	    updateProxy: function () {

	        var p = AABB_PROX;

	        var min = -_Math.INF;
	        var max = _Math.INF;
	        var n = this.normal;
	        // The plane AABB is infinite, except if the normal is pointing along any axis
	        this.aabb.set(
	            n.x === -1 ? this.position.x - p : min, n.x === 1 ? this.position.x + p : max,
	            n.y === -1 ? this.position.y - p : min, n.y === 1 ? this.position.y + p : max,
	            n.z === -1 ? this.position.z - p : min, n.z === 1 ? this.position.z + p : max
	        );

	        if ( this.proxy != null ) this.proxy.update();

	    }

	});

	/**
	 * A Particule shape
	 * @author lo-th
	 */

	function Particle( config, normal ) {

	    Shape.call( this, config );

	    this.type = SHAPE_PARTICLE;

	}

	Particle.prototype = Object.assign( Object.create( Shape.prototype ), {

	    constructor: Particle,

	    volume: function () {

	        return Number.MAX_VALUE;

	    },

	    calculateMassInfo: function ( out ) {

	        var inertia = 0;
	        out.inertia.set( inertia, 0, 0, 0, inertia, 0, 0, 0, inertia );

	    },

	    updateProxy: function () {

	        var p = 0;//AABB_PROX;

	        this.aabb.set(
	            this.position.x - p, this.position.x + p,
	            this.position.y - p, this.position.y + p,
	            this.position.z - p, this.position.z + p
	        );

	        if ( this.proxy != null ) this.proxy.update();

	    }

	});

	/**
	 * A shape configuration holds common configuration data for constructing a shape.
	 * These configurations can be reused safely.
	 *
	 * @author saharan
	 * @author lo-th
	 */
	 
	function ShapeConfig(){

	    // position of the shape in parent's coordinate system.
	    this.relativePosition = new Vec3();
	    // rotation matrix of the shape in parent's coordinate system.
	    this.relativeRotation = new Mat33();
	    // coefficient of friction of the shape.
	    this.friction = 0.2; // 0.4
	    // coefficient of restitution of the shape.
	    this.restitution = 0.2;
	    // density of the shape.
	    this.density = 1;
	    // bits of the collision groups to which the shape belongs.
	    this.belongsTo = 1;
	    // bits of the collision groups with which the shape collides.
	    this.collidesWith = 0xffffffff;

	}

	/**
	* An information of limit and motor.
	*
	* @author saharan
	*/

	function LimitMotor ( axis, fixed ) {

	    fixed = fixed || false;
	    // The axis of the constraint.
	    this.axis = axis;
	    // The current angle for rotational constraints.
	    this.angle = 0;
	    // The lower limit. Set lower > upper to disable
	    this.lowerLimit = fixed ? 0 : 1;

	    //  The upper limit. Set lower > upper to disable.
	    this.upperLimit = 0;
	    // The target motor speed.
	    this.motorSpeed = 0;
	    // The maximum motor force or torque. Set 0 to disable.
	    this.maxMotorForce = 0;
	    // The frequency of the spring. Set 0 to disable.
	    this.frequency = 0;
	    // The damping ratio of the spring. Set 0 for no damping, 1 for critical damping.
	    this.dampingRatio = 0;

	}

	Object.assign( LimitMotor.prototype, {

	    LimitMotor: true,

	    // Set limit data into this constraint.
	    setLimit:function ( lowerLimit, upperLimit ) {

	        this.lowerLimit = lowerLimit;
	        this.upperLimit = upperLimit;

	    },

	    // Set motor data into this constraint.
	    setMotor:function ( motorSpeed, maxMotorForce ) {
	        
	        this.motorSpeed = motorSpeed;
	        this.maxMotorForce = maxMotorForce;

	    },

	    // Set spring data into this constraint.
	    setSpring:function ( frequency, dampingRatio ) {
	        
	        this.frequency = frequency;
	        this.dampingRatio = dampingRatio;
	        
	    }

	});

	/**
	 * The base class of all type of the constraints.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function Constraint(){

	    // parent world of the constraint.
	    this.parent = null;

	    // first body of the constraint.
	    this.body1 = null;

	    // second body of the constraint.
	    this.body2 = null;

	    // Internal
	    this.addedToIsland = false;
	    
	}

	Object.assign( Constraint.prototype, {

	    Constraint: true,

	    // Prepare for solving the constraint
	    preSolve: function( timeStep, invTimeStep ){

	        printError("Constraint", "Inheritance error.");

	    },

	    // Solve the constraint. This is usually called iteratively.
	    solve: function(){

	        printError("Constraint", "Inheritance error.");

	    },

	    // Do the post-processing.
	    postSolve: function(){

	        printError("Constraint", "Inheritance error.");

	    }

	});

	function JointLink ( joint ){
	    
	    // The previous joint link.
	    this.prev = null;
	    // The next joint link.
	    this.next = null;
	    // The other rigid body connected to the joint.
	    this.body = null;
	    // The joint of the link.
	    this.joint = joint;

	}

	/**
	 * Joints are used to constrain the motion between two rigid bodies.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function Joint ( config ){

	    Constraint.call( this );

	    this.scale = 1;
	    this.invScale = 1;

	    // joint name
	    this.name = "";
	    this.id = NaN;

	    // The type of the joint.
	    this.type = JOINT_NULL;
	    //  The previous joint in the world.
	    this.prev = null;
	    // The next joint in the world.
	    this.next = null;

	    this.body1 = config.body1;
	    this.body2 = config.body2;

	    // anchor point on the first rigid body in local coordinate system.
	    this.localAnchorPoint1 = new Vec3().copy( config.localAnchorPoint1 );
	    // anchor point on the second rigid body in local coordinate system.
	    this.localAnchorPoint2 = new Vec3().copy( config.localAnchorPoint2 );
	    // anchor point on the first rigid body in world coordinate system relative to the body's origin.
	    this.relativeAnchorPoint1 = new Vec3();
	    // anchor point on the second rigid body in world coordinate system relative to the body's origin.
	    this.relativeAnchorPoint2 = new Vec3();
	    //  anchor point on the first rigid body in world coordinate system.
	    this.anchorPoint1 = new Vec3();
	    // anchor point on the second rigid body in world coordinate system.
	    this.anchorPoint2 = new Vec3();
	    // Whether allow collision between connected rigid bodies or not.
	    this.allowCollision = config.allowCollision;

	    this.b1Link = new JointLink( this );
	    this.b2Link = new JointLink( this );

	}

	Joint.prototype = Object.assign( Object.create( Constraint.prototype ), {

	    constructor: Joint,

	    setId: function ( n ) { 

	        this.id = i; 

	    },

	    setParent: function ( world ) {

	        this.parent = world;
	        this.scale = this.parent.scale;
	        this.invScale = this.parent.invScale;
	        this.id = this.parent.numJoints;
	        if( !this.name ) this.name = 'J' +  this.id;

	    },

	    // Update all the anchor points.

	    updateAnchorPoints: function () {

	        this.relativeAnchorPoint1.copy( this.localAnchorPoint1 ).applyMatrix3( this.body1.rotation, true );
	        this.relativeAnchorPoint2.copy( this.localAnchorPoint2 ).applyMatrix3( this.body2.rotation, true );

	        this.anchorPoint1.add( this.relativeAnchorPoint1, this.body1.position );
	        this.anchorPoint2.add( this.relativeAnchorPoint2, this.body2.position );

	    },

	    // Attach the joint from the bodies.

	    attach: function ( isX ) {

	        this.b1Link.body = this.body2;
	        this.b2Link.body = this.body1;

	        if(isX){

	            this.body1.jointLink.push( this.b1Link );
	            this.body2.jointLink.push( this.b2Link );

	        } else {

	            if(this.body1.jointLink != null) (this.b1Link.next=this.body1.jointLink).prev = this.b1Link;
	            else this.b1Link.next = null;
	            this.body1.jointLink = this.b1Link;
	            this.body1.numJoints++;
	            if(this.body2.jointLink != null) (this.b2Link.next=this.body2.jointLink).prev = this.b2Link;
	            else this.b2Link.next = null;
	            this.body2.jointLink = this.b2Link;
	            this.body2.numJoints++;

	        }

	    },

	    // Detach the joint from the bodies.

	    detach: function ( isX ) {

	        if( isX ){

	            this.body1.jointLink.splice( this.body1.jointLink.indexOf( this.b1Link ), 1 );
	            this.body2.jointLink.splice( this.body2.jointLink.indexOf( this.b2Link ), 1 );

	        } else {

	            var prev = this.b1Link.prev;
	            var next = this.b1Link.next;
	            if(prev != null) prev.next = next;
	            if(next != null) next.prev = prev;
	            if(this.body1.jointLink == this.b1Link) this.body1.jointLink = next;
	            this.b1Link.prev = null;
	            this.b1Link.next = null;
	            this.b1Link.body = null;
	            this.body1.numJoints--;

	            prev = this.b2Link.prev;
	            next = this.b2Link.next;
	            if(prev != null) prev.next = next;
	            if(next != null) next.prev = prev;
	            if(this.body2.jointLink==this.b2Link) this.body2.jointLink = next;
	            this.b2Link.prev = null;
	            this.b2Link.next = null;
	            this.b2Link.body = null;
	            this.body2.numJoints--;

	        }

	        this.b1Link.body = null;
	        this.b2Link.body = null;

	    },


	    // Awake the bodies.

	    awake: function () {

	        this.body1.awake();
	        this.body2.awake();

	    },

	    // calculation function

	    preSolve: function ( timeStep, invTimeStep ) {

	    },

	    solve: function () {

	    },

	    postSolve: function () {

	    },

	    // Delete process

	    remove: function () {

	        this.dispose();

	    },

	    dispose: function () {

	        this.parent.removeJoint( this );

	    },


	    // Three js add

	    getPosition: function () {

	        var p1 = new Vec3().scale( this.anchorPoint1, this.scale );
	        var p2 = new Vec3().scale( this.anchorPoint2, this.scale );
	        return [ p1, p2 ];

	    }

	});

	/**
	* A linear constraint for all axes for various joints.
	* @author saharan
	*/
	function LinearConstraint ( joint ){

	    this.m1=NaN;
	    this.m2=NaN;

	    this.ii1 = null;
	    this.ii2 = null;
	    this.dd = null;

	    this.r1x=NaN;
	    this.r1y=NaN;
	    this.r1z=NaN;

	    this.r2x=NaN;
	    this.r2y=NaN;
	    this.r2z=NaN;

	    this.ax1x=NaN;
	    this.ax1y=NaN;
	    this.ax1z=NaN;
	    this.ay1x=NaN;
	    this.ay1y=NaN;
	    this.ay1z=NaN;
	    this.az1x=NaN;
	    this.az1y=NaN;
	    this.az1z=NaN;

	    this.ax2x=NaN;
	    this.ax2y=NaN;
	    this.ax2z=NaN;
	    this.ay2x=NaN;
	    this.ay2y=NaN;
	    this.ay2z=NaN;
	    this.az2x=NaN;
	    this.az2y=NaN;
	    this.az2z=NaN;

	    this.vel=NaN;
	    this.velx=NaN;
	    this.vely=NaN;
	    this.velz=NaN;


	    this.joint = joint;
	    this.r1 = joint.relativeAnchorPoint1;
	    this.r2 = joint.relativeAnchorPoint2;
	    this.p1 = joint.anchorPoint1;
	    this.p2 = joint.anchorPoint2;
	    this.b1 = joint.body1;
	    this.b2 = joint.body2;
	    this.l1 = this.b1.linearVelocity;
	    this.l2 = this.b2.linearVelocity;
	    this.a1 = this.b1.angularVelocity;
	    this.a2 = this.b2.angularVelocity;
	    this.i1 = this.b1.inverseInertia;
	    this.i2 = this.b2.inverseInertia;
	    this.impx = 0;
	    this.impy = 0;
	    this.impz = 0;

	}

	Object.assign( LinearConstraint.prototype, {

	    LinearConstraint: true,

	    preSolve: function ( timeStep, invTimeStep ) {
	        
	        this.r1x = this.r1.x;
	        this.r1y = this.r1.y;
	        this.r1z = this.r1.z;

	        this.r2x = this.r2.x;
	        this.r2y = this.r2.y;
	        this.r2z = this.r2.z;

	        this.m1 = this.b1.inverseMass;
	        this.m2 = this.b2.inverseMass;

	        this.ii1 = this.i1.clone();
	        this.ii2 = this.i2.clone();

	        var ii1 = this.ii1.elements;
	        var ii2 = this.ii2.elements;

	        this.ax1x = this.r1z*ii1[1]+-this.r1y*ii1[2];
	        this.ax1y = this.r1z*ii1[4]+-this.r1y*ii1[5];
	        this.ax1z = this.r1z*ii1[7]+-this.r1y*ii1[8];
	        this.ay1x = -this.r1z*ii1[0]+this.r1x*ii1[2];
	        this.ay1y = -this.r1z*ii1[3]+this.r1x*ii1[5];
	        this.ay1z = -this.r1z*ii1[6]+this.r1x*ii1[8];
	        this.az1x = this.r1y*ii1[0]+-this.r1x*ii1[1];
	        this.az1y = this.r1y*ii1[3]+-this.r1x*ii1[4];
	        this.az1z = this.r1y*ii1[6]+-this.r1x*ii1[7];
	        this.ax2x = this.r2z*ii2[1]+-this.r2y*ii2[2];
	        this.ax2y = this.r2z*ii2[4]+-this.r2y*ii2[5];
	        this.ax2z = this.r2z*ii2[7]+-this.r2y*ii2[8];
	        this.ay2x = -this.r2z*ii2[0]+this.r2x*ii2[2];
	        this.ay2y = -this.r2z*ii2[3]+this.r2x*ii2[5];
	        this.ay2z = -this.r2z*ii2[6]+this.r2x*ii2[8];
	        this.az2x = this.r2y*ii2[0]+-this.r2x*ii2[1];
	        this.az2y = this.r2y*ii2[3]+-this.r2x*ii2[4];
	        this.az2z = this.r2y*ii2[6]+-this.r2x*ii2[7];

	        // calculate point-to-point mass matrix
	        // from impulse equation
	        // 
	        // M = ([/m] - [r^][/I][r^]) ^ -1
	        // 
	        // where
	        // 
	        // [/m] = |1/m, 0, 0|
	        //        |0, 1/m, 0|
	        //        |0, 0, 1/m|
	        // 
	        // [r^] = |0, -rz, ry|
	        //        |rz, 0, -rx|
	        //        |-ry, rx, 0|
	        // 
	        // [/I] = Inverted moment inertia

	        var rxx = this.m1+this.m2;

	        var kk = new Mat33().set( rxx, 0, 0,  0, rxx, 0,  0, 0, rxx );
	        var k = kk.elements;

	        k[0] += ii1[4]*this.r1z*this.r1z-(ii1[7]+ii1[5])*this.r1y*this.r1z+ii1[8]*this.r1y*this.r1y;
	        k[1] += (ii1[6]*this.r1y+ii1[5]*this.r1x)*this.r1z-ii1[3]*this.r1z*this.r1z-ii1[8]*this.r1x*this.r1y;
	        k[2] += (ii1[3]*this.r1y-ii1[4]*this.r1x)*this.r1z-ii1[6]*this.r1y*this.r1y+ii1[7]*this.r1x*this.r1y;
	        k[3] += (ii1[2]*this.r1y+ii1[7]*this.r1x)*this.r1z-ii1[1]*this.r1z*this.r1z-ii1[8]*this.r1x*this.r1y;
	        k[4] += ii1[0]*this.r1z*this.r1z-(ii1[6]+ii1[2])*this.r1x*this.r1z+ii1[8]*this.r1x*this.r1x;
	        k[5] += (ii1[1]*this.r1x-ii1[0]*this.r1y)*this.r1z-ii1[7]*this.r1x*this.r1x+ii1[6]*this.r1x*this.r1y;
	        k[6] += (ii1[1]*this.r1y-ii1[4]*this.r1x)*this.r1z-ii1[2]*this.r1y*this.r1y+ii1[5]*this.r1x*this.r1y;
	        k[7] += (ii1[3]*this.r1x-ii1[0]*this.r1y)*this.r1z-ii1[5]*this.r1x*this.r1x+ii1[2]*this.r1x*this.r1y;
	        k[8] += ii1[0]*this.r1y*this.r1y-(ii1[3]+ii1[1])*this.r1x*this.r1y+ii1[4]*this.r1x*this.r1x;

	        k[0] += ii2[4]*this.r2z*this.r2z-(ii2[7]+ii2[5])*this.r2y*this.r2z+ii2[8]*this.r2y*this.r2y;
	        k[1] += (ii2[6]*this.r2y+ii2[5]*this.r2x)*this.r2z-ii2[3]*this.r2z*this.r2z-ii2[8]*this.r2x*this.r2y;
	        k[2] += (ii2[3]*this.r2y-ii2[4]*this.r2x)*this.r2z-ii2[6]*this.r2y*this.r2y+ii2[7]*this.r2x*this.r2y;
	        k[3] += (ii2[2]*this.r2y+ii2[7]*this.r2x)*this.r2z-ii2[1]*this.r2z*this.r2z-ii2[8]*this.r2x*this.r2y;
	        k[4] += ii2[0]*this.r2z*this.r2z-(ii2[6]+ii2[2])*this.r2x*this.r2z+ii2[8]*this.r2x*this.r2x;
	        k[5] += (ii2[1]*this.r2x-ii2[0]*this.r2y)*this.r2z-ii2[7]*this.r2x*this.r2x+ii2[6]*this.r2x*this.r2y;
	        k[6] += (ii2[1]*this.r2y-ii2[4]*this.r2x)*this.r2z-ii2[2]*this.r2y*this.r2y+ii2[5]*this.r2x*this.r2y;
	        k[7] += (ii2[3]*this.r2x-ii2[0]*this.r2y)*this.r2z-ii2[5]*this.r2x*this.r2x+ii2[2]*this.r2x*this.r2y;
	        k[8] += ii2[0]*this.r2y*this.r2y-(ii2[3]+ii2[1])*this.r2x*this.r2y+ii2[4]*this.r2x*this.r2x;

	        var inv=1/( k[0]*(k[4]*k[8]-k[7]*k[5]) + k[3]*(k[7]*k[2]-k[1]*k[8]) + k[6]*(k[1]*k[5]-k[4]*k[2]) );
	        this.dd = new Mat33().set(
	            k[4]*k[8]-k[5]*k[7], k[2]*k[7]-k[1]*k[8], k[1]*k[5]-k[2]*k[4],
	            k[5]*k[6]-k[3]*k[8], k[0]*k[8]-k[2]*k[6], k[2]*k[3]-k[0]*k[5],
	            k[3]*k[7]-k[4]*k[6], k[1]*k[6]-k[0]*k[7], k[0]*k[4]-k[1]*k[3]
	        ).scaleEqual( inv );

	        this.velx = this.p2.x-this.p1.x;
	        this.vely = this.p2.y-this.p1.y;
	        this.velz = this.p2.z-this.p1.z;
	        var len = _Math.sqrt(this.velx*this.velx+this.vely*this.vely+this.velz*this.velz);
	        if(len>0.005){
	            len = (0.005-len)/len*invTimeStep*0.05;
	            this.velx *= len;
	            this.vely *= len;
	            this.velz *= len;
	        }else{
	            this.velx = 0;
	            this.vely = 0;
	            this.velz = 0;
	        }

	        this.impx *= 0.95;
	        this.impy *= 0.95;
	        this.impz *= 0.95;
	        
	        this.l1.x += this.impx*this.m1;
	        this.l1.y += this.impy*this.m1;
	        this.l1.z += this.impz*this.m1;
	        this.a1.x += this.impx*this.ax1x+this.impy*this.ay1x+this.impz*this.az1x;
	        this.a1.y += this.impx*this.ax1y+this.impy*this.ay1y+this.impz*this.az1y;
	        this.a1.z += this.impx*this.ax1z+this.impy*this.ay1z+this.impz*this.az1z;
	        this.l2.x -= this.impx*this.m2;
	        this.l2.y -= this.impy*this.m2;
	        this.l2.z -= this.impz*this.m2;
	        this.a2.x -= this.impx*this.ax2x+this.impy*this.ay2x+this.impz*this.az2x;
	        this.a2.y -= this.impx*this.ax2y+this.impy*this.ay2y+this.impz*this.az2y;
	        this.a2.z -= this.impx*this.ax2z+this.impy*this.ay2z+this.impz*this.az2z;
	    },

	    solve: function () {

	        var d = this.dd.elements;
	        var rvx = this.l2.x-this.l1.x+this.a2.y*this.r2z-this.a2.z*this.r2y-this.a1.y*this.r1z+this.a1.z*this.r1y-this.velx;
	        var rvy = this.l2.y-this.l1.y+this.a2.z*this.r2x-this.a2.x*this.r2z-this.a1.z*this.r1x+this.a1.x*this.r1z-this.vely;
	        var rvz = this.l2.z-this.l1.z+this.a2.x*this.r2y-this.a2.y*this.r2x-this.a1.x*this.r1y+this.a1.y*this.r1x-this.velz;
	        var nimpx = rvx*d[0]+rvy*d[1]+rvz*d[2];
	        var nimpy = rvx*d[3]+rvy*d[4]+rvz*d[5];
	        var nimpz = rvx*d[6]+rvy*d[7]+rvz*d[8];
	        this.impx += nimpx;
	        this.impy += nimpy;
	        this.impz += nimpz;
	        this.l1.x += nimpx*this.m1;
	        this.l1.y += nimpy*this.m1;
	        this.l1.z += nimpz*this.m1;
	        this.a1.x += nimpx*this.ax1x+nimpy*this.ay1x+nimpz*this.az1x;
	        this.a1.y += nimpx*this.ax1y+nimpy*this.ay1y+nimpz*this.az1y;
	        this.a1.z += nimpx*this.ax1z+nimpy*this.ay1z+nimpz*this.az1z;
	        this.l2.x -= nimpx*this.m2;
	        this.l2.y -= nimpy*this.m2;
	        this.l2.z -= nimpz*this.m2;
	        this.a2.x -= nimpx*this.ax2x+nimpy*this.ay2x+nimpz*this.az2x;
	        this.a2.y -= nimpx*this.ax2y+nimpy*this.ay2y+nimpz*this.az2y;
	        this.a2.z -= nimpx*this.ax2z+nimpy*this.ay2z+nimpz*this.az2z;

	    }

	} );

	/**
	* A three-axis rotational constraint for various joints.
	* @author saharan
	*/

	function Rotational3Constraint ( joint, limitMotor1, limitMotor2, limitMotor3 ) {
	    
	    this.cfm1=NaN;
	    this.cfm2=NaN;
	    this.cfm3=NaN;
	    this.i1e00=NaN;
	    this.i1e01=NaN;
	    this.i1e02=NaN;
	    this.i1e10=NaN;
	    this.i1e11=NaN;
	    this.i1e12=NaN;
	    this.i1e20=NaN;
	    this.i1e21=NaN;
	    this.i1e22=NaN;
	    this.i2e00=NaN;
	    this.i2e01=NaN;
	    this.i2e02=NaN;
	    this.i2e10=NaN;
	    this.i2e11=NaN;
	    this.i2e12=NaN;
	    this.i2e20=NaN;
	    this.i2e21=NaN;
	    this.i2e22=NaN;
	    this.ax1=NaN;
	    this.ay1=NaN;
	    this.az1=NaN;
	    this.ax2=NaN;
	    this.ay2=NaN;
	    this.az2=NaN;
	    this.ax3=NaN;
	    this.ay3=NaN;
	    this.az3=NaN;

	    this.a1x1=NaN; // jacoians
	    this.a1y1=NaN;
	    this.a1z1=NaN;
	    this.a2x1=NaN;
	    this.a2y1=NaN;
	    this.a2z1=NaN;
	    this.a1x2=NaN;
	    this.a1y2=NaN;
	    this.a1z2=NaN;
	    this.a2x2=NaN;
	    this.a2y2=NaN;
	    this.a2z2=NaN;
	    this.a1x3=NaN;
	    this.a1y3=NaN;
	    this.a1z3=NaN;
	    this.a2x3=NaN;
	    this.a2y3=NaN;
	    this.a2z3=NaN;

	    this.lowerLimit1=NaN;
	    this.upperLimit1=NaN;
	    this.limitVelocity1=NaN;
	    this.limitState1=0; // -1: at lower, 0: locked, 1: at upper, 2: free
	    this.enableMotor1=false;
	    this.motorSpeed1=NaN;
	    this.maxMotorForce1=NaN;
	    this.maxMotorImpulse1=NaN;
	    this.lowerLimit2=NaN;
	    this.upperLimit2=NaN;
	    this.limitVelocity2=NaN;
	    this.limitState2=0; // -1: at lower, 0: locked, 1: at upper, 2: free
	    this.enableMotor2=false;
	    this.motorSpeed2=NaN;
	    this.maxMotorForce2=NaN;
	    this.maxMotorImpulse2=NaN;
	    this.lowerLimit3=NaN;
	    this.upperLimit3=NaN;
	    this.limitVelocity3=NaN;
	    this.limitState3=0; // -1: at lower, 0: locked, 1: at upper, 2: free
	    this.enableMotor3=false;
	    this.motorSpeed3=NaN;
	    this.maxMotorForce3=NaN;
	    this.maxMotorImpulse3=NaN;

	    this.k00=NaN; // K = J*M*JT
	    this.k01=NaN;
	    this.k02=NaN;
	    this.k10=NaN;
	    this.k11=NaN;
	    this.k12=NaN;
	    this.k20=NaN;
	    this.k21=NaN;
	    this.k22=NaN;

	    this.kv00=NaN; // diagonals without CFMs
	    this.kv11=NaN;
	    this.kv22=NaN;

	    this.dv00=NaN; // ...inverted
	    this.dv11=NaN;
	    this.dv22=NaN;

	    this.d00=NaN;  // K^-1
	    this.d01=NaN;
	    this.d02=NaN;
	    this.d10=NaN;
	    this.d11=NaN;
	    this.d12=NaN;
	    this.d20=NaN;
	    this.d21=NaN;
	    this.d22=NaN;

	    this.limitMotor1=limitMotor1;
	    this.limitMotor2=limitMotor2;
	    this.limitMotor3=limitMotor3;
	    this.b1=joint.body1;
	    this.b2=joint.body2;
	    this.a1=this.b1.angularVelocity;
	    this.a2=this.b2.angularVelocity;
	    this.i1=this.b1.inverseInertia;
	    this.i2=this.b2.inverseInertia;
	    this.limitImpulse1=0;
	    this.motorImpulse1=0;
	    this.limitImpulse2=0;
	    this.motorImpulse2=0;
	    this.limitImpulse3=0;
	    this.motorImpulse3=0;

	}

	Object.assign( Rotational3Constraint.prototype, {

	    Rotational3Constraint: true,

	    preSolve: function( timeStep, invTimeStep ){

	        this.ax1=this.limitMotor1.axis.x;
	        this.ay1=this.limitMotor1.axis.y;
	        this.az1=this.limitMotor1.axis.z;
	        this.ax2=this.limitMotor2.axis.x;
	        this.ay2=this.limitMotor2.axis.y;
	        this.az2=this.limitMotor2.axis.z;
	        this.ax3=this.limitMotor3.axis.x;
	        this.ay3=this.limitMotor3.axis.y;
	        this.az3=this.limitMotor3.axis.z;
	        this.lowerLimit1=this.limitMotor1.lowerLimit;
	        this.upperLimit1=this.limitMotor1.upperLimit;
	        this.motorSpeed1=this.limitMotor1.motorSpeed;
	        this.maxMotorForce1=this.limitMotor1.maxMotorForce;
	        this.enableMotor1=this.maxMotorForce1>0;
	        this.lowerLimit2=this.limitMotor2.lowerLimit;
	        this.upperLimit2=this.limitMotor2.upperLimit;
	        this.motorSpeed2=this.limitMotor2.motorSpeed;
	        this.maxMotorForce2=this.limitMotor2.maxMotorForce;
	        this.enableMotor2=this.maxMotorForce2>0;
	        this.lowerLimit3=this.limitMotor3.lowerLimit;
	        this.upperLimit3=this.limitMotor3.upperLimit;
	        this.motorSpeed3=this.limitMotor3.motorSpeed;
	        this.maxMotorForce3=this.limitMotor3.maxMotorForce;
	        this.enableMotor3=this.maxMotorForce3>0;

	        var ti1 = this.i1.elements;
	        var ti2 = this.i2.elements;
	        this.i1e00=ti1[0];
	        this.i1e01=ti1[1];
	        this.i1e02=ti1[2];
	        this.i1e10=ti1[3];
	        this.i1e11=ti1[4];
	        this.i1e12=ti1[5];
	        this.i1e20=ti1[6];
	        this.i1e21=ti1[7];
	        this.i1e22=ti1[8];

	        this.i2e00=ti2[0];
	        this.i2e01=ti2[1];
	        this.i2e02=ti2[2];
	        this.i2e10=ti2[3];
	        this.i2e11=ti2[4];
	        this.i2e12=ti2[5];
	        this.i2e20=ti2[6];
	        this.i2e21=ti2[7];
	        this.i2e22=ti2[8];

	        var frequency1=this.limitMotor1.frequency;
	        var frequency2=this.limitMotor2.frequency;
	        var frequency3=this.limitMotor3.frequency;
	        var enableSpring1=frequency1>0;
	        var enableSpring2=frequency2>0;
	        var enableSpring3=frequency3>0;
	        var enableLimit1=this.lowerLimit1<=this.upperLimit1;
	        var enableLimit2=this.lowerLimit2<=this.upperLimit2;
	        var enableLimit3=this.lowerLimit3<=this.upperLimit3;
	        var angle1=this.limitMotor1.angle;
	        if(enableLimit1){
	            if(this.lowerLimit1==this.upperLimit1){
	                if(this.limitState1!=0){
	                    this.limitState1=0;
	                    this.limitImpulse1=0;
	                }
	                this.limitVelocity1=this.lowerLimit1-angle1;
	            }else if(angle1<this.lowerLimit1){
	                if(this.limitState1!=-1){
	                    this.limitState1=-1;
	                    this.limitImpulse1=0;
	                }
	                this.limitVelocity1=this.lowerLimit1-angle1;
	            }else if(angle1>this.upperLimit1){
	                if(this.limitState1!=1){
	                    this.limitState1=1;
	                    this.limitImpulse1=0;
	                }
	                this.limitVelocity1=this.upperLimit1-angle1;
	            }else{
	                this.limitState1=2;
	                this.limitImpulse1=0;
	                this.limitVelocity1=0;
	            }
	            if(!enableSpring1){
	                if(this.limitVelocity1>0.02)this.limitVelocity1-=0.02;
	                else if(this.limitVelocity1<-0.02)this.limitVelocity1+=0.02;
	                else this.limitVelocity1=0;
	            }
	        }else{
	            this.limitState1=2;
	            this.limitImpulse1=0;
	        }

	        var angle2=this.limitMotor2.angle;
	        if(enableLimit2){
	            if(this.lowerLimit2==this.upperLimit2){
	                if(this.limitState2!=0){
	                    this.limitState2=0;
	                    this.limitImpulse2=0;
	                }
	                this.limitVelocity2=this.lowerLimit2-angle2;
	            }else if(angle2<this.lowerLimit2){
	                if(this.limitState2!=-1){
	                    this.limitState2=-1;
	                    this.limitImpulse2=0;
	                }
	                this.limitVelocity2=this.lowerLimit2-angle2;
	            }else if(angle2>this.upperLimit2){
	                if(this.limitState2!=1){
	                    this.limitState2=1;
	                    this.limitImpulse2=0;
	                }
	                this.limitVelocity2=this.upperLimit2-angle2;
	            }else{
	                this.limitState2=2;
	                this.limitImpulse2=0;
	                this.limitVelocity2=0;
	            }
	            if(!enableSpring2){
	                if(this.limitVelocity2>0.02)this.limitVelocity2-=0.02;
	                else if(this.limitVelocity2<-0.02)this.limitVelocity2+=0.02;
	                else this.limitVelocity2=0;
	            }
	        }else{
	            this.limitState2=2;
	            this.limitImpulse2=0;
	        }

	        var angle3=this.limitMotor3.angle;
	        if(enableLimit3){
	            if(this.lowerLimit3==this.upperLimit3){
	                if(this.limitState3!=0){
	                    this.limitState3=0;
	                    this.limitImpulse3=0;
	                }
	                this.limitVelocity3=this.lowerLimit3-angle3;
	            }else if(angle3<this.lowerLimit3){
	                if(this.limitState3!=-1){
	                    this.limitState3=-1;
	                    this.limitImpulse3=0;
	                }
	                this.limitVelocity3=this.lowerLimit3-angle3;
	            }else if(angle3>this.upperLimit3){
	                if(this.limitState3!=1){
	                    this.limitState3=1;
	                    this.limitImpulse3=0;
	                }
	                this.limitVelocity3=this.upperLimit3-angle3;
	            }else{
	                this.limitState3=2;
	                this.limitImpulse3=0;
	                this.limitVelocity3=0;
	                }
	            if(!enableSpring3){
	                if(this.limitVelocity3>0.02)this.limitVelocity3-=0.02;
	                else if(this.limitVelocity3<-0.02)this.limitVelocity3+=0.02;
	                else this.limitVelocity3=0;
	            }
	        }else{
	            this.limitState3=2;
	            this.limitImpulse3=0;
	        }

	        if(this.enableMotor1&&(this.limitState1!=0||enableSpring1)){
	            this.maxMotorImpulse1=this.maxMotorForce1*timeStep;
	        }else{
	            this.motorImpulse1=0;
	            this.maxMotorImpulse1=0;
	        }
	        if(this.enableMotor2&&(this.limitState2!=0||enableSpring2)){
	            this.maxMotorImpulse2=this.maxMotorForce2*timeStep;
	        }else{
	            this.motorImpulse2=0;
	            this.maxMotorImpulse2=0;
	        }
	        if(this.enableMotor3&&(this.limitState3!=0||enableSpring3)){
	            this.maxMotorImpulse3=this.maxMotorForce3*timeStep;
	        }else{
	            this.motorImpulse3=0;
	            this.maxMotorImpulse3=0;
	        }

	        // build jacobians
	        this.a1x1=this.ax1*this.i1e00+this.ay1*this.i1e01+this.az1*this.i1e02;
	        this.a1y1=this.ax1*this.i1e10+this.ay1*this.i1e11+this.az1*this.i1e12;
	        this.a1z1=this.ax1*this.i1e20+this.ay1*this.i1e21+this.az1*this.i1e22;
	        this.a2x1=this.ax1*this.i2e00+this.ay1*this.i2e01+this.az1*this.i2e02;
	        this.a2y1=this.ax1*this.i2e10+this.ay1*this.i2e11+this.az1*this.i2e12;
	        this.a2z1=this.ax1*this.i2e20+this.ay1*this.i2e21+this.az1*this.i2e22;

	        this.a1x2=this.ax2*this.i1e00+this.ay2*this.i1e01+this.az2*this.i1e02;
	        this.a1y2=this.ax2*this.i1e10+this.ay2*this.i1e11+this.az2*this.i1e12;
	        this.a1z2=this.ax2*this.i1e20+this.ay2*this.i1e21+this.az2*this.i1e22;
	        this.a2x2=this.ax2*this.i2e00+this.ay2*this.i2e01+this.az2*this.i2e02;
	        this.a2y2=this.ax2*this.i2e10+this.ay2*this.i2e11+this.az2*this.i2e12;
	        this.a2z2=this.ax2*this.i2e20+this.ay2*this.i2e21+this.az2*this.i2e22;

	        this.a1x3=this.ax3*this.i1e00+this.ay3*this.i1e01+this.az3*this.i1e02;
	        this.a1y3=this.ax3*this.i1e10+this.ay3*this.i1e11+this.az3*this.i1e12;
	        this.a1z3=this.ax3*this.i1e20+this.ay3*this.i1e21+this.az3*this.i1e22;
	        this.a2x3=this.ax3*this.i2e00+this.ay3*this.i2e01+this.az3*this.i2e02;
	        this.a2y3=this.ax3*this.i2e10+this.ay3*this.i2e11+this.az3*this.i2e12;
	        this.a2z3=this.ax3*this.i2e20+this.ay3*this.i2e21+this.az3*this.i2e22;

	        // build an impulse matrix
	        this.k00=this.ax1*(this.a1x1+this.a2x1)+this.ay1*(this.a1y1+this.a2y1)+this.az1*(this.a1z1+this.a2z1);
	        this.k01=this.ax1*(this.a1x2+this.a2x2)+this.ay1*(this.a1y2+this.a2y2)+this.az1*(this.a1z2+this.a2z2);
	        this.k02=this.ax1*(this.a1x3+this.a2x3)+this.ay1*(this.a1y3+this.a2y3)+this.az1*(this.a1z3+this.a2z3);
	        this.k10=this.ax2*(this.a1x1+this.a2x1)+this.ay2*(this.a1y1+this.a2y1)+this.az2*(this.a1z1+this.a2z1);
	        this.k11=this.ax2*(this.a1x2+this.a2x2)+this.ay2*(this.a1y2+this.a2y2)+this.az2*(this.a1z2+this.a2z2);
	        this.k12=this.ax2*(this.a1x3+this.a2x3)+this.ay2*(this.a1y3+this.a2y3)+this.az2*(this.a1z3+this.a2z3);
	        this.k20=this.ax3*(this.a1x1+this.a2x1)+this.ay3*(this.a1y1+this.a2y1)+this.az3*(this.a1z1+this.a2z1);
	        this.k21=this.ax3*(this.a1x2+this.a2x2)+this.ay3*(this.a1y2+this.a2y2)+this.az3*(this.a1z2+this.a2z2);
	        this.k22=this.ax3*(this.a1x3+this.a2x3)+this.ay3*(this.a1y3+this.a2y3)+this.az3*(this.a1z3+this.a2z3);

	        this.kv00=this.k00;
	        this.kv11=this.k11;
	        this.kv22=this.k22;
	        this.dv00=1/this.kv00;
	        this.dv11=1/this.kv11;
	        this.dv22=1/this.kv22;

	        if(enableSpring1&&this.limitState1!=2){
	            var omega=6.2831853*frequency1;
	            var k=omega*omega*timeStep;
	            var dmp=invTimeStep/(k+2*this.limitMotor1.dampingRatio*omega);
	            this.cfm1=this.kv00*dmp;
	            this.limitVelocity1*=k*dmp;
	        }else{
	            this.cfm1=0;
	            this.limitVelocity1*=invTimeStep*0.05;
	        }

	        if(enableSpring2&&this.limitState2!=2){
	            omega=6.2831853*frequency2;
	            k=omega*omega*timeStep;
	            dmp=invTimeStep/(k+2*this.limitMotor2.dampingRatio*omega);
	            this.cfm2=this.kv11*dmp;
	            this.limitVelocity2*=k*dmp;
	        }else{
	            this.cfm2=0;
	            this.limitVelocity2*=invTimeStep*0.05;
	        }

	        if(enableSpring3&&this.limitState3!=2){
	            omega=6.2831853*frequency3;
	            k=omega*omega*timeStep;
	            dmp=invTimeStep/(k+2*this.limitMotor3.dampingRatio*omega);
	            this.cfm3=this.kv22*dmp;
	            this.limitVelocity3*=k*dmp;
	        }else{
	            this.cfm3=0;
	            this.limitVelocity3*=invTimeStep*0.05;
	        }

	        this.k00+=this.cfm1;
	        this.k11+=this.cfm2;
	        this.k22+=this.cfm3;

	        var inv=1/(
	        this.k00*(this.k11*this.k22-this.k21*this.k12)+
	        this.k10*(this.k21*this.k02-this.k01*this.k22)+
	        this.k20*(this.k01*this.k12-this.k11*this.k02)
	        );
	        this.d00=(this.k11*this.k22-this.k12*this.k21)*inv;
	        this.d01=(this.k02*this.k21-this.k01*this.k22)*inv;
	        this.d02=(this.k01*this.k12-this.k02*this.k11)*inv;
	        this.d10=(this.k12*this.k20-this.k10*this.k22)*inv;
	        this.d11=(this.k00*this.k22-this.k02*this.k20)*inv;
	        this.d12=(this.k02*this.k10-this.k00*this.k12)*inv;
	        this.d20=(this.k10*this.k21-this.k11*this.k20)*inv;
	        this.d21=(this.k01*this.k20-this.k00*this.k21)*inv;
	        this.d22=(this.k00*this.k11-this.k01*this.k10)*inv;
	        
	        this.limitImpulse1*=0.95;
	        this.motorImpulse1*=0.95;
	        this.limitImpulse2*=0.95;
	        this.motorImpulse2*=0.95;
	        this.limitImpulse3*=0.95;
	        this.motorImpulse3*=0.95;
	        var totalImpulse1=this.limitImpulse1+this.motorImpulse1;
	        var totalImpulse2=this.limitImpulse2+this.motorImpulse2;
	        var totalImpulse3=this.limitImpulse3+this.motorImpulse3;
	        this.a1.x+=totalImpulse1*this.a1x1+totalImpulse2*this.a1x2+totalImpulse3*this.a1x3;
	        this.a1.y+=totalImpulse1*this.a1y1+totalImpulse2*this.a1y2+totalImpulse3*this.a1y3;
	        this.a1.z+=totalImpulse1*this.a1z1+totalImpulse2*this.a1z2+totalImpulse3*this.a1z3;
	        this.a2.x-=totalImpulse1*this.a2x1+totalImpulse2*this.a2x2+totalImpulse3*this.a2x3;
	        this.a2.y-=totalImpulse1*this.a2y1+totalImpulse2*this.a2y2+totalImpulse3*this.a2y3;
	        this.a2.z-=totalImpulse1*this.a2z1+totalImpulse2*this.a2z2+totalImpulse3*this.a2z3;
	    },
	    solve_:function(){

	        var rvx=this.a2.x-this.a1.x;
	        var rvy=this.a2.y-this.a1.y;
	        var rvz=this.a2.z-this.a1.z;

	        this.limitVelocity3=30;
	        var rvn1=rvx*this.ax1+rvy*this.ay1+rvz*this.az1-this.limitVelocity1;
	        var rvn2=rvx*this.ax2+rvy*this.ay2+rvz*this.az2-this.limitVelocity2;
	        var rvn3=rvx*this.ax3+rvy*this.ay3+rvz*this.az3-this.limitVelocity3;

	        var dLimitImpulse1=rvn1*this.d00+rvn2*this.d01+rvn3*this.d02;
	        var dLimitImpulse2=rvn1*this.d10+rvn2*this.d11+rvn3*this.d12;
	        var dLimitImpulse3=rvn1*this.d20+rvn2*this.d21+rvn3*this.d22;

	        this.limitImpulse1+=dLimitImpulse1;
	        this.limitImpulse2+=dLimitImpulse2;
	        this.limitImpulse3+=dLimitImpulse3;

	        this.a1.x+=dLimitImpulse1*this.a1x1+dLimitImpulse2*this.a1x2+dLimitImpulse3*this.a1x3;
	        this.a1.y+=dLimitImpulse1*this.a1y1+dLimitImpulse2*this.a1y2+dLimitImpulse3*this.a1y3;
	        this.a1.z+=dLimitImpulse1*this.a1z1+dLimitImpulse2*this.a1z2+dLimitImpulse3*this.a1z3;
	        this.a2.x-=dLimitImpulse1*this.a2x1+dLimitImpulse2*this.a2x2+dLimitImpulse3*this.a2x3;
	        this.a2.y-=dLimitImpulse1*this.a2y1+dLimitImpulse2*this.a2y2+dLimitImpulse3*this.a2y3;
	        this.a2.z-=dLimitImpulse1*this.a2z1+dLimitImpulse2*this.a2z2+dLimitImpulse3*this.a2z3;
	    },
	    solve:function(){

	        var rvx=this.a2.x-this.a1.x;
	        var rvy=this.a2.y-this.a1.y;
	        var rvz=this.a2.z-this.a1.z;

	        var rvn1=rvx*this.ax1+rvy*this.ay1+rvz*this.az1;
	        var rvn2=rvx*this.ax2+rvy*this.ay2+rvz*this.az2;
	        var rvn3=rvx*this.ax3+rvy*this.ay3+rvz*this.az3;

	        var oldMotorImpulse1=this.motorImpulse1;
	        var oldMotorImpulse2=this.motorImpulse2;
	        var oldMotorImpulse3=this.motorImpulse3;

	        var dMotorImpulse1=0;
	        var dMotorImpulse2=0;
	        var dMotorImpulse3=0;

	        if(this.enableMotor1){
	            dMotorImpulse1=(rvn1-this.motorSpeed1)*this.dv00;
	            this.motorImpulse1+=dMotorImpulse1;
	            if(this.motorImpulse1>this.maxMotorImpulse1){ // clamp motor impulse
	            this.motorImpulse1=this.maxMotorImpulse1;
	            }else if(this.motorImpulse1<-this.maxMotorImpulse1){
	            this.motorImpulse1=-this.maxMotorImpulse1;
	            }
	            dMotorImpulse1=this.motorImpulse1-oldMotorImpulse1;
	        }
	        if(this.enableMotor2){
	            dMotorImpulse2=(rvn2-this.motorSpeed2)*this.dv11;
	            this.motorImpulse2+=dMotorImpulse2;
	            if(this.motorImpulse2>this.maxMotorImpulse2){ // clamp motor impulse
	                this.motorImpulse2=this.maxMotorImpulse2;
	            }else if(this.motorImpulse2<-this.maxMotorImpulse2){
	                this.motorImpulse2=-this.maxMotorImpulse2;
	            }
	            dMotorImpulse2=this.motorImpulse2-oldMotorImpulse2;
	        }
	        if(this.enableMotor3){
	            dMotorImpulse3=(rvn3-this.motorSpeed3)*this.dv22;
	            this.motorImpulse3+=dMotorImpulse3;
	            if(this.motorImpulse3>this.maxMotorImpulse3){ // clamp motor impulse
	                this.motorImpulse3=this.maxMotorImpulse3;
	            }else if(this.motorImpulse3<-this.maxMotorImpulse3){
	                this.motorImpulse3=-this.maxMotorImpulse3;
	            }
	            dMotorImpulse3=this.motorImpulse3-oldMotorImpulse3;
	        }

	        // apply motor impulse to relative velocity
	        rvn1+=dMotorImpulse1*this.kv00+dMotorImpulse2*this.k01+dMotorImpulse3*this.k02;
	        rvn2+=dMotorImpulse1*this.k10+dMotorImpulse2*this.kv11+dMotorImpulse3*this.k12;
	        rvn3+=dMotorImpulse1*this.k20+dMotorImpulse2*this.k21+dMotorImpulse3*this.kv22;

	        // subtract target velocity and applied impulse
	        rvn1-=this.limitVelocity1+this.limitImpulse1*this.cfm1;
	        rvn2-=this.limitVelocity2+this.limitImpulse2*this.cfm2;
	        rvn3-=this.limitVelocity3+this.limitImpulse3*this.cfm3;

	        var oldLimitImpulse1=this.limitImpulse1;
	        var oldLimitImpulse2=this.limitImpulse2;
	        var oldLimitImpulse3=this.limitImpulse3;

	        var dLimitImpulse1=rvn1*this.d00+rvn2*this.d01+rvn3*this.d02;
	        var dLimitImpulse2=rvn1*this.d10+rvn2*this.d11+rvn3*this.d12;
	        var dLimitImpulse3=rvn1*this.d20+rvn2*this.d21+rvn3*this.d22;

	        this.limitImpulse1+=dLimitImpulse1;
	        this.limitImpulse2+=dLimitImpulse2;
	        this.limitImpulse3+=dLimitImpulse3;

	        // clamp
	        var clampState=0;
	        if(this.limitState1==2||this.limitImpulse1*this.limitState1<0){
	            dLimitImpulse1=-oldLimitImpulse1;
	            rvn2+=dLimitImpulse1*this.k10;
	            rvn3+=dLimitImpulse1*this.k20;
	            clampState|=1;
	        }
	        if(this.limitState2==2||this.limitImpulse2*this.limitState2<0){
	            dLimitImpulse2=-oldLimitImpulse2;
	            rvn1+=dLimitImpulse2*this.k01;
	            rvn3+=dLimitImpulse2*this.k21;
	            clampState|=2;
	        }
	        if(this.limitState3==2||this.limitImpulse3*this.limitState3<0){
	            dLimitImpulse3=-oldLimitImpulse3;
	            rvn1+=dLimitImpulse3*this.k02;
	            rvn2+=dLimitImpulse3*this.k12;
	            clampState|=4;
	        }

	        // update un-clamped impulse
	        // TODO: isolate division
	        var det;
	        switch(clampState){
	            case 1: // update 2 3
	            det=1/(this.k11*this.k22-this.k12*this.k21);
	            dLimitImpulse2=(this.k22*rvn2+-this.k12*rvn3)*det;
	            dLimitImpulse3=(-this.k21*rvn2+this.k11*rvn3)*det;
	            break;
	            case 2: // update 1 3
	            det=1/(this.k00*this.k22-this.k02*this.k20);
	            dLimitImpulse1=(this.k22*rvn1+-this.k02*rvn3)*det;
	            dLimitImpulse3=(-this.k20*rvn1+this.k00*rvn3)*det;
	            break;
	            case 3: // update 3
	            dLimitImpulse3=rvn3/this.k22;
	            break;
	            case 4: // update 1 2
	            det=1/(this.k00*this.k11-this.k01*this.k10);
	            dLimitImpulse1=(this.k11*rvn1+-this.k01*rvn2)*det;
	            dLimitImpulse2=(-this.k10*rvn1+this.k00*rvn2)*det;
	            break;
	            case 5: // update 2
	            dLimitImpulse2=rvn2/this.k11;
	            break;
	            case 6: // update 1
	            dLimitImpulse1=rvn1/this.k00;
	            break;
	        }

	        this.limitImpulse1=dLimitImpulse1+oldLimitImpulse1;
	        this.limitImpulse2=dLimitImpulse2+oldLimitImpulse2;
	        this.limitImpulse3=dLimitImpulse3+oldLimitImpulse3;

	        var dImpulse1=dMotorImpulse1+dLimitImpulse1;
	        var dImpulse2=dMotorImpulse2+dLimitImpulse2;
	        var dImpulse3=dMotorImpulse3+dLimitImpulse3;

	        // apply impulse
	        this.a1.x+=dImpulse1*this.a1x1+dImpulse2*this.a1x2+dImpulse3*this.a1x3;
	        this.a1.y+=dImpulse1*this.a1y1+dImpulse2*this.a1y2+dImpulse3*this.a1y3;
	        this.a1.z+=dImpulse1*this.a1z1+dImpulse2*this.a1z2+dImpulse3*this.a1z3;
	        this.a2.x-=dImpulse1*this.a2x1+dImpulse2*this.a2x2+dImpulse3*this.a2x3;
	        this.a2.y-=dImpulse1*this.a2y1+dImpulse2*this.a2y2+dImpulse3*this.a2y3;
	        this.a2.z-=dImpulse1*this.a2z1+dImpulse2*this.a2z2+dImpulse3*this.a2z3;
	        rvx=this.a2.x-this.a1.x;
	        rvy=this.a2.y-this.a1.y;
	        rvz=this.a2.z-this.a1.z;

	        rvn2=rvx*this.ax2+rvy*this.ay2+rvz*this.az2;
	    }
	    
	} );

	/**
	 * A hinge joint allows only for relative rotation of rigid bodies along the axis.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function HingeJoint ( config, lowerAngleLimit, upperAngleLimit ) {

	    Joint.call( this, config );

	    this.type = JOINT_HINGE;

	    // The axis in the first body's coordinate system.
	    this.localAxis1 = config.localAxis1.clone().normalize();
	    // The axis in the second body's coordinate system.
	    this.localAxis2 = config.localAxis2.clone().normalize();

	    // make angle axis
	    var arc = new Mat33().setQuat( new Quat().setFromUnitVectors( this.localAxis1, this.localAxis2 ) );
	    this.localAngle1 = new Vec3().tangent( this.localAxis1 ).normalize();
	    this.localAngle2 = this.localAngle1.clone().applyMatrix3( arc, true );

	    this.ax1 = new Vec3();
	    this.ax2 = new Vec3();
	    this.an1 = new Vec3();
	    this.an2 = new Vec3();

	    this.tmp = new Vec3();

	    this.nor = new Vec3();
	    this.tan = new Vec3();
	    this.bin = new Vec3();

	    // The rotational limit and motor information of the joint.
	    this.limitMotor = new LimitMotor( this.nor, false );
	    this.limitMotor.lowerLimit = lowerAngleLimit;
	    this.limitMotor.upperLimit = upperAngleLimit;

	    this.lc = new LinearConstraint( this );
	    this.r3 = new Rotational3Constraint( this, this.limitMotor, new LimitMotor( this.tan, true ), new LimitMotor( this.bin, true ) );
	}

	HingeJoint.prototype = Object.assign( Object.create( Joint.prototype ), {

	    constructor: HingeJoint,


	    preSolve: function ( timeStep, invTimeStep ) {

	        this.updateAnchorPoints();

	        this.ax1.copy( this.localAxis1 ).applyMatrix3( this.body1.rotation, true );
	        this.ax2.copy( this.localAxis2 ).applyMatrix3( this.body2.rotation, true );

	        this.an1.copy( this.localAngle1 ).applyMatrix3( this.body1.rotation, true );
	        this.an2.copy( this.localAngle2 ).applyMatrix3( this.body2.rotation, true );

	        // normal tangent binormal

	        this.nor.set(
	            this.ax1.x*this.body2.inverseMass + this.ax2.x*this.body1.inverseMass,
	            this.ax1.y*this.body2.inverseMass + this.ax2.y*this.body1.inverseMass,
	            this.ax1.z*this.body2.inverseMass + this.ax2.z*this.body1.inverseMass
	        ).normalize();

	        this.tan.tangent( this.nor ).normalize();

	        this.bin.crossVectors( this.nor, this.tan );

	        // calculate hinge angle

	        var limite = _Math.acosClamp( _Math.dotVectors( this.an1, this.an2 ) );

	        this.tmp.crossVectors( this.an1, this.an2 );

	        if( _Math.dotVectors( this.nor, this.tmp ) < 0 ) this.limitMotor.angle = -limite;
	        else this.limitMotor.angle = limite;

	        this.tmp.crossVectors( this.ax1, this.ax2 );

	        this.r3.limitMotor2.angle = _Math.dotVectors( this.tan, this.tmp );
	        this.r3.limitMotor3.angle = _Math.dotVectors( this.bin, this.tmp );

	        // preSolve
	        
	        this.r3.preSolve( timeStep, invTimeStep );
	        this.lc.preSolve( timeStep, invTimeStep );

	    },

	    solve: function () {

	        this.r3.solve();
	        this.lc.solve();

	    },

	    postSolve: function () {

	    }

	});

	/**
	 * A ball-and-socket joint limits relative translation on two anchor points on rigid bodies.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function BallAndSocketJoint ( config ){

	    Joint.call( this, config );

	    this.type = JOINT_BALL_AND_SOCKET;
	    
	    this.lc = new LinearConstraint( this );

	}

	BallAndSocketJoint.prototype = Object.assign( Object.create( Joint.prototype ), {

	    constructor: BallAndSocketJoint,

	    preSolve: function ( timeStep, invTimeStep ) {

	        this.updateAnchorPoints();

	        // preSolve

	        this.lc.preSolve( timeStep, invTimeStep );

	    },

	    solve: function () {

	        this.lc.solve();

	    },

	    postSolve: function () {

	    }

	});

	/**
	* A translational constraint for various joints.
	* @author saharan
	*/
	function TranslationalConstraint ( joint, limitMotor ){
	    this.cfm=NaN;
	    this.m1=NaN;
	    this.m2=NaN;
	    this.i1e00=NaN;
	    this.i1e01=NaN;
	    this.i1e02=NaN;
	    this.i1e10=NaN;
	    this.i1e11=NaN;
	    this.i1e12=NaN;
	    this.i1e20=NaN;
	    this.i1e21=NaN;
	    this.i1e22=NaN;
	    this.i2e00=NaN;
	    this.i2e01=NaN;
	    this.i2e02=NaN;
	    this.i2e10=NaN;
	    this.i2e11=NaN;
	    this.i2e12=NaN;
	    this.i2e20=NaN;
	    this.i2e21=NaN;
	    this.i2e22=NaN;
	    this.motorDenom=NaN;
	    this.invMotorDenom=NaN;
	    this.invDenom=NaN;
	    this.ax=NaN;
	    this.ay=NaN;
	    this.az=NaN;
	    this.r1x=NaN;
	    this.r1y=NaN;
	    this.r1z=NaN;
	    this.r2x=NaN;
	    this.r2y=NaN;
	    this.r2z=NaN;
	    this.t1x=NaN;
	    this.t1y=NaN;
	    this.t1z=NaN;
	    this.t2x=NaN;
	    this.t2y=NaN;
	    this.t2z=NaN;
	    this.l1x=NaN;
	    this.l1y=NaN;
	    this.l1z=NaN;
	    this.l2x=NaN;
	    this.l2y=NaN;
	    this.l2z=NaN;
	    this.a1x=NaN;
	    this.a1y=NaN;
	    this.a1z=NaN;
	    this.a2x=NaN;
	    this.a2y=NaN;
	    this.a2z=NaN;
	    this.lowerLimit=NaN;
	    this.upperLimit=NaN;
	    this.limitVelocity=NaN;
	    this.limitState=0; // -1: at lower, 0: locked, 1: at upper, 2: free
	    this.enableMotor=false;
	    this.motorSpeed=NaN;
	    this.maxMotorForce=NaN;
	    this.maxMotorImpulse=NaN;

	    this.limitMotor=limitMotor;
	    this.b1=joint.body1;
	    this.b2=joint.body2;
	    this.p1=joint.anchorPoint1;
	    this.p2=joint.anchorPoint2;
	    this.r1=joint.relativeAnchorPoint1;
	    this.r2=joint.relativeAnchorPoint2;
	    this.l1=this.b1.linearVelocity;
	    this.l2=this.b2.linearVelocity;
	    this.a1=this.b1.angularVelocity;
	    this.a2=this.b2.angularVelocity;
	    this.i1=this.b1.inverseInertia;
	    this.i2=this.b2.inverseInertia;
	    this.limitImpulse=0;
	    this.motorImpulse=0;
	}

	Object.assign( TranslationalConstraint.prototype, {

	    TranslationalConstraint: true,

	    preSolve:function(timeStep,invTimeStep){
	        this.ax=this.limitMotor.axis.x;
	        this.ay=this.limitMotor.axis.y;
	        this.az=this.limitMotor.axis.z;
	        this.lowerLimit=this.limitMotor.lowerLimit;
	        this.upperLimit=this.limitMotor.upperLimit;
	        this.motorSpeed=this.limitMotor.motorSpeed;
	        this.maxMotorForce=this.limitMotor.maxMotorForce;
	        this.enableMotor=this.maxMotorForce>0;
	        this.m1=this.b1.inverseMass;
	        this.m2=this.b2.inverseMass;

	        var ti1 = this.i1.elements;
	        var ti2 = this.i2.elements;
	        this.i1e00=ti1[0];
	        this.i1e01=ti1[1];
	        this.i1e02=ti1[2];
	        this.i1e10=ti1[3];
	        this.i1e11=ti1[4];
	        this.i1e12=ti1[5];
	        this.i1e20=ti1[6];
	        this.i1e21=ti1[7];
	        this.i1e22=ti1[8];

	        this.i2e00=ti2[0];
	        this.i2e01=ti2[1];
	        this.i2e02=ti2[2];
	        this.i2e10=ti2[3];
	        this.i2e11=ti2[4];
	        this.i2e12=ti2[5];
	        this.i2e20=ti2[6];
	        this.i2e21=ti2[7];
	        this.i2e22=ti2[8];

	        var dx=this.p2.x-this.p1.x;
	        var dy=this.p2.y-this.p1.y;
	        var dz=this.p2.z-this.p1.z;
	        var d=dx*this.ax+dy*this.ay+dz*this.az;
	        var frequency=this.limitMotor.frequency;
	        var enableSpring=frequency>0;
	        var enableLimit=this.lowerLimit<=this.upperLimit;
	        if(enableSpring&&d>20||d<-20){
	            enableSpring=false;
	        }

	        if(enableLimit){
	            if(this.lowerLimit==this.upperLimit){
	                if(this.limitState!=0){
	                    this.limitState=0;
	                    this.limitImpulse=0;
	                }
	                this.limitVelocity=this.lowerLimit-d;
	                if(!enableSpring)d=this.lowerLimit;
	            }else if(d<this.lowerLimit){
	                if(this.limitState!=-1){
	                    this.limitState=-1;
	                    this.limitImpulse=0;
	                }
	                this.limitVelocity=this.lowerLimit-d;
	                if(!enableSpring)d=this.lowerLimit;
	            }else if(d>this.upperLimit){
	                if(this.limitState!=1){
	                    this.limitState=1;
	                    this.limitImpulse=0;
	                }
	                this.limitVelocity=this.upperLimit-d;
	                if(!enableSpring)d=this.upperLimit;
	            }else{
	                this.limitState=2;
	                this.limitImpulse=0;
	                this.limitVelocity=0;
	            }
	            if(!enableSpring){
	                if(this.limitVelocity>0.005)this.limitVelocity-=0.005;
	                else if(this.limitVelocity<-0.005)this.limitVelocity+=0.005;
	                else this.limitVelocity=0;
	            }
	        }else{
	            this.limitState=2;
	            this.limitImpulse=0;
	        }

	        if(this.enableMotor&&(this.limitState!=0||enableSpring)){
	            this.maxMotorImpulse=this.maxMotorForce*timeStep;
	        }else{
	            this.motorImpulse=0;
	            this.maxMotorImpulse=0;
	        }

	        var rdx=d*this.ax;
	        var rdy=d*this.ay;
	        var rdz=d*this.az;
	        var w1=this.m1/(this.m1+this.m2);
	        var w2=1-w1;
	        this.r1x=this.r1.x+rdx*w1;
	        this.r1y=this.r1.y+rdy*w1;
	        this.r1z=this.r1.z+rdz*w1;
	        this.r2x=this.r2.x-rdx*w2;
	        this.r2y=this.r2.y-rdy*w2;
	        this.r2z=this.r2.z-rdz*w2;

	        this.t1x=this.r1y*this.az-this.r1z*this.ay;
	        this.t1y=this.r1z*this.ax-this.r1x*this.az;
	        this.t1z=this.r1x*this.ay-this.r1y*this.ax;
	        this.t2x=this.r2y*this.az-this.r2z*this.ay;
	        this.t2y=this.r2z*this.ax-this.r2x*this.az;
	        this.t2z=this.r2x*this.ay-this.r2y*this.ax;
	        this.l1x=this.ax*this.m1;
	        this.l1y=this.ay*this.m1;
	        this.l1z=this.az*this.m1;
	        this.l2x=this.ax*this.m2;
	        this.l2y=this.ay*this.m2;
	        this.l2z=this.az*this.m2;
	        this.a1x=this.t1x*this.i1e00+this.t1y*this.i1e01+this.t1z*this.i1e02;
	        this.a1y=this.t1x*this.i1e10+this.t1y*this.i1e11+this.t1z*this.i1e12;
	        this.a1z=this.t1x*this.i1e20+this.t1y*this.i1e21+this.t1z*this.i1e22;
	        this.a2x=this.t2x*this.i2e00+this.t2y*this.i2e01+this.t2z*this.i2e02;
	        this.a2y=this.t2x*this.i2e10+this.t2y*this.i2e11+this.t2z*this.i2e12;
	        this.a2z=this.t2x*this.i2e20+this.t2y*this.i2e21+this.t2z*this.i2e22;
	        this.motorDenom=
	        this.m1+this.m2+
	            this.ax*(this.a1y*this.r1z-this.a1z*this.r1y+this.a2y*this.r2z-this.a2z*this.r2y)+
	            this.ay*(this.a1z*this.r1x-this.a1x*this.r1z+this.a2z*this.r2x-this.a2x*this.r2z)+
	            this.az*(this.a1x*this.r1y-this.a1y*this.r1x+this.a2x*this.r2y-this.a2y*this.r2x);

	        this.invMotorDenom=1/this.motorDenom;

	        if(enableSpring&&this.limitState!=2){
	            var omega=6.2831853*frequency;
	            var k=omega*omega*timeStep;
	            var dmp=invTimeStep/(k+2*this.limitMotor.dampingRatio*omega);
	            this.cfm=this.motorDenom*dmp;
	            this.limitVelocity*=k*dmp;
	        }else{
	            this.cfm=0;
	            this.limitVelocity*=invTimeStep*0.05;
	        }

	        this.invDenom=1/(this.motorDenom+this.cfm);

	        var totalImpulse=this.limitImpulse+this.motorImpulse;
	        this.l1.x+=totalImpulse*this.l1x;
	        this.l1.y+=totalImpulse*this.l1y;
	        this.l1.z+=totalImpulse*this.l1z;
	        this.a1.x+=totalImpulse*this.a1x;
	        this.a1.y+=totalImpulse*this.a1y;
	        this.a1.z+=totalImpulse*this.a1z;
	        this.l2.x-=totalImpulse*this.l2x;
	        this.l2.y-=totalImpulse*this.l2y;
	        this.l2.z-=totalImpulse*this.l2z;
	        this.a2.x-=totalImpulse*this.a2x;
	        this.a2.y-=totalImpulse*this.a2y;
	        this.a2.z-=totalImpulse*this.a2z;
	    },
	    solve:function(){
	        var rvn=
	            this.ax*(this.l2.x-this.l1.x)+this.ay*(this.l2.y-this.l1.y)+this.az*(this.l2.z-this.l1.z)+
	            this.t2x*this.a2.x-this.t1x*this.a1.x+this.t2y*this.a2.y-this.t1y*this.a1.y+this.t2z*this.a2.z-this.t1z*this.a1.z;

	        // motor part
	        var newMotorImpulse;
	        if(this.enableMotor){
	            newMotorImpulse=(rvn-this.motorSpeed)*this.invMotorDenom;
	            var oldMotorImpulse=this.motorImpulse;
	            this.motorImpulse+=newMotorImpulse;
	            if(this.motorImpulse>this.maxMotorImpulse)this.motorImpulse=this.maxMotorImpulse;
	            else if(this.motorImpulse<-this.maxMotorImpulse)this.motorImpulse=-this.maxMotorImpulse;
	            newMotorImpulse=this.motorImpulse-oldMotorImpulse;
	            rvn-=newMotorImpulse*this.motorDenom;
	        }else newMotorImpulse=0;

	        // limit part
	        var newLimitImpulse;
	        if(this.limitState!=2){
	            newLimitImpulse=(rvn-this.limitVelocity-this.limitImpulse*this.cfm)*this.invDenom;
	            var oldLimitImpulse=this.limitImpulse;
	            this.limitImpulse+=newLimitImpulse;
	            if(this.limitImpulse*this.limitState<0)this.limitImpulse=0;
	            newLimitImpulse=this.limitImpulse-oldLimitImpulse;
	        }else newLimitImpulse=0;
	        
	        var totalImpulse=newLimitImpulse+newMotorImpulse;
	        this.l1.x+=totalImpulse*this.l1x;
	        this.l1.y+=totalImpulse*this.l1y;
	        this.l1.z+=totalImpulse*this.l1z;
	        this.a1.x+=totalImpulse*this.a1x;
	        this.a1.y+=totalImpulse*this.a1y;
	        this.a1.z+=totalImpulse*this.a1z;
	        this.l2.x-=totalImpulse*this.l2x;
	        this.l2.y-=totalImpulse*this.l2y;
	        this.l2.z-=totalImpulse*this.l2z;
	        this.a2.x-=totalImpulse*this.a2x;
	        this.a2.y-=totalImpulse*this.a2y;
	        this.a2.z-=totalImpulse*this.a2z;
	    }
	} );

	/**
	 * A distance joint limits the distance between two anchor points on rigid bodies.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function DistanceJoint ( config, minDistance, maxDistance ){

	    Joint.call( this, config );

	    this.type = JOINT_DISTANCE;
	    
	    this.nor = new Vec3();

	    // The limit and motor information of the joint.
	    this.limitMotor = new LimitMotor( this.nor, true );
	    this.limitMotor.lowerLimit = minDistance;
	    this.limitMotor.upperLimit = maxDistance;

	    this.t = new TranslationalConstraint( this, this.limitMotor );

	}

	DistanceJoint.prototype = Object.assign( Object.create( Joint.prototype ), {

	    constructor: DistanceJoint,

	    preSolve: function ( timeStep, invTimeStep ) {

	        this.updateAnchorPoints();

	        this.nor.sub( this.anchorPoint2, this.anchorPoint1 ).normalize();

	        // preSolve

	        this.t.preSolve( timeStep, invTimeStep );

	    },

	    solve: function () {

	        this.t.solve();

	    },

	    postSolve: function () {

	    }

	});

	/**
	* An angular constraint for all axes for various joints.
	* @author saharan
	*/

	function AngularConstraint( joint, targetOrientation ) {

	    this.joint = joint;

	    this.targetOrientation = new Quat().invert( targetOrientation );

	    this.relativeOrientation = new Quat();

	    this.ii1 = null;
	    this.ii2 = null;
	    this.dd = null;

	    this.vel = new Vec3();
	    this.imp = new Vec3();

	    this.rn0 = new Vec3();
	    this.rn1 = new Vec3();
	    this.rn2 = new Vec3();

	    this.b1 = joint.body1;
	    this.b2 = joint.body2;
	    this.a1 = this.b1.angularVelocity;
	    this.a2 = this.b2.angularVelocity;
	    this.i1 = this.b1.inverseInertia;
	    this.i2 = this.b2.inverseInertia;

	}

	Object.assign( AngularConstraint.prototype, {

	    AngularConstraint: true,

	    preSolve: function ( timeStep, invTimeStep ) {

	        var inv, len, v;

	        this.ii1 = this.i1.clone();
	        this.ii2 = this.i2.clone();

	        v = new Mat33().add(this.ii1, this.ii2).elements;
	        inv = 1/( v[0]*(v[4]*v[8]-v[7]*v[5])  +  v[3]*(v[7]*v[2]-v[1]*v[8])  +  v[6]*(v[1]*v[5]-v[4]*v[2]) );
	        this.dd = new Mat33().set(
	            v[4]*v[8]-v[5]*v[7], v[2]*v[7]-v[1]*v[8], v[1]*v[5]-v[2]*v[4],
	            v[5]*v[6]-v[3]*v[8], v[0]*v[8]-v[2]*v[6], v[2]*v[3]-v[0]*v[5],
	            v[3]*v[7]-v[4]*v[6], v[1]*v[6]-v[0]*v[7], v[0]*v[4]-v[1]*v[3]
	        ).multiplyScalar( inv );
	        
	        this.relativeOrientation.invert( this.b1.orientation ).multiply( this.targetOrientation ).multiply( this.b2.orientation );

	        inv = this.relativeOrientation.w*2;

	        this.vel.copy( this.relativeOrientation ).multiplyScalar( inv );

	        len = this.vel.length();

	        if( len > 0.02 ) {
	            len = (0.02-len)/len*invTimeStep*0.05;
	            this.vel.multiplyScalar( len );
	        }else{
	            this.vel.set(0,0,0);
	        }

	        this.rn1.copy( this.imp ).applyMatrix3( this.ii1, true );
	        this.rn2.copy( this.imp ).applyMatrix3( this.ii2, true );

	        this.a1.add( this.rn1 );
	        this.a2.sub( this.rn2 );

	    },

	    solve: function () {

	        var r = this.a2.clone().sub( this.a1 ).sub( this.vel );

	        this.rn0.copy( r ).applyMatrix3( this.dd, true );
	        this.rn1.copy( this.rn0 ).applyMatrix3( this.ii1, true );
	        this.rn2.copy( this.rn0 ).applyMatrix3( this.ii2, true );

	        this.imp.add( this.rn0 );
	        this.a1.add( this.rn1 );
	        this.a2.sub( this.rn2 );

	    }

	} );

	/**
	* A three-axis translational constraint for various joints.
	* @author saharan
	*/
	function Translational3Constraint (joint,limitMotor1,limitMotor2,limitMotor3){

	    this.m1=NaN;
	    this.m2=NaN;
	    this.i1e00=NaN;
	    this.i1e01=NaN;
	    this.i1e02=NaN;
	    this.i1e10=NaN;
	    this.i1e11=NaN;
	    this.i1e12=NaN;
	    this.i1e20=NaN;
	    this.i1e21=NaN;
	    this.i1e22=NaN;
	    this.i2e00=NaN;
	    this.i2e01=NaN;
	    this.i2e02=NaN;
	    this.i2e10=NaN;
	    this.i2e11=NaN;
	    this.i2e12=NaN;
	    this.i2e20=NaN;
	    this.i2e21=NaN;
	    this.i2e22=NaN;
	    this.ax1=NaN;
	    this.ay1=NaN;
	    this.az1=NaN;
	    this.ax2=NaN;
	    this.ay2=NaN;
	    this.az2=NaN;
	    this.ax3=NaN;
	    this.ay3=NaN;
	    this.az3=NaN;
	    this.r1x=NaN;
	    this.r1y=NaN;
	    this.r1z=NaN;
	    this.r2x=NaN;
	    this.r2y=NaN;
	    this.r2z=NaN;
	    this.t1x1=NaN;// jacobians
	    this.t1y1=NaN;
	    this.t1z1=NaN;
	    this.t2x1=NaN;
	    this.t2y1=NaN;
	    this.t2z1=NaN;
	    this.l1x1=NaN;
	    this.l1y1=NaN;
	    this.l1z1=NaN;
	    this.l2x1=NaN;
	    this.l2y1=NaN;
	    this.l2z1=NaN;
	    this.a1x1=NaN;
	    this.a1y1=NaN;
	    this.a1z1=NaN;
	    this.a2x1=NaN;
	    this.a2y1=NaN;
	    this.a2z1=NaN;
	    this.t1x2=NaN;
	    this.t1y2=NaN;
	    this.t1z2=NaN;
	    this.t2x2=NaN;
	    this.t2y2=NaN;
	    this.t2z2=NaN;
	    this.l1x2=NaN;
	    this.l1y2=NaN;
	    this.l1z2=NaN;
	    this.l2x2=NaN;
	    this.l2y2=NaN;
	    this.l2z2=NaN;
	    this.a1x2=NaN;
	    this.a1y2=NaN;
	    this.a1z2=NaN;
	    this.a2x2=NaN;
	    this.a2y2=NaN;
	    this.a2z2=NaN;
	    this.t1x3=NaN;
	    this.t1y3=NaN;
	    this.t1z3=NaN;
	    this.t2x3=NaN;
	    this.t2y3=NaN;
	    this.t2z3=NaN;
	    this.l1x3=NaN;
	    this.l1y3=NaN;
	    this.l1z3=NaN;
	    this.l2x3=NaN;
	    this.l2y3=NaN;
	    this.l2z3=NaN;
	    this.a1x3=NaN;
	    this.a1y3=NaN;
	    this.a1z3=NaN;
	    this.a2x3=NaN;
	    this.a2y3=NaN;
	    this.a2z3=NaN;
	    this.lowerLimit1=NaN;
	    this.upperLimit1=NaN;
	    this.limitVelocity1=NaN;
	    this.limitState1=0; // -1: at lower, 0: locked, 1: at upper, 2: unlimited
	    this.enableMotor1=false;
	    this.motorSpeed1=NaN;
	    this.maxMotorForce1=NaN;
	    this.maxMotorImpulse1=NaN;
	    this.lowerLimit2=NaN;
	    this.upperLimit2=NaN;
	    this.limitVelocity2=NaN;
	    this.limitState2=0; // -1: at lower, 0: locked, 1: at upper, 2: unlimited
	    this.enableMotor2=false;
	    this.motorSpeed2=NaN;
	    this.maxMotorForce2=NaN;
	    this.maxMotorImpulse2=NaN;
	    this.lowerLimit3=NaN;
	    this.upperLimit3=NaN;
	    this.limitVelocity3=NaN;
	    this.limitState3=0; // -1: at lower, 0: locked, 1: at upper, 2: unlimited
	    this.enableMotor3=false;
	    this.motorSpeed3=NaN;
	    this.maxMotorForce3=NaN;
	    this.maxMotorImpulse3=NaN;
	    this.k00=NaN; // K = J*M*JT
	    this.k01=NaN;
	    this.k02=NaN;
	    this.k10=NaN;
	    this.k11=NaN;
	    this.k12=NaN;
	    this.k20=NaN;
	    this.k21=NaN;
	    this.k22=NaN;
	    this.kv00=NaN; // diagonals without CFMs
	    this.kv11=NaN;
	    this.kv22=NaN;
	    this.dv00=NaN; // ...inverted
	    this.dv11=NaN;
	    this.dv22=NaN;
	    this.d00=NaN; // K^-1
	    this.d01=NaN;
	    this.d02=NaN;
	    this.d10=NaN;
	    this.d11=NaN;
	    this.d12=NaN;
	    this.d20=NaN;
	    this.d21=NaN;
	    this.d22=NaN;

	    this.limitMotor1=limitMotor1;
	    this.limitMotor2=limitMotor2;
	    this.limitMotor3=limitMotor3;
	    this.b1=joint.body1;
	    this.b2=joint.body2;
	    this.p1=joint.anchorPoint1;
	    this.p2=joint.anchorPoint2;
	    this.r1=joint.relativeAnchorPoint1;
	    this.r2=joint.relativeAnchorPoint2;
	    this.l1=this.b1.linearVelocity;
	    this.l2=this.b2.linearVelocity;
	    this.a1=this.b1.angularVelocity;
	    this.a2=this.b2.angularVelocity;
	    this.i1=this.b1.inverseInertia;
	    this.i2=this.b2.inverseInertia;
	    this.limitImpulse1=0;
	    this.motorImpulse1=0;
	    this.limitImpulse2=0;
	    this.motorImpulse2=0;
	    this.limitImpulse3=0;
	    this.motorImpulse3=0;
	    this.cfm1=0;// Constraint Force Mixing
	    this.cfm2=0;
	    this.cfm3=0;
	    this.weight=-1;
	}

	Object.assign( Translational3Constraint.prototype, {

	    Translational3Constraint: true,

	    preSolve:function(timeStep,invTimeStep){
	        this.ax1=this.limitMotor1.axis.x;
	        this.ay1=this.limitMotor1.axis.y;
	        this.az1=this.limitMotor1.axis.z;
	        this.ax2=this.limitMotor2.axis.x;
	        this.ay2=this.limitMotor2.axis.y;
	        this.az2=this.limitMotor2.axis.z;
	        this.ax3=this.limitMotor3.axis.x;
	        this.ay3=this.limitMotor3.axis.y;
	        this.az3=this.limitMotor3.axis.z;
	        this.lowerLimit1=this.limitMotor1.lowerLimit;
	        this.upperLimit1=this.limitMotor1.upperLimit;
	        this.motorSpeed1=this.limitMotor1.motorSpeed;
	        this.maxMotorForce1=this.limitMotor1.maxMotorForce;
	        this.enableMotor1=this.maxMotorForce1>0;
	        this.lowerLimit2=this.limitMotor2.lowerLimit;
	        this.upperLimit2=this.limitMotor2.upperLimit;
	        this.motorSpeed2=this.limitMotor2.motorSpeed;
	        this.maxMotorForce2=this.limitMotor2.maxMotorForce;
	        this.enableMotor2=this.maxMotorForce2>0;
	        this.lowerLimit3=this.limitMotor3.lowerLimit;
	        this.upperLimit3=this.limitMotor3.upperLimit;
	        this.motorSpeed3=this.limitMotor3.motorSpeed;
	        this.maxMotorForce3=this.limitMotor3.maxMotorForce;
	        this.enableMotor3=this.maxMotorForce3>0;
	        this.m1=this.b1.inverseMass;
	        this.m2=this.b2.inverseMass;

	        var ti1 = this.i1.elements;
	        var ti2 = this.i2.elements;
	        this.i1e00=ti1[0];
	        this.i1e01=ti1[1];
	        this.i1e02=ti1[2];
	        this.i1e10=ti1[3];
	        this.i1e11=ti1[4];
	        this.i1e12=ti1[5];
	        this.i1e20=ti1[6];
	        this.i1e21=ti1[7];
	        this.i1e22=ti1[8];

	        this.i2e00=ti2[0];
	        this.i2e01=ti2[1];
	        this.i2e02=ti2[2];
	        this.i2e10=ti2[3];
	        this.i2e11=ti2[4];
	        this.i2e12=ti2[5];
	        this.i2e20=ti2[6];
	        this.i2e21=ti2[7];
	        this.i2e22=ti2[8];

	        var dx=this.p2.x-this.p1.x;
	        var dy=this.p2.y-this.p1.y;
	        var dz=this.p2.z-this.p1.z;
	        var d1=dx*this.ax1+dy*this.ay1+dz*this.az1;
	        var d2=dx*this.ax2+dy*this.ay2+dz*this.az2;
	        var d3=dx*this.ax3+dy*this.ay3+dz*this.az3;
	        var frequency1=this.limitMotor1.frequency;
	        var frequency2=this.limitMotor2.frequency;
	        var frequency3=this.limitMotor3.frequency;
	        var enableSpring1=frequency1>0;
	        var enableSpring2=frequency2>0;
	        var enableSpring3=frequency3>0;
	        var enableLimit1=this.lowerLimit1<=this.upperLimit1;
	        var enableLimit2=this.lowerLimit2<=this.upperLimit2;
	        var enableLimit3=this.lowerLimit3<=this.upperLimit3;

	        // for stability
	        if(enableSpring1&&d1>20||d1<-20){
	            enableSpring1=false;
	        }
	        if(enableSpring2&&d2>20||d2<-20){
	            enableSpring2=false;
	        }
	        if(enableSpring3&&d3>20||d3<-20){
	            enableSpring3=false;
	        }

	        if(enableLimit1){
	            if(this.lowerLimit1==this.upperLimit1){
	                if(this.limitState1!=0){
	                    this.limitState1=0;
	                    this.limitImpulse1=0;
	                }
	                this.limitVelocity1=this.lowerLimit1-d1;
	                if(!enableSpring1)d1=this.lowerLimit1;
	            }else if(d1<this.lowerLimit1){
	                if(this.limitState1!=-1){
	                    this.limitState1=-1;
	                    this.limitImpulse1=0;
	                }
	                this.limitVelocity1=this.lowerLimit1-d1;
	                if(!enableSpring1)d1=this.lowerLimit1;
	            }else if(d1>this.upperLimit1){
	                if(this.limitState1!=1){
	                    this.limitState1=1;
	                    this.limitImpulse1=0;
	                }
	                this.limitVelocity1=this.upperLimit1-d1;
	                if(!enableSpring1)d1=this.upperLimit1;
	            }else{
	                this.limitState1=2;
	                this.limitImpulse1=0;
	                this.limitVelocity1=0;
	            }
	            if(!enableSpring1){
	                if(this.limitVelocity1>0.005)this.limitVelocity1-=0.005;
	                else if(this.limitVelocity1<-0.005)this.limitVelocity1+=0.005;
	                else this.limitVelocity1=0;
	            }
	        }else{
	            this.limitState1=2;
	            this.limitImpulse1=0;
	        }

	        if(enableLimit2){
	            if(this.lowerLimit2==this.upperLimit2){
	                if(this.limitState2!=0){
	                    this.limitState2=0;
	                    this.limitImpulse2=0;
	                }
	                this.limitVelocity2=this.lowerLimit2-d2;
	                if(!enableSpring2)d2=this.lowerLimit2;
	            }else if(d2<this.lowerLimit2){
	                if(this.limitState2!=-1){
	                    this.limitState2=-1;
	                    this.limitImpulse2=0;
	                }
	                this.limitVelocity2=this.lowerLimit2-d2;
	                if(!enableSpring2)d2=this.lowerLimit2;
	            }else if(d2>this.upperLimit2){
	                if(this.limitState2!=1){
	                    this.limitState2=1;
	                    this.limitImpulse2=0;
	                }
	                this.limitVelocity2=this.upperLimit2-d2;
	                if(!enableSpring2)d2=this.upperLimit2;
	            }else{
	                this.limitState2=2;
	                this.limitImpulse2=0;
	                this.limitVelocity2=0;
	            }
	            if(!enableSpring2){
	                if(this.limitVelocity2>0.005)this.limitVelocity2-=0.005;
	                else if(this.limitVelocity2<-0.005)this.limitVelocity2+=0.005;
	                else this.limitVelocity2=0;
	            }
	        }else{
	            this.limitState2=2;
	            this.limitImpulse2=0;
	        }

	        if(enableLimit3){
	            if(this.lowerLimit3==this.upperLimit3){
	                if(this.limitState3!=0){
	                    this.limitState3=0;
	                    this.limitImpulse3=0;
	                }
	                this.limitVelocity3=this.lowerLimit3-d3;
	                if(!enableSpring3)d3=this.lowerLimit3;
	                }else if(d3<this.lowerLimit3){
	                if(this.limitState3!=-1){
	                    this.limitState3=-1;
	                    this.limitImpulse3=0;
	                }
	                this.limitVelocity3=this.lowerLimit3-d3;
	                if(!enableSpring3)d3=this.lowerLimit3;
	            }else if(d3>this.upperLimit3){
	                if(this.limitState3!=1){
	                    this.limitState3=1;
	                    this.limitImpulse3=0;
	                }
	                this.limitVelocity3=this.upperLimit3-d3;
	                if(!enableSpring3)d3=this.upperLimit3;
	            }else{
	                this.limitState3=2;
	                this.limitImpulse3=0;
	                this.limitVelocity3=0;
	            }
	            if(!enableSpring3){
	                if(this.limitVelocity3>0.005)this.limitVelocity3-=0.005;
	                else if(this.limitVelocity3<-0.005)this.limitVelocity3+=0.005;
	                else this.limitVelocity3=0;
	            }
	        }else{
	            this.limitState3=2;
	            this.limitImpulse3=0;
	        }

	        if(this.enableMotor1&&(this.limitState1!=0||enableSpring1)){
	            this.maxMotorImpulse1=this.maxMotorForce1*timeStep;
	        }else{
	            this.motorImpulse1=0;
	            this.maxMotorImpulse1=0;
	        }

	        if(this.enableMotor2&&(this.limitState2!=0||enableSpring2)){
	            this.maxMotorImpulse2=this.maxMotorForce2*timeStep;
	        }else{
	            this.motorImpulse2=0;
	            this.maxMotorImpulse2=0;
	        }

	        if(this.enableMotor3&&(this.limitState3!=0||enableSpring3)){
	            this.maxMotorImpulse3=this.maxMotorForce3*timeStep;
	        }else{
	            this.motorImpulse3=0;
	            this.maxMotorImpulse3=0;
	        }
	        
	        var rdx=d1*this.ax1+d2*this.ax2+d3*this.ax2;
	        var rdy=d1*this.ay1+d2*this.ay2+d3*this.ay2;
	        var rdz=d1*this.az1+d2*this.az2+d3*this.az2;
	        var w1=this.m2/(this.m1+this.m2);
	        if(this.weight>=0)w1=this.weight; // use given weight
	        var w2=1-w1;
	        this.r1x=this.r1.x+rdx*w1;
	        this.r1y=this.r1.y+rdy*w1;
	        this.r1z=this.r1.z+rdz*w1;
	        this.r2x=this.r2.x-rdx*w2;
	        this.r2y=this.r2.y-rdy*w2;
	        this.r2z=this.r2.z-rdz*w2;

	        // build jacobians
	        this.t1x1=this.r1y*this.az1-this.r1z*this.ay1;
	        this.t1y1=this.r1z*this.ax1-this.r1x*this.az1;
	        this.t1z1=this.r1x*this.ay1-this.r1y*this.ax1;
	        this.t2x1=this.r2y*this.az1-this.r2z*this.ay1;
	        this.t2y1=this.r2z*this.ax1-this.r2x*this.az1;
	        this.t2z1=this.r2x*this.ay1-this.r2y*this.ax1;
	        this.l1x1=this.ax1*this.m1;
	        this.l1y1=this.ay1*this.m1;
	        this.l1z1=this.az1*this.m1;
	        this.l2x1=this.ax1*this.m2;
	        this.l2y1=this.ay1*this.m2;
	        this.l2z1=this.az1*this.m2;
	        this.a1x1=this.t1x1*this.i1e00+this.t1y1*this.i1e01+this.t1z1*this.i1e02;
	        this.a1y1=this.t1x1*this.i1e10+this.t1y1*this.i1e11+this.t1z1*this.i1e12;
	        this.a1z1=this.t1x1*this.i1e20+this.t1y1*this.i1e21+this.t1z1*this.i1e22;
	        this.a2x1=this.t2x1*this.i2e00+this.t2y1*this.i2e01+this.t2z1*this.i2e02;
	        this.a2y1=this.t2x1*this.i2e10+this.t2y1*this.i2e11+this.t2z1*this.i2e12;
	        this.a2z1=this.t2x1*this.i2e20+this.t2y1*this.i2e21+this.t2z1*this.i2e22;

	        this.t1x2=this.r1y*this.az2-this.r1z*this.ay2;
	        this.t1y2=this.r1z*this.ax2-this.r1x*this.az2;
	        this.t1z2=this.r1x*this.ay2-this.r1y*this.ax2;
	        this.t2x2=this.r2y*this.az2-this.r2z*this.ay2;
	        this.t2y2=this.r2z*this.ax2-this.r2x*this.az2;
	        this.t2z2=this.r2x*this.ay2-this.r2y*this.ax2;
	        this.l1x2=this.ax2*this.m1;
	        this.l1y2=this.ay2*this.m1;
	        this.l1z2=this.az2*this.m1;
	        this.l2x2=this.ax2*this.m2;
	        this.l2y2=this.ay2*this.m2;
	        this.l2z2=this.az2*this.m2;
	        this.a1x2=this.t1x2*this.i1e00+this.t1y2*this.i1e01+this.t1z2*this.i1e02;
	        this.a1y2=this.t1x2*this.i1e10+this.t1y2*this.i1e11+this.t1z2*this.i1e12;
	        this.a1z2=this.t1x2*this.i1e20+this.t1y2*this.i1e21+this.t1z2*this.i1e22;
	        this.a2x2=this.t2x2*this.i2e00+this.t2y2*this.i2e01+this.t2z2*this.i2e02;
	        this.a2y2=this.t2x2*this.i2e10+this.t2y2*this.i2e11+this.t2z2*this.i2e12;
	        this.a2z2=this.t2x2*this.i2e20+this.t2y2*this.i2e21+this.t2z2*this.i2e22;

	        this.t1x3=this.r1y*this.az3-this.r1z*this.ay3;
	        this.t1y3=this.r1z*this.ax3-this.r1x*this.az3;
	        this.t1z3=this.r1x*this.ay3-this.r1y*this.ax3;
	        this.t2x3=this.r2y*this.az3-this.r2z*this.ay3;
	        this.t2y3=this.r2z*this.ax3-this.r2x*this.az3;
	        this.t2z3=this.r2x*this.ay3-this.r2y*this.ax3;
	        this.l1x3=this.ax3*this.m1;
	        this.l1y3=this.ay3*this.m1;
	        this.l1z3=this.az3*this.m1;
	        this.l2x3=this.ax3*this.m2;
	        this.l2y3=this.ay3*this.m2;
	        this.l2z3=this.az3*this.m2;
	        this.a1x3=this.t1x3*this.i1e00+this.t1y3*this.i1e01+this.t1z3*this.i1e02;
	        this.a1y3=this.t1x3*this.i1e10+this.t1y3*this.i1e11+this.t1z3*this.i1e12;
	        this.a1z3=this.t1x3*this.i1e20+this.t1y3*this.i1e21+this.t1z3*this.i1e22;
	        this.a2x3=this.t2x3*this.i2e00+this.t2y3*this.i2e01+this.t2z3*this.i2e02;
	        this.a2y3=this.t2x3*this.i2e10+this.t2y3*this.i2e11+this.t2z3*this.i2e12;
	        this.a2z3=this.t2x3*this.i2e20+this.t2y3*this.i2e21+this.t2z3*this.i2e22;

	        // build an impulse matrix
	        var m12=this.m1+this.m2;
	        this.k00=(this.ax1*this.ax1+this.ay1*this.ay1+this.az1*this.az1)*m12;
	        this.k01=(this.ax1*this.ax2+this.ay1*this.ay2+this.az1*this.az2)*m12;
	        this.k02=(this.ax1*this.ax3+this.ay1*this.ay3+this.az1*this.az3)*m12;
	        this.k10=(this.ax2*this.ax1+this.ay2*this.ay1+this.az2*this.az1)*m12;
	        this.k11=(this.ax2*this.ax2+this.ay2*this.ay2+this.az2*this.az2)*m12;
	        this.k12=(this.ax2*this.ax3+this.ay2*this.ay3+this.az2*this.az3)*m12;
	        this.k20=(this.ax3*this.ax1+this.ay3*this.ay1+this.az3*this.az1)*m12;
	        this.k21=(this.ax3*this.ax2+this.ay3*this.ay2+this.az3*this.az2)*m12;
	        this.k22=(this.ax3*this.ax3+this.ay3*this.ay3+this.az3*this.az3)*m12;

	        this.k00+=this.t1x1*this.a1x1+this.t1y1*this.a1y1+this.t1z1*this.a1z1;
	        this.k01+=this.t1x1*this.a1x2+this.t1y1*this.a1y2+this.t1z1*this.a1z2;
	        this.k02+=this.t1x1*this.a1x3+this.t1y1*this.a1y3+this.t1z1*this.a1z3;
	        this.k10+=this.t1x2*this.a1x1+this.t1y2*this.a1y1+this.t1z2*this.a1z1;
	        this.k11+=this.t1x2*this.a1x2+this.t1y2*this.a1y2+this.t1z2*this.a1z2;
	        this.k12+=this.t1x2*this.a1x3+this.t1y2*this.a1y3+this.t1z2*this.a1z3;
	        this.k20+=this.t1x3*this.a1x1+this.t1y3*this.a1y1+this.t1z3*this.a1z1;
	        this.k21+=this.t1x3*this.a1x2+this.t1y3*this.a1y2+this.t1z3*this.a1z2;
	        this.k22+=this.t1x3*this.a1x3+this.t1y3*this.a1y3+this.t1z3*this.a1z3;

	        this.k00+=this.t2x1*this.a2x1+this.t2y1*this.a2y1+this.t2z1*this.a2z1;
	        this.k01+=this.t2x1*this.a2x2+this.t2y1*this.a2y2+this.t2z1*this.a2z2;
	        this.k02+=this.t2x1*this.a2x3+this.t2y1*this.a2y3+this.t2z1*this.a2z3;
	        this.k10+=this.t2x2*this.a2x1+this.t2y2*this.a2y1+this.t2z2*this.a2z1;
	        this.k11+=this.t2x2*this.a2x2+this.t2y2*this.a2y2+this.t2z2*this.a2z2;
	        this.k12+=this.t2x2*this.a2x3+this.t2y2*this.a2y3+this.t2z2*this.a2z3;
	        this.k20+=this.t2x3*this.a2x1+this.t2y3*this.a2y1+this.t2z3*this.a2z1;
	        this.k21+=this.t2x3*this.a2x2+this.t2y3*this.a2y2+this.t2z3*this.a2z2;
	        this.k22+=this.t2x3*this.a2x3+this.t2y3*this.a2y3+this.t2z3*this.a2z3;

	        this.kv00=this.k00;
	        this.kv11=this.k11;
	        this.kv22=this.k22;

	        this.dv00=1/this.kv00;
	        this.dv11=1/this.kv11;
	        this.dv22=1/this.kv22;

	        if(enableSpring1&&this.limitState1!=2){
	            var omega=6.2831853*frequency1;
	            var k=omega*omega*timeStep;
	            var dmp=invTimeStep/(k+2*this.limitMotor1.dampingRatio*omega);
	            this.cfm1=this.kv00*dmp;
	            this.limitVelocity1*=k*dmp;
	        }else{
	            this.cfm1=0;
	            this.limitVelocity1*=invTimeStep*0.05;
	        }
	        if(enableSpring2&&this.limitState2!=2){
	            omega=6.2831853*frequency2;
	            k=omega*omega*timeStep;
	            dmp=invTimeStep/(k+2*this.limitMotor2.dampingRatio*omega);
	            this.cfm2=this.kv11*dmp;
	            this.limitVelocity2*=k*dmp;
	        }else{
	            this.cfm2=0;
	            this.limitVelocity2*=invTimeStep*0.05;
	        }
	        if(enableSpring3&&this.limitState3!=2){
	            omega=6.2831853*frequency3;
	            k=omega*omega*timeStep;
	            dmp=invTimeStep/(k+2*this.limitMotor3.dampingRatio*omega);
	            this.cfm3=this.kv22*dmp;
	            this.limitVelocity3*=k*dmp;
	        }else{
	            this.cfm3=0;
	            this.limitVelocity3*=invTimeStep*0.05;
	        }
	        this.k00+=this.cfm1;
	        this.k11+=this.cfm2;
	        this.k22+=this.cfm3;

	        var inv=1/(
	        this.k00*(this.k11*this.k22-this.k21*this.k12)+
	        this.k10*(this.k21*this.k02-this.k01*this.k22)+
	        this.k20*(this.k01*this.k12-this.k11*this.k02)
	        );
	        this.d00=(this.k11*this.k22-this.k12*this.k21)*inv;
	        this.d01=(this.k02*this.k21-this.k01*this.k22)*inv;
	        this.d02=(this.k01*this.k12-this.k02*this.k11)*inv;
	        this.d10=(this.k12*this.k20-this.k10*this.k22)*inv;
	        this.d11=(this.k00*this.k22-this.k02*this.k20)*inv;
	        this.d12=(this.k02*this.k10-this.k00*this.k12)*inv;
	        this.d20=(this.k10*this.k21-this.k11*this.k20)*inv;
	        this.d21=(this.k01*this.k20-this.k00*this.k21)*inv;
	        this.d22=(this.k00*this.k11-this.k01*this.k10)*inv;

	        // warm starting
	        var totalImpulse1=this.limitImpulse1+this.motorImpulse1;
	        var totalImpulse2=this.limitImpulse2+this.motorImpulse2;
	        var totalImpulse3=this.limitImpulse3+this.motorImpulse3;
	        this.l1.x+=totalImpulse1*this.l1x1+totalImpulse2*this.l1x2+totalImpulse3*this.l1x3;
	        this.l1.y+=totalImpulse1*this.l1y1+totalImpulse2*this.l1y2+totalImpulse3*this.l1y3;
	        this.l1.z+=totalImpulse1*this.l1z1+totalImpulse2*this.l1z2+totalImpulse3*this.l1z3;
	        this.a1.x+=totalImpulse1*this.a1x1+totalImpulse2*this.a1x2+totalImpulse3*this.a1x3;
	        this.a1.y+=totalImpulse1*this.a1y1+totalImpulse2*this.a1y2+totalImpulse3*this.a1y3;
	        this.a1.z+=totalImpulse1*this.a1z1+totalImpulse2*this.a1z2+totalImpulse3*this.a1z3;
	        this.l2.x-=totalImpulse1*this.l2x1+totalImpulse2*this.l2x2+totalImpulse3*this.l2x3;
	        this.l2.y-=totalImpulse1*this.l2y1+totalImpulse2*this.l2y2+totalImpulse3*this.l2y3;
	        this.l2.z-=totalImpulse1*this.l2z1+totalImpulse2*this.l2z2+totalImpulse3*this.l2z3;
	        this.a2.x-=totalImpulse1*this.a2x1+totalImpulse2*this.a2x2+totalImpulse3*this.a2x3;
	        this.a2.y-=totalImpulse1*this.a2y1+totalImpulse2*this.a2y2+totalImpulse3*this.a2y3;
	        this.a2.z-=totalImpulse1*this.a2z1+totalImpulse2*this.a2z2+totalImpulse3*this.a2z3;
	    },

	    solve:function(){
	        var rvx=this.l2.x-this.l1.x+this.a2.y*this.r2z-this.a2.z*this.r2y-this.a1.y*this.r1z+this.a1.z*this.r1y;
	        var rvy=this.l2.y-this.l1.y+this.a2.z*this.r2x-this.a2.x*this.r2z-this.a1.z*this.r1x+this.a1.x*this.r1z;
	        var rvz=this.l2.z-this.l1.z+this.a2.x*this.r2y-this.a2.y*this.r2x-this.a1.x*this.r1y+this.a1.y*this.r1x;
	        var rvn1=rvx*this.ax1+rvy*this.ay1+rvz*this.az1;
	        var rvn2=rvx*this.ax2+rvy*this.ay2+rvz*this.az2;
	        var rvn3=rvx*this.ax3+rvy*this.ay3+rvz*this.az3;
	        var oldMotorImpulse1=this.motorImpulse1;
	        var oldMotorImpulse2=this.motorImpulse2;
	        var oldMotorImpulse3=this.motorImpulse3;
	        var dMotorImpulse1=0;
	        var dMotorImpulse2=0;
	        var dMotorImpulse3=0;
	        if(this.enableMotor1){
	            dMotorImpulse1=(rvn1-this.motorSpeed1)*this.dv00;
	            this.motorImpulse1+=dMotorImpulse1;
	            if(this.motorImpulse1>this.maxMotorImpulse1){ // clamp motor impulse
	                this.motorImpulse1=this.maxMotorImpulse1;
	            }else if(this.motorImpulse1<-this.maxMotorImpulse1){
	                this.motorImpulse1=-this.maxMotorImpulse1;
	            }
	            dMotorImpulse1=this.motorImpulse1-oldMotorImpulse1;
	        }
	        if(this.enableMotor2){
	            dMotorImpulse2=(rvn2-this.motorSpeed2)*this.dv11;
	            this.motorImpulse2+=dMotorImpulse2;
	            if(this.motorImpulse2>this.maxMotorImpulse2){ // clamp motor impulse
	                this.motorImpulse2=this.maxMotorImpulse2;
	            }else if(this.motorImpulse2<-this.maxMotorImpulse2){
	                this.motorImpulse2=-this.maxMotorImpulse2;
	            }
	            dMotorImpulse2=this.motorImpulse2-oldMotorImpulse2;
	        }
	        if(this.enableMotor3){
	            dMotorImpulse3=(rvn3-this.motorSpeed3)*this.dv22;
	            this.motorImpulse3+=dMotorImpulse3;
	            if(this.motorImpulse3>this.maxMotorImpulse3){ // clamp motor impulse
	                this.motorImpulse3=this.maxMotorImpulse3;
	            }else if(this.motorImpulse3<-this.maxMotorImpulse3){
	                this.motorImpulse3=-this.maxMotorImpulse3;
	            }
	            dMotorImpulse3=this.motorImpulse3-oldMotorImpulse3;
	        }

	        // apply motor impulse to relative velocity
	        rvn1+=dMotorImpulse1*this.kv00+dMotorImpulse2*this.k01+dMotorImpulse3*this.k02;
	        rvn2+=dMotorImpulse1*this.k10+dMotorImpulse2*this.kv11+dMotorImpulse3*this.k12;
	        rvn3+=dMotorImpulse1*this.k20+dMotorImpulse2*this.k21+dMotorImpulse3*this.kv22;

	        // subtract target velocity and applied impulse
	        rvn1-=this.limitVelocity1+this.limitImpulse1*this.cfm1;
	        rvn2-=this.limitVelocity2+this.limitImpulse2*this.cfm2;
	        rvn3-=this.limitVelocity3+this.limitImpulse3*this.cfm3;

	        var oldLimitImpulse1=this.limitImpulse1;
	        var oldLimitImpulse2=this.limitImpulse2;
	        var oldLimitImpulse3=this.limitImpulse3;

	        var dLimitImpulse1=rvn1*this.d00+rvn2*this.d01+rvn3*this.d02;
	        var dLimitImpulse2=rvn1*this.d10+rvn2*this.d11+rvn3*this.d12;
	        var dLimitImpulse3=rvn1*this.d20+rvn2*this.d21+rvn3*this.d22;

	        this.limitImpulse1+=dLimitImpulse1;
	        this.limitImpulse2+=dLimitImpulse2;
	        this.limitImpulse3+=dLimitImpulse3;

	        // clamp
	        var clampState=0;
	        if(this.limitState1==2||this.limitImpulse1*this.limitState1<0){
	            dLimitImpulse1=-oldLimitImpulse1;
	            rvn2+=dLimitImpulse1*this.k10;
	            rvn3+=dLimitImpulse1*this.k20;
	            clampState|=1;
	        }
	        if(this.limitState2==2||this.limitImpulse2*this.limitState2<0){
	            dLimitImpulse2=-oldLimitImpulse2;
	            rvn1+=dLimitImpulse2*this.k01;
	            rvn3+=dLimitImpulse2*this.k21;
	            clampState|=2;
	        }
	        if(this.limitState3==2||this.limitImpulse3*this.limitState3<0){
	            dLimitImpulse3=-oldLimitImpulse3;
	            rvn1+=dLimitImpulse3*this.k02;
	            rvn2+=dLimitImpulse3*this.k12;
	            clampState|=4;
	        }

	        // update un-clamped impulse
	        // TODO: isolate division
	        var det;
	        switch(clampState){
	            case 1:// update 2 3
	            det=1/(this.k11*this.k22-this.k12*this.k21);
	            dLimitImpulse2=(this.k22*rvn2+-this.k12*rvn3)*det;
	            dLimitImpulse3=(-this.k21*rvn2+this.k11*rvn3)*det;
	            break;
	            case 2:// update 1 3
	            det=1/(this.k00*this.k22-this.k02*this.k20);
	            dLimitImpulse1=(this.k22*rvn1+-this.k02*rvn3)*det;
	            dLimitImpulse3=(-this.k20*rvn1+this.k00*rvn3)*det;
	            break;
	            case 3:// update 3
	            dLimitImpulse3=rvn3/this.k22;
	            break;
	            case 4:// update 1 2
	            det=1/(this.k00*this.k11-this.k01*this.k10);
	            dLimitImpulse1=(this.k11*rvn1+-this.k01*rvn2)*det;
	            dLimitImpulse2=(-this.k10*rvn1+this.k00*rvn2)*det;
	            break;
	            case 5:// update 2
	            dLimitImpulse2=rvn2/this.k11;
	            break;
	            case 6:// update 1
	            dLimitImpulse1=rvn1/this.k00;
	            break;
	        }

	        this.limitImpulse1=oldLimitImpulse1+dLimitImpulse1;
	        this.limitImpulse2=oldLimitImpulse2+dLimitImpulse2;
	        this.limitImpulse3=oldLimitImpulse3+dLimitImpulse3;

	        var dImpulse1=dMotorImpulse1+dLimitImpulse1;
	        var dImpulse2=dMotorImpulse2+dLimitImpulse2;
	        var dImpulse3=dMotorImpulse3+dLimitImpulse3;

	        // apply impulse
	        this.l1.x+=dImpulse1*this.l1x1+dImpulse2*this.l1x2+dImpulse3*this.l1x3;
	        this.l1.y+=dImpulse1*this.l1y1+dImpulse2*this.l1y2+dImpulse3*this.l1y3;
	        this.l1.z+=dImpulse1*this.l1z1+dImpulse2*this.l1z2+dImpulse3*this.l1z3;
	        this.a1.x+=dImpulse1*this.a1x1+dImpulse2*this.a1x2+dImpulse3*this.a1x3;
	        this.a1.y+=dImpulse1*this.a1y1+dImpulse2*this.a1y2+dImpulse3*this.a1y3;
	        this.a1.z+=dImpulse1*this.a1z1+dImpulse2*this.a1z2+dImpulse3*this.a1z3;
	        this.l2.x-=dImpulse1*this.l2x1+dImpulse2*this.l2x2+dImpulse3*this.l2x3;
	        this.l2.y-=dImpulse1*this.l2y1+dImpulse2*this.l2y2+dImpulse3*this.l2y3;
	        this.l2.z-=dImpulse1*this.l2z1+dImpulse2*this.l2z2+dImpulse3*this.l2z3;
	        this.a2.x-=dImpulse1*this.a2x1+dImpulse2*this.a2x2+dImpulse3*this.a2x3;
	        this.a2.y-=dImpulse1*this.a2y1+dImpulse2*this.a2y2+dImpulse3*this.a2y3;
	        this.a2.z-=dImpulse1*this.a2z1+dImpulse2*this.a2z2+dImpulse3*this.a2z3;
	    }
	    
	} );

	/**
	 * A prismatic joint allows only for relative translation of rigid bodies along the axis.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function PrismaticJoint( config, lowerTranslation, upperTranslation ){

	    Joint.call( this, config );

	    this.type = JOINT_PRISMATIC;

	    // The axis in the first body's coordinate system.
	    this.localAxis1 = config.localAxis1.clone().normalize();
	    // The axis in the second body's coordinate system.
	    this.localAxis2 = config.localAxis2.clone().normalize();

	    this.ax1 = new Vec3();
	    this.ax2 = new Vec3();
	    
	    this.nor = new Vec3();
	    this.tan = new Vec3();
	    this.bin = new Vec3();

	    this.ac = new AngularConstraint( this, new Quat().setFromUnitVectors( this.localAxis1, this.localAxis2 ) );

	    // The translational limit and motor information of the joint.
	    this.limitMotor = new LimitMotor( this.nor, true );
	    this.limitMotor.lowerLimit = lowerTranslation;
	    this.limitMotor.upperLimit = upperTranslation;
	    this.t3 = new Translational3Constraint( this, this.limitMotor, new LimitMotor( this.tan, true ), new LimitMotor( this.bin, true ) );

	}

	PrismaticJoint.prototype = Object.assign( Object.create( Joint.prototype ), {

	    constructor: PrismaticJoint,

	    preSolve: function ( timeStep, invTimeStep ) {

	        this.updateAnchorPoints();

	        this.ax1.copy( this.localAxis1 ).applyMatrix3( this.body1.rotation, true );
	        this.ax2.copy( this.localAxis2 ).applyMatrix3( this.body2.rotation, true );

	        // normal tangent binormal

	        this.nor.set(
	            this.ax1.x*this.body2.inverseMass + this.ax2.x*this.body1.inverseMass,
	            this.ax1.y*this.body2.inverseMass + this.ax2.y*this.body1.inverseMass,
	            this.ax1.z*this.body2.inverseMass + this.ax2.z*this.body1.inverseMass
	        ).normalize();
	        this.tan.tangent( this.nor ).normalize();
	        this.bin.crossVectors( this.nor, this.tan );

	        // preSolve

	        this.ac.preSolve( timeStep, invTimeStep );
	        this.t3.preSolve( timeStep, invTimeStep );

	    },

	    solve: function () {

	        this.ac.solve();
	        this.t3.solve();
	        
	    },

	    postSolve: function () {

	    }

	});

	/**
	 * A slider joint allows for relative translation and relative rotation between two rigid bodies along the axis.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function SliderJoint( config, lowerTranslation, upperTranslation ){

	    Joint.call( this, config );

	    this.type = JOINT_SLIDER;

	    // The axis in the first body's coordinate system.
	    this.localAxis1 = config.localAxis1.clone().normalize();
	    // The axis in the second body's coordinate system.
	    this.localAxis2 = config.localAxis2.clone().normalize();

	    // make angle axis
	    var arc = new Mat33().setQuat( new Quat().setFromUnitVectors( this.localAxis1, this.localAxis2 ) );
	    this.localAngle1 = new Vec3().tangent( this.localAxis1 ).normalize();
	    this.localAngle2 = this.localAngle1.clone().applyMatrix3( arc, true );

	    this.ax1 = new Vec3();
	    this.ax2 = new Vec3();
	    this.an1 = new Vec3();
	    this.an2 = new Vec3();

	    this.tmp = new Vec3();
	    
	    this.nor = new Vec3();
	    this.tan = new Vec3();
	    this.bin = new Vec3();

	    // The limit and motor for the rotation
	    this.rotationalLimitMotor = new LimitMotor( this.nor, false );
	    this.r3 = new Rotational3Constraint( this, this.rotationalLimitMotor, new LimitMotor( this.tan, true ), new LimitMotor( this.bin, true ) );

	    // The limit and motor for the translation.
	    this.translationalLimitMotor = new LimitMotor( this.nor, true );
	    this.translationalLimitMotor.lowerLimit = lowerTranslation;
	    this.translationalLimitMotor.upperLimit = upperTranslation;
	    this.t3 = new Translational3Constraint( this, this.translationalLimitMotor, new LimitMotor( this.tan, true ), new LimitMotor( this.bin, true ) );

	}

	SliderJoint.prototype = Object.assign( Object.create( Joint.prototype ), {

	    constructor: SliderJoint,

	    preSolve: function ( timeStep, invTimeStep ) {

	        this.updateAnchorPoints();

	        this.ax1.copy( this.localAxis1 ).applyMatrix3( this.body1.rotation, true );
	        this.an1.copy( this.localAngle1 ).applyMatrix3( this.body1.rotation, true );

	        this.ax2.copy( this.localAxis2 ).applyMatrix3( this.body2.rotation, true );
	        this.an2.copy( this.localAngle2 ).applyMatrix3( this.body2.rotation, true );

	        // normal tangent binormal

	        this.nor.set(
	            this.ax1.x*this.body2.inverseMass + this.ax2.x*this.body1.inverseMass,
	            this.ax1.y*this.body2.inverseMass + this.ax2.y*this.body1.inverseMass,
	            this.ax1.z*this.body2.inverseMass + this.ax2.z*this.body1.inverseMass
	        ).normalize();
	        this.tan.tangent( this.nor ).normalize();
	        this.bin.crossVectors( this.nor, this.tan );

	        // calculate hinge angle

	        this.tmp.crossVectors( this.an1, this.an2 );

	        var limite = _Math.acosClamp( _Math.dotVectors( this.an1, this.an2 ) );

	        if( _Math.dotVectors( this.nor, this.tmp ) < 0 ) this.rotationalLimitMotor.angle = -limite;
	        else this.rotationalLimitMotor.angle = limite;

	        // angular error

	        this.tmp.crossVectors( this.ax1, this.ax2 );
	        this.r3.limitMotor2.angle = _Math.dotVectors( this.tan, this.tmp );
	        this.r3.limitMotor3.angle = _Math.dotVectors( this.bin, this.tmp );

	        // preSolve
	        
	        this.r3.preSolve( timeStep, invTimeStep );
	        this.t3.preSolve( timeStep, invTimeStep );

	    },

	    solve: function () {

	        this.r3.solve();
	        this.t3.solve();

	    },

	    postSolve: function () {

	    }

	});

	/**
	 * A wheel joint allows for relative rotation between two rigid bodies along two axes.
	 * The wheel joint also allows for relative translation for the suspension.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function WheelJoint ( config ){

	    Joint.call( this, config );

	    this.type = JOINT_WHEEL;

	    // The axis in the first body's coordinate system.
	    this.localAxis1 = config.localAxis1.clone().normalize();
	    // The axis in the second body's coordinate system.
	    this.localAxis2 = config.localAxis2.clone().normalize();

	    this.localAngle1 = new Vec3();
	    this.localAngle2 = new Vec3();

	    var dot = _Math.dotVectors( this.localAxis1, this.localAxis2 );

	    if( dot > -1 && dot < 1 ){

	        this.localAngle1.set(
	            this.localAxis2.x - dot*this.localAxis1.x,
	            this.localAxis2.y - dot*this.localAxis1.y,
	            this.localAxis2.z - dot*this.localAxis1.z
	        ).normalize();

	        this.localAngle2.set(
	            this.localAxis1.x - dot*this.localAxis2.x,
	            this.localAxis1.y - dot*this.localAxis2.y,
	            this.localAxis1.z - dot*this.localAxis2.z
	        ).normalize();

	    } else {

	        var arc = new Mat33().setQuat( new Quat().setFromUnitVectors( this.localAxis1, this.localAxis2 ) );
	        this.localAngle1.tangent( this.localAxis1 ).normalize();
	        this.localAngle2 = this.localAngle1.clone().applyMatrix3( arc, true );

	    }

	    this.ax1 = new Vec3();
	    this.ax2 = new Vec3();
	    this.an1 = new Vec3();
	    this.an2 = new Vec3();

	    this.tmp = new Vec3();

	    this.nor = new Vec3();
	    this.tan = new Vec3();
	    this.bin = new Vec3();

	    // The translational limit and motor information of the joint.
	    this.translationalLimitMotor = new LimitMotor( this.tan,true );
	    this.translationalLimitMotor.frequency = 8;
	    this.translationalLimitMotor.dampingRatio = 1;
	    // The first rotational limit and motor information of the joint.
	    this.rotationalLimitMotor1 = new LimitMotor( this.tan, false );
	    // The second rotational limit and motor information of the joint.
	    this.rotationalLimitMotor2 = new LimitMotor( this.bin, false );

	    this.t3 = new Translational3Constraint( this, new LimitMotor( this.nor, true ),this.translationalLimitMotor,new LimitMotor( this.bin, true ));
	    this.t3.weight = 1;
	    this.r3 = new Rotational3Constraint(this,new LimitMotor( this.nor, true ),this.rotationalLimitMotor1,this.rotationalLimitMotor2);

	}

	WheelJoint.prototype = Object.assign( Object.create( Joint.prototype ), {

	    constructor: WheelJoint,

	    preSolve: function ( timeStep, invTimeStep ) {

	        this.updateAnchorPoints();

	        this.ax1.copy( this.localAxis1 ).applyMatrix3( this.body1.rotation, true );
	        this.an1.copy( this.localAngle1 ).applyMatrix3( this.body1.rotation, true );

	        this.ax2.copy( this.localAxis2 ).applyMatrix3( this.body2.rotation, true );
	        this.an2.copy( this.localAngle2 ).applyMatrix3( this.body2.rotation, true );

	        this.r3.limitMotor1.angle = _Math.dotVectors( this.ax1, this.ax2 );

	        var limite = _Math.dotVectors( this.an1, this.ax2 );

	        if( _Math.dotVectors( this.ax1, this.tmp.crossVectors( this.an1, this.ax2 ) ) < 0 ) this.rotationalLimitMotor1.angle = -limite;
	        else this.rotationalLimitMotor1.angle = limite;

	        limite = _Math.dotVectors( this.an2, this.ax1 );

	        if( _Math.dotVectors( this.ax2, this.tmp.crossVectors( this.an2, this.ax1 ) ) < 0 ) this.rotationalLimitMotor2.angle = -limite;
	        else this.rotationalLimitMotor2.angle = limite;

	        this.nor.crossVectors( this.ax1, this.ax2 ).normalize();
	        this.tan.crossVectors( this.nor, this.ax2 ).normalize();
	        this.bin.crossVectors( this.nor, this.ax1 ).normalize();
	        
	        this.r3.preSolve(timeStep,invTimeStep);
	        this.t3.preSolve(timeStep,invTimeStep);

	    },

	    solve: function () {

	        this.r3.solve();
	        this.t3.solve();

	    },

	    postSolve: function () {

	    }

	});

	function JointConfig(){

	    this.scale = 1;
	    this.invScale = 1;

	    // The first rigid body of the joint.
	    this.body1 = null;
	    // The second rigid body of the joint.
	    this.body2 = null;
	    // The anchor point on the first rigid body in local coordinate system.
	    this.localAnchorPoint1 = new Vec3();
	    //  The anchor point on the second rigid body in local coordinate system.
	    this.localAnchorPoint2 = new Vec3();
	    // The axis in the first body's coordinate system.
	    // his property is available in some joints.
	    this.localAxis1 = new Vec3();
	    // The axis in the second body's coordinate system.
	    // This property is available in some joints.
	    this.localAxis2 = new Vec3();
	    //  Whether allow collision between connected rigid bodies or not.
	    this.allowCollision = false;

	}

	/**
	 * This class holds mass information of a shape.
	 * @author lo-th
	 * @author saharan
	 */

	function MassInfo (){

	    // Mass of the shape.
	    this.mass = 0;

	    // The moment inertia of the shape.
	    this.inertia = new Mat33();

	}

	/**
	* A link list of contacts.
	* @author saharan
	*/
	function ContactLink ( contact ){
	    
		// The previous contact link.
	    this.prev = null;
	    // The next contact link.
	    this.next = null;
	    // The shape of the contact.
	    this.shape = null;
	    // The other rigid body.
	    this.body = null;
	    // The contact of the link.
	    this.contact = contact;

	}

	function ImpulseDataBuffer (){

	    this.lp1X = NaN;
	    this.lp1Y = NaN;
	    this.lp1Z = NaN;
	    this.lp2X = NaN;
	    this.lp2Y = NaN;
	    this.lp2Z = NaN;
	    this.impulse = NaN;

	}

	/**
	* The class holds details of the contact point.
	* @author saharan
	*/

	function ManifoldPoint(){

	    // Whether this manifold point is persisting or not.
	    this.warmStarted = false;
	    //  The position of this manifold point.
	    this.position = new Vec3();
	    // The position in the first shape's coordinate.
	    this.localPoint1 = new Vec3();
	    //  The position in the second shape's coordinate.
	    this.localPoint2 = new Vec3();
	    // The normal vector of this manifold point.
	    this.normal = new Vec3();
	    // The tangent vector of this manifold point.
	    this.tangent = new Vec3();
	    // The binormal vector of this manifold point.
	    this.binormal = new Vec3();
	    // The impulse in normal direction.
	    this.normalImpulse = 0;
	    // The impulse in tangent direction.
	    this.tangentImpulse = 0;
	    // The impulse in binormal direction.
	    this.binormalImpulse = 0;
	    // The denominator in normal direction.
	    this.normalDenominator = 0;
	    // The denominator in tangent direction.
	    this.tangentDenominator = 0;
	    // The denominator in binormal direction.
	    this.binormalDenominator = 0;
	    // The depth of penetration.
	    this.penetration = 0;

	}

	/**
	* A contact manifold between two shapes.
	* @author saharan
	* @author lo-th
	*/

	function ContactManifold () {

	    // The first rigid body.
	    this.body1 = null;
	    // The second rigid body.
	    this.body2 = null;
	    // The number of manifold points.
	    this.numPoints = 0;
	    // The manifold points.
	    this.points = [
	        new ManifoldPoint(),
	        new ManifoldPoint(),
	        new ManifoldPoint(),
	        new ManifoldPoint()
	    ];

	}

	ContactManifold.prototype = {

	    constructor: ContactManifold,

	    //Reset the manifold.
	    reset:function( shape1, shape2 ){

	        this.body1 = shape1.parent;
	        this.body2 = shape2.parent;
	        this.numPoints = 0;

	    },

	    //  Add a point into this manifold.
	    addPointVec: function ( pos, norm, penetration, flip ) {
	        
	        var p = this.points[ this.numPoints++ ];

	        p.position.copy( pos );
	        p.localPoint1.sub( pos, this.body1.position ).applyMatrix3( this.body1.rotation );
	        p.localPoint2.sub( pos, this.body2.position ).applyMatrix3( this.body2.rotation );

	        p.normal.copy( norm );
	        if( flip ) p.normal.negate();

	        p.normalImpulse = 0;
	        p.penetration = penetration;
	        p.warmStarted = false;
	        
	    },

	    //  Add a point into this manifold.
	    addPoint: function ( x, y, z, nx, ny, nz, penetration, flip ) {
	        
	        var p = this.points[ this.numPoints++ ];

	        p.position.set( x, y, z );
	        p.localPoint1.sub( p.position, this.body1.position ).applyMatrix3( this.body1.rotation );
	        p.localPoint2.sub( p.position, this.body2.position ).applyMatrix3( this.body2.rotation );

	        p.normalImpulse = 0;

	        p.normal.set( nx, ny, nz );
	        if( flip ) p.normal.negate();

	        p.penetration = penetration;
	        p.warmStarted = false;
	        
	    }
	};

	function ContactPointDataBuffer (){

	    this.nor = new Vec3();
	    this.tan = new Vec3();
	    this.bin = new Vec3();

	    this.norU1 = new Vec3();
	    this.tanU1 = new Vec3();
	    this.binU1 = new Vec3();

	    this.norU2 = new Vec3();
	    this.tanU2 = new Vec3();
	    this.binU2 = new Vec3();

	    this.norT1 = new Vec3();
	    this.tanT1 = new Vec3();
	    this.binT1 = new Vec3();

	    this.norT2 = new Vec3();
	    this.tanT2 = new Vec3();
	    this.binT2 = new Vec3();

	    this.norTU1 = new Vec3();
	    this.tanTU1 = new Vec3();
	    this.binTU1 = new Vec3();

	    this.norTU2 = new Vec3();
	    this.tanTU2 = new Vec3();
	    this.binTU2 = new Vec3();

	    this.norImp = 0;
	    this.tanImp = 0;
	    this.binImp = 0;

	    this.norDen = 0;
	    this.tanDen = 0;
	    this.binDen = 0;

	    this.norTar = 0;

	    this.next = null;
	    this.last = false;

	}

	/**
	* ...
	* @author saharan
	*/
	function ContactConstraint ( manifold ){
	    
	    Constraint.call( this );
	    // The contact manifold of the constraint.
	    this.manifold = manifold;
	    // The coefficient of restitution of the constraint.
	    this.restitution=NaN;
	    // The coefficient of friction of the constraint.
	    this.friction=NaN;
	    this.p1=null;
	    this.p2=null;
	    this.lv1=null;
	    this.lv2=null;
	    this.av1=null;
	    this.av2=null;
	    this.i1=null;
	    this.i2=null;

	    //this.ii1 = null;
	    //this.ii2 = null;

	    this.tmp = new Vec3();
	    this.tmpC1 = new Vec3();
	    this.tmpC2 = new Vec3();

	    this.tmpP1 = new Vec3();
	    this.tmpP2 = new Vec3();

	    this.tmplv1 = new Vec3();
	    this.tmplv2 = new Vec3();
	    this.tmpav1 = new Vec3();
	    this.tmpav2 = new Vec3();

	    this.m1=NaN;
	    this.m2=NaN;
	    this.num=0;
	    
	    this.ps = manifold.points;
	    this.cs = new ContactPointDataBuffer();
	    this.cs.next = new ContactPointDataBuffer();
	    this.cs.next.next = new ContactPointDataBuffer();
	    this.cs.next.next.next = new ContactPointDataBuffer();
	}

	ContactConstraint.prototype = Object.assign( Object.create( Constraint.prototype ), {

	    constructor: ContactConstraint,

	    // Attach the constraint to the bodies.
	    attach: function(){

	        this.p1=this.body1.position;
	        this.p2=this.body2.position;
	        this.lv1=this.body1.linearVelocity;
	        this.av1=this.body1.angularVelocity;
	        this.lv2=this.body2.linearVelocity;
	        this.av2=this.body2.angularVelocity;
	        this.i1=this.body1.inverseInertia;
	        this.i2=this.body2.inverseInertia;

	    },

	    // Detach the constraint from the bodies.
	    detach: function(){

	        this.p1=null;
	        this.p2=null;
	        this.lv1=null;
	        this.lv2=null;
	        this.av1=null;
	        this.av2=null;
	        this.i1=null;
	        this.i2=null;

	    },

	    preSolve: function( timeStep, invTimeStep ){

	        this.m1 = this.body1.inverseMass;
	        this.m2 = this.body2.inverseMass;

	        var m1m2 = this.m1 + this.m2;

	        this.num = this.manifold.numPoints;

	        var c = this.cs;
	        var p, rvn, len, norImp, norTar, sepV, i1, i2;

	        for( var i=0; i < this.num; i++ ){

	            p = this.ps[i];

	            this.tmpP1.sub( p.position, this.p1 );
	            this.tmpP2.sub( p.position, this.p2 );

	            this.tmpC1.crossVectors( this.av1, this.tmpP1 );
	            this.tmpC2.crossVectors( this.av2, this.tmpP2 );

	            c.norImp = p.normalImpulse;
	            c.tanImp = p.tangentImpulse;
	            c.binImp = p.binormalImpulse;

	            c.nor.copy( p.normal );

	            this.tmp.set(

	                ( this.lv2.x + this.tmpC2.x ) - ( this.lv1.x + this.tmpC1.x ),
	                ( this.lv2.y + this.tmpC2.y ) - ( this.lv1.y + this.tmpC1.y ),
	                ( this.lv2.z + this.tmpC2.z ) - ( this.lv1.z + this.tmpC1.z )

	            );

	            rvn = _Math.dotVectors( c.nor, this.tmp );

	            c.tan.set(
	                this.tmp.x - rvn * c.nor.x,
	                this.tmp.y - rvn * c.nor.y,
	                this.tmp.z - rvn * c.nor.z
	            );

	            len = _Math.dotVectors( c.tan, c.tan );

	            if( len <= 0.04 ) {
	                c.tan.tangent( c.nor );
	            }

	            c.tan.normalize();

	            c.bin.crossVectors( c.nor, c.tan );

	            c.norU1.scale( c.nor, this.m1 );
	            c.norU2.scale( c.nor, this.m2 );

	            c.tanU1.scale( c.tan, this.m1 );
	            c.tanU2.scale( c.tan, this.m2 );

	            c.binU1.scale( c.bin, this.m1 );
	            c.binU2.scale( c.bin, this.m2 );

	            c.norT1.crossVectors( this.tmpP1, c.nor );
	            c.tanT1.crossVectors( this.tmpP1, c.tan );
	            c.binT1.crossVectors( this.tmpP1, c.bin );

	            c.norT2.crossVectors( this.tmpP2, c.nor );
	            c.tanT2.crossVectors( this.tmpP2, c.tan );
	            c.binT2.crossVectors( this.tmpP2, c.bin );

	            i1 = this.i1;
	            i2 = this.i2;

	            c.norTU1.copy( c.norT1 ).applyMatrix3( i1, true );
	            c.tanTU1.copy( c.tanT1 ).applyMatrix3( i1, true );
	            c.binTU1.copy( c.binT1 ).applyMatrix3( i1, true );

	            c.norTU2.copy( c.norT2 ).applyMatrix3( i2, true );
	            c.tanTU2.copy( c.tanT2 ).applyMatrix3( i2, true );
	            c.binTU2.copy( c.binT2 ).applyMatrix3( i2, true );

	            /*c.norTU1.mulMat( this.i1, c.norT1 );
	            c.tanTU1.mulMat( this.i1, c.tanT1 );
	            c.binTU1.mulMat( this.i1, c.binT1 );

	            c.norTU2.mulMat( this.i2, c.norT2 );
	            c.tanTU2.mulMat( this.i2, c.tanT2 );
	            c.binTU2.mulMat( this.i2, c.binT2 );*/

	            this.tmpC1.crossVectors( c.norTU1, this.tmpP1 );
	            this.tmpC2.crossVectors( c.norTU2, this.tmpP2 );
	            this.tmp.add( this.tmpC1, this.tmpC2 );
	            c.norDen = 1 / ( m1m2 +_Math.dotVectors( c.nor, this.tmp ));

	            this.tmpC1.crossVectors( c.tanTU1, this.tmpP1 );
	            this.tmpC2.crossVectors( c.tanTU2, this.tmpP2 );
	            this.tmp.add( this.tmpC1, this.tmpC2 );
	            c.tanDen = 1 / ( m1m2 +_Math.dotVectors( c.tan, this.tmp ));

	            this.tmpC1.crossVectors( c.binTU1, this.tmpP1 );
	            this.tmpC2.crossVectors( c.binTU2, this.tmpP2 );
	            this.tmp.add( this.tmpC1, this.tmpC2 );
	            c.binDen = 1 / ( m1m2 +_Math.dotVectors( c.bin, this.tmp ));

	            if( p.warmStarted ){

	                norImp = p.normalImpulse;

	                this.lv1.addScaledVector( c.norU1, norImp );
	                this.av1.addScaledVector( c.norTU1, norImp );

	                this.lv2.subScaledVector( c.norU2, norImp );
	                this.av2.subScaledVector( c.norTU2, norImp );

	                c.norImp = norImp;
	                c.tanImp = 0;
	                c.binImp = 0;
	                rvn = 0; // disable bouncing

	            } else {

	                c.norImp=0;
	                c.tanImp=0;
	                c.binImp=0;

	            }


	            if(rvn>-1) rvn=0; // disable bouncing
	            
	            norTar = this.restitution*-rvn;
	            sepV = -(p.penetration+0.005)*invTimeStep*0.05; // allow 0.5cm error
	            if(norTar<sepV) norTar=sepV;
	            c.norTar = norTar;
	            c.last = i==this.num-1;
	            c = c.next;
	        }
	    },

	    solve: function(){

	        this.tmplv1.copy( this.lv1 );
	        this.tmplv2.copy( this.lv2 );
	        this.tmpav1.copy( this.av1 );
	        this.tmpav2.copy( this.av2 );

	        var oldImp1, newImp1, oldImp2, newImp2, rvn, norImp, tanImp, binImp, max, len;

	        var c = this.cs;

	        while(true){

	            norImp = c.norImp;
	            tanImp = c.tanImp;
	            binImp = c.binImp;
	            max = -norImp * this.friction;

	            this.tmp.sub( this.tmplv2, this.tmplv1 );

	            rvn = _Math.dotVectors( this.tmp, c.tan ) + _Math.dotVectors( this.tmpav2, c.tanT2 ) - _Math.dotVectors( this.tmpav1, c.tanT1 );
	        
	            oldImp1 = tanImp;
	            newImp1 = rvn*c.tanDen;
	            tanImp += newImp1;

	            rvn = _Math.dotVectors( this.tmp, c.bin ) + _Math.dotVectors( this.tmpav2, c.binT2 ) - _Math.dotVectors( this.tmpav1, c.binT1 );
	      
	            oldImp2 = binImp;
	            newImp2 = rvn*c.binDen;
	            binImp += newImp2;

	            // cone friction clamp
	            len = tanImp*tanImp + binImp*binImp;
	            if(len > max * max ){
	                len = max/_Math.sqrt(len);
	                tanImp *= len;
	                binImp *= len;
	            }

	            newImp1 = tanImp-oldImp1;
	            newImp2 = binImp-oldImp2;

	            //

	            this.tmp.set( 
	                c.tanU1.x*newImp1 + c.binU1.x*newImp2,
	                c.tanU1.y*newImp1 + c.binU1.y*newImp2,
	                c.tanU1.z*newImp1 + c.binU1.z*newImp2
	            );

	            this.tmplv1.addEqual( this.tmp );

	            this.tmp.set(
	                c.tanTU1.x*newImp1 + c.binTU1.x*newImp2,
	                c.tanTU1.y*newImp1 + c.binTU1.y*newImp2,
	                c.tanTU1.z*newImp1 + c.binTU1.z*newImp2
	            );

	            this.tmpav1.addEqual( this.tmp );

	            this.tmp.set(
	                c.tanU2.x*newImp1 + c.binU2.x*newImp2,
	                c.tanU2.y*newImp1 + c.binU2.y*newImp2,
	                c.tanU2.z*newImp1 + c.binU2.z*newImp2
	            );

	            this.tmplv2.subEqual( this.tmp );

	            this.tmp.set(
	                c.tanTU2.x*newImp1 + c.binTU2.x*newImp2,
	                c.tanTU2.y*newImp1 + c.binTU2.y*newImp2,
	                c.tanTU2.z*newImp1 + c.binTU2.z*newImp2
	            );

	            this.tmpav2.subEqual( this.tmp );

	            // restitution part

	            this.tmp.sub( this.tmplv2, this.tmplv1 );

	            rvn = _Math.dotVectors( this.tmp, c.nor ) + _Math.dotVectors( this.tmpav2, c.norT2 ) - _Math.dotVectors( this.tmpav1, c.norT1 );

	            oldImp1 = norImp;
	            newImp1 = (rvn-c.norTar)*c.norDen;
	            norImp += newImp1;
	            if( norImp > 0 ) norImp = 0;

	            newImp1 = norImp - oldImp1;

	            this.tmplv1.addScaledVector( c.norU1, newImp1 );
	            this.tmpav1.addScaledVector( c.norTU1, newImp1 );
	            this.tmplv2.subScaledVector( c.norU2, newImp1 );
	            this.tmpav2.subScaledVector( c.norTU2, newImp1 );

	            c.norImp = norImp;
	            c.tanImp = tanImp;
	            c.binImp = binImp;

	            if(c.last)break;
	            c = c.next;
	        }

	        this.lv1.copy( this.tmplv1 );
	        this.lv2.copy( this.tmplv2 );
	        this.av1.copy( this.tmpav1 );
	        this.av2.copy( this.tmpav2 );

	    },

	    postSolve: function(){

	        var c = this.cs, p;
	        var i = this.num;
	        while(i--){
	        //for(var i=0;i<this.num;i++){
	            p = this.ps[i];
	            p.normal.copy( c.nor );
	            p.tangent.copy( c.tan );
	            p.binormal.copy( c.bin );

	            p.normalImpulse = c.norImp;
	            p.tangentImpulse = c.tanImp;
	            p.binormalImpulse = c.binImp;
	            p.normalDenominator = c.norDen;
	            p.tangentDenominator = c.tanDen;
	            p.binormalDenominator = c.binDen;
	            c=c.next;
	        }
	    }

	});

	/**
	* A contact is a pair of shapes whose axis-aligned bounding boxes are overlapping.
	* @author saharan
	*/

	function Contact(){

	    // The first shape.
	    this.shape1 = null;
	    // The second shape.
	    this.shape2 = null;
	    // The first rigid body.
	    this.body1 = null;
	    // The second rigid body.
	    this.body2 = null;
	    // The previous contact in the world.
	    this.prev = null;
	    // The next contact in the world.
	    this.next = null;
	    // Internal
	    this.persisting = false;
	    // Whether both the rigid bodies are sleeping or not.
	    this.sleeping = false;
	    // The collision detector between two shapes.
	    this.detector = null;
	    // The contact constraint of the contact.
	    this.constraint = null;
	    // Whether the shapes are touching or not.
	    this.touching = false;
	    // shapes is very close and touching 
	    this.close = false;

	    this.dist = _Math.INF;

	    this.b1Link = new ContactLink( this );
	    this.b2Link = new ContactLink( this );
	    this.s1Link = new ContactLink( this );
	    this.s2Link = new ContactLink( this );

	    // The contact manifold of the contact.
	    this.manifold = new ContactManifold();

	    this.buffer = [

	        new ImpulseDataBuffer(),
	        new ImpulseDataBuffer(),
	        new ImpulseDataBuffer(),
	        new ImpulseDataBuffer()

	    ];

	    this.points = this.manifold.points;
	    this.constraint = new ContactConstraint( this.manifold );
	    
	}

	Object.assign( Contact.prototype, {

	    Contact: true,

	    mixRestitution: function ( restitution1, restitution2 ) {

	        return _Math.sqrt(restitution1*restitution2);

	    },
	    mixFriction: function ( friction1, friction2 ) {

	        return _Math.sqrt(friction1*friction2);

	    },

	    /**
	    * Update the contact manifold.
	    */
	    updateManifold: function () {

	        this.constraint.restitution =this.mixRestitution(this.shape1.restitution,this.shape2.restitution);
	        this.constraint.friction=this.mixFriction(this.shape1.friction,this.shape2.friction);
	        var numBuffers=this.manifold.numPoints;
	        var i = numBuffers;
	        while(i--){
	        //for(var i=0;i<numBuffers;i++){
	            var b = this.buffer[i];
	            var p = this.points[i];
	            b.lp1X=p.localPoint1.x;
	            b.lp1Y=p.localPoint1.y;
	            b.lp1Z=p.localPoint1.z;
	            b.lp2X=p.localPoint2.x;
	            b.lp2Y=p.localPoint2.y;
	            b.lp2Z=p.localPoint2.z;
	            b.impulse=p.normalImpulse;
	        }
	        this.manifold.numPoints=0;
	        this.detector.detectCollision(this.shape1,this.shape2,this.manifold);
	        var num=this.manifold.numPoints;
	        if(num==0){
	            this.touching = false;
	            this.close = false;
	            this.dist = _Math.INF;
	            return;
	        }

	        if( this.touching || this.dist < 0.001 ) this.close = true;
	        this.touching=true;
	        i = num;
	        while(i--){
	        //for(i=0; i<num; i++){
	            p=this.points[i];
	            var lp1x=p.localPoint1.x;
	            var lp1y=p.localPoint1.y;
	            var lp1z=p.localPoint1.z;
	            var lp2x=p.localPoint2.x;
	            var lp2y=p.localPoint2.y;
	            var lp2z=p.localPoint2.z;
	            var index=-1;
	            var minDistance=0.0004;
	            var j = numBuffers;
	            while(j--){
	            //for(var j=0;j<numBuffers;j++){
	                b=this.buffer[j];
	                var dx=b.lp1X-lp1x;
	                var dy=b.lp1Y-lp1y;
	                var dz=b.lp1Z-lp1z;
	                var distance1=dx*dx+dy*dy+dz*dz;
	                dx=b.lp2X-lp2x;
	                dy=b.lp2Y-lp2y;
	                dz=b.lp2Z-lp2z;
	                var distance2=dx*dx+dy*dy+dz*dz;
	                if(distance1<distance2){
	                    if(distance1<minDistance){
	                        minDistance=distance1;
	                        index=j;
	                    }
	                }else{
	                    if(distance2<minDistance){
	                        minDistance=distance2;
	                        index=j;
	                    }
	                }

	                if( minDistance < this.dist ) this.dist = minDistance;

	            }
	            if(index!=-1){
	                var tmp=this.buffer[index];
	                this.buffer[index]=this.buffer[--numBuffers];
	                this.buffer[numBuffers]=tmp;
	                p.normalImpulse=tmp.impulse;
	                p.warmStarted=true;
	            }else{
	                p.normalImpulse=0;
	                p.warmStarted=false;
	            }
	        }
	    },
	    /**
	    * Attach the contact to the shapes.
	    * @param   shape1
	    * @param   shape2
	    */
	    attach:function(shape1,shape2){
	        this.shape1=shape1;
	        this.shape2=shape2;
	        this.body1=shape1.parent;
	        this.body2=shape2.parent;

	        this.manifold.body1=this.body1;
	        this.manifold.body2=this.body2;
	        this.constraint.body1=this.body1;
	        this.constraint.body2=this.body2;
	        this.constraint.attach();

	        this.s1Link.shape=shape2;
	        this.s1Link.body=this.body2;
	        this.s2Link.shape=shape1;
	        this.s2Link.body=this.body1;

	        if(shape1.contactLink!=null)(this.s1Link.next=shape1.contactLink).prev=this.s1Link;
	        else this.s1Link.next=null;
	        shape1.contactLink=this.s1Link;
	        shape1.numContacts++;

	        if(shape2.contactLink!=null)(this.s2Link.next=shape2.contactLink).prev=this.s2Link;
	        else this.s2Link.next=null;
	        shape2.contactLink=this.s2Link;
	        shape2.numContacts++;

	        this.b1Link.shape=shape2;
	        this.b1Link.body=this.body2;
	        this.b2Link.shape=shape1;
	        this.b2Link.body=this.body1;

	        if(this.body1.contactLink!=null)(this.b1Link.next=this.body1.contactLink).prev=this.b1Link;
	        else this.b1Link.next=null;
	        this.body1.contactLink=this.b1Link;
	        this.body1.numContacts++;

	        if(this.body2.contactLink!=null)(this.b2Link.next=this.body2.contactLink).prev=this.b2Link;
	        else this.b2Link.next=null;
	        this.body2.contactLink=this.b2Link;
	        this.body2.numContacts++;

	        this.prev=null;
	        this.next=null;

	        this.persisting=true;
	        this.sleeping=this.body1.sleeping&&this.body2.sleeping;
	        this.manifold.numPoints=0;
	    },
	    /**
	    * Detach the contact from the shapes.
	    */
	    detach:function(){
	        var prev=this.s1Link.prev;
	        var next=this.s1Link.next;
	        if(prev!==null)prev.next=next;
	        if(next!==null)next.prev=prev;
	        if(this.shape1.contactLink==this.s1Link)this.shape1.contactLink=next;
	        this.s1Link.prev=null;
	        this.s1Link.next=null;
	        this.s1Link.shape=null;
	        this.s1Link.body=null;
	        this.shape1.numContacts--;

	        prev=this.s2Link.prev;
	        next=this.s2Link.next;
	        if(prev!==null)prev.next=next;
	        if(next!==null)next.prev=prev;
	        if(this.shape2.contactLink==this.s2Link)this.shape2.contactLink=next;
	        this.s2Link.prev=null;
	        this.s2Link.next=null;
	        this.s2Link.shape=null;
	        this.s2Link.body=null;
	        this.shape2.numContacts--;

	        prev=this.b1Link.prev;
	        next=this.b1Link.next;
	        if(prev!==null)prev.next=next;
	        if(next!==null)next.prev=prev;
	        if(this.body1.contactLink==this.b1Link)this.body1.contactLink=next;
	        this.b1Link.prev=null;
	        this.b1Link.next=null;
	        this.b1Link.shape=null;
	        this.b1Link.body=null;
	        this.body1.numContacts--;

	        prev=this.b2Link.prev;
	        next=this.b2Link.next;
	        if(prev!==null)prev.next=next;
	        if(next!==null)next.prev=prev;
	        if(this.body2.contactLink==this.b2Link)this.body2.contactLink=next;
	        this.b2Link.prev=null;
	        this.b2Link.next=null;
	        this.b2Link.shape=null;
	        this.b2Link.body=null;
	        this.body2.numContacts--;

	        this.manifold.body1=null;
	        this.manifold.body2=null;
	        this.constraint.body1=null;
	        this.constraint.body2=null;
	        this.constraint.detach();

	        this.shape1=null;
	        this.shape2=null;
	        this.body1=null;
	        this.body2=null;
	    }

	} );

	/**
	* The class of rigid body.
	* Rigid body has the shape of a single or multiple collision processing,
	* I can set the parameters individually.
	* @author saharan
	* @author lo-th
	*/

	function RigidBody ( Position, Rotation ) {

	    this.position = Position || new Vec3();
	    this.orientation = Rotation || new Quat();

	    this.scale = 1;
	    this.invScale = 1;

	    // possible link to three Mesh;
	    this.mesh = null;

	    this.id = NaN;
	    this.name = "";
	    // The maximum number of shapes that can be added to a one rigid.
	    //this.MAX_SHAPES = 64;//64;

	    this.prev = null;
	    this.next = null;

	    // I represent the kind of rigid body.
	    // Please do not change from the outside this variable.
	    // If you want to change the type of rigid body, always
	    // Please specify the type you want to set the arguments of setupMass method.
	    this.type = BODY_NULL;

	    this.massInfo = new MassInfo();

	    this.newPosition = new Vec3();
	    this.controlPos = false;
	    this.newOrientation = new Quat();
	    this.newRotation = new Vec3();
	    this.currentRotation = new Vec3();
	    this.controlRot = false;
	    this.controlRotInTime = false;

	    this.quaternion = new Quat();
	    this.pos = new Vec3();



	    // Is the translational velocity.
	    this.linearVelocity = new Vec3();
	    // Is the angular velocity.
	    this.angularVelocity = new Vec3();

	    //--------------------------------------------
	    //  Please do not change from the outside this variables.
	    //--------------------------------------------

	    // It is a world that rigid body has been added.
	    this.parent = null;
	    this.contactLink = null;
	    this.numContacts = 0;

	    // An array of shapes that are included in the rigid body.
	    this.shapes = null;
	    // The number of shapes that are included in the rigid body.
	    this.numShapes = 0;

	    // It is the link array of joint that is connected to the rigid body.
	    this.jointLink = null;
	    // The number of joints that are connected to the rigid body.
	    this.numJoints = 0;

	    // It is the world coordinate of the center of gravity in the sleep just before.
	    this.sleepPosition = new Vec3();
	    // It is a quaternion that represents the attitude of sleep just before.
	    this.sleepOrientation = new Quat();
	    // I will show this rigid body to determine whether it is a rigid body static.
	    this.isStatic = false;
	    // I indicates that this rigid body to determine whether it is a rigid body dynamic.
	    this.isDynamic = false;

	    this.isKinematic = false;

	    // It is a rotation matrix representing the orientation.
	    this.rotation = new Mat33();

	    //--------------------------------------------
	    // It will be recalculated automatically from the shape, which is included.
	    //--------------------------------------------

	    // This is the weight.
	    this.mass = 0;
	    // It is the reciprocal of the mass.
	    this.inverseMass = 0;
	    // It is the inverse of the inertia tensor in the world system.
	    this.inverseInertia = new Mat33();
	    // It is the inertia tensor in the initial state.
	    this.localInertia = new Mat33();
	    // It is the inverse of the inertia tensor in the initial state.
	    this.inverseLocalInertia = new Mat33();

	    this.tmpInertia = new Mat33();


	    // I indicates rigid body whether it has been added to the simulation Island.
	    this.addedToIsland = false;
	    // It shows how to sleep rigid body.
	    this.allowSleep = true;
	    // This is the time from when the rigid body at rest.
	    this.sleepTime = 0;
	    // I shows rigid body to determine whether it is a sleep state.
	    this.sleeping = false;

	}

	Object.assign( RigidBody.prototype, {

	    setParent: function ( world ) {

	        this.parent = world;
	        this.scale = this.parent.scale;
	        this.invScale = this.parent.invScale;
	        this.id = this.parent.numRigidBodies;
	        if( !this.name ) this.name = this.id;

	        this.updateMesh();

	    },

	    /**
	     * I'll add a shape to rigid body.
	     * If you add a shape, please call the setupMass method to step up to the start of the next.
	     * @param   shape shape to Add
	     */
	    addShape:function(shape){

	        if(shape.parent){
				printError("RigidBody", "It is not possible that you add a shape which already has an associated body.");
			}

	        if(this.shapes!=null)( this.shapes.prev = shape ).next = this.shapes;
	        this.shapes = shape;
	        shape.parent = this;
	        if(this.parent) this.parent.addShape( shape );
	        this.numShapes++;

	    },
	    /**
	     * I will delete the shape from the rigid body.
	     * If you delete a shape, please call the setupMass method to step up to the start of the next.
	     * @param shape {Shape} to delete
	     * @return void
	     */
	    removeShape:function(shape){

	        var remove = shape;
	        if(remove.parent!=this)return;
	        var prev=remove.prev;
	        var next=remove.next;
	        if(prev!=null) prev.next=next;
	        if(next!=null) next.prev=prev;
	        if(this.shapes==remove)this.shapes=next;
	        remove.prev=null;
	        remove.next=null;
	        remove.parent=null;
	        if(this.parent)this.parent.removeShape(remove);
	        this.numShapes--;

	    },

	    remove: function () {

	        this.dispose();

	    },

	    dispose: function () {

	        this.parent.removeRigidBody( this );

	    },

	    checkContact: function( name ) {

	        this.parent.checkContact( this.name, name );

	    },

	    /**
	     * Calulates mass datas(center of gravity, mass, moment inertia, etc...).
	     * If the parameter type is set to BODY_STATIC, the rigid body will be fixed to the space.
	     * If the parameter adjustPosition is set to true, the shapes' relative positions and
	     * the rigid body's position will be adjusted to the center of gravity.
	     * @param type
	     * @param adjustPosition
	     * @return void
	     */
	    setupMass: function ( type, AdjustPosition ) {

	        var adjustPosition = ( AdjustPosition !== undefined ) ? AdjustPosition : true;

	        this.type = type || BODY_STATIC;
	        this.isDynamic = this.type === BODY_DYNAMIC;
	        this.isStatic = this.type === BODY_STATIC;

	        this.mass = 0;
	        this.localInertia.set(0,0,0,0,0,0,0,0,0);


	        var tmpM = new Mat33();
	        var tmpV = new Vec3();

	        for( var shape = this.shapes; shape !== null; shape = shape.next ){

	            shape.calculateMassInfo( this.massInfo );
	            var shapeMass = this.massInfo.mass;
	            tmpV.addScaledVector(shape.relativePosition, shapeMass);
	            this.mass += shapeMass;
	            this.rotateInertia( shape.relativeRotation, this.massInfo.inertia, tmpM );
	            this.localInertia.add( tmpM );

	            // add offset inertia
	            this.localInertia.addOffset( shapeMass, shape.relativePosition );

	        }

	        this.inverseMass = 1 / this.mass;
	        tmpV.scaleEqual( this.inverseMass );

	        if( adjustPosition ){
	            this.position.add( tmpV );
	            for( shape=this.shapes; shape !== null; shape = shape.next ){
	                shape.relativePosition.subEqual(tmpV);
	            }

	            // subtract offset inertia
	            this.localInertia.subOffset( this.mass, tmpV );

	        }

	        this.inverseLocalInertia.invert( this.localInertia );

	        //}

	        if( this.type === BODY_STATIC ){
	            this.inverseMass = 0;
	            this.inverseLocalInertia.set(0,0,0,0,0,0,0,0,0);
	        }

	        this.syncShapes();
	        this.awake();

	    },
	    /**
	     * Awake the rigid body.
	     */
	    awake:function(){

	        if( !this.allowSleep || !this.sleeping ) return;
	        this.sleeping = false;
	        this.sleepTime = 0;
	        // awake connected constraints
	        var cs = this.contactLink;
	        while(cs != null){
	            cs.body.sleepTime = 0;
	            cs.body.sleeping = false;
	            cs = cs.next;
	        }
	        var js = this.jointLink;
	        while(js != null){
	            js.body.sleepTime = 0;
	            js.body.sleeping = false;
	            js = js.next;
	        }
	        for(var shape = this.shapes; shape!=null; shape = shape.next){
	            shape.updateProxy();
	        }

	    },
	    /**
	     * Sleep the rigid body.
	     */
	    sleep:function(){

	        if( !this.allowSleep || this.sleeping ) return;

	        this.linearVelocity.set(0,0,0);
	        this.angularVelocity.set(0,0,0);
	        this.sleepPosition.copy( this.position );
	        this.sleepOrientation.copy( this.orientation );

	        this.sleepTime = 0;
	        this.sleeping = true;
	        for( var shape = this.shapes; shape != null; shape = shape.next ) {
	            shape.updateProxy();
	        }
	    },

	    testWakeUp: function(){

	        if( this.linearVelocity.testZero() || this.angularVelocity.testZero() || this.position.testDiff( this.sleepPosition ) || this.orientation.testDiff( this.sleepOrientation )) this.awake(); // awake the body

	    },

	    /**
	     * Get whether the rigid body has not any connection with others.
	     * @return {void}
	     */
	    isLonely: function () {
	        return this.numJoints==0 && this.numContacts==0;
	    },

	    /**
	     * The time integration of the motion of a rigid body, you can update the information such as the shape.
	     * This method is invoked automatically when calling the step of the World,
	     * There is no need to call from outside usually.
	     * @param  timeStep time
	     * @return {void}
	     */

	    updatePosition: function ( timeStep ) {
	        switch(this.type){
	            case BODY_STATIC:
	                this.linearVelocity.set(0,0,0);
	                this.angularVelocity.set(0,0,0);

	                // ONLY FOR TEST
	                if(this.controlPos){
	                    this.position.copy(this.newPosition);
	                    this.controlPos = false;
	                }
	                if(this.controlRot){
	                    this.orientation.copy(this.newOrientation);
	                    this.controlRot = false;
	                }
	                /*this.linearVelocity.x=0;
	                this.linearVelocity.y=0;
	                this.linearVelocity.z=0;
	                this.angularVelocity.x=0;
	                this.angularVelocity.y=0;
	                this.angularVelocity.z=0;*/
	            break;
	            case BODY_DYNAMIC:

	                if( this.isKinematic ){

	                    this.linearVelocity.set(0,0,0);
	                    this.angularVelocity.set(0,0,0);

	                }

	                if(this.controlPos){

	                    this.linearVelocity.subVectors( this.newPosition, this.position ).multiplyScalar(1/timeStep);
	                    this.controlPos = false;

	                }
	                if(this.controlRot){

	                    this.angularVelocity.copy( this.getAxis() );
	                    this.orientation.copy( this.newOrientation );
	                    this.controlRot = false;

	                }

	                this.position.addScaledVector(this.linearVelocity, timeStep);
	                this.orientation.addTime(this.angularVelocity, timeStep);

	                this.updateMesh();

	            break;
	            default: printError("RigidBody", "Invalid type.");
	        }

	        this.syncShapes();
	        this.updateMesh();

	    },

	    getAxis: function () {

	        return new Vec3( 0,1,0 ).applyMatrix3( this.inverseLocalInertia, true ).normalize();

	    },

	    rotateInertia: function ( rot, inertia, out ) {

	        this.tmpInertia.multiplyMatrices( rot, inertia );
	        out.multiplyMatrices( this.tmpInertia, rot, true );

	    },

	    syncShapes: function () {

	        this.rotation.setQuat( this.orientation );
	        this.rotateInertia( this.rotation, this.inverseLocalInertia, this.inverseInertia );
	        
	        for(var shape = this.shapes; shape!=null; shape = shape.next){

	            shape.position.copy( shape.relativePosition ).applyMatrix3( this.rotation, true ).add( this.position );
	            // add by QuaziKb
	            shape.rotation.multiplyMatrices( this.rotation, shape.relativeRotation );
	            shape.updateProxy();
	        }
	    },


	    //---------------------------------------------
	    // APPLY IMPULSE FORCE
	    //---------------------------------------------

	    applyImpulse: function(position, force){
	        this.linearVelocity.addScaledVector(force, this.inverseMass);
	        var rel = new Vec3().copy( position ).sub( this.position ).cross( force ).applyMatrix3( this.inverseInertia, true );
	        this.angularVelocity.add( rel );
	    },


	    //---------------------------------------------
	    // SET DYNAMIQUE POSITION AND ROTATION
	    //---------------------------------------------

	    setPosition: function(pos){
	        this.newPosition.copy( pos ).multiplyScalar( this.invScale );
	        this.controlPos = true;
	        if( !this.isKinematic ) this.isKinematic = true;
	    },

	    setQuaternion: function(q){
	        this.newOrientation.set(q.x, q.y, q.z, q.w);
	        this.controlRot = true;
	        if( !this.isKinematic ) this.isKinematic = true;
	    },

	    setRotation: function ( rot ) {

	        this.newOrientation = new Quat().setFromEuler( rot.x * _Math.degtorad, rot.y * _Math.degtorad, rot.y * _Math.degtorad );//this.rotationVectToQuad( rot );
	        this.controlRot = true;

	    },

	    //---------------------------------------------
	    // RESET DYNAMIQUE POSITION AND ROTATION
	    //---------------------------------------------

	    resetPosition:function(x,y,z){

	        this.linearVelocity.set( 0, 0, 0 );
	        this.angularVelocity.set( 0, 0, 0 );
	        this.position.set( x, y, z ).multiplyScalar( this.invScale );
	        //this.position.set( x*OIMO.WorldScale.invScale, y*OIMO.WorldScale.invScale, z*OIMO.WorldScale.invScale );
	        this.awake();
	    },

	    resetQuaternion:function( q ){

	        this.angularVelocity.set(0,0,0);
	        this.orientation = new Quat( q.x, q.y, q.z, q.w );
	        this.awake();

	    },

	    resetRotation:function(x,y,z){

	        this.angularVelocity.set(0,0,0);
	        this.orientation = new Quat().setFromEuler( x * _Math.degtorad, y * _Math.degtorad,  z * _Math.degtorad );//this.rotationVectToQuad( new Vec3(x,y,z) );
	        this.awake();

	    },

	    //---------------------------------------------
	    // GET POSITION AND ROTATION
	    //---------------------------------------------

	    getPosition:function () {

	        return this.pos;

	    },

	    getQuaternion: function () {

	        return this.quaternion;

	    },

	    //---------------------------------------------
	    // AUTO UPDATE THREE MESH
	    //---------------------------------------------

	    connectMesh: function ( mesh ) {

	        this.mesh = mesh;
	        this.updateMesh();

	    },

	    updateMesh: function(){

	        this.pos.scale( this.position, this.scale );
	        this.quaternion.copy( this.orientation );

	        if( this.mesh === null ) return;

	        this.mesh.position.copy( this.getPosition() );
	        this.mesh.quaternion.copy( this.getQuaternion() );

	    },

	} );

	/**
	* A pair of shapes that may collide.
	* @author saharan
	*/
	function Pair ( s1, s2 ){

	    // The first shape.
	    this.shape1 = s1 || null;
	    // The second shape.
	    this.shape2 = s2 || null;

	}

	/**
	* The broad-phase is used for collecting all possible pairs for collision.
	*/

	 function BroadPhase(){

	    this.types = BR_NULL;
	    this.numPairChecks = 0;
	    this.numPairs = 0;
	    this.pairs = [];

	}

	Object.assign( BroadPhase.prototype, {

	    BroadPhase: true,

	    // Create a new proxy.
	    createProxy: function ( shape ) {

	        printError("BroadPhase","Inheritance error.");

	    },

	    // Add the proxy into the broad-phase.
	    addProxy: function ( proxy ) {

	        printError("BroadPhase","Inheritance error.");
	    },

	    // Remove the proxy from the broad-phase.
	    removeProxy: function ( proxy ) {

	        printError("BroadPhase","Inheritance error.");

	    },

	    // Returns whether the pair is available or not.
	    isAvailablePair: function ( s1, s2 ) {

	        var b1 = s1.parent;
	        var b2 = s2.parent;
	        if( b1 == b2 || // same parents
	            (!b1.isDynamic && !b2.isDynamic) || // static or kinematic object
	            (s1.belongsTo&s2.collidesWith)==0 ||
	            (s2.belongsTo&s1.collidesWith)==0 // collision filtering
	        ){ return false; }
	        var js;
	        if(b1.numJoints<b2.numJoints) js = b1.jointLink;
	        else js = b2.jointLink;
	        while(js!==null){
	           var joint = js.joint;
	           if( !joint.allowCollision && ((joint.body1==b1 && joint.body2==b2) || (joint.body1==b2 && joint.body2==b1)) ){ return false; }
	           js = js.next;
	        }

	        return true;

	    },

	    // Detect overlapping pairs.
	    detectPairs: function () {

	        // clear old
	        this.pairs = [];
	        this.numPairs = 0;
	        this.numPairChecks = 0;
	        this.collectPairs();

	    },

	    collectPairs: function () {

	        Error("BroadPhase", "Inheritance error.");

	    },

	    addPair: function ( s1, s2 ) {

	        var pair = new Pair( s1, s2 );
	        this.pairs.push(pair);
	        this.numPairs++;

	    }

	});

	var count$1 = 0;
	function ProxyIdCount() { return count$1++; }

	/**
	 * A proxy is used for broad-phase collecting pairs that can be colliding.
	 *
	 * @author lo-th
	 */

	function Proxy( shape ) {

		//The parent shape.
	    this.shape = shape;

	    //The axis-aligned bounding box.
	    this.aabb = shape.aabb;

	}

	Object.assign( Proxy.prototype, {

	    Proxy: true,

		// Update the proxy. Must be inherited by a child.

	    update: function(){

	        printError("Proxy","Inheritance error.");

	    }

	});

	/**
	* A basic implementation of proxies.
	*
	* @author saharan
	*/

	function BasicProxy ( shape ) {

	    Proxy.call( this, shape );

	    this.id = ProxyIdCount();

	}

	BasicProxy.prototype = Object.assign( Object.create( Proxy.prototype ), {

	    constructor: BasicProxy,

	    update: function () {

	    }

	});

	/**
	* A broad-phase algorithm with brute-force search.
	* This always checks for all possible pairs.
	*/

	function BruteForceBroadPhase(){

	    BroadPhase.call( this );
	    this.types = BR_BRUTE_FORCE;
	    //this.numProxies=0;
	    ///this.maxProxies = 256;
	    this.proxies = [];
	    //this.proxies.length = 256;

	}


	BruteForceBroadPhase.prototype = Object.assign( Object.create( BroadPhase.prototype ), {

	    constructor: BruteForceBroadPhase,

	    createProxy: function ( shape ) {

	        return new BasicProxy( shape );

	    },

	    addProxy: function ( proxy ) {

	        /*if(this.numProxies==this.maxProxies){
	            //this.maxProxies<<=1;
	            this.maxProxies*=2;
	            var newProxies=[];
	            newProxies.length = this.maxProxies;
	            var i = this.numProxies;
	            while(i--){
	            //for(var i=0, l=this.numProxies;i<l;i++){
	                newProxies[i]=this.proxies[i];
	            }
	            this.proxies=newProxies;
	        }*/
	        //this.proxies[this.numProxies++] = proxy;
	        this.proxies.push( proxy );
	        //this.numProxies++;

	    },

	    removeProxy: function ( proxy ) {

	        var n = this.proxies.indexOf( proxy );
	        if ( n > -1 ){
	            this.proxies.splice( n, 1 );
	            //this.numProxies--;
	        }

	        /*var i = this.numProxies;
	        while(i--){
	        //for(var i=0, l=this.numProxies;i<l;i++){
	            if(this.proxies[i] == proxy){
	                this.proxies[i] = this.proxies[--this.numProxies];
	                this.proxies[this.numProxies] = null;
	                return;
	            }
	        }*/

	    },

	    collectPairs: function () {

	        var i = 0, j, p1, p2;

	        var px = this.proxies;
	        var l = px.length;//this.numProxies;
	        //var ar1 = [];
	        //var ar2 = [];

	        //for( i = px.length ; i-- ; ar1[ i ] = px[ i ] ){};
	        //for( i = px.length ; i-- ; ar2[ i ] = px[ i ] ){};

	        //var ar1 = JSON.parse(JSON.stringify(this.proxies))
	        //var ar2 = JSON.parse(JSON.stringify(this.proxies))

	        this.numPairChecks = l*(l-1)>>1;
	        //this.numPairChecks=this.numProxies*(this.numProxies-1)*0.5;

	        while( i < l ){
	            p1 = px[i++];
	            j = i + 1;
	            while( j < l ){
	                p2 = px[j++];
	                if ( p1.aabb.intersectTest( p2.aabb ) || !this.isAvailablePair( p1.shape, p2.shape ) ) continue;
	                this.addPair( p1.shape, p2.shape );
	            }
	        }

	    }

	});

	/**
	 * A projection axis for sweep and prune broad-phase.
	 * @author saharan
	 */

	function SAPAxis (){

	    this.numElements = 0;
	    this.bufferSize = 256;
	    this.elements = [];
	    this.elements.length = this.bufferSize;
	    this.stack = new Float32Array( 64 );

	}

	Object.assign( SAPAxis.prototype, {

	    SAPAxis: true,

	    addElements: function ( min, max ) {

	        if(this.numElements+2>=this.bufferSize){
	            //this.bufferSize<<=1;
	            this.bufferSize*=2;
	            var newElements=[];
	            var i = this.numElements;
	            while(i--){
	            //for(var i=0, l=this.numElements; i<l; i++){
	                newElements[i] = this.elements[i];
	            }
	        }
	        this.elements[this.numElements++] = min;
	        this.elements[this.numElements++] = max;

	    },

	    removeElements: function ( min, max ) {

	        var minIndex=-1;
	        var maxIndex=-1;
	        for(var i=0, l=this.numElements; i<l; i++){
	            var e=this.elements[i];
	            if(e==min||e==max){
	                if(minIndex==-1){
	                    minIndex=i;
	                }else{
	                    maxIndex=i;
	                break;
	                }
	            }
	        }
	        for(i = minIndex+1, l = maxIndex; i < l; i++){
	            this.elements[i-1] = this.elements[i];
	        }
	        for(i = maxIndex+1, l = this.numElements; i < l; i++){
	            this.elements[i-2] = this.elements[i];
	        }

	        this.elements[--this.numElements] = null;
	        this.elements[--this.numElements] = null;

	    },

	    sort: function () {

	        var count = 0;
	        var threshold = 1;
	        while((this.numElements >> threshold) != 0 ) threshold++;
	        threshold = threshold * this.numElements >> 2;
	        count = 0;

	        var giveup = false;
	        var elements = this.elements;
	        for( var i = 1, l = this.numElements; i < l; i++){ // try insertion sort
	            var tmp=elements[i];
	            var pivot=tmp.value;
	            var tmp2=elements[i-1];
	            if(tmp2.value>pivot){
	                var j=i;
	                do{
	                    elements[j]=tmp2;
	                    if(--j==0)break;
	                    tmp2=elements[j-1];
	                }while(tmp2.value>pivot);
	                elements[j]=tmp;
	                count+=i-j;
	                if(count>threshold){
	                    giveup=true; // stop and use quick sort
	                    break;
	                }
	            }
	        }
	        if(!giveup)return;
	        count=2;var stack=this.stack;
	        stack[0]=0;
	        stack[1]=this.numElements-1;
	        while(count>0){
	            var right=stack[--count];
	            var left=stack[--count];
	            var diff=right-left;
	            if(diff>16){  // quick sort
	                //var mid=left+(diff>>1);
	                var mid = left + (_Math.floor(diff*0.5));
	                tmp = elements[mid];
	                elements[mid] = elements[right];
	                elements[right] = tmp;
	                pivot = tmp.value;
	                i = left-1;
	                j = right;
	                while( true ){
	                    var ei;
	                    var ej;
	                    do{ ei = elements[++i]; } while( ei.value < pivot);
	                    do{ ej = elements[--j]; } while( pivot < ej.value && j != left );
	                    if( i >= j ) break;
	                    elements[i] = ej;
	                    elements[j] = ei;
	                }

	                elements[right] = elements[i];
	                elements[i] = tmp;
	                if( i - left > right - i ) {
	                    stack[count++] = left;
	                    stack[count++] = i - 1;
	                    stack[count++] = i + 1;
	                    stack[count++] = right;
	                }else{
	                    stack[count++] = i + 1;
	                    stack[count++] = right;
	                    stack[count++] = left;
	                    stack[count++] = i - 1;
	                }
	            }else{
	                for( i = left + 1; i <= right; i++ ) {
	                    tmp = elements[i];
	                    pivot = tmp.value;
	                    tmp2 = elements[i-1];
	                    if( tmp2.value > pivot ) {
	                        j = i;
	                        do{
	                            elements[j] = tmp2;
	                            if( --j == 0 ) break;
	                            tmp2 = elements[j-1];
	                        }while( tmp2.value > pivot );
	                        elements[j] = tmp;
	                    }
	                }
	            }
	        }
	        
	    },

	    calculateTestCount: function () {

	        var num = 1;
	        var sum = 0;
	        for(var i = 1, l = this.numElements; i<l; i++){
	            if(this.elements[i].max){
	                num--;
	            }else{
	                sum += num;
	                num++;
	            }
	        }
	        return sum;

	    }

	});

	/**
	 * An element of proxies.
	 * @author saharan
	 */

	function SAPElement ( proxy, max ) {

	    // The parent proxy
	    this.proxy = proxy;
		// The pair element.
	    this.pair = null;
	    // The minimum element on other axis.
	    this.min1 = null;
	    // The maximum element on other axis.
	    this.max1 = null;
	    // The minimum element on other axis.
	    this.min2 = null;
	    // The maximum element on other axis.
	    this.max2 = null;
	    // Whether the element has maximum value or not.
	    this.max = max;
	    // The value of the element.
	    this.value = 0;

	}

	/**
	 * A proxy for sweep and prune broad-phase.
	 * @author saharan
	 * @author lo-th
	 */

	function SAPProxy ( sap, shape ){

	    Proxy.call( this, shape );
	    // Type of the axis to which the proxy belongs to. [0:none, 1:dynamic, 2:static]
	    this.belongsTo = 0;
	    // The maximum elements on each axis.
	    this.max = [];
	    // The minimum elements on each axis.
	    this.min = [];
	    
	    this.sap = sap;
	    this.min[0] = new SAPElement( this, false );
	    this.max[0] = new SAPElement( this, true );
	    this.min[1] = new SAPElement( this, false );
	    this.max[1] = new SAPElement( this, true );
	    this.min[2] = new SAPElement( this, false );
	    this.max[2] = new SAPElement( this, true );
	    this.max[0].pair = this.min[0];
	    this.max[1].pair = this.min[1];
	    this.max[2].pair = this.min[2];
	    this.min[0].min1 = this.min[1];
	    this.min[0].max1 = this.max[1];
	    this.min[0].min2 = this.min[2];
	    this.min[0].max2 = this.max[2];
	    this.min[1].min1 = this.min[0];
	    this.min[1].max1 = this.max[0];
	    this.min[1].min2 = this.min[2];
	    this.min[1].max2 = this.max[2];
	    this.min[2].min1 = this.min[0];
	    this.min[2].max1 = this.max[0];
	    this.min[2].min2 = this.min[1];
	    this.min[2].max2 = this.max[1];

	}

	SAPProxy.prototype = Object.assign( Object.create( Proxy.prototype ), {

	    constructor: SAPProxy,


	    // Returns whether the proxy is dynamic or not.
	    isDynamic: function () {

	        var body = this.shape.parent;
	        return body.isDynamic && !body.sleeping;

	    },

	    update: function () {

	        var te = this.aabb.elements;
	        this.min[0].value = te[0];
	        this.min[1].value = te[1];
	        this.min[2].value = te[2];
	        this.max[0].value = te[3];
	        this.max[1].value = te[4];
	        this.max[2].value = te[5];

	        if( this.belongsTo == 1 && !this.isDynamic() || this.belongsTo == 2 && this.isDynamic() ){
	            this.sap.removeProxy(this);
	            this.sap.addProxy(this);
	        }

	    }

	});

	/**
	 * A broad-phase collision detection algorithm using sweep and prune.
	 * @author saharan
	 * @author lo-th
	 */

	function SAPBroadPhase () {

	    BroadPhase.call( this);
	    this.types = BR_SWEEP_AND_PRUNE;

	    this.numElementsD = 0;
	    this.numElementsS = 0;
	    // dynamic proxies
	    this.axesD = [
	       new SAPAxis(),
	       new SAPAxis(),
	       new SAPAxis()
	    ];
	    // static or sleeping proxies
	    this.axesS = [
	       new SAPAxis(),
	       new SAPAxis(),
	       new SAPAxis()
	    ];

	    this.index1 = 0;
	    this.index2 = 1;

	}

	SAPBroadPhase.prototype = Object.assign( Object.create( BroadPhase.prototype ), {

	    constructor: SAPBroadPhase,

	    createProxy: function ( shape ) {

	        return new SAPProxy( this, shape );

	    },

	    addProxy: function ( proxy ) {

	        var p = proxy;
	        if(p.isDynamic()){
	            this.axesD[0].addElements( p.min[0], p.max[0] );
	            this.axesD[1].addElements( p.min[1], p.max[1] );
	            this.axesD[2].addElements( p.min[2], p.max[2] );
	            p.belongsTo = 1;
	            this.numElementsD += 2;
	        } else {
	            this.axesS[0].addElements( p.min[0], p.max[0] );
	            this.axesS[1].addElements( p.min[1], p.max[1] );
	            this.axesS[2].addElements( p.min[2], p.max[2] );
	            p.belongsTo = 2;
	            this.numElementsS += 2;
	        }

	    },

	    removeProxy: function ( proxy ) {

	        var p = proxy;
	        if ( p.belongsTo == 0 ) return;

	        /*else if ( p.belongsTo == 1 ) {
	            this.axesD[0].removeElements( p.min[0], p.max[0] );
	            this.axesD[1].removeElements( p.min[1], p.max[1] );
	            this.axesD[2].removeElements( p.min[2], p.max[2] );
	            this.numElementsD -= 2;
	        } else if ( p.belongsTo == 2 ) {
	            this.axesS[0].removeElements( p.min[0], p.max[0] );
	            this.axesS[1].removeElements( p.min[1], p.max[1] );
	            this.axesS[2].removeElements( p.min[2], p.max[2] );
	            this.numElementsS -= 2;
	        }*/

	        switch( p.belongsTo ){
	            case 1:
	            this.axesD[0].removeElements( p.min[0], p.max[0] );
	            this.axesD[1].removeElements( p.min[1], p.max[1] );
	            this.axesD[2].removeElements( p.min[2], p.max[2] );
	            this.numElementsD -= 2;
	            break;
	            case 2:
	            this.axesS[0].removeElements( p.min[0], p.max[0] );
	            this.axesS[1].removeElements( p.min[1], p.max[1] );
	            this.axesS[2].removeElements( p.min[2], p.max[2] );
	            this.numElementsS -= 2;
	            break;
	        }

	        p.belongsTo = 0;

	    },

	    collectPairs: function () {

	        if( this.numElementsD == 0 ) return;

	        var axis1 = this.axesD[this.index1];
	        var axis2 = this.axesD[this.index2];

	        axis1.sort();
	        axis2.sort();

	        var count1 = axis1.calculateTestCount();
	        var count2 = axis2.calculateTestCount();
	        var elementsD;
	        var elementsS;
	        if( count1 <= count2 ){// select the best axis
	            axis2 = this.axesS[this.index1];
	            axis2.sort();
	            elementsD = axis1.elements;
	            elementsS = axis2.elements;
	        }else{
	            axis1 = this.axesS[this.index2];
	            axis1.sort();
	            elementsD = axis2.elements;
	            elementsS = axis1.elements;
	            this.index1 ^= this.index2;
	            this.index2 ^= this.index1;
	            this.index1 ^= this.index2;
	        }
	        var activeD;
	        var activeS;
	        var p = 0;
	        var q = 0;
	        while( p < this.numElementsD ){
	            var e1;
	            var dyn;
	            if (q == this.numElementsS ){
	                e1 = elementsD[p];
	                dyn = true;
	                p++;
	            }else{
	                var d = elementsD[p];
	                var s = elementsS[q];
	                if( d.value < s.value ){
	                    e1 = d;
	                    dyn = true;
	                    p++;
	                }else{
	                    e1 = s;
	                    dyn = false;
	                    q++;
	                }
	            }
	            if( !e1.max ){
	                var s1 = e1.proxy.shape;
	                var min1 = e1.min1.value;
	                var max1 = e1.max1.value;
	                var min2 = e1.min2.value;
	                var max2 = e1.max2.value;

	                for( var e2 = activeD; e2 != null; e2 = e2.pair ) {// test for dynamic
	                    var s2 = e2.proxy.shape;

	                    this.numPairChecks++;
	                    if( min1 > e2.max1.value || max1 < e2.min1.value || min2 > e2.max2.value || max2 < e2.min2.value || !this.isAvailablePair( s1, s2 ) ) continue;
	                    this.addPair( s1, s2 );
	                }
	                if( dyn ){
	                    for( e2 = activeS; e2 != null; e2 = e2.pair ) {// test for static
	                        s2 = e2.proxy.shape;

	                        this.numPairChecks++;

	                        if( min1 > e2.max1.value || max1 < e2.min1.value|| min2 > e2.max2.value || max2 < e2.min2.value || !this.isAvailablePair(s1,s2) ) continue;
	                        this.addPair( s1, s2 );
	                    }
	                    e1.pair = activeD;
	                    activeD = e1;
	                }else{
	                    e1.pair = activeS;
	                    activeS = e1;
	                }
	            }else{
	                var min = e1.pair;
	                if( dyn ){
	                    if( min == activeD ){
	                        activeD = activeD.pair;
	                        continue;
	                    }else{
	                        e1 = activeD;
	                    }
	                }else{
	                    if( min == activeS ){
	                        activeS = activeS.pair;
	                        continue;
	                    }else{
	                        e1 = activeS;
	                    }
	                }
	                do{
	                    e2 = e1.pair;
	                    if( e2 == min ){
	                        e1.pair = e2.pair;
	                        break;
	                    }
	                    e1 = e2;
	                }while( e1 != null );
	            }
	        }
	        this.index2 = (this.index1|this.index2)^3;
	        
	    }

	});

	/**
	* A node of the dynamic bounding volume tree.
	* @author saharan
	*/

	function DBVTNode(){
	    
		// The first child node of this node.
	    this.child1 = null;
	    // The second child node of this node.
	    this.child2 = null;
	    //  The parent node of this tree.
	    this.parent = null;
	    // The proxy of this node. This has no value if this node is not leaf.
	    this.proxy = null;
	    // The maximum distance from leaf nodes.
	    this.height = 0;
	    // The AABB of this node.
	    this.aabb = new AABB();

	}

	/**
	 * A dynamic bounding volume tree for the broad-phase algorithm.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function DBVT(){

	    // The root of the tree.
	    this.root = null;
	    this.freeNodes = [];
	    this.freeNodes.length = 16384;
	    this.numFreeNodes = 0;
	    this.aabb = new AABB();

	}

	Object.assign( DBVT.prototype, {

	    DBVT: true,

	    moveLeaf: function( leaf ) {

	        this.deleteLeaf( leaf );
	        this.insertLeaf( leaf );
	    
	    },

	    insertLeaf: function ( leaf ) {

	        if(this.root == null){
	            this.root = leaf;
	            return;
	        }
	        var lb = leaf.aabb;
	        var sibling = this.root;
	        var oldArea;
	        var newArea;
	        while(sibling.proxy == null){ // descend the node to search the best pair
	            var c1 = sibling.child1;
	            var c2 = sibling.child2;
	            var b = sibling.aabb;
	            var c1b = c1.aabb;
	            var c2b = c2.aabb;
	            oldArea = b.surfaceArea();
	            this.aabb.combine(lb,b);
	            newArea = this.aabb.surfaceArea();
	            var creatingCost = newArea*2;
	            var incrementalCost = (newArea-oldArea)*2; // cost of creating a new pair with the node
	            var discendingCost1 = incrementalCost;
	            this.aabb.combine(lb,c1b);
	            if(c1.proxy!=null){
	                // leaf cost = area(combined aabb)
	                discendingCost1+=this.aabb.surfaceArea();
	            }else{
	                // node cost = area(combined aabb) - area(old aabb)
	                discendingCost1+=this.aabb.surfaceArea()-c1b.surfaceArea();
	            }
	            var discendingCost2=incrementalCost;
	            this.aabb.combine(lb,c2b);
	            if(c2.proxy!=null){
	                // leaf cost = area(combined aabb)
	                discendingCost2+=this.aabb.surfaceArea();
	            }else{
	                // node cost = area(combined aabb) - area(old aabb)
	                discendingCost2+=this.aabb.surfaceArea()-c2b.surfaceArea();
	            }
	            if(discendingCost1<discendingCost2){
	                if(creatingCost<discendingCost1){
	                    break;// stop descending
	                }else{
	                    sibling = c1;// descend into first child
	                }
	            }else{
	                if(creatingCost<discendingCost2){
	                    break;// stop descending
	                }else{
	                    sibling = c2;// descend into second child
	                }
	            }
	        }
	        var oldParent = sibling.parent;
	        var newParent;
	        if(this.numFreeNodes>0){
	            newParent = this.freeNodes[--this.numFreeNodes];
	        }else{
	            newParent = new DBVTNode();
	        }

	        newParent.parent = oldParent;
	        newParent.child1 = leaf;
	        newParent.child2 = sibling;
	        newParent.aabb.combine(leaf.aabb,sibling.aabb);
	        newParent.height = sibling.height+1;
	        sibling.parent = newParent;
	        leaf.parent = newParent;
	        if(sibling == this.root){
	            // replace root
	            this.root = newParent;
	        }else{
	            // replace child
	            if(oldParent.child1 == sibling){
	                oldParent.child1 = newParent;
	            }else{
	                oldParent.child2 = newParent;
	            }
	        }
	        // update whole tree
	        do{
	            newParent = this.balance(newParent);
	            this.fix(newParent);
	            newParent = newParent.parent;
	        }while(newParent != null);
	    },

	    getBalance: function( node ) {

	        if(node.proxy!=null)return 0;
	        return node.child1.height-node.child2.height;

	    },

	    deleteLeaf: function( leaf ) {

	        if(leaf == this.root){
	            this.root = null;
	            return;
	        }
	        var parent = leaf.parent;
	        var sibling;
	        if(parent.child1==leaf){
	            sibling=parent.child2;
	        }else{
	            sibling=parent.child1;
	        }
	        if(parent==this.root){
	            this.root=sibling;
	            sibling.parent=null;
	            return;
	        }
	        var grandParent = parent.parent;
	        sibling.parent = grandParent;
	        if(grandParent.child1 == parent ) {
	            grandParent.child1 = sibling;
	        }else{
	            grandParent.child2 = sibling;
	        }
	        if(this.numFreeNodes<16384){
	            this.freeNodes[this.numFreeNodes++] = parent;
	        }
	        do{
	            grandParent = this.balance(grandParent);
	            this.fix(grandParent);
	            grandParent = grandParent.parent;
	        }while( grandParent != null );
	    
	    },

	    balance: function( node ) {

	        var nh = node.height;
	        if(nh<2){
	            return node;
	        }
	        var p = node.parent;
	        var l = node.child1;
	        var r = node.child2;
	        var lh = l.height;
	        var rh = r.height;
	        var balance = lh-rh;
	        var t;// for bit operation

	        //          [ N ]
	        //         /     \
	        //    [ L ]       [ R ]
	        //     / \         / \
	        // [L-L] [L-R] [R-L] [R-R]

	        // Is the tree balanced?
	        if(balance>1){
	            var ll = l.child1;
	            var lr = l.child2;
	            var llh = ll.height;
	            var lrh = lr.height;

	            // Is L-L higher than L-R?
	            if(llh>lrh){
	                // set N to L-R
	                l.child2 = node;
	                node.parent = l;

	                //          [ L ]
	                //         /     \
	                //    [L-L]       [ N ]
	                //     / \         / \
	                // [...] [...] [ L ] [ R ]
	                
	                // set L-R
	                node.child1 = lr;
	                lr.parent = node;

	                //          [ L ]
	                //         /     \
	                //    [L-L]       [ N ]
	                //     / \         / \
	                // [...] [...] [L-R] [ R ]
	                
	                // fix bounds and heights
	                node.aabb.combine( lr.aabb, r.aabb );
	                t = lrh-rh;
	                node.height=lrh-(t&t>>31)+1;
	                l.aabb.combine(ll.aabb,node.aabb);
	                t=llh-nh;
	                l.height=llh-(t&t>>31)+1;
	            }else{
	                // set N to L-L
	                l.child1=node;
	                node.parent=l;

	                //          [ L ]
	                //         /     \
	                //    [ N ]       [L-R]
	                //     / \         / \
	                // [ L ] [ R ] [...] [...]
	                
	                // set L-L
	                node.child1 = ll;
	                ll.parent = node;

	                //          [ L ]
	                //         /     \
	                //    [ N ]       [L-R]
	                //     / \         / \
	                // [L-L] [ R ] [...] [...]
	                
	                // fix bounds and heights
	                node.aabb.combine(ll.aabb,r.aabb);
	                t = llh - rh;
	                node.height=llh-(t&t>>31)+1;

	                l.aabb.combine(node.aabb,lr.aabb);
	                t=nh-lrh;
	                l.height=nh-(t&t>>31)+1;
	            }
	            // set new parent of L
	            if(p!=null){
	                if(p.child1==node){
	                    p.child1=l;
	                }else{
	                    p.child2=l;
	                }
	            }else{
	                this.root=l;
	            }
	            l.parent=p;
	            return l;
	        }else if(balance<-1){
	            var rl = r.child1;
	            var rr = r.child2;
	            var rlh = rl.height;
	            var rrh = rr.height;

	            // Is R-L higher than R-R?
	            if( rlh > rrh ) {
	                // set N to R-R
	                r.child2 = node;
	                node.parent = r;

	                //          [ R ]
	                //         /     \
	                //    [R-L]       [ N ]
	                //     / \         / \
	                // [...] [...] [ L ] [ R ]
	                
	                // set R-R
	                node.child2 = rr;
	                rr.parent = node;

	                //          [ R ]
	                //         /     \
	                //    [R-L]       [ N ]
	                //     / \         / \
	                // [...] [...] [ L ] [R-R]
	                
	                // fix bounds and heights
	                node.aabb.combine(l.aabb,rr.aabb);
	                t = lh-rrh;
	                node.height = lh-(t&t>>31)+1;
	                r.aabb.combine(rl.aabb,node.aabb);
	                t = rlh-nh;
	                r.height = rlh-(t&t>>31)+1;
	            }else{
	                // set N to R-L
	                r.child1 = node;
	                node.parent = r;
	                //          [ R ]
	                //         /     \
	                //    [ N ]       [R-R]
	                //     / \         / \
	                // [ L ] [ R ] [...] [...]
	                
	                // set R-L
	                node.child2 = rl;
	                rl.parent = node;

	                //          [ R ]
	                //         /     \
	                //    [ N ]       [R-R]
	                //     / \         / \
	                // [ L ] [R-L] [...] [...]
	                
	                // fix bounds and heights
	                node.aabb.combine(l.aabb,rl.aabb);
	                t=lh-rlh;
	                node.height=lh-(t&t>>31)+1;
	                r.aabb.combine(node.aabb,rr.aabb);
	                t=nh-rrh;
	                r.height=nh-(t&t>>31)+1;
	            }
	            // set new parent of R
	            if(p!=null){
	                if(p.child1==node){
	                    p.child1=r;
	                }else{
	                    p.child2=r;
	                }
	            }else{
	                this.root=r;
	            }
	            r.parent=p;
	            return r;
	        }
	        return node;
	    },

	    fix: function ( node ) {

	        var c1 = node.child1;
	        var c2 = node.child2;
	        node.aabb.combine( c1.aabb, c2.aabb );
	        node.height = c1.height < c2.height ? c2.height+1 : c1.height+1; 

	    }
	    
	});

	/**
	* A proxy for dynamic bounding volume tree broad-phase.
	* @author saharan
	*/

	function DBVTProxy ( shape ) {

	    Proxy.call( this, shape);
	    // The leaf of the proxy.
	    this.leaf = new DBVTNode();
	    this.leaf.proxy = this;

	}

	DBVTProxy.prototype = Object.assign( Object.create( Proxy.prototype ), {

	    constructor: DBVTProxy,

	    update: function () {

	    }

	});

	/**
	 * A broad-phase algorithm using dynamic bounding volume tree.
	 *
	 * @author saharan
	 * @author lo-th
	 */

	function DBVTBroadPhase(){

	    BroadPhase.call( this );

	    this.types = BR_BOUNDING_VOLUME_TREE;

	    this.tree = new DBVT();
	    this.stack = [];
	    this.leaves = [];
	    this.numLeaves = 0;

	}

	DBVTBroadPhase.prototype = Object.assign( Object.create( BroadPhase.prototype ), {

	    constructor: DBVTBroadPhase,

	    createProxy: function ( shape ) {

	        return new DBVTProxy( shape );

	    },

	    addProxy: function ( proxy ) {

	        this.tree.insertLeaf( proxy.leaf );
	        this.leaves.push( proxy.leaf );
	        this.numLeaves++;

	    },

	    removeProxy: function ( proxy ) {

	        this.tree.deleteLeaf( proxy.leaf );
	        var n = this.leaves.indexOf( proxy.leaf );
	        if ( n > -1 ) {
	            this.leaves.splice(n,1);
	            this.numLeaves--;
	        }

	    },

	    collectPairs: function () {

	        if ( this.numLeaves < 2 ) return;

	        var leaf, margin = 0.1, i = this.numLeaves;

	        while(i--){

	            leaf = this.leaves[i];

	            if ( leaf.proxy.aabb.intersectTestTwo( leaf.aabb ) ){

	                leaf.aabb.copy( leaf.proxy.aabb, margin );
	                this.tree.deleteLeaf( leaf );
	                this.tree.insertLeaf( leaf );
	                this.collide( leaf, this.tree.root );

	            }
	        }

	    },

	    collide: function ( node1, node2 ) {

	        var stackCount = 2;
	        var s1, s2, n1, n2, l1, l2;
	        this.stack[0] = node1;
	        this.stack[1] = node2;

	        while( stackCount > 0 ){

	            n1 = this.stack[--stackCount];
	            n2 = this.stack[--stackCount];
	            l1 = n1.proxy != null;
	            l2 = n2.proxy != null;
	            
	            this.numPairChecks++;

	            if( l1 && l2 ){
	                s1 = n1.proxy.shape;
	                s2 = n2.proxy.shape;
	                if ( s1 == s2 || s1.aabb.intersectTest( s2.aabb ) || !this.isAvailablePair( s1, s2 ) ) continue;

	                this.addPair(s1,s2);

	            }else{

	                if ( n1.aabb.intersectTest( n2.aabb ) ) continue;
	                
	                /*if(stackCount+4>=this.maxStack){// expand the stack
	                    //this.maxStack<<=1;
	                    this.maxStack*=2;
	                    var newStack = [];// vector
	                    newStack.length = this.maxStack;
	                    for(var i=0;i<stackCount;i++){
	                        newStack[i] = this.stack[i];
	                    }
	                    this.stack = newStack;
	                }*/

	                if( l2 || !l1 && (n1.aabb.surfaceArea() > n2.aabb.surfaceArea()) ){
	                    this.stack[stackCount++] = n1.child1;
	                    this.stack[stackCount++] = n2;
	                    this.stack[stackCount++] = n1.child2;
	                    this.stack[stackCount++] = n2;
	                }else{
	                    this.stack[stackCount++] = n1;
	                    this.stack[stackCount++] = n2.child1;
	                    this.stack[stackCount++] = n1;
	                    this.stack[stackCount++] = n2.child2;
	                }
	            }
	        }

	    }

	});

	function CollisionDetector (){

	    this.flip = false;

	}

	Object.assign( CollisionDetector.prototype, {

	    CollisionDetector: true,

	    detectCollision: function ( shape1, shape2, manifold ) {

	        printError("CollisionDetector", "Inheritance error.");

	    }

	} );

	/**
	 * A collision detector which detects collisions between two boxes.
	 * @author saharan
	 */
	function BoxBoxCollisionDetector() {

	    CollisionDetector.call( this );
	    this.clipVertices1 = new Float32Array( 24 ); // 8 vertices x,y,z
	    this.clipVertices2 = new Float32Array( 24 );
	    this.used = new Float32Array( 8 );
	    
	    this.INF = 1/0;

	}

	BoxBoxCollisionDetector.prototype = Object.assign( Object.create( CollisionDetector.prototype ), {

	    constructor: BoxBoxCollisionDetector,

	    detectCollision: function ( shape1, shape2, manifold ) {
	        // What you are doing 
	        // · I to prepare a separate axis of the fifteen 
	        //-Six in each of three normal vectors of the xyz direction of the box both 
	        // · Remaining nine 3x3 a vector perpendicular to the side of the box 2 and the side of the box 1 
	        // · Calculate the depth to the separation axis 

	        // Calculates the distance using the inner product and put the amount of embedment 
	        // · However a vertical separation axis and side to weight a little to avoid vibration 
	        // And end when there is a separate axis that is remote even one 
	        // · I look for separation axis with little to dent most 
	        // Men and if separation axis of the first six - end collision 
	        // Heng If it separate axis of nine other - side collision 
	        // Heng - case of a side collision 
	        // · Find points of two sides on which you made ​​the separation axis 

	        // Calculates the point of closest approach of a straight line consisting of separate axis points obtained, and the collision point 
	        //-Surface - the case of the plane crash 
	        //-Box A, box B and the other a box of better made ​​a separate axis 
	        // • The surface A and the plane that made the separation axis of the box A, and B to the surface the face of the box B close in the opposite direction to the most isolated axis 

	        // When viewed from the front surface A, and the cut part exceeding the area of the surface A is a surface B 
	        //-Plane B becomes the 3-8 triangle, I a candidate for the collision point the vertex of surface B 
	        // • If more than one candidate 5 exists, scraping up to four 

	        // For potential collision points of all, to examine the distance between the surface A 
	        // • If you were on the inside surface of A, and the collision point

	        var b1;
	        var b2;
	        if(shape1.id<shape2.id){
	            b1=(shape1);
	            b2=(shape2);
	        }else{
	            b1=(shape2);
	            b2=(shape1);
	        }
	        var V1 = b1.elements;
	        var V2 = b2.elements;

	        var D1 = b1.dimentions;
	        var D2 = b2.dimentions;

	        var p1=b1.position;
	        var p2=b2.position;
	        var p1x=p1.x;
	        var p1y=p1.y;
	        var p1z=p1.z;
	        var p2x=p2.x;
	        var p2y=p2.y;
	        var p2z=p2.z;
	        // diff
	        var dx=p2x-p1x;
	        var dy=p2y-p1y;
	        var dz=p2z-p1z;
	        // distance
	        var w1=b1.halfWidth;
	        var h1=b1.halfHeight;
	        var d1=b1.halfDepth;
	        var w2=b2.halfWidth;
	        var h2=b2.halfHeight;
	        var d2=b2.halfDepth;
	        // direction

	        // ----------------------------
	        // 15 separating axes
	        // 1~6: face
	        // 7~f: edge
	        // http://marupeke296.com/COL_3D_No13_OBBvsOBB.html
	        // ----------------------------
	        
	        var a1x=D1[0];
	        var a1y=D1[1];
	        var a1z=D1[2];
	        var a2x=D1[3];
	        var a2y=D1[4];
	        var a2z=D1[5];
	        var a3x=D1[6];
	        var a3y=D1[7];
	        var a3z=D1[8];
	        var d1x=D1[9];
	        var d1y=D1[10];
	        var d1z=D1[11];
	        var d2x=D1[12];
	        var d2y=D1[13];
	        var d2z=D1[14];
	        var d3x=D1[15];
	        var d3y=D1[16];
	        var d3z=D1[17];

	        var a4x=D2[0];
	        var a4y=D2[1];
	        var a4z=D2[2];
	        var a5x=D2[3];
	        var a5y=D2[4];
	        var a5z=D2[5];
	        var a6x=D2[6];
	        var a6y=D2[7];
	        var a6z=D2[8];
	        var d4x=D2[9];
	        var d4y=D2[10];
	        var d4z=D2[11];
	        var d5x=D2[12];
	        var d5y=D2[13];
	        var d5z=D2[14];
	        var d6x=D2[15];
	        var d6y=D2[16];
	        var d6z=D2[17];
	        
	        var a7x=a1y*a4z-a1z*a4y;
	        var a7y=a1z*a4x-a1x*a4z;
	        var a7z=a1x*a4y-a1y*a4x;
	        var a8x=a1y*a5z-a1z*a5y;
	        var a8y=a1z*a5x-a1x*a5z;
	        var a8z=a1x*a5y-a1y*a5x;
	        var a9x=a1y*a6z-a1z*a6y;
	        var a9y=a1z*a6x-a1x*a6z;
	        var a9z=a1x*a6y-a1y*a6x;
	        var aax=a2y*a4z-a2z*a4y;
	        var aay=a2z*a4x-a2x*a4z;
	        var aaz=a2x*a4y-a2y*a4x;
	        var abx=a2y*a5z-a2z*a5y;
	        var aby=a2z*a5x-a2x*a5z;
	        var abz=a2x*a5y-a2y*a5x;
	        var acx=a2y*a6z-a2z*a6y;
	        var acy=a2z*a6x-a2x*a6z;
	        var acz=a2x*a6y-a2y*a6x;
	        var adx=a3y*a4z-a3z*a4y;
	        var ady=a3z*a4x-a3x*a4z;
	        var adz=a3x*a4y-a3y*a4x;
	        var aex=a3y*a5z-a3z*a5y;
	        var aey=a3z*a5x-a3x*a5z;
	        var aez=a3x*a5y-a3y*a5x;
	        var afx=a3y*a6z-a3z*a6y;
	        var afy=a3z*a6x-a3x*a6z;
	        var afz=a3x*a6y-a3y*a6x;
	        // right or left flags
	        var right1;
	        var right2;
	        var right3;
	        var right4;
	        var right5;
	        var right6;
	        var right7;
	        var right8;
	        var right9;
	        var righta;
	        var rightb;
	        var rightc;
	        var rightd;
	        var righte;
	        var rightf;
	        // overlapping distances
	        var overlap1;
	        var overlap2;
	        var overlap3;
	        var overlap4;
	        var overlap5;
	        var overlap6;
	        var overlap7;
	        var overlap8;
	        var overlap9;
	        var overlapa;
	        var overlapb;
	        var overlapc;
	        var overlapd;
	        var overlape;
	        var overlapf;
	        // invalid flags
	        var invalid7=false;
	        var invalid8=false;
	        var invalid9=false;
	        var invalida=false;
	        var invalidb=false;
	        var invalidc=false;
	        var invalidd=false;
	        var invalide=false;
	        var invalidf=false;
	        // temporary variables
	        var len;
	        var len1;
	        var len2;
	        var dot1;
	        var dot2;
	        var dot3;
	        // try axis 1
	        len=a1x*dx+a1y*dy+a1z*dz;
	        right1=len>0;
	        if(!right1)len=-len;
	        len1=w1;
	        dot1=a1x*a4x+a1y*a4y+a1z*a4z;
	        dot2=a1x*a5x+a1y*a5y+a1z*a5z;
	        dot3=a1x*a6x+a1y*a6y+a1z*a6z;
	        if(dot1<0)dot1=-dot1;
	        if(dot2<0)dot2=-dot2;
	        if(dot3<0)dot3=-dot3;
	        len2=dot1*w2+dot2*h2+dot3*d2;
	        overlap1=len-len1-len2;
	        if(overlap1>0)return;
	        // try axis 2
	        len=a2x*dx+a2y*dy+a2z*dz;
	        right2=len>0;
	        if(!right2)len=-len;
	        len1=h1;
	        dot1=a2x*a4x+a2y*a4y+a2z*a4z;
	        dot2=a2x*a5x+a2y*a5y+a2z*a5z;
	        dot3=a2x*a6x+a2y*a6y+a2z*a6z;
	        if(dot1<0)dot1=-dot1;
	        if(dot2<0)dot2=-dot2;
	        if(dot3<0)dot3=-dot3;
	        len2=dot1*w2+dot2*h2+dot3*d2;
	        overlap2=len-len1-len2;
	        if(overlap2>0)return;
	        // try axis 3
	        len=a3x*dx+a3y*dy+a3z*dz;
	        right3=len>0;
	        if(!right3)len=-len;
	        len1=d1;
	        dot1=a3x*a4x+a3y*a4y+a3z*a4z;
	        dot2=a3x*a5x+a3y*a5y+a3z*a5z;
	        dot3=a3x*a6x+a3y*a6y+a3z*a6z;
	        if(dot1<0)dot1=-dot1;
	        if(dot2<0)dot2=-dot2;
	        if(dot3<0)dot3=-dot3;
	        len2=dot1*w2+dot2*h2+dot3*d2;
	        overlap3=len-len1-len2;
	        if(overlap3>0)return;
	        // try axis 4
	        len=a4x*dx+a4y*dy+a4z*dz;
	        right4=len>0;
	        if(!right4)len=-len;
	        dot1=a4x*a1x+a4y*a1y+a4z*a1z;
	        dot2=a4x*a2x+a4y*a2y+a4z*a2z;
	        dot3=a4x*a3x+a4y*a3y+a4z*a3z;
	        if(dot1<0)dot1=-dot1;
	        if(dot2<0)dot2=-dot2;
	        if(dot3<0)dot3=-dot3;
	        len1=dot1*w1+dot2*h1+dot3*d1;
	        len2=w2;
	        overlap4=(len-len1-len2)*1.0;
	        if(overlap4>0)return;
	        // try axis 5
	        len=a5x*dx+a5y*dy+a5z*dz;
	        right5=len>0;
	        if(!right5)len=-len;
	        dot1=a5x*a1x+a5y*a1y+a5z*a1z;
	        dot2=a5x*a2x+a5y*a2y+a5z*a2z;
	        dot3=a5x*a3x+a5y*a3y+a5z*a3z;
	        if(dot1<0)dot1=-dot1;
	        if(dot2<0)dot2=-dot2;
	        if(dot3<0)dot3=-dot3;
	        len1=dot1*w1+dot2*h1+dot3*d1;
	        len2=h2;
	        overlap5=(len-len1-len2)*1.0;
	        if(overlap5>0)return;
	        // try axis 6
	        len=a6x*dx+a6y*dy+a6z*dz;
	        right6=len>0;
	        if(!right6)len=-len;
	        dot1=a6x*a1x+a6y*a1y+a6z*a1z;
	        dot2=a6x*a2x+a6y*a2y+a6z*a2z;
	        dot3=a6x*a3x+a6y*a3y+a6z*a3z;
	        if(dot1<0)dot1=-dot1;
	        if(dot2<0)dot2=-dot2;
	        if(dot3<0)dot3=-dot3;
	        len1=dot1*w1+dot2*h1+dot3*d1;
	        len2=d2;
	        overlap6=(len-len1-len2)*1.0;
	        if(overlap6>0)return;
	        // try axis 7
	        len=a7x*a7x+a7y*a7y+a7z*a7z;
	        if(len>1e-5){
	            len=1/_Math.sqrt(len);
	            a7x*=len;
	            a7y*=len;
	            a7z*=len;
	            len=a7x*dx+a7y*dy+a7z*dz;
	            right7=len>0;
	            if(!right7)len=-len;
	            dot1=a7x*a2x+a7y*a2y+a7z*a2z;
	            dot2=a7x*a3x+a7y*a3y+a7z*a3z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len1=dot1*h1+dot2*d1;
	            dot1=a7x*a5x+a7y*a5y+a7z*a5z;
	            dot2=a7x*a6x+a7y*a6y+a7z*a6z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len2=dot1*h2+dot2*d2;
	            overlap7=len-len1-len2;
	            if(overlap7>0)return;
	        }else{
	            right7=false;
	            overlap7=0;
	            invalid7=true;
	        }
	        // try axis 8
	        len=a8x*a8x+a8y*a8y+a8z*a8z;
	        if(len>1e-5){
	            len=1/_Math.sqrt(len);
	            a8x*=len;
	            a8y*=len;
	            a8z*=len;
	            len=a8x*dx+a8y*dy+a8z*dz;
	            right8=len>0;
	            if(!right8)len=-len;
	            dot1=a8x*a2x+a8y*a2y+a8z*a2z;
	            dot2=a8x*a3x+a8y*a3y+a8z*a3z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len1=dot1*h1+dot2*d1;
	            dot1=a8x*a4x+a8y*a4y+a8z*a4z;
	            dot2=a8x*a6x+a8y*a6y+a8z*a6z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len2=dot1*w2+dot2*d2;
	            overlap8=len-len1-len2;
	            if(overlap8>0)return;
	        }else{
	            right8=false;
	            overlap8=0;
	            invalid8=true;
	        }
	        // try axis 9
	        len=a9x*a9x+a9y*a9y+a9z*a9z;
	        if(len>1e-5){
	            len=1/_Math.sqrt(len);
	            a9x*=len;
	            a9y*=len;
	            a9z*=len;
	            len=a9x*dx+a9y*dy+a9z*dz;
	            right9=len>0;
	            if(!right9)len=-len;
	            dot1=a9x*a2x+a9y*a2y+a9z*a2z;
	            dot2=a9x*a3x+a9y*a3y+a9z*a3z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len1=dot1*h1+dot2*d1;
	            dot1=a9x*a4x+a9y*a4y+a9z*a4z;
	            dot2=a9x*a5x+a9y*a5y+a9z*a5z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len2=dot1*w2+dot2*h2;
	            overlap9=len-len1-len2;
	            if(overlap9>0)return;
	        }else{
	            right9=false;
	            overlap9=0;
	            invalid9=true;
	        }
	        // try axis 10
	        len=aax*aax+aay*aay+aaz*aaz;
	        if(len>1e-5){
	            len=1/_Math.sqrt(len);
	            aax*=len;
	            aay*=len;
	            aaz*=len;
	            len=aax*dx+aay*dy+aaz*dz;
	            righta=len>0;
	            if(!righta)len=-len;
	            dot1=aax*a1x+aay*a1y+aaz*a1z;
	            dot2=aax*a3x+aay*a3y+aaz*a3z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len1=dot1*w1+dot2*d1;
	            dot1=aax*a5x+aay*a5y+aaz*a5z;
	            dot2=aax*a6x+aay*a6y+aaz*a6z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len2=dot1*h2+dot2*d2;
	            overlapa=len-len1-len2;
	            if(overlapa>0)return;
	        }else{
	            righta=false;
	            overlapa=0;
	            invalida=true;
	        }
	        // try axis 11
	        len=abx*abx+aby*aby+abz*abz;
	        if(len>1e-5){
	            len=1/_Math.sqrt(len);
	            abx*=len;
	            aby*=len;
	            abz*=len;
	            len=abx*dx+aby*dy+abz*dz;
	            rightb=len>0;
	            if(!rightb)len=-len;
	            dot1=abx*a1x+aby*a1y+abz*a1z;
	            dot2=abx*a3x+aby*a3y+abz*a3z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len1=dot1*w1+dot2*d1;
	            dot1=abx*a4x+aby*a4y+abz*a4z;
	            dot2=abx*a6x+aby*a6y+abz*a6z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len2=dot1*w2+dot2*d2;
	            overlapb=len-len1-len2;
	            if(overlapb>0)return;
	        }else{
	            rightb=false;
	            overlapb=0;
	            invalidb=true;
	        }
	        // try axis 12
	        len=acx*acx+acy*acy+acz*acz;
	        if(len>1e-5){
	            len=1/_Math.sqrt(len);
	            acx*=len;
	            acy*=len;
	            acz*=len;
	            len=acx*dx+acy*dy+acz*dz;
	            rightc=len>0;
	            if(!rightc)len=-len;
	            dot1=acx*a1x+acy*a1y+acz*a1z;
	            dot2=acx*a3x+acy*a3y+acz*a3z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len1=dot1*w1+dot2*d1;
	            dot1=acx*a4x+acy*a4y+acz*a4z;
	            dot2=acx*a5x+acy*a5y+acz*a5z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len2=dot1*w2+dot2*h2;
	            overlapc=len-len1-len2;
	            if(overlapc>0)return;
	        }else{
	            rightc=false;
	            overlapc=0;
	            invalidc=true;
	        }
	        // try axis 13
	        len=adx*adx+ady*ady+adz*adz;
	        if(len>1e-5){
	            len=1/_Math.sqrt(len);
	            adx*=len;
	            ady*=len;
	            adz*=len;
	            len=adx*dx+ady*dy+adz*dz;
	            rightd=len>0;
	            if(!rightd)len=-len;
	            dot1=adx*a1x+ady*a1y+adz*a1z;
	            dot2=adx*a2x+ady*a2y+adz*a2z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len1=dot1*w1+dot2*h1;
	            dot1=adx*a5x+ady*a5y+adz*a5z;
	            dot2=adx*a6x+ady*a6y+adz*a6z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len2=dot1*h2+dot2*d2;
	            overlapd=len-len1-len2;
	            if(overlapd>0)return;
	        }else{
	            rightd=false;
	            overlapd=0;
	            invalidd=true;
	        }
	        // try axis 14
	        len=aex*aex+aey*aey+aez*aez;
	        if(len>1e-5){
	            len=1/_Math.sqrt(len);
	            aex*=len;
	            aey*=len;
	            aez*=len;
	            len=aex*dx+aey*dy+aez*dz;
	            righte=len>0;
	            if(!righte)len=-len;
	            dot1=aex*a1x+aey*a1y+aez*a1z;
	            dot2=aex*a2x+aey*a2y+aez*a2z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len1=dot1*w1+dot2*h1;
	            dot1=aex*a4x+aey*a4y+aez*a4z;
	            dot2=aex*a6x+aey*a6y+aez*a6z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len2=dot1*w2+dot2*d2;
	            overlape=len-len1-len2;
	            if(overlape>0)return;
	        }else{
	            righte=false;
	            overlape=0;
	            invalide=true;
	        }
	        // try axis 15
	        len=afx*afx+afy*afy+afz*afz;
	        if(len>1e-5){
	            len=1/_Math.sqrt(len);
	            afx*=len;
	            afy*=len;
	            afz*=len;
	            len=afx*dx+afy*dy+afz*dz;
	            rightf=len>0;
	            if(!rightf)len=-len;
	            dot1=afx*a1x+afy*a1y+afz*a1z;
	            dot2=afx*a2x+afy*a2y+afz*a2z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len1=dot1*w1+dot2*h1;
	            dot1=afx*a4x+afy*a4y+afz*a4z;
	            dot2=afx*a5x+afy*a5y+afz*a5z;
	            if(dot1<0)dot1=-dot1;
	            if(dot2<0)dot2=-dot2;
	            len2=dot1*w2+dot2*h2;
	            overlapf=len-len1-len2;
	            if(overlapf>0)return;
	        }else{
	            rightf=false;
	            overlapf=0;
	            invalidf=true;
	        }
	        // boxes are overlapping
	        var depth=overlap1;
	        var depth2=overlap1;
	        var minIndex=0;
	        var right=right1;
	        if(overlap2>depth2){
	            depth=overlap2;
	            depth2=overlap2;
	            minIndex=1;
	            right=right2;
	        }
	        if(overlap3>depth2){
	            depth=overlap3;
	            depth2=overlap3;
	            minIndex=2;
	            right=right3;
	        }
	        if(overlap4>depth2){
	            depth=overlap4;
	            depth2=overlap4;
	            minIndex=3;
	            right=right4;
	        }
	        if(overlap5>depth2){
	            depth=overlap5;
	            depth2=overlap5;
	            minIndex=4;
	            right=right5;
	        }
	        if(overlap6>depth2){
	            depth=overlap6;
	            depth2=overlap6;
	            minIndex=5;
	            right=right6;
	        }
	        if(overlap7-0.01>depth2&&!invalid7){
	            depth=overlap7;
	            depth2=overlap7-0.01;
	            minIndex=6;
	            right=right7;
	        }
	        if(overlap8-0.01>depth2&&!invalid8){
	            depth=overlap8;
	            depth2=overlap8-0.01;
	            minIndex=7;
	            right=right8;
	        }
	        if(overlap9-0.01>depth2&&!invalid9){
	            depth=overlap9;
	            depth2=overlap9-0.01;
	            minIndex=8;
	            right=right9;
	        }
	        if(overlapa-0.01>depth2&&!invalida){
	            depth=overlapa;
	            depth2=overlapa-0.01;
	            minIndex=9;
	            right=righta;
	        }
	        if(overlapb-0.01>depth2&&!invalidb){
	            depth=overlapb;
	            depth2=overlapb-0.01;
	            minIndex=10;
	            right=rightb;
	        }
	        if(overlapc-0.01>depth2&&!invalidc){
	            depth=overlapc;
	            depth2=overlapc-0.01;
	            minIndex=11;
	            right=rightc;
	        }
	        if(overlapd-0.01>depth2&&!invalidd){
	            depth=overlapd;
	            depth2=overlapd-0.01;
	            minIndex=12;
	            right=rightd;
	        }
	        if(overlape-0.01>depth2&&!invalide){
	            depth=overlape;
	            depth2=overlape-0.01;
	            minIndex=13;
	            right=righte;
	        }
	        if(overlapf-0.01>depth2&&!invalidf){
	            depth=overlapf;
	            minIndex=14;
	            right=rightf;
	        }
	        // normal
	        var nx=0;
	        var ny=0;
	        var nz=0;
	        // edge line or face side normal
	        var n1x=0;
	        var n1y=0;
	        var n1z=0;
	        var n2x=0;
	        var n2y=0;
	        var n2z=0;
	        // center of current face
	        var cx=0;
	        var cy=0;
	        var cz=0;
	        // face side
	        var s1x=0;
	        var s1y=0;
	        var s1z=0;
	        var s2x=0;
	        var s2y=0;
	        var s2z=0;
	        // swap b1 b2
	        var swap=false;

	        //_______________________________________

	        if(minIndex==0){// b1.x * b2
	            if(right){
	                cx=p1x+d1x; cy=p1y+d1y;  cz=p1z+d1z;
	                nx=a1x; ny=a1y; nz=a1z;
	            }else{
	                cx=p1x-d1x; cy=p1y-d1y; cz=p1z-d1z;
	                nx=-a1x; ny=-a1y; nz=-a1z;
	            }
	            s1x=d2x; s1y=d2y; s1z=d2z;
	            n1x=-a2x; n1y=-a2y; n1z=-a2z;
	            s2x=d3x; s2y=d3y; s2z=d3z;
	            n2x=-a3x; n2y=-a3y; n2z=-a3z;
	        }
	        else if(minIndex==1){// b1.y * b2
	            if(right){
	                cx=p1x+d2x; cy=p1y+d2y; cz=p1z+d2z;
	                nx=a2x; ny=a2y; nz=a2z;
	            }else{
	                cx=p1x-d2x; cy=p1y-d2y; cz=p1z-d2z;
	                nx=-a2x; ny=-a2y; nz=-a2z;
	            }
	            s1x=d1x; s1y=d1y; s1z=d1z;
	            n1x=-a1x; n1y=-a1y; n1z=-a1z;
	            s2x=d3x; s2y=d3y; s2z=d3z;
	            n2x=-a3x; n2y=-a3y; n2z=-a3z;
	        }
	        else if(minIndex==2){// b1.z * b2
	            if(right){
	                cx=p1x+d3x; cy=p1y+d3y; cz=p1z+d3z;
	                nx=a3x; ny=a3y; nz=a3z;
	            }else{
	                cx=p1x-d3x; cy=p1y-d3y; cz=p1z-d3z;
	                nx=-a3x; ny=-a3y; nz=-a3z;
	            }
	            s1x=d1x; s1y=d1y; s1z=d1z;
	            n1x=-a1x; n1y=-a1y; n1z=-a1z;
	            s2x=d2x; s2y=d2y; s2z=d2z;
	            n2x=-a2x; n2y=-a2y; n2z=-a2z;
	        }
	        else if(minIndex==3){// b2.x * b1
	            swap=true;
	            if(!right){
	                cx=p2x+d4x; cy=p2y+d4y; cz=p2z+d4z;
	                nx=a4x; ny=a4y; nz=a4z;
	            }else{
	                cx=p2x-d4x; cy=p2y-d4y; cz=p2z-d4z;
	                nx=-a4x; ny=-a4y; nz=-a4z;
	            }
	            s1x=d5x; s1y=d5y; s1z=d5z;
	            n1x=-a5x; n1y=-a5y; n1z=-a5z;
	            s2x=d6x; s2y=d6y; s2z=d6z;
	            n2x=-a6x; n2y=-a6y; n2z=-a6z;
	        }
	        else if(minIndex==4){// b2.y * b1
	            swap=true;
	            if(!right){
	                cx=p2x+d5x; cy=p2y+d5y; cz=p2z+d5z;
	                nx=a5x; ny=a5y; nz=a5z;
	            }else{
	                cx=p2x-d5x; cy=p2y-d5y; cz=p2z-d5z;
	                nx=-a5x; ny=-a5y; nz=-a5z;
	            }
	            s1x=d4x; s1y=d4y; s1z=d4z;
	            n1x=-a4x; n1y=-a4y; n1z=-a4z;
	            s2x=d6x; s2y=d6y; s2z=d6z;
	            n2x=-a6x; n2y=-a6y; n2z=-a6z;
	        }
	        else if(minIndex==5){// b2.z * b1
	            swap=true;
	            if(!right){
	                cx=p2x+d6x; cy=p2y+d6y; cz=p2z+d6z;
	                nx=a6x; ny=a6y; nz=a6z;
	            }else{
	                cx=p2x-d6x; cy=p2y-d6y; cz=p2z-d6z;
	                nx=-a6x; ny=-a6y; nz=-a6z;
	            }
	            s1x=d4x; s1y=d4y; s1z=d4z;
	            n1x=-a4x; n1y=-a4y; n1z=-a4z;
	            s2x=d5x; s2y=d5y; s2z=d5z;
	            n2x=-a5x; n2y=-a5y; n2z=-a5z;
	        }
	        else if(minIndex==6){// b1.x * b2.x
	            nx=a7x; ny=a7y; nz=a7z;
	            n1x=a1x; n1y=a1y; n1z=a1z;
	            n2x=a4x; n2y=a4y; n2z=a4z;
	        }
	        else if(minIndex==7){// b1.x * b2.y
	            nx=a8x; ny=a8y; nz=a8z;
	            n1x=a1x; n1y=a1y; n1z=a1z;
	            n2x=a5x; n2y=a5y; n2z=a5z;
	        }
	        else if(minIndex==8){// b1.x * b2.z
	            nx=a9x; ny=a9y; nz=a9z;
	            n1x=a1x; n1y=a1y; n1z=a1z;
	            n2x=a6x; n2y=a6y; n2z=a6z;
	        }
	        else if(minIndex==9){// b1.y * b2.x
	            nx=aax; ny=aay; nz=aaz;
	            n1x=a2x; n1y=a2y; n1z=a2z;
	            n2x=a4x; n2y=a4y; n2z=a4z;
	        }
	        else if(minIndex==10){// b1.y * b2.y
	            nx=abx; ny=aby; nz=abz;
	            n1x=a2x; n1y=a2y; n1z=a2z;
	            n2x=a5x; n2y=a5y; n2z=a5z;
	        }
	        else if(minIndex==11){// b1.y * b2.z
	            nx=acx; ny=acy; nz=acz;
	            n1x=a2x; n1y=a2y; n1z=a2z;
	            n2x=a6x; n2y=a6y; n2z=a6z;
	        }
	        else if(minIndex==12){// b1.z * b2.x
	            nx=adx;  ny=ady; nz=adz;
	            n1x=a3x; n1y=a3y; n1z=a3z;
	            n2x=a4x; n2y=a4y; n2z=a4z;
	        }
	        else if(minIndex==13){// b1.z * b2.y
	            nx=aex; ny=aey; nz=aez;
	            n1x=a3x; n1y=a3y; n1z=a3z;
	            n2x=a5x; n2y=a5y; n2z=a5z;
	        }
	        else if(minIndex==14){// b1.z * b2.z
	            nx=afx; ny=afy; nz=afz;
	            n1x=a3x; n1y=a3y; n1z=a3z;
	            n2x=a6x; n2y=a6y; n2z=a6z;
	        }

	        //__________________________________________

	        //var v;
	        if(minIndex>5){
	            if(!right){
	                nx=-nx; ny=-ny; nz=-nz;
	            }
	            var distance;
	            var maxDistance;
	            var vx;
	            var vy;
	            var vz;
	            var v1x;
	            var v1y;
	            var v1z;
	            var v2x;
	            var v2y;
	            var v2z;
	            //vertex1;
	            v1x=V1[0]; v1y=V1[1]; v1z=V1[2];
	            maxDistance=nx*v1x+ny*v1y+nz*v1z;
	            //vertex2;
	            vx=V1[3]; vy=V1[4]; vz=V1[5];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance>maxDistance){
	                maxDistance=distance;
	                v1x=vx; v1y=vy; v1z=vz;
	            }
	            //vertex3;
	            vx=V1[6]; vy=V1[7]; vz=V1[8];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance>maxDistance){
	                maxDistance=distance;
	                v1x=vx; v1y=vy; v1z=vz;
	            }
	            //vertex4;
	            vx=V1[9]; vy=V1[10]; vz=V1[11];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance>maxDistance){
	                maxDistance=distance;
	                v1x=vx; v1y=vy; v1z=vz;
	            }
	            //vertex5;
	            vx=V1[12]; vy=V1[13]; vz=V1[14];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance>maxDistance){
	                maxDistance=distance;
	                v1x=vx; v1y=vy; v1z=vz;
	            }
	            //vertex6;
	            vx=V1[15]; vy=V1[16]; vz=V1[17];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance>maxDistance){
	                maxDistance=distance;
	                v1x=vx; v1y=vy; v1z=vz;
	            }
	            //vertex7;
	            vx=V1[18]; vy=V1[19]; vz=V1[20];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance>maxDistance){
	                maxDistance=distance;
	                v1x=vx; v1y=vy; v1z=vz;
	            }
	            //vertex8;
	            vx=V1[21]; vy=V1[22]; vz=V1[23];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance>maxDistance){
	                maxDistance=distance;
	                v1x=vx; v1y=vy; v1z=vz;
	            }
	            //vertex1;
	            v2x=V2[0]; v2y=V2[1]; v2z=V2[2];
	            maxDistance=nx*v2x+ny*v2y+nz*v2z;
	            //vertex2;
	            vx=V2[3]; vy=V2[4]; vz=V2[5];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance<maxDistance){
	                maxDistance=distance;
	                v2x=vx; v2y=vy; v2z=vz;
	            }
	            //vertex3;
	            vx=V2[6]; vy=V2[7]; vz=V2[8];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance<maxDistance){
	                maxDistance=distance;
	                v2x=vx; v2y=vy; v2z=vz;
	            }
	            //vertex4;
	            vx=V2[9]; vy=V2[10]; vz=V2[11];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance<maxDistance){
	                maxDistance=distance;
	                v2x=vx; v2y=vy; v2z=vz;
	            }
	            //vertex5;
	            vx=V2[12]; vy=V2[13]; vz=V2[14];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance<maxDistance){
	                maxDistance=distance;
	                v2x=vx; v2y=vy; v2z=vz;
	            }
	            //vertex6;
	            vx=V2[15]; vy=V2[16]; vz=V2[17];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance<maxDistance){
	                maxDistance=distance;
	                v2x=vx; v2y=vy; v2z=vz;
	            }
	            //vertex7;
	            vx=V2[18]; vy=V2[19]; vz=V2[20];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance<maxDistance){
	                maxDistance=distance;
	                v2x=vx; v2y=vy; v2z=vz;
	            }
	            //vertex8;
	            vx=V2[21]; vy=V2[22]; vz=V2[23];
	            distance=nx*vx+ny*vy+nz*vz;
	            if(distance<maxDistance){
	                maxDistance=distance;
	                v2x=vx; v2y=vy; v2z=vz;
	            }
	            vx=v2x-v1x; vy=v2y-v1y; vz=v2z-v1z;
	            dot1=n1x*n2x+n1y*n2y+n1z*n2z;
	            var t=(vx*(n1x-n2x*dot1)+vy*(n1y-n2y*dot1)+vz*(n1z-n2z*dot1))/(1-dot1*dot1);
	            manifold.addPoint(v1x+n1x*t+nx*depth*0.5,v1y+n1y*t+ny*depth*0.5,v1z+n1z*t+nz*depth*0.5,nx,ny,nz,depth,false);
	            return;
	        }
	        // now detect face-face collision...
	        // target quad
	        var q1x;
	        var q1y;
	        var q1z;
	        var q2x;
	        var q2y;
	        var q2z;
	        var q3x;
	        var q3y;
	        var q3z;
	        var q4x;
	        var q4y;
	        var q4z;
	        // search support face and vertex
	        var minDot=1;
	        var dot=0;
	        var minDotIndex=0;
	        if(swap){
	            dot=a1x*nx+a1y*ny+a1z*nz;
	            if(dot<minDot){
	                minDot=dot;
	                minDotIndex=0;
	            }
	            if(-dot<minDot){
	                minDot=-dot;
	                minDotIndex=1;
	            }
	            dot=a2x*nx+a2y*ny+a2z*nz;
	            if(dot<minDot){
	                minDot=dot;
	                minDotIndex=2;
	            }
	            if(-dot<minDot){
	                minDot=-dot;
	                minDotIndex=3;
	            }
	            dot=a3x*nx+a3y*ny+a3z*nz;
	            if(dot<minDot){
	                minDot=dot;
	                minDotIndex=4;
	            }
	            if(-dot<minDot){
	                minDot=-dot;
	                minDotIndex=5;
	            }

	            if(minDotIndex==0){// x+ face
	                q1x=V1[0]; q1y=V1[1]; q1z=V1[2];//vertex1
	                q2x=V1[6]; q2y=V1[7]; q2z=V1[8];//vertex3
	                q3x=V1[9]; q3y=V1[10]; q3z=V1[11];//vertex4
	                q4x=V1[3]; q4y=V1[4]; q4z=V1[5];//vertex2
	            }
	            else if(minDotIndex==1){// x- face
	                q1x=V1[15]; q1y=V1[16]; q1z=V1[17];//vertex6
	                q2x=V1[21]; q2y=V1[22]; q2z=V1[23];//vertex8
	                q3x=V1[18]; q3y=V1[19]; q3z=V1[20];//vertex7
	                q4x=V1[12]; q4y=V1[13]; q4z=V1[14];//vertex5
	            }
	            else if(minDotIndex==2){// y+ face
	                q1x=V1[12]; q1y=V1[13]; q1z=V1[14];//vertex5
	                q2x=V1[0]; q2y=V1[1]; q2z=V1[2];//vertex1
	                q3x=V1[3]; q3y=V1[4]; q3z=V1[5];//vertex2
	                q4x=V1[15]; q4y=V1[16]; q4z=V1[17];//vertex6
	            }
	            else if(minDotIndex==3){// y- face
	                q1x=V1[21]; q1y=V1[22]; q1z=V1[23];//vertex8
	                q2x=V1[9]; q2y=V1[10]; q2z=V1[11];//vertex4
	                q3x=V1[6]; q3y=V1[7]; q3z=V1[8];//vertex3
	                q4x=V1[18]; q4y=V1[19]; q4z=V1[20];//vertex7
	            }
	            else if(minDotIndex==4){// z+ face
	                q1x=V1[12]; q1y=V1[13]; q1z=V1[14];//vertex5
	                q2x=V1[18]; q2y=V1[19]; q2z=V1[20];//vertex7
	                q3x=V1[6]; q3y=V1[7]; q3z=V1[8];//vertex3
	                q4x=V1[0]; q4y=V1[1]; q4z=V1[2];//vertex1
	            }
	            else if(minDotIndex==5){// z- face
	                q1x=V1[3]; q1y=V1[4]; q1z=V1[5];//vertex2
	                //2x=V1[6]; q2y=V1[7]; q2z=V1[8];//vertex4 !!!
	                q2x=V2[9]; q2y=V2[10]; q2z=V2[11];//vertex4
	                q3x=V1[21]; q3y=V1[22]; q3z=V1[23];//vertex8
	                q4x=V1[15]; q4y=V1[16]; q4z=V1[17];//vertex6
	            }

	        }else{
	            dot=a4x*nx+a4y*ny+a4z*nz;
	            if(dot<minDot){
	                minDot=dot;
	                minDotIndex=0;
	            }
	            if(-dot<minDot){
	                minDot=-dot;
	                minDotIndex=1;
	            }
	            dot=a5x*nx+a5y*ny+a5z*nz;
	            if(dot<minDot){
	                minDot=dot;
	                minDotIndex=2;
	            }
	            if(-dot<minDot){
	                minDot=-dot;
	                minDotIndex=3;
	            }
	            dot=a6x*nx+a6y*ny+a6z*nz;
	            if(dot<minDot){
	                minDot=dot;
	                minDotIndex=4;
	            }
	            if(-dot<minDot){
	                minDot=-dot;
	                minDotIndex=5;
	            }

	            //______________________________________________________

	            if(minDotIndex==0){// x+ face
	                q1x=V2[0]; q1y=V2[1]; q1z=V2[2];//vertex1
	                q2x=V2[6]; q2y=V2[7]; q2z=V2[8];//vertex3
	                q3x=V2[9]; q3y=V2[10]; q3z=V2[11];//vertex4
	                q4x=V2[3]; q4y=V2[4]; q4z=V2[5];//vertex2
	            }
	            else if(minDotIndex==1){// x- face
	                q1x=V2[15]; q1y=V2[16]; q1z=V2[17];//vertex6
	                q2x=V2[21]; q2y=V2[22]; q2z=V2[23]; //vertex8
	                q3x=V2[18]; q3y=V2[19]; q3z=V2[20];//vertex7
	                q4x=V2[12]; q4y=V2[13]; q4z=V2[14];//vertex5
	            }
	            else if(minDotIndex==2){// y+ face
	                q1x=V2[12]; q1y=V2[13]; q1z=V2[14];//vertex5
	                q2x=V2[0]; q2y=V2[1]; q2z=V2[2];//vertex1
	                q3x=V2[3]; q3y=V2[4]; q3z=V2[5];//vertex2
	                q4x=V2[15]; q4y=V2[16]; q4z=V2[17];//vertex6
	            }
	            else if(minDotIndex==3){// y- face
	                q1x=V2[21]; q1y=V2[22]; q1z=V2[23];//vertex8
	                q2x=V2[9]; q2y=V2[10]; q2z=V2[11];//vertex4
	                q3x=V2[6]; q3y=V2[7]; q3z=V2[8];//vertex3
	                q4x=V2[18]; q4y=V2[19]; q4z=V2[20];//vertex7
	            }
	            else if(minDotIndex==4){// z+ face
	                q1x=V2[12]; q1y=V2[13]; q1z=V2[14];//vertex5
	                q2x=V2[18]; q2y=V2[19]; q2z=V2[20];//vertex7
	                q3x=V2[6]; q3y=V2[7]; q3z=V2[8];//vertex3
	                q4x=V2[0]; q4y=V2[1]; q4z=V2[2];//vertex1
	            }
	            else if(minDotIndex==5){// z- face
	                q1x=V2[3]; q1y=V2[4]; q1z=V2[5];//vertex2
	                q2x=V2[9]; q2y=V2[10]; q2z=V2[11];//vertex4
	                q3x=V2[21]; q3y=V2[22]; q3z=V2[23];//vertex8
	                q4x=V2[15]; q4y=V2[16]; q4z=V2[17];//vertex6
	            }
	      
	        }
	        // clip vertices
	        var numClipVertices;
	        var numAddedClipVertices;
	        var index;
	        var x1;
	        var y1;
	        var z1;
	        var x2;
	        var y2;
	        var z2;
	        this.clipVertices1[0]=q1x;
	        this.clipVertices1[1]=q1y;
	        this.clipVertices1[2]=q1z;
	        this.clipVertices1[3]=q2x;
	        this.clipVertices1[4]=q2y;
	        this.clipVertices1[5]=q2z;
	        this.clipVertices1[6]=q3x;
	        this.clipVertices1[7]=q3y;
	        this.clipVertices1[8]=q3z;
	        this.clipVertices1[9]=q4x;
	        this.clipVertices1[10]=q4y;
	        this.clipVertices1[11]=q4z;
	        numAddedClipVertices=0;
	        x1=this.clipVertices1[9];
	        y1=this.clipVertices1[10];
	        z1=this.clipVertices1[11];
	        dot1=(x1-cx-s1x)*n1x+(y1-cy-s1y)*n1y+(z1-cz-s1z)*n1z;

	        //var i = 4;
	        //while(i--){
	        for(var i=0;i<4;i++){
	            index=i*3;
	            x2=this.clipVertices1[index];
	            y2=this.clipVertices1[index+1];
	            z2=this.clipVertices1[index+2];
	            dot2=(x2-cx-s1x)*n1x+(y2-cy-s1y)*n1y+(z2-cz-s1z)*n1z;
	            if(dot1>0){
	                if(dot2>0){
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    this.clipVertices2[index]=x2;
	                    this.clipVertices2[index+1]=y2;
	                    this.clipVertices2[index+2]=z2;
	                }else{
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    t=dot1/(dot1-dot2);
	                    this.clipVertices2[index]=x1+(x2-x1)*t;
	                    this.clipVertices2[index+1]=y1+(y2-y1)*t;
	                    this.clipVertices2[index+2]=z1+(z2-z1)*t;
	                }
	            }else{
	                if(dot2>0){
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    t=dot1/(dot1-dot2);
	                    this.clipVertices2[index]=x1+(x2-x1)*t;
	                    this.clipVertices2[index+1]=y1+(y2-y1)*t;
	                    this.clipVertices2[index+2]=z1+(z2-z1)*t;
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    this.clipVertices2[index]=x2;
	                    this.clipVertices2[index+1]=y2;
	                    this.clipVertices2[index+2]=z2;
	                }
	            }
	            x1=x2;
	            y1=y2;
	            z1=z2;
	            dot1=dot2;
	        }

	        numClipVertices=numAddedClipVertices;
	        if(numClipVertices==0)return;
	        numAddedClipVertices=0;
	        index=(numClipVertices-1)*3;
	        x1=this.clipVertices2[index];
	        y1=this.clipVertices2[index+1];
	        z1=this.clipVertices2[index+2];
	        dot1=(x1-cx-s2x)*n2x+(y1-cy-s2y)*n2y+(z1-cz-s2z)*n2z;

	        //i = numClipVertices;
	        //while(i--){
	        for(i=0;i<numClipVertices;i++){
	            index=i*3;
	            x2=this.clipVertices2[index];
	            y2=this.clipVertices2[index+1];
	            z2=this.clipVertices2[index+2];
	            dot2=(x2-cx-s2x)*n2x+(y2-cy-s2y)*n2y+(z2-cz-s2z)*n2z;
	            if(dot1>0){
	                if(dot2>0){
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    this.clipVertices1[index]=x2;
	                    this.clipVertices1[index+1]=y2;
	                    this.clipVertices1[index+2]=z2;
	                }else{
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    t=dot1/(dot1-dot2);
	                    this.clipVertices1[index]=x1+(x2-x1)*t;
	                    this.clipVertices1[index+1]=y1+(y2-y1)*t;
	                    this.clipVertices1[index+2]=z1+(z2-z1)*t;
	                }
	            }else{
	                if(dot2>0){
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    t=dot1/(dot1-dot2);
	                    this.clipVertices1[index]=x1+(x2-x1)*t;
	                    this.clipVertices1[index+1]=y1+(y2-y1)*t;
	                    this.clipVertices1[index+2]=z1+(z2-z1)*t;
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    this.clipVertices1[index]=x2;
	                    this.clipVertices1[index+1]=y2;
	                    this.clipVertices1[index+2]=z2;
	                }
	            }
	            x1=x2;
	            y1=y2;
	            z1=z2;
	            dot1=dot2;
	        }

	        numClipVertices=numAddedClipVertices;
	        if(numClipVertices==0)return;
	        numAddedClipVertices=0;
	        index=(numClipVertices-1)*3;
	        x1=this.clipVertices1[index];
	        y1=this.clipVertices1[index+1];
	        z1=this.clipVertices1[index+2];
	        dot1=(x1-cx+s1x)*-n1x+(y1-cy+s1y)*-n1y+(z1-cz+s1z)*-n1z;

	        //i = numClipVertices;
	        //while(i--){
	        for(i=0;i<numClipVertices;i++){
	            index=i*3;
	            x2=this.clipVertices1[index];
	            y2=this.clipVertices1[index+1];
	            z2=this.clipVertices1[index+2];
	            dot2=(x2-cx+s1x)*-n1x+(y2-cy+s1y)*-n1y+(z2-cz+s1z)*-n1z;
	            if(dot1>0){
	                if(dot2>0){
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    this.clipVertices2[index]=x2;
	                    this.clipVertices2[index+1]=y2;
	                    this.clipVertices2[index+2]=z2;
	                }else{
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    t=dot1/(dot1-dot2);
	                    this.clipVertices2[index]=x1+(x2-x1)*t;
	                    this.clipVertices2[index+1]=y1+(y2-y1)*t;
	                    this.clipVertices2[index+2]=z1+(z2-z1)*t;
	                }
	            }else{
	                if(dot2>0){
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    t=dot1/(dot1-dot2);
	                    this.clipVertices2[index]=x1+(x2-x1)*t;
	                    this.clipVertices2[index+1]=y1+(y2-y1)*t;
	                    this.clipVertices2[index+2]=z1+(z2-z1)*t;
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    this.clipVertices2[index]=x2;
	                    this.clipVertices2[index+1]=y2;
	                    this.clipVertices2[index+2]=z2;
	                }
	            }
	            x1=x2;
	            y1=y2;
	            z1=z2;
	            dot1=dot2;
	        }

	        numClipVertices=numAddedClipVertices;
	        if(numClipVertices==0)return;
	        numAddedClipVertices=0;
	        index=(numClipVertices-1)*3;
	        x1=this.clipVertices2[index];
	        y1=this.clipVertices2[index+1];
	        z1=this.clipVertices2[index+2];
	        dot1=(x1-cx+s2x)*-n2x+(y1-cy+s2y)*-n2y+(z1-cz+s2z)*-n2z;

	        //i = numClipVertices;
	        //while(i--){
	        for(i=0;i<numClipVertices;i++){
	            index=i*3;
	            x2=this.clipVertices2[index];
	            y2=this.clipVertices2[index+1];
	            z2=this.clipVertices2[index+2];
	            dot2=(x2-cx+s2x)*-n2x+(y2-cy+s2y)*-n2y+(z2-cz+s2z)*-n2z;
	            if(dot1>0){
	                if(dot2>0){
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    this.clipVertices1[index]=x2;
	                    this.clipVertices1[index+1]=y2;
	                    this.clipVertices1[index+2]=z2;
	                }else{
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    t=dot1/(dot1-dot2);
	                    this.clipVertices1[index]=x1+(x2-x1)*t;
	                    this.clipVertices1[index+1]=y1+(y2-y1)*t;
	                    this.clipVertices1[index+2]=z1+(z2-z1)*t;
	                }
	            }else{
	                if(dot2>0){
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    t=dot1/(dot1-dot2);
	                    this.clipVertices1[index]=x1+(x2-x1)*t;
	                    this.clipVertices1[index+1]=y1+(y2-y1)*t;
	                    this.clipVertices1[index+2]=z1+(z2-z1)*t;
	                    index=numAddedClipVertices*3;
	                    numAddedClipVertices++;
	                    this.clipVertices1[index]=x2;
	                    this.clipVertices1[index+1]=y2;
	                    this.clipVertices1[index+2]=z2;
	                }
	            }
	            x1=x2;
	            y1=y2;
	            z1=z2;
	            dot1=dot2;
	        }

	        numClipVertices=numAddedClipVertices;
	        if(swap){
	            var tb=b1;
	            b1=b2;
	            b2=tb;
	        }
	        if(numClipVertices==0)return;
	        var flipped=b1!=shape1;
	        if(numClipVertices>4){
	            x1=(q1x+q2x+q3x+q4x)*0.25;
	            y1=(q1y+q2y+q3y+q4y)*0.25;
	            z1=(q1z+q2z+q3z+q4z)*0.25;
	            n1x=q1x-x1;
	            n1y=q1y-y1;
	            n1z=q1z-z1;
	            n2x=q2x-x1;
	            n2y=q2y-y1;
	            n2z=q2z-z1;
	            var index1=0;
	            var index2=0;
	            var index3=0;
	            var index4=0;
	            var maxDot=-this.INF;
	            minDot=this.INF;

	            //i = numClipVertices;
	            //while(i--){
	            for(i=0;i<numClipVertices;i++){
	                this.used[i]=false;
	                index=i*3;
	                x1=this.clipVertices1[index];
	                y1=this.clipVertices1[index+1];
	                z1=this.clipVertices1[index+2];
	                dot=x1*n1x+y1*n1y+z1*n1z;
	                if(dot<minDot){
	                    minDot=dot;
	                    index1=i;
	                }
	                if(dot>maxDot){
	                    maxDot=dot;
	                    index3=i;
	                }
	            }

	            this.used[index1]=true;
	            this.used[index3]=true;
	            maxDot=-this.INF;
	            minDot=this.INF;

	            //i = numClipVertices;
	            //while(i--){
	            for(i=0;i<numClipVertices;i++){
	                if(this.used[i])continue;
	                index=i*3;
	                x1=this.clipVertices1[index];
	                y1=this.clipVertices1[index+1];
	                z1=this.clipVertices1[index+2];
	                dot=x1*n2x+y1*n2y+z1*n2z;
	                if(dot<minDot){
	                    minDot=dot;
	                    index2=i;
	                }
	                if(dot>maxDot){
	                    maxDot=dot;
	                    index4=i;
	                }
	            }

	            index=index1*3;
	            x1=this.clipVertices1[index];
	            y1=this.clipVertices1[index+1];
	            z1=this.clipVertices1[index+2];
	            dot=(x1-cx)*nx+(y1-cy)*ny+(z1-cz)*nz;
	            if(dot<0) manifold.addPoint(x1,y1,z1,nx,ny,nz,dot,flipped);
	            
	            index=index2*3;
	            x1=this.clipVertices1[index];
	            y1=this.clipVertices1[index+1];
	            z1=this.clipVertices1[index+2];
	            dot=(x1-cx)*nx+(y1-cy)*ny+(z1-cz)*nz;
	            if(dot<0) manifold.addPoint(x1,y1,z1,nx,ny,nz,dot,flipped);
	            
	            index=index3*3;
	            x1=this.clipVertices1[index];
	            y1=this.clipVertices1[index+1];
	            z1=this.clipVertices1[index+2];
	            dot=(x1-cx)*nx+(y1-cy)*ny+(z1-cz)*nz;
	            if(dot<0) manifold.addPoint(x1,y1,z1,nx,ny,nz,dot,flipped);
	            
	            index=index4*3;
	            x1=this.clipVertices1[index];
	            y1=this.clipVertices1[index+1];
	            z1=this.clipVertices1[index+2];
	            dot=(x1-cx)*nx+(y1-cy)*ny+(z1-cz)*nz;
	            if(dot<0) manifold.addPoint(x1,y1,z1,nx,ny,nz,dot,flipped);
	            
	        }else{
	            //i = numClipVertices;
	            //while(i--){
	            for(i=0;i<numClipVertices;i++){
	                index=i*3;
	                x1=this.clipVertices1[index];
	                y1=this.clipVertices1[index+1];
	                z1=this.clipVertices1[index+2];
	                dot=(x1-cx)*nx+(y1-cy)*ny+(z1-cz)*nz;
	                if(dot<0)manifold.addPoint(x1,y1,z1,nx,ny,nz,dot,flipped);
	            }
	        }

	    }

	});

	function BoxCylinderCollisionDetector (flip){

	    CollisionDetector.call( this );
	    this.flip = flip;

	}

	BoxCylinderCollisionDetector.prototype = Object.assign( Object.create( CollisionDetector.prototype ), {

	    constructor: BoxCylinderCollisionDetector,

	    getSep: function ( c1, c2, sep, pos, dep ) {

	        var t1x;
	        var t1y;
	        var t1z;
	        var t2x;
	        var t2y;
	        var t2z;
	        var sup=new Vec3();
	        var len;
	        var p1x;
	        var p1y;
	        var p1z;
	        var p2x;
	        var p2y;
	        var p2z;
	        var v01x=c1.position.x;
	        var v01y=c1.position.y;
	        var v01z=c1.position.z;
	        var v02x=c2.position.x;
	        var v02y=c2.position.y;
	        var v02z=c2.position.z;
	        var v0x=v02x-v01x;
	        var v0y=v02y-v01y;
	        var v0z=v02z-v01z;
	        if(v0x*v0x+v0y*v0y+v0z*v0z==0)v0y=0.001;
	        var nx=-v0x;
	        var ny=-v0y;
	        var nz=-v0z;
	        this.supportPointB(c1,-nx,-ny,-nz,sup);
	        var v11x=sup.x;
	        var v11y=sup.y;
	        var v11z=sup.z;
	        this.supportPointC(c2,nx,ny,nz,sup);
	        var v12x=sup.x;
	        var v12y=sup.y;
	        var v12z=sup.z;
	        var v1x=v12x-v11x;
	        var v1y=v12y-v11y;
	        var v1z=v12z-v11z;
	        if(v1x*nx+v1y*ny+v1z*nz<=0){
	        return false;
	        }
	        nx=v1y*v0z-v1z*v0y;
	        ny=v1z*v0x-v1x*v0z;
	        nz=v1x*v0y-v1y*v0x;
	        if(nx*nx+ny*ny+nz*nz==0){
	        sep.set( v1x-v0x, v1y-v0y, v1z-v0z ).normalize();
	        pos.set( (v11x+v12x)*0.5, (v11y+v12y)*0.5, (v11z+v12z)*0.5 );
	        return true;
	        }
	        this.supportPointB(c1,-nx,-ny,-nz,sup);
	        var v21x=sup.x;
	        var v21y=sup.y;
	        var v21z=sup.z;
	        this.supportPointC(c2,nx,ny,nz,sup);
	        var v22x=sup.x;
	        var v22y=sup.y;
	        var v22z=sup.z;
	        var v2x=v22x-v21x;
	        var v2y=v22y-v21y;
	        var v2z=v22z-v21z;
	        if(v2x*nx+v2y*ny+v2z*nz<=0){
	        return false;
	        }
	        t1x=v1x-v0x;
	        t1y=v1y-v0y;
	        t1z=v1z-v0z;
	        t2x=v2x-v0x;
	        t2y=v2y-v0y;
	        t2z=v2z-v0z;
	        nx=t1y*t2z-t1z*t2y;
	        ny=t1z*t2x-t1x*t2z;
	        nz=t1x*t2y-t1y*t2x;
	        if(nx*v0x+ny*v0y+nz*v0z>0){
	        t1x=v1x;
	        t1y=v1y;
	        t1z=v1z;
	        v1x=v2x;
	        v1y=v2y;
	        v1z=v2z;
	        v2x=t1x;
	        v2y=t1y;
	        v2z=t1z;
	        t1x=v11x;
	        t1y=v11y;
	        t1z=v11z;
	        v11x=v21x;
	        v11y=v21y;
	        v11z=v21z;
	        v21x=t1x;
	        v21y=t1y;
	        v21z=t1z;
	        t1x=v12x;
	        t1y=v12y;
	        t1z=v12z;
	        v12x=v22x;
	        v12y=v22y;
	        v12z=v22z;
	        v22x=t1x;
	        v22y=t1y;
	        v22z=t1z;
	        nx=-nx;
	        ny=-ny;
	        nz=-nz;
	        }
	        var iterations=0;
	        while(true){
	        if(++iterations>100){
	        return false;
	        }
	        this.supportPointB(c1,-nx,-ny,-nz,sup);
	        var v31x=sup.x;
	        var v31y=sup.y;
	        var v31z=sup.z;
	        this.supportPointC(c2,nx,ny,nz,sup);
	        var v32x=sup.x;
	        var v32y=sup.y;
	        var v32z=sup.z;
	        var v3x=v32x-v31x;
	        var v3y=v32y-v31y;
	        var v3z=v32z-v31z;
	        if(v3x*nx+v3y*ny+v3z*nz<=0){
	        return false;
	        }
	        if((v1y*v3z-v1z*v3y)*v0x+(v1z*v3x-v1x*v3z)*v0y+(v1x*v3y-v1y*v3x)*v0z<0){
	        v2x=v3x;
	        v2y=v3y;
	        v2z=v3z;
	        v21x=v31x;
	        v21y=v31y;
	        v21z=v31z;
	        v22x=v32x;
	        v22y=v32y;
	        v22z=v32z;
	        t1x=v1x-v0x;
	        t1y=v1y-v0y;
	        t1z=v1z-v0z;
	        t2x=v3x-v0x;
	        t2y=v3y-v0y;
	        t2z=v3z-v0z;
	        nx=t1y*t2z-t1z*t2y;
	        ny=t1z*t2x-t1x*t2z;
	        nz=t1x*t2y-t1y*t2x;
	        continue;
	        }
	        if((v3y*v2z-v3z*v2y)*v0x+(v3z*v2x-v3x*v2z)*v0y+(v3x*v2y-v3y*v2x)*v0z<0){
	        v1x=v3x;
	        v1y=v3y;
	        v1z=v3z;
	        v11x=v31x;
	        v11y=v31y;
	        v11z=v31z;
	        v12x=v32x;
	        v12y=v32y;
	        v12z=v32z;
	        t1x=v3x-v0x;
	        t1y=v3y-v0y;
	        t1z=v3z-v0z;
	        t2x=v2x-v0x;
	        t2y=v2y-v0y;
	        t2z=v2z-v0z;
	        nx=t1y*t2z-t1z*t2y;
	        ny=t1z*t2x-t1x*t2z;
	        nz=t1x*t2y-t1y*t2x;
	        continue;
	        }
	        var hit=false;
	        while(true){
	        t1x=v2x-v1x;
	        t1y=v2y-v1y;
	        t1z=v2z-v1z;
	        t2x=v3x-v1x;
	        t2y=v3y-v1y;
	        t2z=v3z-v1z;
	        nx=t1y*t2z-t1z*t2y;
	        ny=t1z*t2x-t1x*t2z;
	        nz=t1x*t2y-t1y*t2x;
	        len=1/_Math.sqrt(nx*nx+ny*ny+nz*nz);
	        nx*=len;
	        ny*=len;
	        nz*=len;
	        if(nx*v1x+ny*v1y+nz*v1z>=0&&!hit){
	        var b0=(v1y*v2z-v1z*v2y)*v3x+(v1z*v2x-v1x*v2z)*v3y+(v1x*v2y-v1y*v2x)*v3z;
	        var b1=(v3y*v2z-v3z*v2y)*v0x+(v3z*v2x-v3x*v2z)*v0y+(v3x*v2y-v3y*v2x)*v0z;
	        var b2=(v0y*v1z-v0z*v1y)*v3x+(v0z*v1x-v0x*v1z)*v3y+(v0x*v1y-v0y*v1x)*v3z;
	        var b3=(v2y*v1z-v2z*v1y)*v0x+(v2z*v1x-v2x*v1z)*v0y+(v2x*v1y-v2y*v1x)*v0z;
	        var sum=b0+b1+b2+b3;
	        if(sum<=0){
	        b0=0;
	        b1=(v2y*v3z-v2z*v3y)*nx+(v2z*v3x-v2x*v3z)*ny+(v2x*v3y-v2y*v3x)*nz;
	        b2=(v3y*v2z-v3z*v2y)*nx+(v3z*v2x-v3x*v2z)*ny+(v3x*v2y-v3y*v2x)*nz;
	        b3=(v1y*v2z-v1z*v2y)*nx+(v1z*v2x-v1x*v2z)*ny+(v1x*v2y-v1y*v2x)*nz;
	        sum=b1+b2+b3;
	        }
	        var inv=1/sum;
	        p1x=(v01x*b0+v11x*b1+v21x*b2+v31x*b3)*inv;
	        p1y=(v01y*b0+v11y*b1+v21y*b2+v31y*b3)*inv;
	        p1z=(v01z*b0+v11z*b1+v21z*b2+v31z*b3)*inv;
	        p2x=(v02x*b0+v12x*b1+v22x*b2+v32x*b3)*inv;
	        p2y=(v02y*b0+v12y*b1+v22y*b2+v32y*b3)*inv;
	        p2z=(v02z*b0+v12z*b1+v22z*b2+v32z*b3)*inv;
	        hit=true;
	        }
	        this.supportPointB(c1,-nx,-ny,-nz,sup);
	        var v41x=sup.x;
	        var v41y=sup.y;
	        var v41z=sup.z;
	        this.supportPointC(c2,nx,ny,nz,sup);
	        var v42x=sup.x;
	        var v42y=sup.y;
	        var v42z=sup.z;
	        var v4x=v42x-v41x;
	        var v4y=v42y-v41y;
	        var v4z=v42z-v41z;
	        var separation=-(v4x*nx+v4y*ny+v4z*nz);
	        if((v4x-v3x)*nx+(v4y-v3y)*ny+(v4z-v3z)*nz<=0.01||separation>=0){
	        if(hit){
	        sep.set( -nx, -ny, -nz );
	        pos.set( (p1x+p2x)*0.5, (p1y+p2y)*0.5, (p1z+p2z)*0.5 );
	        dep.x=separation;
	        return true;
	        }
	        return false;
	        }
	        if(
	        (v4y*v1z-v4z*v1y)*v0x+
	        (v4z*v1x-v4x*v1z)*v0y+
	        (v4x*v1y-v4y*v1x)*v0z<0
	        ){
	        if(
	        (v4y*v2z-v4z*v2y)*v0x+
	        (v4z*v2x-v4x*v2z)*v0y+
	        (v4x*v2y-v4y*v2x)*v0z<0
	        ){
	        v1x=v4x;
	        v1y=v4y;
	        v1z=v4z;
	        v11x=v41x;
	        v11y=v41y;
	        v11z=v41z;
	        v12x=v42x;
	        v12y=v42y;
	        v12z=v42z;
	        }else{
	        v3x=v4x;
	        v3y=v4y;
	        v3z=v4z;
	        v31x=v41x;
	        v31y=v41y;
	        v31z=v41z;
	        v32x=v42x;
	        v32y=v42y;
	        v32z=v42z;
	        }
	        }else{
	        if(
	        (v4y*v3z-v4z*v3y)*v0x+
	        (v4z*v3x-v4x*v3z)*v0y+
	        (v4x*v3y-v4y*v3x)*v0z<0
	        ){
	        v2x=v4x;
	        v2y=v4y;
	        v2z=v4z;
	        v21x=v41x;
	        v21y=v41y;
	        v21z=v41z;
	        v22x=v42x;
	        v22y=v42y;
	        v22z=v42z;
	        }else{
	        v1x=v4x;
	        v1y=v4y;
	        v1z=v4z;
	        v11x=v41x;
	        v11y=v41y;
	        v11z=v41z;
	        v12x=v42x;
	        v12y=v42y;
	        v12z=v42z;
	    }
	    }
	    }
	    }
	    //return false;
	    },

	    supportPointB: function( c, dx, dy, dz, out ) {

	        var rot=c.rotation.elements;
	        var ldx=rot[0]*dx+rot[3]*dy+rot[6]*dz;
	        var ldy=rot[1]*dx+rot[4]*dy+rot[7]*dz;
	        var ldz=rot[2]*dx+rot[5]*dy+rot[8]*dz;
	        var w=c.halfWidth;
	        var h=c.halfHeight;
	        var d=c.halfDepth;
	        var ox;
	        var oy;
	        var oz;
	        if(ldx<0)ox=-w;
	        else ox=w;
	        if(ldy<0)oy=-h;
	        else oy=h;
	        if(ldz<0)oz=-d;
	        else oz=d;
	        ldx=rot[0]*ox+rot[1]*oy+rot[2]*oz+c.position.x;
	        ldy=rot[3]*ox+rot[4]*oy+rot[5]*oz+c.position.y;
	        ldz=rot[6]*ox+rot[7]*oy+rot[8]*oz+c.position.z;
	        out.set( ldx, ldy, ldz );

	    },

	    supportPointC: function ( c, dx, dy, dz, out ) {

	        var rot=c.rotation.elements;
	        var ldx=rot[0]*dx+rot[3]*dy+rot[6]*dz;
	        var ldy=rot[1]*dx+rot[4]*dy+rot[7]*dz;
	        var ldz=rot[2]*dx+rot[5]*dy+rot[8]*dz;
	        var radx=ldx;
	        var radz=ldz;
	        var len=radx*radx+radz*radz;
	        var rad=c.radius;
	        var hh=c.halfHeight;
	        var ox;
	        var oy;
	        var oz;
	        if(len==0){
	        if(ldy<0){
	        ox=rad;
	        oy=-hh;
	        oz=0;
	        }else{
	        ox=rad;
	        oy=hh;
	        oz=0;
	        }
	        }else{
	        len=c.radius/_Math.sqrt(len);
	        if(ldy<0){
	        ox=radx*len;
	        oy=-hh;
	        oz=radz*len;
	        }else{
	        ox=radx*len;
	        oy=hh;
	        oz=radz*len;
	        }
	        }
	        ldx=rot[0]*ox+rot[1]*oy+rot[2]*oz+c.position.x;
	        ldy=rot[3]*ox+rot[4]*oy+rot[5]*oz+c.position.y;
	        ldz=rot[6]*ox+rot[7]*oy+rot[8]*oz+c.position.z;
	        out.set( ldx, ldy, ldz );

	    },

	    detectCollision: function( shape1, shape2, manifold ) {

	        var b;
	        var c;
	        if(this.flip){
	        b=shape2;
	        c=shape1;
	        }else{
	        b=shape1;
	        c=shape2;
	        }
	        var sep=new Vec3();
	        var pos=new Vec3();
	        var dep=new Vec3();

	        if(!this.getSep(b,c,sep,pos,dep))return;
	        var pbx=b.position.x;
	        var pby=b.position.y;
	        var pbz=b.position.z;
	        var pcx=c.position.x;
	        var pcy=c.position.y;
	        var pcz=c.position.z;
	        var bw=b.halfWidth;
	        var bh=b.halfHeight;
	        var bd=b.halfDepth;
	        var ch=c.halfHeight;
	        var r=c.radius;

	        var D = b.dimentions;

	        var nwx=D[0];//b.normalDirectionWidth.x;
	        var nwy=D[1];//b.normalDirectionWidth.y;
	        var nwz=D[2];//b.normalDirectionWidth.z;
	        var nhx=D[3];//b.normalDirectionHeight.x;
	        var nhy=D[4];//b.normalDirectionHeight.y;
	        var nhz=D[5];//b.normalDirectionHeight.z;
	        var ndx=D[6];//b.normalDirectionDepth.x;
	        var ndy=D[7];//b.normalDirectionDepth.y;
	        var ndz=D[8];//b.normalDirectionDepth.z;

	        var dwx=D[9];//b.halfDirectionWidth.x;
	        var dwy=D[10];//b.halfDirectionWidth.y;
	        var dwz=D[11];//b.halfDirectionWidth.z;
	        var dhx=D[12];//b.halfDirectionHeight.x;
	        var dhy=D[13];//b.halfDirectionHeight.y;
	        var dhz=D[14];//b.halfDirectionHeight.z;
	        var ddx=D[15];//b.halfDirectionDepth.x;
	        var ddy=D[16];//b.halfDirectionDepth.y;
	        var ddz=D[17];//b.halfDirectionDepth.z;

	        var ncx=c.normalDirection.x;
	        var ncy=c.normalDirection.y;
	        var ncz=c.normalDirection.z;
	        var dcx=c.halfDirection.x;
	        var dcy=c.halfDirection.y;
	        var dcz=c.halfDirection.z;
	        var nx=sep.x;
	        var ny=sep.y;
	        var nz=sep.z;
	        var dotw=nx*nwx+ny*nwy+nz*nwz;
	        var doth=nx*nhx+ny*nhy+nz*nhz;
	        var dotd=nx*ndx+ny*ndy+nz*ndz;
	        var dotc=nx*ncx+ny*ncy+nz*ncz;
	        var right1=dotw>0;
	        var right2=doth>0;
	        var right3=dotd>0;
	        var right4=dotc>0;
	        if(!right1)dotw=-dotw;
	        if(!right2)doth=-doth;
	        if(!right3)dotd=-dotd;
	        if(!right4)dotc=-dotc;
	        var state=0;
	        if(dotc>0.999){
	        if(dotw>0.999){
	        if(dotw>dotc)state=1;
	        else state=4;
	        }else if(doth>0.999){
	        if(doth>dotc)state=2;
	        else state=4;
	        }else if(dotd>0.999){
	        if(dotd>dotc)state=3;
	        else state=4;
	        }else state=4;
	        }else{
	        if(dotw>0.999)state=1;
	        else if(doth>0.999)state=2;
	        else if(dotd>0.999)state=3;
	        }
	        var cbx;
	        var cby;
	        var cbz;
	        var ccx;
	        var ccy;
	        var ccz;
	        var r00;
	        var r01;
	        var r02;
	        var r10;
	        var r11;
	        var r12;
	        var r20;
	        var r21;
	        var r22;
	        var px;
	        var py;
	        var pz;
	        var pd;
	        var dot;
	        var len;
	        var tx;
	        var ty;
	        var tz;
	        var td;
	        var dx;
	        var dy;
	        var dz;
	        var d1x;
	        var d1y;
	        var d1z;
	        var d2x;
	        var d2y;
	        var d2z;
	        var sx;
	        var sy;
	        var sz;
	        var sd;
	        var ex;
	        var ey;
	        var ez;
	        var ed;
	        var dot1;
	        var dot2;
	        var t1;
	        var dir1x;
	        var dir1y;
	        var dir1z;
	        var dir2x;
	        var dir2y;
	        var dir2z;
	        var dir1l;
	        var dir2l;
	        if(state==0){
	        //manifold.addPoint(pos.x,pos.y,pos.z,nx,ny,nz,dep.x,b,c,0,0,false);
	        manifold.addPoint(pos.x,pos.y,pos.z,nx,ny,nz,dep.x,this.flip);
	        }else if(state==4){
	        if(right4){
	        ccx=pcx-dcx;
	        ccy=pcy-dcy;
	        ccz=pcz-dcz;
	        nx=-ncx;
	        ny=-ncy;
	        nz=-ncz;
	        }else{
	        ccx=pcx+dcx;
	        ccy=pcy+dcy;
	        ccz=pcz+dcz;
	        nx=ncx;
	        ny=ncy;
	        nz=ncz;
	        }
	        var v1x;
	        var v1y;
	        var v1z;
	        var v2x;
	        var v2y;
	        var v2z;
	        var v3x;
	        var v3y;
	        var v3z;
	        var v4x;
	        var v4y;
	        var v4z;
	        
	        dot=1;
	        state=0;
	        dot1=nwx*nx+nwy*ny+nwz*nz;
	        if(dot1<dot){
	        dot=dot1;
	        state=0;
	        }
	        if(-dot1<dot){
	        dot=-dot1;
	        state=1;
	        }
	        dot1=nhx*nx+nhy*ny+nhz*nz;
	        if(dot1<dot){
	        dot=dot1;
	        state=2;
	        }
	        if(-dot1<dot){
	        dot=-dot1;
	        state=3;
	        }
	        dot1=ndx*nx+ndy*ny+ndz*nz;
	        if(dot1<dot){
	        dot=dot1;
	        state=4;
	        }
	        if(-dot1<dot){
	        dot=-dot1;
	        state=5;
	        }
	        var v = b.elements;
	        switch(state){
	        case 0:
	        //v=b.vertex1;
	        v1x=v[0];//v.x;
	        v1y=v[1];//v.y;
	        v1z=v[2];//v.z;
	        //v=b.vertex3;
	        v2x=v[6];//v.x;
	        v2y=v[7];//v.y;
	        v2z=v[8];//v.z;
	        //v=b.vertex4;
	        v3x=v[9];//v.x;
	        v3y=v[10];//v.y;
	        v3z=v[11];//v.z;
	        //v=b.vertex2;
	        v4x=v[3];//v.x;
	        v4y=v[4];//v.y;
	        v4z=v[5];//v.z;
	        break;
	        case 1:
	        //v=b.vertex6;
	        v1x=v[15];//v.x;
	        v1y=v[16];//v.y;
	        v1z=v[17];//v.z;
	        //v=b.vertex8;
	        v2x=v[21];//v.x;
	        v2y=v[22];//v.y;
	        v2z=v[23];//v.z;
	        //v=b.vertex7;
	        v3x=v[18];//v.x;
	        v3y=v[19];//v.y;
	        v3z=v[20];//v.z;
	        //v=b.vertex5;
	        v4x=v[12];//v.x;
	        v4y=v[13];//v.y;
	        v4z=v[14];//v.z;
	        break;
	        case 2:
	        //v=b.vertex5;
	        v1x=v[12];//v.x;
	        v1y=v[13];//v.y;
	        v1z=v[14];//v.z;
	        //v=b.vertex1;
	        v2x=v[0];//v.x;
	        v2y=v[1];//v.y;
	        v2z=v[2];//v.z;
	        //v=b.vertex2;
	        v3x=v[3];//v.x;
	        v3y=v[4];//v.y;
	        v3z=v[5];//v.z;
	        //v=b.vertex6;
	        v4x=v[15];//v.x;
	        v4y=v[16];//v.y;
	        v4z=v[17];//v.z;
	        break;
	        case 3:
	        //v=b.vertex8;
	        v1x=v[21];//v.x;
	        v1y=v[22];//v.y;
	        v1z=v[23];//v.z;
	        //v=b.vertex4;
	        v2x=v[9];//v.x;
	        v2y=v[10];//v.y;
	        v2z=v[11];//v.z;
	        //v=b.vertex3;
	        v3x=v[6];//v.x;
	        v3y=v[7];//v.y;
	        v3z=v[8];//v.z;
	        //v=b.vertex7;
	        v4x=v[18];//v.x;
	        v4y=v[19];//v.y;
	        v4z=v[20];//v.z;
	        break;
	        case 4:
	        //v=b.vertex5;
	        v1x=v[12];//v.x;
	        v1y=v[13];//v.y;
	        v1z=v[14];//v.z;
	        //v=b.vertex7;
	        v2x=v[18];//v.x;
	        v2y=v[19];//v.y;
	        v2z=v[20];//v.z;
	        //v=b.vertex3;
	        v3x=v[6];//v.x;
	        v3y=v[7];//v.y;
	        v3z=v[8];//v.z;
	        //v=b.vertex1;
	        v4x=v[0];//v.x;
	        v4y=v[1];//v.y;
	        v4z=v[2];//v.z;
	        break;
	        case 5:
	        //v=b.vertex2;
	        v1x=v[3];//v.x;
	        v1y=v[4];//v.y;
	        v1z=v[5];//v.z;
	        //v=b.vertex4;
	        v2x=v[9];//v.x;
	        v2y=v[10];//v.y;
	        v2z=v[11];//v.z;
	        //v=b.vertex8;
	        v3x=v[21];//v.x;
	        v3y=v[22];//v.y;
	        v3z=v[23];//v.z;
	        //v=b.vertex6;
	        v4x=v[15];//v.x;
	        v4y=v[16];//v.y;
	        v4z=v[17];//v.z;
	        break;
	        }
	        pd=nx*(v1x-ccx)+ny*(v1y-ccy)+nz*(v1z-ccz);
	        if(pd<=0)manifold.addPoint(v1x,v1y,v1z,-nx,-ny,-nz,pd,this.flip);
	        pd=nx*(v2x-ccx)+ny*(v2y-ccy)+nz*(v2z-ccz);
	        if(pd<=0)manifold.addPoint(v2x,v2y,v2z,-nx,-ny,-nz,pd,this.flip);
	        pd=nx*(v3x-ccx)+ny*(v3y-ccy)+nz*(v3z-ccz);
	        if(pd<=0)manifold.addPoint(v3x,v3y,v3z,-nx,-ny,-nz,pd,this.flip);
	        pd=nx*(v4x-ccx)+ny*(v4y-ccy)+nz*(v4z-ccz);
	        if(pd<=0)manifold.addPoint(v4x,v4y,v4z,-nx,-ny,-nz,pd,this.flip);
	        }else{
	        switch(state){
	        case 1:
	        if(right1){
	        cbx=pbx+dwx;
	        cby=pby+dwy;
	        cbz=pbz+dwz;
	        nx=nwx;
	        ny=nwy;
	        nz=nwz;
	        }else{
	        cbx=pbx-dwx;
	        cby=pby-dwy;
	        cbz=pbz-dwz;
	        nx=-nwx;
	        ny=-nwy;
	        nz=-nwz;
	        }
	        dir1x=nhx;
	        dir1y=nhy;
	        dir1z=nhz;
	        dir1l=bh;
	        dir2x=ndx;
	        dir2y=ndy;
	        dir2z=ndz;
	        dir2l=bd;
	        break;
	        case 2:
	        if(right2){
	        cbx=pbx+dhx;
	        cby=pby+dhy;
	        cbz=pbz+dhz;
	        nx=nhx;
	        ny=nhy;
	        nz=nhz;
	        }else{
	        cbx=pbx-dhx;
	        cby=pby-dhy;
	        cbz=pbz-dhz;
	        nx=-nhx;
	        ny=-nhy;
	        nz=-nhz;
	        }
	        dir1x=nwx;
	        dir1y=nwy;
	        dir1z=nwz;
	        dir1l=bw;
	        dir2x=ndx;
	        dir2y=ndy;
	        dir2z=ndz;
	        dir2l=bd;
	        break;
	        case 3:
	        if(right3){
	        cbx=pbx+ddx;
	        cby=pby+ddy;
	        cbz=pbz+ddz;
	        nx=ndx;
	        ny=ndy;
	        nz=ndz;
	        }else{
	        cbx=pbx-ddx;
	        cby=pby-ddy;
	        cbz=pbz-ddz;
	        nx=-ndx;
	        ny=-ndy;
	        nz=-ndz;
	        }
	        dir1x=nwx;
	        dir1y=nwy;
	        dir1z=nwz;
	        dir1l=bw;
	        dir2x=nhx;
	        dir2y=nhy;
	        dir2z=nhz;
	        dir2l=bh;
	        break;
	        }
	        dot=nx*ncx+ny*ncy+nz*ncz;
	        if(dot<0)len=ch;
	        else len=-ch;
	        ccx=pcx+len*ncx;
	        ccy=pcy+len*ncy;
	        ccz=pcz+len*ncz;
	        if(dotc>=0.999999){
	        tx=-ny;
	        ty=nz;
	        tz=nx;
	        }else{
	        tx=nx;
	        ty=ny;
	        tz=nz;
	        }
	        len=tx*ncx+ty*ncy+tz*ncz;
	        dx=len*ncx-tx;
	        dy=len*ncy-ty;
	        dz=len*ncz-tz;
	        len=_Math.sqrt(dx*dx+dy*dy+dz*dz);
	        if(len==0)return;
	        len=r/len;
	        dx*=len;
	        dy*=len;
	        dz*=len;
	        tx=ccx+dx;
	        ty=ccy+dy;
	        tz=ccz+dz;
	        if(dot<-0.96||dot>0.96){
	        r00=ncx*ncx*1.5-0.5;
	        r01=ncx*ncy*1.5-ncz*0.866025403;
	        r02=ncx*ncz*1.5+ncy*0.866025403;
	        r10=ncy*ncx*1.5+ncz*0.866025403;
	        r11=ncy*ncy*1.5-0.5;
	        r12=ncy*ncz*1.5-ncx*0.866025403;
	        r20=ncz*ncx*1.5-ncy*0.866025403;
	        r21=ncz*ncy*1.5+ncx*0.866025403;
	        r22=ncz*ncz*1.5-0.5;
	        px=tx;
	        py=ty;
	        pz=tz;
	        pd=nx*(px-cbx)+ny*(py-cby)+nz*(pz-cbz);
	        tx=px-pd*nx-cbx;
	        ty=py-pd*ny-cby;
	        tz=pz-pd*nz-cbz;
	        sd=dir1x*tx+dir1y*ty+dir1z*tz;
	        ed=dir2x*tx+dir2y*ty+dir2z*tz;
	        if(sd<-dir1l)sd=-dir1l;
	        else if(sd>dir1l)sd=dir1l;
	        if(ed<-dir2l)ed=-dir2l;
	        else if(ed>dir2l)ed=dir2l;
	        tx=sd*dir1x+ed*dir2x;
	        ty=sd*dir1y+ed*dir2y;
	        tz=sd*dir1z+ed*dir2z;
	        px=cbx+tx;
	        py=cby+ty;
	        pz=cbz+tz;
	        manifold.addPoint(px,py,pz,nx,ny,nz,pd,this.flip);
	        px=dx*r00+dy*r01+dz*r02;
	        py=dx*r10+dy*r11+dz*r12;
	        pz=dx*r20+dy*r21+dz*r22;
	        px=(dx=px)+ccx;
	        py=(dy=py)+ccy;
	        pz=(dz=pz)+ccz;
	        pd=nx*(px-cbx)+ny*(py-cby)+nz*(pz-cbz);
	        if(pd<=0){
	        tx=px-pd*nx-cbx;
	        ty=py-pd*ny-cby;
	        tz=pz-pd*nz-cbz;
	        sd=dir1x*tx+dir1y*ty+dir1z*tz;
	        ed=dir2x*tx+dir2y*ty+dir2z*tz;
	        if(sd<-dir1l)sd=-dir1l;
	        else if(sd>dir1l)sd=dir1l;
	        if(ed<-dir2l)ed=-dir2l;
	        else if(ed>dir2l)ed=dir2l;
	        tx=sd*dir1x+ed*dir2x;
	        ty=sd*dir1y+ed*dir2y;
	        tz=sd*dir1z+ed*dir2z;
	        px=cbx+tx;
	        py=cby+ty;
	        pz=cbz+tz;
	        //manifold.addPoint(px,py,pz,nx,ny,nz,pd,b,c,2,0,false);
	        manifold.addPoint(px,py,pz,nx,ny,nz,pd,this.flip);
	        }
	        px=dx*r00+dy*r01+dz*r02;
	        py=dx*r10+dy*r11+dz*r12;
	        pz=dx*r20+dy*r21+dz*r22;
	        px=(dx=px)+ccx;
	        py=(dy=py)+ccy;
	        pz=(dz=pz)+ccz;
	        pd=nx*(px-cbx)+ny*(py-cby)+nz*(pz-cbz);
	        if(pd<=0){
	        tx=px-pd*nx-cbx;
	        ty=py-pd*ny-cby;
	        tz=pz-pd*nz-cbz;
	        sd=dir1x*tx+dir1y*ty+dir1z*tz;
	        ed=dir2x*tx+dir2y*ty+dir2z*tz;
	        if(sd<-dir1l)sd=-dir1l;
	        else if(sd>dir1l)sd=dir1l;
	        if(ed<-dir2l)ed=-dir2l;
	        else if(ed>dir2l)ed=dir2l;
	        tx=sd*dir1x+ed*dir2x;
	        ty=sd*dir1y+ed*dir2y;
	        tz=sd*dir1z+ed*dir2z;
	        px=cbx+tx;
	        py=cby+ty;
	        pz=cbz+tz;
	        //manifold.addPoint(px,py,pz,nx,ny,nz,pd,b,c,3,0,false);
	        manifold.addPoint(px,py,pz,nx,ny,nz,pd,this.flip);
	        }
	        }else{
	        sx=tx;
	        sy=ty;
	        sz=tz;
	        sd=nx*(sx-cbx)+ny*(sy-cby)+nz*(sz-cbz);
	        sx-=sd*nx;
	        sy-=sd*ny;
	        sz-=sd*nz;
	        if(dot>0){
	        ex=tx+dcx*2;
	        ey=ty+dcy*2;
	        ez=tz+dcz*2;
	        }else{
	        ex=tx-dcx*2;
	        ey=ty-dcy*2;
	        ez=tz-dcz*2;
	        }
	        ed=nx*(ex-cbx)+ny*(ey-cby)+nz*(ez-cbz);
	        ex-=ed*nx;
	        ey-=ed*ny;
	        ez-=ed*nz;
	        d1x=sx-cbx;
	        d1y=sy-cby;
	        d1z=sz-cbz;
	        d2x=ex-cbx;
	        d2y=ey-cby;
	        d2z=ez-cbz;
	        tx=ex-sx;
	        ty=ey-sy;
	        tz=ez-sz;
	        td=ed-sd;
	        dotw=d1x*dir1x+d1y*dir1y+d1z*dir1z;
	        doth=d2x*dir1x+d2y*dir1y+d2z*dir1z;
	        dot1=dotw-dir1l;
	        dot2=doth-dir1l;
	        if(dot1>0){
	        if(dot2>0)return;
	        t1=dot1/(dot1-dot2);
	        sx=sx+tx*t1;
	        sy=sy+ty*t1;
	        sz=sz+tz*t1;
	        sd=sd+td*t1;
	        d1x=sx-cbx;
	        d1y=sy-cby;
	        d1z=sz-cbz;
	        dotw=d1x*dir1x+d1y*dir1y+d1z*dir1z;
	        tx=ex-sx;
	        ty=ey-sy;
	        tz=ez-sz;
	        td=ed-sd;
	        }else if(dot2>0){
	        t1=dot1/(dot1-dot2);
	        ex=sx+tx*t1;
	        ey=sy+ty*t1;
	        ez=sz+tz*t1;
	        ed=sd+td*t1;
	        d2x=ex-cbx;
	        d2y=ey-cby;
	        d2z=ez-cbz;
	        doth=d2x*dir1x+d2y*dir1y+d2z*dir1z;
	        tx=ex-sx;
	        ty=ey-sy;
	        tz=ez-sz;
	        td=ed-sd;
	        }
	        dot1=dotw+dir1l;
	        dot2=doth+dir1l;
	        if(dot1<0){
	        if(dot2<0)return;
	        t1=dot1/(dot1-dot2);
	        sx=sx+tx*t1;
	        sy=sy+ty*t1;
	        sz=sz+tz*t1;
	        sd=sd+td*t1;
	        d1x=sx-cbx;
	        d1y=sy-cby;
	        d1z=sz-cbz;
	        tx=ex-sx;
	        ty=ey-sy;
	        tz=ez-sz;
	        td=ed-sd;
	        }else if(dot2<0){
	        t1=dot1/(dot1-dot2);
	        ex=sx+tx*t1;
	        ey=sy+ty*t1;
	        ez=sz+tz*t1;
	        ed=sd+td*t1;
	        d2x=ex-cbx;
	        d2y=ey-cby;
	        d2z=ez-cbz;
	        tx=ex-sx;
	        ty=ey-sy;
	        tz=ez-sz;
	        td=ed-sd;
	        }
	        dotw=d1x*dir2x+d1y*dir2y+d1z*dir2z;
	        doth=d2x*dir2x+d2y*dir2y+d2z*dir2z;
	        dot1=dotw-dir2l;
	        dot2=doth-dir2l;
	        if(dot1>0){
	        if(dot2>0)return;
	        t1=dot1/(dot1-dot2);
	        sx=sx+tx*t1;
	        sy=sy+ty*t1;
	        sz=sz+tz*t1;
	        sd=sd+td*t1;
	        d1x=sx-cbx;
	        d1y=sy-cby;
	        d1z=sz-cbz;
	        dotw=d1x*dir2x+d1y*dir2y+d1z*dir2z;
	        tx=ex-sx;
	        ty=ey-sy;
	        tz=ez-sz;
	        td=ed-sd;
	        }else if(dot2>0){
	        t1=dot1/(dot1-dot2);
	        ex=sx+tx*t1;
	        ey=sy+ty*t1;
	        ez=sz+tz*t1;
	        ed=sd+td*t1;
	        d2x=ex-cbx;
	        d2y=ey-cby;
	        d2z=ez-cbz;
	        doth=d2x*dir2x+d2y*dir2y+d2z*dir2z;
	        tx=ex-sx;
	        ty=ey-sy;
	        tz=ez-sz;
	        td=ed-sd;
	        }
	        dot1=dotw+dir2l;
	        dot2=doth+dir2l;
	        if(dot1<0){
	        if(dot2<0)return;
	        t1=dot1/(dot1-dot2);
	        sx=sx+tx*t1;
	        sy=sy+ty*t1;
	        sz=sz+tz*t1;
	        sd=sd+td*t1;
	        }else if(dot2<0){
	        t1=dot1/(dot1-dot2);
	        ex=sx+tx*t1;
	        ey=sy+ty*t1;
	        ez=sz+tz*t1;
	        ed=sd+td*t1;
	        }
	        if(sd<0){
	        //manifold.addPoint(sx,sy,sz,nx,ny,nz,sd,b,c,1,0,false);
	        manifold.addPoint(sx,sy,sz,nx,ny,nz,sd,this.flip);
	        }
	        if(ed<0){
	        //manifold.addPoint(ex,ey,ez,nx,ny,nz,ed,b,c,4,0,false);
	        manifold.addPoint(ex,ey,ez,nx,ny,nz,ed,this.flip);
	        }
	        }
	        }

	    }

	    });

	function CylinderCylinderCollisionDetector() {
	    
	    CollisionDetector.call( this );

	}

	CylinderCylinderCollisionDetector.prototype = Object.assign( Object.create( CollisionDetector.prototype ), {

	    constructor: CylinderCylinderCollisionDetector,


	    getSep: function ( c1, c2, sep, pos, dep ) {

	        var t1x;
	        var t1y;
	        var t1z;
	        var t2x;
	        var t2y;
	        var t2z;
	        var sup=new Vec3();
	        var len;
	        var p1x;
	        var p1y;
	        var p1z;
	        var p2x;
	        var p2y;
	        var p2z;
	        var v01x=c1.position.x;
	        var v01y=c1.position.y;
	        var v01z=c1.position.z;
	        var v02x=c2.position.x;
	        var v02y=c2.position.y;
	        var v02z=c2.position.z;
	        var v0x=v02x-v01x;
	        var v0y=v02y-v01y;
	        var v0z=v02z-v01z;
	        if(v0x*v0x+v0y*v0y+v0z*v0z==0)v0y=0.001;
	        var nx=-v0x;
	        var ny=-v0y;
	        var nz=-v0z;
	        this.supportPoint(c1,-nx,-ny,-nz,sup);
	        var v11x=sup.x;
	        var v11y=sup.y;
	        var v11z=sup.z;
	        this.supportPoint(c2,nx,ny,nz,sup);
	        var v12x=sup.x;
	        var v12y=sup.y;
	        var v12z=sup.z;
	        var v1x=v12x-v11x;
	        var v1y=v12y-v11y;
	        var v1z=v12z-v11z;
	        if(v1x*nx+v1y*ny+v1z*nz<=0){
	        return false;
	        }
	        nx=v1y*v0z-v1z*v0y;
	        ny=v1z*v0x-v1x*v0z;
	        nz=v1x*v0y-v1y*v0x;
	        if(nx*nx+ny*ny+nz*nz==0){
	        sep.set( v1x-v0x, v1y-v0y, v1z-v0z ).normalize();
	        pos.set( (v11x+v12x)*0.5, (v11y+v12y)*0.5, (v11z+v12z)*0.5 );
	        return true;
	        }
	        this.supportPoint(c1,-nx,-ny,-nz,sup);
	        var v21x=sup.x;
	        var v21y=sup.y;
	        var v21z=sup.z;
	        this.supportPoint(c2,nx,ny,nz,sup);
	        var v22x=sup.x;
	        var v22y=sup.y;
	        var v22z=sup.z;
	        var v2x=v22x-v21x;
	        var v2y=v22y-v21y;
	        var v2z=v22z-v21z;
	        if(v2x*nx+v2y*ny+v2z*nz<=0){
	        return false;
	        }
	        t1x=v1x-v0x;
	        t1y=v1y-v0y;
	        t1z=v1z-v0z;
	        t2x=v2x-v0x;
	        t2y=v2y-v0y;
	        t2z=v2z-v0z;
	        nx=t1y*t2z-t1z*t2y;
	        ny=t1z*t2x-t1x*t2z;
	        nz=t1x*t2y-t1y*t2x;
	        if(nx*v0x+ny*v0y+nz*v0z>0){
	        t1x=v1x;
	        t1y=v1y;
	        t1z=v1z;
	        v1x=v2x;
	        v1y=v2y;
	        v1z=v2z;
	        v2x=t1x;
	        v2y=t1y;
	        v2z=t1z;
	        t1x=v11x;
	        t1y=v11y;
	        t1z=v11z;
	        v11x=v21x;
	        v11y=v21y;
	        v11z=v21z;
	        v21x=t1x;
	        v21y=t1y;
	        v21z=t1z;
	        t1x=v12x;
	        t1y=v12y;
	        t1z=v12z;
	        v12x=v22x;
	        v12y=v22y;
	        v12z=v22z;
	        v22x=t1x;
	        v22y=t1y;
	        v22z=t1z;
	        nx=-nx;
	        ny=-ny;
	        nz=-nz;
	        }
	        var iterations=0;
	        while(true){
	        if(++iterations>100){
	        return false;
	        }
	        this.supportPoint(c1,-nx,-ny,-nz,sup);
	        var v31x=sup.x;
	        var v31y=sup.y;
	        var v31z=sup.z;
	        this.supportPoint(c2,nx,ny,nz,sup);
	        var v32x=sup.x;
	        var v32y=sup.y;
	        var v32z=sup.z;
	        var v3x=v32x-v31x;
	        var v3y=v32y-v31y;
	        var v3z=v32z-v31z;
	        if(v3x*nx+v3y*ny+v3z*nz<=0){
	        return false;
	        }
	        if((v1y*v3z-v1z*v3y)*v0x+(v1z*v3x-v1x*v3z)*v0y+(v1x*v3y-v1y*v3x)*v0z<0){
	        v2x=v3x;
	        v2y=v3y;
	        v2z=v3z;
	        v21x=v31x;
	        v21y=v31y;
	        v21z=v31z;
	        v22x=v32x;
	        v22y=v32y;
	        v22z=v32z;
	        t1x=v1x-v0x;
	        t1y=v1y-v0y;
	        t1z=v1z-v0z;
	        t2x=v3x-v0x;
	        t2y=v3y-v0y;
	        t2z=v3z-v0z;
	        nx=t1y*t2z-t1z*t2y;
	        ny=t1z*t2x-t1x*t2z;
	        nz=t1x*t2y-t1y*t2x;
	        continue;
	        }
	        if((v3y*v2z-v3z*v2y)*v0x+(v3z*v2x-v3x*v2z)*v0y+(v3x*v2y-v3y*v2x)*v0z<0){
	        v1x=v3x;
	        v1y=v3y;
	        v1z=v3z;
	        v11x=v31x;
	        v11y=v31y;
	        v11z=v31z;
	        v12x=v32x;
	        v12y=v32y;
	        v12z=v32z;
	        t1x=v3x-v0x;
	        t1y=v3y-v0y;
	        t1z=v3z-v0z;
	        t2x=v2x-v0x;
	        t2y=v2y-v0y;
	        t2z=v2z-v0z;
	        nx=t1y*t2z-t1z*t2y;
	        ny=t1z*t2x-t1x*t2z;
	        nz=t1x*t2y-t1y*t2x;
	        continue;
	        }
	        var hit=false;
	        while(true){
	        t1x=v2x-v1x;
	        t1y=v2y-v1y;
	        t1z=v2z-v1z;
	        t2x=v3x-v1x;
	        t2y=v3y-v1y;
	        t2z=v3z-v1z;
	        nx=t1y*t2z-t1z*t2y;
	        ny=t1z*t2x-t1x*t2z;
	        nz=t1x*t2y-t1y*t2x;
	        len=1/_Math.sqrt(nx*nx+ny*ny+nz*nz);
	        nx*=len;
	        ny*=len;
	        nz*=len;
	        if(nx*v1x+ny*v1y+nz*v1z>=0&&!hit){
	        var b0=(v1y*v2z-v1z*v2y)*v3x+(v1z*v2x-v1x*v2z)*v3y+(v1x*v2y-v1y*v2x)*v3z;
	        var b1=(v3y*v2z-v3z*v2y)*v0x+(v3z*v2x-v3x*v2z)*v0y+(v3x*v2y-v3y*v2x)*v0z;
	        var b2=(v0y*v1z-v0z*v1y)*v3x+(v0z*v1x-v0x*v1z)*v3y+(v0x*v1y-v0y*v1x)*v3z;
	        var b3=(v2y*v1z-v2z*v1y)*v0x+(v2z*v1x-v2x*v1z)*v0y+(v2x*v1y-v2y*v1x)*v0z;
	        var sum=b0+b1+b2+b3;
	        if(sum<=0){
	        b0=0;
	        b1=(v2y*v3z-v2z*v3y)*nx+(v2z*v3x-v2x*v3z)*ny+(v2x*v3y-v2y*v3x)*nz;
	        b2=(v3y*v2z-v3z*v2y)*nx+(v3z*v2x-v3x*v2z)*ny+(v3x*v2y-v3y*v2x)*nz;
	        b3=(v1y*v2z-v1z*v2y)*nx+(v1z*v2x-v1x*v2z)*ny+(v1x*v2y-v1y*v2x)*nz;
	        sum=b1+b2+b3;
	        }
	        var inv=1/sum;
	        p1x=(v01x*b0+v11x*b1+v21x*b2+v31x*b3)*inv;
	        p1y=(v01y*b0+v11y*b1+v21y*b2+v31y*b3)*inv;
	        p1z=(v01z*b0+v11z*b1+v21z*b2+v31z*b3)*inv;
	        p2x=(v02x*b0+v12x*b1+v22x*b2+v32x*b3)*inv;
	        p2y=(v02y*b0+v12y*b1+v22y*b2+v32y*b3)*inv;
	        p2z=(v02z*b0+v12z*b1+v22z*b2+v32z*b3)*inv;
	        hit=true;
	        }
	        this.supportPoint(c1,-nx,-ny,-nz,sup);
	        var v41x=sup.x;
	        var v41y=sup.y;
	        var v41z=sup.z;
	        this.supportPoint(c2,nx,ny,nz,sup);
	        var v42x=sup.x;
	        var v42y=sup.y;
	        var v42z=sup.z;
	        var v4x=v42x-v41x;
	        var v4y=v42y-v41y;
	        var v4z=v42z-v41z;
	        var separation=-(v4x*nx+v4y*ny+v4z*nz);
	        if((v4x-v3x)*nx+(v4y-v3y)*ny+(v4z-v3z)*nz<=0.01||separation>=0){
	        if(hit){
	        sep.set( -nx, -ny, -nz );
	        pos.set( (p1x+p2x)*0.5, (p1y+p2y)*0.5, (p1z+p2z)*0.5 );
	        dep.x=separation;
	        return true;
	        }
	        return false;
	        }
	        if(
	        (v4y*v1z-v4z*v1y)*v0x+
	        (v4z*v1x-v4x*v1z)*v0y+
	        (v4x*v1y-v4y*v1x)*v0z<0
	        ){
	        if(
	        (v4y*v2z-v4z*v2y)*v0x+
	        (v4z*v2x-v4x*v2z)*v0y+
	        (v4x*v2y-v4y*v2x)*v0z<0
	        ){
	        v1x=v4x;
	        v1y=v4y;
	        v1z=v4z;
	        v11x=v41x;
	        v11y=v41y;
	        v11z=v41z;
	        v12x=v42x;
	        v12y=v42y;
	        v12z=v42z;
	        }else{
	        v3x=v4x;
	        v3y=v4y;
	        v3z=v4z;
	        v31x=v41x;
	        v31y=v41y;
	        v31z=v41z;
	        v32x=v42x;
	        v32y=v42y;
	        v32z=v42z;
	        }
	        }else{
	        if(
	        (v4y*v3z-v4z*v3y)*v0x+
	        (v4z*v3x-v4x*v3z)*v0y+
	        (v4x*v3y-v4y*v3x)*v0z<0
	        ){
	        v2x=v4x;
	        v2y=v4y;
	        v2z=v4z;
	        v21x=v41x;
	        v21y=v41y;
	        v21z=v41z;
	        v22x=v42x;
	        v22y=v42y;
	        v22z=v42z;
	        }else{
	        v1x=v4x;
	        v1y=v4y;
	        v1z=v4z;
	        v11x=v41x;
	        v11y=v41y;
	        v11z=v41z;
	        v12x=v42x;
	        v12y=v42y;
	        v12z=v42z;
	        }
	        }
	        }
	        }
	        //return false;
	    },

	    supportPoint: function ( c, dx, dy, dz, out ) {

	        var rot=c.rotation.elements;
	        var ldx=rot[0]*dx+rot[3]*dy+rot[6]*dz;
	        var ldy=rot[1]*dx+rot[4]*dy+rot[7]*dz;
	        var ldz=rot[2]*dx+rot[5]*dy+rot[8]*dz;
	        var radx=ldx;
	        var radz=ldz;
	        var len=radx*radx+radz*radz;
	        var rad=c.radius;
	        var hh=c.halfHeight;
	        var ox;
	        var oy;
	        var oz;
	        if(len==0){
	        if(ldy<0){
	        ox=rad;
	        oy=-hh;
	        oz=0;
	        }else{
	        ox=rad;
	        oy=hh;
	        oz=0;
	        }
	        }else{
	        len=c.radius/_Math.sqrt(len);
	        if(ldy<0){
	        ox=radx*len;
	        oy=-hh;
	        oz=radz*len;
	        }else{
	        ox=radx*len;
	        oy=hh;
	        oz=radz*len;
	        }
	        }
	        ldx=rot[0]*ox+rot[1]*oy+rot[2]*oz+c.position.x;
	        ldy=rot[3]*ox+rot[4]*oy+rot[5]*oz+c.position.y;
	        ldz=rot[6]*ox+rot[7]*oy+rot[8]*oz+c.position.z;
	        out.set( ldx, ldy, ldz );

	    },

	    detectCollision: function ( shape1, shape2, manifold ) {

	        var c1;
	        var c2;
	        if(shape1.id<shape2.id){
	            c1=shape1;
	            c2=shape2;
	        }else{
	            c1=shape2;
	            c2=shape1;
	        }
	        var p1=c1.position;
	        var p2=c2.position;
	        var p1x=p1.x;
	        var p1y=p1.y;
	        var p1z=p1.z;
	        var p2x=p2.x;
	        var p2y=p2.y;
	        var p2z=p2.z;
	        var h1=c1.halfHeight;
	        var h2=c2.halfHeight;
	        var n1=c1.normalDirection;
	        var n2=c2.normalDirection;
	        var d1=c1.halfDirection;
	        var d2=c2.halfDirection;
	        var r1=c1.radius;
	        var r2=c2.radius;
	        var n1x=n1.x;
	        var n1y=n1.y;
	        var n1z=n1.z;
	        var n2x=n2.x;
	        var n2y=n2.y;
	        var n2z=n2.z;
	        var d1x=d1.x;
	        var d1y=d1.y;
	        var d1z=d1.z;
	        var d2x=d2.x;
	        var d2y=d2.y;
	        var d2z=d2.z;
	        var dx=p1x-p2x;
	        var dy=p1y-p2y;
	        var dz=p1z-p2z;
	        var len;
	        var c1x;
	        var c1y;
	        var c1z;
	        var c2x;
	        var c2y;
	        var c2z;
	        var tx;
	        var ty;
	        var tz;
	        var sx;
	        var sy;
	        var sz;
	        var ex;
	        var ey;
	        var ez;
	        var depth1;
	        var depth2;
	        var dot;
	        var t1;
	        var t2;
	        var sep=new Vec3();
	        var pos=new Vec3();
	        var dep=new Vec3();
	        if(!this.getSep(c1,c2,sep,pos,dep))return;
	        var dot1=sep.x*n1x+sep.y*n1y+sep.z*n1z;
	        var dot2=sep.x*n2x+sep.y*n2y+sep.z*n2z;
	        var right1=dot1>0;
	        var right2=dot2>0;
	        if(!right1)dot1=-dot1;
	        if(!right2)dot2=-dot2;
	        var state=0;
	        if(dot1>0.999||dot2>0.999){
	        if(dot1>dot2)state=1;
	        else state=2;
	        }
	        var nx;
	        var ny;
	        var nz;
	        var depth=dep.x;
	        var r00;
	        var r01;
	        var r02;
	        var r10;
	        var r11;
	        var r12;
	        var r20;
	        var r21;
	        var r22;
	        var px;
	        var py;
	        var pz;
	        var pd;
	        var a;
	        var b;
	        var e;
	        var f;
	        nx=sep.x;
	        ny=sep.y;
	        nz=sep.z;
	        switch(state){
	        case 0:
	        manifold.addPoint(pos.x,pos.y,pos.z,nx,ny,nz,depth,false);
	        break;
	        case 1:
	        if(right1){
	        c1x=p1x+d1x;
	        c1y=p1y+d1y;
	        c1z=p1z+d1z;
	        nx=n1x;
	        ny=n1y;
	        nz=n1z;
	        }else{
	        c1x=p1x-d1x;
	        c1y=p1y-d1y;
	        c1z=p1z-d1z;
	        nx=-n1x;
	        ny=-n1y;
	        nz=-n1z;
	        }
	        dot=nx*n2x+ny*n2y+nz*n2z;
	        if(dot<0)len=h2;
	        else len=-h2;
	        c2x=p2x+len*n2x;
	        c2y=p2y+len*n2y;
	        c2z=p2z+len*n2z;
	        if(dot2>=0.999999){
	        tx=-ny;
	        ty=nz;
	        tz=nx;
	        }else{
	        tx=nx;
	        ty=ny;
	        tz=nz;
	        }
	        len=tx*n2x+ty*n2y+tz*n2z;
	        dx=len*n2x-tx;
	        dy=len*n2y-ty;
	        dz=len*n2z-tz;
	        len=_Math.sqrt(dx*dx+dy*dy+dz*dz);
	        if(len==0)break;
	        len=r2/len;
	        dx*=len;
	        dy*=len;
	        dz*=len;
	        tx=c2x+dx;
	        ty=c2y+dy;
	        tz=c2z+dz;
	        if(dot<-0.96||dot>0.96){
	        r00=n2x*n2x*1.5-0.5;
	        r01=n2x*n2y*1.5-n2z*0.866025403;
	        r02=n2x*n2z*1.5+n2y*0.866025403;
	        r10=n2y*n2x*1.5+n2z*0.866025403;
	        r11=n2y*n2y*1.5-0.5;
	        r12=n2y*n2z*1.5-n2x*0.866025403;
	        r20=n2z*n2x*1.5-n2y*0.866025403;
	        r21=n2z*n2y*1.5+n2x*0.866025403;
	        r22=n2z*n2z*1.5-0.5;
	        px=tx;
	        py=ty;
	        pz=tz;
	        pd=nx*(px-c1x)+ny*(py-c1y)+nz*(pz-c1z);
	        tx=px-pd*nx-c1x;
	        ty=py-pd*ny-c1y;
	        tz=pz-pd*nz-c1z;
	        len=tx*tx+ty*ty+tz*tz;
	        if(len>r1*r1){
	        len=r1/_Math.sqrt(len);
	        tx*=len;
	        ty*=len;
	        tz*=len;
	        }
	        px=c1x+tx;
	        py=c1y+ty;
	        pz=c1z+tz;
	        manifold.addPoint(px,py,pz,nx,ny,nz,pd,false);
	        px=dx*r00+dy*r01+dz*r02;
	        py=dx*r10+dy*r11+dz*r12;
	        pz=dx*r20+dy*r21+dz*r22;
	        px=(dx=px)+c2x;
	        py=(dy=py)+c2y;
	        pz=(dz=pz)+c2z;
	        pd=nx*(px-c1x)+ny*(py-c1y)+nz*(pz-c1z);
	        if(pd<=0){
	        tx=px-pd*nx-c1x;
	        ty=py-pd*ny-c1y;
	        tz=pz-pd*nz-c1z;
	        len=tx*tx+ty*ty+tz*tz;
	        if(len>r1*r1){
	        len=r1/_Math.sqrt(len);
	        tx*=len;
	        ty*=len;
	        tz*=len;
	        }
	        px=c1x+tx;
	        py=c1y+ty;
	        pz=c1z+tz;
	        manifold.addPoint(px,py,pz,nx,ny,nz,pd,false);
	        }
	        px=dx*r00+dy*r01+dz*r02;
	        py=dx*r10+dy*r11+dz*r12;
	        pz=dx*r20+dy*r21+dz*r22;
	        px=(dx=px)+c2x;
	        py=(dy=py)+c2y;
	        pz=(dz=pz)+c2z;
	        pd=nx*(px-c1x)+ny*(py-c1y)+nz*(pz-c1z);
	        if(pd<=0){
	        tx=px-pd*nx-c1x;
	        ty=py-pd*ny-c1y;
	        tz=pz-pd*nz-c1z;
	        len=tx*tx+ty*ty+tz*tz;
	        if(len>r1*r1){
	        len=r1/_Math.sqrt(len);
	        tx*=len;
	        ty*=len;
	        tz*=len;
	        }
	        px=c1x+tx;
	        py=c1y+ty;
	        pz=c1z+tz;
	        manifold.addPoint(px,py,pz,nx,ny,nz,pd,false);
	        }
	        }else{
	        sx=tx;
	        sy=ty;
	        sz=tz;
	        depth1=nx*(sx-c1x)+ny*(sy-c1y)+nz*(sz-c1z);
	        sx-=depth1*nx;
	        sy-=depth1*ny;
	        sz-=depth1*nz;
	        if(dot>0){
	        ex=tx+n2x*h2*2;
	        ey=ty+n2y*h2*2;
	        ez=tz+n2z*h2*2;
	        }else{
	        ex=tx-n2x*h2*2;
	        ey=ty-n2y*h2*2;
	        ez=tz-n2z*h2*2;
	        }
	        depth2=nx*(ex-c1x)+ny*(ey-c1y)+nz*(ez-c1z);
	        ex-=depth2*nx;
	        ey-=depth2*ny;
	        ez-=depth2*nz;
	        dx=c1x-sx;
	        dy=c1y-sy;
	        dz=c1z-sz;
	        tx=ex-sx;
	        ty=ey-sy;
	        tz=ez-sz;
	        a=dx*dx+dy*dy+dz*dz;
	        b=dx*tx+dy*ty+dz*tz;
	        e=tx*tx+ty*ty+tz*tz;
	        f=b*b-e*(a-r1*r1);
	        if(f<0)break;
	        f=_Math.sqrt(f);
	        t1=(b+f)/e;
	        t2=(b-f)/e;
	        if(t2<t1){
	        len=t1;
	        t1=t2;
	        t2=len;
	        }
	        if(t2>1)t2=1;
	        if(t1<0)t1=0;
	        tx=sx+(ex-sx)*t1;
	        ty=sy+(ey-sy)*t1;
	        tz=sz+(ez-sz)*t1;
	        ex=sx+(ex-sx)*t2;
	        ey=sy+(ey-sy)*t2;
	        ez=sz+(ez-sz)*t2;
	        sx=tx;
	        sy=ty;
	        sz=tz;
	        len=depth1+(depth2-depth1)*t1;
	        depth2=depth1+(depth2-depth1)*t2;
	        depth1=len;
	        if(depth1<0) manifold.addPoint(sx,sy,sz,nx,ny,nz,pd,false);
	        if(depth2<0) manifold.addPoint(ex,ey,ez,nx,ny,nz,pd,false);
	        
	        }
	        break;
	        case 2:
	        if(right2){
	        c2x=p2x-d2x;
	        c2y=p2y-d2y;
	        c2z=p2z-d2z;
	        nx=-n2x;
	        ny=-n2y;
	        nz=-n2z;
	        }else{
	        c2x=p2x+d2x;
	        c2y=p2y+d2y;
	        c2z=p2z+d2z;
	        nx=n2x;
	        ny=n2y;
	        nz=n2z;
	        }
	        dot=nx*n1x+ny*n1y+nz*n1z;
	        if(dot<0)len=h1;
	        else len=-h1;
	        c1x=p1x+len*n1x;
	        c1y=p1y+len*n1y;
	        c1z=p1z+len*n1z;
	        if(dot1>=0.999999){
	        tx=-ny;
	        ty=nz;
	        tz=nx;
	        }else{
	        tx=nx;
	        ty=ny;
	        tz=nz;
	        }
	        len=tx*n1x+ty*n1y+tz*n1z;
	        dx=len*n1x-tx;
	        dy=len*n1y-ty;
	        dz=len*n1z-tz;
	        len=_Math.sqrt(dx*dx+dy*dy+dz*dz);
	        if(len==0)break;
	        len=r1/len;
	        dx*=len;
	        dy*=len;
	        dz*=len;
	        tx=c1x+dx;
	        ty=c1y+dy;
	        tz=c1z+dz;
	        if(dot<-0.96||dot>0.96){
	        r00=n1x*n1x*1.5-0.5;
	        r01=n1x*n1y*1.5-n1z*0.866025403;
	        r02=n1x*n1z*1.5+n1y*0.866025403;
	        r10=n1y*n1x*1.5+n1z*0.866025403;
	        r11=n1y*n1y*1.5-0.5;
	        r12=n1y*n1z*1.5-n1x*0.866025403;
	        r20=n1z*n1x*1.5-n1y*0.866025403;
	        r21=n1z*n1y*1.5+n1x*0.866025403;
	        r22=n1z*n1z*1.5-0.5;
	        px=tx;
	        py=ty;
	        pz=tz;
	        pd=nx*(px-c2x)+ny*(py-c2y)+nz*(pz-c2z);
	        tx=px-pd*nx-c2x;
	        ty=py-pd*ny-c2y;
	        tz=pz-pd*nz-c2z;
	        len=tx*tx+ty*ty+tz*tz;
	        if(len>r2*r2){
	        len=r2/_Math.sqrt(len);
	        tx*=len;
	        ty*=len;
	        tz*=len;
	        }
	        px=c2x+tx;
	        py=c2y+ty;
	        pz=c2z+tz;
	        manifold.addPoint(px,py,pz,-nx,-ny,-nz,pd,false);
	        px=dx*r00+dy*r01+dz*r02;
	        py=dx*r10+dy*r11+dz*r12;
	        pz=dx*r20+dy*r21+dz*r22;
	        px=(dx=px)+c1x;
	        py=(dy=py)+c1y;
	        pz=(dz=pz)+c1z;
	        pd=nx*(px-c2x)+ny*(py-c2y)+nz*(pz-c2z);
	        if(pd<=0){
	        tx=px-pd*nx-c2x;
	        ty=py-pd*ny-c2y;
	        tz=pz-pd*nz-c2z;
	        len=tx*tx+ty*ty+tz*tz;
	        if(len>r2*r2){
	        len=r2/_Math.sqrt(len);
	        tx*=len;
	        ty*=len;
	        tz*=len;
	        }
	        px=c2x+tx;
	        py=c2y+ty;
	        pz=c2z+tz;
	        manifold.addPoint(px,py,pz,-nx,-ny,-nz,pd,false);
	        }
	        px=dx*r00+dy*r01+dz*r02;
	        py=dx*r10+dy*r11+dz*r12;
	        pz=dx*r20+dy*r21+dz*r22;
	        px=(dx=px)+c1x;
	        py=(dy=py)+c1y;
	        pz=(dz=pz)+c1z;
	        pd=nx*(px-c2x)+ny*(py-c2y)+nz*(pz-c2z);
	        if(pd<=0){
	        tx=px-pd*nx-c2x;
	        ty=py-pd*ny-c2y;
	        tz=pz-pd*nz-c2z;
	        len=tx*tx+ty*ty+tz*tz;
	        if(len>r2*r2){
	        len=r2/_Math.sqrt(len);
	        tx*=len;
	        ty*=len;
	        tz*=len;
	        }
	        px=c2x+tx;
	        py=c2y+ty;
	        pz=c2z+tz;
	        manifold.addPoint(px,py,pz,-nx,-ny,-nz,pd,false);
	        }
	        }else{
	        sx=tx;
	        sy=ty;
	        sz=tz;
	        depth1=nx*(sx-c2x)+ny*(sy-c2y)+nz*(sz-c2z);
	        sx-=depth1*nx;
	        sy-=depth1*ny;
	        sz-=depth1*nz;
	        if(dot>0){
	        ex=tx+n1x*h1*2;
	        ey=ty+n1y*h1*2;
	        ez=tz+n1z*h1*2;
	        }else{
	        ex=tx-n1x*h1*2;
	        ey=ty-n1y*h1*2;
	        ez=tz-n1z*h1*2;
	        }
	        depth2=nx*(ex-c2x)+ny*(ey-c2y)+nz*(ez-c2z);
	        ex-=depth2*nx;
	        ey-=depth2*ny;
	        ez-=depth2*nz;
	        dx=c2x-sx;
	        dy=c2y-sy;
	        dz=c2z-sz;
	        tx=ex-sx;
	        ty=ey-sy;
	        tz=ez-sz;
	        a=dx*dx+dy*dy+dz*dz;
	        b=dx*tx+dy*ty+dz*tz;
	        e=tx*tx+ty*ty+tz*tz;
	        f=b*b-e*(a-r2*r2);
	        if(f<0)break;
	        f=_Math.sqrt(f);
	        t1=(b+f)/e;
	        t2=(b-f)/e;
	        if(t2<t1){
	        len=t1;
	        t1=t2;
	        t2=len;
	        }
	        if(t2>1)t2=1;
	        if(t1<0)t1=0;
	        tx=sx+(ex-sx)*t1;
	        ty=sy+(ey-sy)*t1;
	        tz=sz+(ez-sz)*t1;
	        ex=sx+(ex-sx)*t2;
	        ey=sy+(ey-sy)*t2;
	        ez=sz+(ez-sz)*t2;
	        sx=tx;
	        sy=ty;
	        sz=tz;
	        len=depth1+(depth2-depth1)*t1;
	        depth2=depth1+(depth2-depth1)*t2;
	        depth1=len;
	        if(depth1<0){
	        manifold.addPoint(sx,sy,sz,-nx,-ny,-nz,depth1,false);
	        }
	        if(depth2<0){
	        manifold.addPoint(ex,ey,ez,-nx,-ny,-nz,depth2,false);
	        }
	        }
	        break;
	        }

	    }

	});

	/**
	 * A collision detector which detects collisions between sphere and box.
	 * @author saharan
	 */
	function SphereBoxCollisionDetector ( flip ) {
	    
	    CollisionDetector.call( this );
	    this.flip = flip;

	}

	SphereBoxCollisionDetector.prototype = Object.assign( Object.create( CollisionDetector.prototype ), {

	    constructor: SphereBoxCollisionDetector,

	    detectCollision: function ( shape1, shape2, manifold ) {

	        var s;
	        var b;
	        if(this.flip){
	            s=(shape2);
	            b=(shape1);
	        }else{
	            s=(shape1);
	            b=(shape2);
	        }

	        var D = b.dimentions;

	        var ps=s.position;
	        var psx=ps.x;
	        var psy=ps.y;
	        var psz=ps.z;
	        var pb=b.position;
	        var pbx=pb.x;
	        var pby=pb.y;
	        var pbz=pb.z;
	        var rad=s.radius;

	        var hw=b.halfWidth;
	        var hh=b.halfHeight;
	        var hd=b.halfDepth;

	        var dx=psx-pbx;
	        var dy=psy-pby;
	        var dz=psz-pbz;
	        var sx=D[0]*dx+D[1]*dy+D[2]*dz;
	        var sy=D[3]*dx+D[4]*dy+D[5]*dz;
	        var sz=D[6]*dx+D[7]*dy+D[8]*dz;
	        var cx;
	        var cy;
	        var cz;
	        var len;
	        var invLen;
	        var overlap=0;
	        if(sx>hw){
	            sx=hw;
	        }else if(sx<-hw){
	            sx=-hw;
	        }else{
	            overlap=1;
	        }
	        if(sy>hh){
	            sy=hh;
	        }else if(sy<-hh){
	            sy=-hh;
	        }else{
	            overlap|=2;
	        }
	        if(sz>hd){
	            sz=hd;
	        }else if(sz<-hd){
	            sz=-hd;
	        }else{
	            overlap|=4;
	        }
	        if(overlap==7){
	            // center of sphere is in the box
	            if(sx<0){
	                dx=hw+sx;
	            }else{
	                dx=hw-sx;
	            }
	            if(sy<0){
	                dy=hh+sy;
	            }else{
	                dy=hh-sy;
	            }
	            if(sz<0){
	                dz=hd+sz;
	            }else{
	                dz=hd-sz;
	            }
	            if(dx<dy){
	                if(dx<dz){
	                    len=dx-hw;
	                if(sx<0){
	                    sx=-hw;
	                    dx=D[0];
	                    dy=D[1];
	                    dz=D[2];
	                }else{
	                    sx=hw;
	                    dx=-D[0];
	                    dy=-D[1];
	                    dz=-D[2];
	                }
	            }else{
	                len=dz-hd;
	                if(sz<0){
	                    sz=-hd;
	                    dx=D[6];
	                    dy=D[7];
	                    dz=D[8];
	                }else{
	                    sz=hd;
	                    dx=-D[6];
	                    dy=-D[7];
	                    dz=-D[8];
	                }
	            }
	            }else{
	                if(dy<dz){
	                    len=dy-hh;
	                    if(sy<0){
	                        sy=-hh;
	                        dx=D[3];
	                        dy=D[4];
	                        dz=D[5];
	                    }else{
	                        sy=hh;
	                        dx=-D[3];
	                        dy=-D[4];
	                        dz=-D[5];
	                    }
	                }else{
	                    len=dz-hd;
	                    if(sz<0){
	                        sz=-hd;
	                        dx=D[6];
	                        dy=D[7];
	                        dz=D[8];
	                    }else{
	                        sz=hd;
	                        dx=-D[6];
	                        dy=-D[7];
	                        dz=-D[8];
	                }
	            }
	        }
	        cx=pbx+sx*D[0]+sy*D[3]+sz*D[6];
	        cy=pby+sx*D[1]+sy*D[4]+sz*D[7];
	        cz=pbz+sx*D[2]+sy*D[5]+sz*D[8];
	        manifold.addPoint(psx+rad*dx,psy+rad*dy,psz+rad*dz,dx,dy,dz,len-rad,this.flip);
	        }else{
	            cx=pbx+sx*D[0]+sy*D[3]+sz*D[6];
	            cy=pby+sx*D[1]+sy*D[4]+sz*D[7];
	            cz=pbz+sx*D[2]+sy*D[5]+sz*D[8];
	            dx=cx-ps.x;
	            dy=cy-ps.y;
	            dz=cz-ps.z;
	            len=dx*dx+dy*dy+dz*dz;
	            if(len>0&&len<rad*rad){
	                len=_Math.sqrt(len);
	                invLen=1/len;
	                dx*=invLen;
	                dy*=invLen;
	                dz*=invLen;
	                manifold.addPoint(psx+rad*dx,psy+rad*dy,psz+rad*dz,dx,dy,dz,len-rad,this.flip);
	            }
	        }

	    }

	});

	function SphereCylinderCollisionDetector ( flip ){
	    
	    CollisionDetector.call( this );
	    this.flip = flip;

	}

	SphereCylinderCollisionDetector.prototype = Object.assign( Object.create( CollisionDetector.prototype ), {

	    constructor: SphereCylinderCollisionDetector,

	    detectCollision: function ( shape1, shape2, manifold ) {
	        
	        var s;
	        var c;
	        if( this.flip ){
	            s = shape2;
	            c = shape1;
	        }else{
	            s = shape1;
	            c = shape2;
	        }
	        var ps = s.position;
	        var psx = ps.x;
	        var psy = ps.y;
	        var psz = ps.z;
	        var pc = c.position;
	        var pcx = pc.x;
	        var pcy = pc.y;
	        var pcz = pc.z;
	        var dirx = c.normalDirection.x;
	        var diry = c.normalDirection.y;
	        var dirz = c.normalDirection.z;
	        var rads = s.radius;
	        var radc = c.radius;
	        var rad2 = rads + radc;
	        var halfh = c.halfHeight;
	        var dx = psx - pcx;
	        var dy = psy - pcy;
	        var dz = psz - pcz;
	        var dot = dx * dirx + dy * diry + dz * dirz;
	        if ( dot < -halfh - rads || dot > halfh + rads ) return;
	        var cx = pcx + dot * dirx;
	        var cy = pcy + dot * diry;
	        var cz = pcz + dot * dirz;
	        var d2x = psx - cx;
	        var d2y = psy - cy;
	        var d2z = psz - cz;
	        var len = d2x * d2x + d2y * d2y + d2z * d2z;
	        if ( len > rad2 * rad2 ) return;
	        if ( len > radc * radc ) {
	            len = radc / _Math.sqrt( len );
	            d2x *= len;
	            d2y *= len;
	            d2z *= len;
	        }
	        if( dot < -halfh ) dot = -halfh;
	        else if( dot > halfh ) dot = halfh;
	        cx = pcx + dot * dirx + d2x;
	        cy = pcy + dot * diry + d2y;
	        cz = pcz + dot * dirz + d2z;
	        dx = cx - psx;
	        dy = cy - psy;
	        dz = cz - psz;
	        len = dx * dx + dy * dy + dz * dz;
	        var invLen;
	        if ( len > 0 && len < rads * rads ) {
	            len = _Math.sqrt(len);
	            invLen = 1 / len;
	            dx *= invLen;
	            dy *= invLen;
	            dz *= invLen;
	            ///result.addContactInfo(psx+dx*rads,psy+dy*rads,psz+dz*rads,dx,dy,dz,len-rads,s,c,0,0,false);
	            manifold.addPoint( psx + dx * rads, psy + dy * rads, psz + dz * rads, dx, dy, dz, len - rads, this.flip );
	        }

	    }


	});

	/**
	 * A collision detector which detects collisions between two spheres.
	 * @author saharan
	 */
	 
	function SphereSphereCollisionDetector (){

	    CollisionDetector.call( this );

	}

	SphereSphereCollisionDetector.prototype = Object.assign( Object.create( CollisionDetector.prototype ), {

	    constructor: SphereSphereCollisionDetector,

	    detectCollision: function ( shape1, shape2, manifold ) {

	        var s1 = shape1;
	        var s2 = shape2;
	        var p1 = s1.position;
	        var p2 = s2.position;
	        var dx = p2.x - p1.x;
	        var dy = p2.y - p1.y;
	        var dz = p2.z - p1.z;
	        var len = dx * dx + dy * dy + dz * dz;
	        var r1 = s1.radius;
	        var r2 = s2.radius;
	        var rad = r1 + r2;
	        if ( len > 0 && len < rad * rad ){
	            len = _Math.sqrt( len );
	            var invLen = 1 / len;
	            dx *= invLen;
	            dy *= invLen;
	            dz *= invLen;
	            manifold.addPoint( p1.x + dx * r1, p1.y + dy * r1, p1.z + dz * r1, dx, dy, dz, len - rad, false );
	        }

	    }

	});

	/**
	 * A collision detector which detects collisions between two spheres.
	 * @author saharan 
	 * @author lo-th
	 */
	 
	function SpherePlaneCollisionDetector ( flip ){

	    CollisionDetector.call( this );

	    this.flip = flip;

	    this.n = new Vec3();
	    this.p = new Vec3();

	}

	SpherePlaneCollisionDetector.prototype = Object.assign( Object.create( CollisionDetector.prototype ), {

	    constructor: SpherePlaneCollisionDetector,

	    detectCollision: function ( shape1, shape2, manifold ) {

	        var n = this.n;
	        var p = this.p;

	        var s = this.flip ? shape2 : shape1;
	        var pn = this.flip ? shape1 : shape2;
	        var rad = s.radius;
	        var len;

	        n.sub( s.position, pn.position );
	        //var h = _Math.dotVectors( pn.normal, n );

	        n.x *= pn.normal.x;//+ rad;
	        n.y *= pn.normal.y;
	        n.z *= pn.normal.z;//+ rad;

	        
	        var len = n.lengthSq();
	        
	        if( len > 0 && len < rad * rad){//&& h > rad*rad ){

	            
	            len = _Math.sqrt( len );
	            //len = _Math.sqrt( h );
	            n.copy(pn.normal).negate();
	            //n.scaleEqual( 1/len );

	            //(0, -1, 0)

	            //n.normalize();
	            p.copy( s.position ).addScaledVector( n, rad );
	            manifold.addPointVec( p, n, len - rad, this.flip );

	        }

	    }

	});

	/**
	 * A collision detector which detects collisions between two spheres.
	 * @author saharan 
	 * @author lo-th
	 */
	 
	function BoxPlaneCollisionDetector ( flip ){

	    CollisionDetector.call( this );

	    this.flip = flip;

	    this.n = new Vec3();
	    this.p = new Vec3();

	    this.dix = new Vec3();
	    this.diy = new Vec3();
	    this.diz = new Vec3();

	    this.cc = new Vec3();
	    this.cc2 = new Vec3();

	}

	BoxPlaneCollisionDetector.prototype = Object.assign( Object.create( CollisionDetector.prototype ), {

	    constructor: BoxPlaneCollisionDetector,

	    detectCollision: function ( shape1, shape2, manifold ) {

	        var n = this.n;
	        var p = this.p;
	        var cc = this.cc;

	        var b = this.flip ? shape2 : shape1;
	        var pn = this.flip ? shape1 : shape2;

	        var D = b.dimentions;
	        var hw = b.halfWidth;
	        var hh = b.halfHeight;
	        var hd = b.halfDepth;
	        var len;
	        var overlap = 0;

	        this.dix.set( D[0], D[1], D[2] );
	        this.diy.set( D[3], D[4], D[5] );
	        this.diz.set( D[6], D[7], D[8] );

	        n.sub( b.position, pn.position );

	        n.x *= pn.normal.x;//+ rad;
	        n.y *= pn.normal.y;
	        n.z *= pn.normal.z;//+ rad;

	        cc.set(
	            _Math.dotVectors( this.dix, n ),
	            _Math.dotVectors( this.diy, n ),
	            _Math.dotVectors( this.diz, n )
	        );


	        if( cc.x > hw ) cc.x = hw;
	        else if( cc.x < -hw ) cc.x = -hw;
	        else overlap = 1;
	        
	        if( cc.y > hh ) cc.y = hh;
	        else if( cc.y < -hh ) cc.y = -hh;
	        else overlap |= 2;
	        
	        if( cc.z > hd ) cc.z = hd;
	        else if( cc.z < -hd ) cc.z = -hd;
	        else overlap |= 4;

	        

	        if( overlap === 7 ){

	            // center of sphere is in the box
	            
	            n.set(
	                cc.x < 0 ? hw + cc.x : hw - cc.x,
	                cc.y < 0 ? hh + cc.y : hh - cc.y,
	                cc.z < 0 ? hd + cc.z : hd - cc.z
	            );
	            
	            if( n.x < n.y ){
	                if( n.x < n.z ){
	                    len = n.x - hw;
	                    if( cc.x < 0 ){
	                        cc.x = -hw;
	                        n.copy( this.dix );
	                    }else{
	                        cc.x = hw;
	                        n.subEqual( this.dix );
	                    }
	                }else{
	                    len = n.z - hd;
	                    if( cc.z < 0 ){
	                        cc.z = -hd;
	                        n.copy( this.diz );
	                    }else{
	                        cc.z = hd;
	                        n.subEqual( this.diz );
	                    }
	                }
	            }else{
	                if( n.y < n.z ){
	                    len = n.y - hh;
	                    if( cc.y < 0 ){
	                        cc.y = -hh;
	                        n.copy( this.diy );
	                    }else{
	                        cc.y = hh;
	                        n.subEqual( this.diy );
	                    }
	                }else{
	                    len = n.z - hd;
	                    if( cc.z < 0 ){
	                        cc.z = -hd;
	                        n.copy( this.diz );
	                    }else{
	                        cc.z = hd;
	                        n.subEqual( this.diz );
	                    }
	                }
	            }

	            p.copy( pn.position ).addScaledVector( n, 1 );
	            manifold.addPointVec( p, n, len, this.flip );

	        }

	    }

	});

	//import { TetraShape } from '../collision/shape/TetraShape';

	/**
	 * The class of physical computing world.
	 * You must be added to the world physical all computing objects
	 *
	 * @author saharan
	 * @author lo-th
	 */

	 // timestep, broadphase, iterations, worldscale, random, stat

	function World ( o ) {

	    if( !(o instanceof Object) ) o = {};

	    // this world scale defaut is 0.1 to 10 meters max for dynamique body
	    this.scale = o.worldscale || 1;
	    this.invScale = 1/this.scale;

	    // The time between each step
	    this.timeStep = o.timestep || 0.01666; // 1/60;
	    this.timerate = this.timeStep * 1000;
	    this.timer = null;

	    this.preLoop = null;//function(){};
	    this.postLoop = null;//function(){};

	    // The number of iterations for constraint solvers.
	    this.numIterations = o.iterations || 8;

	     // It is a wide-area collision judgment that is used in order to reduce as much as possible a detailed collision judgment.
	    switch( o.broadphase || 2 ){
	        case 1: this.broadPhase = new BruteForceBroadPhase(); break;
	        case 2: default: this.broadPhase = new SAPBroadPhase(); break;
	        case 3: this.broadPhase = new DBVTBroadPhase(); break;
	    }

	    this.Btypes = ['None','BruteForce','Sweep & Prune', 'Bounding Volume Tree' ];
	    this.broadPhaseType = this.Btypes[ o.broadphase || 2 ];

	    // This is the detailed information of the performance.
	    this.performance = null;
	    this.isStat = o.info === undefined ? false : o.info;
	    if( this.isStat ) this.performance = new InfoDisplay( this );

	    /**
	     * Whether the constraints randomizer is enabled or not.
	     *
	     * @property enableRandomizer
	     * @type {Boolean}
	     */
	    this.enableRandomizer = o.random !== undefined ? o.random : true;

	    // The rigid body list
	    this.rigidBodies=null;
	    // number of rigid body
	    this.numRigidBodies=0;
	    // The contact list
	    this.contacts=null;
	    this.unusedContacts=null;
	    // The number of contact
	    this.numContacts=0;
	    // The number of contact points
	    this.numContactPoints=0;
	    //  The joint list
	    this.joints=null;
	    // The number of joints.
	    this.numJoints=0;
	    // The number of simulation islands.
	    this.numIslands=0;


	    // The gravity in the world.
	    this.gravity = new Vec3(0,-9.8,0);
	    if( o.gravity !== undefined ) this.gravity.fromArray( o.gravity );



	    var numShapeTypes = 5;//4;//3;
	    this.detectors=[];
	    this.detectors.length = numShapeTypes;
	    var i = numShapeTypes;
	    while(i--){
	        this.detectors[i]=[];
	        this.detectors[i].length = numShapeTypes;
	    }

	    this.detectors[SHAPE_SPHERE][SHAPE_SPHERE] = new SphereSphereCollisionDetector();
	    this.detectors[SHAPE_SPHERE][SHAPE_BOX] = new SphereBoxCollisionDetector(false);
	    this.detectors[SHAPE_BOX][SHAPE_SPHERE] = new SphereBoxCollisionDetector(true);
	    this.detectors[SHAPE_BOX][SHAPE_BOX] = new BoxBoxCollisionDetector();

	    // CYLINDER add
	    this.detectors[SHAPE_CYLINDER][SHAPE_CYLINDER] = new CylinderCylinderCollisionDetector();

	    this.detectors[SHAPE_CYLINDER][SHAPE_BOX] = new BoxCylinderCollisionDetector(true);
	    this.detectors[SHAPE_BOX][SHAPE_CYLINDER] = new BoxCylinderCollisionDetector(false);

	    this.detectors[SHAPE_CYLINDER][SHAPE_SPHERE] = new SphereCylinderCollisionDetector(true);
	    this.detectors[SHAPE_SPHERE][SHAPE_CYLINDER] = new SphereCylinderCollisionDetector(false);

	    // PLANE add

	    this.detectors[SHAPE_PLANE][SHAPE_SPHERE] = new SpherePlaneCollisionDetector(true);
	    this.detectors[SHAPE_SPHERE][SHAPE_PLANE] = new SpherePlaneCollisionDetector(false);

	    this.detectors[SHAPE_PLANE][SHAPE_BOX] = new BoxPlaneCollisionDetector(true);
	    this.detectors[SHAPE_BOX][SHAPE_PLANE] = new BoxPlaneCollisionDetector(false);

	    // TETRA add
	    //this.detectors[SHAPE_TETRA][SHAPE_TETRA] = new TetraTetraCollisionDetector();


	    this.randX = 65535;
	    this.randA = 98765;
	    this.randB = 123456789;

	    this.islandRigidBodies = [];
	    this.islandStack = [];
	    this.islandConstraints = [];

	}

	Object.assign( World.prototype, {

	    World: true,

	    play: function(){
	 
	        if( this.timer !== null ) return;

	        var _this = this;
	        this.timer = setInterval( function(){ _this.step(); } , this.timerate );
	        //this.timer = setInterval( this.loop.bind(this) , this.timerate );

	    },

	    stop: function(){

	        if( this.timer === null ) return;

	        clearInterval( this.timer );
	        this.timer = null;

	    },

	    setGravity: function ( ar ) {

	        this.gravity.fromArray( ar );

	    },

	    getInfo: function () {

	        return this.isStat ? this.performance.show() : '';

	    },

	    // Reset the world and remove all rigid bodies, shapes, joints and any object from the world.
	    clear:function(){

	        this.stop();
	        this.preLoop = null;
	        this.postLoop = null;

	        this.randX = 65535;

	        while(this.joints!==null){
	            this.removeJoint( this.joints );
	        }
	        while(this.contacts!==null){
	            this.removeContact( this.contacts );
	        }
	        while(this.rigidBodies!==null){
	            this.removeRigidBody( this.rigidBodies );
	        }

	    },
	    /**
	    * I'll add a rigid body to the world.
	    * Rigid body that has been added will be the operands of each step.
	    * @param  rigidBody  Rigid body that you want to add
	    */
	    addRigidBody:function( rigidBody ){

	        if(rigidBody.parent){
	            printError("World", "It is not possible to be added to more than one world one of the rigid body");
	        }

	        rigidBody.setParent( this );
	        //rigidBody.awake();

	        for(var shape = rigidBody.shapes; shape !== null; shape = shape.next){
	            this.addShape( shape );
	        }
	        if(this.rigidBodies!==null)(this.rigidBodies.prev=rigidBody).next=this.rigidBodies;
	        this.rigidBodies = rigidBody;
	        this.numRigidBodies++;

	    },
	    /**
	    * I will remove the rigid body from the world.
	    * Rigid body that has been deleted is excluded from the calculation on a step-by-step basis.
	    * @param  rigidBody  Rigid body to be removed
	    */
	    removeRigidBody:function( rigidBody ){

	        var remove=rigidBody;
	        if(remove.parent!==this)return;
	        remove.awake();
	        var js=remove.jointLink;
	        while(js!=null){
		        var joint=js.joint;
		        js=js.next;
		        this.removeJoint(joint);
	        }
	        for(var shape=rigidBody.shapes; shape!==null; shape=shape.next){
	            this.removeShape(shape);
	        }
	        var prev=remove.prev;
	        var next=remove.next;
	        if(prev!==null) prev.next=next;
	        if(next!==null) next.prev=prev;
	        if(this.rigidBodies==remove) this.rigidBodies=next;
	        remove.prev=null;
	        remove.next=null;
	        remove.parent=null;
	        this.numRigidBodies--;

	    },

	    getByName: function( name ){

	        var body = this.rigidBodies;
	        while( body !== null ){
	            if( body.name === name ) return body;
	            body=body.next;
	        }

	        var joint = this.joints;
	        while( joint !== null ){
	            if( joint.name === name ) return joint;
	            joint = joint.next;
	        }

	        return null;

	    },

	    /**
	    * I'll add a shape to the world..
	    * Add to the rigid world, and if you add a shape to a rigid body that has been added to the world,
	    * Shape will be added to the world automatically, please do not call from outside this method.
	    * @param  shape  Shape you want to add
	    */
	    addShape:function ( shape ){

	        if(!shape.parent || !shape.parent.parent){
	            printError("World", "It is not possible to be added alone to shape world");
	        }

	        shape.proxy = this.broadPhase.createProxy(shape);
	        shape.updateProxy();
	        this.broadPhase.addProxy(shape.proxy);

	    },

	    /**
	    * I will remove the shape from the world.
	    * Add to the rigid world, and if you add a shape to a rigid body that has been added to the world,
	    * Shape will be added to the world automatically, please do not call from outside this method.
	    * @param  shape  Shape you want to delete
	    */
	    removeShape: function ( shape ){

	        this.broadPhase.removeProxy(shape.proxy);
	        shape.proxy = null;

	    },

	    /**
	    * I'll add a joint to the world.
	    * Joint that has been added will be the operands of each step.
	    * @param  shape Joint to be added
	    */
	    addJoint: function ( joint ) {

	        if(joint.parent){
	            printError("World", "It is not possible to be added to more than one world one of the joint");
	        }
	        if(this.joints!=null)(this.joints.prev=joint).next=this.joints;
	        this.joints=joint;
	        joint.setParent( this );
	        this.numJoints++;
	        joint.awake();
	        joint.attach();

	    },

	    /**
	    * I will remove the joint from the world.
	    * Joint that has been added will be the operands of each step.
	    * @param  shape Joint to be deleted
	    */
	    removeJoint: function ( joint ) {

	        var remove=joint;
	        var prev=remove.prev;
	        var next=remove.next;
	        if(prev!==null)prev.next=next;
	        if(next!==null)next.prev=prev;
	        if(this.joints==remove)this.joints=next;
	        remove.prev=null;
	        remove.next=null;
	        this.numJoints--;
	        remove.awake();
	        remove.detach();
	        remove.parent=null;

	    },

	    addContact: function ( s1, s2 ) {

	        var newContact;
	        if(this.unusedContacts!==null){
	            newContact=this.unusedContacts;
	            this.unusedContacts=this.unusedContacts.next;
	        }else{
	            newContact = new Contact();
	        }
	        newContact.attach(s1,s2);
	        newContact.detector = this.detectors[s1.type][s2.type];
	        if(this.contacts)(this.contacts.prev = newContact).next = this.contacts;
	        this.contacts = newContact;
	        this.numContacts++;

	    },

	    removeContact: function ( contact ) {

	        var prev = contact.prev;
	        var next = contact.next;
	        if(next) next.prev = prev;
	        if(prev) prev.next = next;
	        if(this.contacts == contact) this.contacts = next;
	        contact.prev = null;
	        contact.next = null;
	        contact.detach();
	        contact.next = this.unusedContacts;
	        this.unusedContacts = contact;
	        this.numContacts--;

	    },

	    getContact: function ( b1, b2 ) {

	        b1 = b1.constructor === RigidBody ? b1.name : b1;
	        b2 = b2.constructor === RigidBody ? b2.name : b2;

	        var n1, n2;
	        var contact = this.contacts;
	        while(contact!==null){
	            n1 = contact.body1.name;
	            n2 = contact.body2.name;
	            if((n1===b1 && n2===b2) || (n2===b1 && n1===b2)){ if(contact.touching) return contact; else return null;}
	            else contact = contact.next;
	        }
	        return null;

	    },

	    checkContact: function ( name1, name2 ) {

	        var n1, n2;
	        var contact = this.contacts;
	        while(contact!==null){
	            n1 = contact.body1.name || ' ';
	            n2 = contact.body2.name || ' ';
	            if((n1==name1 && n2==name2) || (n2==name1 && n1==name2)){ if(contact.touching) return true; else return false;}
	            else contact = contact.next;
	        }
	        //return false;

	    },

	    callSleep: function( body ) {

	        if( !body.allowSleep ) return false;
	        if( body.linearVelocity.lengthSq() > 0.04 ) return false;
	        if( body.angularVelocity.lengthSq() > 0.25 ) return false;
	        return true;

	    },

	    /**
	    * I will proceed only time step seconds time of World.
	    */
	    step: function () {

	        var stat = this.isStat;

	        if( stat ) this.performance.setTime( 0 );

	        var body = this.rigidBodies;

	        while( body !== null ){

	            body.addedToIsland = false;

	            if( body.sleeping ) body.testWakeUp();

	            body = body.next;

	        }



	        //------------------------------------------------------
	        //   UPDATE BROADPHASE CONTACT
	        //------------------------------------------------------

	        if( stat ) this.performance.setTime( 1 );

	        this.broadPhase.detectPairs();

	        var pairs = this.broadPhase.pairs;

	        var i = this.broadPhase.numPairs;
	        //do{
	        while(i--){
	        //for(var i=0, l=numPairs; i<l; i++){
	            var pair = pairs[i];
	            var s1;
	            var s2;
	            if(pair.shape1.id<pair.shape2.id){
	                s1 = pair.shape1;
	                s2 = pair.shape2;
	            }else{
	                s1 = pair.shape2;
	                s2 = pair.shape1;
	            }

	            var link;
	            if( s1.numContacts < s2.numContacts ) link = s1.contactLink;
	            else link = s2.contactLink;

	            var exists = false;
	            while(link){
	                var contact = link.contact;
	                if( contact.shape1 == s1 && contact.shape2 == s2 ){
	                    contact.persisting = true;
	                    exists = true;// contact already exists
	                    break;
	                }
	                link = link.next;
	            }
	            if(!exists){
	                this.addContact( s1, s2 );
	            }
	        }// while(i-- >0);

	        if( stat ) this.performance.calcBroadPhase();

	        //------------------------------------------------------
	        //   UPDATE NARROWPHASE CONTACT
	        //------------------------------------------------------

	        // update & narrow phase
	        this.numContactPoints = 0;
	        contact = this.contacts;
	        while( contact!==null ){
	            if(!contact.persisting){
	                if ( contact.shape1.aabb.intersectTest( contact.shape2.aabb ) ) {
	                /*var aabb1=contact.shape1.aabb;
	                var aabb2=contact.shape2.aabb;
	                if(
		                aabb1.minX>aabb2.maxX || aabb1.maxX<aabb2.minX ||
		                aabb1.minY>aabb2.maxY || aabb1.maxY<aabb2.minY ||
		                aabb1.minZ>aabb2.maxZ || aabb1.maxZ<aabb2.minZ
	                ){*/
	                    var next = contact.next;
	                    this.removeContact(contact);
	                    contact = next;
	                    continue;
	                }
	            }
	            var b1 = contact.body1;
	            var b2 = contact.body2;

	            if( b1.isDynamic && !b1.sleeping || b2.isDynamic && !b2.sleeping ) contact.updateManifold();

	            this.numContactPoints += contact.manifold.numPoints;
	            contact.persisting = false;
	            contact.constraint.addedToIsland = false;
	            contact = contact.next;

	        }

	        if( stat ) this.performance.calcNarrowPhase();

	        //------------------------------------------------------
	        //   SOLVE ISLANDS
	        //------------------------------------------------------

	        var invTimeStep = 1 / this.timeStep;
	        var joint;
	        var constraint;

	        for( joint = this.joints; joint !== null; joint = joint.next ){
	            joint.addedToIsland = false;
	        }


	        // clear old island array
	        this.islandRigidBodies = [];
	        this.islandConstraints = [];
	        this.islandStack = [];

	        if( stat ) this.performance.setTime( 1 );

	        this.numIslands = 0;

	        // build and solve simulation islands

	        for( var base = this.rigidBodies; base !== null; base = base.next ){

	            if( base.addedToIsland || base.isStatic || base.sleeping ) continue;// ignore

	            if( base.isLonely() ){// update single body
	                if( base.isDynamic ){
	                    base.linearVelocity.addScaledVector( this.gravity, this.timeStep );
	                    /*base.linearVelocity.x+=this.gravity.x*this.timeStep;
	                    base.linearVelocity.y+=this.gravity.y*this.timeStep;
	                    base.linearVelocity.z+=this.gravity.z*this.timeStep;*/
	                }
	                if( this.callSleep( base ) ) {
	                    base.sleepTime += this.timeStep;
	                    if( base.sleepTime > 0.5 ) base.sleep();
	                    else base.updatePosition( this.timeStep );
	                }else{
	                    base.sleepTime = 0;
	                    base.updatePosition( this.timeStep );
	                }
	                this.numIslands++;
	                continue;
	            }

	            var islandNumRigidBodies = 0;
	            var islandNumConstraints = 0;
	            var stackCount = 1;
	            // add rigid body to stack
	            this.islandStack[0] = base;
	            base.addedToIsland = true;

	            // build an island
	            do{
	                // get rigid body from stack
	                body = this.islandStack[--stackCount];
	                this.islandStack[stackCount] = null;
	                body.sleeping = false;
	                // add rigid body to the island
	                this.islandRigidBodies[islandNumRigidBodies++] = body;
	                if(body.isStatic) continue;

	                // search connections
	                for( var cs = body.contactLink; cs !== null; cs = cs.next ) {
	                    var contact = cs.contact;
	                    constraint = contact.constraint;
	                    if( constraint.addedToIsland || !contact.touching ) continue;// ignore

	                    // add constraint to the island
	                    this.islandConstraints[islandNumConstraints++] = constraint;
	                    constraint.addedToIsland = true;
	                    var next = cs.body;

	                    if(next.addedToIsland) continue;

	                    // add rigid body to stack
	                    this.islandStack[stackCount++] = next;
	                    next.addedToIsland = true;
	                }
	                for( var js = body.jointLink; js !== null; js = js.next ) {
	                    constraint = js.joint;

	                    if(constraint.addedToIsland) continue;// ignore

	                    // add constraint to the island
	                    this.islandConstraints[islandNumConstraints++] = constraint;
	                    constraint.addedToIsland = true;
	                    next = js.body;
	                    if( next.addedToIsland || !next.isDynamic ) continue;

	                    // add rigid body to stack
	                    this.islandStack[stackCount++] = next;
	                    next.addedToIsland = true;
	                }
	            } while( stackCount != 0 );

	            // update velocities
	            var gVel = new Vec3().addScaledVector( this.gravity, this.timeStep );
	            /*var gx=this.gravity.x*this.timeStep;
	            var gy=this.gravity.y*this.timeStep;
	            var gz=this.gravity.z*this.timeStep;*/
	            var j = islandNumRigidBodies;
	            while (j--){
	            //or(var j=0, l=islandNumRigidBodies; j<l; j++){
	                body = this.islandRigidBodies[j];
	                if(body.isDynamic){
	                    body.linearVelocity.addEqual(gVel);
	                    /*body.linearVelocity.x+=gx;
	                    body.linearVelocity.y+=gy;
	                    body.linearVelocity.z+=gz;*/
	                }
	            }

	            // randomizing order
	            if(this.enableRandomizer){
	                //for(var j=1, l=islandNumConstraints; j<l; j++){
	                j = islandNumConstraints;
	                while(j--){ if(j!==0){
	                        var swap = (this.randX=(this.randX*this.randA+this.randB&0x7fffffff))/2147483648.0*j|0;
	                        constraint = this.islandConstraints[j];
	                        this.islandConstraints[j] = this.islandConstraints[swap];
	                        this.islandConstraints[swap] = constraint;
	                    }
	                }
	            }

	            // solve contraints

	            j = islandNumConstraints;
	            while(j--){
	            //for(j=0, l=islandNumConstraints; j<l; j++){
	                this.islandConstraints[j].preSolve( this.timeStep, invTimeStep );// pre-solve
	            }
	            var k = this.numIterations;
	            while(k--){
	            //for(var k=0, l=this.numIterations; k<l; k++){
	                j = islandNumConstraints;
	                while(j--){
	                //for(j=0, m=islandNumConstraints; j<m; j++){
	                    this.islandConstraints[j].solve();// main-solve
	                }
	            }
	            j = islandNumConstraints;
	            while(j--){
	            //for(j=0, l=islandNumConstraints; j<l; j++){
	                this.islandConstraints[j].postSolve();// post-solve
	                this.islandConstraints[j] = null;// gc
	            }

	            // sleeping check

	            var sleepTime = 10;
	            j = islandNumRigidBodies;
	            while(j--){
	            //for(j=0, l=islandNumRigidBodies;j<l;j++){
	                body = this.islandRigidBodies[j];
	                if( this.callSleep( body ) ){
	                    body.sleepTime += this.timeStep;
	                    if( body.sleepTime < sleepTime ) sleepTime = body.sleepTime;
	                }else{
	                    body.sleepTime = 0;
	                    sleepTime = 0;
	                    continue;
	                }
	            }
	            if(sleepTime > 0.5){
	                // sleep the island
	                j = islandNumRigidBodies;
	                while(j--){
	                //for(j=0, l=islandNumRigidBodies;j<l;j++){
	                    this.islandRigidBodies[j].sleep();
	                    this.islandRigidBodies[j] = null;// gc
	                }
	            }else{
	                // update positions
	                j = islandNumRigidBodies;
	                while(j--){
	                //for(j=0, l=islandNumRigidBodies;j<l;j++){
	                    this.islandRigidBodies[j].updatePosition( this.timeStep );
	                    this.islandRigidBodies[j] = null;// gc
	                }
	            }
	            this.numIslands++;
	        }

	        //------------------------------------------------------
	        //   END SIMULATION
	        //------------------------------------------------------

	        if( stat ) this.performance.calcEnd();

	        if( this.postLoop !== null ) this.postLoop();

	    },

	    // remove someting to world

	    remove: function( obj ){

	    },

	    // add someting to world
	    
	    add: function( o ){

	        o = o || {};

	        var type = o.type || "box";
	        if( type.constructor === String ) type = [ type ];
	        var isJoint = type[0].substring( 0, 5 ) === 'joint' ? true : false;

	        if( isJoint ) return this.initJoint( type[0], o );
	        else return this.initBody( type, o );

	    },

	    initBody: function( type, o ){

	        var invScale = this.invScale;

	        // body dynamic or static
	        var move = o.move || false;
	        var kinematic = o.kinematic || false;

	        // POSITION

	        // body position
	        var p = o.pos || [0,0,0];
	        p = p.map( function(x) { return x * invScale; } );

	        // shape position
	        var p2 = o.posShape || [0,0,0];
	        p2 = p2.map( function(x) { return x * invScale; } );

	        // ROTATION

	        // body rotation in degree
	        var r = o.rot || [0,0,0];
	        r = r.map( function(x) { return x * _Math.degtorad; } );

	        // shape rotation in degree
	        var r2 = o.rotShape || [0,0,0];
	        r2 = r.map( function(x) { return x * _Math.degtorad; } );

	        // SIZE

	        // shape size
	        var s = o.size === undefined ? [1,1,1] : o.size;
	        if( s.length === 1 ){ s[1] = s[0]; }
	        if( s.length === 2 ){ s[2] = s[0]; }
	        s = s.map( function(x) { return x * invScale; } );

	        

	        // body physics settings
	        var sc = new ShapeConfig();
	        // The density of the shape.
	        if( o.density !== undefined ) sc.density = o.density;
	        // The coefficient of friction of the shape.
	        if( o.friction !== undefined ) sc.friction = o.friction;
	        // The coefficient of restitution of the shape.
	        if( o.restitution !== undefined ) sc.restitution = o.restitution;
	        // The bits of the collision groups to which the shape belongs.
	        if( o.belongsTo !== undefined ) sc.belongsTo = o.belongsTo;
	        // The bits of the collision groups with which the shape collides.
	        if( o.collidesWith !== undefined ) sc.collidesWith = o.collidesWith;

	        if(o.config !== undefined ){
	            if( o.config[0] !== undefined ) sc.density = o.config[0];
	            if( o.config[1] !== undefined ) sc.friction = o.config[1];
	            if( o.config[2] !== undefined ) sc.restitution = o.config[2];
	            if( o.config[3] !== undefined ) sc.belongsTo = o.config[3];
	            if( o.config[4] !== undefined ) sc.collidesWith = o.config[4];
	        }


	       /* if(o.massPos){
	            o.massPos = o.massPos.map(function(x) { return x * invScale; });
	            sc.relativePosition.set( o.massPos[0], o.massPos[1], o.massPos[2] );
	        }
	        if(o.massRot){
	            o.massRot = o.massRot.map(function(x) { return x * _Math.degtorad; });
	            var q = new Quat().setFromEuler( o.massRot[0], o.massRot[1], o.massRot[2] );
	            sc.relativeRotation = new Mat33().setQuat( q );//_Math.EulerToMatrix( o.massRot[0], o.massRot[1], o.massRot[2] );
	        }*/

	        var position = new Vec3( p[0], p[1], p[2] );
	        var rotation = new Quat().setFromEuler( r[0], r[1], r[2] );

	        // rigidbody
	        var body = new RigidBody( position, rotation );
	        //var body = new RigidBody( p[0], p[1], p[2], r[0], r[1], r[2], r[3], this.scale, this.invScale );

	        // SHAPES

	        var shape, n;

	        for( var i = 0; i < type.length; i++ ){

	            n = i * 3;

	            if( p2[n] !== undefined ) sc.relativePosition.set( p2[n], p2[n+1], p2[n+2] );
	            if( r2[n] !== undefined ) sc.relativeRotation.setQuat( new Quat().setFromEuler( r2[n], r2[n+1], r2[n+2] ) );
	            
	            switch( type[i] ){
	                case "sphere": shape = new Sphere( sc, s[n] ); break;
	                case "cylinder": shape = new Cylinder( sc, s[n], s[n+1] ); break;
	                case "box": shape = new Box( sc, s[n], s[n+1], s[n+2] ); break;
	                case "plane": shape = new Plane( sc ); break
	            }

	            body.addShape( shape );
	            
	        }

	        // body can sleep or not
	        if( o.neverSleep || kinematic) body.allowSleep = false;
	        else body.allowSleep = true;

	        body.isKinematic = kinematic;

	        // body static or dynamic
	        if( move ){

	            if(o.massPos || o.massRot) body.setupMass( BODY_DYNAMIC, false );
	            else body.setupMass( BODY_DYNAMIC, true );

	            // body can sleep or not
	            //if( o.neverSleep ) body.allowSleep = false;
	            //else body.allowSleep = true;

	        } else {

	            body.setupMass( BODY_STATIC );

	        }

	        if( o.name !== undefined ) body.name = o.name;
	        //else if( move ) body.name = this.numRigidBodies;

	        // finaly add to physics world
	        this.addRigidBody( body );

	        // force sleep on not
	        if( move ){
	            if( o.sleep ) body.sleep();
	            else body.awake();
	        }

	        return body;


	    },

	    initJoint: function( type, o ){

	        //var type = type;
	        var invScale = this.invScale;

	        var axe1 = o.axe1 || [1,0,0];
	        var axe2 = o.axe2 || [1,0,0];
	        var pos1 = o.pos1 || [0,0,0];
	        var pos2 = o.pos2 || [0,0,0];

	        pos1 = pos1.map(function(x){ return x * invScale; });
	        pos2 = pos2.map(function(x){ return x * invScale; });

	        var min, max;
	        if( type === "jointDistance" ){
	            min = o.min || 0;
	            max = o.max || 10;
	            min = min * invScale;
	            max = max * invScale;
	        }else{
	            min = o.min || 57.29578;
	            max = o.max || 0;
	            min = min * _Math.degtorad;
	            max = max * _Math.degtorad;
	        }

	        var limit = o.limit || null;
	        var spring = o.spring || null;
	        var motor = o.motor || null;

	        // joint setting
	        var jc = new JointConfig();
	        jc.scale = this.scale;
	        jc.invScale = this.invScale;
	        jc.allowCollision = o.collision || false;
	        jc.localAxis1.set( axe1[0], axe1[1], axe1[2] );
	        jc.localAxis2.set( axe2[0], axe2[1], axe2[2] );
	        jc.localAnchorPoint1.set( pos1[0], pos1[1], pos1[2] );
	        jc.localAnchorPoint2.set( pos2[0], pos2[1], pos2[2] );

	        var b1 = null;
	        var b2 = null;

	        if( o.body1 === undefined || o.body2 === undefined ) return printError('World', "Can't add joint if attach rigidbodys not define !" );

	        if ( o.body1.constructor === String ) { b1 = this.getByName( o.body1 ); }
	        else if ( o.body1.constructor === Number ) { b1 = this.getByName( o.body1 ); }
	        else if ( o.body1.constructor === RigidBody ) { b1 = o.body1; }

	        if ( o.body2.constructor === String ) { b2 = this.getByName( o.body2 ); }
	        else if ( o.body2.constructor === Number ) { b2 = this.getByName( o.body2 ); }
	        else if ( o.body2.constructor === RigidBody ) { b2 = o.body2; }

	        if( b1 === null || b2 === null ) return printError('World', "Can't add joint attach rigidbodys not find !" );

	        jc.body1 = b1;
	        jc.body2 = b2;

	        var joint;
	        switch( type ){
	            case "jointDistance": joint = new DistanceJoint(jc, min, max);
	                if(spring !== null) joint.limitMotor.setSpring( spring[0], spring[1] );
	                if(motor !== null) joint.limitMotor.setMotor( motor[0], motor[1] );
	            break;
	            case "jointHinge": case "joint": joint = new HingeJoint(jc, min, max);
	                if(spring !== null) joint.limitMotor.setSpring( spring[0], spring[1] );// soften the joint ex: 100, 0.2
	                if(motor !== null) joint.limitMotor.setMotor( motor[0], motor[1] );
	            break;
	            case "jointPrisme": joint = new PrismaticJoint(jc, min, max); break;
	            case "jointSlide": joint = new SliderJoint(jc, min, max); break;
	            case "jointBall": joint = new BallAndSocketJoint(jc); break;
	            case "jointWheel": joint = new WheelJoint(jc);
	                if(limit !== null) joint.rotationalLimitMotor1.setLimit( limit[0], limit[1] );
	                if(spring !== null) joint.rotationalLimitMotor1.setSpring( spring[0], spring[1] );
	                if(motor !== null) joint.rotationalLimitMotor1.setMotor( motor[0], motor[1] );
	            break;
	        }

	        joint.name = o.name || '';
	        // finaly add to physics world
	        this.addJoint( joint );

	        return joint;

	    },


	} );

	// test version

	//export { RigidBody } from './core/RigidBody_X.js';
	//export { World } from './core/World_X.js';

	exports.Math = _Math;
	exports.Vec3 = Vec3;
	exports.Quat = Quat;
	exports.Mat33 = Mat33;
	exports.Shape = Shape;
	exports.Box = Box;
	exports.Sphere = Sphere;
	exports.Cylinder = Cylinder;
	exports.Plane = Plane;
	exports.Particle = Particle;
	exports.ShapeConfig = ShapeConfig;
	exports.LimitMotor = LimitMotor;
	exports.HingeJoint = HingeJoint;
	exports.BallAndSocketJoint = BallAndSocketJoint;
	exports.DistanceJoint = DistanceJoint;
	exports.PrismaticJoint = PrismaticJoint;
	exports.SliderJoint = SliderJoint;
	exports.WheelJoint = WheelJoint;
	exports.JointConfig = JointConfig;
	exports.RigidBody = RigidBody;
	exports.World = World;
	exports.REVISION = REVISION;
	exports.BR_NULL = BR_NULL;
	exports.BR_BRUTE_FORCE = BR_BRUTE_FORCE;
	exports.BR_SWEEP_AND_PRUNE = BR_SWEEP_AND_PRUNE;
	exports.BR_BOUNDING_VOLUME_TREE = BR_BOUNDING_VOLUME_TREE;
	exports.BODY_NULL = BODY_NULL;
	exports.BODY_DYNAMIC = BODY_DYNAMIC;
	exports.BODY_STATIC = BODY_STATIC;
	exports.BODY_KINEMATIC = BODY_KINEMATIC;
	exports.BODY_GHOST = BODY_GHOST;
	exports.SHAPE_NULL = SHAPE_NULL;
	exports.SHAPE_SPHERE = SHAPE_SPHERE;
	exports.SHAPE_BOX = SHAPE_BOX;
	exports.SHAPE_CYLINDER = SHAPE_CYLINDER;
	exports.SHAPE_PLANE = SHAPE_PLANE;
	exports.SHAPE_PARTICLE = SHAPE_PARTICLE;
	exports.SHAPE_TETRA = SHAPE_TETRA;
	exports.JOINT_NULL = JOINT_NULL;
	exports.JOINT_DISTANCE = JOINT_DISTANCE;
	exports.JOINT_BALL_AND_SOCKET = JOINT_BALL_AND_SOCKET;
	exports.JOINT_HINGE = JOINT_HINGE;
	exports.JOINT_WHEEL = JOINT_WHEEL;
	exports.JOINT_SLIDER = JOINT_SLIDER;
	exports.JOINT_PRISMATIC = JOINT_PRISMATIC;
	exports.AABB_PROX = AABB_PROX;
	exports.printError = printError;
	exports.InfoDisplay = InfoDisplay;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
