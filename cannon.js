/*
 * Copyright (c) 2012 cannon.js Authors
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


(function () {


/**
 * @page About
 * cannon.js is a lightweight 3D physics engine for web applications. For more information and source code, go to the Github repository [schteppe/cannon.js](https://github.com/schteppe/cannon.js).
 */

/**
 * @library cannon.js
 * @version 0.4.3
 * @brief A lightweight 3D physics engine for the web
 */

var CANNON = CANNON || {};

// Maintain compatibility with older browsers
if(!this.Int32Array){
    this.Int32Array=Array;
    this.Float32Array=Array;
}

/**
 * @class CANNON.Mat3
 * @brief A 3x3 matrix.
 * @param array elements Array of nine elements. Optional.
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Mat3 = function(elements){
    /**
    * @property Array elements
    * @memberof CANNON.Mat3
    * @brief A vector of length 9, containing all matrix elements
    * The values in the array are stored in the following order:
    * | 0 1 2 |
    * | 3 4 5 |
    * | 6 7 8 |
    * 
    */
    if(elements){
        this.elements = elements;
    } else {
        this.elements = [0,0,0,0,0,0,0,0,0];
    }
};

/**
 * @method identity
 * @memberof CANNON.Mat3
 * @brief Sets the matrix to identity
 * @todo Should perhaps be renamed to setIdentity() to be more clear.
 * @todo Create another function that immediately creates an identity matrix eg. eye()
 */
CANNON.Mat3.prototype.identity = function(){
    this.elements[0] = 1;
    this.elements[1] = 0;
    this.elements[2] = 0;

    this.elements[3] = 0;
    this.elements[4] = 1;
    this.elements[5] = 0;

    this.elements[6] = 0;
    this.elements[7] = 0;
    this.elements[8] = 1;
};

CANNON.Mat3.prototype.setZero = function(){
    var e = this.elements;
    e[0] = 0;
    e[1] = 0;
    e[2] = 0;
    e[3] = 0;
    e[4] = 0;
    e[5] = 0;
    e[6] = 0;
    e[7] = 0;
    e[8] = 0;
};

/**
 * @method setTrace
 * @memberof CANNON.Mat3
 * @brief Sets the matrix diagonal elements from a Vec3
 */
CANNON.Mat3.prototype.setTrace = function(vec3){
    var e = this.elements;
    e[0] = vec3.x;
    e[4] = vec3.y;
    e[8] = vec3.z;
};

/**
 * @method vmult
 * @memberof CANNON.Mat3
 * @brief Matrix-Vector multiplication
 * @param CANNON.Vec3 v The vector to multiply with
 * @param CANNON.Vec3 target Optional, target to save the result in.
 */
CANNON.Mat3.prototype.vmult = function(v,target){
    target = target || new CANNON.Vec3();

    var e = this.elements,
        x = v.x,
        y = v.y,
        z = v.z;
    target.x = e[0]*x + e[1]*y + e[2]*z;
    target.y = e[3]*x + e[4]*y + e[5]*z;
    target.z = e[6]*x + e[7]*y + e[8]*z;

    return target;
};

/**
 * @method smult
 * @memberof CANNON.Mat3
 * @brief Matrix-scalar multiplication
 * @param float s
 */
CANNON.Mat3.prototype.smult = function(s){
    for(var i=0; i<this.elements.length; i++){
        this.elements[i] *= s;
    }
};

/**
 * @method mmult
 * @memberof CANNON.Mat3
 * @brief Matrix multiplication
 * @param CANNON.Mat3 m Matrix to multiply with from left side.
 * @return CANNON.Mat3 The result.
 */
CANNON.Mat3.prototype.mmult = function(m){
    var r = new CANNON.Mat3();
    for(var i=0; i<3; i++){
        for(var j=0; j<3; j++){
            var sum = 0.0;
            for(var k=0; k<3; k++){
                sum += m.elements[i+k*3] * this.elements[k+j*3];
            }
            r.elements[i+j*3] = sum;
        }
    }
    return r;
};

/**
 * @method solve
 * @memberof CANNON.Mat3
 * @brief Solve Ax=b
 * @param CANNON.Vec3 b The right hand side
 * @param CANNON.Vec3 target Optional. Target vector to save in.
 * @return CANNON.Vec3 The solution x
 * @todo should reuse arrays
 */
CANNON.Mat3.prototype.solve = function(b,target){
    target = target || new CANNON.Vec3();

    // Construct equations
    var nr = 3; // num rows
    var nc = 4; // num cols
    var eqns = [];
    for(var i=0; i<nr*nc; i++){
        eqns.push(0);
    }
    var i,j;
    for(i=0; i<3; i++){
        for(j=0; j<3; j++){
            eqns[i+nc*j] = this.elements[i+3*j];
        }
    }
    eqns[3+4*0] = b.x;
    eqns[3+4*1] = b.y;
    eqns[3+4*2] = b.z;

    // Compute right upper triangular version of the matrix - Gauss elimination
    var n = 3, k = n, np;
    var kp = 4; // num rows
    var p, els;
    do {
        i = k - n;
        if (eqns[i+nc*i] === 0) {
            // the pivot is null, swap lines
            for (j = i + 1; j < k; j++) {
                if (eqns[i+nc*j] !== 0) {
                    np = kp;
                    do {  // do ligne( i ) = ligne( i ) + ligne( k )
                        p = kp - np;
                        eqns[p+nc*i] += eqns[p+nc*j];
                    } while (--np);
                    break;
                }
            }
        }
        if (eqns[i+nc*i] !== 0) {
            for (j = i + 1; j < k; j++) {
                var multiplier = eqns[i+nc*j] / eqns[i+nc*i];
                np = kp;
                do {  // do ligne( k ) = ligne( k ) - multiplier * ligne( i )
                    p = kp - np;
                    eqns[p+nc*j] = p <= i ? 0 : eqns[p+nc*j] - eqns[p+nc*i] * multiplier ;
                } while (--np);
            }
        }
    } while (--n);

    // Get the solution
    target.z = eqns[2*nc+3] / eqns[2*nc+2];
    target.y = (eqns[1*nc+3] - eqns[1*nc+2]*target.z) / eqns[1*nc+1];
    target.x = (eqns[0*nc+3] - eqns[0*nc+2]*target.z - eqns[0*nc+1]*target.y) / eqns[0*nc+0];

    if(isNaN(target.x) || isNaN(target.y) || isNaN(target.z) || target.x===Infinity || target.y===Infinity || target.z===Infinity){
        throw "Could not solve equation! Got x=["+target.toString()+"], b=["+b.toString()+"], A=["+this.toString()+"]";
    }

    return target;
};

/**
 * @method e
 * @memberof CANNON.Mat3
 * @brief Get an element in the matrix by index. Index starts at 0, not 1!!!
 * @param int row 
 * @param int column
 * @param float value Optional. If provided, the matrix element will be set to this value.
 * @return float
 */
CANNON.Mat3.prototype.e = function( row , column ,value){
    if(value===undefined){
        return this.elements[column+3*row];
    } else {
        // Set value
        this.elements[column+3*row] = value;
    }
};

/**
 * @method copy
 * @memberof CANNON.Mat3
 * @brief Copy the matrix
 * @param CANNON.Mat3 target Optional. Target to save the copy in.
 * @return CANNON.Mat3
 */
CANNON.Mat3.prototype.copy = function(target){
    target = target || new CANNON.Mat3();
    for(var i=0; i<this.elements.length; i++){
        target.elements[i] = this.elements[i];
    }
    return target;
};

/**
 * @method toString
 * @memberof CANNON.Mat3
 * @brief Returns a string representation of the matrix.
 * @return string
 */
CANNON.Mat3.prototype.toString = function(){
    var r = "";
    var sep = ",";
    for(var i=0; i<9; i++){
        r += this.elements[i] + sep;
    }
    return r;
};

/**
 * @method reverse
 * @memberof CANNON.Mat3
 * @brief reverse the matrix
 * @param CANNON.Mat3 target Optional. Target matrix to save in.
 * @return CANNON.Mat3 The solution x
 */
CANNON.Mat3.prototype.reverse = function(target){

    target = target || new CANNON.Mat3();

    // Construct equations
    var nr = 3; // num rows
    var nc = 6; // num cols
    var eqns = [];
    for(var i=0; i<nr*nc; i++){
        eqns.push(0);
    }
    var i,j;
    for(i=0; i<3; i++){
        for(j=0; j<3; j++){
            eqns[i+nc*j] = this.elements[i+3*j];
        }
    }
    eqns[3+6*0] = 1;
    eqns[3+6*1] = 0;
    eqns[3+6*2] = 0;
    eqns[4+6*0] = 0;
    eqns[4+6*1] = 1;
    eqns[4+6*2] = 0;
    eqns[5+6*0] = 0;
    eqns[5+6*1] = 0;
    eqns[5+6*2] = 1;

    // Compute right upper triangular version of the matrix - Gauss elimination
    var n = 3, k = n, np;
    var kp = nc; // num rows
    var p;
    do {
        i = k - n;
        if (eqns[i+nc*i] === 0) {
            // the pivot is null, swap lines
            for (j = i + 1; j < k; j++) {
                if (eqns[i+nc*j] !== 0) {
                    np = kp;
                    do { // do line( i ) = line( i ) + line( k )
                        p = kp - np;
                        eqns[p+nc*i] += eqns[p+nc*j];
                    } while (--np);
                    break;
                }
            }
        }
        if (eqns[i+nc*i] !== 0) {
            for (j = i + 1; j < k; j++) {
                var multiplier = eqns[i+nc*j] / eqns[i+nc*i];
                np = kp;
                do { // do line( k ) = line( k ) - multiplier * line( i )
                    p = kp - np;
                    eqns[p+nc*j] = p <= i ? 0 : eqns[p+nc*j] - eqns[p+nc*i] * multiplier ;
                } while (--np);
            }
        }
    } while (--n);

    // eliminate the upper left triangle of the matrix
    i = 2;
    do {
        j = i-1;
        do {
            var multiplier = eqns[i+nc*j] / eqns[i+nc*i];
            np = nc;
            do {
                p = nc - np;
                eqns[p+nc*j] =  eqns[p+nc*j] - eqns[p+nc*i] * multiplier ;
            } while (--np);
        } while (j--);
    } while (--i);

    // operations on the diagonal
    i = 2;
    do {
        var multiplier = 1 / eqns[i+nc*i];
        np = nc;
        do {
            p = nc - np;
            eqns[p+nc*i] = eqns[p+nc*i] * multiplier ;
        } while (--np);
    } while (i--);

    i = 2;
    do {
        j = 2;
        do {
            p = eqns[nr+j+nc*i];
            if( isNaN( p ) || p ===Infinity ){
                throw "Could not reverse! A=["+this.toString()+"]";
            }
            target.e( i , j , p );
        } while (j--);
    } while (i--);

    return target;
};

/**
 * @class CANNON.Vec3
 * @brief 3-dimensional vector
 * @param float x
 * @param float y
 * @param float z
 * @author schteppe
 */
var numVecs = 0;
CANNON.Vec3 = function(x,y,z){
    /**
    * @property float x
    * @memberof CANNON.Vec3
    */
    this.x = x||0.0;
    /**
    * @property float y
    * @memberof CANNON.Vec3
    */
    this.y = y||0.0;
    /**
    * @property float z
    * @memberof CANNON.Vec3
    */
    this.z = z||0.0;

    /*
    numVecs++;
    if(numVecs > 180)
        console.log(numVecs+" created");
     */
};

/**
 * @method cross
 * @memberof CANNON.Vec3
 * @brief Vector cross product
 * @param CANNON.Vec3 v
 * @param CANNON.Vec3 target Optional. Target to save in.
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.cross = function(v,target){
    var vx=v.x, vy=v.y, vz=v.z, x=this.x, y=this.y, z=this.z;
    target = target || new CANNON.Vec3();

    target.x = (y * vz) - (z * vy);
    target.y = (z * vx) - (x * vz);
    target.z = (x * vy) - (y * vx);

    return target;
};

/**
 * @method set
 * @memberof CANNON.Vec3
 * @brief Set the vectors' 3 elements
 * @param float x
 * @param float y
 * @param float z
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.set = function(x,y,z){
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
};

/**
 * @method vadd
 * @memberof CANNON.Vec3
 * @brief Vector addition
 * @param CANNON.Vec3 v
 * @param CANNON.Vec3 target Optional.
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.vadd = function(v,target){
    if(target){
        target.x = v.x + this.x;
        target.y = v.y + this.y;
        target.z = v.z + this.z;
    } else {
        return new CANNON.Vec3(this.x + v.x,
                               this.y + v.y,
                               this.z + v.z);
    }
};

/**
 * @method vsub
 * @memberof CANNON.Vec3
 * @brief Vector subtraction
 * @param CANNON.Vec3 v
 * @param CANNON.Vec3 target Optional. Target to save in.
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.vsub = function(v,target){
    if(target){
        target.x = this.x - v.x;
        target.y = this.y - v.y;
        target.z = this.z - v.z;
    } else {
        return new CANNON.Vec3(this.x-v.x,
                               this.y-v.y,
                               this.z-v.z);
    }
};

/**
 * @method crossmat
 * @memberof CANNON.Vec3
 * @brief Get the cross product matrix a_cross from a vector, such that a x b = a_cross * b = c
 * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
 * @return CANNON.Mat3
 */
CANNON.Vec3.prototype.crossmat = function(){
    return new CANNON.Mat3([     0,  -this.z,   this.y,
                            this.z,        0,  -this.x,
                           -this.y,   this.x,        0]);
};

/**
 * @method normalize
 * @memberof CANNON.Vec3
 * @brief Normalize the vector. Note that this changes the values in the vector.
 * @return float Returns the norm of the vector
 */
CANNON.Vec3.prototype.normalize = function(){
    var x=this.x, y=this.y, z=this.z;
    var n = Math.sqrt(x*x + y*y + z*z);
    if(n>0.0){
        var invN = 1/n;
        this.x *= invN;
        this.y *= invN;
        this.z *= invN;
    } else {
        // Make something up
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }
    return n;
};

/**
 * @method unit
 * @memberof CANNON.Vec3
 * @brief Get the version of this vector that is of length 1.
 * @param CANNON.Vec3 target Optional target to save in
 * @return CANNON.Vec3 Returns the unit vector
 */
CANNON.Vec3.prototype.unit = function(target){
    target = target || new CANNON.Vec3();
    var x=this.x, y=this.y, z=this.z;
    var ninv = Math.sqrt(x*x + y*y + z*z);
    if(ninv>0.0){
        ninv = 1.0/ninv;
        target.x = x * ninv;
        target.y = y * ninv;
        target.z = z * ninv;
    } else {
        target.x = 1;
        target.y = 0;
        target.z = 0;
    }
    return target;
};

/**
 * @method norm
 * @memberof CANNON.Vec3
 * @brief Get the 2-norm (length) of the vector
 * @return float
 */
CANNON.Vec3.prototype.norm = function(){
    var x=this.x, y=this.y, z=this.z;
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * @method norm2
 * @memberof CANNON.Vec3
 * @brief Get the squared length of the vector
 * @return float
 */
CANNON.Vec3.prototype.norm2 = function(){
    return this.dot(this);
};

CANNON.Vec3.prototype.distanceTo = function(p){
    var x=this.x, y=this.y, z=this.z;
    var px=p.x, py=p.y, pz=p.z;
    return Math.sqrt((px-x)*(px-x)+
                     (py-y)*(py-y)+
                     (pz-z)*(pz-z));
};

/**
 * @method mult
 * @memberof CANNON.Vec3
 * @brief Multiply the vector with a scalar
 * @param float scalar
 * @param CANNON.Vec3 target
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.mult = function(scalar,target){
    target = target || new CANNON.Vec3();
    var x = this.x,
        y = this.y,
        z = this.z;
    target.x = scalar * x;
    target.y = scalar * y;
    target.z = scalar * z;
    return target;
};

/**
 * @method dot
 * @memberof CANNON.Vec3
 * @brief Calculate dot product
 * @param CANNON.Vec3 v
 * @return float
 */
CANNON.Vec3.prototype.dot = function(v){
    return this.x * v.x + this.y * v.y + this.z * v.z;
};

/**
 * @method isZero
 * @memberof CANNON.Vec3
 * @return bool
 */
CANNON.Vec3.prototype.isZero = function(){
    return this.x===0 && this.y===0 && this.z===0;
};

/**
 * @method negate
 * @memberof CANNON.Vec3
 * @brief Make the vector point in the opposite direction.
 * @param CANNON.Vec3 target Optional target to save in
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.negate = function(target){
    target = target || new CANNON.Vec3();
    target.x = -this.x;
    target.y = -this.y;
    target.z = -this.z;
    return target;
};

/**
 * @method tangents
 * @memberof CANNON.Vec3
 * @brief Compute two artificial tangents to the vector
 * @param CANNON.Vec3 t1 Vector object to save the first tangent in
 * @param CANNON.Vec3 t2 Vector object to save the second tangent in
 */
var Vec3_tangents_n = new CANNON.Vec3();
var Vec3_tangents_randVec = new CANNON.Vec3();
CANNON.Vec3.prototype.tangents = function(t1,t2){
    var norm = this.norm();
    if(norm>0.0){
        var n = Vec3_tangents_n;
        var inorm = 1/norm;
        n.set(this.x*inorm,this.y*inorm,this.z*inorm);
        var randVec = Vec3_tangents_randVec;
        if(Math.abs(n.x) < 0.9){
            randVec.set(1,0,0);
            n.cross(randVec,t1);
        } else {
            randVec.set(0,1,0);
            n.cross(randVec,t1);
        }
        n.cross(t1,t2);
    } else {
        // The normal length is zero, make something up
        t1.set(1,0,0).normalize();
        t2.set(0,1,0).normalize();
    }
};

/**
 * @method toString
 * @memberof CANNON.Vec3
 * @brief Converts to a more readable format
 * @return string
 */
CANNON.Vec3.prototype.toString = function(){
    return this.x+","+this.y+","+this.z;
};

/**
 * @method copy
 * @memberof CANNON.Vec3
 * @brief Copy the vector.
 * @param CANNON.Vec3 target
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.copy = function(target){
    target = target || new CANNON.Vec3();
    target.x = this.x;
    target.y = this.y;
    target.z = this.z;
    return target;
};


/**
 * @method lerp
 * @memberof CANNON.Vec3
 * @brief Do a linear interpolation between two vectors
 * @param CANNON.Vec3 v
 * @param float t A number between 0 and 1. 0 will make this function return u, and 1 will make it return v. Numbers in between will generate a vector in between them.
 * @param CANNON.Vec3 target
 */
CANNON.Vec3.prototype.lerp = function(v,t,target){
    var x=this.x, y=this.y, z=this.z;
    target.x = x + (v.x-x)*t;
    target.y = y + (v.y-y)*t;
    target.z = z + (v.z-z)*t;
};

/**
 * @method almostEquals
 * @memberof CANNON.Vec3
 * @brief Check if a vector equals is almost equal to another one.
 * @param CANNON.Vec3 v
 * @param float precision
 * @return bool
 */
CANNON.Vec3.prototype.almostEquals = function(v,precision){
    if(precision===undefined){
        precision = 1e-6;
    }
    if( Math.abs(this.x-v.x)>precision ||
        Math.abs(this.y-v.y)>precision ||
        Math.abs(this.z-v.z)>precision){
        return false;
    }
    return true;
};

/**
 * @method almostZero
 * @brief Check if a vector is almost zero
 * @param float precision
 * @memberof CANNON.Vec3
 */
CANNON.Vec3.prototype.almostZero = function(precision){
    if(precision===undefined){
        precision = 1e-6;
    }
    if( Math.abs(this.x)>precision ||
        Math.abs(this.y)>precision ||
        Math.abs(this.z)>precision){
        return false;
    }
    return true;
};


/**
 * @class CANNON.Quaternion
 * @brief A Quaternion describes a rotation in 3D space.
 * @description The Quaternion is mathematically defined as Q = x*i + y*j + z*k + w, where (i,j,k) are imaginary basis vectors. (x,y,z) can be seen as a vector related to the axis of rotation, while the real multiplier, w, is related to the amount of rotation.
 * @param float x Multiplier of the imaginary basis vector i.
 * @param float y Multiplier of the imaginary basis vector j.
 * @param float z Multiplier of the imaginary basis vector k.
 * @param float w Multiplier of the real part.
 * @see http://en.wikipedia.org/wiki/Quaternion
 */
CANNON.Quaternion = function(x,y,z,w){
    /**
    * @property float x
    * @memberof CANNON.Quaternion
    */
    this.x = x!==undefined ? x : 0;
    /**
    * @property float y
    * @memberof CANNON.Quaternion
    */
    this.y = y!==undefined ? y : 0;
    /**
    * @property float z
    * @memberof CANNON.Quaternion
    */
    this.z = z!==undefined ? z : 0;
    /**
    * @property float w
    * @memberof CANNON.Quaternion
    * @brief The multiplier of the real quaternion basis vector.
    */
    this.w = w!==undefined ? w : 1;
};

/**
 * @method set
 * @memberof CANNON.Quaternion
 * @brief Set the value of the quaternion.
 * @param float x
 * @param float y
 * @param float z
 * @param float w
 */
CANNON.Quaternion.prototype.set = function(x,y,z,w){
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
};

/**
 * @method toString
 * @memberof CANNON.Quaternion
 * @brief Convert to a readable format
 * @return string
 */
CANNON.Quaternion.prototype.toString = function(){
    return this.x+","+this.y+","+this.z+","+this.w;
};

/**
 * @method setFromAxisAngle
 * @memberof CANNON.Quaternion
 * @brief Set the quaternion components given an axis and an angle.
 * @param CANNON.Vec3 axis
 * @param float angle in radians
 */
CANNON.Quaternion.prototype.setFromAxisAngle = function(axis,angle){
    var s = Math.sin(angle*0.5);
    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(angle*0.5);
};

// saves axis to targetAxis and returns 
CANNON.Quaternion.prototype.toAxisAngle = function(targetAxis){
    targetAxis = targetAxis || new CANNON.Vec3();
    this.normalize(); // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
    var angle = 2 * Math.acos(this.w);
    var s = Math.sqrt(1-this.w*this.w); // assuming quaternion normalised then w is less than 1, so term always positive.
    if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
        // if s close to zero then direction of axis not important
        targetAxis.x = this.x; // if it is important that axis is normalised then replace with x=1; y=z=0;
        targetAxis.y = this.y;
        targetAxis.z = this.z;
    } else {
        targetAxis.x = this.x / s; // normalise axis
        targetAxis.y = this.y / s;
        targetAxis.z = this.z / s;
    }
    return [targetAxis,angle];
};

/**
 * @method setFromVectors
 * @memberof CANNON.Quaternion
 * @brief Set the quaternion value given two vectors. The resulting rotation will be the needed rotation to rotate u to v.
 * @param CANNON.Vec3 u
 * @param CANNON.Vec3 v
 */
CANNON.Quaternion.prototype.setFromVectors = function(u,v){
    var a = u.cross(v);
    this.x = a.x;
    this.y = a.y;
    this.z = a.z;
    this.w = Math.sqrt(Math.pow(u.norm(),2) * Math.pow(v.norm(),2)) + u.dot(v);
    this.normalize();
};

/**
 * @method mult
 * @memberof CANNON.Quaternion
 * @brief Quaternion multiplication
 * @param CANNON.Quaternion q
 * @param CANNON.Quaternion target Optional.
 * @return CANNON.Quaternion
 */
var Quaternion_mult_va = new CANNON.Vec3();
var Quaternion_mult_vb = new CANNON.Vec3();
var Quaternion_mult_vaxvb = new CANNON.Vec3();
CANNON.Quaternion.prototype.mult = function(q,target){
    target = target || new CANNON.Quaternion();
    var w = this.w,
        va = Quaternion_mult_va,
        vb = Quaternion_mult_vb,
        vaxvb = Quaternion_mult_vaxvb;

    va.set(this.x,this.y,this.z);
    vb.set(q.x,q.y,q.z);
    target.w = w*q.w - va.dot(vb);
    va.cross(vb,vaxvb);

    target.x = w * vb.x + q.w*va.x + vaxvb.x;
    target.y = w * vb.y + q.w*va.y + vaxvb.y;
    target.z = w * vb.z + q.w*va.z + vaxvb.z;

    return target;
};

/**
 * @method inverse
 * @memberof CANNON.Quaternion
 * @brief Get the inverse quaternion rotation.
 * @param CANNON.Quaternion target
 * @return CANNON.Quaternion
 */
CANNON.Quaternion.prototype.inverse = function(target){
    var x = this.x, y = this.y, z = this.z, w = this.w;
    target = target || new CANNON.Quaternion();

    this.conjugate(target);
    var inorm2 = 1/(x*x + y*y + z*z + w*w);
    target.x *= inorm2;
    target.y *= inorm2;
    target.z *= inorm2;
    target.w *= inorm2;

    return target;
};

/**
 * @method conjugate
 * @memberof CANNON.Quaternion
 * @brief Get the quaternion conjugate
 * @param CANNON.Quaternion target
 * @return CANNON.Quaternion
 */
CANNON.Quaternion.prototype.conjugate = function(target){
    target = target || new CANNON.Quaternion();

    target.x = -this.x;
    target.y = -this.y;
    target.z = -this.z;
    target.w = this.w;

    return target;
};

/**
 * @method normalize
 * @memberof CANNON.Quaternion
 * @brief Normalize the quaternion. Note that this changes the values of the quaternion.
 */
CANNON.Quaternion.prototype.normalize = function(){
    var l = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w);
    if ( l === 0 ) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 0;
    } else {
        l = 1 / l;
        this.x *= l;
        this.y *= l;
        this.z *= l;
        this.w *= l;
    }
};

/**
 * @method normalizeFast
 * @memberof CANNON.Quaternion
 * @brief Approximation of quaternion normalization. Works best when quat is already almost-normalized.
 * @see http://jsperf.com/fast-quaternion-normalization
 * @author unphased, https://github.com/unphased
 */
CANNON.Quaternion.prototype.normalizeFast = function () {
    var f = (3.0-(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w))/2.0;
    if ( f === 0 ) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 0;
    } else {
        this.x *= f;
        this.y *= f;
        this.z *= f;
        this.w *= f;
    }
};

/**
 * @method vmult
 * @memberof CANNON.Quaternion
 * @brief Multiply the quaternion by a vector
 * @param CANNON.Vec3 v
 * @param CANNON.Vec3 target Optional
 * @return CANNON.Vec3
 */
CANNON.Quaternion.prototype.vmult = function(v,target){
    target = target || new CANNON.Vec3();
    if(this.w===0.0){
        target.x = v.x;
        target.y = v.y;
        target.z = v.z;
    } else {

        var x = v.x,
            y = v.y,
            z = v.z;

        var qx = this.x,
            qy = this.y,
            qz = this.z,
            qw = this.w;

        // q*v
        var ix =  qw * x + qy * z - qz * y,
        iy =  qw * y + qz * x - qx * z,
        iz =  qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

        target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    }

    return target;
};

/**
 * @method copy
 * @memberof CANNON.Quaternion
 * @param CANNON.Quaternion target
 */
CANNON.Quaternion.prototype.copy = function(target){
    target.x = this.x;
    target.y = this.y;
    target.z = this.z;
    target.w = this.w;
};

/**
 * @method toEuler
 * @memberof CANNON.Quaternion
 * @brief Convert the quaternion to euler angle representation. Order: YZX, as this page describes: http://www.euclideanspace.com/maths/standards/index.htm
 * @param CANNON.Vec3 target
 * @param string order Three-character string e.g. "YZX", which also is default.
 */
CANNON.Quaternion.prototype.toEuler = function(target,order){
    order = order || "YZX";

    var heading, attitude, bank;
    var x = this.x, y = this.y, z = this.z, w = this.w;

    switch(order){
    case "YZX":
        var test = x*y + z*w;
        if (test > 0.499) { // singularity at north pole
            heading = 2 * Math.atan2(x,w);
            attitude = Math.PI/2;
            bank = 0;
        }
        if (test < -0.499) { // singularity at south pole
            heading = -2 * Math.atan2(x,w);
            attitude = - Math.PI/2;
            bank = 0;
        }
        if(isNaN(heading)){
            var sqx = x*x;
            var sqy = y*y;
            var sqz = z*z;
            heading = Math.atan2(2*y*w - 2*x*z , 1 - 2*sqy - 2*sqz); // Heading
            attitude = Math.asin(2*test); // attitude
            bank = Math.atan2(2*x*w - 2*y*z , 1 - 2*sqx - 2*sqz); // bank
        }
        break;
    default:
        throw new Error("Euler order "+order+" not supported yet.");
    }

    target.y = heading;
    target.z = attitude;
    target.x = bank;
};

/**
 * @class CANNON.EventTarget
 * @see https://github.com/mrdoob/eventtarget.js/
 */
CANNON.EventTarget = function () {
    var listeners = {};
    this.addEventListener = function ( type, listener ) {
        if ( listeners[ type ] === undefined ) {
            listeners[ type ] = [];
        }
        if ( listeners[ type ].indexOf( listener ) === - 1 ) {
            listeners[ type ].push( listener );
        }
    };
    this.dispatchEvent = function ( event ) {
        for ( var listener in listeners[ event.type ] ) {
            listeners[ event.type ][ listener ]( event );
        }
    };
    this.removeEventListener = function ( type, listener ) {
        var index = listeners[ type ].indexOf( listener );
        if ( index !== - 1 ) {
            listeners[ type ].splice( index, 1 );
        }
    };
};

/**
 * @class CANNON.ObjectPool
 * @brief For pooling objects that can be reused.
 */
CANNON.ObjectPool = function(){
    this.objects = [];
    this.type = Object;
};

CANNON.ObjectPool.prototype.release = function(){
    var Nargs = arguments.length;
    for(var i=0; i!==Nargs; i++){
        this.objects.push(arguments[i]);
    }
};

CANNON.ObjectPool.prototype.get = function(){
    if(this.objects.length===0){
        return this.constructObject();
    } else {
        return this.objects.pop();
    }
};

CANNON.ObjectPool.prototype.constructObject = function(){
    throw new Error("constructObject() not implemented in this ObjectPool subclass yet!");
};

/**
 * @class CANNON.Vec3Pool
 */
CANNON.Vec3Pool = function(){
    CANNON.ObjectPool.call(this);
    this.type = CANNON.Vec3;
};
CANNON.Vec3Pool.prototype = new CANNON.ObjectPool();

CANNON.Vec3Pool.prototype.constructObject = function(){
    return new CANNON.Vec3();
};

/**
 * @class CANNON.Shape
 * @author schteppe
 * @brief Base class for shapes
 * @todo Should have a mechanism for caching bounding sphere radius instead of calculating it each time
 */
CANNON.Shape = function(){

    /**
     * @property int type
     * @memberof CANNON.Shape
     * @brief The type of this shape. Must be set to an int > 0 by subclasses.
     * @see CANNON.Shape.types
     */
    this.type = 0;

    this.aabbmin = new CANNON.Vec3();
    this.aabbmax = new CANNON.Vec3();

    this.boundingSphereRadius = 0;
    this.boundingSphereRadiusNeedsUpdate = true;
};
CANNON.Shape.prototype.constructor = CANNON.Shape;

/**
 * @method computeBoundingSphereRadius
 * @memberof CANNON.Shape
 * @brief Computes the bounding sphere radius. The result is stored in the property .boundingSphereRadius
 * @return float
 */
CANNON.Shape.prototype.computeBoundingSphereRadius = function(){
    throw "computeBoundingSphereRadius() not implemented for shape type "+this.type;
};

/**
 * @method getBoundingSphereRadius
 * @memberof CANNON.Shape
 * @brief Returns the bounding sphere radius. The result is stored in the property .boundingSphereRadius
 * @return float
 */
CANNON.Shape.prototype.getBoundingSphereRadius = function(){
	if (this.boundingSphereRadiusNeedsUpdate) {
		this.computeBoundingSphereRadius();
	}
	return this.boundingSphereRadius;
};

/**
 * @method volume
 * @memberof CANNON.Shape
 * @brief Get the volume of this shape
 * @return float
 */
CANNON.Shape.prototype.volume = function(){
    throw "volume() not implemented for shape type "+this.type;
};

/**
 * @method calculateLocalInertia
 * @memberof CANNON.Shape
 * @brief Calculates the inertia in the local frame for this shape.
 * @return CANNON.Vec3
 * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
 */
CANNON.Shape.prototype.calculateLocalInertia = function(mass,target){
    throw "calculateLocalInertia() not implemented for shape type "+this.type;
};

/**
 * @method calculateTransformedInertia
 * @memberof CANNON.Shape
 * @brief Calculates inertia in a specified frame for this shape.
 * @return CANNON.Vec3
 */
var Shape_calculateTransformedInertia_localInertia = new CANNON.Vec3();
var Shape_calculateTransformedInertia_worldInertia = new CANNON.Vec3();
CANNON.Shape.prototype.calculateTransformedInertia = function(mass,quat,target){
    target = target || new CANNON.Vec3();

    // Compute inertia in the world frame
    //quat.normalize();
    var localInertia = Shape_calculateTransformedInertia_localInertia;
    var worldInertia = Shape_calculateTransformedInertia_worldInertia;
    this.calculateLocalInertia(mass,localInertia);

    // @todo Is this rotation OK? Check!
    quat.vmult(localInertia,worldInertia);
    target.x = Math.abs(worldInertia.x);
    target.y = Math.abs(worldInertia.y);
    target.z = Math.abs(worldInertia.z);
    return target;
};

// Calculates the local aabb and sets the result to .aabbmax and .aabbmin
CANNON.Shape.calculateLocalAABB = function(){
    throw new Error(".calculateLocalAABB is not implemented for this Shape yet!");
};

/**
 * @property Object types
 * @memberof CANNON.Shape
 * @brief The available shape types.
 */
CANNON.Shape.types = {
    SPHERE:1,
    PLANE:2,
    BOX:4,
    COMPOUND:8,
    CONVEXPOLYHEDRON:16
};



/**
 * @class CANNON.Body
 * @brief Base class for all body types.
 * @param string type
 * @extends CANNON.EventTarget
 * @event collide The body object dispatches a "collide" event whenever it collides with another body. Event parameters are "with" (the body it collides with) and "contact" (the contact equation that is generated).
 */
CANNON.Body = function(type){

    CANNON.EventTarget.apply(this);

    this.type = type;

    /**
    * @property CANNON.World world
    * @memberof CANNON.Body
    * @brief Reference to the world the body is living in
    */
    this.world = null;

    /**
    * @property function preStep
    * @memberof CANNON.Body
    * @brief Callback function that is used BEFORE stepping the system. Use it to apply forces, for example. Inside the function, "this" will refer to this CANNON.Body object.
    * @todo dispatch an event from the World instead
    */
    this.preStep = null;

    /**
    * @property function postStep
    * @memberof CANNON.Body
    * @brief Callback function that is used AFTER stepping the system. Inside the function, "this" will refer to this CANNON.Body object.
    * @todo dispatch an event from the World instead
    */
    this.postStep = null;

    this.vlambda = new CANNON.Vec3();

    this.collisionFilterGroup = 1;
    this.collisionFilterMask = 1;
};

/*
 * @brief A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
 */
CANNON.Body.DYNAMIC = 1;

/*
 * @brief A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
 */
CANNON.Body.STATIC = 2;

/*
 * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
 */
CANNON.Body.KINEMATIC = 4;

/**
 * @class CANNON.Particle
 * @brief A body consisting of one point mass. Does not have orientation.
 * @param float mass
 * @param CANNON.Material material
 */
CANNON.Particle = function(mass,material){

    // Check input
    if(typeof(mass)!=="number"){
        throw new Error("Argument 1 (mass) must be a number.");
    }
    if(typeof(material)!=="undefined" && !(material instanceof(CANNON.Material))){
        throw new Error("Argument 3 (material) must be an instance of CANNON.Material.");
    }

    CANNON.Body.call(this,"particle");

    /**
    * @property CANNON.Vec3 position
    * @memberof CANNON.Particle
    */
    this.position = new CANNON.Vec3();

    /**
    * @property CANNON.Vec3 initPosition
    * @memberof CANNON.Particle
    * @brief Initial position of the body
    */
    this.initPosition = new CANNON.Vec3();

    /**
    * @property CANNON.Vec3 velocity
    * @memberof CANNON.Particle
    */
    this.velocity = new CANNON.Vec3();

    /**
    * @property CANNON.Vec3 initVelocity
    * @memberof CANNON.Particle
    */
    this.initVelocity = new CANNON.Vec3();

    /**
    * @property CANNON.Vec3 force
    * @memberof CANNON.Particle
    * @brief Linear force on the body
    */
    this.force = new CANNON.Vec3();

    /**
    * @property float mass
    * @memberof CANNON.Particle
    */
    this.mass = mass;

    /**
    * @property float invMass
    * @memberof CANNON.Particle
    */
    this.invMass = mass>0 ? 1.0/mass : 0;

    /**
    * @property CANNON.Material material
    * @memberof CANNON.Particle
    */
    this.material = material;

    /**
    * @property float linearDamping
    * @memberof CANNON.Particle
    */
    this.linearDamping = 0.01; // Perhaps default should be zero here?

    /**
    * @property int motionstate
    * @memberof CANNON.Particle
    * @brief One of the states CANNON.Body.DYNAMIC, CANNON.Body.STATIC and CANNON.Body.KINEMATIC
    */
    this.motionstate = (mass <= 0.0 ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC);

    /**
    * @property bool allowSleep
    * @memberof CANNON.Particle
    * @brief If true, the body will automatically fall to sleep.
    */
    this.allowSleep = true;

    // 0:awake, 1:sleepy, 2:sleeping
    this.sleepState = 0;

    /**
    * @property float sleepSpeedLimit
    * @memberof CANNON.Particle
    * @brief If the speed (the norm of the velocity) is smaller than this value, the body is considered sleepy.
    */
    this.sleepSpeedLimit = 0.1;

    /**
    * @property float sleepTimeLimit
    * @memberof CANNON.Particle
    * @brief If the body has been sleepy for this sleepTimeLimit seconds, it is considered sleeping.
    */
    this.sleepTimeLimit = 1;

    this.timeLastSleepy = 0;

};

CANNON.Particle.prototype = new CANNON.Body();
CANNON.Particle.prototype.constructor = CANNON.Particle;

/**
* @method isAwake
* @memberof CANNON.Particle
* @return bool
*/
CANNON.Particle.prototype.isAwake = function(){
    return this.sleepState === 0;
};

/**
* @method isSleepy
* @memberof CANNON.Particle
* @return bool
*/
CANNON.Particle.prototype.isSleepy = function(){
    return this.sleepState === 1;
};

/**
* @method isSleeping
* @memberof CANNON.Particle
* @return bool
*/
CANNON.Particle.prototype.isSleeping = function(){
    return this.sleepState === 2;
};

/**
* @method wakeUp
* @memberof CANNON.Particle
* @brief Wake the body up.
*/
CANNON.Particle.prototype.wakeUp = function(){
    var s = this.sleepState;
    this.sleepState = 0;
    if(s === 2){
        this.dispatchEvent({type:"wakeup"});
    }
};

/**
* @method sleep
* @memberof CANNON.Particle
* @brief Force body sleep
*/
CANNON.Particle.prototype.sleep = function(){
    this.sleepState = 2;
};

/**
* @method sleepTick
* @memberof CANNON.Particle
* @param float time The world time in seconds
* @brief Called every timestep to update internal sleep timer and change sleep state if needed.
*/
CANNON.Particle.prototype.sleepTick = function(time){
    if(this.allowSleep){
        var sleepState = this.sleepState;
        var speedSquared = this.velocity.norm2();
        var speedLimitSquared = Math.pow(this.sleepSpeedLimit,2);
        if(sleepState===0 && speedSquared < speedLimitSquared){
            this.sleepState = 1; // Sleepy
            this.timeLastSleepy = time;
            this.dispatchEvent({type:"sleepy"});
        } else if(sleepState===1 && speedSquared > speedLimitSquared){
            this.wakeUp(); // Wake up
        } else if(sleepState===1 && (time - this.timeLastSleepy ) > this.sleepTimeLimit){
            this.sleepState = 2; // Sleeping
            this.dispatchEvent({type:"sleep"});
        }
    }
};


/**
 * @class CANNON.RigidBody
 * @brief Rigid body base class
 * @param float mass
 * @param CANNON.Shape shape
 * @param CANNON.Material material
 */
CANNON.RigidBody = function(mass,shape,material){

    // Check input
    if(typeof(mass)!=="number"){
        throw new Error("Argument 1 (mass) must be a number.");
    }
    if(typeof(material)!=="undefined" && !(material instanceof(CANNON.Material))){
        throw new Error("Argument 3 (material) must be an instance of CANNON.Material.");
    }

    CANNON.Particle.call(this,mass,material);

    var that = this;

    /**
     * @property CANNON.Vec3 tau
     * @memberof CANNON.RigidBody
     * @brief Rotational force on the body, around center of mass
     */
    this.tau = new CANNON.Vec3();

    /**
     * @property CANNON.Quaternion quaternion
     * @memberof CANNON.RigidBody
     * @brief Orientation of the body
     */
    this.quaternion = new CANNON.Quaternion();

    /**
     * @property CANNON.Quaternion initQuaternion
     * @memberof CANNON.RigidBody
     */
    this.initQuaternion = new CANNON.Quaternion();

    /**
     * @property CANNON.Vec3 angularVelocity
     * @memberof CANNON.RigidBody
     */
    this.angularVelocity = new CANNON.Vec3();

    /**
     * @property CANNON.Vec3 initAngularVelocity
     * @memberof CANNON.RigidBody
     */
    this.initAngularVelocity = new CANNON.Vec3();

    /**
     * @property CANNON.Shape shape
     * @memberof CANNON.RigidBody
     */
    this.shape = shape;

    /**
     * @property CANNON.Vec3 inertia
     * @memberof CANNON.RigidBody
     */
    this.inertia = new CANNON.Vec3();
    shape.calculateLocalInertia(mass,this.inertia);

    this.inertiaWorld = new CANNON.Vec3();
    this.inertia.copy(this.inertiaWorld);
    this.inertiaWorldAutoUpdate = false;

    /**
     * @property CANNON.Vec3 intInertia
     * @memberof CANNON.RigidBody
     */
    this.invInertia = new CANNON.Vec3(this.inertia.x>0 ? 1.0/this.inertia.x : 0,
                                      this.inertia.y>0 ? 1.0/this.inertia.y : 0,
                                      this.inertia.z>0 ? 1.0/this.inertia.z : 0);
    this.invInertiaWorld = new CANNON.Vec3();
    this.invInertia.copy(this.invInertiaWorld);
    this.invInertiaWorldAutoUpdate = false;

    /**
     * @property float angularDamping
     * @memberof CANNON.RigidBody
     */
    this.angularDamping = 0.01; // Perhaps default should be zero here?

    /**
     * @property CANNON.Vec3 aabbmin
     * @memberof CANNON.RigidBody
     */
    this.aabbmin = new CANNON.Vec3();

    /**
     * @property CANNON.Vec3 aabbmax
     * @memberof CANNON.RigidBody
     */
    this.aabbmax = new CANNON.Vec3();

    /**
     * @property bool aabbNeedsUpdate
     * @memberof CANNON.RigidBody
     * @brief Indicates if the AABB needs to be updated before use.
     */
    this.aabbNeedsUpdate = true;

    this.wlambda = new CANNON.Vec3();
};

CANNON.RigidBody.prototype = new CANNON.Particle(0);
CANNON.RigidBody.prototype.constructor = CANNON.RigidBody;

CANNON.RigidBody.prototype.computeAABB = function(){
    this.shape.calculateWorldAABB(this.position,
                                  this.quaternion,
                                  this.aabbmin,
                                  this.aabbmax);
    this.aabbNeedsUpdate = false;
};

/**
 * Apply force to a world point. This could for example be a point on the RigidBody surface. Applying force this way will add to Body.force and Body.tau.
 * @param  CANNON.Vec3 force The amount of force to add.
 * @param  CANNON.Vec3 worldPoint A world point to apply the force on.
 */
var RigidBody_applyForce_r = new CANNON.Vec3();
var RigidBody_applyForce_rotForce = new CANNON.Vec3();
CANNON.RigidBody.prototype.applyForce = function(force,worldPoint){
    // Compute point position relative to the body center
    var r = RigidBody_applyForce_r;
    worldPoint.vsub(this.position,r);

    // Compute produced rotational force
    var rotForce = RigidBody_applyForce_rotForce;
    r.cross(force,rotForce);

    // Add linear force
    this.force.vadd(force,this.force);

    // Add rotational force
    this.tau.vadd(rotForce,this.tau);
};

/**
 * Apply impulse to a world point. This could for example be a point on the RigidBody surface. An impulse is a force added to a body during a short period of time (impulse = force * time). Impulses will be added to Body.velocity and Body.angularVelocity.
 * @param  CANNON.Vec3 impulse The amount of impulse to add.
 * @param  CANNON.Vec3 worldPoint A world point to apply the force on.
 */
var RigidBody_applyImpulse_r = new CANNON.Vec3();
var RigidBody_applyImpulse_velo = new CANNON.Vec3();
var RigidBody_applyImpulse_rotVelo = new CANNON.Vec3();
CANNON.RigidBody.prototype.applyImpulse = function(impulse,worldPoint){
    // Compute point position relative to the body center
    var r = RigidBody_applyImpulse_r;
    worldPoint.vsub(this.position,r);

    // Compute produced central impulse velocity
    var velo = RigidBody_applyImpulse_velo;
    impulse.copy(velo);
    velo.mult(this.invMass,velo);

    // Add linear impulse
    this.velocity.vadd(velo, this.velocity);

    // Compute produced rotational impulse velocity
    var rotVelo = RigidBody_applyImpulse_rotVelo;
    r.cross(impulse,rotVelo);
    rotVelo.x *= this.invInertia.x;
    rotVelo.y *= this.invInertia.y;
    rotVelo.z *= this.invInertia.z;

    // Add rotational Impulse
    this.angularVelocity.vadd(rotVelo, this.angularVelocity);
};


/**
 * @brief Spherical rigid body
 * @class CANNON.Sphere
 * @extends CANNON.Shape
 * @param float radius
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Sphere = function(radius){
    CANNON.Shape.call(this);

    /**
     * @property float radius
     * @memberof CANNON.Sphere
     */
    this.radius = radius!==undefined ? Number(radius) : 1.0;
    this.type = CANNON.Shape.types.SPHERE;
};
CANNON.Sphere.prototype = new CANNON.Shape();
CANNON.Sphere.prototype.constructor = CANNON.Sphere;

CANNON.Sphere.prototype.calculateLocalInertia = function(mass,target){
    target = target || new CANNON.Vec3();
    var I = 2.0*mass*this.radius*this.radius/5.0;
    target.x = I;
    target.y = I;
    target.z = I;
    return target;
};

CANNON.Sphere.prototype.volume = function(){
    return 4.0 * Math.PI * this.radius / 3.0;
};

CANNON.Sphere.prototype.computeBoundingSphereRadius = function(){
    this.boundingSphereRadiusNeedsUpdate = false;
    this.boundingSphereRadius = this.radius;
};

CANNON.Sphere.prototype.calculateWorldAABB = function(pos,quat,min,max){
    var r = this.radius;
    var axes = ['x','y','z'];
    for(var i=0; i<axes.length; i++){
        var ax = axes[i];
        min[ax] = pos[ax] - r;
        max[ax] = pos[ax] + r;
    }
};

/**
 * @class CANNON.SPHSystem
 * @brief Smoothed-particle hydrodynamics system
 */
CANNON.SPHSystem = function(){
    this.particles = [];
    this.density = 1; // kg/m3
    this.smoothingRadius = 1; // Adjust so there are about 15-20 neighbor particles within this radius
    this.speedOfSound = 1;
    this.viscosity = 0.01;
    this.eps = 0.000001;

    // Stuff Computed per particle
    this.pressures = [];
    this.densities = [];
    this.neighbors = [];
}

CANNON.SPHSystem.prototype.add = function(particle){
    this.particles.push(particle);
    if(this.neighbors.length < this.particles.length)
        this.neighbors.push([]);
};

CANNON.SPHSystem.prototype.remove = function(particle){
    var idx = this.particles.indexOf(particle);
    if(idx !== -1){
        this.particles.splice(idx,1);
        if(this.neighbors.length > this.particles.length)
            this.neighbors.pop();
    }
};

/**
 * Get neighbors within smoothing volume, save in the array neighbors
 * @param CANNON.Body particle
 * @param Array neighbors
 */
var SPHSystem_getNeighbors_dist = new CANNON.Vec3();
CANNON.SPHSystem.prototype.getNeighbors = function(particle,neighbors){
    var N = this.particles.length,
        id = particle.id,
        R2 = this.smoothingRadius * this.smoothingRadius,
        dist = SPHSystem_getNeighbors_dist;
    for(var i=0; i!==N; i++){  
        var p = this.particles[i];
        p.position.vsub(particle.position,dist);
        if(id!==p.id && dist.norm2() < R2){
            neighbors.push(p);
        }
    }
};

// Temp vectors for calculation
var SPHSystem_update_dist = new CANNON.Vec3(),
    SPHSystem_update_a_pressure = new CANNON.Vec3(),
    SPHSystem_update_a_visc = new CANNON.Vec3(),
    SPHSystem_update_gradW = new CANNON.Vec3(),
    SPHSystem_update_r_vec = new CANNON.Vec3(),
    SPHSystem_update_u = new CANNON.Vec3(); // Relative velocity
CANNON.SPHSystem.prototype.update = function(){
    var N = this.particles.length,
        dist = SPHSystem_update_dist,
        cs = this.speedOfSound,
        eps = this.eps;

    for(var i=0; i!==N; i++){
        var p = this.particles[i]; // Current particle
        var neighbors = this.neighbors[i];

        // Get neighbors
        neighbors.length = 0;
        this.getNeighbors(p,neighbors);
        neighbors.push(this.particles[i]); // Add current too
        var numNeighbors = neighbors.length;
        
        // Accumulate density for the particle
        var sum = 0.0;
        for(var j=0; j!==numNeighbors; j++){
            
            //printf("Current particle has position %f %f %f\n",objects[id].pos.x(),objects[id].pos.y(),objects[id].pos.z());
            p.position.vsub(neighbors[j].position, dist);
            var len = dist.norm();

            var weight = this.w(len);
            sum += neighbors[j].mass * weight;
        }

        // Save 
        this.densities[i] = sum;
        this.pressures[i] = cs * cs * (this.densities[i] - this.density);
    }

    // Add forces

    // Sum to these accelerations
    var a_pressure= SPHSystem_update_a_pressure;
    var a_visc =    SPHSystem_update_a_visc;
    var gradW =     SPHSystem_update_gradW;
    var r_vec =     SPHSystem_update_r_vec;
    var u =         SPHSystem_update_u;

    for(var i=0; i!==N; i++){
        
        var particle = this.particles[i];

        a_pressure.set(0,0,0);
        a_visc.set(0,0,0);
        
        // Init vars
        var Pij;
        var nabla;
        var Vij;
        
        // Sum up for all other neighbors
        var neighbors = this.neighbors[i];
        var numNeighbors = neighbors.length;

        //printf("Neighbors: ");
        for(var j=0; j!==numNeighbors; j++){
            
            var neighbor = neighbors[j];
            //printf("%d ",nj);
            
            // Get r once for all..
            particle.position.vsub(neighbor.position,r_vec);
            var r = r_vec.norm();
            
            // Pressure contribution
            Pij = -neighbor.mass * (this.pressures[i] / (this.densities[i]*this.densities[i] + eps) + this.pressures[j] / (this.densities[j]*this.densities[j] + eps));
            this.gradw(r_vec, gradW);
            // Add to pressure acceleration
            gradW.mult(Pij , gradW)
            a_pressure.vadd(gradW, a_pressure);
            
            // Viscosity contribution
            neighbor.velocity.vsub(particle.velocity, u);
            u.mult( 1.0 / (0.0001+this.densities[i] * this.densities[j]) * this.viscosity * neighbor.mass , u );
            nabla = this.nablaw(r);
            u.mult(nabla,u);
            // Add to viscosity acceleration
            a_visc.vadd( u, a_visc );
        }
        
        // Calculate force
        a_visc.mult(particle.mass, a_visc);
        a_pressure.mult(particle.mass, a_pressure);

        // Add force to particles
        particle.force.vadd(a_visc, particle.force);
        particle.force.vadd(a_pressure, particle.force);
    }
};

// Calculate the weight using the W(r) weightfunction
CANNON.SPHSystem.prototype.w = function(r){
    // 315
    var h = this.smoothingRadius;
    return 315.0/(64.0*Math.PI*Math.pow(h,9)) * Math.pow(h*h-r*r,3);
};

// calculate gradient of the weight function
CANNON.SPHSystem.prototype.gradw = function(rVec,resultVec){
    var r = rVec.norm(),
        h = this.smoothingRadius;
    rVec.mult(945.0/(32.0*Math.PI*Math.pow(h,9)) * Math.pow((h*h-r*r),2) , resultVec);
};

// Calculate nabla(W)
CANNON.SPHSystem.prototype.nablaw = function(r){
    var h = this.smoothingRadius;
    var nabla = 945.0/(32.0*Math.PI*Math.pow(h,9)) * (h*h-r*r)*(7*r*r - 3*h*h);
    return nabla;
};


/**
 * @class CANNON.Box
 * @brief A 3d box shape.
 * @param CANNON.Vec3 halfExtents
 * @author schteppe
 * @extends CANNON.Shape
 */
CANNON.Box = function(halfExtents){
    CANNON.Shape.call(this);

    /**
    * @property CANNON.Vec3 halfExtents
    * @memberof CANNON.Box
    */
    this.halfExtents = halfExtents;
    this.type = CANNON.Shape.types.BOX;

    /**
    * @property CANNON.ConvexPolyhedron convexPolyhedronRepresentation
    * @brief Used by the contact generator to make contacts with other convex polyhedra for example
    * @memberof CANNON.Box
    */
    this.convexPolyhedronRepresentation = null;

    this.updateConvexPolyhedronRepresentation();
};
CANNON.Box.prototype = new CANNON.Shape();
CANNON.Box.prototype.constructor = CANNON.Box;

/**
 * @method updateConvexPolyhedronRepresentation
 * @memberof CANNON.Box
 * @brief Updates the local convex polyhedron representation used for some collisions.
 */
CANNON.Box.prototype.updateConvexPolyhedronRepresentation = function(){
    var sx = this.halfExtents.x;
    var sy = this.halfExtents.y;
    var sz = this.halfExtents.z;
    var V = CANNON.Vec3;

    function createBoxPolyhedron(size){
        size = size || 1;
        var vertices = [new CANNON.Vec3(-size,-size,-size),
                        new CANNON.Vec3( size,-size,-size),
                        new CANNON.Vec3( size, size,-size),
                        new CANNON.Vec3(-size, size,-size),
                        new CANNON.Vec3(-size,-size, size),
                        new CANNON.Vec3( size,-size, size),
                        new CANNON.Vec3( size, size, size),
                        new CANNON.Vec3(-size, size, size)];
        var faces =[[3,2,1,0], // -z
                    [4,5,6,7], // +z
                    [5,4,1,0], // -y
                    [2,3,6,7], // +y
                    [0,4,7,3 /*0,3,4,7*/ ], // -x
                    [1,2,5,6], // +x
                    ];
        var faceNormals =   [new CANNON.Vec3( 0, 0,-1),
                           new CANNON.Vec3( 0, 0, 1),
                           new CANNON.Vec3( 0,-1, 0),
                           new CANNON.Vec3( 0, 1, 0),
                           new CANNON.Vec3(-1, 0, 0),
                           new CANNON.Vec3( 1, 0, 0)];
        var boxShape = new CANNON.ConvexPolyhedron(vertices,
                                                 faces,
                                                 faceNormals);
        return boxShape;
    }

    var h = new CANNON.ConvexPolyhedron([new V(-sx,-sy,-sz),
                                         new V( sx,-sy,-sz),
                                         new V( sx, sy,-sz),
                                         new V(-sx, sy,-sz),
                                         new V(-sx,-sy, sz),
                                         new V( sx,-sy, sz),
                                         new V( sx, sy, sz),
                                         new V(-sx, sy, sz)],
                                         [[3,2,1,0], // -z
                                          [4,5,6,7], // +z
                                          [5,4,1,0], // -y
                                          [2,3,6,7], // +y
                                          [0,4,7,3], // -x
                                          [1,2,5,6], // +x
                                          ],
                                        [new V( 0, 0,-1),
                                         new V( 0, 0, 1),
                                         new V( 0,-1, 0),
                                         new V( 0, 1, 0),
                                         new V(-1, 0, 0),
                                         new V( 1, 0, 0)]);
    this.convexPolyhedronRepresentation = h;
};

CANNON.Box.prototype.calculateLocalInertia = function(mass,target){
    target = target || new CANNON.Vec3();
    var e = this.halfExtents;
    target.x = 1.0 / 12.0 * mass * (   2*e.y*2*e.y + 2*e.z*2*e.z );
    target.y = 1.0 / 12.0 * mass * (   2*e.x*2*e.x + 2*e.z*2*e.z );
    target.z = 1.0 / 12.0 * mass * (   2*e.y*2*e.y + 2*e.x*2*e.x );
    return target;
};

/**
 * @method getSideNormals
 * @memberof CANNON.Box
 * @brief Get the box 6 side normals
 * @param bool includeNegative If true, this function returns 6 vectors. If false, it only returns 3 (but you get 6 by reversing those 3)
 * @param CANNON.Quaternion quat Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
 * @return array
 */
CANNON.Box.prototype.getSideNormals = function(sixTargetVectors,quat){
    var sides = sixTargetVectors;
    var ex = this.halfExtents;
    sides[0].set(  ex.x,     0,     0);
    sides[1].set(     0,  ex.y,     0);
    sides[2].set(     0,     0,  ex.z);
    sides[3].set( -ex.x,     0,     0);
    sides[4].set(     0, -ex.y,     0);
    sides[5].set(     0,     0, -ex.z);

    if(quat!==undefined){
        for(var i=0; i!==sides.length; i++){
            quat.vmult(sides[i],sides[i]);
        }
    }

    return sides;
};

CANNON.Box.prototype.volume = function(){
    return 8.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
};

CANNON.Box.prototype.computeBoundingSphereRadius = function(){
    this.boundingSphereRadius = this.halfExtents.norm();
    this.boundingSphereRadiusNeedsUpdate = false;
};

var worldCornerTempPos = new CANNON.Vec3();
var worldCornerTempNeg = new CANNON.Vec3();
CANNON.Box.prototype.forEachWorldCorner = function(pos,quat,callback){

    var e = this.halfExtents;
    var corners = [[  e.x,  e.y,  e.z],
                   [ -e.x,  e.y,  e.z],
                   [ -e.x, -e.y,  e.z],
                   [ -e.x, -e.y, -e.z],
                   [  e.x, -e.y, -e.z],
                   [  e.x,  e.y, -e.z],
                   [ -e.x,  e.y, -e.z],
                   [  e.x, -e.y,  e.z]];
    for(var i=0; i<corners.length; i++){
        worldCornerTempPos.set(corners[i][0],corners[i][1],corners[i][2]);
        quat.vmult(worldCornerTempPos,worldCornerTempPos);
        pos.vadd(worldCornerTempPos,worldCornerTempPos);
        callback(worldCornerTempPos.x,
                 worldCornerTempPos.y,
                 worldCornerTempPos.z);
    }
};

CANNON.Box.prototype.calculateWorldAABB = function(pos,quat,min,max){
    // Get each axis max
    min.set(Infinity,Infinity,Infinity);
    max.set(-Infinity,-Infinity,-Infinity);
    this.forEachWorldCorner(pos,quat,function(x,y,z){
        if(x > max.x){
            max.x = x;
        }
        if(y > max.y){
            max.y = y;
        }
        if(z > max.z){
            max.z = z;
        }

        if(x < min.x){
            min.x = x;
        }
        if(y < min.y){
            min.y = y;
        }
        if(z < min.z){
            min.z = z;
        }
    });
};

/**
 * @class CANNON.Plane
 * @extends CANNON.Shape
 * @param CANNON.Vec3 normal
 * @brief A plane, facing in the Z direction.
 * @description A plane, facing in the Z direction. The plane has its surface at z=0 and everything below z=0 is assumed to be solid plane. To make the plane face in some other direction than z, you must put it inside a RigidBody and rotate that body. See the demos.
 * @author schteppe
 */
CANNON.Plane = function(){
    CANNON.Shape.call(this);
    this.type = CANNON.Shape.types.PLANE;

    // World oriented normal
    this.worldNormal = new CANNON.Vec3();
    this.worldNormalNeedsUpdate = true;
};
CANNON.Plane.prototype = new CANNON.Shape();
CANNON.Plane.prototype.constructor = CANNON.Plane;

CANNON.Plane.prototype.computeWorldNormal = function(quat){
    var n = this.worldNormal;
    n.set(0,0,1);
    quat.vmult(n,n);
    this.worldNormalNeedsUpdate = false;
};

CANNON.Plane.prototype.calculateLocalInertia = function(mass,target){
    target = target || new CANNON.Vec3();
    return target;
};

CANNON.Plane.prototype.volume = function(){
    return Infinity; // The plane is infinite...
};

var tempNormal = new CANNON.Vec3();
CANNON.Plane.prototype.calculateWorldAABB = function(pos,quat,min,max){
    // The plane AABB is infinite, except if the normal is pointing along any axis
    tempNormal.set(0,0,1); // Default plane normal is z
    quat.vmult(tempNormal,tempNormal);
    min.set(-Infinity,-Infinity,-Infinity);
    max.set(Infinity,Infinity,Infinity);

    if(tempNormal.x === 1){ max.x = pos.x; }
    if(tempNormal.y === 1){ max.y = pos.y; }
    if(tempNormal.z === 1){ max.z = pos.z; }

    if(tempNormal.x === -1){ min.x = pos.x; }
    if(tempNormal.y === -1){ min.y = pos.y; }
    if(tempNormal.z === -1){ min.z = pos.z; }

};


/**
 * @class CANNON.Compound
 * @extends CANNON.Shape
 * @brief A shape made of several other shapes.
 * @author schteppe
 */
CANNON.Compound = function(){
    CANNON.Shape.call(this);
    this.type = CANNON.Shape.types.COMPOUND;
    this.childShapes = [];
    this.childOffsets = [];
    this.childOrientations = [];
};
CANNON.Compound.prototype = new CANNON.Shape();
CANNON.Compound.prototype.constructor = CANNON.Compound;

/**
 * @method addChild
 * @memberof CANNON.Compound
 * @brief Add a child shape.
 * @param CANNON.Shape shape
 * @param CANNON.Vec3 offset
 * @param CANNON.Quaternion orientation
 */
CANNON.Compound.prototype.addChild = function(shape,offset,orientation){
    offset = offset || new CANNON.Vec3();
    orientation = orientation || new CANNON.Quaternion();
    this.childShapes.push(shape);
    this.childOffsets.push(offset);
    this.childOrientations.push(orientation);
};

CANNON.Compound.prototype.volume = function(){
    var r = 0.0;
    var Nchildren = this.childShapes.length;
    for(var i=0; i!==Nchildren; i++){
        r += this.childShapes[i].volume();
    }
    return r;
};

var Compound_calculateLocalInertia_mr2 = new CANNON.Vec3();
var Compound_calculateLocalInertia_childInertia = new CANNON.Vec3();
CANNON.Compound.prototype.calculateLocalInertia = function(mass,target){
    target = target || new CANNON.Vec3();

    // Calculate the total volume, we will spread out this objects' mass on the sub shapes
    var V = this.volume();
    var childInertia = Compound_calculateLocalInertia_childInertia;
    for(var i=0, Nchildren=this.childShapes.length; i!==Nchildren; i++){
        // Get child information
        var b = this.childShapes[i];
        var o = this.childOffsets[i];
        var q = this.childOrientations[i];
        var m = b.volume() / V * mass;

        // Get the child inertia, transformed relative to local frame
        //var inertia = b.calculateTransformedInertia(m,q);
        b.calculateLocalInertia(m,childInertia); // Todo transform!
        //console.log(childInertia,m,b.volume(),V);

        // Add its inertia using the parallel axis theorem, i.e.
        // I += I_child;    
        // I += m_child * r^2

        target.vadd(childInertia,target);
        var mr2 = Compound_calculateLocalInertia_mr2;
        mr2.set(m*o.x*o.x,
                m*o.y*o.y,
                m*o.z*o.z);
        target.vadd(mr2,target);
    }

    return target;
};

CANNON.Compound.prototype.computeBoundingSphereRadius = function(){
    var r = 0.0;
    for(var i = 0; i<this.childShapes.length; i++){
        var si = this.childShapes[i];
        if(si.boundingSphereRadiusNeedsUpdate){
            si.computeBoundingSphereRadius();
        }
        var candidate = this.childOffsets[i].norm() + si.boundingSphereRadius;
        if(r < candidate){
            r = candidate;
        }
    }
    this.boundingSphereRadius = r;
    this.boundingSphereRadiusNeedsUpdate = false;
};

var aabbmaxTemp = new CANNON.Vec3();
var aabbminTemp = new CANNON.Vec3();
var childPosTemp = new CANNON.Vec3();
var childQuatTemp = new CANNON.Quaternion();
CANNON.Compound.prototype.calculateWorldAABB = function(pos,quat,min,max){
    var N=this.childShapes.length;
    min.set(Infinity,Infinity,Infinity);
    max.set(-Infinity,-Infinity,-Infinity);
    // Get each axis max
    for(var i=0; i!==N; i++){

        // Accumulate transformation to child
        this.childOffsets[i].copy(childPosTemp);
        quat.vmult(childPosTemp,childPosTemp);
        pos.vadd(childPosTemp,childPosTemp);

        quat.mult(this.childOrientations[i],childQuatTemp);

        // Get child AABB
        this.childShapes[i].calculateWorldAABB(childPosTemp,
                                               childQuatTemp,//this.childOrientations[i],
                                               aabbminTemp,
                                               aabbmaxTemp);

        if(aabbminTemp.x < min.x){
            min.x = aabbminTemp.x;
        }
        if(aabbminTemp.y < min.y){
            min.y = aabbminTemp.y;
        }
        if(aabbminTemp.z < min.z){
            min.z = aabbminTemp.z;
        }

        if(aabbmaxTemp.x > max.x){
            max.x = aabbmaxTemp.x;
        }
        if(aabbmaxTemp.y > max.y){
            max.y = aabbmaxTemp.y;
        }
        if(aabbmaxTemp.z > max.z){
            max.z = aabbmaxTemp.z;
        }
    }
};

/**
 * @class CANNON.ConvexPolyhedron
 * @extends CANNON.Shape
 * @brief A set of points in space describing a convex shape.
 * @author qiao / https://github.com/qiao (original author, see https://github.com/qiao/three.js/commit/85026f0c769e4000148a67d45a9e9b9c5108836f)
 * @author schteppe / https://github.com/schteppe
 * @see http://www.altdevblogaday.com/2011/05/13/contact-generation-between-3d-convex-meshes/
 * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
 * @todo move the clipping functions to ContactGenerator?
 * @param array points An array of CANNON.Vec3's
 * @param array faces
 * @param array normals
 */
CANNON.ConvexPolyhedron = function( points , faces , normals ) {
    var that = this;
    CANNON.Shape.call( this );
    this.type = CANNON.Shape.types.CONVEXPOLYHEDRON;

    /*
     * @brief Get face normal given 3 vertices
     * @param CANNON.Vec3 va
     * @param CANNON.Vec3 vb
     * @param CANNON.Vec3 vc
     * @param CANNON.Vec3 target
     * @todo unit test?
     */
    var cb = new CANNON.Vec3();
    var ab = new CANNON.Vec3();
    function normal( va, vb, vc, target ) {
        vb.vsub(va,ab);
        vc.vsub(vb,cb);
        cb.cross(ab,target);
        if ( !target.isZero() ) {
            target.normalize();
        }
    }

    /**
    * @property array vertices
    * @memberof CANNON.ConvexPolyhedron
    * @brief Array of CANNON.Vec3
    */
    this.vertices = points||[];

    this.worldVertices = []; // World transformed version of .vertices
    this.worldVerticesNeedsUpdate = true;

    /**
    * @property array faces
    * @memberof CANNON.ConvexPolyhedron
    * @brief Array of integer arrays, indicating which vertices each face consists of
    * @todo Needed?
    */
    this.faces = faces||[];

    /**
     * @property array faceNormals
     * @memberof CANNON.ConvexPolyhedron
     * @brief Array of CANNON.Vec3
     * @todo Needed?
     */
    this.faceNormals = [];//normals||[];
    /*
    for(var i=0; i<this.faceNormals.length; i++){
        this.faceNormals[i].normalize();
    }
     */
    // Generate normals
    for(var i=0; i<this.faces.length; i++){

        // Check so all vertices exists for this face
        for(var j=0; j<this.faces[i].length; j++){
            if(!this.vertices[this.faces[i][j]]){
                throw new Error("Vertex "+this.faces[i][j]+" not found!");
            }
        }

        var n = new CANNON.Vec3();
        normalOfFace(i,n);
        n.negate(n);
        this.faceNormals.push(n);
        //console.log(n.toString());
        var vertex = this.vertices[this.faces[i][0]];
        if(n.dot(vertex)<0){
            console.warn("Face normal "+i+" ("+n.toString()+") looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.");
            for(var j=0; j<this.faces[i].length; j++){
                console.warn("Vertex "+this.faces[i][j]+": ("+this.vertices[faces[i][j]].toString()+")");
            }
        }
    }

    this.worldFaceNormalsNeedsUpdate = true;
    this.worldFaceNormals = []; // World transformed version of .faceNormals

    /**
     * @property array uniqueEdges
     * @memberof CANNON.ConvexPolyhedron
     * @brief Array of CANNON.Vec3
     */
    this.uniqueEdges = [];
    var nv = this.vertices.length;
    for(var pi=0; pi<nv; pi++){
        var p = this.vertices[pi];
        if(!(p instanceof CANNON.Vec3)){
            throw "Argument 1 must be instance of CANNON.Vec3";
        }
        this.uniqueEdges.push(p);
    }

    for(var i=0; i<this.faces.length; i++){
        var numVertices = this.faces[i].length;
        var NbTris = numVertices;
        for(var j=0; j<NbTris; j++){
            var k = ( j+1 ) % numVertices;
            var edge = new CANNON.Vec3();
            this.vertices[this.faces[i][j]].vsub(this.vertices[this.faces[i][k]],edge);
            edge.normalize();
            var found = false;
            for(var p=0;p<this.uniqueEdges.length;p++){
                if (this.uniqueEdges[p].almostEquals(edge) || this.uniqueEdges[p].almostEquals(edge)){
                    found = true;
                    break;
                }
            }

            if (!found){
                this.uniqueEdges.push(edge);
            }

            if (edge) {
                edge.face1 = i;
            } else {
                /*
                var ed;
                ed.m_face0 = i;
                edges.insert(vp,ed);
                 */
            }
        }
    }

    /*
     * Get max and min dot product of a convex hull at position (pos,quat) projected onto an axis. Results are saved in the array maxmin.
     * @param CANNON.ConvexPolyhedron hull
     * @param CANNON.Vec3 axis
     * @param CANNON.Vec3 pos
     * @param CANNON.Quaternion quat
     * @param array maxmin maxmin[0] and maxmin[1] will be set to maximum and minimum, respectively.
     */
    var worldVertex = new CANNON.Vec3();
    function project(hull,axis,pos,quat,maxmin){
        var n = hull.vertices.length;
        var max = null;
        var min = null;
        var vs = hull.vertices;
        for(var i=0; i<n; i++){
            vs[i].copy(worldVertex);
            quat.vmult(worldVertex,worldVertex);
            worldVertex.vadd(pos,worldVertex);
            var val = worldVertex.dot(axis);
            if(max===null || val>max){
                max = val;
            }
            if(min===null || val<min){
                min = val;
            }
        }

        if(min>max){
            // Inconsistent - swap
            var temp = min;
            min = max;
            max = temp;
        }
        // Output
        maxmin[0] = max;
        maxmin[1] = min;
    }

    /**
     * @method testSepAxis
     * @memberof CANNON.ConvexPolyhedron
     * @brief Test separating axis against two hulls. Both hulls are projected onto the axis and the overlap size is returned if there is one.
     * @param CANNON.Vec3 axis
     * @param CANNON.ConvexPolyhedron hullB
     * @param CANNON.Vec3 posA
     * @param CANNON.Quaternion quatA
     * @param CANNON.Vec3 posB
     * @param CANNON.Quaternion quatB
     * @return float The overlap depth, or FALSE if no penetration.
     */
    this.testSepAxis = function(axis, hullB, posA, quatA, posB, quatB){
        var maxminA=[], maxminB=[], hullA=this;
        project(hullA, axis, posA, quatA, maxminA);
        project(hullB, axis, posB, quatB, maxminB);
        var maxA = maxminA[0];
        var minA = maxminA[1];
        var maxB = maxminB[0];
        var minB = maxminB[1];
        if(maxA<minB || maxB<minA){
            //console.log(minA,maxA,minB,maxB);
            return false; // Separated
        }
        var d0 = maxA - minB;
        var d1 = maxB - minA;
        var depth = d0<d1 ? d0:d1;
        return depth;
    };

    /**
     * @method findSeparatingAxis
     * @memberof CANNON.ConvexPolyhedron
     * @brief Find the separating axis between this hull and another
     * @param CANNON.ConvexPolyhedron hullB
     * @param CANNON.Vec3 posA
     * @param CANNON.Quaternion quatA
     * @param CANNON.Vec3 posB
     * @param CANNON.Quaternion quatB
     * @param CANNON.Vec3 target The target vector to save the axis in
     * @return bool Returns false if a separation is found, else true
     */
    var faceANormalWS3 = new CANNON.Vec3();
    var Worldnormal1 = new CANNON.Vec3();
    var deltaC = new CANNON.Vec3();
    var worldEdge0 = new CANNON.Vec3();
    var worldEdge1 = new CANNON.Vec3();
    var Cross = new CANNON.Vec3();
    this.findSeparatingAxis = function(hullB,posA,quatA,posB,quatB,target){
        var dmin = Infinity;
        var hullA = this;
        var curPlaneTests=0;
        var numFacesA = hullA.faces.length;

        // Test normals from hullA
        for(var i=0; i<numFacesA; i++){
            // Get world face normal
            hullA.faceNormals[i].copy(faceANormalWS3);
            quatA.vmult(faceANormalWS3,faceANormalWS3);
            //posA.vadd(faceANormalWS3,faceANormalWS3); // Needed?
            //console.log("face normal:",hullA.faceNormals[i].toString(),"world face normal:",faceANormalWS3);
            var d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
            if(d===false){
                return false;
            }

            if(d<dmin){
                dmin = d;
                faceANormalWS3.copy(target);
            }
        }

        // Test normals from hullB
        var numFacesB = hullB.faces.length;
        for(var i=0;i<numFacesB;i++){
            hullB.faceNormals[i].copy(Worldnormal1);
            quatB.vmult(Worldnormal1,Worldnormal1);
            //posB.vadd(Worldnormal1,Worldnormal1);
            //console.log("facenormal",hullB.faceNormals[i].toString(),"world:",Worldnormal1.toString());
            curPlaneTests++;
            var d = hullA.testSepAxis(Worldnormal1, hullB,posA,quatA,posB,quatB);
            if(d===false){
                return false;
            }

            if(d<dmin){
                dmin = d;
                Worldnormal1.copy(target);
            }
        }

        var edgeAstart,edgeAend,edgeBstart,edgeBend;

        var curEdgeEdge = 0;
        // Test edges
        for(var e0=0; e0<hullA.uniqueEdges.length; e0++){
            // Get world edge
            hullA.uniqueEdges[e0].copy(worldEdge0);
            quatA.vmult(worldEdge0,worldEdge0);
            //posA.vadd(worldEdge0,worldEdge0); // needed?

            //console.log("edge0:",worldEdge0.toString());

            for(var e1=0; e1<hullB.uniqueEdges.length; e1++){
                hullB.uniqueEdges[e1].copy(worldEdge1);
                quatB.vmult(worldEdge1,worldEdge1);
                //posB.vadd(worldEdge1,worldEdge1); // needed?
                //console.log("edge1:",worldEdge1.toString());
                worldEdge0.cross(worldEdge1,Cross);
                curEdgeEdge++;
                if(!Cross.almostZero()){
                    Cross.normalize();
                    var dist = hullA.testSepAxis( Cross, hullB, posA,quatA,posB,quatB);
                    if(dist===false){
                        return false;
                    }
                    if(dist<dmin){
                        dmin = dist;
                        Cross.copy(target);
                    }
                }
            }
        }

        posB.vsub(posA,deltaC);
        if((deltaC.dot(target))>0.0){
            target.negate(target);
        }
        return true;
    };

    /**
     * @method clipAgainstHull
     * @memberof CANNON.ConvexPolyhedron
     * @brief Clip this hull against another hull
     * @param CANNON.Vec3 posA
     * @param CANNON.Quaternion quatA
     * @param CANNON.ConvexPolyhedron hullB
     * @param CANNON.Vec3 posB
     * @param CANNON.Quaternion quatB
     * @param CANNON.Vec3 separatingNormal
     * @param float minDist Clamp distance
     * @param float maxDist
     * @param array result The an array of contact point objects, see clipFaceAgainstHull
     * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
     */
    var WorldNormal = new CANNON.Vec3();
    this.clipAgainstHull = function(posA,quatA,hullB,posB,quatB,separatingNormal,minDist,maxDist,result){
        if(!(posA instanceof CANNON.Vec3)){
            throw new Error("posA must be Vec3");
        }
        if(!(quatA instanceof CANNON.Quaternion)){
            throw new Error("quatA must be Quaternion");
        }
        var hullA = this;
        var curMaxDist = maxDist;
        var closestFaceB = -1;
        var dmax = -Infinity;
        for(var face=0; face < hullB.faces.length; face++){
            hullB.faceNormals[face].copy(WorldNormal);
            quatB.vmult(WorldNormal,WorldNormal);
            //posB.vadd(WorldNormal,WorldNormal);
            var d = WorldNormal.dot(separatingNormal);
            if (d > dmax){
                dmax = d;
                closestFaceB = face;
            }
        }
        var worldVertsB1 = [];
        var polyB = hullB.faces[closestFaceB];
        var numVertices = polyB.length;
        for(var e0=0; e0<numVertices; e0++){
            var b = hullB.vertices[polyB[e0]];
            var worldb = new CANNON.Vec3();
            b.copy(worldb);
            quatB.vmult(worldb,worldb);
            posB.vadd(worldb,worldb);
            worldVertsB1.push(worldb);
        }

        if (closestFaceB>=0){
            this.clipFaceAgainstHull(separatingNormal,
                                     posA,
                                     quatA,
                                     worldVertsB1,
                                     minDist,
                                     maxDist,
                                     result);
        }
    };

    /**
     * @method clipFaceAgainstHull
     * @memberof CANNON.ConvexPolyhedron
     * @brief Clip a face against a hull.
     * @param CANNON.Vec3 separatingNormal
     * @param CANNON.Vec3 posA
     * @param CANNON.Quaternion quatA
     * @param Array worldVertsB1 An array of CANNON.Vec3 with vertices in the world frame.
     * @param float minDist Distance clamping
     * @param float maxDist
     * @param Array result Array to store resulting contact points in. Will be objects with properties: point, depth, normal. These are represented in world coordinates.
     */
    var faceANormalWS = new CANNON.Vec3();
    var edge0 = new CANNON.Vec3();
    var WorldEdge0 = new CANNON.Vec3();
    var worldPlaneAnormal1 = new CANNON.Vec3();
    var planeNormalWS1 = new CANNON.Vec3();
    var worldA1 = new CANNON.Vec3();
    var localPlaneNormal = new CANNON.Vec3();
    var planeNormalWS = new CANNON.Vec3();
    this.clipFaceAgainstHull = function(separatingNormal, posA, quatA, worldVertsB1, minDist, maxDist,result){
        if(!(separatingNormal instanceof CANNON.Vec3)){
            throw new Error("sep normal must be vector");
        }
        if(!(worldVertsB1 instanceof Array)){
            throw new Error("world verts must be array");
        }
        minDist = Number(minDist);
        maxDist = Number(maxDist);
        var hullA = this;
        var worldVertsB2 = [];
        var pVtxIn = worldVertsB1;
        var pVtxOut = worldVertsB2;
        // Find the face with normal closest to the separating axis
        var closestFaceA = -1;
        var dmin = Infinity;
        for(var face=0; face<hullA.faces.length; face++){
            hullA.faceNormals[face].copy(faceANormalWS);
            quatA.vmult(faceANormalWS,faceANormalWS);
            //posA.vadd(faceANormalWS,faceANormalWS);
            var d = faceANormalWS.dot(separatingNormal);
            if (d < dmin){
                dmin = d;
                closestFaceA = face;
            }
        }
        if (closestFaceA<0){
            console.log("--- did not find any closest face... ---");
            return;
        }
        //console.log("closest A: ",closestFaceA);
        // Get the face and construct connected faces
        var polyA = hullA.faces[closestFaceA];
        polyA.connectedFaces = [];
        for(var i=0; i<hullA.faces.length; i++){
            for(var j=0; j<hullA.faces[i].length; j++){
                if(polyA.indexOf(hullA.faces[i][j])!==-1 /* Sharing a vertex*/ && i!==closestFaceA /* Not the one we are looking for connections from */ && polyA.connectedFaces.indexOf(i)===-1 /* Not already added */ ){
                    polyA.connectedFaces.push(i);
                }
            }
        }
        // Clip the polygon to the back of the planes of all faces of hull A, that are adjacent to the witness face
        var numContacts = pVtxIn.length;
        var numVerticesA = polyA.length;
        var res = [];
        for(var e0=0; e0<numVerticesA; e0++){
            var a = hullA.vertices[polyA[e0]];
            var b = hullA.vertices[polyA[(e0+1)%numVerticesA]];
            a.vsub(b,edge0);
            edge0.copy(WorldEdge0);
            quatA.vmult(WorldEdge0,WorldEdge0);
            posA.vadd(WorldEdge0,WorldEdge0);
            this.faceNormals[closestFaceA].copy(worldPlaneAnormal1);//transA.getBasis()* btVector3(polyA.m_plane[0],polyA.m_plane[1],polyA.m_plane[2]);
            quatA.vmult(worldPlaneAnormal1,worldPlaneAnormal1);
            posA.vadd(worldPlaneAnormal1,worldPlaneAnormal1);
            WorldEdge0.cross(worldPlaneAnormal1,planeNormalWS1);
            planeNormalWS1.negate(planeNormalWS1);
            a.copy(worldA1);
            quatA.vmult(worldA1,worldA1);
            posA.vadd(worldA1,worldA1);
            var planeEqWS1 = -worldA1.dot(planeNormalWS1);
            var planeEqWS;
            if(true){
                var otherFace = polyA.connectedFaces[e0];
                this.faceNormals[otherFace].copy(localPlaneNormal);
                var localPlaneEq = planeConstant(otherFace);

                localPlaneNormal.copy(planeNormalWS);
                quatA.vmult(planeNormalWS,planeNormalWS);
                //posA.vadd(planeNormalWS,planeNormalWS);
                var planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
            } else  {
                planeNormalWS1.copy(planeNormalWS);
                planeEqWS = planeEqWS1;
            }

            // Clip face against our constructed plane
            //console.log("clipping polygon ",printFace(closestFaceA)," against plane ",planeNormalWS, planeEqWS);
            this.clipFaceAgainstPlane(pVtxIn, pVtxOut, planeNormalWS, planeEqWS);
            //console.log(" - clip result: ",pVtxOut);

            // Throw away all clipped points, but save the reamining until next clip
            while(pVtxIn.length){
                pVtxIn.shift();
            }
            while(pVtxOut.length){
                pVtxIn.push(pVtxOut.shift());
            }
        }

        //console.log("Resulting points after clip:",pVtxIn);

        // only keep contact points that are behind the witness face
        this.faceNormals[closestFaceA].copy(localPlaneNormal);

        var localPlaneEq = planeConstant(closestFaceA);
        localPlaneNormal.copy(planeNormalWS);
        quatA.vmult(planeNormalWS,planeNormalWS);

        var planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
        for (var i=0; i<pVtxIn.length; i++){
            var depth = planeNormalWS.dot(pVtxIn[i]) + planeEqWS; //???
            /*console.log("depth calc from normal=",planeNormalWS.toString()," and constant "+planeEqWS+" and vertex ",pVtxIn[i].toString()," gives "+depth);*/
            if (depth <=minDist){
                console.log("clamped: depth="+depth+" to minDist="+(minDist+""));
                depth = minDist;
            }

            if (depth <=maxDist){
                var point = pVtxIn[i];
                if(depth<=0){
                    /*console.log("Got contact point ",point.toString(),
                      ", depth=",depth,
                      "contact normal=",separatingNormal.toString(),
                      "plane",planeNormalWS.toString(),
                      "planeConstant",planeEqWS);*/
                    var p = {
                        point:point,
                        normal:planeNormalWS,
                        depth: depth,
                    };
                    result.push(p);
                }
            }
        }
    };

    /**
     * @method clipFaceAgainstPlane
     * @memberof CANNON.ConvexPolyhedron
     * @brief Clip a face in a hull against the back of a plane.
     * @param Array inVertices
     * @param Array outVertices
     * @param CANNON.Vec3 planeNormal
     * @param float planeConstant The constant in the mathematical plane equation
     */
    this.clipFaceAgainstPlane = function(inVertices,outVertices, planeNormal, planeConstant){
        if(!(planeNormal instanceof CANNON.Vec3)){
            throw new Error("planeNormal must be Vec3, "+planeNormal+" given");
        }
        if(!(inVertices instanceof Array)) {
            throw new Error("invertices must be Array, "+inVertices+" given");
        }
        if(!(outVertices instanceof Array)){
            throw new Error("outvertices must be Array, "+outVertices+" given");
        }
        var n_dot_first, n_dot_last;
        var numVerts = inVertices.length;

        if(numVerts < 2){
            return outVertices;
        }

        var firstVertex = inVertices[inVertices.length-1];
        var lastVertex =   inVertices[0];

        n_dot_first = planeNormal.dot(firstVertex) + planeConstant;

        for(var vi = 0; vi < numVerts; vi++){
            lastVertex = inVertices[vi];
            n_dot_last = planeNormal.dot(lastVertex) + planeConstant;
            if(n_dot_first < 0){
                if(n_dot_last < 0){
                    // Start < 0, end < 0, so output lastVertex
                    var newv = new CANNON.Vec3();
                    lastVertex.copy(newv);
                    outVertices.push(newv);
                } else {
                    // Start < 0, end >= 0, so output intersection
                    var newv = new CANNON.Vec3();
                    firstVertex.lerp(lastVertex,
                                     n_dot_first / (n_dot_first - n_dot_last),
                                     newv);
                    outVertices.push(newv);
                }
            } else {
                if(n_dot_last<0){
                    // Start >= 0, end < 0 so output intersection and end
                    var newv = new CANNON.Vec3();
                    firstVertex.lerp(lastVertex,
                                     n_dot_first / (n_dot_first - n_dot_last),
                                     newv);
                    outVertices.push(newv);
                    outVertices.push(lastVertex);
                }
            }
            firstVertex = lastVertex;
            n_dot_first = n_dot_last;
        }
        return outVertices;
    };

    var that = this;
    function normalOfFace(i,target){
        var f = that.faces[i];
        var va = that.vertices[f[0]];
        var vb = that.vertices[f[1]];
        var vc = that.vertices[f[2]];
        return normal(va,vb,vc,target);
    }

    function planeConstant(face_i,target){
        var f = that.faces[face_i];
        var n = that.faceNormals[face_i];
        var v = that.vertices[f[0]];
        var c = -n.dot(v);
        return c;
    }


    function printFace(i){
        var f = that.faces[i], s = "";
        for(var j=0; j<f.length; j++){
            s += " ("+that.vertices[f[j]]+")";
        }
        return s;
    }

    /*
     * Detect whether two edges are equal.
     * Note that when constructing the convex hull, two same edges can only
     * be of the negative direction.
     * @return bool
     */
    function equalEdge( ea, eb ) {
        return ea[ 0 ] === eb[ 1 ] && ea[ 1 ] === eb[ 0 ];
    }

    /*
     * Create a random offset between -1e-6 and 1e-6.
     * @return float
     */
    function randomOffset() {
        return ( Math.random() - 0.5 ) * 2 * 1e-6;
    }

    this.calculateLocalInertia = function(mass,target){
        // Approximate with box inertia
        // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
        that.computeAABB();
        var x = this.aabbmax.x - this.aabbmin.x,
            y = this.aabbmax.y - this.aabbmin.y,
            z = this.aabbmax.z - this.aabbmin.z;
        target.x = 1.0 / 12.0 * mass * ( 2*y*2*y + 2*z*2*z );
        target.y = 1.0 / 12.0 * mass * ( 2*x*2*x + 2*z*2*z );
        target.z = 1.0 / 12.0 * mass * ( 2*y*2*y + 2*x*2*x );
    };

    var worldVert = new CANNON.Vec3();
    this.computeAABB = function(){
        var n = this.vertices.length,
        aabbmin = this.aabbmin,
        aabbmax = this.aabbmax,
        vertices = this.vertices;
        aabbmin.set(Infinity,Infinity,Infinity);
        aabbmax.set(-Infinity,-Infinity,-Infinity);
        for(var i=0; i<n; i++){
            var v = vertices[i];
            if     (v.x < aabbmin.x){
                aabbmin.x = v.x;
            } else if(v.x > aabbmax.x){
                aabbmax.x = v.x;
            }
            if     (v.y < aabbmin.y){
                aabbmin.y = v.y;
            } else if(v.y > aabbmax.y){
                aabbmax.y = v.y;
            }
            if     (v.z < aabbmin.z){
                aabbmin.z = v.z;
            } else if(v.z > aabbmax.z){
                aabbmax.z = v.z;
            }
        }
    };

    //this.computeAABB();
};

CANNON.ConvexPolyhedron.prototype = new CANNON.Shape();
CANNON.ConvexPolyhedron.prototype.constructor = CANNON.ConvexPolyhedron;

// Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
CANNON.ConvexPolyhedron.prototype.computeWorldVertices = function(position,quat){
    var N = this.vertices.length;
    while(this.worldVertices.length < N){
        this.worldVertices.push( new CANNON.Vec3() );
    }

    var verts = this.vertices,
        worldVerts = this.worldVertices;
    for(var i=0; i!==N; i++){
        quat.vmult( verts[i] , worldVerts[i] );
        position.vadd( worldVerts[i] , worldVerts[i] );
    }

    this.worldVerticesNeedsUpdate = false;
};

// Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
CANNON.ConvexPolyhedron.prototype.computeWorldFaceNormals = function(quat){
    var N = this.faceNormals.length;
    while(this.worldFaceNormals.length < N){
        this.worldFaceNormals.push( new CANNON.Vec3() );
    }

    var normals = this.faceNormals,
        worldNormals = this.worldFaceNormals;
    for(var i=0; i!==N; i++){
        quat.vmult( normals[i] , worldNormals[i] );
    }

    this.worldFaceNormalsNeedsUpdate = false;
};

CANNON.ConvexPolyhedron.prototype.computeBoundingSphereRadius = function(){
    // Assume points are distributed with local (0,0,0) as center
    var max2 = 0;
    var verts = this.vertices;
    for(var i=0, N=verts.length; i!==N; i++) {
        var norm2 = verts[i].norm2();
        if(norm2 > max2){
            max2 = norm2;
        }
    }
    this.boundingSphereRadius = Math.sqrt(max2);
    this.boundingSphereRadiusNeedsUpdate = false;
};

var tempWorldVertex = new CANNON.Vec3();
CANNON.ConvexPolyhedron.prototype.calculateWorldAABB = function(pos,quat,min,max){
    var n = this.vertices.length, verts = this.vertices;
    var minx,miny,minz,maxx,maxy,maxz;
    for(var i=0; i<n; i++){
        verts[i].copy(tempWorldVertex);
        quat.vmult(tempWorldVertex,tempWorldVertex);
        pos.vadd(tempWorldVertex,tempWorldVertex);
        var v = tempWorldVertex;
        if     (v.x < minx || minx===undefined){
            minx = v.x;
        } else if(v.x > maxx || maxx===undefined){
            maxx = v.x;
        }

        if     (v.y < miny || miny===undefined){
            miny = v.y;
        } else if(v.y > maxy || maxy===undefined){
            maxy = v.y;
        }

        if     (v.z < minz || minz===undefined){
            minz = v.z;
        } else if(v.z > maxz || maxz===undefined){
            maxz = v.z;
        }
    }
    min.set(minx,miny,minz);
    max.set(maxx,maxy,maxz);
};

// Just approximate volume!
CANNON.ConvexPolyhedron.prototype.volume = function(){
    if(this.boundingSphereRadiusNeedsUpdate){
        this.computeBoundingSphereRadius();
    }
    return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
};

// Get an average of all the vertices
CANNON.ConvexPolyhedron.prototype.getAveragePointLocal = function(target){
    target = target || new CANNON.Vec3();
    var n = this.vertices.length,
        verts = this.vertices;
    for(var i=0; i<n; i++){
        target.vadd(verts[i],target);
    }
    target.mult(1/n,target);
    return target;
};

// Transforms all points
CANNON.ConvexPolyhedron.prototype.transformAllPoints = function(offset,quat){
    var n = this.vertices.length,
        verts = this.vertices;

    // Apply rotation
    if(quat){
        // Rotate vertices
        for(var i=0; i<n; i++){
            var v = verts[i];
            quat.vmult(v,v);
        }
        // Rotate face normals
        for(var i=0; i<this.faceNormals.length; i++){
            var v = this.faceNormals[i];
            quat.vmult(v,v);
        }
        /*
        // Rotate edges
        for(var i=0; i<this.uniqueEdges.length; i++){
            var v = this.uniqueEdges[i];
            quat.vmult(v,v);
        }*/
    }

    // Apply offset
    if(offset){
        for(var i=0; i<n; i++){
            var v = verts[i];
            v.vadd(offset,v);
        }
    }
};

// Checks whether p is inside the polyhedra. Must be in local coords.
// The point lies outside of the convex hull of the other points
// if and only if the direction of all the vectors from it to those
// other points are on less than one half of a sphere around it.
var ConvexPolyhedron_pointIsInside = new CANNON.Vec3();
var ConvexPolyhedron_vToP = new CANNON.Vec3();
var ConvexPolyhedron_vToPointInside = new CANNON.Vec3();
CANNON.ConvexPolyhedron.prototype.pointIsInside = function(p){
    var n = this.vertices.length,
        verts = this.vertices,
        faces = this.faces,
        normals = this.faceNormals;
    var positiveResult = null;
    var N = this.faces.length;
    var pointInside = ConvexPolyhedron_pointIsInside;
    this.getAveragePointLocal(pointInside);
    for(var i=0; i<N; i++){
        var numVertices = this.faces[i].length;
        var n = normals[i];
        var v = verts[faces[i][0]]; // We only need one point in the face

        // This dot product determines which side of the edge the point is
        var vToP = ConvexPolyhedron_vToP;
        p.vsub(v,vToP);
        var r1 = n.dot(vToP);

        var vToPointInside = ConvexPolyhedron_vToPointInside;
        pointInside.vsub(v,vToPointInside);
        var r2 = n.dot(vToPointInside);

        if((r1<0 && r2>0) || (r1>0 && r2<0)){
            return false; // Encountered some other sign. Exit.
        } else {
        }
    }

    // If we got here, all dot products were of the same sign.
    return positiveResult ? 1 : -1;
};


function pointInConvex(p){
}

/**
 * @class CANNON.Cylinder
 * @extends CANNON.ConvexPolyhedron
 * @author schteppe / https://github.com/schteppe
 * @param float radiusTop
 * @param float radiusBottom
 * @param float height
 * @param int numSegments The number of segments to build the cylinder out of
 */
CANNON.Cylinder = function( radiusTop, radiusBottom, height , numSegments ) {
    var N = numSegments,
        verts = [],
        normals = [],
        faces = [],
        bottomface = [],
        topface = [],
        cos = Math.cos,
        sin = Math.sin;

    // First bottom point
    verts.push(new CANNON.Vec3(radiusBottom*cos(0),
                               radiusBottom*sin(0),
                               -height*0.5));
    bottomface.push(0);

    // First top point
    verts.push(new CANNON.Vec3(radiusTop*cos(0),
                               radiusTop*sin(0),
                               height*0.5));
    topface.push(1);

    for(var i=0; i<N; i++){
        var theta = 2*Math.PI/N * (i+1);
        var thetaN = 2*Math.PI/N * (i+0.5);
        if(i<N-1){
            // Bottom
            verts.push(new CANNON.Vec3(radiusBottom*cos(theta),
                                       radiusBottom*sin(theta),
                                       -height*0.5));
            bottomface.push(2*i+2);
            // Top
            verts.push(new CANNON.Vec3(radiusTop*cos(theta),
                                       radiusTop*sin(theta),
                                       height*0.5));
            topface.push(2*i+3);
            // Normal
            normals.push(new CANNON.Vec3(cos(thetaN),
                                         sin(thetaN),
                                         0));
            // Face
            faces.push([2*i+2, 2*i+3, 2*i+1,2*i]);
        } else {
            faces.push([0,1, 2*i+1, 2*i]); // Connect
            // Normal
            normals.push(new CANNON.Vec3(cos(thetaN),sin(thetaN),0));
        }
    }
    faces.push(topface);
    normals.push(new CANNON.Vec3(0,0,1));

    // Reorder bottom face
    var temp = [];
    for(var i=0; i<bottomface.length; i++){
        temp.push(bottomface[bottomface.length - i - 1]);
    }
    faces.push(temp);
    normals.push(new CANNON.Vec3(0,0,-1));

    this.type = CANNON.Shape.types.CONVEXPOLYHEDRON;
    CANNON.ConvexPolyhedron.call( this, verts, faces, normals );
};

CANNON.Cylinder.prototype = new CANNON.ConvexPolyhedron();

/**
 * @class CANNON.Ray
 * @author Originally written by mr.doob / http://mrdoob.com/ for Three.js. Cannon.js-ified by schteppe.
 * @brief A line in 3D space that intersects bodies and return points.
 * @param CANNON.Vec3 origin
 * @param CANNON.Vec3 direction
 */
CANNON.Ray = function(origin, direction){
    /**
    * @property CANNON.Vec3 origin
    * @memberof CANNON.Ray
    */
    this.origin = origin || new CANNON.Vec3();

    /**
    * @property CANNON.Vec3 direction
    * @memberof CANNON.Ray
    */
    this.direction = direction || new CANNON.Vec3();

    var precision = 0.0001;

    /**
     * @method setPrecision
     * @memberof CANNON.Ray
     * @param float value
     * @brief Sets the precision of the ray. Used when checking parallelity etc.
     */
    this.setPrecision = function ( value ) {
        precision = value;
    };

    var a = new CANNON.Vec3();
    var b = new CANNON.Vec3();
    var c = new CANNON.Vec3();
    var d = new CANNON.Vec3();

    var directionCopy = new CANNON.Vec3();

    var vector = new CANNON.Vec3();
    var normal = new CANNON.Vec3();
    var intersectPoint = new CANNON.Vec3();

    /**
     * @method intersectBody
     * @memberof CANNON.Ray
     * @param CANNON.RigidBody body
     * @brief Shoot a ray at a body, get back information about the hit.
     * @return Array An array of results. The result objects has properties: distance (float), point (CANNON.Vec3) and body (CANNON.RigidBody).
     */
    this.intersectBody = function ( body ) {
        if(body.shape instanceof CANNON.ConvexPolyhedron){
            return this.intersectShape(body.shape,
                                       body.quaternion,
                                       body.position,
                                       body);
        } else if(body.shape instanceof CANNON.Box){
            return this.intersectShape(body.shape.convexPolyhedronRepresentation,
                                       body.quaternion,
                                       body.position,
                                       body);
        } else {
            console.warn("Ray intersection is this far only implemented for ConvexPolyhedron and Box shapes.");
        }
    };

    /**
     * @method intersectShape
     * @memberof CANNON.Ray
     * @param CANNON.Shape shape
     * @param CANNON.Quaternion quat
     * @param CANNON.Vec3 position
     * @param CANNON.RigidBody body
     * @return Array See intersectBody()
     */
    this.intersectShape = function(shape,quat,position,body){

        var intersect, intersects = [];

        if ( shape instanceof CANNON.ConvexPolyhedron ) {
            // Checking boundingSphere

            var distance = distanceFromIntersection( this.origin, this.direction, position );
            if ( distance > shape.getBoundingSphereRadius() ) {
                return intersects;
            }

            // Checking faces
            var dot, scalar, faces = shape.faces, vertices = shape.vertices, normals = shape.faceNormals;


            for (var fi = 0; fi < faces.length; fi++ ) {

                var face = faces[ fi ];
                var faceNormal = normals[ fi ];
                var q = quat;
                var x = position;

                // determine if ray intersects the plane of the face
                // note: this works regardless of the direction of the face normal

                // Get plane point in world coordinates...
                vertices[face[0]].copy(vector);
                q.vmult(vector,vector);
                vector.vadd(x,vector);

                // ...but make it relative to the ray origin. We'll fix this later.
                vector.vsub(this.origin,vector);

                // Get plane normal
                q.vmult(faceNormal,normal);

                // If this dot product is negative, we have something interesting
                dot = this.direction.dot(normal);

                // bail if ray and plane are parallel
                if ( Math.abs( dot ) < precision ){
                    continue;
                }

                // calc distance to plane
                scalar = normal.dot( vector ) / dot;

                // if negative distance, then plane is behind ray
                if ( scalar < 0 ){
                    continue;
                }

                if (  dot < 0 ) {

                    // Intersection point is origin + direction * scalar
                    this.direction.mult(scalar,intersectPoint);
                    intersectPoint.vadd(this.origin,intersectPoint);

                    // a is the point we compare points b and c with.
                    vertices[ face[0] ].copy(a);
                    q.vmult(a,a);
                    x.vadd(a,a);

                    for(var i=1; i<face.length-1; i++){
                        // Transform 3 vertices to world coords
                        vertices[ face[i] ].copy(b);
                        vertices[ face[i+1] ].copy(c);
                        q.vmult(b,b);
                        q.vmult(c,c);
                        x.vadd(b,b);
                        x.vadd(c,c);

                        if ( pointInTriangle( intersectPoint, a, b, c ) ) {

                            intersect = {
                                distance: this.origin.distanceTo( intersectPoint ),
                                point: intersectPoint.copy(),
                                face: face,
                                body: body
                            };

                            intersects.push( intersect );
                            break;
                        }
                    }
                }
            }
        }
        return intersects;
    };

    /**
     * @method intersectBodies
     * @memberof CANNON.Ray
     * @param Array bodies An array of CANNON.RigidBody objects.
     * @return Array See intersectBody
     */
    this.intersectBodies = function ( bodies ) {

        var intersects = [];

        for ( var i = 0, l = bodies.length; i < l; i ++ ) {
            var result = this.intersectBody( bodies[ i ] );
            Array.prototype.push.apply( intersects, result );
        }

        intersects.sort( function ( a, b ) { return a.distance - b.distance; } );
        return intersects;
    };

    var v0 = new CANNON.Vec3(), intersect = new CANNON.Vec3();
    var dot, distance;

    function distanceFromIntersection( origin, direction, position ) {

        // v0 is vector from origin to position
        position.vsub(origin,v0);
        dot = v0.dot( direction );

        // intersect = direction*dot + origin
        direction.mult(dot,intersect);
        intersect.vadd(origin,intersect);

        distance = position.distanceTo( intersect );

        return distance;
    }

    // http://www.blackpawn.com/texts/pointinpoly/default.html

    var dot00, dot01, dot02, dot11, dot12, invDenom, u, v;
    var v1 = new CANNON.Vec3(), v2 = new CANNON.Vec3();

    function pointInTriangle( p, a, b, c ) {
        c.vsub(a,v0);
        b.vsub(a,v1);
        p.vsub(a,v2);

        dot00 = v0.dot( v0 );
        dot01 = v0.dot( v1 );
        dot02 = v0.dot( v2 );
        dot11 = v1.dot( v1 );
        dot12 = v1.dot( v2 );

        invDenom = 1 / ( dot00 * dot11 - dot01 * dot01 );
        u = ( dot11 * dot02 - dot01 * dot12 ) * invDenom;
        v = ( dot00 * dot12 - dot01 * dot02 ) * invDenom;

        return ( u >= 0 ) && ( v >= 0 ) && ( u + v < 1 );
    }
};
CANNON.Ray.prototype.constructor = CANNON.Ray;


/**
 * @class CANNON.Broadphase
 * @author schteppe
 * @brief Base class for broadphase implementations
 */
CANNON.Broadphase = function(){
    /**
    * @property CANNON.World world
    * @brief The world to search for collisions in.
    * @memberof CANNON.Broadphase
    */
    this.world = null;

    /**
     * If set to true, the broadphase uses bounding boxes for intersection test, else it uses bounding spheres.
     * @property bool useBoundingBoxes
     * @memberof CANNON.Broadphase
     */
    this.useBoundingBoxes = false;
};
CANNON.Broadphase.prototype.constructor = CANNON.BroadPhase;

/**
 * @method collisionPairs
 * @memberof CANNON.Broadphase
 * @brief Get the collision pairs from the world
 * @param CANNON.World world The world to search in
 * @param Array p1 Empty array to be filled with body objects
 * @param Array p2 Empty array to be filled with body objects
 * @return array An array with two subarrays of body indices
 */
CANNON.Broadphase.prototype.collisionPairs = function(world,p1,p2){
    throw new Error("collisionPairs not implemented for this BroadPhase class!");
};

/**
 * @method needBroadphaseCollision
 * @memberof CANNON.Broadphase
 * @brief Check if a body pair needs to be intersection tested at all.
 * @param CANNON.Body bodyA
 * @param CANNON.Body bodyB
 * @return bool
 */
var Broadphase_needBroadphaseCollision_STATIC_OR_KINEMATIC = CANNON.Body.STATIC | CANNON.Body.KINEMATIC;
CANNON.Broadphase.prototype.needBroadphaseCollision = function(bodyA,bodyB){

    // Check collision filter masks
    if( (bodyA.collisionFilterGroup & bodyB.collisionFilterMask)===0 || (bodyB.collisionFilterGroup & bodyA.collisionFilterMask)===0){
        return false;
    }

    // Check motionstate
    if(((bodyA.motionstate & Broadphase_needBroadphaseCollision_STATIC_OR_KINEMATIC)!==0 || bodyA.isSleeping()) &&
       ((bodyB.motionstate & Broadphase_needBroadphaseCollision_STATIC_OR_KINEMATIC)!==0 || bodyB.isSleeping())) {
        // Both bodies are static, kinematic or sleeping. Skip.
        return false;
    }

    // Two particles don't collide
    if(!bodyA.shape && !bodyB.shape){
        return false;
    }

    // Two planes don't collide
    if(bodyA.shape instanceof CANNON.Plane && bodyB.shape instanceof CANNON.Plane){
        return false;
    }

    return true;
};

/**
 * @method intersectionTest
 * @memberof CANNON.Broadphase
 * @brief Check if a body pair needs to be intersection tested at all.
 * @param CANNON.Body bodyA
 * @param CANNON.Body bodyB
 * @return bool
 */
CANNON.Broadphase.prototype.intersectionTest = function(bi,bj,pairs1,pairs2){
    if(this.useBoundingBoxes){
        this.doBoundingBoxBroadphase(bi,bj,pairs1,pairs2);
    } else {
        this.doBoundingSphereBroadphase(bi,bj,pairs1,pairs2);
    }
};

/**
 * @method doBoundingSphereBroadphase
 * @memberof CANNON.Broadphase
 * @brief Check if the bounding spheres of two bodies are intersecting.
 * @param CANNON.Body bi
 * @param CANNON.Body bj
 * @param Array pairs1 bi is appended to this array if intersection
 * @param Array pairs2 bj is appended to this array if intersection
 */
var Broadphase_collisionPairs_r = new CANNON.Vec3(), // Temp objects
    Broadphase_collisionPairs_normal =  new CANNON.Vec3(),
    Broadphase_collisionPairs_quat =  new CANNON.Quaternion(),
    Broadphase_collisionPairs_relpos  =  new CANNON.Vec3();
CANNON.Broadphase.prototype.doBoundingSphereBroadphase = function(bi,bj,pairs1,pairs2){

    // Local fast access
    var types = CANNON.Shape.types,
        BOX_SPHERE_COMPOUND_CONVEX = types.SPHERE | types.BOX | types.COMPOUND | types.CONVEXPOLYHEDRON,
        PLANE = types.PLANE,
        STATIC_OR_KINEMATIC = CANNON.Body.STATIC | CANNON.Body.KINEMATIC;

    // Temp vecs
    var r = Broadphase_collisionPairs_r,
        normal = Broadphase_collisionPairs_normal,
        quat = Broadphase_collisionPairs_quat,
        relpos = Broadphase_collisionPairs_relpos;

    var bishape = bi.shape, bjshape = bj.shape;
    if(bishape && bjshape){
        var ti = bishape.type, tj = bjshape.type;

        // --- Box / sphere / compound / convexpolyhedron collision ---
        if((ti & BOX_SPHERE_COMPOUND_CONVEX) && (tj & BOX_SPHERE_COMPOUND_CONVEX)){
            // Rel. position
            bj.position.vsub(bi.position,r);

            // Update bounding spheres if needed
            if(bishape.boundingSphereRadiusNeedsUpdate){
                bishape.computeBoundingSphereRadius();
            }
            if(bjshape.boundingSphereRadiusNeedsUpdate){
                bjshape.computeBoundingSphereRadius();
            }

            var boundingRadiusSum = bishape.boundingSphereRadius + bjshape.boundingSphereRadius;
            if(r.norm2() < boundingRadiusSum*boundingRadiusSum){
                pairs1.push(bi);
                pairs2.push(bj);
            }

            // --- Sphere/box/compound/convexpoly versus plane ---
        } else if((ti & BOX_SPHERE_COMPOUND_CONVEX) && (tj & types.PLANE) || (tj & BOX_SPHERE_COMPOUND_CONVEX) && (ti & types.PLANE)){
            var planeBody = (ti===PLANE) ? bi : bj, // Plane
                otherBody = (ti!==PLANE) ? bi : bj; // Other

            var otherShape = otherBody.shape;
            var planeShape = planeBody.shape;

            // Rel. position
            otherBody.position.vsub(planeBody.position,r);

            if(planeShape.worldNormalNeedsUpdate){
                planeShape.computeWorldNormal(planeBody.quaternion);
            }

            normal = planeShape.worldNormal;

            if(otherShape.boundingSphereRadiusNeedsUpdate){
                otherShape.computeBoundingSphereRadius();
            }

            var q = r.dot(normal) - otherShape.boundingSphereRadius;
            if(q < 0.0){
                pairs1.push(bi);
                pairs2.push(bj);
            }
        }
    } else {
        // Particle without shape
        if(!bishape && !bjshape){
            // No collisions between 2 particles
        } else {
            var particle = bishape ? bj : bi;
            var other = bishape ? bi : bj;
            var otherShape = other.shape;
            var type = otherShape.type;

            if(type & BOX_SPHERE_COMPOUND_CONVEX){
                if(type === types.SPHERE){ // particle-sphere
                    particle.position.vsub(other.position,relpos);
                    if(otherShape.radius*otherShape.radius >= relpos.norm2()){
                        pairs1.push(particle);
                        pairs2.push(other);
                    }
                } else if(type===types.CONVEXPOLYHEDRON || type===types.BOX || type===types.COMPOUND){

                    if(otherShape.boundingSphereRadiusNeedsUpdate){
                        otherShape.computeBoundingSphereRadius();
                    }
                    var R = otherShape.boundingSphereRadius;
                    particle.position.vsub(other.position,relpos);
                    if(R*R >= relpos.norm2()){
                        pairs1.push(particle);
                        pairs2.push(other);
                    }
                }
            } else if(type === types.PLANE){
                // particle/plane
                var plane = other;
                normal.set(0,0,1);
                plane.quaternion.vmult(normal,normal);
                particle.position.vsub(plane.position,relpos);
                if(normal.dot(relpos)<=0.0){
                    pairs1.push(particle);
                    pairs2.push(other);
                }
            }
        }
    }
};

/**
 * @method doBoundingBoxBroadphase
 * @memberof CANNON.Broadphase
 * @brief Check if the bounding boxes of two bodies are intersecting.
 * @param CANNON.Body bi
 * @param CANNON.Body bj
 * @param Array pairs1
 * @param Array pairs2
 */
CANNON.Broadphase.prototype.doBoundingBoxBroadphase = function(bi,bj,pairs1,pairs2){
    var bishape = bi.shape,
        bjshape = bj.shape;

    if(bi.aabbNeedsUpdate){
        bi.computeAABB();
    }
    if(bj.aabbNeedsUpdate){
        bj.computeAABB();
    }

    if(bishape && bjshape){
        // Check AABB / AABB
        if( !(  bi.aabbmax.x < bj.aabbmin.x ||
                bi.aabbmax.y < bj.aabbmin.y ||
                bi.aabbmax.z < bj.aabbmin.z ||
                bi.aabbmin.x > bj.aabbmax.x ||
                bi.aabbmin.y > bj.aabbmax.y ||
                bi.aabbmin.z > bj.aabbmax.z   ) ){
            pairs1.push(bi);
            pairs2.push(bj);
        }
    } else {
        // Particle without shape
        if(!bishape && !bjshape){
            // No collisions between 2 particles
        } else {
            // particle vs AABB
            var p =      !bishape ? bi : bj;
            var other =  !bishape ? bj : bi;

            if(other.shape instanceof CANNON.Plane){
                //console.log(p.position.z+"<"+other.aabbmin.z+" = ",p.position.z < other.aabbmin.z);
            }

            if( !(  p.position.x < other.aabbmin.x ||
                    p.position.y < other.aabbmin.y ||
                    p.position.z < other.aabbmin.z ||
                    p.position.x > other.aabbmax.x ||
                    p.position.y > other.aabbmax.y ||
                    p.position.z > other.aabbmax.z   ) ){
                pairs1.push(bi);
                pairs2.push(bj);
            }
        }
    }
};

/**
 * @method makePairsUnique
 * @memberof CANNON.Broadphase
 * @brief Removes duplicate pairs from the pair arrays.
 * @param Array pairs1
 * @param Array pairs2
 */
var Broadphase_makePairsUnique_temp = {},
    Broadphase_makePairsUnique_p1 = [],
    Broadphase_makePairsUnique_p2 = [];
CANNON.Broadphase.prototype.makePairsUnique = function(pairs1,pairs2){
    var t = Broadphase_makePairsUnique_temp,
        p1 = Broadphase_makePairsUnique_p1,
        p2 = Broadphase_makePairsUnique_p2,
        N = pairs1.length;

    for(var i=0; i!==N; i++){
        p1[i] = pairs1[i];
        p2[i] = pairs2[i];
    }

    pairs1.length = 0;
    pairs2.length = 0;

    for(var i=0; i!==N; i++){
        var id1 = p1[i].id,
            id2 = p2[i].id;
        var idx = id1 < id2 ? id1+","+id2 :  id2+","+id1;
        t[idx] = i;
    }

    for(var idx in t){
        var i = t[idx];
        pairs1.push(p1[i]);
        pairs2.push(p2[i]);
        delete t[idx];
    }
};


/**
 * @class CANNON.NaiveBroadphase
 * @brief Naive broadphase implementation, used in lack of better ones.
 * @description The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 (which is bad)
 * @extends CANNON.Broadphase
 */
CANNON.NaiveBroadphase = function(){
    CANNON.Broadphase.apply(this);
};
CANNON.NaiveBroadphase.prototype = new CANNON.Broadphase();
CANNON.NaiveBroadphase.prototype.constructor = CANNON.NaiveBroadphase;

/**
 * @method collisionPairs
 * @memberof CANNON.NaiveBroadphase
 * @brief Get all the collision pairs in the physics world
 * @param CANNON.World world
 * @param Array pairs1
 * @param Array pairs2
 */
CANNON.NaiveBroadphase.prototype.collisionPairs = function(world,pairs1,pairs2){
    var bodies = world.bodies,
        n = bodies.length,
        i,j,bi,bj;

    // Naive N^2 ftw!
    for(i=0; i!==n; i++){
        for(j=0; j!==i; j++){

            bi = bodies[i];
            bj = bodies[j];

            if(!this.needBroadphaseCollision(bi,bj)){
                continue;
            }

            this.intersectionTest(bi,bj,pairs1,pairs2);
        }
    }
};


/**
 * @class CANNON.GridBroadphase
 * @brief Axis aligned uniform grid broadphase.
 * @extends CANNON.Broadphase
 * @todo Needs support for more than just planes and spheres.
 * @param CANNON.Vec3 aabbMin
 * @param CANNON.Vec3 aabbMax
 * @param int nx Number of boxes along x
 * @param int ny Number of boxes along y
 * @param int nz Number of boxes along z
 */
CANNON.GridBroadphase = function(aabbMin,aabbMax,nx,ny,nz){
    CANNON.Broadphase.apply(this);
    this.nx = nx || 10;
    this.ny = ny || 10;
    this.nz = nz || 10;
    this.aabbMin = aabbMin || new CANNON.Vec3(100,100,100);
    this.aabbMax = aabbMax || new CANNON.Vec3(-100,-100,-100);
    this.bins = [];
};
CANNON.GridBroadphase.prototype = new CANNON.Broadphase();
CANNON.GridBroadphase.prototype.constructor = CANNON.GridBroadphase;

/**
 * @method collisionPairs
 * @memberof CANNON.GridBroadphase
 * @brief Get all the collision pairs in the physics world
 * @param CANNON.World world
 * @param Array pairs1
 * @param Array pairs2
 */
var GridBroadphase_collisionPairs_d = new CANNON.Vec3();
var GridBroadphase_collisionPairs_binPos = new CANNON.Vec3();
CANNON.GridBroadphase.prototype.collisionPairs = function(world,pairs1,pairs2){
    var N = world.numObjects(),
        bodies = world.bodies;

    var max = this.aabbMax,
        min = this.aabbMin,
        nx = this.nx,
        ny = this.ny,
        nz = this.nz;

    var xmax = max.x,
        ymax = max.y,
        zmax = max.z,
        xmin = min.x,
        ymin = min.y,
        zmin = min.z;

    var xmult = nx / (xmax-xmin),
        ymult = ny / (ymax-ymin),
        zmult = nz / (zmax-zmin);

    var binsizeX = (xmax - xmin) / nx,
        binsizeY = (ymax - ymin) / ny,
        binsizeZ = (zmax - zmin) / nz;

    var types = CANNON.Shape.types;
    var SPHERE =            types.SPHERE,
        PLANE =             types.PLANE,
        BOX =               types.BOX,
        COMPOUND =          types.COMPOUND,
        CONVEXPOLYHEDRON =  types.CONVEXPOLYHEDRON;

    var bins=this.bins,
        Nbins=nx*ny*nz;

    // Reset bins
    for(var i=bins.length-1; i!==Nbins; i++){
        bins.push([]);
    }
    for(var i=0; i!==Nbins; i++){
        bins[i].length = 0;
    }

    var floor = Math.floor;

    // Put all bodies into the bins
    for(var i=0; i!==N; i++){
        var bi = bodies[i];
        var si = bi.shape;

        switch(si.type){
        case SPHERE:
            // Put in bin
            // check if overlap with other bins
            var x = bi.position.x,
                y = bi.position.y,
                z = bi.position.z;
            var r = si.radius;

            var xi1 = floor(xmult * (x-r - xmin)),
                yi1 = floor(ymult * (y-r - ymin)),
                zi1 = floor(zmult * (z-r - zmin)),
                xi2 = floor(xmult * (x+r - xmin)),
                yi2 = floor(ymult * (y+r - ymin)),
                zi2 = floor(zmult * (z+r - zmin));

            for(var j=xi1; j!==xi2+1; j++){
                for(var k=yi1; k!==yi2+1; k++){
                    for(var l=zi1; l!==zi2+1; l++){
                        var xi = j,
                            yi = k,
                            zi = l;
                        var idx = xi * ( ny - 1 ) * ( nz - 1 ) + yi * ( nz - 1 ) + zi;
                        if(idx >= 0 && idx < Nbins){
                            bins[ idx ].push( bi );
                        }
                    }
                }
            }
            break;

        case PLANE:
            // Put in all bins for now
            // @todo put only in bins that are actually intersecting the plane
            var d = GridBroadphase_collisionPairs_d;
            var binPos = GridBroadphase_collisionPairs_binPos;
            var binRadiusSquared = (binsizeX*binsizeX + binsizeY*binsizeY + binsizeZ*binsizeZ) * 0.25;

            var planeNormal = si.worldNormal;
            if(si.worldNormalNeedsUpdate){
                si.computeWorldNormal(bi.quaternion);
            }

            for(var j=0; j!==nx; j++){
                for(var k=0; k!==ny; k++){
                    for(var l=0; l!==nz; l++){
                        var xi = j,
                            yi = k,
                            zi = l;

                        binPos.set(xi*binsizeX+xmin, yi*binsizeY+ymin, zi*binsizeZ+zmin);
                        binPos.vsub(bi.position, d);

                        if(d.dot(planeNormal) < binRadiusSquared){
                            var idx = xi * ( ny - 1 ) * ( nz - 1 ) + yi * ( nz - 1 ) + zi;
                            bins[ idx ].push( bi );
                        }
                    }
                }
            }
            break;

        default:
            console.warn("Shape "+si.type+" not supported in GridBroadphase!");
            break;
        }
    }

    // Check each bin
    for(var i=0; i!==Nbins; i++){
        var bin = bins[i];

        // Do N^2 broadphase inside
        for(var j=0, NbodiesInBin=bin.length; j!==NbodiesInBin; j++){
            var bi = bin[j];

            for(var k=0; k!==j; k++){
                var bj = bin[k];
                if(this.needBroadphaseCollision(bi,bj)){
                    this.intersectionTest(bi,bj,pairs1,pairs2);
                }
            }
        }
    }

    this.makePairsUnique(pairs1,pairs2);
};


/**
 * @class CANNON.Solver
 * @brief Constraint equation solver base class.
 * @author schteppe / https://github.com/schteppe
 */
CANNON.Solver = function(){
    // All equations to be solved
    this.equations = [];
};

// Should be implemented in subclasses!
CANNON.Solver.prototype.solve = function(dt,world){
    // Should return the number of iterations done!
    return 0;
};

CANNON.Solver.prototype.addEquation = function(eq){
    this.equations.push(eq);
};

CANNON.Solver.prototype.removeEquation = function(eq){
    var eqs = this.equations;
    var i = eqs.indexOf(eq);
    if(i !== -1){
        eqs.splice(i,1);
    }
};

CANNON.Solver.prototype.removeAllEquations = function(){
    this.equations.length = 0;
};



/**
 * @class CANNON.Solver
 * @brief Constraint equation Gauss-Seidel solver.
 * @todo The spook parameters should be specified for each constraint, not globally.
 * @author schteppe / https://github.com/schteppe
 * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
 * @extends CANNON.Solver
 */
CANNON.GSSolver = function(){
    CANNON.Solver.call(this);

    /**
    * @property int iterations
    * @brief The number of solver iterations determines quality of the constraints in the world. The more iterations, the more correct simulation. More iterations need more computations though. If you have a large gravity force in your world, you will need more iterations.
    * @todo write more about solver and iterations in the wiki
    * @memberof CANNON.GSSolver
    */
    this.iterations = 10;

    /**
     * When tolerance is reached, the system is assumed to be converged.
     * @property float tolerance
     */
    this.tolerance = 0;
};
CANNON.GSSolver.prototype = new CANNON.Solver();

var GSSolver_solve_lambda = []; // Just temporary number holders that we want to reuse each solve.
var GSSolver_solve_invCs = [];
var GSSolver_solve_Bs = [];
CANNON.GSSolver.prototype.solve = function(dt,world){
    var d = this.d,
        ks = this.k,
        iter = 0,
        maxIter = this.iterations,
        tolSquared = this.tolerance*this.tolerance,
        a = this.a,
        b = this.b,
        equations = this.equations,
        Neq = equations.length,
        bodies = world.bodies,
        Nbodies = bodies.length,
        h = dt,
        q, B, invC, deltalambda, deltalambdaTot, GWlambda, lambdaj;

    // Things that does not change during iteration can be computed once
    var invCs = GSSolver_solve_invCs,
        Bs = GSSolver_solve_Bs,
        lambda = GSSolver_solve_lambda;
    invCs.length = 0;
    Bs.length = 0;
    lambda.length = 0;
    for(var i=0; i!==Neq; i++){
        var c = equations[i];
        if(c.spookParamsNeedsUpdate){
            c.updateSpookParams(h);
            c.spookParamsNeedsUpdate = false;
        }
        lambda[i] = 0.0;
        Bs[i] = c.computeB(h);
        invCs[i] = 1.0 / c.computeC();
    }


    if(Neq !== 0){

        // Reset vlambda
        for(var i=0; i!==Nbodies; i++){
            var b=bodies[i],
                vlambda=b.vlambda,
                wlambda=b.wlambda;
            vlambda.set(0,0,0);
            if(wlambda){
                wlambda.set(0,0,0);
            }
        }

        // Iterate over equations
        for(iter=0; iter!==maxIter; iter++){

            // Accumulate the total error for each iteration.
            deltalambdaTot = 0.0;

            for(var j=0; j!==Neq; j++){

                var c = equations[j];

                // Compute iteration
                B = Bs[j];
                invC = invCs[j];
                lambdaj = lambda[j];
                GWlambda = c.computeGWlambda();
                deltalambda = invC * ( B - GWlambda - c.eps * lambdaj );

                // Clamp if we are not within the min/max interval
                if(lambdaj + deltalambda < c.minForce){
                    deltalambda = c.minForce - lambdaj;
                } else if(lambdaj + deltalambda > c.maxForce){
                    deltalambda = c.maxForce - lambdaj;
                }
                lambda[j] += deltalambda;

                deltalambdaTot += deltalambda > 0.0 ? deltalambda : -deltalambda; // abs(deltalambda)

                c.addToWlambda(deltalambda);
            }

            // If the total error is small enough - stop iterate
            if(deltalambdaTot*deltalambdaTot < tolSquared){
                break;
            }
        }

        // Add result to velocity
        for(var i=0; i!==Nbodies; i++){
            var b=bodies[i],
                v=b.velocity,
                w=b.angularVelocity;
            v.vadd(b.vlambda, v);
            if(w){
                w.vadd(b.wlambda, w);
            }
        }
    }

    return iter;
};


CANNON.SplitSolver = function(subsolver){
    CANNON.Solver.call(this);
    this.subsolver = subsolver;
};
CANNON.SplitSolver.prototype = new CANNON.Solver();

// Returns the number of subsystems
var SplitSolver_solve_nodes = []; // All allocated node objects
var SplitSolver_solve_eqs = [];   // Temp array
var SplitSolver_solve_bds = [];   // Temp array
var SplitSolver_solve_dummyWorld = {bodies:null}; // Temp object
CANNON.SplitSolver.prototype.solve = function(dt,world){
    var nodes=SplitSolver_solve_nodes,
        bodies=world.bodies,
        equations=this.equations,
        Neq=equations.length,
        Nbodies=bodies.length,
        subsolver=this.subsolver;
    // Create needed nodes, reuse if possible
    for(var i=nodes.length; i!==Nbodies; i++){
        nodes.push({ body:bodies[i], children:[], eqs:[], visited:false });
    }

    // Reset node values
    for(var i=0; i!==Nbodies; i++){
        var node = nodes[i];
        node.body = bodies[i];
        node.children.length = 0;
        node.eqs.length = 0;
        node.visited = false;
    }
    for(var k=0; k!==Neq; k++){
        var eq=equations[k],
            i=bodies.indexOf(eq.bi),
            j=bodies.indexOf(eq.bj),
            ni=nodes[i],
            nj=nodes[j];
        ni.children.push(nj);
        ni.eqs.push(eq);
        nj.children.push(ni);
        nj.eqs.push(eq);
    }

    var STATIC = CANNON.Body.STATIC;
    function getUnvisitedNode(nodes){
        var Nnodes = nodes.length;
        for(var i=0; i!==Nnodes; i++){
            var node = nodes[i];
            if(!node.visited && !(node.body.motionstate & STATIC)){
                return node;
            }
        }
        return false;
    }

    function bfs(root,visitFunc){
        var queue = [];
        queue.push(root);
        root.visited = true;
        visitFunc(root);
        while(queue.length) {
            var node = queue.pop();
            // Loop over unvisited child nodes
            var child;
            while((child = getUnvisitedNode(node.children))) {
                child.visited = true;
                visitFunc(child);
                queue.push(child);
            }
        }
    }

    var child, n=0, eqs=SplitSolver_solve_eqs, bds=SplitSolver_solve_bds;
    function visitFunc(node){
        bds.push(node.body);
        var Neqs = node.eqs.length;
        for(var i=0; i!==Neqs; i++){
            var eq = node.eqs[i];
            if(eqs.indexOf(eq) === -1){
                eqs.push(eq);
            }
        }
    }
    var dummyWorld = SplitSolver_solve_dummyWorld;
    while((child = getUnvisitedNode(nodes))){
        eqs.length = 0;
        bds.length = 0;
        bfs(child,visitFunc);

        var Neqs = eqs.length;
        for(var i=0; i!==Neqs; i++){
            subsolver.addEquation(eqs[i]);
        }

        dummyWorld.bodies = bds;
        var iter = subsolver.solve(dt,dummyWorld);
        subsolver.removeAllEquations();
        n++;
    }

    return n;
};


/**
 * @class CANNON.Material
 * @brief Defines a physics material.
 * @param string name
 * @author schteppe
 */
CANNON.Material = function(name){
    /**
    * @property string name
    * @memberof CANNON.Material
    */
    this.name = name;
    this.id = -1;
};



/**
 * @class CANNON.ContactMaterial
 * @brief Defines what happens when two materials meet.
 * @param CANNON.Material m1
 * @param CANNON.Material m2
 * @param float friction
 * @param float restitution
 * @todo Contact solving parameters here too?
 */
CANNON.ContactMaterial = function(m1, m2, friction, restitution){

    /// Contact material index in the world, -1 until added to the world
    this.id = -1;

    /// The two materials participating in the contact
    this.materials = [m1,m2];

    /// Kinetic friction
    this.friction = friction!==undefined ? Number(friction) : 0.3;

    /// Restitution
    this.restitution =      restitution !== undefined ?      Number(restitution) :      0.3;

    // Parameters to pass to the constraint when it is created
    this.contactEquationStiffness = 1e7;
    this.contactEquationRegularizationTime = 3;
    this.frictionEquationStiffness = 1e7;
    this.frictionEquationRegularizationTime = 3;
};



/**
 * @class CANNON.World
 * @brief The physics world
 */
CANNON.World = function(){

    CANNON.EventTarget.apply(this);

    /**
     * @property bool allowSleep
     * @brief Makes bodies go to sleep when they've been inactive
     * @memberof CANNON.World
     */
    this.allowSleep = false;

    /**
     * @property Array contacts
     * @brief All the current contacts (instances of CANNON.ContactEquation) in the world.
     * @memberof CANNON.World
     */
    this.contacts = [];
    this.frictionEquations = [];

    /**
     * @property int quatNormalizeSkip
     * @brief How often to normalize quaternions. Set to 0 for every step, 1 for every second etc.. A larger value increases performance. If bodies tend to explode, set to a smaller value (zero to be sure nothing can go wrong).
     * @memberof CANNON.World
     */
    this.quatNormalizeSkip = 0;

    /**
     * @property bool quatNormalizeFast
     * @brief Set to true to use fast quaternion normalization. It is often enough accurate to use. If bodies tend to explode, set to false.
     * @memberof CANNON.World
     * @see CANNON.Quaternion.normalizeFast
     * @see CANNON.Quaternion.normalize
     */
    this.quatNormalizeFast = false;

    /**
     * @property float time
     * @brief The wall-clock time since simulation start
     * @memberof CANNON.World
     */
    this.time = 0.0;

    /**
     * @property int stepnumber
     * @brief Number of timesteps taken since start
     * @memberof CANNON.World
     */
    this.stepnumber = 0;

    /// Default and last timestep sizes
    this.default_dt = 1/60;
    this.last_dt = this.default_dt;

    this.nextId = 0;
    /**
     * @property CANNON.Vec3 gravity
     * @memberof CANNON.World
     */
    this.gravity = new CANNON.Vec3();

    /**
     * @property CANNON.Broadphase broadphase
     * @memberof CANNON.World
     */
    this.broadphase = null;

    /**
     * @property Array bodies
     * @memberof CANNON.World
     */
    this.bodies = [];

    var th = this;

    /**
     * @property CANNON.Solver solver
     * @memberof CANNON.World
     */
    this.solver = new CANNON.GSSolver();

    /**
     * @property Array constraints
     * @memberof CANNON.World
     */
    this.constraints = [];

    /**
     * @property CANNON.ContactGenerator contactgen
     * @memberof CANNON.World
     */
    this.contactgen = new CANNON.ContactGenerator();

    /** @property Collision "matrix", size (Nbodies * (Nbodies.length + 1))/2 
	 *  @brief It's actually a triangular-shaped array of whether two bodies are touching this step, for reference next step
	 *  @memberof CANNON.World
	 */
	this.collisionMatrix = [];
    /** @property Collision "matrix", size (Nbodies * (Nbodies.length + 1))/2 
	 *  @brief collisionMatrix from the previous step
	 *  @memberof CANNON.World
	 */
	this.collisionMatrixPrevious = [];

    /**
     * @property Array materials
     * @memberof CANNON.World
     */
    this.materials = []; // References to all added materials

    /**
     * @property Array contactmaterials
     * @memberof CANNON.World
     */
    this.contactmaterials = []; // All added contact materials

    this.mats2cmat = []; // Hash: (mat1_id, mat2_id) => contactmat_id

    this.defaultMaterial = new CANNON.Material("default");

    /**
     * @property CANNON.ContactMaterial defaultContactMaterial
     * @brief This contact material is used if no suitable contactmaterial is found for a contact.
     * @memberof CANNON.World
     */
    this.defaultContactMaterial = new CANNON.ContactMaterial(this.defaultMaterial,this.defaultMaterial,0.3,0.0);

    /**
     * @property bool doProfiling
     * @memberof CANNON.World
     */
    this.doProfiling = false;

    /**
     * @property Object profile
     * @memberof CANNON.World
     */
    this.profile = {
        solve:0,
        makeContactConstraints:0,
        broadphase:0,
        integrate:0,
        nearphase:0,
    };

    /**
     * @property Array subystems
     * @memberof CANNON.World
     */
    this.subsystems = [];
};

/**
 * @method getContactMaterial
 * @memberof CANNON.World
 * @brief Get the contact material between materials m1 and m2
 * @param CANNON.Material m1
 * @param CANNON.Material m2
 * @return CANNON.Contactmaterial The contact material if it was found.
 */
CANNON.World.prototype.getContactMaterial = function(m1,m2){
    if((m1 instanceof CANNON.Material) &&  (m2 instanceof CANNON.Material)){

        var i = m1.id;
        var j = m2.id;

        if(i<j){
            var temp = i;
            i = j;
            j = temp;
        }
        return this.contactmaterials[this.mats2cmat[i+j*this.materials.length]];
    }
};

/**
 * @method numObjects
 * @memberof CANNON.World
 * @brief Get number of objects in the world.
 * @return int
 */
CANNON.World.prototype.numObjects = function(){
    return this.bodies.length;
};

// Keep track of contacts for current and previous timestep
// 0: No contact between i and j
// 1: Contact
CANNON.World.prototype.collisionMatrixGet = function(i,j,current){
    if(j > i){
        var temp = j;
        j = i;
        i = temp;
    }
	// Reuse i for the index
	i = (i*(i + 1)>>1) + j-1;
    return (typeof(current)==="undefined" || current) ? this.collisionMatrix[i] : this.collisionMatrixPrevious[i];
};

CANNON.World.prototype.collisionMatrixSet = function(i,j,value,current){
    if(j > i){
        var temp = j;
        j = i;
        i = temp;
    }
	// Reuse i for the index
	i = (i*(i + 1)>>1) + j-1;
	if (typeof(current)==="undefined" || current) {
		this.collisionMatrix[i] = value;
	}
	else {
		this.collisionMatrixPrevious[i] = value;
	}
};

// transfer old contact state data to T-1
CANNON.World.prototype.collisionMatrixTick = function(){
	var temp = this.collisionMatrixPrevious;
	this.collisionMatrixPrevious = this.collisionMatrix;
	this.collisionMatrix = temp;
	for (var i=0,l=this.collisionMatrix.length;i!==l;i++) {
		this.collisionMatrix[i]=0;
	}
};

/**
 * @method add
 * @memberof CANNON.World
 * @brief Add a rigid body to the simulation.
 * @param CANNON.Body body
 * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
 * @todo Adding an array of bodies should be possible. This would save some loops too
 */
CANNON.World.prototype.add = function(body){
	body.id = this.id();
    body.index = this.bodies.length;
    this.bodies.push(body);
    body.world = this;
    body.position.copy(body.initPosition);
    body.velocity.copy(body.initVelocity);
    body.timeLastSleepy = this.time;
    if(body instanceof CANNON.RigidBody){
        body.angularVelocity.copy(body.initAngularVelocity);
        body.quaternion.copy(body.initQuaternion);
    }

    var n = this.numObjects();
	this.collisionMatrix.length = n*(n-1)>>1;
};

/**
 * @method addConstraint
 * @memberof CANNON.World
 * @brief Add a constraint to the simulation.
 * @param CANNON.Constraint c
 */
CANNON.World.prototype.addConstraint = function(c){
    this.constraints.push(c);
    c.id = this.id();
};

/**
 * @method removeConstraint
 * @memberof CANNON.World
 * @brief Removes a constraint
 * @param CANNON.Constraint c
 */
CANNON.World.prototype.removeConstraint = function(c){
    var idx = this.constraints.indexOf(c);
    if(idx!==-1){
        this.constraints.splice(idx,1);
    }
};

/**
 * @method id
 * @memberof CANNON.World
 * @brief Generate a new unique integer identifyer
 * @return int
 */
CANNON.World.prototype.id = function(){
    return this.nextId++;
};

/**
 * @method remove
 * @memberof CANNON.World
 * @brief Remove a rigid body from the simulation.
 * @param CANNON.Body body
 */
CANNON.World.prototype.remove = function(body){
    body.world = null;
    var n = this.numObjects()-1;
    var bodies = this.bodies;
	bodies.splice(body.index, 1);
	for(var i=body.index; i<n;i++) {
		bodies[i].index=i;
	}
	//TODO: Maybe splice out the correct elements?
	this.collisionMatrixPrevious.length = 
	this.collisionMatrix.length = n*(n-1)>>1;
};

/**
 * @method addMaterial
 * @memberof CANNON.World
 * @brief Adds a material to the World. A material can only be added once, it's added more times then nothing will happen.
 * @param CANNON.Material m
 */
CANNON.World.prototype.addMaterial = function(m){
    if(m.id === -1){
        var n = this.materials.length;
        this.materials.push(m);
        m.id = this.materials.length-1;

        // Increase size of collision matrix to (n+1)*(n+1)=n*n+2*n+1 elements, it was n*n last.
        for(var i=0; i!==2*n+1; i++){
            this.mats2cmat.push(-1);
        }
    }
};

/**
 * @method addContactMaterial
 * @memberof CANNON.World
 * @brief Adds a contact material to the World
 * @param CANNON.ContactMaterial cmat
 */
CANNON.World.prototype.addContactMaterial = function(cmat) {

    // Add materials if they aren't already added
    this.addMaterial(cmat.materials[0]);
    this.addMaterial(cmat.materials[1]);

    // Save (material1,material2) -> (contact material) reference for easy access later
    // Make sure i>j, ie upper right matrix
    var i,j;
    if(cmat.materials[0].id > cmat.materials[1].id){
        i = cmat.materials[0].id;
        j = cmat.materials[1].id;
    } else {
        j = cmat.materials[0].id;
        i = cmat.materials[1].id;
    }

    // Add contact material
    this.contactmaterials.push(cmat);
    cmat.id = this.contactmaterials.length-1;

    // Add current contact material to the material table
    this.mats2cmat[i+this.materials.length*j] = cmat.id; // index of the contact material
};

CANNON.World.prototype._now = function(){
    if(window.performance.webkitNow){
        return window.performance.webkitNow();
    } else {
        return Date.now();
    }
};

/**
 * @method step
 * @memberof CANNON.World
 * @brief Step the simulation
 * @param float dt
 */
var World_step_postStepEvent = {type:"postStep"}, // Reusable event objects to save memory
    World_step_preStepEvent = {type:"preStep"},
    World_step_collideEvent = {type:"collide", "with":null, contact:null },
    World_step_oldContacts = [], // Pools for unused objects
    World_step_frictionEquationPool = [],
    World_step_p1 = [], // Reusable arrays for collision pairs
    World_step_p2 = [],
    World_step_gvec = new CANNON.Vec3(), // Temporary vectors and quats
    World_step_vi = new CANNON.Vec3(),
    World_step_vj = new CANNON.Vec3(),
    World_step_wi = new CANNON.Vec3(),
    World_step_wj = new CANNON.Vec3(),
    World_step_t1 = new CANNON.Vec3(),
    World_step_t2 = new CANNON.Vec3(),
    World_step_rixn = new CANNON.Vec3(),
    World_step_rjxn = new CANNON.Vec3(),
    World_step_step_q = new CANNON.Quaternion(),
    World_step_step_w = new CANNON.Quaternion(),
    World_step_step_wq = new CANNON.Quaternion();
CANNON.World.prototype.step = function(dt){
    var world = this,
        that = this,
        contacts = this.contacts,
        p1 = World_step_p1,
        p2 = World_step_p2,
        N = this.numObjects(),
        bodies = this.bodies,
        solver = this.solver,
        gravity = this.gravity,
        doProfiling = this.doProfiling,
        profile = this.profile,
        DYNAMIC = CANNON.Body.DYNAMIC,
        now = this._now,
        profilingStart,
        constraints = this.constraints,
        FrictionEquation = CANNON.FrictionEquation,
        frictionEquationPool = World_step_frictionEquationPool,
        gnorm = gravity.norm(),
        gx = gravity.x,
        gy = gravity.y,
        gz = gravity.z,
        i=0;


    if(doProfiling){
        profilingStart = now();
    }

    if(dt===undefined){
        dt = this.last_dt || this.default_dt;
    }

    // Add gravity to all objects
    for(i=0; i!==N; i++){
        var bi = bodies[i];
        if(bi.motionstate & DYNAMIC){ // Only for dynamic bodies
            var f = bi.force, m = bi.mass;
            f.x += m*gx;
            f.y += m*gy;
            f.z += m*gz;
        }
    }

    // Update subsystems
    for(var i=0, Nsubsystems=this.subsystems.length; i!==Nsubsystems; i++){
        this.subsystems[i].update();
    }

    // 1. Collision detection
    if(doProfiling){ profilingStart = now(); }
    p1.length = 0; // Clean up pair arrays from last step
    p2.length = 0;
    this.broadphase.collisionPairs(this,p1,p2);
    if(doProfiling){ profile.broadphase = now() - profilingStart; }

    this.collisionMatrixTick();

    // Generate contacts
    if(doProfiling){ profilingStart = now(); }
    var oldcontacts = World_step_oldContacts;
    var NoldContacts = contacts.length;

    for(i=0; i!==NoldContacts; i++){
        oldcontacts.push(contacts[i]);
    }
    contacts.length = 0;

    this.contactgen.getContacts(p1,p2,
                                this,
                                contacts,
                                oldcontacts // To be reused
                                );
    if(doProfiling){
        profile.nearphase = now() - profilingStart;
    }

    // Loop over all collisions
    if(doProfiling){
        profilingStart = now();
    }
    var ncontacts = contacts.length;

    // Transfer FrictionEquation from current list to the pool for reuse
    var NoldFrictionEquations = this.frictionEquations.length;
    for(i=0; i!==NoldFrictionEquations; i++){
        frictionEquationPool.push(this.frictionEquations[i]);
    }
    this.frictionEquations.length = 0;

    for(var k=0; k!==ncontacts; k++){

        // Current contact
        var c = contacts[k];

        // Get current collision indeces
        var bi=c.bi, bj=c.bj;

        // Resolve indeces
        var i = bodies.indexOf(bi), j = bodies.indexOf(bj);

        // Get collision properties
        var cm = this.getContactMaterial(bi.material,bj.material) || this.defaultContactMaterial;
        var mu = cm.friction;
        var e = cm.restitution;

        // g = ( xj + rj - xi - ri ) .dot ( ni )
        var gvec = World_step_gvec;
        gvec.set(bj.position.x + c.rj.x - bi.position.x - c.ri.x,
                 bj.position.y + c.rj.y - bi.position.y - c.ri.y,
                 bj.position.z + c.rj.z - bi.position.z - c.ri.z);
        var g = gvec.dot(c.ni); // Gap, negative if penetration

        // Action if penetration
        if(g<0.0){
            c.restitution = cm.restitution;
            c.penetration = g;
            c.stiffness = cm.contactEquationStiffness;
            c.regularizationTime = cm.contactEquationRegularizationTime;

            solver.addEquation(c);

            // Add friction constraint equation
            if(mu > 0){

                // Create 2 tangent equations
                var mug = mu*gnorm;
                var reducedMass = (bi.invMass + bj.invMass);
                if(reducedMass > 0){
                    reducedMass = 1/reducedMass;
                }
                var pool = frictionEquationPool;
                var c1 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
                var c2 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
                this.frictionEquations.push(c1);
                this.frictionEquations.push(c2);

                c1.bi = c2.bi = bi;
                c1.bj = c2.bj = bj;
                c1.minForce = c2.minForce = -mug*reducedMass;
                c1.maxForce = c2.maxForce = mug*reducedMass;

                // Copy over the relative vectors
                c.ri.copy(c1.ri);
                c.rj.copy(c1.rj);
                c.ri.copy(c2.ri);
                c.rj.copy(c2.rj);

                // Construct tangents
                c.ni.tangents(c1.t,c2.t);

                // Add equations to solver
                solver.addEquation(c1);
                solver.addEquation(c2);
            }

            // Now we know that i and j are in contact. Set collision matrix state
            this.collisionMatrixSet(i,j,1,true);

            if(this.collisionMatrixGet(i,j,true)!==this.collisionMatrixGet(i,j,false)){
                // First contact!
                // We reuse the collideEvent object, otherwise we will end up creating new objects for each new contact, even if there's no event listener attached.
                World_step_collideEvent.with = bj;
                World_step_collideEvent.contact = c;
                bi.dispatchEvent(World_step_collideEvent);

                World_step_collideEvent.with = bi;
                bj.dispatchEvent(World_step_collideEvent);

                bi.wakeUp();
                bj.wakeUp();
            }
        }
    }
    if(doProfiling){
        profile.makeContactConstraints = now() - profilingStart;
    }

    if(doProfiling){
        profilingStart = now();
    }

    // Add user-added constraints
    var Nconstraints = constraints.length;
    for(i=0; i!==Nconstraints; i++){
        var c = constraints[i];
        c.update();
        for(var j=0, Neq=c.equations.length; j!==Neq; j++){
            var eq = c.equations[j];
            solver.addEquation(eq);
        }
    }

    // Solve the constrained system
    solver.solve(dt,this);

    if(doProfiling){
        profile.solve = now() - profilingStart;
    }

    // Remove all contacts from solver
    solver.removeAllEquations();

    // Apply damping, see http://code.google.com/p/bullet/issues/detail?id=74 for details
    var pow = Math.pow;
    for(i=0; i!==N; i++){
        var bi = bodies[i];
        if(bi.motionstate & DYNAMIC){ // Only for dynamic bodies
            var ld = pow(1.0 - bi.linearDamping,dt);
            var v = bi.velocity;
            v.mult(ld,v);
            var av = bi.angularVelocity;
            if(av){
                var ad = pow(1.0 - bi.angularDamping,dt);
                av.mult(ad,av);
            }
        }
    }

    this.dispatchEvent(World_step_postStepEvent);

    // Invoke pre-step callbacks
    for(i=0; i!==N; i++){
        var bi = bodies[i];
        if(bi.preStep){
            bi.preStep.call(bi);
        }
    }

    // Leap frog
    // vnew = v + h*f/m
    // xnew = x + h*vnew
    if(doProfiling){
        profilingStart = now();
    }
    var q = World_step_step_q;
    var w = World_step_step_w;
    var wq = World_step_step_wq;
    var stepnumber = this.stepnumber;
    var DYNAMIC_OR_KINEMATIC = CANNON.Body.DYNAMIC | CANNON.Body.KINEMATIC;
    var quatNormalize = stepnumber % (this.quatNormalizeSkip+1) === 0;
    var quatNormalizeFast = this.quatNormalizeFast;
    var half_dt = dt * 0.5;
    var PLANE = CANNON.Shape.types.PLANE,
        CONVEX = CANNON.Shape.types.CONVEXPOLYHEDRON;

    for(i=0; i!==N; i++){
        var b = bodies[i],
            s = b.shape,
            force = b.force,
            tau = b.tau;
        if((b.motionstate & DYNAMIC_OR_KINEMATIC)){ // Only for dynamic
            var velo = b.velocity,
                angularVelo = b.angularVelocity,
                pos = b.position,
                quat = b.quaternion,
                invMass = b.invMass,
                invInertia = b.invInertia;
            velo.x += force.x * invMass * dt;
            velo.y += force.y * invMass * dt;
            velo.z += force.z * invMass * dt;

            if(b.angularVelocity){
                angularVelo.x += tau.x * invInertia.x * dt;
                angularVelo.y += tau.y * invInertia.y * dt;
                angularVelo.z += tau.z * invInertia.z * dt;
            }

            // Use new velocity  - leap frog
            if(!b.isSleeping()){
                pos.x += velo.x * dt;
                pos.y += velo.y * dt;
                pos.z += velo.z * dt;

                if(b.angularVelocity){
                    w.set(angularVelo.x, angularVelo.y, angularVelo.z, 0);
                    w.mult(quat,wq);
                    quat.x += half_dt * wq.x;
                    quat.y += half_dt * wq.y;
                    quat.z += half_dt * wq.z;
                    quat.w += half_dt * wq.w;
                    if(quatNormalize){
                        if(quatNormalizeFast){
                            quat.normalizeFast();
                        } else {
                            quat.normalize();
                        }
                    }
                }

                if(b.aabbmin){
                    b.aabbNeedsUpdate = true;
                }
            }

            if(s){
                switch(s.type){
                case PLANE:
                    s.worldNormalNeedsUpdate = true;
                    break;
                case CONVEX:
                    s.worldFaceNormalsNeedsUpdate = true;
                    s.worldVerticesNeedsUpdate = true;
                    break;
                }
            }
        }
        b.force.set(0,0,0);
        if(b.tau){
            b.tau.set(0,0,0);
        }
    }

    if(doProfiling){
        profile.integrate = now() - profilingStart;
    }

    // Update world time
    this.time += dt;
    this.stepnumber += 1;

    this.dispatchEvent(World_step_postStepEvent);

    // Invoke post-step callbacks
    for(i=0; i!==N; i++){
        var bi = bodies[i];
        var postStep = bi.postStep;
        if(postStep){
            postStep.call(bi);
        }
    }

    // Update world inertias
    // @todo should swap autoUpdate mechanism for .xxxNeedsUpdate
    for(i=0; i!==N; i++){
        var b = bodies[i];
        if(b.inertiaWorldAutoUpdate){
            b.quaternion.vmult(b.inertia,b.inertiaWorld);
        }
        if(b.invInertiaWorldAutoUpdate){
            b.quaternion.vmult(b.invInertia,b.invInertiaWorld);
        }
    }

    // Sleeping update
    if(this.allowSleep){
        for(i=0; i!==N; i++){
            bodies[i].sleepTick(this.time);
        }
    }
};


/**
 * @class CANNON.ContactGenerator
 * @brief Helper class for the World. Generates ContactEquations.
 * @todo Sphere-ConvexPolyhedron contacts
 * @todo Contact reduction
 */
CANNON.ContactGenerator = function(){

    /**
     * @property bool contactReduction
     * @memberof CANNON.ContactGenerator
     * @brief Turns on or off contact reduction. Can be handy to turn off when debugging new collision types.
     */
    this.contactReduction = false;

    // Contact point objects that can be reused
    var contactPointPool = [];

    var v3pool = new CANNON.Vec3Pool();

    /*
     * Make a contact object.
     * @return object
     * @todo reuse old contact point objects
     */
    function makeResult(bi,bj){
        if(contactPointPool.length){
            var c = contactPointPool.pop();
            c.bi = bi;
            c.bj = bj;
            return c;
        } else {
            return new CANNON.ContactEquation(bi,bj);
        }
    }

    /*
     * Swaps the body references in the contact
     * @param object r
     */
    function swapResult(r){
        var temp;
        temp = r.ri;
        r.ri = r.rj;
        r.rj = temp;
        r.ni.negate(r.ni);
        temp = r.bi;
        r.bi = r.bj;
        r.bj = temp;
    }

    function sphereSphere(result,si,sj,xi,xj,qi,qj,bi,bj){
        // We will have only one contact in this case
        var r = makeResult(bi,bj);

        // Contact normal
        bj.position.vsub(xi, r.ni);
        r.ni.normalize();

        // Contact point locations
        r.ni.copy(r.ri);
        r.ni.copy(r.rj);
        r.ri.mult(si.radius, r.ri);
        r.rj.mult(-sj.radius, r.rj);
        result.push(r);
    }

    var point_on_plane_to_sphere = new CANNON.Vec3();
    var plane_to_sphere_ortho = new CANNON.Vec3();
    function spherePlane(result,si,sj,xi,xj,qi,qj,bi,bj){
        // We will have one contact in this case
        var r = makeResult(bi,bj);

        // Contact normal
        r.ni.set(0,0,1);
        qj.vmult(r.ni,r.ni);
        r.ni.negate(r.ni); // body i is the sphere, flip normal
        r.ni.normalize();

        // Vector from sphere center to contact point
        r.ni.mult(si.radius,r.ri);

        // Project down sphere on plane
        xi.vsub(xj,point_on_plane_to_sphere);
        r.ni.mult(r.ni.dot(point_on_plane_to_sphere),plane_to_sphere_ortho);
        point_on_plane_to_sphere.vsub(plane_to_sphere_ortho,r.rj); // The sphere position projected to plane
        if(plane_to_sphere_ortho.norm2() <= si.radius*si.radius){
            result.push(r);
        }
    }

    // See http://bulletphysics.com/Bullet/BulletFull/SphereTriangleDetector_8cpp_source.html
    var pointInPolygon_edge = new CANNON.Vec3();
    var pointInPolygon_edge_x_normal = new CANNON.Vec3();
    var pointInPolygon_vtp = new CANNON.Vec3();
    function pointInPolygon(verts, normal, p){
        var positiveResult = null;
        var N = verts.length;
        for(var i=0; i!==N; i++){
            var v = verts[i];

            // Get edge to the next vertex
            var edge = pointInPolygon_edge;
            verts[(i+1) % (N)].vsub(v,edge);

            // Get cross product between polygon normal and the edge
            var edge_x_normal = pointInPolygon_edge_x_normal;
            //var edge_x_normal = new CANNON.Vec3();
            edge.cross(normal,edge_x_normal);

            // Get vector between point and current vertex
            var vertex_to_p = pointInPolygon_vtp;
            p.vsub(v,vertex_to_p);

            // This dot product determines which side of the edge the point is
            var r = edge_x_normal.dot(vertex_to_p);

            // If all such dot products have same sign, we are inside the polygon.
            if(positiveResult===null || (r>0 && positiveResult===true) || (r<=0 && positiveResult===false)){
                if(positiveResult===null){
                    positiveResult = r>0;
                }
                continue;
            } else {
                return false; // Encountered some other sign. Exit.
            }
        }

        // If we got here, all dot products were of the same sign.
        return true;
    }

    var box_to_sphere = new CANNON.Vec3();
    var sphereBox_ns = new CANNON.Vec3();
    var sphereBox_ns1 = new CANNON.Vec3();
    var sphereBox_ns2 = new CANNON.Vec3();
    var sphereBox_sides = [new CANNON.Vec3(),new CANNON.Vec3(),new CANNON.Vec3(),new CANNON.Vec3(),new CANNON.Vec3(),new CANNON.Vec3()];
    var sphereBox_sphere_to_corner = new CANNON.Vec3();
    var sphereBox_side_ns = new CANNON.Vec3();
    var sphereBox_side_ns1 = new CANNON.Vec3();
    var sphereBox_side_ns2 = new CANNON.Vec3();
    function sphereBox(result,si,sj,xi,xj,qi,qj,bi,bj){
        // we refer to the box as body j
        var sides = sphereBox_sides;
        xi.vsub(xj,box_to_sphere);
        sj.getSideNormals(sides,qj);
        var R =     si.radius;
        var penetrating_sides = [];

        // Check side (plane) intersections
        var found = false;

        // Store the resulting side penetration info
        var side_ns = sphereBox_side_ns;
        var side_ns1 = sphereBox_side_ns1;
        var side_ns2 = sphereBox_side_ns2;
        var side_h = null;
        var side_penetrations = 0;
        var side_dot1 = 0;
        var side_dot2 = 0;
        var side_distance = null;
        for(var idx=0,nsides=sides.length; idx!==nsides && found===false; idx++){
            // Get the plane side normal (ns)
            var ns = sphereBox_ns;
            sides[idx].copy(ns);

            var h = ns.norm();
            ns.normalize();

            // The normal/distance dot product tells which side of the plane we are
            var dot = box_to_sphere.dot(ns);

            if(dot<h+R && dot>0){
                // Intersects plane. Now check the other two dimensions
                var ns1 = sphereBox_ns1;
                var ns2 = sphereBox_ns2;
                sides[(idx+1)%3].copy(ns1);
                sides[(idx+2)%3].copy(ns2);
                var h1 = ns1.norm();
                var h2 = ns2.norm();
                ns1.normalize();
                ns2.normalize();
                var dot1 = box_to_sphere.dot(ns1);
                var dot2 = box_to_sphere.dot(ns2);
                if(dot1<h1 && dot1>-h1 && dot2<h2 && dot2>-h2){
                    var dist = Math.abs(dot-h-R);
                    if(side_distance===null || dist < side_distance){
                        side_distance = dist;
                        side_dot1 = dot1;
                        side_dot2 = dot2;
                        side_h = h;
                        ns.copy(side_ns);
                        ns1.copy(side_ns1);
                        ns2.copy(side_ns2);
                        side_penetrations++;
                    }
                }
            }
        }
        if(side_penetrations){
            found = true;
            var r = makeResult(bi,bj);
            side_ns.mult(-R,r.ri); // Sphere r
            side_ns.copy(r.ni);
            r.ni.negate(r.ni); // Normal should be out of sphere
            side_ns.mult(side_h,side_ns);
            side_ns1.mult(side_dot1,side_ns1);
            side_ns.vadd(side_ns1,side_ns);
            side_ns2.mult(side_dot2,side_ns2);
            side_ns.vadd(side_ns2,r.rj);
            result.push(r);
        }

        // Check corners
        var rj = v3pool.get();
        var sphere_to_corner = sphereBox_sphere_to_corner;
        for(var j=0; j!==2 && !found; j++){
            for(var k=0; k!==2 && !found; k++){
                for(var l=0; l!==2 && !found; l++){
                    rj.set(0,0,0);
                    if(j){
                        rj.vadd(sides[0],rj);
                    } else {
                        rj.vsub(sides[0],rj);
                    }
                    if(k){
                        rj.vadd(sides[1],rj);
                    } else {
                        rj.vsub(sides[1],rj);
                    }
                    if(l){
                        rj.vadd(sides[2],rj);
                    } else {
                        rj.vsub(sides[2],rj);
                    }

                    // World position of corner
                    xj.vadd(rj,sphere_to_corner);
                    sphere_to_corner.vsub(xi,sphere_to_corner);

                    if(sphere_to_corner.norm2() < R*R){
                        found = true;
                        var r = makeResult(bi,bj);
                        sphere_to_corner.copy(r.ri);
                        r.ri.normalize();
                        r.ri.copy(r.ni);
                        r.ri.mult(R,r.ri);
                        rj.copy(r.rj);
                        result.push(r);
                    }
                }
            }
        }
        v3pool.release(rj);
        rj = null;

        // Check edges
        var edgeTangent = v3pool.get();
        var edgeCenter = v3pool.get();
        var r = v3pool.get(); // r = edge center to sphere center
        var orthogonal = v3pool.get();
        var dist = v3pool.get();
        var Nsides = sides.length;
        for(var j=0; j!==Nsides && !found; j++){
            for(var k=0; k!==Nsides && !found; k++){
                if(j%3 !== k%3){
                    // Get edge tangent
                    sides[k].cross(sides[j],edgeTangent);
                    edgeTangent.normalize();
                    sides[j].vadd(sides[k], edgeCenter);
                    xi.copy(r);
                    r.vsub(edgeCenter,r);
                    r.vsub(xj,r);
                    var orthonorm = r.dot(edgeTangent); // distance from edge center to sphere center in the tangent direction
                    edgeTangent.mult(orthonorm,orthogonal); // Vector from edge center to sphere center in the tangent direction

                    // Find the third side orthogonal to this one
                    var l = 0;
                    while(l===j%3 || l===k%3){
                        l++;
                    }

                    // vec from edge center to sphere projected to the plane orthogonal to the edge tangent
                    xi.copy(dist);
                    dist.vsub(orthogonal,dist);
                    dist.vsub(edgeCenter,dist);
                    dist.vsub(xj,dist);

                    // Distances in tangent direction and distance in the plane orthogonal to it
                    var tdist = Math.abs(orthonorm);
                    var ndist = dist.norm();

                    if(tdist < sides[l].norm() && ndist<R){
                        found = true;
                        var res = makeResult(bi,bj);
                        edgeCenter.vadd(orthogonal,res.rj); // box rj
                        res.rj.copy(res.rj);
                        dist.negate(res.ni);
                        res.ni.normalize();

                        res.rj.copy(res.ri);
                        res.ri.vadd(xj,res.ri);
                        res.ri.vsub(xi,res.ri);
                        res.ri.normalize();
                        res.ri.mult(R,res.ri);

                        result.push(res);
                    }
                }
            }
        }
        v3pool.release(edgeTangent,edgeCenter,r,orthogonal,dist);
    }

    var convex_to_sphere = new CANNON.Vec3();
    var sphereConvex_edge = new CANNON.Vec3();
    var sphereConvex_edgeUnit = new CANNON.Vec3();
    var sphereConvex_sphereToCorner = new CANNON.Vec3();
    var sphereConvex_worldCorner = new CANNON.Vec3();
    var sphereConvex_worldNormal = new CANNON.Vec3();
    var sphereConvex_worldPoint = new CANNON.Vec3();
    var sphereConvex_worldSpherePointClosestToPlane = new CANNON.Vec3();
    var sphereConvex_penetrationVec = new CANNON.Vec3();
    var sphereConvex_sphereToWorldPoint = new CANNON.Vec3();
    function sphereConvex(result,si,sj,xi,xj,qi,qj,bi,bj){
        xi.vsub(xj,convex_to_sphere);
        var normals = sj.faceNormals;
        var faces = sj.faces;
        var verts = sj.vertices;
        var R =     si.radius;
        var penetrating_sides = [];

        // Check corners
        for(var i=0; i!==verts.length; i++){
            var v = verts[i];

            // World position of corner
            var worldCorner = sphereConvex_worldCorner;
            qj.vmult(v,worldCorner);
            xj.vadd(worldCorner,worldCorner);
            var sphere_to_corner = sphereConvex_sphereToCorner;
            worldCorner.vsub(xi, sphere_to_corner);
            if(sphere_to_corner.norm2()<R*R){
                found = true;
                var r = makeResult(bi,bj);
                sphere_to_corner.copy(r.ri);
                r.ri.normalize();
                r.ri.copy(r.ni);
                r.ri.mult(R,r.ri);
                worldCorner.vsub(xj,r.rj);
                result.push(r);
                return;
            }
        }

        // Check side (plane) intersections
        var found = false;
        for(var i=0,nfaces=faces.length; i!==nfaces && found===false; i++){
            var normal = normals[i];
            var face = faces[i];

            var worldNormal = sphereConvex_worldNormal;
            qj.vmult(normal,worldNormal);

            var worldPoint = sphereConvex_worldPoint;
            qj.vmult(verts[face[0]],worldPoint);
            worldPoint.vadd(xj,worldPoint); // Arbitrary point in the face

            var worldSpherePointClosestToPlane = sphereConvex_worldSpherePointClosestToPlane;
            worldNormal.mult(-R,worldSpherePointClosestToPlane);
            xi.vadd(worldSpherePointClosestToPlane,worldSpherePointClosestToPlane);

            var penetrationVec = sphereConvex_penetrationVec;
            worldSpherePointClosestToPlane.vsub(worldPoint,penetrationVec);
            var penetration = penetrationVec.dot(worldNormal);

            var sphereToWorldPoint = sphereConvex_sphereToWorldPoint;
            xi.vsub(worldPoint,sphereToWorldPoint);

            if(penetration<0 && sphereToWorldPoint.dot(worldNormal)>0){
                // Intersects plane. Now check if the sphere is inside the face polygon
                var faceVerts = []; // Face vertices, in world coords
                for(var j=0, Nverts=face.length; j!==Nverts; j++){
                    var worldVertex = v3pool.get();
                    qj.vmult(verts[face[j]], worldVertex);
                    xj.vadd(worldVertex,worldVertex);
                    faceVerts.push(worldVertex);
                }

                if(pointInPolygon(faceVerts,worldNormal,xi)){ // Is the sphere center in the face polygon?
                    found = true;
                    var r = makeResult(bi,bj);
                    worldNormal.mult(-R,r.ri); // Sphere r
                    worldNormal.negate(r.ni); // Normal should be out of sphere

                    var penetrationVec2 = v3pool.get();
                    worldNormal.mult(-penetration,penetrationVec2);
                    var penetrationSpherePoint = v3pool.get();
                    worldNormal.mult(-R,penetrationSpherePoint);

                    //xi.vsub(xj).vadd(penetrationSpherePoint).vadd(penetrationVec2 , r.rj);
                    xi.vsub(xj,r.rj);
                    r.rj.vadd(penetrationSpherePoint,r.rj);
                    r.rj.vadd(penetrationVec2 , r.rj);

                    v3pool.release(penetrationVec2);
                    v3pool.release(penetrationSpherePoint);

                    result.push(r);

                    // Release world vertices
                    for(var j=0, Nfaceverts=faceVerts.length; j!==Nfaceverts; j++){
                        v3pool.release(faceVerts[j]);
                    }

                    return; // We only expect *one* face contact
                } else {
                    // Edge?
                    for(var j=0; j!==face.length; j++){

                        // Get two world transformed vertices
                        var v1 = v3pool.get();
                        var v2 = v3pool.get();
                        qj.vmult(verts[face[(j+1)%face.length]], v1);
                        qj.vmult(verts[face[(j+2)%face.length]], v2);
                        xj.vadd(v1, v1);
                        xj.vadd(v2, v2);

                        // Construct edge vector
                        var edge = sphereConvex_edge;
                        v2.vsub(v1,edge);

                        // Construct the same vector, but normalized
                        var edgeUnit = sphereConvex_edgeUnit;
                        edge.unit(edgeUnit);

                        // p is xi projected onto the edge
                        var p = v3pool.get();
                        var v1_to_xi = v3pool.get();
                        xi.vsub(v1, v1_to_xi);
                        var dot = v1_to_xi.dot(edgeUnit);
                        edgeUnit.mult(dot, p);
                        p.vadd(v1, p);

                        // Compute a vector from p to the center of the sphere
                        var xi_to_p = v3pool.get();
                        p.vsub(xi, xi_to_p);

                        // Collision if the edge-sphere distance is less than the radius
                        // AND if p is in between v1 and v2
                        if(dot > 0 && dot*dot<edge.norm2() && xi_to_p.norm2() < R*R){ // Collision if the edge-sphere distance is less than the radius
                            // Edge contact!
                            var r = makeResult(bi,bj);
                            p.vsub(xj,r.rj);

                            p.vsub(xi,r.ni);
                            r.ni.normalize();

                            r.ni.mult(R,r.ri);
                            result.push(r);

                            // Release world vertices
                            for(var j=0, Nfaceverts=faceVerts.length; j!==Nfaceverts; j++){
                                v3pool.release(faceVerts[j]);
                            }

                            v3pool.release(v1);
                            v3pool.release(v2);
                            v3pool.release(p);
                            v3pool.release(xi_to_p);
                            v3pool.release(v1_to_xi);

                            return;
                        }

                        v3pool.release(v1);
                        v3pool.release(v2);
                        v3pool.release(p);
                        v3pool.release(xi_to_p);
                        v3pool.release(v1_to_xi);
                    }
                }

                // Release world vertices
                for(var j=0, Nfaceverts=faceVerts.length; j!==Nfaceverts; j++){
                    v3pool.release(faceVerts[j]);
                }
            }
        }
    }

    var planeBox_normal = new CANNON.Vec3();
    var plane_to_corner = new CANNON.Vec3();
    function planeBox(result,si,sj,xi,xj,qi,qj,bi,bj){
        planeConvex(result,si,sj.convexPolyhedronRepresentation,xi,xj,qi,qj,bi,bj);
    }

    /*
     * Go recursive for compound shapes
     * @param Shape si
     * @param CompoundShape sj
     */
    var recurseCompound_v3pool = [];
    var recurseCompound_quatpool = [];
    function recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj){
        var v3pool = recurseCompound_v3pool;
        var quatPool = recurseCompound_quatpool;
        var nr = 0;
        for(var i=0, Nchildren=sj.childShapes.length; i!==Nchildren; i++){
            var r = [];
            var newQuat = quatPool.pop() || new CANNON.Quaternion();
            var newPos = v3pool.pop() || new CANNON.Vec3();
            qj.mult(sj.childOrientations[i],newQuat); // Can't reuse these since nearPhase() may recurse
            newQuat.normalize();
            //var newPos = xj.vadd(qj.vmult(sj.childOffsets[i]));
            qj.vmult(sj.childOffsets[i],newPos);
            xj.vadd(newPos,newPos);
            nearPhase(r,
                      si,
                      sj.childShapes[i],
                      xi,
                      newPos,//xj.vadd(qj.vmult(sj.childOffsets[i])), // Transform the shape to its local frame
                      qi,
                      newQuat, // Accumulate orientation
                      bi,
                      bj);
            // Release vector and quat
            quatPool.push(newQuat);

            var tempVec = newPos;

            if(!si){
                nr+= r.length;
            }
            for(var j=0; j!==r.length; j++){
                // The "rj" vector is in world coords, though we must add the world child offset vector.
                //r[j].rj.vadd(qj.vmult(sj.childOffsets[i]),r[j].rj);
                qj.vmult(sj.childOffsets[i],tempVec);
                r[j].rj.vadd(tempVec,r[j].rj);
                result.push(r[j]);
            }

            v3pool.push(newPos);
        }
    }

    var planeConvex_v = new CANNON.Vec3();
    var planeConvex_normal = new CANNON.Vec3();
    var planeConvex_relpos = new CANNON.Vec3();
    var planeConvex_projected = new CANNON.Vec3();
    function planeConvex(result,si,sj,xi,xj,qi,qj,bi,bj){
        // Simply return the points behind the plane.
        var v = planeConvex_v;
        var normal = planeConvex_normal;
        normal.set(0,0,1);
        qi.vmult(normal,normal); // Turn normal according to plane orientation
        var relpos = planeConvex_relpos;
        for(var i=0; i!==sj.vertices.length; i++){
            sj.vertices[i].copy(v);
            // Transform to world coords
            qj.vmult(v,v);
            xj.vadd(v,v);
            v.vsub(xi,relpos);

            var dot = normal.dot(relpos);
            if(dot<=0.0){
                // Get vertex position projected on plane
                var projected = planeConvex_projected;
                normal.mult(normal.dot(v),projected);
                v.vsub(projected,projected);

                var r = makeResult(bi,bj);
                normal.copy( r.ni ); // Contact normal is the plane normal out from plane

                projected.copy(r.ri); // From plane to vertex projected on plane

                // rj is now just the vertex position
                v.vsub(xj,r.rj);

                result.push(r);
            }
        }
    }

    var convexConvex_sepAxis = new CANNON.Vec3();
    var convexConvex_q = new CANNON.Vec3();
    function convexConvex(result,si,sj,xi,xj,qi,qj,bi,bj){
        var sepAxis = convexConvex_sepAxis;
        if(si.findSeparatingAxis(sj,xi,qi,xj,qj,sepAxis)){
            var res = [];
            var q = convexConvex_q;
            si.clipAgainstHull(xi,qi,sj,xj,qj,sepAxis,-100,100,res);
            //console.log(res.length);
            for(var j=0; j!==res.length; j++){
                var r = makeResult(bi,bj);
                sepAxis.negate(r.ni);
                res[j].normal.negate(q);
                q.mult(res[j].depth,q);
                res[j].point.vadd(q,r.ri);
                res[j].point.copy(r.rj);
                // Contact points are in world coordinates. Transform back to relative
                r.rj.vsub(xj,r.rj);
                r.ri.vsub(xi,r.ri);
                result.push(r);
            }
        }
    }

    var particlePlane_normal = new CANNON.Vec3();
    var particlePlane_relpos = new CANNON.Vec3();
    var particlePlane_projected = new CANNON.Vec3();
    function particlePlane(result,si,sj,xi,xj,qi,qj,bi,bj){
        var normal = particlePlane_normal;
        normal.set(0,0,1);
        bj.quaternion.vmult(normal,normal); // Turn normal according to plane orientation
        var relpos = particlePlane_relpos;
        xi.vsub(bj.position,relpos);
        var dot = normal.dot(relpos);
        if(dot<=0.0){
            var r = makeResult(bi,bj);
            normal.copy( r.ni ); // Contact normal is the plane normal
            r.ni.negate(r.ni);
            r.ri.set(0,0,0); // Center of particle

            // Get particle position projected on plane
            var projected = particlePlane_projected;
            normal.mult(normal.dot(xi),projected);
            xi.vsub(projected,projected);
            //projected.vadd(bj.position,projected);

            // rj is now the projected world position minus plane position
            projected.copy(r.rj);
            result.push(r);
        }
    }

    var particleSphere_normal = new CANNON.Vec3();
    function particleSphere(result,si,sj,xi,xj,qi,qj,bi,bj){
        // The normal is the unit vector from sphere center to particle center
        var normal = particleSphere_normal;
        normal.set(0,0,1);
        xi.vsub(xj,normal);
        var lengthSquared = normal.norm2();

        if(lengthSquared <= sj.radius * sj.radius){
            var r = makeResult(bi,bj);
            normal.normalize();
            normal.copy(r.rj);
            r.rj.mult(sj.radius,r.rj);
            normal.copy( r.ni ); // Contact normal
            r.ni.negate(r.ni);
            r.ri.set(0,0,0); // Center of particle
            result.push(r);
        }
    }

    // WIP
    var cqj = new CANNON.Quaternion();
    var particleConvex_local = new CANNON.Vec3();
    var particleConvex_normal = new CANNON.Vec3();
    var particleConvex_penetratedFaceNormal = new CANNON.Vec3();
    var particleConvex_vertexToParticle = new CANNON.Vec3();
    var particleConvex_worldPenetrationVec = new CANNON.Vec3();
    function particleConvex(result,si,sj,xi,xj,qi,qj,bi,bj){
        var penetratedFaceIndex = -1;
        var penetratedFaceNormal = particleConvex_penetratedFaceNormal;
        var worldPenetrationVec = particleConvex_worldPenetrationVec;
        var minPenetration = null;
        var numDetectedFaces = 0;

        // Convert particle position xi to local coords in the convex
        var local = particleConvex_local;
        xi.copy(local);
        local.vsub(xj,local); // Convert position to relative the convex origin
        qj.conjugate(cqj);
        cqj.vmult(local,local);

        if(sj.pointIsInside(local)){

            if(sj.worldVerticesNeedsUpdate){
                sj.computeWorldVertices(xj,qj);
            }
            if(sj.worldFaceNormalsNeedsUpdate){
                sj.computeWorldFaceNormals(qj);
            }

            // For each world polygon in the polyhedra
            for(var i=0,nfaces=sj.faces.length; i!==nfaces; i++){

                // Construct world face vertices
                var verts = [ sj.worldVertices[ sj.faces[i][0] ] ];
                var normal = sj.worldFaceNormals[i];

                // Check how much the particle penetrates the polygon plane.
                xi.vsub(verts[0],particleConvex_vertexToParticle);
                var penetration = -normal.dot(particleConvex_vertexToParticle);
                if(minPenetration===null || Math.abs(penetration)<Math.abs(minPenetration)){
                    minPenetration = penetration;
                    penetratedFaceIndex = i;
                    normal.copy(penetratedFaceNormal);
                    numDetectedFaces++;
                }
            }

            if(penetratedFaceIndex!==-1){
                // Setup contact
                var r = makeResult(bi,bj);
                penetratedFaceNormal.mult(minPenetration, worldPenetrationVec);

                // rj is the particle position projected to the face
                worldPenetrationVec.vadd(xi,worldPenetrationVec);
                worldPenetrationVec.vsub(xj,worldPenetrationVec);
                worldPenetrationVec.copy(r.rj);
                //var projectedToFace = xi.vsub(xj).vadd(worldPenetrationVec);
                //projectedToFace.copy(r.rj);

                //qj.vmult(r.rj,r.rj);
                penetratedFaceNormal.negate( r.ni ); // Contact normal
                r.ri.set(0,0,0); // Center of particle
                result.push(r);
            } else {
                console.warn("Point found inside convex, but did not find penetrating face!");
            }
        }
    }

    /*
     * Near phase calculation, get the contact point, normal, etc.
     * @param array result The result one will get back with all the contact point information
     * @param Shape si Colliding shape. If not given, particle is assumed.
     * @param Shape sj
     * @param Vec3 xi Position of the center of mass
     * @param Vec3 xj
     * @param Quaternion qi Rotation around the center of mass
     * @param Quaternion qj
     * @todo All collision cases
     */
    function nearPhase(result,si,sj,xi,xj,qi,qj,bi,bj){
        var swapped = false,
            types = CANNON.Shape.types,
            SPHERE = types.SPHERE,
            PLANE = types.PLANE,
            BOX = types.BOX,
            COMPOUND = types.COMPOUND,
            CONVEXPOLYHEDRON = types.CONVEXPOLYHEDRON;

        if(si && sj){
            if(si.type > sj.type){
                var temp;
                temp=sj;
                sj=si;
                si=temp;

                temp=xj;
                xj=xi;
                xi=temp;

                temp=qj;
                qj=qi;
                qi=temp;

                temp=bj;
                bj=bi;
                bi=temp;

                swapped = true;
            }
        } else {
            // Particle!
            if(si && !sj){
                var temp;
                temp=sj;
                sj=si;
                si=temp;

                temp=xj;
                xj=xi;
                xi=temp;

                temp=qj;
                qj=qi;
                qi=temp;

                temp=bj;
                bj=bi;
                bi=temp;

                swapped = true;
            }
        }

        if(si && sj){
            if(si.type === SPHERE){

                switch(sj.type){
                case SPHERE: // sphere-sphere
                    sphereSphere(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case PLANE: // sphere-plane
                    spherePlane(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case BOX: // sphere-box
                    sphereBox(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case COMPOUND: // sphere-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case CONVEXPOLYHEDRON: // sphere-convexpolyhedron
                    sphereConvex(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.SPHERE and "+sj.type+" not implemented yet.");
                    break;
                }

            } else if(si.type === types.PLANE){

                switch(sj.type){
                case types.PLANE: // plane-plane
                    throw new Error("Plane-plane collision... wait, you did WHAT?");
                case types.BOX: // plane-box
                    planeBox(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.COMPOUND: // plane-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.CONVEXPOLYHEDRON: // plane-convex polyhedron
                    planeConvex(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.PLANE and "+sj.type+" not implemented yet.");
                    break;
                }

            } else if(si.type===types.BOX){

                switch(sj.type){
                case types.BOX: // box-box
                    // Do convex/convex instead
                    nearPhase(result,si.convexPolyhedronRepresentation,sj.convexPolyhedronRepresentation,xi,xj,qi,qj,bi,bj);
                    break;
                case types.COMPOUND: // box-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.CONVEXPOLYHEDRON: // box-convexpolyhedron
                    // Do convex/convex instead
                    nearPhase(result,si.convexPolyhedronRepresentation,sj,xi,xj,qi,qj,bi,bj);
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.BOX and "+sj.type+" not implemented yet.");
                    break;
                }

            } else if(si.type===types.COMPOUND){

                switch(sj.type){
                case types.COMPOUND: // compound-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.CONVEXPOLYHEDRON: // compound-convex polyhedron
                    // Must swap
                    var r = [];
                    recurseCompound(r,sj,si,xj,xi,qj,qi,bj,bi);
                    for(var ri=0; ri!==r.length; ri++){
                        swapResult(r[ri]);
                        result.push(r[ri]);
                    }
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.COMPOUND and "+sj.type+" not implemented yet.");
                    break;
                }

            } else if(si.type===types.CONVEXPOLYHEDRON){

                switch(sj.type){
                case types.CONVEXPOLYHEDRON: // convex polyhedron - convex polyhedron
                    convexConvex(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.CONVEXPOLYHEDRON and "+sj.type+" not implemented yet.");
                    break;
                }

            }

        } else {

            // Particle!
            switch(sj.type){
            case types.PLANE: // Particle vs plane
                particlePlane(result,si,sj,xi,xj,qi,qj,bi,bj);
                break;
            case types.SPHERE: // Particle vs sphere
                particleSphere(result,si,sj,xi,xj,qi,qj,bi,bj);
                break;
            case types.BOX: // Particle vs box
                particleConvex(result,si,sj.convexPolyhedronRepresentation,xi,xj,qi,qj,bi,bj);
                break;
            case types.CONVEXPOLYHEDRON: // particle-convex
                particleConvex(result,si,sj,xi,xj,qi,qj,bi,bj);
                break;
            case types.COMPOUND: // particle-compound
                recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                break;
            default:
                console.warn("Collision between CANNON.Particle and "+sj.type+" not implemented yet.");
                break;
            }
        }

        // Swap back if we swapped bodies in the beginning
        for(var i=0, Nresults=result.length; swapped && i!==Nresults; i++){
            swapResult(result[i]);
        }
    }

    /**
     * @method reduceContacts
     * @memberof CANNON.ContactGenerator
     * @brief Removes unnecessary members of an array of CANNON.ContactPoint.
     */
    this.reduceContacts = function(contacts){

    };

    /**
     * @method getContacts
     * @memberof CANNON.ContactGenerator
     * @param array p1 Array of body indices
     * @param array p2 Array of body indices
     * @param CANNON.World world
     * @param array result Array to store generated contacts
     * @param array oldcontacts Optional. Array of reusable contact objects
     */
    this.getContacts = function(p1,p2,world,result,oldcontacts){
        // Save old contact objects
        contactPointPool = oldcontacts;

        for(var k=0, N=p1.length; k!==N; k++){
            // Get current collision indeces
            var bi = p1[k],
                bj = p2[k];

            // Get contacts
            nearPhase(  result,
                        bi.shape,
                        bj.shape,
                        bi.position,
                        bj.position,
                        bi.quaternion,
                        bj.quaternion,
                        bi,
                        bj
                        );
        }
    };
};

/**
 * @class CANNON.Equation
 * @brief Equation base class
 * @author schteppe
 * @param CANNON.Body bi
 * @param CANNON.Body bj
 * @param float minForce Minimum (read: negative max) force to be applied by the constraint.
 * @param float maxForce Maximum (read: positive max) force to be applied by the constraint.
 */
CANNON.Equation = function(bi,bj,minForce,maxForce){
    this.id = -1;

    /**
     * @property float minForce
     * @memberof CANNON.Equation
     */
    this.minForce = typeof(minForce)==="undefined" ? -1e6 : minForce;

    /**
     * @property float maxForce
     * @memberof CANNON.Equation
     */
    this.maxForce = typeof(maxForce)==="undefined" ? 1e6 : maxForce;

    /**
     * @property CANNON.Body bi
     * @memberof CANNON.Equation
     */
    this.bi = bi;

    /**
     * @property CANNON.Body bj
     * @memberof CANNON.Equation
     */
    this.bj = bj;

    /**
     * @property float stiffness
     * @brief Corresponds to spring stiffness. Makes constraints stiffer, but harder to solve.
     * @memberof CANNON.Equation
     */
    this.stiffness = 1e7;

    /**
     * @property float regularizationTime
     * @brief Similar to damping. Represents the number of timesteps needed to stabilize the constraint.
     * @memberof CANNON.Equation
     */
    this.regularizationTime = 5;

    /**
     * @property float a
     * @brief SPOOK parameter
     * @memberof CANNON.Equation
     */
    this.a = 0.0;

    /**
     * @property float b
     * @brief SPOOK parameter
     * @memberof CANNON.Equation
     */
    this.b = 0.0;

    /**
     * @property float eps
     * @brief SPOOK parameter
     * @memberof CANNON.Equation
     */
    this.eps = 0.0;

    /**
     * @property bool spookParamsNeedsUpdate
     * @brief Set to true if you just changed stiffness or regularization. The parameters a,b,eps will be recalculated by the solver before solve.
     * @memberof CANNON.Equation
     */
    this.spookParamsNeedsUpdate = true;
};
CANNON.Equation.prototype.constructor = CANNON.Equation;

/**
 * @method updateSpookParams
 * @brief Recalculates a,b,eps.
 * @memberof CANNON.Equation
 */
CANNON.Equation.prototype.updateSpookParams = function(h){
    var d = this.regularizationTime,
        k = this.stiffness;
    this.a = 4.0 / (h * (1 + 4 * d));
    this.b = (4.0 * d) / (1 + 4 * d);
    this.eps = 4.0 / (h * h * k * (1 + 4 * d));
};


/**
 * @class CANNON.ContactEquation
 * @brief Contact/non-penetration constraint equation
 * @author schteppe
 * @param CANNON.Body bj
 * @param CANNON.Body bi
 * @extends CANNON.Equation
 */
CANNON.ContactEquation = function(bi,bj){
    CANNON.Equation.call(this,bi,bj,0,1e6);

    /**
     * @property float restitution
     * @memberof CANNON.ContactEquation
     */
    this.restitution = 0.0; // "bounciness": u1 = -e*u0

    /**
     * @property CANNON.Vec3 ri
     * @memberof CANNON.ContactEquation
     * @brief World-oriented vector that goes from the center of bi to the contact point in bi.
     */
    this.ri = new CANNON.Vec3();

    /**
     * @property CANNON.Vec3 rj
     * @memberof CANNON.ContactEquation
     */
    this.rj = new CANNON.Vec3();

    this.penetrationVec = new CANNON.Vec3();

    this.ni = new CANNON.Vec3();
    this.rixn = new CANNON.Vec3();
    this.rjxn = new CANNON.Vec3();

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();

    // Cache
    this.biInvInertiaTimesRixn =  new CANNON.Vec3();
    this.bjInvInertiaTimesRjxn =  new CANNON.Vec3();
};

CANNON.ContactEquation.prototype = new CANNON.Equation();
CANNON.ContactEquation.prototype.constructor = CANNON.ContactEquation;

/**
 * @method reset
 * @memberof CANNON.ContactEquation
 * @brief To be run before object reuse
 */
CANNON.ContactEquation.prototype.reset = function(){
    this.invInertiaTimesRxnNeedsUpdate = true;
};

var ContactEquation_computeB_temp1 = new CANNON.Vec3(); // Temp vectors
var ContactEquation_computeB_temp2 = new CANNON.Vec3();
var ContactEquation_computeB_zero = new CANNON.Vec3();
CANNON.ContactEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b;
    var bi = this.bi;
    var bj = this.bj;
    var ri = this.ri;
    var rj = this.rj;
    var rixn = this.rixn;
    var rjxn = this.rjxn;

    var zero = ContactEquation_computeB_zero;

    var vi = bi.velocity;
    var wi = bi.angularVelocity ? bi.angularVelocity : zero;
    var fi = bi.force;
    var taui = bi.tau ? bi.tau : zero;

    var vj = bj.velocity;
    var wj = bj.angularVelocity ? bj.angularVelocity : zero;
    var fj = bj.force;
    var tauj = bj.tau ? bj.tau : zero;

    var penetrationVec = this.penetrationVec;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    } else {
        invIi.identity(); // ok?
    }
    if(bj.invInertia){
        invIj.setTrace(bj.invInertia);
    } else {
        invIj.identity(); // ok?
    }

    var n = this.ni;

    // Caluclate cross products
    ri.cross(n,rixn);
    rj.cross(n,rjxn);

    // Calculate q = xj+rj -(xi+ri) i.e. the penetration vector
    var penetrationVec = this.penetrationVec;
    penetrationVec.set(0,0,0);
    penetrationVec.vadd(bj.position,penetrationVec);
    penetrationVec.vadd(rj,penetrationVec);
    penetrationVec.vsub(bi.position,penetrationVec);
    penetrationVec.vsub(ri,penetrationVec);

    var Gq = n.dot(penetrationVec);//-Math.abs(this.penetration);

    var invIi_vmult_taui = ContactEquation_computeB_temp1;
    var invIj_vmult_tauj = ContactEquation_computeB_temp2;
    invIi.vmult(taui,invIi_vmult_taui);
    invIj.vmult(tauj,invIj_vmult_tauj);

    // Compute iteration
    var ePlusOne = this.restitution+1;
    var GW = ePlusOne*vj.dot(n) - ePlusOne*vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn);
    var GiMf = fj.dot(n)*invMassj - fi.dot(n)*invMassi + rjxn.dot(invIj_vmult_tauj) - rixn.dot(invIi_vmult_taui);

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = GMG+eps in the SPOOK equation
var computeC_temp1 = new CANNON.Vec3();
var computeC_temp2 = new CANNON.Vec3();
CANNON.ContactEquation.prototype.computeC = function(){
    var bi = this.bi;
    var bj = this.bj;
    var rixn = this.rixn;
    var rjxn = this.rjxn;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var C = invMassi + invMassj + this.eps;

    var invIi = this.invIi;
    var invIj = this.invIj;

    /*
    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    } else {
        invIi.identity(); // ok?
    }
    if(bj.invInertia){
        invIj.setTrace(bj.invInertia);
    } else {
        invIj.identity(); // ok?
    }
     */

    // Compute rxn * I * rxn for each body
    invIi.vmult(rixn, this.biInvInertiaTimesRixn);
    invIj.vmult(rjxn, this.bjInvInertiaTimesRjxn);

    /*
    invIi.vmult(rixn,computeC_temp1);
    invIj.vmult(rjxn,computeC_temp2);
    
    C += computeC_temp1.dot(rixn);
    C += computeC_temp2.dot(rjxn);
     */
    C += this.biInvInertiaTimesRixn.dot(rixn);
    C += this.bjInvInertiaTimesRjxn.dot(rjxn);

    return C;
};

var computeGWlambda_ulambda = new CANNON.Vec3();
CANNON.ContactEquation.prototype.computeGWlambda = function(){
    var bi = this.bi;
    var bj = this.bj;
    var ulambda = computeGWlambda_ulambda;

    var GWlambda = 0.0;

    bj.vlambda.vsub(bi.vlambda, ulambda);
    GWlambda += ulambda.dot(this.ni);

    // Angular
    if(bi.wlambda){
        GWlambda -= bi.wlambda.dot(this.rixn);
    }
    if(bj.wlambda){
        GWlambda += bj.wlambda.dot(this.rjxn);
    }

    return GWlambda;
};

var ContactEquation_addToWlambda_temp1 = new CANNON.Vec3();
var ContactEquation_addToWlambda_temp2 = new CANNON.Vec3();
CANNON.ContactEquation.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi,
        bj = this.bj,
        rixn = this.rixn,
        rjxn = this.rjxn,
        invMassi = bi.invMass,
        invMassj = bj.invMass,
        n = this.ni,
        temp1 = ContactEquation_addToWlambda_temp1,
        temp2 = ContactEquation_addToWlambda_temp2;


    // Add to linear velocity
    n.mult(invMassi * deltalambda, temp2);
    bi.vlambda.vsub(temp2,bi.vlambda);
    n.mult(invMassj * deltalambda, temp2);
    bj.vlambda.vadd(temp2,bj.vlambda);

    // Add to angular velocity
    if(bi.wlambda !== undefined){
        this.biInvInertiaTimesRixn.mult(deltalambda,temp1);

        bi.wlambda.vsub(temp1,bi.wlambda);
    }
    if(bj.wlambda !== undefined){
        this.bjInvInertiaTimesRjxn.mult(deltalambda,temp1);
        bj.wlambda.vadd(temp1,bj.wlambda);
    }
};


/**
 * @class CANNON.FrictionEquation
 * @brief Constrains the slipping in a contact along a tangent
 * @author schteppe
 * @param CANNON.Body bi
 * @param CANNON.Body bj
 * @param float slipForce should be +-F_friction = +-mu * F_normal = +-mu * m * g
 * @extends CANNON.Equation
 */
CANNON.FrictionEquation = function(bi,bj,slipForce){
    CANNON.Equation.call(this,bi,bj,-slipForce,slipForce);
    this.ri = new CANNON.Vec3();
    this.rj = new CANNON.Vec3();
    this.t = new CANNON.Vec3(); // tangent


    // The following is just cache
    this.rixt = new CANNON.Vec3();
    this.rjxt = new CANNON.Vec3();
    this.wixri = new CANNON.Vec3();
    this.wjxrj = new CANNON.Vec3();

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();

    this.relVel = new CANNON.Vec3();
    this.relForce = new CANNON.Vec3();

    this.biInvInertiaTimesRixt =  new CANNON.Vec3();
    this.bjInvInertiaTimesRjxt =  new CANNON.Vec3();
};

CANNON.FrictionEquation.prototype = new CANNON.Equation();
CANNON.FrictionEquation.prototype.constructor = CANNON.FrictionEquation;

var FrictionEquation_computeB_temp1 = new CANNON.Vec3();
var FrictionEquation_computeB_temp2 = new CANNON.Vec3();
var FrictionEquation_computeB_zero = new CANNON.Vec3();
CANNON.FrictionEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b,
        bi = this.bi,
        bj = this.bj,
        ri = this.ri,
        rj = this.rj,
        rixt = this.rixt,
        rjxt = this.rjxt,
        wixri = this.wixri,
        wjxrj = this.wjxrj,
        zero = FrictionEquation_computeB_zero;

    var vi = bi.velocity,
        wi = bi.angularVelocity ? bi.angularVelocity : zero,
        fi = bi.force,
        taui = bi.tau ? bi.tau : zero,

        vj = bj.velocity,
        wj = bj.angularVelocity ? bj.angularVelocity : zero,
        fj = bj.force,
        tauj = bj.tau ? bj.tau : zero,

        relVel = this.relVel,
        relForce = this.relForce,
        invMassi = bi.invMass,
        invMassj = bj.invMass,

        invIi = this.invIi,
        invIj = this.invIj,

        t = this.t,

        invIi_vmult_taui = FrictionEquation_computeB_temp1,
        invIj_vmult_tauj = FrictionEquation_computeB_temp2;

    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    }
    if(bj.invInertia){
        invIj.setTrace(bj.invInertia);
    }


    // Caluclate cross products
    ri.cross(t,rixt);
    rj.cross(t,rjxt);

    wi.cross(ri,wixri);
    wj.cross(rj,wjxrj);

    invIi.vmult(taui,invIi_vmult_taui);
    invIj.vmult(tauj,invIj_vmult_tauj);

    var Gq = 0; // we do only want to constrain motion
    var GW = vj.dot(t) - vi.dot(t) + wjxrj.dot(t) - wixri.dot(t); // eq. 40
    var GiMf = fj.dot(t)*invMassj - fi.dot(t)*invMassi + rjxt.dot(invIj_vmult_tauj) - rixt.dot(invIi_vmult_taui);

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = G * Minv * G + eps
//var FEcomputeC_temp1 = new CANNON.Vec3();
//var FEcomputeC_temp2 = new CANNON.Vec3();
CANNON.FrictionEquation.prototype.computeC = function(){
    var bi = this.bi,
        bj = this.bj,
        rixt = this.rixt,
        rjxt = this.rjxt,
        invMassi = bi.invMass,
        invMassj = bj.invMass,
        C = invMassi + invMassj + this.eps,
        invIi = this.invIi,
        invIj = this.invIj;

    /*
    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    }
    if(bj.invInertia){
        invIj.setTrace(bj.invInertia);
    }
     */

    // Compute rxt * I * rxt for each body
    /*
    invIi.vmult(rixt,FEcomputeC_temp1);
    invIj.vmult(rjxt,FEcomputeC_temp2);
    C += FEcomputeC_temp1.dot(rixt);
    C += FEcomputeC_temp2.dot(rjxt);
      */
    invIi.vmult(rixt,this.biInvInertiaTimesRixt);
    invIj.vmult(rjxt,this.bjInvInertiaTimesRjxt);
    C += this.biInvInertiaTimesRixt.dot(rixt);
    C += this.bjInvInertiaTimesRjxt.dot(rjxt);

    return C;
};

var FrictionEquation_computeGWlambda_ulambda = new CANNON.Vec3();
CANNON.FrictionEquation.prototype.computeGWlambda = function(){

    // Correct at all ???

    var bi = this.bi;
    var bj = this.bj;

    var GWlambda = 0.0;
    var ulambda = FrictionEquation_computeGWlambda_ulambda;
    bj.vlambda.vsub(bi.vlambda,ulambda);
    GWlambda += ulambda.dot(this.t);

    // Angular
    if(bi.wlambda){
        GWlambda -= bi.wlambda.dot(this.rixt);
    }
    if(bj.wlambda){
        GWlambda += bj.wlambda.dot(this.rjxt);
    }

    return GWlambda;
};

var FrictionEquation_addToWlambda_tmp = new CANNON.Vec3();
CANNON.FrictionEquation.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi,
        bj = this.bj,
        rixt = this.rixt,
        rjxt = this.rjxt,
        invMassi = bi.invMass,
        invMassj = bj.invMass,
        t = this.t,
        tmp = FrictionEquation_addToWlambda_tmp,
        wi = bi.wlambda,
        wj = bj.wlambda;

    // Add to linear velocity
    t.mult(invMassi * deltalambda, tmp);
    bi.vlambda.vsub(tmp,bi.vlambda);

    t.mult(invMassj * deltalambda, tmp);
    bj.vlambda.vadd(tmp,bj.vlambda);

    // Add to angular velocity
    if(wi){
        /*
        var I = this.invIi;
        I.vmult(rixt,tmp);
        tmp.mult(deltalambda,tmp);
         */
        this.biInvInertiaTimesRixt.mult(deltalambda,tmp);
        wi.vsub(tmp,wi);
    }
    if(wj){
        /*
        var I = this.invIj;
        I.vmult(rjxt,tmp);
        tmp.mult(deltalambda,tmp);
         */
        this.bjInvInertiaTimesRjxt.mult(deltalambda,tmp);
        wj.vadd(tmp,wj);
    }
};

/**
 * @class CANNON.RotationalEquation
 * @brief Rotational constraint. Works to keep the local vectors orthogonal to each other.
 * @author schteppe
 * @param CANNON.RigidBody bj
 * @param CANNON.Vec3 localVectorInBodyA
 * @param CANNON.RigidBody bi
 * @param CANNON.Vec3 localVectorInBodyB
 * @extends CANNON.Equation
 */
CANNON.RotationalEquation = function(bodyA, bodyB){
    CANNON.Equation.call(this,bodyA,bodyB,-1e6,1e6);
    this.ni = new CANNON.Vec3(); // World oriented localVectorInBodyA 
    this.nj = new CANNON.Vec3(); // ...and B

    this.nixnj = new CANNON.Vec3();
    this.njxni = new CANNON.Vec3();

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();

    this.relVel = new CANNON.Vec3();
    this.relForce = new CANNON.Vec3();
};

CANNON.RotationalEquation.prototype = new CANNON.Equation();
CANNON.RotationalEquation.prototype.constructor = CANNON.RotationalEquation;

CANNON.RotationalEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b;
    var bi = this.bi;
    var bj = this.bj;

    var ni = this.ni;
    var nj = this.nj;

    var nixnj = this.nixnj;
    var njxni = this.njxni;

    var vi = bi.velocity;
    var wi = bi.angularVelocity ? bi.angularVelocity : new CANNON.Vec3();
    var fi = bi.force;
    var taui = bi.tau ? bi.tau : new CANNON.Vec3();

    var vj = bj.velocity;
    var wj = bj.angularVelocity ? bj.angularVelocity : new CANNON.Vec3();
    var fj = bj.force;
    var tauj = bj.tau ? bj.tau : new CANNON.Vec3();

    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    } else {
        invIi.identity(); // ok?
    }
    if(bj.invInertia) {
        invIj.setTrace(bj.invInertia);
    } else {
        invIj.identity(); // ok?
    }

    // Caluclate cross products
    ni.cross(nj,nixnj);
    nj.cross(ni,njxni);

    // g = ni * nj
    // gdot = (nj x ni) * wi + (ni x nj) * wj
    // G = [0 njxni 0 nixnj]
    // W = [vi wi vj wj]
    var Gq = -ni.dot(nj);
    var GW = njxni.dot(wi) + nixnj.dot(wj);
    var GiMf = 0;//njxni.dot(invIi.vmult(taui)) + nixnj.dot(invIj.vmult(tauj));

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = GMG+eps
CANNON.RotationalEquation.prototype.computeC = function(){
    var bi = this.bi;
    var bj = this.bj;
    var nixnj = this.nixnj;
    var njxni = this.njxni;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var C = /*invMassi + invMassj +*/ this.eps;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    } else {
        invIi.identity(); // ok?
    }
    if(bj.invInertia){
        invIj.setTrace(bj.invInertia);
    } else {
        invIj.identity(); // ok?
    }

    C += invIi.vmult(njxni).dot(njxni);
    C += invIj.vmult(nixnj).dot(nixnj);

    return C;
};

var computeGWlambda_ulambda = new CANNON.Vec3();
CANNON.RotationalEquation.prototype.computeGWlambda = function(){
    var bi = this.bi;
    var bj = this.bj;
    var ulambda = computeGWlambda_ulambda;

    var GWlambda = 0.0;
    //bj.vlambda.vsub(bi.vlambda, ulambda);
    //GWlambda += ulambda.dot(this.ni);

    // Angular
    if(bi.wlambda){
        GWlambda += bi.wlambda.dot(this.njxni);
    }
    if(bj.wlambda){
        GWlambda += bj.wlambda.dot(this.nixnj);
    }

    //console.log("GWlambda:",GWlambda);

    return GWlambda;
};

CANNON.RotationalEquation.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi;
    var bj = this.bj;
    var nixnj = this.nixnj;
    var njxni = this.njxni;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    // Add to linear velocity
    //bi.vlambda.vsub(n.mult(invMassi * deltalambda),bi.vlambda);
    //bj.vlambda.vadd(n.mult(invMassj * deltalambda),bj.vlambda);

    // Add to angular velocity
    if(bi.wlambda){
        var I = this.invIi;
        bi.wlambda.vsub(I.vmult(nixnj).mult(deltalambda),bi.wlambda);
    }
    if(bj.wlambda){
        var I = this.invIj;
        bj.wlambda.vadd(I.vmult(nixnj).mult(deltalambda),bj.wlambda);
    }
};


/**
 * @class CANNON.Constraint
 * @brief Constraint base class
 * @author schteppe
 * @param CANNON.Body bodyA
 * @param CANNON.Body bodyB
 */
CANNON.Constraint = function(bodyA,bodyB){

    /**
     * @property Array equations
     * @memberOf CANNON.Constraint
     * @brief Equations to be solved in this constraint
     */
    this.equations = [];

    /**
     * @property CANNON.Body bodyA
     * @memberOf CANNON.Constraint
     */
    this.bodyA = bodyA;

    /**
     * @property CANNON.Body bodyB
     * @memberOf CANNON.Constraint
     */
    this.bodyB = bodyB;
};

/**
 * @method update
 * @memberOf CANNON.Constraint
 */
CANNON.Constraint.prototype.update = function(){
    throw new Error("method update() not implmemented in this Constraint subclass!");
};

/**
 * @class CANNON.DistanceConstraint
 * @brief Constrains two bodies to be at a constant distance from each other.
 * @author schteppe
 * @param CANNON.Body bodyA
 * @param CANNON.Body bodyB
 * @param float distance
 * @param float maxForce
 */
CANNON.DistanceConstraint = function(bodyA,bodyB,distance,maxForce){
    CANNON.Constraint.call(this,bodyA,bodyB);

    if(typeof(maxForce)==="undefined" ) {
        maxForce = 1e6;
    }

    // Equations to be fed to the solver
    var eqs = this.equations = [
        new CANNON.ContactEquation(bodyA,bodyB), // Just in the normal direction
    ];

    var normal = eqs[0];

    normal.minForce = -maxForce;
    normal.maxForce =  maxForce;

    // Update 
    this.update = function(){
        bodyB.position.vsub(bodyA.position,normal.ni);
        normal.ni.normalize();
        /*bodyA.quaternion.vmult(pivotA,normal.ri);
        bodyB.quaternion.vmult(pivotB,normal.rj);*/
        normal.ni.mult( distance*0.5,normal.ri);
        normal.ni.mult( -distance*0.5,normal.rj);
    };
};
CANNON.DistanceConstraint.prototype = new CANNON.Constraint();


/**
 * @class CANNON.RotationalMotorEquation
 * @brief Rotational motor constraint. Works to keep the relative angular velocity of the bodies to a given value
 * @author schteppe
 * @param CANNON.RigidBody bodyA
 * @param CANNON.RigidBody bodyB
 * @extends CANNON.Equation
 */
CANNON.RotationalMotorEquation = function(bodyA, bodyB, maxForce){
    maxForce = maxForce || 1e6;
    CANNON.Equation.call(this,bodyA,bodyB,-maxForce,maxForce);
    this.axisA = new CANNON.Vec3(); // World oriented rotational axis
    this.axisB = new CANNON.Vec3(); // World oriented rotational axis

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();
    this.targetVelocity = 0;
};

CANNON.RotationalMotorEquation.prototype = new CANNON.Equation();
CANNON.RotationalMotorEquation.prototype.constructor = CANNON.RotationalMotorEquation;

CANNON.RotationalMotorEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b;
    var bi = this.bi;
    var bj = this.bj;

    var axisA = this.axisA;
    var axisB = this.axisB;

    var vi = bi.velocity;
    var wi = bi.angularVelocity ? bi.angularVelocity : new CANNON.Vec3();
    var fi = bi.force;
    var taui = bi.tau ? bi.tau : new CANNON.Vec3();

    var vj = bj.velocity;
    var wj = bj.angularVelocity ? bj.angularVelocity : new CANNON.Vec3();
    var fj = bj.force;
    var tauj = bj.tau ? bj.tau : new CANNON.Vec3();

    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    } else {
        invIi.identity(); // ok?
    }
    if(bj.invInertia){
        invIj.setTrace(bj.invInertia);
    } else {
        invIj.identity(); // ok?
    }

    // g = 0
    // gdot = axisA * wi - axisB * wj
    // G = [0 axisA 0 -axisB]
    // W = [vi wi vj wj]
    var Gq = 0;
    var GW = axisA.dot(wi) + axisB.dot(wj) + this.targetVelocity;
    var GiMf = 0;//axis.dot(invIi.vmult(taui)) + axis.dot(invIj.vmult(tauj));

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = GMG+eps
CANNON.RotationalMotorEquation.prototype.computeC = function(){
    var bi = this.bi;
    var bj = this.bj;
    var axisA = this.axisA;
    var axisB = this.axisB;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var C = this.eps;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    } else {
        invIi.identity(); // ok?
    }
    if(bj.invInertia){
        invIj.setTrace(bj.invInertia);
    } else {
        invIj.identity(); // ok?
    }

    C += invIi.vmult(axisA).dot(axisB);
    C += invIj.vmult(axisB).dot(axisB);

    return C;
};

var computeGWlambda_ulambda = new CANNON.Vec3();
CANNON.RotationalMotorEquation.prototype.computeGWlambda = function(){
    var bi = this.bi;
    var bj = this.bj;
    var ulambda = computeGWlambda_ulambda;
    var axisA = this.axisA;
    var axisB = this.axisB;

    var GWlambda = 0.0;
    //bj.vlambda.vsub(bi.vlambda, ulambda);
    //GWlambda += ulambda.dot(this.ni);

    // Angular
    if(bi.wlambda){
        GWlambda += bi.wlambda.dot(axisA);
    }
    if(bj.wlambda){
        GWlambda += bj.wlambda.dot(axisB);
    }

    //console.log("GWlambda:",GWlambda);

    return GWlambda;
};

CANNON.RotationalMotorEquation.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi;
    var bj = this.bj;
    var axisA = this.axisA;
    var axisB = this.axisB;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    // Add to linear velocity
    //bi.vlambda.vsub(n.mult(invMassi * deltalambda),bi.vlambda);
    //bj.vlambda.vadd(n.mult(invMassj * deltalambda),bj.vlambda);

    // Add to angular velocity
    if(bi.wlambda){
        var I = this.invIi;
        bi.wlambda.vsub(I.vmult(axisA).mult(deltalambda),bi.wlambda);
    }
    if(bj.wlambda){
        var I = this.invIj;
        bj.wlambda.vadd(I.vmult(axisB).mult(deltalambda),bj.wlambda);
    }
};


/**
 * @class CANNON.HingeConstraint
 * @brief Hinge constraint. Tries to keep the local body axes equal.
 * @author schteppe
 * @param CANNON.RigidBody bodyA
 * @param CANNON.Vec3 pivotA A point defined locally in bodyA. This defines the offset of axisA.
 * @param CANNON.Vec3 axisA an axis that bodyA can rotate around.
 * @param CANNON.RigidBody bodyB
 * @param CANNON.Vec3 pivotB
 * @param CANNON.Vec3 axisB
 * @param float maxForce
 */
CANNON.HingeConstraint = function(bodyA, pivotA, axisA, bodyB, pivotB, axisB, maxForce){
    CANNON.Constraint.call(this,bodyA,bodyB);

    maxForce = maxForce || 1e6;
    var that = this;
    // Equations to be fed to the solver
    var eqs = this.equations = [
        new CANNON.RotationalEquation(bodyA,bodyB), // rotational1
        new CANNON.RotationalEquation(bodyA,bodyB), // rotational2
        new CANNON.ContactEquation(bodyA,bodyB),    // p2pNormal
        new CANNON.ContactEquation(bodyA,bodyB),    // p2pTangent1
        new CANNON.ContactEquation(bodyA,bodyB),    // p2pTangent2
    ];

    this.getRotationalEquation1 =   function(){ return eqs[0]; };
    this.getRotationalEquation2 =   function(){ return eqs[1]; };
    this.getPointToPointEquation1 = function(){ return eqs[2]; };
    this.getPointToPointEquation2 = function(){ return eqs[3]; };
    this.getPointToPointEquation3 = function(){ return eqs[4]; };

    var r1 =        this.getRotationalEquation1();
    var r2 =        this.getRotationalEquation2();
    var normal =    this.getPointToPointEquation1();
    var t1 =        this.getPointToPointEquation2();
    var t2 =        this.getPointToPointEquation3();
    var motor; // not activated by default

    t1.minForce = t2.minForce = normal.minForce = -maxForce;
    t1.maxForce = t2.maxForce = normal.maxForce =  maxForce;

    var unitPivotA = pivotA.unit();
    var unitPivotB = pivotB.unit();

    var axisA_x_pivotA = new CANNON.Vec3();
    var axisA_x_axisA_x_pivotA = new CANNON.Vec3();
    var axisB_x_pivotB = new CANNON.Vec3();
    axisA.cross(unitPivotA,axisA_x_pivotA);
    axisA.cross(axisA_x_pivotA,axisA_x_axisA_x_pivotA);
    axisB.cross(unitPivotB,axisB_x_pivotB);

    axisA_x_pivotA.normalize();
    axisB_x_pivotB.normalize();

    // Motor stuff
    var motorEnabled = false;
    this.motorTargetVelocity = 0;
    this.motorMinForce = -maxForce;
    this.motorMaxForce = maxForce;
    this.enableMotor = function(){
        if(!motorEnabled){
            motor = new CANNON.RotationalMotorEquation(bodyA,bodyB,maxForce);
            eqs.push(motor);
            motorEnabled = true;
        }
    };
    this.disableMotor = function(){
        if(motorEnabled){
            motorEnabled = false;
            motor = null;
            eqs.pop();
        }
    };

    // Update 
    this.update = function(){
        // Update world positions of pivots
        /*
        bodyB.position.vsub(bodyA.position,normal.ni);
        normal.ni.normalize();
        */
        normal.ni.set(1,0,0);
        t1.ni.set(0,1,0);
        t2.ni.set(0,0,1);
        bodyA.quaternion.vmult(pivotA,normal.ri);
        bodyB.quaternion.vmult(pivotB,normal.rj);

        //normal.ni.tangents(t1.ni,t2.ni);
        normal.ri.copy(t1.ri);
        normal.rj.copy(t1.rj);
        normal.ri.copy(t2.ri);
        normal.rj.copy(t2.rj);

        // update rotational constraints
        bodyA.quaternion.vmult(axisA_x_pivotA, r1.ni);
        bodyB.quaternion.vmult(axisB,          r1.nj);
        bodyA.quaternion.vmult(axisA_x_axisA_x_pivotA,  r2.ni);
        bodyB.quaternion.vmult(axisB,           r2.nj);

        if(motorEnabled){
            bodyA.quaternion.vmult(axisA,motor.axisA);
            bodyB.quaternion.vmult(axisB,motor.axisB);
            motor.targetVelocity = that.motorTargetVelocity;
            motor.maxForce = that.motorMaxForce;
            motor.minForce = that.motorMinForce;
        }
    };
};
CANNON.HingeConstraint.prototype = new CANNON.Constraint();

/**
 * @class CANNON.PointToPointConstraint
 * @brief Connects two bodies at given offset points
 * @author schteppe
 * @param CANNON.Body bodyA
 * @param CANNON.Vec3 pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
 * @param CANNON.Body bodyB Body that will be constrained in a similar way to the same point as bodyA. We will therefore get sort of a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
 * @param CANNON.Vec3 pivotB See pivotA.
 * @param float maxForce The maximum force that should be applied to constrain the bodies.
 * @extends CANNON.Constraint
 */
CANNON.PointToPointConstraint = function(bodyA,pivotA,bodyB,pivotB,maxForce){
    CANNON.Constraint.call(this,bodyA,bodyB);

    // Equations to be fed to the solver
    var eqs = this.equations = [
        new CANNON.ContactEquation(bodyA,bodyB), // Normal
        new CANNON.ContactEquation(bodyA,bodyB), // Tangent2
        new CANNON.ContactEquation(bodyA,bodyB), // Tangent2
    ];

    var normal = eqs[0];
    var t1 = eqs[1];
    var t2 = eqs[2];

    t1.minForce = t2.minForce = normal.minForce = -maxForce;
    t1.maxForce = t2.maxForce = normal.maxForce =  maxForce;

    // Update 
    this.update = function(){
        bodyB.position.vsub(bodyA.position,normal.ni);
        normal.ni.normalize();
        bodyA.quaternion.vmult(pivotA,normal.ri);
        bodyB.quaternion.vmult(pivotB,normal.rj);

        normal.ni.tangents(t1.ni,t2.ni);
        normal.ri.copy(t1.ri);
        normal.rj.copy(t1.rj);
        normal.ri.copy(t2.ri);
        normal.rj.copy(t2.rj);
    };
};
CANNON.PointToPointConstraint.prototype = new CANNON.Constraint();


if (typeof module !== 'undefined') {
    // export for node
    module.exports = CANNON;
} else {
    // assign to window
    this.CANNON = CANNON;
}

}).apply(this);