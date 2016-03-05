//_______________________________________________________________
// Extracted from CubeMapGen: 
// https://code.google.com/archive/p/cubemapgen/
//
// Following https://seblagarde.wordpress.com/2012/06/10/amd-cubemapgen-for-physically-based-rendering/
//_______________________________________________________________
var BABYLON;
(function (BABYLON) {
    var Internals;
    (function (Internals) {
        var CMGBoundinBox = (function () {
            function CMGBoundinBox() {
                this.min = new BABYLON.Vector3(0, 0, 0);
                this.max = new BABYLON.Vector3(0, 0, 0);
                this.clear();
            }
            CMGBoundinBox.prototype.clear = function () {
                this.min.x = CMGBoundinBox.MAX;
                this.min.y = CMGBoundinBox.MAX;
                this.min.z = CMGBoundinBox.MAX;
                this.max.x = CMGBoundinBox.MIN;
                this.max.y = CMGBoundinBox.MIN;
                this.max.z = CMGBoundinBox.MIN;
            };
            CMGBoundinBox.prototype.augment = function (x, y, z) {
                this.min.x = Math.min(this.min.x, x);
                this.min.y = Math.min(this.min.y, y);
                this.min.z = Math.min(this.min.z, z);
                this.max.x = Math.max(this.max.x, x);
                this.max.y = Math.max(this.max.y, y);
                this.max.z = Math.max(this.max.z, z);
            };
            CMGBoundinBox.prototype.clampMin = function (x, y, z) {
                this.min.x = Math.max(this.min.x, x);
                this.min.y = Math.max(this.min.y, y);
                this.min.z = Math.max(this.min.z, z);
            };
            CMGBoundinBox.prototype.clampMax = function (x, y, z) {
                this.max.x = Math.min(this.max.x, x);
                this.max.y = Math.min(this.max.y, y);
                this.max.z = Math.min(this.max.z, z);
            };
            CMGBoundinBox.prototype.empty = function () {
                if ((this.min.x > this.max.y) ||
                    (this.min.y > this.max.y) ||
                    (this.min.z > this.max.y)) {
                    return true;
                }
                else {
                    return false;
                }
            };
            CMGBoundinBox.MAX = Number.MAX_VALUE;
            CMGBoundinBox.MIN = Number.MIN_VALUE;
            return CMGBoundinBox;
        })();
        var PMREMGenerator = (function () {
            function PMREMGenerator(input, inputSize, outputSize, maxNumMipLevels, numChannels, isFloat, specularPower, cosinePowerDropPerMip, excludeBase, fixup) {
                this.input = input;
                this.inputSize = inputSize;
                this.outputSize = outputSize;
                this.maxNumMipLevels = maxNumMipLevels;
                this.numChannels = numChannels;
                this.isFloat = isFloat;
                this.specularPower = specularPower;
                this.cosinePowerDropPerMip = cosinePowerDropPerMip;
                this.excludeBase = excludeBase;
                this.fixup = fixup;
                this._outputSurface = [];
                this._numMipLevels = 0;
            }
            PMREMGenerator.prototype.filterCubeMap = function () {
                // Init cubemap processor
                this.init();
                // Filters the cubemap
                this.filterCubeMapMipChain();
                // Returns the filtered mips.
                return this._outputSurface;
            };
            PMREMGenerator.prototype.init = function () {
                var i;
                var j;
                var mipLevelSize;
                //if nax num mip levels is set to 0, set it to generate the entire mip chain
                if (this.maxNumMipLevels == 0) {
                    this.maxNumMipLevels = PMREMGenerator.CP_MAX_MIPLEVELS;
                }
                //first miplevel size 
                mipLevelSize = this.outputSize;
                //Iterate over mip chain, and init ArrayBufferView for mip-chain
                for (j = 0; j < this.maxNumMipLevels; j++) {
                    this._outputSurface.length++;
                    this._outputSurface[j] = [];
                    //Iterate over faces for output images
                    for (i = 0; i < 6; i++) {
                        this._outputSurface[j].length++;
                        // Initializes a new array for the output.
                        if (this.isFloat) {
                            this._outputSurface[j][i] = new Float32Array(mipLevelSize * mipLevelSize * this.numChannels);
                        }
                        else {
                            this._outputSurface[j][i] = new Uint32Array(mipLevelSize * mipLevelSize * this.numChannels);
                        }
                    }
                    //next mip level is half size
                    mipLevelSize >>= 1;
                    this._numMipLevels++;
                    //terminate if mip chain becomes too small
                    if (mipLevelSize == 0) {
                        this.maxNumMipLevels = j;
                        return;
                    }
                }
            };
            //--------------------------------------------------------------------------------------
            //Cube map filtering and mip chain generation.
            // the cube map filtereing is specified using a number of parameters:
            // Filtering per miplevel is specified using 2D cone angle (in degrees) that 
            //  indicates the region of the hemisphere to filter over for each tap. 
            //                
            // Note that the top mip level is also a filtered version of the original input images 
            //  as well in order to create mip chains for diffuse environment illumination.
            // The cone angle for the top level is specified by a_BaseAngle.  This can be used to
            //  generate mipchains used to store the resutls of preintegration across the hemisphere.
            //
            // Then the mip angle used to genreate the next level of the mip chain from the first level 
            //  is a_InitialMipAngle
            //
            // The angle for the subsequent levels of the mip chain are specified by their parents 
            //  filtering angle and a per-level scale and bias
            //   newAngle = oldAngle * a_MipAnglePerLevelScale;
            //
            //--------------------------------------------------------------------------------------
            PMREMGenerator.prototype.filterCubeMapMipChain = function () {
                // First, take count of the lighting model to modify SpecularPower
                // var refSpecularPower = (a_MCO.LightingModel == CP_LIGHTINGMODEL_BLINN || a_MCO.LightingModel == CP_LIGHTINGMODEL_BLINN_BRDF) ? a_MCO.SpecularPower / GetSpecularPowerFactorToMatchPhong(a_MCO.SpecularPower) : a_MCO.SpecularPower; 
                // var refSpecularPower = this.specularPower; // Only Phong BRDF yet. This explains the line below using this.specularpower.
                //Cone angle start (for generating subsequent mip levels)
                var currentSpecularPower = this.specularPower;
                //Build filter lookup tables based on the source miplevel size
                this.precomputeFilterLookupTables(this.inputSize);
                // Note that we need to filter the first level before generating mipmap
                // So LevelIndex == 0 is base filtering hen LevelIndex > 0 is mipmap generation
                for (var levelIndex = 0; levelIndex < this._numMipLevels; levelIndex++) {
                    // TODO : Write a function to copy and scale the base mipmap in output
                    // I am just lazy here and just put a high specular power value, and do some if.
                    if (this.excludeBase && (levelIndex == 0)) {
                        // If we don't want to process the base mipmap, just put a very high specular power (this allow to handle scale of the texture).
                        currentSpecularPower = 100000.0;
                    }
                    // Special case for cosine power mipmap chain. For quality requirement, we always process the current mipmap from the top mipmap
                    var srcCubeImage = this.input;
                    var dstCubeImage = this._outputSurface[levelIndex];
                    var dstSize = this.outputSize >> levelIndex;
                    // Compute required angle.
                    var angle = this.getBaseFilterAngle(currentSpecularPower);
                    // filter cube surfaces
                    this.filterCubeSurfaces(srcCubeImage, this.inputSize, dstCubeImage, dstSize, angle, currentSpecularPower);
                    // fix seams
                    if (this.fixup) {
                        this.fixupCubeEdges(dstCubeImage, dstSize);
                    }
                    // Decrease the specular power to generate the mipmap chain
                    // TODO : Use another method for Exclude (see first comment at start of the function
                    if (this.excludeBase && (levelIndex == 0)) {
                        currentSpecularPower = this.specularPower;
                    }
                    currentSpecularPower *= this.cosinePowerDropPerMip;
                }
            };
            //--------------------------------------------------------------------------------------
            // This function return the BaseFilterAngle require by PMREMGenerator to its FilterExtends
            // It allow to optimize the texel to access base on the specular power.
            //--------------------------------------------------------------------------------------
            PMREMGenerator.prototype.getBaseFilterAngle = function (cosinePower) {
                // We want to find the alpha such that:
                // cos(alpha)^cosinePower = epsilon
                // That's: acos(epsilon^(1/cosinePower))
                var threshold = 0.000001; // Empirical threshold (Work perfectly, didn't check for a more big number, may get some performance and still god approximation)
                var angle = 180.0;
                angle = Math.acos(Math.pow(threshold, 1.0 / cosinePower));
                angle *= 180.0 / Math.PI; // Convert to degree
                angle *= 2.0; // * 2.0f because PMREMGenerator divide by 2 later
                return angle;
            };
            //--------------------------------------------------------------------------------------
            //Builds the following lookup tables prior to filtering:
            //  -normalizer cube map
            //  -tap weight lookup table
            // 
            //--------------------------------------------------------------------------------------
            PMREMGenerator.prototype.precomputeFilterLookupTables = function (srcCubeMapWidth) {
                var srcTexelAngle;
                var iCubeFace;
                //clear pre-existing normalizer cube map
                this._normCubeMap = [];
                //Normalized vectors per cubeface and per-texel solid angle 
                this.buildNormalizerSolidAngleCubemap(srcCubeMapWidth);
            };
            //--------------------------------------------------------------------------------------
            //Builds a normalizer cubemap, with the texels solid angle stored in the fourth component
            //
            //Takes in a cube face size, and an array of 6 surfaces to write the cube faces into
            //
            //Note that this normalizer cube map stores the vectors in unbiased -1 to 1 range.
            // if _bx2 style scaled and biased vectors are needed, uncomment the SCALE and BIAS
            // below
            //--------------------------------------------------------------------------------------
            PMREMGenerator.prototype.buildNormalizerSolidAngleCubemap = function (size) {
                var iCubeFace;
                var u;
                var v;
                //iterate over cube faces
                for (iCubeFace = 0; iCubeFace < 6; iCubeFace++) {
                    //First three channels for norm cube, and last channel for solid angle
                    this._normCubeMap.push(new Float32Array(size * size * 4));
                    //fast texture walk, build normalizer cube map
                    var facesData = this.input[iCubeFace];
                    for (v = 0; v < size; v++) {
                        for (u = 0; u < size; u++) {
                            var vect = this.texelCoordToVect(iCubeFace, u, v, size, this.fixup);
                            this._normCubeMap[iCubeFace][(v * size + u) * 4 + 0] = vect.x;
                            this._normCubeMap[iCubeFace][(v * size + u) * 4 + 1] = vect.y;
                            this._normCubeMap[iCubeFace][(v * size + u) * 4 + 2] = vect.z;
                            var solidAngle = this.texelCoordSolidAngle(iCubeFace, u, v, size);
                            this._normCubeMap[iCubeFace][(v * size + u) * 4 + 4] = solidAngle;
                        }
                    }
                }
            };
            //--------------------------------------------------------------------------------------
            // Convert cubemap face texel coordinates and face idx to 3D vector
            // note the U and V coords are integer coords and range from 0 to size-1
            //  this routine can be used to generate a normalizer cube map
            //--------------------------------------------------------------------------------------
            // SL BEGIN
            PMREMGenerator.prototype.texelCoordToVect = function (faceIdx, u, v, size, fixup) {
                var nvcU;
                var nvcV;
                var tempVec;
                // Change from original AMD code
                // transform from [0..res - 1] to [- (1 - 1 / res) .. (1 - 1 / res)]
                // + 0.5f is for texel center addressing
                nvcU = (2.0 * (u + 0.5) / size) - 1.0;
                nvcV = (2.0 * (v + 0.5) / size) - 1.0;
                // warp fixup
                if (fixup && size > 1) {
                    // Code from Nvtt : http://code.google.com/p/nvidia-texture-tools/source/browse/trunk/src/nvtt/CubeSurface.cpp
                    var a = Math.pow(size, 2.0) / Math.pow(size - 1, 3.0);
                    nvcU = a * Math.pow(nvcU, 3) + nvcU;
                    nvcV = a * Math.pow(nvcV, 3) + nvcV;
                }
                // Get current vector
                // generate x,y,z vector (xform 2d NVC coord to 3D vector)
                // U contribution
                var UVec = PMREMGenerator._sgFace2DMapping[faceIdx][PMREMGenerator.CP_UDIR];
                PMREMGenerator._vectorTemp.x = UVec[0] * nvcU;
                PMREMGenerator._vectorTemp.y = UVec[1] * nvcU;
                PMREMGenerator._vectorTemp.z = UVec[2] * nvcU;
                // V contribution and Sum
                var VVec = PMREMGenerator._sgFace2DMapping[faceIdx][PMREMGenerator.CP_VDIR];
                PMREMGenerator._vectorTemp.x += VVec[0] * nvcV;
                PMREMGenerator._vectorTemp.y += VVec[1] * nvcV;
                PMREMGenerator._vectorTemp.z += VVec[2] * nvcV;
                //add face axis
                var faceAxis = PMREMGenerator._sgFace2DMapping[faceIdx][PMREMGenerator.CP_FACEAXIS];
                PMREMGenerator._vectorTemp.x += faceAxis[0];
                PMREMGenerator._vectorTemp.y += faceAxis[1];
                PMREMGenerator._vectorTemp.z += faceAxis[2];
                //normalize vector              
                PMREMGenerator._vectorTemp.normalize();
                return PMREMGenerator._vectorTemp;
            };
            //--------------------------------------------------------------------------------------
            // Convert 3D vector to cubemap face texel coordinates and face idx 
            // note the U and V coords are integer coords and range from 0 to size-1
            //  this routine can be used to generate a normalizer cube map
            //
            // returns face IDX and texel coords
            //--------------------------------------------------------------------------------------
            // SL BEGIN
            /*
            Mapping Texture Coordinates to Cube Map Faces
            Because there are multiple faces, the mapping of texture coordinates to positions on cube map faces
            is more complicated than the other texturing targets.  The EXT_texture_cube_map extension is purposefully
            designed to be consistent with DirectX 7's cube map arrangement.  This is also consistent with the cube
            map arrangement in Pixar's RenderMan package.
            For cube map texturing, the (s,t,r) texture coordinates are treated as a direction vector (rx,ry,rz)
            emanating from the center of a cube.  (The q coordinate can be ignored since it merely scales the vector
            without affecting the direction.) At texture application time, the interpolated per-fragment (s,t,r)
            selects one of the cube map face's 2D mipmap sets based on the largest magnitude coordinate direction
            the major axis direction). The target column in the table below explains how the major axis direction
            maps to the 2D image of a particular cube map target.
    
            major axis
            direction     target                              sc     tc    ma
            ----------    ---------------------------------   ---    ---   ---
            +rx          GL_TEXTURE_CUBE_MAP_POSITIVE_X_EXT   -rz    -ry   rx
            -rx          GL_TEXTURE_CUBE_MAP_NEGATIVE_X_EXT   +rz    -ry   rx
            +ry          GL_TEXTURE_CUBE_MAP_POSITIVE_Y_EXT   +rx    +rz   ry
            -ry          GL_TEXTURE_CUBE_MAP_NEGATIVE_Y_EXT   +rx    -rz   ry
            +rz          GL_TEXTURE_CUBE_MAP_POSITIVE_Z_EXT   +rx    -ry   rz
            -rz          GL_TEXTURE_CUBE_MAP_NEGATIVE_Z_EXT   -rx    -ry   rz
    
            Using the sc, tc, and ma determined by the major axis direction as specified in the table above,
            an updated (s,t) is calculated as follows
            s   =   ( sc/|ma| + 1 ) / 2
            t   =   ( tc/|ma| + 1 ) / 2
            If |ma| is zero or very nearly zero, the results of the above two equations need not be defined
            (though the result may not lead to GL interruption or termination).  Once the cube map face's 2D mipmap
            set and (s,t) is determined, texture fetching and filtering proceeds like standard OpenGL 2D texturing.
            */
            // Note this method return U and V in range from 0 to size-1
            // SL END
            // Store the information in vector3 for convenience (faceindex, u, v)
            PMREMGenerator.prototype.vectToTexelCoord = function (x, y, z, size) {
                var maxCoord;
                var faceIdx;
                //absolute value 3
                var absX = Math.abs(x);
                var absY = Math.abs(y);
                var absZ = Math.abs(z);
                if (absX >= absY && absX >= absZ) {
                    maxCoord = absX;
                    if (x >= 0) {
                        faceIdx = PMREMGenerator.CP_FACE_X_POS;
                    }
                    else {
                        faceIdx = PMREMGenerator.CP_FACE_X_NEG;
                    }
                }
                else if (absY >= absX && absY >= absZ) {
                    maxCoord = absY;
                    if (y >= 0) {
                        faceIdx = PMREMGenerator.CP_FACE_Y_POS;
                    }
                    else {
                        faceIdx = PMREMGenerator.CP_FACE_Y_NEG;
                    }
                }
                else {
                    maxCoord = absZ;
                    if (z >= 0) {
                        faceIdx = PMREMGenerator.CP_FACE_Z_POS;
                    }
                    else {
                        faceIdx = PMREMGenerator.CP_FACE_Z_NEG;
                    }
                }
                //divide through by max coord so face vector lies on cube face
                var scale = 1 / maxCoord;
                x *= scale;
                y *= scale;
                z *= scale;
                var temp = PMREMGenerator._sgFace2DMapping[faceIdx][PMREMGenerator.CP_UDIR];
                var nvcU = temp[0] * x + temp[1] * y + temp[2] * z;
                temp = PMREMGenerator._sgFace2DMapping[faceIdx][PMREMGenerator.CP_VDIR];
                var nvcV = temp[0] * x + temp[1] * y + temp[2] * z;
                // Modify original AMD code to return value from 0 to Size - 1
                var u = Math.floor((size - 1) * 0.5 * (nvcU + 1.0));
                var v = Math.floor((size - 1) * 0.5 * (nvcV + 1.0));
                PMREMGenerator._vectorTemp.x = faceIdx;
                PMREMGenerator._vectorTemp.y = u;
                PMREMGenerator._vectorTemp.z = v;
                return PMREMGenerator._vectorTemp;
            };
            //--------------------------------------------------------------------------------------
            //Original code from Ignacio CastaÒo
            // This formula is from Manne ÷hrstrˆm's thesis.
            // Take two coordiantes in the range [-1, 1] that define a portion of a
            // cube face and return the area of the projection of that portion on the
            // surface of the sphere.
            //--------------------------------------------------------------------------------------
            PMREMGenerator.prototype.areaElement = function (x, y) {
                return Math.atan2(x * y, Math.sqrt(x * x + y * y + 1));
            };
            PMREMGenerator.prototype.texelCoordSolidAngle = function (faceIdx, u, v, size) {
                // transform from [0..res - 1] to [- (1 - 1 / res) .. (1 - 1 / res)]
                // (+ 0.5f is for texel center addressing)
                u = (2.0 * (u + 0.5) / size) - 1.0;
                v = (2.0 * (v + 0.5) / size) - 1.0;
                // Shift from a demi texel, mean 1.0f / a_Size with U and V in [-1..1]
                var invResolution = 1.0 / size;
                // U and V are the -1..1 texture coordinate on the current face.
                // Get projected area for this texel
                var x0 = u - invResolution;
                var y0 = v - invResolution;
                var x1 = u + invResolution;
                var y1 = v + invResolution;
                var solidAngle = this.areaElement(x0, y0) - this.areaElement(x0, y1) - this.areaElement(x1, y0) + this.areaElement(x1, y1);
                return solidAngle;
            };
            //--------------------------------------------------------------------------------------
            //The key to the speed of these filtering routines is to quickly define a per-face 
            //  bounding box of pixels which enclose all the taps in the filter kernel efficiently.  
            //  Later these pixels are selectively processed based on their dot products to see if 
            //  they reside within the filtering cone.
            //
            //This is done by computing the smallest per-texel angle to get a conservative estimate 
            // of the number of texels needed to be covered in width and height order to filter the
            // region.  the bounding box for the center taps face is defined first, and if the 
            // filtereing region bleeds onto the other faces, bounding boxes for the other faces are 
            // defined next
            //--------------------------------------------------------------------------------------
            PMREMGenerator.prototype.filterCubeSurfaces = function (srcCubeMap, srcSize, dstCubeMap, dstSize, filterConeAngle, specularPower) {
                // note that pixels within these regions may be rejected 
                // based on the anlge    
                var iCubeFace;
                var u;
                var v;
                // bounding box per face to specify region to process
                var filterExtents = [];
                for (iCubeFace = 0; iCubeFace < 6; iCubeFace++) {
                    filterExtents.push(new CMGBoundinBox());
                }
                // min angle a src texel can cover (in degrees)
                var srcTexelAngle = (180.0 / (Math.PI) * Math.atan2(1.0, srcSize));
                // angle about center tap to define filter cone
                // filter angle is 1/2 the cone angle
                var filterAngle = filterConeAngle / 2.0;
                //ensure filter angle is larger than a texel
                if (filterAngle < srcTexelAngle) {
                    filterAngle = srcTexelAngle;
                }
                //ensure filter cone is always smaller than the hemisphere
                if (filterAngle > 90.0) {
                    filterAngle = 90.0;
                }
                // the maximum number of texels in 1D the filter cone angle will cover
                //  used to determine bounding box size for filter extents
                var filterSize = Math.ceil(filterAngle / srcTexelAngle);
                // ensure conservative region always covers at least one texel
                if (filterSize < 1) {
                    filterSize = 1;
                }
                // dotProdThresh threshold based on cone angle to determine whether or not taps 
                //  reside within the cone angle
                var dotProdThresh = Math.cos((Math.PI / 180.0) * filterAngle);
                // process required faces
                for (iCubeFace = 0; iCubeFace < 6; iCubeFace++) {
                    //iterate over dst cube map face texel
                    for (v = 0; v < dstSize; v++) {
                        for (u = 0; u < dstSize; u++) {
                            //get center tap direction
                            var centerTapDir = this.texelCoordToVect(iCubeFace, u, v, dstSize, this.fixup).clone();
                            //clear old per-face filter extents
                            this.clearFilterExtents(filterExtents);
                            //define per-face filter extents
                            this.determineFilterExtents(centerTapDir, srcSize, filterSize, filterExtents);
                            //perform filtering of src faces using filter extents 
                            var vect = this.processFilterExtents(centerTapDir, dotProdThresh, filterExtents, srcCubeMap, srcSize, specularPower);
                            dstCubeMap[iCubeFace][(v * dstSize + u) * this.numChannels + 0] = vect.x;
                            dstCubeMap[iCubeFace][(v * dstSize + u) * this.numChannels + 1] = vect.y;
                            dstCubeMap[iCubeFace][(v * dstSize + u) * this.numChannels + 2] = vect.z;
                        }
                    }
                }
            };
            //--------------------------------------------------------------------------------------
            //Clear filter extents for the 6 cube map faces
            //--------------------------------------------------------------------------------------
            PMREMGenerator.prototype.clearFilterExtents = function (filterExtents) {
                for (var iCubeFaces = 0; iCubeFaces < 6; iCubeFaces++) {
                    filterExtents[iCubeFaces].clear();
                }
            };
            //--------------------------------------------------------------------------------------
            //Define per-face bounding box filter extents
            //
            // These define conservative texel regions in each of the faces the filter can possibly 
            // process.  When the pixels in the regions are actually processed, the dot product  
            // between the tap vector and the center tap vector is used to determine the weight of 
            // the tap and whether or not the tap is within the cone.
            //
            //--------------------------------------------------------------------------------------
            PMREMGenerator.prototype.determineFilterExtents = function (centerTapDir, srcSize, bboxSize, filterExtents) {
                //neighboring face and bleed over amount, and width of BBOX for
                // left, right, top, and bottom edges of this face
                var bleedOverAmount = [0, 0, 0, 0];
                var bleedOverBBoxMin = [0, 0, 0, 0];
                var bleedOverBBoxMax = [0, 0, 0, 0];
                var neighborFace;
                var neighborEdge;
                var oppositeFaceIdx;
                //get face idx, and u, v info from center tap dir
                var result = this.vectToTexelCoord(centerTapDir.x, centerTapDir.y, centerTapDir.z, srcSize);
                var faceIdx = result.x;
                var u = result.y;
                var v = result.z;
                //define bbox size within face
                filterExtents[faceIdx].augment(u - bboxSize, v - bboxSize, 0);
                filterExtents[faceIdx].augment(u + bboxSize, v + bboxSize, 0);
                filterExtents[faceIdx].clampMin(0, 0, 0);
                filterExtents[faceIdx].clampMax(srcSize - 1, srcSize - 1, 0);
                //u and v extent in face corresponding to center tap
                var minU = filterExtents[faceIdx].min.x;
                var minV = filterExtents[faceIdx].min.y;
                var maxU = filterExtents[faceIdx].max.x;
                var maxV = filterExtents[faceIdx].max.y;
                //bleed over amounts for face across u=0 edge (left)    
                bleedOverAmount[0] = (bboxSize - u);
                bleedOverBBoxMin[0] = minV;
                bleedOverBBoxMax[0] = maxV;
                //bleed over amounts for face across u=1 edge (right)    
                bleedOverAmount[1] = (u + bboxSize) - (srcSize - 1);
                bleedOverBBoxMin[1] = minV;
                bleedOverBBoxMax[1] = maxV;
                //bleed over to face across v=0 edge (up)
                bleedOverAmount[2] = (bboxSize - v);
                bleedOverBBoxMin[2] = minU;
                bleedOverBBoxMax[2] = maxU;
                //bleed over to face across v=1 edge (down)
                bleedOverAmount[3] = (v + bboxSize) - (srcSize - 1);
                bleedOverBBoxMin[3] = minU;
                bleedOverBBoxMax[3] = maxU;
                //compute bleed over regions in neighboring faces
                for (var i = 0; i < 4; i++) {
                    if (bleedOverAmount[i] > 0) {
                        neighborFace = PMREMGenerator._sgCubeNgh[faceIdx][i][0];
                        neighborEdge = PMREMGenerator._sgCubeNgh[faceIdx][i][1];
                        //For certain types of edge abutments, the bleedOverBBoxMin, and bleedOverBBoxMax need to 
                        //  be flipped: the cases are 
                        // if a left   edge mates with a left or bottom  edge on the neighbor
                        // if a top    edge mates with a top or right edge on the neighbor
                        // if a right  edge mates with a right or top edge on the neighbor
                        // if a bottom edge mates with a bottom or left  edge on the neighbor
                        //Seeing as the edges are enumerated as follows 
                        // left   =0 
                        // right  =1 
                        // top    =2 
                        // bottom =3            
                        // 
                        // so if the edge enums are the same, or the sum of the enums == 3, 
                        //  the bbox needs to be flipped
                        if ((i == neighborEdge) || ((i + neighborEdge) == 3)) {
                            bleedOverBBoxMin[i] = (srcSize - 1) - bleedOverBBoxMin[i];
                            bleedOverBBoxMax[i] = (srcSize - 1) - bleedOverBBoxMax[i];
                        }
                        //The way the bounding box is extended onto the neighboring face
                        // depends on which edge of neighboring face abuts with this one
                        switch (PMREMGenerator._sgCubeNgh[faceIdx][i][1]) {
                            case PMREMGenerator.CP_EDGE_LEFT:
                                filterExtents[neighborFace].augment(0, bleedOverBBoxMin[i], 0);
                                filterExtents[neighborFace].augment(bleedOverAmount[i], bleedOverBBoxMax[i], 0);
                                break;
                            case PMREMGenerator.CP_EDGE_RIGHT:
                                filterExtents[neighborFace].augment((srcSize - 1), bleedOverBBoxMin[i], 0);
                                filterExtents[neighborFace].augment((srcSize - 1) - bleedOverAmount[i], bleedOverBBoxMax[i], 0);
                                break;
                            case PMREMGenerator.CP_EDGE_TOP:
                                filterExtents[neighborFace].augment(bleedOverBBoxMin[i], 0, 0);
                                filterExtents[neighborFace].augment(bleedOverBBoxMax[i], bleedOverAmount[i], 0);
                                break;
                            case PMREMGenerator.CP_EDGE_BOTTOM:
                                filterExtents[neighborFace].augment(bleedOverBBoxMin[i], (srcSize - 1), 0);
                                filterExtents[neighborFace].augment(bleedOverBBoxMax[i], (srcSize - 1) - bleedOverAmount[i], 0);
                                break;
                        }
                        //clamp filter extents in non-center tap faces to remain within surface
                        filterExtents[neighborFace].clampMin(0, 0, 0);
                        filterExtents[neighborFace].clampMax(srcSize - 1, srcSize - 1, 0);
                    }
                    //If the bleed over amount bleeds past the adjacent face onto the opposite face 
                    // from the center tap face, then process the opposite face entirely for now. 
                    //Note that the cases in which this happens, what usually happens is that 
                    // more than one edge bleeds onto the opposite face, and the bounding box 
                    // encompasses the entire cube map face.
                    if (bleedOverAmount[i] > srcSize) {
                        //determine opposite face 
                        switch (faceIdx) {
                            case PMREMGenerator.CP_FACE_X_POS:
                                oppositeFaceIdx = PMREMGenerator.CP_FACE_X_NEG;
                                break;
                            case PMREMGenerator.CP_FACE_X_NEG:
                                oppositeFaceIdx = PMREMGenerator.CP_FACE_X_POS;
                                break;
                            case PMREMGenerator.CP_FACE_Y_POS:
                                oppositeFaceIdx = PMREMGenerator.CP_FACE_Y_NEG;
                                break;
                            case PMREMGenerator.CP_FACE_Y_NEG:
                                oppositeFaceIdx = PMREMGenerator.CP_FACE_Y_POS;
                                break;
                            case PMREMGenerator.CP_FACE_Z_POS:
                                oppositeFaceIdx = PMREMGenerator.CP_FACE_Z_NEG;
                                break;
                            case PMREMGenerator.CP_FACE_Z_NEG:
                                oppositeFaceIdx = PMREMGenerator.CP_FACE_Z_POS;
                                break;
                            default:
                                break;
                        }
                        //just encompass entire face for now
                        filterExtents[oppositeFaceIdx].augment(0, 0, 0);
                        filterExtents[oppositeFaceIdx].augment((srcSize - 1), (srcSize - 1), 0);
                    }
                }
            };
            //--------------------------------------------------------------------------------------
            //ProcessFilterExtents 
            //  Process bounding box in each cube face 
            //
            //--------------------------------------------------------------------------------------
            PMREMGenerator.prototype.processFilterExtents = function (centerTapDir, dotProdThresh, filterExtents, srcCubeMap, srcSize, specularPower) {
                //accumulators are 64-bit floats in order to have the precision needed 
                // over a summation of a large number of pixels 
                var dstAccum = [0, 0, 0, 0];
                var weightAccum = 0;
                var k = 0;
                var nSrcChannels = this.numChannels;
                // norm cube map and srcCubeMap have same face width
                var faceWidth = srcSize;
                //amount to add to pointer to move to next scanline in images
                var normCubePitch = faceWidth * 4; // 4 channels in normCubeMap.
                var srcCubePitch = faceWidth * this.numChannels; // numChannels correponds to the cubemap number of channel
                var IsPhongBRDF = 1; // Only works in Phong BRDF yet.
                //(a_LightingModel == CP_LIGHTINGMODEL_PHONG_BRDF || a_LightingModel == CP_LIGHTINGMODEL_BLINN_BRDF) ? 1 : 0; // This value will be added to the specular power
                // iterate over cubefaces
                for (var iFaceIdx = 0; iFaceIdx < 6; iFaceIdx++) {
                    //if bbox is non empty
                    if (!filterExtents[iFaceIdx].empty()) {
                        var uStart = filterExtents[iFaceIdx].min.x;
                        var vStart = filterExtents[iFaceIdx].min.y;
                        var uEnd = filterExtents[iFaceIdx].max.x;
                        var vEnd = filterExtents[iFaceIdx].max.y;
                        var startIndexNormCubeMap = (4 * ((vStart * faceWidth) + uStart));
                        var startIndexSrcCubeMap = (this.numChannels * ((vStart * faceWidth) + uStart));
                        //note that <= is used to ensure filter extents always encompass at least one pixel if bbox is non empty
                        for (var v = vStart; v <= vEnd; v++) {
                            var normCubeRowWalk = 0;
                            var srcCubeRowWalk = 0;
                            for (var u = uStart; u <= uEnd; u++) {
                                //pointer to direction in cube map associated with texel
                                var texelVectX = this._normCubeMap[iFaceIdx][startIndexNormCubeMap + normCubeRowWalk + 0];
                                var texelVectY = this._normCubeMap[iFaceIdx][startIndexNormCubeMap + normCubeRowWalk + 1];
                                var texelVectZ = this._normCubeMap[iFaceIdx][startIndexNormCubeMap + normCubeRowWalk + 2];
                                //check dot product to see if texel is within cone
                                var tapDotProd = texelVectX * centerTapDir.x +
                                    texelVectY * centerTapDir.y +
                                    texelVectZ * centerTapDir.z;
                                if (tapDotProd >= dotProdThresh && tapDotProd > 0.0) {
                                    //solid angle stored in 4th channel of normalizer/solid angle cube map
                                    var weight = this._normCubeMap[iFaceIdx][startIndexNormCubeMap + normCubeRowWalk + 3];
                                    // Here we decide if we use a Phong/Blinn or a Phong/Blinn BRDF.
                                    // Phong/Blinn BRDF is just the Phong/Blinn model multiply by the cosine of the lambert law
                                    // so just adding one to specularpower do the trick.					   
                                    weight *= Math.pow(tapDotProd, (specularPower + IsPhongBRDF));
                                    //iterate over channels
                                    for (k = 0; k < nSrcChannels; k++) {
                                        dstAccum[k] += weight * srcCubeMap[iFaceIdx][startIndexSrcCubeMap + srcCubeRowWalk];
                                        srcCubeRowWalk++;
                                    }
                                    weightAccum += weight; //accumulate weight
                                }
                                else {
                                    //step across source pixel
                                    srcCubeRowWalk += nSrcChannels;
                                }
                                normCubeRowWalk += 4; // 4 channels per norm cube map.
                            }
                            startIndexNormCubeMap += normCubePitch;
                            startIndexSrcCubeMap += srcCubePitch;
                        }
                    }
                }
                //divide through by weights if weight is non zero
                if (weightAccum != 0.0) {
                    PMREMGenerator._vectorTemp.x = (dstAccum[0] / weightAccum);
                    PMREMGenerator._vectorTemp.y = (dstAccum[1] / weightAccum);
                    PMREMGenerator._vectorTemp.z = (dstAccum[2] / weightAccum);
                    if (this.numChannels > 3) {
                        PMREMGenerator._vectorTemp.w = (dstAccum[3] / weightAccum);
                    }
                }
                else {
                    // otherwise sample nearest
                    // get face idx and u, v texel coordinate in face
                    var coord = this.vectToTexelCoord(centerTapDir.x, centerTapDir.y, centerTapDir.z, srcSize).clone();
                    PMREMGenerator._vectorTemp.x = srcCubeMap[coord.x][this.numChannels * (coord.z * srcSize + coord.y) + 0];
                    PMREMGenerator._vectorTemp.y = srcCubeMap[coord.x][this.numChannels * (coord.z * srcSize + coord.y) + 1];
                    PMREMGenerator._vectorTemp.z = srcCubeMap[coord.x][this.numChannels * (coord.z * srcSize + coord.y) + 2];
                    if (this.numChannels > 3) {
                        PMREMGenerator._vectorTemp.z = srcCubeMap[coord.x][this.numChannels * (coord.z * srcSize + coord.y) + 3];
                    }
                }
                return PMREMGenerator._vectorTemp;
            };
            //--------------------------------------------------------------------------------------
            // Fixup cube edges
            //
            // average texels on cube map faces across the edges
            // WARP/BENT Method Only.
            //--------------------------------------------------------------------------------------
            PMREMGenerator.prototype.fixupCubeEdges = function (cubeMap, cubeMapSize) {
                var k;
                var j;
                var i;
                var iFace;
                var iCorner = 0;
                var cornerNumPtrs = [0, 0, 0, 0, 0, 0, 0, 0]; //indexed by corner and face idx
                var faceCornerStartIndicies = [[], [], [], []]; //corner pointers for face keeping track of the face they belong to.
                // note that if functionality to filter across the three texels for each corner, then 
                //indexed by corner and face idx. the array contains the face the start points belongs to.
                var cornerPtr = [
                    [[], [], []],
                    [[], [], []],
                    [[], [], []],
                    [[], [], []],
                    [[], [], []],
                    [[], [], []],
                    [[], [], []],
                    [[], [], []]
                ];
                //if there is no fixup, or fixup width = 0, do nothing
                if (cubeMapSize < 1) {
                    return;
                }
                //special case 1x1 cubemap, average face colors
                if (cubeMapSize == 1) {
                    //iterate over channels
                    for (k = 0; k < this.numChannels; k++) {
                        var accum = 0.0;
                        //iterate over faces to accumulate face colors
                        for (iFace = 0; iFace < 6; iFace++) {
                            accum += cubeMap[iFace][k];
                        }
                        //compute average over 6 face colors
                        accum /= 6.0;
                        //iterate over faces to distribute face colors
                        for (iFace = 0; iFace < 6; iFace++) {
                            cubeMap[iFace][k] = accum;
                        }
                    }
                    return;
                }
                //iterate over faces to collect list of corner texel pointers
                for (iFace = 0; iFace < 6; iFace++) {
                    //the 4 corner pointers for this face
                    faceCornerStartIndicies[0] = [iFace, 0];
                    faceCornerStartIndicies[1] = [iFace, ((cubeMapSize - 1) * this.numChannels)];
                    faceCornerStartIndicies[2] = [iFace, ((cubeMapSize) * (cubeMapSize - 1) * this.numChannels)];
                    faceCornerStartIndicies[3] = [iFace, ((((cubeMapSize) * (cubeMapSize - 1)) + (cubeMapSize - 1)) * this.numChannels)];
                    //iterate over face corners to collect cube corner pointers
                    for (iCorner = 0; iCorner < 4; iCorner++) {
                        var corner = PMREMGenerator._sgCubeCornerList[iFace][iCorner];
                        cornerPtr[corner][cornerNumPtrs[corner]] = faceCornerStartIndicies[iCorner];
                        cornerNumPtrs[corner]++;
                    }
                }
                //iterate over corners to average across corner tap values
                for (iCorner = 0; iCorner < 8; iCorner++) {
                    for (k = 0; k < this.numChannels; k++) {
                        var cornerTapAccum = 0.0;
                        //iterate over corner texels and average results
                        for (i = 0; i < 3; i++) {
                            cornerTapAccum += cubeMap[cornerPtr[iCorner][i][0]][cornerPtr[iCorner][i][1] + k]; // Get in the cube map face the start point + channel.
                        }
                        //divide by 3 to compute average of corner tap values
                        cornerTapAccum *= (1.0 / 3.0);
                        //iterate over corner texels and average results
                        for (i = 0; i < 3; i++) {
                            cubeMap[cornerPtr[iCorner][i][0]][cornerPtr[iCorner][i][1] + k] = cornerTapAccum;
                        }
                    }
                }
                //iterate over the twelve edges of the cube to average across edges
                for (i = 0; i < 12; i++) {
                    var face = PMREMGenerator._sgCubeEdgeList[i][0];
                    var edge = PMREMGenerator._sgCubeEdgeList[i][1];
                    var neighborFace = PMREMGenerator._sgCubeNgh[face][edge][0];
                    var neighborEdge = PMREMGenerator._sgCubeNgh[face][edge][1];
                    var edgeStartIndex = 0; // a_CubeMap[face].m_ImgData;
                    var neighborEdgeStartIndex = 0; // a_CubeMap[neighborFace].m_ImgData;
                    var edgeWalk = 0;
                    var neighborEdgeWalk = 0;
                    //Determine walking pointers based on edge type
                    // e.g. CP_EDGE_LEFT, CP_EDGE_RIGHT, CP_EDGE_TOP, CP_EDGE_BOTTOM
                    switch (edge) {
                        case PMREMGenerator.CP_EDGE_LEFT:
                            // no change to faceEdgeStartPtr  
                            edgeWalk = this.numChannels * cubeMapSize;
                            break;
                        case PMREMGenerator.CP_EDGE_RIGHT:
                            edgeStartIndex += (cubeMapSize - 1) * this.numChannels;
                            edgeWalk = this.numChannels * cubeMapSize;
                            break;
                        case PMREMGenerator.CP_EDGE_TOP:
                            // no change to faceEdgeStartPtr  
                            edgeWalk = this.numChannels;
                            break;
                        case PMREMGenerator.CP_EDGE_BOTTOM:
                            edgeStartIndex += (cubeMapSize) * (cubeMapSize - 1) * this.numChannels;
                            edgeWalk = this.numChannels;
                            break;
                    }
                    //For certain types of edge abutments, the neighbor edge walk needs to 
                    //  be flipped: the cases are 
                    // if a left   edge mates with a left or bottom  edge on the neighbor
                    // if a top    edge mates with a top or right edge on the neighbor
                    // if a right  edge mates with a right or top edge on the neighbor
                    // if a bottom edge mates with a bottom or left  edge on the neighbor
                    //Seeing as the edges are enumerated as follows 
                    // left   =0 
                    // right  =1 
                    // top    =2 
                    // bottom =3            
                    // 
                    //If the edge enums are the same, or the sum of the enums == 3, 
                    //  the neighbor edge walk needs to be flipped
                    if ((edge == neighborEdge) || ((edge + neighborEdge) == 3)) {
                        switch (neighborEdge) {
                            case PMREMGenerator.CP_EDGE_LEFT:
                                neighborEdgeStartIndex += (cubeMapSize - 1) * (cubeMapSize) * this.numChannels;
                                neighborEdgeWalk = -(this.numChannels * cubeMapSize);
                                break;
                            case PMREMGenerator.CP_EDGE_RIGHT:
                                neighborEdgeStartIndex += ((cubeMapSize - 1) * (cubeMapSize) + (cubeMapSize - 1)) * this.numChannels;
                                neighborEdgeWalk = -(this.numChannels * cubeMapSize);
                                break;
                            case PMREMGenerator.CP_EDGE_TOP:
                                neighborEdgeStartIndex += (cubeMapSize - 1) * this.numChannels;
                                neighborEdgeWalk = -this.numChannels;
                                break;
                            case PMREMGenerator.CP_EDGE_BOTTOM:
                                neighborEdgeStartIndex += ((cubeMapSize - 1) * (cubeMapSize) + (cubeMapSize - 1)) * this.numChannels;
                                neighborEdgeWalk = -this.numChannels;
                                break;
                        }
                    }
                    else {
                        //swapped direction neighbor edge walk
                        switch (neighborEdge) {
                            case PMREMGenerator.CP_EDGE_LEFT:
                                //no change to neighborEdgeStartPtr for this case since it points 
                                // to the upper left corner already
                                neighborEdgeWalk = this.numChannels * cubeMapSize;
                                break;
                            case PMREMGenerator.CP_EDGE_RIGHT:
                                neighborEdgeStartIndex += (cubeMapSize - 1) * this.numChannels;
                                neighborEdgeWalk = this.numChannels * cubeMapSize;
                                break;
                            case PMREMGenerator.CP_EDGE_TOP:
                                //no change to neighborEdgeStartPtr for this case since it points 
                                // to the upper left corner already
                                neighborEdgeWalk = this.numChannels;
                                break;
                            case PMREMGenerator.CP_EDGE_BOTTOM:
                                neighborEdgeStartIndex += (cubeMapSize) * (cubeMapSize - 1) * this.numChannels;
                                neighborEdgeWalk = this.numChannels;
                                break;
                        }
                    }
                    //Perform edge walk, to average across the 12 edges and smoothly propagate change to 
                    //nearby neighborhood
                    //step ahead one texel on edge
                    edgeStartIndex += edgeWalk;
                    neighborEdgeStartIndex += neighborEdgeWalk;
                    // note that this loop does not process the corner texels, since they have already been
                    //  averaged across faces across earlier
                    for (j = 1; j < (cubeMapSize - 1); j++) {
                        //for each set of taps along edge, average them
                        // and rewrite the results into the edges
                        for (k = 0; k < this.numChannels; k++) {
                            var edgeTap = cubeMap[face][edgeStartIndex + k];
                            var neighborEdgeTap = cubeMap[neighborFace][neighborEdgeStartIndex + k];
                            //compute average of tap intensity values
                            var avgTap = 0.5 * (edgeTap + neighborEdgeTap);
                            //propagate average of taps to edge taps
                            cubeMap[face][edgeStartIndex + k] = avgTap;
                            cubeMap[neighborFace][neighborEdgeStartIndex + k] = avgTap;
                        }
                        edgeStartIndex += edgeWalk;
                        neighborEdgeStartIndex += neighborEdgeWalk;
                    }
                }
            };
            PMREMGenerator.CP_MAX_MIPLEVELS = 16;
            PMREMGenerator.CP_UDIR = 0;
            PMREMGenerator.CP_VDIR = 1;
            PMREMGenerator.CP_FACEAXIS = 2;
            //used to index cube faces
            PMREMGenerator.CP_FACE_X_POS = 0;
            PMREMGenerator.CP_FACE_X_NEG = 1;
            PMREMGenerator.CP_FACE_Y_POS = 2;
            PMREMGenerator.CP_FACE_Y_NEG = 3;
            PMREMGenerator.CP_FACE_Z_POS = 4;
            PMREMGenerator.CP_FACE_Z_NEG = 5;
            //used to index image edges
            // NOTE.. the actual number corresponding to the edge is important
            //  do not change these, or the code will break
            //
            // CP_EDGE_LEFT   is u = 0
            // CP_EDGE_RIGHT  is u = width-1
            // CP_EDGE_TOP    is v = 0
            // CP_EDGE_BOTTOM is v = height-1
            PMREMGenerator.CP_EDGE_LEFT = 0;
            PMREMGenerator.CP_EDGE_RIGHT = 1;
            PMREMGenerator.CP_EDGE_TOP = 2;
            PMREMGenerator.CP_EDGE_BOTTOM = 3;
            //corners of CUBE map (P or N specifys if it corresponds to the 
            //  positive or negative direction each of X, Y, and Z
            PMREMGenerator.CP_CORNER_NNN = 0;
            PMREMGenerator.CP_CORNER_NNP = 1;
            PMREMGenerator.CP_CORNER_NPN = 2;
            PMREMGenerator.CP_CORNER_NPP = 3;
            PMREMGenerator.CP_CORNER_PNN = 4;
            PMREMGenerator.CP_CORNER_PNP = 5;
            PMREMGenerator.CP_CORNER_PPN = 6;
            PMREMGenerator.CP_CORNER_PPP = 7;
            PMREMGenerator._vectorTemp = new BABYLON.Vector4(0, 0, 0, 0);
            //3x2 matrices that map cube map indexing vectors in 3d 
            // (after face selection and divide through by the 
            //  _ABSOLUTE VALUE_ of the max coord)
            // into NVC space
            //Note this currently assumes the D3D cube face ordering and orientation
            PMREMGenerator._sgFace2DMapping = [
                //XPOS face
                [[0, 0, -1],
                    [0, -1, 0],
                    [1, 0, 0]],
                //XNEG face
                [[0, 0, 1],
                    [0, -1, 0],
                    [-1, 0, 0]],
                //YPOS face
                [[1, 0, 0],
                    [0, 0, 1],
                    [0, 1, 0]],
                //YNEG face
                [[1, 0, 0],
                    [0, 0, -1],
                    [0, -1, 0]],
                //ZPOS face
                [[1, 0, 0],
                    [0, -1, 0],
                    [0, 0, 1]],
                //ZNEG face
                [[-1, 0, 0],
                    [0, -1, 0],
                    [0, 0, -1]],
            ];
            //------------------------------------------------------------------------------
            // D3D cube map face specification
            //   mapping from 3D x,y,z cube map lookup coordinates 
            //   to 2D within face u,v coordinates
            //
            //   --------------------> U direction 
            //   |                   (within-face texture space)
            //   |         _____
            //   |        |     |
            //   |        | +Y  |
            //   |   _____|_____|_____ _____
            //   |  |     |     |     |     |
            //   |  | -X  | +Z  | +X  | -Z  |
            //   |  |_____|_____|_____|_____|
            //   |        |     |
            //   |        | -Y  |
            //   |        |_____|
            //   |
            //   v   V direction
            //      (within-face texture space)
            //------------------------------------------------------------------------------
            //Information about neighbors and how texture coorrdinates change across faces 
            //  in ORDER of left, right, top, bottom (e.g. edges corresponding to u=0, 
            //  u=1, v=0, v=1 in the 2D coordinate system of the particular face.
            //Note this currently assumes the D3D cube face ordering and orientation
            PMREMGenerator._sgCubeNgh = [
                //XPOS face
                [[PMREMGenerator.CP_FACE_Z_POS, PMREMGenerator.CP_EDGE_RIGHT],
                    [PMREMGenerator.CP_FACE_Z_NEG, PMREMGenerator.CP_EDGE_LEFT],
                    [PMREMGenerator.CP_FACE_Y_POS, PMREMGenerator.CP_EDGE_RIGHT],
                    [PMREMGenerator.CP_FACE_Y_NEG, PMREMGenerator.CP_EDGE_RIGHT]],
                //XNEG face
                [[PMREMGenerator.CP_FACE_Z_NEG, PMREMGenerator.CP_EDGE_RIGHT],
                    [PMREMGenerator.CP_FACE_Z_POS, PMREMGenerator.CP_EDGE_LEFT],
                    [PMREMGenerator.CP_FACE_Y_POS, PMREMGenerator.CP_EDGE_LEFT],
                    [PMREMGenerator.CP_FACE_Y_NEG, PMREMGenerator.CP_EDGE_LEFT]],
                //YPOS face
                [[PMREMGenerator.CP_FACE_X_NEG, PMREMGenerator.CP_EDGE_TOP],
                    [PMREMGenerator.CP_FACE_X_POS, PMREMGenerator.CP_EDGE_TOP],
                    [PMREMGenerator.CP_FACE_Z_NEG, PMREMGenerator.CP_EDGE_TOP],
                    [PMREMGenerator.CP_FACE_Z_POS, PMREMGenerator.CP_EDGE_TOP]],
                //YNEG face
                [[PMREMGenerator.CP_FACE_X_NEG, PMREMGenerator.CP_EDGE_BOTTOM],
                    [PMREMGenerator.CP_FACE_X_POS, PMREMGenerator.CP_EDGE_BOTTOM],
                    [PMREMGenerator.CP_FACE_Z_POS, PMREMGenerator.CP_EDGE_BOTTOM],
                    [PMREMGenerator.CP_FACE_Z_NEG, PMREMGenerator.CP_EDGE_BOTTOM]],
                //ZPOS face
                [[PMREMGenerator.CP_FACE_X_NEG, PMREMGenerator.CP_EDGE_RIGHT],
                    [PMREMGenerator.CP_FACE_X_POS, PMREMGenerator.CP_EDGE_LEFT],
                    [PMREMGenerator.CP_FACE_Y_POS, PMREMGenerator.CP_EDGE_BOTTOM],
                    [PMREMGenerator.CP_FACE_Y_NEG, PMREMGenerator.CP_EDGE_TOP]],
                //ZNEG face
                [[PMREMGenerator.CP_FACE_X_POS, PMREMGenerator.CP_EDGE_RIGHT],
                    [PMREMGenerator.CP_FACE_X_NEG, PMREMGenerator.CP_EDGE_LEFT],
                    [PMREMGenerator.CP_FACE_Y_POS, PMREMGenerator.CP_EDGE_TOP],
                    [PMREMGenerator.CP_FACE_Y_NEG, PMREMGenerator.CP_EDGE_BOTTOM]]
            ];
            //The 12 edges of the cubemap, (entries are used to index into the neighbor table)
            // this table is used to average over the edges.
            PMREMGenerator._sgCubeEdgeList = [
                [PMREMGenerator.CP_FACE_X_POS, PMREMGenerator.CP_EDGE_LEFT],
                [PMREMGenerator.CP_FACE_X_POS, PMREMGenerator.CP_EDGE_RIGHT],
                [PMREMGenerator.CP_FACE_X_POS, PMREMGenerator.CP_EDGE_TOP],
                [PMREMGenerator.CP_FACE_X_POS, PMREMGenerator.CP_EDGE_BOTTOM],
                [PMREMGenerator.CP_FACE_X_NEG, PMREMGenerator.CP_EDGE_LEFT],
                [PMREMGenerator.CP_FACE_X_NEG, PMREMGenerator.CP_EDGE_RIGHT],
                [PMREMGenerator.CP_FACE_X_NEG, PMREMGenerator.CP_EDGE_TOP],
                [PMREMGenerator.CP_FACE_X_NEG, PMREMGenerator.CP_EDGE_BOTTOM],
                [PMREMGenerator.CP_FACE_Z_POS, PMREMGenerator.CP_EDGE_TOP],
                [PMREMGenerator.CP_FACE_Z_POS, PMREMGenerator.CP_EDGE_BOTTOM],
                [PMREMGenerator.CP_FACE_Z_NEG, PMREMGenerator.CP_EDGE_TOP],
                [PMREMGenerator.CP_FACE_Z_NEG, PMREMGenerator.CP_EDGE_BOTTOM]
            ];
            //Information about which of the 8 cube corners are correspond to the 
            //  the 4 corners in each cube face
            //  the order is upper left, upper right, lower left, lower right
            PMREMGenerator._sgCubeCornerList = [
                [PMREMGenerator.CP_CORNER_PPP, PMREMGenerator.CP_CORNER_PPN, PMREMGenerator.CP_CORNER_PNP, PMREMGenerator.CP_CORNER_PNN],
                [PMREMGenerator.CP_CORNER_NPN, PMREMGenerator.CP_CORNER_NPP, PMREMGenerator.CP_CORNER_NNN, PMREMGenerator.CP_CORNER_NNP],
                [PMREMGenerator.CP_CORNER_NPN, PMREMGenerator.CP_CORNER_PPN, PMREMGenerator.CP_CORNER_NPP, PMREMGenerator.CP_CORNER_PPP],
                [PMREMGenerator.CP_CORNER_NNP, PMREMGenerator.CP_CORNER_PNP, PMREMGenerator.CP_CORNER_NNN, PMREMGenerator.CP_CORNER_PNN],
                [PMREMGenerator.CP_CORNER_NPP, PMREMGenerator.CP_CORNER_PPP, PMREMGenerator.CP_CORNER_NNP, PMREMGenerator.CP_CORNER_PNP],
                [PMREMGenerator.CP_CORNER_PPN, PMREMGenerator.CP_CORNER_NPN, PMREMGenerator.CP_CORNER_PNN, PMREMGenerator.CP_CORNER_NNN] // ZNEG face
            ];
            return PMREMGenerator;
        })();
        Internals.PMREMGenerator = PMREMGenerator;
    })(Internals = BABYLON.Internals || (BABYLON.Internals = {}));
})(BABYLON || (BABYLON = {}));
