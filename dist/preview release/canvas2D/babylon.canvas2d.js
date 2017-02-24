BABYLON.Effect.ShadersStore['ellipse2dPixelShader'] = "varying vec4 vColor;\nvoid main(void) {\ngl_FragColor=vColor;\n}";
BABYLON.Effect.ShadersStore['ellipse2dVertexShader'] = "\n#ifdef Instanced\n#define att attribute\n#else\n#define att uniform\n#endif\nattribute float index;\natt vec2 zBias;\natt vec4 transformX;\natt vec4 transformY;\natt float opacity;\n#ifdef Border\natt float borderThickness;\n#endif\n#ifdef FillSolid\natt vec4 fillSolidColor;\n#endif\n#ifdef BorderSolid\natt vec4 borderSolidColor;\n#endif\n#ifdef FillGradient\natt vec4 fillGradientColor1;\natt vec4 fillGradientColor2;\natt vec4 fillGradientTY;\n#endif\n#ifdef BorderGradient\natt vec4 borderGradientColor1;\natt vec4 borderGradientColor2;\natt vec4 borderGradientTY;\n#endif\n\natt vec3 properties;\n#define TWOPI 6.28318530\n\nvarying vec2 vUV;\nvarying vec4 vColor;\nvoid main(void) {\nvec2 pos2;\n#ifdef Border\nfloat w=properties.x;\nfloat h=properties.y;\nfloat ms=properties.z;\nvec2 borderOffset=vec2(1.0,1.0);\nfloat segi=index;\nif (index<ms) {\nborderOffset=vec2(1.0-(borderThickness*2.0/w),1.0-(borderThickness*2.0/h));\n}\nelse {\nsegi-=ms;\n}\nfloat angle=TWOPI*segi/ms;\npos2.x=(cos(angle)/2.0)+0.5;\npos2.y=(sin(angle)/2.0)+0.5;\npos2.x=((pos2.x-0.5)*borderOffset.x)+0.5;\npos2.y=((pos2.y-0.5)*borderOffset.y)+0.5;\n#else\nif (index == 0.0) {\npos2=vec2(0.5,0.5);\n}\nelse {\nfloat ms=properties.z;\nfloat angle=TWOPI*(index-1.0)/ms;\npos2.x=(cos(angle)/2.0)+0.5;\npos2.y=(sin(angle)/2.0)+0.5;\n}\n#endif\n#ifdef FillSolid\nvColor=fillSolidColor;\n#endif\n#ifdef BorderSolid\nvColor=borderSolidColor;\n#endif\n#ifdef FillGradient\nfloat v=dot(vec4(pos2.xy,1,1),fillGradientTY);\nvColor=mix(fillGradientColor2,fillGradientColor1,v); \n#endif\n#ifdef BorderGradient\nfloat v=dot(vec4(pos2.xy,1,1),borderGradientTY);\nvColor=mix(borderGradientColor2,borderGradientColor1,v); \n#endif\nvColor.a*=opacity;\nvec4 pos;\npos.xy=pos2.xy*properties.xy;\npos.z=1.0;\npos.w=1.0;\ngl_Position=vec4(dot(pos,transformX),dot(pos,transformY),zBias.x,1);\n}";
BABYLON.Effect.ShadersStore['lines2dPixelShader'] = "varying vec4 vColor;\nvoid main(void) {\ngl_FragColor=vColor;\n}";
BABYLON.Effect.ShadersStore['lines2dVertexShader'] = "\n#ifdef Instanced\n#define att attribute\n#else\n#define att uniform\n#endif\nattribute vec2 position;\natt vec2 zBias;\natt vec4 transformX;\natt vec4 transformY;\natt float opacity;\n#ifdef FillSolid\natt vec4 fillSolidColor;\n#endif\n#ifdef BorderSolid\natt vec4 borderSolidColor;\n#endif\n#ifdef FillGradient\natt vec2 boundingMin;\natt vec2 boundingMax;\natt vec4 fillGradientColor1;\natt vec4 fillGradientColor2;\natt vec4 fillGradientTY;\n#endif\n#ifdef BorderGradient\natt vec4 borderGradientColor1;\natt vec4 borderGradientColor2;\natt vec4 borderGradientTY;\n#endif\n#define TWOPI 6.28318530\n\nvarying vec2 vUV;\nvarying vec4 vColor;\nvoid main(void) {\n#ifdef FillSolid\nvColor=fillSolidColor;\n#endif\n#ifdef BorderSolid\nvColor=borderSolidColor;\n#endif\n#ifdef FillGradient\nfloat v=dot(vec4((position.xy-boundingMin)/(boundingMax-boundingMin),1,1),fillGradientTY);\nvColor=mix(fillGradientColor2,fillGradientColor1,v); \n#endif\n#ifdef BorderGradient\nfloat v=dot(vec4((position.xy-boundingMin)/(boundingMax-boundingMin),1,1),borderGradientTY);\nvColor=mix(borderGradientColor2,borderGradientColor1,v); \n#endif\nvColor.a*=opacity;\nvec4 pos;\npos.xy=position.xy;\npos.z=1.0;\npos.w=1.0;\ngl_Position=vec4(dot(pos,transformX),dot(pos,transformY),zBias.x,1);\n}";
BABYLON.Effect.ShadersStore['rect2dPixelShader'] = "varying vec4 vColor;\nvoid main(void) {\ngl_FragColor=vColor;\n}";
BABYLON.Effect.ShadersStore['rect2dVertexShader'] = "\n#ifdef Instanced\n#define att attribute\n#else\n#define att uniform\n#endif\nattribute float index;\natt vec2 zBias;\natt vec4 transformX;\natt vec4 transformY;\natt float opacity;\n#ifdef Border\natt float borderThickness;\n#endif\n#ifdef FillSolid\natt vec4 fillSolidColor;\n#endif\n#ifdef BorderSolid\natt vec4 borderSolidColor;\n#endif\n#ifdef FillGradient\natt vec4 fillGradientColor1;\natt vec4 fillGradientColor2;\natt vec4 fillGradientTY;\n#endif\n#ifdef BorderGradient\natt vec4 borderGradientColor1;\natt vec4 borderGradientColor2;\natt vec4 borderGradientTY;\n#endif\n\natt vec3 properties;\n\n#define rsub0 17.0\n#define rsub1 33.0\n#define rsub2 49.0\n#define rsub3 65.0\n#define rsub 64.0\n#define TWOPI 6.28318530\n\nvarying vec2 vUV;\nvarying vec4 vColor;\nvoid main(void) {\nvec2 pos2;\n\nif (properties.z == 0.0) {\n#ifdef Border\nfloat w=properties.x;\nfloat h=properties.y;\nvec2 borderOffset=vec2(1.0,1.0);\nfloat segi=index;\nif (index<4.0) {\nborderOffset=vec2(1.0-(borderThickness*2.0/w),1.0-(borderThickness*2.0/h));\n}\nelse {\nsegi-=4.0;\n}\nif (segi == 0.0) {\npos2=vec2(1.0,1.0);\n} \nelse if (segi == 1.0) {\npos2=vec2(1.0,0.0);\n}\nelse if (segi == 2.0) {\npos2=vec2(0.0,0.0);\n} \nelse {\npos2=vec2(0.0,1.0);\n}\npos2.x=((pos2.x-0.5)*borderOffset.x)+0.5;\npos2.y=((pos2.y-0.5)*borderOffset.y)+0.5;\n#else\nif (index == 0.0) {\npos2=vec2(0.5,0.5);\n}\nelse if (index == 1.0) {\npos2=vec2(1.0,1.0);\n}\nelse if (index == 2.0) {\npos2=vec2(1.0,0.0);\n}\nelse if (index == 3.0) {\npos2=vec2(0.0,0.0);\n}\nelse {\npos2=vec2(0.0,1.0);\n}\n#endif\n}\nelse\n{\n#ifdef Border\nfloat w=properties.x;\nfloat h=properties.y;\nfloat r=properties.z;\nfloat nru=r/w;\nfloat nrv=r/h;\nvec2 borderOffset=vec2(1.0,1.0);\nfloat segi=index;\nif (index<rsub) {\nborderOffset=vec2(1.0-(borderThickness*2.0/w),1.0-(borderThickness*2.0/h));\n}\nelse {\nsegi-=rsub;\n}\n\nif (segi<rsub0) {\npos2=vec2(1.0-nru,nrv);\n}\n\nelse if (segi<rsub1) {\npos2=vec2(nru,nrv);\n}\n\nelse if (segi<rsub2) {\npos2=vec2(nru,1.0-nrv);\n}\n\nelse {\npos2=vec2(1.0-nru,1.0-nrv);\n}\nfloat angle=TWOPI-((index-1.0)*TWOPI/(rsub-0.5));\npos2.x+=cos(angle)*nru;\npos2.y+=sin(angle)*nrv;\npos2.x=((pos2.x-0.5)*borderOffset.x)+0.5;\npos2.y=((pos2.y-0.5)*borderOffset.y)+0.5;\n#else\nif (index == 0.0) {\npos2=vec2(0.5,0.5);\n}\nelse {\nfloat w=properties.x;\nfloat h=properties.y;\nfloat r=properties.z;\nfloat nru=r/w;\nfloat nrv=r/h;\n\nif (index<rsub0) {\npos2=vec2(1.0-nru,nrv);\n}\n\nelse if (index<rsub1) {\npos2=vec2(nru,nrv);\n}\n\nelse if (index<rsub2) {\npos2=vec2(nru,1.0-nrv);\n}\n\nelse {\npos2=vec2(1.0-nru,1.0-nrv);\n}\nfloat angle=TWOPI-((index-1.0)*TWOPI/(rsub-0.5));\npos2.x+=cos(angle)*nru;\npos2.y+=sin(angle)*nrv;\n}\n#endif\n}\n#ifdef FillSolid\nvColor=fillSolidColor;\n#endif\n#ifdef BorderSolid\nvColor=borderSolidColor;\n#endif\n#ifdef FillGradient\nfloat v=dot(vec4(pos2.xy,1,1),fillGradientTY);\nvColor=mix(fillGradientColor2,fillGradientColor1,v); \n#endif\n#ifdef BorderGradient\nfloat v=dot(vec4(pos2.xy,1,1),borderGradientTY);\nvColor=mix(borderGradientColor2,borderGradientColor1,v); \n#endif\nvColor.a*=opacity;\nvec4 pos;\npos.xy=pos2.xy*properties.xy;\npos.z=1.0;\npos.w=1.0;\ngl_Position=vec4(dot(pos,transformX),dot(pos,transformY),zBias.x,1);\n}";
BABYLON.Effect.ShadersStore['sprite2dPixelShader'] = "varying vec2 vUV;\nvarying float vOpacity;\n#ifdef Scale9\nvarying vec2 vTopLeftUV;\nvarying vec2 vBottomRightUV;\nvarying vec4 vScale9;\nvarying vec2 vScaleFactor;\n#endif\nuniform bool alphaTest;\nuniform sampler2D diffuseSampler;\nvoid main(void) {\nvec2 uv=vUV;\n#ifdef Scale9\nvec2 sizeUV=vBottomRightUV-vTopLeftUV;\n\nfloat leftPartUV=vTopLeftUV.x+(vScale9.x/vScaleFactor.x);\nfloat rightPartUV=vTopLeftUV.x+sizeUV.x-((sizeUV.x-vScale9.z)/vScaleFactor.x);\nif (vUV.x<leftPartUV) {\nuv.x=vTopLeftUV.x+((vUV.x- vTopLeftUV.x)*vScaleFactor.x);\n}\nelse if (vUV.x>rightPartUV) {\nuv.x=vTopLeftUV.x+vScale9.z+((vUV.x-rightPartUV)*vScaleFactor.x);\n}\nelse {\nfloat r=(vUV.x-leftPartUV)/(rightPartUV-leftPartUV);\nuv.x=vTopLeftUV.x+vScale9.x+((vScale9.z-vScale9.x)*r);\n}\n\nfloat topPartUV=(vTopLeftUV.y+(vScale9.y/vScaleFactor.y));\nfloat bottomPartUV=(vTopLeftUV.y+sizeUV.y-((sizeUV.y-vScale9.w)/vScaleFactor.y));\nif (vUV.y<topPartUV) {\nuv.y=vTopLeftUV.y+((vUV.y-vTopLeftUV.y)*vScaleFactor.y);\n}\nelse if (vUV.y>bottomPartUV) {\nuv.y=vTopLeftUV.y+vScale9.w+((vUV.y-bottomPartUV)*vScaleFactor.y);\n}\nelse {\nfloat r=(vUV.y-topPartUV)/(bottomPartUV-topPartUV);\nuv.y=vTopLeftUV.y+vScale9.y+((vScale9.w-vScale9.y)*r);\n}\n#endif\nvec4 color=texture2D(diffuseSampler,uv);\nif (alphaTest)\n{\nif (color.a<0.95) {\ndiscard;\n}\n}\ncolor.a*=vOpacity;\ngl_FragColor=color;\n}";
BABYLON.Effect.ShadersStore['sprite2dVertexShader'] = "\n#ifdef Instanced\n#define att attribute\n#else\n#define att uniform\n#endif\n\nattribute float index;\natt vec2 topLeftUV;\natt vec2 sizeUV;\n#ifdef Scale9\natt vec2 scaleFactor;\n#endif\natt vec2 textureSize;\n\natt vec3 properties;\n#ifdef Scale9\natt vec4 scale9;\n#endif\natt vec2 zBias;\natt vec4 transformX;\natt vec4 transformY;\natt float opacity;\n\n\nvarying vec2 vUV;\nvarying float vOpacity;\n#ifdef Scale9\nvarying vec2 vTopLeftUV;\nvarying vec2 vBottomRightUV;\nvarying vec4 vScale9;\nvarying vec2 vScaleFactor;\n#endif\nvoid main(void) {\nvec2 pos2;\nfloat frame=properties.x;\nfloat invertY=properties.y;\nfloat alignToPixel=properties.z;\n\nif (index == 0.0) {\npos2=vec2(0.0,0.0);\nvUV=vec2(topLeftUV.x+(frame*sizeUV.x),topLeftUV.y);\n}\n\nelse if (index == 1.0) {\npos2=vec2(0.0,1.0);\nvUV=vec2(topLeftUV.x+(frame*sizeUV.x),(topLeftUV.y+sizeUV.y));\n}\n\nelse if (index == 2.0) {\npos2=vec2( 1.0,1.0);\nvUV=vec2(topLeftUV.x+sizeUV.x+(frame*sizeUV.x),(topLeftUV.y+sizeUV.y));\n}\n\nelse if (index == 3.0) {\npos2=vec2( 1.0,0.0);\nvUV=vec2(topLeftUV.x+sizeUV.x+(frame*sizeUV.x),topLeftUV.y);\n}\nif (invertY == 1.0) {\nvUV.y=1.0-vUV.y;\n}\nvec4 pos;\nif (alignToPixel == 1.0)\n{\npos.xy=floor(pos2.xy*sizeUV*textureSize);\n} else {\npos.xy=pos2.xy*sizeUV*textureSize;\n}\n#ifdef Scale9\nif (invertY == 1.0) {\nvTopLeftUV=vec2(topLeftUV.x,1.0-(topLeftUV.y+sizeUV.y));\nvBottomRightUV=vec2(topLeftUV.x+sizeUV.x,1.0-topLeftUV.y);\nvScale9=vec4(scale9.x,sizeUV.y-scale9.w,scale9.z,sizeUV.y-scale9.y);\n}\nelse {\nvTopLeftUV=topLeftUV;\nvBottomRightUV=vec2(topLeftUV.x,topLeftUV.y+sizeUV.y);\nvScale9=scale9;\n}\nvScaleFactor=scaleFactor;\n#endif\nvOpacity=opacity;\npos.z=1.0;\npos.w=1.0;\ngl_Position=vec4(dot(pos,transformX),dot(pos,transformY),zBias.x,1);\n} ";
BABYLON.Effect.ShadersStore['text2dPixelShader'] = "\nvarying vec4 vColor;\nvarying vec2 vUV;\n\nuniform sampler2D diffuseSampler;\nvoid main(void) {\n#ifdef SignedDistanceField\nfloat dist=texture2D(diffuseSampler,vUV).r;\nif (dist<0.5) {\ndiscard;\n}\n\n\n\n\n\ngl_FragColor=vec4(vColor.xyz*dist,vColor.a);\n#else\nvec4 color=texture2D(diffuseSampler,vUV);\ngl_FragColor=color*vColor;\n#endif\n}";
BABYLON.Effect.ShadersStore['text2dVertexShader'] = "\n#ifdef Instanced\n#define att attribute\n#else\n#define att uniform\n#endif\n\nattribute float index;\natt vec2 zBias;\natt vec4 transformX;\natt vec4 transformY;\natt float opacity;\natt vec2 topLeftUV;\natt vec2 sizeUV;\natt vec2 textureSize;\natt vec4 color;\natt float superSampleFactor;\n\nvarying vec2 vUV;\nvarying vec4 vColor;\nvoid main(void) {\nvec2 pos2;\n\nif (index == 0.0) {\npos2=vec2(0.0,0.0);\nvUV=vec2(topLeftUV.x,topLeftUV.y+sizeUV.y);\n}\n\nelse if (index == 1.0) {\npos2=vec2(0.0,1.0);\nvUV=vec2(topLeftUV.x,topLeftUV.y);\n}\n\nelse if (index == 2.0) {\npos2=vec2(1.0,1.0);\nvUV=vec2(topLeftUV.x+sizeUV.x,topLeftUV.y);\n}\n\nelse if (index == 3.0) {\npos2=vec2(1.0,0.0);\nvUV=vec2(topLeftUV.x+sizeUV.x,topLeftUV.y+sizeUV.y);\n}\n\nvUV=(floor(vUV*textureSize)+vec2(0.0,0.0))/textureSize;\nvColor=color;\nvColor.a*=opacity;\nvec4 pos;\npos.xy=floor(pos2.xy*superSampleFactor*sizeUV*textureSize); \npos.z=1.0;\npos.w=1.0;\ngl_Position=vec4(dot(pos,transformX),dot(pos,transformY),zBias.x,1);\n}";
BABYLON.Effect.ShadersStore['wireframe2dPixelShader'] = "varying vec4 vColor;\nvoid main(void) {\ngl_FragColor=vColor;\n}";
BABYLON.Effect.ShadersStore['wireframe2dVertexShader'] = "\n#ifdef Instanced\n#define att attribute\n#else\n#define att uniform\n#endif\n\nattribute vec2 pos;\nattribute vec4 col;\n\n\n\n\natt vec3 properties;\natt vec2 zBias;\natt vec4 transformX;\natt vec4 transformY;\natt float opacity;\n\n\nvarying vec4 vColor;\nvoid main(void) {\nvec4 p=vec4(pos.xy,1.0,1.0);\nvColor=vec4(col.xyz,col.w*opacity);\nvec4 pp=vec4(dot(p,transformX),dot(p,transformY),zBias.x,1);\nif (properties.x == 1.0) {\npp.xy=pp.xy-mod(pp.xy,properties.yz)+(properties.yz*0.5);\n}\ngl_Position=pp;\n} ";

var BABYLON;
(function (BABYLON) {
    /**
     * This class stores the data to make 2D transformation using a Translation (tX, tY), a Scale (sX, sY) and a rotation around the Z axis (rZ).
     * You can multiply two Transform2D object to produce the result of their concatenation.
     * You can transform a given Point (a Vector2D instance) with a Transform2D object or with the Invert of the Transform2D object.
     * There no need to compute/store the Invert of a Transform2D as the invertTranform methods are almost as fast as the transform ones.
     * This class is as light as it could be and the transformation operations are pretty optimal.
     */
    var Transform2D = (function () {
        function Transform2D() {
            this.translation = BABYLON.Vector2.Zero();
            this.rotation = 0;
            this.scale = new BABYLON.Vector2(1, 1);
        }
        /**
         * Set the Transform2D object with the given values
         * @param translation The translation to set
         * @param rotation The rotation (in radian) to set
         * @param scale The scale to set
         */
        Transform2D.prototype.set = function (translation, rotation, scale) {
            this.translation.copyFrom(translation);
            this.rotation = rotation;
            this.scale.copyFrom(scale);
        };
        /**
         * Set the Transform2D object from float values
         * @param transX The translation on X axis, nothing is set if not specified
         * @param transY The translation on Y axis, nothing is set if not specified
         * @param rotation The rotation in radian, nothing is set if not specified
         * @param scaleX The scale along the X axis, nothing is set if not specified
         * @param scaleY The scale along the Y axis, nothing is set if not specified
         */
        Transform2D.prototype.setFromFloats = function (transX, transY, rotation, scaleX, scaleY) {
            if (transX) {
                this.translation.x = transX;
            }
            if (transY) {
                this.translation.y = transY;
            }
            if (rotation) {
                this.rotation = rotation;
            }
            if (scaleX) {
                this.scale.x = scaleX;
            }
            if (scaleY) {
                this.scale.y = scaleY;
            }
        };
        /**
         * Return a copy of the object
         */
        Transform2D.prototype.clone = function () {
            var res = new Transform2D();
            res.translation.copyFrom(this.translation);
            res.rotation = this.rotation;
            res.scale.copyFrom(this.scale);
            return res;
        };
        /**
         * Convert a given degree angle into its radian equivalent
         * @param angleDegree the number to convert
         */
        Transform2D.ToRadian = function (angleDegree) {
            return angleDegree * Math.PI * 2 / 360;
        };
        /**
         * Create a new instance and returns it
         * @param translation The translation to store, default is (0,0)
         * @param rotation The rotation to store, default is 0
         * @param scale The scale to store, default is (1,1)
         */
        Transform2D.Make = function (translation, rotation, scale) {
            var res = new Transform2D();
            if (translation) {
                res.translation.copyFrom(translation);
            }
            if (rotation) {
                res.rotation = rotation;
            }
            if (scale) {
                res.scale.copyFrom(scale);
            }
            return res;
        };
        /**
         * Set the given Transform2D object with the given values
         * @param translation The translation to store, default is (0,0)
         * @param rotation The rotation to store, default is 0
         * @param scale The scale to store, default is (1,1)
         */
        Transform2D.MakeToRef = function (res, translation, rotation, scale) {
            if (translation) {
                res.translation.copyFrom(translation);
            }
            else {
                res.translation.copyFromFloats(0, 0);
            }
            if (rotation) {
                res.rotation = rotation;
            }
            else {
                res.rotation = 0;
            }
            if (scale) {
                res.scale.copyFrom(scale);
            }
            else {
                res.scale.copyFromFloats(1, 1);
            }
        };
        /**
         * Create a Transform2D object from float values
         * @param transX The translation on X axis, 0 per default
         * @param transY The translation on Y axis, 0 per default
         * @param rotation The rotation in radian, 0 per default
         * @param scaleX The scale along the X axis, 1 per default
         * @param scaleY The scale along the Y axis, 1 per default
         */
        Transform2D.MakeFromFloats = function (transX, transY, rotation, scaleX, scaleY) {
            var res = new Transform2D();
            if (transX) {
                res.translation.x = transX;
            }
            if (transY) {
                res.translation.y = transY;
            }
            if (rotation) {
                res.rotation = rotation;
            }
            if (scaleX) {
                res.scale.x = scaleX;
            }
            if (scaleY) {
                res.scale.y = scaleY;
            }
            return res;
        };
        /**
         * Set the given Transform2D object with the given float values
         * @param transX The translation on X axis, 0 per default
         * @param transY The translation on Y axis, 0 per default
         * @param rotation The rotation in radian, 0 per default
         * @param scaleX The scale along the X axis, 1 per default
         * @param scaleY The scale along the Y axis, 1 per default
         */
        Transform2D.MakeFromFloatsToRef = function (res, transX, transY, rotation, scaleX, scaleY) {
            res.translation.x = (transX != null) ? transX : 0;
            res.translation.y = (transY != null) ? transY : 0;
            res.rotation = (rotation != null) ? rotation : 0;
            res.scale.x = (scaleX != null) ? scaleX : 1;
            res.scale.y = (scaleY != null) ? scaleY : 1;
        };
        /**
         * Create a Transform2D containing only Zeroed values
         */
        Transform2D.Zero = function () {
            var res = new Transform2D();
            res.scale.copyFromFloats(0, 0);
            return res;
        };
        /**
         * Copy the value of the other object into 'this'
         * @param other The other object to copy values from
         */
        Transform2D.prototype.copyFrom = function (other) {
            this.translation.copyFrom(other.translation);
            this.rotation = other.rotation;
            this.scale.copyFrom(other.scale);
        };
        Transform2D.prototype.toMatrix2D = function () {
            var res = new Matrix2D();
            this.toMatrix2DToRef(res);
            return res;
        };
        Transform2D.prototype.toMatrix2DToRef = function (res) {
            var tx = this.translation.x;
            var ty = this.translation.y;
            var r = this.rotation;
            var cosr = Math.cos(r);
            var sinr = Math.sin(r);
            var sx = this.scale.x;
            var sy = this.scale.y;
            res.m[0] = cosr * sx;
            res.m[1] = sinr * sy;
            res.m[2] = -sinr * sx;
            res.m[3] = cosr * sy;
            res.m[4] = tx;
            res.m[5] = ty;
        };
        /**
         * In place transformation from a parent matrix.
         * @param parent transform object. "this" will be the result of parent * this
         */
        Transform2D.prototype.multiplyToThis = function (parent) {
            this.multiplyToRef(parent, this);
        };
        /**
         * Transform this object with a parent and return the result. Result = parent * this
         * @param parent The parent transformation
         */
        Transform2D.prototype.multiply = function (parent) {
            var res = new Transform2D();
            this.multiplyToRef(parent, res);
            return res;
        };
        /**
         * Transform a point and store the result in the very same object
         * @param p Transform this point and change the values with the transformed ones
         */
        Transform2D.prototype.transformPointInPlace = function (p) {
            this.transformPointToRef(p, p);
        };
        /**
         * Transform a point and store the result into a reference object
         * @param p The point to transform
         * @param res Will contain the new transformed coordinates. Can be the object of 'p'.
         */
        Transform2D.prototype.transformPointToRef = function (p, res) {
            this.transformFloatsToRef(p.x, p.y, res);
        };
        /**
         * Transform this object with a parent and store the result in reference object
         * @param parent The parent transformation
         * @param result Will contain parent * this. Can be the object of either parent or 'this'
         */
        Transform2D.prototype.multiplyToRef = function (parent, result) {
            if (!parent || !result) {
                throw new Error("Valid parent and result objects must be specified");
            }
            var tx = this.translation.x;
            var ty = this.translation.y;
            var ptx = parent.translation.x;
            var pty = parent.translation.y;
            var pr = parent.rotation;
            var psx = parent.scale.x;
            var psy = parent.scale.y;
            var cosr = Math.cos(pr);
            var sinr = Math.sin(pr);
            result.translation.x = (((tx * cosr) - (ty * sinr)) * psx) + ptx;
            result.translation.y = (((tx * sinr) + (ty * cosr)) * psy) + pty;
            this.scale.multiplyToRef(parent.scale, result.scale);
            result.rotation = this.rotation;
        };
        /**
         * Transform the given coordinates and store the result in a Vector2 object
         * @param x The X coordinate to transform
         * @param y The Y coordinate to transform
         * @param res The Vector2 object that will contain the result of the transformation
         */
        Transform2D.prototype.transformFloatsToRef = function (x, y, res) {
            var tx = this.translation.x;
            var ty = this.translation.y;
            var pr = this.rotation;
            var sx = this.scale.x;
            var sy = this.scale.y;
            var cosr = Math.cos(pr);
            var sinr = Math.sin(pr);
            res.x = (((x * cosr) - (y * sinr)) * sx) + tx;
            res.y = (((x * sinr) + (y * cosr)) * sy) + ty;
        };
        /**
         * Invert transform the given coordinates and store the result in a reference object. res = invert(this) * (x,y)
         * @param p Transform this point and change the values with the transformed ones
         * @param res Will contain the result of the invert transformation.
         */
        Transform2D.prototype.invertTransformFloatsToRef = function (x, y, res) {
            var px = x - this.translation.x;
            var py = y - this.translation.y;
            var pr = -this.rotation;
            var sx = this.scale.x;
            var sy = this.scale.y;
            var psx = (sx === 1) ? 1 : (1 / sx);
            var psy = (sy === 1) ? 1 : (1 / sy);
            var cosr = Math.cos(pr);
            var sinr = Math.sin(pr);
            res.x = (((px * cosr) - (py * sinr)) * psx);
            res.y = (((px * sinr) + (py * cosr)) * psy);
        };
        /**
         * Transform a point and return the result
         * @param p the point to transform
         */
        Transform2D.prototype.transformPoint = function (p) {
            var res = BABYLON.Vector2.Zero();
            this.transformPointToRef(p, res);
            return res;
        };
        /**
         * Transform the given coordinates and return the result in a Vector2 object
         * @param x The X coordinate to transform
         * @param y The Y coordinate to transform
         */
        Transform2D.prototype.transformFloats = function (x, y) {
            var res = BABYLON.Vector2.Zero();
            this.transformFloatsToRef(x, y, res);
            return res;
        };
        /**
         * Invert transform a given point and store the result in the very same object. p = invert(this) * p
         * @param p Transform this point and change the values with the transformed ones
         */
        Transform2D.prototype.invertTransformPointInPlace = function (p) {
            this.invertTransformPointToRef(p, p);
        };
        /**
         * Invert transform a given point and store the result in a reference object. res = invert(this) * p
         * @param p Transform this point and change the values with the transformed ones
         * @param res Will contain the result of the invert transformation. 'res' can be the same object as 'p'
         */
        Transform2D.prototype.invertTransformPointToRef = function (p, res) {
            this.invertTransformFloatsToRef(p.x, p.y, res);
        };
        /**
         * Invert transform a given point and return the result. return = invert(this) * p
         * @param p The Point to transform
         */
        Transform2D.prototype.invertTransformPoint = function (p) {
            var res = BABYLON.Vector2.Zero();
            this.invertTransformPointToRef(p, res);
            return res;
        };
        /**
         * Invert transform the given coordinates and return the result. return = invert(this) * (x,y)
         * @param x The X coordinate to transform
         * @param y The Y coordinate to transform
         */
        Transform2D.prototype.invertTransformFloats = function (x, y) {
            var res = BABYLON.Vector2.Zero();
            this.invertTransformFloatsToRef(x, y, res);
            return res;
        };
        return Transform2D;
    }());
    BABYLON.Transform2D = Transform2D;
    /**
     * A class storing a Matrix for 2D transformations
     * The stored matrix is a 2*3 Matrix
     * I   [0,1]   [mX, mY]   R   [ CosZ, SinZ]  T    [ 0,  0]  S   [Sx,  0]
     * D = [2,3] = [nX, nY]   O = [-SinZ, CosZ]  R =  [ 0,  0]  C = [ 0, Sy]
     * X   [4,5]   [tX, tY]   T   [  0  ,  0  ]  N    [Tx, Ty]  L   [ 0,  0]
     *
     * IDX = index, zero based. ROT = Z axis Rotation. TRN = Translation. SCL = Scale.
     */
    var Matrix2D = (function () {
        function Matrix2D() {
            this.m = new Float32Array(6);
        }
        Matrix2D.Identity = function () {
            var res = new Matrix2D();
            Matrix2D.IdentityToRef(res);
            return res;
        };
        Matrix2D.IdentityToRef = function (res) {
            res.m[1] = res.m[2] = res.m[4] = res.m[5] = 0;
            res.m[0] = res.m[3] = 1;
        };
        Matrix2D.prototype.copyFrom = function (other) {
            for (var i = 0; i < 6; i++) {
                this.m[i] = other.m[i];
            }
        };
        Matrix2D.prototype.determinant = function () {
            return (this.m[0] * this.m[3]) - (this.m[1] * this.m[2]);
        };
        Matrix2D.prototype.invertToThis = function () {
            this.invertToRef(this);
        };
        Matrix2D.prototype.invert = function () {
            var res = new Matrix2D();
            this.invertToRef(res);
            return res;
        };
        Matrix2D.prototype.invertToRef = function (res) {
            var a00 = this.m[0], a01 = this.m[1], a10 = this.m[2], a11 = this.m[3], a20 = this.m[4], a21 = this.m[5];
            var det21 = a21 * a10 - a11 * a20;
            var det = (a00 * a11) - (a01 * a10);
            if (det < (BABYLON.Epsilon * BABYLON.Epsilon)) {
                throw new Error("Can't invert matrix, near null determinant");
            }
            det = 1 / det;
            res.m[0] = a11 * det;
            res.m[1] = -a01 * det;
            res.m[2] = -a10 * det;
            res.m[3] = a00 * det;
            res.m[4] = det21 * det;
            res.m[5] = (-a21 * a00 + a01 * a20) * det;
        };
        Matrix2D.prototype.multiplyToThis = function (other) {
            this.multiplyToRef(other, this);
        };
        Matrix2D.prototype.multiply = function (other) {
            var res = new Matrix2D();
            this.multiplyToRef(other, res);
            return res;
        };
        Matrix2D.prototype.multiplyToRef = function (other, result) {
            var tm0 = this.m[0];
            var tm1 = this.m[1];
            //var tm2 = this.m[2];
            //var tm3 = this.m[3];
            var tm4 = this.m[2];
            var tm5 = this.m[3];
            //var tm6 = this.m[6];
            //var tm7 = this.m[7];
            var tm8 = this.m[4];
            var tm9 = this.m[5];
            //var tm10 = this.m[10];
            //var tm11 = this.m[11];
            //var tm12 = this.m[12];
            //var tm13 = this.m[13];
            //var tm14 = this.m[14];
            //var tm15 = this.m[15];
            var om0 = other.m[0];
            var om1 = other.m[1];
            //var om2 = other.m[2];
            //var om3 = other.m[3];
            var om4 = other.m[2];
            var om5 = other.m[3];
            //var om6 = other.m[6];
            //var om7 = other.m[7];
            var om8 = other.m[4];
            var om9 = other.m[5];
            //var om10 = other.m[10];
            //var om11 = other.m[11];
            //var om12 = other.m[12];
            //var om13 = other.m[13];
            //var om14 = other.m[14];
            //var om15 = other.m[15];
            result.m[0] = tm0 * om0 + tm1 * om4;
            result.m[1] = tm0 * om1 + tm1 * om5;
            //result.m[2] = tm0 * om2 + tm1 * om6 + tm2 * om10 + tm3 * om14;
            //result.m[3] = tm0 * om3 + tm1 * om7 + tm2 * om11 + tm3 * om15;
            result.m[2] = tm4 * om0 + tm5 * om4;
            result.m[3] = tm4 * om1 + tm5 * om5;
            //result.m[6] = tm4 * om2 + tm5 * om6 + tm6 * om10 + tm7 * om14;
            //result.m[7] = tm4 * om3 + tm5 * om7 + tm6 * om11 + tm7 * om15;
            result.m[4] = tm8 * om0 + tm9 * om4 + om8;
            result.m[5] = tm8 * om1 + tm9 * om5 + om9;
            //result.m[10] = tm8 * om2 + tm9 * om6 + tm10 * om10 + tm11 * om14;
            //result.m[11] = tm8 * om3 + tm9 * om7 + tm10 * om11 + tm11 * om15;
            //result.m[12] = tm12 * om0 + tm13 * om4 + tm14 * om8 + tm15 * om12;
            //result.m[13] = tm12 * om1 + tm13 * om5 + tm14 * om9 + tm15 * om13;
            //result.m[14] = tm12 * om2 + tm13 * om6 + tm14 * om10 + tm15 * om14;
            //result.m[15] = tm12 * om3 + tm13 * om7 + tm14 * om11 + tm15 * om15;
        };
        Matrix2D.prototype.transformFloats = function (x, y) {
            var res = BABYLON.Vector2.Zero();
            this.transformFloatsToRef(x, y, res);
            return res;
        };
        Matrix2D.prototype.transformFloatsToRef = function (x, y, r) {
            r.x = x * this.m[0] + y * this.m[2] + this.m[4];
            r.y = x * this.m[1] + y * this.m[3] + this.m[5];
        };
        Matrix2D.prototype.transformPoint = function (p) {
            var res = BABYLON.Vector2.Zero();
            this.transformFloatsToRef(p.x, p.y, res);
            return res;
        };
        Matrix2D.prototype.transformPointToRef = function (p, r) {
            this.transformFloatsToRef(p.x, p.y, r);
        };
        return Matrix2D;
    }());
    BABYLON.Matrix2D = Matrix2D;
    /**
     * Stores information about a 2D Triangle.
     * This class stores the 3 vertices but also the center and radius of the triangle
     */
    var Tri2DInfo = (function () {
        /**
         * Construct an instance of Tri2DInfo, you can either pass null to a, b and c and the instance will be allocated "clear", or give actual triangle info and the center/radius will be computed
         */
        function Tri2DInfo(a, b, c) {
            if (a === null && b === null && c === null) {
                this.a = BABYLON.Vector2.Zero();
                this.b = BABYLON.Vector2.Zero();
                this.c = BABYLON.Vector2.Zero();
                this.center = BABYLON.Vector2.Zero();
                this.radius = 0;
                return;
            }
            this.a = a.clone();
            this.b = b.clone();
            this.c = c.clone();
            this._updateCenterRadius();
        }
        Tri2DInfo.Zero = function () {
            return new Tri2DInfo(null, null, null);
        };
        Tri2DInfo.prototype.set = function (a, b, c) {
            this.a.copyFrom(a);
            this.b.copyFrom(b);
            this.c.copyFrom(c);
            this._updateCenterRadius();
        };
        Tri2DInfo.prototype.transformInPlace = function (transform) {
            BABYLON.Vector2.TransformToRef(this.a, transform, this.a);
            BABYLON.Vector2.TransformToRef(this.b, transform, this.b);
            BABYLON.Vector2.TransformToRef(this.c, transform, this.c);
            this._updateCenterRadius();
        };
        Tri2DInfo.prototype.doesContain = function (p) {
            return BABYLON.Vector2.PointInTriangle(p, this.a, this.b, this.c);
        };
        Tri2DInfo.prototype._updateCenterRadius = function () {
            this.center.x = (this.a.x + this.b.x + this.c.x) / 3;
            this.center.y = (this.a.y + this.b.y + this.c.y) / 3;
            var la = BABYLON.Vector2.DistanceSquared(this.a, this.center);
            var lb = BABYLON.Vector2.DistanceSquared(this.b, this.center);
            var lc = BABYLON.Vector2.DistanceSquared(this.c, this.center);
            var rs = Math.max(Math.max(la, lb), lc);
            this.radius = Math.sqrt(rs);
        };
        return Tri2DInfo;
    }());
    BABYLON.Tri2DInfo = Tri2DInfo;
    /**
     * Stores an array of 2D Triangles.
     * Internally the data is stored as a Float32Array to minimize the memory footprint.
     * This can use the Tri2DInfo class as proxy for storing/retrieving data.
     * The array can't grow, it's fixed size.
     */
    var Tri2DArray = (function () {
        function Tri2DArray(count) {
            this._count = count;
            this._array = new Float32Array(9 * count);
        }
        /**
         * Clear the content and allocate a new array to store the given count of triangles
         * @param count The new count of triangles to store
         */
        Tri2DArray.prototype.clear = function (count) {
            if (this._count === count) {
                return;
            }
            this._count = count;
            this._array = new Float32Array(9 * count);
        };
        /**
         * Store a given triangle at the given index
         * @param index the 0 based index to store the triangle in the array
         * @param a the A vertex of the triangle
         * @param b the B vertex of the triangle
         * @param c the C vertex of the triangle
         */
        Tri2DArray.prototype.storeTriangle = function (index, a, b, c) {
            var center = new BABYLON.Vector2((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3);
            var la = BABYLON.Vector2.DistanceSquared(a, center);
            var lb = BABYLON.Vector2.DistanceSquared(b, center);
            var lc = BABYLON.Vector2.DistanceSquared(c, center);
            var rs = Math.max(Math.max(la, lb), lc);
            var radius = Math.sqrt(rs);
            var offset = index * 9;
            this._array[offset + 0] = a.x;
            this._array[offset + 1] = a.y;
            this._array[offset + 2] = b.x;
            this._array[offset + 3] = b.y;
            this._array[offset + 4] = c.x;
            this._array[offset + 5] = c.y;
            this._array[offset + 6] = center.x;
            this._array[offset + 7] = center.y;
            this._array[offset + 8] = radius;
        };
        /**
         * Store a triangle in a Tri2DInfo object
         * @param index the index of the triangle to store
         * @param tri2dInfo the instance that will contain the data, it must be already allocated with its inner object also allocated
         */
        Tri2DArray.prototype.storeToTri2DInfo = function (index, tri2dInfo) {
            if (index >= this._count) {
                throw new Error("Can't fetch the triangle at index " + index + ", max index is " + (this._count - 1));
            }
            var offset = index * 9;
            tri2dInfo.a.x = this._array[offset + 0];
            tri2dInfo.a.y = this._array[offset + 1];
            tri2dInfo.b.x = this._array[offset + 2];
            tri2dInfo.b.y = this._array[offset + 3];
            tri2dInfo.c.x = this._array[offset + 4];
            tri2dInfo.c.y = this._array[offset + 5];
            tri2dInfo.center.x = this._array[offset + 6];
            tri2dInfo.center.y = this._array[offset + 7];
            tri2dInfo.radius = this._array[offset + 8];
        };
        /**
         * Transform the given triangle and store its result in the array
         * @param index The index to store the result to
         * @param tri2dInfo The triangle to transform
         * @param transform The transformation matrix
         */
        Tri2DArray.prototype.transformAndStoreToTri2DInfo = function (index, tri2dInfo, transform) {
            if (index >= this._count) {
                throw new Error("Can't fetch the triangle at index " + index + ", max index is " + (this._count - 1));
            }
            var offset = index * 9;
            tri2dInfo.a.x = this._array[offset + 0];
            tri2dInfo.a.y = this._array[offset + 1];
            tri2dInfo.b.x = this._array[offset + 2];
            tri2dInfo.b.y = this._array[offset + 3];
            tri2dInfo.c.x = this._array[offset + 4];
            tri2dInfo.c.y = this._array[offset + 5];
            tri2dInfo.transformInPlace(transform);
        };
        Object.defineProperty(Tri2DArray.prototype, "count", {
            /**
             * Get the element count that can be stored in this array
             * @returns {}
             */
            get: function () {
                return this._count;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Check if a given point intersects with at least one of the triangles stored in the array.
         * If true is returned the point is intersecting with at least one triangle, false if it doesn't intersect with any of them
         * @param p The point to check
         */
        Tri2DArray.prototype.doesContain = function (p) {
            Tri2DArray._checkInitStatics();
            var a = Tri2DArray.tempT[0];
            for (var i = 0; i < this.count; i++) {
                this.storeToTri2DInfo(i, a);
                if (a.doesContain(p)) {
                    return true;
                }
            }
            return false;
        };
        /**
         * Make a intersection test between two sets of triangles. The triangles of setB will be transformed to the frame of reference of the setA using the given bToATransform matrix.
         * If true is returned at least one triangle intersects with another of the other set, otherwise false is returned.
         * @param setA The first set of triangles
         * @param setB The second set of triangles
         * @param bToATransform The transformation matrix to transform the setB triangles into the frame of reference of the setA
         */
        Tri2DArray.doesIntersect = function (setA, setB, bToATransform) {
            Tri2DArray._checkInitStatics();
            var a = Tri2DArray.tempT[0];
            var b = Tri2DArray.tempT[1];
            var v0 = Tri2DArray.tempV[0];
            for (var curB = 0; curB < setB.count; curB++) {
                setB.transformAndStoreToTri2DInfo(curB, b, bToATransform);
                for (var curA = 0; curA < setA.count; curA++) {
                    setA.storeToTri2DInfo(curA, a);
                    // Fast rejection first
                    v0.x = a.center.x - b.center.x;
                    v0.y = a.center.y - b.center.y;
                    if (v0.lengthSquared() > ((a.radius * a.radius) + (b.radius * b.radius))) {
                        continue;
                    }
                    // Actual intersection test
                    if (Math2D.TriangleTriangleDosIntersect(a.a, a.b, a.c, b.a, b.b, b.c)) {
                        return true;
                    }
                }
            }
            return false;
        };
        Tri2DArray._checkInitStatics = function () {
            if (Tri2DArray.tempT !== null) {
                return;
            }
            Tri2DArray.tempT = new Array(2);
            Tri2DArray.tempT[0] = new Tri2DInfo(null, null, null);
            Tri2DArray.tempT[1] = new Tri2DInfo(null, null, null);
            Tri2DArray.tempV = new Array(6);
            for (var i = 0; i < 6; i++) {
                Tri2DArray.tempV[i] = BABYLON.Vector2.Zero();
            }
        };
        return Tri2DArray;
    }());
    Tri2DArray.tempV = null;
    Tri2DArray.tempT = null;
    BABYLON.Tri2DArray = Tri2DArray;
    /**
     * Some 2D Math helpers functions
     */
    var Math2D = (function () {
        function Math2D() {
        }
        Math2D.Dot = function (a, b) {
            return a.x * b.x + a.y * b.y;
        };
        // From http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
        // Note: this one might also be considered with the above one proves to not be good enough: http://jsfiddle.net/justin_c_rounds/Gd2S2/light/
        Math2D.LineLineDoesIntersect = function (segA1, segA2, segB1, segB2) {
            var s1_x = segA2.x - segA1.x;
            var s1_y = segA2.y - segA1.y;
            var s2_x = segB2.x - segB1.x;
            var s2_y = segB2.y - segB1.y;
            var s = (-s1_y * (segA1.x - segB1.x) + s1_x * (segA1.y - segB1.y)) / (-s2_x * s1_y + s1_x * s2_y);
            var t = (s2_x * (segA1.y - segB1.y) - s2_y * (segA1.x - segB1.x)) / (-s2_x * s1_y + s1_x * s2_y);
            if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
                return true;
            }
            return false;
        };
        // From http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
        Math2D.LineLineIntersection = function (p0, p1, p2, p3) {
            var s1_x = p1.x - p0.x;
            var s1_y = p1.y - p0.y;
            var s2_x = p3.x - p2.x;
            var s2_y = p3.y - p2.y;
            var s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / (-s2_x * s1_y + s1_x * s2_y);
            var t = (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / (-s2_x * s1_y + s1_x * s2_y);
            if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
                return { res: true, xr: p0.x + (t * s1_x), yr: p0.y + (t * s1_y) };
            }
            return { res: false, xr: 0, yr: 0 };
        };
        // Tell me that it's slow and I'll answer: yes it is!
        // If you fancy to implement the SAT (Separating Axis Theorem) version: BE MY VERY WELCOMED GUEST!
        Math2D.TriangleTriangleDosIntersect = function (tri1A, tri1B, tri1C, tri2A, tri2B, tri2C) {
            if (Math2D.LineLineDoesIntersect(tri1A, tri1B, tri2A, tri2B))
                return true;
            if (Math2D.LineLineDoesIntersect(tri1A, tri1B, tri2A, tri2C))
                return true;
            if (Math2D.LineLineDoesIntersect(tri1A, tri1B, tri2B, tri2C))
                return true;
            if (Math2D.LineLineDoesIntersect(tri1A, tri1C, tri2A, tri2B))
                return true;
            if (Math2D.LineLineDoesIntersect(tri1A, tri1C, tri2A, tri2C))
                return true;
            if (Math2D.LineLineDoesIntersect(tri1A, tri1C, tri2B, tri2C))
                return true;
            if (Math2D.LineLineDoesIntersect(tri1B, tri1C, tri2A, tri2B))
                return true;
            if (Math2D.LineLineDoesIntersect(tri1B, tri1C, tri2A, tri2C))
                return true;
            if (Math2D.LineLineDoesIntersect(tri1B, tri1C, tri2B, tri2C))
                return true;
            if (BABYLON.Vector2.PointInTriangle(tri2A, tri1A, tri1B, tri1C) &&
                BABYLON.Vector2.PointInTriangle(tri2B, tri1A, tri1B, tri1C) &&
                BABYLON.Vector2.PointInTriangle(tri2C, tri1A, tri1B, tri1C))
                return true;
            if (BABYLON.Vector2.PointInTriangle(tri1A, tri2A, tri2B, tri2C) &&
                BABYLON.Vector2.PointInTriangle(tri1B, tri2A, tri2B, tri2C) &&
                BABYLON.Vector2.PointInTriangle(tri1C, tri2A, tri2B, tri2C))
                return true;
            return false;
        };
        return Math2D;
    }());
    Math2D.v0 = BABYLON.Vector2.Zero();
    Math2D.v1 = BABYLON.Vector2.Zero();
    Math2D.v2 = BABYLON.Vector2.Zero();
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.math2D.js.map

var BABYLON;
(function (BABYLON) {
    var PropertyChangedInfo = (function () {
        function PropertyChangedInfo() {
        }
        return PropertyChangedInfo;
    }());
    BABYLON.PropertyChangedInfo = PropertyChangedInfo;
    /**
     * The purpose of this class is to provide a base implementation of the IPropertyChanged interface for the user to avoid rewriting a code needlessly.
     * Typical use of this class is to check for equality in a property set(), then call the onPropertyChanged method if values are different after the new value is set. The protected method will notify observers of the change.
     * Remark: onPropertyChanged detects reentrant code and acts in a way to make sure everything is fine, fast and allocation friendly (when there no reentrant code which should be 99% of the time)
     */
    var PropertyChangedBase = (function () {
        function PropertyChangedBase() {
            this._propertyChanged = null;
        }
        /**
         * Protected method to call when there's a change of value in a property set
         * @param propName the name of the concerned property
         * @param oldValue its old value
         * @param newValue its new value
         * @param mask an optional observable mask
         */
        PropertyChangedBase.prototype.onPropertyChanged = function (propName, oldValue, newValue, mask) {
            if (this.propertyChanged.hasObservers()) {
                var pci = PropertyChangedBase.calling ? new PropertyChangedInfo() : PropertyChangedBase.pci;
                pci.oldValue = oldValue;
                pci.newValue = newValue;
                pci.propertyName = propName;
                try {
                    PropertyChangedBase.calling = true;
                    this.propertyChanged.notifyObservers(pci, mask);
                }
                finally {
                    PropertyChangedBase.calling = false;
                }
            }
        };
        Object.defineProperty(PropertyChangedBase.prototype, "propertyChanged", {
            /**
             * An observable that is triggered when a property (using of the XXXXLevelProperty decorator) has its value changing.
             * You can add an observer that will be triggered only for a given set of Properties using the Mask feature of the Observable and the corresponding Prim2DPropInfo.flagid value (e.g. Prim2DBase.positionProperty.flagid|Prim2DBase.rotationProperty.flagid to be notified only about position or rotation change)
             */
            get: function () {
                if (!this._propertyChanged) {
                    this._propertyChanged = new BABYLON.Observable();
                }
                return this._propertyChanged;
            },
            enumerable: true,
            configurable: true
        });
        return PropertyChangedBase;
    }());
    PropertyChangedBase.pci = new PropertyChangedInfo();
    PropertyChangedBase.calling = false;
    BABYLON.PropertyChangedBase = PropertyChangedBase;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.IPropertyChanged.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
     * Class for the ObservableArray.onArrayChanged observable
     */
    var ArrayChanged = (function () {
        function ArrayChanged() {
            this.action = 0;
            this.newItems = new Array();
            this.removedItems = new Array();
            this.changedItems = new Array();
            this.newStartingIndex = -1;
            this.removedStartingIndex = -1;
        }
        Object.defineProperty(ArrayChanged, "clearAction", {
            /**
             * The content of the array was totally cleared
             */
            get: function () {
                return ArrayChanged._clearAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayChanged, "newItemsAction", {
            /**
             * A new item was added, the newItems field contains the key/value pairs
             */
            get: function () {
                return ArrayChanged._newItemsAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayChanged, "removedItemsAction", {
            /**
             * An existing item was removed, the removedKey field contains its key
             */
            get: function () {
                return ArrayChanged._removedItemsAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayChanged, "changedItemAction", {
            /**
             * One or many items in the array were changed, the
             */
            get: function () {
                return ArrayChanged._changedItemAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayChanged, "replacedArrayAction", {
            /**
             * The array's content was totally changed
             * Depending on the method that used this mode the ChangedArray object may contains more information
             */
            get: function () {
                return ArrayChanged._replacedArrayAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayChanged, "lengthChangedAction", {
            /**
             * The length of the array changed
             */
            get: function () {
                return ArrayChanged._lengthChangedAction;
            },
            enumerable: true,
            configurable: true
        });
        ArrayChanged.prototype.clear = function () {
            this.action = 0;
            this.newItems.splice(0);
            this.removedItems.splice(0);
            this.changedItems.splice(0);
            this.removedStartingIndex = this.removedStartingIndex = this.changedStartingIndex = 0;
        };
        return ArrayChanged;
    }());
    ArrayChanged._clearAction = 0x1;
    ArrayChanged._newItemsAction = 0x2;
    ArrayChanged._removedItemsAction = 0x4;
    ArrayChanged._replacedArrayAction = 0x8;
    ArrayChanged._lengthChangedAction = 0x10;
    ArrayChanged._changedItemAction = 0x20;
    BABYLON.ArrayChanged = ArrayChanged;
    var OAWatchedObjectChangedInfo = (function () {
        function OAWatchedObjectChangedInfo() {
        }
        return OAWatchedObjectChangedInfo;
    }());
    BABYLON.OAWatchedObjectChangedInfo = OAWatchedObjectChangedInfo;
    /**
     * This class mimics the Javascript Array and TypeScript Array<T> classes, adding new features concerning the Observable pattern.
     *
     */
    var ObservableArray = (function (_super) {
        __extends(ObservableArray, _super);
        /**
         * Create an Observable Array.
         * @param watchObjectsPropertyChange
         * @param array and optional array that will be encapsulated by this ObservableArray instance. That's right, it's NOT a copy!
         */
        function ObservableArray(watchObjectsPropertyChange, array) {
            var _this = _super.call(this) || this;
            _this.dci = new ArrayChanged();
            _this._callingArrayChanged = false;
            _this._array = (array != null) ? array : new Array();
            _this.dci = new ArrayChanged();
            _this._callingArrayChanged = false;
            _this._arrayChanged = null;
            _this._callingWatchedObjectChanged = false;
            _this._watchObjectsPropertyChange = watchObjectsPropertyChange;
            _this._watchedObjectList = _this._watchObjectsPropertyChange ? new BABYLON.StringDictionary() : null;
            _this._woci = new OAWatchedObjectChangedInfo();
            return _this;
        }
        Object.defineProperty(ObservableArray.prototype, "length", {
            /**
              * Gets or sets the length of the array. This is a number one higher than the highest element defined in an array.
              */
            get: function () {
                return this._array.length;
            },
            set: function (value) {
                if (value === this._array.length) {
                    return;
                }
                var oldLength = this._array.length;
                this._array.length = value;
                this.onPropertyChanged("length", oldLength, this._array.length);
            },
            enumerable: true,
            configurable: true
        });
        ObservableArray.prototype.getAt = function (index) {
            return this._array[index];
        };
        ObservableArray.prototype.setAt = function (index, value) {
            if (index < 0) {
                return false;
            }
            var insertion = (index >= this._array.length) || this._array[index] === undefined;
            var oldLength = 0;
            if (insertion) {
                oldLength = this._array.length;
            }
            else if (this._watchObjectsPropertyChange) {
                this._removeWatchedElement(this._array[index]);
            }
            this._array[index] = value;
            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement(value);
            }
            if (insertion) {
                this.onPropertyChanged("length", oldLength, this._array.length);
            }
            var ac = this.getArrayChangedObject();
            if (ac) {
                ac.action = insertion ? ArrayChanged.newItemsAction : ArrayChanged.changedItemAction;
                if (insertion) {
                    ac.newItems.splice(0, ac.newItems.length, { index: index, value: value });
                    ac.newStartingIndex = index;
                    ac.changedItems.splice(0);
                }
                else {
                    ac.newItems.splice(0);
                    ac.changedStartingIndex = index;
                    ac.changedItems.splice(0, ac.changedItems.length, { index: index, value: value });
                }
                ac.removedItems.splice(0);
                ac.removedStartingIndex = -1;
                this.callArrayChanged(ac);
            }
        };
        /**
          * Returns a string representation of an array.
          */
        ObservableArray.prototype.toString = function () {
            return this._array.toString();
        };
        ObservableArray.prototype.toLocaleString = function () {
            return this._array.toLocaleString();
        };
        /**
          * Appends new elements to an array, and returns the new length of the array.
          * @param items New elements of the Array.
          */
        ObservableArray.prototype.push = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            var oldLength = this._array.length;
            var n = (_a = this._array).push.apply(_a, items);
            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement.apply(this, items);
            }
            this.onPropertyChanged("length", oldLength, this._array.length);
            var ac = this.getArrayChangedObject();
            if (ac) {
                ac.action = ArrayChanged.newItemsAction;
                ac.newStartingIndex = oldLength;
                this.feedNotifArray.apply(this, [ac.newItems, oldLength].concat(items));
                this.callArrayChanged(ac);
            }
            return n;
            var _a;
        };
        /**
          * Removes the last element from an array and returns it.
          */
        ObservableArray.prototype.pop = function () {
            var firstRemove = this._array.length - 1;
            var res = this._array.pop();
            if (res && this._watchObjectsPropertyChange) {
                this._removeWatchedElement(res);
            }
            if (firstRemove !== -1) {
                this.onPropertyChanged("length", this._array.length + 1, this._array.length);
                var ac = this.getArrayChangedObject();
                if (ac) {
                    ac.action = ArrayChanged.removedItemsAction;
                    ac.removedStartingIndex = firstRemove;
                    this.feedNotifArray(ac.removedItems, firstRemove, res);
                }
            }
            return res;
        };
        /**
          * Combines two or more arrays.
          * @param items Additional items to add to the end of array1.
          */
        ObservableArray.prototype.concat = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            return new ObservableArray(this._watchObjectsPropertyChange, (_a = this._array).concat.apply(_a, items));
            var _a;
        };
        /**
          * Adds all the elements of an array separated by the specified separator string.
          * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
          */
        ObservableArray.prototype.join = function (separator) {
            return this._array.join(separator);
        };
        /**
          * Reverses the elements in an Array.
         * The arrayChanged action is
          */
        ObservableArray.prototype.reverse = function () {
            var res = this._array.reverse();
            var ac = this.getArrayChangedObject();
            ac.action = ArrayChanged.replacedArrayAction;
            return res;
        };
        /**
          * Removes the first element from an array and returns it, shift all subsequents element one element before.
         * The ArrayChange action is replacedArrayAction, the whole array changes and must be reevaluate as such, the removed element is in removedItems.
         *
          */
        ObservableArray.prototype.shift = function () {
            var oldLength = this._array.length;
            var res = this._array.shift();
            if (this._watchedObjectChanged && res != null) {
                this._removeWatchedElement(res);
            }
            if (oldLength !== 0) {
                this.onPropertyChanged("length", oldLength, this._array.length);
                var ac = this.getArrayChangedObject();
                if (ac) {
                    ac.action = ArrayChanged.replacedArrayAction;
                    ac.removedItems.splice(0, ac.removedItems.length, { index: 0, value: res });
                    ac.newItems.splice(0);
                    ac.changedItems.splice(0);
                    ac.removedStartingIndex = 0;
                    this.callArrayChanged(ac);
                }
            }
            return res;
        };
        /**
          * Returns a section of an array.
          * @param start The beginning of the specified portion of the array.
          * @param end The end of the specified portion of the array.
          */
        ObservableArray.prototype.slice = function (start, end) {
            return new ObservableArray(this._watchObjectsPropertyChange, this._array.slice(start, end));
        };
        /**
          * Sorts an array.
          * @param compareFn The name of the function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.
         * On the contrary of the Javascript Array's implementation, this method returns nothing
          */
        ObservableArray.prototype.sort = function (compareFn) {
            var oldLength = this._array.length;
            this._array.sort(compareFn);
            if (oldLength !== 0) {
                var ac = this.getArrayChangedObject();
                if (ac) {
                    ac.clear();
                    ac.action = ArrayChanged.replacedArrayAction;
                    this.callArrayChanged(ac);
                }
            }
        };
        /**
          * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
          * @param start The zero-based location in the array from which to start removing elements.
          * @param deleteCount The number of elements to remove.
          * @param items Elements to insert into the array in place of the deleted elements.
          */
        ObservableArray.prototype.splice = function (start, deleteCount) {
            var items = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                items[_i - 2] = arguments[_i];
            }
            var oldLength = this._array.length;
            if (this._watchObjectsPropertyChange) {
                for (var i = start; i < start + deleteCount; i++) {
                    var val = this._array[i];
                    if (this._watchObjectsPropertyChange && val != null) {
                        this._removeWatchedElement(val);
                    }
                }
            }
            var res = (_a = this._array).splice.apply(_a, [start, deleteCount].concat(items));
            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement.apply(this, items);
            }
            if (oldLength !== this._array.length) {
                this.onPropertyChanged("length", oldLength, this._array.length);
            }
            var ac = this.getArrayChangedObject();
            if (ac) {
                ac.clear();
                ac.action = ArrayChanged.replacedArrayAction;
                this.callArrayChanged(ac);
            }
            return res;
            var _a;
        };
        /**
          * Inserts new elements at the start of an array.
          * @param items  Elements to insert at the start of the Array.
          * The ChangedArray action is replacedArrayAction, newItems contains the list of the added items
          */
        ObservableArray.prototype.unshift = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            var oldLength = this._array.length;
            var res = (_a = this._array).unshift.apply(_a, items);
            if (this._watchObjectsPropertyChange) {
                this._addWatchedElement.apply(this, items);
            }
            this.onPropertyChanged("length", oldLength, this._array.length);
            var ac = this.getArrayChangedObject();
            if (ac) {
                ac.clear();
                ac.action = ArrayChanged.replacedArrayAction;
                ac.newStartingIndex = 0, this.feedNotifArray.apply(this, [ac.newItems, 0].concat(items));
                this.callArrayChanged(ac);
            }
            return res;
            var _a;
        };
        /**
          * Returns the index of the first occurrence of a value in an array.
          * @param searchElement The value to locate in the array.
          * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
          */
        ObservableArray.prototype.indexOf = function (searchElement, fromIndex) {
            return this._array.indexOf(searchElement, fromIndex);
        };
        /**
          * Returns the index of the last occurrence of a specified value in an array.
          * @param searchElement The value to locate in the array.
          * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
          */
        ObservableArray.prototype.lastIndexOf = function (searchElement, fromIndex) {
            return this._array.lastIndexOf(searchElement, fromIndex);
        };
        /**
          * Determines whether all the members of an array satisfy the specified test.
          * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        ObservableArray.prototype.every = function (callbackfn, thisArg) {
            return this._array.every(callbackfn, thisArg);
        };
        /**
          * Determines whether the specified callback function returns true for any element of an array.
          * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        ObservableArray.prototype.some = function (callbackfn, thisArg) {
            return this._array.some(callbackfn, thisArg);
        };
        /**
          * Performs the specified action for each element in an array.
          * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
          * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        ObservableArray.prototype.forEach = function (callbackfn, thisArg) {
            return this._array.forEach(callbackfn, thisArg);
        };
        /**
          * Calls a defined callback function on each element of an array, and returns an array that contains the results.
          * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        ObservableArray.prototype.map = function (callbackfn, thisArg) {
            return this._array.map(callbackfn, thisArg);
        };
        /**
          * Returns the elements of an array that meet the condition specified in a callback function.
          * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        ObservableArray.prototype.filter = function (callbackfn, thisArg) {
            return this._array.filter(callbackfn, thisArg);
        };
        /**
          * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
          * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
          * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
          */
        ObservableArray.prototype.reduce = function (callbackfn, initialValue) {
            return this._array.reduce(callbackfn);
        };
        /**
          * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
          * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
          * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
          */
        ObservableArray.prototype.reduceRight = function (callbackfn, initialValue) {
            return this._array.reduceRight(callbackfn);
        };
        Object.defineProperty(ObservableArray.prototype, "arrayChanged", {
            get: function () {
                if (!this._arrayChanged) {
                    this._arrayChanged = new BABYLON.Observable();
                }
                return this._arrayChanged;
            },
            enumerable: true,
            configurable: true
        });
        ObservableArray.prototype.getArrayChangedObject = function () {
            if (this._arrayChanged && this._arrayChanged.hasObservers()) {
                var ac = this._callingArrayChanged ? new ArrayChanged() : this.dci;
                return ac;
            }
            return null;
        };
        ObservableArray.prototype.feedNotifArray = function (array, startindIndex) {
            var items = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                items[_i - 2] = arguments[_i];
            }
            array.splice(0);
            for (var i = 0; i < items.length; i++) {
                var value = this._array[i + startindIndex];
                if (value !== undefined) {
                    array.push({ index: i + startindIndex, value: value });
                }
            }
        };
        ObservableArray.prototype.callArrayChanged = function (ac) {
            try {
                this._callingArrayChanged = true;
                this.arrayChanged.notifyObservers(ac, ac.action);
            }
            finally {
                this._callingArrayChanged = false;
            }
        };
        Object.defineProperty(ObservableArray.prototype, "watchedObjectChanged", {
            get: function () {
                if (!this._watchedObjectChanged) {
                    this._watchedObjectChanged = new BABYLON.Observable();
                }
                return this._watchedObjectChanged;
            },
            enumerable: true,
            configurable: true
        });
        ObservableArray.prototype._addWatchedElement = function () {
            var _this = this;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            var _loop_1 = function (curItem) {
                if (curItem["propertyChanged"]) {
                    var key_1 = curItem["__ObsArrayObjID__"];
                    // The object may already be part of another ObsArray, so there already be a valid ID
                    if (!key_1) {
                        key_1 = BABYLON.Tools.RandomId();
                        curItem["__ObsArrayObjID__"] = key_1;
                    }
                    this_1._watchedObjectList.add(key_1, curItem.propertyChanged.add(function (e, d) {
                        _this.onWatchedObjectChanged(key_1, curItem, e);
                    }));
                }
            };
            var this_1 = this;
            for (var _a = 0, items_1 = items; _a < items_1.length; _a++) {
                var curItem = items_1[_a];
                _loop_1(curItem);
            }
        };
        ObservableArray.prototype._removeWatchedElement = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            for (var _a = 0, items_2 = items; _a < items_2.length; _a++) {
                var curItem = items_2[_a];
                var key = curItem["__ObsArrayObjID__"];
                if (key != null) {
                    var observer = this._watchedObjectList.getAndRemove(key);
                    curItem.propertyChanged.remove(observer);
                }
            }
        };
        ObservableArray.prototype.onWatchedObjectChanged = function (key, object, propChanged) {
            if (this._watchedObjectChanged && this._watchedObjectChanged.hasObservers()) {
                var woci = this._callingWatchedObjectChanged ? new OAWatchedObjectChangedInfo() : this._woci;
                woci.object = object;
                woci.propertyChanged = propChanged;
                try {
                    this._callingWatchedObjectChanged = true;
                    this.watchedObjectChanged.notifyObservers(woci);
                }
                finally {
                    this._callingWatchedObjectChanged = false;
                }
            }
        };
        return ObservableArray;
    }(BABYLON.PropertyChangedBase));
    BABYLON.ObservableArray = ObservableArray;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.observableArray.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
     * Class for the ObservableStringDictionary.onDictionaryChanged observable
     */
    var DictionaryChanged = (function () {
        function DictionaryChanged() {
        }
        Object.defineProperty(DictionaryChanged, "clearAction", {
            /**
             * The content of the dictionary was totally cleared
             */
            get: function () {
                return DictionaryChanged._clearAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DictionaryChanged, "newItemAction", {
            /**
             * A new item was added, the newItem field contains the key/value pair
             */
            get: function () {
                return DictionaryChanged._newItemAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DictionaryChanged, "removedItemAction", {
            /**
             * An existing item was removed, the removedKey field contains its key
             */
            get: function () {
                return DictionaryChanged._removedItemAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DictionaryChanged, "itemValueChangedAction", {
            /**
             * An existing item had a value change, the changedItem field contains the key/value
             */
            get: function () {
                return DictionaryChanged._itemValueChangedAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DictionaryChanged, "replacedAction", {
            /**
             * The dictionary's content was reset and replaced by the content of another dictionary.
             * DictionaryChanged<T> contains no further information about this action
             */
            get: function () {
                return DictionaryChanged._replacedAction;
            },
            enumerable: true,
            configurable: true
        });
        return DictionaryChanged;
    }());
    DictionaryChanged._clearAction = 0x1;
    DictionaryChanged._newItemAction = 0x2;
    DictionaryChanged._removedItemAction = 0x4;
    DictionaryChanged._itemValueChangedAction = 0x8;
    DictionaryChanged._replacedAction = 0x10;
    BABYLON.DictionaryChanged = DictionaryChanged;
    var OSDWatchedObjectChangedInfo = (function () {
        function OSDWatchedObjectChangedInfo() {
        }
        return OSDWatchedObjectChangedInfo;
    }());
    BABYLON.OSDWatchedObjectChangedInfo = OSDWatchedObjectChangedInfo;
    var ObservableStringDictionary = (function (_super) {
        __extends(ObservableStringDictionary, _super);
        function ObservableStringDictionary(watchObjectsPropertyChange) {
            var _this = _super.call(this) || this;
            _this._propertyChanged = null;
            _this._dictionaryChanged = null;
            _this.dci = new DictionaryChanged();
            _this._callingDicChanged = false;
            _this._watchedObjectChanged = null;
            _this._callingWatchedObjectChanged = false;
            _this._woci = new OSDWatchedObjectChangedInfo();
            _this._watchObjectsPropertyChange = watchObjectsPropertyChange;
            _this._watchedObjectList = _this._watchObjectsPropertyChange ? new BABYLON.StringDictionary() : null;
            return _this;
        }
        /**
         * This will clear this dictionary and copy the content from the 'source' one.
         * If the T value is a custom object, it won't be copied/cloned, the same object will be used
         * @param source the dictionary to take the content from and copy to this dictionary
         */
        ObservableStringDictionary.prototype.copyFrom = function (source) {
            var _this = this;
            var oldCount = this.count;
            // Don't rely on this class' implementation for clear/add otherwise tons of notification will be thrown
            _super.prototype.clear.call(this);
            source.forEach(function (t, v) { return _this._add(t, v, false, _this._watchObjectsPropertyChange); });
            this.onDictionaryChanged(DictionaryChanged.replacedAction, null, null, null);
            this.onPropertyChanged("count", oldCount, this.count);
        };
        /**
         * Get a value from its key or add it if it doesn't exist.
         * This method will ensure you that a given key/data will be present in the dictionary.
         * @param key the given key to get the matching value from
         * @param factory the factory that will create the value if the key is not present in the dictionary.
         * The factory will only be invoked if there's no data for the given key.
         * @return the value corresponding to the key.
         */
        ObservableStringDictionary.prototype.getOrAddWithFactory = function (key, factory) {
            var _this = this;
            var val = _super.prototype.getOrAddWithFactory.call(this, key, function (k) {
                var v = factory(key);
                _this._add(key, v, true, _this._watchObjectsPropertyChange);
                return v;
            });
            return val;
        };
        /**
         * Add a new key and its corresponding value
         * @param key the key to add
         * @param value the value corresponding to the key
         * @return true if the operation completed successfully, false if we couldn't insert the key/value because there was already this key in the dictionary
         */
        ObservableStringDictionary.prototype.add = function (key, value) {
            return this._add(key, value, true, this._watchObjectsPropertyChange);
        };
        ObservableStringDictionary.prototype.getAndRemove = function (key) {
            var val = _super.prototype.get.call(this, key);
            this._remove(key, true, val);
            return val;
        };
        ObservableStringDictionary.prototype._add = function (key, value, fireNotif, registerWatcher) {
            if (_super.prototype.add.call(this, key, value)) {
                if (fireNotif) {
                    this.onDictionaryChanged(DictionaryChanged.newItemAction, { key: key, value: value }, null, null);
                    this.onPropertyChanged("count", this.count - 1, this.count);
                }
                if (registerWatcher) {
                    this._addWatchedElement(key, value);
                }
                return true;
            }
            return false;
        };
        ObservableStringDictionary.prototype._addWatchedElement = function (key, el) {
            var _this = this;
            if (el["propertyChanged"]) {
                this._watchedObjectList.add(key, el.propertyChanged.add(function (e, d) {
                    _this.onWatchedObjectChanged(key, el, e);
                }));
            }
        };
        ObservableStringDictionary.prototype._removeWatchedElement = function (key, el) {
            var observer = this._watchedObjectList.getAndRemove(key);
            if (el["propertyChanged"]) {
                el.propertyChanged.remove(observer);
            }
        };
        ObservableStringDictionary.prototype.set = function (key, value) {
            var oldValue = this.get(key);
            if (this._watchObjectsPropertyChange) {
                this._removeWatchedElement(key, oldValue);
            }
            if (_super.prototype.set.call(this, key, value)) {
                this.onDictionaryChanged(DictionaryChanged.itemValueChangedAction, null, null, { key: key, oldValue: oldValue, newValue: value });
                this._addWatchedElement(key, value);
                return true;
            }
            return false;
        };
        /**
         * Remove a key/value from the dictionary.
         * @param key the key to remove
         * @return true if the item was successfully deleted, false if no item with such key exist in the dictionary
         */
        ObservableStringDictionary.prototype.remove = function (key) {
            return this._remove(key, true);
        };
        ObservableStringDictionary.prototype._remove = function (key, fireNotif, element) {
            if (!element) {
                element = this.get(key);
            }
            if (!element) {
                return false;
            }
            if (_super.prototype.remove.call(this, key) === undefined) {
                return false;
            }
            this.onDictionaryChanged(DictionaryChanged.removedItemAction, null, key, null);
            this.onPropertyChanged("count", this.count + 1, this.count);
            if (this._watchObjectsPropertyChange) {
                this._removeWatchedElement(key, element);
            }
            return true;
        };
        /**
         * Clear the whole content of the dictionary
         */
        ObservableStringDictionary.prototype.clear = function () {
            var _this = this;
            if (this._watchedObjectList) {
                this._watchedObjectList.forEach(function (k, v) {
                    var el = _this.get(k);
                    _this._removeWatchedElement(k, el);
                });
                this._watchedObjectList.clear();
            }
            var oldCount = this.count;
            _super.prototype.clear.call(this);
            this.onDictionaryChanged(DictionaryChanged.clearAction, null, null, null);
            this.onPropertyChanged("count", oldCount, 0);
        };
        Object.defineProperty(ObservableStringDictionary.prototype, "propertyChanged", {
            get: function () {
                if (!this._propertyChanged) {
                    this._propertyChanged = new BABYLON.Observable();
                }
                return this._propertyChanged;
            },
            enumerable: true,
            configurable: true
        });
        ObservableStringDictionary.prototype.onPropertyChanged = function (propName, oldValue, newValue, mask) {
            if (this._propertyChanged && this._propertyChanged.hasObservers()) {
                var pci = ObservableStringDictionary.callingPropChanged ? new BABYLON.PropertyChangedInfo() : ObservableStringDictionary.pci;
                pci.oldValue = oldValue;
                pci.newValue = newValue;
                pci.propertyName = propName;
                try {
                    ObservableStringDictionary.callingPropChanged = true;
                    this.propertyChanged.notifyObservers(pci, mask);
                }
                finally {
                    ObservableStringDictionary.callingPropChanged = false;
                }
            }
        };
        Object.defineProperty(ObservableStringDictionary.prototype, "dictionaryChanged", {
            get: function () {
                if (!this._dictionaryChanged) {
                    this._dictionaryChanged = new BABYLON.Observable();
                }
                return this._dictionaryChanged;
            },
            enumerable: true,
            configurable: true
        });
        ObservableStringDictionary.prototype.onDictionaryChanged = function (action, newItem, removedKey, changedItem) {
            if (this._dictionaryChanged && this._dictionaryChanged.hasObservers()) {
                var dci = this._callingDicChanged ? new DictionaryChanged() : this.dci;
                dci.action = action;
                dci.newItem = newItem;
                dci.removedKey = removedKey;
                dci.changedItem = changedItem;
                try {
                    this._callingDicChanged = true;
                    this.dictionaryChanged.notifyObservers(dci, action);
                }
                finally {
                    this._callingDicChanged = false;
                }
            }
        };
        Object.defineProperty(ObservableStringDictionary.prototype, "watchedObjectChanged", {
            get: function () {
                if (!this._watchedObjectChanged) {
                    this._watchedObjectChanged = new BABYLON.Observable();
                }
                return this._watchedObjectChanged;
            },
            enumerable: true,
            configurable: true
        });
        ObservableStringDictionary.prototype.onWatchedObjectChanged = function (key, object, propChanged) {
            if (this._watchedObjectChanged && this._watchedObjectChanged.hasObservers()) {
                var woci = this._callingWatchedObjectChanged ? new OSDWatchedObjectChangedInfo() : this._woci;
                woci.key = key;
                woci.object = object;
                woci.propertyChanged = propChanged;
                try {
                    this._callingWatchedObjectChanged = true;
                    this.watchedObjectChanged.notifyObservers(woci);
                }
                finally {
                    this._callingWatchedObjectChanged = false;
                }
            }
        };
        return ObservableStringDictionary;
    }(BABYLON.StringDictionary));
    ObservableStringDictionary.pci = new BABYLON.PropertyChangedInfo();
    ObservableStringDictionary.callingPropChanged = false;
    BABYLON.ObservableStringDictionary = ObservableStringDictionary;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.observableStringDictionary.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    /**
     * This class given information about a given character.
     */
    var CharInfo = (function () {
        function CharInfo() {
        }
        return CharInfo;
    }());
    BABYLON.CharInfo = CharInfo;
    /**
     * This is an abstract base class to hold a Texture that will contain a FontMap
     */
    var BaseFontTexture = (function (_super) {
        __extends(BaseFontTexture, _super);
        function BaseFontTexture(url, scene, noMipmap, invertY, samplingMode) {
            if (noMipmap === void 0) { noMipmap = false; }
            if (invertY === void 0) { invertY = true; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            var _this = _super.call(this, url, scene, noMipmap, invertY, samplingMode) || this;
            _this._cachedFontId = null;
            _this._charInfos = new BABYLON.StringDictionary();
            return _this;
        }
        Object.defineProperty(BaseFontTexture.prototype, "isSuperSampled", {
            /**
             * Is the Font is using Super Sampling (each font texel is doubled).
             */
            get: function () {
                return this._superSample;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseFontTexture.prototype, "isSignedDistanceField", {
            /**
             * Is the Font was rendered using the Signed Distance Field algorithm
             * @returns {}
             */
            get: function () {
                return this._signedDistanceField;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseFontTexture.prototype, "spaceWidth", {
            /**
             * Get the Width (in pixel) of the Space character
             */
            get: function () {
                return this._spaceWidth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseFontTexture.prototype, "lineHeight", {
            /**
             * Get the Line height (in pixel)
             */
            get: function () {
                return this._lineHeight;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Measure the width/height that will take a given text
         * @param text the text to measure
         * @param tabulationSize the size (in space character) of the tabulation character, default value must be 4
         */
        BaseFontTexture.prototype.measureText = function (text, tabulationSize) {
            var maxWidth = 0;
            var curWidth = 0;
            var lineCount = 1;
            var charxpos = 0;
            // Parse each char of the string
            for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
                var char = text_1[_i];
                // Next line feed?
                if (char === "\n") {
                    maxWidth = Math.max(maxWidth, curWidth);
                    charxpos = 0;
                    curWidth = 0;
                    ++lineCount;
                    continue;
                }
                // Tabulation ?
                if (char === "\t") {
                    var nextPos = charxpos + tabulationSize;
                    nextPos = nextPos - (nextPos % tabulationSize);
                    curWidth += (nextPos - charxpos) * this.spaceWidth;
                    charxpos = nextPos;
                    continue;
                }
                if (char < " ") {
                    continue;
                }
                var ci = this.getChar(char);
                if (!ci) {
                    throw new Error("Character " + char + " is not supported by FontTexture " + this.name);
                }
                curWidth += ci.charWidth;
                ++charxpos;
            }
            maxWidth = Math.max(maxWidth, curWidth);
            return new BABYLON.Size(maxWidth, lineCount * this.lineHeight);
        };
        return BaseFontTexture;
    }(BABYLON.Texture));
    BABYLON.BaseFontTexture = BaseFontTexture;
    var BitmapFontInfo = (function () {
        function BitmapFontInfo() {
            this.kerningDic = new BABYLON.StringDictionary();
            this.charDic = new BABYLON.StringDictionary();
        }
        return BitmapFontInfo;
    }());
    BABYLON.BitmapFontInfo = BitmapFontInfo;
    var BitmapFontTexture = (function (_super) {
        __extends(BitmapFontTexture, _super);
        function BitmapFontTexture(scene, bmFontUrl, textureUrl, noMipmap, invertY, samplingMode, onLoad, onError) {
            if (textureUrl === void 0) { textureUrl = null; }
            if (noMipmap === void 0) { noMipmap = false; }
            if (invertY === void 0) { invertY = true; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            if (onLoad === void 0) { onLoad = null; }
            if (onError === void 0) { onError = null; }
            var _this = _super.call(this, null, scene, noMipmap, invertY, samplingMode) || this;
            _this._usedCounter = 1;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        var ext = bmFontUrl.split('.').pop().split(/\#|\?/)[0];
                        var plugins = BitmapFontTexture.plugins.get(ext.toLocaleLowerCase());
                        if (!plugins) {
                            if (onError) {
                                onError("couldn't find a plugin for this file extension", -1);
                            }
                            return;
                        }
                        var _loop_1 = function (p) {
                            var ret = p.loadFont(xhr.response, scene, invertY);
                            if (ret) {
                                var bfi = ret.bfi;
                                if (textureUrl != null) {
                                    bfi.textureUrl = textureUrl;
                                }
                                else {
                                    var baseUrl = bmFontUrl.substr(0, bmFontUrl.lastIndexOf("/") + 1);
                                    bfi.textureUrl = baseUrl + bfi.textureFile;
                                }
                                _this._texture = scene.getEngine().createTexture(bfi.textureUrl, noMipmap, invertY, scene, samplingMode, function () {
                                    if (ret.bfi && onLoad) {
                                        onLoad();
                                    }
                                });
                                _this._lineHeight = bfi.lineHeight;
                                _this._charInfos.copyFrom(bfi.charDic);
                                var ci = _this.getChar(" ");
                                if (ci) {
                                    _this._spaceWidth = ci.charWidth;
                                }
                                else {
                                    _this._charInfos.first(function (k, v) { return _this._spaceWidth = v.charWidth; });
                                }
                                if (!ret.bfi && onError) {
                                    onError(ret.errorMsg, ret.errorCode);
                                }
                                return { value: void 0 };
                            }
                        };
                        for (var _i = 0, plugins_1 = plugins; _i < plugins_1.length; _i++) {
                            var p = plugins_1[_i];
                            var state_1 = _loop_1(p);
                            if (typeof state_1 === "object")
                                return state_1.value;
                        }
                        if (onError) {
                            onError("No plugin to load this BMFont file format", -1);
                        }
                    }
                    else {
                        if (onError) {
                            onError("Couldn't load file through HTTP Request, HTTP Status " + xhr.status, xhr.status);
                        }
                    }
                }
            };
            xhr.open("GET", bmFontUrl, true);
            xhr.send();
            return _this;
        }
        BitmapFontTexture.GetCachedFontTexture = function (scene, fontTexture) {
            var dic = scene.getOrAddExternalDataWithFactory("BitmapFontTextureCache", function () { return new BABYLON.StringDictionary(); });
            var ft = dic.get(fontTexture.uid);
            if (ft) {
                ++ft._usedCounter;
                return ft;
            }
            dic.add(fontTexture.uid, fontTexture);
            return ft;
        };
        BitmapFontTexture.ReleaseCachedFontTexture = function (scene, fontTexture) {
            var dic = scene.getExternalData("BitmapFontTextureCache");
            if (!dic) {
                return;
            }
            var font = dic.get(fontTexture.uid);
            if (--font._usedCounter === 0) {
                dic.remove(fontTexture.uid);
                font.dispose();
            }
        };
        Object.defineProperty(BitmapFontTexture.prototype, "isDynamicFontTexture", {
            /**
             * Is the font dynamically updated, if true is returned then you have to call the update() before using the font in rendering if new character were adding using getChar()
             */
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * This method does nothing for a BitmapFontTexture object as it's a static texture
         */
        BitmapFontTexture.prototype.update = function () {
        };
        /**
         * Retrieve the CharInfo object for a given character
         * @param char the character to retrieve the CharInfo object from (e.g.: "A", "a", etc.)
         */
        BitmapFontTexture.prototype.getChar = function (char) {
            return this._charInfos.get(char);
        };
        /**
         * For FontTexture retrieved using GetCachedFontTexture, use this method when you transfer this object's lifetime to another party in order to share this resource.
         * When the other party is done with this object, decCachedFontTextureCounter must be called.
         */
        BitmapFontTexture.prototype.incCachedFontTextureCounter = function () {
            ++this._usedCounter;
        };
        /**
         * Use this method only in conjunction with incCachedFontTextureCounter, call it when you no longer need to use this shared resource.
         */
        BitmapFontTexture.prototype.decCachedFontTextureCounter = function () {
            var dic = this.getScene().getExternalData("BitmapFontTextureCache");
            if (!dic) {
                return;
            }
            if (--this._usedCounter === 0) {
                dic.remove(this._cachedFontId);
                this.dispose();
            }
        };
        BitmapFontTexture.addLoader = function (fileExtension, plugin) {
            var a = BitmapFontTexture.plugins.getOrAddWithFactory(fileExtension.toLocaleLowerCase(), function () { return new Array(); });
            a.push(plugin);
        };
        return BitmapFontTexture;
    }(BaseFontTexture));
    BitmapFontTexture.plugins = new BABYLON.StringDictionary();
    BABYLON.BitmapFontTexture = BitmapFontTexture;
    /**
     * This class is a special kind of texture which generates on the fly characters of a given css style "fontName".
     * The generated texture will be updated when new characters will be retrieved using the getChar() method, but you have
     *  to call the update() method for the texture to fetch these changes, you can harmlessly call update any time you want, if no
     *  change were made, nothing will happen.
     * The Font Texture can be rendered in three modes: normal size, super sampled size (x2) or using Signed Distance Field rendering.
     * Signed Distance Field should be prefered because the texture can be rendered using AlphaTest instead of Transparency, which is way more faster. More about SDF here (http://www.valvesoftware.com/publications/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf).
     * The only flaw of SDF is that the rendering quality may not be the best or the edges too sharp is the font thickness is too thin.
     */
    var FontTexture = (function (_super) {
        __extends(FontTexture, _super);
        /**
         * Create a new instance of the FontTexture class
         * @param name the name of the texture
         * @param font the font to use, use the W3C CSS notation
         * @param scene the scene that owns the texture
         * @param maxCharCount the approximative maximum count of characters that could fit in the texture. This is an approximation because most of the fonts are proportional (each char has its own Width). The 'W' character's width is used to compute the size of the texture based on the given maxCharCount
         * @param samplingMode the texture sampling mode
         * @param superSample if true the FontTexture will be created with a font of a size twice bigger than the given one but all properties (lineHeight, charWidth, etc.) will be according to the original size. This is made to improve the text quality.
         */
        function FontTexture(name, font, scene, maxCharCount, samplingMode, superSample, signedDistanceField) {
            if (maxCharCount === void 0) { maxCharCount = 200; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            if (superSample === void 0) { superSample = false; }
            if (signedDistanceField === void 0) { signedDistanceField = false; }
            var _this = _super.call(this, null, scene, true, false, samplingMode) || this;
            _this._curCharCount = 0;
            _this._lastUpdateCharCount = -1;
            _this._usedCounter = 1;
            _this.name = name;
            _this.debugMode = false;
            _this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            _this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            _this._sdfScale = 8;
            _this._signedDistanceField = signedDistanceField;
            _this._superSample = false;
            // SDF will use super sample no matter what, the resolution is otherwise too poor to produce correct result
            if (superSample || signedDistanceField) {
                var sfont = _this.getSuperSampleFont(font);
                if (sfont) {
                    _this._superSample = true;
                    font = sfont;
                }
            }
            // First canvas creation to determine the size of the texture to create
            _this._canvas = document.createElement("canvas");
            _this._context = _this._canvas.getContext("2d");
            _this._context.font = font;
            _this._context.fillStyle = "white";
            _this._context.textBaseline = "top";
            var res = _this.getFontHeight(font, "j$|");
            _this._lineHeightSuper = res.height; //+4;
            _this._lineHeight = _this._superSample ? (Math.ceil(_this._lineHeightSuper / 2)) : _this._lineHeightSuper;
            _this._offset = res.offset;
            res = _this.getFontHeight(font, "f");
            _this._baseLine = res.height + res.offset - _this._offset;
            var maxCharWidth = Math.max(_this._context.measureText("W").width, _this._context.measureText("_").width);
            _this._spaceWidthSuper = _this._context.measureText(" ").width;
            _this._spaceWidth = _this._superSample ? (_this._spaceWidthSuper / 2) : _this._spaceWidthSuper;
            _this._xMargin = Math.ceil(maxCharWidth / 32);
            _this._yMargin = _this._xMargin;
            // This is an approximate size, but should always be able to fit at least the maxCharCount
            var totalEstSurface = (Math.ceil(_this._lineHeightSuper) + (_this._yMargin * 2)) * (Math.ceil(maxCharWidth) + (_this._xMargin * 2)) * maxCharCount;
            var edge = Math.sqrt(totalEstSurface);
            var textSize = Math.pow(2, Math.ceil(Math.log(edge) / Math.log(2)));
            // Create the texture that will store the font characters
            _this._texture = scene.getEngine().createDynamicTexture(textSize, textSize, false, samplingMode);
            var textureSize = _this.getSize();
            _this.hasAlpha = _this._signedDistanceField === false;
            // Recreate a new canvas with the final size: the one matching the texture (resizing the previous one doesn't work as one would expect...)
            _this._canvas = document.createElement("canvas");
            _this._canvas.width = textureSize.width;
            _this._canvas.height = textureSize.height;
            _this._context = _this._canvas.getContext("2d");
            _this._context.textBaseline = "top";
            _this._context.font = font;
            _this._context.fillStyle = "white";
            _this._context.imageSmoothingEnabled = false;
            _this._context.clearRect(0, 0, textureSize.width, textureSize.height);
            // Create a canvas for the signed distance field mode, we only have to store one char, the purpose is to render a char scaled _sdfScale times
            //  into this 2D context, then get the bitmap data, create the SDF char and push the result in the _context (which hold the whole Font Texture content)
            // So you can see this context as an intermediate one, because it is.
            if (_this._signedDistanceField) {
                var sdfC = document.createElement("canvas");
                var s = _this._sdfScale;
                sdfC.width = (Math.ceil(maxCharWidth) + _this._xMargin * 2) * s;
                sdfC.height = (Math.ceil(_this._lineHeightSuper) + _this._yMargin * 2) * s;
                var sdfCtx = sdfC.getContext("2d");
                sdfCtx.scale(s, s);
                sdfCtx.textBaseline = "top";
                sdfCtx.font = font;
                sdfCtx.fillStyle = "white";
                sdfCtx.imageSmoothingEnabled = false;
                _this._sdfCanvas = sdfC;
                _this._sdfContext = sdfCtx;
            }
            _this._currentFreePosition = BABYLON.Vector2.Zero();
            // Add the basic ASCII based characters
            for (var i = 0x20; i < 0x7F; i++) {
                var c = String.fromCharCode(i);
                _this.getChar(c);
            }
            _this.update();
            return _this;
        }
        Object.defineProperty(FontTexture.prototype, "isDynamicFontTexture", {
            get: function () {
                return true;
            },
            enumerable: true,
            configurable: true
        });
        FontTexture.GetCachedFontTexture = function (scene, fontName, supersample, signedDistanceField) {
            if (supersample === void 0) { supersample = false; }
            if (signedDistanceField === void 0) { signedDistanceField = false; }
            var dic = scene.getOrAddExternalDataWithFactory("FontTextureCache", function () { return new BABYLON.StringDictionary(); });
            var lfn = fontName.toLocaleLowerCase() + (supersample ? "_+SS" : "_-SS") + (signedDistanceField ? "_+SDF" : "_-SDF");
            var ft = dic.get(lfn);
            if (ft) {
                ++ft._usedCounter;
                return ft;
            }
            ft = new FontTexture(null, fontName, scene, supersample ? 100 : 200, BABYLON.Texture.BILINEAR_SAMPLINGMODE, supersample, signedDistanceField);
            ft._cachedFontId = lfn;
            dic.add(lfn, ft);
            return ft;
        };
        FontTexture.ReleaseCachedFontTexture = function (scene, fontName, supersample, signedDistanceField) {
            if (supersample === void 0) { supersample = false; }
            if (signedDistanceField === void 0) { signedDistanceField = false; }
            var dic = scene.getExternalData("FontTextureCache");
            if (!dic) {
                return;
            }
            var lfn = fontName.toLocaleLowerCase() + (supersample ? "_+SS" : "_-SS") + (signedDistanceField ? "_+SDF" : "_-SDF");
            var font = dic.get(lfn);
            if (--font._usedCounter === 0) {
                dic.remove(lfn);
                font.dispose();
            }
        };
        /**
         * Make sure the given char is present in the font map.
         * @param char the character to get or add
         * @return the CharInfo instance corresponding to the given character
         */
        FontTexture.prototype.getChar = function (char) {
            var _this = this;
            if (char.length !== 1) {
                return null;
            }
            var info = this._charInfos.get(char);
            if (info) {
                return info;
            }
            info = new CharInfo();
            var measure = this._context.measureText(char);
            var textureSize = this.getSize();
            // we reached the end of the current line?
            var width = Math.ceil(measure.width);
            if (this._currentFreePosition.x + width + this._xMargin > textureSize.width) {
                this._currentFreePosition.x = 0;
                this._currentFreePosition.y += Math.ceil(this._lineHeightSuper + this._yMargin * 2);
                // No more room?
                if (this._currentFreePosition.y > textureSize.height) {
                    return this.getChar("!");
                }
            }
            var curPosX = this._currentFreePosition.x + 0.5;
            var curPosY = this._currentFreePosition.y + 0.5;
            var curPosXMargin = curPosX + this._xMargin;
            var curPosYMargin = curPosY + this._yMargin;
            var drawDebug = function (ctx) {
                ctx.strokeStyle = "green";
                ctx.beginPath();
                ctx.rect(curPosXMargin, curPosYMargin, width, _this._lineHeightSuper);
                ctx.closePath();
                ctx.stroke();
                ctx.strokeStyle = "blue";
                ctx.beginPath();
                ctx.moveTo(curPosXMargin, curPosYMargin + Math.round(_this._baseLine));
                ctx.lineTo(curPosXMargin + width, curPosYMargin + Math.round(_this._baseLine));
                ctx.closePath();
                ctx.stroke();
            };
            // In SDF mode we render the character in an intermediate 2D context which scale the character this._sdfScale times (which is required to compute the SDF map accurately)
            if (this._signedDistanceField) {
                var s = this._sdfScale;
                this._sdfContext.clearRect(0, 0, this._sdfCanvas.width, this._sdfCanvas.height);
                // Coordinates are subject to the context's scale
                this._sdfContext.fillText(char, this._xMargin + 0.5, this._yMargin + 0.5 - this._offset);
                // Canvas Pixel Coordinates, no scale
                var data = this._sdfContext.getImageData(0, 0, (width + (this._xMargin * 2)) * s, this._sdfCanvas.height);
                var res = this._computeSDFChar(data);
                this._context.putImageData(res, curPosX, curPosY);
                if (this.debugMode) {
                    drawDebug(this._context);
                }
            }
            else {
                if (this.debugMode) {
                    drawDebug(this._context);
                }
                // Draw the character in the HTML canvas
                this._context.fillText(char, curPosXMargin, curPosYMargin - this._offset);
            }
            // Fill the CharInfo object
            info.topLeftUV = new BABYLON.Vector2((curPosXMargin) / textureSize.width, (this._currentFreePosition.y + this._yMargin) / textureSize.height);
            info.bottomRightUV = new BABYLON.Vector2((curPosXMargin + width) / textureSize.width, info.topLeftUV.y + ((this._lineHeightSuper + this._yMargin) / textureSize.height));
            info.yOffset = info.xOffset = 0;
            if (this._signedDistanceField) {
                var off = 1 / textureSize.width;
                info.topLeftUV.addInPlace(new BABYLON.Vector2(off, off));
                info.bottomRightUV.addInPlace(new BABYLON.Vector2(off, off));
            }
            info.charWidth = this._superSample ? (width / 2) : width;
            info.xAdvance = info.charWidth;
            // Add the info structure
            this._charInfos.add(char, info);
            this._curCharCount++;
            // Set the next position
            this._currentFreePosition.x += Math.ceil(width + this._xMargin * 2);
            return info;
        };
        FontTexture.prototype._computeSDFChar = function (source) {
            var scl = this._sdfScale;
            var sw = source.width;
            var sh = source.height;
            var dw = sw / scl;
            var dh = sh / scl;
            var roffx = 0;
            var roffy = 0;
            // We shouldn't look beyond half of the biggest between width and height
            var radius = scl;
            var br = radius - 1;
            var lookupSrc = function (dx, dy, offX, offY, lookVis) {
                var sx = dx * scl;
                var sy = dy * scl;
                // Looking out of the area? return true to make the test going on
                if (((sx + offX) < 0) || ((sx + offX) >= sw) || ((sy + offY) < 0) || ((sy + offY) >= sh)) {
                    return true;
                }
                // Get the pixel we want
                var val = source.data[(((sy + offY) * sw) + (sx + offX)) * 4];
                var res = (val > 0) === lookVis;
                if (!res) {
                    roffx = offX;
                    roffy = offY;
                }
                return res;
            };
            var lookupArea = function (dx, dy, lookVis) {
                // Fast rejection test, if we have the same result in N, S, W, E at a distance which is the radius-1 then it means the data will be consistent in this area. That's because we've scale the rendering of the letter "radius" times, so a letter's pixel will be at least radius wide
                if (lookupSrc(dx, dy, 0, br, lookVis) &&
                    lookupSrc(dx, dy, 0, -br, lookVis) &&
                    lookupSrc(dx, dy, -br, 0, lookVis) &&
                    lookupSrc(dx, dy, br, 0, lookVis)) {
                    return 0;
                }
                for (var i = 1; i <= radius; i++) {
                    // Quick test N, S, W, E
                    if (!lookupSrc(dx, dy, 0, i, lookVis) || !lookupSrc(dx, dy, 0, -i, lookVis) || !lookupSrc(dx, dy, -i, 0, lookVis) || !lookupSrc(dx, dy, i, 0, lookVis)) {
                        return i * i; // Squared Distance is simple to compute in this case
                    }
                    // Test the frame area (except the N, S, W, E spots) from the nearest point from the center to the further one
                    for (var j = 1; j <= i; j++) {
                        if (!lookupSrc(dx, dy, -j, i, lookVis) || !lookupSrc(dx, dy, j, i, lookVis) ||
                            !lookupSrc(dx, dy, i, -j, lookVis) || !lookupSrc(dx, dy, i, j, lookVis) ||
                            !lookupSrc(dx, dy, -j, -i, lookVis) || !lookupSrc(dx, dy, j, -i, lookVis) ||
                            !lookupSrc(dx, dy, -i, -j, lookVis) || !lookupSrc(dx, dy, -i, j, lookVis)) {
                            // We found the nearest texel having and opposite state, store the squared length
                            var res_1 = (i * i) + (j * j);
                            var count = 1;
                            // To improve quality we will  sample the texels around this one, so it's 8 samples, we consider only the one having an opposite state, add them to the current res and will will compute the average at the end
                            if (!lookupSrc(dx, dy, roffx - 1, roffy, lookVis)) {
                                res_1 += (roffx - 1) * (roffx - 1) + roffy * roffy;
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx + 1, roffy, lookVis)) {
                                res_1 += (roffx + 1) * (roffx + 1) + roffy * roffy;
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx, roffy - 1, lookVis)) {
                                res_1 += roffx * roffx + (roffy - 1) * (roffy - 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx, roffy + 1, lookVis)) {
                                res_1 += roffx * roffx + (roffy + 1) * (roffy + 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx - 1, roffy - 1, lookVis)) {
                                res_1 += (roffx - 1) * (roffx - 1) + (roffy - 1) * (roffy - 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx + 1, roffy + 1, lookVis)) {
                                res_1 += (roffx + 1) * (roffx + 1) + (roffy + 1) * (roffy + 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx + 1, roffy - 1, lookVis)) {
                                res_1 += (roffx + 1) * (roffx + 1) + (roffy - 1) * (roffy - 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx - 1, roffy + 1, lookVis)) {
                                res_1 += (roffx - 1) * (roffx - 1) + (roffy + 1) * (roffy + 1);
                                ++count;
                            }
                            // Compute the average based on the accumulated distance
                            return res_1 / count;
                        }
                    }
                }
                return 0;
            };
            var tmp = new Array(dw * dh);
            for (var y = 0; y < dh; y++) {
                for (var x = 0; x < dw; x++) {
                    var curState = lookupSrc(x, y, 0, 0, true);
                    var d = lookupArea(x, y, curState);
                    if (d === 0) {
                        d = radius * radius * 2;
                    }
                    tmp[(y * dw) + x] = curState ? d : -d;
                }
            }
            var res = this._context.createImageData(dw, dh);
            var size = dw * dh;
            for (var j = 0; j < size; j++) {
                var d = tmp[j];
                var sign = (d < 0) ? -1 : 1;
                d = Math.sqrt(Math.abs(d)) * sign;
                d *= 127.5 / radius;
                d += 127.5;
                if (d < 0) {
                    d = 0;
                }
                else if (d > 255) {
                    d = 255;
                }
                d += 0.5;
                res.data[j * 4 + 0] = d;
                res.data[j * 4 + 1] = d;
                res.data[j * 4 + 2] = d;
                res.data[j * 4 + 3] = 255;
            }
            return res;
        };
        FontTexture.prototype.getSuperSampleFont = function (font) {
            // Eternal thank to http://stackoverflow.com/a/10136041/802124
            var regex = /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx]))(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-,\"\sa-z]+?)\s*$/;
            var res = font.toLocaleLowerCase().match(regex);
            if (res == null) {
                return null;
            }
            var size = parseInt(res[4]);
            res[4] = (size * 2).toString() + (res[4].match(/\D+/) || []).pop();
            var newFont = "";
            for (var j = 1; j < res.length; j++) {
                if (res[j] != null) {
                    newFont += res[j] + " ";
                }
            }
            return newFont;
        };
        // More info here: https://videlais.com/2014/03/16/the-many-and-varied-problems-with-measuring-font-height-for-html5-canvas/
        FontTexture.prototype.getFontHeight = function (font, chars) {
            var fontDraw = document.createElement("canvas");
            fontDraw.width = 600;
            fontDraw.height = 600;
            var ctx = fontDraw.getContext('2d');
            ctx.fillRect(0, 0, fontDraw.width, fontDraw.height);
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'white';
            ctx.font = font;
            ctx.fillText(chars, 0, 0);
            var pixels = ctx.getImageData(0, 0, fontDraw.width, fontDraw.height).data;
            var start = -1;
            var end = -1;
            for (var row = 0; row < fontDraw.height; row++) {
                for (var column = 0; column < fontDraw.width; column++) {
                    var index = (row * fontDraw.width + column) * 4;
                    if (pixels[index] === 0) {
                        if (column === fontDraw.width - 1 && start !== -1) {
                            end = row;
                            row = fontDraw.height;
                            break;
                        }
                        continue;
                    }
                    else {
                        if (start === -1) {
                            start = row;
                        }
                        break;
                    }
                }
            }
            return { height: (end - start) + 1, offset: start };
        };
        Object.defineProperty(FontTexture.prototype, "canRescale", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        FontTexture.prototype.getContext = function () {
            return this._context;
        };
        /**
         * Call this method when you've call getChar() at least one time, this will update the texture if needed.
         * Don't be afraid to call it, if no new character was added, this method simply does nothing.
         */
        FontTexture.prototype.update = function () {
            // Update only if there's new char added since the previous update
            if (this._lastUpdateCharCount < this._curCharCount) {
                this.getScene().getEngine().updateDynamicTexture(this._texture, this._canvas, false, true);
                this._lastUpdateCharCount = this._curCharCount;
            }
        };
        // cloning should be prohibited, there's no point to duplicate this texture at all
        FontTexture.prototype.clone = function () {
            return null;
        };
        /**
         * For FontTexture retrieved using GetCachedFontTexture, use this method when you transfer this object's lifetime to another party in order to share this resource.
         * When the other party is done with this object, decCachedFontTextureCounter must be called.
         */
        FontTexture.prototype.incCachedFontTextureCounter = function () {
            ++this._usedCounter;
        };
        /**
         * Use this method only in conjunction with incCachedFontTextureCounter, call it when you no longer need to use this shared resource.
         */
        FontTexture.prototype.decCachedFontTextureCounter = function () {
            var dic = this.getScene().getExternalData("FontTextureCache");
            if (!dic) {
                return;
            }
            if (--this._usedCounter === 0) {
                dic.remove(this._cachedFontId);
                this.dispose();
            }
        };
        return FontTexture;
    }(BaseFontTexture));
    BABYLON.FontTexture = FontTexture;
    /**
     * Orginial code from cocos2d-js, converted to TypeScript by Nockawa
     * Load the Text version of the BMFont format, no XML or binary supported, just plain old text
     */
    var BMFontLoaderTxt = BMFontLoaderTxt_1 = (function () {
        function BMFontLoaderTxt() {
        }
        BMFontLoaderTxt.prototype._parseStrToObj = function (str) {
            var arr = str.match(BMFontLoaderTxt_1.ITEM_EXP);
            if (!arr) {
                return null;
            }
            var obj = {};
            for (var i = 0, li = arr.length; i < li; i++) {
                var tempStr = arr[i];
                var index = tempStr.indexOf("=");
                var key = tempStr.substring(0, index);
                var value = tempStr.substring(index + 1);
                if (value.match(BMFontLoaderTxt_1.INT_EXP))
                    value = parseInt(value);
                else if (value[0] === '"')
                    value = value.substring(1, value.length - 1);
                obj[key] = value;
            }
            return obj;
        };
        BMFontLoaderTxt.prototype._buildCharInfo = function (bfi, initialLine, obj, textureSize, invertY, chars) {
            var char = null;
            var x = null;
            var y = null;
            var width = null;
            var height = null;
            var xoffset = 0;
            var yoffset = 0;
            var xadvance = 0;
            var ci = new CharInfo();
            for (var key in obj) {
                var value = obj[key];
                switch (key) {
                    case "id":
                        char = String.fromCharCode(value);
                        break;
                    case "x":
                        x = value;
                        break;
                    case "y":
                        y = value;
                        break;
                    case "width":
                        width = value;
                        break;
                    case "height":
                        height = value;
                        break;
                    case "xadvance":
                        xadvance = value;
                        break;
                    case "xoffset":
                        xoffset = value;
                        break;
                    case "yoffset":
                        yoffset = value;
                        break;
                }
            }
            if (x != null && y != null && width != null && height != null && char != null) {
                ci.xAdvance = xadvance;
                ci.xOffset = xoffset;
                ci.yOffset = bfi.lineHeight - height - yoffset;
                if (invertY) {
                    ci.topLeftUV = new BABYLON.Vector2(1 - (x / textureSize.width), 1 - (y / textureSize.height));
                    ci.bottomRightUV = new BABYLON.Vector2(1 - ((x + width) / textureSize.width), 1 - ((y + height) / textureSize.height));
                }
                else {
                    ci.topLeftUV = new BABYLON.Vector2(x / textureSize.width, y / textureSize.height);
                    ci.bottomRightUV = new BABYLON.Vector2((x + width) / textureSize.width, (y + height) / textureSize.height);
                }
                ci.charWidth = width;
                chars.add(char, ci);
            }
            else {
                console.log("Error while parsing line " + initialLine);
            }
        };
        BMFontLoaderTxt.prototype.loadFont = function (fontContent, scene, invertY) {
            var fontStr = fontContent;
            var bfi = new BitmapFontInfo();
            var errorCode = 0;
            var errorMsg = "OK";
            //padding
            var info = fontStr.match(BMFontLoaderTxt_1.INFO_EXP);
            var infoObj = this._parseStrToObj(info[0]);
            if (!infoObj) {
                return null;
            }
            var paddingArr = infoObj["padding"].split(",");
            bfi.padding = new BABYLON.Vector4(parseInt(paddingArr[0]), parseInt(paddingArr[1]), parseInt(paddingArr[2]), parseInt(paddingArr[3]));
            //common
            var commonObj = this._parseStrToObj(fontStr.match(BMFontLoaderTxt_1.COMMON_EXP)[0]);
            bfi.lineHeight = commonObj["lineHeight"];
            bfi.baseLine = commonObj["base"];
            bfi.textureSize = new BABYLON.Size(commonObj["scaleW"], commonObj["scaleH"]);
            var maxTextureSize = scene.getEngine()._gl.getParameter(0xd33);
            if (commonObj["scaleW"] > maxTextureSize.width || commonObj["scaleH"] > maxTextureSize.height) {
                errorMsg = "FontMap texture's size is bigger than what WebGL supports";
                errorCode = -1;
            }
            else {
                if (commonObj["pages"] !== 1) {
                    errorMsg = "FontMap must contain one page only.";
                    errorCode = -1;
                }
                else {
                    //page
                    var pageObj = this._parseStrToObj(fontStr.match(BMFontLoaderTxt_1.PAGE_EXP)[0]);
                    if (pageObj["id"] !== 0) {
                        errorMsg = "Only one page of ID 0 is supported";
                        errorCode = -1;
                    }
                    else {
                        bfi.textureFile = pageObj["file"];
                        //char
                        var charLines = fontStr.match(BMFontLoaderTxt_1.CHAR_EXP);
                        for (var i = 0, li = charLines.length; i < li; i++) {
                            var charObj = this._parseStrToObj(charLines[i]);
                            this._buildCharInfo(bfi, charLines[i], charObj, bfi.textureSize, invertY, bfi.charDic);
                        }
                        //kerning
                        var kerningLines = fontStr.match(BMFontLoaderTxt_1.KERNING_EXP);
                        if (kerningLines) {
                            for (var i = 0, li = kerningLines.length; i < li; i++) {
                                var kerningObj = this._parseStrToObj(kerningLines[i]);
                                bfi.kerningDic.add(((kerningObj["first"] << 16) | (kerningObj["second"] & 0xffff)).toString(), kerningObj["amount"]);
                            }
                        }
                    }
                }
            }
            return { bfi: bfi, errorCode: errorCode, errorMsg: errorMsg };
        };
        return BMFontLoaderTxt;
    }());
    BMFontLoaderTxt.INFO_EXP = /info [^\r\n]*(\r\n|$)/gi;
    BMFontLoaderTxt.COMMON_EXP = /common [^\n]*(\n|$)/gi;
    BMFontLoaderTxt.PAGE_EXP = /page [^\n]*(\n|$)/gi;
    BMFontLoaderTxt.CHAR_EXP = /char [^\n]*(\n|$)/gi;
    BMFontLoaderTxt.KERNING_EXP = /kerning [^\n]*(\n|$)/gi;
    BMFontLoaderTxt.ITEM_EXP = /\w+=[^ \r\n]+/gi;
    BMFontLoaderTxt.INT_EXP = /^[\-]?\d+$/;
    BMFontLoaderTxt = BMFontLoaderTxt_1 = __decorate([
        BitmapFontLoaderPlugin("fnt", new BMFontLoaderTxt_1())
    ], BMFontLoaderTxt);
    ;
    function BitmapFontLoaderPlugin(fileExtension, plugin) {
        return function () {
            BitmapFontTexture.addLoader(fileExtension, plugin);
        };
    }
    BABYLON.BitmapFontLoaderPlugin = BitmapFontLoaderPlugin;
    var BMFontLoaderTxt_1;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.fontTexture.js.map

var BABYLON;
(function (BABYLON) {
    /**
     * Stores 2D Bounding Information.
     * This class handles a circle area and a bounding rectangle one.
     */
    var BoundingInfo2D = (function () {
        function BoundingInfo2D() {
            this.radius = 0;
            this.center = BABYLON.Vector2.Zero();
            this.extent = BABYLON.Vector2.Zero();
            this._worldAABBDirty = false;
            this._worldAABBDirtyObservable = null;
            this._worldAABB = BABYLON.Vector4.Zero();
        }
        /**
         * Create a BoundingInfo2D object from a given size
         * @param size the size that will be used to set the extend, radius will be computed from it.
         */
        BoundingInfo2D.CreateFromSize = function (size) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromSizeToRef(size, r);
            return r;
        };
        /**
         * Create a BoundingInfo2D object from a given radius
         * @param radius the radius to use, the extent will be computed from it.
         */
        BoundingInfo2D.CreateFromRadius = function (radius) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromRadiusToRef(radius, r);
            return r;
        };
        /**
         * Create a BoundingInfo2D object from a list of points.
         * The resulted object will be the smallest bounding area that includes all the given points.
         * @param points an array of points to compute the bounding object from.
         */
        BoundingInfo2D.CreateFromPoints = function (points) {
            var r = new BoundingInfo2D();
            BoundingInfo2D.CreateFromPointsToRef(points, r);
            return r;
        };
        /**
         * Update a BoundingInfo2D object using the given Size as input
         * @param size the bounding data will be computed from this size.
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        BoundingInfo2D.CreateFromSizeToRef = function (size, b) {
            if (!size) {
                size = BABYLON.Size.Zero();
            }
            b.center.x = +size.width / 2;
            b.center.y = +size.height / 2;
            b.extent.x = b.center.x;
            b.extent.y = b.center.y;
            b.radius = b.extent.length();
            b._worldAABBDirty = true;
        };
        /**
         * Update a BoundingInfo2D object using the given radius as input
         * @param radius the bounding data will be computed from this radius
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        BoundingInfo2D.CreateFromRadiusToRef = function (radius, b) {
            b.center.x = b.center.y = 0;
            var r = +radius;
            b.extent.x = r;
            b.extent.y = r;
            b.radius = r;
            b._worldAABBDirty = true;
        };
        /**
         * Update a BoundingInfo2D object using the given points array as input
         * @param points the point array to use to update the bounding data
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        BoundingInfo2D.CreateFromPointsToRef = function (points, b) {
            var xmin = Number.MAX_VALUE, ymin = Number.MAX_VALUE, xmax = Number.MIN_VALUE, ymax = Number.MIN_VALUE;
            for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
                var p = points_1[_i];
                xmin = Math.min(p.x, xmin);
                xmax = Math.max(p.x, xmax);
                ymin = Math.min(p.y, ymin);
                ymax = Math.max(p.y, ymax);
            }
            BoundingInfo2D.CreateFromMinMaxToRef(xmin, xmax, ymin, ymax, b);
        };
        /**
         * Update a BoundingInfo2D object using the given min/max values as input
         * @param xmin the smallest x coordinate
         * @param xmax the biggest x coordinate
         * @param ymin the smallest y coordinate
         * @param ymax the buggest y coordinate
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        BoundingInfo2D.CreateFromMinMaxToRef = function (xmin, xmax, ymin, ymax, b) {
            var w = xmax - xmin;
            var h = ymax - ymin;
            b.center = new BABYLON.Vector2(xmin + w / 2, ymin + h / 2);
            b.extent = new BABYLON.Vector2(xmax - b.center.x, ymax - b.center.y);
            b.radius = b.extent.length();
            b._worldAABBDirty = true;
        };
        /**
         * Duplicate this instance and return a new one
         * @return the duplicated instance
         */
        BoundingInfo2D.prototype.clone = function () {
            var r = new BoundingInfo2D();
            r.center = this.center.clone();
            r.radius = this.radius;
            r.extent = this.extent.clone();
            return r;
        };
        BoundingInfo2D.prototype.clear = function () {
            this.center.copyFromFloats(0, 0);
            this.radius = 0;
            this.extent.copyFromFloats(0, 0);
            this._worldAABBDirty = true;
        };
        BoundingInfo2D.prototype.copyFrom = function (src) {
            this.center.copyFrom(src.center);
            this.radius = src.radius;
            this.extent.copyFrom(src.extent);
            this._worldAABBDirty = true;
        };
        BoundingInfo2D.prototype.equals = function (other) {
            if (!other) {
                return false;
            }
            return other.center.equals(this.center) && other.extent.equals(this.extent);
        };
        /**
         * return the max extend of the bounding info
         */
        BoundingInfo2D.prototype.max = function () {
            var r = BABYLON.Vector2.Zero();
            this.maxToRef(r);
            return r;
        };
        /**
         * return the min/max extend of the bounding info.
         * x, y, z, w are left, bottom, right and top
         */
        BoundingInfo2D.prototype.minMax = function () {
            var r = BABYLON.Vector4.Zero();
            this.minMaxToRef(r);
            return r;
        };
        /**
         * Update a vector2 with the max extend of the bounding info
         * @param result must be a valid/allocated vector2 that will contain the result of the operation
         */
        BoundingInfo2D.prototype.maxToRef = function (result) {
            result.x = this.center.x + this.extent.x;
            result.y = this.center.y + this.extent.y;
        };
        /**
         * Update a vector4 with the min/max extend of the bounding info
         * x, y, z, w are left, bottom, right and top
         * @param result must be a valid/allocated vector4 that will contain the result of the operation
         */
        BoundingInfo2D.prototype.minMaxToRef = function (result) {
            result.x = this.center.x - this.extent.x;
            result.y = this.center.y - this.extent.y;
            result.z = this.center.x + this.extent.x;
            result.w = this.center.y + this.extent.y;
        };
        /**
         * Return the size of the boundingInfo rect surface
         */
        BoundingInfo2D.prototype.size = function () {
            var r = BABYLON.Size.Zero();
            this.sizeToRef(r);
            return r;
        };
        /**
         * Stores in the result object the size of the boundingInfo rect surface
         * @param result
         */
        BoundingInfo2D.prototype.sizeToRef = function (result) {
            result.width = this.extent.x * 2;
            result.height = this.extent.y * 2;
        };
        /**
         * Inflate the boundingInfo with the given vector
         * @param offset the extent will be incremented with offset and the radius will be computed again
         */
        BoundingInfo2D.prototype.inflate = function (offset) {
            this.extent.addInPlace(offset);
            this.radius = this.extent.length();
        };
        /**
         * Apply a transformation matrix to this BoundingInfo2D and return a new instance containing the result
         * @param matrix the transformation matrix to apply
         * @return the new instance containing the result of the transformation applied on this BoundingInfo2D
         */
        BoundingInfo2D.prototype.transform = function (matrix) {
            var r = new BoundingInfo2D();
            this.transformToRef(matrix, r);
            return r;
        };
        /**
         * Compute the union of this BoundingInfo2D with a given one, returns a new BoundingInfo2D as a result
         * @param other the second BoundingInfo2D to compute the union with this one
         * @return a new instance containing the result of the union
         */
        BoundingInfo2D.prototype.union = function (other) {
            var r = new BoundingInfo2D();
            this.unionToRef(other, r);
            return r;
        };
        BoundingInfo2D.prototype.worldAABBIntersectionTest = function (other) {
            var a = this.worldAABB;
            var b = other.worldAABB;
            return b.z >= a.x && b.x <= a.z && b.w >= a.y && b.y <= a.w;
        };
        /**
         * Transform this BoundingInfo2D with a given matrix and store the result in an existing BoundingInfo2D instance.
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it every time.
         * @param matrix The matrix to use to compute the transformation
         * @param result A VALID (i.e. allocated) BoundingInfo2D object where the result will be stored
         */
        BoundingInfo2D.prototype.transformToRef = function (matrix, result) {
            // Construct a bounding box based on the extent values
            var p = BoundingInfo2D._transform;
            p[0].x = this.center.x + this.extent.x;
            p[0].y = this.center.y + this.extent.y;
            p[1].x = this.center.x + this.extent.x;
            p[1].y = this.center.y - this.extent.y;
            p[2].x = this.center.x - this.extent.x;
            p[2].y = this.center.y - this.extent.y;
            p[3].x = this.center.x - this.extent.x;
            p[3].y = this.center.y + this.extent.y;
            // Transform the four points of the bounding box with the matrix
            for (var i = 0; i < 4; i++) {
                BABYLON.Vector2.TransformToRef(p[i], matrix, p[i]);
            }
            BoundingInfo2D.CreateFromPointsToRef(p, result);
        };
        BoundingInfo2D.prototype._updateWorldAABB = function (worldMatrix) {
            // Construct a bounding box based on the extent values
            var p = BoundingInfo2D._transform;
            p[0].x = this.center.x + this.extent.x;
            p[0].y = this.center.y + this.extent.y;
            p[1].x = this.center.x + this.extent.x;
            p[1].y = this.center.y - this.extent.y;
            p[2].x = this.center.x - this.extent.x;
            p[2].y = this.center.y - this.extent.y;
            p[3].x = this.center.x - this.extent.x;
            p[3].y = this.center.y + this.extent.y;
            // Transform the four points of the bounding box with the matrix
            for (var i = 0; i < 4; i++) {
                BABYLON.Vector2.TransformToRef(p[i], worldMatrix, p[i]);
            }
            this._worldAABB.x = Math.min(Math.min(p[0].x, p[1].x), Math.min(p[2].x, p[3].x));
            this._worldAABB.y = Math.min(Math.min(p[0].y, p[1].y), Math.min(p[2].y, p[3].y));
            this._worldAABB.z = Math.max(Math.max(p[0].x, p[1].x), Math.max(p[2].x, p[3].x));
            this._worldAABB.w = Math.max(Math.max(p[0].y, p[1].y), Math.max(p[2].y, p[3].y));
        };
        Object.defineProperty(BoundingInfo2D.prototype, "worldAABBDirtyObservable", {
            get: function () {
                if (!this._worldAABBDirtyObservable) {
                    this._worldAABBDirtyObservable = new BABYLON.Observable();
                }
                return this._worldAABBDirtyObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoundingInfo2D.prototype, "isWorldAABBDirty", {
            get: function () {
                return this._worldAABBDirty;
            },
            enumerable: true,
            configurable: true
        });
        BoundingInfo2D.prototype.dirtyWorldAABB = function () {
            if (this._worldAABBDirty) {
                return;
            }
            this._worldAABBDirty = true;
            if (this._worldAABBDirtyObservable && this._worldAABBDirtyObservable.hasObservers()) {
                this._worldAABBDirtyObservable.notifyObservers(this);
            }
        };
        Object.defineProperty(BoundingInfo2D.prototype, "worldAABB", {
            /**
             * Retrieve the world AABB, the Vector4's data is x=xmin, y=ymin, z=xmax, w=ymax
             */
            get: function () {
                if (this._worldAABBDirty) {
                    if (!this.worldMatrixAccess) {
                        throw new Error("you must set the worldMatrixAccess function first");
                    }
                    this._updateWorldAABB(this.worldMatrixAccess());
                    this._worldAABBDirty = false;
                }
                return this._worldAABB;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Compute the union of this BoundingInfo2D with another one and store the result in a third valid BoundingInfo2D object
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it every time.
         * @param other the second object used to compute the union
         * @param result a VALID BoundingInfo2D instance (i.e. allocated) where the result will be stored
         */
        BoundingInfo2D.prototype.unionToRef = function (other, result) {
            var xmax = Math.max(this.center.x + this.extent.x, other.center.x + other.extent.x);
            var ymax = Math.max(this.center.y + this.extent.y, other.center.y + other.extent.y);
            var xmin = Math.min(this.center.x - this.extent.x, other.center.x - other.extent.x);
            var ymin = Math.min(this.center.y - this.extent.y, other.center.y - other.extent.y);
            BoundingInfo2D.CreateFromMinMaxToRef(xmin, xmax, ymin, ymax, result);
        };
        /**
         * Check if the given point is inside the BoundingInfo.
         * The test is first made on the radius, then inside the rectangle described by the extent
         * @param pickPosition the position to test
         * @return true if the point is inside, false otherwise
         */
        BoundingInfo2D.prototype.doesIntersect = function (pickPosition) {
            // is it inside the radius?
            var pickLocal = pickPosition.subtract(this.center);
            if (pickLocal.lengthSquared() <= (this.radius * this.radius)) {
                // is it inside the rectangle?
                return ((Math.abs(pickLocal.x) <= this.extent.x) && (Math.abs(pickLocal.y) <= this.extent.y));
            }
            return false;
        };
        return BoundingInfo2D;
    }());
    BoundingInfo2D._transform = new Array(BABYLON.Vector2.Zero(), BABYLON.Vector2.Zero(), BABYLON.Vector2.Zero(), BABYLON.Vector2.Zero());
    BABYLON.BoundingInfo2D = BoundingInfo2D;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.bounding2d.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
     * The base class for all implementation of a Primitive Collision Manager
     */
    var PrimitiveCollisionManagerBase = (function () {
        function PrimitiveCollisionManagerBase(owner) {
            this._owner = owner;
        }
        PrimitiveCollisionManagerBase.allocBasicPCM = function (owner, enableBorders) {
            return new BasicPrimitiveCollisionManager(owner, enableBorders);
        };
        return PrimitiveCollisionManagerBase;
    }());
    BABYLON.PrimitiveCollisionManagerBase = PrimitiveCollisionManagerBase;
    /**
     * Base class of an Actor
     */
    var ActorInfoBase = (function () {
        function ActorInfoBase() {
        }
        return ActorInfoBase;
    }());
    BABYLON.ActorInfoBase = ActorInfoBase;
    var ActorInfo = (function (_super) {
        __extends(ActorInfo, _super);
        function ActorInfo(owner, actor, deep) {
            var _this = _super.call(this) || this;
            _this.owner = owner;
            _this.prim = actor;
            _this.flags = 0;
            _this.presentInClusters = new BABYLON.StringDictionary();
            _this.intersectWith = new BABYLON.ObservableStringDictionary(false);
            _this.setFlags((deep ? ActorInfo.flagDeep : 0) | ActorInfo.flagDirty);
            var bi = (deep ? actor.boundingInfo : actor.levelBoundingInfo);
            // Dirty Actor if its WorldAABB changed
            bi.worldAABBDirtyObservable.add(function (e, d) {
                _this.owner.actorDirty(_this);
            });
            // Dirty Actor if it's getting enabled/disabled
            actor.propertyChanged.add(function (e, d) {
                if (d.mask === -1) {
                    return;
                }
                _this.setFlagsValue(ActorInfo.flagEnabled, e.newValue === true);
                _this.owner.actorDirty(_this);
            }, BABYLON.Prim2DBase.isVisibleProperty.flagId);
            return _this;
        }
        ActorInfo.prototype.setFlags = function (flags) {
            this.flags |= flags;
        };
        ActorInfo.prototype.clearFlags = function (flags) {
            this.flags &= ~flags;
        };
        ActorInfo.prototype.isAllFlagsSet = function (flags) {
            return (this.flags & flags) === flags;
        };
        ActorInfo.prototype.isSomeFlagsSet = function (flags) {
            return (this.flags & flags) !== 0;
        };
        ActorInfo.prototype.setFlagsValue = function (flags, value) {
            if (value) {
                this.flags |= flags;
            }
            else {
                this.flags &= ~flags;
            }
        };
        Object.defineProperty(ActorInfo.prototype, "worldAABB", {
            get: function () {
                return (this.isSomeFlagsSet(ActorInfo.flagDeep) ? this.prim.boundingInfo : this.prim.levelBoundingInfo).worldAABB;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActorInfo.prototype, "isEnabled", {
            get: function () {
                return this.isSomeFlagsSet(ActorInfo.flagEnabled);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActorInfo.prototype, "isDeep", {
            get: function () {
                return this.isSomeFlagsSet(ActorInfo.flagDeep);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActorInfo.prototype, "isDirty", {
            get: function () {
                return this.isSomeFlagsSet(ActorInfo.flagDirty);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ActorInfo.prototype, "isRemoved", {
            get: function () {
                return this.isSomeFlagsSet(ActorInfo.flagRemoved);
            },
            enumerable: true,
            configurable: true
        });
        return ActorInfo;
    }(ActorInfoBase));
    ActorInfo.flagDeep = 0x0001; // set if the actor boundingInfo must be used instead of the levelBoundingInfo
    ActorInfo.flagEnabled = 0x0002; // set if the actor is enabled and should be considered for intersection tests
    ActorInfo.flagDirty = 0x0004; // set if the actor's AABB is dirty
    ActorInfo.flagRemoved = 0x0008; // set if the actor was removed from the PCM
    var ClusterInfo = (function () {
        function ClusterInfo() {
            this.actors = new BABYLON.StringDictionary();
        }
        ClusterInfo.prototype.clear = function () {
            this.actors.clear();
        };
        return ClusterInfo;
    }());
    var BasicPrimitiveCollisionManager = (function (_super) {
        __extends(BasicPrimitiveCollisionManager, _super);
        function BasicPrimitiveCollisionManager(owner, enableBorders) {
            var _this = _super.call(this, owner) || this;
            _this._actors = new BABYLON.StringDictionary();
            _this._dirtyActors = new BABYLON.StringDictionary();
            _this._clusters = null;
            _this._maxActorByCluster = 0;
            _this._AABBRenderPrim = null;
            _this._canvasSize = BABYLON.Size.Zero();
            _this._ClusterRenderPrim = null;
            _this._debugTextBackground = null;
            _this._clusterDirty = true;
            _this._clusterSize = new BABYLON.Size(2, 2);
            _this._clusterStep = BABYLON.Vector2.Zero();
            _this._lastClusterResizeCounter = 0;
            _this._freeClusters = new Array();
            _this._enableBorder = enableBorders;
            _this._debugUpdateOpCount = new BABYLON.PerfCounter();
            _this._debugUpdateTime = new BABYLON.PerfCounter();
            _this._intersectedActors = new BABYLON.ObservableStringDictionary(false);
            _this._borderIntersecteddActors = new Array(4);
            for (var j = 0; j < 4; j++) {
                _this._borderIntersecteddActors[j] = new BABYLON.ObservableStringDictionary(false);
            }
            var flagId = BABYLON.Canvas2D.actualSizeProperty.flagId;
            if (!BasicPrimitiveCollisionManager.WAABBCorners) {
                BasicPrimitiveCollisionManager.WAABBCorners = new Array(4);
                for (var i = 0; i < 4; i++) {
                    BasicPrimitiveCollisionManager.WAABBCorners[i] = BABYLON.Vector2.Zero();
                }
                BasicPrimitiveCollisionManager.WAABBCornersCluster = new Array(4);
                for (var i = 0; i < 4; i++) {
                    BasicPrimitiveCollisionManager.WAABBCornersCluster[i] = BABYLON.Vector2.Zero();
                }
            }
            owner.propertyChanged.add(function (e, d) {
                if (d.mask === -1) {
                    return;
                }
                _this._clusterDirty = true;
                console.log("canvas size changed");
            }, flagId);
            _this.debugRenderAABB = false;
            _this.debugRenderClusters = false;
            _this.debugStats = false;
            return _this;
        }
        BasicPrimitiveCollisionManager.prototype._addActor = function (actor, deep) {
            var _this = this;
            return this._actors.getOrAddWithFactory(actor.uid, function () {
                var ai = new ActorInfo(_this, actor, deep);
                _this.actorDirty(ai);
                return ai;
            });
        };
        BasicPrimitiveCollisionManager.prototype._removeActor = function (actor) {
            var ai = this._actors.getAndRemove(actor.uid);
            ai.setFlags(ActorInfo.flagRemoved);
            this.actorDirty(ai);
        };
        BasicPrimitiveCollisionManager.prototype.actorDirty = function (actor) {
            actor.setFlags(ActorInfo.flagDirty);
            this._dirtyActors.add(actor.prim.uid, actor);
        };
        BasicPrimitiveCollisionManager.prototype._update = function () {
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
            var cw = this._clusterSize.width;
            var ch = this._clusterSize.height;
            // Check for Cluster resize
            if (((this._clusterSize.width < 16 && this._clusterSize.height < 16 && this._maxActorByCluster >= 10) ||
                (this._clusterSize.width > 2 && this._clusterSize.height > 2 && this._maxActorByCluster <= 7)) &&
                this._lastClusterResizeCounter > 100) {
                if (this._maxActorByCluster >= 10) {
                    ++cw;
                    ++ch;
                }
                else {
                    --cw;
                    --ch;
                }
                console.log("Change cluster size to " + cw + ":" + ch + ", max actor " + this._maxActorByCluster);
                this._clusterDirty = true;
            }
            // Should we update the WireFrame2D Primitive that displays the clusters
            if (this.debugRenderClusters && this._clusterDirty) {
                this._updateClusterDisplay(cw, ch);
            }
            if (this._ClusterRenderPrim) {
                this._ClusterRenderPrim.levelVisible = this.debugRenderClusters;
            }
            var updateStats = this.debugStats && (this._dirtyActors.count > 0 || this._clusterDirty);
            this._debugUpdateTime.beginMonitoring();
            // If the Cluster Size changed: rebuild it and add all actors. Otherwise add only new (dirty) actors
            if (this._clusterDirty) {
                this._initializeCluster(cw, ch);
                this._rebuildAllActors();
            }
            else {
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
        };
        Object.defineProperty(BasicPrimitiveCollisionManager.prototype, "debugRenderAABB", {
            /**
             * Renders the World AABB of all Actors
             */
            get: function () {
                return this._debugRenderAABB;
            },
            set: function (val) {
                if (this._debugRenderAABB === val) {
                    return;
                }
                this._debugRenderAABB = val;
                this._debugRenderAABBDirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BasicPrimitiveCollisionManager.prototype, "intersectedActors", {
            get: function () {
                return this._intersectedActors;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BasicPrimitiveCollisionManager.prototype, "leftBorderIntersectedActors", {
            get: function () {
                return this._borderIntersecteddActors[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BasicPrimitiveCollisionManager.prototype, "bottomBorderIntersectedActors", {
            get: function () {
                return this._borderIntersecteddActors[1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BasicPrimitiveCollisionManager.prototype, "rightBorderIntersectedActors", {
            get: function () {
                return this._borderIntersecteddActors[2];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BasicPrimitiveCollisionManager.prototype, "topBorderIntersectedActors", {
            get: function () {
                return this._borderIntersecteddActors[3];
            },
            enumerable: true,
            configurable: true
        });
        BasicPrimitiveCollisionManager.prototype._initializeCluster = function (countW, countH) {
            // Check for free
            if (this._clusters) {
                for (var w = 0; w < this._clusterSize.height; w++) {
                    for (var h = 0; h < this._clusterSize.width; h++) {
                        this._freeClusterInfo(this._clusters[w][h]);
                    }
                }
            }
            // Allocate
            this._clusterSize.copyFromFloats(countW, countH);
            this._clusters = [];
            for (var w = 0; w < this._clusterSize.height; w++) {
                this._clusters[w] = [];
                for (var h = 0; h < this._clusterSize.width; h++) {
                    var ci = this._allocClusterInfo();
                    this._clusters[w][h] = ci;
                }
            }
            this._clusterStep.copyFromFloats(this._owner.actualWidth / countW, this._owner.actualHeight / countH);
            this._maxActorByCluster = 0;
            this._lastClusterResizeCounter = 0;
            this._clusterDirty = false;
        };
        BasicPrimitiveCollisionManager.prototype._rebuildAllActors = function () {
            var _this = this;
            this._actors.forEach(function (k, ai) {
                _this._processActor(ai);
            });
        };
        BasicPrimitiveCollisionManager.prototype._rebuildDirtyActors = function () {
            var _this = this;
            this._dirtyActors.forEach(function (k, ai) {
                _this._processActor(ai);
            });
        };
        BasicPrimitiveCollisionManager.prototype._processActor = function (actor) {
            var _this = this;
            // Check if the actor is being disabled or removed
            if (!actor.isEnabled || actor.isRemoved) {
                actor.presentInClusters.forEach(function (k, ci) {
                    ci.actors.remove(actor.prim.uid);
                });
                actor.presentInClusters.clear();
                return;
            }
            var wab = actor.worldAABB;
            // Build the worldAABB corners
            var wac = BasicPrimitiveCollisionManager.WAABBCorners;
            wac[0].copyFromFloats(wab.x, wab.y); // Bottom/Left
            wac[1].copyFromFloats(wab.z, wab.y); // Bottom/Right
            wac[2].copyFromFloats(wab.z, wab.w); // Top/Right
            wac[3].copyFromFloats(wab.x, wab.w); // Top/Left
            var cs = this._clusterStep;
            var wacc = BasicPrimitiveCollisionManager.WAABBCornersCluster;
            for (var i = 0; i < 4; i++) {
                var p = wac[i];
                var cx = (p.x - (p.x % cs.x)) / cs.x;
                var cy = (p.y - (p.y % cs.y)) / cs.y;
                wacc[i].copyFromFloats(Math.floor(cx), Math.floor(cy));
            }
            var opCount = 0;
            var totalClusters = 0;
            var newCI = new Array();
            var sx = Math.max(0, wacc[0].x); // Start Cluster X
            var sy = Math.max(0, wacc[0].y); // Start Cluster Y
            var ex = Math.min(this._clusterSize.width - 1, wacc[2].x); // End Cluster X
            var ey = Math.min(this._clusterSize.height - 1, wacc[2].y); // End Cluster Y
            if (this._enableBorder) {
                if (wac[0].x < 0) {
                    this._borderIntersecteddActors[0].add(actor.prim.uid, actor.prim);
                }
                else {
                    this._borderIntersecteddActors[0].remove(actor.prim.uid);
                }
                if (wac[0].y < 0) {
                    this._borderIntersecteddActors[1].add(actor.prim.uid, actor.prim);
                }
                else {
                    this._borderIntersecteddActors[1].remove(actor.prim.uid);
                }
                if (wac[2].x >= this._canvasSize.width) {
                    this._borderIntersecteddActors[2].add(actor.prim.uid, actor.prim);
                }
                else {
                    this._borderIntersecteddActors[2].remove(actor.prim.uid);
                }
                if (wac[2].y >= this._canvasSize.height) {
                    this._borderIntersecteddActors[3].add(actor.prim.uid, actor.prim);
                }
                else {
                    this._borderIntersecteddActors[3].remove(actor.prim.uid);
                }
            }
            for (var y = sy; y <= ey; y++) {
                var _loop_1 = function (x) {
                    var k = x + ":" + y;
                    var cx = x, cy = y;
                    var ci = actor.presentInClusters.getOrAddWithFactory(k, function (k) {
                        var nci = _this._getCluster(cx, cy);
                        nci.actors.add(actor.prim.uid, actor);
                        _this._maxActorByCluster = Math.max(_this._maxActorByCluster, nci.actors.count);
                        ++opCount;
                        ++totalClusters;
                        return nci;
                    });
                    newCI.push(ci);
                };
                for (var x = sx; x <= ex; x++) {
                    _loop_1(x);
                }
            }
            // Check if there were no change
            if (opCount === 0 && actor.presentInClusters.count === totalClusters) {
                return;
            }
            // Build the array of the cluster where the actor is no longer in
            var clusterToRemove = new Array();
            actor.presentInClusters.forEach(function (k, ci) {
                if (newCI.indexOf(ci) === -1) {
                    clusterToRemove.push(k);
                    // remove the primitive from the Cluster Info object
                    ci.actors.remove(actor.prim.uid);
                }
            });
            // Remove these clusters from the actor's dictionary
            for (var _i = 0, clusterToRemove_1 = clusterToRemove; _i < clusterToRemove_1.length; _i++) {
                var key = clusterToRemove_1[_i];
                actor.presentInClusters.remove(key);
            }
        };
        // The algorithm is simple, we have previously partitioned the Actors in the Clusters: each actor has a list of the Cluster(s) it's inside.
        // Then for a given Actor that is dirty we evaluate the intersection with all the other actors present in the same Cluster(s)
        // So it's basically O(n²), BUT only inside a Cluster and only for dirty Actors.
        BasicPrimitiveCollisionManager.prototype._collisionDetection = function () {
            var _this = this;
            var hash = BasicPrimitiveCollisionManager.CandidatesActors;
            var prev = BasicPrimitiveCollisionManager.PreviousIntersections;
            var opCount = 0;
            this._dirtyActors.forEach(function (k1, ai1) {
                ++opCount;
                // Build the list of candidates
                hash.clear();
                ai1.presentInClusters.forEach(function (k, ci) {
                    ++opCount;
                    ci.actors.forEach(function (k, v) { return hash.add(k, v); });
                });
                var wab1 = ai1.worldAABB;
                // Save the previous intersections
                prev.clear();
                prev.copyFrom(ai1.intersectWith);
                ai1.intersectWith.clear();
                // For each candidate
                hash.forEach(function (k2, ai2) {
                    ++opCount;
                    // Check if we're testing against itself
                    if (k1 === k2) {
                        return;
                    }
                    var wab2 = ai2.worldAABB;
                    if (wab2.z >= wab1.x && wab2.x <= wab1.z && wab2.w >= wab1.y && wab2.y <= wab1.w) {
                        if (ai1.prim.intersectOtherPrim(ai2.prim)) {
                            ++opCount;
                            ai1.intersectWith.add(k2, ai2);
                            if (k1 < k2) {
                                _this._intersectedActors.add(k1 + ";" + k2, { a: ai1.prim, b: ai2.prim });
                            }
                            else {
                                _this._intersectedActors.add(k2 + ";" + k1, { a: ai2.prim, b: ai1.prim });
                            }
                        }
                    }
                });
                // Check and remove the associations that no longer exist in the main intersection list
                prev.forEach(function (k, ai) {
                    if (!ai1.intersectWith.contains(k)) {
                        ++opCount;
                        _this._intersectedActors.remove((k < k1 ? k : k1) + ";" + (k < k1 ? k1 : k));
                    }
                });
            });
            this._debugUpdateOpCount.fetchNewFrame();
            this._debugUpdateOpCount.addCount(opCount, true);
        };
        BasicPrimitiveCollisionManager.prototype._getCluster = function (x, y) {
            return this._clusters[x][y];
        };
        BasicPrimitiveCollisionManager.prototype._updateDebugStats = function () {
            var format = function (v) { return (Math.round(v * 100) / 100).toString(); };
            var txt = "Primitive Collision Stats\n" +
                (" - PCM Execution Time: " + format(this._debugUpdateTime.lastSecAverage) + "ms\n") +
                (" - Operation Count: " + format(this._debugUpdateOpCount.current) + ", (avg:" + format(this._debugUpdateOpCount.lastSecAverage) + ", t:" + format(this._debugUpdateOpCount.total) + ")\n") +
                (" - Max Actor per Cluster: " + this._maxActorByCluster + "\n") +
                (" - Intersections count: " + this.intersectedActors.count);
            if (!this._debugTextBackground) {
                this._debugTextBackground = new BABYLON.Rectangle2D({
                    id: "###DEBUG PMC STATS###", parent: this._owner, marginAlignment: "h: left, v: top", fill: "#C0404080", padding: "10", margin: "10", roundRadius: 10, children: [
                        new BABYLON.Text2D(txt, { id: "###DEBUG PMC TEXT###", fontName: "12pt Lucida Console" })
                    ]
                });
            }
            else {
                this._debugTextBackground.levelVisible = true;
                var text2d = this._debugTextBackground.children[0];
                text2d.text = txt;
            }
        };
        BasicPrimitiveCollisionManager.prototype._updateAABBDisplay = function () {
            var g = new BABYLON.WireFrameGroup2D("main", new BABYLON.Color4(0.5, 0.8, 1.0, 1.0));
            var v = BABYLON.Vector2.Zero();
            this._actors.forEach(function (k, ai) {
                if (ai.isEnabled) {
                    var ab = ai.worldAABB;
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
                this._AABBRenderPrim = new BABYLON.WireFrame2D([g], { parent: this._owner, alignToPixel: false, id: "###DEBUG PCM AABB###" });
            }
            else {
                this._AABBRenderPrim.wireFrameGroups.set("main", g);
                this._AABBRenderPrim.wireFrameGroupsDirty();
            }
            this._debugRenderAABBDirty = false;
        };
        BasicPrimitiveCollisionManager.prototype._updateClusterDisplay = function (cw, ch) {
            var g = new BABYLON.WireFrameGroup2D("main", new BABYLON.Color4(0.8, 0.1, 0.5, 1.0));
            var v1 = BABYLON.Vector2.Zero();
            var v2 = BABYLON.Vector2.Zero();
            // Vertical lines
            var step = (this._owner.actualWidth - 1) / cw;
            v1.y = 0;
            v2.y = this._owner.actualHeight;
            for (var x = 0; x <= cw; x++) {
                g.pushVertex(v1);
                g.pushVertex(v2);
                v1.x += step;
                v2.x += step;
            }
            // Horizontal lines
            step = (this._owner.actualHeight - 1) / ch;
            v1.x = v1.y = v2.y = 0;
            v2.x = this._owner.actualWidth;
            for (var y = 0; y <= ch; y++) {
                g.pushVertex(v1);
                g.pushVertex(v2);
                v1.y += step;
                v2.y += step;
            }
            if (!this._ClusterRenderPrim) {
                this._ClusterRenderPrim = new BABYLON.WireFrame2D([g], { parent: this._owner, alignToPixel: true, id: "###DEBUG PCM Clusters###" });
            }
            else {
                this._ClusterRenderPrim.wireFrameGroups.set("main", g);
                this._ClusterRenderPrim.wireFrameGroupsDirty();
            }
        };
        // Basically: we don't want to spend our time playing with the GC each time the Cluster Array is rebuilt, so we keep a list of available
        //  ClusterInfo object and we have two method to allocate/free them. This way we always deal with the same objects.
        // The free array never shrink, always grows...For the better...and the worst!
        BasicPrimitiveCollisionManager.prototype._allocClusterInfo = function () {
            if (this._freeClusters.length === 0) {
                for (var i = 0; i < 8; i++) {
                    this._freeClusters.push(new ClusterInfo());
                }
            }
            return this._freeClusters.pop();
        };
        BasicPrimitiveCollisionManager.prototype._freeClusterInfo = function (ci) {
            ci.clear();
            this._freeClusters.push(ci);
        };
        return BasicPrimitiveCollisionManager;
    }(PrimitiveCollisionManagerBase));
    BasicPrimitiveCollisionManager.WAABBCorners = null;
    BasicPrimitiveCollisionManager.WAABBCornersCluster = null;
    BasicPrimitiveCollisionManager.CandidatesActors = new BABYLON.StringDictionary();
    BasicPrimitiveCollisionManager.PreviousIntersections = new BABYLON.StringDictionary();
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.primitiveCollisionManager.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var LayoutEngineBase = (function () {
        function LayoutEngineBase() {
            this.layoutDirtyOnPropertyChangedMask = 0;
        }
        LayoutEngineBase.prototype.updateLayout = function (prim) {
        };
        Object.defineProperty(LayoutEngineBase.prototype, "isChildPositionAllowed", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        LayoutEngineBase.prototype.isLocked = function () {
            return this._isLocked;
        };
        LayoutEngineBase.prototype.lock = function () {
            if (this._isLocked) {
                return false;
            }
            this._isLocked = true;
            return true;
        };
        return LayoutEngineBase;
    }());
    LayoutEngineBase = __decorate([
        BABYLON.className("LayoutEngineBase", "BABYLON")
    ], LayoutEngineBase);
    BABYLON.LayoutEngineBase = LayoutEngineBase;
    var CanvasLayoutEngine = CanvasLayoutEngine_1 = (function (_super) {
        __extends(CanvasLayoutEngine, _super);
        function CanvasLayoutEngine() {
            var _this = _super.call(this) || this;
            _this.layoutDirtyOnPropertyChangedMask = BABYLON.Prim2DBase.sizeProperty.flagId | BABYLON.Prim2DBase.actualSizeProperty.flagId;
            return _this;
        }
        Object.defineProperty(CanvasLayoutEngine, "Singleton", {
            get: function () {
                if (!CanvasLayoutEngine_1._singleton) {
                    CanvasLayoutEngine_1._singleton = new CanvasLayoutEngine_1();
                }
                return CanvasLayoutEngine_1._singleton;
            },
            enumerable: true,
            configurable: true
        });
        // A very simple (no) layout computing...
        // The Canvas and its direct children gets the Canvas' size as Layout Area
        // Indirect children have their Layout Area to the actualSize (margin area) of their parent
        CanvasLayoutEngine.prototype.updateLayout = function (prim) {
            // If this prim is layoutDiry we update  its layoutArea and also the one of its direct children
            if (prim._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty)) {
                prim._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
                for (var _i = 0, _a = prim.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    this._doUpdate(child);
                }
            }
        };
        CanvasLayoutEngine.prototype._doUpdate = function (prim) {
            // Canvas ?
            if (prim instanceof BABYLON.Canvas2D) {
                prim.layoutArea = prim.actualSize; //.multiplyByFloats(prim.scaleX, prim.scaleY);
            }
            else if (prim.parent instanceof BABYLON.Canvas2D) {
                prim.layoutArea = prim.owner.actualSize; //.multiplyByFloats(prim.owner.scaleX, prim.owner.scaleY);
            }
            else {
                var contentArea = prim.parent.contentArea;
                // Can be null if the parent's content area depend of its children, the computation will be done in many passes
                if (contentArea) {
                    prim.layoutArea = contentArea;
                }
            }
        };
        Object.defineProperty(CanvasLayoutEngine.prototype, "isChildPositionAllowed", {
            get: function () {
                return true;
            },
            enumerable: true,
            configurable: true
        });
        return CanvasLayoutEngine;
    }(LayoutEngineBase));
    CanvasLayoutEngine._singleton = null;
    CanvasLayoutEngine = CanvasLayoutEngine_1 = __decorate([
        BABYLON.className("CanvasLayoutEngine", "BABYLON")
    ], CanvasLayoutEngine);
    BABYLON.CanvasLayoutEngine = CanvasLayoutEngine;
    var StackPanelLayoutEngine = StackPanelLayoutEngine_1 = (function (_super) {
        __extends(StackPanelLayoutEngine, _super);
        function StackPanelLayoutEngine() {
            var _this = _super.call(this) || this;
            _this._isHorizontal = true;
            _this.layoutDirtyOnPropertyChangedMask = BABYLON.Prim2DBase.sizeProperty.flagId | BABYLON.Prim2DBase.actualSizeProperty.flagId;
            return _this;
        }
        Object.defineProperty(StackPanelLayoutEngine, "Horizontal", {
            get: function () {
                if (!StackPanelLayoutEngine_1._horizontal) {
                    StackPanelLayoutEngine_1._horizontal = new StackPanelLayoutEngine_1();
                    StackPanelLayoutEngine_1._horizontal.isHorizontal = true;
                    StackPanelLayoutEngine_1._horizontal.lock();
                }
                return StackPanelLayoutEngine_1._horizontal;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StackPanelLayoutEngine, "Vertical", {
            get: function () {
                if (!StackPanelLayoutEngine_1._vertical) {
                    StackPanelLayoutEngine_1._vertical = new StackPanelLayoutEngine_1();
                    StackPanelLayoutEngine_1._vertical.isHorizontal = false;
                    StackPanelLayoutEngine_1._vertical.lock();
                }
                return StackPanelLayoutEngine_1._vertical;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StackPanelLayoutEngine.prototype, "isHorizontal", {
            get: function () {
                return this._isHorizontal;
            },
            set: function (val) {
                if (this.isLocked()) {
                    return;
                }
                this._isHorizontal = val;
            },
            enumerable: true,
            configurable: true
        });
        StackPanelLayoutEngine.prototype.updateLayout = function (prim) {
            if (prim._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty)) {
                var primLayoutArea = prim.layoutArea;
                var isSizeAuto = prim.isSizeAuto;
                // If we're not in autoSize the layoutArea of the prim having the stack panel must be computed in order for us to compute the children' position.
                // If there's at least one auto size (Horizontal or Vertical) we will have to figure the layoutArea ourselves
                if (!primLayoutArea && !isSizeAuto) {
                    return;
                }
                //                console.log("Compute Stack Panel Layout " + ++StackPanelLayoutEngine.computeCounter);
                var x = 0;
                var y = 0;
                var horizonStackPanel = this.isHorizontal;
                // If the stack panel is horizontal we check if the primitive height is auto or not, if it's auto then we have to compute the required height, otherwise we just take the actualHeight. If the stack panel is vertical we do the same but with width
                var max = 0;
                var stackPanelLayoutArea = StackPanelLayoutEngine_1.stackPanelLayoutArea;
                if (horizonStackPanel) {
                    if (prim.isVerticalSizeAuto) {
                        max = 0;
                        stackPanelLayoutArea.height = 0;
                    }
                    else {
                        max = prim.layoutArea.height;
                        stackPanelLayoutArea.height = prim.layoutArea.height;
                        stackPanelLayoutArea.width = 0;
                    }
                }
                else {
                    if (prim.isHorizontalSizeAuto) {
                        max = 0;
                        stackPanelLayoutArea.width = 0;
                    }
                    else {
                        max = prim.layoutArea.width;
                        stackPanelLayoutArea.width = prim.layoutArea.width;
                        stackPanelLayoutArea.height = 0;
                    }
                }
                for (var _i = 0, _a = prim.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    if (child._isFlagSet(BABYLON.SmartPropertyPrim.flagNoPartOfLayout)) {
                        continue;
                    }
                    if (child._hasMargin) {
                        // Calling computeWithAlignment will return us the area taken by "child" which is its layoutArea
                        // We also have the dstOffset which will give us the y position in horizontal mode or x position in vertical mode.
                        //  The alignment offset on the other axis is simply ignored as it doesn't make any sense (e.g. horizontal alignment is ignored in horizontal mode)
                        child.margin.computeWithAlignment(stackPanelLayoutArea, child.actualSize, child.marginAlignment, child.actualScale, StackPanelLayoutEngine_1.dstOffset, StackPanelLayoutEngine_1.dstArea, true);
                        child.layoutArea = StackPanelLayoutEngine_1.dstArea;
                    }
                    else {
                        child.margin.computeArea(child.actualSize, child.actualScale, StackPanelLayoutEngine_1.dstArea);
                        child.layoutArea = StackPanelLayoutEngine_1.dstArea;
                    }
                    max = Math.max(max, horizonStackPanel ? StackPanelLayoutEngine_1.dstArea.height : StackPanelLayoutEngine_1.dstArea.width);
                }
                for (var _b = 0, _c = prim.children; _b < _c.length; _b++) {
                    var child = _c[_b];
                    if (child._isFlagSet(BABYLON.SmartPropertyPrim.flagNoPartOfLayout)) {
                        continue;
                    }
                    var layoutArea = child.layoutArea;
                    if (horizonStackPanel) {
                        child.layoutAreaPos = new BABYLON.Vector2(x, 0);
                        x += layoutArea.width;
                        child.layoutArea = new BABYLON.Size(layoutArea.width, max);
                    }
                    else {
                        child.layoutAreaPos = new BABYLON.Vector2(0, y);
                        y += layoutArea.height;
                        child.layoutArea = new BABYLON.Size(max, layoutArea.height);
                    }
                }
                prim._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
            }
        };
        Object.defineProperty(StackPanelLayoutEngine.prototype, "isChildPositionAllowed", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        return StackPanelLayoutEngine;
    }(LayoutEngineBase));
    StackPanelLayoutEngine._horizontal = null;
    StackPanelLayoutEngine._vertical = null;
    StackPanelLayoutEngine.stackPanelLayoutArea = BABYLON.Size.Zero();
    StackPanelLayoutEngine.dstOffset = BABYLON.Vector4.Zero();
    StackPanelLayoutEngine.dstArea = BABYLON.Size.Zero();
    StackPanelLayoutEngine.computeCounter = 0;
    StackPanelLayoutEngine = StackPanelLayoutEngine_1 = __decorate([
        BABYLON.className("StackPanelLayoutEngine", "BABYLON")
    ], StackPanelLayoutEngine);
    BABYLON.StackPanelLayoutEngine = StackPanelLayoutEngine;
    /**
     * GridData is used specify what row(s) and column(s) a primitive is placed in when its parent is using a Grid Panel Layout.
     */
    var GridData = (function () {
        /**
         * Create a Grid Data that describes where a primitive will be placed in a Grid Panel Layout.
         * @param row the row number of the grid
         * @param column the column number of the grid
         * @param rowSpan the number of rows a primitive will occupy
         * @param columnSpan the number of columns a primitive will occupy
         **/
        function GridData(row, column, rowSpan, columnSpan) {
            this.row = row;
            this.column = column;
            this.rowSpan = (rowSpan == null) ? 1 : rowSpan;
            this.columnSpan = (columnSpan == null) ? 1 : columnSpan;
        }
        return GridData;
    }());
    BABYLON.GridData = GridData;
    var GridDimensionDefinition = (function () {
        function GridDimensionDefinition() {
        }
        GridDimensionDefinition.prototype._parse = function (value, res) {
            var v = value.toLocaleLowerCase().trim();
            if (v.indexOf("auto") === 0) {
                res(null, null, GridDimensionDefinition.Auto);
            }
            else if (v.indexOf("*") !== -1) {
                var i = v.indexOf("*");
                var w = 1;
                if (i > 0) {
                    w = parseFloat(v.substr(0, i));
                }
                res(w, null, GridDimensionDefinition.Stars);
            }
            else {
                var w = parseFloat(v);
                res(w, w, GridDimensionDefinition.Pixels);
            }
        };
        return GridDimensionDefinition;
    }());
    GridDimensionDefinition.Pixels = 1;
    GridDimensionDefinition.Stars = 2;
    GridDimensionDefinition.Auto = 3;
    var RowDefinition = (function (_super) {
        __extends(RowDefinition, _super);
        function RowDefinition() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return RowDefinition;
    }(GridDimensionDefinition));
    var ColumnDefinition = (function (_super) {
        __extends(ColumnDefinition, _super);
        function ColumnDefinition() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return ColumnDefinition;
    }(GridDimensionDefinition));
    var GridPanelLayoutEngine = GridPanelLayoutEngine_1 = (function (_super) {
        __extends(GridPanelLayoutEngine, _super);
        function GridPanelLayoutEngine(settings) {
            var _this = _super.call(this) || this;
            _this._children = [];
            _this._rowBottoms = [];
            _this._columnLefts = [];
            _this._rowHeights = [];
            _this._columnWidths = [];
            _this.layoutDirtyOnPropertyChangedMask = BABYLON.Prim2DBase.sizeProperty.flagId | BABYLON.Prim2DBase.actualSizeProperty.flagId;
            _this._rows = new Array();
            _this._columns = new Array();
            if (settings.rows) {
                var _loop_1 = function (row) {
                    var r = new RowDefinition();
                    r._parse(row.height, function (v, vp, t) {
                        r.height = v;
                        r.heightPixels = vp;
                        r.heightType = t;
                    });
                    this_1._rows.push(r);
                };
                var this_1 = this;
                for (var _i = 0, _a = settings.rows; _i < _a.length; _i++) {
                    var row = _a[_i];
                    _loop_1(row);
                }
            }
            if (settings.columns) {
                var _loop_2 = function (col) {
                    var r = new ColumnDefinition();
                    r._parse(col.width, function (v, vp, t) {
                        r.width = v;
                        r.widthPixels = vp;
                        r.widthType = t;
                    });
                    this_2._columns.push(r);
                };
                var this_2 = this;
                for (var _b = 0, _c = settings.columns; _b < _c.length; _b++) {
                    var col = _c[_b];
                    _loop_2(col);
                }
            }
            return _this;
        }
        GridPanelLayoutEngine.prototype.updateLayout = function (prim) {
            if (prim._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty)) {
                if (!prim.layoutArea) {
                    return;
                }
                for (var _i = 0, _a = prim.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    if (child._isFlagSet(BABYLON.SmartPropertyPrim.flagNoPartOfLayout)) {
                        continue;
                    }
                    if (child._hasMargin) {
                        child.margin.computeWithAlignment(prim.layoutArea, child.actualSize, child.marginAlignment, child.actualScale, GridPanelLayoutEngine_1.dstOffset, GridPanelLayoutEngine_1.dstArea, true);
                    }
                    else {
                        child.margin.computeArea(child.actualSize, child.actualScale, GridPanelLayoutEngine_1.dstArea);
                    }
                    child.layoutArea = GridPanelLayoutEngine_1.dstArea;
                }
                this._updateGrid(prim);
                var _children = this._children;
                var rl = this._rows.length;
                var cl = this._columns.length;
                var columnWidth = 0;
                var rowHeight = 0;
                var dstArea = GridPanelLayoutEngine_1.dstArea;
                var dstAreaPos = GridPanelLayoutEngine_1.dstAreaPos;
                for (var i = 0; i < _children.length; i++) {
                    var children = _children[i];
                    if (children) {
                        var bottom = this._rowBottoms[i];
                        var rowHeight_1 = this._rowHeights[i];
                        var oBottom = bottom;
                        var oRowHeight = rowHeight_1;
                        for (var j = 0; j < children.length; j++) {
                            var left = this._columnLefts[j];
                            var columnWidth_1 = this._columnWidths[j];
                            var child = children[j];
                            if (child) {
                                var gd = child.layoutData;
                                if (gd.columnSpan > 1) {
                                    for (var k = j + 1; k < gd.columnSpan + j && k < cl; k++) {
                                        columnWidth_1 += this._columnWidths[k];
                                    }
                                }
                                if (gd.rowSpan > 1) {
                                    for (var k = i + 1; k < gd.rowSpan + i && k < rl; k++) {
                                        rowHeight_1 += this._rowHeights[k];
                                        bottom = this._rowBottoms[k];
                                    }
                                }
                                dstArea.width = columnWidth_1;
                                dstArea.height = rowHeight_1;
                                child.layoutArea = dstArea;
                                dstAreaPos.x = left;
                                dstAreaPos.y = bottom;
                                child.layoutAreaPos = dstAreaPos;
                                bottom = oBottom;
                                rowHeight_1 = oRowHeight;
                            }
                        }
                    }
                }
                prim._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
            }
        };
        Object.defineProperty(GridPanelLayoutEngine.prototype, "isChildPositionAllowed", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        GridPanelLayoutEngine.prototype._getMaxChildHeightInRow = function (rowNum) {
            var rows = this._rows;
            var cl = this._columns.length;
            var rl = this._rows.length;
            var children = this._children;
            var row = rows[rowNum];
            var maxHeight = 0;
            if (children && children[rowNum]) {
                for (var i = 0; i < cl; i++) {
                    var child = children[rowNum][i];
                    if (child) {
                        var span = child.layoutData.rowSpan;
                        if (maxHeight < child.layoutArea.height / span) {
                            maxHeight = child.layoutArea.height / span;
                        }
                    }
                }
            }
            return maxHeight;
        };
        GridPanelLayoutEngine.prototype._getMaxChildWidthInColumn = function (colNum) {
            var columns = this._columns;
            var cl = this._columns.length;
            var rl = this._rows.length;
            var children = this._children;
            var column = columns[colNum];
            var maxWidth = 0;
            if (children) {
                for (var i = 0; i < rl; i++) {
                    if (children[i]) {
                        var child = children[i][colNum];
                        if (child) {
                            var span = child.layoutData.columnSpan;
                            if (maxWidth < child.layoutArea.width / span) {
                                maxWidth = child.layoutArea.width / span;
                            }
                        }
                    }
                }
            }
            return maxWidth;
        };
        GridPanelLayoutEngine.prototype._updateGrid = function (prim) {
            var _children = this._children;
            //remove prim.children from _children
            for (var i_1 = 0; i_1 < _children.length; i_1++) {
                var children = _children[i_1];
                if (children) {
                    children.length = 0;
                }
            }
            var childrenThatSpan;
            //add prim.children to _children
            for (var _i = 0, _a = prim.children; _i < _a.length; _i++) {
                var child = _a[_i];
                if (!child.layoutData) {
                    continue;
                }
                var gd = child.layoutData;
                if (!_children[gd.row]) {
                    _children[gd.row] = [];
                }
                if (gd.columnSpan == 1 && gd.rowSpan == 1) {
                    _children[gd.row][gd.column] = child;
                }
                else {
                    if (!childrenThatSpan) {
                        childrenThatSpan = [];
                    }
                    //when children span, we need to add them to _children whereever they span to so that 
                    //_getMaxChildHeightInRow and _getMaxChildWidthInColumn will work correctly.
                    childrenThatSpan.push(child);
                    for (var i_2 = gd.row; i_2 < gd.row + gd.rowSpan; i_2++) {
                        for (var j = gd.column; j < gd.column + gd.columnSpan; j++) {
                            _children[i_2][j] = child;
                        }
                    }
                }
            }
            var rows = this._rows;
            var columns = this._columns;
            var rl = this._rows.length;
            var cl = this._columns.length;
            //get fixed and auto row heights first
            var starIndexes = [];
            var totalStars = 0;
            var rowHeights = 0;
            var columnWidths = 0;
            for (var i_3 = 0; i_3 < rl; i_3++) {
                var row = this._rows[i_3];
                if (row.heightType == GridDimensionDefinition.Auto) {
                    this._rowHeights[i_3] = this._getMaxChildHeightInRow(i_3);
                    rowHeights += this._rowHeights[i_3];
                }
                else if (row.heightType == GridDimensionDefinition.Pixels) {
                    var maxChildHeight = this._getMaxChildHeightInRow(i_3);
                    this._rowHeights[i_3] = Math.max(row.heightPixels, maxChildHeight);
                    rowHeights += this._rowHeights[i_3];
                }
                else if (row.heightType == GridDimensionDefinition.Stars) {
                    starIndexes.push(i_3);
                    totalStars += row.height;
                }
            }
            //star row heights
            if (starIndexes.length > 0) {
                var remainingHeight = prim.contentArea.height - rowHeights;
                for (var i_4 = 0; i_4 < starIndexes.length; i_4++) {
                    var rowIndex = starIndexes[i_4];
                    var starHeight = (this._rows[rowIndex].height / totalStars) * remainingHeight;
                    var maxChildHeight = this._getMaxChildHeightInRow(i_4);
                    this._rowHeights[rowIndex] = Math.max(starHeight, maxChildHeight);
                }
            }
            //get fixed and auto column widths
            starIndexes.length = 0;
            totalStars = 0;
            for (var i_5 = 0; i_5 < cl; i_5++) {
                var column = this._columns[i_5];
                if (column.widthType == GridDimensionDefinition.Auto) {
                    this._columnWidths[i_5] = this._getMaxChildWidthInColumn(i_5);
                    columnWidths += this._columnWidths[i_5];
                }
                else if (column.widthType == GridDimensionDefinition.Pixels) {
                    var maxChildWidth = this._getMaxChildWidthInColumn(i_5);
                    this._columnWidths[i_5] = Math.max(column.widthPixels, maxChildWidth);
                    columnWidths += this._columnWidths[i_5];
                }
                else if (column.widthType == GridDimensionDefinition.Stars) {
                    starIndexes.push(i_5);
                    totalStars += column.width;
                }
            }
            //star column widths
            if (starIndexes.length > 0) {
                var remainingWidth = prim.contentArea.width - columnWidths;
                for (var i_6 = 0; i_6 < starIndexes.length; i_6++) {
                    var columnIndex = starIndexes[i_6];
                    var starWidth = (this._columns[columnIndex].width / totalStars) * remainingWidth;
                    var maxChildWidth = this._getMaxChildWidthInColumn(i_6);
                    this._columnWidths[columnIndex] = Math.max(starWidth, maxChildWidth);
                }
            }
            var y = 0;
            this._rowBottoms[rl - 1] = y;
            for (var i_7 = rl - 2; i_7 >= 0; i_7--) {
                y += this._rowHeights[i_7 + 1];
                this._rowBottoms[i_7] = y;
            }
            var x = 0;
            this._columnLefts[0] = x;
            for (var i_8 = 1; i_8 < cl; i_8++) {
                x += this._columnWidths[i_8 - 1];
                this._columnLefts[i_8] = x;
            }
            //remove duplicate references to children that span
            if (childrenThatSpan) {
                for (var i = 0; i < childrenThatSpan.length; i++) {
                    var child = childrenThatSpan[i];
                    var gd = child.layoutData;
                    for (var i_9 = gd.row; i_9 < gd.row + gd.rowSpan; i_9++) {
                        for (var j = gd.column; j < gd.column + gd.columnSpan; j++) {
                            if (i_9 == gd.row && j == gd.column) {
                                continue;
                            }
                            if (_children[i_9][j] == child) {
                                _children[i_9][j] = null;
                            }
                        }
                    }
                }
            }
        };
        return GridPanelLayoutEngine;
    }(LayoutEngineBase));
    GridPanelLayoutEngine.dstOffset = BABYLON.Vector4.Zero();
    GridPanelLayoutEngine.dstArea = BABYLON.Size.Zero();
    GridPanelLayoutEngine.dstAreaPos = BABYLON.Vector2.Zero();
    GridPanelLayoutEngine = GridPanelLayoutEngine_1 = __decorate([
        BABYLON.className("GridPanelLayoutEngine", "BABYLON")
    ], GridPanelLayoutEngine);
    BABYLON.GridPanelLayoutEngine = GridPanelLayoutEngine;
    var CanvasLayoutEngine_1, StackPanelLayoutEngine_1, GridPanelLayoutEngine_1;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.canvas2dLayoutEngine.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    /**
     * Base class implementing the ILocable interface.
     * The particularity of this class is to call the protected onLock() method when the instance is about to be locked for good.
     */
    var LockableBase = (function () {
        function LockableBase() {
        }
        LockableBase.prototype.isLocked = function () {
            return this._isLocked;
        };
        LockableBase.prototype.lock = function () {
            if (this._isLocked) {
                return true;
            }
            this.onLock();
            this._isLocked = true;
            return false;
        };
        /**
         * Protected handler that will be called when the instance is about to be locked.
         */
        LockableBase.prototype.onLock = function () {
        };
        return LockableBase;
    }());
    BABYLON.LockableBase = LockableBase;
    var SolidColorBrush2D = (function (_super) {
        __extends(SolidColorBrush2D, _super);
        function SolidColorBrush2D(color, lock) {
            if (lock === void 0) { lock = false; }
            var _this = _super.call(this) || this;
            _this._color = color;
            if (lock) {
                {
                    _this.lock();
                }
            }
            return _this;
        }
        /**
         * Return true if the brush is transparent, false if it's totally opaque
         */
        SolidColorBrush2D.prototype.isTransparent = function () {
            return this._color && this._color.a < 1.0;
        };
        Object.defineProperty(SolidColorBrush2D.prototype, "color", {
            /**
             * The color used by this instance to render
             * @returns the color object. Note that it's not a clone of the actual object stored in the instance so you MUST NOT modify it, otherwise unexpected behavior might occurs.
             */
            get: function () {
                return this._color;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._color = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Return a unique identifier of the instance, which is simply the hexadecimal representation (CSS Style) of the solid color.
         */
        SolidColorBrush2D.prototype.toString = function () {
            return this._color.toHexString();
        };
        return SolidColorBrush2D;
    }(LockableBase));
    SolidColorBrush2D = __decorate([
        BABYLON.className("SolidColorBrush2D", "BABYLON")
    ], SolidColorBrush2D);
    BABYLON.SolidColorBrush2D = SolidColorBrush2D;
    var GradientColorBrush2D = (function (_super) {
        __extends(GradientColorBrush2D, _super);
        function GradientColorBrush2D(color1, color2, translation, rotation, scale, lock) {
            if (translation === void 0) { translation = BABYLON.Vector2.Zero(); }
            if (rotation === void 0) { rotation = 0; }
            if (scale === void 0) { scale = 1; }
            if (lock === void 0) { lock = false; }
            var _this = _super.call(this) || this;
            _this._color1 = color1;
            _this._color2 = color2;
            _this._translation = translation;
            _this._rotation = rotation;
            _this._scale = scale;
            if (lock) {
                _this.lock();
            }
            return _this;
        }
        /**
         * Return true if the brush is transparent, false if it's totally opaque
         */
        GradientColorBrush2D.prototype.isTransparent = function () {
            return (this._color1 && this._color1.a < 1.0) || (this._color2 && this._color2.a < 1.0);
        };
        Object.defineProperty(GradientColorBrush2D.prototype, "color1", {
            /**
             * First color, the blend will start from this color
             */
            get: function () {
                return this._color1;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._color1 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "color2", {
            /**
             * Second color, the blend will end to this color
             */
            get: function () {
                return this._color2;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._color2 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "translation", {
            /**
             * Translation vector to apply on the blend
             * Default is [0;0]
             */
            get: function () {
                return this._translation;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._translation = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "rotation", {
            /**
             * Rotation in radian to apply to the brush
             * Default direction of the brush is vertical, you can change this using this property.
             * Default is 0.
             */
            get: function () {
                return this._rotation;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._rotation = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "scale", {
            /**
             * Scale factor to apply to the gradient.
             * Default is 1: no scale.
             */
            get: function () {
                return this._scale;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._scale = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Return a string describing the brush
         */
        GradientColorBrush2D.prototype.toString = function () {
            return "C1:" + this._color1 + ";C2:" + this._color2 + ";T:" + this._translation.toString() + ";R:" + this._rotation + ";S:" + this._scale + ";";
        };
        /**
         * Build a unique key string for the given parameters
         */
        GradientColorBrush2D.BuildKey = function (color1, color2, translation, rotation, scale) {
            return "C1:" + color1 + ";C2:" + color2 + ";T:" + translation.toString() + ";R:" + rotation + ";S:" + scale + ";";
        };
        return GradientColorBrush2D;
    }(LockableBase));
    GradientColorBrush2D = __decorate([
        BABYLON.className("GradientColorBrush2D", "BABYLON")
    ], GradientColorBrush2D);
    BABYLON.GradientColorBrush2D = GradientColorBrush2D;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.brushes2d.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Prim2DClassInfo = (function () {
        function Prim2DClassInfo() {
        }
        return Prim2DClassInfo;
    }());
    BABYLON.Prim2DClassInfo = Prim2DClassInfo;
    var Prim2DPropInfo = (function () {
        function Prim2DPropInfo() {
        }
        return Prim2DPropInfo;
    }());
    Prim2DPropInfo.PROPKIND_MODEL = 1;
    Prim2DPropInfo.PROPKIND_INSTANCE = 2;
    Prim2DPropInfo.PROPKIND_DYNAMIC = 3;
    BABYLON.Prim2DPropInfo = Prim2DPropInfo;
    var ClassTreeInfo = (function () {
        function ClassTreeInfo(baseClass, type, classContentFactory) {
            this._baseClass = baseClass;
            this._type = type;
            this._subClasses = new Array();
            this._levelContent = new BABYLON.StringDictionary();
            this._classContentFactory = classContentFactory;
        }
        Object.defineProperty(ClassTreeInfo.prototype, "classContent", {
            get: function () {
                if (!this._classContent) {
                    this._classContent = this._classContentFactory(this._baseClass ? this._baseClass.classContent : null);
                }
                return this._classContent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassTreeInfo.prototype, "type", {
            get: function () {
                return this._type;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassTreeInfo.prototype, "levelContent", {
            get: function () {
                return this._levelContent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassTreeInfo.prototype, "fullContent", {
            get: function () {
                if (!this._fullContent) {
                    var dic_1 = new BABYLON.StringDictionary();
                    var curLevel = this;
                    while (curLevel) {
                        curLevel.levelContent.forEach(function (k, v) { return dic_1.add(k, v); });
                        curLevel = curLevel._baseClass;
                    }
                    this._fullContent = dic_1;
                }
                return this._fullContent;
            },
            enumerable: true,
            configurable: true
        });
        ClassTreeInfo.prototype.getLevelOf = function (type) {
            // Are we already there?
            if (type === this._type) {
                return this;
            }
            var baseProto = Object.getPrototypeOf(type);
            var curProtoContent = this.getOrAddType(Object.getPrototypeOf(baseProto), baseProto);
            if (!curProtoContent) {
                this.getLevelOf(baseProto);
            }
            return this.getOrAddType(baseProto, type);
        };
        ClassTreeInfo.prototype.getOrAddType = function (baseType, type) {
            // Are we at the level corresponding to the baseType?
            // If so, get or add the level we're looking for
            if (baseType === this._type) {
                for (var _i = 0, _a = this._subClasses; _i < _a.length; _i++) {
                    var subType = _a[_i];
                    if (subType.type === type) {
                        return subType.node;
                    }
                }
                var node = new ClassTreeInfo(this, type, this._classContentFactory);
                var info = { type: type, node: node };
                this._subClasses.push(info);
                return info.node;
            }
            // Recurse down to keep looking for the node corresponding to the baseTypeName
            for (var _b = 0, _c = this._subClasses; _b < _c.length; _b++) {
                var subType = _c[_b];
                var info = subType.node.getOrAddType(baseType, type);
                if (info) {
                    return info;
                }
            }
            return null;
        };
        ClassTreeInfo.get = function (type) {
            var dic = type["__classTreeInfo"];
            if (!dic) {
                return null;
            }
            return dic.getLevelOf(type);
        };
        ClassTreeInfo.getOrRegister = function (type, classContentFactory) {
            var dic = type["__classTreeInfo"];
            if (!dic) {
                dic = new ClassTreeInfo(null, type, classContentFactory);
                type["__classTreeInfo"] = dic;
            }
            return dic;
        };
        return ClassTreeInfo;
    }());
    BABYLON.ClassTreeInfo = ClassTreeInfo;
    var DataBinding = DataBinding_1 = (function () {
        function DataBinding() {
            this._converter = null;
            this._mode = DataBinding_1.MODE_DEFAULT;
            this._uiElementId = null;
            this._dataSource = null;
            this._currentDataSource = null;
            this._propertyPathName = null;
            this._stringFormat = null;
            this._updateSourceTrigger = DataBinding_1.UPDATESOURCETRIGGER_PROPERTYCHANGED;
            this._boundTo = null;
            this._owner = null;
            this._updateCounter = 0;
        }
        Object.defineProperty(DataBinding.prototype, "converter", {
            /**
             * Provide a callback that will convert the value obtained by the Data Binding to the type of the SmartProperty it's bound to.
             * If no value are set, then it's assumed that the sourceValue is of the same type as the SmartProperty's one.
             * If the SmartProperty type is a basic data type (string, boolean or number) and no converter is specified but the sourceValue is of a different type, the conversion will be implicitly made, if possible.
             * @param sourceValue the source object retrieve by the Data Binding mechanism
             * @returns the object of a compatible type with the SmartProperty it's bound to
             */
            get: function () {
                return this._converter;
            },
            set: function (value) {
                if (this._converter === value) {
                    return;
                }
                this._converter = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "mode", {
            /**
             * Set the mode to use for the data flow in the binding. Set one of the MODE_xxx static member of this class. If not specified then MODE_DEFAULT will be used
             */
            get: function () {
                if (this._mode === DataBinding_1.MODE_DEFAULT) {
                    return this._boundTo.bindingMode;
                }
                return this._mode;
            },
            set: function (value) {
                if (this._mode === value) {
                    return;
                }
                this._mode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "uiElementId", {
            /**
             * You can override the Data Source object with this member which is the Id of a uiElement existing in the UI Logical tree.
             * If not set and source no set too, then the dataSource property will be used.
             */
            get: function () {
                return this._uiElementId;
            },
            set: function (value) {
                if (this._uiElementId === value) {
                    return;
                }
                this._uiElementId = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "dataSource", {
            /**
             * You can override the Data Source object with this member which is the source object to use directly.
             * If not set and uiElement no set too, then the dataSource property of the SmartPropertyBase object will be used.
             */
            get: function () {
                return this._dataSource;
            },
            set: function (value) {
                if (this._dataSource === value) {
                    return;
                }
                this._dataSource = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "propertyPathName", {
            /**
             * The path & name of the property to get from the source object.
             * Once the Source object is evaluated (it's either the one got from uiElementId, source or dataSource) you can specify which property of this object is the value to bind to the smartProperty.
             * If nothing is set then the source object will be used.
             * You can specify an indirect property using the format "firstProperty.indirectProperty" like "address.postalCode" if the source is a Customer object which contains an address property and the Address class contains a postalCode property.
             * If the property is an Array and you want to address a particular element then use the 'arrayProperty[index]' notation. For example "phoneNumbers[0]" to get the first element of the phoneNumber property which is an array.
             */
            get: function () {
                return this._propertyPathName;
            },
            set: function (value) {
                if (this._propertyPathName === value) {
                    return;
                }
                if (this._owner) {
                }
                this._propertyPathName = value;
                if (this._owner) {
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "stringFormat", {
            /**
             * If the Smart Property is of the string type, you can use the string interpolation notation to provide how the sourceValue will be formatted, reference to the source value must be made via the token: ${value}. For instance `Customer Name: ${value}`
             */
            get: function () {
                return this._stringFormat;
            },
            set: function (value) {
                if (this._stringFormat === value) {
                    return;
                }
                this._stringFormat = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "updateSourceTrigger", {
            /**
             * Specify how the source should be updated, use one of the UPDATESOURCETRIGGER_xxx member of this class, if not specified then UPDATESOURCETRIGGER_DEFAULT will be used.
             */
            get: function () {
                return this._updateSourceTrigger;
            },
            set: function (value) {
                if (this._updateSourceTrigger === value) {
                    return;
                }
                this._updateSourceTrigger = value;
            },
            enumerable: true,
            configurable: true
        });
        DataBinding.prototype.canUpdateTarget = function (resetUpdateCounter) {
            if (resetUpdateCounter) {
                this._updateCounter = 0;
            }
            var mode = this.mode;
            if (mode === DataBinding_1.MODE_ONETIME) {
                return this._updateCounter === 0;
            }
            if (mode === DataBinding_1.MODE_ONEWAYTOSOURCE) {
                return false;
            }
            return true;
        };
        DataBinding.prototype.updateTarget = function () {
            var value = this._getActualDataSource();
            var properties = this.propertyPathName.split(".");
            for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
                var propertyName = properties_1[_i];
                value = value[propertyName];
            }
            this._storeBoundValue(this._owner, value);
        };
        DataBinding.prototype._storeBoundValue = function (watcher, value) {
            if ((++this._updateCounter > 1) && (this.mode === DataBinding_1.MODE_ONETIME)) {
                return;
            }
            var newValue = value;
            if (this._converter) {
                newValue = this._converter(value);
            }
            if (this._stringFormat) {
                newValue = this._stringFormat(newValue);
            }
            watcher[this._boundTo.name] = newValue;
        };
        DataBinding.prototype._getActualDataSource = function () {
            if (this.dataSource) {
                return this.dataSource;
            }
            if (this.uiElementId) {
                // TODO Find UIElement
                return null;
            }
            return this._owner.dataSource;
        };
        DataBinding.prototype._registerDataSource = function (updateTarget) {
            var ds = this._getActualDataSource();
            if (ds === this._currentDataSource) {
                return;
            }
            if (this._currentDataSource) {
                BindingHelper.unregisterDataSource(this._currentDataSource, this, 0);
            }
            if (ds) {
                BindingHelper.registerDataSource(ds, this);
                if (updateTarget && this.canUpdateTarget(true)) {
                    this.updateTarget();
                }
            }
            this._currentDataSource = ds;
        };
        DataBinding.prototype._unregisterDataSource = function () {
            var ds = this._getActualDataSource();
            if (ds) {
                BindingHelper.unregisterDataSource(ds, this, 0);
            }
        };
        return DataBinding;
    }());
    /**
     * Use the mode specified in the SmartProperty declaration
     */
    DataBinding.MODE_DEFAULT = 1;
    /**
     * Update the binding target only once when the Smart Property's value is first accessed
     */
    DataBinding.MODE_ONETIME = 2;
    /**
     * Update the smart property when the source changes.
     * The source won't be updated if the smart property value is set.
     */
    DataBinding.MODE_ONEWAY = 3;
    /**
     * Only update the source when the target's data is changing.
     */
    DataBinding.MODE_ONEWAYTOSOURCE = 4;
    /**
     * Update the bind target when the source changes and update the source when the Smart Property value is set.
     */
    DataBinding.MODE_TWOWAY = 5;
    /**
     * Use the Update Source Trigger defined in the SmartProperty declaration
     */
    DataBinding.UPDATESOURCETRIGGER_DEFAULT = 1;
    /**
     * Update the source as soon as the Smart Property has a value change
     */
    DataBinding.UPDATESOURCETRIGGER_PROPERTYCHANGED = 2;
    /**
     * Update the source when the binding target loses focus
     */
    DataBinding.UPDATESOURCETRIGGER_LOSTFOCUS = 3;
    /**
     * Update the source will be made by explicitly calling the UpdateFromDataSource method
     */
    DataBinding.UPDATESOURCETRIGGER_EXPLICIT = 4;
    DataBinding = DataBinding_1 = __decorate([
        BABYLON.className("DataBinding", "BABYLON")
    ], DataBinding);
    BABYLON.DataBinding = DataBinding;
    var SmartPropertyBase = SmartPropertyBase_1 = (function (_super) {
        __extends(SmartPropertyBase, _super);
        function SmartPropertyBase() {
            var _this = _super.call(this) || this;
            _this._dataSource = null;
            _this._dataSourceObserver = null;
            _this._instanceDirtyFlags = 0;
            _this._isDisposed = false;
            _this._bindings = null;
            _this._hasBinding = 0;
            _this._bindingSourceChanged = 0;
            _this._disposeObservable = null;
            return _this;
        }
        Object.defineProperty(SmartPropertyBase.prototype, "disposeObservable", {
            get: function () {
                if (!this._disposeObservable) {
                    this._disposeObservable = new BABYLON.Observable();
                }
                return this._disposeObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SmartPropertyBase.prototype, "isDisposed", {
            /**
             * Check if the object is disposed or not.
             * @returns true if the object is dispose, false otherwise.
             */
            get: function () {
                return this._isDisposed;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        SmartPropertyBase.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            if (this._disposeObservable && this._disposeObservable.hasObservers()) {
                this._disposeObservable.notifyObservers(this);
            }
            this._isDisposed = true;
            return true;
        };
        /**
         * Check if a given set of properties are dirty or not.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return true if at least one property is dirty, false if none of them are.
         */
        SmartPropertyBase.prototype.checkPropertiesDirty = function (flags) {
            return (this._instanceDirtyFlags & flags) !== 0;
        };
        /**
         * Clear a given set of properties.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return the new set of property still marked as dirty
         */
        SmartPropertyBase.prototype.clearPropertiesDirty = function (flags) {
            this._instanceDirtyFlags &= ~flags;
            return this._instanceDirtyFlags;
        };
        SmartPropertyBase.prototype._resetPropertiesDirty = function () {
            this._instanceDirtyFlags = 0;
        };
        /**
         * Add an externally attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        SmartPropertyBase.prototype.addExternalData = function (key, data) {
            if (!this._externalData) {
                this._externalData = new BABYLON.StringDictionary();
            }
            return this._externalData.add(key, data);
        };
        /**
         * Get an externally attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        SmartPropertyBase.prototype.getExternalData = function (key) {
            if (!this._externalData) {
                return null;
            }
            return this._externalData.get(key);
        };
        /**
         * Get an externally attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        SmartPropertyBase.prototype.getOrAddExternalDataWithFactory = function (key, factory) {
            if (!this._externalData) {
                this._externalData = new BABYLON.StringDictionary();
            }
            return this._externalData.getOrAddWithFactory(key, factory);
        };
        /**
         * Remove an externally attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        SmartPropertyBase.prototype.removeExternalData = function (key) {
            if (!this._externalData) {
                return false;
            }
            return this._externalData.remove(key);
        };
        SmartPropertyBase._hookProperty = function (propId, piStore, kind, settings) {
            return function (target, propName, descriptor) {
                if (!settings) {
                    settings = {};
                }
                var propInfo = SmartPropertyBase_1._createPropInfo(target, propName, propId, kind, settings);
                if (piStore) {
                    piStore(propInfo);
                }
                var getter = descriptor.get, setter = descriptor.set;
                var typeLevelCompare = (settings.typeLevelCompare !== undefined) ? settings.typeLevelCompare : false;
                // Overload the property setter implementation to add our own logic
                descriptor.set = function (val) {
                    if (!setter) {
                        throw Error("Property '" + propInfo.name + "' of type '" + BABYLON.Tools.getFullClassName(this) + "' has no setter defined but was invoked as if it had one.");
                    }
                    // check for disposed first, do nothing
                    if (this.isDisposed) {
                        return;
                    }
                    var curVal = getter.call(this);
                    if (SmartPropertyBase_1._checkUnchanged(curVal, val)) {
                        return;
                    }
                    // Cast the object we're working one
                    var prim = this;
                    // Change the value
                    setter.call(this, val);
                    // Notify change, dirty flags update
                    prim._handlePropChanged(curVal, val, propName, propInfo, typeLevelCompare);
                };
            };
        };
        SmartPropertyBase._createPropInfo = function (target, propName, propId, kind, settings) {
            var dic = ClassTreeInfo.getOrRegister(target, function () { return new Prim2DClassInfo(); });
            var node = dic.getLevelOf(target);
            var propInfo = node.levelContent.get(propId.toString());
            if (propInfo) {
                throw new Error("The ID " + propId + " is already taken by another property declaration named: " + propInfo.name);
            }
            // Create, setup and add the PropInfo object to our prop dictionary
            propInfo = new Prim2DPropInfo();
            propInfo.id = propId;
            propInfo.flagId = Math.pow(2, propId);
            propInfo.kind = kind;
            propInfo.name = propName;
            propInfo.bindingMode = (settings.bindingMode !== undefined) ? settings.bindingMode : DataBinding.MODE_TWOWAY;
            propInfo.bindingUpdateSourceTrigger = (settings.bindingUpdateSourceTrigger !== undefined) ? settings.bindingUpdateSourceTrigger : DataBinding.UPDATESOURCETRIGGER_PROPERTYCHANGED;
            propInfo.dirtyBoundingInfo = (settings.dirtyBoundingInfo !== undefined) ? settings.dirtyBoundingInfo : false;
            propInfo.dirtyParentBoundingInfo = (settings.dirtyParentBoundingBox !== undefined) ? settings.dirtyParentBoundingBox : false;
            propInfo.typeLevelCompare = (settings.typeLevelCompare !== undefined) ? settings.typeLevelCompare : false;
            node.levelContent.add(propName, propInfo);
            return propInfo;
        };
        Object.defineProperty(SmartPropertyBase.prototype, "propDic", {
            /**
             * Access the dictionary of properties metadata. Only properties decorated with XXXXLevelProperty are concerned
             * @returns the dictionary, the key is the property name as declared in Javascript, the value is the metadata object
             */
            get: function () {
                if (!this._propInfo) {
                    var cti = ClassTreeInfo.get(Object.getPrototypeOf(this));
                    if (!cti) {
                        throw new Error("Can't access the propDic member in class definition, is this class SmartPropertyPrim based?");
                    }
                    this._propInfo = cti.fullContent;
                }
                return this._propInfo;
            },
            enumerable: true,
            configurable: true
        });
        SmartPropertyBase._checkUnchanged = function (curValue, newValue) {
            // Nothing to nothing: nothing to do!
            if ((curValue === null && newValue === null) || (curValue === undefined && newValue === undefined)) {
                return true;
            }
            // Check value unchanged
            if ((curValue != null) && (newValue != null)) {
                if (typeof (curValue.equals) == "function") {
                    if (curValue.equals(newValue)) {
                        return true;
                    }
                }
                else {
                    if (curValue === newValue) {
                        return true;
                    }
                }
            }
            return false;
        };
        SmartPropertyBase.prototype._handlePropChanged = function (curValue, newValue, propName, propInfo, typeLevelCompare) {
            // Trigger property changed
            var info = SmartPropertyBase_1.propChangeGuarding ? new BABYLON.PropertyChangedInfo() : SmartPropertyPrim.propChangedInfo;
            info.oldValue = curValue;
            info.newValue = newValue;
            info.propertyName = propName;
            var propMask = propInfo ? propInfo.flagId : -1;
            try {
                SmartPropertyBase_1.propChangeGuarding = true;
                this.propertyChanged.notifyObservers(info, propMask);
            }
            finally {
                SmartPropertyBase_1.propChangeGuarding = false;
            }
        };
        SmartPropertyBase.prototype._triggerPropertyChanged = function (propInfo, newValue) {
            if (this.isDisposed) {
                return;
            }
            if (!propInfo) {
                return;
            }
            this._handlePropChanged(undefined, newValue, propInfo.name, propInfo, propInfo.typeLevelCompare);
        };
        Object.defineProperty(SmartPropertyBase.prototype, "dataSource", {
            /**
             * Set the object from which Smart Properties using Binding will take/update their data from/to.
             * When the object is part of a graph (with parent/children relationship) if the dataSource of a given instance is not specified, then the parent's one is used.
             */
            get: function () {
                // Don't access to _dataSource directly but via a call to the _getDataSource method which can be overloaded in inherited classes
                return this._getDataSource();
            },
            set: function (value) {
                if (this._dataSource === value) {
                    return;
                }
                var oldValue = this._dataSource;
                this._dataSource = value;
                if (this._bindings && value != null) {
                    // Register the bindings
                    for (var _i = 0, _a = this._bindings; _i < _a.length; _i++) {
                        var binding = _a[_i];
                        if (binding != null) {
                            binding._registerDataSource(true);
                        }
                    }
                }
                this.onPropertyChanged("dataSource", oldValue, value);
            },
            enumerable: true,
            configurable: true
        });
        // Inheriting classes can overload this method to provides additional logic for dataSource access
        SmartPropertyBase.prototype._getDataSource = function () {
            return this._dataSource;
        };
        SmartPropertyBase.prototype.createSimpleDataBinding = function (propInfo, propertyPathName, mode) {
            if (mode === void 0) { mode = DataBinding.MODE_DEFAULT; }
            var binding = new DataBinding();
            binding.propertyPathName = propertyPathName;
            binding.mode = mode;
            return this.createDataBinding(propInfo, binding);
        };
        SmartPropertyBase.prototype.createDataBinding = function (propInfo, binding) {
            if (!this._bindings) {
                this._bindings = new Array();
            }
            if (!binding || binding._owner != null) {
                throw Error("A valid/unused Binding must be passed.");
            }
            // Unregister a potentially existing binding for this property
            this.removeDataBinding(propInfo);
            // register the binding
            binding._owner = this;
            binding._boundTo = propInfo;
            this._bindings[propInfo.id] = binding;
            this._hasBinding |= propInfo.flagId;
            binding._registerDataSource(true);
            return binding;
        };
        SmartPropertyBase.prototype.removeDataBinding = function (propInfo) {
            if ((this._hasBinding & propInfo.flagId) === 0) {
                return false;
            }
            var curBinding = this._bindings[propInfo.id];
            curBinding._unregisterDataSource();
            this._bindings[propInfo.id] = null;
            this._hasBinding &= ~propInfo.flagId;
            return true;
        };
        SmartPropertyBase.prototype.updateFromDataSource = function () {
            for (var _i = 0, _a = this._bindings; _i < _a.length; _i++) {
                var binding = _a[_i];
                if (binding) {
                }
            }
        };
        return SmartPropertyBase;
    }(BABYLON.PropertyChangedBase));
    SmartPropertyBase.propChangedInfo = new BABYLON.PropertyChangedInfo();
    SmartPropertyBase.propChangeGuarding = false;
    SmartPropertyBase = SmartPropertyBase_1 = __decorate([
        BABYLON.className("SmartPropertyBase", "BABYLON")
    ], SmartPropertyBase);
    BABYLON.SmartPropertyBase = SmartPropertyBase;
    var BindingInfo = (function () {
        function BindingInfo(binding, level, isLast) {
            this.binding = binding;
            this.level = level;
            this.isLast = isLast;
        }
        return BindingInfo;
    }());
    var MonitoredObjectData = (function () {
        function MonitoredObjectData(monitoredObject) {
            var _this = this;
            this.monitoredObject = monitoredObject;
            this.monitoredIntermediateProperties = new BABYLON.StringDictionary();
            this.observer = this.monitoredObject.propertyChanged.add(function (e, s) { _this.propertyChangedHandler(e.propertyName, e.oldValue, e.newValue); });
            this.boundProperties = new BABYLON.StringDictionary();
            this.monitoredIntermediateMask = 0;
            this.boundPropertiesMask = 0;
        }
        MonitoredObjectData.prototype.propertyChangedHandler = function (propName, oldValue, newValue) {
            var propId = BindingHelper._getPropertyID(this.monitoredObject, propName);
            var propIdStr = propId.toString();
            // Loop through all the registered bindings for this property that had a value change
            if ((this.boundPropertiesMask & propId) !== 0) {
                var bindingInfos = this.boundProperties.get(propIdStr);
                for (var _i = 0, bindingInfos_1 = bindingInfos; _i < bindingInfos_1.length; _i++) {
                    var bi = bindingInfos_1[_i];
                    if (!bi.isLast) {
                        BindingHelper.unregisterDataSource(this.monitoredObject, bi.binding, bi.level);
                        BindingHelper.registerDataSource(bi.binding._currentDataSource, bi.binding);
                    }
                    if (bi.binding.canUpdateTarget(false)) {
                        bi.binding.updateTarget();
                    }
                }
            }
        };
        return MonitoredObjectData;
    }());
    var BindingHelper = (function () {
        function BindingHelper() {
        }
        BindingHelper.registerDataSource = function (dataSource, binding) {
            var properties = binding.propertyPathName.split(".");
            var ownerMod = null;
            var ownerInterPropId = 0;
            var propertyOwner = dataSource;
            var _loop_1 = function (i) {
                var propName = properties[i];
                var propId = BindingHelper._getPropertyID(propertyOwner, propName);
                var propIdStr = propId.toString();
                var mod = void 0;
                if (ownerMod) {
                    var o_1 = ownerMod;
                    var po_1 = propertyOwner;
                    var oii_1 = ownerInterPropId;
                    mod = ownerMod.monitoredIntermediateProperties.getOrAddWithFactory(oii_1.toString(), function (k) {
                        o_1.monitoredIntermediateMask |= oii_1;
                        return BindingHelper._getMonitoredObjectData(po_1);
                    });
                }
                else {
                    mod = BindingHelper._getMonitoredObjectData(propertyOwner);
                }
                var m = mod;
                var bindingInfos = mod.boundProperties.getOrAddWithFactory(propIdStr, function (k) {
                    m.boundPropertiesMask |= propId;
                    return new Array();
                });
                var bi = BABYLON.Tools.first(bindingInfos, function (cbi) { return cbi.binding === binding; });
                if (!bi) {
                    bindingInfos.push(new BindingInfo(binding, i, (i + 1) === properties.length));
                }
                ownerMod = mod;
                ownerInterPropId = propId;
                propertyOwner = propertyOwner[propName];
            };
            for (var i = 0; i < properties.length; i++) {
                _loop_1(i);
            }
        };
        BindingHelper.unregisterDataSource = function (dataSource, binding, level) {
            var properties = binding.propertyPathName.split(".");
            var propertyOwner = dataSource;
            var mod = BindingHelper._getMonitoredObjectData(propertyOwner);
            for (var i = 0; i < properties.length; i++) {
                var propName = properties[i];
                var propId = BindingHelper._getPropertyID(propertyOwner, propName);
                var propIdStr = propId.toString();
                if (i >= level) {
                    mod = BindingHelper._unregisterBinding(mod, propId, binding);
                }
                else {
                    mod = mod.monitoredIntermediateProperties.get(propIdStr);
                }
                propertyOwner = propertyOwner[propName];
            }
        };
        BindingHelper._unregisterBinding = function (mod, propertyID, binding) {
            var propertyIDStr = propertyID.toString();
            var res = null;
            // Check if the property is registered as an intermediate and remove it
            if ((mod.monitoredIntermediateMask & propertyID) !== 0) {
                res = mod.monitoredIntermediateProperties.get(propertyIDStr);
                mod.monitoredIntermediateProperties.remove(propertyIDStr);
                // Update the mask
                mod.monitoredIntermediateMask &= ~propertyID;
            }
            // Check if the property is registered as a final property and remove it
            if ((mod.boundPropertiesMask & propertyID) !== 0) {
                var bindingInfos = mod.boundProperties.get(propertyIDStr);
                // Find the binding and remove it
                var bi = BABYLON.Tools.first(bindingInfos, function (cbi) { return cbi.binding === binding; });
                if (bi) {
                    var bii = bindingInfos.indexOf(bi);
                    bindingInfos.splice(bii, 1);
                }
                // If the array is empty, update the mask
                if (bindingInfos.length === 0) {
                    mod.boundPropertiesMask &= ~propertyID;
                }
            }
            // Check if the MOD is empty and unregister the observer and remove it from the list of MODs
            if (mod.boundPropertiesMask === 0 && mod.monitoredIntermediateMask === 0) {
                // Unregister the observer on Property Change
                mod.monitoredObject.propertyChanged.remove(mod.observer);
                // Remove the MOD from the dic
                var objectId = BindingHelper._getObjectId(mod.monitoredObject);
                BindingHelper._monitoredObjects.remove(objectId);
            }
            return res;
        };
        BindingHelper._getMonitoredObjectData = function (object) {
            var objectId = BindingHelper._getObjectId(object);
            var mod = BindingHelper._monitoredObjects.getOrAddWithFactory(objectId, function (k) { return new MonitoredObjectData(object); });
            return mod;
        };
        BindingHelper._getObjectId = function (obj) {
            var id = obj["__bindingHelperObjectId__"];
            if (id == null) {
                id = BABYLON.Tools.RandomId();
                obj["__bindingHelperObjectId__"] = id;
                return id;
            }
            return id;
        };
        BindingHelper._getObjectTypePropertyIDs = function (obj) {
            var fullName = BABYLON.Tools.getFullClassName(obj);
            if (!fullName) {
                throw Error("Types involved in Data Binding must be decorated with the @className decorator");
            }
            var d = BindingHelper._propertiesID.getOrAddWithFactory(fullName, function () { return new BABYLON.StringDictionary(); });
            return d;
        };
        BindingHelper._getPropertyID = function (object, propName) {
            var otd = BindingHelper._getObjectTypePropertyIDs(object);
            // Make sure we have a WatchedPropertyData for this property of this object type. This will contains the flagIg of the watched property.
            // We use this flagId to flag for each watched instance which properties are watched, as final or intermediate and which directions are used
            var propData = otd.getOrAddWithFactory(propName, function (k) { return 1 << otd.count; });
            return propData;
        };
        return BindingHelper;
    }());
    BindingHelper._propertiesID = new BABYLON.StringDictionary();
    BindingHelper._monitoredObjects = new BABYLON.StringDictionary();
    var SmartPropertyPrim = SmartPropertyPrim_1 = (function (_super) {
        __extends(SmartPropertyPrim, _super);
        function SmartPropertyPrim() {
            var _this = _super.call(this) || this;
            _this._flags = 0;
            _this._uid = null;
            _this._modelKey = null;
            _this._levelBoundingInfo = new BABYLON.BoundingInfo2D();
            _this._boundingInfo = new BABYLON.BoundingInfo2D();
            _this.animations = new Array();
            return _this;
        }
        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        SmartPropertyPrim.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            _super.prototype.dispose.call(this);
            // Don't set to null, it may upset somebody...
            this.animations.splice(0);
            return true;
        };
        Object.defineProperty(SmartPropertyPrim.prototype, "uid", {
            /**
             * return a unique identifier for the Canvas2D
             */
            get: function () {
                if (!this._uid) {
                    this._uid = BABYLON.Tools.RandomId();
                }
                return this._uid;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns as a new array populated with the Animatable used by the primitive. Must be overloaded by derived primitives.
         * Look at Sprite2D for more information
         */
        SmartPropertyPrim.prototype.getAnimatables = function () {
            return new Array();
        };
        Object.defineProperty(SmartPropertyPrim.prototype, "modelKey", {
            /**
             * Property giving the Model Key associated to the property.
             * This value is constructed from the type of the primitive and all the name/value of its properties declared with the modelLevelProperty decorator
             * @returns the model key string.
             */
            get: function () {
                var _this = this;
                // No need to compute it?
                if (!this._isFlagSet(SmartPropertyPrim_1.flagModelDirty) && this._modelKey) {
                    return this._modelKey;
                }
                var modelKey = "Class:" + BABYLON.Tools.getClassName(this) + ";";
                var propDic = this.propDic;
                propDic.forEach(function (k, v) {
                    if (v.kind === Prim2DPropInfo.PROPKIND_MODEL) {
                        var propVal = _this[v.name];
                        // Special case, array, this WON'T WORK IN ALL CASES, all entries have to be of the same type and it must be a BJS well known one
                        if (propVal && propVal.constructor === Array) {
                            var firstVal = propVal[0];
                            if (!firstVal) {
                                propVal = 0;
                            }
                            else {
                                propVal = BABYLON.Tools.hashCodeFromStream(BABYLON.Tools.arrayOrStringFeeder(propVal));
                            }
                        }
                        var value = "[null]";
                        if (propVal != null) {
                            if (v.typeLevelCompare) {
                                value = BABYLON.Tools.getClassName(propVal);
                            }
                            else {
                                // String Dictionaries' content are too complex, with use a Random GUID to make the model unique
                                if (propVal instanceof BABYLON.StringDictionary) {
                                    value = BABYLON.Tools.RandomId();
                                }
                                else if (propVal instanceof BABYLON.BaseTexture) {
                                    value = propVal.uid;
                                }
                                else {
                                    value = propVal.toString();
                                }
                            }
                        }
                        modelKey += v.name + ":" + value + ";";
                    }
                });
                this._clearFlags(SmartPropertyPrim_1.flagModelDirty);
                this._modelKey = modelKey;
                return modelKey;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SmartPropertyPrim.prototype, "isDirty", {
            /**
             * States if the Primitive is dirty and should be rendered again next time.
             * @returns true is dirty, false otherwise
             */
            get: function () {
                return (this._instanceDirtyFlags !== 0) || this._areSomeFlagsSet(SmartPropertyPrim_1.flagModelDirty | SmartPropertyPrim_1.flagModelUpdate | SmartPropertyPrim_1.flagPositioningDirty | SmartPropertyPrim_1.flagLayoutDirty);
            },
            enumerable: true,
            configurable: true
        });
        SmartPropertyPrim.prototype._boundingBoxDirty = function () {
            this._setFlags(SmartPropertyPrim_1.flagLevelBoundingInfoDirty);
            // Escalate the dirty flag in the instance hierarchy, stop when a renderable group is found or at the end
            if (this instanceof BABYLON.Prim2DBase) {
                var curprim = this;
                while (curprim) {
                    curprim._setFlags(SmartPropertyPrim_1.flagBoundingInfoDirty);
                    if (curprim.isSizeAuto) {
                        curprim.onPrimitivePropertyDirty(BABYLON.Prim2DBase.sizeProperty.flagId);
                        if (curprim._isFlagSet(SmartPropertyPrim_1.flagUsePositioning)) {
                            curprim._setFlags(SmartPropertyPrim_1.flagPositioningDirty);
                        }
                    }
                    if (curprim instanceof BABYLON.Group2D) {
                        if (curprim.isRenderableGroup) {
                            break;
                        }
                    }
                    curprim = curprim.parent;
                }
            }
        };
        SmartPropertyPrim.prototype._handlePropChanged = function (curValue, newValue, propName, propInfo, typeLevelCompare) {
            _super.prototype._handlePropChanged.call(this, curValue, newValue, propName, propInfo, typeLevelCompare);
            // If the property change also dirty the boundingInfo, update the boundingInfo dirty flags
            if (propInfo.dirtyBoundingInfo) {
                this._boundingBoxDirty();
            }
            else if (propInfo.dirtyParentBoundingInfo) {
                var p = this._parent;
                if (p != null) {
                    p._boundingBoxDirty();
                }
            }
            // If the property belong to a group, check if it's a cached one, and dirty its render sprite accordingly
            if (this instanceof BABYLON.Group2D && this._renderableData) {
                this.handleGroupChanged(propInfo);
            }
            // Check for parent layout dirty
            if (this instanceof BABYLON.Prim2DBase) {
                var p = this._parent;
                if (p != null && p.layoutEngine && (p.layoutEngine.layoutDirtyOnPropertyChangedMask & propInfo.flagId) !== 0) {
                    p._setLayoutDirty();
                }
                var that = this;
                if (that.layoutEngine && (that.layoutEngine.layoutDirtyOnPropertyChangedMask & propInfo.flagId) !== 0) {
                    this._setLayoutDirty();
                }
            }
            // For type level compare, if there's a change of type it's a change of model, otherwise we issue an instance change
            var instanceDirty = false;
            if (typeLevelCompare && curValue != null && newValue != null) {
                var cvProto = curValue.__proto__;
                var nvProto = newValue.__proto__;
                instanceDirty = (cvProto === nvProto);
            }
            // Set the dirty flags
            if (!instanceDirty && (propInfo.kind === Prim2DPropInfo.PROPKIND_MODEL)) {
                if (!this.isDirty) {
                    this.onPrimBecomesDirty();
                    this._setFlags(SmartPropertyPrim_1.flagModelDirty);
                }
            }
            else if (instanceDirty || (propInfo.kind === Prim2DPropInfo.PROPKIND_INSTANCE) || (propInfo.kind === Prim2DPropInfo.PROPKIND_DYNAMIC)) {
                var propMask = propInfo.flagId;
                this.onPrimitivePropertyDirty(propMask);
            }
        };
        SmartPropertyPrim.prototype.onPrimitivePropertyDirty = function (propFlagId) {
            this.onPrimBecomesDirty();
            this._instanceDirtyFlags |= propFlagId;
        };
        SmartPropertyPrim.prototype.handleGroupChanged = function (prop) {
        };
        SmartPropertyPrim.prototype._resetPropertiesDirty = function () {
            _super.prototype._resetPropertiesDirty.call(this);
            this._clearFlags(SmartPropertyPrim_1.flagPrimInDirtyList | SmartPropertyPrim_1.flagNeedRefresh);
        };
        Object.defineProperty(SmartPropertyPrim.prototype, "levelBoundingInfo", {
            /**
             * Retrieve the boundingInfo for this Primitive, computed based on the primitive itself and NOT its children
             */
            get: function () {
                if (this._isFlagSet(SmartPropertyPrim_1.flagLevelBoundingInfoDirty)) {
                    if (this.updateLevelBoundingInfo()) {
                        this._boundingInfo.dirtyWorldAABB();
                        this._clearFlags(SmartPropertyPrim_1.flagLevelBoundingInfoDirty);
                    }
                    else {
                        this._levelBoundingInfo.clear();
                    }
                }
                return this._levelBoundingInfo;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * This method must be overridden by a given Primitive implementation to compute its boundingInfo
         */
        SmartPropertyPrim.prototype.updateLevelBoundingInfo = function () {
            return false;
        };
        /**
         * Property method called when the Primitive becomes dirty
         */
        SmartPropertyPrim.prototype.onPrimBecomesDirty = function () {
        };
        /**
         * Check if a given flag is set
         * @param flag the flag value
         * @return true if set, false otherwise
         */
        SmartPropertyPrim.prototype._isFlagSet = function (flag) {
            return (this._flags & flag) !== 0;
        };
        /**
         * Check if all given flags are set
         * @param flags the flags ORed
         * @return true if all the flags are set, false otherwise
         */
        SmartPropertyPrim.prototype._areAllFlagsSet = function (flags) {
            return (this._flags & flags) === flags;
        };
        /**
         * Check if at least one flag of the given flags is set
         * @param flags the flags ORed
         * @return true if at least one flag is set, false otherwise
         */
        SmartPropertyPrim.prototype._areSomeFlagsSet = function (flags) {
            return (this._flags & flags) !== 0;
        };
        /**
         * Clear the given flags
         * @param flags the flags to clear
         */
        SmartPropertyPrim.prototype._clearFlags = function (flags) {
            this._flags &= ~flags;
        };
        /**
         * Set the given flags to true state
         * @param flags the flags ORed to set
         * @return the flags state before this call
         */
        SmartPropertyPrim.prototype._setFlags = function (flags) {
            var cur = this._flags;
            this._flags |= flags;
            return cur;
        };
        /**
         * Change the state of the given flags
         * @param flags the flags ORed to change
         * @param state true to set them, false to clear them
         */
        SmartPropertyPrim.prototype._changeFlags = function (flags, state) {
            if (state) {
                this._flags |= flags;
            }
            else {
                this._flags &= ~flags;
            }
        };
        return SmartPropertyPrim;
    }(SmartPropertyBase));
    SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT = 0;
    SmartPropertyPrim.flagNoPartOfLayout = 0x0000001; // set if the primitive's position/size must not be computed by Layout Engine
    SmartPropertyPrim.flagLevelBoundingInfoDirty = 0x0000002; // set if the primitive's level bounding box (not including children) is dirty
    SmartPropertyPrim.flagModelDirty = 0x0000004; // set if the model must be changed
    SmartPropertyPrim.flagLayoutDirty = 0x0000008; // set if the layout must be computed
    SmartPropertyPrim.flagLevelVisible = 0x0000010; // set if the primitive is set as visible for its level only
    SmartPropertyPrim.flagBoundingInfoDirty = 0x0000020; // set if the primitive's overall bounding box (including children) is dirty
    SmartPropertyPrim.flagIsPickable = 0x0000040; // set if the primitive can be picked during interaction
    SmartPropertyPrim.flagIsVisible = 0x0000080; // set if the primitive is concretely visible (use the levelVisible of parents)
    SmartPropertyPrim.flagVisibilityChanged = 0x0000100; // set if there was a transition between visible/hidden status
    SmartPropertyPrim.flagPositioningDirty = 0x0000200; // set if the primitive positioning must be computed
    SmartPropertyPrim.flagTrackedGroup = 0x0000400; // set if the group2D is tracking a scene node
    SmartPropertyPrim.flagWorldCacheChanged = 0x0000800; // set if the cached bitmap of a world space canvas changed
    SmartPropertyPrim.flagChildrenFlatZOrder = 0x0001000; // set if all the children (direct and indirect) will share the same Z-Order
    SmartPropertyPrim.flagZOrderDirty = 0x0002000; // set if the Z-Order for this prim and its children must be recomputed
    SmartPropertyPrim.flagActualOpacityDirty = 0x0004000; // set if the actualOpactity should be recomputed
    SmartPropertyPrim.flagPrimInDirtyList = 0x0008000; // set if the primitive is in the primDirtyList
    SmartPropertyPrim.flagIsContainer = 0x0010000; // set if the primitive is a container
    SmartPropertyPrim.flagNeedRefresh = 0x0020000; // set if the primitive wasn't successful at refresh
    SmartPropertyPrim.flagActualScaleDirty = 0x0040000; // set if the actualScale property needs to be recomputed
    SmartPropertyPrim.flagDontInheritParentScale = 0x0080000; // set if the actualScale must not use its parent's scale to be computed
    SmartPropertyPrim.flagGlobalTransformDirty = 0x0100000; // set if the global transform must be recomputed due to a local transform change
    SmartPropertyPrim.flagLayoutBoundingInfoDirty = 0x0200000; // set if the layout bounding info is dirty
    SmartPropertyPrim.flagCollisionActor = 0x0400000; // set if the primitive is part of the collision engine
    SmartPropertyPrim.flagModelUpdate = 0x0800000; // set if the primitive's model data is to update
    SmartPropertyPrim.flagLocalTransformDirty = 0x1000000; // set if the local transformation matrix must be recomputed
    SmartPropertyPrim.flagUsePositioning = 0x2000000; // set if the primitive rely on the positioning engine (padding or margin is used)
    SmartPropertyPrim.flagComputingPositioning = 0x4000000; // set if the positioning engine is computing the primitive, used to avoid re entrance
    SmartPropertyPrim = SmartPropertyPrim_1 = __decorate([
        BABYLON.className("SmartPropertyPrim", "BABYLON")
    ], SmartPropertyPrim);
    BABYLON.SmartPropertyPrim = SmartPropertyPrim;
    function dependencyProperty(propId, piStore, mode, updateSourceTrigger) {
        if (mode === void 0) { mode = DataBinding.MODE_TWOWAY; }
        if (updateSourceTrigger === void 0) { updateSourceTrigger = DataBinding.UPDATESOURCETRIGGER_PROPERTYCHANGED; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_DYNAMIC, { bindingMode: mode, bindingUpdateSourceTrigger: updateSourceTrigger });
    }
    BABYLON.dependencyProperty = dependencyProperty;
    function modelLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_MODEL, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }
    BABYLON.modelLevelProperty = modelLevelProperty;
    function instanceLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_INSTANCE, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }
    BABYLON.instanceLevelProperty = instanceLevelProperty;
    function dynamicLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_DYNAMIC, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }
    BABYLON.dynamicLevelProperty = dynamicLevelProperty;
    var DataBinding_1, SmartPropertyBase_1, SmartPropertyPrim_1;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.smartPropertyPrim.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var PrepareRender2DContext = (function () {
        function PrepareRender2DContext() {
            this.forceRefreshPrimitive = false;
        }
        return PrepareRender2DContext;
    }());
    BABYLON.PrepareRender2DContext = PrepareRender2DContext;
    var Render2DContext = (function () {
        function Render2DContext(renderMode) {
            this._renderMode = renderMode;
            this.useInstancing = false;
            this.groupInfoPartData = null;
            this.partDataStartIndex = this.partDataEndIndex = null;
            this.instancedBuffers = null;
        }
        Object.defineProperty(Render2DContext.prototype, "renderMode", {
            /**
             * Define which render Mode should be used to render the primitive: one of Render2DContext.RenderModeXxxx property
             */
            get: function () {
                return this._renderMode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render2DContext, "RenderModeOpaque", {
            /**
             * The set of primitives to render is opaque.
             * This is the first rendering pass. All Opaque primitives are rendered. Depth Compare and Write are both enabled.
             */
            get: function () {
                return Render2DContext._renderModeOpaque;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render2DContext, "RenderModeAlphaTest", {
            /**
             * The set of primitives to render is using Alpha Test (aka masking).
             * Alpha Blend is enabled, the AlphaMode must be manually set, the render occurs after the RenderModeOpaque and is depth independent (i.e. primitives are not sorted by depth). Depth Compare and Write are both enabled.
             */
            get: function () {
                return Render2DContext._renderModeAlphaTest;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Render2DContext, "RenderModeTransparent", {
            /**
             * The set of primitives to render is transparent.
             * Alpha Blend is enabled, the AlphaMode must be manually set, the render occurs after the RenderModeAlphaTest and is depth dependent (i.e. primitives are stored by depth and rendered back to front). Depth Compare is on, but Depth write is Off.
             */
            get: function () {
                return Render2DContext._renderModeTransparent;
            },
            enumerable: true,
            configurable: true
        });
        return Render2DContext;
    }());
    Render2DContext._renderModeOpaque = 1;
    Render2DContext._renderModeAlphaTest = 2;
    Render2DContext._renderModeTransparent = 3;
    BABYLON.Render2DContext = Render2DContext;
    /**
     * This class store information for the pointerEventObservable Observable.
     * The Observable is divided into many sub events (using the Mask feature of the Observable pattern): PointerOver, PointerEnter, PointerDown, PointerMouseWheel, PointerMove, PointerUp, PointerDown, PointerLeave, PointerGotCapture and PointerLostCapture.
     */
    var PrimitivePointerInfo = (function () {
        function PrimitivePointerInfo() {
            this.primitivePointerPos = BABYLON.Vector2.Zero();
            this.tilt = BABYLON.Vector2.Zero();
            this.cancelBubble = false;
        }
        Object.defineProperty(PrimitivePointerInfo, "PointerOver", {
            // The behavior is based on the HTML specifications of the Pointer Events (https://www.w3.org/TR/pointerevents/#list-of-pointer-events). This is not 100% compliant and not meant to be, but still, it's based on these specs for most use cases to be programmed the same way (as closest as possible) as it would have been in HTML.
            /**
             * This event type is raised when a pointing device is moved into the hit test boundaries of a primitive.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerOver;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerEnter", {
            /**
             * This event type is raised when a pointing device is moved into the hit test boundaries of a primitive or one of its descendants.
             * Bubbles: no
             */
            get: function () {
                return PrimitivePointerInfo._pointerEnter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerDown", {
            /**
             * This event type is raised when a pointer enters the active button state (non-zero value in the buttons property). For mouse it's when the device transitions from no buttons depressed to at least one button depressed. For touch/pen this is when a physical contact is made.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerDown;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerMouseWheel", {
            /**
             * This event type is raised when the pointer is a mouse and it's wheel is rolling
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerMouseWheel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerMove", {
            /**
             * This event type is raised when a pointer change coordinates or when a pointer changes button state, pressure, tilt, or contact geometry and the circumstances produce no other pointers events.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerMove;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerUp", {
            /**
             * This event type is raised when the pointer leaves the active buttons states (zero value in the buttons property). For mouse, this is when the device transitions from at least one button depressed to no buttons depressed. For touch/pen, this is when physical contact is removed.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerUp;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerOut", {
            /**
             * This event type is raised when a pointing device is moved out of the hit test the boundaries of a primitive.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerOut;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerLeave", {
            /**
             * This event type is raised when a pointing device is moved out of the hit test boundaries of a primitive and all its descendants.
             * Bubbles: no
             */
            get: function () {
                return PrimitivePointerInfo._pointerLeave;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerGotCapture", {
            /**
             * This event type is raised when a primitive receives the pointer capture. This event is fired at the element that is receiving pointer capture. Subsequent events for that pointer will be fired at this element.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerGotCapture;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "PointerLostCapture", {
            /**
             * This event type is raised after pointer capture is released for a pointer.
             * Bubbles: yes
             */
            get: function () {
                return PrimitivePointerInfo._pointerLostCapture;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitivePointerInfo, "MouseWheelPrecision", {
            get: function () {
                return PrimitivePointerInfo._mouseWheelPrecision;
            },
            enumerable: true,
            configurable: true
        });
        PrimitivePointerInfo.prototype.updateRelatedTarget = function (prim, primPointerPos) {
            this.relatedTarget = prim;
            this.relatedTargetPointerPos = primPointerPos;
        };
        PrimitivePointerInfo.getEventTypeName = function (mask) {
            switch (mask) {
                case PrimitivePointerInfo.PointerOver: return "PointerOver";
                case PrimitivePointerInfo.PointerEnter: return "PointerEnter";
                case PrimitivePointerInfo.PointerDown: return "PointerDown";
                case PrimitivePointerInfo.PointerMouseWheel: return "PointerMouseWheel";
                case PrimitivePointerInfo.PointerMove: return "PointerMove";
                case PrimitivePointerInfo.PointerUp: return "PointerUp";
                case PrimitivePointerInfo.PointerOut: return "PointerOut";
                case PrimitivePointerInfo.PointerLeave: return "PointerLeave";
                case PrimitivePointerInfo.PointerGotCapture: return "PointerGotCapture";
                case PrimitivePointerInfo.PointerLostCapture: return "PointerLostCapture";
            }
        };
        return PrimitivePointerInfo;
    }());
    PrimitivePointerInfo._pointerOver = 0x0001;
    PrimitivePointerInfo._pointerEnter = 0x0002;
    PrimitivePointerInfo._pointerDown = 0x0004;
    PrimitivePointerInfo._pointerMouseWheel = 0x0008;
    PrimitivePointerInfo._pointerMove = 0x0010;
    PrimitivePointerInfo._pointerUp = 0x0020;
    PrimitivePointerInfo._pointerOut = 0x0040;
    PrimitivePointerInfo._pointerLeave = 0x0080;
    PrimitivePointerInfo._pointerGotCapture = 0x0100;
    PrimitivePointerInfo._pointerLostCapture = 0x0200;
    PrimitivePointerInfo._mouseWheelPrecision = 3.0;
    BABYLON.PrimitivePointerInfo = PrimitivePointerInfo;
    /**
     * Defines the horizontal and vertical alignment information for a Primitive.
     */
    var PrimitiveAlignment = PrimitiveAlignment_1 = (function () {
        function PrimitiveAlignment(changeCallback) {
            this._changedCallback = changeCallback;
            this._horizontal = PrimitiveAlignment_1.AlignLeft;
            this._vertical = PrimitiveAlignment_1.AlignBottom;
        }
        Object.defineProperty(PrimitiveAlignment, "AlignLeft", {
            /**
             * Alignment is made relative to the left edge of the Primitive. Valid for horizontal alignment only.
             */
            get: function () { return PrimitiveAlignment_1._AlignLeft; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignTop", {
            /**
             * Alignment is made relative to the top edge of the Primitive. Valid for vertical alignment only.
             */
            get: function () { return PrimitiveAlignment_1._AlignTop; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignRight", {
            /**
             * Alignment is made relative to the right edge of the Primitive. Valid for horizontal alignment only.
             */
            get: function () { return PrimitiveAlignment_1._AlignRight; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignBottom", {
            /**
             * Alignment is made relative to the bottom edge of the Primitive. Valid for vertical alignment only.
             */
            get: function () { return PrimitiveAlignment_1._AlignBottom; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignCenter", {
            /**
             * Alignment is made to center the content from equal distance to the opposite edges of the Primitive
             */
            get: function () { return PrimitiveAlignment_1._AlignCenter; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment, "AlignStretch", {
            /**
             * The content is stretched toward the opposite edges of the Primitive
             */
            get: function () { return PrimitiveAlignment_1._AlignStretch; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment.prototype, "horizontal", {
            /**
             * Get/set the horizontal alignment. Use one of the AlignXXX static properties of this class
             */
            get: function () {
                return this._horizontal;
            },
            set: function (value) {
                if (this._horizontal === value) {
                    return;
                }
                this._horizontal = value;
                this.onChangeCallback();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveAlignment.prototype, "vertical", {
            /**
             * Get/set the vertical alignment. Use one of the AlignXXX static properties of this class
             */
            get: function () {
                return this._vertical;
            },
            set: function (value) {
                if (this._vertical === value) {
                    return;
                }
                this._vertical = value;
                this.onChangeCallback();
            },
            enumerable: true,
            configurable: true
        });
        PrimitiveAlignment.prototype.onChangeCallback = function () {
            if (this._changedCallback) {
                this._changedCallback();
            }
        };
        /**
         * Set the horizontal alignment from a string value.
         * @param text can be either: 'left','right','center','stretch'
         */
        PrimitiveAlignment.prototype.setHorizontal = function (text) {
            var v = text.trim().toLocaleLowerCase();
            switch (v) {
                case "left":
                    this.horizontal = PrimitiveAlignment_1.AlignLeft;
                    return;
                case "right":
                    this.horizontal = PrimitiveAlignment_1.AlignRight;
                    return;
                case "center":
                    this.horizontal = PrimitiveAlignment_1.AlignCenter;
                    return;
                case "stretch":
                    this.horizontal = PrimitiveAlignment_1.AlignStretch;
                    return;
            }
        };
        /**
         * Set the vertical alignment from a string value.
         * @param text can be either: 'top','bottom','center','stretch'
         */
        PrimitiveAlignment.prototype.setVertical = function (text) {
            var v = text.trim().toLocaleLowerCase();
            switch (v) {
                case "top":
                    this.vertical = PrimitiveAlignment_1.AlignTop;
                    return;
                case "bottom":
                    this.vertical = PrimitiveAlignment_1.AlignBottom;
                    return;
                case "center":
                    this.vertical = PrimitiveAlignment_1.AlignCenter;
                    return;
                case "stretch":
                    this.vertical = PrimitiveAlignment_1.AlignStretch;
                    return;
            }
        };
        /**
         * Set the horizontal and or vertical alignments from a string value.
         * @param text can be: [<h:|horizontal:><left|right|center|stretch>], [<v:|vertical:><top|bottom|center|stretch>]
         */
        PrimitiveAlignment.prototype.fromString = function (value) {
            var m = value.trim().split(",");
            if (m.length === 1) {
                this.setHorizontal(m[0]);
                this.setVertical(m[0]);
            }
            else {
                for (var _i = 0, m_1 = m; _i < m_1.length; _i++) {
                    var v = m_1[_i];
                    v = v.toLocaleLowerCase().trim();
                    // Horizontal
                    var i = v.indexOf("h:");
                    if (i === -1) {
                        i = v.indexOf("horizontal:");
                    }
                    if (i !== -1) {
                        v = v.substr(v.indexOf(":") + 1);
                        this.setHorizontal(v);
                        continue;
                    }
                    // Vertical
                    i = v.indexOf("v:");
                    if (i === -1) {
                        i = v.indexOf("vertical:");
                    }
                    if (i !== -1) {
                        v = v.substr(v.indexOf(":") + 1);
                        this.setVertical(v);
                        continue;
                    }
                }
            }
        };
        PrimitiveAlignment.prototype.copyFrom = function (pa) {
            this._horizontal = pa._horizontal;
            this._vertical = pa._vertical;
            this.onChangeCallback();
        };
        PrimitiveAlignment.prototype.clone = function () {
            var pa = new PrimitiveAlignment_1();
            pa._horizontal = this._horizontal;
            pa._vertical = this._vertical;
            return pa;
        };
        Object.defineProperty(PrimitiveAlignment.prototype, "isDefault", {
            get: function () {
                return this.horizontal === PrimitiveAlignment_1.AlignLeft && this.vertical === PrimitiveAlignment_1.AlignBottom;
            },
            enumerable: true,
            configurable: true
        });
        return PrimitiveAlignment;
    }());
    PrimitiveAlignment._AlignLeft = 1;
    PrimitiveAlignment._AlignTop = 1; // Same as left
    PrimitiveAlignment._AlignRight = 2;
    PrimitiveAlignment._AlignBottom = 2; // Same as right
    PrimitiveAlignment._AlignCenter = 3;
    PrimitiveAlignment._AlignStretch = 4;
    PrimitiveAlignment = PrimitiveAlignment_1 = __decorate([
        BABYLON.className("PrimitiveAlignment", "BABYLON")
    ], PrimitiveAlignment);
    BABYLON.PrimitiveAlignment = PrimitiveAlignment;
    /**
     * Stores information about a Primitive that was intersected
     */
    var PrimitiveIntersectedInfo = (function () {
        function PrimitiveIntersectedInfo(prim, intersectionLocation) {
            this.prim = prim;
            this.intersectionLocation = intersectionLocation;
        }
        return PrimitiveIntersectedInfo;
    }());
    BABYLON.PrimitiveIntersectedInfo = PrimitiveIntersectedInfo;
    /**
     * Define a thickness toward every edges of a Primitive to allow margin and padding.
     * The thickness can be expressed as pixels, percentages, inherit the value of the parent primitive or be auto.
     */
    var PrimitiveThickness = PrimitiveThickness_1 = (function () {
        function PrimitiveThickness(parentAccess, changedCallback) {
            this._parentAccess = parentAccess;
            this._changedCallback = changedCallback;
            this._pixels = new Array(4);
            this._percentages = new Array(4);
            this._setType(0, PrimitiveThickness_1.Auto);
            this._setType(1, PrimitiveThickness_1.Auto);
            this._setType(2, PrimitiveThickness_1.Auto);
            this._setType(3, PrimitiveThickness_1.Auto);
            this._pixels[0] = 0;
            this._pixels[1] = 0;
            this._pixels[2] = 0;
            this._pixels[3] = 0;
        }
        /**
         * Set the thickness from a string value
         * @param thickness format is "top: <value>, left:<value>, right:<value>, bottom:<value>" or "<value>" (same for all edges) each are optional, auto will be set if it's omitted.
         * Values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        PrimitiveThickness.prototype.fromString = function (thickness) {
            this._clear();
            var m = thickness.trim().split(",");
            // Special case, one value to apply to all edges
            if (m.length === 1 && thickness.indexOf(":") === -1) {
                this._setStringValue(m[0], 0, false);
                this._setStringValue(m[0], 1, false);
                this._setStringValue(m[0], 2, false);
                this._setStringValue(m[0], 3, false);
                this.onChangeCallback();
                return;
            }
            var res = false;
            for (var _i = 0, m_2 = m; _i < m_2.length; _i++) {
                var cm = m_2[_i];
                res = this._extractString(cm, false) || res;
            }
            if (!res) {
                throw new Error("Can't parse the string to create a PrimitiveMargin object, format must be: 'top: <value>, left:<value>, right:<value>, bottom:<value>");
            }
            // Check the margin that weren't set and set them in auto
            if ((this._flags & 0x000F) === 0)
                this._flags |= PrimitiveThickness_1.Pixel << 0;
            if ((this._flags & 0x00F0) === 0)
                this._flags |= PrimitiveThickness_1.Pixel << 4;
            if ((this._flags & 0x0F00) === 0)
                this._flags |= PrimitiveThickness_1.Pixel << 8;
            if ((this._flags & 0xF000) === 0)
                this._flags |= PrimitiveThickness_1.Pixel << 12;
            this.onChangeCallback();
        };
        /**
         * Set the thickness from multiple string
         * Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         * @param top the top thickness to set
         * @param left the left thickness to set
         * @param right the right thickness to set
         * @param bottom the bottom thickness to set
         */
        PrimitiveThickness.prototype.fromStrings = function (top, left, right, bottom) {
            this._clear();
            this._setStringValue(top, 0, false);
            this._setStringValue(left, 1, false);
            this._setStringValue(right, 2, false);
            this._setStringValue(bottom, 3, false);
            this.onChangeCallback();
            return this;
        };
        /**
         * Set the thickness from pixel values
         * @param top the top thickness in pixels to set
         * @param left the left thickness in pixels to set
         * @param right the right thickness in pixels to set
         * @param bottom the bottom thickness in pixels to set
         */
        PrimitiveThickness.prototype.fromPixels = function (top, left, right, bottom) {
            this._clear();
            this._pixels[0] = top;
            this._pixels[1] = left;
            this._pixels[2] = right;
            this._pixels[3] = bottom;
            this.onChangeCallback();
            return this;
        };
        /**
         * Apply the same pixel value to all edges
         * @param margin the value to set, in pixels.
         */
        PrimitiveThickness.prototype.fromUniformPixels = function (margin) {
            this._clear();
            this._pixels[0] = margin;
            this._pixels[1] = margin;
            this._pixels[2] = margin;
            this._pixels[3] = margin;
            this.onChangeCallback();
            return this;
        };
        PrimitiveThickness.prototype.copyFrom = function (pt) {
            this._clear();
            for (var i = 0; i < 4; i++) {
                this._pixels[i] = pt._pixels[i];
                this._percentages[i] = pt._percentages[i];
            }
            this._flags = pt._flags;
            this.onChangeCallback();
        };
        /**
         * Set all edges in auto
         */
        PrimitiveThickness.prototype.auto = function () {
            this._clear();
            this._flags = (PrimitiveThickness_1.Auto << 0) | (PrimitiveThickness_1.Auto << 4) | (PrimitiveThickness_1.Auto << 8) | (PrimitiveThickness_1.Auto << 12);
            this._pixels[0] = 0;
            this._pixels[1] = 0;
            this._pixels[2] = 0;
            this._pixels[3] = 0;
            this.onChangeCallback();
            return this;
        };
        PrimitiveThickness.prototype._clear = function () {
            this._flags = 0;
            this._pixels[0] = 0;
            this._pixels[1] = 0;
            this._pixels[2] = 0;
            this._pixels[3] = 0;
            this._percentages[0] = null;
            this._percentages[1] = null;
            this._percentages[2] = null;
            this._percentages[3] = null;
        };
        PrimitiveThickness.prototype._extractString = function (value, emitChanged) {
            var v = value.trim().toLocaleLowerCase();
            if (v.indexOf("top:") === 0) {
                v = v.substr(4).trim();
                return this._setStringValue(v, 0, emitChanged);
            }
            if (v.indexOf("left:") === 0) {
                v = v.substr(5).trim();
                return this._setStringValue(v, 1, emitChanged);
            }
            if (v.indexOf("right:") === 0) {
                v = v.substr(6).trim();
                return this._setStringValue(v, 2, emitChanged);
            }
            if (v.indexOf("bottom:") === 0) {
                v = v.substr(7).trim();
                return this._setStringValue(v, 3, emitChanged);
            }
            return false;
        };
        PrimitiveThickness.prototype._setStringValue = function (value, index, emitChanged) {
            // Check for auto
            var v = value.trim().toLocaleLowerCase();
            if (v === "auto") {
                if (this._isType(index, PrimitiveThickness_1.Auto)) {
                    return true;
                }
                this._setType(index, PrimitiveThickness_1.Auto);
                this._pixels[index] = 0;
                if (emitChanged) {
                    this.onChangeCallback();
                }
            }
            else if (v === "inherit") {
                if (this._isType(index, PrimitiveThickness_1.Inherit)) {
                    return true;
                }
                this._setType(index, PrimitiveThickness_1.Inherit);
                this._pixels[index] = null;
                if (emitChanged) {
                    this.onChangeCallback();
                }
            }
            else {
                var pI = v.indexOf("%");
                // Check for percentage
                if (pI !== -1) {
                    var n_1 = v.substr(0, pI);
                    var number_1 = Math.round(Number(n_1)) / 100; // Normalize the percentage to [0;1] with a 0.01 precision
                    if (this._isType(index, PrimitiveThickness_1.Percentage) && (this._percentages[index] === number_1)) {
                        return true;
                    }
                    this._setType(index, PrimitiveThickness_1.Percentage);
                    if (isNaN(number_1)) {
                        return false;
                    }
                    this._percentages[index] = number_1;
                    if (emitChanged) {
                        this.onChangeCallback();
                    }
                    return true;
                }
                // Check for pixel
                var n = void 0;
                pI = v.indexOf("px");
                if (pI !== -1) {
                    n = v.substr(0, pI).trim();
                }
                else {
                    n = v;
                }
                var number = Number(n);
                if (this._isType(index, PrimitiveThickness_1.Pixel) && (this._pixels[index] === number)) {
                    return true;
                }
                if (isNaN(number)) {
                    return false;
                }
                this._pixels[index] = number;
                this._setType(index, PrimitiveThickness_1.Pixel);
                if (emitChanged) {
                    this.onChangeCallback();
                }
                return true;
            }
        };
        PrimitiveThickness.prototype._setPixels = function (value, index, emitChanged) {
            // Round the value because, well, it's the thing to do! Otherwise we'll have sub-pixel stuff, and the no change comparison just below will almost never work for PrimitiveThickness values inside a hierarchy of Primitives
            value = Math.round(value);
            if (this._isType(index, PrimitiveThickness_1.Pixel) && this._pixels[index] === value) {
                return;
            }
            this._setType(index, PrimitiveThickness_1.Pixel);
            this._pixels[index] = value;
            if (emitChanged) {
                this.onChangeCallback();
            }
        };
        PrimitiveThickness.prototype._setPercentage = function (value, index, emitChanged) {
            // Clip Value to bounds
            value = Math.min(1, value);
            value = Math.max(0, value);
            value = Math.round(value * 100) / 100; // 0.01 precision
            if (this._isType(index, PrimitiveThickness_1.Percentage) && this._percentages[index] === value) {
                return;
            }
            this._setType(index, PrimitiveThickness_1.Percentage);
            this._percentages[index] = value;
            if (emitChanged) {
                this.onChangeCallback();
            }
        };
        PrimitiveThickness.prototype._getStringValue = function (index) {
            var f = (this._flags >> (index * 4)) & 0xF;
            switch (f) {
                case PrimitiveThickness_1.Auto:
                    return "auto";
                case PrimitiveThickness_1.Pixel:
                    return this._pixels[index] + "px";
                case PrimitiveThickness_1.Percentage:
                    return this._percentages[index] * 100 + "%";
                case PrimitiveThickness_1.Inherit:
                    return "inherit";
            }
            return "";
        };
        PrimitiveThickness.prototype._isType = function (index, type) {
            var f = (this._flags >> (index * 4)) & 0xF;
            return f === type;
        };
        PrimitiveThickness.prototype._getType = function (index, processInherit) {
            var t = (this._flags >> (index * 4)) & 0xF;
            if (processInherit && (t === PrimitiveThickness_1.Inherit)) {
                var p = this._parentAccess();
                if (p) {
                    return p._getType(index, true);
                }
                return PrimitiveThickness_1.Auto;
            }
            return t;
        };
        PrimitiveThickness.prototype._setType = function (index, type) {
            this._flags &= ~(0xF << (index * 4));
            this._flags |= type << (index * 4);
        };
        PrimitiveThickness.prototype.setTop = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 0, true);
            }
            else {
                this.topPixels = value;
            }
        };
        PrimitiveThickness.prototype.setLeft = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 1, true);
            }
            else {
                this.leftPixels = value;
            }
        };
        PrimitiveThickness.prototype.setRight = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 2, true);
            }
            else {
                this.rightPixels = value;
            }
        };
        PrimitiveThickness.prototype.setBottom = function (value) {
            if (typeof value === "string") {
                this._setStringValue(value, 3, true);
            }
            else {
                this.bottomPixels = value;
            }
        };
        Object.defineProperty(PrimitiveThickness.prototype, "top", {
            /**
             * Get/set the top thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(0);
            },
            set: function (value) {
                this._setStringValue(value, 0, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "left", {
            /**
             * Get/set the left thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(1);
            },
            set: function (value) {
                this._setStringValue(value, 1, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "right", {
            /**
             * Get/set the right thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(2);
            },
            set: function (value) {
                this._setStringValue(value, 2, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottom", {
            /**
             * Get/set the bottom thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
             */
            get: function () {
                return this._getStringValue(3);
            },
            set: function (value) {
                this._setStringValue(value, 3, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "topPixels", {
            /**
             * Get/set the top thickness in pixel.
             */
            get: function () {
                return this._pixels[0];
            },
            set: function (value) {
                this._setPixels(value, 0, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "leftPixels", {
            /**
             * Get/set the left thickness in pixel.
             */
            get: function () {
                return this._pixels[1];
            },
            set: function (value) {
                this._setPixels(value, 1, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "rightPixels", {
            /**
             * Get/set the right thickness in pixel.
             */
            get: function () {
                return this._pixels[2];
            },
            set: function (value) {
                this._setPixels(value, 2, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottomPixels", {
            /**
             * Get/set the bottom thickness in pixel.
             */
            get: function () {
                return this._pixels[3];
            },
            set: function (value) {
                this._setPixels(value, 3, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "topPercentage", {
            /**
             * Get/set the top thickness in percentage.
             * The get will return a valid value only if the edge type is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[0];
            },
            set: function (value) {
                this._setPercentage(value, 0, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "leftPercentage", {
            /**
             * Get/set the left thickness in percentage.
             * The get will return a valid value only if the edge mode is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[1];
            },
            set: function (value) {
                this._setPercentage(value, 1, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "rightPercentage", {
            /**
             * Get/set the right thickness in percentage.
             * The get will return a valid value only if the edge mode is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[2];
            },
            set: function (value) {
                this._setPercentage(value, 2, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottomPercentage", {
            /**
             * Get/set the bottom thickness in percentage.
             * The get will return a valid value only if the edge mode is percentage.
             * The Set will change the edge mode if needed
             */
            get: function () {
                return this._percentages[3];
            },
            set: function (value) {
                this._setPercentage(value, 3, true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "topMode", {
            /**
             * Get/set the top mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(0, false);
            },
            set: function (mode) {
                this._setType(0, mode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "leftMode", {
            /**
             * Get/set the left mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(1, false);
            },
            set: function (mode) {
                this._setType(1, mode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "rightMode", {
            /**
             * Get/set the right mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(2, false);
            },
            set: function (mode) {
                this._setType(2, mode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "bottomMode", {
            /**
             * Get/set the bottom mode. The setter shouldn't be used, other setters with value should be preferred
             */
            get: function () {
                return this._getType(3, false);
            },
            set: function (mode) {
                this._setType(3, mode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PrimitiveThickness.prototype, "isDefault", {
            get: function () {
                return this._flags === 0x1111;
            },
            enumerable: true,
            configurable: true
        });
        PrimitiveThickness.prototype._computePixels = function (index, sourceArea, emitChanged) {
            var type = this._getType(index, false);
            if (type === PrimitiveThickness_1.Inherit) {
                this._parentAccess()._computePixels(index, sourceArea, emitChanged);
                return;
            }
            if (type !== PrimitiveThickness_1.Percentage) {
                return;
            }
            var pixels = ((index === 0 || index === 3) ? sourceArea.height : sourceArea.width) * this._percentages[index];
            this._pixels[index] = pixels;
            if (emitChanged) {
                this.onChangeCallback();
            }
        };
        PrimitiveThickness.prototype.onChangeCallback = function () {
            if (this._changedCallback) {
                this._changedCallback();
            }
        };
        /**
         * Compute the positioning/size of an area considering the thickness of this object and a given alignment
         * @param sourceArea the source area where the content must be sized/positioned
         * @param contentSize the content size to position/resize
         * @param alignment the alignment setting
         * @param dstOffset the position of the content, x, y, z, w are left, bottom, right, top
         * @param dstArea the new size of the content
         */
        PrimitiveThickness.prototype.computeWithAlignment = function (sourceArea, contentSize, alignment, contentScale, dstOffset, dstArea, computeLayoutArea, computeAxis) {
            if (computeLayoutArea === void 0) { computeLayoutArea = false; }
            if (computeAxis === void 0) { computeAxis = PrimitiveThickness_1.ComputeAll; }
            // Fetch some data
            var topType = this._getType(0, true);
            var leftType = this._getType(1, true);
            var rightType = this._getType(2, true);
            var bottomType = this._getType(3, true);
            var hasWidth = contentSize && (contentSize.width != null);
            var hasHeight = contentSize && (contentSize.height != null);
            var sx = contentScale.x;
            var sy = contentScale.y;
            var width = hasWidth ? contentSize.width : 0;
            var height = hasHeight ? contentSize.height : 0;
            var isTopAuto = topType === PrimitiveThickness_1.Auto;
            var isLeftAuto = leftType === PrimitiveThickness_1.Auto;
            var isRightAuto = rightType === PrimitiveThickness_1.Auto;
            var isBottomAuto = bottomType === PrimitiveThickness_1.Auto;
            if (computeAxis & PrimitiveThickness_1.ComputeH) {
                switch (alignment.horizontal) {
                    case PrimitiveAlignment.AlignLeft:
                        {
                            var leftPixels = 0;
                            if (!isLeftAuto) {
                                this._computePixels(1, sourceArea, true);
                                leftPixels = this.leftPixels;
                            }
                            var rightPixels = 0;
                            if (!isRightAuto) {
                                this._computePixels(2, sourceArea, true);
                                rightPixels = this.rightPixels;
                            }
                            dstOffset.x = leftPixels;
                            dstArea.width = width;
                            dstOffset.z = rightPixels;
                            if (computeLayoutArea) {
                                dstArea.width += leftPixels + rightPixels;
                            }
                            break;
                        }
                    case PrimitiveAlignment.AlignRight:
                        {
                            var leftPixels = 0;
                            if (!isLeftAuto) {
                                this._computePixels(1, sourceArea, true);
                                leftPixels = this.leftPixels;
                            }
                            var rightPixels = 0;
                            if (!isRightAuto) {
                                this._computePixels(2, sourceArea, true);
                                rightPixels = this.rightPixels;
                            }
                            dstOffset.x = Math.round(sourceArea.width - ((width * sx) + rightPixels));
                            dstArea.width = width;
                            dstOffset.z = leftPixels;
                            if (computeLayoutArea) {
                                dstArea.width += leftPixels + rightPixels;
                            }
                            break;
                        }
                    case PrimitiveAlignment.AlignStretch:
                        {
                            if (isLeftAuto) {
                                dstOffset.x = 0;
                            }
                            else {
                                this._computePixels(1, sourceArea, true);
                                dstOffset.x = this.leftPixels;
                            }
                            var rightPixels = 0;
                            if (!isRightAuto) {
                                this._computePixels(2, sourceArea, true);
                                rightPixels = this.rightPixels;
                            }
                            if (computeLayoutArea) {
                                dstArea.width = sourceArea.width;
                            }
                            else {
                                dstArea.width = sourceArea.width - (dstOffset.x + rightPixels);
                            }
                            dstOffset.z = this.rightPixels;
                            break;
                        }
                    case PrimitiveAlignment.AlignCenter:
                        {
                            if (!isLeftAuto) {
                                this._computePixels(1, sourceArea, true);
                            }
                            if (!isRightAuto) {
                                this._computePixels(2, sourceArea, true);
                            }
                            var offset = (isLeftAuto ? 0 : this.leftPixels) - (isRightAuto ? 0 : this.rightPixels);
                            var center = ((sourceArea.width - (width * sx)) / 2);
                            dstOffset.x = Math.round(center + offset);
                            if (computeLayoutArea) {
                                dstArea.width = width + this.leftPixels + this.rightPixels;
                            }
                            else {
                                dstArea.width = width;
                            }
                            dstOffset.z = Math.round(center - offset);
                            break;
                        }
                }
            }
            if (computeAxis & PrimitiveThickness_1.ComputeV) {
                switch (alignment.vertical) {
                    case PrimitiveAlignment.AlignBottom:
                        {
                            var bottomPixels = 0;
                            if (!isBottomAuto) {
                                this._computePixels(3, sourceArea, true);
                                bottomPixels = this.bottomPixels;
                            }
                            var topPixels = 0;
                            if (!isTopAuto) {
                                this._computePixels(0, sourceArea, true);
                                topPixels = this.topPixels;
                            }
                            dstOffset.y = bottomPixels;
                            dstArea.height = height;
                            dstOffset.w = topPixels;
                            if (computeLayoutArea) {
                                dstArea.height += bottomPixels + topPixels;
                            }
                            break;
                        }
                    case PrimitiveAlignment.AlignTop:
                        {
                            var bottomPixels = 0;
                            if (!isBottomAuto) {
                                this._computePixels(3, sourceArea, true);
                                bottomPixels = this.bottomPixels;
                            }
                            var topPixels = 0;
                            if (!isTopAuto) {
                                this._computePixels(0, sourceArea, true);
                                topPixels = this.topPixels;
                            }
                            dstOffset.y = Math.round(sourceArea.height - ((height * sy) + topPixels));
                            dstArea.height = height;
                            dstOffset.w = bottomPixels;
                            if (computeLayoutArea) {
                                dstArea.height += bottomPixels + topPixels;
                            }
                            //                        console.log(`Compute Alignment Source Area: ${sourceArea}, Content Size: ${contentSize}`);
                            break;
                        }
                    case PrimitiveAlignment.AlignStretch:
                        {
                            if (isBottomAuto) {
                                dstOffset.y = 0;
                            }
                            else {
                                this._computePixels(3, sourceArea, true);
                                dstOffset.y = this.bottomPixels;
                            }
                            var top_1 = 0;
                            if (!isTopAuto) {
                                this._computePixels(0, sourceArea, true);
                                top_1 = this.topPixels;
                            }
                            if (computeLayoutArea) {
                                dstArea.height = sourceArea.height;
                            }
                            else {
                                dstArea.height = sourceArea.height - (dstOffset.y + top_1);
                            }
                            dstOffset.w = this.topPixels;
                            break;
                        }
                    case PrimitiveAlignment.AlignCenter:
                        {
                            if (!isTopAuto) {
                                this._computePixels(0, sourceArea, true);
                            }
                            if (!isBottomAuto) {
                                this._computePixels(3, sourceArea, true);
                            }
                            var offset = (isBottomAuto ? 0 : this.bottomPixels) - (isTopAuto ? 0 : this.topPixels);
                            var center = (sourceArea.height - (height * sy)) / 2;
                            dstOffset.y = Math.round(center + offset);
                            if (computeLayoutArea) {
                                dstArea.height = height + this.bottomPixels + this.topPixels;
                            }
                            else {
                                dstArea.height = height;
                            }
                            dstOffset.w = Math.round(center - offset);
                            break;
                        }
                }
            }
        };
        /**
         * Compute an area and its position considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param dstOffset the position of the resulting area
         * @param dstArea the size of the resulting area
         */
        PrimitiveThickness.prototype.compute = function (sourceArea, sourceAreaScale, dstOffset, dstArea, computeLayoutArea) {
            if (computeLayoutArea === void 0) { computeLayoutArea = false; }
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);
            var sx = sourceAreaScale.x;
            var sy = sourceAreaScale.y;
            dstOffset.x = this.leftPixels;
            if (computeLayoutArea) {
                dstArea.width = (sourceArea.width * sx) + (dstOffset.x + this.rightPixels);
            }
            else {
                dstArea.width = (sourceArea.width * sx) - (dstOffset.x + this.rightPixels);
            }
            dstOffset.y = this.bottomPixels;
            if (computeLayoutArea) {
                dstArea.height = (sourceArea.height * sy) + (dstOffset.y + this.topPixels);
            }
            else {
                dstArea.height = (sourceArea.height * sy) - (dstOffset.y + this.topPixels);
            }
            dstOffset.z = this.rightPixels;
            dstOffset.w = this.topPixels;
        };
        /**
         * Compute an area considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param result the resulting area
         */
        PrimitiveThickness.prototype.computeArea = function (sourceArea, sourceScale, result) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);
            result.width = this.leftPixels + (sourceArea.width * sourceScale.x) + this.rightPixels;
            result.height = this.bottomPixels + (sourceArea.height * sourceScale.y) + this.topPixels;
        };
        PrimitiveThickness.prototype.enlarge = function (sourceArea, sourceScale, dstOffset, enlargedArea) {
            this._computePixels(0, sourceArea, true);
            this._computePixels(1, sourceArea, true);
            this._computePixels(2, sourceArea, true);
            this._computePixels(3, sourceArea, true);
            dstOffset.x = this.leftPixels;
            enlargedArea.width = (sourceArea.width * sourceScale.x) + (dstOffset.x + this.rightPixels);
            dstOffset.y = this.bottomPixels;
            enlargedArea.height = (sourceArea.height * sourceScale.y) + (dstOffset.y + this.topPixels);
            dstOffset.z = this.rightPixels;
            dstOffset.w = this.topPixels;
        };
        return PrimitiveThickness;
    }());
    PrimitiveThickness.Auto = 0x1;
    PrimitiveThickness.Inherit = 0x2;
    PrimitiveThickness.Percentage = 0x4;
    PrimitiveThickness.Pixel = 0x8;
    PrimitiveThickness.ComputeH = 0x1;
    PrimitiveThickness.ComputeV = 0x2;
    PrimitiveThickness.ComputeAll = 0x03;
    PrimitiveThickness = PrimitiveThickness_1 = __decorate([
        BABYLON.className("PrimitiveThickness", "BABYLON")
    ], PrimitiveThickness);
    BABYLON.PrimitiveThickness = PrimitiveThickness;
    /**
     * Main class used for the Primitive Intersection API
     */
    var IntersectInfo2D = (function () {
        function IntersectInfo2D() {
            this.findFirstOnly = false;
            this.intersectHidden = false;
            this.pickPosition = BABYLON.Vector2.Zero();
        }
        Object.defineProperty(IntersectInfo2D.prototype, "isIntersected", {
            /**
             * true if at least one primitive intersected during the test
             */
            get: function () {
                return this.intersectedPrimitives && this.intersectedPrimitives.length > 0;
            },
            enumerable: true,
            configurable: true
        });
        IntersectInfo2D.prototype.isPrimIntersected = function (prim) {
            for (var _i = 0, _a = this.intersectedPrimitives; _i < _a.length; _i++) {
                var cur = _a[_i];
                if (cur.prim === prim) {
                    return cur.intersectionLocation;
                }
            }
            return null;
        };
        // Internals, don't use
        IntersectInfo2D.prototype._exit = function (firstLevel) {
            if (firstLevel) {
                this._globalPickPosition = null;
            }
        };
        return IntersectInfo2D;
    }());
    BABYLON.IntersectInfo2D = IntersectInfo2D;
    var Prim2DBase = Prim2DBase_1 = (function (_super) {
        __extends(Prim2DBase, _super);
        function Prim2DBase(settings) {
            var _this = this;
            // Avoid checking every time if the object exists
            if (settings == null) {
                settings = {};
            }
            // BASE CLASS CALL
            _this = _super.call(this) || this;
            // Fetch the owner, parent. There're many ways to do it and we can end up with nothing for both
            var owner;
            var parent;
            if (Prim2DBase_1._isCanvasInit) {
                owner = _this;
                parent = null;
                _this._canvasPreInit(settings);
            }
            else {
                if (settings.parent != null) {
                    parent = settings.parent;
                    owner = settings.parent.owner;
                    if (!owner) {
                        throw new Error("Parent " + parent.id + " of " + settings.id + " doesn't have a valid owner!");
                    }
                    if (!(_this instanceof BABYLON.Group2D) && !(_this instanceof BABYLON.Sprite2D && settings.id != null && settings.id.indexOf("__cachedSpriteOfGroup__") === 0) && (owner.cachingStrategy === BABYLON.Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) && (parent === owner)) {
                        throw new Error("Can't create a primitive with the canvas as direct parent when the caching strategy is TOPLEVELGROUPS. You need to create a Group below the canvas and use it as the parent for the primitive");
                    }
                }
            }
            // Fields initialization
            _this._layoutEngine = BABYLON.CanvasLayoutEngine.Singleton;
            _this._size = null; //Size.Zero();
            _this._scale = new BABYLON.Vector2(1, 1);
            _this._postScale = new BABYLON.Vector2(1, 1);
            _this._actualSize = null;
            _this._internalSize = BABYLON.Size.Zero();
            _this._layoutArea = null;
            _this._layoutAreaPos = null;
            _this._layoutBoundingInfo = null;
            _this._marginOffset = BABYLON.Vector4.Zero();
            _this._paddingOffset = BABYLON.Vector4.Zero();
            _this._parentPaddingOffset = BABYLON.Vector2.Zero();
            _this._parentContentArea = BABYLON.Size.Zero();
            _this._lastAutoSizeArea = BABYLON.Size.Zero();
            _this._contentArea = BABYLON.Size.Zero();
            _this._marginSize = null;
            _this._pointerEventObservable = new BABYLON.Observable();
            _this._owner = owner;
            _this._parent = null;
            _this._margin = null;
            _this._padding = null;
            _this._marginAlignment = null;
            _this._id = settings.id;
            _this._children = new Array();
            _this._localTransform = new BABYLON.Matrix();
            _this._localLayoutTransform = new BABYLON.Matrix();
            _this._globalTransform = null;
            _this._invGlobalTransform = null;
            _this._globalTransformProcessStep = 0;
            _this._globalTransformStep = 0;
            _this._renderGroup = null;
            _this._primLinearPosition = 0;
            _this._manualZOrder = null;
            _this._zOrder = 0;
            _this._zMax = 0;
            _this._firstZDirtyIndex = Prim2DBase_1._bigInt;
            _this._actualOpacity = 0;
            _this._actualScale = BABYLON.Vector2.Zero();
            _this._displayDebugAreas = false;
            _this._debugAreaGroup = null;
            _this._primTriArray = null;
            _this._primTriArrayDirty = true;
            if (owner) {
                _this.onSetOwner();
            }
            _this._levelBoundingInfo.worldMatrixAccess = function () { return _this.globalTransform; };
            _this._boundingInfo.worldMatrixAccess = function () { return _this.globalTransform; };
            var isPickable = true;
            var isContainer = true;
            if (settings.isPickable !== undefined) {
                isPickable = settings.isPickable;
            }
            if (settings.isContainer !== undefined) {
                isContainer = settings.isContainer;
            }
            if (settings.dontInheritParentScale) {
                _this._setFlags(BABYLON.SmartPropertyPrim.flagDontInheritParentScale);
            }
            _this._setFlags((isPickable ? BABYLON.SmartPropertyPrim.flagIsPickable : 0) | BABYLON.SmartPropertyPrim.flagBoundingInfoDirty | BABYLON.SmartPropertyPrim.flagActualOpacityDirty | (isContainer ? BABYLON.SmartPropertyPrim.flagIsContainer : 0) | BABYLON.SmartPropertyPrim.flagActualScaleDirty | BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty);
            if (settings.opacity != null) {
                _this._opacity = settings.opacity;
            }
            else {
                _this._opacity = 1;
            }
            _this._updateRenderMode();
            if (settings.childrenFlatZOrder) {
                _this._setFlags(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
            }
            // If the parent is given, initialize the hierarchy/owner related data
            if (parent != null) {
                parent.addChild(_this);
                _this._hierarchyDepth = parent._hierarchyDepth + 1;
                _this._patchHierarchy(parent.owner);
            }
            // If it's a group, detect its own states
            if (_this.owner && _this instanceof BABYLON.Group2D) {
                var group = _this;
                group.detectGroupStates();
            }
            // Time to insert children if some are specified
            if (settings.children != null) {
                for (var _i = 0, _a = settings.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    _this.addChild(child);
                    // Good time to patch the hierarchy, it won't go very far if there's no need to
                    if (_this.owner != null && _this._hierarchyDepth != null) {
                        child._patchHierarchy(_this.owner);
                    }
                }
            }
            if (settings.zOrder != null) {
                _this.zOrder = settings.zOrder;
            }
            // Set the model related properties
            if (settings.position != null) {
                _this.position = settings.position;
            }
            else if (settings.x != null || settings.y != null) {
                _this.position = new BABYLON.Vector2(settings.x || 0, settings.y || 0);
            }
            else {
                _this._position = null;
            }
            _this.rotation = (settings.rotation == null) ? 0 : settings.rotation;
            if (settings.scale != null) {
                _this.scale = settings.scale;
            }
            else {
                if (settings.scaleX != null) {
                    _this.scaleX = settings.scaleX;
                }
                if (settings.scaleY != null) {
                    _this.scaleY = settings.scaleY;
                }
            }
            _this.levelVisible = (settings.isVisible == null) ? true : settings.isVisible;
            _this.origin = settings.origin || new BABYLON.Vector2(0.5, 0.5);
            // Layout Engine
            if (settings.layoutEngine != null) {
                if (typeof settings.layoutEngine === "string") {
                    var name_1 = settings.layoutEngine.toLocaleLowerCase().trim();
                    if (name_1 === "canvas" || name_1 === "canvaslayoutengine") {
                        _this.layoutEngine = BABYLON.CanvasLayoutEngine.Singleton;
                    }
                    else if (name_1.indexOf("stackpanel") === 0 || name_1.indexOf("horizontalstackpanel") === 0) {
                        _this.layoutEngine = BABYLON.StackPanelLayoutEngine.Horizontal;
                    }
                    else if (name_1.indexOf("verticalstackpanel") === 0) {
                        _this.layoutEngine = BABYLON.StackPanelLayoutEngine.Vertical;
                    }
                }
                else if (settings.layoutEngine instanceof BABYLON.LayoutEngineBase) {
                    _this.layoutEngine = settings.layoutEngine;
                }
            }
            // Set the layout/margin stuffs
            if (settings.marginTop) {
                _this.margin.setTop(settings.marginTop);
            }
            if (settings.marginLeft) {
                _this.margin.setLeft(settings.marginLeft);
            }
            if (settings.marginRight) {
                _this.margin.setRight(settings.marginRight);
            }
            if (settings.marginBottom) {
                _this.margin.setBottom(settings.marginBottom);
            }
            if (settings.margin) {
                if (typeof settings.margin === "string") {
                    _this.margin.fromString(settings.margin);
                }
                else {
                    _this.margin.fromUniformPixels(settings.margin);
                }
            }
            if (settings.marginHAlignment) {
                _this.marginAlignment.horizontal = settings.marginHAlignment;
            }
            if (settings.marginVAlignment) {
                _this.marginAlignment.vertical = settings.marginVAlignment;
            }
            if (settings.marginAlignment) {
                _this.marginAlignment.fromString(settings.marginAlignment);
            }
            if (settings.paddingTop) {
                _this.padding.setTop(settings.paddingTop);
            }
            if (settings.paddingLeft) {
                _this.padding.setLeft(settings.paddingLeft);
            }
            if (settings.paddingRight) {
                _this.padding.setRight(settings.paddingRight);
            }
            if (settings.paddingBottom) {
                _this.padding.setBottom(settings.paddingBottom);
            }
            if (settings.padding) {
                if (typeof settings.padding === "string") {
                    _this.padding.fromString(settings.padding);
                }
                else {
                    _this.padding.fromUniformPixels(settings.padding);
                }
            }
            if (settings.layoutData) {
                _this.layoutData = settings.layoutData;
            }
            _this._updatePositioningState();
            // Dirty layout and positioning
            _this._parentLayoutDirty();
            _this._positioningDirty();
            // Add in the PCM
            if (settings.levelCollision || settings.deepCollision) {
                _this._actorInfo = _this.owner._primitiveCollisionManager._addActor(_this, settings.deepCollision === true);
                _this._setFlags(BABYLON.SmartPropertyPrim.flagCollisionActor);
            }
            else {
                _this._actorInfo = null;
            }
            return _this;
        }
        Object.defineProperty(Prim2DBase.prototype, "intersectWithObservable", {
            /**
             * Return the ChangedDictionary observable of the StringDictionary containing the primitives intersecting with this one
             */
            get: function () {
                if (!this._actorInfo) {
                    return null;
                }
                return this._actorInfo.intersectWith.dictionaryChanged;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "intersectWith", {
            /**
             * Return the ObservableStringDictionary containing all the primitives intersecting with this one.
             * The key is the primitive uid, the value is the ActorInfo object
             * @returns {}
             */
            get: function () {
                if (!this._actorInfo) {
                    return null;
                }
                return this._actorInfo.intersectWith;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actionManager", {
            get: function () {
                if (!this._actionManager) {
                    this._actionManager = new BABYLON.ActionManager(this.owner.scene);
                }
                return this._actionManager;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * From 'this' primitive, traverse up (from parent to parent) until the given predicate is true
         * @param predicate the predicate to test on each parent
         * @return the first primitive where the predicate was successful
         */
        Prim2DBase.prototype.traverseUp = function (predicate) {
            var p = this;
            while (p != null) {
                if (predicate(p)) {
                    return p;
                }
                p = p._parent;
            }
            return null;
        };
        Object.defineProperty(Prim2DBase.prototype, "owner", {
            /**
             * Retrieve the owner Canvas2D
             */
            get: function () {
                return this._owner;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "parent", {
            /**
             * Get the parent primitive (can be the Canvas, only the Canvas has no parent)
             */
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "children", {
            /**
             * The array of direct children primitives
             */
            get: function () {
                return this._children;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "id", {
            /**
             * The identifier of this primitive, may not be unique, it's for information purpose only
             */
            get: function () {
                return this._id;
            },
            set: function (value) {
                if (this._id === value) {
                    return;
                }
                var oldValue = this._id;
                this.onPropertyChanged("id", oldValue, this._id);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualPosition", {
            get: function () {
                // If we don't use positioning engine the actual position is the position
                if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagUsePositioning)) {
                    return this.position;
                }
                // We use the positioning engine, if the variable is fetched, it's up to date, return it
                if (this._actualPosition != null) {
                    return this._actualPosition;
                }
                this._updatePositioning();
                return this._actualPosition;
            },
            /**
             * DO NOT INVOKE for internal purpose only
             */
            set: function (val) {
                if (!this._actualPosition) {
                    this._actualPosition = val.clone();
                }
                else {
                    this._actualPosition.copyFrom(val);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualX", {
            /**
             * Shortcut to actualPosition.x
             */
            get: function () {
                return this.actualPosition.x;
            },
            set: function (val) {
                this._actualPosition.x = val;
                this._triggerPropertyChanged(Prim2DBase_1.actualPositionProperty, this._actualPosition);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualY", {
            /**
             * Shortcut to actualPosition.y
             */
            get: function () {
                return this.actualPosition.y;
            },
            set: function (val) {
                this._actualPosition.y = val;
                this._triggerPropertyChanged(Prim2DBase_1.actualPositionProperty, this._actualPosition);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "position", {
            /**
             * Position of the primitive, relative to its parent.
             * BEWARE: if you change only position.x or y it won't trigger a property change and you won't have the expected behavior.
             * Use this property to set a new Vector2 object, otherwise to change only the x/y use Prim2DBase.x or y properties.
             * Setting this property may have no effect is specific alignment are in effect.
             */
            get: function () {
                if (!this._position) {
                    this._position = BABYLON.Vector2.Zero();
                }
                return this._position;
            },
            set: function (value) {
                if (!this._checkPositionChange()) {
                    return;
                }
                if (!value) {
                    this._position = null;
                }
                else {
                    if (!this._position) {
                        this._position = value.clone();
                    }
                    else {
                        this._position.copyFrom(value);
                    }
                }
                this._actualPosition = null;
                this._triggerPropertyChanged(Prim2DBase_1.actualPositionProperty, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "x", {
            /**
             * Direct access to the position.x value of the primitive
             * Use this property when you only want to change one component of the position property
             */
            get: function () {
                if (!this._position) {
                    return null;
                }
                return this._position.x;
            },
            set: function (value) {
                if (!this._checkPositionChange()) {
                    return;
                }
                if (value == null) {
                    throw new Error("Can't set a null x in primitive " + this.id + ", only the position can be turned to null");
                }
                if (!this._position) {
                    this._position = BABYLON.Vector2.Zero();
                }
                if (this._position.x === value) {
                    return;
                }
                this._position.x = value;
                this._actualPosition = null;
                this._triggerPropertyChanged(Prim2DBase_1.positionProperty, value);
                this._triggerPropertyChanged(Prim2DBase_1.actualPositionProperty, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "y", {
            /**
             * Direct access to the position.y value of the primitive
             * Use this property when you only want to change one component of the position property
             */
            get: function () {
                if (!this._position) {
                    return null;
                }
                return this._position.y;
            },
            set: function (value) {
                if (!this._checkPositionChange()) {
                    return;
                }
                if (value == null) {
                    throw new Error("Can't set a null y in primitive " + this.id + ", only the position can be turned to null");
                }
                if (!this._position) {
                    this._position = BABYLON.Vector2.Zero();
                }
                if (this._position.y === value) {
                    return;
                }
                this._position.y = value;
                this._actualPosition = null;
                this._triggerPropertyChanged(Prim2DBase_1.positionProperty, value);
                this._triggerPropertyChanged(Prim2DBase_1.actualPositionProperty, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "size", {
            /**
             * Size of the primitive or its bounding area
             * BEWARE: if you change only size.width or height it won't trigger a property change and you won't have the expected behavior.
             * Use this property to set a new Size object, otherwise to change only the width/height use Prim2DBase.width or height properties.
             */
            get: function () {
                return this.internalGetSize();
            },
            set: function (value) {
                this.internalSetSize(value);
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype.internalGetSize = function () {
            if (!this._size || this._size.width == null || this._size.height == null) {
                var bbr = Prim2DBase_1.boundinbBoxReentrency;
                if (bbr !== -1 && bbr <= (this.hierarchyDepth || 0)) {
                    return Prim2DBase_1.nullSize;
                }
                if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty)) {
                    return this._internalSize;
                }
                Prim2DBase_1.boundinbBoxReentrency = this.hierarchyDepth || 0;
                var b = this.layoutBoundingInfo;
                Prim2DBase_1.boundinbBoxReentrency = -1;
                Prim2DBase_1._size.copyFrom(this._internalSize);
                b.sizeToRef(this._internalSize);
                if (!this._internalSize.equals(Prim2DBase_1._size)) {
                    this._triggerPropertyChanged(Prim2DBase_1.sizeProperty, this._internalSize);
                    this._positioningDirty();
                }
                return this._internalSize || Prim2DBase_1._nullSize;
            }
            return this._size || Prim2DBase_1._nullSize;
        };
        Prim2DBase.prototype.internalSetSize = function (value) {
            if (!value) {
                this._size = null;
            }
            else {
                if (!this._size) {
                    this._size = value.clone();
                }
                else {
                    this._size.copyFrom(value);
                }
            }
            this._actualSize = null;
            this._updatePositioningState();
            this._positioningDirty();
        };
        Object.defineProperty(Prim2DBase.prototype, "width", {
            /**
             * Direct access to the size.width value of the primitive
             * Use this property when you only want to change one component of the size property
             */
            get: function () {
                if (!this.size) {
                    return null;
                }
                return this.size.width;
            },
            set: function (value) {
                if (this.size && this.size.width === value) {
                    return;
                }
                if (!this.size) {
                    this.size = new BABYLON.Size(value, 0);
                }
                else {
                    this.size.width = value;
                }
                this._actualSize = null;
                this._triggerPropertyChanged(Prim2DBase_1.sizeProperty, value);
                this._positioningDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "height", {
            /**
             * Direct access to the size.height value of the primitive
             * Use this property when you only want to change one component of the size property
             */
            get: function () {
                if (!this.size) {
                    return null;
                }
                return this.size.height;
            },
            set: function (value) {
                if (this.size && this.size.height === value) {
                    return;
                }
                if (!this.size) {
                    this.size = new BABYLON.Size(0, value);
                }
                else {
                    this.size.height = value;
                }
                this._actualSize = null;
                this._triggerPropertyChanged(Prim2DBase_1.sizeProperty, value);
                this._positioningDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "rotation", {
            get: function () {
                return this._rotation;
            },
            set: function (value) {
                this._rotation = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "scale", {
            get: function () {
                return this._scale.x;
            },
            set: function (value) {
                this._scale.x = this._scale.y = value;
                this._setFlags(BABYLON.SmartPropertyPrim.flagActualScaleDirty);
                this._spreadActualScaleDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualSize", {
            /**
             * Return the size of the primitive as it's being rendered into the target.
             * This value may be different of the size property when layout/alignment is used or specific primitive types can implement a custom logic through this property.
             * BEWARE: don't use the setter, it's for internal purpose only
             * Note to implementers: you have to override this property and declare if necessary a @xxxxInstanceLevel decorator
             */
            get: function () {
                // If we don't use positioning engine the actual size is the size
                if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagUsePositioning)) {
                    return this.size;
                }
                // We use the positioning engine, if the variable is fetched, it's up to date, return it
                if (this._actualSize) {
                    return this._actualSize;
                }
                this._updatePositioning();
                return this._actualSize;
            },
            set: function (value) {
                if (this._actualSize && this._actualSize.equals(value)) {
                    return;
                }
                if (!this._actualSize) {
                    this._actualSize = value.clone();
                }
                else {
                    this._actualSize.copyFrom(value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualWidth", {
            /**
             * Shortcut to actualSize.width
             */
            get: function () {
                return this.actualSize.width;
            },
            set: function (val) {
                this._actualSize.width = val;
                this._triggerPropertyChanged(Prim2DBase_1.actualSizeProperty, this._actualSize);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualHeight", {
            /**
             * Shortcut to actualPosition.height
             */
            get: function () {
                return this.actualSize.height;
            },
            set: function (val) {
                this._actualSize.height = val;
                this._triggerPropertyChanged(Prim2DBase_1.actualPositionProperty, this._actualSize);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualZOffset", {
            get: function () {
                if (this._manualZOrder != null) {
                    return this._manualZOrder;
                }
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                    this._updateZOrder();
                }
                return (1 - this._zOrder);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "minSize", {
            /**
             * Get or set the minimal size the Layout Engine should respect when computing the primitive's actualSize.
             * The Primitive's size won't be less than specified.
             * The default value depends of the Primitive type
             */
            get: function () {
                return this._minSize;
            },
            set: function (value) {
                if (this._minSize && value && this._minSize.equals(value)) {
                    return;
                }
                if (!this._minSize) {
                    this._minSize = value.clone();
                }
                else {
                    this._minSize.copyFrom(value);
                }
                this._parentLayoutDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "maxSize", {
            /**
             * Get or set the maximal size the Layout Engine should respect when computing the primitive's actualSize.
             * The Primitive's size won't be more than specified.
             * The default value depends of the Primitive type
             */
            get: function () {
                return this._maxSize;
            },
            set: function (value) {
                if (this._maxSize && value && this._maxSize.equals(value)) {
                    return;
                }
                if (!this._maxSize) {
                    this._maxSize = value.clone();
                }
                else {
                    this._maxSize.copyFrom(value);
                }
                this._parentLayoutDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "origin", {
            /**
             * The origin defines the normalized coordinate of the center of the primitive, from the bottom/left corner.
             * The origin is used only to compute transformation of the primitive, it has no meaning in the primitive local frame of reference
             * For instance:
             * 0,0 means the center is bottom/left. Which is the default for Canvas2D instances
             * 0.5,0.5 means the center is at the center of the primitive, which is default of all types of Primitives
             * 0,1 means the center is top/left
             * @returns The normalized center.
             */
            get: function () {
                return this._origin;
            },
            set: function (value) {
                if (!this._origin) {
                    this._origin = value.clone();
                }
                else {
                    this._origin.copyFrom(value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "levelVisible", {
            get: function () {
                return this._isFlagSet(BABYLON.SmartPropertyPrim.flagLevelVisible);
            },
            set: function (value) {
                this._changeFlags(BABYLON.SmartPropertyPrim.flagLevelVisible, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isVisible", {
            get: function () {
                return this._isFlagSet(BABYLON.SmartPropertyPrim.flagIsVisible);
            },
            set: function (value) {
                this._changeFlags(BABYLON.SmartPropertyPrim.flagIsVisible, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "zOrder", {
            get: function () {
                return this._manualZOrder;
            },
            set: function (value) {
                if (this._manualZOrder === value) {
                    return;
                }
                this._manualZOrder = value;
                this.onZOrderChanged();
                if (this._actualZOrderChangedObservable && this._actualZOrderChangedObservable.hasObservers()) {
                    this._actualZOrderChangedObservable.notifyObservers(value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isManualZOrder", {
            get: function () {
                return this._manualZOrder != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "margin", {
            get: function () {
                var _this = this;
                if (!this._margin) {
                    this._margin = new PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.margin;
                    }, function () { return _this._positioningDirty(); });
                    this._updatePositioningState();
                }
                return this._margin;
            },
            set: function (value) {
                if (!value) {
                    this._margin = null;
                }
                else {
                    this.margin.copyFrom(value);
                }
                this._updatePositioningState();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "_hasMargin", {
            /**
             * Check for both margin and marginAlignment, return true if at least one of them is specified with a non default value
             */
            get: function () {
                return (this._margin !== null && !this._margin.isDefault) || (this._marginAlignment !== null && !this._marginAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "padding", {
            get: function () {
                var _this = this;
                if (!this._padding) {
                    this._padding = new PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.padding;
                    }, function () { return _this._positioningDirty(); });
                    this._updatePositioningState();
                }
                return this._padding;
            },
            set: function (value) {
                if (!value) {
                    this._padding = null;
                }
                else {
                    this.padding.copyFrom(value);
                }
                this._updatePositioningState();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "_hasPadding", {
            get: function () {
                return this._padding !== null && !this._padding.isDefault;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "marginAlignment", {
            get: function () {
                var _this = this;
                if (!this._marginAlignment) {
                    this._marginAlignment = new PrimitiveAlignment(function () { return _this._positioningDirty(); });
                    this._updatePositioningState();
                }
                return this._marginAlignment;
            },
            set: function (value) {
                if (!value) {
                    this._marginAlignment = null;
                }
                else {
                    this.marginAlignment.copyFrom(value);
                }
                this._updatePositioningState();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "_hasMarginAlignment", {
            /**
             * Check if there a marginAlignment specified (non null and not default)
             */
            get: function () {
                return (this._marginAlignment !== null && !this._marginAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype._updatePositioningState = function () {
            var value = this._hasMargin || this._hasPadding || this.isSizeAuto;
            //            console.log(`${this.id} with parent ${this._parent ? this._parent.id : "[none]"} state: ${value} `);
            this._changeFlags(BABYLON.SmartPropertyPrim.flagUsePositioning, value);
        };
        Object.defineProperty(Prim2DBase.prototype, "opacity", {
            get: function () {
                return this._opacity;
            },
            set: function (value) {
                if (value < 0) {
                    value = 0;
                }
                else if (value > 1) {
                    value = 1;
                }
                if (this._opacity === value) {
                    return;
                }
                this._opacity = value;
                this._setFlags(BABYLON.SmartPropertyPrim.flagActualOpacityDirty);
                this._spreadActualOpacityChanged();
                this._updateRenderMode();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "scaleX", {
            get: function () {
                return this._scale.x;
            },
            set: function (value) {
                this._scale.x = value;
                this._setFlags(BABYLON.SmartPropertyPrim.flagActualScaleDirty);
                this._spreadActualScaleDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "scaleY", {
            get: function () {
                return this._scale.y;
            },
            set: function (value) {
                this._scale.y = value;
                this._setFlags(BABYLON.SmartPropertyPrim.flagActualScaleDirty);
                this._spreadActualScaleDirty();
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype._spreadActualScaleDirty = function () {
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child._setFlags(BABYLON.SmartPropertyPrim.flagActualScaleDirty);
                child._spreadActualScaleDirty();
            }
        };
        Object.defineProperty(Prim2DBase.prototype, "actualScale", {
            /**
             * Returns the actual scale of this Primitive, the value is computed from the scale property of this primitive, multiplied by the actualScale of its parent one (if any). The Vector2 object returned contains the scale for both X and Y axis
             */
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagActualScaleDirty)) {
                    var cur = this._isFlagSet(BABYLON.SmartPropertyPrim.flagDontInheritParentScale) ? null : this.parent;
                    var sx = this.scaleX;
                    var sy = this.scaleY;
                    while (cur) {
                        sx *= cur.scaleX;
                        sy *= cur.scaleY;
                        cur = cur._isFlagSet(BABYLON.SmartPropertyPrim.flagDontInheritParentScale) ? null : cur.parent;
                    }
                    this._actualScale.copyFromFloats(sx, sy);
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagActualScaleDirty);
                }
                return this._actualScale;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualScaleX", {
            /**
             * Get the actual Scale of the X axis, shortcut for this.actualScale.x
             */
            get: function () {
                return this.actualScale.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualScaleY", {
            /**
             * Get the actual Scale of the Y axis, shortcut for this.actualScale.y
             */
            get: function () {
                return this.actualScale.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "actualOpacity", {
            /**
             * Get the actual opacity level, this property is computed from the opacity property, multiplied by the actualOpacity of its parent (if any)
             */
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagActualOpacityDirty)) {
                    var cur = this.parent;
                    var op = this.opacity;
                    while (cur) {
                        op *= cur.opacity;
                        cur = cur.parent;
                    }
                    this._actualOpacity = op;
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagActualOpacityDirty);
                }
                return this._actualOpacity;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "layoutEngine", {
            /**
             * Get/set the layout engine to use for this primitive.
             * The default layout engine is the CanvasLayoutEngine.
             */
            get: function () {
                if (!this._layoutEngine) {
                    this._layoutEngine = BABYLON.CanvasLayoutEngine.Singleton;
                }
                return this._layoutEngine;
            },
            set: function (value) {
                if (this._layoutEngine === value) {
                    return;
                }
                this._changeLayoutEngine(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "layoutArea", {
            /**
             * Get/set the layout are of this primitive.
             * The Layout area is the zone allocated by the Layout Engine for this particular primitive. Margins/Alignment will be computed based on this area.
             * The setter should only be called by a Layout Engine class.
             */
            get: function () {
                return this._layoutArea;
            },
            set: function (val) {
                if (this._layoutArea && this._layoutArea.equals(val)) {
                    return;
                }
                this._positioningDirty();
                this._setFlags(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty);
                if (this.parent) {
                    this.parent._setFlags(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty | BABYLON.SmartPropertyPrim.flagGlobalTransformDirty);
                }
                if (!this._layoutArea) {
                    this._layoutArea = val.clone();
                }
                else {
                    this._layoutArea.copyFrom(val);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "layoutAreaPos", {
            /**
             * Get/set the layout area position (relative to the parent primitive).
             * The setter should only be called by a Layout Engine class.
             */
            get: function () {
                return this._layoutAreaPos;
            },
            set: function (val) {
                if (this._layoutAreaPos && this._layoutAreaPos.equals(val)) {
                    return;
                }
                if (this.parent) {
                    this.parent._setFlags(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty | BABYLON.SmartPropertyPrim.flagGlobalTransformDirty);
                }
                this._positioningDirty();
                if (!this._layoutAreaPos) {
                    this._layoutAreaPos = val.clone();
                }
                else {
                    this._layoutAreaPos.copyFrom(val);
                }
                this._setFlags(BABYLON.SmartPropertyPrim.flagLocalTransformDirty);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isPickable", {
            /**
             * Define if the Primitive can be subject to intersection test or not (default is true)
             */
            get: function () {
                return this._isFlagSet(BABYLON.SmartPropertyPrim.flagIsPickable);
            },
            set: function (value) {
                this._changeFlags(BABYLON.SmartPropertyPrim.flagIsPickable, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isContainer", {
            /**
             * Define if the Primitive acts as a container or not
             * A container will encapsulate its children for interaction event.
             * If it's not a container events will be process down to children if the primitive is not pickable.
             * Default value is true
             */
            get: function () {
                return this._isFlagSet(BABYLON.SmartPropertyPrim.flagIsContainer);
            },
            set: function (value) {
                this._changeFlags(BABYLON.SmartPropertyPrim.flagIsContainer, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "hierarchyDepth", {
            /**
             * Return the depth level of the Primitive into the Canvas' Graph. A Canvas will be 0, its direct children 1, and so on.
             */
            get: function () {
                return this._hierarchyDepth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "renderGroup", {
            /**
             * Retrieve the Group that is responsible to render this primitive
             */
            get: function () {
                return this._renderGroup;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "globalTransform", {
            /**
             * Get the global transformation matrix of the primitive
             */
            get: function () {
                if (this._globalTransformProcessStep !== this.owner._globalTransformProcessStep) {
                    this.updateCachedStates(false);
                }
                return this._globalTransform;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * return the global position of the primitive, relative to its canvas
         */
        Prim2DBase.prototype.getGlobalPosition = function () {
            var v = new BABYLON.Vector2(0, 0);
            this.getGlobalPositionByRef(v);
            return v;
        };
        /**
         * return the global position of the primitive, relative to its canvas
         * @param v the valid Vector2 object where the global position will be stored
         */
        Prim2DBase.prototype.getGlobalPositionByRef = function (v) {
            v.x = this.globalTransform.m[12];
            v.y = this.globalTransform.m[13];
        };
        Object.defineProperty(Prim2DBase.prototype, "invGlobalTransform", {
            /**
             * Get invert of the global transformation matrix of the primitive
             */
            get: function () {
                this._updateLocalTransform();
                return this._invGlobalTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "localTransform", {
            /**
             * Get the local transformation of the primitive
             */
            get: function () {
                this._updateLocalTransform();
                return this._localTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "localLayoutTransform", {
            get: function () {
                this._updateLocalTransform();
                return this._localLayoutTransform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "boundingInfo", {
            /**
             * Get the boundingInfo associated to the primitive and its children.
             * The value is supposed to be always up to date
             */
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagBoundingInfoDirty)) {
                    if (this.owner) {
                        this.owner.boundingInfoRecomputeCounter.addCount(1, false);
                    }
                    var sizedByContent = this.isSizedByContent;
                    if (sizedByContent) {
                        this._boundingInfo.clear();
                    }
                    else {
                        this._boundingInfo.copyFrom(this.levelBoundingInfo);
                        if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagLevelBoundingInfoDirty)) {
                            return this._boundingInfo;
                        }
                    }
                    var bi = this._boundingInfo;
                    var tps = new BABYLON.BoundingInfo2D();
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var curChild = _a[_i];
                        var bb = curChild.boundingInfo;
                        bb.transformToRef(curChild.localTransform, tps);
                        bi.unionToRef(tps, bi);
                    }
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagBoundingInfoDirty);
                }
                return this._boundingInfo;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "layoutBoundingInfo", {
            /**
             * Get the boundingInfo of the primitive's content arranged by a layout Engine
             * If a particular child is not arranged by layout, it's boundingInfo is used instead to produce something as accurate as possible
             */
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty)) {
                    if (this._owner) {
                        this._owner.addLayoutBoundingInfoUpdateCounter(1);
                    }
                    if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty)) {
                        this.owner.addUpdateLayoutCounter(1);
                        this._layoutEngine.updateLayout(this);
                        this._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
                    }
                    var lbb = new BABYLON.BoundingInfo2D();
                    var sizedByContent = this.isSizedByContent;
                    if (sizedByContent) {
                        lbb.clear();
                    }
                    else {
                        BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.marginSize, lbb);
                    }
                    var tps = Prim2DBase_1._tpsBB;
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var curChild = _a[_i];
                        if (curChild._isFlagSet(BABYLON.SmartPropertyPrim.flagNoPartOfLayout)) {
                            continue;
                        }
                        var bb = curChild.layoutBoundingInfo;
                        bb.transformToRef(curChild.localLayoutTransform, tps);
                        lbb.unionToRef(tps, lbb);
                    }
                    // Update content area
                    Prim2DBase_1._curContentArea.copyFrom(this._contentArea);
                    var size = Prim2DBase_1._size2;
                    lbb.sizeToRef(this._contentArea);
                    lbb.sizeToRef(size);
                    if (!Prim2DBase_1._curContentArea.equals(this._contentArea)) {
                        this._setLayoutDirty();
                    }
                    // Apply padding
                    if (this._hasPadding) {
                        var padding = this.padding;
                        size.width += padding.leftPixels + padding.rightPixels;
                        size.height += padding.bottomPixels + padding.topPixels;
                        this._paddingOffset.copyFromFloats(padding.leftPixels, padding.bottomPixels, padding.rightPixels, padding.topPixels);
                        this._getActualSizeFromContentToRef(size, this._paddingOffset, size);
                        BABYLON.BoundingInfo2D.CreateFromSizeToRef(size, lbb);
                    }
                    else {
                        this._paddingOffset.copyFromFloats(0, 0, 0, 0);
                    }
                    // Check if the layoutBoundingInfo changed
                    var changed = false;
                    if (!this._layoutBoundingInfo) {
                        this._layoutBoundingInfo = lbb.clone();
                        changed = true;
                    }
                    else if (!this._layoutBoundingInfo.equals(lbb)) {
                        this._layoutBoundingInfo.copyFrom(lbb);
                        changed = true;
                    }
                    if (changed) {
                        var p = this._parent;
                        while (p) {
                            if (p.isSizedByContent) {
                                p._setFlags(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty);
                                p.onPrimitivePropertyDirty(Prim2DBase_1.actualSizeProperty.flagId);
                            }
                            else {
                                break;
                            }
                            p = p._parent;
                        }
                        this.onPrimitivePropertyDirty(Prim2DBase_1.actualSizeProperty.flagId);
                    }
                    //console.log(`Compute BoundingLayout of ${this.id}, extent: ${this._layoutBoundingInfo.extent}`);
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty);
                }
                return this._layoutBoundingInfo;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isSizeAuto", {
            /**
             * Determine if the size is automatically computed or fixed because manually specified.
             * Use the actualSize property to get the final/real size of the primitive
             * @returns true if the size is automatically computed, false if it were manually specified.
             */
            get: function () {
                var size = this._size;
                return size == null || (size.width == null && size.height == null);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isHorizontalSizeAuto", {
            /**
             * Determine if the horizontal size is automatically computed or fixed because manually specified.
             * Use the actualSize property to get the final/real size of the primitive
             * @returns true if the horizontal size is automatically computed, false if it were manually specified.
             */
            get: function () {
                var size = this._size;
                return size == null || size.width == null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isVerticalSizeAuto", {
            /**
             * Determine if the vertical size is automatically computed or fixed because manually specified.
             * Use the actualSize property to get the final/real size of the primitive
             * @returns true if the vertical size is automatically computed, false if it were manually specified.
             */
            get: function () {
                var size = this._size;
                return size == null || size.height == null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isSizedByContent", {
            /**
             * Return true if this prim has an auto size which is set by the children's global bounding box
             */
            get: function () {
                return (this._size == null) && (this._children.length > 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "isPositionAuto", {
            /**
             * Determine if the position is automatically computed or fixed because manually specified.
             * Use the actualPosition property to get the final/real position of the primitive
             * @returns true if the position is automatically computed, false if it were manually specified.
             */
            get: function () {
                return this._position == null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "pointerEventObservable", {
            /**
             * Interaction with the primitive can be create using this Observable. See the PrimitivePointerInfo class for more information
             */
            get: function () {
                return this._pointerEventObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "zActualOrderChangedObservable", {
            get: function () {
                if (!this._actualZOrderChangedObservable) {
                    this._actualZOrderChangedObservable = new BABYLON.Observable();
                }
                return this._actualZOrderChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "displayDebugAreas", {
            get: function () {
                return this._displayDebugAreas;
            },
            set: function (value) {
                if (this._displayDebugAreas === value) {
                    return;
                }
                if (value === false) {
                    this._debugAreaGroup.dispose();
                    this._debugAreaGroup = null;
                }
                else {
                    var layoutFill = "#F0808040"; // Red - Layout area
                    var layoutBorder = "#F08080FF";
                    var marginFill = "#F0F04040"; // Yellow - Margin area
                    var marginBorder = "#F0F040FF";
                    var paddingFill = "#F040F040"; // Magenta - Padding Area
                    var paddingBorder = "#F040F0FF";
                    var contentFill = "#40F0F040"; // Cyan - Content area
                    var contentBorder = "#40F0F0FF";
                    var s = new BABYLON.Size(10, 10);
                    var p = BABYLON.Vector2.Zero();
                    this._debugAreaGroup = new BABYLON.Group2D({ dontInheritParentScale: true,
                        parent: (this.parent != null) ? this.parent : this, id: "###DEBUG AREA GROUP###", children: [
                            new BABYLON.Group2D({
                                id: "###Layout Area###", position: p, size: s, children: [
                                    new BABYLON.Rectangle2D({ id: "###Layout Frame###", position: BABYLON.Vector2.Zero(), size: s, fill: null, border: layoutBorder }),
                                    new BABYLON.Rectangle2D({ id: "###Layout Top###", position: BABYLON.Vector2.Zero(), size: s, fill: layoutFill }),
                                    new BABYLON.Rectangle2D({ id: "###Layout Left###", position: BABYLON.Vector2.Zero(), size: s, fill: layoutFill }),
                                    new BABYLON.Rectangle2D({ id: "###Layout Right###", position: BABYLON.Vector2.Zero(), size: s, fill: layoutFill }),
                                    new BABYLON.Rectangle2D({ id: "###Layout Bottom###", position: BABYLON.Vector2.Zero(), size: s, fill: layoutFill })
                                ]
                            }),
                            new BABYLON.Group2D({
                                id: "###Margin Area###", position: p, size: s, children: [
                                    new BABYLON.Rectangle2D({ id: "###Margin Frame###", position: BABYLON.Vector2.Zero(), size: s, fill: null, border: marginBorder }),
                                    new BABYLON.Rectangle2D({ id: "###Margin Top###", position: BABYLON.Vector2.Zero(), size: s, fill: marginFill }),
                                    new BABYLON.Rectangle2D({ id: "###Margin Left###", position: BABYLON.Vector2.Zero(), size: s, fill: marginFill }),
                                    new BABYLON.Rectangle2D({ id: "###Margin Right###", position: BABYLON.Vector2.Zero(), size: s, fill: marginFill }),
                                    new BABYLON.Rectangle2D({ id: "###Margin Bottom###", position: BABYLON.Vector2.Zero(), size: s, fill: marginFill })
                                ]
                            }),
                            new BABYLON.Group2D({
                                id: "###Padding Area###", position: p, size: s, children: [
                                    new BABYLON.Rectangle2D({ id: "###Padding Frame###", position: BABYLON.Vector2.Zero(), size: s, fill: null, border: paddingBorder }),
                                    new BABYLON.Rectangle2D({ id: "###Padding Top###", position: BABYLON.Vector2.Zero(), size: s, fill: paddingFill }),
                                    new BABYLON.Rectangle2D({ id: "###Padding Left###", position: BABYLON.Vector2.Zero(), size: s, fill: paddingFill }),
                                    new BABYLON.Rectangle2D({ id: "###Padding Right###", position: BABYLON.Vector2.Zero(), size: s, fill: paddingFill }),
                                    new BABYLON.Rectangle2D({ id: "###Padding Bottom###", position: BABYLON.Vector2.Zero(), size: s, fill: paddingFill })
                                ]
                            }),
                            new BABYLON.Group2D({
                                id: "###Content Area###", position: p, size: s, children: [
                                    new BABYLON.Rectangle2D({ id: "###Content Frame###", position: BABYLON.Vector2.Zero(), size: s, fill: null, border: contentBorder }),
                                    new BABYLON.Rectangle2D({ id: "###Content Top###", position: BABYLON.Vector2.Zero(), size: s, fill: contentFill }),
                                    new BABYLON.Rectangle2D({ id: "###Content Left###", position: BABYLON.Vector2.Zero(), size: s, fill: contentFill }),
                                    new BABYLON.Rectangle2D({ id: "###Content Right###", position: BABYLON.Vector2.Zero(), size: s, fill: contentFill }),
                                    new BABYLON.Rectangle2D({ id: "###Content Bottom###", position: BABYLON.Vector2.Zero(), size: s, fill: contentFill })
                                ]
                            })
                        ]
                    });
                    this._debugAreaGroup._setFlags(BABYLON.SmartPropertyPrim.flagNoPartOfLayout);
                    this._updateDebugArea();
                }
                this._displayDebugAreas = value;
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype._updateDebugArea = function () {
            if (Prim2DBase_1._updatingDebugArea === true) {
                return;
            }
            Prim2DBase_1._updatingDebugArea = true;
            var areaNames = ["Layout", "Margin", "Padding", "Content"];
            var areaZones = ["Area", "Frame", "Top", "Left", "Right", "Bottom"];
            var prims = new Array(4);
            // Get all the primitives used to display the areas
            for (var i = 0; i < 4; i++) {
                prims[i] = new Array(6);
                for (var j = 0; j < 6; j++) {
                    prims[i][j] = this._debugAreaGroup.findById("###" + areaNames[i] + " " + areaZones[j] + "###");
                    if (j > 1) {
                        prims[i][j].levelVisible = false;
                    }
                }
            }
            // Update the visibility status of layout/margin/padding
            var hasLayout = this._layoutAreaPos != null;
            var hasPos = (this.actualPosition.x !== 0) || (this.actualPosition.y !== 0);
            var hasMargin = this._hasMargin;
            var hasPadding = this._hasPadding;
            prims[0][0].levelVisible = hasLayout;
            prims[1][0].levelVisible = hasMargin;
            prims[2][0].levelVisible = hasPadding;
            prims[3][0].levelVisible = true;
            // Current offset
            var curOffset = BABYLON.Vector2.Zero();
            // Store the area info of the layout area
            var curAreaIndex = 0;
            // Store data about each area
            var areaInfo = new Array(4);
            var storeAreaInfo = function (pos, size) {
                var min = pos.clone();
                var max = pos.clone();
                if (size.width > 0) {
                    max.x += size.width;
                }
                if (size.height > 0) {
                    max.y += size.height;
                }
                areaInfo[curAreaIndex++] = { off: pos, size: size, min: min, max: max };
            };
            var isCanvas = this instanceof BABYLON.Canvas2D;
            var marginH = this._marginOffset.x + this._marginOffset.z;
            var marginV = this._marginOffset.y + this._marginOffset.w;
            var actualSize = this.actualSize.multiplyByFloats(isCanvas ? 1 : this.scaleX, isCanvas ? 1 : this.scaleY);
            var w = hasLayout ? (this.layoutAreaPos.x + this.layoutArea.width) : (marginH + actualSize.width);
            var h = hasLayout ? (this.layoutAreaPos.y + this.layoutArea.height) : (marginV + actualSize.height);
            var pos = (!hasLayout && !hasMargin && !hasPadding && hasPos) ? this.actualPosition : BABYLON.Vector2.Zero();
            storeAreaInfo(pos, new BABYLON.Size(w, h));
            // Compute the layout related data
            if (hasLayout) {
                var layoutOffset = this.layoutAreaPos.clone();
                storeAreaInfo(layoutOffset, (hasMargin || hasPadding) ? this.layoutArea.clone() : actualSize.clone());
                curOffset = layoutOffset.clone();
            }
            // Compute margin data
            if (hasMargin) {
                var marginOffset = curOffset.clone();
                marginOffset.x += this._marginOffset.x;
                marginOffset.y += this._marginOffset.y;
                var marginArea = actualSize;
                storeAreaInfo(marginOffset, marginArea);
                curOffset = marginOffset.clone();
            }
            if (hasPadding) {
                var contentOffset = curOffset.clone();
                contentOffset.x += this._paddingOffset.x;
                contentOffset.y += this._paddingOffset.y;
                var contentArea = this.contentArea;
                storeAreaInfo(contentOffset, contentArea);
                curOffset = curOffset.add(contentOffset);
            }
            // Helper function that set the pos and size of a given prim
            var setArea = function (i, j, pos, size) {
                prims[i][j].position = pos;
                prims[i][j].size = size;
            };
            var setFullRect = function (i, pos, size) {
                var plist = prims[i];
                plist[2].levelVisible = true;
                plist[3].levelVisible = false;
                plist[4].levelVisible = false;
                plist[5].levelVisible = false;
                setArea(i, 1, pos, size);
                setArea(i, 2, pos, size);
            };
            var setQuadRect = function (i, areaIndex) {
                var plist = prims[i];
                plist[2].levelVisible = true;
                plist[3].levelVisible = true;
                plist[4].levelVisible = true;
                plist[5].levelVisible = true;
                var ca = areaInfo[areaIndex];
                var na = areaInfo[areaIndex + 1];
                var tp = new BABYLON.Vector2(ca.min.x, na.max.y);
                var ts = new BABYLON.Size(ca.size.width, ca.max.y - tp.y);
                var lp = new BABYLON.Vector2(ca.min.x, na.min.y);
                var ls = new BABYLON.Size(na.min.x - ca.min.x, na.max.y - na.min.y);
                var rp = new BABYLON.Vector2(na.max.x, na.min.y);
                var rs = new BABYLON.Size(ca.max.x - na.max.x, na.max.y - na.min.y);
                var bp = new BABYLON.Vector2(ca.min.x, ca.min.y);
                var bs = new BABYLON.Size(ca.size.width, na.min.y - ca.min.y);
                // Frame
                plist[1].position = ca.off;
                plist[1].size = ca.size;
                // Top rect
                plist[2].position = tp;
                plist[2].size = ts;
                // Left rect
                plist[3].position = lp;
                plist[3].size = ls;
                // Right rect
                plist[4].position = rp;
                plist[4].size = rs;
                // Bottom rect
                plist[5].position = bp;
                plist[5].size = bs;
            };
            var areaCount = curAreaIndex;
            curAreaIndex = 0;
            // Available zones
            var availableZones = [false, hasLayout, hasMargin, hasPadding, true];
            for (var k = 1; k < 5; k++) {
                if (availableZones[k]) {
                    var ai = areaInfo[curAreaIndex];
                    setArea(k - 1, 0, BABYLON.Vector2.Zero(), ai.size);
                    //                    setArea(k-1, 1, Vector2.Zero(), ai.size);
                    if (k === 4) {
                        setFullRect(k - 1, ai.off, ai.size);
                    }
                    else {
                        setQuadRect(k - 1, curAreaIndex);
                    }
                    ++curAreaIndex;
                }
            }
            Prim2DBase_1._updatingDebugArea = false;
        };
        Prim2DBase.prototype.findById = function (id) {
            if (this._id === id) {
                return this;
            }
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                var r = child.findById(id);
                if (r != null) {
                    return r;
                }
            }
        };
        Prim2DBase.prototype.onZOrderChanged = function () {
        };
        Prim2DBase.prototype.levelIntersect = function (intersectInfo) {
            return false;
        };
        /**
         * Capture all the Events of the given PointerId for this primitive.
         * Don't forget to call releasePointerEventsCapture when done.
         * @param pointerId the Id of the pointer to capture the events from.
         */
        Prim2DBase.prototype.setPointerEventCapture = function (pointerId) {
            return this.owner._setPointerCapture(pointerId, this);
        };
        /**
         * Release a captured pointer made with setPointerEventCapture.
         * @param pointerId the Id of the pointer to release the capture from.
         */
        Prim2DBase.prototype.releasePointerEventsCapture = function (pointerId) {
            return this.owner._releasePointerCapture(pointerId, this);
        };
        /**
         * Make an intersection test with the primitive, all inputs/outputs are stored in the IntersectInfo2D class, see its documentation for more information.
         * @param intersectInfo contains the settings of the intersection to perform, to setup before calling this method as well as the result, available after a call to this method.
         */
        Prim2DBase.prototype.intersect = function (intersectInfo) {
            if (!intersectInfo) {
                return false;
            }
            // If this is null it means this method is call for the first level, initialize stuffs
            var firstLevel = !intersectInfo._globalPickPosition;
            if (firstLevel) {
                // Compute the pickPosition in global space and use it to find the local position for each level down, always relative from the world to get the maximum accuracy (and speed). The other way would have been to compute in local every level down relative to its parent's local, which wouldn't be as accurate (even if javascript number is 80bits accurate).
                intersectInfo._globalPickPosition = BABYLON.Vector2.Zero();
                BABYLON.Vector2.TransformToRef(intersectInfo.pickPosition, this.globalTransform, intersectInfo._globalPickPosition);
                intersectInfo._localPickPosition = intersectInfo.pickPosition.clone();
                intersectInfo.intersectedPrimitives = new Array();
                intersectInfo.topMostIntersectedPrimitive = null;
            }
            if (!Prim2DBase_1._bypassGroup2DExclusion && this instanceof BABYLON.Group2D && this.isCachedGroup && !this.isRenderableGroup) {
                // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                intersectInfo._exit(firstLevel);
                return false;
            }
            if (!intersectInfo.intersectHidden && !this.isVisible) {
                // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                intersectInfo._exit(firstLevel);
                return false;
            }
            var id = this.id;
            if (id != null && id.indexOf("__cachedSpriteOfGroup__") === 0) {
                try {
                    Prim2DBase_1._bypassGroup2DExclusion = true;
                    var ownerGroup = this.getExternalData("__cachedGroup__");
                    return ownerGroup.intersect(intersectInfo);
                }
                finally {
                    Prim2DBase_1._bypassGroup2DExclusion = false;
                }
            }
            // If we're testing a cachedGroup, we must reject pointer outside its levelBoundingInfo because children primitives could be partially clipped outside so we must not accept them as intersected when it's the case (because they're not visually visible).
            var isIntersectionTest = false;
            if (this instanceof BABYLON.Group2D) {
                var g = this;
                isIntersectionTest = g.isCachedGroup;
            }
            if (isIntersectionTest && !this.levelBoundingInfo.doesIntersect(intersectInfo._localPickPosition)) {
                // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                intersectInfo._exit(firstLevel);
                return false;
            }
            // Fast rejection test with boundingInfo
            var boundingIntersected = true;
            if (this.isPickable && !this.boundingInfo.doesIntersect(intersectInfo._localPickPosition)) {
                if (this.isContainer) {
                    // Important to call this before each return to allow a good recursion next time this intersectInfo is reused
                    intersectInfo._exit(firstLevel);
                    return false;
                }
                boundingIntersected = false;
            }
            // We hit the boundingInfo that bounds this primitive and its children, now we have to test on the primitive of this level
            var levelIntersectRes = false;
            if (this.isPickable) {
                levelIntersectRes = boundingIntersected && this.levelIntersect(intersectInfo);
                if (levelIntersectRes) {
                    var pii = new PrimitiveIntersectedInfo(this, intersectInfo._localPickPosition.clone());
                    intersectInfo.intersectedPrimitives.push(pii);
                    if (!intersectInfo.topMostIntersectedPrimitive || (intersectInfo.topMostIntersectedPrimitive.prim.actualZOffset > pii.prim.actualZOffset)) {
                        intersectInfo.topMostIntersectedPrimitive = pii;
                    }
                    // If we must stop at the first intersection, we're done, quit!
                    if (intersectInfo.findFirstOnly) {
                        intersectInfo._exit(firstLevel);
                        return true;
                    }
                }
            }
            // Recurse to children if needed
            if (!levelIntersectRes || !intersectInfo.findFirstOnly) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var curChild = _a[_i];
                    // Don't test primitive not pick able or if it's hidden and we don't test hidden ones
                    if ((!curChild.isPickable && curChild.isContainer) || (!intersectInfo.intersectHidden && !curChild.isVisible)) {
                        continue;
                    }
                    // Must compute the localPickLocation for the children level
                    BABYLON.Vector2.TransformToRef(intersectInfo._globalPickPosition, curChild.invGlobalTransform, intersectInfo._localPickPosition);
                    // If we got an intersection with the child and we only need to find the first one, quit!
                    if (curChild.intersect(intersectInfo) && intersectInfo.findFirstOnly) {
                        intersectInfo._exit(firstLevel);
                        return true;
                    }
                }
            }
            intersectInfo._exit(firstLevel);
            return intersectInfo.isIntersected;
        };
        Prim2DBase.prototype.intersectOtherPrim = function (other) {
            var setA = this.triList;
            var setB = other.triList;
            return BABYLON.Tri2DArray.doesIntersect(setA, setB, other.globalTransform.multiply(this.globalTransform.clone().invert()));
        };
        Object.defineProperty(Prim2DBase.prototype, "triList", {
            get: function () {
                if (this._primTriArrayDirty) {
                    this.updateTriArray();
                    this._primTriArrayDirty = false;
                }
                return this._primTriArray;
            },
            enumerable: true,
            configurable: true
        });
        // This is the worst implementation, if the top level primitive doesn't override this method we will just store a quad that defines the bounding rect of the prim
        Prim2DBase.prototype.updateTriArray = function () {
            if (this._primTriArray == null) {
                this._primTriArray = new BABYLON.Tri2DArray(2);
            }
            else {
                this._primTriArray.clear(2);
            }
            var size = this.actualSize;
            var lb = new BABYLON.Vector2(0, 0);
            var rt = new BABYLON.Vector2(size.width, size.height);
            var lt = new BABYLON.Vector2(0, size.height);
            var rb = new BABYLON.Vector2(size.width, 0);
            this._primTriArray.storeTriangle(0, lb, lt, rt);
            this._primTriArray.storeTriangle(1, lb, rt, rb);
        };
        /**
         * Move a child object into a new position regarding its siblings to change its rendering order.
         * You can also use the shortcut methods to move top/bottom: moveChildToTop, moveChildToBottom, moveToTop, moveToBottom.
         * @param child the object to move
         * @param previous the object which will be before "child", if child has to be the first among sibling, set "previous" to null.
         */
        Prim2DBase.prototype.moveChild = function (child, previous) {
            if (child.parent !== this) {
                return false;
            }
            var childIndex = this._children.indexOf(child);
            var prevIndex = previous ? this._children.indexOf(previous) : -1;
            if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder)) {
                this._setFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
                this._firstZDirtyIndex = Math.min(this._firstZDirtyIndex, prevIndex + 1);
            }
            this._children.splice(prevIndex + 1, 0, this._children.splice(childIndex, 1)[0]);
            return true;
        };
        /**
         * Move the given child so it's displayed on the top of all its siblings
         * @param child the primitive to move to the top
         */
        Prim2DBase.prototype.moveChildToTop = function (child) {
            return this.moveChild(child, this._children[this._children.length - 1]);
        };
        /**
         * Move the given child so it's displayed on the bottom of all its siblings
         * @param child the primitive to move to the top
         */
        Prim2DBase.prototype.moveChildToBottom = function (child) {
            return this.moveChild(child, null);
        };
        /**
         * Move this primitive to be at the top among all its sibling
         */
        Prim2DBase.prototype.moveToTop = function () {
            if (this.parent == null) {
                return false;
            }
            return this.parent.moveChildToTop(this);
        };
        /**
         * Move this primitive to be at the bottom among all its sibling
         */
        Prim2DBase.prototype.moveToBottom = function () {
            if (this.parent == null) {
                return false;
            }
            return this.parent.moveChildToBottom(this);
        };
        Prim2DBase.prototype.addChild = function (child) {
            child._parent = this;
            this._boundingBoxDirty();
            var flat = this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
            if (flat) {
                child._setFlags(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
                child._setZOrder(this._zOrder, true);
                child._zMax = this._zOrder;
            }
            else {
                this._setFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
            }
            var length = this._children.push(child);
            this._firstZDirtyIndex = Math.min(this._firstZDirtyIndex, length - 1);
        };
        /**
         * Dispose the primitive, remove it from its parent.
         */
        Prim2DBase.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagCollisionActor)) {
                this.owner._primitiveCollisionManager._removeActor(this);
                this._actorInfo = null;
            }
            if (this._pointerEventObservable) {
                this._pointerEventObservable.clear();
                this._pointerEventObservable = null;
            }
            if (this._actionManager) {
                this._actionManager.dispose();
                this._actionManager = null;
            }
            this.owner.scene.stopAnimation(this);
            // If there's a parent, remove this object from its parent list
            if (this._parent) {
                if (this instanceof BABYLON.Group2D) {
                    var g = this;
                    if (g.isRenderableGroup) {
                        var parentRenderable = this.parent.traverseUp(function (p) { return (p instanceof BABYLON.Group2D && p.isRenderableGroup); });
                        if (parentRenderable != null) {
                            var l = parentRenderable._renderableData._childrenRenderableGroups;
                            var i_1 = l.indexOf(g);
                            if (i_1 !== -1) {
                                l.splice(i_1, 1);
                            }
                        }
                    }
                }
                var i = this._parent._children.indexOf(this);
                if (i !== undefined) {
                    this._parent._children.splice(i, 1);
                }
                this._parent = null;
            }
            // Recurse dispose to children
            if (this._children) {
                while (this._children.length > 0) {
                    this._children[this._children.length - 1].dispose();
                }
            }
            return true;
        };
        Prim2DBase.prototype.onPrimBecomesDirty = function () {
            if (this._renderGroup && !this._isFlagSet(BABYLON.SmartPropertyPrim.flagPrimInDirtyList)) {
                this._renderGroup._addPrimToDirtyList(this);
                this._setFlags(BABYLON.SmartPropertyPrim.flagPrimInDirtyList);
            }
        };
        Prim2DBase.prototype._needPrepare = function () {
            return this._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagVisibilityChanged | BABYLON.SmartPropertyPrim.flagModelDirty | BABYLON.SmartPropertyPrim.flagModelUpdate | BABYLON.SmartPropertyPrim.flagNeedRefresh) || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep);
        };
        Prim2DBase.prototype._prepareRender = function (context) {
            this._prepareRenderPre(context);
            this._prepareRenderPost(context);
        };
        Prim2DBase.prototype._prepareRenderPre = function (context) {
        };
        Prim2DBase.prototype._prepareRenderPost = function (context) {
            // Don't recurse if it's a renderable group, the content will be processed by the group itself
            if (this instanceof BABYLON.Group2D) {
                var self = this;
                if (self.isRenderableGroup) {
                    return;
                }
            }
            // Check if we need to recurse the prepare to children primitives
            //  - must have children
            //  - the global transform of this level have changed, or
            //  - the visible state of primitive has changed
            if (this._children.length > 0 && ((this._globalTransformProcessStep !== this._globalTransformStep) ||
                this.checkPropertiesDirty(Prim2DBase_1.isVisibleProperty.flagId))) {
                this._children.forEach(function (c) {
                    // As usual stop the recursion if we meet a renderable group
                    if (!(c instanceof BABYLON.Group2D && c.isRenderableGroup)) {
                        c._prepareRender(context);
                    }
                });
            }
            // Finally reset the dirty flags as we've processed everything
            this._clearFlags(BABYLON.SmartPropertyPrim.flagModelDirty);
            this._instanceDirtyFlags = 0;
        };
        Prim2DBase.prototype._canvasPreInit = function (settings) {
        };
        Prim2DBase.CheckParent = function (parent) {
            //if (!Prim2DBase._isCanvasInit && !parent) {
            //    throw new Error("A Primitive needs a valid Parent, it can be any kind of Primitives based types, even the Canvas (with the exception that only Group2D can be direct child of a Canvas if the cache strategy used is TOPLEVELGROUPS)");
            //}
        };
        Prim2DBase.prototype.updateCachedStatesOf = function (list, recurse) {
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var cur = list_1[_i];
                cur.updateCachedStates(recurse);
            }
        };
        Prim2DBase.prototype._parentLayoutDirty = function () {
            if (!this._parent || this._parent.isDisposed) {
                return;
            }
            this._parent._setLayoutDirty();
        };
        Prim2DBase.prototype._setLayoutDirty = function () {
            this.onPrimBecomesDirty();
            this._setFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
        };
        Prim2DBase.prototype._checkPositionChange = function () {
            if (this.parent && this.parent.layoutEngine.isChildPositionAllowed === false) {
                console.log("Can't manually set the position of " + this.id + ", the Layout Engine of its parent doesn't allow it");
                return false;
            }
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagUsePositioning)) {
                if (this instanceof BABYLON.Group2D && this.trackedNode == null) {
                    console.log("You can't set the position/x/y of " + this.id + " properties while positioning engine is used (margin, margin alignment and/or padding are set");
                    return false;
                }
            }
            return true;
        };
        Prim2DBase.prototype._positioningDirty = function () {
            if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagUsePositioning)) {
                return;
            }
            this.onPrimBecomesDirty();
            this._setFlags(BABYLON.SmartPropertyPrim.flagPositioningDirty);
        };
        Prim2DBase.prototype._spreadActualOpacityChanged = function () {
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child._setFlags(BABYLON.SmartPropertyPrim.flagActualOpacityDirty);
                child._updateRenderMode();
                child.onPrimBecomesDirty();
                child._spreadActualOpacityChanged();
            }
        };
        Prim2DBase.prototype._changeLayoutEngine = function (engine) {
            this._layoutEngine = engine;
        };
        Prim2DBase.prototype._updateLocalTransform = function () {
            var tflags = Prim2DBase_1.actualPositionProperty.flagId | Prim2DBase_1.rotationProperty.flagId | Prim2DBase_1.scaleProperty.flagId | Prim2DBase_1.scaleXProperty.flagId | Prim2DBase_1.scaleYProperty.flagId | Prim2DBase_1.originProperty.flagId;
            if (this.checkPropertiesDirty(tflags) || this._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagLocalTransformDirty | BABYLON.SmartPropertyPrim.flagPositioningDirty)) {
                if (this.owner) {
                    this.owner.addupdateLocalTransformCounter(1);
                }
                // Check for positioning update
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty)) {
                    this._updatePositioning();
                }
                var rot = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 0, 1), this._rotation);
                var local;
                var pos = this._position ? this.position : (this.layoutAreaPos || Prim2DBase_1._v0);
                var scale = new BABYLON.Vector3(this._scale.x, this._scale.y, 1);
                var postScale = this._postScale;
                var globalScale = scale.multiplyByFloats(postScale.x, postScale.y, 1);
                if (this._origin.x === 0 && this._origin.y === 0) {
                    // ###MATRIX PART###
                    {
                        local = BABYLON.Matrix.Compose(globalScale, rot, new BABYLON.Vector3(pos.x + this._marginOffset.x, pos.y + this._marginOffset.y, 0));
                        this._localTransform = local;
                        this._localLayoutTransform = BABYLON.Matrix.Compose(globalScale, rot, new BABYLON.Vector3(pos.x, pos.y, 0));
                    }
                }
                else {
                    // ###MATRIX PART###
                    {
                        // -Origin offset
                        var as = Prim2DBase_1._ts0;
                        as.copyFrom(this.actualSize);
                        as.width /= postScale.x;
                        as.height /= postScale.y;
                        BABYLON.Matrix.TranslationToRef((-as.width * this._origin.x), (-as.height * this._origin.y), 0, Prim2DBase_1._t0);
                        // -Origin * rotation
                        rot.toRotationMatrix(Prim2DBase_1._t1);
                        Prim2DBase_1._t0.multiplyToRef(Prim2DBase_1._t1, Prim2DBase_1._t2);
                        // -Origin * rotation * scale
                        BABYLON.Matrix.ScalingToRef(this._scale.x, this._scale.y, 1, Prim2DBase_1._t0);
                        Prim2DBase_1._t2.multiplyToRef(Prim2DBase_1._t0, Prim2DBase_1._t1);
                        // -Origin * rotation * scale * Origin
                        BABYLON.Matrix.TranslationToRef((as.width * this._origin.x), (as.height * this._origin.y), 0, Prim2DBase_1._t2);
                        Prim2DBase_1._t1.multiplyToRef(Prim2DBase_1._t2, Prim2DBase_1._t0);
                        // -Origin * rotation * scale * Origin * postScale
                        BABYLON.Matrix.ScalingToRef(postScale.x, postScale.y, 1, Prim2DBase_1._t1);
                        Prim2DBase_1._t0.multiplyToRef(Prim2DBase_1._t1, Prim2DBase_1._t2);
                        // -Origin * rotation * scale * Origin * postScale * Position
                        BABYLON.Matrix.TranslationToRef(pos.x + this._marginOffset.x, pos.y + this._marginOffset.y, 0, Prim2DBase_1._t0);
                        Prim2DBase_1._t2.multiplyToRef(Prim2DBase_1._t0, this._localTransform);
                        this._localLayoutTransform = BABYLON.Matrix.Compose(globalScale, rot, new BABYLON.Vector3(pos.x, pos.y, 0));
                    }
                }
                this.clearPropertiesDirty(tflags);
                this._setFlags(BABYLON.SmartPropertyPrim.flagGlobalTransformDirty);
                this._clearFlags(BABYLON.SmartPropertyPrim.flagLocalTransformDirty);
                return true;
            }
            return false;
        };
        Prim2DBase.prototype.updateCachedStates = function (recurse) {
            if (this.isDisposed) {
                return;
            }
            this.owner.addCachedGroupRenderCounter(1);
            // Check if the parent is synced
            if (this._parent && ((this._parent._globalTransformProcessStep !== this.owner._globalTransformProcessStep) || this._parent._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagLayoutDirty | BABYLON.SmartPropertyPrim.flagPositioningDirty | BABYLON.SmartPropertyPrim.flagZOrderDirty))) {
                this._parent.updateCachedStates(false);
            }
            // Update Z-Order if needed
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                this._updateZOrder();
            }
            // Update actualSize only if there' not positioning to recompute and the size changed
            // Otherwise positioning will take care of it.
            var sizeDirty = this.checkPropertiesDirty(Prim2DBase_1.sizeProperty.flagId);
            if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty) && !this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty) && sizeDirty) {
                var size = this.size;
                this.onPropertyChanged("actualSize", size, size, Prim2DBase_1.actualSizeProperty.flagId);
                this.clearPropertiesDirty(Prim2DBase_1.sizeProperty.flagId);
            }
            var positioningDirty = this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty);
            var positioningComputed = positioningDirty && !this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty);
            // Check for layout update
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagLayoutDirty)) {
                this.owner.addUpdateLayoutCounter(1);
                this._layoutEngine.updateLayout(this);
                this._clearFlags(BABYLON.SmartPropertyPrim.flagLayoutDirty);
            }
            var autoContentChanged = false;
            if (this.isSizeAuto) {
                if (!this._lastAutoSizeArea) {
                    autoContentChanged = this.actualSize !== null;
                }
                else {
                    autoContentChanged = (!this._lastAutoSizeArea.equals(this.actualSize));
                }
            }
            // Check for positioning update
            if (!positioningComputed && (autoContentChanged || sizeDirty || this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty) || (this._parent && !this._parent.contentArea.equals(this._parentContentArea)))) {
                this._updatePositioning();
                if (sizeDirty) {
                    this.clearPropertiesDirty(Prim2DBase_1.sizeProperty.flagId);
                }
                positioningComputed = true;
            }
            if (positioningComputed && this._parent) {
                this._parentContentArea.copyFrom(this._parent.contentArea);
            }
            // Check if we must update this prim
            if ((this === this.owner) || (this._globalTransformProcessStep !== this.owner._globalTransformProcessStep) || (this._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagGlobalTransformDirty))) {
                this.owner.addUpdateGlobalTransformCounter(1);
                var curVisibleState = this.isVisible;
                this.isVisible = (!this._parent || this._parent.isVisible) && this.levelVisible;
                // Detect a change of visibility
                this._changeFlags(BABYLON.SmartPropertyPrim.flagVisibilityChanged, curVisibleState !== this.isVisible);
                // Get/compute the localTransform
                var localDirty = this._updateLocalTransform();
                var parentPaddingChanged = false;
                var parentPaddingOffset = Prim2DBase_1._v0;
                if (this._parent) {
                    parentPaddingOffset = new BABYLON.Vector2(this._parent._paddingOffset.x, this._parent._paddingOffset.y);
                    parentPaddingChanged = !parentPaddingOffset.equals(this._parentPaddingOffset);
                }
                // Check if there are changes in the parent that will force us to update the global matrix
                var parentDirty = (this._parent != null) ? (this._parent._globalTransformStep !== this._parentTransformStep) : false;
                // Check if we have to update the globalTransform
                if (!this._globalTransform || localDirty || parentDirty || parentPaddingChanged || this._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagGlobalTransformDirty)) {
                    //###MATRIX PART###
                    {
                        var globalTransform = this._parent ? this._parent._globalTransform : null;
                        var localTransform = void 0;
                        Prim2DBase_1._transMtx.copyFrom(this._localTransform);
                        Prim2DBase_1._transMtx.m[12] += parentPaddingOffset.x;
                        Prim2DBase_1._transMtx.m[13] += parentPaddingOffset.y;
                        localTransform = Prim2DBase_1._transMtx;
                        this._globalTransform = this._parent ? localTransform.multiply(globalTransform) : localTransform.clone();
                        this._invGlobalTransform = BABYLON.Matrix.Invert(this._globalTransform);
                    }
                    this._levelBoundingInfo.dirtyWorldAABB();
                    this._boundingInfo.dirtyWorldAABB();
                    this._globalTransformStep = this.owner._globalTransformProcessStep + 1;
                    this._parentTransformStep = this._parent ? this._parent._globalTransformStep : 0;
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagGlobalTransformDirty);
                }
                this._globalTransformProcessStep = this.owner._globalTransformProcessStep;
            }
            if (recurse) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    // Stop the recursion if we meet a renderable group
                    child.updateCachedStates(!(child instanceof BABYLON.Group2D && child.isRenderableGroup));
                }
            }
        };
        Prim2DBase.prototype._updatePositioning = function () {
            var _this = this;
            if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagUsePositioning)) {
                return;
            }
            var success = true;
            // Check if re-entrance is occurring
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagComputingPositioning) /* || (hasMargin && !this._layoutArea)*/) {
                if (!this._actualSize) {
                    this._actualSize = this.size.clone() || BABYLON.Size.Zero();
                    this._contentArea.copyFrom(this._actualSize);
                }
                if (!this._marginSize) {
                    this._marginSize = this._actualSize.clone();
                }
                if (!this._actualPosition) {
                    this._actualPosition = BABYLON.Vector2.Zero();
                }
                return;
            }
            if (this.owner) {
                this.owner.addUpdatePositioningCounter(1);
            }
            // Set the flag to avoid re-entrance
            this._setFlags(BABYLON.SmartPropertyPrim.flagComputingPositioning);
            try {
                var isSizeAuto = this.isSizeAuto;
                var isVSizeAuto = this.isVerticalSizeAuto;
                var isHSizeAuto = this.isHorizontalSizeAuto;
                var ma = this._marginAlignment ? this._marginAlignment.clone() : new PrimitiveAlignment();
                var csize = this.size;
                // Auto Create PaddingArea if there's no actualSize on width&|height to allocate the whole content available to the paddingArea where the actualSize is null
                if (!this._hasMarginAlignment && (!isSizeAuto && (csize.width == null || csize.height == null))) {
                    if (isSizeAuto || this.actualSize.width == null) {
                        ma.horizontal = PrimitiveAlignment.AlignStretch;
                    }
                    if (isSizeAuto || this.actualSize.height == null) {
                        ma.vertical = PrimitiveAlignment.AlignStretch;
                    }
                }
                var hasMargin = (this._margin !== null && !this._margin.isDefault) || (ma !== null && !ma.isDefault);
                var newSize = Prim2DBase_1._size;
                var hasH = false;
                var hasV = false;
                var size = this.size || Prim2DBase_1._nullSize;
                var paddingApplied_1 = false;
                var hasPadding = this._hasPadding;
                var autoSizeComputed_1 = false;
                //let contentAreaComputed = false;
                // Compute the size
                // The size is the size of the prim or the computed one if there's a marginAlignment of Stretch
                if (hasMargin) {
                    var layoutArea = this.layoutArea;
                    if (layoutArea /*&& layoutArea.width >= size.width */ && ma.horizontal === PrimitiveAlignment.AlignStretch) {
                        this.margin.computeWithAlignment(layoutArea, size, ma, this.actualScale, this._marginOffset, newSize, false, PrimitiveThickness.ComputeH);
                        hasH = true;
                    }
                    if (layoutArea /*&& layoutArea.height >= size.height */ && ma.vertical === PrimitiveAlignment.AlignStretch) {
                        this.margin.computeWithAlignment(layoutArea, size, ma, this.actualScale, this._marginOffset, newSize, false, PrimitiveThickness.ComputeV);
                        hasV = true;
                    }
                }
                var computeAutoSize = function () {
                    if (autoSizeComputed_1) {
                        return;
                    }
                    var bi = _this.layoutBoundingInfo;
                    bi.sizeToRef(Prim2DBase_1._size2);
                    autoSizeComputed_1 = true;
                    paddingApplied_1 = true;
                };
                if (!hasH) {
                    // If the Horizontal size is Auto, we have to compute it from its content and padding
                    if (isHSizeAuto) {
                        computeAutoSize();
                        newSize.width = Prim2DBase_1._size2.width;
                    }
                    else {
                        newSize.width = size.width;
                    }
                }
                if (!hasV) {
                    // If the Vertical size is Auto, we have to compute it from its content and padding
                    if (isVSizeAuto) {
                        computeAutoSize();
                        newSize.height = Prim2DBase_1._size2.height;
                    }
                    else {
                        newSize.height = size.height;
                    }
                }
                if (!isVSizeAuto || !isHSizeAuto) {
                    Prim2DBase_1._curContentArea.copyFrom(this._contentArea);
                    if (hasPadding) {
                        this._getInitialContentAreaToRef(newSize, Prim2DBase_1._icZone, Prim2DBase_1._icArea);
                        Prim2DBase_1._icArea.width = Math.max(0, Prim2DBase_1._icArea.width);
                        Prim2DBase_1._icArea.height = Math.max(0, Prim2DBase_1._icArea.height);
                        this.padding.compute(Prim2DBase_1._icArea, this.actualScale, this._paddingOffset, Prim2DBase_1._size2);
                        if (!isHSizeAuto) {
                            this._paddingOffset.x += Prim2DBase_1._icZone.x;
                            this._paddingOffset.z -= Prim2DBase_1._icZone.z;
                            this._contentArea.width = Prim2DBase_1._size2.width;
                        }
                        if (!isVSizeAuto) {
                            this._paddingOffset.y += Prim2DBase_1._icZone.y;
                            this._paddingOffset.w -= Prim2DBase_1._icZone.w;
                            this._contentArea.height = Prim2DBase_1._size2.height;
                        }
                    }
                    else {
                        this._contentArea.copyFrom(newSize);
                    }
                    if (!Prim2DBase_1._curContentArea.equals(this._contentArea)) {
                        this._setLayoutDirty();
                    }
                    paddingApplied_1 = true;
                }
                // Finally we apply margin to determine the position
                if (hasMargin) {
                    var layoutArea = this.layoutArea;
                    var mo = this._marginOffset;
                    var margin = this.margin;
                    // We compute margin only if the layoutArea is as big as the contentSize, sometime this code is triggered when the layoutArea is
                    //  not yet set and computing alignment would result into a bad size.
                    // So we make sure with compute alignment only if the layoutArea is good
                    if (layoutArea && layoutArea.width >= newSize.width && layoutArea.height >= newSize.height) {
                        margin.computeWithAlignment(layoutArea, newSize, ma, this.actualScale, mo, Prim2DBase_1._size2);
                    }
                    else {
                        mo.copyFromFloats(0, 0, 0, 0);
                    }
                    var mw = newSize.width + margin.leftPixels + margin.rightPixels;
                    var mh = newSize.height + margin.bottomPixels + margin.topPixels;
                    if (!this._marginSize) {
                        this._marginSize = new BABYLON.Size(mw, mh);
                    }
                    else {
                        this._marginSize.copyFromFloats(mw, mh);
                    }
                }
                else {
                    if (!this._marginSize) {
                        this._marginSize = newSize.clone();
                    }
                    else {
                        this._marginSize.copyFrom(newSize);
                    }
                }
                var lap = this.layoutAreaPos;
                this.actualPosition = new BABYLON.Vector2(this._marginOffset.x + (lap ? lap.x : 0), this._marginOffset.y + (lap ? lap.y : 0));
                this.actualSize = Prim2DBase_1._size.clone();
                this._setFlags(BABYLON.SmartPropertyPrim.flagLocalTransformDirty);
                if (isSizeAuto) {
                    this._lastAutoSizeArea = this.actualSize;
                }
                if (this.displayDebugAreas) {
                    this._updateDebugArea();
                }
            }
            finally {
                this._clearFlags(BABYLON.SmartPropertyPrim.flagComputingPositioning);
                // Remove dirty flag
                if (success) {
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagPositioningDirty);
                }
            }
        };
        Object.defineProperty(Prim2DBase.prototype, "contentArea", {
            /**
             * Get the content are of this primitive, this area is computed the primitive size and using the padding property.
             * Children of this primitive will be positioned relative to the bottom/left corner of this area.
             */
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagUsePositioning)) {
                    if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty)) {
                        this._updatePositioning();
                    }
                    return this._contentArea;
                }
                else {
                    return this.size;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Prim2DBase.prototype, "marginSize", {
            get: function () {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagUsePositioning)) {
                    if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagPositioningDirty)) {
                        this._updatePositioning();
                    }
                    return this._marginSize;
                }
                else {
                    return this.size;
                }
            },
            enumerable: true,
            configurable: true
        });
        Prim2DBase.prototype._patchHierarchy = function (owner) {
            if (this._owner == null) {
                this._owner = owner;
                this.onSetOwner();
                this._setFlags(BABYLON.SmartPropertyPrim.flagLayoutBoundingInfoDirty);
            }
            // The only place we initialize the _renderGroup is this method, if it's set, we already been there, no need to execute more
            if (this._renderGroup != null) {
                return;
            }
            if (this instanceof BABYLON.Group2D) {
                var group = this;
                group.detectGroupStates();
                if (group._trackedNode && !group._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                    group.owner._registerTrackedNode(this);
                }
            }
            this._renderGroup = this.traverseUp(function (p) { return p instanceof BABYLON.Group2D && p.isRenderableGroup; });
            if (this._parent) {
                this._parentLayoutDirty();
            }
            // Make sure the prim is in the dirtyList if it should be
            if (this._renderGroup && this.isDirty) {
                var list = this._renderGroup._renderableData._primDirtyList;
                var i = list.indexOf(this);
                if (i === -1) {
                    this._setFlags(BABYLON.SmartPropertyPrim.flagPrimInDirtyList);
                    list.push(this);
                }
            }
            // Recurse
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child._hierarchyDepth = this._hierarchyDepth + 1;
                child._patchHierarchy(owner);
            }
        };
        Prim2DBase.prototype.onSetOwner = function () {
        };
        Prim2DBase.prototype._updateZOrder = function () {
            var prevLinPos = this._primLinearPosition;
            var startI = 0;
            var startZ = this._zOrder;
            // We must start rebuilding Z-Order from the Prim before the first one that changed, because we know its Z-Order is correct, so are its children, but it's better to recompute everything from this point instead of finding the last valid children
            var childrenCount = this._children.length;
            if (this._firstZDirtyIndex > 0) {
                if ((this._firstZDirtyIndex - 1) < childrenCount) {
                    var prevPrim = this._children[this._firstZDirtyIndex - 1];
                    prevLinPos = prevPrim._primLinearPosition;
                    startI = this._firstZDirtyIndex - 1;
                    startZ = prevPrim._zOrder;
                }
            }
            var startPos = prevLinPos;
            // Update the linear position of the primitive from the first one to the last inside this primitive, compute the total number of prim traversed
            Prim2DBase_1._totalCount = 0;
            for (var i = startI; i < childrenCount; i++) {
                var child = this._children[i];
                prevLinPos = child._updatePrimitiveLinearPosition(prevLinPos);
            }
            // Compute the new Z-Order for all the primitives
            // Add 20% to the current total count to reserve space for future insertions, except if we're rebuilding due to a zMinDelta reached
            var zDelta = (this._zMax - startZ) / (Prim2DBase_1._totalCount * (Prim2DBase_1._zRebuildReentrency ? 1 : 1.2));
            // If the computed delta is less than the smallest allowed by the depth buffer, we rebuild the Z-Order from the very beginning of the primitive's children (that is, the first) to redistribute uniformly the Z.
            if (zDelta < BABYLON.Canvas2D._zMinDelta) {
                // Check for re-entrance, if the flag is true we already attempted a rebuild but couldn't get a better zDelta, go up in the hierarchy to rebuilt one level up, hoping to get this time a decent delta, otherwise, recurse until we got it or when no parent is reached, which would mean the canvas would have more than 16 millions of primitives...
                if (Prim2DBase_1._zRebuildReentrency) {
                    var p = this._parent;
                    if (p == null) {
                        // Can't find a good Z delta and we're in the canvas, which mean we're dealing with too many objects (which should never happen, but well...)
                        console.log("Can't compute Z-Order for " + this.id + "'s children, zDelta is too small, Z-Order is now in an unstable state");
                        Prim2DBase_1._zRebuildReentrency = false;
                        return;
                    }
                    p._firstZDirtyIndex = 0;
                    return p._updateZOrder();
                }
                Prim2DBase_1._zRebuildReentrency = true;
                this._firstZDirtyIndex = 0;
                this._updateZOrder();
                Prim2DBase_1._zRebuildReentrency = false;
            }
            for (var i = startI; i < childrenCount; i++) {
                var child = this._children[i];
                child._updatePrimitiveZOrder(startPos, startZ, zDelta);
            }
            // Notify the Observers that we found during the Z change (we do it after to avoid any kind of re-entrance)
            for (var _i = 0, _a = Prim2DBase_1._zOrderChangedNotifList; _i < _a.length; _i++) {
                var p = _a[_i];
                p._actualZOrderChangedObservable.notifyObservers(p.actualZOffset);
            }
            Prim2DBase_1._zOrderChangedNotifList.splice(0);
            this._firstZDirtyIndex = Prim2DBase_1._bigInt;
            this._clearFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
        };
        Prim2DBase.prototype._updatePrimitiveLinearPosition = function (prevLinPos) {
            if (this.isManualZOrder) {
                return prevLinPos;
            }
            this._primLinearPosition = ++prevLinPos;
            Prim2DBase_1._totalCount++;
            // Check for the FlatZOrder, which means the children won't have a dedicated Z-Order but will all share the same (unique) one.
            if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder)) {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    prevLinPos = child._updatePrimitiveLinearPosition(prevLinPos);
                }
            }
            return prevLinPos;
        };
        Prim2DBase.prototype._updatePrimitiveZOrder = function (startPos, startZ, deltaZ) {
            if (this.isManualZOrder) {
                return null;
            }
            var newZ = startZ + ((this._primLinearPosition - startPos) * deltaZ);
            var isFlat = this._isFlagSet(BABYLON.SmartPropertyPrim.flagChildrenFlatZOrder);
            this._setZOrder(newZ, false);
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                this._firstZDirtyIndex = Prim2DBase_1._bigInt;
                this._clearFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
            }
            var curZ = newZ;
            // Check for the FlatZOrder, which means the children won't have a dedicated Z-Order but will all share the same (unique) one.
            if (isFlat) {
                if (this._children.length > 0) {
                    //let childrenZOrder = startZ + ((this._children[0]._primLinearPosition - startPos) * deltaZ);
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        child._updatePrimitiveFlatZOrder(this._zOrder);
                    }
                }
            }
            else {
                for (var _b = 0, _c = this._children; _b < _c.length; _b++) {
                    var child = _c[_b];
                    var r = child._updatePrimitiveZOrder(startPos, startZ, deltaZ);
                    if (r != null) {
                        curZ = r;
                    }
                }
            }
            this._zMax = isFlat ? newZ : (curZ + deltaZ);
            return curZ;
        };
        Prim2DBase.prototype._updatePrimitiveFlatZOrder = function (newZ) {
            if (this.isManualZOrder) {
                return;
            }
            this._setZOrder(newZ, false);
            this._zMax = newZ;
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagZOrderDirty)) {
                this._firstZDirtyIndex = Prim2DBase_1._bigInt;
                this._clearFlags(BABYLON.SmartPropertyPrim.flagZOrderDirty);
            }
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child._updatePrimitiveFlatZOrder(newZ);
            }
        };
        Prim2DBase.prototype._setZOrder = function (newZ, directEmit) {
            if (newZ !== this._zOrder) {
                this._zOrder = newZ;
                this.onPrimBecomesDirty();
                this.onZOrderChanged();
                if (this._actualZOrderChangedObservable && this._actualZOrderChangedObservable.hasObservers()) {
                    if (directEmit) {
                        this._actualZOrderChangedObservable.notifyObservers(newZ);
                    }
                    else {
                        Prim2DBase_1._zOrderChangedNotifList.push(this);
                    }
                }
            }
        };
        Prim2DBase.prototype._updateRenderMode = function () {
        };
        /**
         * This method is used to alter the contentArea of the Primitive before margin is applied.
         * In most of the case you won't need to override this method, but it can prove some usefulness, check the Rectangle2D class for a concrete application.
         * @param primSize the current size of the primitive
         * @param initialContentPosition the position of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing! x, y, z, w area left, bottom, right, top
         * @param initialContentArea the size of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing!
         */
        Prim2DBase.prototype._getInitialContentAreaToRef = function (primSize, initialContentPosition, initialContentArea) {
            initialContentArea.copyFrom(primSize);
            initialContentPosition.x = initialContentPosition.y = initialContentPosition.z = initialContentPosition.w = 0;
        };
        /**
         * This method is used to calculate the new size of the primitive based on the content which must stay the same
         * Check the Rectangle2D implementation for a concrete application.
         * @param primSize the current size of the primitive
         * @param newPrimSize the new size of the primitive. PLEASE ROUND THE values, we're talking about pixels and fraction of them are not our friends!
         */
        Prim2DBase.prototype._getActualSizeFromContentToRef = function (primSize, paddingOffset, newPrimSize) {
            newPrimSize.copyFrom(primSize);
        };
        Object.defineProperty(Prim2DBase.prototype, "layoutData", {
            /**
             * Get/set the layout data to use for this primitive.
             */
            get: function () {
                return this._layoutData;
            },
            set: function (value) {
                if (this._layoutData === value) {
                    return;
                }
                this._layoutData = value;
            },
            enumerable: true,
            configurable: true
        });
        return Prim2DBase;
    }(BABYLON.SmartPropertyPrim));
    Prim2DBase.PRIM2DBASE_PROPCOUNT = 25;
    Prim2DBase._bigInt = Math.pow(2, 30);
    Prim2DBase._nullPosition = BABYLON.Vector2.Zero();
    Prim2DBase._nullSize = BABYLON.Size.Zero();
    Prim2DBase.boundinbBoxReentrency = -1;
    Prim2DBase.nullSize = BABYLON.Size.Zero();
    Prim2DBase._bMinMax = BABYLON.Vector4.Zero();
    Prim2DBase._bMax = BABYLON.Vector2.Zero();
    Prim2DBase._bSize = BABYLON.Size.Zero();
    Prim2DBase._tpsBB = new BABYLON.BoundingInfo2D();
    Prim2DBase._tpsBB2 = new BABYLON.BoundingInfo2D();
    Prim2DBase._updatingDebugArea = false;
    Prim2DBase._bypassGroup2DExclusion = false;
    Prim2DBase._isCanvasInit = false;
    Prim2DBase._t0 = new BABYLON.Matrix();
    Prim2DBase._t1 = new BABYLON.Matrix();
    Prim2DBase._t2 = new BABYLON.Matrix();
    Prim2DBase._v0 = BABYLON.Vector2.Zero(); // Must stay with the value 0,0
    Prim2DBase._v30 = BABYLON.Vector3.Zero(); // Must stay with the value 0,0,0
    Prim2DBase._ts0 = BABYLON.Size.Zero();
    Prim2DBase._transMtx = BABYLON.Matrix.Zero();
    Prim2DBase._transTT = BABYLON.Transform2D.Zero();
    Prim2DBase._icPos = BABYLON.Vector2.Zero();
    Prim2DBase._icZone = BABYLON.Vector4.Zero();
    Prim2DBase._icArea = BABYLON.Size.Zero();
    Prim2DBase._size = BABYLON.Size.Zero();
    Prim2DBase._size2 = BABYLON.Size.Zero();
    Prim2DBase._curContentArea = BABYLON.Size.Zero();
    Prim2DBase._zOrderChangedNotifList = new Array();
    Prim2DBase._zRebuildReentrency = false;
    Prim2DBase._totalCount = 0;
    __decorate([
        BABYLON.instanceLevelProperty(1, function (pi) { return Prim2DBase_1.actualPositionProperty = pi; }, false, false, true)
    ], Prim2DBase.prototype, "actualPosition", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 1, function (pi) { return Prim2DBase_1.actualXProperty = pi; }, false, false, true)
    ], Prim2DBase.prototype, "actualX", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 2, function (pi) { return Prim2DBase_1.actualYProperty = pi; }, false, false, true)
    ], Prim2DBase.prototype, "actualY", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 3, function (pi) { return Prim2DBase_1.positionProperty = pi; }, false, false, true)
    ], Prim2DBase.prototype, "position", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 4, function (pi) { return Prim2DBase_1.xProperty = pi; }, false, false, true)
    ], Prim2DBase.prototype, "x", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 5, function (pi) { return Prim2DBase_1.yProperty = pi; }, false, false, true)
    ], Prim2DBase.prototype, "y", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 6, function (pi) { return Prim2DBase_1.sizeProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "size", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 7, function (pi) { return Prim2DBase_1.widthProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "width", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 8, function (pi) { return Prim2DBase_1.heightProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "height", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 9, function (pi) { return Prim2DBase_1.rotationProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "rotation", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 10, function (pi) { return Prim2DBase_1.scaleProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "scale", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 11, function (pi) { return Prim2DBase_1.actualSizeProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "actualSize", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 12, function (pi) { return Prim2DBase_1.actualWidthProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "actualWidth", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 13, function (pi) { return Prim2DBase_1.actualHeightProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "actualHeight", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 14, function (pi) { return Prim2DBase_1.originProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "origin", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 15, function (pi) { return Prim2DBase_1.levelVisibleProperty = pi; })
    ], Prim2DBase.prototype, "levelVisible", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 16, function (pi) { return Prim2DBase_1.isVisibleProperty = pi; })
    ], Prim2DBase.prototype, "isVisible", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 17, function (pi) { return Prim2DBase_1.zOrderProperty = pi; })
    ], Prim2DBase.prototype, "zOrder", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 18, function (pi) { return Prim2DBase_1.marginProperty = pi; })
    ], Prim2DBase.prototype, "margin", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 19, function (pi) { return Prim2DBase_1.paddingProperty = pi; })
    ], Prim2DBase.prototype, "padding", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 20, function (pi) { return Prim2DBase_1.marginAlignmentProperty = pi; })
    ], Prim2DBase.prototype, "marginAlignment", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 21, function (pi) { return Prim2DBase_1.opacityProperty = pi; })
    ], Prim2DBase.prototype, "opacity", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 22, function (pi) { return Prim2DBase_1.scaleXProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "scaleX", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 23, function (pi) { return Prim2DBase_1.scaleYProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "scaleY", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT + 24, function (pi) { return Prim2DBase_1.actualScaleProperty = pi; }, false, true)
    ], Prim2DBase.prototype, "actualScale", null);
    Prim2DBase = Prim2DBase_1 = __decorate([
        BABYLON.className("Prim2DBase", "BABYLON")
    ], Prim2DBase);
    BABYLON.Prim2DBase = Prim2DBase;
    var PrimitiveAlignment_1, PrimitiveThickness_1, Prim2DBase_1;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.prim2dBase.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var GroupInstanceInfo = (function () {
        function GroupInstanceInfo(owner, mrc, partCount) {
            this._partCount = partCount;
            this.owner = owner;
            this.modelRenderCache = mrc;
            this.modelRenderCache.addRef();
            this.partIndexFromId = new BABYLON.StringDictionary();
            this._usedShaderCategories = new Array(partCount);
            this._strides = new Array(partCount);
            this._opaqueData = null;
            this._alphaTestData = null;
            this._transparentData = null;
            this.opaqueDirty = this.alphaTestDirty = this.transparentDirty = this.transparentOrderDirty = false;
        }
        GroupInstanceInfo.prototype.dispose = function () {
            if (this._isDisposed) {
                return false;
            }
            if (this.modelRenderCache) {
                this.modelRenderCache.dispose();
                this.modelRenderCache = null;
            }
            var engine = this.owner.owner.engine;
            if (this._opaqueData) {
                this._opaqueData.forEach(function (d) { return d.dispose(engine); });
                this._opaqueData = null;
            }
            if (this._alphaTestData) {
                this._alphaTestData.forEach(function (d) { return d.dispose(engine); });
                this._alphaTestData = null;
            }
            if (this._transparentData) {
                this._transparentData.forEach(function (d) { return d.dispose(engine); });
                this._transparentData = null;
            }
            this.partIndexFromId = null;
            this._isDisposed = true;
            return true;
        };
        Object.defineProperty(GroupInstanceInfo.prototype, "hasOpaqueData", {
            get: function () {
                return this._opaqueData != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "hasAlphaTestData", {
            get: function () {
                return this._alphaTestData != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "hasTransparentData", {
            get: function () {
                return this._transparentData != null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "opaqueData", {
            get: function () {
                if (!this._opaqueData) {
                    this._opaqueData = new Array(this._partCount);
                    for (var i = 0; i < this._partCount; i++) {
                        this._opaqueData[i] = new GroupInfoPartData(this._strides[i]);
                    }
                }
                return this._opaqueData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "alphaTestData", {
            get: function () {
                if (!this._alphaTestData) {
                    this._alphaTestData = new Array(this._partCount);
                    for (var i = 0; i < this._partCount; i++) {
                        this._alphaTestData[i] = new GroupInfoPartData(this._strides[i]);
                    }
                }
                return this._alphaTestData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "transparentData", {
            get: function () {
                if (!this._transparentData) {
                    this._transparentData = new Array(this._partCount);
                    for (var i = 0; i < this._partCount; i++) {
                        var zoff = this.modelRenderCache._partData[i]._zBiasOffset;
                        this._transparentData[i] = new TransparentGroupInfoPartData(this._strides[i], zoff);
                    }
                }
                return this._transparentData;
            },
            enumerable: true,
            configurable: true
        });
        GroupInstanceInfo.prototype.sortTransparentData = function () {
            if (!this.transparentOrderDirty) {
                return;
            }
            for (var i = 0; i < this._transparentData.length; i++) {
                var td = this._transparentData[i];
                td._partData.sort();
            }
            this.transparentOrderDirty = false;
        };
        Object.defineProperty(GroupInstanceInfo.prototype, "usedShaderCategories", {
            get: function () {
                return this._usedShaderCategories;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GroupInstanceInfo.prototype, "strides", {
            get: function () {
                return this._strides;
            },
            enumerable: true,
            configurable: true
        });
        return GroupInstanceInfo;
    }());
    BABYLON.GroupInstanceInfo = GroupInstanceInfo;
    var TransparentSegment = (function () {
        function TransparentSegment() {
            this.groupInsanceInfo = null;
            this.startZ = 0;
            this.endZ = 0;
            this.startDataIndex = BABYLON.Prim2DBase._bigInt;
            this.endDataIndex = 0;
            this.partBuffers = null;
        }
        TransparentSegment.prototype.dispose = function (engine) {
            if (this.partBuffers) {
                this.partBuffers.forEach(function (b) { return engine._releaseBuffer(b); });
                this.partBuffers.splice(0);
                this.partBuffers = null;
            }
        };
        return TransparentSegment;
    }());
    BABYLON.TransparentSegment = TransparentSegment;
    var GroupInfoPartData = (function () {
        function GroupInfoPartData(stride) {
            this._partData = null;
            this._partBuffer = null;
            this._partBufferSize = 0;
            this._partData = new BABYLON.DynamicFloatArray(stride / 4, 50);
            this._isDisposed = false;
        }
        GroupInfoPartData.prototype.dispose = function (engine) {
            if (this._isDisposed) {
                return false;
            }
            if (this._partBuffer) {
                engine._releaseBuffer(this._partBuffer);
                this._partBuffer = null;
            }
            this._partData = null;
            this._isDisposed = true;
        };
        return GroupInfoPartData;
    }());
    BABYLON.GroupInfoPartData = GroupInfoPartData;
    var TransparentGroupInfoPartData = (function (_super) {
        __extends(TransparentGroupInfoPartData, _super);
        function TransparentGroupInfoPartData(stride, zoff) {
            var _this = _super.call(this, stride) || this;
            _this._partData.compareValueOffset = zoff;
            _this._partData.sortingAscending = false;
            return _this;
        }
        return TransparentGroupInfoPartData;
    }(GroupInfoPartData));
    BABYLON.TransparentGroupInfoPartData = TransparentGroupInfoPartData;
    var ModelRenderCache = (function () {
        function ModelRenderCache(engine, modelKey) {
            this._engine = engine;
            this._modelKey = modelKey;
            this._nextKey = 1;
            this._refCounter = 1;
            this._partData = null;
        }
        ModelRenderCache.prototype.dispose = function () {
            if (--this._refCounter !== 0) {
                return false;
            }
            // Remove the Model Render Cache from the global dictionary
            var edata = this._engine.getExternalData("__BJSCANVAS2D__");
            if (edata) {
                edata.DisposeModelRenderCache(this);
            }
            return true;
        };
        Object.defineProperty(ModelRenderCache.prototype, "isDisposed", {
            get: function () {
                return this._refCounter <= 0;
            },
            enumerable: true,
            configurable: true
        });
        ModelRenderCache.prototype.addRef = function () {
            return ++this._refCounter;
        };
        Object.defineProperty(ModelRenderCache.prototype, "modelKey", {
            get: function () {
                return this._modelKey;
            },
            enumerable: true,
            configurable: true
        });
        ModelRenderCache.prototype.updateModelRenderCache = function (prim) {
            return false;
        };
        /**
         * Render the model instances
         * @param instanceInfo
         * @param context
         * @return must return true is the rendering succeed, false if the rendering couldn't be done (asset's not yet ready, like Effect)
         */
        ModelRenderCache.prototype.render = function (instanceInfo, context) {
            return true;
        };
        ModelRenderCache.prototype.getPartIndexFromId = function (partId) {
            for (var i = 0; i < this._partData.length; i++) {
                if (this._partData[i]._partId === partId) {
                    return i;
                }
            }
            return null;
        };
        ModelRenderCache.prototype.loadInstancingAttributes = function (partId, effect) {
            var i = this.getPartIndexFromId(partId);
            if (i === null) {
                return null;
            }
            var ci = this._partsClassInfo[i];
            var categories = this._partData[i]._partUsedCategories;
            var res = ci.classContent.getInstancingAttributeInfos(effect, categories);
            return res;
        };
        ModelRenderCache.prototype.setupUniforms = function (effect, partIndex, data, elementCount) {
            var pd = this._partData[partIndex];
            var offset = (pd._partDataStride / 4) * elementCount;
            var pci = this._partsClassInfo[partIndex];
            var self = this;
            pci.fullContent.forEach(function (k, v) {
                if (!v.category || pd._partUsedCategories.indexOf(v.category) !== -1) {
                    switch (v.dataType) {
                        case 4 /* float */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                                effect.setFloat(v.attributeName, data.buffer[offset + attribOffset]);
                                break;
                            }
                        case 0 /* Vector2 */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                                ModelRenderCache.v2.x = data.buffer[offset + attribOffset + 0];
                                ModelRenderCache.v2.y = data.buffer[offset + attribOffset + 1];
                                effect.setVector2(v.attributeName, ModelRenderCache.v2);
                                break;
                            }
                        case 5 /* Color3 */:
                        case 1 /* Vector3 */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                                ModelRenderCache.v3.x = data.buffer[offset + attribOffset + 0];
                                ModelRenderCache.v3.y = data.buffer[offset + attribOffset + 1];
                                ModelRenderCache.v3.z = data.buffer[offset + attribOffset + 2];
                                effect.setVector3(v.attributeName, ModelRenderCache.v3);
                                break;
                            }
                        case 6 /* Color4 */:
                        case 2 /* Vector4 */:
                            {
                                var attribOffset = v.instanceOffset.get(pd._partJoinedUsedCategories);
                                ModelRenderCache.v4.x = data.buffer[offset + attribOffset + 0];
                                ModelRenderCache.v4.y = data.buffer[offset + attribOffset + 1];
                                ModelRenderCache.v4.z = data.buffer[offset + attribOffset + 2];
                                ModelRenderCache.v4.w = data.buffer[offset + attribOffset + 3];
                                effect.setVector4(v.attributeName, ModelRenderCache.v4);
                                break;
                            }
                        default:
                    }
                }
            });
        };
        return ModelRenderCache;
    }());
    //setupUniformsLocation(effect: Effect, uniforms: string[], partId: number) {
    //    let i = this.getPartIndexFromId(partId);
    //    if (i === null) {
    //        return null;
    //    }
    //    let pci = this._partsClassInfo[i];
    //    pci.fullContent.forEach((k, v) => {
    //        if (uniforms.indexOf(v.attributeName) !== -1) {
    //            v.uniformLocation = effect.getUniform(v.attributeName);
    //        }
    //    });
    //}
    ModelRenderCache.v2 = BABYLON.Vector2.Zero();
    ModelRenderCache.v3 = BABYLON.Vector3.Zero();
    ModelRenderCache.v4 = BABYLON.Vector4.Zero();
    BABYLON.ModelRenderCache = ModelRenderCache;
    var ModelRenderCachePartData = (function () {
        function ModelRenderCachePartData() {
        }
        return ModelRenderCachePartData;
    }());
    BABYLON.ModelRenderCachePartData = ModelRenderCachePartData;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.modelRenderCache.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var InstanceClassInfo = (function () {
        function InstanceClassInfo(base) {
            this._baseInfo = base;
            this._nextOffset = new BABYLON.StringDictionary();
            this._attributes = new Array();
        }
        InstanceClassInfo.prototype.mapProperty = function (propInfo, push) {
            var curOff = this._nextOffset.getOrAdd(InstanceClassInfo._CurCategories, 0);
            propInfo.instanceOffset.add(InstanceClassInfo._CurCategories, this._getBaseOffset(InstanceClassInfo._CurCategories) + curOff);
            //console.log(`[${InstanceClassInfo._CurCategories}] New PropInfo. Category: ${propInfo.category}, Name: ${propInfo.attributeName}, Offset: ${propInfo.instanceOffset.get(InstanceClassInfo._CurCategories)}, Size: ${propInfo.size / 4}`);
            this._nextOffset.set(InstanceClassInfo._CurCategories, curOff + (propInfo.size / 4));
            if (push) {
                this._attributes.push(propInfo);
            }
        };
        InstanceClassInfo.prototype.getInstancingAttributeInfos = function (effect, categories) {
            var catInline = ";" + categories.join(";") + ";";
            var res = new Array();
            var curInfo = this;
            while (curInfo) {
                for (var _i = 0, _a = curInfo._attributes; _i < _a.length; _i++) {
                    var attrib = _a[_i];
                    // Only map if there's no category assigned to the instance data or if there's a category and it's in the given list
                    if (!attrib.category || categories.indexOf(attrib.category) !== -1) {
                        var index = effect.getAttributeLocationByName(attrib.attributeName);
                        if (index === -1) {
                            throw new Error("Attribute " + attrib.attributeName + " was not found in Effect: " + effect.name + ". It's certainly no longer used in the Effect's Shaders");
                        }
                        var iai = new BABYLON.InstancingAttributeInfo();
                        iai.index = index;
                        iai.attributeSize = attrib.size / 4; // attrib.size is in byte and we need to store in "component" (i.e float is 1, vec3 is 3)
                        iai.offset = attrib.instanceOffset.get(catInline) * 4; // attrib.instanceOffset is in float, iai.offset must be in bytes
                        iai.attributeName = attrib.attributeName;
                        res.push(iai);
                    }
                }
                curInfo = curInfo._baseInfo;
            }
            return res;
        };
        InstanceClassInfo.prototype.getShaderAttributes = function (categories) {
            var res = new Array();
            var curInfo = this;
            while (curInfo) {
                for (var _i = 0, _a = curInfo._attributes; _i < _a.length; _i++) {
                    var attrib = _a[_i];
                    // Only map if there's no category assigned to the instance data or if there's a category and it's in the given list
                    if (!attrib.category || categories.indexOf(attrib.category) !== -1) {
                        res.push(attrib.attributeName);
                    }
                }
                curInfo = curInfo._baseInfo;
            }
            return res;
        };
        InstanceClassInfo.prototype._getBaseOffset = function (categories) {
            var curOffset = 0;
            var curBase = this._baseInfo;
            while (curBase) {
                curOffset += curBase._nextOffset.getOrAdd(categories, 0);
                curBase = curBase._baseInfo;
            }
            return curOffset;
        };
        return InstanceClassInfo;
    }());
    BABYLON.InstanceClassInfo = InstanceClassInfo;
    var InstancePropInfo = (function () {
        function InstancePropInfo() {
            this.instanceOffset = new BABYLON.StringDictionary();
        }
        InstancePropInfo.prototype.setSize = function (val) {
            if (val instanceof BABYLON.Vector2) {
                this.size = 8;
                this.dataType = 0 /* Vector2 */;
                return;
            }
            if (val instanceof BABYLON.Vector3) {
                this.size = 12;
                this.dataType = 1 /* Vector3 */;
                return;
            }
            if (val instanceof BABYLON.Vector4) {
                this.size = 16;
                this.dataType = 2 /* Vector4 */;
                return;
            }
            if (val instanceof BABYLON.Matrix) {
                throw new Error("Matrix type is not supported by WebGL Instance Buffer, you have to use four Vector4 properties instead");
            }
            if (typeof (val) === "number") {
                this.size = 4;
                this.dataType = 4 /* float */;
                return;
            }
            if (val instanceof BABYLON.Color3) {
                this.size = 12;
                this.dataType = 5 /* Color3 */;
                return;
            }
            if (val instanceof BABYLON.Color4) {
                this.size = 16;
                this.dataType = 6 /* Color4 */;
                return;
            }
            if (val instanceof BABYLON.Size) {
                this.size = 8;
                this.dataType = 7 /* Size */;
                return;
            }
            return;
        };
        InstancePropInfo.prototype.writeData = function (array, offset, val) {
            switch (this.dataType) {
                case 0 /* Vector2 */:
                    {
                        var v = val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        break;
                    }
                case 1 /* Vector3 */:
                    {
                        var v = val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        array[offset + 2] = v.z;
                        break;
                    }
                case 2 /* Vector4 */:
                    {
                        var v = val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        array[offset + 2] = v.z;
                        array[offset + 3] = v.w;
                        break;
                    }
                case 5 /* Color3 */:
                    {
                        var v = val;
                        array[offset + 0] = v.r;
                        array[offset + 1] = v.g;
                        array[offset + 2] = v.b;
                        break;
                    }
                case 6 /* Color4 */:
                    {
                        var v = val;
                        array[offset + 0] = v.r;
                        array[offset + 1] = v.g;
                        array[offset + 2] = v.b;
                        array[offset + 3] = v.a;
                        break;
                    }
                case 4 /* float */:
                    {
                        var v = val;
                        array[offset] = v;
                        break;
                    }
                case 3 /* Matrix */:
                    {
                        var v = val;
                        for (var i = 0; i < 16; i++) {
                            array[offset + i] = v.m[i];
                        }
                        break;
                    }
                case 7 /* Size */:
                    {
                        var s = val;
                        array[offset + 0] = s.width;
                        array[offset + 1] = s.height;
                        break;
                    }
            }
        };
        return InstancePropInfo;
    }());
    BABYLON.InstancePropInfo = InstancePropInfo;
    function instanceData(category, shaderAttributeName) {
        return function (target, propName, descriptor) {
            var dic = BABYLON.ClassTreeInfo.getOrRegister(target, function (base) { return new InstanceClassInfo(base); });
            var node = dic.getLevelOf(target);
            var instanceDataName = propName;
            shaderAttributeName = shaderAttributeName || instanceDataName;
            var info = node.levelContent.get(instanceDataName);
            if (info) {
                throw new Error("The ID " + instanceDataName + " is already taken by another instance data");
            }
            info = new InstancePropInfo();
            info.attributeName = shaderAttributeName;
            info.category = category || null;
            if (info.category) {
                info.delimitedCategory = ";" + info.category + ";";
            }
            node.levelContent.add(instanceDataName, info);
            descriptor.get = function () {
                return null;
            };
            descriptor.set = function (val) {
                // Check that we're not trying to set a property that belongs to a category that is not allowed (current)
                // Quit if it's the case, otherwise we could overwrite data somewhere...
                if (info.category && InstanceClassInfo._CurCategories.indexOf(info.delimitedCategory) === -1) {
                    return;
                }
                if (!info.size) {
                    info.setSize(val);
                    node.classContent.mapProperty(info, true);
                }
                else if (!info.instanceOffset.contains(InstanceClassInfo._CurCategories)) {
                    node.classContent.mapProperty(info, false);
                }
                var obj = this;
                if (obj.dataBuffer && obj.dataElements) {
                    var offset = obj.dataElements[obj.curElement].offset + info.instanceOffset.get(InstanceClassInfo._CurCategories);
                    info.writeData(obj.dataBuffer.buffer, offset, val);
                }
            };
        };
    }
    BABYLON.instanceData = instanceData;
    var InstanceDataBase = (function () {
        function InstanceDataBase(partId, dataElementCount) {
            this.id = partId;
            this.curElement = 0;
            this._dataElementCount = dataElementCount;
            this.renderMode = 0;
            this.arrayLengthChanged = false;
        }
        Object.defineProperty(InstanceDataBase.prototype, "zBias", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstanceDataBase.prototype, "transformX", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstanceDataBase.prototype, "transformY", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstanceDataBase.prototype, "opacity", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        InstanceDataBase.prototype.getClassTreeInfo = function () {
            if (!this.typeInfo) {
                this.typeInfo = BABYLON.ClassTreeInfo.get(Object.getPrototypeOf(this));
            }
            return this.typeInfo;
        };
        InstanceDataBase.prototype.allocElements = function () {
            if (!this.dataBuffer || this.dataElements) {
                return;
            }
            var res = new Array(this.dataElementCount);
            for (var i = 0; i < this.dataElementCount; i++) {
                res[i] = this.dataBuffer.allocElement();
            }
            this.dataElements = res;
        };
        InstanceDataBase.prototype.freeElements = function () {
            if (!this.dataElements) {
                return;
            }
            for (var _i = 0, _a = this.dataElements; _i < _a.length; _i++) {
                var ei = _a[_i];
                this.dataBuffer.freeElement(ei);
            }
            this.dataElements = null;
        };
        Object.defineProperty(InstanceDataBase.prototype, "dataElementCount", {
            get: function () {
                return this._dataElementCount;
            },
            set: function (value) {
                if (value === this._dataElementCount) {
                    return;
                }
                this.arrayLengthChanged = true;
                this.freeElements();
                this._dataElementCount = value;
                this.allocElements();
            },
            enumerable: true,
            configurable: true
        });
        return InstanceDataBase;
    }());
    __decorate([
        instanceData()
    ], InstanceDataBase.prototype, "zBias", null);
    __decorate([
        instanceData()
    ], InstanceDataBase.prototype, "transformX", null);
    __decorate([
        instanceData()
    ], InstanceDataBase.prototype, "transformY", null);
    __decorate([
        instanceData()
    ], InstanceDataBase.prototype, "opacity", null);
    BABYLON.InstanceDataBase = InstanceDataBase;
    var RenderablePrim2D = RenderablePrim2D_1 = (function (_super) {
        __extends(RenderablePrim2D, _super);
        function RenderablePrim2D(settings) {
            var _this = _super.call(this, settings) || this;
            _this._transparentPrimitiveInfo = null;
            return _this;
        }
        Object.defineProperty(RenderablePrim2D.prototype, "isAlphaTest", {
            get: function () {
                return this._useTextureAlpha() || this._isPrimAlphaTest();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderablePrim2D.prototype, "isTransparent", {
            get: function () {
                return (this.actualOpacity < 1) || this._shouldUseAlphaFromTexture() || this._isPrimTransparent();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderablePrim2D.prototype, "renderMode", {
            get: function () {
                return this._renderMode;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Dispose the primitive and its resources, remove it from its parent
         */
        RenderablePrim2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.renderGroup) {
                this.renderGroup._setCacheGroupDirty();
            }
            if (this._transparentPrimitiveInfo) {
                this.renderGroup._renderableData.removeTransparentPrimitiveInfo(this._transparentPrimitiveInfo);
                this._transparentPrimitiveInfo = null;
            }
            if (this._instanceDataParts) {
                this._cleanupInstanceDataParts();
            }
            if (this._modelRenderCache) {
                this._modelRenderCache.dispose();
                this._modelRenderCache = null;
            }
            if (this._instanceDataParts) {
                this._instanceDataParts.forEach(function (p) {
                    p.freeElements();
                });
                this._instanceDataParts = null;
            }
            return true;
        };
        RenderablePrim2D.prototype._cleanupInstanceDataParts = function () {
            var gii = null;
            for (var _i = 0, _a = this._instanceDataParts; _i < _a.length; _i++) {
                var part = _a[_i];
                part.freeElements();
                gii = part.groupInstanceInfo;
            }
            if (gii) {
                var usedCount = 0;
                if (gii.hasOpaqueData) {
                    var od = gii.opaqueData[0];
                    usedCount += od._partData.usedElementCount;
                    gii.opaqueDirty = true;
                }
                if (gii.hasAlphaTestData) {
                    var atd = gii.alphaTestData[0];
                    usedCount += atd._partData.usedElementCount;
                    gii.alphaTestDirty = true;
                }
                if (gii.hasTransparentData) {
                    var td = gii.transparentData[0];
                    usedCount += td._partData.usedElementCount;
                    gii.transparentDirty = true;
                }
                if (usedCount === 0 && gii.modelRenderCache != null) {
                    this.renderGroup._renderableData._renderGroupInstancesInfo.remove(gii.modelRenderCache.modelKey);
                    gii.dispose();
                }
                if (this._modelRenderCache) {
                    this._modelRenderCache.dispose();
                    this._modelRenderCache = null;
                }
            }
            this._instanceDataParts = null;
        };
        RenderablePrim2D.prototype._prepareRenderPre = function (context) {
            _super.prototype._prepareRenderPre.call(this, context);
            // If the model changed and we have already an instance, we must remove this instance from the obsolete model
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagModelDirty) && this._instanceDataParts) {
                this._cleanupInstanceDataParts();
            }
            // Need to create the model?
            var setupModelRenderCache = false;
            if (!this._modelRenderCache || this._isFlagSet(BABYLON.SmartPropertyPrim.flagModelDirty)) {
                setupModelRenderCache = this._createModelRenderCache();
            }
            var gii = null;
            var newInstance = false;
            // Need to create the instance data parts?
            if (!this._instanceDataParts) {
                // Yes, flag it for later, more processing will have to be done
                newInstance = true;
                gii = this._createModelDataParts();
            }
            // If the ModelRenderCache is brand new, now is the time to call the implementation's specific setup method to create the rendering resources
            if (setupModelRenderCache) {
                this.setupModelRenderCache(this._modelRenderCache);
            }
            if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagModelUpdate)) {
                if (this._modelRenderCache.updateModelRenderCache(this)) {
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagModelUpdate);
                }
            }
            // At this stage we have everything correctly initialized, ModelRenderCache is setup, Model Instance data are good too, they have allocated elements in the Instanced DynamicFloatArray.
            // The last thing to do is check if the instanced related data must be updated because a InstanceLevel property had changed or the primitive visibility changed.
            if (this._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagVisibilityChanged | BABYLON.SmartPropertyPrim.flagNeedRefresh) || context.forceRefreshPrimitive || newInstance || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep) || this._mustUpdateInstance()) {
                this._updateInstanceDataParts(gii);
            }
        };
        RenderablePrim2D.prototype._createModelRenderCache = function () {
            var _this = this;
            var setupModelRenderCache = false;
            if (this._modelRenderCache) {
                this._modelRenderCache.dispose();
            }
            this._modelRenderCache = this.owner._engineData.GetOrAddModelCache(this.modelKey, function (key) {
                var mrc = _this.createModelRenderCache(key);
                setupModelRenderCache = true;
                return mrc;
            });
            this._clearFlags(BABYLON.SmartPropertyPrim.flagModelDirty);
            // if this is still false it means the MRC already exists, so we add a reference to it
            if (!setupModelRenderCache) {
                this._modelRenderCache.addRef();
            }
            return setupModelRenderCache;
        };
        RenderablePrim2D.prototype._createModelDataParts = function () {
            var _this = this;
            // Create the instance data parts of the primitive and store them
            var parts = this.createInstanceDataParts();
            this._instanceDataParts = parts;
            // Check if the ModelRenderCache for this particular instance is also brand new, initialize it if it's the case
            if (!this._modelRenderCache._partData) {
                this._setupModelRenderCache(parts);
            }
            // The Rendering resources (Effect, VB, IB, Textures) are stored in the ModelRenderCache
            // But it's the RenderGroup that will store all the Instanced related data to render all the primitive it owns.
            // So for a given ModelKey we getOrAdd a GroupInstanceInfo that will store all these data
            var gii = this.renderGroup._renderableData._renderGroupInstancesInfo.getOrAddWithFactory(this.modelKey, function (k) {
                var res = new BABYLON.GroupInstanceInfo(_this.renderGroup, _this._modelRenderCache, _this._modelRenderCache._partData.length);
                for (var j = 0; j < _this._modelRenderCache._partData.length; j++) {
                    var part = _this._instanceDataParts[j];
                    res.partIndexFromId.add(part.id.toString(), j);
                    res.usedShaderCategories[j] = ";" + _this.getUsedShaderCategories(part).join(";") + ";";
                    res.strides[j] = _this._modelRenderCache._partData[j]._partDataStride;
                }
                return res;
            });
            // Get the GroupInfoDataPart corresponding to the render category of the part
            var rm = 0;
            var gipd = null;
            if (this.isTransparent) {
                gipd = gii.transparentData;
                rm = BABYLON.Render2DContext.RenderModeTransparent;
            }
            else if (this.isAlphaTest) {
                gipd = gii.alphaTestData;
                rm = BABYLON.Render2DContext.RenderModeAlphaTest;
            }
            else {
                gipd = gii.opaqueData;
                rm = BABYLON.Render2DContext.RenderModeOpaque;
            }
            // For each instance data part of the primitive, allocate the instanced element it needs for render
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                part.dataBuffer = gipd[i]._partData;
                part.allocElements();
                part.renderMode = rm;
                part.groupInstanceInfo = gii;
            }
            return gii;
        };
        RenderablePrim2D.prototype._setupModelRenderCache = function (parts) {
            var ctiArray = new Array();
            this._modelRenderCache._partData = new Array();
            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                var dataPart = parts_1[_i];
                var pd = new BABYLON.ModelRenderCachePartData();
                this._modelRenderCache._partData.push(pd);
                var cat = this.getUsedShaderCategories(dataPart);
                var cti = dataPart.getClassTreeInfo();
                // Make sure the instance is visible other the properties won't be set and their size/offset wont be computed
                var curVisible = this.isVisible;
                this.isVisible = true;
                // We manually trigger refreshInstanceData for the only sake of evaluating each instance property size and offset in the instance data, this can only be made at runtime. Once it's done we have all the information to create the instance data buffer.
                //console.log("Build Prop Layout for " + Tools.getClassName(this._instanceDataParts[0]));
                var joinCat = ";" + cat.join(";") + ";";
                pd._partJoinedUsedCategories = joinCat;
                InstanceClassInfo._CurCategories = joinCat;
                var obj = this.beforeRefreshForLayoutConstruction(dataPart);
                if (!this.refreshInstanceDataPart(dataPart)) {
                    console.log("Layout construction for " + BABYLON.Tools.getClassName(this._instanceDataParts[0]) + " failed because refresh returned false");
                }
                this.afterRefreshForLayoutConstruction(dataPart, obj);
                this.isVisible = curVisible;
                var size = 0;
                cti.fullContent.forEach(function (k, v) {
                    if (!v.category || cat.indexOf(v.category) !== -1) {
                        if (v.attributeName === "zBias") {
                            pd._zBiasOffset = v.instanceOffset.get(joinCat);
                        }
                        if (!v.size) {
                            console.log("ERROR: Couldn't detect the size of the Property " + v.attributeName + " from type " + BABYLON.Tools.getClassName(cti.type) + ". Property is ignored.");
                        }
                        else {
                            size += v.size;
                        }
                    }
                });
                pd._partDataStride = size;
                pd._partUsedCategories = cat;
                pd._partId = dataPart.id;
                ctiArray.push(cti);
            }
            this._modelRenderCache._partsClassInfo = ctiArray;
        };
        RenderablePrim2D.prototype.onZOrderChanged = function () {
            if (this.isTransparent && this._transparentPrimitiveInfo) {
                this.renderGroup._renderableData.transparentPrimitiveZChanged(this._transparentPrimitiveInfo);
                var gii = this.renderGroup._renderableData._renderGroupInstancesInfo.get(this.modelKey);
                // Flag the transparentData dirty has will have to sort it again
                gii.transparentOrderDirty = true;
            }
        };
        RenderablePrim2D.prototype._mustUpdateInstance = function () {
            return false;
        };
        RenderablePrim2D.prototype._useTextureAlpha = function () {
            return false;
        };
        RenderablePrim2D.prototype._shouldUseAlphaFromTexture = function () {
            return false;
        };
        RenderablePrim2D.prototype._isPrimAlphaTest = function () {
            return false;
        };
        RenderablePrim2D.prototype._isPrimTransparent = function () {
            return false;
        };
        RenderablePrim2D.prototype._updateInstanceDataParts = function (gii) {
            // Fetch the GroupInstanceInfo if we don't already have it
            var rd = this.renderGroup._renderableData;
            if (!gii) {
                gii = rd._renderGroupInstancesInfo.get(this.modelKey);
            }
            var isTransparent = this.isTransparent;
            var isAlphaTest = this.isAlphaTest;
            var wereTransparent = false;
            // Check a render mode change
            var rmChanged = false;
            if (this._instanceDataParts.length > 0) {
                var firstPart = this._instanceDataParts[0];
                var partRM = firstPart.renderMode;
                var curRM = this.renderMode;
                if (partRM !== curRM) {
                    wereTransparent = partRM === BABYLON.Render2DContext.RenderModeTransparent;
                    rmChanged = true;
                    var gipd = void 0;
                    switch (curRM) {
                        case BABYLON.Render2DContext.RenderModeTransparent:
                            gipd = gii.transparentData;
                            break;
                        case BABYLON.Render2DContext.RenderModeAlphaTest:
                            gipd = gii.alphaTestData;
                            break;
                        default:
                            gipd = gii.opaqueData;
                    }
                    for (var i = 0; i < this._instanceDataParts.length; i++) {
                        var part = this._instanceDataParts[i];
                        part.freeElements();
                        part.dataBuffer = gipd[i]._partData;
                        part.renderMode = curRM;
                    }
                }
            }
            // Handle changes related to ZOffset
            var visChanged = this._isFlagSet(BABYLON.SmartPropertyPrim.flagVisibilityChanged);
            if (isTransparent || wereTransparent) {
                // Handle visibility change, which is also triggered when the primitive just got created
                if (visChanged || rmChanged) {
                    if (this.isVisible && !wereTransparent) {
                        if (!this._transparentPrimitiveInfo) {
                            // Add the primitive to the list of transparent ones in the group that render is
                            this._transparentPrimitiveInfo = rd.addNewTransparentPrimitiveInfo(this, gii);
                        }
                    }
                    else {
                        if (this._transparentPrimitiveInfo) {
                            rd.removeTransparentPrimitiveInfo(this._transparentPrimitiveInfo);
                            this._transparentPrimitiveInfo = null;
                        }
                    }
                    gii.transparentOrderDirty = true;
                }
            }
            var rebuildTrans = false;
            // For each Instance Data part, refresh it to update the data in the DynamicFloatArray
            for (var _i = 0, _a = this._instanceDataParts; _i < _a.length; _i++) {
                var part = _a[_i];
                var justAllocated = false;
                // Check if we need to allocate data elements (hidden prim which becomes visible again)
                if (!part.dataElements && (visChanged || rmChanged || this.isVisible)) {
                    part.allocElements();
                    justAllocated = true;
                }
                InstanceClassInfo._CurCategories = gii.usedShaderCategories[gii.partIndexFromId.get(part.id.toString())];
                // Will return false if the instance should not be rendered (not visible or other any reasons)
                part.arrayLengthChanged = false;
                if (!this.refreshInstanceDataPart(part)) {
                    // Free the data element
                    if (part.dataElements) {
                        part.freeElements();
                    }
                    // The refresh couldn't succeed, push the primitive to be dirty again for the next render
                    if (this.isVisible) {
                        rd._primNewDirtyList.push(this);
                    }
                }
                rebuildTrans = rebuildTrans || part.arrayLengthChanged || justAllocated;
            }
            this._instanceDirtyFlags = 0;
            // Make the appropriate data dirty
            if (isTransparent) {
                gii.transparentDirty = true;
                if (rebuildTrans) {
                    rd._transparentListChanged = true;
                }
            }
            else if (isAlphaTest) {
                gii.alphaTestDirty = true;
            }
            else {
                gii.opaqueDirty = true;
            }
            this._clearFlags(BABYLON.SmartPropertyPrim.flagVisibilityChanged); // Reset the flag as we've handled the case            
        };
        RenderablePrim2D.prototype._updateTransparentSegmentIndices = function (ts) {
            var minOff = BABYLON.Prim2DBase._bigInt;
            var maxOff = 0;
            for (var _i = 0, _a = this._instanceDataParts; _i < _a.length; _i++) {
                var part = _a[_i];
                if (part && part.dataElements) {
                    part.dataBuffer.pack();
                    for (var _b = 0, _c = part.dataElements; _b < _c.length; _b++) {
                        var el = _c[_b];
                        minOff = Math.min(minOff, el.offset);
                        maxOff = Math.max(maxOff, el.offset);
                    }
                    ts.startDataIndex = Math.min(ts.startDataIndex, minOff / part.dataBuffer.stride);
                    ts.endDataIndex = Math.max(ts.endDataIndex, (maxOff / part.dataBuffer.stride) + 1); // +1 for exclusive
                }
            }
        };
        // This internal method is mainly used for transparency processing
        RenderablePrim2D.prototype._getNextPrimZOrder = function () {
            var length = this._instanceDataParts.length;
            for (var i = 0; i < length; i++) {
                var part = this._instanceDataParts[i];
                if (part) {
                    var stride = part.dataBuffer.stride;
                    var lastElementOffset = part.dataElements[part.dataElements.length - 1].offset;
                    // check if it's the last in the DFA
                    if (part.dataBuffer.totalElementCount * stride <= lastElementOffset) {
                        return null;
                    }
                    // Return the Z of the next primitive that lies in the DFA
                    return part.dataBuffer[lastElementOffset + stride + this.modelRenderCache._partData[i]._zBiasOffset];
                }
            }
            return null;
        };
        // This internal method is mainly used for transparency processing
        RenderablePrim2D.prototype._getPrevPrimZOrder = function () {
            var length = this._instanceDataParts.length;
            for (var i = 0; i < length; i++) {
                var part = this._instanceDataParts[i];
                if (part) {
                    var stride = part.dataBuffer.stride;
                    var firstElementOffset = part.dataElements[0].offset;
                    // check if it's the first in the DFA
                    if (firstElementOffset === 0) {
                        return null;
                    }
                    // Return the Z of the previous primitive that lies in the DFA
                    return part.dataBuffer[firstElementOffset - stride + this.modelRenderCache._partData[i]._zBiasOffset];
                }
            }
            return null;
        };
        /**
         * Transform a given point using the Primitive's origin setting.
         * This method requires the Primitive's actualSize to be accurate
         * @param p the point to transform
         * @param originOffset an offset applied on the current origin before performing the transformation. Depending on which frame of reference your data is expressed you may have to apply a offset. (if you data is expressed from the bottom/left, no offset is required. If it's expressed from the center the a [-0.5;-0.5] offset has to be applied.
         * @param res an allocated Vector2 that will receive the transformed content
         */
        RenderablePrim2D.prototype.transformPointWithOriginByRef = function (p, originOffset, res) {
            var actualSize = this.actualSize;
            res.x = p.x - ((this.origin.x + (originOffset ? originOffset.x : 0)) * actualSize.width);
            res.y = p.y - ((this.origin.y + (originOffset ? originOffset.y : 0)) * actualSize.height);
        };
        RenderablePrim2D.prototype.transformPointWithOriginToRef = function (p, originOffset, res) {
            this.transformPointWithOriginByRef(p, originOffset, res);
            return res;
        };
        /**
         * Get the info for a given effect based on the dataPart metadata
         * @param dataPartId partId in part list to get the info
         * @param vertexBufferAttributes vertex buffer attributes to manually add
         * @param uniforms uniforms to manually add
         * @param useInstanced specified if Instanced Array should be used, if null the engine caps will be used (so true if WebGL supports it, false otherwise), but you have the possibility to override the engine capability. However, if you manually set true but the engine does not support Instanced Array, this method will return null
         */
        RenderablePrim2D.prototype.getDataPartEffectInfo = function (dataPartId, vertexBufferAttributes, uniforms, useInstanced) {
            if (uniforms === void 0) { uniforms = null; }
            if (useInstanced === void 0) { useInstanced = null; }
            var dataPart = BABYLON.Tools.first(this._instanceDataParts, function (i) { return i.id === dataPartId; });
            if (!dataPart) {
                return null;
            }
            var instancedArray = this.owner.supportInstancedArray;
            if (useInstanced != null) {
                // Check if the caller ask for Instanced Array and the engine does not support it, return null if it's the case
                if (useInstanced && instancedArray === false) {
                    return null;
                }
                // Use the caller's setting
                instancedArray = useInstanced;
            }
            var cti = dataPart.getClassTreeInfo();
            var categories = this.getUsedShaderCategories(dataPart);
            var att = cti.classContent.getShaderAttributes(categories);
            var defines = "";
            categories.forEach(function (c) { defines += "#define " + c + "\n"; });
            if (instancedArray) {
                defines += "#define Instanced\n";
            }
            return {
                attributes: instancedArray ? vertexBufferAttributes.concat(att) : vertexBufferAttributes,
                uniforms: instancedArray ? (uniforms != null ? uniforms : []) : ((uniforms != null) ? att.concat(uniforms) : (att != null ? att : [])),
                defines: defines
            };
        };
        Object.defineProperty(RenderablePrim2D.prototype, "modelRenderCache", {
            get: function () {
                return this._modelRenderCache;
            },
            enumerable: true,
            configurable: true
        });
        RenderablePrim2D.prototype.createModelRenderCache = function (modelKey) {
            return null;
        };
        RenderablePrim2D.prototype.setupModelRenderCache = function (modelRenderCache) {
        };
        RenderablePrim2D.prototype.createInstanceDataParts = function () {
            return null;
        };
        RenderablePrim2D.prototype.getUsedShaderCategories = function (dataPart) {
            return [];
        };
        RenderablePrim2D.prototype.beforeRefreshForLayoutConstruction = function (part) {
        };
        RenderablePrim2D.prototype.afterRefreshForLayoutConstruction = function (part, obj) {
        };
        RenderablePrim2D.prototype.applyActualScaleOnTransform = function () {
            return true;
        };
        RenderablePrim2D.prototype.refreshInstanceDataPart = function (part) {
            if (!this.isVisible) {
                return false;
            }
            part.isVisible = this.isVisible;
            // Which means, if there's only one data element, we're update it from this method, otherwise it is the responsibility of the derived class to call updateInstanceDataPart as many times as needed, properly (look at Text2D's implementation for more information)
            if (part.dataElementCount === 1) {
                part.curElement = 0;
                this.updateInstanceDataPart(part);
            }
            return true;
        };
        /**
         * Update the instanceDataBase level properties of a part
         * @param part the part to update
         * @param positionOffset to use in multi part per primitive (e.g. the Text2D has N parts for N letter to display), this give the offset to apply (e.g. the position of the letter from the bottom/left corner of the text).
         */
        RenderablePrim2D.prototype.updateInstanceDataPart = function (part, positionOffset) {
            if (positionOffset === void 0) { positionOffset = null; }
            var t = this._globalTransform.multiply(this.renderGroup.invGlobalTransform); // Compute the transformation into the renderGroup's space
            var rgScale = this._areSomeFlagsSet(BABYLON.SmartPropertyPrim.flagDontInheritParentScale) ? RenderablePrim2D_1._uV : this.renderGroup.actualScale; // We still need to apply the scale of the renderGroup to our rendering, so get it.
            var size = this.renderGroup.viewportSize;
            var zBias = this.actualZOffset;
            var offX = 0;
            var offY = 0;
            // If there's an offset, apply the global transformation matrix on it to get a global offset
            if (positionOffset) {
                offX = positionOffset.x * t.m[0] + positionOffset.y * t.m[4];
                offY = positionOffset.x * t.m[1] + positionOffset.y * t.m[5];
            }
            // Have to convert the coordinates to clip space which is ranged between [-1;1] on X and Y axis, with 0,0 being the left/bottom corner
            // Current coordinates are expressed in renderGroup coordinates ([0, renderGroup.actualSize.width|height]) with 0,0 being at the left/top corner
            // So for X: 
            //  - tx.x = value * 2 / width: is to switch from [0, renderGroup.width] to [0, 2]
            //  - tx.w = (value * 2 / width) - 1: w stores the translation in renderGroup coordinates so (value * 2 / width) to switch to a clip space translation value. - 1 is to offset the overall [0;2] to [-1;1].
            // At last we don't forget to apply the actualScale of the Render Group to tx[0] and ty[1] to propagate scaling correctly
            var w = size.width;
            var h = size.height;
            var invZBias = 1 / zBias;
            var tx = new BABYLON.Vector4(t.m[0] * rgScale.x * 2 / w, t.m[4] * rgScale.x * 2 / w, 0 /*t.m[8]*/, ((t.m[12] + offX) * rgScale.x * 2 / w) - 1);
            var ty = new BABYLON.Vector4(t.m[1] * rgScale.y * 2 / h, t.m[5] * rgScale.y * 2 / h, 0 /*t.m[9]*/, ((t.m[13] + offY) * rgScale.y * 2 / h) - 1);
            //if (!this.applyActualScaleOnTransform()) {
            //    t.m[0] = tx.x, t.m[4] = tx.y, t.m[12] = tx.w;
            //    t.m[1] = ty.x, t.m[5] = ty.y, t.m[13] = ty.w;
            //    let las = this.actualScale;
            //    t.decompose(RenderablePrim2D._s, RenderablePrim2D._r, RenderablePrim2D._t);
            //    let scale = new Vector3(RenderablePrim2D._s.x / las.x, RenderablePrim2D._s.y / las.y, 1);
            //    t = Matrix.Compose(scale, RenderablePrim2D._r, RenderablePrim2D._t);
            //    tx = new Vector4(t.m[0], t.m[4], 0, t.m[12]);
            //    ty = new Vector4(t.m[1], t.m[5], 0, t.m[13]);
            //}
            //tx.x /= w;
            //tx.y /= w;
            //ty.x /= h;
            //ty.y /= h;
            part.transformX = tx;
            part.transformY = ty;
            part.opacity = this.actualOpacity;
            // Stores zBias and it's inverse value because that's needed to compute the clip space W coordinate (which is 1/Z, so 1/zBias)
            part.zBias = new BABYLON.Vector2(zBias, invZBias);
        };
        RenderablePrim2D.prototype._updateRenderMode = function () {
            if (this.isTransparent) {
                this._renderMode = BABYLON.Render2DContext.RenderModeTransparent;
            }
            else if (this.isAlphaTest) {
                this._renderMode = BABYLON.Render2DContext.RenderModeAlphaTest;
            }
            else {
                this._renderMode = BABYLON.Render2DContext.RenderModeOpaque;
            }
        };
        return RenderablePrim2D;
    }(BABYLON.Prim2DBase));
    RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT = BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 5;
    RenderablePrim2D._uV = new BABYLON.Vector2(1, 1);
    RenderablePrim2D._s = BABYLON.Vector3.Zero();
    RenderablePrim2D._r = BABYLON.Quaternion.Identity();
    RenderablePrim2D._t = BABYLON.Vector3.Zero();
    RenderablePrim2D._uV3 = new BABYLON.Vector3(1, 1, 1);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 0, function (pi) { return RenderablePrim2D_1.isAlphaTestProperty = pi; })
    ], RenderablePrim2D.prototype, "isAlphaTest", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, function (pi) { return RenderablePrim2D_1.isTransparentProperty = pi; })
    ], RenderablePrim2D.prototype, "isTransparent", null);
    RenderablePrim2D = RenderablePrim2D_1 = __decorate([
        BABYLON.className("RenderablePrim2D", "BABYLON")
    ], RenderablePrim2D);
    BABYLON.RenderablePrim2D = RenderablePrim2D;
    var RenderablePrim2D_1;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.renderablePrim2d.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Shape2D = Shape2D_1 = (function (_super) {
        __extends(Shape2D, _super);
        function Shape2D(settings) {
            var _this = _super.call(this, settings) || this;
            if (!settings) {
                settings = {};
            }
            var borderBrush = null;
            if (settings.border) {
                if (typeof (settings.border) === "string") {
                    borderBrush = BABYLON.Canvas2D.GetBrushFromString(settings.border);
                }
                else {
                    borderBrush = settings.border;
                }
            }
            var fillBrush = null;
            if (settings.fill) {
                if (typeof (settings.fill) === "string") {
                    fillBrush = BABYLON.Canvas2D.GetBrushFromString(settings.fill);
                }
                else {
                    fillBrush = settings.fill;
                }
            }
            _this._isTransparent = false;
            _this._oldTransparent = false;
            _this.border = borderBrush;
            _this.fill = fillBrush;
            _this._updateTransparencyStatus();
            _this.borderThickness = settings.borderThickness;
            return _this;
        }
        Object.defineProperty(Shape2D.prototype, "border", {
            get: function () {
                return this._border;
            },
            set: function (value) {
                this._border = value;
                this._updateTransparencyStatus();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2D.prototype, "fill", {
            /**
             * Get/set the brush to render the Fill part of the Primitive
             */
            get: function () {
                return this._fill;
            },
            set: function (value) {
                this._fill = value;
                this._updateTransparencyStatus();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2D.prototype, "borderThickness", {
            get: function () {
                return this._borderThickness;
            },
            set: function (value) {
                this._borderThickness = value;
            },
            enumerable: true,
            configurable: true
        });
        Shape2D.prototype.getUsedShaderCategories = function (dataPart) {
            var cat = _super.prototype.getUsedShaderCategories.call(this, dataPart);
            // Fill Part
            if (dataPart.id === Shape2D_1.SHAPE2D_FILLPARTID) {
                var fill = this.fill;
                if (fill instanceof BABYLON.SolidColorBrush2D) {
                    cat.push(Shape2D_1.SHAPE2D_CATEGORY_FILLSOLID);
                }
                if (fill instanceof BABYLON.GradientColorBrush2D) {
                    cat.push(Shape2D_1.SHAPE2D_CATEGORY_FILLGRADIENT);
                }
            }
            // Border Part
            if (dataPart.id === Shape2D_1.SHAPE2D_BORDERPARTID) {
                cat.push(Shape2D_1.SHAPE2D_CATEGORY_BORDER);
                var border = this.border;
                if (border instanceof BABYLON.SolidColorBrush2D) {
                    cat.push(Shape2D_1.SHAPE2D_CATEGORY_BORDERSOLID);
                }
                if (border instanceof BABYLON.GradientColorBrush2D) {
                    cat.push(Shape2D_1.SHAPE2D_CATEGORY_BORDERGRADIENT);
                }
            }
            return cat;
        };
        Shape2D.prototype.applyActualScaleOnTransform = function () {
            return false;
        };
        Shape2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            // Fill Part
            if (part.id === Shape2D_1.SHAPE2D_FILLPARTID) {
                var d = part;
                if (this.fill) {
                    var fill = this.fill;
                    if (fill instanceof BABYLON.SolidColorBrush2D) {
                        d.fillSolidColor = fill.color;
                    }
                    else if (fill instanceof BABYLON.GradientColorBrush2D) {
                        d.fillGradientColor1 = fill.color1;
                        d.fillGradientColor2 = fill.color2;
                        var t = BABYLON.Matrix.Compose(new BABYLON.Vector3(fill.scale, fill.scale, fill.scale), BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 0, 1), fill.rotation), new BABYLON.Vector3(fill.translation.x, fill.translation.y, 0));
                        var ty = new BABYLON.Vector4(t.m[1], t.m[5], t.m[9], t.m[13]);
                        d.fillGradientTY = ty;
                    }
                }
            }
            else if (part.id === Shape2D_1.SHAPE2D_BORDERPARTID) {
                var d = part;
                if (this.border) {
                    d.borderThickness = this.borderThickness;
                    var border = this.border;
                    if (border instanceof BABYLON.SolidColorBrush2D) {
                        d.borderSolidColor = border.color;
                    }
                    else if (border instanceof BABYLON.GradientColorBrush2D) {
                        d.borderGradientColor1 = border.color1;
                        d.borderGradientColor2 = border.color2;
                        var t = BABYLON.Matrix.Compose(new BABYLON.Vector3(border.scale, border.scale, border.scale), BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 0, 1), border.rotation), new BABYLON.Vector3(border.translation.x, border.translation.y, 0));
                        var ty = new BABYLON.Vector4(t.m[1], t.m[5], t.m[9], t.m[13]);
                        d.borderGradientTY = ty;
                    }
                }
            }
            return true;
        };
        Shape2D.prototype._updateTransparencyStatus = function () {
            this._isTransparent = (this._border && this._border.isTransparent()) || (this._fill && this._fill.isTransparent()) || (this.actualOpacity < 1);
            if (this._isTransparent !== this._oldTransparent) {
                this._oldTransparent = this._isTransparent;
                this._updateRenderMode();
            }
        };
        Shape2D.prototype._mustUpdateInstance = function () {
            var res = this._oldTransparent !== this._isTransparent;
            if (res) {
                this._updateRenderMode();
                this._oldTransparent = this._isTransparent;
            }
            return res;
        };
        Shape2D.prototype._isPrimTransparent = function () {
            return this._isTransparent;
        };
        return Shape2D;
    }(BABYLON.RenderablePrim2D));
    Shape2D.SHAPE2D_BORDERPARTID = 1;
    Shape2D.SHAPE2D_FILLPARTID = 2;
    Shape2D.SHAPE2D_CATEGORY_BORDER = "Border";
    Shape2D.SHAPE2D_CATEGORY_BORDERSOLID = "BorderSolid";
    Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT = "BorderGradient";
    Shape2D.SHAPE2D_CATEGORY_FILLSOLID = "FillSolid";
    Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT = "FillGradient";
    Shape2D.SHAPE2D_PROPCOUNT = BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5;
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, function (pi) { return Shape2D_1.borderProperty = pi; }, true)
    ], Shape2D.prototype, "border", null);
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, function (pi) { return Shape2D_1.fillProperty = pi; }, true)
    ], Shape2D.prototype, "fill", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, function (pi) { return Shape2D_1.borderThicknessProperty = pi; })
    ], Shape2D.prototype, "borderThickness", null);
    Shape2D = Shape2D_1 = __decorate([
        BABYLON.className("Shape2D", "BABYLON")
    ], Shape2D);
    BABYLON.Shape2D = Shape2D;
    var Shape2DInstanceData = (function (_super) {
        __extends(Shape2DInstanceData, _super);
        function Shape2DInstanceData() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(Shape2DInstanceData.prototype, "fillSolidColor", {
            // FILL ATTRIBUTES
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "fillGradientColor1", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "fillGradientColor2", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "fillGradientTY", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "borderThickness", {
            // BORDER ATTRIBUTES
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "borderSolidColor", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "borderGradientColor1", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "borderGradientColor2", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape2DInstanceData.prototype, "borderGradientTY", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        return Shape2DInstanceData;
    }(BABYLON.InstanceDataBase));
    __decorate([
        BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_FILLSOLID)
    ], Shape2DInstanceData.prototype, "fillSolidColor", null);
    __decorate([
        BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
    ], Shape2DInstanceData.prototype, "fillGradientColor1", null);
    __decorate([
        BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
    ], Shape2DInstanceData.prototype, "fillGradientColor2", null);
    __decorate([
        BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
    ], Shape2DInstanceData.prototype, "fillGradientTY", null);
    __decorate([
        BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_BORDER)
    ], Shape2DInstanceData.prototype, "borderThickness", null);
    __decorate([
        BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERSOLID)
    ], Shape2DInstanceData.prototype, "borderSolidColor", null);
    __decorate([
        BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT)
    ], Shape2DInstanceData.prototype, "borderGradientColor1", null);
    __decorate([
        BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT)
    ], Shape2DInstanceData.prototype, "borderGradientColor2", null);
    __decorate([
        BABYLON.instanceData(Shape2D.SHAPE2D_CATEGORY_BORDERGRADIENT)
    ], Shape2DInstanceData.prototype, "borderGradientTY", null);
    BABYLON.Shape2DInstanceData = Shape2DInstanceData;
    var Shape2D_1;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.shape2d.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Group2D = Group2D_1 = (function (_super) {
        __extends(Group2D, _super);
        /**
         * Create an Logical or Renderable Group.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - trackNode: if you want the ScreenSpaceCanvas to track the position of a given Scene Node, use this setting to specify the Node to track
         * - trackNodeOffset: if you use trackNode you may want to specify a 3D Offset to apply to shift the Canvas
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height properties can be set. If null the size will be computed from its content, default is null.
         *  - cacheBehavior: Define how the group should behave regarding the Canvas's cache strategy, default is Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY
         * - layoutEngine: either an instance of a layout engine based class (StackPanel.Vertical, StackPanel.Horizontal) or a string ('canvas' for Canvas layout, 'StackPanel' or 'HorizontalStackPanel' for horizontal Stack Panel layout, 'VerticalStackPanel' for vertical Stack Panel layout).
         * - isVisible: true if the group must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Group2D(settings) {
            var _this = this;
            if (settings == null) {
                settings = {};
            }
            if (settings.origin == null) {
                settings.origin = new BABYLON.Vector2(0, 0);
            }
            _this = _super.call(this, settings) || this;
            var size = (!settings.size && !settings.width && !settings.height) ? null : (settings.size || (new BABYLON.Size(settings.width || 0, settings.height || 0)));
            _this._trackedNode = (settings.trackNode == null) ? null : settings.trackNode;
            _this._trackedNodeOffset = (settings.trackNodeOffset == null) ? null : settings.trackNodeOffset;
            if (_this._trackedNode && _this.owner) {
                _this.owner._registerTrackedNode(_this);
            }
            _this._cacheBehavior = (settings.cacheBehavior == null) ? Group2D_1.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY : settings.cacheBehavior;
            var rd = _this._renderableData;
            if (rd) {
                rd._noResizeOnScale = (_this.cacheBehavior & Group2D_1.GROUPCACHEBEHAVIOR_NORESIZEONSCALE) !== 0;
            }
            _this.size = size;
            _this._viewportPosition = BABYLON.Vector2.Zero();
            _this._viewportSize = BABYLON.Size.Zero();
            return _this;
        }
        Group2D._createCachedCanvasGroup = function (owner) {
            var g = new Group2D_1({ parent: owner, id: "__cachedCanvasGroup__", position: BABYLON.Vector2.Zero(), origin: BABYLON.Vector2.Zero(), size: null, isVisible: true, isPickable: false, dontInheritParentScale: true });
            return g;
        };
        Group2D.prototype.applyCachedTexture = function (vertexData, material) {
            this._bindCacheTarget();
            if (vertexData) {
                var uv = vertexData.uvs;
                var nodeuv = this._renderableData._cacheNodeUVs;
                for (var i = 0; i < 4; i++) {
                    uv[i * 2 + 0] = nodeuv[i].x;
                    uv[i * 2 + 1] = nodeuv[i].y;
                }
            }
            if (material) {
                material.diffuseTexture = this._renderableData._cacheTexture;
                material.emissiveColor = new BABYLON.Color3(1, 1, 1);
            }
            this._renderableData._cacheTexture.hasAlpha = true;
            this._unbindCacheTarget();
        };
        Object.defineProperty(Group2D.prototype, "cachedRect", {
            /**
             * Allow you to access the information regarding the cached rectangle of the Group2D into the MapTexture.
             * If the `noWorldSpaceNode` options was used at the creation of a WorldSpaceCanvas, the rendering of the canvas must be made by the caller, so typically you want to bind the cacheTexture property to some material/mesh and you MUST use the Group2D.cachedUVs property to get the UV coordinates to use for your quad that will display the Canvas and NOT the PackedRect.UVs property which are incorrect because the allocated surface may be bigger (due to over-provisioning or shrinking without deallocating) than what the Group is actually using.
             */
            get: function () {
                if (!this._renderableData) {
                    return null;
                }
                return this._renderableData._cacheNode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "cachedUVs", {
            /**
             * The UVs into the MapTexture that map the cached group
             */
            get: function () {
                if (!this._renderableData) {
                    return null;
                }
                return this._renderableData._cacheNodeUVs;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "cachedUVsChanged", {
            get: function () {
                if (!this._renderableData) {
                    return null;
                }
                if (!this._renderableData._cacheNodeUVsChangedObservable) {
                    this._renderableData._cacheNodeUVsChangedObservable = new BABYLON.Observable();
                }
                return this._renderableData._cacheNodeUVsChangedObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "cacheTexture", {
            /**
             * Access the texture that maintains a cached version of the Group2D.
             * This is useful only if you're not using a WorldSpaceNode for your WorldSpace Canvas and therefore need to perform the rendering yourself.
             */
            get: function () {
                if (!this._renderableData) {
                    return null;
                }
                return this._renderableData._cacheTexture;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Call this method to remove this Group and its children from the Canvas
         */
        Group2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._trackedNode != null) {
                this.owner._unregisterTrackedNode(this);
                this._trackedNode = null;
            }
            if (this._renderableData) {
                this._renderableData.dispose(this.owner);
                this._renderableData = null;
            }
            return true;
        };
        Object.defineProperty(Group2D.prototype, "isRenderableGroup", {
            /**
             * @returns Returns true if the Group render content, false if it's a logical group only
             */
            get: function () {
                return this._isRenderableGroup;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "isCachedGroup", {
            /**
             * @returns only meaningful for isRenderableGroup, will be true if the content of the Group is cached into a texture, false if it's rendered every time
             */
            get: function () {
                return this._isCachedGroup;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "size", {
            get: function () {
                return this.internalGetSize();
            },
            /**
             * Get/Set the size of the group. If null the size of the group will be determine from its content.
             * BEWARE: if the Group is a RenderableGroup and its content is cache the texture will be resized each time the group is getting bigger. For performance reason the opposite won't be true: the texture won't shrink if the group does.
             */
            set: function (val) {
                this.internalSetSize(val);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "viewportSize", {
            get: function () {
                return this._viewportSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "cacheBehavior", {
            /**
             * Get/set the Cache Behavior, used in case the Canvas Cache Strategy is set to CACHESTRATEGY_ALLGROUPS. Can be either GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP, GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE or GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY. See their documentation for more information.
             * GROUPCACHEBEHAVIOR_NORESIZEONSCALE can also be set if you set it at creation time.
             * It is critical to understand than you HAVE TO play with this behavior in order to achieve a good performance/memory ratio. Caching all groups would certainly be the worst strategy of all.
             */
            get: function () {
                return this._cacheBehavior;
            },
            enumerable: true,
            configurable: true
        });
        Group2D.prototype._addPrimToDirtyList = function (prim) {
            this._renderableData._primDirtyList.push(prim);
        };
        Group2D.prototype._renderCachedCanvas = function () {
            this.owner._addGroupRenderCount(1);
            this.updateCachedStates(true);
            var context = new BABYLON.PrepareRender2DContext();
            this._prepareGroupRender(context);
            this._groupRender();
        };
        Object.defineProperty(Group2D.prototype, "trackedNode", {
            /**
             * Get/set the Scene's Node that should be tracked, the group's position will follow the projected position of the Node.
             */
            get: function () {
                return this._trackedNode;
            },
            set: function (val) {
                if (val != null) {
                    if (!this._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                        this.owner._registerTrackedNode(this);
                    }
                    this._trackedNode = val;
                }
                else {
                    if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                        this.owner._unregisterTrackedNode(this);
                    }
                    this._trackedNode = null;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Group2D.prototype, "trackedNodeOffset", {
            /**
             * Get/set the offset of the tracked node in the tracked node's local space.
             */
            get: function () {
                return this._trackedNodeOffset;
            },
            set: function (val) {
                if (!this._trackedNodeOffset) {
                    this._trackedNodeOffset = val.clone();
                }
                else {
                    this._trackedNodeOffset.copyFrom(val);
                }
            },
            enumerable: true,
            configurable: true
        });
        Group2D.prototype.levelIntersect = function (intersectInfo) {
            // If we've made it so far it means the boundingInfo intersection test succeed, the Group2D is shaped the same, so we always return true
            return true;
        };
        Group2D.prototype.updateLevelBoundingInfo = function () {
            var size;
            // If the size is set by the user, the boundingInfo is computed from this value
            if (this.size) {
                size = this.size;
            }
            else {
                size = new BABYLON.Size(0, 0);
            }
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(size, this._levelBoundingInfo);
            return true;
        };
        // Method called only on renderable groups to prepare the rendering
        Group2D.prototype._prepareGroupRender = function (context) {
            var sortedDirtyList = null;
            // Update the Global Transformation and visibility status of the changed primitives
            var rd = this._renderableData;
            if ((rd._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
                sortedDirtyList = rd._primDirtyList.sort(function (a, b) { return a.hierarchyDepth - b.hierarchyDepth; });
                this.updateCachedStatesOf(sortedDirtyList, true);
            }
            var s = this.actualSize;
            var a = this.actualScale;
            var sw = Math.ceil(s.width * a.x);
            var sh = Math.ceil(s.height * a.y);
            // The dimension must be overridden when using the designSize feature, the ratio is maintain to compute a uniform scale, which is mandatory but if the designSize's ratio is different from the rendering surface's ratio, content will be clipped in some cases.
            // So we set the width/height to the rendering's one because that's what we want for the viewport!
            if ((this instanceof BABYLON.Canvas2D || this.id === "__cachedCanvasGroup__") && this.owner.designSize != null) {
                sw = this.owner.engine.getRenderWidth();
                sh = this.owner.engine.getRenderHeight();
            }
            // Setup the size of the rendering viewport
            // In non cache mode, we're rendering directly to the rendering canvas, in this case we have to detect if the canvas size changed since the previous iteration, if it's the case all primitives must be prepared again because their transformation must be recompute
            if (!this._isCachedGroup) {
                // Compute the WebGL viewport's location/size
                var t = this._globalTransform.getTranslation();
                var rs = this.owner._renderingSize;
                sh = Math.min(sh, rs.height - t.y);
                sw = Math.min(sw, rs.width - t.x);
                var x = t.x;
                var y = t.y;
                // The viewport where we're rendering must be the size of the canvas if this one fit in the rendering screen or clipped to the screen dimensions if needed
                this._viewportPosition.x = x;
                this._viewportPosition.y = y;
            }
            // For a cachedGroup we also check of the group's actualSize is changing, if it's the case then the rendering zone will be change so we also have to dirty all primitives to prepare them again.
            if (this._viewportSize.width !== sw || this._viewportSize.height !== sh) {
                context.forceRefreshPrimitive = true;
                this._viewportSize.width = sw;
                this._viewportSize.height = sh;
            }
            if ((rd._primDirtyList.length > 0) || context.forceRefreshPrimitive) {
                // If the group is cached, set the dirty flag to true because of the incoming changes
                this._cacheGroupDirty = this._isCachedGroup;
                rd._primNewDirtyList.splice(0);
                // If it's a force refresh, prepare all the children
                if (context.forceRefreshPrimitive) {
                    for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                        var p = _a[_i];
                        p._prepareRender(context);
                    }
                }
                else {
                    // Each primitive that changed at least once was added into the primDirtyList, we have to sort this level using
                    //  the hierarchyDepth in order to prepare primitives from top to bottom
                    if (!sortedDirtyList) {
                        sortedDirtyList = rd._primDirtyList.sort(function (a, b) { return a.hierarchyDepth - b.hierarchyDepth; });
                    }
                    sortedDirtyList.forEach(function (p) {
                        // We need to check if prepare is needed because even if the primitive is in the dirtyList, its parent primitive may also have been modified, then prepared, then recurse on its children primitives (this one for instance) if the changes where impacting them.
                        // For instance: a Rect's position change, the position of its children primitives will also change so a prepare will be call on them. If a child was in the dirtyList we will avoid a second prepare by making this check.
                        if (!p.isDisposed && p._needPrepare()) {
                            p._prepareRender(context);
                        }
                    });
                }
                // Everything is updated, clear the dirty list
                rd._primDirtyList.forEach(function (p) {
                    if (rd._primNewDirtyList.indexOf(p) === -1) {
                        p._resetPropertiesDirty();
                    }
                    else {
                        p._setFlags(BABYLON.SmartPropertyPrim.flagNeedRefresh);
                    }
                });
                rd._primDirtyList.splice(0);
                rd._primDirtyList = rd._primDirtyList.concat(rd._primNewDirtyList);
            }
            // A renderable group has a list of direct children that are also renderable groups, we recurse on them to also prepare them
            rd._childrenRenderableGroups.forEach(function (g) {
                g._prepareGroupRender(context);
            });
        };
        Group2D.prototype._groupRender = function () {
            var _this = this;
            var engine = this.owner.engine;
            var failedCount = 0;
            // First recurse to children render group to render them (in their cache or on screen)
            for (var _i = 0, _a = this._renderableData._childrenRenderableGroups; _i < _a.length; _i++) {
                var childGroup = _a[_i];
                childGroup._groupRender();
            }
            // Render the primitives if needed: either if we don't cache the content or if the content is cached but has changed
            if (!this.isCachedGroup || this._cacheGroupDirty) {
                this.owner._addGroupRenderCount(1);
                if (this.isCachedGroup) {
                    this._bindCacheTarget();
                }
                else {
                    var curVP = engine.setDirectViewport(this._viewportPosition.x, this._viewportPosition.y, this._viewportSize.width, this._viewportSize.height);
                }
                var curAlphaTest = engine.getAlphaTesting() === true;
                var curDepthWrite = engine.getDepthWrite() === true;
                // ===================================================================
                // First pass, update the InstancedArray and render Opaque primitives
                // Disable Alpha Testing, Enable Depth Write
                engine.setAlphaTesting(false);
                engine.setDepthWrite(true);
                // For each different model of primitive to render
                var context_1 = new BABYLON.Render2DContext(BABYLON.Render2DContext.RenderModeOpaque);
                this._renderableData._renderGroupInstancesInfo.forEach(function (k, v) {
                    // Prepare the context object, update the WebGL Instanced Array buffer if needed
                    var renderCount = _this._prepareContext(engine, context_1, v);
                    // If null is returned, there's no opaque data to render
                    if (renderCount === null) {
                        return;
                    }
                    // Submit render only if we have something to render (everything may be hidden and the floatarray empty)
                    if (!_this.owner.supportInstancedArray || renderCount > 0) {
                        // render all the instances of this model, if the render method returns true then our instances are no longer dirty
                        var renderFailed = !v.modelRenderCache.render(v, context_1);
                        // Update dirty flag/related
                        v.opaqueDirty = renderFailed;
                        failedCount += renderFailed ? 1 : 0;
                    }
                });
                // =======================================================================
                // Second pass, update the InstancedArray and render AlphaTest primitives
                // Enable Alpha Testing, Enable Depth Write
                engine.setAlphaTesting(true);
                engine.setDepthWrite(true);
                // For each different model of primitive to render
                context_1 = new BABYLON.Render2DContext(BABYLON.Render2DContext.RenderModeAlphaTest);
                this._renderableData._renderGroupInstancesInfo.forEach(function (k, v) {
                    // Prepare the context object, update the WebGL Instanced Array buffer if needed
                    var renderCount = _this._prepareContext(engine, context_1, v);
                    // If null is returned, there's no opaque data to render
                    if (renderCount === null) {
                        return;
                    }
                    // Submit render only if we have something to render (everything may be hidden and the floatarray empty)
                    if (!_this.owner.supportInstancedArray || renderCount > 0) {
                        // render all the instances of this model, if the render method returns true then our instances are no longer dirty
                        var renderFailed = !v.modelRenderCache.render(v, context_1);
                        // Update dirty flag/related
                        v.opaqueDirty = renderFailed;
                        failedCount += renderFailed ? 1 : 0;
                    }
                });
                // =======================================================================
                // Third pass, transparent primitive rendering
                // Enable Alpha Testing, Disable Depth Write
                engine.setAlphaTesting(true);
                engine.setDepthWrite(false);
                // First Check if the transparent List change so we can update the TransparentSegment and PartData (sort if needed)
                if (this._renderableData._transparentListChanged) {
                    this._updateTransparentData();
                }
                // From this point on we have up to date data to render, so let's go
                failedCount += this._renderTransparentData();
                // =======================================================================
                //  Unbind target/restore viewport setting, clear dirty flag, and quit
                // The group's content is no longer dirty
                this._cacheGroupDirty = failedCount !== 0;
                if (this.isCachedGroup) {
                    this._unbindCacheTarget();
                }
                else {
                    if (curVP) {
                        engine.setViewport(curVP);
                    }
                }
                // Restore saved states
                engine.setAlphaTesting(curAlphaTest);
                engine.setDepthWrite(curDepthWrite);
            }
        };
        Group2D.prototype._setCacheGroupDirty = function () {
            this._cacheGroupDirty = true;
        };
        Group2D.prototype._updateTransparentData = function () {
            this.owner._addUpdateTransparentDataCount(1);
            var rd = this._renderableData;
            // Sort all the primitive from their depth, max (bottom) to min (top)
            rd._transparentPrimitives.sort(function (a, b) { return b._primitive.actualZOffset - a._primitive.actualZOffset; });
            var checkAndAddPrimInSegment = function (seg, tpiI) {
                var tpi = rd._transparentPrimitives[tpiI];
                // Fast rejection: if gii are different
                if (seg.groupInsanceInfo !== tpi._groupInstanceInfo) {
                    return false;
                }
                //let tpiZ = tpi._primitive.actualZOffset;
                // We've made it so far, the tpi can be part of the segment, add it
                tpi._transparentSegment = seg;
                tpi._primitive._updateTransparentSegmentIndices(seg);
                return true;
            };
            // Free the existing TransparentSegments
            for (var _i = 0, _a = rd._transparentSegments; _i < _a.length; _i++) {
                var ts = _a[_i];
                ts.dispose(this.owner.engine);
            }
            rd._transparentSegments.splice(0);
            var prevSeg = null;
            for (var tpiI = 0; tpiI < rd._transparentPrimitives.length; tpiI++) {
                var tpi = rd._transparentPrimitives[tpiI];
                // Check if the Data in which the primitive is stored is not sorted properly
                if (tpi._groupInstanceInfo.transparentOrderDirty) {
                    tpi._groupInstanceInfo.sortTransparentData();
                }
                // Reset the segment, we have to create/rebuild it
                tpi._transparentSegment = null;
                // If there's a previous valid segment, check if this prim can be part of it
                if (prevSeg) {
                    checkAndAddPrimInSegment(prevSeg, tpiI);
                }
                // If we couldn't insert in the adjacent segments, he have to create one
                if (!tpi._transparentSegment) {
                    var ts = new BABYLON.TransparentSegment();
                    ts.groupInsanceInfo = tpi._groupInstanceInfo;
                    var prim = tpi._primitive;
                    ts.startZ = prim.actualZOffset;
                    prim._updateTransparentSegmentIndices(ts);
                    ts.endZ = ts.startZ;
                    tpi._transparentSegment = ts;
                    rd._transparentSegments.push(ts);
                }
                // Update prevSeg
                prevSeg = tpi._transparentSegment;
            }
            //rd._firstChangedPrim = null;
            rd._transparentListChanged = false;
        };
        Group2D.prototype._renderTransparentData = function () {
            var failedCount = 0;
            var context = new BABYLON.Render2DContext(BABYLON.Render2DContext.RenderModeTransparent);
            var rd = this._renderableData;
            var useInstanced = this.owner.supportInstancedArray;
            var length = rd._transparentSegments.length;
            for (var i = 0; i < length; i++) {
                context.instancedBuffers = null;
                var ts = rd._transparentSegments[i];
                var gii = ts.groupInsanceInfo;
                var mrc = gii.modelRenderCache;
                var engine = this.owner.engine;
                var count = ts.endDataIndex - ts.startDataIndex;
                // Use Instanced Array if it's supported and if there's at least minPartCountToUseInstancedArray prims to draw.
                // We don't want to create an Instanced Buffer for less that minPartCountToUseInstancedArray prims
                if (useInstanced && count >= this.owner.minPartCountToUseInstancedArray) {
                    if (!ts.partBuffers) {
                        var buffers = new Array();
                        for (var j = 0; j < gii.transparentData.length; j++) {
                            var gitd = gii.transparentData[j];
                            var dfa = gitd._partData;
                            var data = dfa.pack();
                            var stride = dfa.stride;
                            var neededSize = count * stride * 4;
                            var buffer = engine.createInstancesBuffer(neededSize); // Create + bind
                            var segData = data.subarray(ts.startDataIndex * stride, ts.endDataIndex * stride);
                            engine.updateArrayBuffer(segData);
                            buffers.push(buffer);
                        }
                        ts.partBuffers = buffers;
                    }
                    else if (gii.transparentDirty) {
                        for (var j = 0; j < gii.transparentData.length; j++) {
                            var gitd = gii.transparentData[j];
                            var dfa = gitd._partData;
                            var data = dfa.pack();
                            var stride = dfa.stride;
                            var buffer = ts.partBuffers[j];
                            var segData = data.subarray(ts.startDataIndex * stride, ts.endDataIndex * stride);
                            engine.bindArrayBuffer(buffer);
                            engine.updateArrayBuffer(segData);
                        }
                    }
                    context.useInstancing = true;
                    context.instancesCount = count;
                    context.instancedBuffers = ts.partBuffers;
                    context.groupInfoPartData = gii.transparentData;
                    var renderFailed = !mrc.render(gii, context);
                    failedCount += renderFailed ? 1 : 0;
                }
                else {
                    context.useInstancing = false;
                    context.partDataStartIndex = ts.startDataIndex;
                    context.partDataEndIndex = ts.endDataIndex;
                    context.groupInfoPartData = gii.transparentData;
                    var renderFailed = !mrc.render(gii, context);
                    failedCount += renderFailed ? 1 : 0;
                }
            }
            return failedCount;
        };
        Group2D.prototype._prepareContext = function (engine, context, gii) {
            var gipd = null;
            var setDirty;
            var getDirty;
            // Render Mode specifics
            switch (context.renderMode) {
                case BABYLON.Render2DContext.RenderModeOpaque:
                    {
                        if (!gii.hasOpaqueData) {
                            return null;
                        }
                        setDirty = function (dirty) { gii.opaqueDirty = dirty; };
                        getDirty = function () { return gii.opaqueDirty; };
                        context.groupInfoPartData = gii.opaqueData;
                        gipd = gii.opaqueData;
                        break;
                    }
                case BABYLON.Render2DContext.RenderModeAlphaTest:
                    {
                        if (!gii.hasAlphaTestData) {
                            return null;
                        }
                        setDirty = function (dirty) { gii.alphaTestDirty = dirty; };
                        getDirty = function () { return gii.alphaTestDirty; };
                        context.groupInfoPartData = gii.alphaTestData;
                        gipd = gii.alphaTestData;
                        break;
                    }
                default:
                    throw new Error("_prepareContext is only for opaque or alphaTest");
            }
            var renderCount = 0;
            // This part will pack the dynamicfloatarray and update the instanced array WebGLBufffer
            // Skip it if instanced arrays are not supported
            if (this.owner.supportInstancedArray) {
                // Flag for instancing
                context.useInstancing = true;
                // Make sure all the WebGLBuffers of the Instanced Array are created/up to date for the parts to render.
                for (var i = 0; i < gipd.length; i++) {
                    var pid = gipd[i];
                    // If the instances of the model was changed, pack the data
                    var array = pid._partData;
                    var instanceData_1 = array.pack();
                    renderCount += array.usedElementCount;
                    // Compute the size the instance buffer should have
                    var neededSize = array.usedElementCount * array.stride * 4;
                    // Check if we have to (re)create the instancesBuffer because there's none or the size is too small
                    if (!pid._partBuffer || (pid._partBufferSize < neededSize)) {
                        if (pid._partBuffer) {
                            engine.deleteInstancesBuffer(pid._partBuffer);
                        }
                        pid._partBuffer = engine.createInstancesBuffer(neededSize); // Create + bind
                        pid._partBufferSize = neededSize;
                        setDirty(false);
                        // Update the WebGL buffer to match the new content of the instances data
                        engine.updateArrayBuffer(instanceData_1);
                    }
                    else if (getDirty()) {
                        // Update the WebGL buffer to match the new content of the instances data
                        engine.bindArrayBuffer(pid._partBuffer);
                        engine.updateArrayBuffer(instanceData_1);
                    }
                }
                setDirty(false);
            }
            else {
                context.partDataStartIndex = 0;
                // Find the first valid object to get the count
                if (context.groupInfoPartData.length > 0) {
                    var i = 0;
                    while (!context.groupInfoPartData[i]) {
                        i++;
                    }
                    context.partDataEndIndex = context.groupInfoPartData[i]._partData.usedElementCount;
                }
            }
            return renderCount;
        };
        Group2D.prototype._setRenderingScale = function (scale) {
            if (this._renderableData._renderingScale === scale) {
                return;
            }
            this._renderableData._renderingScale = scale;
        };
        Group2D.prototype._bindCacheTarget = function () {
            var curWidth;
            var curHeight;
            var rd = this._renderableData;
            var rs = rd._renderingScale;
            var noResizeScale = rd._noResizeOnScale;
            var isCanvas = this.parent == null;
            var scale;
            if (noResizeScale) {
                scale = isCanvas ? Group2D_1._uV : this.parent.actualScale;
            }
            else {
                scale = this.actualScale;
            }
            if (isCanvas && this.owner.cachingStrategy === BABYLON.Canvas2D.CACHESTRATEGY_CANVAS && this.owner.isScreenSpace) {
                if (this.owner.designSize || this.owner.fitRenderingDevice) {
                    Group2D_1._s.width = this.owner.engine.getRenderWidth();
                    Group2D_1._s.height = this.owner.engine.getRenderHeight();
                }
                else {
                    Group2D_1._s.copyFrom(this.owner.size);
                }
            }
            else {
                Group2D_1._s.width = Math.ceil(this.actualSize.width * scale.x * rs);
                Group2D_1._s.height = Math.ceil(this.actualSize.height * scale.y * rs);
            }
            var sizeChanged = !Group2D_1._s.equals(rd._cacheSize);
            if (rd._cacheNode) {
                var size = rd._cacheNode.contentSize;
                // Check if we have to deallocate because the size is too small
                if ((size.width < Group2D_1._s.width) || (size.height < Group2D_1._s.height)) {
                    // For Screen space: over-provisioning of 7% more to avoid frequent resizing for few pixels...
                    // For World space: no over-provisioning
                    var overprovisioning = this.owner.isScreenSpace ? 1.07 : 1;
                    curWidth = Math.floor(Group2D_1._s.width * overprovisioning);
                    curHeight = Math.floor(Group2D_1._s.height * overprovisioning);
                    //console.log(`[${this._globalTransformProcessStep}] Resize group ${this.id}, width: ${curWidth}, height: ${curHeight}`);
                    rd._cacheTexture.freeRect(rd._cacheNode);
                    rd._cacheNode = null;
                }
            }
            if (!rd._cacheNode) {
                // Check if we have to allocate a rendering zone in the global cache texture
                var res = this.owner._allocateGroupCache(this, this.parent && this.parent.renderGroup, curWidth ? new BABYLON.Size(curWidth, curHeight) : null, rd._useMipMap, rd._anisotropicLevel);
                rd._cacheNode = res.node;
                rd._cacheTexture = res.texture;
                if (rd._cacheRenderSprite) {
                    rd._cacheRenderSprite.dispose();
                }
                rd._cacheRenderSprite = res.sprite;
                sizeChanged = true;
            }
            if (sizeChanged) {
                rd._cacheSize.copyFrom(Group2D_1._s);
                rd._cacheNodeUVs = rd._cacheNode.getUVsForCustomSize(rd._cacheSize);
                if (rd._cacheNodeUVsChangedObservable && rd._cacheNodeUVsChangedObservable.hasObservers()) {
                    rd._cacheNodeUVsChangedObservable.notifyObservers(rd._cacheNodeUVs);
                }
                this._setFlags(BABYLON.SmartPropertyPrim.flagWorldCacheChanged);
            }
            var n = rd._cacheNode;
            rd._cacheTexture.bindTextureForPosSize(n.pos, Group2D_1._s, true);
        };
        Group2D.prototype._unbindCacheTarget = function () {
            if (this._renderableData._cacheTexture) {
                this._renderableData._cacheTexture.unbindTexture();
            }
        };
        Group2D.prototype._spreadActualScaleDirty = function () {
            if (this._renderableData && this._renderableData._cacheRenderSprite) {
                this.handleGroupChanged(BABYLON.Prim2DBase.actualScaleProperty);
            }
            _super.prototype._spreadActualScaleDirty.call(this);
        };
        Group2D.prototype.handleGroupChanged = function (prop) {
            // This method is only for cachedGroup
            var rd = this._renderableData;
            if (!rd) {
                return;
            }
            var cachedSprite = rd._cacheRenderSprite;
            if (!this.isCachedGroup || !cachedSprite) {
                return;
            }
            // For now we only support these property changes
            // TODO: add more! :)
            switch (prop.id) {
                case BABYLON.Prim2DBase.actualPositionProperty.id:
                    cachedSprite.actualPosition = this.actualPosition.clone();
                    if (cachedSprite.position != null) {
                        cachedSprite.position = cachedSprite.actualPosition.clone();
                    }
                    break;
                case BABYLON.Prim2DBase.rotationProperty.id:
                    cachedSprite.rotation = this.rotation;
                    break;
                case BABYLON.Prim2DBase.scaleProperty.id:
                    cachedSprite.scale = this.scale;
                    break;
                case BABYLON.Prim2DBase.originProperty.id:
                    cachedSprite.origin = this.origin.clone();
                    break;
                case Group2D_1.actualSizeProperty.id:
                    cachedSprite.size = this.actualSize.clone();
                    break;
            }
        };
        Group2D.prototype.detectGroupStates = function () {
            var isCanvas = this instanceof BABYLON.Canvas2D;
            var canvasStrat = this.owner.cachingStrategy;
            // In Don't Cache mode, only the canvas is renderable, all the other groups are logical. There are not a single cached group.
            if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_DONTCACHE) {
                this._isRenderableGroup = isCanvas;
                this._isCachedGroup = false;
            }
            else if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_CANVAS) {
                if (isCanvas) {
                    this._isRenderableGroup = true;
                    this._isCachedGroup = true;
                }
                else {
                    this._isRenderableGroup = this.id === "__cachedCanvasGroup__";
                    this._isCachedGroup = false;
                }
            }
            else if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS) {
                if (isCanvas) {
                    this._isRenderableGroup = true;
                    this._isCachedGroup = false;
                }
                else {
                    if (this.hierarchyDepth === 1) {
                        this._isRenderableGroup = true;
                        this._isCachedGroup = true;
                    }
                    else {
                        this._isRenderableGroup = false;
                        this._isCachedGroup = false;
                    }
                }
            }
            else if (canvasStrat === BABYLON.Canvas2D.CACHESTRATEGY_ALLGROUPS) {
                if (isCanvas) {
                    this._isRenderableGroup = true;
                    this._isCachedGroup = false;
                }
                else {
                    var gcb = this.cacheBehavior & Group2D_1.GROUPCACHEBEHAVIOR_OPTIONMASK;
                    if ((gcb === Group2D_1.GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE) || (gcb === Group2D_1.GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP)) {
                        this._isRenderableGroup = gcb === Group2D_1.GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE;
                        this._isCachedGroup = false;
                    }
                    if (gcb === Group2D_1.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY) {
                        this._isRenderableGroup = true;
                        this._isCachedGroup = true;
                    }
                }
            }
            if (this._isRenderableGroup) {
                // Yes, we do need that check, trust me, unfortunately we can call _detectGroupStates many time on the same object...
                if (!this._renderableData) {
                    this._renderableData = new RenderableGroupData();
                }
            }
            // If the group is tagged as renderable we add it to the renderable tree
            if (this._isCachedGroup) {
                this._renderableData._noResizeOnScale = (this.cacheBehavior & Group2D_1.GROUPCACHEBEHAVIOR_NORESIZEONSCALE) !== 0;
                var cur = this.parent;
                while (cur) {
                    if (cur instanceof Group2D_1 && cur._isRenderableGroup) {
                        if (cur._renderableData._childrenRenderableGroups.indexOf(this) === -1) {
                            cur._renderableData._childrenRenderableGroups.push(this);
                        }
                        break;
                    }
                    cur = cur.parent;
                }
            }
        };
        Object.defineProperty(Group2D.prototype, "_cachedTexture", {
            get: function () {
                if (this._renderableData) {
                    return this._renderableData._cacheTexture;
                }
                return null;
            },
            enumerable: true,
            configurable: true
        });
        return Group2D;
    }(BABYLON.Prim2DBase));
    Group2D.GROUP2D_PROPCOUNT = BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 5;
    /**
     * Default behavior, the group will use the caching strategy defined at the Canvas Level
     */
    Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY = 0;
    /**
     * When used, this group's content won't be cached, no matter which strategy used.
     * If the group is part of a WorldSpace Canvas, its content will be drawn in the Canvas cache bitmap.
     */
    Group2D.GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE = 1;
    /**
     * When used, the group's content will be cached in the nearest cached parent group/canvas
     */
    Group2D.GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP = 2;
    /**
     * You can specify this behavior to any cached Group2D to indicate that you don't want the cached content to be resized when the Group's actualScale is changing. It will draw the content stretched or shrink which is faster than a resize. This setting is obviously for performance consideration, don't use it if you want the best rendering quality
     */
    Group2D.GROUPCACHEBEHAVIOR_NORESIZEONSCALE = 0x100;
    Group2D.GROUPCACHEBEHAVIOR_OPTIONMASK = 0xFF;
    Group2D._uV = new BABYLON.Vector2(1, 1);
    Group2D._s = BABYLON.Size.Zero();
    Group2D._unS = new BABYLON.Vector2(1, 1);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, function (pi) { return Group2D_1.sizeProperty = pi; }, false, true)
    ], Group2D.prototype, "size", null);
    Group2D = Group2D_1 = __decorate([
        BABYLON.className("Group2D", "BABYLON")
    ], Group2D);
    BABYLON.Group2D = Group2D;
    var RenderableGroupData = (function () {
        function RenderableGroupData() {
            this._primDirtyList = new Array();
            this._primNewDirtyList = new Array();
            this._childrenRenderableGroups = new Array();
            this._renderGroupInstancesInfo = new BABYLON.StringDictionary();
            this._transparentPrimitives = new Array();
            this._transparentSegments = new Array();
            this._transparentListChanged = false;
            this._cacheNode = null;
            this._cacheTexture = null;
            this._cacheRenderSprite = null;
            this._renderingScale = 1;
            this._cacheNodeUVs = null;
            this._cacheNodeUVsChangedObservable = null;
            this._cacheSize = BABYLON.Size.Zero();
            this._useMipMap = false;
            this._anisotropicLevel = 1;
            this._noResizeOnScale = false;
        }
        RenderableGroupData.prototype.dispose = function (owner) {
            var engine = owner.engine;
            if (this._cacheRenderSprite) {
                this._cacheRenderSprite.dispose();
                this._cacheRenderSprite = null;
            }
            if (this._cacheTexture && this._cacheNode) {
                this._cacheTexture.freeRect(this._cacheNode);
                this._cacheTexture = null;
                this._cacheNode = null;
            }
            if (this._primDirtyList) {
                this._primDirtyList.splice(0);
                this._primDirtyList = null;
            }
            if (this._renderGroupInstancesInfo) {
                this._renderGroupInstancesInfo.forEach(function (k, v) {
                    v.dispose();
                });
                this._renderGroupInstancesInfo = null;
            }
            if (this._cacheNodeUVsChangedObservable) {
                this._cacheNodeUVsChangedObservable.clear();
                this._cacheNodeUVsChangedObservable = null;
            }
            if (this._transparentSegments) {
                for (var _i = 0, _a = this._transparentSegments; _i < _a.length; _i++) {
                    var ts = _a[_i];
                    ts.dispose(engine);
                }
                this._transparentSegments.splice(0);
                this._transparentSegments = null;
            }
        };
        RenderableGroupData.prototype.addNewTransparentPrimitiveInfo = function (prim, gii) {
            var tpi = new TransparentPrimitiveInfo();
            tpi._primitive = prim;
            tpi._groupInstanceInfo = gii;
            tpi._transparentSegment = null;
            this._transparentPrimitives.push(tpi);
            this._transparentListChanged = true;
            return tpi;
        };
        RenderableGroupData.prototype.removeTransparentPrimitiveInfo = function (tpi) {
            var index = this._transparentPrimitives.indexOf(tpi);
            if (index !== -1) {
                this._transparentPrimitives.splice(index, 1);
                this._transparentListChanged = true;
            }
        };
        RenderableGroupData.prototype.transparentPrimitiveZChanged = function (tpi) {
            this._transparentListChanged = true;
            //this.updateSmallestZChangedPrim(tpi);
        };
        return RenderableGroupData;
    }());
    BABYLON.RenderableGroupData = RenderableGroupData;
    var TransparentPrimitiveInfo = (function () {
        function TransparentPrimitiveInfo() {
        }
        return TransparentPrimitiveInfo;
    }());
    BABYLON.TransparentPrimitiveInfo = TransparentPrimitiveInfo;
    var Group2D_1;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.group2d.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var WireFrame2DRenderCache = (function (_super) {
        __extends(WireFrame2DRenderCache, _super);
        function WireFrame2DRenderCache() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.effectsReady = false;
            _this.vb = null;
            _this.vtxCount = 0;
            _this.instancingAttributes = null;
            _this.effect = null;
            _this.effectInstanced = null;
            return _this;
        }
        WireFrame2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effect && (!this.effect.isReady() || (this.effectInstanced && !this.effectInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            var cur = engine.getAlphaMode();
            var effect = context.useInstancing ? this.effectInstanced : this.effect;
            engine.enableEffect(effect);
            engine.bindBuffersDirectly(this.vb, null, [2, 4], 24, effect);
            if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
            }
            var pid = context.groupInfoPartData[0];
            if (context.useInstancing) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(WireFrame2D.WIREFRAME2D_MAINPARTID, effect);
                }
                var glBuffer = context.instancedBuffers ? context.instancedBuffers[0] : pid._partBuffer;
                var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                canvas._addDrawCallCount(1, context.renderMode);
                engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingAttributes);
                engine.drawUnIndexed(false, 0, this.vtxCount, count);
                //                engine.draw(true, 0, 6, count);
                engine.unbindInstanceAttributes();
            }
            else {
                canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                    this.setupUniforms(effect, 0, pid._partData, i);
                    engine.drawUnIndexed(false, 0, this.vtxCount);
                }
            }
            engine.setAlphaMode(cur, true);
            return true;
        };
        WireFrame2DRenderCache.prototype.updateModelRenderCache = function (prim) {
            var w = prim;
            w._updateVertexBuffer(this);
            return true;
        };
        WireFrame2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.vb) {
                this._engine._releaseBuffer(this.vb);
                this.vb = null;
            }
            this.effect = null;
            this.effectInstanced = null;
            return true;
        };
        return WireFrame2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.WireFrame2DRenderCache = WireFrame2DRenderCache;
    var WireFrameVertex2D = (function () {
        function WireFrameVertex2D(p, c) {
            if (c === void 0) { c = null; }
            this.fromVector2(p);
            if (c != null) {
                this.fromColor4(c);
            }
            else {
                this.r = this.g = this.b = this.a = 1;
            }
        }
        WireFrameVertex2D.prototype.fromVector2 = function (p) {
            this.x = p.x;
            this.y = p.y;
        };
        WireFrameVertex2D.prototype.fromColor3 = function (c) {
            this.r = c.r;
            this.g = c.g;
            this.b = c.b;
            this.a = 1;
        };
        WireFrameVertex2D.prototype.fromColor4 = function (c) {
            this.r = c.r;
            this.g = c.g;
            this.b = c.b;
            this.a = c.a;
        };
        return WireFrameVertex2D;
    }());
    WireFrameVertex2D = __decorate([
        BABYLON.className("WireFrameVertex2D", "BABYLON")
    ], WireFrameVertex2D);
    BABYLON.WireFrameVertex2D = WireFrameVertex2D;
    var WireFrameGroup2D = (function () {
        /**
         * Construct a WireFrameGroup2D object
         * @param id a unique ID among the Groups added to a given WireFrame2D primitive, if you don't specify an id, a random one will be generated. The id is immutable.
         * @param defaultColor specify the default color that will be used when a vertex is pushed, white will be used if not specified.
         */
        function WireFrameGroup2D(id, defaultColor) {
            if (id === void 0) { id = null; }
            if (defaultColor === void 0) { defaultColor = null; }
            this._id = (id == null) ? BABYLON.Tools.RandomId() : id;
            this._uid = BABYLON.Tools.RandomId();
            this._defaultColor = (defaultColor == null) ? new BABYLON.Color4(1, 1, 1, 1) : defaultColor;
            this._buildingStrip = false;
            this._vertices = new Array();
        }
        Object.defineProperty(WireFrameGroup2D.prototype, "uid", {
            get: function () {
                return this._uid;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WireFrameGroup2D.prototype, "id", {
            /**
             * Retrieve the ID of the group
             */
            get: function () {
                return this._id;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Push a vertex in the array of vertices.
         * If you're previously called startLineStrip, the vertex will be pushed twice in order to describe the end of a line and the start of a new one.
         * @param p Position of the vertex
         * @param c Color of the vertex, if null the default color of the group will be used
         */
        WireFrameGroup2D.prototype.pushVertex = function (p, c) {
            if (c === void 0) { c = null; }
            var v = new WireFrameVertex2D(p, (c == null) ? this._defaultColor : c);
            this._vertices.push(v);
            if (this._buildingStrip) {
                var v2 = new WireFrameVertex2D(p, (c == null) ? this._defaultColor : c);
                this._vertices.push(v2);
            }
        };
        /**
         * Start to store a Line Strip. The given vertex will be pushed in the array. The you have to call pushVertex to add subsequent vertices describing the strip and don't forget to call endLineStrip to close the strip!!!
         * @param p Position of the vertex
         * @param c Color of the vertex, if null the default color of the group will be used
         */
        WireFrameGroup2D.prototype.startLineStrip = function (p, c) {
            if (c === void 0) { c = null; }
            this.pushVertex(p, (c == null) ? this._defaultColor : c);
            this._buildingStrip = true;
        };
        /**
         * Close the Strip by storing a last vertex
         * @param p Position of the vertex
         * @param c Color of the vertex, if null the default color of the group will be used
         */
        WireFrameGroup2D.prototype.endLineStrip = function (p, c) {
            if (c === void 0) { c = null; }
            this._buildingStrip = false;
            this.pushVertex(p, (c == null) ? this._defaultColor : c);
        };
        Object.defineProperty(WireFrameGroup2D.prototype, "vertices", {
            /**
             * Access to the array of Vertices, you can manipulate its content but BEWARE of what you're doing!
             */
            get: function () {
                return this._vertices;
            },
            enumerable: true,
            configurable: true
        });
        return WireFrameGroup2D;
    }());
    WireFrameGroup2D = __decorate([
        BABYLON.className("WireFrameGroup2D", "BABYLON")
    ], WireFrameGroup2D);
    BABYLON.WireFrameGroup2D = WireFrameGroup2D;
    var WireFrame2D = WireFrame2D_1 = (function (_super) {
        __extends(WireFrame2D, _super);
        /**
         * Create an WireFrame 2D primitive
         * @param wireFrameGroups an array of WireFrameGroup.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - size: the size of the sprite displayed in the canvas, if not specified the spriteSize will be used
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - alignToPixel: the rendered lines will be aligned to the rendering device' pixels
         * - isVisible: true if the sprite must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function WireFrame2D(wireFrameGroups, settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _this = _super.call(this, settings) || this;
            _this._wireFrameGroups = new BABYLON.StringDictionary();
            for (var _i = 0, wireFrameGroups_1 = wireFrameGroups; _i < wireFrameGroups_1.length; _i++) {
                var wfg = wireFrameGroups_1[_i];
                _this._wireFrameGroups.add(wfg.id, wfg);
            }
            _this._vtxTransparent = false;
            if (settings.size != null) {
                _this.size = settings.size;
            }
            _this.alignToPixel = (settings.alignToPixel == null) ? true : settings.alignToPixel;
            return _this;
        }
        Object.defineProperty(WireFrame2D.prototype, "wireFrameGroups", {
            get: function () {
                return this._wireFrameGroups;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * If you change the content of the wireFrameGroups you MUST call this method for the changes to be reflected during rendering
         */
        WireFrame2D.prototype.wireFrameGroupsDirty = function () {
            this._setFlags(BABYLON.SmartPropertyPrim.flagModelUpdate);
            this.onPrimBecomesDirty();
        };
        Object.defineProperty(WireFrame2D.prototype, "size", {
            get: function () {
                if (this._size == null) {
                    this._computeMinMaxTrans();
                }
                return this._size;
            },
            set: function (value) {
                this.internalSetSize(value);
            },
            enumerable: true,
            configurable: true
        });
        WireFrame2D.prototype.updateLevelBoundingInfo = function () {
            var v = this._computeMinMaxTrans();
            BABYLON.BoundingInfo2D.CreateFromMinMaxToRef(v.x, v.z, v.y, v.w, this._levelBoundingInfo);
            return true;
        };
        WireFrame2D.prototype.levelIntersect = function (intersectInfo) {
            // TODO !
            return true;
        };
        Object.defineProperty(WireFrame2D.prototype, "alignToPixel", {
            /**
             * Get/set if the sprite rendering should be aligned to the target rendering device pixel or not
             */
            get: function () {
                return this._alignToPixel;
            },
            set: function (value) {
                this._alignToPixel = value;
            },
            enumerable: true,
            configurable: true
        });
        WireFrame2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new WireFrame2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        WireFrame2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            // Create the VertexBuffer
            this._updateVertexBuffer(renderCache);
            // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
            var ei = this.getDataPartEffectInfo(WireFrame2D_1.WIREFRAME2D_MAINPARTID, ["pos", "col"], [], true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("wireframe2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            ei = this.getDataPartEffectInfo(WireFrame2D_1.WIREFRAME2D_MAINPARTID, ["pos", "col"], [], false);
            renderCache.effect = engine.createEffect("wireframe2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            return renderCache;
        };
        WireFrame2D.prototype._updateVertexBuffer = function (mrc) {
            var engine = this.owner.engine;
            if (mrc.vb != null) {
                engine._releaseBuffer(mrc.vb);
            }
            var vtxCount = 0;
            this._wireFrameGroups.forEach(function (k, v) { return vtxCount += v.vertices.length; });
            var vb = new Float32Array(vtxCount * 6);
            var i = 0;
            this._wireFrameGroups.forEach(function (k, v) {
                for (var _i = 0, _a = v.vertices; _i < _a.length; _i++) {
                    var vtx = _a[_i];
                    vb[i++] = vtx.x;
                    vb[i++] = vtx.y;
                    vb[i++] = vtx.r;
                    vb[i++] = vtx.g;
                    vb[i++] = vtx.b;
                    vb[i++] = vtx.a;
                }
            });
            mrc.vb = engine.createVertexBuffer(vb);
            mrc.vtxCount = vtxCount;
        };
        WireFrame2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === WireFrame2D_1.WIREFRAME2D_MAINPARTID) {
                var d = this._instanceDataParts[0];
                d.properties = new BABYLON.Vector3(this.alignToPixel ? 1 : 0, 2 / this.renderGroup.actualWidth, 2 / this.renderGroup.actualHeight);
            }
            return true;
        };
        WireFrame2D.prototype._computeMinMaxTrans = function () {
            var xmin = Number.MAX_VALUE;
            var xmax = Number.MIN_VALUE;
            var ymin = Number.MAX_VALUE;
            var ymax = Number.MIN_VALUE;
            var transparent = false;
            this._wireFrameGroups.forEach(function (k, v) {
                for (var _i = 0, _a = v.vertices; _i < _a.length; _i++) {
                    var vtx = _a[_i];
                    xmin = Math.min(xmin, vtx.x);
                    xmax = Math.max(xmax, vtx.x);
                    ymin = Math.min(ymin, vtx.y);
                    ymax = Math.max(ymax, vtx.y);
                    if (vtx.a < 1) {
                        transparent = true;
                    }
                }
            });
            this._vtxTransparent = transparent;
            this._size = new BABYLON.Size(xmax - xmin, ymax - ymin);
            return new BABYLON.Vector4(xmin, ymin, xmax, ymax);
        };
        WireFrame2D.prototype.createInstanceDataParts = function () {
            return [new WireFrame2DInstanceData(WireFrame2D_1.WIREFRAME2D_MAINPARTID)];
        };
        return WireFrame2D;
    }(BABYLON.RenderablePrim2D));
    WireFrame2D.WIREFRAME2D_MAINPARTID = 1;
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, function (pi) { return WireFrame2D_1.wireFrameGroupsProperty = pi; })
    ], WireFrame2D.prototype, "wireFrameGroups", null);
    WireFrame2D = WireFrame2D_1 = __decorate([
        BABYLON.className("WireFrame2D", "BABYLON")
    ], WireFrame2D);
    BABYLON.WireFrame2D = WireFrame2D;
    var WireFrame2DInstanceData = (function (_super) {
        __extends(WireFrame2DInstanceData, _super);
        function WireFrame2DInstanceData(partId) {
            return _super.call(this, partId, 1) || this;
        }
        Object.defineProperty(WireFrame2DInstanceData.prototype, "properties", {
            // the properties is for now the alignedToPixel value
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        return WireFrame2DInstanceData;
    }(BABYLON.InstanceDataBase));
    __decorate([
        BABYLON.instanceData()
    ], WireFrame2DInstanceData.prototype, "properties", null);
    BABYLON.WireFrame2DInstanceData = WireFrame2DInstanceData;
    var WireFrame2D_1;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.wireFrame2d.js.map

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Rectangle2DRenderCache = (function (_super) {
        __extends(Rectangle2DRenderCache, _super);
        function Rectangle2DRenderCache(engine, modelKey) {
            var _this = _super.call(this, engine, modelKey) || this;
            _this.effectsReady = false;
            _this.fillVB = null;
            _this.fillIB = null;
            _this.fillIndicesCount = 0;
            _this.instancingFillAttributes = null;
            _this.effectFill = null;
            _this.effectFillInstanced = null;
            _this.borderVB = null;
            _this.borderIB = null;
            _this.borderIndicesCount = 0;
            _this.instancingBorderAttributes = null;
            _this.effectBorder = null;
            _this.effectBorderInstanced = null;
            return _this;
        }
        Rectangle2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effectFill && (!this.effectFill.isReady() || (this.effectFillInstanced && !this.effectFillInstanced.isReady()))) ||
                    (this.effectBorder && (!this.effectBorder.isReady() || (this.effectBorderInstanced && !this.effectBorderInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            var depthFunction = 0;
            if (this.effectFill && this.effectBorder) {
                depthFunction = engine.getDepthFunction();
                engine.setDepthFunctionToLessOrEqual();
            }
            var curAlphaMode = engine.getAlphaMode();
            if (this.effectFill) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_FILLPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectFillInstanced : this.effectFill;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingFillAttributes) {
                        this.instancingFillAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_FILLPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.fillIndicesCount);
                    }
                }
            }
            if (this.effectBorder) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_BORDERPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectBorderInstanced : this.effectBorder;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.borderIndicesCount);
                    }
                }
            }
            engine.setAlphaMode(curAlphaMode, true);
            if (this.effectFill && this.effectBorder) {
                engine.setDepthFunction(depthFunction);
            }
            return true;
        };
        Rectangle2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.fillVB) {
                this._engine._releaseBuffer(this.fillVB);
                this.fillVB = null;
            }
            if (this.fillIB) {
                this._engine._releaseBuffer(this.fillIB);
                this.fillIB = null;
            }
            this.effectFill = null;
            this.effectFillInstanced = null;
            this.effectBorder = null;
            this.effectBorderInstanced = null;
            if (this.borderVB) {
                this._engine._releaseBuffer(this.borderVB);
                this.borderVB = null;
            }
            if (this.borderIB) {
                this._engine._releaseBuffer(this.borderIB);
                this.borderIB = null;
            }
            return true;
        };
        return Rectangle2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Rectangle2DRenderCache = Rectangle2DRenderCache;
    var Rectangle2DInstanceData = (function (_super) {
        __extends(Rectangle2DInstanceData, _super);
        function Rectangle2DInstanceData(partId) {
            return _super.call(this, partId, 1) || this;
        }
        Object.defineProperty(Rectangle2DInstanceData.prototype, "properties", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        return Rectangle2DInstanceData;
    }(BABYLON.Shape2DInstanceData));
    __decorate([
        BABYLON.instanceData()
    ], Rectangle2DInstanceData.prototype, "properties", null);
    BABYLON.Rectangle2DInstanceData = Rectangle2DInstanceData;
    var Rectangle2D = Rectangle2D_1 = (function (_super) {
        __extends(Rectangle2D, _super);
        /**
         * Create an Rectangle 2D Shape primitive. May be a sharp rectangle (with sharp corners), or a rounded one.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y settings can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height settings can be set. Default will be [10;10].
         * - roundRadius: if the rectangle has rounded corner, set their radius, default is 0 (to get a sharp edges rectangle).
         * - fill: the brush used to draw the fill content of the rectangle, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can also be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the rectangle, you can set null to draw nothing (but you will have to set a fill brush), default is null. can also be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the primitive must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Rectangle2D(settings) {
            var _this = this;
            // Avoid checking every time if the object exists
            if (settings == null) {
                settings = {};
            }
            _this = _super.call(this, settings) || this;
            if (settings.size != null) {
                _this.size = settings.size;
            }
            else if (settings.width || settings.height) {
                var size = new BABYLON.Size(settings.width, settings.height);
                _this.size = size;
            }
            //let size            = settings.size || (new Size((settings.width === null) ? null : (settings.width || 10), (settings.height === null) ? null : (settings.height || 10)));
            var roundRadius = (settings.roundRadius == null) ? 0 : settings.roundRadius;
            var borderThickness = (settings.borderThickness == null) ? 1 : settings.borderThickness;
            //this.size            = size;
            _this.roundRadius = roundRadius;
            _this.borderThickness = borderThickness;
            return _this;
        }
        Object.defineProperty(Rectangle2D.prototype, "notRounded", {
            get: function () {
                return this._notRounded;
            },
            set: function (value) {
                this._notRounded = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle2D.prototype, "roundRadius", {
            get: function () {
                return this._roundRadius;
            },
            set: function (value) {
                this._roundRadius = value;
                this.notRounded = value === 0;
                this._positioningDirty();
            },
            enumerable: true,
            configurable: true
        });
        Rectangle2D.prototype.levelIntersect = function (intersectInfo) {
            // If we got there it mean the boundingInfo intersection succeed, if the rectangle has not roundRadius, it means it succeed!
            if (this.notRounded) {
                return true;
            }
            // If we got so far it means the bounding box at least passed, so we know it's inside the bounding rectangle, but it can be outside the roundedRectangle.
            // The easiest way is to check if the point is inside on of the four corners area (a little square of roundRadius size at the four corners)
            // If it's the case for one, check if the mouse is located in the quarter that we care about (the one who is visible) then finally make a distance check with the roundRadius radius to see if it's inside the circle quarter or outside.
            // First let remove the origin out the equation, to have the rectangle with an origin at bottom/left
            var size = this.size;
            Rectangle2D_1._i0.x = intersectInfo._localPickPosition.x;
            Rectangle2D_1._i0.y = intersectInfo._localPickPosition.y;
            var rr = this.roundRadius;
            var rrs = rr * rr;
            // Check if the point is in the bottom/left quarter area
            Rectangle2D_1._i1.x = rr;
            Rectangle2D_1._i1.y = rr;
            if (Rectangle2D_1._i0.x <= Rectangle2D_1._i1.x && Rectangle2D_1._i0.y <= Rectangle2D_1._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D_1._i2.x = Rectangle2D_1._i0.x - Rectangle2D_1._i1.x;
                Rectangle2D_1._i2.y = Rectangle2D_1._i0.y - Rectangle2D_1._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D_1._i2.lengthSquared() <= rrs;
            }
            // Check if the point is in the top/left quarter area
            Rectangle2D_1._i1.x = rr;
            Rectangle2D_1._i1.y = size.height - rr;
            if (Rectangle2D_1._i0.x <= Rectangle2D_1._i1.x && Rectangle2D_1._i0.y >= Rectangle2D_1._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D_1._i2.x = Rectangle2D_1._i0.x - Rectangle2D_1._i1.x;
                Rectangle2D_1._i2.y = Rectangle2D_1._i0.y - Rectangle2D_1._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D_1._i2.lengthSquared() <= rrs;
            }
            // Check if the point is in the top/right quarter area
            Rectangle2D_1._i1.x = size.width - rr;
            Rectangle2D_1._i1.y = size.height - rr;
            if (Rectangle2D_1._i0.x >= Rectangle2D_1._i1.x && Rectangle2D_1._i0.y >= Rectangle2D_1._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D_1._i2.x = Rectangle2D_1._i0.x - Rectangle2D_1._i1.x;
                Rectangle2D_1._i2.y = Rectangle2D_1._i0.y - Rectangle2D_1._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D_1._i2.lengthSquared() <= rrs;
            }
            // Check if the point is in the bottom/right quarter area
            Rectangle2D_1._i1.x = size.width - rr;
            Rectangle2D_1._i1.y = rr;
            if (Rectangle2D_1._i0.x >= Rectangle2D_1._i1.x && Rectangle2D_1._i0.y <= Rectangle2D_1._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D_1._i2.x = Rectangle2D_1._i0.x - Rectangle2D_1._i1.x;
                Rectangle2D_1._i2.y = Rectangle2D_1._i0.y - Rectangle2D_1._i1.y;
                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D_1._i2.lengthSquared() <= rrs;
            }
            // At any other locations the point is guarantied to be inside
            return true;
        };
        Rectangle2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
            return true;
        };
        Rectangle2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Rectangle2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        Rectangle2D.prototype.updateTriArray = function () {
            // Not Rounded = sharp edge rect, the default implementation is the right one!
            if (this.notRounded) {
                _super.prototype.updateTriArray.call(this);
                return;
            }
            // Rounded Corner? It's more complicated! :)
            var subDiv = Rectangle2D_1.roundSubdivisions * 4;
            if (this._primTriArray == null) {
                this._primTriArray = new BABYLON.Tri2DArray(subDiv);
            }
            else {
                this._primTriArray.clear(subDiv);
            }
            var size = this.actualSize;
            var w = size.width;
            var h = size.height;
            var r = this.roundRadius;
            var rsub0 = subDiv * 0.25;
            var rsub1 = subDiv * 0.50;
            var rsub2 = subDiv * 0.75;
            var center = new BABYLON.Vector2(0.5 * size.width, 0.5 * size.height);
            var twopi = Math.PI * 2;
            var nru = r / w;
            var nrv = r / h;
            var computePos = function (index, p) {
                // right/bottom
                if (index < rsub0) {
                    p.x = 1.0 - nru;
                    p.y = nrv;
                }
                else if (index < rsub1) {
                    p.x = nru;
                    p.y = nrv;
                }
                else if (index < rsub2) {
                    p.x = nru;
                    p.y = 1.0 - nrv;
                }
                else {
                    p.x = 1.0 - nru;
                    p.y = 1.0 - nrv;
                }
                var angle = twopi - (index * twopi / (subDiv - 0.5));
                p.x += Math.cos(angle) * nru;
                p.y += Math.sin(angle) * nrv;
                p.x *= w;
                p.y *= h;
            };
            console.log("Genetre TriList for " + this.id);
            var first = BABYLON.Vector2.Zero();
            var cur = BABYLON.Vector2.Zero();
            computePos(0, first);
            var prev = first.clone();
            for (var index = 1; index < subDiv; index++) {
                computePos(index, cur);
                this._primTriArray.storeTriangle(index - 1, center, prev, cur);
                console.log(index - 1 + ", " + center + ", " + prev + ", " + cur);
                prev.copyFrom(cur);
            }
            this._primTriArray.storeTriangle(subDiv - 1, center, first, prev);
            console.log(subDiv - 1 + ", " + center + ", " + prev + ", " + first);
        };
        Rectangle2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                var vbSize = ((this.notRounded ? 1 : Rectangle2D_1.roundSubdivisions) * 4) + 1;
                var vb = new Float32Array(vbSize);
                for (var i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.fillVB = engine.createVertexBuffer(vb);
                var triCount = vbSize - 1;
                var ib = new Float32Array(triCount * 3);
                for (var i = 0; i < triCount; i++) {
                    ib[i * 3 + 0] = 0;
                    ib[i * 3 + 2] = i + 1;
                    ib[i * 3 + 1] = i + 2;
                }
                ib[triCount * 3 - 2] = 1;
                renderCache.fillIB = engine.createIndexBuffer(ib);
                renderCache.fillIndicesCount = triCount * 3;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], null, false);
                renderCache.effectFill = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            // Need to create WebGL resource for border part?
            if (this.border) {
                var vbSize = (this.notRounded ? 1 : Rectangle2D_1.roundSubdivisions) * 4 * 2;
                var vb = new Float32Array(vbSize);
                for (var i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.borderVB = engine.createVertexBuffer(vb);
                var triCount = vbSize;
                var rs = triCount / 2;
                var ib = new Float32Array(triCount * 3);
                for (var i = 0; i < rs; i++) {
                    var r0 = i;
                    var r1 = (i + 1) % rs;
                    ib[i * 6 + 0] = rs + r1;
                    ib[i * 6 + 1] = rs + r0;
                    ib[i * 6 + 2] = r0;
                    ib[i * 6 + 3] = r1;
                    ib[i * 6 + 4] = rs + r1;
                    ib[i * 6 + 5] = r0;
                }
                renderCache.borderIB = engine.createIndexBuffer(ib);
                renderCache.borderIndicesCount = triCount * 3;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, false);
                renderCache.effectBorder = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            return renderCache;
        };
        // We override this method because if there's a roundRadius set, we will reduce the initial Content Area to make sure the computed area won't intersect with the shape contour. The formula is simple: we shrink the incoming size by the amount of the roundRadius
        Rectangle2D.prototype._getInitialContentAreaToRef = function (primSize, initialContentPosition, initialContentArea) {
            // Fall back to default implementation if there's no round Radius
            if (this._notRounded) {
                _super.prototype._getInitialContentAreaToRef.call(this, primSize, initialContentPosition, initialContentArea);
            }
            else {
                var rr = Math.round((this.roundRadius - (this.roundRadius / Math.sqrt(2))) * 1.3);
                initialContentPosition.x = initialContentPosition.y = rr;
                initialContentArea.width = Math.max(0, primSize.width - (rr * 2));
                initialContentArea.height = Math.max(0, primSize.height - (rr * 2));
                initialContentPosition.z = primSize.width - (initialContentPosition.x + initialContentArea.width);
                initialContentPosition.w = primSize.height - (initialContentPosition.y + initialContentArea.height);
            }
        };
        Rectangle2D.prototype._getActualSizeFromContentToRef = function (primSize, paddingOffset, newPrimSize) {
            // Fall back to default implementation if there's no round Radius
            if (this._notRounded) {
                _super.prototype._getActualSizeFromContentToRef.call(this, primSize, paddingOffset, newPrimSize);
            }
            else {
                var rr = Math.round((this.roundRadius - (this.roundRadius / Math.sqrt(2))) * 1.3);
                newPrimSize.copyFrom(primSize);
                newPrimSize.width += rr * 2;
                newPrimSize.height += rr * 2;
                paddingOffset.x += rr;
                paddingOffset.y += rr;
                paddingOffset.z += rr;
                paddingOffset.w += rr;
            }
        };
        Rectangle2D.prototype.createInstanceDataParts = function () {
            var res = new Array();
            if (this.border) {
                res.push(new Rectangle2DInstanceData(BABYLON.Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Rectangle2DInstanceData(BABYLON.Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        };
        Rectangle2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === BABYLON.Shape2D.SHAPE2D_BORDERPARTID) {
                var d = part;
                var size = this.actualSize;
                var s = this.actualScale;
                d.properties = new BABYLON.Vector3(size.width * s.x, size.height * s.y, this.roundRadius || 0);
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                var size = this.actualSize;
                var s = this.actualScale;
                d.properties = new BABYLON.Vector3(size.width * s.x, size.height * s.y, this.roundRadius || 0);
            }
            return true;
        };
        return Rectangle2D;
    }(BABYLON.Shape2D));
    Rectangle2D._i0 = BABYLON.Vector2.Zero();
    Rectangle2D._i1 = BABYLON.Vector2.Zero();
    Rectangle2D._i2 = BABYLON.Vector2.Zero();
    Rectangle2D.roundSubdivisions = 16;
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 2, function (pi) { return Rectangle2D_1.notRoundedProperty = pi; })
    ], Rectangle2D.prototype, "notRounded", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 3, function (pi) { return Rectangle2D_1.roundRadiusProperty = pi; })
    ], Rectangle2D.prototype, "roundRadius", null);
    Rectangle2D = Rectangle2D_1 = __decorate([
        BABYLON.className("Rectangle2D", "BABYLON")
    ], Rectangle2D);
    BABYLON.Rectangle2D = Rectangle2D;
    var Rectangle2D_1;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Ellipse2DRenderCache = (function (_super) {
        __extends(Ellipse2DRenderCache, _super);
        function Ellipse2DRenderCache(engine, modelKey) {
            var _this = _super.call(this, engine, modelKey) || this;
            _this.effectsReady = false;
            _this.fillVB = null;
            _this.fillIB = null;
            _this.fillIndicesCount = 0;
            _this.instancingFillAttributes = null;
            _this.effectFillInstanced = null;
            _this.effectFill = null;
            _this.borderVB = null;
            _this.borderIB = null;
            _this.borderIndicesCount = 0;
            _this.instancingBorderAttributes = null;
            _this.effectBorderInstanced = null;
            _this.effectBorder = null;
            return _this;
        }
        Ellipse2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effectFill && (!this.effectFill.isReady() || (this.effectFillInstanced && !this.effectFillInstanced.isReady()))) ||
                    (this.effectBorder && (!this.effectBorder.isReady() || (this.effectBorderInstanced && !this.effectBorderInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            var depthFunction = 0;
            if (this.effectFill && this.effectBorder) {
                depthFunction = engine.getDepthFunction();
                engine.setDepthFunctionToLessOrEqual();
            }
            var curAlphaMode = engine.getAlphaMode();
            if (this.effectFill) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_FILLPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectFillInstanced : this.effectFill;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingFillAttributes) {
                        this.instancingFillAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_FILLPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.fillIndicesCount);
                    }
                }
            }
            if (this.effectBorder) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_BORDERPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectBorderInstanced : this.effectBorder;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.borderIndicesCount);
                    }
                }
            }
            engine.setAlphaMode(curAlphaMode, true);
            if (this.effectFill && this.effectBorder) {
                engine.setDepthFunction(depthFunction);
            }
            return true;
        };
        Ellipse2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.fillVB) {
                this._engine._releaseBuffer(this.fillVB);
                this.fillVB = null;
            }
            if (this.fillIB) {
                this._engine._releaseBuffer(this.fillIB);
                this.fillIB = null;
            }
            this.effectFill = null;
            this.effectFillInstanced = null;
            this.effectBorder = null;
            this.effectBorderInstanced = null;
            if (this.borderVB) {
                this._engine._releaseBuffer(this.borderVB);
                this.borderVB = null;
            }
            if (this.borderIB) {
                this._engine._releaseBuffer(this.borderIB);
                this.borderIB = null;
            }
            return true;
        };
        return Ellipse2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Ellipse2DRenderCache = Ellipse2DRenderCache;
    var Ellipse2DInstanceData = (function (_super) {
        __extends(Ellipse2DInstanceData, _super);
        function Ellipse2DInstanceData(partId) {
            return _super.call(this, partId, 1) || this;
        }
        Object.defineProperty(Ellipse2DInstanceData.prototype, "properties", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        return Ellipse2DInstanceData;
    }(BABYLON.Shape2DInstanceData));
    __decorate([
        BABYLON.instanceData()
    ], Ellipse2DInstanceData.prototype, "properties", null);
    BABYLON.Ellipse2DInstanceData = Ellipse2DInstanceData;
    var Ellipse2D = Ellipse2D_1 = (function (_super) {
        __extends(Ellipse2D, _super);
        /**
         * Create an Ellipse 2D Shape primitive
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id: a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height properties can be set. Default will be [10;10].
         * - subdivision: the number of subdivision to create the ellipse perimeter, default is 64.
         * - fill: the brush used to draw the fill content of the ellipse, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can also be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the ellipse, you can set null to draw nothing (but you will have to set a fill brush), default is null. can be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the group must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Ellipse2D(settings) {
            var _this = this;
            // Avoid checking every time if the object exists
            if (settings == null) {
                settings = {};
            }
            _this = _super.call(this, settings) || this;
            if (settings.size != null) {
                _this.size = settings.size;
            }
            else if (settings.width || settings.height) {
                var size = new BABYLON.Size(settings.width, settings.height);
                _this.size = size;
            }
            var sub = (settings.subdivisions == null) ? 64 : settings.subdivisions;
            _this.subdivisions = sub;
            return _this;
        }
        Object.defineProperty(Ellipse2D.prototype, "subdivisions", {
            get: function () {
                return this._subdivisions;
            },
            set: function (value) {
                this._subdivisions = value;
            },
            enumerable: true,
            configurable: true
        });
        Ellipse2D.prototype.levelIntersect = function (intersectInfo) {
            var w = this.size.width / 2;
            var h = this.size.height / 2;
            var x = intersectInfo._localPickPosition.x - w;
            var y = intersectInfo._localPickPosition.y - h;
            return ((x * x) / (w * w) + (y * y) / (h * h)) <= 1;
        };
        Ellipse2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
            return true;
        };
        Ellipse2D.prototype.updateTriArray = function () {
            var subDiv = this._subdivisions;
            if (this._primTriArray == null) {
                this._primTriArray = new BABYLON.Tri2DArray(subDiv);
            }
            else {
                this._primTriArray.clear(subDiv);
            }
            var size = this.actualSize;
            var center = new BABYLON.Vector2(0.5 * size.width, 0.5 * size.height);
            var v1 = BABYLON.Vector2.Zero();
            var v2 = BABYLON.Vector2.Zero();
            for (var i = 0; i < subDiv; i++) {
                var angle1 = Math.PI * 2 * (i - 1) / subDiv;
                var angle2 = Math.PI * 2 * i / subDiv;
                v1.x = ((Math.cos(angle1) / 2.0) + 0.5) * size.width;
                v1.y = ((Math.sin(angle1) / 2.0) + 0.5) * size.height;
                v2.x = ((Math.cos(angle2) / 2.0) + 0.5) * size.width;
                v2.y = ((Math.sin(angle2) / 2.0) + 0.5) * size.height;
                this._primTriArray.storeTriangle(i, center, v1, v2);
            }
        };
        Ellipse2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Ellipse2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        Ellipse2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                var vbSize = this.subdivisions + 1;
                var vb = new Float32Array(vbSize);
                for (var i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.fillVB = engine.createVertexBuffer(vb);
                var triCount = vbSize - 1;
                var ib = new Float32Array(triCount * 3);
                for (var i = 0; i < triCount; i++) {
                    ib[i * 3 + 0] = 0;
                    ib[i * 3 + 2] = i + 2;
                    ib[i * 3 + 1] = i + 1;
                }
                ib[triCount * 3 - 1] = 1;
                renderCache.fillIB = engine.createIndexBuffer(ib);
                renderCache.fillIndicesCount = triCount * 3;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect({ vertex: "ellipse2d", fragment: "ellipse2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["index"], null, false);
                renderCache.effectFill = engine.createEffect({ vertex: "ellipse2d", fragment: "ellipse2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            // Need to create WebGL resource for border part?
            if (this.border) {
                var vbSize = this.subdivisions * 2;
                var vb = new Float32Array(vbSize);
                for (var i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.borderVB = engine.createVertexBuffer(vb);
                var triCount = vbSize;
                var rs = triCount / 2;
                var ib = new Float32Array(triCount * 3);
                for (var i = 0; i < rs; i++) {
                    var r0 = i;
                    var r1 = (i + 1) % rs;
                    ib[i * 6 + 0] = rs + r1;
                    ib[i * 6 + 1] = rs + r0;
                    ib[i * 6 + 2] = r0;
                    ib[i * 6 + 3] = r1;
                    ib[i * 6 + 4] = rs + r1;
                    ib[i * 6 + 5] = r0;
                }
                renderCache.borderIB = engine.createIndexBuffer(ib);
                renderCache.borderIndicesCount = (triCount * 3);
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect("ellipse2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, false);
                renderCache.effectBorder = engine.createEffect("ellipse2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            return renderCache;
        };
        Ellipse2D.prototype.createInstanceDataParts = function () {
            var res = new Array();
            if (this.border) {
                res.push(new Ellipse2DInstanceData(BABYLON.Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Ellipse2DInstanceData(BABYLON.Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        };
        Ellipse2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === BABYLON.Shape2D.SHAPE2D_BORDERPARTID) {
                var d = part;
                var size = this.actualSize;
                var s = this.actualScale;
                d.properties = new BABYLON.Vector3(size.width * s.x, size.height * s.y, this.subdivisions);
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                var size = this.actualSize;
                var s = this.actualScale;
                d.properties = new BABYLON.Vector3(size.width * s.x, size.height * s.y, this.subdivisions);
            }
            return true;
        };
        return Ellipse2D;
    }(BABYLON.Shape2D));
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 2, function (pi) { return Ellipse2D_1.subdivisionsProperty = pi; })
    ], Ellipse2D.prototype, "subdivisions", null);
    Ellipse2D = Ellipse2D_1 = __decorate([
        BABYLON.className("Ellipse2D", "BABYLON")
    ], Ellipse2D);
    BABYLON.Ellipse2D = Ellipse2D;
    var Ellipse2D_1;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Sprite2DRenderCache = (function (_super) {
        __extends(Sprite2DRenderCache, _super);
        function Sprite2DRenderCache() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.effectsReady = false;
            _this.vb = null;
            _this.ib = null;
            _this.instancingAttributes = null;
            _this.texture = null;
            _this.effect = null;
            _this.effectInstanced = null;
            return _this;
        }
        Sprite2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effect && (!this.effect.isReady() || (this.effectInstanced && !this.effectInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            var cur = engine.getAlphaMode();
            var effect = context.useInstancing ? this.effectInstanced : this.effect;
            engine.enableEffect(effect);
            effect.setTexture("diffuseSampler", this.texture);
            engine.bindBuffersDirectly(this.vb, this.ib, [1], 4, effect);
            if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
            }
            effect.setBool("alphaTest", context.renderMode === BABYLON.Render2DContext.RenderModeAlphaTest);
            var pid = context.groupInfoPartData[0];
            if (context.useInstancing) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(Sprite2D.SPRITE2D_MAINPARTID, effect);
                }
                var glBuffer = context.instancedBuffers ? context.instancedBuffers[0] : pid._partBuffer;
                var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                canvas._addDrawCallCount(1, context.renderMode);
                engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingAttributes);
                engine.draw(true, 0, 6, count);
                engine.unbindInstanceAttributes();
            }
            else {
                canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                    this.setupUniforms(effect, 0, pid._partData, i);
                    engine.draw(true, 0, 6);
                }
            }
            engine.setAlphaMode(cur, true);
            return true;
        };
        Sprite2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.vb) {
                this._engine._releaseBuffer(this.vb);
                this.vb = null;
            }
            if (this.ib) {
                this._engine._releaseBuffer(this.ib);
                this.ib = null;
            }
            //if (this.texture) {
            //    this.texture.dispose();
            //    this.texture = null;
            //}
            this.effect = null;
            this.effectInstanced = null;
            return true;
        };
        return Sprite2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Sprite2DRenderCache = Sprite2DRenderCache;
    var Sprite2D = Sprite2D_1 = (function (_super) {
        __extends(Sprite2D, _super);
        /**
         * Create an 2D Sprite primitive
         * @param texture the texture that stores the sprite to render
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - size: the size of the sprite displayed in the canvas, if not specified the spriteSize will be used
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - spriteSize: the size of the sprite (in pixels) as it is stored in the texture, if null the size of the given texture will be used, default is null.
         * - spriteLocation: the location (in pixels) in the texture of the top/left corner of the Sprite to display, default is null (0,0)
         * - spriteScaleFactor: DEPRECATED. Old behavior: say you want to display a sprite twice as big as its bitmap which is 64,64, you set the spriteSize to 128,128 and have to set the spriteScaleFactory to 0.5,0.5 in order to address only the 64,64 pixels of the bitmaps. Default is 1,1.
         * - scale9: draw the sprite as a Scale9 sprite, see http://yannickloriot.com/2013/03/9-patch-technique-in-cocos2d/ for more info. x, y, w, z are left, bottom, right, top coordinate of the resizable box
         * - invertY: if true the texture Y will be inverted, default is false.
         * - alignToPixel: if true the sprite's texels will be aligned to the rendering viewport pixels, ensuring the best rendering quality but slow animations won't be done as smooth as if you set false. If false a texel could lies between two pixels, being blended by the texture sampling mode you choose, the rendering result won't be as good, but very slow animation will be overall better looking. Default is true: content will be aligned.
         * - isVisible: true if the sprite must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Sprite2D(texture, settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _this = _super.call(this, settings) || this;
            _this.texture = texture;
            // This is removed to let the user the possibility to setup the addressing mode he wants
            //this.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
            //this.texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            _this._useSize = false;
            _this._spriteSize = (settings.spriteSize != null) ? settings.spriteSize.clone() : null;
            _this._spriteLocation = (settings.spriteLocation != null) ? settings.spriteLocation.clone() : new BABYLON.Vector2(0, 0);
            if (settings.size != null) {
                _this.size = settings.size;
            }
            _this.spriteFrame = 0;
            _this.invertY = (settings.invertY == null) ? false : settings.invertY;
            _this.alignToPixel = (settings.alignToPixel == null) ? true : settings.alignToPixel;
            _this.useAlphaFromTexture = true;
            _this._scale9 = (settings.scale9 != null) ? settings.scale9.clone() : null;
            // If the user doesn't set a size, we'll use the texture's one, but if the texture is not loading, we HAVE to set a temporary dummy size otherwise the positioning engine will switch the marginAlignement to stretch/stretch, and WE DON'T WANT THAT.
            // The fucking delayed texture sprite bug is fixed!
            if (settings.spriteSize == null) {
                _this.spriteSize = new BABYLON.Size(10, 10);
            }
            if (settings.spriteSize == null || !texture.isReady()) {
                if (texture.isReady()) {
                    var s = texture.getBaseSize();
                    _this.spriteSize = new BABYLON.Size(s.width, s.height);
                    _this._updateSpriteScaleFactor();
                }
                else {
                    texture.onLoadObservable.add(function () {
                        if (settings.spriteSize == null) {
                            var s = texture.getBaseSize();
                            _this.spriteSize = new BABYLON.Size(s.width, s.height);
                        }
                        _this._updateSpriteScaleFactor();
                        _this._positioningDirty();
                        _this._setLayoutDirty();
                        _this._instanceDirtyFlags |= BABYLON.Prim2DBase.originProperty.flagId | Sprite2D_1.textureProperty.flagId; // To make sure the sprite is issued again for render
                    });
                }
            }
            return _this;
        }
        Object.defineProperty(Sprite2D.prototype, "texture", {
            get: function () {
                return this._texture;
            },
            set: function (value) {
                this._texture = value;
                this._oldTextureHasAlpha = this._texture && this.texture.hasAlpha;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "useAlphaFromTexture", {
            get: function () {
                return this._useAlphaFromTexture;
            },
            set: function (value) {
                if (this._useAlphaFromTexture === value) {
                    return;
                }
                this._useAlphaFromTexture = value;
                this._updateRenderMode();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "size", {
            get: function () {
                if (this._size == null) {
                    return this.spriteSize;
                }
                return this.internalGetSize();
            },
            set: function (value) {
                this._useSize = value != null;
                this.internalSetSize(value);
                this._updateSpriteScaleFactor();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "spriteSize", {
            get: function () {
                return this._spriteSize;
            },
            set: function (value) {
                if (!this._spriteSize) {
                    this._spriteSize = value.clone();
                }
                else {
                    this._spriteSize.copyFrom(value);
                }
                this._updateSpriteScaleFactor();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "spriteLocation", {
            get: function () {
                return this._spriteLocation;
            },
            set: function (value) {
                if (!this._spriteLocation) {
                    this._spriteLocation = value.clone();
                }
                else {
                    this._spriteLocation.copyFrom(value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "spriteFrame", {
            get: function () {
                return this._spriteFrame;
            },
            set: function (value) {
                this._spriteFrame = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "invertY", {
            get: function () {
                return this._invertY;
            },
            set: function (value) {
                this._invertY = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "isScale9", {
            get: function () {
                return this._scale9 !== null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2D.prototype, "alignToPixel", {
            //@instanceLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 7, pi => Sprite2D.spriteScaleFactorProperty = pi)
            ///**
            // * Get/set the sprite location (in pixels) in the texture
            // */
            //public get spriteScaleFactor(): Vector2 {
            //    return this._spriteScaleFactor;
            //}
            //public set spriteScaleFactor(value: Vector2) {
            //    this._spriteScaleFactor = value;
            //}
            /**
             * Get/set if the sprite rendering should be aligned to the target rendering device pixel or not
             */
            get: function () {
                return this._alignToPixel;
            },
            set: function (value) {
                this._alignToPixel = value;
            },
            enumerable: true,
            configurable: true
        });
        Sprite2D.prototype.updateLevelBoundingInfo = function () {
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.size, this._levelBoundingInfo);
            return true;
        };
        /**
         * Get the animatable array (see http://doc.babylonjs.com/tutorials/Animations)
         */
        Sprite2D.prototype.getAnimatables = function () {
            var res = new Array();
            if (this.texture && this.texture.animations && this.texture.animations.length > 0) {
                res.push(this.texture);
            }
            return res;
        };
        Sprite2D.prototype.levelIntersect = function (intersectInfo) {
            // If we've made it so far it means the boundingInfo intersection test succeed, the Sprite2D is shaped the same, so we always return true
            return true;
        };
        Object.defineProperty(Sprite2D.prototype, "isSizeAuto", {
            get: function () {
                return this.size == null;
            },
            enumerable: true,
            configurable: true
        });
        Sprite2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Sprite2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        Sprite2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            var vb = new Float32Array(4);
            for (var i = 0; i < 4; i++) {
                vb[i] = i;
            }
            renderCache.vb = engine.createVertexBuffer(vb);
            var ib = new Float32Array(6);
            ib[0] = 0;
            ib[1] = 2;
            ib[2] = 1;
            ib[3] = 0;
            ib[4] = 3;
            ib[5] = 2;
            renderCache.ib = engine.createIndexBuffer(ib);
            renderCache.texture = this.texture;
            // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
            var ei = this.getDataPartEffectInfo(Sprite2D_1.SPRITE2D_MAINPARTID, ["index"], ["alphaTest"], true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("sprite2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            }
            ei = this.getDataPartEffectInfo(Sprite2D_1.SPRITE2D_MAINPARTID, ["index"], ["alphaTest"], false);
            renderCache.effect = engine.createEffect("sprite2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            return renderCache;
        };
        Sprite2D.prototype.getUsedShaderCategories = function (dataPart) {
            var cat = _super.prototype.getUsedShaderCategories.call(this, dataPart);
            if (dataPart.id === Sprite2D_1.SPRITE2D_MAINPARTID) {
                var useScale9 = this._scale9 != null;
                if (useScale9) {
                    cat.push(Sprite2D_1.SHAPE2D_CATEGORY_SCALE9);
                }
            }
            return cat;
        };
        Sprite2D.prototype.createInstanceDataParts = function () {
            return [new Sprite2DInstanceData(Sprite2D_1.SPRITE2D_MAINPARTID)];
        };
        Sprite2D.prototype.beforeRefreshForLayoutConstruction = function (part) {
            Sprite2D_1.layoutConstructMode = true;
        };
        // if obj contains something, we restore the _text property
        Sprite2D.prototype.afterRefreshForLayoutConstruction = function (part, obj) {
            Sprite2D_1.layoutConstructMode = false;
        };
        Sprite2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (!this.texture.isReady() && !Sprite2D_1.layoutConstructMode) {
                return false;
            }
            if (part.id === Sprite2D_1.SPRITE2D_MAINPARTID) {
                var d = this._instanceDataParts[0];
                if (Sprite2D_1.layoutConstructMode) {
                    d.topLeftUV = BABYLON.Vector2.Zero();
                    d.sizeUV = BABYLON.Vector2.Zero();
                    d.properties = BABYLON.Vector3.Zero();
                    d.textureSize = BABYLON.Vector2.Zero();
                    d.scaleFactor = BABYLON.Vector2.Zero();
                    if (this.isScale9) {
                        d.scale9 = BABYLON.Vector4.Zero();
                    }
                }
                else {
                    var ts = this.texture.getBaseSize();
                    var ss = this.spriteSize;
                    var sl = this.spriteLocation;
                    var ssf = this.actualScale;
                    d.topLeftUV = new BABYLON.Vector2(sl.x / ts.width, sl.y / ts.height);
                    var suv = new BABYLON.Vector2(ss.width / ts.width, ss.height / ts.height);
                    d.sizeUV = suv;
                    d.scaleFactor = ssf;
                    Sprite2D_1._prop.x = this.spriteFrame;
                    Sprite2D_1._prop.y = this.invertY ? 1 : 0;
                    Sprite2D_1._prop.z = this.alignToPixel ? 1 : 0;
                    d.properties = Sprite2D_1._prop;
                    d.textureSize = new BABYLON.Vector2(ts.width, ts.height);
                    var scale9 = this._scale9;
                    if (scale9 != null) {
                        var normalizedScale9 = new BABYLON.Vector4(scale9.x * suv.x / ss.width, scale9.y * suv.y / ss.height, scale9.z * suv.x / ss.width, scale9.w * suv.y / ss.height);
                        d.scale9 = normalizedScale9;
                    }
                }
            }
            return true;
        };
        Sprite2D.prototype._mustUpdateInstance = function () {
            var res = this._oldTextureHasAlpha !== (this.texture != null && this.texture.hasAlpha);
            this._oldTextureHasAlpha = this.texture != null && this.texture.hasAlpha;
            if (res) {
                this._updateRenderMode();
            }
            return res;
        };
        Sprite2D.prototype._useTextureAlpha = function () {
            return this.texture != null && this.texture.hasAlpha;
        };
        Sprite2D.prototype._shouldUseAlphaFromTexture = function () {
            return this.texture != null && this.texture.hasAlpha && this.useAlphaFromTexture;
        };
        Sprite2D.prototype._updateSpriteScaleFactor = function () {
            if (!this._useSize) {
                return;
            }
            var sS = this.spriteSize;
            var s = this.size;
            if (s == null || sS == null) {
                return;
            }
            this._postScale.x = s.width / sS.width;
            this._postScale.y = s.height / sS.height;
        };
        return Sprite2D;
    }(BABYLON.RenderablePrim2D));
    Sprite2D.SPRITE2D_MAINPARTID = 1;
    Sprite2D.SHAPE2D_CATEGORY_SCALE9 = "Scale9";
    Sprite2D._prop = BABYLON.Vector3.Zero();
    Sprite2D.layoutConstructMode = false;
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, function (pi) { return Sprite2D_1.textureProperty = pi; })
    ], Sprite2D.prototype, "texture", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, function (pi) { return Sprite2D_1.useAlphaFromTextureProperty = pi; })
    ], Sprite2D.prototype, "useAlphaFromTexture", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, function (pi) { return Sprite2D_1.spriteSizeProperty = pi; }, false, true)
    ], Sprite2D.prototype, "spriteSize", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5, function (pi) { return Sprite2D_1.spriteLocationProperty = pi; })
    ], Sprite2D.prototype, "spriteLocation", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 6, function (pi) { return Sprite2D_1.spriteFrameProperty = pi; })
    ], Sprite2D.prototype, "spriteFrame", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 7, function (pi) { return Sprite2D_1.invertYProperty = pi; })
    ], Sprite2D.prototype, "invertY", null);
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 8, function (pi) { return Sprite2D_1.spriteScale9Property = pi; })
    ], Sprite2D.prototype, "isScale9", null);
    Sprite2D = Sprite2D_1 = __decorate([
        BABYLON.className("Sprite2D", "BABYLON")
    ], Sprite2D);
    BABYLON.Sprite2D = Sprite2D;
    var Sprite2DInstanceData = (function (_super) {
        __extends(Sprite2DInstanceData, _super);
        function Sprite2DInstanceData(partId) {
            return _super.call(this, partId, 1) || this;
        }
        Object.defineProperty(Sprite2DInstanceData.prototype, "topLeftUV", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "sizeUV", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "scaleFactor", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "textureSize", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "properties", {
            // 3 floats being:
            // - x: frame number to display
            // - y: invertY setting
            // - z: alignToPixel setting
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite2DInstanceData.prototype, "scale9", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        return Sprite2DInstanceData;
    }(BABYLON.InstanceDataBase));
    __decorate([
        BABYLON.instanceData()
    ], Sprite2DInstanceData.prototype, "topLeftUV", null);
    __decorate([
        BABYLON.instanceData()
    ], Sprite2DInstanceData.prototype, "sizeUV", null);
    __decorate([
        BABYLON.instanceData(Sprite2D.SHAPE2D_CATEGORY_SCALE9)
    ], Sprite2DInstanceData.prototype, "scaleFactor", null);
    __decorate([
        BABYLON.instanceData()
    ], Sprite2DInstanceData.prototype, "textureSize", null);
    __decorate([
        BABYLON.instanceData()
    ], Sprite2DInstanceData.prototype, "properties", null);
    __decorate([
        BABYLON.instanceData(Sprite2D.SHAPE2D_CATEGORY_SCALE9)
    ], Sprite2DInstanceData.prototype, "scale9", null);
    BABYLON.Sprite2DInstanceData = Sprite2DInstanceData;
    var Sprite2D_1;
})(BABYLON || (BABYLON = {}));

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    /**
     * This class will contains information about a sub picture present in an Atlas Picture.
     */
    var AtlasSubPictureInfo = (function () {
        function AtlasSubPictureInfo() {
        }
        return AtlasSubPictureInfo;
    }());
    BABYLON.AtlasSubPictureInfo = AtlasSubPictureInfo;
    /**
     * This class represent an Atlas Picture, it contains the information of all the sub pictures and the Texture that stores the bitmap.
     * You get an instance of this class using methods of the AtlasPictureInfoFactory
     */
    var AtlasPictureInfo = (function () {
        function AtlasPictureInfo() {
        }
        /**
         * Creates many sprite from the Atlas Picture
         * @param filterCallback a predicate if true is returned then the corresponding sub picture will be used to create a sprite.
         * The Predicate has many parameters:
         *  - index: just an index incremented at each sub picture submitted for Sprite creation
         *  - name: the sub picture's name
         *  - aspi: the AtlasSubPictureInfo corresponding to the submitted sub picture
         *  - settings: the Sprite2D creation settings, you can alter this JSON object but BEWARE, the alterations will be kept for subsequent Sprite2D creations!
         * @param spriteSettings The Sprite2D settings to use for Sprite creation, this JSON object will be passed to the filterCallback for you to alter it, if needed.
         */
        AtlasPictureInfo.prototype.createSprites = function (filterCallback, spriteSettings) {
            var _this = this;
            var res = new Array();
            var index = 0;
            this.subPictures.forEach(function (k, v) {
                if (!filterCallback || filterCallback(index++, k, v, spriteSettings)) {
                    var s = _this.createSprite(k, spriteSettings);
                    if (s) {
                        res.push(s);
                    }
                }
            });
            return res;
        };
        /**
         * Create one Sprite from a sub picture
         * @param subPictureName the name of the sub picture to use
         * @param spriteSettings the Sprite2D settings to use for the Sprite instance creation
         */
        AtlasPictureInfo.prototype.createSprite = function (subPictureName, spriteSettings) {
            var spi = this.subPictures.get(subPictureName);
            if (!spi) {
                return null;
            }
            if (!spriteSettings) {
                spriteSettings = {};
            }
            var s = spriteSettings;
            s.id = subPictureName;
            s.spriteLocation = spi.location;
            s.spriteSize = spi.size;
            var sprite = new BABYLON.Sprite2D(this.texture, spriteSettings);
            return sprite;
        };
        return AtlasPictureInfo;
    }());
    BABYLON.AtlasPictureInfo = AtlasPictureInfo;
    /**
     * This if the Factory class containing static method to create Atlas Pictures Info objects or add new loaders
     */
    var AtlasPictureInfoFactory = (function () {
        function AtlasPictureInfoFactory() {
        }
        /**
         * Add a custom loader
         * @param fileExtension must be the file extension (without the dot) of the file that is loaded by this loader (e.g.: json)
         * @param plugin the instance of the loader
         */
        AtlasPictureInfoFactory.addLoader = function (fileExtension, plugin) {
            var a = AtlasPictureInfoFactory.plugins.getOrAddWithFactory(fileExtension.toLocaleLowerCase(), function () { return new Array(); });
            a.push(plugin);
        };
        /**
         * Load an Atlas Picture Info object from a data file at a given url and with a given texture
         * @param texture the texture containing the atlas bitmap
         * @param url the URL of the Atlas Info data file
         * @param onLoad a callback that will be called when the AtlasPictureInfo object will be loaded and ready
         * @param onError a callback that will be called in case of error
         */
        AtlasPictureInfoFactory.loadFromUrl = function (texture, url, onLoad, onError) {
            if (onError === void 0) { onError = null; }
            BABYLON.Tools.LoadFile(url, function (data) {
                var ext = url.split('.').pop().split(/\#|\?/)[0];
                var plugins = AtlasPictureInfoFactory.plugins.get(ext.toLocaleLowerCase());
                if (!plugins) {
                    if (onError) {
                        onError("couldn't find a plugin for this file extension", -1);
                    }
                    return;
                }
                for (var _i = 0, plugins_1 = plugins; _i < plugins_1.length; _i++) {
                    var p = plugins_1[_i];
                    var ret = p.loadFile(data);
                    if (ret) {
                        if (ret.api) {
                            ret.api.texture = texture;
                            if (onLoad) {
                                onLoad(ret.api);
                            }
                        }
                        else if (onError) {
                            onError(ret.errorMsg, ret.errorCode);
                        }
                        return;
                    }
                }
                if (onError) {
                    onError("No plugin to load this Atlas Data file format", -1);
                }
            }, null, null, null, function () {
                if (onError) {
                    onError("Couldn't load file", -1);
                }
            });
            return null;
        };
        return AtlasPictureInfoFactory;
    }());
    AtlasPictureInfoFactory.plugins = new BABYLON.StringDictionary();
    BABYLON.AtlasPictureInfoFactory = AtlasPictureInfoFactory;
    // Loader class for the TexturePacker's JSON Array data format
    var JSONArrayLoader = JSONArrayLoader_1 = (function () {
        function JSONArrayLoader() {
        }
        JSONArrayLoader.prototype.loadFile = function (content) {
            var errorMsg = null;
            var errorCode = 0;
            var root = null;
            var api = null;
            try {
                var frames_1;
                var meta = void 0;
                try {
                    root = JSON.parse(content);
                    frames_1 = root.frames;
                    meta = root.meta;
                    if (!frames_1 || !meta) {
                        throw Error("Not a JSON Array file format");
                    }
                }
                catch (ex1) {
                    return null;
                }
                api = new AtlasPictureInfo();
                api.atlasSize = new BABYLON.Size(meta.size.w, meta.size.h);
                api.subPictures = new BABYLON.StringDictionary();
                for (var _i = 0, frames_2 = frames_1; _i < frames_2.length; _i++) {
                    var f = frames_2[_i];
                    var aspi = new AtlasSubPictureInfo();
                    aspi.name = f.filename;
                    aspi.location = new BABYLON.Vector2(f.frame.x, api.atlasSize.height - (f.frame.y + f.frame.h));
                    aspi.size = new BABYLON.Size(f.frame.w, f.frame.h);
                    api.subPictures.add(aspi.name, aspi);
                }
            }
            catch (ex2) {
                errorMsg = "Unknown Exception: " + ex2;
                errorCode = -2;
            }
            return { api: api, errorMsg: errorMsg, errorCode: errorCode };
        };
        return JSONArrayLoader;
    }());
    JSONArrayLoader = JSONArrayLoader_1 = __decorate([
        AtlasLoaderPlugin("json", new JSONArrayLoader_1())
    ], JSONArrayLoader);
    /**
     * Use this decorator when you declare an Atlas Loader Class for the loader to register itself automatically.
     * @param fileExtension the extension of the file that the plugin is loading (there can be many plugin for the same extension)
     * @param plugin an instance of the plugin class to add to the AtlasPictureInfoFactory
     */
    function AtlasLoaderPlugin(fileExtension, plugin) {
        return function () {
            AtlasPictureInfoFactory.addLoader(fileExtension, plugin);
        };
    }
    BABYLON.AtlasLoaderPlugin = AtlasLoaderPlugin;
    var JSONArrayLoader_1;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Text2DRenderCache = (function (_super) {
        __extends(Text2DRenderCache, _super);
        function Text2DRenderCache() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.effectsReady = false;
            _this.vb = null;
            _this.ib = null;
            _this.instancingAttributes = null;
            _this.fontTexture = null;
            _this.effect = null;
            _this.effectInstanced = null;
            return _this;
        }
        Text2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effect && (!this.effect.isReady() || (this.effectInstanced && !this.effectInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            this.fontTexture.update();
            var effect = context.useInstancing ? this.effectInstanced : this.effect;
            engine.enableEffect(effect);
            effect.setTexture("diffuseSampler", this.fontTexture);
            engine.bindBuffersDirectly(this.vb, this.ib, [1], 4, effect);
            var sdf = this.fontTexture.isSignedDistanceField;
            // Enable alpha mode only if the texture is not using SDF, SDF is rendered in AlphaTest mode, which mean no alpha blend
            var curAlphaMode;
            if (!sdf) {
                curAlphaMode = engine.getAlphaMode();
                engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
            }
            var pid = context.groupInfoPartData[0];
            if (context.useInstancing) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(Text2D.TEXT2D_MAINPARTID, effect);
                }
                var glBuffer = context.instancedBuffers ? context.instancedBuffers[0] : pid._partBuffer;
                var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                canvas._addDrawCallCount(1, context.renderMode);
                engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingAttributes);
                engine.draw(true, 0, 6, count);
                engine.unbindInstanceAttributes();
            }
            else {
                canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                    this.setupUniforms(effect, 0, pid._partData, i);
                    engine.draw(true, 0, 6);
                }
            }
            if (!sdf) {
                engine.setAlphaMode(curAlphaMode, true);
            }
            return true;
        };
        Text2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.vb) {
                this._engine._releaseBuffer(this.vb);
                this.vb = null;
            }
            if (this.ib) {
                this._engine._releaseBuffer(this.ib);
                this.ib = null;
            }
            if (this.fontTexture) {
                this.fontTexture.decCachedFontTextureCounter();
                this.fontTexture = null;
            }
            this.effect = null;
            this.effectInstanced = null;
            return true;
        };
        return Text2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Text2DRenderCache = Text2DRenderCache;
    var Text2DInstanceData = (function (_super) {
        __extends(Text2DInstanceData, _super);
        function Text2DInstanceData(partId, dataElementCount) {
            return _super.call(this, partId, dataElementCount) || this;
        }
        Object.defineProperty(Text2DInstanceData.prototype, "topLeftUV", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2DInstanceData.prototype, "sizeUV", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2DInstanceData.prototype, "textureSize", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2DInstanceData.prototype, "color", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2DInstanceData.prototype, "superSampleFactor", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        return Text2DInstanceData;
    }(BABYLON.InstanceDataBase));
    __decorate([
        BABYLON.instanceData()
    ], Text2DInstanceData.prototype, "topLeftUV", null);
    __decorate([
        BABYLON.instanceData()
    ], Text2DInstanceData.prototype, "sizeUV", null);
    __decorate([
        BABYLON.instanceData()
    ], Text2DInstanceData.prototype, "textureSize", null);
    __decorate([
        BABYLON.instanceData()
    ], Text2DInstanceData.prototype, "color", null);
    __decorate([
        BABYLON.instanceData()
    ], Text2DInstanceData.prototype, "superSampleFactor", null);
    BABYLON.Text2DInstanceData = Text2DInstanceData;
    var Text2D = Text2D_1 = (function (_super) {
        __extends(Text2D, _super);
        /**
         * Create a Text primitive
         * @param text the text to display
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - fontName: the name/size/style of the font to use, following the CSS notation. Default is "12pt Arial".
         * - fontSuperSample: if true the text will be rendered with a superSampled font (the font is twice the given size). Use this settings if the text lies in world space or if it's scaled in.
         * - signedDistanceField: if true the text will be rendered using the SignedDistanceField technique. This technique has the advantage to be rendered order independent (then much less drawing calls), but only works on font that are a little more than one pixel wide on the screen but the rendering quality is excellent whatever the font size is on the screen (which is the purpose of this technique). Outlining/Shadow is not supported right now. If you can, you should use this mode, the quality and the performances are the best. Note that fontSuperSample has no effect when this mode is on.
         * - defaultFontColor: the color by default to apply on each letter of the text to display, default is plain white.
         * - areaSize: the size of the area in which to display the text, default is auto-fit from text content.
         * - tabulationSize: number of space character to insert when a tabulation is encountered, default is 4
         * - isVisible: true if the text must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         * - textAlignmentH: align text horizontally (Text2D.AlignLeft, Text2D.AlignCenter, Text2D.AlignRight)
         * - textAlignmentV: align text vertically (Text2D.AlignTop, Text2D.AlignCenter, Text2D.AlignBottom)
         * - textAlignment: a string defining the text alignment, text can be: [<h:|horizontal:><left|right|center>], [<v:|vertical:><top|bottom|center>]
         * - wordWrap: if true the text will wrap inside content area
         */
        function Text2D(text, settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _this = _super.call(this, settings) || this;
            if (settings.bitmapFontTexture != null) {
                _this._fontTexture = settings.bitmapFontTexture;
                _this._fontName = null;
                _this._fontSuperSample = false;
                _this._fontSDF = false;
                var ft = _this._fontTexture;
                if (ft != null && !ft.isReady()) {
                    ft.onLoadObservable.add(function () {
                        _this._positioningDirty();
                        _this._setLayoutDirty();
                        _this._instanceDirtyFlags |= BABYLON.Prim2DBase.originProperty.flagId; // To make sure the Text2D is issued again for render
                    });
                }
            }
            else {
                _this._fontName = (settings.fontName == null) ? "12pt Arial" : settings.fontName;
                _this._fontSuperSample = (settings.fontSuperSample != null && settings.fontSuperSample);
                _this._fontSDF = (settings.fontSignedDistanceField != null && settings.fontSignedDistanceField);
            }
            _this._defaultFontColor = (settings.defaultFontColor == null) ? new BABYLON.Color4(1, 1, 1, 1) : settings.defaultFontColor.clone();
            _this._tabulationSize = (settings.tabulationSize == null) ? 4 : settings.tabulationSize;
            _this._textSize = null;
            _this.text = text;
            if (settings.size != null) {
                _this.size = settings.size;
                _this._sizeSetByUser = true;
            }
            else {
                _this.size = null;
            }
            _this.textAlignmentH = (settings.textAlignmentH == null) ? Text2D_1.AlignLeft : settings.textAlignmentH;
            _this.textAlignmentV = (settings.textAlignmentV == null) ? Text2D_1.AlignTop : settings.textAlignmentV;
            _this.textAlignment = (settings.textAlignment == null) ? "" : settings.textAlignment;
            _this._wordWrap = (settings.wordWrap == null) ? false : settings.wordWrap;
            _this._updateRenderMode();
            return _this;
        }
        Object.defineProperty(Text2D, "AlignLeft", {
            /**
             * Alignment is made relative to the left edge of the Content Area. Valid for horizontal alignment only.
             */
            get: function () { return Text2D_1._AlignLeft; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D, "AlignTop", {
            /**
             * Alignment is made relative to the top edge of the Content Area. Valid for vertical alignment only.
             */
            get: function () { return Text2D_1._AlignTop; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D, "AlignRight", {
            /**
             * Alignment is made relative to the right edge of the Content Area. Valid for horizontal alignment only.
             */
            get: function () { return Text2D_1._AlignRight; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D, "AlignBottom", {
            /**
             * Alignment is made relative to the bottom edge of the Content Area. Valid for vertical alignment only.
             */
            get: function () { return Text2D_1._AlignBottom; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D, "AlignCenter", {
            /**
             * Alignment is made to center the text from equal distance to the opposite edges of the Content Area
             */
            get: function () { return Text2D_1._AlignCenter; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "fontName", {
            get: function () {
                return this._fontName;
            },
            set: function (value) {
                if (this._fontName) {
                    throw new Error("Font Name change is not supported right now.");
                }
                this._fontName = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "defaultFontColor", {
            get: function () {
                return this._defaultFontColor;
            },
            set: function (value) {
                if (!this._defaultFontColor) {
                    this._defaultFontColor = value.clone();
                }
                else {
                    this._defaultFontColor.copyFrom(value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "text", {
            get: function () {
                return this._text;
            },
            set: function (value) {
                if (!value) {
                    value = "";
                }
                this._text = value;
                this._textSize = null; // A change of text will reset the TextSize which will be recomputed next time it's used
                if (!this._sizeSetByUser) {
                    this._size = null;
                }
                this._updateCharCount();
                // Trigger a textSize to for a sizeChange if necessary, which is needed for layout to recompute
                var s = this.textSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "size", {
            get: function () {
                if (this._size != null) {
                    return this._size;
                }
                return this.textSize;
            },
            set: function (value) {
                this.internalSetSize(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "fontSuperSample", {
            get: function () {
                return this._fontTexture && this._fontTexture.isSuperSampled;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "fontSignedDistanceField", {
            get: function () {
                return this._fontTexture && this._fontTexture.isSignedDistanceField;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "isSizeAuto", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "isVerticalSizeAuto", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "isHorizontalSizeAuto", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Text2D.prototype, "textSize", {
            /**
             * Get the area that bounds the text associated to the primitive
             */
            get: function () {
                if (!this._textSize) {
                    if (this.owner && this._text) {
                        var newSize = this.fontTexture.measureText(this._text, this._tabulationSize);
                        if (!newSize.equals(this._textSize)) {
                            this.onPrimitivePropertyDirty(BABYLON.Prim2DBase.sizeProperty.flagId);
                            this._positioningDirty();
                        }
                        this._textSize = newSize;
                    }
                    else {
                        return Text2D_1.nullSize;
                    }
                }
                return this._textSize;
            },
            enumerable: true,
            configurable: true
        });
        Text2D.prototype.onSetOwner = function () {
            if (!this._textSize) {
                this.onPrimitivePropertyDirty(BABYLON.Prim2DBase.sizeProperty.flagId);
                this._setLayoutDirty();
                this._positioningDirty();
                this._actualSize = null;
            }
        };
        Object.defineProperty(Text2D.prototype, "fontTexture", {
            get: function () {
                if (this._fontTexture) {
                    return this._fontTexture;
                }
                if (this.fontName == null || this.owner == null || this.owner.scene == null) {
                    return null;
                }
                this._fontTexture = BABYLON.FontTexture.GetCachedFontTexture(this.owner.scene, this.fontName, this._fontSuperSample, this._fontSDF);
                return this._fontTexture;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Dispose the primitive, remove it from its parent
         */
        Text2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._fontTexture) {
                BABYLON.FontTexture.ReleaseCachedFontTexture(this.owner.scene, this.fontName, this._fontSuperSample, this._fontSDF);
                this._fontTexture = null;
            }
            return true;
        };
        Text2D.prototype.updateLevelBoundingInfo = function () {
            if (!this.owner || !this._text) {
                return false;
            }
            BABYLON.BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
            return true;
        };
        Object.defineProperty(Text2D.prototype, "textAlignment", {
            /**
             * You can get/set the text alignment through this property
             */
            get: function () {
                return this._textAlignment;
            },
            set: function (value) {
                this._textAlignment = value;
                this._setTextAlignmentfromString(value);
            },
            enumerable: true,
            configurable: true
        });
        Text2D.prototype.levelIntersect = function (intersectInfo) {
            // For now I can't do something better that boundingInfo is a hit, detecting an intersection on a particular letter would be possible, but do we really need it? Not for now...
            return true;
        };
        Text2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Text2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        Text2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            renderCache.fontTexture = this.fontTexture;
            renderCache.fontTexture.incCachedFontTextureCounter();
            var vb = new Float32Array(4);
            for (var i = 0; i < 4; i++) {
                vb[i] = i;
            }
            renderCache.vb = engine.createVertexBuffer(vb);
            var ib = new Float32Array(6);
            ib[0] = 0;
            ib[1] = 2;
            ib[2] = 1;
            ib[3] = 0;
            ib[4] = 3;
            ib[5] = 2;
            renderCache.ib = engine.createIndexBuffer(ib);
            // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
            var ei = this.getDataPartEffectInfo(Text2D_1.TEXT2D_MAINPARTID, ["index"], null, true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("text2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            }
            ei = this.getDataPartEffectInfo(Text2D_1.TEXT2D_MAINPARTID, ["index"], null, false);
            renderCache.effect = engine.createEffect("text2d", ei.attributes, ei.uniforms, ["diffuseSampler"], ei.defines, null);
            return renderCache;
        };
        Text2D.prototype.createInstanceDataParts = function () {
            return [new Text2DInstanceData(Text2D_1.TEXT2D_MAINPARTID, this._charCount)];
        };
        // Looks like a hack!? Yes! Because that's what it is!
        // For the InstanceData layer to compute correctly we need to set all the properties involved, which won't be the case if there's no text
        // This method is called before the layout construction for us to detect this case, set some text and return the initial one to restore it after (there can be some text without char to display, say "\t\n" for instance)
        Text2D.prototype.beforeRefreshForLayoutConstruction = function (part) {
            if (!this._charCount) {
                var curText = this._text;
                this.text = "A";
                return curText;
            }
        };
        // if obj contains something, we restore the _text property
        Text2D.prototype.afterRefreshForLayoutConstruction = function (part, obj) {
            if (obj !== undefined) {
                this.text = obj;
            }
        };
        Text2D.prototype.getUsedShaderCategories = function (dataPart) {
            var cat = _super.prototype.getUsedShaderCategories.call(this, dataPart);
            if (this._fontSDF) {
                cat.push(Text2D_1.TEXT2D_CATEGORY_SDF);
            }
            return cat;
        };
        Text2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === Text2D_1.TEXT2D_MAINPARTID) {
                var d = part;
                var texture = this.fontTexture;
                var superSampleFactor = texture.isSuperSampled ? 0.5 : 1;
                var ts = texture.getSize();
                var offset = BABYLON.Vector2.Zero();
                var lh = this.fontTexture.lineHeight;
                d.dataElementCount = this._charCount;
                d.curElement = 0;
                var lineLengths = [];
                var charWidths = [];
                var charsPerLine = [];
                var numCharsCurrenLine = 0;
                var contentAreaWidth = this.contentArea.width;
                var contentAreaHeight = this.contentArea.height;
                var numCharsCurrentWord = 0;
                var widthCurrentWord = 0;
                var numWordsPerLine = 0;
                var text = this.text;
                var tabWidth = this._tabulationSize * texture.spaceWidth;
                // First pass: analyze the text to build data like pixel length of each lines, width of each char, number of char per line
                for (var i_1 = 0; i_1 < text.length; i_1++) {
                    var char = text[i_1];
                    numCharsCurrenLine++;
                    charWidths[i_1] = 0;
                    // Line feed
                    if (this._isWhiteSpaceCharVert(char)) {
                        lineLengths.push(offset.x);
                        charsPerLine.push(numCharsCurrenLine - 1);
                        numCharsCurrenLine = 1;
                        offset.x = 0;
                        if (widthCurrentWord > 0) {
                            numWordsPerLine++;
                        }
                        numWordsPerLine = 0;
                        numCharsCurrentWord = 0;
                        widthCurrentWord = 0;
                        continue;
                    }
                    var ci = texture.getChar(char);
                    var charWidth = 0;
                    if (char === "\t") {
                        charWidth = tabWidth;
                    }
                    else {
                        charWidth = ci.xAdvance;
                    }
                    offset.x += charWidth;
                    charWidths[i_1] = charWidth;
                    if (this._isWhiteSpaceCharHoriz(char)) {
                        if (widthCurrentWord > 0) {
                            numWordsPerLine++;
                        }
                        numCharsCurrentWord = 0;
                        widthCurrentWord = 0;
                    }
                    else {
                        widthCurrentWord += ci.xAdvance;
                        numCharsCurrentWord++;
                    }
                    if (this._wordWrap && numWordsPerLine > 0 && offset.x > contentAreaWidth) {
                        lineLengths.push(offset.x - widthCurrentWord);
                        numCharsCurrenLine -= numCharsCurrentWord;
                        var j = i_1 - numCharsCurrentWord;
                        //skip white space at the end of this line
                        while (this._isWhiteSpaceCharHoriz(text[j])) {
                            lineLengths[lineLengths.length - 1] -= charWidths[j];
                            j--;
                        }
                        charsPerLine.push(numCharsCurrenLine);
                        if (this._isWhiteSpaceCharHoriz(text[i_1])) {
                            //skip white space at the beginning of next line
                            var numSpaces = 0;
                            while (this._isWhiteSpaceCharHoriz(text[i_1 + numSpaces])) {
                                numSpaces++;
                                charWidths[i_1 + numSpaces] = 0;
                            }
                            i_1 += numSpaces - 1;
                            offset.x = 0;
                            numCharsCurrenLine = numSpaces - 1;
                        }
                        else {
                            numCharsCurrenLine = numCharsCurrentWord;
                            offset.x = widthCurrentWord;
                        }
                        numWordsPerLine = 0;
                    }
                }
                lineLengths.push(offset.x);
                charsPerLine.push(numCharsCurrenLine);
                //skip white space at the end
                var i = text.length - 1;
                while (this._isWhiteSpaceCharHoriz(text[i])) {
                    lineLengths[lineLengths.length - 1] -= charWidths[i];
                    i--;
                }
                var charNum = 0;
                var maxLineLen = 0;
                var alignH = this.textAlignmentH;
                var alignV = this.textAlignmentV;
                offset.x = 0;
                if (alignH == Text2D_1.AlignRight || alignH == Text2D_1.AlignCenter) {
                    for (var i_2 = 0; i_2 < lineLengths.length; i_2++) {
                        if (lineLengths[i_2] > maxLineLen) {
                            maxLineLen = lineLengths[i_2];
                        }
                    }
                }
                var textHeight = lineLengths.length * lh;
                var offsetX = this.padding.leftPixels;
                if (alignH == Text2D_1.AlignRight) {
                    offsetX += contentAreaWidth - maxLineLen;
                }
                else if (alignH == Text2D_1.AlignCenter) {
                    offsetX += (contentAreaWidth - maxLineLen) * .5;
                }
                offset.x += offsetX;
                offset.y += contentAreaHeight + textHeight - lh;
                offset.y += this.padding.bottomPixels;
                if (alignV == Text2D_1.AlignBottom) {
                    offset.y -= contentAreaHeight;
                }
                else if (alignV == Text2D_1.AlignCenter) {
                    offset.y -= (contentAreaHeight - textHeight) * .5 + lineLengths.length * lh;
                }
                else {
                    offset.y -= lineLengths.length * lh;
                }
                var lineHeight = texture.lineHeight;
                for (var i_3 = 0; i_3 < lineLengths.length; i_3++) {
                    var numChars = charsPerLine[i_3];
                    var lineLength = lineLengths[i_3];
                    if (alignH == Text2D_1.AlignRight) {
                        offset.x += maxLineLen - lineLength;
                    }
                    else if (alignH == Text2D_1.AlignCenter) {
                        offset.x += (maxLineLen - lineLength) * .5;
                    }
                    for (var j = 0; j < numChars; j++) {
                        var char = text[charNum];
                        var charWidth = charWidths[charNum];
                        if (char !== "\t" && !this._isWhiteSpaceCharVert(char)) {
                            //make sure space char gets processed here or overlapping can occur when text is set
                            var ci = texture.getChar(char);
                            this.updateInstanceDataPart(d, new BABYLON.Vector2(offset.x + ci.xOffset, offset.y + ci.yOffset));
                            d.topLeftUV = ci.topLeftUV;
                            var suv = ci.bottomRightUV.subtract(ci.topLeftUV);
                            d.sizeUV = suv;
                            d.textureSize = new BABYLON.Vector2(ts.width, ts.height);
                            d.color = this.defaultFontColor;
                            d.superSampleFactor = superSampleFactor;
                            ++d.curElement;
                        }
                        offset.x += charWidth;
                        charNum++;
                    }
                    offset.x = offsetX;
                    offset.y -= lineHeight;
                }
            }
            return true;
        };
        Text2D.prototype._isWhiteSpaceCharHoriz = function (char) {
            if (char === " " || char === "\t") {
                return true;
            }
        };
        Text2D.prototype._isWhiteSpaceCharVert = function (char) {
            if (char === "\n" || char === "\r") {
                return true;
            }
        };
        Text2D.prototype._updateCharCount = function () {
            var count = 0;
            for (var _i = 0, _a = this._text; _i < _a.length; _i++) {
                var char = _a[_i];
                if (char === "\r" || char === "\n" || char === "\t" || char < " ") {
                    continue;
                }
                ++count;
            }
            this._charCount = count;
        };
        Text2D.prototype._setTextAlignmentfromString = function (value) {
            var m = value.trim().split(",");
            for (var _i = 0, m_1 = m; _i < m_1.length; _i++) {
                var v = m_1[_i];
                v = v.toLocaleLowerCase().trim();
                // Horizontal
                var i = v.indexOf("h:");
                if (i === -1) {
                    i = v.indexOf("horizontal:");
                }
                if (i !== -1) {
                    v = v.substr(v.indexOf(":") + 1);
                    this._setTextAlignmentHorizontal(v);
                    continue;
                }
                // Vertical
                i = v.indexOf("v:");
                if (i === -1) {
                    i = v.indexOf("vertical:");
                }
                if (i !== -1) {
                    v = v.substr(v.indexOf(":") + 1);
                    this._setTextAlignmentVertical(v);
                    continue;
                }
            }
        };
        Text2D.prototype._setTextAlignmentHorizontal = function (text) {
            var v = text.trim().toLocaleLowerCase();
            switch (v) {
                case "left":
                    this.textAlignmentH = Text2D_1.AlignLeft;
                    return;
                case "right":
                    this.textAlignmentH = Text2D_1.AlignRight;
                    return;
                case "center":
                    this.textAlignmentH = Text2D_1.AlignCenter;
                    return;
            }
        };
        Text2D.prototype._setTextAlignmentVertical = function (text) {
            var v = text.trim().toLocaleLowerCase();
            switch (v) {
                case "top":
                    this.textAlignmentV = Text2D_1.AlignTop;
                    return;
                case "bottom":
                    this.textAlignmentV = Text2D_1.AlignBottom;
                    return;
                case "center":
                    this.textAlignmentV = Text2D_1.AlignCenter;
                    return;
            }
        };
        Text2D.prototype._useTextureAlpha = function () {
            return this._fontSDF;
        };
        Text2D.prototype._shouldUseAlphaFromTexture = function () {
            return !this._fontSDF;
        };
        return Text2D;
    }(BABYLON.RenderablePrim2D));
    Text2D.TEXT2D_MAINPARTID = 1;
    Text2D.TEXT2D_CATEGORY_SDF = "SignedDistanceField";
    Text2D._AlignLeft = 1;
    Text2D._AlignTop = 1; // Same as left
    Text2D._AlignRight = 2;
    Text2D._AlignBottom = 2; // Same as right
    Text2D._AlignCenter = 3;
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, function (pi) { return Text2D_1.fontProperty = pi; }, false, true)
    ], Text2D.prototype, "fontName", null);
    __decorate([
        BABYLON.dynamicLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 2, function (pi) { return Text2D_1.defaultFontColorProperty = pi; })
    ], Text2D.prototype, "defaultFontColor", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 3, function (pi) { return Text2D_1.textProperty = pi; }, false, true)
    ], Text2D.prototype, "text", null);
    __decorate([
        BABYLON.instanceLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 4, function (pi) { return Text2D_1.sizeProperty = pi; })
    ], Text2D.prototype, "size", null);
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 5, function (pi) { return Text2D_1.fontSuperSampleProperty = pi; }, false, false)
    ], Text2D.prototype, "fontSuperSample", null);
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 6, function (pi) { return Text2D_1.fontSuperSampleProperty = pi; }, false, false)
    ], Text2D.prototype, "fontSignedDistanceField", null);
    Text2D = Text2D_1 = __decorate([
        BABYLON.className("Text2D", "BABYLON")
    ], Text2D);
    BABYLON.Text2D = Text2D;
    var Text2D_1;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Lines2DRenderCache = (function (_super) {
        __extends(Lines2DRenderCache, _super);
        function Lines2DRenderCache(engine, modelKey) {
            var _this = _super.call(this, engine, modelKey) || this;
            _this.effectsReady = false;
            _this.fillVB = null;
            _this.fillIB = null;
            _this.fillIndicesCount = 0;
            _this.instancingFillAttributes = null;
            _this.effectFill = null;
            _this.effectFillInstanced = null;
            _this.borderVB = null;
            _this.borderIB = null;
            _this.borderIndicesCount = 0;
            _this.instancingBorderAttributes = null;
            _this.effectBorder = null;
            _this.effectBorderInstanced = null;
            return _this;
        }
        Lines2DRenderCache.prototype.render = function (instanceInfo, context) {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effectFill && (!this.effectFill.isReady() || (this.effectFillInstanced && !this.effectFillInstanced.isReady()))) ||
                    (this.effectBorder && (!this.effectBorder.isReady() || (this.effectBorderInstanced && !this.effectBorderInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }
            var canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;
            engine.setState(false, undefined, true);
            var depthFunction = 0;
            if (this.effectFill && this.effectBorder) {
                depthFunction = engine.getDepthFunction();
                engine.setDepthFunctionToLessOrEqual();
            }
            var curAlphaMode = engine.getAlphaMode();
            if (this.effectFill) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_FILLPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectFillInstanced : this.effectFill;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [2], 2 * 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingFillAttributes) {
                        this.instancingFillAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_FILLPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.fillIndicesCount);
                    }
                }
            }
            if (this.effectBorder) {
                var partIndex = instanceInfo.partIndexFromId.get(BABYLON.Shape2D.SHAPE2D_BORDERPARTID.toString());
                var pid = context.groupInfoPartData[partIndex];
                if (context.renderMode !== BABYLON.Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE, true);
                }
                var effect = context.useInstancing ? this.effectBorderInstanced : this.effectBorder;
                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [2], 2 * 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, effect);
                    }
                    var glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    var count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unbindInstanceAttributes();
                }
                else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (var i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.borderIndicesCount);
                    }
                }
            }
            engine.setAlphaMode(curAlphaMode, true);
            if (this.effectFill && this.effectBorder) {
                engine.setDepthFunction(depthFunction);
            }
            return true;
        };
        Lines2DRenderCache.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this.fillVB) {
                this._engine._releaseBuffer(this.fillVB);
                this.fillVB = null;
            }
            if (this.fillIB) {
                this._engine._releaseBuffer(this.fillIB);
                this.fillIB = null;
            }
            this.effectFill = null;
            this.effectFillInstanced = null;
            this.effectBorder = null;
            this.effectBorderInstanced = null;
            if (this.borderVB) {
                this._engine._releaseBuffer(this.borderVB);
                this.borderVB = null;
            }
            if (this.borderIB) {
                this._engine._releaseBuffer(this.borderIB);
                this.borderIB = null;
            }
            return true;
        };
        return Lines2DRenderCache;
    }(BABYLON.ModelRenderCache));
    BABYLON.Lines2DRenderCache = Lines2DRenderCache;
    var Lines2DInstanceData = (function (_super) {
        __extends(Lines2DInstanceData, _super);
        function Lines2DInstanceData(partId) {
            return _super.call(this, partId, 1) || this;
        }
        Object.defineProperty(Lines2DInstanceData.prototype, "boundingMin", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2DInstanceData.prototype, "boundingMax", {
            get: function () {
                return null;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        return Lines2DInstanceData;
    }(BABYLON.Shape2DInstanceData));
    __decorate([
        BABYLON.instanceData(BABYLON.Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
    ], Lines2DInstanceData.prototype, "boundingMin", null);
    __decorate([
        BABYLON.instanceData(BABYLON.Shape2D.SHAPE2D_CATEGORY_FILLGRADIENT)
    ], Lines2DInstanceData.prototype, "boundingMax", null);
    BABYLON.Lines2DInstanceData = Lines2DInstanceData;
    var Lines2D = Lines2D_1 = (function (_super) {
        __extends(Lines2D, _super);
        /**
         * Create an 2D Lines Shape primitive. The defined lines may be opened or closed (see below)
         * @param points an array that describe the points to use to draw the line, must contain at least two entries.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - fillThickness: the thickness of the fill part of the line, can be null to draw nothing (but a border brush must be given), default is 1.
         * - closed: if false the lines are said to be opened, the first point and the latest DON'T connect. if true the lines are said to be closed, the first and last point will be connected by a line. For instance you can define the 4 points of a rectangle, if you set closed to true a 4 edges rectangle will be drawn. If you set false, only three edges will be drawn, the edge formed by the first and last point won't exist. Default is false.
         * - startCap: Draw a cap of the given type at the start of the first line, you can't define a Cap if the Lines2D is closed. Default is Lines2D.NoCap.
         * - endCap: Draw a cap of the given type at the end of the last line, you can't define a Cap if the Lines2D is closed. Default is Lines2D.NoCap.
         * - fill: the brush used to draw the fill content of the lines, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the lines, you can set null to draw nothing (but you will have to set a fill brush), default is null. can be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the primitive must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function Lines2D(points, settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _this = _super.call(this, settings) || this;
            _this._fillVB = null;
            _this._fillIB = null;
            _this._borderVB = null;
            _this._borderIB = null;
            _this._size = BABYLON.Size.Zero();
            _this._boundingMin = null;
            _this._boundingMax = null;
            var fillThickness = (settings.fillThickness == null) ? 1 : settings.fillThickness;
            var startCap = (settings.startCap == null) ? 0 : settings.startCap;
            var endCap = (settings.endCap == null) ? 0 : settings.endCap;
            var closed = (settings.closed == null) ? false : settings.closed;
            _this.points = points;
            _this.fillThickness = fillThickness;
            _this.startCap = startCap;
            _this.endCap = endCap;
            _this.closed = closed;
            return _this;
        }
        Object.defineProperty(Lines2D, "NoCap", {
            /**
             * No Cap to apply on the extremity
             */
            get: function () { return Lines2D_1._noCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "RoundCap", {
            /**
             * A round cap, will use the line thickness as diameter
             */
            get: function () { return Lines2D_1._roundCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "TriangleCap", {
            /**
             * Creates a triangle at the extremity.
             */
            get: function () { return Lines2D_1._triangleCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "SquareAnchorCap", {
            /**
             * Creates a Square anchor at the extremity, the square size is twice the thickness of the line
             */
            get: function () { return Lines2D_1._squareAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "RoundAnchorCap", {
            /**
             * Creates a round anchor at the extremity, the diameter is twice the thickness of the line
             */
            get: function () { return Lines2D_1._roundAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "DiamondAnchorCap", {
            /**
             * Creates a diamond anchor at the extremity.
             */
            get: function () { return Lines2D_1._diamondAnchorCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D, "ArrowCap", {
            /**
             * Creates an arrow anchor at the extremity. the arrow base size is twice the thickness of the line
             */
            get: function () { return Lines2D_1._arrowCap; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "points", {
            get: function () {
                return this._points;
            },
            set: function (value) {
                this._points = value;
                this._primTriArrayDirty = true;
                this._boundingBoxDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "fillThickness", {
            get: function () {
                return this._fillThickness;
            },
            set: function (value) {
                this._fillThickness = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "closed", {
            get: function () {
                return this._closed;
            },
            set: function (value) {
                this._closed = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "startCap", {
            get: function () {
                return this._startCap;
            },
            set: function (value) {
                this._startCap = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "endCap", {
            get: function () {
                return this._endCap;
            },
            set: function (value) {
                this._endCap = value;
            },
            enumerable: true,
            configurable: true
        });
        Lines2D.prototype.levelIntersect = function (intersectInfo) {
            var p = intersectInfo._localPickPosition;
            this.updateTriArray();
            return this._primTriArray.doesContain(p);
        };
        Object.defineProperty(Lines2D.prototype, "boundingMin", {
            get: function () {
                if (!this._boundingMin) {
                    this._computeLines2D();
                }
                return this._boundingMin;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lines2D.prototype, "boundingMax", {
            get: function () {
                if (!this._boundingMax) {
                    this._computeLines2D();
                }
                return this._boundingMax;
            },
            enumerable: true,
            configurable: true
        });
        Lines2D.prototype.getUsedShaderCategories = function (dataPart) {
            var res = _super.prototype.getUsedShaderCategories.call(this, dataPart);
            // Remove the BORDER category, we don't use it in the VertexShader
            var i = res.indexOf(BABYLON.Shape2D.SHAPE2D_CATEGORY_BORDER);
            if (i !== -1) {
                res.splice(i, 1);
            }
            return res;
        };
        Lines2D.prototype.updateLevelBoundingInfo = function () {
            if (!this._size) {
                return false;
            }
            if (!this._boundingMin) {
                this._computeLines2D();
            }
            BABYLON.BoundingInfo2D.CreateFromMinMaxToRef(this._boundingMin.x, this._boundingMax.x, this._boundingMin.y, this._boundingMax.y, this._levelBoundingInfo);
            return true;
        };
        Lines2D.prototype.createModelRenderCache = function (modelKey) {
            var renderCache = new Lines2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        };
        ///////////////////////////////////////////////////////////////////////////////////
        // Methods for Lines building
        Lines2D.prototype._perp = function (v, res) {
            res.x = v.y;
            res.y = -v.x;
        };
        ;
        Lines2D.prototype._direction = function (a, b, res) {
            a.subtractToRef(b, res);
            res.normalize();
        };
        Lines2D.prototype._computeMiter = function (tangent, miter, a, b) {
            a.addToRef(b, tangent);
            tangent.normalize();
            miter.x = -tangent.y;
            miter.y = tangent.x;
            Lines2D_1._miterTps.x = -a.y;
            Lines2D_1._miterTps.y = a.x;
            return 1 / BABYLON.Vector2.Dot(miter, Lines2D_1._miterTps);
        };
        Lines2D.prototype._intersect = function (x1, y1, x2, y2, x3, y3, x4, y4) {
            var d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (d === 0)
                return false;
            var xi = ((x3 - x4) * (x1 * y2 - y1 * x2) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d; // Intersection point is xi/yi, just in case...
            //let yi = ((y3 - y4) * (x1 * y2 - y1 * x2) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d; // That's why I left it commented
            if (xi < Math.min(x1, x2) || xi > Math.max(x1, x2))
                return false;
            if (xi < Math.min(x3, x4) || xi > Math.max(x3, x4))
                return false;
            return true;
        };
        Lines2D.prototype._updateMinMax = function (array, offset) {
            if (offset >= array.length) {
                return;
            }
            this._boundingMin.x = Math.min(this._boundingMin.x, array[offset]);
            this._boundingMax.x = Math.max(this._boundingMax.x, array[offset]);
            this._boundingMin.y = Math.min(this._boundingMin.y, array[offset + 1]);
            this._boundingMax.y = Math.max(this._boundingMax.y, array[offset + 1]);
        };
        Lines2D.prototype._store = function (array, contour, index, max, p, n, halfThickness, borderThickness, detectFlip) {
            var borderMode = borderThickness != null && !isNaN(borderThickness);
            var off = index * (borderMode ? 8 : 4);
            // Mandatory because we'll be out of bound in case of closed line, for the very last point (which is a duplicate of the first that we don't store in the vb)
            if (off >= array.length) {
                return;
            }
            // Store start/end normal, we need it for the cap construction
            if (index === 0) {
                this._perp(n, Lines2D_1._startDir);
            }
            else if (index === max - 1) {
                this._perp(n, Lines2D_1._endDir);
                Lines2D_1._endDir.x *= -1;
                Lines2D_1._endDir.y *= -1;
            }
            var swap = false;
            array[off + 0] = p.x + n.x * halfThickness;
            array[off + 1] = p.y + n.y * halfThickness;
            array[off + 2] = p.x + n.x * -halfThickness;
            array[off + 3] = p.y + n.y * -halfThickness;
            this._updateMinMax(array, off);
            this._updateMinMax(array, off + 2);
            // If an index is given we check if the two segments formed between [index+0;detectFlip+0] and [index+2;detectFlip+2] intersect themselves.
            // It should not be the case, they should be parallel, so if they cross, we switch the order of storage to ensure we'll have parallel lines
            if (detectFlip != 0) {
                // Flip if intersect
                var flipOff = detectFlip * (borderMode ? 8 : 4);
                if (this._intersect(array[off + 0], array[off + 1], array[flipOff + 0], array[flipOff + 1], array[off + 2], array[off + 3], array[flipOff + 2], array[flipOff + 3])) {
                    swap = true;
                    var tps = array[off + 0];
                    array[off + 0] = array[off + 2];
                    array[off + 2] = tps;
                    tps = array[off + 1];
                    array[off + 1] = array[off + 3];
                    array[off + 3] = tps;
                }
            }
            if (borderMode) {
                var t = halfThickness + borderThickness;
                array[off + 4] = p.x + n.x * (swap ? -t : t);
                array[off + 5] = p.y + n.y * (swap ? -t : t);
                array[off + 6] = p.x + n.x * (swap ? t : -t);
                array[off + 7] = p.y + n.y * (swap ? t : -t);
                this._updateMinMax(array, off + 4);
                this._updateMinMax(array, off + 6);
            }
            if (contour) {
                off += borderMode ? 4 : 0;
                contour.push(new BABYLON.Vector2(array[off + 0], array[off + 1]));
                contour.push(new BABYLON.Vector2(array[off + 2], array[off + 3]));
            }
        };
        Lines2D.prototype._getCapSize = function (type, border) {
            if (border === void 0) { border = false; }
            var sd = Lines2D_1._roundCapSubDiv;
            // If no array given, we call this to get the size
            var vbsize = 0, ibsize = 0;
            switch (type) {
                case Lines2D_1.NoCap:
                    {
                        // If the line is not close and we're computing border, we add the size to generate the edge border
                        if (!this.closed && border) {
                            vbsize = 4;
                            ibsize = 6;
                        }
                        else {
                            vbsize = ibsize = 0;
                        }
                        break;
                    }
                case Lines2D_1.RoundCap:
                    {
                        if (border) {
                            vbsize = sd;
                            ibsize = (sd - 2) * 3;
                        }
                        else {
                            vbsize = (sd / 2) + 1;
                            ibsize = (sd / 2) * 3;
                        }
                        break;
                    }
                case Lines2D_1.ArrowCap:
                    {
                        if (border) {
                            vbsize = 12;
                            ibsize = 24;
                        }
                        else {
                            vbsize = 3;
                            ibsize = 3;
                        }
                        break;
                    }
                case Lines2D_1.TriangleCap:
                    {
                        if (border) {
                            vbsize = 6;
                            ibsize = 12;
                        }
                        else {
                            vbsize = 3;
                            ibsize = 3;
                        }
                        break;
                    }
                case Lines2D_1.DiamondAnchorCap:
                    {
                        if (border) {
                            vbsize = 10;
                            ibsize = 24;
                        }
                        else {
                            vbsize = 5;
                            ibsize = 9;
                        }
                        break;
                    }
                case Lines2D_1.SquareAnchorCap:
                    {
                        if (border) {
                            vbsize = 12;
                            ibsize = 30;
                        }
                        else {
                            vbsize = 4;
                            ibsize = 6;
                        }
                        break;
                    }
                case Lines2D_1.RoundAnchorCap:
                    {
                        if (border) {
                            vbsize = sd * 2;
                            ibsize = (sd - 1) * 6;
                        }
                        else {
                            vbsize = sd + 1;
                            ibsize = (sd + 1) * 3;
                        }
                        break;
                    }
            }
            return { vbsize: vbsize * 2, ibsize: ibsize };
        };
        Lines2D.prototype._storeVertex = function (vb, baseOffset, index, basePos, rotation, vertex, contour) {
            var c = Math.cos(rotation);
            var s = Math.sin(rotation);
            Lines2D_1._tpsV.x = (c * vertex.x) + (-s * vertex.y) + basePos.x;
            Lines2D_1._tpsV.y = (s * vertex.x) + (c * vertex.y) + basePos.y;
            var offset = baseOffset + (index * 2);
            vb[offset + 0] = Lines2D_1._tpsV.x;
            vb[offset + 1] = Lines2D_1._tpsV.y;
            if (contour) {
                contour.push(Lines2D_1._tpsV.x);
                contour.push(Lines2D_1._tpsV.y);
            }
            this._updateMinMax(vb, offset);
            return (baseOffset + index * 2) / 2;
        };
        Lines2D.prototype._storeIndex = function (ib, baseOffset, index, vertexIndex) {
            ib[baseOffset + index] = vertexIndex;
        };
        Lines2D.prototype._buildCap = function (vb, vbi, ib, ibi, pos, thickness, borderThickness, type, capDir, contour) {
            // Compute the transformation from the direction of the cap to build relative to our default orientation [1;0] (our cap are by default pointing toward right, horizontal
            var sd = Lines2D_1._roundCapSubDiv;
            var dir = new BABYLON.Vector2(1, 0);
            var angle = Math.atan2(capDir.y, capDir.x) - Math.atan2(dir.y, dir.x);
            var ht = thickness / 2;
            var t = thickness;
            var borderMode = borderThickness != null;
            var bt = borderThickness;
            switch (type) {
                case Lines2D_1.NoCap:
                    if (borderMode && !this.closed) {
                        var vi = 0;
                        var ii = 0;
                        var v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht + bt), contour);
                        var v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(bt, ht + bt), contour);
                        var v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(bt, -(ht + bt)), contour);
                        var v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -(ht + bt)), contour);
                        this._storeIndex(ib, ibi, ii++, v1);
                        this._storeIndex(ib, ibi, ii++, v2);
                        this._storeIndex(ib, ibi, ii++, v3);
                        this._storeIndex(ib, ibi, ii++, v1);
                        this._storeIndex(ib, ibi, ii++, v3);
                        this._storeIndex(ib, ibi, ii++, v4);
                    }
                    break;
                case Lines2D_1.ArrowCap:
                    ht *= 2;
                case Lines2D_1.TriangleCap:
                    {
                        if (borderMode) {
                            var f = type === Lines2D_1.TriangleCap ? bt : Math.sqrt(bt * bt * 2);
                            var v1 = this._storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, ht), null);
                            var v2 = this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(ht, 0), null);
                            var v3 = this._storeVertex(vb, vbi, 2, pos, angle, new BABYLON.Vector2(0, -ht), null);
                            var v4 = this._storeVertex(vb, vbi, 3, pos, angle, new BABYLON.Vector2(0, ht + f), contour);
                            var v5 = this._storeVertex(vb, vbi, 4, pos, angle, new BABYLON.Vector2(ht + f, 0), contour);
                            var v6 = this._storeVertex(vb, vbi, 5, pos, angle, new BABYLON.Vector2(0, -(ht + f)), contour);
                            var ii = 0;
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v5);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v5);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v5);
                            if (type === Lines2D_1.ArrowCap) {
                                var rht = thickness / 2;
                                var v10 = this._storeVertex(vb, vbi, 9, pos, angle, new BABYLON.Vector2(0, -(rht + bt)), null);
                                var v12 = this._storeVertex(vb, vbi, 11, pos, angle, new BABYLON.Vector2(-bt, -(ht + f)), contour);
                                var v11 = this._storeVertex(vb, vbi, 10, pos, angle, new BABYLON.Vector2(-bt, -(rht + bt)), contour);
                                var v7 = this._storeVertex(vb, vbi, 6, pos, angle, new BABYLON.Vector2(0, rht + bt), null);
                                var v8 = this._storeVertex(vb, vbi, 7, pos, angle, new BABYLON.Vector2(-bt, rht + bt), contour);
                                var v9 = this._storeVertex(vb, vbi, 8, pos, angle, new BABYLON.Vector2(-bt, ht + f), contour);
                                this._storeIndex(ib, ibi, ii++, v7);
                                this._storeIndex(ib, ibi, ii++, v8);
                                this._storeIndex(ib, ibi, ii++, v9);
                                this._storeIndex(ib, ibi, ii++, v7);
                                this._storeIndex(ib, ibi, ii++, v9);
                                this._storeIndex(ib, ibi, ii++, v4);
                                this._storeIndex(ib, ibi, ii++, v10);
                                this._storeIndex(ib, ibi, ii++, v12);
                                this._storeIndex(ib, ibi, ii++, v11);
                                this._storeIndex(ib, ibi, ii++, v10);
                                this._storeIndex(ib, ibi, ii++, v6);
                                this._storeIndex(ib, ibi, ii++, v12);
                            }
                        }
                        else {
                            var v1 = this._storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, ht), contour);
                            var v2 = this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(ht, 0), contour);
                            var v3 = this._storeVertex(vb, vbi, 2, pos, angle, new BABYLON.Vector2(0, -ht), contour);
                            this._storeIndex(ib, ibi, 0, v1);
                            this._storeIndex(ib, ibi, 1, v2);
                            this._storeIndex(ib, ibi, 2, v3);
                        }
                        break;
                    }
                case Lines2D_1.RoundCap:
                    {
                        if (borderMode) {
                            var curA = -Math.PI / 2;
                            var incA = Math.PI / (sd / 2 - 1);
                            var ii = 0;
                            for (var i = 0; i < (sd / 2); i++) {
                                var v1 = this._storeVertex(vb, vbi, i * 2 + 0, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), null);
                                var v2 = this._storeVertex(vb, vbi, i * 2 + 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * (ht + bt), Math.sin(curA) * (ht + bt)), contour);
                                if (i > 0) {
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1);
                                }
                                curA += incA;
                            }
                        }
                        else {
                            var c = this._storeVertex(vb, vbi, 0, pos, angle, new BABYLON.Vector2(0, 0), null);
                            var curA = -Math.PI / 2;
                            var incA = Math.PI / (sd / 2 - 1);
                            this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), null);
                            curA += incA;
                            for (var i = 1; i < (sd / 2); i++) {
                                var v2 = this._storeVertex(vb, vbi, i + 1, pos, angle, new BABYLON.Vector2(Math.cos(curA) * ht, Math.sin(curA) * ht), contour);
                                this._storeIndex(ib, ibi, i * 3 + 0, c);
                                this._storeIndex(ib, ibi, i * 3 + 1, v2 - 1);
                                this._storeIndex(ib, ibi, i * 3 + 2, v2);
                                curA += incA;
                            }
                        }
                        break;
                    }
                case Lines2D_1.SquareAnchorCap:
                    {
                        var vi = 0;
                        var c = borderMode ? null : contour;
                        var v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, t), c);
                        var v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2, t), c);
                        var v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2, -t), c);
                        var v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -t), c);
                        if (borderMode) {
                            var v5 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht + bt), null);
                            var v6 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, ht + bt), contour);
                            var v7 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, t + bt), contour);
                            var v8 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2 + bt, t + bt), contour);
                            var v9 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(t * 2 + bt, -(t + bt)), contour);
                            var v10 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, -(t + bt)), contour);
                            var v11 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-bt, -(ht + bt)), contour);
                            var v12 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -(ht + bt)), null);
                            var ii = 0;
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v5);
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v11);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v11);
                            this._storeIndex(ib, ibi, ii++, v12);
                            this._storeIndex(ib, ibi, ii++, v4);
                        }
                        else {
                            this._storeIndex(ib, ibi, 0, v1);
                            this._storeIndex(ib, ibi, 1, v2);
                            this._storeIndex(ib, ibi, 2, v3);
                            this._storeIndex(ib, ibi, 3, v1);
                            this._storeIndex(ib, ibi, 4, v3);
                            this._storeIndex(ib, ibi, 5, v4);
                        }
                        break;
                    }
                case Lines2D_1.RoundAnchorCap:
                    {
                        var cpos = Math.sqrt(t * t - ht * ht);
                        var center = new BABYLON.Vector2(cpos, 0);
                        var curA = BABYLON.Tools.ToRadians(-150);
                        var incA = BABYLON.Tools.ToRadians(300) / (sd - 1);
                        if (borderMode) {
                            var ii = 0;
                            for (var i = 0; i < sd; i++) {
                                var v1 = this._storeVertex(vb, vbi, i * 2 + 0, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), null);
                                var v2 = this._storeVertex(vb, vbi, i * 2 + 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * (t + bt), Math.sin(curA) * (t + bt)), contour);
                                if (i > 0) {
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1 - 2);
                                    this._storeIndex(ib, ibi, ii++, v2);
                                    this._storeIndex(ib, ibi, ii++, v1);
                                }
                                curA += incA;
                            }
                        }
                        else {
                            var c = this._storeVertex(vb, vbi, 0, pos, angle, center, null);
                            this._storeVertex(vb, vbi, 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), null);
                            curA += incA;
                            for (var i = 1; i < sd; i++) {
                                var v2 = this._storeVertex(vb, vbi, i + 1, pos, angle, new BABYLON.Vector2(cpos + Math.cos(curA) * t, Math.sin(curA) * t), contour);
                                this._storeIndex(ib, ibi, i * 3 + 0, c);
                                this._storeIndex(ib, ibi, i * 3 + 1, v2 - 1);
                                this._storeIndex(ib, ibi, i * 3 + 2, v2);
                                curA += incA;
                            }
                            this._storeIndex(ib, ibi, sd * 3 + 0, c);
                            this._storeIndex(ib, ibi, sd * 3 + 1, c + 1);
                            this._storeIndex(ib, ibi, sd * 3 + 2, c + sd);
                        }
                        break;
                    }
                case Lines2D_1.DiamondAnchorCap:
                    {
                        var vi = 0;
                        var c = borderMode ? null : contour;
                        var v1 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, ht), c);
                        var v2 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, t), c);
                        var v3 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht * 3, 0), c);
                        var v4 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, -t), c);
                        var v5 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(0, -ht), c);
                        if (borderMode) {
                            var f = Math.sqrt(bt * bt * 2);
                            var v6 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-f, ht), contour);
                            var v7 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, t + f), contour);
                            var v8 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht * 3 + f, 0), contour);
                            var v9 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(ht, -(t + f)), contour);
                            var v10 = this._storeVertex(vb, vbi, vi++, pos, angle, new BABYLON.Vector2(-f, -ht), contour);
                            var ii = 0;
                            this._storeIndex(ib, ibi, ii++, v6);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v1);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v7);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v2);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v8);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v3);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v9);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v4);
                            this._storeIndex(ib, ibi, ii++, v10);
                            this._storeIndex(ib, ibi, ii++, v5);
                        }
                        else {
                            this._storeIndex(ib, ibi, 0, v1);
                            this._storeIndex(ib, ibi, 1, v2);
                            this._storeIndex(ib, ibi, 2, v3);
                            this._storeIndex(ib, ibi, 3, v1);
                            this._storeIndex(ib, ibi, 4, v3);
                            this._storeIndex(ib, ibi, 5, v5);
                            this._storeIndex(ib, ibi, 6, v5);
                            this._storeIndex(ib, ibi, 7, v3);
                            this._storeIndex(ib, ibi, 8, v4);
                        }
                        break;
                    }
            }
            return null;
        };
        Lines2D.prototype._buildLine = function (vb, contour, ht, bt) {
            var lineA = BABYLON.Vector2.Zero();
            var lineB = BABYLON.Vector2.Zero();
            var tangent = BABYLON.Vector2.Zero();
            var miter = BABYLON.Vector2.Zero();
            var curNormal = null;
            if (this.closed) {
                this.points.push(this.points[0]);
            }
            var total = this.points.length;
            for (var i = 1; i < total; i++) {
                var last = this.points[i - 1];
                var cur = this.points[i];
                var next = (i < (this.points.length - 1)) ? this.points[i + 1] : null;
                this._direction(cur, last, lineA);
                if (!curNormal) {
                    curNormal = BABYLON.Vector2.Zero();
                    this._perp(lineA, curNormal);
                }
                if (i === 1) {
                    this._store(vb, contour, 0, total, this.points[0], curNormal, ht, bt);
                }
                if (!next) {
                    this._perp(lineA, curNormal);
                    this._store(vb, contour, i, total, this.points[i], curNormal, ht, bt, i - 1);
                }
                else {
                    this._direction(next, cur, lineB);
                    var miterLen = this._computeMiter(tangent, miter, lineA, lineB);
                    this._store(vb, contour, i, total, this.points[i], miter, miterLen * ht, miterLen * bt, i - 1);
                }
            }
            if (this.points.length > 2 && this.closed) {
                var last2 = this.points[total - 2];
                var cur2 = this.points[0];
                var next2 = this.points[1];
                this._direction(cur2, last2, lineA);
                this._direction(next2, cur2, lineB);
                this._perp(lineA, curNormal);
                var miterLen2 = this._computeMiter(tangent, miter, lineA, lineB);
                this._store(vb, null, 0, total, this.points[0], miter, miterLen2 * ht, miterLen2 * bt, 1);
                // Patch contour
                if (contour) {
                    var off = (bt == null) ? 0 : 4;
                    contour[0].x = vb[off + 0];
                    contour[0].y = vb[off + 1];
                    contour[1].x = vb[off + 2];
                    contour[1].y = vb[off + 3];
                }
            }
            // Remove the point we added at the beginning
            if (this.closed) {
                this.points.splice(total - 1);
            }
        };
        // Methods for Lines building
        ///////////////////////////////////////////////////////////////////////////////////
        Lines2D.prototype.setupModelRenderCache = function (modelRenderCache) {
            var renderCache = modelRenderCache;
            var engine = this.owner.engine;
            if (this._fillVB === null) {
                this._computeLines2D();
            }
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                renderCache.fillVB = engine.createVertexBuffer(this._fillVB);
                renderCache.fillIB = engine.createIndexBuffer(this._fillIB);
                renderCache.fillIndicesCount = this._fillIB.length;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["position"], null, true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect("lines2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_FILLPARTID, ["position"], null, false);
                renderCache.effectFill = engine.createEffect("lines2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            // Need to create WebGL resources for border part?
            if (this.border) {
                renderCache.borderVB = engine.createVertexBuffer(this._borderVB);
                renderCache.borderIB = engine.createIndexBuffer(this._borderIB);
                renderCache.borderIndicesCount = this._borderIB.length;
                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                var ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["position"], null, true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
                }
                // Get the non instanced version
                ei = this.getDataPartEffectInfo(BABYLON.Shape2D.SHAPE2D_BORDERPARTID, ["position"], null, false);
                renderCache.effectBorder = engine.createEffect({ vertex: "lines2d", fragment: "lines2d" }, ei.attributes, ei.uniforms, [], ei.defines, null);
            }
            this._fillVB = null;
            this._fillIB = null;
            this._borderVB = null;
            this._borderIB = null;
            return renderCache;
        };
        Lines2D.prototype.updateTriArray = function () {
            if (this._primTriArrayDirty) {
                this._computeLines2D();
            }
        };
        Lines2D.prototype._computeLines2D = function () {
            var _this = this;
            // Init min/max because their being computed here
            this._boundingMin = new BABYLON.Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
            this._boundingMax = new BABYLON.Vector2(Number.MIN_VALUE, Number.MIN_VALUE);
            var contour = new Array();
            var startCapContour = new Array();
            var endCapContour = new Array();
            // Need to create WebGL resources for fill part?
            if (this.fill) {
                var startCapInfo = this._getCapSize(this.startCap);
                var endCapInfo = this._getCapSize(this.endCap);
                var count = this.points.length;
                var vbSize = (count * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                this._fillVB = new Float32Array(vbSize);
                var vb = this._fillVB;
                var ht = this.fillThickness / 2;
                var total = this.points.length;
                this._buildLine(vb, this.border ? null : contour, ht);
                var max = total * 2;
                var triCount = (count - (this.closed ? 0 : 1)) * 2;
                this._fillIB = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
                var ib = this._fillIB;
                for (var i = 0; i < triCount; i += 2) {
                    ib[i * 3 + 0] = i + 0;
                    ib[i * 3 + 1] = i + 1;
                    ib[i * 3 + 2] = (i + 2) % max;
                    ib[i * 3 + 3] = i + 1;
                    ib[i * 3 + 4] = (i + 3) % max;
                    ib[i * 3 + 5] = (i + 2) % max;
                }
                this._buildCap(vb, count * 2 * 2, ib, triCount * 3, this.points[0], this.fillThickness, null, this.startCap, Lines2D_1._startDir, this.border ? null : startCapContour);
                this._buildCap(vb, (count * 2 * 2) + startCapInfo.vbsize, ib, (triCount * 3) + startCapInfo.ibsize, this.points[total - 1], this.fillThickness, null, this.endCap, Lines2D_1._endDir, this.border ? null : startCapContour);
            }
            // Need to create WebGL resources for border part?
            if (this.border) {
                var startCapInfo = this._getCapSize(this.startCap, true);
                var endCapInfo = this._getCapSize(this.endCap, true);
                var count = this.points.length;
                var vbSize = (count * 2 * 2 * 2) + startCapInfo.vbsize + endCapInfo.vbsize;
                this._borderVB = new Float32Array(vbSize);
                var vb = this._borderVB;
                var ht = this.fillThickness / 2;
                var bt = this.borderThickness;
                var total = this.points.length;
                this._buildLine(vb, contour, ht, bt);
                var max = total * 2 * 2;
                var triCount = (count - (this.closed ? 0 : 1)) * 2 * 2;
                this._borderIB = new Float32Array(triCount * 3 + startCapInfo.ibsize + endCapInfo.ibsize);
                var ib = this._borderIB;
                for (var i = 0; i < triCount; i += 4) {
                    ib[i * 3 + 0] = i + 0;
                    ib[i * 3 + 1] = i + 2;
                    ib[i * 3 + 2] = (i + 6) % max;
                    ib[i * 3 + 3] = i + 0;
                    ib[i * 3 + 4] = (i + 6) % max;
                    ib[i * 3 + 5] = (i + 4) % max;
                    ib[i * 3 + 6] = i + 3;
                    ib[i * 3 + 7] = i + 1;
                    ib[i * 3 + 8] = (i + 5) % max;
                    ib[i * 3 + 9] = i + 3;
                    ib[i * 3 + 10] = (i + 5) % max;
                    ib[i * 3 + 11] = (i + 7) % max;
                }
                this._buildCap(vb, count * 2 * 2 * 2, ib, triCount * 3, this.points[0], this.fillThickness, this.borderThickness, this.startCap, Lines2D_1._startDir, startCapContour);
                this._buildCap(vb, (count * 2 * 2 * 2) + startCapInfo.vbsize, ib, (triCount * 3) + startCapInfo.ibsize, this.points[total - 1], this.fillThickness, this.borderThickness, this.endCap, Lines2D_1._endDir, endCapContour);
            }
            var startCapTri;
            if (startCapContour.length > 0) {
                startCapTri = Earcut.earcut(startCapContour, null, 2);
            }
            var endCapTri;
            if (endCapContour.length > 0) {
                endCapTri = Earcut.earcut(endCapContour, null, 2);
            }
            // Build the Tri2DArray using the contour info from the shape and the caps (if any)
            {
                var pl = this.points.length;
                // Count the number of needed triangles
                var count = ((this.closed ? pl : (pl - 1)) * 2) + (startCapTri != null ? ((startCapTri.length + endCapTri.length) / 3) : 0);
                // Init/Clear the TriArray
                if (!this._primTriArray) {
                    this._primTriArray = new BABYLON.Tri2DArray(count);
                }
                else {
                    this._primTriArray.clear(count);
                }
                var pta_1 = this._primTriArray;
                var l = this.closed ? pl + 1 : pl;
                this.transformPointWithOriginToRef(contour[0], null, Lines2D_1._prevA);
                this.transformPointWithOriginToRef(contour[1], null, Lines2D_1._prevB);
                var si_1 = 0;
                for (var i = 1; i < l; i++) {
                    this.transformPointWithOriginToRef(contour[(i % pl) * 2 + 0], null, Lines2D_1._curA);
                    this.transformPointWithOriginToRef(contour[(i % pl) * 2 + 1], null, Lines2D_1._curB);
                    pta_1.storeTriangle(si_1++, Lines2D_1._prevA, Lines2D_1._prevB, Lines2D_1._curA);
                    pta_1.storeTriangle(si_1++, Lines2D_1._curA, Lines2D_1._prevB, Lines2D_1._curB);
                    Lines2D_1._prevA.x = Lines2D_1._curA.x;
                    Lines2D_1._prevA.y = Lines2D_1._curA.y;
                    Lines2D_1._prevB.x = Lines2D_1._curB.x;
                    Lines2D_1._prevB.y = Lines2D_1._curB.y;
                }
                var capIntersect = function (tri, points) {
                    var l = tri.length;
                    for (var i = 0; i < l; i += 3) {
                        Lines2D_1._curA.x = points[tri[i + 0] * 2 + 0];
                        Lines2D_1._curA.y = points[tri[i + 0] * 2 + 1];
                        _this.transformPointWithOriginToRef(Lines2D_1._curA, null, Lines2D_1._curB);
                        Lines2D_1._curA.x = points[tri[i + 1] * 2 + 0];
                        Lines2D_1._curA.y = points[tri[i + 1] * 2 + 1];
                        _this.transformPointWithOriginToRef(Lines2D_1._curA, null, Lines2D_1._prevA);
                        Lines2D_1._curA.x = points[tri[i + 2] * 2 + 0];
                        Lines2D_1._curA.y = points[tri[i + 2] * 2 + 1];
                        _this.transformPointWithOriginToRef(Lines2D_1._curA, null, Lines2D_1._prevB);
                        pta_1.storeTriangle(si_1++, Lines2D_1._prevA, Lines2D_1._prevB, Lines2D_1._curB);
                    }
                    return false;
                };
                if (startCapTri) {
                    if (startCapTri) {
                        capIntersect(startCapTri, startCapContour);
                    }
                    if (endCapTri) {
                        capIntersect(endCapTri, endCapContour);
                    }
                }
                this._primTriArrayDirty = false;
            }
            var bs = this._boundingMax.subtract(this._boundingMin);
            this._size.width = bs.x;
            this._size.height = bs.y;
        };
        Object.defineProperty(Lines2D.prototype, "size", {
            get: function () {
                if (this._size == null) {
                    this._computeLines2D();
                }
                return this._size;
            },
            enumerable: true,
            configurable: true
        });
        Lines2D.prototype.createInstanceDataParts = function () {
            var res = new Array();
            if (this.border) {
                res.push(new Lines2DInstanceData(BABYLON.Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Lines2DInstanceData(BABYLON.Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        };
        Lines2D.prototype.applyActualScaleOnTransform = function () {
            return true;
        };
        Lines2D.prototype.refreshInstanceDataPart = function (part) {
            if (!_super.prototype.refreshInstanceDataPart.call(this, part)) {
                return false;
            }
            if (part.id === BABYLON.Shape2D.SHAPE2D_BORDERPARTID) {
                var d = part;
                if (this.border instanceof BABYLON.GradientColorBrush2D) {
                    d.boundingMin = this.boundingMin;
                    d.boundingMax = this.boundingMax;
                }
            }
            else if (part.id === BABYLON.Shape2D.SHAPE2D_FILLPARTID) {
                var d = part;
                if (this.fill instanceof BABYLON.GradientColorBrush2D) {
                    d.boundingMin = this.boundingMin;
                    d.boundingMax = this.boundingMax;
                }
            }
            return true;
        };
        return Lines2D;
    }(BABYLON.Shape2D));
    Lines2D._prevA = BABYLON.Vector2.Zero();
    Lines2D._prevB = BABYLON.Vector2.Zero();
    Lines2D._curA = BABYLON.Vector2.Zero();
    Lines2D._curB = BABYLON.Vector2.Zero();
    Lines2D._miterTps = BABYLON.Vector2.Zero();
    Lines2D._startDir = BABYLON.Vector2.Zero();
    Lines2D._endDir = BABYLON.Vector2.Zero();
    Lines2D._tpsV = BABYLON.Vector2.Zero();
    Lines2D._noCap = 0;
    Lines2D._roundCap = 1;
    Lines2D._triangleCap = 2;
    Lines2D._squareAnchorCap = 3;
    Lines2D._roundAnchorCap = 4;
    Lines2D._diamondAnchorCap = 5;
    Lines2D._arrowCap = 6;
    Lines2D._roundCapSubDiv = 36;
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 1, function (pi) { return Lines2D_1.pointsProperty = pi; })
    ], Lines2D.prototype, "points", null);
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 2, function (pi) { return Lines2D_1.fillThicknessProperty = pi; })
    ], Lines2D.prototype, "fillThickness", null);
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 3, function (pi) { return Lines2D_1.closedProperty = pi; })
    ], Lines2D.prototype, "closed", null);
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 4, function (pi) { return Lines2D_1.startCapProperty = pi; })
    ], Lines2D.prototype, "startCap", null);
    __decorate([
        BABYLON.modelLevelProperty(BABYLON.Shape2D.SHAPE2D_PROPCOUNT + 5, function (pi) { return Lines2D_1.endCapProperty = pi; })
    ], Lines2D.prototype, "endCap", null);
    Lines2D = Lines2D_1 = __decorate([
        BABYLON.className("Lines2D", "BABYLON")
    ], Lines2D);
    BABYLON.Lines2D = Lines2D;
    var Lines2D_1;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    // This class contains data that lifetime is bounding to the Babylon Engine object
    var Canvas2DEngineBoundData = (function () {
        function Canvas2DEngineBoundData() {
            this._modelCache = new BABYLON.StringDictionary();
        }
        Canvas2DEngineBoundData.prototype.GetOrAddModelCache = function (key, factory) {
            return this._modelCache.getOrAddWithFactory(key, factory);
        };
        Canvas2DEngineBoundData.prototype.DisposeModelRenderCache = function (modelRenderCache) {
            if (!modelRenderCache.isDisposed) {
                return false;
            }
            this._modelCache.remove(modelRenderCache.modelKey);
            return true;
        };
        return Canvas2DEngineBoundData;
    }());
    BABYLON.Canvas2DEngineBoundData = Canvas2DEngineBoundData;
    var Canvas2D = Canvas2D_1 = (function (_super) {
        __extends(Canvas2D, _super);
        function Canvas2D(scene, settings) {
            var _this = _super.call(this, settings) || this;
            /**
             * If you set your own WorldSpaceNode to display the Canvas2D you have to provide your own implementation of this method which computes the local position in the Canvas based on the given 3D World one.
             * Beware that you have to take under consideration the origin and unitScaleFactor in your calculations! Good luck!
             */
            _this.worldSpaceToNodeLocal = function (worldPos) {
                var node = _this._worldSpaceNode;
                if (!node) {
                    return;
                }
                var mtx = node.getWorldMatrix().clone();
                mtx.invert();
                var usf = _this.unitScaleFactor;
                var v = BABYLON.Vector3.TransformCoordinates(worldPos, mtx);
                var res = new BABYLON.Vector2(v.x, v.y);
                var size = _this.actualSize;
                res.x += (size.width / usf) * 0.5; // res is centered, make it relative to bottom/left
                res.y += (size.height / usf) * 0.5;
                res.x *= usf; // multiply by the unitScaleFactor, which defines if the canvas is nth time bigger than the original world plane
                res.y *= usf;
                return res;
            };
            /**
             * If you use a custom WorldSpaceCanvasNode you have to override this property to update the UV of your object to reflect the changes due to a resizing of the cached bitmap
             */
            _this.worldSpaceCacheChanged = function () {
                var plane = _this.worldSpaceCanvasNode;
                var vd = BABYLON.VertexData.ExtractFromMesh(plane); //new VertexData();
                vd.uvs = new Float32Array(8);
                var material = plane.material;
                var tex = _this._renderableData._cacheTexture;
                if (material.diffuseTexture !== tex) {
                    material.diffuseTexture = tex;
                    tex.hasAlpha = true;
                }
                var nodeuv = _this._renderableData._cacheNodeUVs;
                for (var i = 0; i < 4; i++) {
                    vd.uvs[i * 2 + 0] = nodeuv[i].x;
                    vd.uvs[i * 2 + 1] = nodeuv[i].y;
                }
                vd.applyToMesh(plane);
            };
            _this._notifDebugMode = false;
            /**
             * Instanced Array will be create if there's at least this number of parts/prim that can fit into it
             */
            _this.minPartCountToUseInstancedArray = 5;
            _this._mapCounter = 0;
            _this._drawCallsOpaqueCounter = new BABYLON.PerfCounter();
            _this._drawCallsAlphaTestCounter = new BABYLON.PerfCounter();
            _this._drawCallsTransparentCounter = new BABYLON.PerfCounter();
            _this._groupRenderCounter = new BABYLON.PerfCounter();
            _this._updateTransparentDataCounter = new BABYLON.PerfCounter();
            _this._cachedGroupRenderCounter = new BABYLON.PerfCounter();
            _this._updateCachedStateCounter = new BABYLON.PerfCounter();
            _this._updateLayoutCounter = new BABYLON.PerfCounter();
            _this._updatePositioningCounter = new BABYLON.PerfCounter();
            _this._updateLocalTransformCounter = new BABYLON.PerfCounter();
            _this._updateGlobalTransformCounter = new BABYLON.PerfCounter();
            _this._boundingInfoRecomputeCounter = new BABYLON.PerfCounter();
            _this._layoutBoundingInfoUpdateCounter = new BABYLON.PerfCounter();
            _this._cachedCanvasGroup = null;
            _this._renderingGroupObserver = null;
            _this._beforeRenderObserver = null;
            _this._afterRenderObserver = null;
            _this._profileInfoText = null;
            BABYLON.Prim2DBase._isCanvasInit = false;
            if (!settings) {
                settings = {};
            }
            if (_this._cachingStrategy !== Canvas2D_1.CACHESTRATEGY_TOPLEVELGROUPS) {
                _this._background = new BABYLON.Rectangle2D({ parent: _this, id: "###CANVAS BACKGROUND###", size: settings.size }); //TODO CHECK when size is null
                _this._background.zOrder = 1.0;
                _this._background.isPickable = false;
                _this._background.origin = BABYLON.Vector2.Zero();
                _this._background.levelVisible = false;
                if (settings.backgroundRoundRadius != null) {
                    _this.backgroundRoundRadius = settings.backgroundRoundRadius;
                }
                if (settings.backgroundBorder != null) {
                    if (typeof (settings.backgroundBorder) === "string") {
                        _this.backgroundBorder = Canvas2D_1.GetBrushFromString(settings.backgroundBorder);
                    }
                    else {
                        _this.backgroundBorder = settings.backgroundBorder;
                    }
                }
                if (settings.backgroundBorderThickNess != null) {
                    _this.backgroundBorderThickness = settings.backgroundBorderThickNess;
                }
                if (settings.backgroundFill != null) {
                    if (typeof (settings.backgroundFill) === "string") {
                        _this.backgroundFill = Canvas2D_1.GetBrushFromString(settings.backgroundFill);
                    }
                    else {
                        _this.backgroundFill = settings.backgroundFill;
                    }
                }
                // Put a handler to resize the background whenever the canvas is resizing
                _this.propertyChanged.add(function (e, s) {
                    if (e.propertyName === "size") {
                        _this._background.size = _this.size;
                    }
                }, BABYLON.Group2D.sizeProperty.flagId);
                _this._background._patchHierarchy(_this);
            }
            var engine = scene.getEngine();
            _this.__engineData = engine.getOrAddExternalDataWithFactory("__BJSCANVAS2D__", function (k) { return new Canvas2DEngineBoundData(); });
            _this._primPointerInfo = new BABYLON.PrimitivePointerInfo();
            _this._capturedPointers = new BABYLON.StringDictionary();
            _this._pickStartingPosition = BABYLON.Vector2.Zero();
            _this._hierarchyLevelMaxSiblingCount = 50;
            _this._hierarchyDepth = 0;
            _this._zOrder = 0;
            _this._zMax = 1;
            _this._scene = scene;
            _this._engine = engine;
            _this._renderingSize = new BABYLON.Size(0, 0);
            _this._designSize = settings.designSize || null;
            _this._designUseHorizAxis = settings.designUseHorizAxis === true;
            if (!_this._trackedGroups) {
                _this._trackedGroups = new Array();
            }
            _this._maxAdaptiveWorldSpaceCanvasSize = null;
            _this._groupCacheMaps = new BABYLON.StringDictionary();
            _this._patchHierarchy(_this);
            var enableInteraction = (settings.enableInteraction == null) ? true : settings.enableInteraction;
            _this._fitRenderingDevice = !settings.size;
            if (!settings.size) {
                settings.size = new BABYLON.Size(engine.getRenderWidth(), engine.getRenderHeight());
            }
            // Register scene dispose to also dispose the canvas when it'll happens
            scene.onDisposeObservable.add(function (d, s) {
                _this.dispose();
            });
            if (_this._isScreenSpace) {
                if (settings.renderingPhase) {
                    if (!settings.renderingPhase.camera || settings.renderingPhase.renderingGroupID == null) {
                        throw Error("You have to specify a valid camera and renderingGroup");
                    }
                    _this._renderingGroupObserver = _this._scene.onRenderingGroupObservable.add(function (e, s) {
                        if ((_this._scene.activeCamera === settings.renderingPhase.camera) && (e.renderStage === BABYLON.RenderingGroupInfo.STAGE_POSTTRANSPARENT)) {
                            _this._engine.clear(null, false, true, true);
                            _this._render();
                        }
                    }, Math.pow(2, settings.renderingPhase.renderingGroupID));
                }
                else {
                    _this._afterRenderObserver = _this._scene.onAfterRenderObservable.add(function (d, s) {
                        _this._engine.clear(null, false, true, true);
                        _this._render();
                    });
                }
            }
            else {
                _this._beforeRenderObserver = _this._scene.onBeforeRenderObservable.add(function (d, s) {
                    _this._render();
                });
            }
            _this._supprtInstancedArray = _this._engine.getCaps().instancedArrays !== null;
            //this._supprtInstancedArray = false; // TODO REMOVE!!!
            // Setup the canvas for interaction (or not)
            _this._setupInteraction(enableInteraction);
            // Initialize the Primitive Collision Manager
            if (settings.enableCollisionManager) {
                var enableBorders = settings.collisionManagerUseBorders;
                _this._primitiveCollisionManager = (settings.customCollisionManager == null) ? BABYLON.PrimitiveCollisionManagerBase.allocBasicPCM(_this, enableBorders) : settings.customCollisionManager(_this, enableBorders);
            }
            // Register this instance
            Canvas2D_1._INSTANCES.push(_this);
            return _this;
        }
        Object.defineProperty(Canvas2D.prototype, "drawCallsOpaqueCounter", {
            get: function () {
                return this._drawCallsOpaqueCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "drawCallsAlphaTestCounter", {
            get: function () {
                return this._drawCallsAlphaTestCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "drawCallsTransparentCounter", {
            get: function () {
                return this._drawCallsTransparentCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "groupRenderCounter", {
            get: function () {
                return this._groupRenderCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateTransparentDataCounter", {
            get: function () {
                return this._updateTransparentDataCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "cachedGroupRenderCounter", {
            get: function () {
                return this._cachedGroupRenderCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateCachedStateCounter", {
            get: function () {
                return this._updateCachedStateCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateLayoutCounter", {
            get: function () {
                return this._updateLayoutCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updatePositioningCounter", {
            get: function () {
                return this._updatePositioningCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateLocalTransformCounter", {
            get: function () {
                return this._updateLocalTransformCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "updateGlobalTransformCounter", {
            get: function () {
                return this._updateGlobalTransformCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "boundingInfoRecomputeCounter", {
            get: function () {
                return this._boundingInfoRecomputeCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "layoutBoundingInfoUpdateCounter", {
            get: function () {
                return this._layoutBoundingInfoUpdateCounter;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D, "instances", {
            get: function () {
                return Canvas2D_1._INSTANCES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "primitiveCollisionManager", {
            get: function () {
                return this._primitiveCollisionManager;
            },
            enumerable: true,
            configurable: true
        });
        Canvas2D.prototype._canvasPreInit = function (settings) {
            var cachingStrategy = (settings.cachingStrategy == null) ? Canvas2D_1.CACHESTRATEGY_DONTCACHE : settings.cachingStrategy;
            this._cachingStrategy = cachingStrategy;
            this._isScreenSpace = (settings.isScreenSpace == null) ? true : settings.isScreenSpace;
        };
        Canvas2D.prototype._setupInteraction = function (enable) {
            var _this = this;
            // No change detection
            if (enable === this._interactionEnabled) {
                return;
            }
            // Set the new state
            this._interactionEnabled = enable;
            // ScreenSpace mode
            if (this._isScreenSpace) {
                // Disable interaction
                if (!enable) {
                    if (this._scenePrePointerObserver) {
                        this.scene.onPrePointerObservable.remove(this._scenePrePointerObserver);
                        this._scenePrePointerObserver = null;
                    }
                    return;
                }
                // Enable Interaction
                // Register the observable
                this._scenePrePointerObserver = this.scene.onPrePointerObservable.add(function (e, s) {
                    if (_this.isVisible === false) {
                        return;
                    }
                    var hs = 1 / _this.engine.getHardwareScalingLevel();
                    var localPos = e.localPosition.multiplyByFloats(hs, hs);
                    _this._handlePointerEventForInteraction(e, localPos, s);
                });
            }
            else {
                var scene = this.scene;
                if (enable) {
                    scene.constantlyUpdateMeshUnderPointer = true;
                    this._scenePointerObserver = scene.onPointerObservable.add(function (e, s) {
                        if (_this.isVisible === false) {
                            return;
                        }
                        if (e.pickInfo.hit && e.pickInfo.pickedMesh === _this._worldSpaceNode && _this.worldSpaceToNodeLocal) {
                            var localPos = _this.worldSpaceToNodeLocal(e.pickInfo.pickedPoint);
                            _this._handlePointerEventForInteraction(e, localPos, s);
                        }
                        else if (_this._actualIntersectionList && _this._actualIntersectionList.length > 0) {
                            _this._handlePointerEventForInteraction(e, null, s);
                        }
                    });
                }
                else {
                    if (this._scenePointerObserver) {
                        this.scene.onPointerObservable.remove(this._scenePointerObserver);
                        this._scenePointerObserver = null;
                    }
                }
            }
        };
        /**
         * Internal method, you should use the Prim2DBase version instead
         */
        Canvas2D.prototype._setPointerCapture = function (pointerId, primitive) {
            if (this.isPointerCaptured(pointerId)) {
                return false;
            }
            // Try to capture the pointer on the HTML side
            try {
                this.engine.getRenderingCanvas().setPointerCapture(pointerId);
            }
            catch (e) {
            }
            this._primPointerInfo.updateRelatedTarget(primitive, BABYLON.Vector2.Zero());
            this._bubbleNotifyPrimPointerObserver(primitive, BABYLON.PrimitivePointerInfo.PointerGotCapture, null);
            this._capturedPointers.add(pointerId.toString(), primitive);
            return true;
        };
        /**
         * Internal method, you should use the Prim2DBase version instead
         */
        Canvas2D.prototype._releasePointerCapture = function (pointerId, primitive) {
            if (this._capturedPointers.get(pointerId.toString()) !== primitive) {
                return false;
            }
            // Try to release the pointer on the HTML side
            try {
                this.engine.getRenderingCanvas().releasePointerCapture(pointerId);
            }
            catch (e) {
            }
            this._primPointerInfo.updateRelatedTarget(primitive, BABYLON.Vector2.Zero());
            this._bubbleNotifyPrimPointerObserver(primitive, BABYLON.PrimitivePointerInfo.PointerLostCapture, null);
            this._capturedPointers.remove(pointerId.toString());
            return true;
        };
        /**
         * Determine if the given pointer is captured or not
         * @param pointerId the Id of the pointer
         * @return true if it's captured, false otherwise
         */
        Canvas2D.prototype.isPointerCaptured = function (pointerId) {
            return this._capturedPointers.contains(pointerId.toString());
        };
        Canvas2D.prototype.getCapturedPrimitive = function (pointerId) {
            // Avoid unnecessary lookup
            if (this._capturedPointers.count === 0) {
                return null;
            }
            return this._capturedPointers.get(pointerId.toString());
        };
        Canvas2D.prototype._handlePointerEventForInteraction = function (eventData, localPosition, eventState) {
            // Dispose check
            if (this.isDisposed) {
                return;
            }
            // Update the this._primPointerInfo structure we'll send to observers using the PointerEvent data
            if (localPosition) {
                if (!this._updatePointerInfo(eventData, localPosition)) {
                    return;
                }
            }
            else {
                this._primPointerInfo.canvasPointerPos = null;
            }
            var capturedPrim = this.getCapturedPrimitive(this._primPointerInfo.pointerId);
            // Make sure the intersection list is up to date, we maintain this list either in response of a mouse event (here) or before rendering the canvas.
            // Why before rendering the canvas? because some primitives may move and get away/under the mouse cursor (which is not moving). So we need to update at both location in order to always have an accurate list, which is needed for the hover state change.
            this._updateIntersectionList(localPosition ? this._primPointerInfo.canvasPointerPos : null, capturedPrim !== null, true);
            // Update the over status, same as above, it's could be done here or during rendering, but will be performed only once per render frame
            this._updateOverStatus(true);
            // Check if we have nothing to raise
            if (!this._actualOverPrimitive && !capturedPrim) {
                return;
            }
            // Update the relatedTarget info with the over primitive or the captured one (if any)
            var targetPrim = capturedPrim || this._actualOverPrimitive.prim;
            var targetPointerPos = capturedPrim ? this._primPointerInfo.canvasPointerPos.subtract(new BABYLON.Vector2(targetPrim.globalTransform.m[12], targetPrim.globalTransform.m[13])) : this._actualOverPrimitive.intersectionLocation;
            this._primPointerInfo.updateRelatedTarget(targetPrim, targetPointerPos);
            // Analyze the pointer event type and fire proper events on the primitive
            var skip = false;
            if (eventData.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerMouseWheel, eventData);
            }
            else if (eventData.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerMove, eventData);
            }
            else if (eventData.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerDown, eventData);
            }
            else if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                skip = !this._bubbleNotifyPrimPointerObserver(targetPrim, BABYLON.PrimitivePointerInfo.PointerUp, eventData);
            }
            eventState.skipNextObservers = skip;
        };
        Canvas2D.prototype._updatePointerInfo = function (eventData, localPosition) {
            var s = this.scale;
            var pii = this._primPointerInfo;
            pii.cancelBubble = false;
            if (!pii.canvasPointerPos) {
                pii.canvasPointerPos = BABYLON.Vector2.Zero();
            }
            var camera = this._scene.cameraToUseForPointers || this._scene.activeCamera;
            if (!camera || !camera.viewport) {
                return false;
            }
            var engine = this._scene.getEngine();
            if (this._isScreenSpace) {
                var cameraViewport = camera.viewport;
                var viewport = cameraViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
                // Moving coordinates to local viewport world
                var x = localPosition.x - viewport.x;
                var y = localPosition.y - viewport.y;
                pii.canvasPointerPos.x = (x - this.actualPosition.x) / s;
                pii.canvasPointerPos.y = (engine.getRenderHeight() - y - this.actualPosition.y) / s;
            }
            else {
                pii.canvasPointerPos.x = localPosition.x / s;
                pii.canvasPointerPos.y = localPosition.y / s;
            }
            //console.log(`UpdatePointerInfo for ${this.id}, X:${pii.canvasPointerPos.x}, Y:${pii.canvasPointerPos.y}`);
            pii.mouseWheelDelta = 0;
            if (eventData.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
                var event = eventData.event;
                if (event.wheelDelta) {
                    pii.mouseWheelDelta = event.wheelDelta / (BABYLON.PrimitivePointerInfo.MouseWheelPrecision * 40);
                }
                else if (event.detail) {
                    pii.mouseWheelDelta = -event.detail / BABYLON.PrimitivePointerInfo.MouseWheelPrecision;
                }
            }
            else {
                var pe = eventData.event;
                pii.ctrlKey = pe.ctrlKey;
                pii.altKey = pe.altKey;
                pii.shiftKey = pe.shiftKey;
                pii.metaKey = pe.metaKey;
                pii.button = pe.button;
                pii.buttons = pe.buttons;
                pii.pointerId = pe.pointerId;
                pii.width = pe.width;
                pii.height = pe.height;
                pii.presssure = pe.pressure;
                pii.tilt.x = pe.tiltX;
                pii.tilt.y = pe.tiltY;
                pii.isCaptured = this.getCapturedPrimitive(pe.pointerId) !== null;
            }
            return true;
        };
        Canvas2D.prototype._updateIntersectionList = function (mouseLocalPos, isCapture, force) {
            if (!force && (this.scene.getRenderId() === this._intersectionRenderId)) {
                return;
            }
            var ii = Canvas2D_1._interInfo;
            var outCase = mouseLocalPos == null;
            if (!outCase) {
                // A little safe guard, it might happens than the event is triggered before the first render and nothing is computed, this simple check will make sure everything will be fine
                if (!this._globalTransform) {
                    this.updateCachedStates(true);
                }
                ii.pickPosition.x = mouseLocalPos.x;
                ii.pickPosition.y = mouseLocalPos.y;
                ii.findFirstOnly = false;
                // Fast rejection: test if the mouse pointer is outside the canvas's bounding Info
                if (!isCapture && !this.levelBoundingInfo.doesIntersect(ii.pickPosition)) {
                    // Reset intersection info as we don't hit anything
                    ii.intersectedPrimitives = new Array();
                    ii.topMostIntersectedPrimitive = null;
                }
                else {
                    // The pointer is inside the Canvas, do an intersection test
                    this.intersect(ii);
                    // Sort primitives to get them from top to bottom
                    ii.intersectedPrimitives = ii.intersectedPrimitives.sort(function (a, b) { return a.prim.actualZOffset - b.prim.actualZOffset; });
                }
            }
            {
                // Update prev/actual intersection info, fire "overPrim" property change if needed
                this._previousIntersectionList = this._actualIntersectionList;
                this._actualIntersectionList = outCase ? new Array() : ii.intersectedPrimitives;
                this._previousOverPrimitive = this._actualOverPrimitive;
                this._actualOverPrimitive = outCase ? null : ii.topMostIntersectedPrimitive;
                var prev = (this._previousOverPrimitive != null) ? this._previousOverPrimitive.prim : null;
                var actual = (this._actualOverPrimitive != null) ? this._actualOverPrimitive.prim : null;
                if (prev !== actual) {
                    this.onPropertyChanged("overPrim", this._previousOverPrimitive ? this._previousOverPrimitive.prim : null, this._actualOverPrimitive ? this._actualOverPrimitive.prim : null);
                }
            }
            this._intersectionRenderId = this.scene.getRenderId();
        };
        // Based on the previousIntersectionList and the actualInstersectionList we can determined which primitives are being hover state or loosing it
        Canvas2D.prototype._updateOverStatus = function (force) {
            if ((!force && (this.scene.getRenderId() === this._hoverStatusRenderId)) || !this._actualIntersectionList) {
                return;
            }
            if (this._previousIntersectionList == null) {
                this._previousIntersectionList = [];
            }
            // Detect a change of over
            var prevPrim = this._previousOverPrimitive ? this._previousOverPrimitive.prim : null;
            var actualPrim = this._actualOverPrimitive ? this._actualOverPrimitive.prim : null;
            if (prevPrim !== actualPrim) {
                // Detect if the current pointer is captured, only fire event if they belong to the capture primitive
                var capturedPrim = this.getCapturedPrimitive(this._primPointerInfo.pointerId);
                // See the NOTE section of: https://www.w3.org/TR/pointerevents/#setting-pointer-capture
                if (capturedPrim) {
                    if (capturedPrim === prevPrim) {
                        this._primPointerInfo.updateRelatedTarget(prevPrim, this._previousOverPrimitive.intersectionLocation);
                        this._bubbleNotifyPrimPointerObserver(prevPrim, BABYLON.PrimitivePointerInfo.PointerOut, null);
                    }
                    else if (capturedPrim === actualPrim) {
                        this._primPointerInfo.updateRelatedTarget(actualPrim, this._actualOverPrimitive.intersectionLocation);
                        this._bubbleNotifyPrimPointerObserver(actualPrim, BABYLON.PrimitivePointerInfo.PointerOver, null);
                    }
                }
                else {
                    var _loop_1 = function (prev) {
                        if (!BABYLON.Tools.first(this_1._actualIntersectionList, function (pii) { return pii.prim === prev.prim; })) {
                            this_1._primPointerInfo.updateRelatedTarget(prev.prim, prev.intersectionLocation);
                            this_1._bubbleNotifyPrimPointerObserver(prev.prim, BABYLON.PrimitivePointerInfo.PointerOut, null);
                        }
                    };
                    var this_1 = this;
                    // Check for Out & Leave
                    for (var _i = 0, _a = this._previousIntersectionList; _i < _a.length; _i++) {
                        var prev = _a[_i];
                        _loop_1(prev);
                    }
                    var _loop_2 = function (actual) {
                        if (!BABYLON.Tools.first(this_2._previousIntersectionList, function (pii) { return pii.prim === actual.prim; })) {
                            this_2._primPointerInfo.updateRelatedTarget(actual.prim, actual.intersectionLocation);
                            this_2._bubbleNotifyPrimPointerObserver(actual.prim, BABYLON.PrimitivePointerInfo.PointerOver, null);
                        }
                    };
                    var this_2 = this;
                    // Check for Over & Enter
                    for (var _b = 0, _c = this._actualIntersectionList; _b < _c.length; _b++) {
                        var actual = _c[_b];
                        _loop_2(actual);
                    }
                }
            }
            this._hoverStatusRenderId = this.scene.getRenderId();
        };
        Canvas2D.prototype._updatePrimPointerPos = function (prim) {
            if (this._primPointerInfo.isCaptured) {
                this._primPointerInfo.primitivePointerPos = this._primPointerInfo.relatedTargetPointerPos;
            }
            else {
                for (var _i = 0, _a = this._actualIntersectionList; _i < _a.length; _i++) {
                    var pii = _a[_i];
                    if (pii.prim === prim) {
                        this._primPointerInfo.primitivePointerPos = pii.intersectionLocation;
                        return;
                    }
                }
            }
        };
        Canvas2D.prototype._debugExecObserver = function (prim, mask) {
            if (!this._notifDebugMode) {
                return;
            }
            var debug = "";
            for (var i = 0; i < prim.hierarchyDepth; i++) {
                debug += "  ";
            }
            var pii = this._primPointerInfo;
            debug += "[RID:" + this.scene.getRenderId() + "] [" + prim.hierarchyDepth + "] event:" + BABYLON.PrimitivePointerInfo.getEventTypeName(mask) + ", id: " + prim.id + " (" + BABYLON.Tools.getClassName(prim) + "), primPos: " + pii.primitivePointerPos.toString() + ", canvasPos: " + pii.canvasPointerPos.toString() + ", relatedTarget: " + pii.relatedTarget.id;
            console.log(debug);
        };
        Canvas2D.prototype._bubbleNotifyPrimPointerObserver = function (prim, mask, eventData) {
            var ppi = this._primPointerInfo;
            var event = eventData ? eventData.event : null;
            var cur = prim;
            while (cur && !cur.isDisposed) {
                this._updatePrimPointerPos(cur);
                // For the first level we have to fire Enter or Leave for corresponding Over or Out
                if (cur === prim) {
                    // Fire the proper notification
                    if (mask === BABYLON.PrimitivePointerInfo.PointerOver) {
                        this._debugExecObserver(prim, BABYLON.PrimitivePointerInfo.PointerEnter);
                        prim._pointerEventObservable.notifyObservers(ppi, BABYLON.PrimitivePointerInfo.PointerEnter);
                    }
                    else if (mask === BABYLON.PrimitivePointerInfo.PointerOut) {
                        this._debugExecObserver(prim, BABYLON.PrimitivePointerInfo.PointerLeave);
                        prim._pointerEventObservable.notifyObservers(ppi, BABYLON.PrimitivePointerInfo.PointerLeave);
                    }
                }
                // Exec the observers
                this._debugExecObserver(cur, mask);
                if (!cur._pointerEventObservable.notifyObservers(ppi, mask) && eventData instanceof BABYLON.PointerInfoPre) {
                    eventData.skipOnPointerObservable = true;
                    return false;
                }
                this._triggerActionManager(cur, ppi, mask, event);
                // Bubble canceled? If we're not executing PointerOver or PointerOut, quit immediately
                // If it's PointerOver/Out we have to trigger PointerEnter/Leave no matter what
                if (ppi.cancelBubble) {
                    return false;
                }
                // Loop to the parent
                cur = cur.parent;
            }
            return true;
        };
        Canvas2D.prototype._triggerActionManager = function (prim, ppi, mask, eventData) {
            var _this = this;
            // A little safe guard, it might happens than the event is triggered before the first render and nothing is computed, this simple check will make sure everything will be fine
            if (!this._globalTransform) {
                this.updateCachedStates(true);
            }
            // Process Trigger related to PointerDown
            if ((mask & BABYLON.PrimitivePointerInfo.PointerDown) !== 0) {
                // On pointer down, record the current position and time to be able to trick PickTrigger and LongPressTrigger
                this._pickStartingPosition = ppi.primitivePointerPos.clone();
                this._pickStartingTime = new Date().getTime();
                this._pickedDownPrim = null;
                if (prim.actionManager) {
                    this._pickedDownPrim = prim;
                    if (prim.actionManager.hasPickTriggers) {
                        var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                        switch (eventData.button) {
                            case 0:
                                prim.actionManager.processTrigger(BABYLON.ActionManager.OnLeftPickTrigger, actionEvent);
                                break;
                            case 1:
                                prim.actionManager.processTrigger(BABYLON.ActionManager.OnCenterPickTrigger, actionEvent);
                                break;
                            case 2:
                                prim.actionManager.processTrigger(BABYLON.ActionManager.OnRightPickTrigger, actionEvent);
                                break;
                        }
                        prim.actionManager.processTrigger(BABYLON.ActionManager.OnPickDownTrigger, actionEvent);
                    }
                    if (prim.actionManager.hasSpecificTrigger(BABYLON.ActionManager.OnLongPressTrigger)) {
                        window.setTimeout(function () {
                            var ppi = _this._primPointerInfo;
                            var capturedPrim = _this.getCapturedPrimitive(ppi.pointerId);
                            _this._updateIntersectionList(ppi.canvasPointerPos, capturedPrim !== null, true);
                            _this._updateOverStatus(false);
                            var ii = new BABYLON.IntersectInfo2D();
                            ii.pickPosition = ppi.canvasPointerPos.clone();
                            ii.findFirstOnly = false;
                            _this.intersect(ii);
                            if (ii.isPrimIntersected(prim) !== null) {
                                if (prim.actionManager) {
                                    if (_this._pickStartingTime !== 0 && ((new Date().getTime() - _this._pickStartingTime) > BABYLON.ActionManager.LongPressDelay) && (Math.abs(_this._pickStartingPosition.x - ii.pickPosition.x) < BABYLON.ActionManager.DragMovementThreshold && Math.abs(_this._pickStartingPosition.y - ii.pickPosition.y) < BABYLON.ActionManager.DragMovementThreshold)) {
                                        _this._pickStartingTime = 0;
                                        prim.actionManager.processTrigger(BABYLON.ActionManager.OnLongPressTrigger, BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData));
                                    }
                                }
                            }
                        }, BABYLON.ActionManager.LongPressDelay);
                    }
                }
            }
            else if ((mask & BABYLON.PrimitivePointerInfo.PointerUp) !== 0) {
                this._pickStartingTime = 0;
                var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                if (prim.actionManager) {
                    // OnPickUpTrigger
                    prim.actionManager.processTrigger(BABYLON.ActionManager.OnPickUpTrigger, actionEvent);
                    // OnPickTrigger
                    if (Math.abs(this._pickStartingPosition.x - ppi.canvasPointerPos.x) < BABYLON.ActionManager.DragMovementThreshold && Math.abs(this._pickStartingPosition.y - ppi.canvasPointerPos.y) < BABYLON.ActionManager.DragMovementThreshold) {
                        prim.actionManager.processTrigger(BABYLON.ActionManager.OnPickTrigger, actionEvent);
                    }
                }
                // OnPickOutTrigger
                if (this._pickedDownPrim && this._pickedDownPrim.actionManager && (this._pickedDownPrim !== prim)) {
                    this._pickedDownPrim.actionManager.processTrigger(BABYLON.ActionManager.OnPickOutTrigger, actionEvent);
                }
            }
            else if ((mask & BABYLON.PrimitivePointerInfo.PointerOver) !== 0) {
                if (prim.actionManager) {
                    var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                    prim.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOverTrigger, actionEvent);
                }
            }
            else if ((mask & BABYLON.PrimitivePointerInfo.PointerOut) !== 0) {
                if (prim.actionManager) {
                    var actionEvent = BABYLON.ActionEvent.CreateNewFromPrimitive(prim, ppi.primitivePointerPos, eventData);
                    prim.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOutTrigger, actionEvent);
                }
            }
        };
        /**
         * Don't forget to call the dispose method when you're done with the Canvas instance.
         * But don't worry, if you dispose its scene, the canvas will be automatically disposed too.
         */
        Canvas2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (this._profilingCanvas) {
                this._profilingCanvas.dispose();
                this._profilingCanvas = null;
            }
            if (this.interactionEnabled) {
                this._setupInteraction(false);
            }
            if (this._renderingGroupObserver) {
                this._scene.onRenderingGroupObservable.remove(this._renderingGroupObserver);
                this._renderingGroupObserver = null;
            }
            if (this._beforeRenderObserver) {
                this._scene.onBeforeRenderObservable.remove(this._beforeRenderObserver);
                this._beforeRenderObserver = null;
            }
            if (this._afterRenderObserver) {
                this._scene.onAfterRenderObservable.remove(this._afterRenderObserver);
                this._afterRenderObserver = null;
            }
            if (this._groupCacheMaps) {
                this._groupCacheMaps.forEach(function (k, m) { return m.forEach(function (e) { return e.dispose(); }); });
                this._groupCacheMaps = null;
            }
            // Unregister this instance
            var index = Canvas2D_1._INSTANCES.indexOf(this);
            if (index > -1) {
                Canvas2D_1._INSTANCES.splice(index, 1);
            }
            return true;
        };
        Object.defineProperty(Canvas2D.prototype, "scene", {
            /**
             * Accessor to the Scene that owns the Canvas
             * @returns The instance of the Scene object
             */
            get: function () {
                return this._scene;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "engine", {
            /**
             * Accessor to the Engine that drives the Scene used by this Canvas
             * @returns The instance of the Engine object
             */
            get: function () {
                return this._engine;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "renderObservable", {
            /**
             * And observable called during the Canvas rendering process.
             * This observable is called twice per render, each time with a different mask:
             *  - 1: before render is executed
             *  - 2: after render is executed
             */
            get: function () {
                if (!this._renderObservable) {
                    this._renderObservable = new BABYLON.Observable();
                }
                return this._renderObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "cachingStrategy", {
            /**
             * Accessor of the Caching Strategy used by this Canvas.
             * See Canvas2D.CACHESTRATEGY_xxxx static members for more information
             * @returns the value corresponding to the used strategy.
             */
            get: function () {
                return this._cachingStrategy;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "isScreenSpace", {
            /**
             * Return true if the Canvas is a Screen Space one, false if it's a World Space one.
             * @returns {}
             */
            get: function () {
                return this._isScreenSpace;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "worldSpaceCanvasNode", {
            /**
             * Only valid for World Space Canvas, returns the scene node that displays the canvas
             */
            get: function () {
                return this._worldSpaceNode;
            },
            set: function (val) {
                this._worldSpaceNode = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "supportInstancedArray", {
            /**
             * Check if the WebGL Instanced Array extension is supported or not
             */
            get: function () {
                return this._supprtInstancedArray;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundFill", {
            /**
             * Property that defines the fill object used to draw the background of the Canvas.
             * Note that Canvas with a Caching Strategy of
             * @returns If the background is not set, null will be returned, otherwise a valid fill object is returned.
             */
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.fill;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.fill) {
                    return;
                }
                this._background.fill = value;
                this._background.levelVisible = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundBorder", {
            /**
             * Property that defines the border object used to draw the background of the Canvas.
             * @returns If the background is not set, null will be returned, otherwise a valid border object is returned.
             */
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.border;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.border) {
                    return;
                }
                this._background.border = value;
                this._background.levelVisible = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundBorderThickness", {
            /**
             * Property that defines the thickness of the border object used to draw the background of the Canvas.
             * @returns If the background is not set, null will be returned, otherwise a valid number matching the thickness is returned.
             */
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.borderThickness;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.borderThickness) {
                    return;
                }
                this._background.borderThickness = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "backgroundRoundRadius", {
            /**
             * You can set the roundRadius of the background
             * @returns The current roundRadius
             */
            get: function () {
                if (!this._background || !this._background.isVisible) {
                    return null;
                }
                return this._background.roundRadius;
            },
            set: function (value) {
                this.checkBackgroundAvailability();
                if (value === this._background.roundRadius) {
                    return;
                }
                this._background.roundRadius = value;
                this._background.levelVisible = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "interactionEnabled", {
            /**
             * Enable/Disable interaction for this Canvas
             * When enabled the Prim2DBase.pointerEventObservable property will notified when appropriate events occur
             */
            get: function () {
                return this._interactionEnabled;
            },
            set: function (enable) {
                this._setupInteraction(enable);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "fitRenderingDevice", {
            get: function () {
                return this._fitRenderingDevice;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "designSize", {
            get: function () {
                return this._designSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "designSizeUseHorizAxis", {
            get: function () {
                return this._designUseHorizAxis;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "designSizeUseHorizeAxis", {
            set: function (value) {
                this._designUseHorizAxis = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "overPrim", {
            /**
             * Return
             */
            get: function () {
                if (this._actualIntersectionList && this._actualIntersectionList.length > 0) {
                    return this._actualIntersectionList[0].prim;
                }
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "_engineData", {
            /**
             * Access the babylon.js' engine bound data, do not invoke this method, it's for internal purpose only
             * @returns {}
             */
            get: function () {
                return this.__engineData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Canvas2D.prototype, "unitScaleFactor", {
            get: function () {
                return this._unitScaleFactor;
            },
            enumerable: true,
            configurable: true
        });
        Canvas2D.prototype.createCanvasProfileInfoCanvas = function () {
            if (this._profilingCanvas) {
                return this._profilingCanvas;
            }
            var canvas = new ScreenSpaceCanvas2D(this.scene, {
                id: "ProfileInfoCanvas", cachingStrategy: Canvas2D_1.CACHESTRATEGY_DONTCACHE, children: [
                    new BABYLON.Rectangle2D({
                        id: "ProfileBorder", border: "#FFFFFFFF", borderThickness: 2, roundRadius: 5, fill: "#C04040C0", marginAlignment: "h: left, v: top", margin: "10", padding: "10", children: [
                            new BABYLON.Text2D("Stats", { id: "ProfileInfoText", marginAlignment: "h: left, v: top", fontName: "12pt Lucida Console", fontSignedDistanceField: true })
                        ]
                    })
                ]
            });
            this._profileInfoText = canvas.findById("ProfileInfoText");
            this._profilingCanvas = canvas;
            return canvas;
        };
        Canvas2D.prototype.checkBackgroundAvailability = function () {
            if (this._cachingStrategy === Canvas2D_1.CACHESTRATEGY_TOPLEVELGROUPS) {
                throw Error("Can't use Canvas Background with the caching strategy TOPLEVELGROUPS");
            }
        };
        Canvas2D.prototype._initPerfMetrics = function () {
            this._drawCallsOpaqueCounter.fetchNewFrame();
            this._drawCallsAlphaTestCounter.fetchNewFrame();
            this._drawCallsTransparentCounter.fetchNewFrame();
            this._groupRenderCounter.fetchNewFrame();
            this._updateTransparentDataCounter.fetchNewFrame();
            this._cachedGroupRenderCounter.fetchNewFrame();
            this._updateCachedStateCounter.fetchNewFrame();
            this._updateLayoutCounter.fetchNewFrame();
            this._updatePositioningCounter.fetchNewFrame();
            this._updateLocalTransformCounter.fetchNewFrame();
            this._updateGlobalTransformCounter.fetchNewFrame();
            this._boundingInfoRecomputeCounter.fetchNewFrame();
            this._layoutBoundingInfoUpdateCounter.fetchNewFrame();
        };
        Canvas2D.prototype._fetchPerfMetrics = function () {
            this._drawCallsOpaqueCounter.addCount(0, true);
            this._drawCallsAlphaTestCounter.addCount(0, true);
            this._drawCallsTransparentCounter.addCount(0, true);
            this._groupRenderCounter.addCount(0, true);
            this._updateTransparentDataCounter.addCount(0, true);
            this._cachedGroupRenderCounter.addCount(0, true);
            this._updateCachedStateCounter.addCount(0, true);
            this._updateLayoutCounter.addCount(0, true);
            this._updatePositioningCounter.addCount(0, true);
            this._updateLocalTransformCounter.addCount(0, true);
            this._updateGlobalTransformCounter.addCount(0, true);
            this._boundingInfoRecomputeCounter.addCount(0, true);
            this._layoutBoundingInfoUpdateCounter.addCount(0, true);
        };
        Canvas2D.prototype._updateProfileCanvas = function () {
            if (this._profileInfoText == null) {
                return;
            }
            var format = function (v) { return (Math.round(v * 100) / 100).toString(); };
            var p = "Draw Calls:\n" +
                (" - Opaque:      " + format(this.drawCallsOpaqueCounter.current) + ", (avg:" + format(this.drawCallsOpaqueCounter.lastSecAverage) + ", t:" + format(this.drawCallsOpaqueCounter.total) + ")\n") +
                (" - AlphaTest:   " + format(this.drawCallsAlphaTestCounter.current) + ", (avg:" + format(this.drawCallsAlphaTestCounter.lastSecAverage) + ", t:" + format(this.drawCallsAlphaTestCounter.total) + ")\n") +
                (" - Transparent: " + format(this.drawCallsTransparentCounter.current) + ", (avg:" + format(this.drawCallsTransparentCounter.lastSecAverage) + ", t:" + format(this.drawCallsTransparentCounter.total) + ")\n") +
                ("Group Render: " + this.groupRenderCounter.current + ", (avg:" + format(this.groupRenderCounter.lastSecAverage) + ", t:" + format(this.groupRenderCounter.total) + ")\n") +
                ("Update Transparent Data: " + this.updateTransparentDataCounter.current + ", (avg:" + format(this.updateTransparentDataCounter.lastSecAverage) + ", t:" + format(this.updateTransparentDataCounter.total) + ")\n") +
                ("Cached Group Render: " + this.cachedGroupRenderCounter.current + ", (avg:" + format(this.cachedGroupRenderCounter.lastSecAverage) + ", t:" + format(this.cachedGroupRenderCounter.total) + ")\n") +
                ("Update Cached States: " + this.updateCachedStateCounter.current + ", (avg:" + format(this.updateCachedStateCounter.lastSecAverage) + ", t:" + format(this.updateCachedStateCounter.total) + ")\n") +
                (" - Update Layout: " + this.updateLayoutCounter.current + ", (avg:" + format(this.updateLayoutCounter.lastSecAverage) + ", t:" + format(this.updateLayoutCounter.total) + ")\n") +
                (" - Update Positioning: " + this.updatePositioningCounter.current + ", (avg:" + format(this.updatePositioningCounter.lastSecAverage) + ", t:" + format(this.updatePositioningCounter.total) + ")\n") +
                (" - Update Local  Trans: " + this.updateLocalTransformCounter.current + ", (avg:" + format(this.updateLocalTransformCounter.lastSecAverage) + ", t:" + format(this.updateLocalTransformCounter.total) + ")\n") +
                (" - Update Global Trans: " + this.updateGlobalTransformCounter.current + ", (avg:" + format(this.updateGlobalTransformCounter.lastSecAverage) + ", t:" + format(this.updateGlobalTransformCounter.total) + ")\n") +
                (" - BoundingInfo Recompute: " + this.boundingInfoRecomputeCounter.current + ", (avg:" + format(this.boundingInfoRecomputeCounter.lastSecAverage) + ", t:" + format(this.boundingInfoRecomputeCounter.total) + ")\n") +
                (" - LayoutBoundingInfo Recompute: " + this.layoutBoundingInfoUpdateCounter.current + ", (avg:" + format(this.layoutBoundingInfoUpdateCounter.lastSecAverage) + ", t:" + format(this.layoutBoundingInfoUpdateCounter.total) + ")");
            this._profileInfoText.text = p;
        };
        Canvas2D.prototype._addDrawCallCount = function (count, renderMode) {
            switch (renderMode) {
                case BABYLON.Render2DContext.RenderModeOpaque:
                    this._drawCallsOpaqueCounter.addCount(count, false);
                    return;
                case BABYLON.Render2DContext.RenderModeAlphaTest:
                    this._drawCallsAlphaTestCounter.addCount(count, false);
                    return;
                case BABYLON.Render2DContext.RenderModeTransparent:
                    this._drawCallsTransparentCounter.addCount(count, false);
                    return;
            }
        };
        Canvas2D.prototype._addGroupRenderCount = function (count) {
            if (this._groupRenderCounter) {
                this._groupRenderCounter.addCount(count, false);
            }
        };
        Canvas2D.prototype._addUpdateTransparentDataCount = function (count) {
            if (this._updateTransparentDataCounter) {
                this._updateTransparentDataCounter.addCount(count, false);
            }
        };
        Canvas2D.prototype.addCachedGroupRenderCounter = function (count) {
            if (this._cachedGroupRenderCounter) {
                this._cachedGroupRenderCounter.addCount(count, false);
            }
        };
        Canvas2D.prototype.addUpdateCachedStateCounter = function (count) {
            if (this._updateCachedStateCounter) {
                this._updateCachedStateCounter.addCount(count, false);
            }
        };
        Canvas2D.prototype.addUpdateLayoutCounter = function (count) {
            if (this._updateLayoutCounter) {
                this._updateLayoutCounter.addCount(count, false);
            }
        };
        Canvas2D.prototype.addUpdatePositioningCounter = function (count) {
            if (this._updatePositioningCounter) {
                this._updatePositioningCounter.addCount(count, false);
            }
        };
        Canvas2D.prototype.addupdateLocalTransformCounter = function (count) {
            if (this._updateLocalTransformCounter) {
                this._updateLocalTransformCounter.addCount(count, false);
            }
        };
        Canvas2D.prototype.addUpdateGlobalTransformCounter = function (count) {
            if (this._updateGlobalTransformCounter) {
                this._updateGlobalTransformCounter.addCount(count, false);
            }
        };
        Canvas2D.prototype.addLayoutBoundingInfoUpdateCounter = function (count) {
            if (this._layoutBoundingInfoUpdateCounter) {
                this._layoutBoundingInfoUpdateCounter.addCount(count, false);
            }
        };
        Canvas2D.prototype._updateTrackedNodes = function () {
            // Get the used camera
            var cam = this.scene.cameraToUseForPointers || this.scene.activeCamera;
            // Compute some matrix stuff
            cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(), Canvas2D_1._m);
            var rh = this.engine.getRenderHeight();
            var v = cam.viewport.toGlobal(this.engine.getRenderWidth(), rh);
            var tmpVec3 = Canvas2D_1._tmpVec3;
            var tmpMtx = Canvas2D_1._tmpMtx;
            // Compute the screen position of each group that track a given scene node
            for (var _i = 0, _a = this._trackedGroups; _i < _a.length; _i++) {
                var group = _a[_i];
                if (group.isDisposed) {
                    continue;
                }
                var node = group.trackedNode;
                var worldMtx = node.getWorldMatrix();
                if (group.trackedNodeOffset) {
                    BABYLON.Vector3.TransformCoordinatesToRef(group.trackedNodeOffset, worldMtx, tmpVec3);
                    tmpMtx.copyFrom(worldMtx);
                    worldMtx = tmpMtx;
                    worldMtx.setTranslation(tmpVec3);
                }
                var proj = BABYLON.Vector3.Project(Canvas2D_1._v, worldMtx, Canvas2D_1._m, v);
                // Set the visibility state accordingly, if the position is outside the frustum (well on the Z planes only...) set the group to hidden
                group.levelVisible = proj.z >= 0 && proj.z < 1.0;
                var s = this.scale;
                group.x = Math.round(proj.x / s);
                group.y = Math.round((rh - proj.y) / s);
            }
            // If it's a WorldSpaceCanvas and it's tracking a node, let's update the WSC transformation data
            if (this._trackNode) {
                var rot = null;
                var scale = null;
                var worldmtx = this._trackNode.getWorldMatrix();
                var pos = worldmtx.getTranslation().add(this._trackNodeOffset);
                var wsc = this;
                var wsn = wsc.worldSpaceCanvasNode;
                if (this._trackNodeBillboard) {
                    var viewMtx = cam.getViewMatrix().clone().invert();
                    viewMtx.decompose(Canvas2D_1.tS, Canvas2D_1.tR, Canvas2D_1.tT);
                    rot = Canvas2D_1.tR.clone();
                }
                worldmtx.decompose(Canvas2D_1.tS, Canvas2D_1.tR, Canvas2D_1.tT);
                var mtx = BABYLON.Matrix.Compose(Canvas2D_1.tS, Canvas2D_1.tR, BABYLON.Vector3.Zero());
                pos = worldmtx.getTranslation().add(BABYLON.Vector3.TransformCoordinates(this._trackNodeOffset, mtx));
                if (Canvas2D_1.tS.lengthSquared() !== 1) {
                    scale = Canvas2D_1.tS.clone();
                }
                if (!this._trackNodeBillboard) {
                    rot = Canvas2D_1.tR.clone();
                }
                if (wsn instanceof BABYLON.AbstractMesh) {
                    wsn.position = pos;
                    wsn.rotationQuaternion = rot;
                    if (scale) {
                        wsn.scaling = scale;
                    }
                }
                else {
                    throw new Error("Can't Track another Scene Node Type than AbstractMesh right now, call me lazy!");
                }
            }
        };
        /**
         * Call this method change you want to have layout related data computed and up to date (layout area, primitive area, local/global transformation matrices)
         */
        Canvas2D.prototype.updateCanvasLayout = function (forceRecompute) {
            this._updateCanvasState(forceRecompute);
        };
        Canvas2D.prototype._updateAdaptiveSizeWorldCanvas = function () {
            if (this._globalTransformStep < 2) {
                return;
            }
            var n = this.worldSpaceCanvasNode;
            var bi = n.getBoundingInfo().boundingBox;
            var v = bi.vectorsWorld;
            var cam = this.scene.cameraToUseForPointers || this.scene.activeCamera;
            cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(), Canvas2D_1._m);
            var vp = cam.viewport.toGlobal(this.engine.getRenderWidth(), this.engine.getRenderHeight());
            var projPoints = new Array(4);
            for (var i = 0; i < 4; i++) {
                projPoints[i] = BABYLON.Vector3.Project(v[i], Canvas2D_1._mI, Canvas2D_1._m, vp);
            }
            var left = projPoints[3].subtract(projPoints[0]).length();
            var top = projPoints[3].subtract(projPoints[1]).length();
            var right = projPoints[1].subtract(projPoints[2]).length();
            var bottom = projPoints[2].subtract(projPoints[0]).length();
            var w = Math.round(Math.max(top, bottom));
            var h = Math.round(Math.max(right, left));
            var isW = w > h;
            // Basically if it's under 256 we use 256, otherwise we take the biggest power of 2
            var edge = Math.max(w, h);
            if (edge < 256) {
                edge = 256;
            }
            else {
                edge = Math.pow(2, Math.ceil(Math.log(edge) / Math.log(2)));
            }
            // Clip values if needed
            edge = Math.min(edge, this._maxAdaptiveWorldSpaceCanvasSize);
            var newScale = edge / ((isW) ? this.size.width : this.size.height);
            if (newScale !== this.scale) {
                var scale = newScale;
                //                console.log(`New adaptive scale for Canvas ${this.id}, w: ${w}, h: ${h}, scale: ${scale}, edge: ${edge}, isW: ${isW}`);
                this._setRenderingScale(scale);
            }
        };
        Canvas2D.prototype._updateCanvasState = function (forceRecompute) {
            // Check if the update has already been made for this render Frame
            if (!forceRecompute && this.scene.getRenderId() === this._updateRenderId) {
                return;
            }
            // Detect a change of rendering size
            var renderingSizeChanged = false;
            var newWidth = this.engine.getRenderWidth();
            if (newWidth !== this._renderingSize.width) {
                renderingSizeChanged = true;
            }
            this._renderingSize.width = newWidth;
            var newHeight = this.engine.getRenderHeight();
            if (newHeight !== this._renderingSize.height) {
                renderingSizeChanged = true;
            }
            this._renderingSize.height = newHeight;
            // If the canvas fit the rendering size and it changed, update
            if (renderingSizeChanged && this._fitRenderingDevice) {
                this.size = this._renderingSize.clone();
                if (this._background) {
                    this._background.size = this.size;
                }
                // Dirty the Layout at the Canvas level to recompute as the size changed
                this._setLayoutDirty();
            }
            // If there's a design size, update the scale according to the renderingSize
            if (this._designSize) {
                var scale = void 0;
                if (this._designUseHorizAxis) {
                    scale = this._renderingSize.width / this._designSize.width;
                }
                else {
                    scale = this._renderingSize.height / this._designSize.height;
                }
                this.size = this._designSize.clone();
                this.scale = scale;
            }
            var context = new BABYLON.PrepareRender2DContext();
            ++this._globalTransformProcessStep;
            this.updateCachedStates(false);
            this._prepareGroupRender(context);
            this._updateRenderId = this.scene.getRenderId();
        };
        /**
         * Method that renders the Canvas, you should not invoke
         */
        Canvas2D.prototype._render = function () {
            this._initPerfMetrics();
            if (this._renderObservable && this._renderObservable.hasObservers()) {
                this._renderObservable.notifyObservers(this, Canvas2D_1.RENDEROBSERVABLE_PRE);
            }
            this._updateCanvasState(false);
            this._updateTrackedNodes();
            // Nothing to do is the Canvas is not visible
            if (this.isVisible === false) {
                return;
            }
            if (!this._isScreenSpace) {
                this._updateAdaptiveSizeWorldCanvas();
            }
            this._updateCanvasState(false);
            if (this._primitiveCollisionManager) {
                this._primitiveCollisionManager._update();
            }
            if (this._primPointerInfo.canvasPointerPos) {
                this._updateIntersectionList(this._primPointerInfo.canvasPointerPos, false, false);
                this._updateOverStatus(false);
            }
            this.engine.setState(false, undefined, true);
            this._groupRender();
            if (!this._isScreenSpace) {
                if (this._isFlagSet(BABYLON.SmartPropertyPrim.flagWorldCacheChanged)) {
                    this.worldSpaceCacheChanged();
                    this._clearFlags(BABYLON.SmartPropertyPrim.flagWorldCacheChanged);
                }
            }
            // If the canvas is cached at canvas level, we must manually render the sprite that will display its content
            if (this._cachingStrategy === Canvas2D_1.CACHESTRATEGY_CANVAS && this._cachedCanvasGroup) {
                this._cachedCanvasGroup._renderCachedCanvas();
            }
            this._fetchPerfMetrics();
            this._updateProfileCanvas();
            if (this._renderObservable && this._renderObservable.hasObservers()) {
                this._renderObservable.notifyObservers(this, Canvas2D_1.RENDEROBSERVABLE_POST);
            }
        };
        /**
         * Internal method that allocate a cache for the given group.
         * Caching is made using a collection of MapTexture where many groups have their bitmap cache stored inside.
         * @param group The group to allocate the cache of.
         * @return custom type with the PackedRect instance giving information about the cache location into the texture and also the MapTexture instance that stores the cache.
         */
        Canvas2D.prototype._allocateGroupCache = function (group, parent, minSize, useMipMap, anisotropicLevel) {
            if (useMipMap === void 0) { useMipMap = false; }
            if (anisotropicLevel === void 0) { anisotropicLevel = 1; }
            var key = (useMipMap ? "MipMap" : "NoMipMap") + "_" + anisotropicLevel;
            var rd = group._renderableData;
            var noResizeScale = rd._noResizeOnScale;
            var isCanvas = parent == null;
            var scale;
            if (noResizeScale) {
                scale = isCanvas ? Canvas2D_1._unS : group.parent.actualScale;
            }
            else {
                scale = group.actualScale;
            }
            // Determine size
            var size = group.actualSize;
            size = new BABYLON.Size(Math.ceil(size.width * scale.x), Math.ceil(size.height * scale.y));
            var originalSize = size.clone();
            if (minSize) {
                size.width = Math.max(minSize.width, size.width);
                size.height = Math.max(minSize.height, size.height);
            }
            var mapArray = this._groupCacheMaps.getOrAddWithFactory(key, function () { return new Array(); });
            // Try to find a spot in one of the cached texture
            var res = null;
            var map;
            for (var _i = 0, mapArray_1 = mapArray; _i < mapArray_1.length; _i++) {
                var _map = mapArray_1[_i];
                map = _map;
                var node = map.allocateRect(size);
                if (node) {
                    res = { node: node, texture: map };
                    break;
                }
            }
            // Couldn't find a map that could fit the rect, create a new map for it
            if (!res) {
                var mapSize = new BABYLON.Size(Canvas2D_1._groupTextureCacheSize, Canvas2D_1._groupTextureCacheSize);
                // Check if the predefined size would fit, other create a custom size using the nearest bigger power of 2
                if (size.width > mapSize.width || size.height > mapSize.height) {
                    mapSize.width = Math.pow(2, Math.ceil(Math.log(size.width) / Math.log(2)));
                    mapSize.height = Math.pow(2, Math.ceil(Math.log(size.height) / Math.log(2)));
                }
                var id = "groupsMapChache" + this._mapCounter++ + "forCanvas" + this.id;
                map = new BABYLON.MapTexture(id, this._scene, mapSize, useMipMap ? BABYLON.Texture.TRILINEAR_SAMPLINGMODE : BABYLON.Texture.BILINEAR_SAMPLINGMODE, useMipMap);
                map.hasAlpha = true;
                map.anisotropicFilteringLevel = 4;
                mapArray.splice(0, 0, map);
                var node = map.allocateRect(size);
                res = { node: node, texture: map };
            }
            // Check if we have to create a Sprite that will display the content of the Canvas which is cached.
            // Don't do it in case of the group being a worldspace canvas (because its texture is bound to a WorldSpaceCanvas node)
            if (group !== this || this._isScreenSpace) {
                var node = res.node;
                // Special case if the canvas is entirely cached: create a group that will have a single sprite it will be rendered specifically at the very end of the rendering process
                var sprite = void 0;
                if (this._cachingStrategy === Canvas2D_1.CACHESTRATEGY_CANVAS) {
                    if (this._cachedCanvasGroup) {
                        this._cachedCanvasGroup.dispose();
                    }
                    this._cachedCanvasGroup = BABYLON.Group2D._createCachedCanvasGroup(this);
                    sprite = new BABYLON.Sprite2D(map, { parent: this._cachedCanvasGroup, id: "__cachedCanvasSprite__", spriteSize: originalSize, spriteLocation: node.pos });
                    sprite.zOrder = 1;
                    sprite.origin = BABYLON.Vector2.Zero();
                }
                else {
                    sprite = new BABYLON.Sprite2D(map, { parent: parent, id: "__cachedSpriteOfGroup__" + group.id, x: group.actualPosition.x, y: group.actualPosition.y, spriteSize: originalSize, spriteLocation: node.pos, dontInheritParentScale: true });
                    sprite.origin = group.origin.clone();
                    sprite.addExternalData("__cachedGroup__", group);
                    sprite.pointerEventObservable.add(function (e, s) {
                        if (group.pointerEventObservable !== null) {
                            group.pointerEventObservable.notifyObservers(e, s.mask);
                        }
                    });
                    res.sprite = sprite;
                }
                if (sprite && noResizeScale) {
                    var relScale = isCanvas ? group.actualScale : group.actualScale.divide(group.parent.actualScale);
                    sprite.scaleX = relScale.x;
                    sprite.scaleY = relScale.y;
                }
            }
            return res;
        };
        /**
         * Internal method used to register a Scene Node to track position for the given group
         * Do not invoke this method, for internal purpose only.
         * @param group the group to track its associated Scene Node
         */
        Canvas2D.prototype._registerTrackedNode = function (group) {
            if (group._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                return;
            }
            if (!this._trackedGroups) {
                this._trackedGroups = new Array();
            }
            this._trackedGroups.push(group);
            group._setFlags(BABYLON.SmartPropertyPrim.flagTrackedGroup);
        };
        /**
         * Internal method used to unregister a tracked Scene Node
         * Do not invoke this method, it's for internal purpose only.
         * @param group the group to unregister its tracked Scene Node from.
         */
        Canvas2D.prototype._unregisterTrackedNode = function (group) {
            if (!group._isFlagSet(BABYLON.SmartPropertyPrim.flagTrackedGroup)) {
                return;
            }
            var i = this._trackedGroups.indexOf(group);
            if (i !== -1) {
                this._trackedGroups.splice(i, 1);
            }
            group._clearFlags(BABYLON.SmartPropertyPrim.flagTrackedGroup);
        };
        /**
         * Get a Solid Color Brush instance matching the given color.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBrush2D class that use the given color
         */
        Canvas2D.GetSolidColorBrush = function (color) {
            return Canvas2D_1._solidColorBrushes.getOrAddWithFactory(color.toHexString(), function () { return new BABYLON.SolidColorBrush2D(color.clone(), true); });
        };
        /**
         * Get a Solid Color Brush instance matching the given color expressed as a CSS formatted hexadecimal value.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBrush2D class that uses the given color
         */
        Canvas2D.GetSolidColorBrushFromHex = function (hexValue) {
            return Canvas2D_1._solidColorBrushes.getOrAddWithFactory(hexValue, function () { return new BABYLON.SolidColorBrush2D(BABYLON.Color4.FromHexString(hexValue), true); });
        };
        /**
         * Get a Gradient Color Brush
         * @param color1 starting color
         * @param color2 engine color
         * @param translation translation vector to apply. default is [0;0]
         * @param rotation rotation in radian to apply to the brush, initial direction is top to bottom. rotation is counter clockwise. default is 0.
         * @param scale scaling factor to apply. default is 1.
         */
        Canvas2D.GetGradientColorBrush = function (color1, color2, translation, rotation, scale) {
            if (translation === void 0) { translation = BABYLON.Vector2.Zero(); }
            if (rotation === void 0) { rotation = 0; }
            if (scale === void 0) { scale = 1; }
            return Canvas2D_1._gradientColorBrushes.getOrAddWithFactory(BABYLON.GradientColorBrush2D.BuildKey(color1, color2, translation, rotation, scale), function () { return new BABYLON.GradientColorBrush2D(color1, color2, translation, rotation, scale, true); });
        };
        /**
         * Create a solid or gradient brush from a string value.
         * @param brushString should be either
         *  - "solid: #RRGGBBAA" or "#RRGGBBAA"
         *  - "gradient: #FF808080, #FFFFFFF[, [10:20], 180, 1]" for color1, color2, translation, rotation (degree), scale. The last three are optionals, but if specified must be is this order. "gradient:" can be omitted.
         */
        Canvas2D.GetBrushFromString = function (brushString) {
            // Note: yes, I hate/don't know RegEx.. Feel free to add your contribution to the cause!
            brushString = brushString.trim();
            var split = brushString.split(",");
            // Solid, formatted as: "[solid:]#FF808080"
            if (split.length === 1) {
                var value = null;
                if (brushString.indexOf("solid:") === 0) {
                    value = brushString.substr(6).trim();
                }
                else if (brushString.indexOf("#") === 0) {
                    value = brushString;
                }
                else {
                    return null;
                }
                return Canvas2D_1.GetSolidColorBrushFromHex(value);
            }
            else {
                if (split[0].indexOf("gradient:") === 0) {
                    split[0] = split[0].substr(9).trim();
                }
                try {
                    var start = BABYLON.Color4.FromHexString(split[0].trim());
                    var end = BABYLON.Color4.FromHexString(split[1].trim());
                    var t = BABYLON.Vector2.Zero();
                    if (split.length > 2) {
                        var v = split[2].trim();
                        if (v.charAt(0) !== "[" || v.charAt(v.length - 1) !== "]") {
                            return null;
                        }
                        var sep = v.indexOf(":");
                        var x = parseFloat(v.substr(1, sep));
                        var y = parseFloat(v.substr(sep + 1, v.length - (sep + 1)));
                        t = new BABYLON.Vector2(x, y);
                    }
                    var r = 0;
                    if (split.length > 3) {
                        r = BABYLON.Tools.ToRadians(parseFloat(split[3].trim()));
                    }
                    var s = 1;
                    if (split.length > 4) {
                        s = parseFloat(split[4].trim());
                    }
                    return Canvas2D_1.GetGradientColorBrush(start, end, t, r, s);
                }
                catch (e) {
                    return null;
                }
            }
        };
        return Canvas2D;
    }(BABYLON.Group2D));
    /**
     * In this strategy only the direct children groups of the Canvas will be cached, their whole content (whatever the sub groups they have) into a single bitmap.
     * This strategy doesn't allow primitives added directly as children of the Canvas.
     * You typically want to use this strategy of a screenSpace fullscreen canvas: you don't want a bitmap cache taking the whole screen resolution but still want the main contents (say UI in the topLeft and rightBottom for instance) to be efficiently cached.
     */
    Canvas2D.CACHESTRATEGY_TOPLEVELGROUPS = 1;
    /**
     * In this strategy each group will have its own cache bitmap (except if a given group explicitly defines the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors).
     * This strategy is typically used if the canvas has some groups that are frequently animated. Unchanged ones will have a steady cache and the others will be refreshed when they change, reducing the redraw operation count to their content only.
     * When using this strategy, group instances can rely on the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors to minimize the amount of cached bitmaps.
     * Note that in this mode the Canvas itself is not cached, it only contains the sprites of its direct children group to render, there's no point to cache the whole canvas, sprites will be rendered pretty efficiently, the memory cost would be too great for the value of it.
     */
    Canvas2D.CACHESTRATEGY_ALLGROUPS = 2;
    /**
     * In this strategy the whole canvas is cached into a single bitmap containing every primitives it owns, at the exception of the ones that are owned by a group having the DONTCACHEOVERRIDE behavior (these primitives will be directly drawn to the viewport at each render for screenSpace Canvas or be part of the Canvas cache bitmap for worldSpace Canvas).
     */
    Canvas2D.CACHESTRATEGY_CANVAS = 3;
    /**
     * This strategy is used to recompose/redraw the canvas entirely at each viewport render.
     * Use this strategy if memory is a concern above rendering performances and/or if the canvas is frequently animated (hence reducing the benefits of caching).
     * Note that you can't use this strategy for WorldSpace Canvas, they need at least a top level group caching.
     */
    Canvas2D.CACHESTRATEGY_DONTCACHE = 4;
    /**
     * Observable Mask to be notified before rendering is made
     */
    Canvas2D.RENDEROBSERVABLE_PRE = 1;
    /**
     * Observable Mask to be notified after rendering is made
     */
    Canvas2D.RENDEROBSERVABLE_POST = 2;
    Canvas2D._INSTANCES = [];
    Canvas2D._zMinDelta = 1 / (Math.pow(2, 24) - 1);
    Canvas2D._interInfo = new BABYLON.IntersectInfo2D();
    Canvas2D._v = BABYLON.Vector3.Zero(); // Must stay zero
    Canvas2D._m = BABYLON.Matrix.Identity();
    Canvas2D._mI = BABYLON.Matrix.Identity(); // Must stay identity
    Canvas2D.tS = BABYLON.Vector3.Zero();
    Canvas2D.tT = BABYLON.Vector3.Zero();
    Canvas2D.tR = BABYLON.Quaternion.Identity();
    Canvas2D._tmpMtx = BABYLON.Matrix.Identity();
    Canvas2D._tmpVec3 = BABYLON.Vector3.Zero();
    /**
     * Define the default size used for both the width and height of a MapTexture to allocate.
     * Note that some MapTexture might be bigger than this size if the first node to allocate is bigger in width or height
     */
    Canvas2D._groupTextureCacheSize = 1024;
    Canvas2D._solidColorBrushes = new BABYLON.StringDictionary();
    Canvas2D._gradientColorBrushes = new BABYLON.StringDictionary();
    Canvas2D = Canvas2D_1 = __decorate([
        BABYLON.className("Canvas2D", "BABYLON")
    ], Canvas2D);
    BABYLON.Canvas2D = Canvas2D;
    var WorldSpaceCanvas2D = (function (_super) {
        __extends(WorldSpaceCanvas2D, _super);
        /**
         * Create a new 2D WorldSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a world transformation information to place it in the world space.
         * This kind of canvas can't have its Primitives directly drawn in the Viewport, they need to be cached in a bitmap at some point, as a consequence the DONT_CACHE strategy is unavailable. For now only CACHESTRATEGY_CANVAS is supported, but the remaining strategies will be soon.
         * @param scene the Scene that owns the Canvas
         * @param size the dimension of the Canvas in World Space
         * @param settings a combination of settings, possible ones are
         * - children: an array of direct children primitives
         * - id: a text identifier, for information purpose only, default is null.
         * - unitScaleFactor: if specified the created canvas will be with a width of size.width*unitScaleFactor and a height of size.height.unitScaleFactor. If not specified, the unit of 1 is used. You can use this setting when you're dealing with a 3D world with small coordinates and you need a Canvas having bigger coordinates (typically to display text with better quality).
         * - worldPosition the position of the Canvas in World Space, default is [0,0,0]
         * - worldRotation the rotation of the Canvas in World Space, default is Quaternion.Identity()
         * - trackNode: if you want the WorldSpaceCanvas to track the position/rotation/scale of a given Scene Node, use this setting to specify the Node to track
         * - trackNodeOffset: if you use trackNode you may want to specify a 3D Offset to apply to shift the Canvas
         * - trackNodeBillboard: if true the WorldSpaceCanvas will always face the screen
         * - sideOrientation: Unexpected behavior occur if the value is different from Mesh.DEFAULTSIDE right now, so please use this one, which is the default.
         * - cachingStrategy Must be CACHESTRATEGY_CANVAS for now, which is the default.
         * - enableInteraction: if true the pointer events will be listened and rerouted to the appropriate primitives of the Canvas2D through the Prim2DBase.onPointerEventObservable observable property. Default is false (the opposite of ScreenSpace).
         * - isVisible: true if the canvas must be visible, false for hidden. Default is true.
         * - backgroundRoundRadius: the round radius of the background, either backgroundFill or backgroundBorder must be specified.
         * - backgroundFill: the brush to use to create a background fill for the canvas. can be a string value (see Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorder: the brush to use to create a background border for the canvas. can be a string value (see Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorderThickness: if a backgroundBorder is specified, its thickness can be set using this property
         * - customWorldSpaceNode: if specified the Canvas will be rendered in this given Node. But it's the responsibility of the caller to set the "worldSpaceToNodeLocal" property to compute the hit of the mouse ray into the node (in world coordinate system) as well as rendering the cached bitmap in the node itself. The properties cachedRect and cachedTexture of Group2D will give you what you need to do that.
         * - maxAdaptiveCanvasSize: set the max size (width and height) of the bitmap that will contain the cached version of the WorldSpace Canvas. Default is 1024 or less if it's not supported. In any case the value you give will be clipped by the maximum that WebGL supports on the running device. You can set any size, more than 1024 if you want, but testing proved it's a good max value for non "retina" like screens.
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        function WorldSpaceCanvas2D(scene, size, settings) {
            var _this = this;
            BABYLON.Prim2DBase._isCanvasInit = true;
            var s = settings;
            s.isScreenSpace = false;
            if (settings.unitScaleFactor != null) {
                s.size = size.multiplyByFloats(settings.unitScaleFactor, settings.unitScaleFactor);
            }
            else {
                s.size = size.clone();
            }
            settings.cachingStrategy = (settings.cachingStrategy == null) ? Canvas2D.CACHESTRATEGY_CANVAS : settings.cachingStrategy;
            if (settings.cachingStrategy !== Canvas2D.CACHESTRATEGY_CANVAS) {
                throw new Error("Right now only the CACHESTRATEGY_CANVAS cache Strategy is supported for WorldSpace Canvas. More will come soon!");
            }
            _this = _super.call(this, scene, settings) || this;
            BABYLON.Prim2DBase._isCanvasInit = false;
            _this._unitScaleFactor = (settings.unitScaleFactor != null) ? settings.unitScaleFactor : 1;
            _this._renderableData._useMipMap = true;
            _this._renderableData._anisotropicLevel = 8;
            //if (cachingStrategy === Canvas2D.CACHESTRATEGY_DONTCACHE) {
            //    throw new Error("CACHESTRATEGY_DONTCACHE cache Strategy can't be used for WorldSpace Canvas");
            //}
            _this._trackNode = (settings.trackNode != null) ? settings.trackNode : null;
            _this._trackNodeOffset = (settings.trackNodeOffset != null) ? settings.trackNodeOffset : BABYLON.Vector3.Zero();
            _this._trackNodeBillboard = (settings.trackNodeBillboard != null) ? settings.trackNodeBillboard : true;
            var createWorldSpaceNode = !settings || (settings.customWorldSpaceNode == null);
            _this._customWorldSpaceNode = !createWorldSpaceNode;
            var id = settings ? settings.id || null : null;
            // Set the max size of texture allowed for the adaptive render of the world space canvas cached bitmap
            var capMaxTextSize = _this.engine.getCaps().maxRenderTextureSize;
            var defaultTextSize = (Math.min(capMaxTextSize, 1024)); // Default is 1K if allowed otherwise the max allowed
            if (settings.maxAdaptiveCanvasSize == null) {
                _this._maxAdaptiveWorldSpaceCanvasSize = defaultTextSize;
            }
            else {
                // We still clip the given value with the max allowed, the user may not be aware of these limitations
                _this._maxAdaptiveWorldSpaceCanvasSize = Math.min(settings.maxAdaptiveCanvasSize, capMaxTextSize);
            }
            if (createWorldSpaceNode) {
                var plane = new BABYLON.WorldSpaceCanvas2DNode(id, scene, _this);
                var vertexData = BABYLON.VertexData.CreatePlane({
                    width: size.width,
                    height: size.height,
                    sideOrientation: settings && settings.sideOrientation || BABYLON.Mesh.DEFAULTSIDE
                });
                var mtl = new BABYLON.StandardMaterial(id + "_Material", scene);
                _this.applyCachedTexture(vertexData, mtl);
                vertexData.applyToMesh(plane, true);
                mtl.specularColor = new BABYLON.Color3(0, 0, 0);
                mtl.disableLighting = true;
                mtl.useAlphaFromDiffuseTexture = true;
                if (settings && settings.sideOrientation) {
                    mtl.backFaceCulling = (settings.sideOrientation === BABYLON.Mesh.DEFAULTSIDE || settings.sideOrientation === BABYLON.Mesh.FRONTSIDE);
                }
                plane.position = settings && settings.worldPosition || BABYLON.Vector3.Zero();
                plane.rotationQuaternion = settings && settings.worldRotation || BABYLON.Quaternion.Identity();
                plane.material = mtl;
                _this._worldSpaceNode = plane;
            }
            else {
                _this._worldSpaceNode = settings.customWorldSpaceNode;
                _this.applyCachedTexture(null, null);
            }
            _this.propertyChanged.add(function (e, st) {
                if (e.propertyName !== "isVisible") {
                    return;
                }
                var mesh = _this._worldSpaceNode;
                if (mesh) {
                    mesh.isVisible = e.newValue;
                }
            }, BABYLON.Prim2DBase.isVisibleProperty.flagId);
            return _this;
        }
        WorldSpaceCanvas2D.prototype.dispose = function () {
            if (!_super.prototype.dispose.call(this)) {
                return false;
            }
            if (!this._customWorldSpaceNode && this._worldSpaceNode) {
                this._worldSpaceNode.dispose();
                this._worldSpaceNode = null;
            }
        };
        Object.defineProperty(WorldSpaceCanvas2D.prototype, "trackNode", {
            get: function () {
                return this._trackNode;
            },
            set: function (value) {
                if (this._trackNode === value) {
                    return;
                }
                this._trackNode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WorldSpaceCanvas2D.prototype, "trackNodeOffset", {
            get: function () {
                return this._trackNodeOffset;
            },
            set: function (value) {
                if (!this._trackNodeOffset) {
                    this._trackNodeOffset = value.clone();
                }
                else {
                    this._trackNodeOffset.copyFrom(value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WorldSpaceCanvas2D.prototype, "trackNodeBillboard", {
            get: function () {
                return this._trackNodeBillboard;
            },
            set: function (value) {
                this._trackNodeBillboard = value;
            },
            enumerable: true,
            configurable: true
        });
        return WorldSpaceCanvas2D;
    }(Canvas2D));
    WorldSpaceCanvas2D = __decorate([
        BABYLON.className("WorldSpaceCanvas2D", "BABYLON")
    ], WorldSpaceCanvas2D);
    BABYLON.WorldSpaceCanvas2D = WorldSpaceCanvas2D;
    var ScreenSpaceCanvas2D = (function (_super) {
        __extends(ScreenSpaceCanvas2D, _super);
        /**
         * Create a new 2D ScreenSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a position relative to the bottom/left corner of the screen.
         * ScreenSpace Canvas will be drawn in the Viewport as a 2D Layer lying to the top of the 3D Scene. Typically used for traditional UI.
         * All caching strategies will be available.
         * PLEASE NOTE: the origin of a Screen Space Canvas is set to [0;0] (bottom/left) which is different than the default origin of a Primitive which is centered [0.5;0.5]
         * @param scene the Scene that owns the Canvas
         * @param settings a combination of settings, possible ones are
         *  - children: an array of direct children primitives
         *  - id: a text identifier, for information purpose only
         *  - x: the position along the x axis (horizontal), relative to the left edge of the viewport. you can alternatively use the position setting.
         *  - y: the position along the y axis (vertically), relative to the bottom edge of the viewport. you can alternatively use the position setting.
         *  - position: the position of the canvas, relative from the bottom/left of the scene's viewport. Alternatively you can set the x and y properties directly. Default value is [0, 0]
         *  - width: the width of the Canvas. you can alternatively use the size setting.
         *  - height: the height of the Canvas. you can alternatively use the size setting.
         *  - size: the Size of the canvas. Alternatively the width and height properties can be set. If null two behaviors depend on the cachingStrategy: if it's CACHESTRATEGY_CACHECANVAS then it will always auto-fit the rendering device, in all the other modes it will fit the content of the Canvas
         *  - renderingPhase: you can specify for which camera and which renderGroup this canvas will render to enable interleaving of 3D/2D content through the use of renderinGroup. As a rendering Group is rendered for each camera, you have to specify in the scope of which camera you want the canvas' render to be made. Default behavior will render the Canvas at the very end of the render loop.
         *  - designSize: if you want to set the canvas content based on fixed coordinates whatever the final canvas dimension would be, set this. For instance a designSize of 360*640 will give you the possibility to specify all the children element in this frame. The Canvas' true size will be the HTMLCanvas' size: for instance it could be 720*1280, then a uniform scale of 2 will be applied on the Canvas to keep the absolute coordinates working as expecting. If the ratios of the designSize and the true Canvas size are not the same, then the scale is computed following the designUseHorizAxis member by using either the size of the horizontal axis or the vertical axis.
         *  - designUseHorizAxis: you can set this member if you use designSize to specify which axis is priority to compute the scale when the ratio of the canvas' size is different from the designSize's one.
         *  - cachingStrategy: either CACHESTRATEGY_TOPLEVELGROUPS, CACHESTRATEGY_ALLGROUPS, CACHESTRATEGY_CANVAS, CACHESTRATEGY_DONTCACHE. Please refer to their respective documentation for more information. Default is Canvas2D.CACHESTRATEGY_DONTCACHE
         *  - enableInteraction: if true the pointer events will be listened and rerouted to the appropriate primitives of the Canvas2D through the Prim2DBase.onPointerEventObservable observable property. Default is true.
         *  - isVisible: true if the canvas must be visible, false for hidden. Default is true.
         * - backgroundRoundRadius: the round radius of the background, either backgroundFill or backgroundBorder must be specified.
         * - backgroundFill: the brush to use to create a background fill for the canvas. can be a string value (see BABYLON.Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorder: the brush to use to create a background border for the canvas. can be a string value (see BABYLON.Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorderThickness: if a backgroundBorder is specified, its thickness can be set using this property
         * - customWorldSpaceNode: if specified the Canvas will be rendered in this given Node. But it's the responsibility of the caller to set the "worldSpaceToNodeLocal" property to compute the hit of the mouse ray into the node (in world coordinate system) as well as rendering the cached bitmap in the node itself. The properties cachedRect and cachedTexture of Group2D will give you what you need to do that.
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see BABYLON.PrimitiveThickness.fromString)
         */
        function ScreenSpaceCanvas2D(scene, settings) {
            var _this = this;
            BABYLON.Prim2DBase._isCanvasInit = true;
            _this = _super.call(this, scene, settings) || this;
            return _this;
        }
        return ScreenSpaceCanvas2D;
    }(Canvas2D));
    ScreenSpaceCanvas2D = __decorate([
        BABYLON.className("ScreenSpaceCanvas2D", "BABYLON")
    ], ScreenSpaceCanvas2D);
    BABYLON.ScreenSpaceCanvas2D = ScreenSpaceCanvas2D;
    var Canvas2D_1;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
     * This is the class that is used to display a World Space Canvas into a 3D scene
     */
    var WorldSpaceCanvas2DNode = (function (_super) {
        __extends(WorldSpaceCanvas2DNode, _super);
        function WorldSpaceCanvas2DNode(name, scene, canvas) {
            var _this = _super.call(this, name, scene) || this;
            _this._canvas = canvas;
            return _this;
        }
        WorldSpaceCanvas2DNode.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            if (this._canvas) {
                this._canvas.dispose();
                this._canvas = null;
            }
        };
        return WorldSpaceCanvas2DNode;
    }(BABYLON.Mesh));
    BABYLON.WorldSpaceCanvas2DNode = WorldSpaceCanvas2DNode;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Command = (function () {
        function Command(execute, canExecute) {
            if (!execute) {
                throw Error("At least an execute lambda must be given at Command creation time");
            }
            this._canExecuteChanged = null;
            this._lastCanExecuteResult = null;
            this.execute = execute;
            this.canExecute = canExecute;
        }
        Command.prototype.canExecute = function (parameter) {
            var res = true;
            if (this._canExecute) {
                res = this._canExecute(parameter);
            }
            if (res !== this._lastCanExecuteResult) {
                if (this._canExecuteChanged && this._canExecuteChanged.hasObservers()) {
                    this._canExecuteChanged.notifyObservers(null);
                }
                this._lastCanExecuteResult = res;
            }
            return res;
        };
        Command.prototype.execute = function (parameter) {
            this._execute(parameter);
        };
        Object.defineProperty(Command.prototype, "canExecuteChanged", {
            get: function () {
                if (!this._canExecuteChanged) {
                    this._canExecuteChanged = new BABYLON.Observable();
                }
                return this._canExecuteChanged;
            },
            enumerable: true,
            configurable: true
        });
        return Command;
    }());
    BABYLON.Command = Command;
    var UIElement = (function (_super) {
        __extends(UIElement, _super);
        function UIElement(settings) {
            var _this = _super.call(this) || this;
            if (!settings) {
                throw Error("A settings object must be passed with at least either a parent or owner parameter");
            }
            var type = BABYLON.Tools.getFullClassName(_this);
            _this._ownerWindow = null;
            _this._parent = null;
            _this._visualPlaceholder = null;
            _this._visualTemplateRoot = null;
            _this._visualChildrenPlaceholder = null;
            _this._hierarchyDepth = 0;
            _this._renderingTemplateName = (settings.templateName != null) ? settings.templateName : GUIManager.DefaultTemplateName;
            _this._style = (settings.styleName != null) ? GUIManager.getStyle(type, settings.styleName) : null;
            _this._flags = 0;
            _this._id = (settings.id != null) ? settings.id : null;
            _this._uid = null;
            _this._width = (settings.width != null) ? settings.width : null;
            _this._height = (settings.height != null) ? settings.height : null;
            _this._minWidth = (settings.minWidth != null) ? settings.minWidth : 0;
            _this._minHeight = (settings.minHeight != null) ? settings.minHeight : 0;
            _this._maxWidth = (settings.maxWidth != null) ? settings.maxWidth : Number.MAX_VALUE;
            _this._maxHeight = (settings.maxHeight != null) ? settings.maxHeight : Number.MAX_VALUE;
            _this._margin = null;
            _this._padding = null;
            _this._marginAlignment = null;
            _this._setFlags(UIElement.flagIsVisible | UIElement.flagIsEnabled);
            // Default Margin Alignment for UIElement is stretch for horizontal/vertical and not left/bottom (which is the default for Canvas2D Primitives)
            //this.marginAlignment.horizontal = PrimitiveAlignment.AlignStretch;
            //this.marginAlignment.vertical   = PrimitiveAlignment.AlignStretch;
            // Set the layout/margin stuffs
            if (settings.marginTop) {
                _this.margin.setTop(settings.marginTop);
            }
            if (settings.marginLeft) {
                _this.margin.setLeft(settings.marginLeft);
            }
            if (settings.marginRight) {
                _this.margin.setRight(settings.marginRight);
            }
            if (settings.marginBottom) {
                _this.margin.setBottom(settings.marginBottom);
            }
            if (settings.margin) {
                if (typeof settings.margin === "string") {
                    _this.margin.fromString(settings.margin);
                }
                else {
                    _this.margin.fromUniformPixels(settings.margin);
                }
            }
            if (settings.marginHAlignment) {
                _this.marginAlignment.horizontal = settings.marginHAlignment;
            }
            if (settings.marginVAlignment) {
                _this.marginAlignment.vertical = settings.marginVAlignment;
            }
            if (settings.marginAlignment) {
                _this.marginAlignment.fromString(settings.marginAlignment);
            }
            if (settings.paddingTop) {
                _this.padding.setTop(settings.paddingTop);
            }
            if (settings.paddingLeft) {
                _this.padding.setLeft(settings.paddingLeft);
            }
            if (settings.paddingRight) {
                _this.padding.setRight(settings.paddingRight);
            }
            if (settings.paddingBottom) {
                _this.padding.setBottom(settings.paddingBottom);
            }
            if (settings.padding) {
                _this.padding.fromString(settings.padding);
            }
            if (settings.paddingHAlignment) {
                _this.paddingAlignment.horizontal = settings.paddingHAlignment;
            }
            if (settings.paddingVAlignment) {
                _this.paddingAlignment.vertical = settings.paddingVAlignment;
            }
            if (settings.paddingAlignment) {
                _this.paddingAlignment.fromString(settings.paddingAlignment);
            }
            if (settings.parent != null) {
                _this._parent = settings.parent;
                _this._hierarchyDepth = _this._parent._hierarchyDepth + 1;
            }
            return _this;
        }
        Object.defineProperty(UIElement, "enabledState", {
            get: function () {
                return UIElement._enableState;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement, "disabledState", {
            get: function () {
                return UIElement._disabledState;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement, "mouseOverState", {
            get: function () {
                return UIElement._mouseOverState;
            },
            enumerable: true,
            configurable: true
        });
        UIElement.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            if (this._renderingTemplate) {
                this._renderingTemplate.detach();
                this._renderingTemplate = null;
            }
            _super.prototype.dispose.call(this);
            // Don't set to null, it may upset somebody...
            this.animations.splice(0);
            return true;
        };
        /**
         * Returns as a new array populated with the Animatable used by the primitive. Must be overloaded by derived primitives.
         * Look at Sprite2D for more information
         */
        UIElement.prototype.getAnimatables = function () {
            return new Array();
        };
        // TODO
        // PROPERTIES
        // Style
        // Id
        // Parent/Children
        // ActualWidth/Height, MinWidth/Height, MaxWidth/Height,
        // Alignment/Margin
        // Visibility, IsVisible
        // IsEnabled (is false, control is disabled, no interaction and a specific render state)
        // CacheMode of Visual Elements
        // Focusable/IsFocused
        // IsPointerCaptured, CapturePointer, IsPointerDirectlyOver, IsPointerOver. De-correlate mouse, stylus, touch?
        // ContextMenu
        // Cursor
        // DesiredSize
        // IsInputEnable ?
        // Opacity, OpacityMask ?
        // SnapToDevicePixels
        // Tag
        // ToolTip
        // METHODS
        // BringIntoView (for scrollable content, to move the scroll to bring the given element visible in the parent's area)
        // Capture/ReleaseCapture (mouse, touch, stylus)
        // Focus
        // PointFrom/ToScreen to translate coordinates
        // EVENTS
        // ContextMenuOpening/Closing/Changed
        // DragEnter/LeaveOver, Drop
        // Got/LostFocus
        // IsEnabledChanged
        // IsPointerOver/DirectlyOverChanged
        // IsVisibleChanged
        // KeyDown/Up
        // LayoutUpdated ?
        // Pointer related events
        // SizeChanged
        // ToolTipOpening/Closing
        UIElement.prototype.findById = function (id) {
            if (this._id === id) {
                return this;
            }
            var children = this._getChildren();
            for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                var child = children_1[_i];
                var r = child.findById(id);
                if (r != null) {
                    return r;
                }
            }
        };
        Object.defineProperty(UIElement.prototype, "ownerWindow", {
            get: function () {
                return this._ownerWindow;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "style", {
            get: function () {
                if (!this.style) {
                    return GUIManager.DefaultStyleName;
                }
                return this._style.name;
            },
            set: function (value) {
                if (this._style && (this._style.name === value)) {
                    return;
                }
                var newStyle = null;
                if (value) {
                    newStyle = GUIManager.getStyle(BABYLON.Tools.getFullClassName(this), value);
                    if (!newStyle) {
                        throw Error("Couldn't find Style " + value + " for UIElement " + BABYLON.Tools.getFullClassName(this));
                    }
                }
                if (this._style) {
                    this._style.removeStyle(this);
                }
                if (newStyle) {
                    newStyle.applyStyle(this);
                }
                this._style = newStyle;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "id", {
            /**
             * A string that identifies the UIElement.
             * The id is optional and there's possible collision with other UIElement's id as the uniqueness is not supported.
             */
            get: function () {
                return this._id;
            },
            set: function (value) {
                if (this._id === value) {
                    return;
                }
                this._id = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "uid", {
            /**
             * Return a unique id automatically generated.
             * This property is mainly used for serialization to ensure a perfect way of identifying a UIElement
             */
            get: function () {
                if (!this._uid) {
                    this._uid = BABYLON.Tools.RandomId();
                }
                return this._uid;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "hierarchyDepth", {
            get: function () {
                return this._hierarchyDepth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            set: function (value) {
                this._parent = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "width", {
            get: function () {
                return this._width;
            },
            set: function (value) {
                this._width = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                this._height = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "minWidth", {
            get: function () {
                return this._minWidth;
            },
            set: function (value) {
                this._minWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "minHheight", {
            get: function () {
                return this._minHeight;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "minHeight", {
            set: function (value) {
                this._minHeight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "maxWidth", {
            get: function () {
                return this._maxWidth;
            },
            set: function (value) {
                this._maxWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "maxHeight", {
            get: function () {
                return this._maxHeight;
            },
            set: function (value) {
                this._maxHeight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "actualWidth", {
            get: function () {
                return this._actualWidth;
            },
            set: function (value) {
                this._actualWidth = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "actualHeight", {
            get: function () {
                return this._actualHeight;
            },
            set: function (value) {
                this._actualHeight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "margin", {
            get: function () {
                var _this = this;
                if (!this._margin) {
                    this._margin = new BABYLON.PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.margin;
                    });
                }
                return this._margin;
            },
            set: function (value) {
                this.margin.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_hasMargin", {
            get: function () {
                return (this._margin !== null && !this._margin.isDefault) || (this._marginAlignment !== null && !this._marginAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "padding", {
            get: function () {
                var _this = this;
                if (!this._padding) {
                    this._padding = new BABYLON.PrimitiveThickness(function () {
                        if (!_this.parent) {
                            return null;
                        }
                        return _this.parent.padding;
                    });
                }
                return this._padding;
            },
            set: function (value) {
                this.padding.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_hasPadding", {
            get: function () {
                return this._padding !== null && !this._padding.isDefault;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "marginAlignment", {
            get: function () {
                if (!this._marginAlignment) {
                    this._marginAlignment = new BABYLON.PrimitiveAlignment();
                }
                return this._marginAlignment;
            },
            set: function (value) {
                this.marginAlignment.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_hasMarginAlignment", {
            /**
             * Check if there a marginAlignment specified (non null and not default)
             */
            get: function () {
                return (this._marginAlignment !== null && !this._marginAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "paddingAlignment", {
            get: function () {
                if (!this._paddingAlignment) {
                    this._paddingAlignment = new BABYLON.PrimitiveAlignment();
                }
                return this._paddingAlignment;
            },
            set: function (value) {
                this.paddingAlignment.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_hasPaddingAlignment", {
            /**
             * Check if there a marginAlignment specified (non null and not default)
             */
            get: function () {
                return (this._paddingAlignment !== null && !this._paddingAlignment.isDefault);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isVisible", {
            get: function () {
                return this._isFlagSet(UIElement.flagIsVisible);
            },
            set: function (value) {
                if (this.isVisible === value) {
                    return;
                }
                this._visualPlaceholder.levelVisible = value;
                this._changeFlags(UIElement.flagIsVisible, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isEnabled", {
            get: function () {
                return this._isFlagSet(UIElement.flagIsEnabled);
            },
            set: function (value) {
                this._changeFlags(UIElement.flagIsEnabled, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isFocused", {
            get: function () {
                return this._isFlagSet(UIElement.flagIsFocus);
            },
            set: function (value) {
                // If the UIElement doesn't accept focus, set it on its parent
                if (!this.isFocusable) {
                    var p = this.parent;
                    if (!p) {
                        return;
                    }
                    p.isFocused = value;
                }
                // If the focus is being set, notify the Focus Manager
                if (value) {
                    this.ownerWindow.focusManager.setFocusOn(this, this.getFocusScope());
                }
                this._changeFlags(UIElement.flagIsFocus, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isMouseOver", {
            get: function () {
                return this._isFlagSet(UIElement.flagIsMouseOver);
            },
            set: function (value) {
                this._changeFlags(UIElement.flagIsMouseOver, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isFocusScope", {
            get: function () {
                return this._isFlagSet(UIElement.flagIsFocusScope);
            },
            set: function (value) {
                this._changeFlags(UIElement.flagIsFocusScope, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "isFocusable", {
            get: function () {
                return this._isFlagSet(UIElement.flagIsFocusable);
            },
            set: function (value) {
                this._changeFlags(UIElement.flagIsFocusable, value);
            },
            enumerable: true,
            configurable: true
        });
        // Look for the nearest parent which is the focus scope. Should always return something as the Window UIElement which is the root of all UI Tree is focus scope (unless the user disable it)
        UIElement.prototype.getFocusScope = function () {
            if (this.isFocusScope) {
                return this;
            }
            var p = this.parent;
            if (!p) {
                return null;
            }
            return p.getFocusScope();
        };
        /**
         * Check if a given flag is set
         * @param flag the flag value
         * @return true if set, false otherwise
         */
        UIElement.prototype._isFlagSet = function (flag) {
            return (this._flags & flag) !== 0;
        };
        /**
         * Check if all given flags are set
         * @param flags the flags ORed
         * @return true if all the flags are set, false otherwise
         */
        UIElement.prototype._areAllFlagsSet = function (flags) {
            return (this._flags & flags) === flags;
        };
        /**
         * Check if at least one flag of the given flags is set
         * @param flags the flags ORed
         * @return true if at least one flag is set, false otherwise
         */
        UIElement.prototype._areSomeFlagsSet = function (flags) {
            return (this._flags & flags) !== 0;
        };
        /**
         * Clear the given flags
         * @param flags the flags to clear
         */
        UIElement.prototype._clearFlags = function (flags) {
            this._flags &= ~flags;
        };
        /**
         * Set the given flags to true state
         * @param flags the flags ORed to set
         * @return the flags state before this call
         */
        UIElement.prototype._setFlags = function (flags) {
            var cur = this._flags;
            this._flags |= flags;
            return cur;
        };
        /**
         * Change the state of the given flags
         * @param flags the flags ORed to change
         * @param state true to set them, false to clear them
         */
        UIElement.prototype._changeFlags = function (flags, state) {
            if (state) {
                this._flags |= flags;
            }
            else {
                this._flags &= ~flags;
            }
        };
        UIElement.prototype._assignTemplate = function (templateName) {
            if (!templateName) {
                templateName = GUIManager.DefaultTemplateName;
            }
            var className = BABYLON.Tools.getFullClassName(this);
            if (!className) {
                throw Error("Couldn't access class name of this UIElement, you have to decorate the type with the className decorator");
            }
            var factory = GUIManager.getRenderingTemplate(className, templateName);
            if (!factory) {
                throw Error("Couldn't get the renderingTemplate " + templateName + " of class " + className);
            }
            this._renderingTemplateName = templateName;
            this._renderingTemplate = factory();
            this._renderingTemplate.attach(this);
        };
        UIElement.prototype._createVisualTree = function () {
            var parentPrim = this.ownerWindow.canvas;
            if (this.parent) {
                parentPrim = this.parent.visualChildrenPlaceholder;
            }
            if (!this._renderingTemplate) {
                this._assignTemplate(this._renderingTemplateName);
            }
            this._visualPlaceholder = new BABYLON.Group2D({ parent: parentPrim, id: "GUI " + BABYLON.Tools.getClassName(this) + " RootGroup of " + this.id });
            var p = this._visualPlaceholder;
            p.addExternalData("_GUIOwnerElement_", this);
            p.dataSource = this;
            p.createSimpleDataBinding(BABYLON.Prim2DBase.widthProperty, "width", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.heightProperty, "height", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.actualWidthProperty, "actualWidth", BABYLON.DataBinding.MODE_ONEWAYTOSOURCE);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.actualHeightProperty, "actualHeight", BABYLON.DataBinding.MODE_ONEWAYTOSOURCE);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.marginProperty, "margin", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.marginAlignmentProperty, "marginAlignment", BABYLON.DataBinding.MODE_ONEWAY);
            this.createVisualTree();
        };
        UIElement.prototype._patchUIElement = function (ownerWindow, parent) {
            if (ownerWindow) {
                if (!this._ownerWindow) {
                    ownerWindow._registerVisualToBuild(this);
                }
                this._ownerWindow = ownerWindow;
            }
            this._parent = parent;
            if (parent) {
                this._hierarchyDepth = parent.hierarchyDepth + 1;
            }
            var children = this._getChildren();
            if (children) {
                for (var _i = 0, children_2 = children; _i < children_2.length; _i++) {
                    var curChild = children_2[_i];
                    curChild._patchUIElement(ownerWindow, this);
                }
            }
        };
        // Overload the SmartPropertyBase's method to provide the additional logic of returning the parent's dataSource if there's no dataSource specified at this level.
        UIElement.prototype._getDataSource = function () {
            var levelDS = _super.prototype._getDataSource.call(this);
            if (levelDS != null) {
                return levelDS;
            }
            var p = this.parent;
            if (p != null) {
                return p.dataSource;
            }
            return null;
        };
        UIElement.prototype.createVisualTree = function () {
            var res = this._renderingTemplate.createVisualTree(this, this._visualPlaceholder);
            this._visualTemplateRoot = res.root;
            this._visualChildrenPlaceholder = res.contentPlaceholder;
        };
        Object.defineProperty(UIElement.prototype, "visualPlaceholder", {
            get: function () {
                return this._visualPlaceholder;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "visualTemplateRoot", {
            get: function () {
                return this._visualTemplateRoot;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "visualChildrenPlaceholder", {
            get: function () {
                return this._visualChildrenPlaceholder;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UIElement.prototype, "_position", {
            get: function () { return null; } // TODO use abstract keyword when TS 2.0 will be approved
            ,
            enumerable: true,
            configurable: true
        });
        return UIElement;
    }(BABYLON.SmartPropertyBase));
    UIElement.UIELEMENT_PROPCOUNT = 16;
    UIElement.flagVisualToBuild = 0x0000001;
    UIElement.flagIsVisible = 0x0000002;
    UIElement.flagIsFocus = 0x0000004;
    UIElement.flagIsFocusScope = 0x0000008;
    UIElement.flagIsFocusable = 0x0000010;
    UIElement.flagIsEnabled = 0x0000020;
    UIElement.flagIsMouseOver = 0x0000040;
    UIElement._enableState = "Enabled";
    UIElement._disabledState = "Disabled";
    UIElement._mouseOverState = "MouseOver";
    __decorate([
        BABYLON.dependencyProperty(0, function (pi) { return UIElement.parentProperty = pi; })
    ], UIElement.prototype, "parent", null);
    __decorate([
        BABYLON.dependencyProperty(1, function (pi) { return UIElement.widthProperty = pi; })
    ], UIElement.prototype, "width", null);
    __decorate([
        BABYLON.dependencyProperty(2, function (pi) { return UIElement.heightProperty = pi; })
    ], UIElement.prototype, "height", null);
    __decorate([
        BABYLON.dependencyProperty(3, function (pi) { return UIElement.minWidthProperty = pi; })
    ], UIElement.prototype, "minWidth", null);
    __decorate([
        BABYLON.dependencyProperty(4, function (pi) { return UIElement.minHeightProperty = pi; })
    ], UIElement.prototype, "minHheight", null);
    __decorate([
        BABYLON.dependencyProperty(5, function (pi) { return UIElement.maxWidthProperty = pi; })
    ], UIElement.prototype, "maxWidth", null);
    __decorate([
        BABYLON.dependencyProperty(6, function (pi) { return UIElement.maxHeightProperty = pi; })
    ], UIElement.prototype, "maxHeight", null);
    __decorate([
        BABYLON.dependencyProperty(7, function (pi) { return UIElement.actualWidthProperty = pi; })
    ], UIElement.prototype, "actualWidth", null);
    __decorate([
        BABYLON.dependencyProperty(8, function (pi) { return UIElement.actualHeightProperty = pi; })
    ], UIElement.prototype, "actualHeight", null);
    __decorate([
        BABYLON.dynamicLevelProperty(9, function (pi) { return UIElement.marginProperty = pi; })
    ], UIElement.prototype, "margin", null);
    __decorate([
        BABYLON.dynamicLevelProperty(10, function (pi) { return UIElement.paddingProperty = pi; })
    ], UIElement.prototype, "padding", null);
    __decorate([
        BABYLON.dynamicLevelProperty(11, function (pi) { return UIElement.marginAlignmentProperty = pi; })
    ], UIElement.prototype, "marginAlignment", null);
    __decorate([
        BABYLON.dynamicLevelProperty(12, function (pi) { return UIElement.paddingAlignmentProperty = pi; })
    ], UIElement.prototype, "paddingAlignment", null);
    __decorate([
        BABYLON.dynamicLevelProperty(13, function (pi) { return UIElement.isEnabledProperty = pi; })
    ], UIElement.prototype, "isEnabled", null);
    __decorate([
        BABYLON.dynamicLevelProperty(14, function (pi) { return UIElement.isFocusedProperty = pi; })
    ], UIElement.prototype, "isFocused", null);
    __decorate([
        BABYLON.dynamicLevelProperty(15, function (pi) { return UIElement.isMouseOverProperty = pi; })
    ], UIElement.prototype, "isMouseOver", null);
    BABYLON.UIElement = UIElement;
    var UIElementStyle = (function () {
        function UIElementStyle() {
        }
        Object.defineProperty(UIElementStyle.prototype, "name", {
            get: function () { return null; } // TODO use abstract keyword when TS 2.0 will be approved
            ,
            enumerable: true,
            configurable: true
        });
        return UIElementStyle;
    }());
    BABYLON.UIElementStyle = UIElementStyle;
    var GUIManager = (function () {
        function GUIManager() {
        }
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        // DATA TEMPLATE MANAGER
        GUIManager.registerDataTemplate = function (className, factory) {
        };
        // DATA TEMPLATE MANAGER
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        // STYLE MANAGER
        GUIManager.getStyle = function (uiElType, styleName) {
            var styles = GUIManager.stylesByUIElement.get(uiElType);
            if (!styles) {
                throw Error("The type " + uiElType + " is unknown, no style were registered for it.");
            }
            var style = styles.get(styleName);
            if (!style) {
                throw Error("Couldn't find Template " + styleName + " of UIElement type " + uiElType);
            }
            return style;
        };
        GUIManager.registerStyle = function (uiElType, templateName, style) {
            var templates = GUIManager.stylesByUIElement.getOrAddWithFactory(uiElType, function () { return new BABYLON.StringDictionary(); });
            if (templates.contains(templateName)) {
                templates[templateName] = style;
            }
            else {
                templates.add(templateName, style);
            }
        };
        Object.defineProperty(GUIManager, "DefaultStyleName", {
            get: function () {
                return GUIManager._defaultStyleName;
            },
            set: function (value) {
                GUIManager._defaultStyleName = value;
            },
            enumerable: true,
            configurable: true
        });
        // STYLE MANAGER
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        // RENDERING TEMPLATE MANAGER
        GUIManager.getRenderingTemplate = function (uiElType, templateName) {
            var templates = GUIManager.renderingTemplatesByUIElement.get(uiElType);
            if (!templates) {
                throw Error("The type " + uiElType + " is unknown, no Rendering Template were registered for it.");
            }
            var templateFactory = templates.get(templateName);
            if (!templateFactory) {
                throw Error("Couldn't find Template " + templateName + " of UI Element type " + uiElType);
            }
            return templateFactory;
        };
        GUIManager.registerRenderingTemplate = function (uiElType, templateName, factory) {
            var templates = GUIManager.renderingTemplatesByUIElement.getOrAddWithFactory(uiElType, function () { return new BABYLON.StringDictionary(); });
            if (templates.contains(templateName)) {
                templates[templateName] = factory;
            }
            else {
                templates.add(templateName, factory);
            }
        };
        Object.defineProperty(GUIManager, "DefaultTemplateName", {
            get: function () {
                return GUIManager._defaultTemplateName;
            },
            set: function (value) {
                GUIManager._defaultTemplateName = value;
            },
            enumerable: true,
            configurable: true
        });
        return GUIManager;
    }());
    GUIManager.stylesByUIElement = new BABYLON.StringDictionary();
    GUIManager.renderingTemplatesByUIElement = new BABYLON.StringDictionary();
    // RENDERING TEMPLATE MANAGER
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    GUIManager._defaultTemplateName = "Default";
    GUIManager._defaultStyleName = "Default";
    BABYLON.GUIManager = GUIManager;
    var UIElementRenderingTemplateBase = (function () {
        function UIElementRenderingTemplateBase() {
        }
        UIElementRenderingTemplateBase.prototype.attach = function (owner) {
            this._owner = owner;
        };
        UIElementRenderingTemplateBase.prototype.detach = function () {
        };
        Object.defineProperty(UIElementRenderingTemplateBase.prototype, "owner", {
            get: function () {
                return this._owner;
            },
            enumerable: true,
            configurable: true
        });
        return UIElementRenderingTemplateBase;
    }());
    BABYLON.UIElementRenderingTemplateBase = UIElementRenderingTemplateBase;
    function registerWindowRenderingTemplate(uiElType, templateName, factory) {
        return function () {
            GUIManager.registerRenderingTemplate(uiElType, templateName, factory);
        };
    }
    BABYLON.registerWindowRenderingTemplate = registerWindowRenderingTemplate;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var StackPanel = StackPanel_1 = (function (_super) {
        __extends(StackPanel, _super);
        function StackPanel(settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _this = _super.call(this, settings) || this;
            _this.isOrientationHorizontal = (settings.isOrientationHorizontal == null) ? true : settings.isOrientationHorizontal;
            _this._children = new Array();
            if (settings.children != null) {
                for (var _i = 0, _a = settings.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    _this._children.push(child);
                }
            }
            return _this;
        }
        Object.defineProperty(StackPanel.prototype, "isOrientationHorizontal", {
            get: function () {
                return this._isOrientationHorizontal;
            },
            set: function (value) {
                this._isOrientationHorizontal = value;
            },
            enumerable: true,
            configurable: true
        });
        StackPanel.prototype.createVisualTree = function () {
            _super.prototype.createVisualTree.call(this);
            // A StackPanel Control has a Group2D, child of the visualPlaceHolder, which is the Children placeholder.
            // The Children UIElement Tree will be create inside this placeholder.
            this._childrenPlaceholder = new BABYLON.Group2D({ parent: this._visualPlaceholder, id: "StackPanel Children Placeholder of " + this.id });
            var p = this._childrenPlaceholder;
            p.layoutEngine = this.isOrientationHorizontal ? BABYLON.StackPanelLayoutEngine.Horizontal : BABYLON.StackPanelLayoutEngine.Vertical;
            // The UIElement padding properties (padding and paddingAlignment) are bound to the Group2D Children placeholder, we bound to the Margin properties as the Group2D acts as an inner element already, so margin of inner is padding.
            p.dataSource = this;
            p.createSimpleDataBinding(BABYLON.Prim2DBase.marginProperty, "padding", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.marginAlignmentProperty, "paddingAlignment", BABYLON.DataBinding.MODE_ONEWAY);
            // The UIElement set the childrenPlaceholder with the visual returned by the renderingTemplate.
            // But it's not the case for a StackPanel, the placeholder of UIElement Children (the content)
            this._visualChildrenPlaceholder = this._childrenPlaceholder;
        };
        Object.defineProperty(StackPanel.prototype, "children", {
            get: function () {
                return this._children;
            },
            enumerable: true,
            configurable: true
        });
        StackPanel.prototype._getChildren = function () {
            return this.children;
        };
        return StackPanel;
    }(BABYLON.UIElement));
    StackPanel.STACKPANEL_PROPCOUNT = BABYLON.UIElement.UIELEMENT_PROPCOUNT + 3;
    __decorate([
        BABYLON.dependencyProperty(StackPanel_1.STACKPANEL_PROPCOUNT + 0, function (pi) { return StackPanel_1.orientationHorizontalProperty = pi; })
    ], StackPanel.prototype, "isOrientationHorizontal", null);
    StackPanel = StackPanel_1 = __decorate([
        BABYLON.className("StackPanel", "BABYLON")
    ], StackPanel);
    BABYLON.StackPanel = StackPanel;
    var DefaultStackPanelRenderingTemplate = DefaultStackPanelRenderingTemplate_1 = (function (_super) {
        __extends(DefaultStackPanelRenderingTemplate, _super);
        function DefaultStackPanelRenderingTemplate() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DefaultStackPanelRenderingTemplate.prototype.createVisualTree = function (owner, visualPlaceholder) {
            return { root: visualPlaceholder, contentPlaceholder: visualPlaceholder };
        };
        DefaultStackPanelRenderingTemplate.prototype.attach = function (owner) {
            _super.prototype.attach.call(this, owner);
        };
        return DefaultStackPanelRenderingTemplate;
    }(BABYLON.UIElementRenderingTemplateBase));
    DefaultStackPanelRenderingTemplate = DefaultStackPanelRenderingTemplate_1 = __decorate([
        BABYLON.registerWindowRenderingTemplate("BABYLON.StackPanel", "Default", function () { return new DefaultStackPanelRenderingTemplate_1(); })
    ], DefaultStackPanelRenderingTemplate);
    BABYLON.DefaultStackPanelRenderingTemplate = DefaultStackPanelRenderingTemplate;
    var StackPanel_1, DefaultStackPanelRenderingTemplate_1;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Control = Control_1 = (function (_super) {
        __extends(Control, _super);
        function Control(settings) {
            return _super.call(this, settings) || this;
        }
        Object.defineProperty(Control.prototype, "background", {
            get: function () {
                if (!this._background) {
                    this._background = new BABYLON.ObservableStringDictionary(false);
                }
                return this._background;
            },
            set: function (value) {
                this.background.copyFrom(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "border", {
            get: function () {
                return this._border;
            },
            set: function (value) {
                this._border = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "borderThickness", {
            get: function () {
                return this._borderThickness;
            },
            set: function (value) {
                this._borderThickness = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "fontName", {
            get: function () {
                return this._fontName;
            },
            set: function (value) {
                this._fontName = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "foreground", {
            get: function () {
                return this._foreground;
            },
            set: function (value) {
                this._foreground = value;
            },
            enumerable: true,
            configurable: true
        });
        return Control;
    }(BABYLON.UIElement));
    Control.CONTROL_PROPCOUNT = BABYLON.UIElement.UIELEMENT_PROPCOUNT + 5;
    __decorate([
        BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 0, function (pi) { return Control_1.backgroundProperty = pi; })
    ], Control.prototype, "background", null);
    __decorate([
        BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 1, function (pi) { return Control_1.borderProperty = pi; })
    ], Control.prototype, "border", null);
    __decorate([
        BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 2, function (pi) { return Control_1.borderThicknessProperty = pi; })
    ], Control.prototype, "borderThickness", null);
    __decorate([
        BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 3, function (pi) { return Control_1.fontNameProperty = pi; })
    ], Control.prototype, "fontName", null);
    __decorate([
        BABYLON.dependencyProperty(BABYLON.UIElement.UIELEMENT_PROPCOUNT + 4, function (pi) { return Control_1.foregroundProperty = pi; })
    ], Control.prototype, "foreground", null);
    Control = Control_1 = __decorate([
        BABYLON.className("Control", "BABYLON")
    ], Control);
    BABYLON.Control = Control;
    var Control_1;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var ContentControl = ContentControl_1 = (function (_super) {
        __extends(ContentControl, _super);
        function ContentControl(settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _this = _super.call(this, settings) || this;
            if (settings.content != null) {
                _this._content = settings.content;
            }
            return _this;
        }
        ContentControl.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            if (this.content && this.content.dispose) {
                this.content.dispose();
                this.content = null;
            }
            if (this.__contentUIElement) {
                this.__contentUIElement.dispose();
                this.__contentUIElement = null;
            }
            _super.prototype.dispose.call(this);
            return true;
        };
        Object.defineProperty(ContentControl.prototype, "content", {
            get: function () {
                return this._content;
            },
            set: function (value) {
                this._content = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ContentControl.prototype, "_contentUIElement", {
            get: function () {
                if (!this.__contentUIElement) {
                    this._buildContentUIElement();
                }
                return this.__contentUIElement;
            },
            enumerable: true,
            configurable: true
        });
        ContentControl.prototype._createVisualTree = function () {
            // Base implementation will create the Group2D for the Visual Placeholder and its Visual Tree
            _super.prototype._createVisualTree.call(this);
            // A Content Control has a Group2D, child of the visualPlaceHolder, which is the Content placeholder.
            // The Content UIElement Tree will be create inside this placeholder.
            this._contentPlaceholder = new BABYLON.Group2D({ parent: this._visualPlaceholder, id: "ContentControl Content Placeholder of " + this.id });
            var p = this._contentPlaceholder;
            // The UIElement padding properties (padding and paddingAlignment) are bound to the Group2D Content placeholder, we bound to the Margin properties as the Group2D acts as an inner element already, so margin of inner is padding.
            p.dataSource = this;
            p.createSimpleDataBinding(BABYLON.Prim2DBase.marginProperty, "padding", BABYLON.DataBinding.MODE_ONEWAY);
            p.createSimpleDataBinding(BABYLON.Prim2DBase.marginAlignmentProperty, "paddingAlignment", BABYLON.DataBinding.MODE_ONEWAY);
            // The UIElement set the childrenPlaceholder with the visual returned by the renderingTemplate.
            // But it's not the case for a ContentControl, the placeholder of UIElement Children (the content)
            this._visualChildrenPlaceholder = this._contentPlaceholder;
        };
        ContentControl.prototype._buildContentUIElement = function () {
            var c = this._content;
            this.__contentUIElement = null;
            // Already a UIElement
            if (c instanceof BABYLON.UIElement) {
                this.__contentUIElement = c;
            }
            else if ((typeof c === "string") || (typeof c === "boolean") || (typeof c === "number")) {
                var l = new BABYLON.Label({ parent: this, id: "Content of " + this.id });
                var binding = new BABYLON.DataBinding();
                binding.propertyPathName = "content";
                binding.stringFormat = function (v) { return "" + v; };
                binding.dataSource = this;
                l.createDataBinding(BABYLON.Label.textProperty, binding);
                this.__contentUIElement = l;
            }
            else {
            }
            if (this.__contentUIElement) {
                this.__contentUIElement._patchUIElement(this.ownerWindow, this);
            }
        };
        ContentControl.prototype._getChildren = function () {
            var children = new Array();
            if (this.content) {
                children.push(this._contentUIElement);
            }
            return children;
        };
        return ContentControl;
    }(BABYLON.Control));
    ContentControl.CONTENTCONTROL_PROPCOUNT = BABYLON.Control.CONTROL_PROPCOUNT + 2;
    __decorate([
        BABYLON.dependencyProperty(BABYLON.Control.CONTROL_PROPCOUNT + 0, function (pi) { return ContentControl_1.contentProperty = pi; })
    ], ContentControl.prototype, "content", null);
    ContentControl = ContentControl_1 = __decorate([
        BABYLON.className("ContentControl", "BABYLON")
    ], ContentControl);
    BABYLON.ContentControl = ContentControl;
    var ContentControl_1;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var FocusScopeData = (function () {
        function FocusScopeData(focusScope) {
            this.focusScope = focusScope;
            this.focusedElement = null;
        }
        return FocusScopeData;
    }());
    var FocusManager = (function () {
        function FocusManager() {
            this._focusScopes = new BABYLON.StringDictionary();
            this._rootScope = new FocusScopeData(null);
            this._activeScope = null;
        }
        FocusManager.prototype.setFocusOn = function (el, focusScope) {
            var fsd = (focusScope != null) ? this._focusScopes.getOrAddWithFactory(focusScope.uid, function (k) { return new FocusScopeData(focusScope); }) : this._rootScope;
            if (fsd.focusedElement !== el) {
                // Remove focus from current
                if (fsd.focusedElement) {
                    fsd.focusedElement.isFocused = false;
                }
                fsd.focusedElement = el;
            }
            if (this._activeScope !== fsd) {
                this._activeScope = fsd;
            }
        };
        return FocusManager;
    }());
    BABYLON.FocusManager = FocusManager;
    var GUISceneData = (function () {
        function GUISceneData(scene) {
            this.scene = scene;
            this.screenSpaceCanvas = new BABYLON.ScreenSpaceCanvas2D(scene, { id: "GUI Canvas", cachingStrategy: BABYLON.Canvas2D.CACHESTRATEGY_DONTCACHE });
            this.focusManager = new FocusManager();
        }
        return GUISceneData;
    }());
    var Window = Window_1 = (function (_super) {
        __extends(Window, _super);
        function Window(scene, settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _this = _super.call(this, settings) || this;
            // Per default a Window is focus scope
            _this.isFocusScope = true;
            _this.isActive = false;
            if (!_this._UIElementVisualToBuildList) {
                _this._UIElementVisualToBuildList = new Array();
            }
            // Patch the owner and also the parent property through the whole tree
            _this._patchUIElement(_this, null);
            // Screen Space UI
            if (!settings.worldPosition && !settings.worldRotation) {
                _this._sceneData = Window_1.getSceneData(scene);
                _this._canvas = _this._sceneData.screenSpaceCanvas;
                _this._isWorldSpaceCanvas = false;
                _this._left = (settings.left != null) ? settings.left : 0;
                _this._bottom = (settings.bottom != null) ? settings.bottom : 0;
            }
            else {
                var w = (settings.width == null) ? 100 : settings.width;
                var h = (settings.height == null) ? 100 : settings.height;
                var wpos = (settings.worldPosition == null) ? BABYLON.Vector3.Zero() : settings.worldPosition;
                var wrot = (settings.worldRotation == null) ? BABYLON.Quaternion.Identity() : settings.worldRotation;
                _this._canvas = new BABYLON.WorldSpaceCanvas2D(scene, new BABYLON.Size(w, h), { id: "GUI Canvas", cachingStrategy: BABYLON.Canvas2D.CACHESTRATEGY_DONTCACHE, worldPosition: wpos, worldRotation: wrot });
                _this._isWorldSpaceCanvas = true;
            }
            _this._renderObserver = _this._canvas.renderObservable.add(function (e, s) { return _this._canvasPreRender(); }, BABYLON.Canvas2D.RENDEROBSERVABLE_PRE);
            _this._disposeObserver = _this._canvas.disposeObservable.add(function (e, s) { return _this._canvasDisposed(); });
            _this._canvas.propertyChanged.add(function (e, s) {
                if (e.propertyName === "overPrim") {
                    _this._overPrimChanged(e.oldValue, e.newValue);
                }
            });
            _this._mouseOverUIElement = null;
            return _this;
        }
        Object.defineProperty(Window.prototype, "canvas", {
            get: function () {
                return this._canvas;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "left", {
            get: function () {
                return this._left;
            },
            set: function (value) {
                var old = new BABYLON.Vector2(this._left, this._bottom);
                this._left = value;
                this.onPropertyChanged("_position", old, this._position);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "bottom", {
            get: function () {
                return this._bottom;
            },
            set: function (value) {
                var old = new BABYLON.Vector2(this._left, this._bottom);
                this._bottom = value;
                this.onPropertyChanged("_position", old, this._position);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "position", {
            get: function () {
                return this._position;
            },
            set: function (value) {
                this._left = value.x;
                this._bottom = value.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "isActive", {
            get: function () {
                return this._isActive;
            },
            set: function (value) {
                this._isActive = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "focusManager", {
            get: function () {
                return this._sceneData.focusManager;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Window.prototype, "_position", {
            get: function () {
                return new BABYLON.Vector2(this.left, this.bottom);
            },
            enumerable: true,
            configurable: true
        });
        Window.prototype.createVisualTree = function () {
            _super.prototype.createVisualTree.call(this);
            var p = this._visualPlaceholder;
            p.createSimpleDataBinding(BABYLON.Group2D.positionProperty, "position");
        };
        Window.prototype._registerVisualToBuild = function (uiel) {
            if (uiel._isFlagSet(BABYLON.UIElement.flagVisualToBuild)) {
                return;
            }
            if (!this._UIElementVisualToBuildList) {
                this._UIElementVisualToBuildList = new Array();
            }
            this._UIElementVisualToBuildList.push(uiel);
            uiel._setFlags(BABYLON.UIElement.flagVisualToBuild);
        };
        Window.prototype._overPrimChanged = function (oldPrim, newPrim) {
            var curOverEl = this._mouseOverUIElement;
            var newOverEl = null;
            var curGroup = newPrim ? newPrim.traverseUp(function (p) { return p instanceof BABYLON.Group2D; }) : null;
            while (curGroup) {
                var uiel = curGroup.getExternalData("_GUIOwnerElement_");
                if (uiel) {
                    newOverEl = uiel;
                    break;
                }
                curGroup = curGroup.parent ? curGroup.parent.traverseUp(function (p) { return p instanceof BABYLON.Group2D; }) : null;
            }
            if (curOverEl === newOverEl) {
                return;
            }
            if (curOverEl) {
                curOverEl.isMouseOver = false;
            }
            if (newOverEl) {
                newOverEl.isMouseOver = true;
            }
            this._mouseOverUIElement = newOverEl;
        };
        Window.prototype._canvasPreRender = function () {
            // Check if we have visual to create
            if (this._UIElementVisualToBuildList.length > 0) {
                // Sort the UI Element to get the highest (so lowest hierarchy depth) in the hierarchy tree first
                var sortedElementList = this._UIElementVisualToBuildList.sort(function (a, b) { return a.hierarchyDepth - b.hierarchyDepth; });
                for (var _i = 0, sortedElementList_1 = sortedElementList; _i < sortedElementList_1.length; _i++) {
                    var el = sortedElementList_1[_i];
                    el._createVisualTree();
                }
                this._UIElementVisualToBuildList.splice(0);
            }
        };
        Window.prototype._canvasDisposed = function () {
            this._canvas.disposeObservable.remove(this._disposeObserver);
            this._canvas.renderObservable.remove(this._renderObserver);
        };
        Window.getSceneData = function (scene) {
            return Window_1._sceneData.getOrAddWithFactory(scene.uid, function (k) { return new GUISceneData(scene); });
        };
        return Window;
    }(BABYLON.ContentControl));
    Window.WINDOW_PROPCOUNT = BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 4;
    Window._sceneData = new BABYLON.StringDictionary();
    __decorate([
        BABYLON.dependencyProperty(BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 0, function (pi) { return Window_1.leftProperty = pi; })
    ], Window.prototype, "left", null);
    __decorate([
        BABYLON.dependencyProperty(BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 1, function (pi) { return Window_1.bottomProperty = pi; })
    ], Window.prototype, "bottom", null);
    __decorate([
        BABYLON.dependencyProperty(BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 2, function (pi) { return Window_1.positionProperty = pi; })
    ], Window.prototype, "position", null);
    __decorate([
        BABYLON.dependencyProperty(BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 3, function (pi) { return Window_1.isActiveProperty = pi; })
    ], Window.prototype, "isActive", null);
    Window = Window_1 = __decorate([
        BABYLON.className("Window", "BABYLON")
    ], Window);
    BABYLON.Window = Window;
    var DefaultWindowRenderingTemplate = DefaultWindowRenderingTemplate_1 = (function (_super) {
        __extends(DefaultWindowRenderingTemplate, _super);
        function DefaultWindowRenderingTemplate() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DefaultWindowRenderingTemplate.prototype.createVisualTree = function (owner, visualPlaceholder) {
            var r = new BABYLON.Rectangle2D({ parent: visualPlaceholder, fill: "#808080FF" });
            return { root: r, contentPlaceholder: r };
        };
        return DefaultWindowRenderingTemplate;
    }(BABYLON.UIElementRenderingTemplateBase));
    DefaultWindowRenderingTemplate = DefaultWindowRenderingTemplate_1 = __decorate([
        BABYLON.registerWindowRenderingTemplate("BABYLON.Window", "Default", function () { return new DefaultWindowRenderingTemplate_1(); })
    ], DefaultWindowRenderingTemplate);
    BABYLON.DefaultWindowRenderingTemplate = DefaultWindowRenderingTemplate;
    var Window_1, DefaultWindowRenderingTemplate_1;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Label = Label_1 = (function (_super) {
        __extends(Label, _super);
        function Label(settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _this = _super.call(this, settings) || this;
            if (settings.text != null) {
                _this.text = settings.text;
            }
            return _this;
        }
        Object.defineProperty(Label.prototype, "_position", {
            get: function () {
                return BABYLON.Vector2.Zero();
            },
            enumerable: true,
            configurable: true
        });
        Label.prototype._getChildren = function () {
            return Label_1._emptyArray;
        };
        Label.prototype.createVisualTree = function () {
            _super.prototype.createVisualTree.call(this);
            var p = this._visualChildrenPlaceholder;
        };
        Object.defineProperty(Label.prototype, "text", {
            get: function () {
                return this._text;
            },
            set: function (value) {
                this._text = value;
            },
            enumerable: true,
            configurable: true
        });
        return Label;
    }(BABYLON.Control));
    Label._emptyArray = new Array();
    __decorate([
        BABYLON.dependencyProperty(BABYLON.Control.CONTROL_PROPCOUNT + 0, function (pi) { return Label_1.textProperty = pi; })
    ], Label.prototype, "text", null);
    Label = Label_1 = __decorate([
        BABYLON.className("Label", "BABYLON")
    ], Label);
    BABYLON.Label = Label;
    var DefaultLabelRenderingTemplate = DefaultLabelRenderingTemplate_1 = (function (_super) {
        __extends(DefaultLabelRenderingTemplate, _super);
        function DefaultLabelRenderingTemplate() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DefaultLabelRenderingTemplate.prototype.createVisualTree = function (owner, visualPlaceholder) {
            var r = new BABYLON.Text2D("", { parent: visualPlaceholder });
            r.createSimpleDataBinding(BABYLON.Text2D.textProperty, "text");
            r.dataSource = owner;
            return { root: r, contentPlaceholder: r };
        };
        return DefaultLabelRenderingTemplate;
    }(BABYLON.UIElementRenderingTemplateBase));
    DefaultLabelRenderingTemplate = DefaultLabelRenderingTemplate_1 = __decorate([
        BABYLON.registerWindowRenderingTemplate("BABYLON.Label", "Default", function () { return new DefaultLabelRenderingTemplate_1(); })
    ], DefaultLabelRenderingTemplate);
    BABYLON.DefaultLabelRenderingTemplate = DefaultLabelRenderingTemplate;
    var Label_1, DefaultLabelRenderingTemplate_1;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Button = Button_1 = (function (_super) {
        __extends(Button, _super);
        function Button(settings) {
            var _this = this;
            if (!settings) {
                settings = {};
            }
            _this = _super.call(this, settings) || this;
            if (settings.paddingAlignment == null) {
                _this.paddingAlignment.horizontal = BABYLON.PrimitiveAlignment.AlignCenter;
                _this.paddingAlignment.vertical = BABYLON.PrimitiveAlignment.AlignCenter;
            }
            _this._normalStateBackground = new BABYLON.ObservableStringDictionary(false);
            _this._normalStateBorder = new BABYLON.ObservableStringDictionary(false);
            _this._defaultStateBackground = new BABYLON.ObservableStringDictionary(false);
            _this._defaultStateBorder = new BABYLON.ObservableStringDictionary(false);
            _this._normalStateBackground.add(BABYLON.UIElement.enabledState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#337AB7FF"));
            _this._normalStateBackground.add(BABYLON.UIElement.disabledState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#7BA9D0FF"));
            _this._normalStateBackground.add(BABYLON.UIElement.mouseOverState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#286090FF"));
            _this._normalStateBackground.add(Button_1.pushedState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#1E496EFF"));
            _this._normalStateBorder.add(BABYLON.UIElement.enabledState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#2E6DA4FF"));
            _this._normalStateBorder.add(BABYLON.UIElement.disabledState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#77A0C4FF"));
            _this._normalStateBorder.add(BABYLON.UIElement.mouseOverState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#204D74FF"));
            _this._normalStateBorder.add(Button_1.pushedState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#2E5D9EFF"));
            _this._defaultStateBackground.add(BABYLON.UIElement.enabledState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF"));
            _this._defaultStateBackground.add(BABYLON.UIElement.disabledState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF"));
            _this._defaultStateBackground.add(BABYLON.UIElement.mouseOverState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#E6E6E6FF"));
            _this._defaultStateBackground.add(Button_1.pushedState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#D4D4D4FF"));
            _this._defaultStateBorder.add(BABYLON.UIElement.enabledState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#CCCCCCFF"));
            _this._defaultStateBorder.add(BABYLON.UIElement.disabledState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#DEDEDEFF"));
            _this._defaultStateBorder.add(BABYLON.UIElement.mouseOverState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#ADADADFF"));
            _this._defaultStateBorder.add(Button_1.pushedState, BABYLON.Canvas2D.GetSolidColorBrushFromHex("#6C8EC5FF"));
            return _this;
        }
        Object.defineProperty(Button, "pushedState", {
            get: function () {
                return Button_1._pushedState;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "isPushed", {
            get: function () {
                return this._isPushed;
            },
            set: function (value) {
                this._isPushed = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "isDefault", {
            get: function () {
                return this._isDefault;
            },
            set: function (value) {
                this._isDefault = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "isOutline", {
            get: function () {
                return this._isOutline;
            },
            set: function (value) {
                this._isOutline = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "clickObservable", {
            get: function () {
                if (!this._clickObservable) {
                    this._clickObservable = new BABYLON.Observable();
                }
                return this._clickObservable;
            },
            enumerable: true,
            configurable: true
        });
        Button.prototype._raiseClick = function () {
            if (this._clickObservable && this._clickObservable.hasObservers()) {
                this._clickObservable.notifyObservers(this);
            }
        };
        Button.prototype.createVisualTree = function () {
            var _this = this;
            _super.prototype.createVisualTree.call(this);
            var p = this._visualPlaceholder;
            p.pointerEventObservable.add(function (e, s) {
                // check if input must be discarded
                if (!_this.isVisible || !_this.isEnabled) {
                    return;
                }
                // We reject an event coming from the placeholder because it means it's on an empty spot, so it's not valid.
                if (e.relatedTarget === _this._visualPlaceholder) {
                    return;
                }
                if (s.mask === BABYLON.PrimitivePointerInfo.PointerUp) {
                    _this._raiseClick();
                    _this.isPushed = false;
                }
                else if (s.mask === BABYLON.PrimitivePointerInfo.PointerDown) {
                    _this.isPushed = true;
                    _this.isFocused = true;
                }
            }, BABYLON.PrimitivePointerInfo.PointerUp | BABYLON.PrimitivePointerInfo.PointerDown);
        };
        Object.defineProperty(Button.prototype, "normalStateBackground", {
            get: function () {
                return this._normalStateBackground;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "defaultStateBackground", {
            get: function () {
                return this._defaultStateBackground;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "normalStateBorder", {
            get: function () {
                return this._normalStateBorder;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "defaultStateBorder", {
            get: function () {
                return this._defaultStateBorder;
            },
            enumerable: true,
            configurable: true
        });
        return Button;
    }(BABYLON.ContentControl));
    Button.BUTTON_PROPCOUNT = BABYLON.ContentControl.CONTENTCONTROL_PROPCOUNT + 3;
    Button._pushedState = "Pushed";
    __decorate([
        BABYLON.dependencyProperty(BABYLON.ContentControl.CONTROL_PROPCOUNT + 0, function (pi) { return Button_1.isPushedProperty = pi; })
    ], Button.prototype, "isPushed", null);
    __decorate([
        BABYLON.dependencyProperty(BABYLON.ContentControl.CONTROL_PROPCOUNT + 1, function (pi) { return Button_1.isDefaultProperty = pi; })
    ], Button.prototype, "isDefault", null);
    __decorate([
        BABYLON.dependencyProperty(BABYLON.ContentControl.CONTROL_PROPCOUNT + 2, function (pi) { return Button_1.isOutlineProperty = pi; })
    ], Button.prototype, "isOutline", null);
    Button = Button_1 = __decorate([
        BABYLON.className("Button", "BABYLON")
    ], Button);
    BABYLON.Button = Button;
    var DefaultButtonRenderingTemplate = DefaultButtonRenderingTemplate_1 = (function (_super) {
        __extends(DefaultButtonRenderingTemplate, _super);
        function DefaultButtonRenderingTemplate() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DefaultButtonRenderingTemplate.prototype.createVisualTree = function (owner, visualPlaceholder) {
            this._rect = new BABYLON.Rectangle2D({ parent: visualPlaceholder, fill: "#FF8080FF", border: "#FF8080FF", roundRadius: 10, borderThickness: 2 });
            this.stateChange();
            return { root: this._rect, contentPlaceholder: this._rect };
        };
        DefaultButtonRenderingTemplate.prototype.attach = function (owner) {
            var _this = this;
            _super.prototype.attach.call(this, owner);
            this.owner.propertyChanged.add(function (e, s) { return _this.stateChange(); }, BABYLON.UIElement.isEnabledProperty.flagId |
                BABYLON.UIElement.isFocusedProperty.flagId |
                BABYLON.UIElement.isMouseOverProperty.flagId |
                Button.isDefaultProperty.flagId |
                Button.isOutlineProperty.flagId |
                Button.isPushedProperty.flagId);
            // Register for brush change and update the Visual
            var button = owner;
            button.normalStateBackground.dictionaryChanged.add(function (e, c) { return _this.stateChange(); });
            button.normalStateBorder.dictionaryChanged.add(function (e, c) { return _this.stateChange(); });
            button.defaultStateBackground.dictionaryChanged.add(function (e, c) { return _this.stateChange(); });
            button.defaultStateBorder.dictionaryChanged.add(function (e, c) { return _this.stateChange(); });
        };
        DefaultButtonRenderingTemplate.prototype.stateChange = function () {
            //console.log("state changed");
            var b = this.owner;
            var state = BABYLON.UIElement.enabledState;
            var bg = b.isDefault ? b.defaultStateBackground.get(state) : b.normalStateBackground.get(state);
            var bd = b.isDefault ? b.defaultStateBorder.get(state) : b.normalStateBorder.get(state);
            if (b.isPushed) {
                state = Button.pushedState;
                if (b.isDefault) {
                    bg = b.defaultStateBackground.get(state);
                    bd = b.defaultStateBorder.get(state);
                }
                else {
                    bg = b.normalStateBackground.get(state);
                    bd = b.normalStateBorder.get(state);
                }
            }
            else if (b.isMouseOver) {
                state = BABYLON.UIElement.mouseOverState;
                if (b.isDefault) {
                    bg = b.defaultStateBackground.get(state);
                    bd = b.defaultStateBorder.get(state);
                }
                else {
                    bg = b.normalStateBackground.get(state);
                    bd = b.normalStateBorder.get(state);
                }
            }
            else if (!b.isEnabled) {
                state = BABYLON.UIElement.disabledState;
                if (b.isDefault) {
                    bg = b.defaultStateBackground.get(state);
                    bd = b.defaultStateBorder.get(state);
                }
                else {
                    bg = b.normalStateBackground.get(state);
                    bd = b.normalStateBorder.get(state);
                }
            }
            this._rect.fill = bg;
            this._rect.border = bd;
        };
        return DefaultButtonRenderingTemplate;
    }(BABYLON.UIElementRenderingTemplateBase));
    DefaultButtonRenderingTemplate = DefaultButtonRenderingTemplate_1 = __decorate([
        BABYLON.registerWindowRenderingTemplate("BABYLON.Button", "Default", function () { return new DefaultButtonRenderingTemplate_1(); })
    ], DefaultButtonRenderingTemplate);
    BABYLON.DefaultButtonRenderingTemplate = DefaultButtonRenderingTemplate;
    var Button_1, DefaultButtonRenderingTemplate_1;
})(BABYLON || (BABYLON = {}));
