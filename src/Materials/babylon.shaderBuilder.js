
var BABYLON;
(function (BABYLON) {
    var ShaderMaterialHelperStatics = (function () {
        function ShaderMaterialHelperStatics() {
        }
        ShaderMaterialHelperStatics.Dark = false;
        ShaderMaterialHelperStatics.Light = true;
        ShaderMaterialHelperStatics.PrecisionHighMode = 'highp';
        ShaderMaterialHelperStatics.PrecisionMediumMode = 'mediump';
        ShaderMaterialHelperStatics.face_back = "!gl_FrontFacing";
        ShaderMaterialHelperStatics.face_front = "gl_FrontFacing";
        ShaderMaterialHelperStatics.AttrPosition = 'position';
        ShaderMaterialHelperStatics.AttrNormal = 'normal';
        ShaderMaterialHelperStatics.AttrUv = 'uv';
        ShaderMaterialHelperStatics.AttrUv2 = 'uv2';
        ShaderMaterialHelperStatics.AttrTypeForPosition = 'vec3';
        ShaderMaterialHelperStatics.AttrTypeForNormal = 'vec3';
        ShaderMaterialHelperStatics.AttrTypeForUv = 'vec2';
        ShaderMaterialHelperStatics.AttrTypeForUv2 = 'vec2';
        ShaderMaterialHelperStatics.uniformView = "view";
        ShaderMaterialHelperStatics.uniformWorld = "world";
        ShaderMaterialHelperStatics.uniformWorldView = "worldView";
        ShaderMaterialHelperStatics.uniformViewProjection = "viewProjection";
        ShaderMaterialHelperStatics.uniformWorldViewProjection = "worldViewProjection";
        ShaderMaterialHelperStatics.uniformStandardType = "mat4";
        ShaderMaterialHelperStatics.uniformFlags = "flags";
        ShaderMaterialHelperStatics.Mouse = "mouse";
        ShaderMaterialHelperStatics.Screen = "screen";
        ShaderMaterialHelperStatics.Camera = "camera";
        ShaderMaterialHelperStatics.Look = "look";
        ShaderMaterialHelperStatics.Time = "time";
        ShaderMaterialHelperStatics.GlobalTime = "gtime";
        ShaderMaterialHelperStatics.Position = "pos";
        ShaderMaterialHelperStatics.WorldPosition = "wpos";
        ShaderMaterialHelperStatics.Normal = "nrm";
        ShaderMaterialHelperStatics.WorldNormal = "wnrm";
        ShaderMaterialHelperStatics.Uv = "vuv";
        ShaderMaterialHelperStatics.Uv2 = "vuv2";
        ShaderMaterialHelperStatics.Center = 'center';
        ShaderMaterialHelperStatics.ReflectMatrix = "refMat";
        ShaderMaterialHelperStatics.Texture2D = "txtRef_";
        ShaderMaterialHelperStatics.TextureCube = "cubeRef_";
        return ShaderMaterialHelperStatics;
    })();
    var Normals = (function () {
        function Normals() {
        }
        Normals.Default = ShaderMaterialHelperStatics.Normal;
        Normals.Inverse = '-1.*' + ShaderMaterialHelperStatics.Normal;
        Normals.Pointed = 'normalize(' + ShaderMaterialHelperStatics.Position + '-' + ShaderMaterialHelperStatics.Center + ')';
        Normals.Flat = 'normalize(cross(dFdx(' + ShaderMaterialHelperStatics.Position + ' * -1.), dFdy(' + ShaderMaterialHelperStatics.Position + ')))';
        Normals.Map = 'normalMap()';
        return Normals;
    })();
    BABYLON.Normals = Normals;
    var Speculars = (function () {
        function Speculars() {
        }
        Speculars.Map = 'specularMap()';
        return Speculars;
    })();
    var ShaderMaterialHelper = (function () {
        function ShaderMaterialHelper() {
        }
        ShaderMaterialHelper.prototype.ShaderMaterial = function (name, scene, shader, helpers) {
            return this.MakeShaderMaterialForEngine(name, scene, shader, helpers);
        };
        ShaderMaterialHelper.prototype.MakeShaderMaterialForEngine = function (name, scene, shader, helpers) { return {}; };
        ShaderMaterialHelper.prototype.DefineTexture = function (txt, scene) {
            return null;
        };
        ShaderMaterialHelper.prototype.DefineCubeTexture = function (txt, scene) {
            return null;
        };
        ShaderMaterialHelper.prototype.SetUniforms = function (meshes, cameraPos, cameraTarget, mouse, screen, time) {
            for (var ms in meshes) {
                ms = meshes[ms];
                if (ms.material && (ms.material.ShaderSetting != null || ms.material.ShaderSetting != undefined)) {
                    if (ms.material.ShaderSetting.Camera)
                        ms.material.setVector3(ShaderMaterialHelperStatics.Camera, cameraPos);
                    if (ms.material.ShaderSetting.Center)
                        ms.material.setVector3(ShaderMaterialHelperStatics.Center, { x: 0., y: 0., z: 0. });
                    if (ms.material.ShaderSetting.Mouse)
                        ms.material.setVector2(ShaderMaterialHelperStatics.Mouse, mouse);
                    if (ms.material.ShaderSetting.Screen)
                        ms.material.setVector2(ShaderMaterialHelperStatics.Screen, screen);
                    if (ms.material.ShaderSetting.GlobalTime)
                        ms.material.setVector4(ShaderMaterialHelperStatics.GlobalTime, { x: 0., y: 0., z: 0., w: 0. });
                    if (ms.material.ShaderSetting.Look)
                        ms.material.setVector3(ShaderMaterialHelperStatics.Look, cameraTarget);
                    if (ms.material.ShaderSetting.Time)
                        ms.material.setFloat(ShaderMaterialHelperStatics.Time, time);
                }
            }
        };
        return ShaderMaterialHelper;
    })();
    BABYLON.ShaderMaterialHelper = ShaderMaterialHelper;
    var Shader = (function () {
        function Shader() {
        }
        Shader.Replace = function (s, t, d) {
            var ignore = null;
            return s.replace(new RegExp(t.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof (d) == "string") ? d.replace(/\$/g, "$$$$") : d);
        };
        Shader.Def = function (a, d) {
            if (a != undefined && a != null)
                return (d != undefined && d != null ? a : true);
            else if (d != Shader._null)
                return (d != undefined && d != null ? d : false);
            return null;
        };
        Shader.Join = function (s) {
            return s.join("\n\
                       ");
        };
        Shader.Print = function (n) {
            if (n == undefined)
                return "0.";
            var sn = Shader.Replace(n.toString(), '-', '0');
            var reg = new RegExp('^\\d+$');
            if (reg.test(sn) && n.toString().indexOf('.') == -1)
                return n + ".";
            return n.toString();
        };
        Shader.Custom = function () {
            return "custom_" + this.Print(++this.Me.CustomIndexer) + "_";
        };
        Shader.Index = function () {
            return "_" + Shader.Indexer + "_";
        };
        Shader.DefCustom = function (t, c) {
            this.Me.Body += t + " custom_" + this.Print(++this.Me.CustomIndexer) + "_ = " + c + ";";
        };
        Shader._null = 'set null anyway';
        return Shader;
    })();
    BABYLON.Shader = Shader;
    var Helper = (function () {
        function Helper() {
            var setting = Shader.Me.Setting;
            var instance = new ShaderBuilder();
            instance.Parent = Shader.Me;
            instance.Setting = setting;
            return instance;
        }
        Helper.Red = 0;
        Helper.Yellow = 1;
        Helper.White = 2;
        Helper.Cyan = 4;
        Helper.Blue = 5;
        Helper.Pink = 6;
        Helper.Black = 7;
        Helper.Green = 8;
        return Helper;
    })();
    BABYLON.Helper = Helper;
    var ShaderSetting = (function () {
        function ShaderSetting() {
            this.PrecisionMode = ShaderMaterialHelperStatics.PrecisionHighMode;
        }
        return ShaderSetting;
    })();
    BABYLON.ShaderSetting = ShaderSetting;
    var ShaderBuilder = (function () {
        function ShaderBuilder() {
            this.Setting = new ShaderSetting();
            this.Extentions = [];
            this.Attributes = [];
            this.Fragment = [];
            this.Helpers = [];
            this.Uniforms = [];
            this.Varings = [];
            this.Vertex = [];
            this.Setting.Uv = true;
            this.Setting.Time = true;
            this.Setting.Camera = true;
            this.Setting.Helpers = true;
            this.Setting.NormalMap = "result = vec4(0.5);";
            this.Setting.SpecularMap = "float_result = 1.0;";
            this.Setting.NormalOpacity = "0.5";
            this.Setting.Normal = ShaderMaterialHelperStatics.Normal;
            if (Shader.Indexer == null)
                Shader.Indexer = 1;
            this.CustomIndexer = 1;
            Shader.Me = this;
        }
        ShaderBuilder.prototype.PrepareBeforeMaterialBuild = function (scene) {
            this.Setting = Shader.Me.Setting;
            this.Attributes.push(ShaderMaterialHelperStatics.AttrPosition);
            this.Attributes.push(ShaderMaterialHelperStatics.AttrNormal);
            if (this.Setting.Uv) {
                this.Attributes.push(ShaderMaterialHelperStatics.AttrUv);
            }
            if (this.Setting.Uv2) {
                this.Attributes.push(ShaderMaterialHelperStatics.AttrUv2);
            }
            this.Uniforms.push(ShaderMaterialHelperStatics.uniformView, ShaderMaterialHelperStatics.uniformWorld, ShaderMaterialHelperStatics.uniformWorldView, ShaderMaterialHelperStatics.uniformViewProjection, ShaderMaterialHelperStatics.uniformWorldViewProjection);
            // start Build Vertex Frame 
            this.Vertex.push("precision " + this.Setting.PrecisionMode + " float;");
            this.Vertex.push("attribute " + ShaderMaterialHelperStatics.AttrTypeForPosition + " " + ShaderMaterialHelperStatics.AttrPosition + ";");
            this.Vertex.push("attribute " + ShaderMaterialHelperStatics.AttrTypeForNormal + " " + ShaderMaterialHelperStatics.AttrNormal + ";");
            if (this.Setting.Uv) {
                this.Vertex.push("attribute " + ShaderMaterialHelperStatics.AttrTypeForUv + " " + ShaderMaterialHelperStatics.AttrUv + ";");
                this.Vertex.push("varying vec2 " + ShaderMaterialHelperStatics.Uv + ";");
            }
            if (this.Setting.Uv2) {
                this.Vertex.push("attribute " + ShaderMaterialHelperStatics.AttrTypeForUv2 + " " + ShaderMaterialHelperStatics.AttrUv2 + ";");
                this.Vertex.push("varying vec2 " + ShaderMaterialHelperStatics.Uv2 + ";");
            }
            this.Vertex.push("varying vec3 " + ShaderMaterialHelperStatics.Position + ";");
            this.Vertex.push("varying vec3 " + ShaderMaterialHelperStatics.Normal + ";");
            this.Vertex.push("uniform   " + ShaderMaterialHelperStatics.uniformStandardType + ' ' + ShaderMaterialHelperStatics.uniformWorldViewProjection + ";");
            if (this.Setting.VertexView) {
                this.Vertex.push("uniform   " + ShaderMaterialHelperStatics.uniformStandardType + ' ' + ShaderMaterialHelperStatics.uniformView + ";");
            }
            if (this.Setting.VertexWorld) {
                this.Vertex.push("uniform   " + ShaderMaterialHelperStatics.uniformStandardType + ' ' + ShaderMaterialHelperStatics.uniformWorld + ";");
            }
            if (this.Setting.VertexViewProjection) {
                this.Vertex.push("uniform   " + ShaderMaterialHelperStatics.uniformStandardType + ' ' + ShaderMaterialHelperStatics.uniformViewProjection + ";");
            }
            if (this.Setting.Flags) {
                this.Uniforms.push(ShaderMaterialHelperStatics.uniformFlags);
                this.Vertex.push("uniform  float " + ShaderMaterialHelperStatics.uniformFlags + ";");
            }
            if (this.Setting.VertexWorldView) {
                this.Vertex.push("uniform   " + ShaderMaterialHelperStatics.uniformStandardType + ' ' + ShaderMaterialHelperStatics.uniformWorldView + ";");
            }
            /*#extension GL_OES_standard_derivatives : enable*/
            this.Fragment.push("precision " + this.Setting.PrecisionMode + " float;\n\
#extension GL_OES_standard_derivatives : enable\n\
\n\
\n\
 ");
            if (this.Setting.Uv) {
                this.Fragment.push("varying vec2 " + ShaderMaterialHelperStatics.Uv + ";");
            }
            if (this.Setting.Uv2) {
                this.Fragment.push("varying vec2 " + ShaderMaterialHelperStatics.Uv2 + ";");
            }
            if (this.Setting.FragmentView) {
                this.Fragment.push("uniform   " + ShaderMaterialHelperStatics.uniformStandardType + ' ' + ShaderMaterialHelperStatics.uniformView + ";");
            }
            if (this.Setting.FragmentWorld) {
                this.Fragment.push("uniform   " + ShaderMaterialHelperStatics.uniformStandardType + ' ' + ShaderMaterialHelperStatics.uniformWorld + ";");
            }
            if (this.Setting.FragmentViewProjection) {
                this.Fragment.push("uniform   " + ShaderMaterialHelperStatics.uniformStandardType + ' ' + ShaderMaterialHelperStatics.uniformViewProjection + ";");
            }
            if (this.Setting.FragmentWorldView) {
                this.Fragment.push("uniform   " + ShaderMaterialHelperStatics.uniformStandardType + ' ' + ShaderMaterialHelperStatics.uniformWorldView + ";");
            }
            if (this.Setting.Flags) {
                this.Fragment.push("uniform  float " + ShaderMaterialHelperStatics.uniformFlags + ";");
            }
            this.Fragment.push("varying vec3 " + ShaderMaterialHelperStatics.Position + ";");
            this.Fragment.push("varying vec3 " + ShaderMaterialHelperStatics.Normal + ";");
            if (this.Setting.WorldPosition) {
                this.Vertex.push("varying vec3 " + ShaderMaterialHelperStatics.WorldPosition + ";");
                this.Vertex.push("varying vec3 " + ShaderMaterialHelperStatics.WorldNormal + ";");
                this.Fragment.push("varying vec3 " + ShaderMaterialHelperStatics.WorldPosition + ";");
                this.Fragment.push("varying vec3 " + ShaderMaterialHelperStatics.WorldNormal + ";");
            }
            if (this.Setting.Texture2Ds != null) {
                for (var s in this.Setting.Texture2Ds) {
                    if (this.Setting.Texture2Ds[s].inVertex) {
                        this.Vertex.push("uniform  sampler2D " + ShaderMaterialHelperStatics.Texture2D + s + ";");
                    }
                    if (this.Setting.Texture2Ds[s].inFragment) {
                        this.Fragment.push("uniform  sampler2D  " + ShaderMaterialHelperStatics.Texture2D + s + ";");
                    }
                }
            }
            if (this.Setting.TextureCubes != null) {
                for (var s in this.Setting.TextureCubes) {
                    if (this.Setting.TextureCubes[s].inVertex) {
                        this.Vertex.push("uniform  samplerCube  " + ShaderMaterialHelperStatics.TextureCube + s + ";");
                    }
                    if (this.Setting.TextureCubes[s].inFragment) {
                        this.Fragment.push("uniform  samplerCube   " + ShaderMaterialHelperStatics.TextureCube + s + ";");
                    }
                }
            }
            if (this.Setting.Center) {
                this.Vertex.push("uniform  vec3 " + ShaderMaterialHelperStatics.Center + ";");
                this.Fragment.push("uniform  vec3 " + ShaderMaterialHelperStatics.Center + ";");
            }
            if (this.Setting.Mouse) {
                this.Vertex.push("uniform  vec2 " + ShaderMaterialHelperStatics.Mouse + ";");
                this.Fragment.push("uniform  vec2 " + ShaderMaterialHelperStatics.Mouse + ";");
            }
            if (this.Setting.Screen) {
                this.Vertex.push("uniform  vec2 " + ShaderMaterialHelperStatics.Screen + ";");
                this.Fragment.push("uniform  vec2 " + ShaderMaterialHelperStatics.Screen + ";");
            }
            if (this.Setting.Camera) {
                this.Vertex.push("uniform  vec3 " + ShaderMaterialHelperStatics.Camera + ";");
                this.Fragment.push("uniform  vec3 " + ShaderMaterialHelperStatics.Camera + ";");
            }
            if (this.Setting.Look) {
                this.Vertex.push("uniform  vec3 " + ShaderMaterialHelperStatics.Look + ";");
                this.Fragment.push("uniform  vec3 " + ShaderMaterialHelperStatics.Look + ";");
            }
            if (this.Setting.Time) {
                this.Vertex.push("uniform  float " + ShaderMaterialHelperStatics.Time + ";");
                this.Fragment.push("uniform  float " + ShaderMaterialHelperStatics.Time + ";");
            }
            if (this.Setting.GlobalTime) {
                this.Vertex.push("uniform  vec4 " + ShaderMaterialHelperStatics.GlobalTime + ";");
                this.Fragment.push("uniform  vec4 " + ShaderMaterialHelperStatics.GlobalTime + ";");
            }
            if (this.Setting.ReflectMatrix) {
                this.Vertex.push("uniform  mat4 " + ShaderMaterialHelperStatics.ReflectMatrix + ";");
                this.Fragment.push("uniform  mat4 " + ShaderMaterialHelperStatics.ReflectMatrix + ";");
            }
            if (this.Setting.Helpers) {
                var sresult = Shader.Join([
                    "vec3 random3(vec3 c) {   float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));   vec3 r;   r.z = fract(512.0*j); j *= .125;  r.x = fract(512.0*j); j *= .125; r.y = fract(512.0*j);  return r-0.5;  } ",
                    "float rand(vec2 co){   return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); } ",
                    "const float F3 =  0.3333333;const float G3 =  0.1666667;",
                    "float simplex3d(vec3 p) {   vec3 s = floor(p + dot(p, vec3(F3)));   vec3 x = p - s + dot(s, vec3(G3));  vec3 e = step(vec3(0.0), x - x.yzx);  vec3 i1 = e*(1.0 - e.zxy);  vec3 i2 = 1.0 - e.zxy*(1.0 - e);   vec3 x1 = x - i1 + G3;   vec3 x2 = x - i2 + 2.0*G3;   vec3 x3 = x - 1.0 + 3.0*G3;   vec4 w, d;    w.x = dot(x, x);   w.y = dot(x1, x1);  w.z = dot(x2, x2);  w.w = dot(x3, x3);   w = max(0.6 - w, 0.0);   d.x = dot(random3(s), x);   d.y = dot(random3(s + i1), x1);   d.z = dot(random3(s + i2), x2);  d.w = dot(random3(s + 1.0), x3);  w *= w;   w *= w;  d *= w;   return dot(d, vec4(52.0));     }  ",
                    "float noise(vec3 m) {  return   0.5333333*simplex3d(m)   +0.2666667*simplex3d(2.0*m) +0.1333333*simplex3d(4.0*m) +0.0666667*simplex3d(8.0*m);   } ",
                    "float dim(vec3 p1 , vec3 p2){   return sqrt((p2.x-p1.x)*(p2.x-p1.x)+(p2.y-p1.y)*(p2.y-p1.y)+(p2.z-p1.z)*(p2.z-p1.z)); }",
                    "vec2  rotate_xy(vec2 pr1,vec2  pr2,float alpha) {vec2 pp2 = vec2( pr2.x - pr1.x,   pr2.y - pr1.y );return  vec2( pr1.x + pp2.x * cos(alpha*3.14159265/180.) - pp2.y * sin(alpha*3.14159265/180.),pr1.y + pp2.x * sin(alpha*3.14159265/180.) + pp2.y * cos(alpha*3.14159265/180.));} \n vec3  r_y(vec3 n, float a,vec3 c) {vec3 c1 = vec3( c.x,  c.y,   c.z );c1.x = c1.x;c1.y = c1.z;vec2 p = rotate_xy(vec2(c1.x,c1.y), vec2( n.x,  n.z ), a);n.x = p.x;n.z = p.y;return n; } \n vec3  r_x(vec3 n, float a,vec3 c) {vec3 c1 = vec3( c.x,  c.y,   c.z );c1.x = c1.y;c1.y = c1.z;vec2 p = rotate_xy(vec2(c1.x,c1.y), vec2( n.y,  n.z ), a);n.y = p.x;n.z = p.y;return n; } \n vec3  r_z(vec3 n, float a,vec3 c) {  vec3 c1 = vec3( c.x,  c.y,   c.z );vec2 p = rotate_xy(vec2(c1.x,c1.y), vec2( n.x,  n.y ), a);n.x = p.x;n.y = p.y;return n; }",
                ]);
                this.Vertex.push(sresult);
                this.Fragment.push(sresult);
            }
            this.Vertex.push("void main(void) { \n\
    " + ShaderMaterialHelperStatics.Position + " = " + ShaderMaterialHelperStatics.AttrPosition + "; \n\
    " + ShaderMaterialHelperStatics.Normal + " = " + ShaderMaterialHelperStatics.AttrNormal + "; \n\
    vec4 result = vec4(" + ShaderMaterialHelperStatics.Position + ",1.);  \n\
    #[Source] \n\
    gl_Position = worldViewProjection * result;\n\
                vuv = uv;\n\
    #[AfterFinishVertex] \n\
 }");
            // start Build Fragment Frame 
            if (this.Setting.NormalMap != null) {
                this.Fragment.push("vec3 normalMap() { vec4 result = vec4(0.); " + this.Setting.NormalMap + "; \n\
                  result = vec4( normalize( " + this.Setting.Normal + " -(normalize(result.xyz)*2.0-vec3(1.))*(max(-0.5,min(0.5," + Shader.Print(this.Setting.NormalOpacity) + ")) )),1.0); return result.xyz;}");
            }
            if (this.Setting.SpecularMap != null) {
                this.Fragment.push("float specularMap() { vec4 result = vec4(0.);float float_result = 0.; " + this.Setting.SpecularMap + "; return float_result ;}");
            }
            this.Fragment.push(this.FragmentBeforeMain);
            this.Fragment.push(" \n\
void main(void) { \n\
     int discardState = 0;\n\
     vec4 result = vec4(0.);\n\
     #[Source] \n\
     if(discardState == 0)gl_FragColor = result; \n\
}");
        };
        ShaderBuilder.prototype.PrepareMaterial = function (material, scene) {
            material.ShaderSetting =
                this.Setting;
            if (!this.Setting.Transparency) {
                material.needAlphaBlending = function () { return false; };
            }
            else {
                material.needAlphaBlending = function () { return true; };
            }
            ;
            if (!this.Setting.Back)
                this.Setting.Back = false;
            material.needAlphaTesting = function () { return true; };
            material.setVector3("camera", { x: 18., y: 18., z: 18. });
            material.backFaceCulling = !this.Setting.Back;
            material.wireframe = this.Setting.Wire;
            material.setFlags = function (flags) {
                if (this.ShaderSetting.Flags) {
                    var s = 0.;
                    for (var i = 0; i < 20; i++) {
                        if (flags.length > i && flags[i] == '1')
                            s += Math.pow(2., i);
                    }
                    this.flagNumber = s;
                    this.setFloat(ShaderMaterialHelperStatics.uniformFlags, s);
                }
            };
            material.flagNumber = 0.;
            material.flagUp = function (flag) {
                if (this.ShaderSetting.Flags) {
                    if (Math.floor((this.flagNumber / Math.pow(2., flag) % 2.)) != 1.)
                        this.flagNumber += Math.pow(2., flag);
                    this.setFloat(ShaderMaterialHelperStatics.uniformFlags, this.flagNumber);
                }
            };
            material.flagDown = function (flag) {
                if (this.ShaderSetting.Flags) {
                    if (Math.floor((this.flagNumber / Math.pow(2., flag) % 2.)) == 1.)
                        this.flagNumber -= Math.pow(2., flag);
                    this.setFloat(ShaderMaterialHelperStatics.uniformFlags, this.flagNumber);
                }
            };
            material.onCompiled = function () {
            };
            if (this.Setting.Texture2Ds != null) {
                for (var s in this.Setting.Texture2Ds) {
                    // setTexture2D
                    var texture = new ShaderMaterialHelper().DefineTexture(this.Setting.Texture2Ds[s].key, scene);
                    material.setTexture(ShaderMaterialHelperStatics.Texture2D + s, texture);
                }
            }
            if (this.Setting.TextureCubes != null) {
                for (var s in this.Setting.TextureCubes) {
                    // setTexture2D
                    var texture = new ShaderMaterialHelper().DefineCubeTexture(this.Setting.TextureCubes[s].key, scene);
                    material.setTexture(ShaderMaterialHelperStatics.TextureCube + s, texture);
                    material.setMatrix(ShaderMaterialHelperStatics.ReflectMatrix, texture.getReflectionTextureMatrix());
                }
            }
            Shader.Me = null;
            return material;
        };
        ShaderBuilder.prototype.Build = function () {
            Shader.Me.Parent.Setting = Shader.Me.Setting;
            Shader.Me = Shader.Me.Parent;
            return this.Body;
        };
        ShaderBuilder.prototype.BuildMaterial = function (scene) {
            this.PrepareBeforeMaterialBuild(scene);
            if (Shader.ShaderIdentity == null)
                Shader.ShaderIdentity = 0;
            Shader.ShaderIdentity++;
            var shaderMaterial = new ShaderMaterialHelper().ShaderMaterial("ShaderBuilder_" + Shader.ShaderIdentity, scene, {
                Pixel: Shader.Join(this.Fragment)
                    .replace("#[Source]", this.Body),
                Vertex: Shader.Join(this.Vertex)
                    .replace("#[Source]", Shader.Def(this.VertexBody, ""))
                    .replace("#[AfterFinishVertex]", Shader.Def(this.AfterVertex, ""))
            }, {
                uniforms: this.Uniforms,
                attributes: this.Attributes
            });
            Shader.Indexer = 1;
            return this.PrepareMaterial(shaderMaterial, scene);
        };
        ShaderBuilder.prototype.Event = function (index, mat) {
            Shader.Me.Setting.Flags = true;
            Shader.Indexer++;
            this.Body = Shader.Def(this.Body, "");
            this.Body += "  if ( floor(mod( " + ShaderMaterialHelperStatics.uniformFlags + "/pow(2.," + Shader.Print(index) + "),2.)) == 1.) { " + mat + " } ";
            return this;
        };
        ShaderBuilder.prototype.EventVertex = function (index, mat) {
            Shader.Me.Setting.Flags = true;
            Shader.Me.Setting.Vertex = true;
            Shader.Indexer++;
            this.VertexBody = Shader.Def(this.VertexBody, "");
            this.VertexBody += " if( floor(mod( " + ShaderMaterialHelperStatics.uniformFlags + "/pow(2.," + Shader.Print(index) + "),2.)) == 1. ){ " + mat + "}";
            return this;
        };
        ShaderBuilder.prototype.Transparency = function () {
            Shader.Me.Setting.Transparency = true;
            return this;
        };
        ShaderBuilder.prototype.Wired = function () {
            Shader.Me.Setting.Wire = true;
            return this;
        };
        ShaderBuilder.prototype.VertexShader = function (mat) {
            this.VertexBody = Shader.Def(this.VertexBody, "");
            this.VertexBody += mat;
            return this;
        };
        ShaderBuilder.prototype.Solid = function (color) {
            color = Shader.Def(color, { r: 0., g: 0., b: 0., a: 1. });
            color.a = Shader.Def(color.a, 1.);
            color.r = Shader.Def(color.r, 0.);
            color.g = Shader.Def(color.g, 0.);
            color.b = Shader.Def(color.b, 0.);
            this.Body = Shader.Def(this.Body, "");
            this.Body += " result = vec4(" + Shader.Print(color.r) + "," + Shader.Print(color.g) + "," + Shader.Print(color.b) + "," + Shader.Print(color.a) + ");";
            return this;
        };
        ShaderBuilder.prototype.GetMapIndex = function (key) {
            if (Shader.Me.Setting.Texture2Ds != null) {
                for (var it in Shader.Me.Setting.Texture2Ds) {
                    if (this.Setting.Texture2Ds[it].key == key) {
                        return it;
                    }
                }
            }
            else
                Shader.Me.Setting.Texture2Ds = [];
            return -1;
        };
        ShaderBuilder.prototype.GetCubeMapIndex = function (key) {
            if (Shader.Me.Setting.TextureCubes != null) {
                for (var it in Shader.Me.Setting.TextureCubes) {
                    if (this.Setting.TextureCubes[it].key == key) {
                        return it;
                    }
                }
            }
            else
                Shader.Me.Setting.TextureCubes = [];
            return -1;
        };
        ShaderBuilder.prototype.Map = function (option) {
            Shader.Indexer++;
            option = Shader.Def(option, { path: '/images/color.png' });
            var s = Shader.Me.GetMapIndex(option.path);
            if (s == -1) {
                Shader.Me.Setting.Texture2Ds.push({ key: option.path, inVertex: option.useInVertex, inFragment: true });
            }
            else {
                Shader.Me.Setting.Texture2Ds[s].inVertex = true;
            }
            s = Shader.Me.GetMapIndex(option.path);
            Shader.Me.Setting.Center = true;
            Shader.Me.Setting.Helpers = true;
            Shader.Me.Setting.Uv = true;
            option.normal = Shader.Def(option.normal, Normals.Map);
            option.alpha = Shader.Def(option.alpha, false);
            option.bias = Shader.Def(option.bias, "0.");
            option.normalLevel = Shader.Def(option.normalLevel, 1.0);
            option.path = Shader.Def(option.path, "qa.jpg");
            option.rotation = Shader.Def(option.rotation, { x: 0, y: 0, z: 0 });
            option.scaleX = Shader.Def(option.scaleX, 1.);
            option.scaleY = Shader.Def(option.scaleY, 1.);
            option.useInVertex = Shader.Def(option.useInVertex, false);
            option.x = Shader.Def(option.x, 0.0);
            option.y = Shader.Def(option.y, 0.0);
            option.uv = Shader.Def(option.uv, ShaderMaterialHelperStatics.Uv);
            option.animation = Shader.Def(option.animation, false);
            option.tiled = Shader.Def(option.tiled, false);
            option.columnIndex = Shader.Def(option.columnIndex, 1);
            option.rowIndex = Shader.Def(option.rowIndex, 1);
            option.animationSpeed = Shader.Def(option.animationSpeed, 2000);
            option.animationFrameEnd = Shader.Def(option.animationFrameEnd, 100) + option.indexCount;
            option.animationFrameStart = Shader.Def(option.animationFrameStart, 0) + option.indexCount;
            option.indexCount = Shader.Def(option.indexCount, 1);
            var frameLength = Math.min(option.animationFrameEnd - option.animationFrameStart, option.indexCount * option.indexCount);
            var uv = Shader.Def(option.uv, ShaderMaterialHelperStatics.Uv);
            if (option.uv == "planar") {
                uv = ShaderMaterialHelperStatics.Position;
            }
            else {
                uv = 'vec3(' + option.uv + '.x,' + option.uv + '.y,0.)';
            }
            option.scaleX /= option.indexCount;
            option.scaleY /= option.indexCount;
            var rotate = ["vec3 centeri#[Ind] = " + ShaderMaterialHelperStatics.Center + ";",
                "vec3 ppo#[Ind] = r_z( " + uv + "," + Shader.Print(option.rotation.x) + ",centeri#[Ind]);  ",
                " ppo#[Ind] = r_y( ppo#[Ind]," + Shader.Print(option.rotation.y) + ",centeri#[Ind]);  ",
                " ppo#[Ind] = r_x( ppo#[Ind]," + Shader.Print(option.rotation.x) + ",centeri#[Ind]); ",
                "vec3 nrm#[Ind] = r_z( " + option.normal + "," + Shader.Print(option.rotation.x) + ",centeri#[Ind]);  ",
                " nrm#[Ind] = r_y( nrm#[Ind]," + Shader.Print(option.rotation.y) + ",centeri#[Ind]);  ",
                " nrm#[Ind] = r_x( nrm#[Ind]," + Shader.Print(option.rotation.z) + ",centeri#[Ind]);  "].join("\n\
");
            var sresult = Shader.Join([rotate,
                " vec4 color#[Ind] = texture2D(" +
                    ShaderMaterialHelperStatics.Texture2D + s + " ,ppo#[Ind].xy*vec2(" +
                    Shader.Print(option.scaleX) + "," + Shader.Print(option.scaleY) + ")+vec2(" +
                    Shader.Print(option.x) + "," + Shader.Print(option.y) + ")" +
                    (option.bias != null ? "," + Shader.Print(option.bias) : "") + ");",
                " if(nrm#[Ind].z < " + Shader.Print(option.normalLevel) + "){ ",
                (option.alpha ? " result =  color#[Ind];" : "result = vec4(color#[Ind].rgb , 1.); "),
                "}"]);
            if (option.indexCount > 1 || option.tiled) {
                option.columnIndex = option.indexCount - option.columnIndex + 1.0;
                sresult = [
                    " vec3 uvt#[Ind] = vec3(" + uv + ".x*" + Shader.Print(option.scaleX) + "+" + Shader.Print(option.x) + "," + uv + ".y*" + Shader.Print(option.scaleY) + "+" + Shader.Print(option.y) + ",0.0);     ",
                    "             ",
                    " float xst#[Ind] = 1./(" + Shader.Print(option.indexCount) + "*2.);                                                    ",
                    " float yst#[Ind] =1./(" + Shader.Print(option.indexCount) + "*2.);                                                     ",
                    " float xs#[Ind] = 1./" + Shader.Print(option.indexCount) + ";                                                     ",
                    " float ys#[Ind] = 1./" + Shader.Print(option.indexCount) + ";                                                     ",
                    " float yid#[Ind] = " + Shader.Print(option.columnIndex - 1.0) + " ;                                                      ",
                    " float xid#[Ind] =  " + Shader.Print(option.rowIndex - 1.0) + ";                                                      ",
                    option.animation ? " float ind_a#[Ind] = floor(mod(time*0.001*" + Shader.Print(option.animationSpeed) + ",   " + Shader.Print(frameLength) + " )+" + Shader.Print(option.animationFrameStart) + ");" +
                        " yid#[Ind] = " + Shader.Print(option.indexCount) + "- floor(ind_a#[Ind] /  " + Shader.Print(option.indexCount) + ");" +
                        " xid#[Ind] =  floor(mod(ind_a#[Ind] ,  " + Shader.Print(option.indexCount) + ")); "
                        : "",
                    " float xi#[Ind] = mod(uvt#[Ind].x ,xs#[Ind])+xs#[Ind]*xid#[Ind]  ;                                   ",
                    " float yi#[Ind] = mod(uvt#[Ind].y ,ys#[Ind])+ys#[Ind]*yid#[Ind]  ;                                   ",
                    "                                                                       ",
                    " float xi2#[Ind] = mod(uvt#[Ind].x -xs#[Ind]*0.5 ,xs#[Ind])+xs#[Ind]*xid#[Ind]      ;                     ",
                    " float yi2#[Ind] = mod(uvt#[Ind].y -ys#[Ind]*0.5,ys#[Ind])+ys#[Ind]*yid#[Ind]   ;                         ",
                    "                                                                       ",
                    "                                                                       ",
                    " vec4 f#[Ind] = texture2D(" + ShaderMaterialHelperStatics.Texture2D + s + ",vec2(xi#[Ind],yi#[Ind])) ;                             ",
                    " result =   f#[Ind] ;                                               ",
                    (option.tiled ? [" vec4 f2#[Ind] = texture2D(" + ShaderMaterialHelperStatics.Texture2D + s + ",vec2(xi2#[Ind]+xid#[Ind] ,yi#[Ind])) ;                      ",
                        " vec4 f3#[Ind] = texture2D(" + ShaderMaterialHelperStatics.Texture2D + s + ",vec2(xi#[Ind],yi2#[Ind]+yid#[Ind])) ;                       ",
                        " vec4 f4#[Ind] = texture2D(" + ShaderMaterialHelperStatics.Texture2D + s + ",vec2(xi2#[Ind]+xid#[Ind],yi2#[Ind]+yid#[Ind])) ;                  ",
                        "                                                                       ",
                        "                                                                       ",
                        " float ir#[Ind]  = 0.,ir2#[Ind] = 0.;                                              ",
                        "                                                                       ",
                        "     if( yi2#[Ind]  >= yid#[Ind] *ys#[Ind] ){                                            ",
                        "         ir2#[Ind]  = min(2.,max(0.,( yi2#[Ind]-yid#[Ind] *ys#[Ind])*2.0/ys#[Ind] ))   ;             ",
                        "         if(ir2#[Ind] > 1.0) ir2#[Ind] =1.0-(ir2#[Ind]-1.0);                             ",
                        "         ir2#[Ind] = min(1.0,max(0.0,pow(ir2#[Ind]," + Shader.Print(15.) + " )*" + Shader.Print(3.) + ")); ",
                        "         result =  result *(1.0-ir2#[Ind]) +f3#[Ind]*ir2#[Ind]  ;           ",
                        "     }                                                                 ",
                        " if( xi2#[Ind]  >= xid#[Ind] *xs#[Ind]   ){                                               ",
                        "         ir2#[Ind]  = min(2.,max(0.,( xi2#[Ind]-xid#[Ind] *xs#[Ind])*2.0/xs#[Ind] ))   ;             ",
                        "         if(ir2#[Ind] > 1.0) ir2#[Ind] =1.0-(ir2#[Ind]-1.0);                             ",
                        "         ir2#[Ind] = min(1.0,max(0.0,pow(ir2#[Ind]," + Shader.Print(15.) + " )*" + Shader.Print(3.) + ")); ",
                        "         result = result *(1.0-ir2#[Ind]) +f2#[Ind]*ir2#[Ind]  ;           ",
                        "     }  ",
                        " if( xi2#[Ind]  >= xid#[Ind] *xs#[Ind]  && xi2#[Ind]  >= xid#[Ind] *xs#[Ind]  ){                                               ",
                        "         ir2#[Ind]  = min(2.,max(0.,( xi2#[Ind]-xid#[Ind] *xs#[Ind])*2.0/xs#[Ind] ))   ;             ",
                        "  float       ir3#[Ind]  = min(2.,max(0.,( yi2#[Ind]-yid#[Ind] *ys#[Ind])*2.0/ys#[Ind] ))   ;             ",
                        "         if(ir2#[Ind] > 1.0) ir2#[Ind] =1.0-(ir2#[Ind]-1.0);                             ",
                        "         if(ir3#[Ind] > 1.0) ir3#[Ind] =1.0-(ir3#[Ind]-1.0);                             ",
                        "         ir2#[Ind] = min(1.0,max(0.0,pow(ir2#[Ind]," + Shader.Print(15.) + " )*" + Shader.Print(3.) + ")); ",
                        "         ir3#[Ind] = min(1.0,max(0.0,pow(ir3#[Ind]," + Shader.Print(15.) + " )*" + Shader.Print(3.) + ")); ",
                        "         ir2#[Ind] = min(1.0,max(0.0, ir2#[Ind]* ir3#[Ind] )); ",
                        " if(nrm#[Ind].z < " + Shader.Print(option.normalLevel) + "){ ",
                        (option.alpha ? "    result =  result *(1.0-ir2#[Ind]) +f4#[Ind]* ir2#[Ind]   ;" : "    result = vec4(result.xyz*(1.0-ir2#[Ind]) +f4#[Ind].xyz* ir2#[Ind]   ,1.0); "),
                        "}",
                        "     }  "
                    ].join("\n") : "")].join("\n");
            }
            sresult = Shader.Replace(sresult, '#[Ind]', "_" + Shader.Indexer + "_");
            this.Body = Shader.Def(this.Body, "");
            this.Body += sresult;
            return this;
        };
        ShaderBuilder.prototype.Multi = function (mats, combine) {
            combine = Shader.Def(combine, true);
            Shader.Indexer++;
            var pre = "", ps = ["", "", "", ""], psh = "0.0";
            for (var i = 0; i < mats.length; i++) {
                if (mats[i].result == undefined || mats[i].result == null)
                    mats[i] = { result: mats[i], opacity: 1.0 };
                pre += " vec4 result#[Ind]" + i + ";result#[Ind]" + i + " = vec4(0.,0.,0.,0.); float rp#[Ind]" + i + " = " + Shader.Print(mats[i].opacity) + "; \n\
";
                pre += mats[i].result + "\n\
                ";
                pre += " result#[Ind]" + i + " = result; \n\
";
                ps[0] += (i == 0 ? "" : " + ") + "result#[Ind]" + i + ".x*rp#[Ind]" + i;
                ps[1] += (i == 0 ? "" : " + ") + "result#[Ind]" + i + ".y*rp#[Ind]" + i;
                ps[2] += (i == 0 ? "" : " + ") + "result#[Ind]" + i + ".z*rp#[Ind]" + i;
                ps[3] += (i == 0 ? "" : " + ") + "result#[Ind]" + i + ".w*rp#[Ind]" + i;
                psh += "+" + Shader.Print(mats[i].opacity);
            }
            if (combine) {
                ps[0] = "(" + ps[0] + ")/(" + Shader.Print(psh) + ")";
                ps[1] = "(" + ps[1] + ")/(" + Shader.Print(psh) + ")";
                ps[2] = "(" + ps[2] + ")/(" + Shader.Print(psh) + ")";
                ps[3] = "(" + ps[3] + ")/(" + Shader.Print(psh) + ")";
            }
            pre += "result = vec4(" + ps[0] + "," + ps[1] + "," + ps[2] + "," + ps[3] + ");";
            this.Body = Shader.Def(this.Body, "");
            this.Body += Shader.Replace(pre, "#[Ind]", "_" + Shader.Indexer + "_");
            return this;
        };
        ShaderBuilder.prototype.Back = function (mat) {
            Shader.Me.Setting.Back = true;
            mat = Shader.Def(mat, '');
            this.Body = Shader.Def(this.Body, "");
            this.Body += 'if(' + ShaderMaterialHelperStatics.face_back + '){' + mat + ';}';
            return this;
        };
        ShaderBuilder.prototype.InLine = function (mat) {
            mat = Shader.Def(mat, '');
            this.Body = Shader.Def(this.Body, "");
            this.Body += mat;
            return this;
        };
        ShaderBuilder.prototype.Front = function (mat) {
            mat = Shader.Def(mat, '');
            this.Body = Shader.Def(this.Body, "");
            this.Body += 'if(' + ShaderMaterialHelperStatics.face_front + '){' + mat + ';}';
            return this;
        };
        ShaderBuilder.prototype.Range = function (mat1, mat2, option) {
            Shader.Indexer++;
            var k = Shader.Indexer;
            option.start = Shader.Def(option.start, 0.);
            option.end = Shader.Def(option.end, 1.);
            option.direction = Shader.Def(option.direction, ShaderMaterialHelperStatics.Position + '.y');
            var sresult = [
                "float s_r_dim#[Ind] = " + option.direction + ";",
                "if(s_r_dim#[Ind] > " + Shader.Print(option.end) + "){",
                mat2,
                "}",
                "else { ",
                mat1,
                "   vec4 mat1#[Ind]; mat1#[Ind]  = result;",
                "   if(s_r_dim#[Ind] > " + Shader.Print(option.start) + "){ ",
                mat2,
                "       vec4 mati2#[Ind];mati2#[Ind] = result;",
                "       float s_r_cp#[Ind]  = (s_r_dim#[Ind] - (" + Shader.Print(option.start) + "))/(" + Shader.Print(option.end) + "-(" + Shader.Print(option.start) + "));",
                "       float s_r_c#[Ind]  = 1.0 - s_r_cp#[Ind];",
                "       result = vec4(mat1#[Ind].x*s_r_c#[Ind]+mati2#[Ind].x*s_r_cp#[Ind],mat1#[Ind].y*s_r_c#[Ind]+mati2#[Ind].y*s_r_cp#[Ind],mat1#[Ind].z*s_r_c#[Ind]+mati2#[Ind].z*s_r_cp#[Ind],mat1#[Ind].w*s_r_c#[Ind]+mati2#[Ind].w*s_r_cp#[Ind]);",
                "   }",
                "   else { result = mat1#[Ind]; }",
                "}"
            ].join('\n\
');
            sresult = Shader.Replace(sresult, '#[Ind]', "_" + Shader.Indexer + "_");
            this.Body = Shader.Def(this.Body, "");
            this.Body += sresult;
            return this;
        };
        ShaderBuilder.prototype.Reference = function (index, mat) {
            if (Shader.Me.References == null)
                Shader.Me.References = "";
            var sresult = "vec4 resHelp#[Ind] = result;";
            if (Shader.Me.References.indexOf("," + index + ",") == -1) {
                Shader.Me.References += "," + index + ",";
                sresult += " vec4 result_" + index + " = vec4(0.);\n\
                ";
            }
            if (mat == null) {
                sresult += "  result_" + index + " = result;";
            }
            else {
                sresult += mat + "\n\
                 result_" + index + " = result;";
            }
            sresult += "result = resHelp#[Ind] ;";
            sresult = Shader.Replace(sresult, '#[Ind]', "_" + Shader.Indexer + "_");
            this.Body = Shader.Def(this.Body, "");
            this.Body += sresult;
            return this;
        };
        ShaderBuilder.prototype.ReplaceColor = function (index, color, mat, option) {
            Shader.Indexer++;
            option = Shader.Def(option, {});
            var d = Shader.Def(option.rangeStep, -0.280);
            var d2 = Shader.Def(option.rangePower, 0.0);
            var d3 = Shader.Def(option.colorIndex, 0.0);
            var d4 = Shader.Def(option.colorStep, 1.0);
            var ilg = Shader.Def(option.indexToEnd, false);
            var lg = " > 0.5 + " + Shader.Print(d) + " ";
            var lw = " < 0.5 - " + Shader.Print(d) + " ";
            var rr = "((result_" + index + ".x*" + Shader.Print(d4) + "-" + Shader.Print(d3) + ")>1.0 ? 0. : max(0.,(result_" + index + ".x*" + Shader.Print(d4) + "-" + Shader.Print(d3) + ")))";
            var rg = "((result_" + index + ".y*" + Shader.Print(d4) + "-" + Shader.Print(d3) + ")>1.0 ? 0. : max(0.,(result_" + index + ".y*" + Shader.Print(d4) + "-" + Shader.Print(d3) + ")))";
            var rb = "((result_" + index + ".z*" + Shader.Print(d4) + "-" + Shader.Print(d3) + ")>1.0 ? 0. : max(0.,(result_" + index + ".z*" + Shader.Print(d4) + "-" + Shader.Print(d3) + ")))";
            if (ilg) {
                rr = "min(1.0, max(0.,(result_" + index + ".x*" + Shader.Print(d4) + "-" + Shader.Print(d3) + ")))";
                rg = "min(1.0, max(0.,(result_" + index + ".y*" + Shader.Print(d4) + "-" + Shader.Print(d3) + ")))";
                rb = "min(1.0, max(0.,(result_" + index + ".z*" + Shader.Print(d4) + "-" + Shader.Print(d3) + ")))";
            }
            var a = " && ";
            var p = " + ";
            var r = "";
            var cond = "";
            switch (color) {
                case Helper.White:
                    cond = rr + lg + a + rg + lg + a + rb + lg;
                    r = "(" + rr + p + rg + p + rb + ")/3.0";
                    break;
                case Helper.Cyan:
                    cond = rr + lw + a + rg + lg + a + rb + lg;
                    r = "(" + rg + p + rb + ")/2.0 - (" + rr + ")/1.0";
                    break;
                case Helper.Pink:
                    cond = rr + lg + a + rg + lw + a + rb + lg;
                    r = "(" + rr + p + rb + ")/2.0 - (" + rg + ")/1.0";
                    break;
                case Helper.Yellow:
                    cond = rr + lg + a + rg + lg + a + rb + lw;
                    r = "(" + rr + p + rg + ")/2.0 - (" + rb + ")/1.0";
                    break;
                case Helper.Blue:
                    cond = rr + lw + a + rg + lw + a + rb + lg;
                    r = "(" + rb + ")/1.0 - (" + rr + p + rg + ")/2.0";
                    break;
                case Helper.Red:
                    cond = rr + lg + a + rg + lw + a + rb + lw;
                    r = "(" + rr + ")/1.0 - (" + rg + p + rb + ")/2.0";
                    break;
                case Helper.Green:
                    cond = rr + lw + a + rg + lg + a + rb + lw;
                    r = "(" + rg + ")/1.0 - (" + rr + p + rb + ")/2.0";
                    break;
                case Helper.Black:
                    cond = rr + lw + a + rg + lw + a + rb + lw;
                    r = "1.0-(" + rr + p + rg + p + rb + ")/3.0";
                    break;
            }
            var sresult = " if( " + cond + " ) { vec4 oldrs#[Ind] = vec4(result);float al#[Ind] = max(0.0,min(1.0," + r + "+(" + Shader.Print(d2) + "))); float  l#[Ind] =  1.0-al#[Ind];  " + mat + " result = result*al#[Ind] +  oldrs#[Ind] * l#[Ind];    }";
            sresult = Shader.Replace(sresult, '#[Ind]', "_" + Shader.Indexer + "_");
            this.Body = Shader.Def(this.Body, "");
            this.Body += sresult;
            return this;
        };
        ShaderBuilder.prototype.Blue = function (index, mat, option) {
            return this.ReplaceColor(index, Helper.Blue, mat, option);
        };
        ShaderBuilder.prototype.Cyan = function (index, mat, option) {
            return this.ReplaceColor(index, Helper.Cyan, mat, option);
        };
        ShaderBuilder.prototype.Red = function (index, mat, option) {
            return this.ReplaceColor(index, Helper.Red, mat, option);
        };
        ShaderBuilder.prototype.Yellow = function (index, mat, option) {
            return this.ReplaceColor(index, Helper.Yellow, mat, option);
        };
        ShaderBuilder.prototype.Green = function (index, mat, option) {
            return this.ReplaceColor(index, Helper.Green, mat, option);
        };
        ShaderBuilder.prototype.Pink = function (index, mat, option) {
            return this.ReplaceColor(index, Helper.Pink, mat, option);
        };
        ShaderBuilder.prototype.White = function (index, mat, option) {
            return this.ReplaceColor(index, Helper.White, mat, option);
        };
        ShaderBuilder.prototype.Black = function (index, mat, option) {
            return this.ReplaceColor(index, Helper.Black, mat, option);
        };
        ShaderBuilder.prototype.ReflectCube = function (option) {
            Shader.Indexer++;
            option = Shader.Def(option, { path: '/images/cube/a' });
            var s = Shader.Me.GetCubeMapIndex(option.path);
            if (s == -1) {
                Shader.Me.Setting.TextureCubes.push({ key: option.path, inVertex: option.useInVertex, inFragment: true });
            }
            else {
                Shader.Me.Setting.TextureCubes[s].inVertex = true;
            }
            s = Shader.Me.GetCubeMapIndex(option.path);
            option.normal = Shader.Def(option.normal, Normals.Map);
            option.alpha = Shader.Def(option.alpha, false);
            option.bias = Shader.Def(option.bias, "0.");
            option.normalLevel = Shader.Def(option.normalLevel, 1.0);
            option.rotation = Shader.Def(option.rotation, { x: 0, y: 0, z: 0 });
            option.scaleX = Shader.Def(option.scaleX, 1.);
            option.scaleY = Shader.Def(option.scaleY, 1.);
            option.useInVertex = Shader.Def(option.useInVertex, false);
            option.x = Shader.Def(option.x, 0.0);
            option.y = Shader.Def(option.y, 0.0);
            option.uv = Shader.Def(option.uv, ShaderMaterialHelperStatics.Uv);
            option.reflectMap = Shader.Def(option.reflectMap, "1.");
            Shader.Me.Setting.Center = true;
            Shader.Me.Setting.Camera = true;
            Shader.Me.Setting.ReflectMatrix = true;
            var sresult = "";
            if (option.equirectangular) {
                option.path = Shader.Def(option.path, '/images/cube/roofl1.jpg');
                var s = Shader.Me.GetMapIndex(option.path);
                if (s == -1) {
                    Shader.Me.Setting.Texture2Ds.push({ key: option.path, inVertex: option.useInVertex, inFragment: true });
                }
                else {
                    Shader.Me.Setting.Texture2Ds[s].inVertex = true;
                }
                s = Shader.Me.GetMapIndex(option.path);
                Shader.Me.Setting.VertexWorld = true;
                Shader.Me.Setting.FragmentWorld = true;
                sresult = ' vec3 nWorld#[Ind] = normalize( mat3( world[0].xyz, world[1].xyz, world[2].xyz ) *  ' + option.normal + '); ' +
                    ' vec3 vReflect#[Ind] = normalize( reflect( normalize(  ' + ShaderMaterialHelperStatics.Camera + '- vec3(world * vec4(' + ShaderMaterialHelperStatics.Position + ', 1.0))),  nWorld#[Ind] ) ); ' +
                    'float yaw#[Ind] = .5 - atan( vReflect#[Ind].z, -1.* vReflect#[Ind].x ) / ( 2.0 * 3.14159265358979323846264);  ' +
                    ' float pitch#[Ind] = .5 - atan( vReflect#[Ind].y, length( vReflect#[Ind].xz ) ) / ( 3.14159265358979323846264);  ' +
                    ' vec3 color#[Ind] = texture2D( ' + ShaderMaterialHelperStatics.Texture2D + s + ', vec2( yaw#[Ind], pitch#[Ind]),' + Shader.Print(option.bias) + ' ).rgb; result = vec4(color#[Ind] ,1.);';
            }
            else {
                option.path = Shader.Def(option.path, "/images/cube/a");
                sresult = [
                    "vec3 viewDir#[Ind] =  " + ShaderMaterialHelperStatics.Position + " - " + ShaderMaterialHelperStatics.Camera + " ;",
                    "  viewDir#[Ind] =r_x(viewDir#[Ind] ," + Shader.Print(option.rotation.x) + ",  " + ShaderMaterialHelperStatics.Center + ");",
                    "  viewDir#[Ind] =r_y(viewDir#[Ind] ," + Shader.Print(option.rotation.y) + "," + ShaderMaterialHelperStatics.Center + ");",
                    "  viewDir#[Ind] =r_z(viewDir#[Ind] ," + Shader.Print(option.rotation.z) + "," + ShaderMaterialHelperStatics.Center + ");",
                    "vec3 coords#[Ind] = " + (option.refract ? "refract" : "reflect") + "(viewDir#[Ind]" + (option.revers ? "*vec3(1.0)" : "*vec3(-1.0)") + ", " + option.normal + " " + (option.refract ? ",(" + Shader.Print(option.refractMap) + ")" : "") + " )+" + ShaderMaterialHelperStatics.Position + "; ",
                    "vec3 vReflectionUVW#[Ind] = vec3( " + ShaderMaterialHelperStatics.ReflectMatrix + " *  vec4(coords#[Ind], 0)); ",
                    "vec3 rc#[Ind]= textureCube(" +
                        ShaderMaterialHelperStatics.TextureCube + s + ", vReflectionUVW#[Ind]," + Shader.Print(option.bias) + ").rgb;",
                    "result =result  + vec4(rc#[Ind].x ,rc#[Ind].y,rc#[Ind].z, " + (!option.alpha ? "1." : "(rc#[Ind].x+rc#[Ind].y+rc#[Ind].z)/3.0 ") + ")*(min(1.,max(0.," + Shader.Print(option.reflectMap) + ")));  "
                ].join('\n\
            ');
            }
            sresult = Shader.Replace(sresult, '#[Ind]', "_" + Shader.Indexer + "_");
            this.Body = Shader.Def(this.Body, "");
            this.Body += sresult;
            return this;
        };
        ShaderBuilder.prototype.NormalMap = function (val, mat) {
            Shader.Me.Setting.NormalOpacity = val;
            Shader.Me.Setting.NormalMap = mat;
            return this;
        };
        ShaderBuilder.prototype.SpecularMap = function (mat) {
            Shader.Me.Setting.SpecularMap = mat;
            return this;
        };
        ShaderBuilder.prototype.Instance = function () {
            var setting = Shader.Me.Setting;
            var instance = new ShaderBuilder();
            instance.Parent = Shader.Me;
            instance.Setting = setting;
            return instance;
        };
        ShaderBuilder.prototype.Reflect = function (option, opacity) {
            opacity = Shader.Def(opacity, 1.);
            return this.Multi(["result = result;", { result: this.Instance().ReflectCube(option).Build(), opacity: opacity }], true);
        };
        ShaderBuilder.prototype.Light = function (option) {
            option = Shader.Def(option, {});
            option.color = Shader.Def(option.color, { r: 1., g: 1., b: 1., a: 1. });
            option.darkColorMode = Shader.Def(option.darkColorMode, false);
            option.direction = Shader.Def(option.direction, "vec3(sin(time*0.02)*28.,sin(time*0.02)*8.+10.,cos(time*0.02)*28.)");
            option.normal = Shader.Def(option.normal, Normals.Map);
            option.rotation = Shader.Def(option.rotation, { x: 0., y: 0., z: 0. });
            option.specular = Shader.Def(option.specular, Speculars.Map);
            option.specularLevel = Shader.Def(option.specularLevel, 1.);
            option.specularPower = Shader.Def(option.specularPower, 1.);
            option.phonge = Shader.Def(option.phonge, 0.);
            option.phongePower = Shader.Def(option.phongePower, 1.);
            option.phongeLevel = Shader.Def(option.phongeLevel, 1.);
            option.supplement = Shader.Def(option.supplement, false);
            option.reducer = Shader.Def(option.reducer, '1.');
            var c_c = option.color;
            if (option.darkColorMode) {
                c_c.a = 1.0 - c_c.a;
                c_c.r = 1.0 - c_c.r;
                c_c.g = 1.0 - c_c.g;
                c_c.b = 1.0 - c_c.b;
                c_c.a = c_c.a - 1.0;
            }
            Shader.Indexer++;
            Shader.Me.Setting.Camera = true;
            Shader.Me.Setting.FragmentWorld = true;
            Shader.Me.Setting.VertexWorld = true;
            Shader.Me.Setting.Helpers = true;
            Shader.Me.Setting.Center = true;
            var sresult = Shader.Join([
                "  vec3 dir#[Ind] = normalize(  vec3(world * vec4(" + ShaderMaterialHelperStatics.Position + ",1.)) - " + ShaderMaterialHelperStatics.Camera + ");",
                "  dir#[Ind] =r_x(dir#[Ind] ," + Shader.Print(option.rotation.x) + ",vec3(" + ShaderMaterialHelperStatics.Center + "));",
                "  dir#[Ind] =r_y(dir#[Ind] ," + Shader.Print(option.rotation.y) + ",vec3(" + ShaderMaterialHelperStatics.Center + "));",
                "  dir#[Ind] =r_z(dir#[Ind] ," + Shader.Print(option.rotation.z) + ",vec3(" + ShaderMaterialHelperStatics.Center + "));",
                "  vec4 p1#[Ind] = vec4(" + option.direction + ",.0);                                ",
                "  vec4 c1#[Ind] = vec4(" + Shader.Print(c_c.r) + "," + Shader.Print(c_c.g) + "," + Shader.Print(c_c.b) + ",0.0); ",
                "  vec3 vnrm#[Ind] = normalize(vec3(world * vec4(" + option.normal + ", 0.0)));          ",
                "  vec3 l#[Ind]= normalize(p1#[Ind].xyz " +
                    (!option.parallel ? "- vec3(world * vec4(" + ShaderMaterialHelperStatics.Position + ",1.))  " : "")
                    + ");   ",
                "  vec3 vw#[Ind]= normalize(camera -  vec3(world * vec4(" + ShaderMaterialHelperStatics.Position + ",1.)));  ",
                "  vec3 aw#[Ind]= normalize(vw#[Ind]+ l#[Ind]);  ",
                "  float sc#[Ind]= max(0.,min(1., dot(vnrm#[Ind], aw#[Ind])));   ",
                "  sc#[Ind]= pow(sc#[Ind]*min(1.,max(0.," + Shader.Print(option.specular) + ")), (" + Shader.Print(option.specularPower * 1000.) + "))/" + Shader.Print(option.specularLevel) + " ;  ",
                " float  ph#[Ind]= pow(" + Shader.Print(option.phonge) + "*2., (" + Shader.Print(option.phongePower) + "*0.3333))/(" + Shader.Print(option.phongeLevel) + "*3.) ;  ",
                "  float ndl#[Ind] = max(0., dot(vnrm#[Ind], l#[Ind]));                            ",
                "  float ls#[Ind] = " + (option.supplement ? "1.0 -" : "") + "max(0.,min(1.,ndl#[Ind]*ph#[Ind]*(" + Shader.Print(option.reducer) + "))) ;         ",
                "  result  += vec4( c1#[Ind].xyz*( ls#[Ind])*" + Shader.Print(c_c.a) + " , ls#[Ind]); ",
                "  float ls2#[Ind] = " + (option.supplement ? "1.0 -" : "") + "max(0.,min(1., sc#[Ind]*(" + Shader.Print(option.reducer) + "))) ;         ",
                "  result  += vec4( c1#[Ind].xyz*( ls2#[Ind])*" + Shader.Print(c_c.a) + " , ls2#[Ind]); ",
            ]);
            sresult = Shader.Replace(sresult, '#[Ind]', "_" + Shader.Indexer + "_");
            this.Body = Shader.Def(this.Body, "");
            this.Body += sresult;
            return this;
        };
        ShaderBuilder.prototype.Effect = function (option) {
            var op = Shader.Def(option, {});
            Shader.Indexer++;
            var sresult = [
                'vec4 res#[Ind] = vec4(0.);',
                'res#[Ind].x = ' + (op.px ? Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(op.px, 'px', 'result.x'), 'py', 'result.y'), 'pz', 'result.z'), 'pw', 'result.w') + ';' : ' result.x;'),
                'res#[Ind].y = ' + (op.py ? Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(op.py, 'px', 'result.x'), 'py', 'result.y'), 'pz', 'result.z'), 'pw', 'result.w') + ';' : ' result.y;'),
                'res#[Ind].z = ' + (op.pz ? Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(op.pz, 'px', 'result.x'), 'py', 'result.y'), 'pz', 'result.z'), 'pw', 'result.w') + ';' : ' result.z;'),
                'res#[Ind].w = ' + (op.pw ? Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(op.pw, 'px', 'result.x'), 'py', 'result.y'), 'pz', 'result.z'), 'pw', 'result.w') + ';' : ' result.w;'),
                'res#[Ind]  = ' + (op.pr ? ' vec4(' + Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(op.pr, 'pr', 'res#[Ind].x'), 'px', 'result.x'), 'py', 'result.y'), 'pz', 'result.z'), 'pw', 'result.w') + ','
                    + Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(op.pr, 'pr', 'res#[Ind].y'), 'px', 'result.x'), 'py', 'result.y'), 'pz', 'result.z'), 'pw', 'result.w') + ',' +
                    Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(op.pr, 'pr', 'res#[Ind].z'), 'px', 'result.x'), 'py', 'result.y'), 'pz', 'result.z'), 'pw', 'result.w')
                    + ',' +
                    Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(Shader.Replace(op.pr, 'pr', 'res#[Ind].w'), 'px', 'result.x'), 'py', 'result.y'), 'pz', 'result.z'), 'pw', 'result.w')
                    + ');' : ' res#[Ind]*1.0;'),
                'result = res#[Ind] ;'
            ].join('\n\
');
            sresult = Shader.Replace(sresult, '#[Ind]', "_" + Shader.Indexer + "_");
            this.Body = Shader.Def(this.Body, "");
            this.Body += sresult;
            return this;
        };
        return ShaderBuilder;
    })();
    BABYLON.ShaderBuilder = ShaderBuilder;
})(BABYLON || (BABYLON = {})); 
