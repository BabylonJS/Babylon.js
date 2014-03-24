bl_info = {
    "name": "Babylon.js",
    "author": "David Catuhe",
    "version": (1, 1),
    "blender": (2, 67, 0),
    "location": "File > Export > Babylon.js (.babylon)",
    "description": "Export Babylon.js scenes (.babylon)",
    "warning": "",
    "wiki_url": "",
    "tracker_url": "",
    "category": "Import-Export"}
    
import math
import os
import bpy
import string
import bpy_extras.io_utils
from bpy.props import *
import mathutils, math
import struct
import shutil
from os import remove
from bpy_extras.io_utils import (ExportHelper, axis_conversion)
from bpy.props import (BoolProperty, FloatProperty, StringProperty, EnumProperty, FloatVectorProperty)
from math import radians
from mathutils import *

MAX_VERTICES = 65535

class SubMesh:
    materialIndex = 0
    verticesStart = 0
    verticesCount = 0
    indexStart = 0
    indexCount = 0
    
class MultiMaterial:
    name = ""
    materials = []

class Export_babylon(bpy.types.Operator, ExportHelper):  
    """Export Babylon.js scene (.babylon)""" 
    bl_idname = "scene.babylon"
    bl_label = "Export Babylon.js scene"

    filename_ext = ".babylon"
    filepath = ""
    
    # global_scale = FloatProperty(name="Scale", min=0.01, max=1000.0, default=1.0)

    def execute(self, context):
           return Export_babylon.save(self, context, **self.as_keywords(ignore=("check_existing", "filter_glob", "global_scale")))
           
    def mesh_triangulate(mesh):
        try:
            import bmesh
            bm = bmesh.new()
            bm.from_mesh(mesh)
            bmesh.ops.triangulate(bm, faces=bm.faces)
            bm.to_mesh(mesh)
            mesh.calc_tessface()
            bm.free()
        except:
            pass

    def write_matrix4(file_handler, name, matrix):
        file_handler.write(",\""+name+"\":[")

        tempMatrix = matrix.copy()
        tempMatrix.transpose()

        first = True
        for vect in tempMatrix:
            if (first != True):
                file_handler.write(",")
            first = False;

            file_handler.write("%.4f,%.4f,%.4f,%.4f"%(vect[0],vect[1], vect[2], vect[3]))
                
        file_handler.write("]")
            
    def write_array3(file_handler, name, array):
        file_handler.write(",\""+name+"\":[" + "%.4f,%.4f,%.4f"%(array[0],array[1],array[2]) + "]")     
    
    def write_color(file_handler, name, color):
        file_handler.write(",\""+name+"\":[" + "%.4f,%.4f,%.4f"%(color.r,color.g,color.b) + "]")

    def write_vector(file_handler, name, vector):
        file_handler.write(",\""+name+"\":[" + "%.4f,%.4f,%.4f"%(vector.x,vector.z,vector.y) + "]")

    def write_quaternion(file_handler, name, quaternion):
        file_handler.write(",\""+name+"\":[" + "%.4f,%.4f,%.4f,%.4f"%(quaternion.x,quaternion.z,quaternion.y, -quaternion.w) + "]")

    def write_vectorScaled(file_handler, name, vector, mult):
        file_handler.write(",\""+name+"\":[" + "%.4f,%.4f,%.4f"%(vector.x * mult, vector.z * mult, vector.y * mult) + "]")
    
    def write_string(file_handler, name, string, noComma=False):
        if noComma == False:
            file_handler.write(",")
        file_handler.write("\""+name+"\":\"" + string + "\"")
    
    def write_float(file_handler, name, float):
        file_handler.write(",\""+name+"\":" + "%.4f"%(float))
        
    def write_int(file_handler, name, int, noComma=False):
        if noComma == False:
            file_handler.write(",")
        file_handler.write("\""+name+"\":" + str(int))
        
    def write_bool(file_handler, name, bool, noComma=False):    
        if noComma == False:
            file_handler.write(",") 
        if bool:
            file_handler.write("\""+name+"\":" + "true")
        else:
            file_handler.write("\""+name+"\":" + "false")
            
    def getDirection(matrix):
        return (matrix.to_3x3() * mathutils.Vector((0.0, 0.0, -1.0))).normalized()
            
    def export_camera(object, scene, file_handler):     
        rotation = mathutils.Vector((-object.rotation_euler[0] + math.pi / 2,
            object.rotation_euler[1], -object.rotation_euler[2]))
    
        file_handler.write("{")
        Export_babylon.write_string(file_handler, "name", object.name, True)        
        Export_babylon.write_string(file_handler, "id", object.name)
        Export_babylon.write_vector(file_handler, "position", object.location)
        Export_babylon.write_vector(file_handler, "rotation", rotation)
        Export_babylon.write_float(file_handler, "fov", object.data.angle)
        Export_babylon.write_float(file_handler, "minZ", object.data.clip_start)
        Export_babylon.write_float(file_handler, "maxZ", object.data.clip_end)
        Export_babylon.write_float(file_handler, "speed", 1.0)
        Export_babylon.write_float(file_handler, "inertia", 0.9)
        Export_babylon.write_bool(file_handler, "checkCollisions", object.data.checkCollisions)
        Export_babylon.write_bool(file_handler, "applyGravity", object.data.applyGravity)
        Export_babylon.write_array3(file_handler, "ellipsoid", object.data.ellipsoid)

        locAnim = False
        coma = False

        if object.animation_data:
            if object.animation_data.action:
                file_handler.write(",\"animations\":[")
                for fcurve in object.animation_data.action.fcurves:
                    if fcurve.data_path == "location" and locAnim == False:
                        Export_babylon.export_animation(object, scene, file_handler, "location", "position", coma, 1)
                        locAnim = coma = True
                file_handler.write("]")
                #Set Animations
                Export_babylon.write_bool(file_handler, "autoAnimate", True)
                Export_babylon.write_int(file_handler, "autoAnimateFrom", 0)
                Export_babylon.write_int(file_handler, "autoAnimateTo", bpy.context.scene.frame_end - bpy.context.scene.frame_start + 1)
                Export_babylon.write_bool(file_handler, "autoAnimateLoop", True)

        file_handler.write("}")
        
    def export_light(object, scene, file_handler):      
        light_type_items = {'POINT': 0, 'SUN': 1, 'SPOT': 2, 'HEMI': 3, 'AREA': 0}
        light_type = light_type_items[object.data.type]
        
        file_handler.write("{")
        Export_babylon.write_string(file_handler, "name", object.name, True)        
        Export_babylon.write_string(file_handler, "id", object.name)        
        Export_babylon.write_float(file_handler, "type", light_type)
        if light_type == 0:
            Export_babylon.write_vector(file_handler, "position", object.location)
        elif light_type == 1:
            direction = Export_babylon.getDirection(object.matrix_world)
            Export_babylon.write_vector(file_handler, "position", object.location)
            Export_babylon.write_vector(file_handler, "direction", direction)
        elif light_type == 2:
            Export_babylon.write_vector(file_handler, "position", object.location)
            direction = Export_babylon.getDirection(object.matrix_world)
            Export_babylon.write_vector(file_handler, "direction", direction)
            Export_babylon.write_float(file_handler, "angle", object.data.spot_size)
            Export_babylon.write_float(file_handler, "exponent", object.data.spot_blend * 2)
        else:
            matrix_world = object.matrix_world.copy()
            matrix_world.translation = mathutils.Vector((0, 0, 0))
            direction = mathutils.Vector((0, 0, -1)) * matrix_world
            Export_babylon.write_vector(file_handler, "direction", -direction)
            Export_babylon.write_color(file_handler, "groundColor", mathutils.Color((0, 0, 0)))
            
        Export_babylon.write_float(file_handler, "intensity", object.data.energy)
        
        if object.data.use_diffuse:
            Export_babylon.write_color(file_handler, "diffuse", object.data.color)
        else:
            Export_babylon.write_color(file_handler, "diffuse", mathutils.Color((0, 0, 0)))

        if object.data.use_specular:
            Export_babylon.write_color(file_handler, "specular", object.data.color)
        else:
            Export_babylon.write_color(file_handler, "specular", mathutils.Color((0, 0, 0)))
            
        file_handler.write("}")     
    
    def export_texture(slot, level, texture, scene, file_handler, filepath):    
        # Copy image to output
        try:
            image = texture.texture.image
            imageFilepath = os.path.normpath(bpy.path.abspath(image.filepath))
            basename = os.path.basename(imageFilepath)
            targetdir = os.path.dirname(filepath)
            targetpath = os.path.join(targetdir, basename)
            
            if image.packed_file:
                image.save_render(targetpath)
            else:
                sourcepath = bpy.path.abspath(image.filepath)
                shutil.copy(sourcepath, targetdir)
        except:
            pass
        
        # Export
        file_handler.write(",\""+slot+"\":{")
        Export_babylon.write_string(file_handler, "name", basename, True)
        Export_babylon.write_float(file_handler, "level", level)
        Export_babylon.write_float(file_handler, "hasAlpha", texture.texture.use_alpha)
        
        coordinatesMode = 0;
        if (texture.mapping == "CUBE"):
            coordinatesMode = 3;
        if (texture.mapping == "SPHERE"):
            coordinatesMode = 1;        
        Export_babylon.write_int(file_handler, "coordinatesMode", coordinatesMode)
        Export_babylon.write_float(file_handler, "uOffset", texture.offset.x)
        Export_babylon.write_float(file_handler, "vOffset", texture.offset.y)
        Export_babylon.write_float(file_handler, "uScale", texture.scale.x)
        Export_babylon.write_float(file_handler, "vScale", texture.scale.y)
        Export_babylon.write_float(file_handler, "uAng", 0)
        Export_babylon.write_float(file_handler, "vAng", 0)     
        Export_babylon.write_float(file_handler, "wAng", 0)
        
        texture_clampMode = 0;
        texture_wrapMode = 1;
        texture_mirrorMode = 2;
        if (texture.texture.extension == "REPEAT"):
            if (texture.texture.use_mirror_x):
                Export_babylon.write_int(file_handler, "wrapU", texture_mirrorMode)      
            else:
                Export_babylon.write_int(file_handler, "wrapU", texture_wrapMode) 
            if (texture.texture.use_mirror_y):	
                Export_babylon.write_int(file_handler, "wrapV", texture_mirrorMode)
            else:
                Export_babylon.write_int(file_handler, "wrapV", texture_wrapMode)
        else:
            Export_babylon.write_int(file_handler, "wrapU", texture_clampMode)     
            Export_babylon.write_int(file_handler, "wrapV", texture_clampMode)
            
        Export_babylon.write_int(file_handler, "coordinatesIndex", 0)
        
        file_handler.write("}") 
        
    def export_material(material, scene, file_handler, filepath):       
        file_handler.write("{")
        Export_babylon.write_string(file_handler, "name", material.name, True)      
        Export_babylon.write_string(file_handler, "id", material.name)
        Export_babylon.write_color(file_handler, "ambient", material.ambient * material.diffuse_color)
        Export_babylon.write_color(file_handler, "diffuse", material.diffuse_intensity * material.diffuse_color)
        Export_babylon.write_color(file_handler, "specular", material.specular_intensity * material.specular_color)
        Export_babylon.write_float(file_handler, "specularPower", material.specular_hardness)
        Export_babylon.write_color(file_handler, "emissive", material.emit * material.diffuse_color)        
        Export_babylon.write_float(file_handler, "alpha", material.alpha)
        Export_babylon.write_bool(file_handler, "backFaceCulling", material.game_settings.use_backface_culling)
                
        # Textures
        for mtex in material.texture_slots:
            if mtex and mtex.texture and mtex.texture.type == 'IMAGE':
                if mtex.texture.image:
                    if (mtex.use_map_color_diffuse and(mtex.texture_coords != 'REFLECTION')):
                        # Diffuse
                        Export_babylon.export_texture("diffuseTexture", mtex.diffuse_color_factor, mtex, scene, file_handler, filepath)
                    if mtex.use_map_ambient:
                        # Ambient
                        Export_babylon.export_texture("ambientTexture", mtex.ambient_factor, mtex, scene, file_handler, filepath)
                    if mtex.use_map_alpha:
                        # Opacity
                        Export_babylon.export_texture("opacityTexture", mtex.alpha_factor, mtex, scene, file_handler, filepath)
                    if mtex.use_map_color_diffuse and (mtex.texture_coords == 'REFLECTION'):
                        # Reflection
                        Export_babylon.export_texture("reflectionTexture", mtex.diffuse_color_factor, mtex, scene, file_handler, filepath)
                    if mtex.use_map_emit:
                        # Emissive
                        Export_babylon.export_texture("emissiveTexture", mtex.emit_factor, mtex, scene, file_handler, filepath)     
                    if mtex.use_map_normal:
                        # Bump
                        Export_babylon.export_texture("bumpTexture", mtex.emit_factor, mtex, scene, file_handler, filepath)                         
        
        file_handler.write("}")         
    
    def export_multimaterial(multimaterial, scene, file_handler):       
        file_handler.write("{")
        Export_babylon.write_string(file_handler, "name", multimaterial.name, True)
        Export_babylon.write_string(file_handler, "id", multimaterial.name)
        
        file_handler.write(",\"materials\":[")
        first = True
        for materialName in multimaterial.materials:
            if first != True:
                file_handler.write(",")
            file_handler.write("\"" + materialName +"\"")
            first = False
        file_handler.write("]")
        file_handler.write("}")

    def export_animation(object, scene, file_handler, typeBl, typeBa, coma, mult):
        if coma == True:
            file_handler.write(",")
        
        file_handler.write("{")
        Export_babylon.write_int(file_handler, "dataType", 1, True)
        Export_babylon.write_int(file_handler, "framePerSecond", 30)
        Export_babylon.write_int(file_handler, "loopBehavior", 1)
        Export_babylon.write_string(file_handler, "name", typeBa+" animation")
        Export_babylon.write_string(file_handler, "property", typeBa)
        
        file_handler.write(",\"keys\":[")
            
        frames = dict() 
        for fcurve in object.animation_data.action.fcurves:
            if fcurve.data_path == typeBl:
                for key in fcurve.keyframe_points: 
                    frame = key.co.x 
                    frames[frame] = 1
            
        #for each frame (next step ==> set for key frames)
        i = 0
        for Frame in sorted(frames):
            if i == 0 and Frame != 0.0:
                file_handler.write("{")
                Export_babylon.write_int(file_handler, "frame", 0, True)
                bpy.context.scene.frame_set(int(Frame + bpy.context.scene.frame_start))
                Export_babylon.write_vectorScaled(file_handler, "values", getattr(object,typeBl), mult)
                file_handler.write("},")
            i = i + 1
            file_handler.write("{")
            Export_babylon.write_int(file_handler, "frame", Frame, True)
            bpy.context.scene.frame_set(int(Frame + bpy.context.scene.frame_start))
            Export_babylon.write_vectorScaled(file_handler, "values", getattr(object,typeBl), mult)
            file_handler.write("}")
            if i != len(frames):
                file_handler.write(",")
            else:
                file_handler.write(",{")
                Export_babylon.write_int(file_handler, "frame", bpy.context.scene.frame_end - bpy.context.scene.frame_start + 1, True)
                bpy.context.scene.frame_set(int(Frame + bpy.context.scene.frame_start))
                Export_babylon.write_vectorScaled(file_handler, "values", getattr(object,typeBl), mult)
                file_handler.write("}")
        
        file_handler.write("]}")

    def export_mesh(object, scene, file_handler, multiMaterials, startFace, forcedParent, nameID):
        # Get mesh  
        mesh = object.to_mesh(scene, True, "PREVIEW")
        
        # Transform
        loc = mathutils.Vector((0, 0, 0))
        rot = mathutils.Quaternion((0, 0, 0, -1))
        scale = mathutils.Vector((1, 1, 1))
        
        hasSkeleton = False

        world = object.matrix_world
        if object.parent and object.parent.type == "ARMATURE" and len(object.vertex_groups) > 0:
            hasSkeleton = True
        else:
            if (object.parent):
                world = object.parent.matrix_world.inverted() * object.matrix_world

        loc, rot, scale = world.decompose()
                                                
        # Triangulate mesh if required
        Export_babylon.mesh_triangulate(mesh)
        
        # Getting vertices and indices
        positions=",\"positions\":["
        normals=",\"normals\":["
        indices=",\"indices\":["    

        hasUV = True;
        hasUV2 = True;
        hasVertexColor = True

        if len(mesh.tessface_uv_textures) > 0:
            UVmap=mesh.tessface_uv_textures[0].data
            uvs=",\"uvs\":["    
        else:
            hasUV = False
            
        if len(mesh.tessface_uv_textures) > 1:
            UV2map=mesh.tessface_uv_textures[1].data
            uvs2=",\"uvs2\":["  
        else:
            hasUV2 = False

        if len(mesh.vertex_colors) > 0:
            Colormap = mesh.tessface_vertex_colors.active.data
            colors=",\"colors\":["  
        else:
            hasVertexColor = False

        if hasSkeleton:
            skeletonWeight = ",\"matricesWeights\":["
            skeletonIndices = ",\"matricesIndices\":["
            
        alreadySavedVertices = []
        vertices_UVs=[]
        vertices_UV2s=[]
        vertices_Colors=[]
        vertices_indices=[]
        subMeshes = []

        offsetFace = 0
                
        for v in range(0, len(mesh.vertices)):
            alreadySavedVertices.append(False)
            vertices_UVs.append([])
            vertices_UV2s.append([])
            vertices_Colors.append([])
            vertices_indices.append([])
                       
        materialsCount = max(1, len(object.material_slots))
        verticesCount = 0
        indicesCount = 0

        for materialIndex in range(materialsCount):
            if offsetFace != 0:
                break

            subMeshes.append(SubMesh())
            subMeshes[materialIndex].materialIndex = materialIndex
            subMeshes[materialIndex].verticesStart = verticesCount
            subMeshes[materialIndex].indexStart = indicesCount
        
            for faceIndex in range(startFace, len(mesh.tessfaces)):  # For each face
                face = mesh.tessfaces[faceIndex]

                if face.material_index != materialIndex:
                    continue

                if verticesCount + 3 > MAX_VERTICES:
                    offsetFace = faceIndex
                    break

                for v in range(3): # For each vertex in face
                    vertex_index = face.vertices[v]

                    vertex = mesh.vertices[vertex_index]
                    position = vertex.co
                    normal = vertex.normal

                    #skeletons
                    if hasSkeleton:
                        matricesWeights = []
                        matricesIndices = 0
                        matricesWeights.append(0.0)
                        matricesWeights.append(0.0)
                        matricesWeights.append(0.0)
                        matricesWeights.append(0.0)

                        # Getting influences
                        i = 0
                        offset = 0
                        for group in vertex.groups:
                            index = group.group
                            weight = group.weight

                            for boneIndex, bone in enumerate(object.parent.pose.bones):
                                if object.vertex_groups[index].name == bone.name:
                                    matricesWeights[i] = weight
                                    matricesIndices += boneIndex << offset
                                    offset = offset + 8

                                    i = i + 1
                                    if (i == 4):
                                        break;
                            if (i == 4):
                                break;


                    # Texture coordinates
                    if hasUV:
                        vertex_UV = UVmap[face.index].uv[v]
                        
                    if hasUV2:
                        vertex_UV2 = UV2map[face.index].uv[v]

                    # Vertex color
                    if hasVertexColor:      
                        if v == 0:              
                            vertex_Color = Colormap[face.index].color1
                        if v == 1:              
                            vertex_Color = Colormap[face.index].color2
                        if v == 2:              
                            vertex_Color = Colormap[face.index].color3
                        
                    # Check if the current vertex is already saved                  
                    alreadySaved = alreadySavedVertices[vertex_index] and not hasSkeleton
                    if alreadySaved:
                        alreadySaved=False                      
                    
                        # UV
                        index_UV = 0
                        for savedIndex in vertices_indices[vertex_index]:
                            if hasUV:                                               
                                vUV = vertices_UVs[vertex_index][index_UV]
                                if (vUV[0]!=vertex_UV[0] or vUV[1]!=vertex_UV[1]):
                                    continue

                            if hasUV2:
                                vUV2 = vertices_UV2s[vertex_index][index_UV]
                                if (vUV2[0]!=vertex_UV2[0] or vUV2[1]!=vertex_UV2[1]):
                                    continue

                            if hasVertexColor:
                                vColor = vertices_Colors[vertex_index][index_UV]
                                if (vColor.r!=vertex_Color.r or vColor.g!=vertex_Color.g or vColor.b!=vertex_Color.b):
                                    continue

                            if vertices_indices[vertex_index][index_UV] >= subMeshes[materialIndex].verticesStart:
                                alreadySaved=True
                                break

                            index_UV+=1                 

                    if (alreadySaved):
                        # Reuse vertex
                        index=vertices_indices[vertex_index][index_UV]
                    else:
                        # Export new one
                        index=verticesCount
                        alreadySavedVertices[vertex_index]=True
                        if hasUV:
                            vertices_UVs[vertex_index].append(vertex_UV)
                            uvs+="%.4f,%.4f,"%(vertex_UV[0], vertex_UV[1])
                        if hasUV2:
                            vertices_UV2s[vertex_index].append(vertex_UV2)
                            uvs2+="%.4f,%.4f,"%(vertex_UV2[0], vertex_UV2[1])
                        if hasVertexColor:  
                            vertices_Colors[vertex_index].append(vertex_Color)
                            colors+="%.4f,%.4f,%.4f,"%(vertex_Color.r,vertex_Color.g,vertex_Color.b)
                        if hasSkeleton:
                            skeletonWeight+="%.4f,%.4f,%.4f,%.4f,"%(matricesWeights[0], matricesWeights[1], matricesWeights[2], matricesWeights[3])
                            skeletonIndices+="%i,"%(matricesIndices)


                        vertices_indices[vertex_index].append(index)
                        
                        positions+="%.4f,%.4f,%.4f,"%(position.x,position.z,position.y)             
                        normals+="%.4f,%.4f,%.4f,"%(normal.x,normal.z,normal.y)                     
                        
                        verticesCount += 1
                    indices+="%i,"%(index)
                    indicesCount += 1           
                    
            subMeshes[materialIndex].verticesCount = verticesCount - subMeshes[materialIndex].verticesStart
            subMeshes[materialIndex].indexCount = indicesCount - subMeshes[materialIndex].indexStart

        positions=positions.rstrip(',')
        normals=normals.rstrip(',')
        indices=indices.rstrip(',')
            
        positions+="]\n"
        normals+="]\n"
        indices+="]\n"  

        if hasUV:
            uvs=uvs.rstrip(',')
            uvs+="]\n"

        if hasUV2:
            uvs2=uvs2.rstrip(',')
            uvs2+="]\n"

        if hasVertexColor:
            colors=colors.rstrip(',')
            colors+="]\n"

        if hasSkeleton:
            skeletonWeight=skeletonWeight.rstrip(', ')
            skeletonWeight+="]\n"
            skeletonIndices= skeletonIndices.rstrip(', ')
            skeletonIndices+="]\n"

                
        # Writing mesh      
        file_handler.write("{")
        
        Export_babylon.write_string(file_handler, "name", object.name + nameID, True)        
        Export_babylon.write_string(file_handler, "id", object.name + nameID)   

        if forcedParent is None:     
            if object.parent != None:
                Export_babylon.write_string(file_handler, "parentId", object.parent.name)
        else:
            Export_babylon.write_string(file_handler, "parentId", forcedParent.name)
        
        if len(object.material_slots) == 1:
            material = object.material_slots[0].material
            Export_babylon.write_string(file_handler, "materialId", object.material_slots[0].name)
            
            if material.game_settings.face_orientation != "BILLBOARD":
                billboardMode = 0
            else:
                billboardMode = 7
        elif len(object.material_slots) > 1:
            multimat = MultiMaterial()
            multimat.name = "Multimaterial#" + str(len(multiMaterials))
            multimat.materials = []
            Export_babylon.write_string(file_handler, "materialId", multimat.name)
            for mat in object.material_slots:
                multimat.materials.append(mat.name)
                
            multiMaterials.append(multimat)
            billboardMode = 0
        else:
            billboardMode = 0
        
        if forcedParent is None:
            Export_babylon.write_vector(file_handler, "position", loc)
            Export_babylon.write_vectorScaled(file_handler, "rotation", rot.to_euler("XYZ"), -1)
            Export_babylon.write_vector(file_handler, "scaling", scale)
        else:
            Export_babylon.write_vector(file_handler, "position", mathutils.Vector((0, 0, 0)))
            Export_babylon.write_vectorScaled(file_handler, "rotation", mathutils.Vector((0, 0, 0)), 1)
            Export_babylon.write_vector(file_handler, "scaling", mathutils.Vector((1, 1, 1)))

        Export_babylon.write_bool(file_handler, "isVisible", object.is_visible(scene))
        Export_babylon.write_bool(file_handler, "isEnabled", True)
        Export_babylon.write_bool(file_handler, "useFlatShading", object.data.useFlatShading)
        Export_babylon.write_bool(file_handler, "checkCollisions", object.data.checkCollisions)
        Export_babylon.write_int(file_handler, "billboardMode", billboardMode)
        Export_babylon.write_bool(file_handler, "receiveShadows", object.data.receiveShadows)

        # Export Physics
        if object.rigid_body != None:
            shape_items = {'BOX': 1, 'SPHERE': 2}
            shape_type = shape_items[object.rigid_body.collision_shape]
            Export_babylon.write_int(file_handler, "physicsImpostor", shape_type)
            mass = object.rigid_body.mass
            if mass < 0.005:
                mass = 0
            Export_babylon.write_float(file_handler, "physicsMass", mass)
            Export_babylon.write_float(file_handler, "physicsFriction", object.rigid_body.friction)
            Export_babylon.write_float(file_handler, "physicsRestitution", object.rigid_body.restitution)

        # Geometry
        if hasSkeleton:
            i = 0
            for obj in [object for object in scene.objects if object.is_visible(scene)]:
                if (obj.type == 'ARMATURE'):
                   if (obj.name == object.parent.name):
                        Export_babylon.write_int(file_handler, "skeletonId", i)
                   else:
                       i = i+1
                
        file_handler.write(positions)
        file_handler.write(normals)

        if hasUV:
            file_handler.write(uvs)

        if hasUV2:
            file_handler.write(uvs2)

        if hasVertexColor:
            file_handler.write(colors)

        if hasSkeleton:
            file_handler.write(skeletonWeight)
            file_handler.write(skeletonIndices)


        file_handler.write(indices) 
        
        # Sub meshes
        file_handler.write(",\"subMeshes\":[")
        first = True
        for subMesh in subMeshes:
            if first == False:
                file_handler.write(",")
            file_handler.write("{")
            Export_babylon.write_int(file_handler, "materialIndex", subMesh.materialIndex, True)
            Export_babylon.write_int(file_handler, "verticesStart", subMesh.verticesStart)
            Export_babylon.write_int(file_handler, "verticesCount", subMesh.verticesCount)
            Export_babylon.write_int(file_handler, "indexStart", subMesh.indexStart)
            Export_babylon.write_int(file_handler, "indexCount", subMesh.indexCount)
            file_handler.write("}")
            first = False
        file_handler.write("]")

        #Export Animations
        
        rotAnim = False
        locAnim = False
        scaAnim = False
        coma = False
        
        if object.animation_data:
            if object.animation_data.action:
                file_handler.write(",\"animations\":[")
                for fcurve in object.animation_data.action.fcurves:
                    if fcurve.data_path == "rotation_euler" and rotAnim == False:
                        Export_babylon.export_animation(object, scene, file_handler, "rotation_euler", "rotation", coma, -1)
                        rotAnim = coma = True
                    elif fcurve.data_path == "location" and locAnim == False:
                        Export_babylon.export_animation(object, scene, file_handler, "location", "position", coma, 1)
                        locAnim = coma = True
                    elif fcurve.data_path == "scale" and scaAnim == False:
                        Export_babylon.export_animation(object, scene, file_handler, "scale", "scaling", coma, 1)
                        locAnim = coma = True
                file_handler.write("]")
                #Set Animations
                Export_babylon.write_bool(file_handler, "autoAnimate", True)
                Export_babylon.write_int(file_handler, "autoAnimateFrom", 0)
                Export_babylon.write_int(file_handler, "autoAnimateTo", bpy.context.scene.frame_end - bpy.context.scene.frame_start + 1)
                Export_babylon.write_bool(file_handler, "autoAnimateLoop", True)


        # Closing
        file_handler.write("}")

        return offsetFace

    def export_node(object, scene, file_handler):
        # Transform
        loc = mathutils.Vector((0, 0, 0))
        rot = mathutils.Quaternion((0, 0, 0, 1))
        scale = mathutils.Vector((1, 1, 1))
        
        world = object.matrix_world
        if (object.parent):
            world = object.parent.matrix_world.inverted() * object.matrix_world

        loc, rot, scale = world.decompose()
                                                                
        # Writing node      
        file_handler.write("{")
        
        Export_babylon.write_string(file_handler, "name", object.name, True)        
        Export_babylon.write_string(file_handler, "id", object.name)        
        if object.parent != None:
            Export_babylon.write_string(file_handler, "parentId", object.parent.name)
                   
        Export_babylon.write_vector(file_handler, "position", loc)
        Export_babylon.write_vectorScaled(file_handler, "rotation", rot.to_euler("XYZ"), -1)
        Export_babylon.write_vector(file_handler, "scaling", scale)
        Export_babylon.write_bool(file_handler, "isVisible", False)
        Export_babylon.write_bool(file_handler, "isEnabled", True)
        Export_babylon.write_bool(file_handler, "checkCollisions", False)
        Export_babylon.write_int(file_handler, "billboardMode", 0)
        Export_babylon.write_bool(file_handler, "receiveShadows", False)
        
        # Closing
        file_handler.write("}")
        
    def export_shadowGenerator(lamp, scene, file_handler):      
        file_handler.write("{")
        if lamp.data.shadowMap == 'VAR':
            Export_babylon.write_bool(file_handler, "useVarianceShadowMap", True, True)
        else:
            Export_babylon.write_bool(file_handler, "useVarianceShadowMap", False, True)
            
        Export_babylon.write_int(file_handler, "mapSize", lamp.data.shadowMapSize)  
        Export_babylon.write_string(file_handler, "lightId", lamp.name)     
        
        file_handler.write(",\"renderList\":[")
        multiMaterials = []
        first = True
        for object in [object for object in scene.objects]:
            if (object.type == 'MESH' and object.data.castShadows):
                if first != True:
                    file_handler.write(",")

                first = False
                file_handler.write("\"" + object.name + "\"")
        file_handler.write("]")         
        file_handler.write("}") 

    def export_bone_matrix(armature, bone, label, file_handler):
        SystemMatrix = Matrix.Scale(-1, 4, Vector((0, 0, 1))) * Matrix.Rotation(radians(-90), 4, 'X')

        if (bone.parent):
            Export_babylon.write_matrix4(file_handler, label, (SystemMatrix * armature.matrix_world * bone.parent.matrix).inverted() * (SystemMatrix * armature.matrix_world * bone.matrix))
        else:
            Export_babylon.write_matrix4(file_handler, label, SystemMatrix * armature.matrix_world * bone.matrix)


    def export_bones(armature, scene, file_handler, id):
        file_handler.write("{")

        Export_babylon.write_string(file_handler, "name", armature.name, True)
        Export_babylon.write_int(file_handler, "id", id)
        
        file_handler.write(",\"bones\":[")
        bones = armature.pose.bones
        first = True
        j = 0
        for bone in bones:
            if first != True:
                file_handler.write(",")
            first = False

            file_handler.write("{")
            Export_babylon.write_string(file_handler, "name", bone.name, True)
            Export_babylon.write_int(file_handler, "index", j)

            Export_babylon.export_bone_matrix(armature, bone, "matrix", file_handler)

            if (bone.parent):
                parentId = 0
                for parent in bones:
                    if parent == bone.parent:
                        break;
                    parentId += 1

                Export_babylon.write_int(file_handler, "parentBoneIndex", parentId)
            else:
                Export_babylon.write_int(file_handler, "parentBoneIndex", -1)

            #animation
            if (armature.animation_data.action):
               Export_babylon.export_bonesAnimation(armature, bone, scene, file_handler)
            
            j = j + 1

            file_handler.write("}")

        file_handler.write("]")

        file_handler.write("}") 

    def export_bonesAnimation(armature, bone, scene, file_handler):
        file_handler.write(",\"animation\": {")

        start_frame = scene.frame_start
        end_frame = scene.frame_end
        fps = scene.render.fps

        Export_babylon.write_int(file_handler, "dataType", 3, True)
        Export_babylon.write_int(file_handler, "framePerSecond", fps)

        #keys
        file_handler.write(",\"keys\":[")
                        
        for Frame in range(start_frame, end_frame + 1):
                
            file_handler.write("{")

            Export_babylon.write_int(file_handler, "frame", Frame, True)
            bpy.context.scene.frame_set(Frame)

            Export_babylon.export_bone_matrix(armature, bone, "values", file_handler)

            if Frame == end_frame:
                file_handler.write("}")
            else:
                file_handler.write("},")
        
        file_handler.write("]")
            
        Export_babylon.write_int(file_handler, "loopBehavior", 1)
        Export_babylon.write_string(file_handler, "name", "anim")
        Export_babylon.write_string(file_handler, "property", "_matrix")

        file_handler.write("}")
        bpy.context.scene.frame_set(start_frame)

    def save(operator, context, filepath="",
        use_apply_modifiers=False,
        use_triangulate=True,
        use_compress=False):

        # Open file
        file_handler = open(filepath, 'w')  
            
        if bpy.ops.object.mode_set.poll():
            bpy.ops.object.mode_set(mode='OBJECT')      

        # Writing scene
        scene=context.scene
        
        world = scene.world
        if world:
            world_ambient = world.ambient_color
        else:
            world_ambient = Color((0.0, 0.0, 0.0))

        bpy.ops.screen.animation_cancel()
        currentFrame = bpy.context.scene.frame_current
        bpy.context.scene.frame_set(0)
    
        file_handler.write("{")
        file_handler.write("\"autoClear\":true")
        Export_babylon.write_color(file_handler, "clearColor", world_ambient)
        Export_babylon.write_color(file_handler, "ambientColor", world_ambient)
        Export_babylon.write_vector(file_handler, "gravity", scene.gravity)
        
        if world and world.mist_settings.use_mist:
                Export_babylon.write_int(file_handler, "fogMode", 3)
                Export_babylon.write_color(file_handler, "fogColor", world.horizon_color)
                Export_babylon.write_float(file_handler, "fogStart", world.mist_settings.start)
                Export_babylon.write_float(file_handler, "fogEnd", world.mist_settings.depth)
                Export_babylon.write_float(file_handler, "fogDensity", 0.1)
        
        # Cameras
        file_handler.write(",\"cameras\":[")
        first = True
        for object in [object for object in scene.objects if object.is_visible(scene)]:
            if (object.type == 'CAMERA'):
                if first != True:
                    file_handler.write(",")

                first = False
                data_string = Export_babylon.export_camera(object, scene, file_handler)
        file_handler.write("]")
                        
        # Active camera
        if scene.camera != None:
            Export_babylon.write_string(file_handler, "activeCamera", scene.camera.name)
            
        # Lights
        file_handler.write(",\"lights\":[")
        first = True
        for object in [object for object in scene.objects if object.is_visible(scene)]:
            if (object.type == 'LAMP'):
                if first != True:
                    file_handler.write(",")

                first = False
                data_string = Export_babylon.export_light(object, scene, file_handler)
        file_handler.write("]")
        
        # Materials
        materials = [mat for mat in bpy.data.materials if mat.users >= 1]
        file_handler.write(",\"materials\":[")
        first = True
        for material in materials:
            if first != True:
                file_handler.write(",")

            first = False
            data_string = Export_babylon.export_material(material, scene, file_handler, filepath)
        file_handler.write("]")
        
        # Meshes
        file_handler.write(",\"meshes\":[")
        multiMaterials = []
        first = True
        for object in [object for object in scene.objects]:
            if object.type == 'MESH' or object.type == 'EMPTY':
                if first != True:
                    file_handler.write(",")

                first = False
                if object.type == 'MESH':
                    forcedParent = None
                    nameID = ""
                    startFace = 0

                    while True:
                        startFace = Export_babylon.export_mesh(object, scene, file_handler, multiMaterials, startFace, forcedParent, str(nameID))

                        if startFace == 0:
                            break

                        if forcedParent is None:
                            nameID = 0
                            forcedParent = object

                        nameID = nameID + 1
                        file_handler.write(",")
                else:
                    data_string = Export_babylon.export_node(object, scene, file_handler)

        file_handler.write("]")
        
        # Multi-materials
        file_handler.write(",\"multiMaterials\":[")
        first = True
        for multimaterial in multiMaterials:
            if first != True:
                file_handler.write(",")

            first = False
            data_string = Export_babylon.export_multimaterial(multimaterial, scene, file_handler)
        file_handler.write("]")
        
        # Shadow generators
        file_handler.write(",\"shadowGenerators\":[")
        first = True
        for object in [object for object in scene.objects if object.is_visible(scene)]:
            if (object.type == 'LAMP' and object.data.shadowMap != 'NONE'):
                if first != True:
                    file_handler.write(",")

                first = False
                data_string = Export_babylon.export_shadowGenerator(object, scene, file_handler)
        file_handler.write("]")

        # Armatures/Bones
        file_handler.write(",\"skeletons\":[")
        first = True
        i = 0
        for object in [object for object in scene.objects if object.is_visible(scene)]:
            if (object.type == 'ARMATURE'):
                if first != True:
                    file_handler.write(",")

                first = False
                data_string = Export_babylon.export_bones(object, scene, file_handler, i)
                i = i+1
        file_handler.write("]")     
        
        # Closing
        file_handler.write("}")
        file_handler.close()

        bpy.context.scene.frame_set(currentFrame)
        
        return {'FINISHED'}

# UI
bpy.types.Mesh.useFlatShading = BoolProperty(
    name="Use Flat Shading", 
    default = False)

bpy.types.Mesh.checkCollisions = BoolProperty(
    name="Check Collisions", 
    default = False)
    
bpy.types.Mesh.castShadows = BoolProperty(
    name="Cast Shadows", 
    default = False)
    
bpy.types.Mesh.receiveShadows = BoolProperty(
    name="Receive Shadows", 
    default = False)
    
bpy.types.Camera.checkCollisions = BoolProperty(
    name="Check Collisions", 
    default = False)
    
bpy.types.Camera.applyGravity = BoolProperty(
    name="Apply Gravity", 
    default = False)    
    
bpy.types.Camera.ellipsoid = FloatVectorProperty(
    name="Ellipsoid", 
    default = mathutils.Vector((0.2, 0.9, 0.2)))

bpy.types.Lamp.shadowMap = EnumProperty(
    name="Shadow Map Type", 
    items = (('NONE', "None", "No Shadow Maps"), ('STD', "Standard", "Use Standard Shadow Maps"), ('VAR', "Variance", "Use Variance Shadow Maps")),
    default = 'NONE')
    
bpy.types.Lamp.shadowMapSize = IntProperty(
    name="Shadow Map Size", 
    default = 512)  

class ObjectPanel(bpy.types.Panel):
    bl_label = "Babylon.js"
    bl_space_type = "PROPERTIES"
    bl_region_type = "WINDOW"
    bl_context = "data"
    
    def draw(self, context):
        ob = context.object
        if not ob or not ob.data:
            return
            
        layout = self.layout
        isMesh = isinstance(ob.data, bpy.types.Mesh)
        isCamera = isinstance(ob.data, bpy.types.Camera)
        isLight = isinstance(ob.data, bpy.types.Lamp)
        
        if isMesh:   
            layout.prop(ob.data, 'useFlatShading') 
            layout.prop(ob.data, 'checkCollisions')     
            layout.prop(ob.data, 'castShadows')     
            layout.prop(ob.data, 'receiveShadows')   
        elif isCamera:
            layout.prop(ob.data, 'checkCollisions')
            layout.prop(ob.data, 'applyGravity')
            layout.prop(ob.data, 'ellipsoid')
        elif isLight:
            layout.prop(ob.data, 'shadowMap')
            layout.prop(ob.data, 'shadowMapSize')   
            
### REGISTER ###

def menu_func(self, context):
    self.layout.operator(Export_babylon.bl_idname, text="Babylon.js (.babylon)")

def register():
    bpy.utils.register_module(__name__)
    bpy.types.INFO_MT_file_export.append(menu_func)

def unregister():
    bpy.utils.unregister_module(__name__)
    bpy.types.INFO_MT_file_export.remove(menu_func)

    
if __name__ == "__main__":
    register()
