from .logger import *
from .package_level import *

from .f_curve_animatable import *
from .armature import *
from .material import *

import bpy
import math
from mathutils import Vector
import shutil

# output related constants
MAX_VERTEX_ELEMENTS = 65535
MAX_VERTEX_ELEMENTS_32Bit = 16777216
COMPRESS_MATRIX_INDICES = True # this is True for .babylon exporter & False for TOB

# used in Mesh & Node constructors, defined in BABYLON.AbstractMesh
BILLBOARDMODE_NONE = 0
#BILLBOARDMODE_X = 1
#BILLBOARDMODE_Y = 2
#BILLBOARDMODE_Z = 4
BILLBOARDMODE_ALL = 7

# used in Mesh constructor, defined in BABYLON.PhysicsEngine
SPHERE_IMPOSTER = 1
BOX_IMPOSTER = 2
#PLANE_IMPOSTER = 3
MESH_IMPOSTER = 4
CAPSULE_IMPOSTER = 5
CONE_IMPOSTER = 6
CYLINDER_IMPOSTER = 7
CONVEX_HULL_IMPOSTER = 8
#===============================================================================
class Mesh(FCurveAnimatable):
    def __init__(self, object, scene, startFace, forcedParent, nameID, exporter):
        self.name = object.name + str(nameID)
        Logger.log('processing begun of mesh:  ' + self.name)
        self.define_animations(object, True, True, True)  #Should animations be done when forcedParent

        self.isVisible = not object.hide_render
        self.isEnabled = not object.data.loadDisabled
        useFlatShading = scene.export_flatshadeScene or object.data.useFlatShading
        self.checkCollisions = object.data.checkCollisions
        self.receiveShadows = object.data.receiveShadows
        self.castShadows = object.data.castShadows
        self.freezeWorldMatrix = object.data.freezeWorldMatrix
        self.layer = getLayer(object) # used only for lights with 'This Layer Only' checked, not exported

        # hasSkeleton detection & skeletonID determination
        hasSkeleton = False
        objArmature = None      # if there's an armature, this will be the one!
        if len(object.vertex_groups) > 0 and not object.data.ignoreSkeleton:
            objArmature = object.find_armature()
            if objArmature != None:
                hasSkeleton = True
                # used to get bone index, since could be skipping IK bones
                skeleton = exporter.get_skeleton(objArmature.name)
                i = 0
                for obj in scene.objects:
                    if obj.type == "ARMATURE":
                        if obj == objArmature:
                            self.skeletonId = i
                            break
                        else:
                            i += 1

        # determine Position, rotation, & scaling
        if forcedParent is None:
            # Use local matrix
            locMatrix = object.matrix_local
            if objArmature != None:
                # unless the armature is the parent
                if object.parent and object.parent == objArmature:
                    locMatrix = object.matrix_world * object.parent.matrix_world.inverted()

            loc, rot, scale = locMatrix.decompose()
            self.position = loc
            if object.rotation_mode == 'QUATERNION':
                self.rotationQuaternion = rot
            else:
                self.rotation = scale_vector(rot.to_euler('XYZ'), -1)
            self.scaling  = scale
        else:
            # use defaults when not None
            self.position = Vector((0, 0, 0))
            self.rotation = scale_vector(Vector((0, 0, 0)), 1) # isn't scaling 0's by 1 same as 0?
            self.scaling  = Vector((1, 1, 1))
            
        # ensure no unapplied rotation or scale, when there is an armature
        self.hasUnappliedTransforms = (self.scaling .x != 1 or self.scaling .y != 1 or self.scaling .z != 1 or
                self.rotation.x != 0 or self.rotation.y != 0 or self.rotation.z != 0 or 
                (object.rotation_mode == 'QUATERNION' and self.rotation.w != 1)
                )

        # determine parent & dataName
        if forcedParent is None:
            self.dataName = object.data.name # used to support shared vertex instances in later passed
            if object.parent and object.parent.type != 'ARMATURE':
                self.parentId = object.parent.name
        else:
            self.dataName = self.name
            self.parentId = forcedParent.name

        # Get if this will be an instance of another, before processing materials, to avoid multi-bakes
        sourceMesh = exporter.getSourceMeshInstance(self.dataName)
        if sourceMesh is not None:
            #need to make sure rotation mode matches, since value initially copied in InstancedMesh constructor
            if hasattr(sourceMesh, 'rotationQuaternion'):
                instRot = None
                instRotq = rot
            else:
                instRot = scale_vector(rot.to_euler('XYZ'), -1)
                instRotq = None

            instance = MeshInstance(self.name, self.position, instRot, instRotq, self.scaling, self.freezeWorldMatrix)
            sourceMesh.instances.append(instance)
            Logger.log('mesh is an instance of :  ' + sourceMesh.name + '.  Processing halted.', 2)
            return
        else:
            self.instances = []

        # Physics
        if object.rigid_body != None:
            shape_items = {'SPHERE'     : SPHERE_IMPOSTER,
                           'BOX'        : BOX_IMPOSTER,
                           'MESH'       : MESH_IMPOSTER,
                           'CAPSULE'    : CAPSULE_IMPOSTER,
                           'CONE'       : CONE_IMPOSTER,
                           'CYLINDER'   : CYLINDER_IMPOSTER,
                           'CONVEX_HULL': CONVEX_HULL_IMPOSTER}

            shape_type = shape_items[object.rigid_body.collision_shape]
            self.physicsImpostor = shape_type
            mass = object.rigid_body.mass
            if mass < 0.005:
                mass = 0
            self.physicsMass = mass
            self.physicsFriction = object.rigid_body.friction
            self.physicsRestitution = object.rigid_body.restitution

        # process all of the materials required
        maxVerts = MAX_VERTEX_ELEMENTS # change for multi-materials
        recipe = BakingRecipe(object)
        self.billboardMode = BILLBOARDMODE_ALL if recipe.isBillboard else BILLBOARDMODE_NONE

        if recipe.needsBaking:
            if recipe.multipleRenders:
                Logger.warn('Mixing of Cycles & Blender Render in same mesh not supported.  No materials exported.', 2)
            else:
                bakedMat = BakedMaterial(exporter, object, recipe)
                exporter.materials.append(bakedMat)
                self.materialId = bakedMat.name

        else:
            bjs_material_slots = []
            for slot in object.material_slots:
                # None will be returned when either the first encounter or must be unique due to baked textures
                material = exporter.getMaterial(slot.name)
                if (material != None):
                    Logger.log('registered as also a user of material:  ' + slot.name, 2)
                else:
                    material = StdMaterial(slot, exporter, object)
                    exporter.materials.append(material)

                bjs_material_slots.append(material)

            if len(bjs_material_slots) == 1:
                self.materialId = bjs_material_slots[0].name

            elif len(bjs_material_slots) > 1:
                multimat = MultiMaterial(bjs_material_slots, len(exporter.multiMaterials), exporter.nameSpace)
                self.materialId = multimat.name
                exporter.multiMaterials.append(multimat)
                maxVerts = MAX_VERTEX_ELEMENTS_32Bit
            else:
                Logger.warn('No materials have been assigned: ', 2)

        # Get mesh
        mesh = object.to_mesh(scene, True, 'PREVIEW')

        # Triangulate mesh if required
        Mesh.mesh_triangulate(mesh)

        # Getting vertices and indices
        self.positions  = []
        self.normals    = []
        self.uvs        = [] # not always used
        self.uvs2       = [] # not always used
        self.colors     = [] # not always used
        self.indices    = []
        self.subMeshes  = []

        hasUV = len(mesh.tessface_uv_textures) > 0
        if hasUV:
            which = len(mesh.tessface_uv_textures) - 1 if recipe.needsBaking else 0
            UVmap = mesh.tessface_uv_textures[which].data

        hasUV2 = len(mesh.tessface_uv_textures) > 1 and not recipe.needsBaking
        if hasUV2:
            UV2map = mesh.tessface_uv_textures[1].data

        hasVertexColor = len(mesh.vertex_colors) > 0
        if hasVertexColor:
            Colormap = mesh.tessface_vertex_colors.active.data

        if hasSkeleton:
            weightsPerVertex = []
            indicesPerVertex = []
            influenceCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0] # 9, so accessed orign 1; 0 used for all those greater than 8
            totalInfluencers = 0
            highestInfluenceObserved = 0

        # used tracking of vertices as they are received
        alreadySavedVertices = []
        vertices_Normals = []
        vertices_UVs = []
        vertices_UV2s = []
        vertices_Colors = []
        vertices_indices = []
        vertices_sk_weights = []
        vertices_sk_indices = []

        self.offsetFace = 0

        for v in range(0, len(mesh.vertices)):
            alreadySavedVertices.append(False)
            vertices_Normals.append([])
            vertices_UVs.append([])
            vertices_UV2s.append([])
            vertices_Colors.append([])
            vertices_indices.append([])
            vertices_sk_weights.append([])
            vertices_sk_indices.append([])

        materialsCount = 1 if recipe.needsBaking else max(1, len(object.material_slots))
        verticesCount = 0
        indicesCount = 0

        for materialIndex in range(materialsCount):
            if self.offsetFace != 0:
                break

            subMeshVerticesStart = verticesCount
            subMeshIndexStart = indicesCount

            for faceIndex in range(startFace, len(mesh.tessfaces)):  # For each face
                face = mesh.tessfaces[faceIndex]

                if face.material_index != materialIndex and not recipe.needsBaking:
                    continue

                if verticesCount + 3 > maxVerts:
                    self.offsetFace = faceIndex
                    break

                for v in range(3): # For each vertex in face
                    vertex_index = face.vertices[v]

                    vertex = mesh.vertices[vertex_index]
                    position = vertex.co
                    normal = face.normal if useFlatShading else vertex.normal

                    #skeletons
                    if hasSkeleton:
                        matricesWeights = []
                        matricesIndices = []

                        # Getting influences
                        for group in vertex.groups:
                            index = group.group
                            weight = group.weight

                            for bone in objArmature.pose.bones:
                                if object.vertex_groups[index].name == bone.name:
                                    matricesWeights.append(weight)
                                    matricesIndices.append(skeleton.get_index_of_bone(bone.name))

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
                    alreadySaved = alreadySavedVertices[vertex_index] and not useFlatShading
                    if alreadySaved:
                        alreadySaved = False

                        # UV
                        index_UV = 0
                        for savedIndex in vertices_indices[vertex_index]:
                            vNormal = vertices_Normals[vertex_index][index_UV]
                            if not same_vertex(normal, vNormal):
                                continue;

                            if hasUV:
                                vUV = vertices_UVs[vertex_index][index_UV]
                                if not same_array(vertex_UV, vUV):
                                    continue

                            if hasUV2:
                                vUV2 = vertices_UV2s[vertex_index][index_UV]
                                if not same_array(vertex_UV2, vUV2):
                                    continue

                            if hasVertexColor:
                                vColor = vertices_Colors[vertex_index][index_UV]
                                if vColor.r != vertex_Color.r or vColor.g != vertex_Color.g or vColor.b != vertex_Color.b:
                                    continue

                            if hasSkeleton:
                                vSkWeight = vertices_sk_weights[vertex_index]
                                vSkIndices = vertices_sk_indices[vertex_index]
                                if not same_array(vSkWeight[index_UV], matricesWeights) or not same_array(vSkIndices[index_UV], matricesIndices):
                                    continue

                            if vertices_indices[vertex_index][index_UV] >= subMeshVerticesStart:
                                alreadySaved = True
                                break

                            index_UV += 1

                    if (alreadySaved):
                        # Reuse vertex
                        index = vertices_indices[vertex_index][index_UV]
                    else:
                        # Export new one
                        index = verticesCount
                        alreadySavedVertices[vertex_index] = True

                        vertices_Normals[vertex_index].append(normal)
                        self.normals.append(normal)

                        if hasUV:
                            vertices_UVs[vertex_index].append(vertex_UV)
                            self.uvs.append(vertex_UV[0])
                            self.uvs.append(vertex_UV[1])
                        if hasUV2:
                            vertices_UV2s[vertex_index].append(vertex_UV2)
                            self.uvs2.append(vertex_UV2[0])
                            self.uvs2.append(vertex_UV2[1])
                        if hasVertexColor:
                            vertices_Colors[vertex_index].append(vertex_Color)
                            self.colors.append(vertex_Color.r)
                            self.colors.append(vertex_Color.g)
                            self.colors.append(vertex_Color.b)
                            self.colors.append(1.0)
                        if hasSkeleton:
                            vertices_sk_weights[vertex_index].append(matricesWeights)
                            vertices_sk_indices[vertex_index].append(matricesIndices)
                            nInfluencers = len(matricesWeights)
                            totalInfluencers += nInfluencers
                            if nInfluencers <= 8:
                                influenceCounts[nInfluencers] += 1
                            else:
                                influenceCounts[0] += 1
                            highestInfluenceObserved = nInfluencers if nInfluencers > highestInfluenceObserved else highestInfluenceObserved
                            weightsPerVertex.append(matricesWeights)
                            indicesPerVertex.append(matricesIndices)

                        vertices_indices[vertex_index].append(index)

                        self.positions.append(position)

                        verticesCount += 1
                    self.indices.append(index)
                    indicesCount += 1

            self.subMeshes.append(SubMesh(materialIndex, subMeshVerticesStart, subMeshIndexStart, verticesCount - subMeshVerticesStart, indicesCount - subMeshIndexStart))

        if verticesCount > MAX_VERTEX_ELEMENTS:
            Logger.warn('Due to multi-materials / Shapekeys & this meshes size, 32bit indices must be used.  This may not run on all hardware.', 2)

        BakedMaterial.meshBakingClean(object)

        Logger.log('num positions      :  ' + str(len(self.positions)), 2)
        Logger.log('num normals        :  ' + str(len(self.normals  )), 2)
        Logger.log('num uvs            :  ' + str(len(self.uvs      )), 2)
        Logger.log('num uvs2           :  ' + str(len(self.uvs2     )), 2)
        Logger.log('num colors         :  ' + str(len(self.colors   )), 2)
        Logger.log('num indices        :  ' + str(len(self.indices  )), 2)
        
        if hasSkeleton:
            Logger.log('Skeleton stats:  ', 2)
            self.toFixedInfluencers(weightsPerVertex, indicesPerVertex, object.data.maxInfluencers, highestInfluenceObserved)

            if (COMPRESS_MATRIX_INDICES):
                self.skeletonIndices = Mesh.packSkeletonIndices(self.skeletonIndices)
                if (self.numBoneInfluencers > 4):
                    self.skeletonIndicesExtra = Mesh.packSkeletonIndices(self.skeletonIndicesExtra)

            Logger.log('Total Influencers:  ' + format_f(totalInfluencers), 3)
            Logger.log('Avg # of influencers per vertex:  ' + format_f(totalInfluencers / len(self.positions)), 3)
            Logger.log('Highest # of influencers observed:  ' + str(highestInfluenceObserved) + ', num vertices with this:  ' + format_int(influenceCounts[highestInfluenceObserved if highestInfluenceObserved < 9 else 0]), 3)
            Logger.log('exported as ' + str(self.numBoneInfluencers) + ' influencers', 3)
            nWeights = len(self.skeletonWeights) + (len(self.skeletonWeightsExtra) if hasattr(self, 'skeletonWeightsExtra') else 0)
            Logger.log('num skeletonWeights and skeletonIndices:  ' + str(nWeights), 3)

        numZeroAreaFaces = self.find_zero_area_faces()
        if numZeroAreaFaces > 0:
            Logger.warn('# of 0 area faces found:  ' + str(numZeroAreaFaces), 2)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def find_zero_area_faces(self):
        nFaces = int(len(self.indices) / 3)
        nZeroAreaFaces = 0
        for f in range(0, nFaces):
            faceOffset = f * 3
            p1 = self.positions[self.indices[faceOffset    ]]
            p2 = self.positions[self.indices[faceOffset + 1]]
            p3 = self.positions[self.indices[faceOffset + 2]]

            if same_vertex(p1, p2) or same_vertex(p1, p3) or same_vertex(p2, p3): nZeroAreaFaces += 1

        return nZeroAreaFaces
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    @staticmethod
    def mesh_triangulate(mesh):
        try:
            import bmesh
            bm = bmesh.new()
            bm.from_mesh(mesh)
            bmesh.ops.triangulate(bm, faces = bm.faces)
            bm.to_mesh(mesh)
            mesh.calc_tessface()
            bm.free()
        except:
            pass
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def toFixedInfluencers(self, weightsPerVertex, indicesPerVertex, maxInfluencers, highestObserved):
        if (maxInfluencers > 8 or maxInfluencers < 1):
            maxInfluencers = 8
            Logger.warn('Maximum # of influencers invalid, set to 8', 3)

        self.numBoneInfluencers = maxInfluencers if maxInfluencers < highestObserved else highestObserved
        needExtras = self.numBoneInfluencers > 4

        maxInfluencersExceeded = 0

        fixedWeights = []
        fixedIndices = []

        fixedWeightsExtra = []
        fixedIndicesExtra = []

        for i in range(len(weightsPerVertex)):
            weights = weightsPerVertex[i]
            indices = indicesPerVertex[i]
            nInfluencers = len(weights)

            if (nInfluencers > self.numBoneInfluencers):
                maxInfluencersExceeded += 1
                Mesh.sortByDescendingInfluence(weights, indices)

            for j in range(4):
                fixedWeights.append(weights[j] if nInfluencers > j else 0.0)
                fixedIndices.append(indices[j] if nInfluencers > j else 0  )

            if needExtras:
                for j in range(4, 8):
                    fixedWeightsExtra.append(weights[j] if nInfluencers > j else 0.0)
                    fixedIndicesExtra.append(indices[j] if nInfluencers > j else 0  )

        self.skeletonWeights = fixedWeights
        self.skeletonIndices = fixedIndices

        if needExtras:
            self.skeletonWeightsExtra = fixedWeightsExtra
            self.skeletonIndicesExtra = fixedIndicesExtra

        if maxInfluencersExceeded > 0:
            Logger.warn('Maximum # of influencers exceeded for ' + format_int(maxInfluencersExceeded) + ' vertices, extras ignored', 3)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # sorts one set of weights & indices by descending weight, by reference
    # not shown to help with MakeHuman, but did not hurt.  In just so it is not lost for future.
    @staticmethod
    def sortByDescendingInfluence(weights, indices):
        notSorted = True
        while(notSorted):
            notSorted = False
            for idx in range(1, len(weights)):
                if weights[idx - 1] < weights[idx]:
                    tmp = weights[idx]
                    weights[idx    ] = weights[idx - 1]
                    weights[idx - 1] = tmp

                    tmp = indices[idx]
                    indices[idx    ] = indices[idx - 1]
                    indices[idx - 1] = tmp

                    notSorted = True
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # assume that toFixedInfluencers has already run, which ensures indices length is a multiple of 4
    @staticmethod
    def packSkeletonIndices(indices):
        compressedIndices = []

        for i in range(math.floor(len(indices) / 4)):
            idx = i * 4
            matricesIndicesCompressed  = indices[idx    ]
            matricesIndicesCompressed += indices[idx + 1] <<  8
            matricesIndicesCompressed += indices[idx + 2] << 16
            matricesIndicesCompressed += indices[idx + 3] << 24

            compressedIndices.append(matricesIndicesCompressed)

        return compressedIndices
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_string(file_handler, 'id', self.name)
        if hasattr(self, 'parentId'): write_string(file_handler, 'parentId', self.parentId)

        if hasattr(self, 'materialId'): write_string(file_handler, 'materialId', self.materialId)
        write_int(file_handler, 'billboardMode', self.billboardMode)
        write_vector(file_handler, 'position', self.position)

        if hasattr(self, "rotationQuaternion"):
            write_quaternion(file_handler, 'rotationQuaternion', self.rotationQuaternion)
        else:
            write_vector(file_handler, 'rotation', self.rotation)

        write_vector(file_handler, 'scaling', self.scaling)
        write_bool(file_handler, 'isVisible', self.isVisible)
        write_bool(file_handler, 'freezeWorldMatrix', self.freezeWorldMatrix)
        write_bool(file_handler, 'isEnabled', self.isEnabled)
        write_bool(file_handler, 'checkCollisions', self.checkCollisions)
        write_bool(file_handler, 'receiveShadows', self.receiveShadows)

        if hasattr(self, 'physicsImpostor'):
            write_int(file_handler, 'physicsImpostor', self.physicsImpostor)
            write_float(file_handler, 'physicsMass', self.physicsMass)
            write_float(file_handler, 'physicsFriction', self.physicsFriction)
            write_float(file_handler, 'physicsRestitution', self.physicsRestitution)

        # Geometry
        if hasattr(self, 'skeletonId'):
            write_int(file_handler, 'skeletonId', self.skeletonId)
            write_int(file_handler, 'numBoneInfluencers', self.numBoneInfluencers)

        write_vector_array(file_handler, 'positions', self.positions)
        write_vector_array(file_handler, 'normals'  , self.normals  )

        if len(self.uvs) > 0:
            write_array(file_handler, 'uvs', self.uvs)

        if len(self.uvs2) > 0:
            write_array(file_handler, 'uvs2', self.uvs2)

        if len(self.colors) > 0:
            write_array(file_handler, 'colors', self.colors)

        if hasattr(self, 'skeletonWeights'):
            write_array(file_handler, 'matricesWeights', self.skeletonWeights)
            write_array(file_handler, 'matricesIndices', self.skeletonIndices)

        if hasattr(self, 'skeletonWeightsExtra'):
            write_array(file_handler, 'matricesWeightsExtra', self.skeletonWeightsExtra)
            write_array(file_handler, 'matricesIndicesExtra', self.skeletonIndicesExtra)

        write_array(file_handler, 'indices', self.indices)

        # Sub meshes
        file_handler.write('\n,"subMeshes":[')
        first = True
        for subMesh in self.subMeshes:
            if first == False:
                file_handler.write(',')
            subMesh.to_scene_file(file_handler)
            first = False
        file_handler.write(']')

        super().to_scene_file(file_handler) # Animations

        # Instances
        first = True
        file_handler.write('\n,"instances":[')
        for instance in self.instances:
            if first == False:
                file_handler.write(',')

            instance.to_scene_file(file_handler)

            first = False
        file_handler.write(']')

        # Close mesh
        file_handler.write('}\n')
        self.alreadyExported = True
#===============================================================================
class MeshInstance:
     def __init__(self, name, position, rotation, rotationQuaternion, scaling, freezeWorldMatrix):
        self.name = name
        self.position = position
        if rotation is not None:
            self.rotation = rotation
        if rotationQuaternion is not None:
            self.rotationQuaternion = rotationQuaternion
        self.scaling = scaling
        self.freezeWorldMatrix = freezeWorldMatrix
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
     def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_vector(file_handler, 'position', self.position)
        if hasattr(self, 'rotation'):
            write_vector(file_handler, 'rotation', self.rotation)
        else:
            write_quaternion(file_handler, 'rotationQuaternion', self.rotationQuaternion)

        write_vector(file_handler, 'scaling', self.scaling)
        # freeze World Matrix currently ignored for instances
        write_bool(file_handler, 'freezeWorldMatrix', self.freezeWorldMatrix)
        file_handler.write('}')
#===============================================================================
class Node(FCurveAnimatable):
    def __init__(self, node):
        Logger.log('processing begun of node:  ' + node.name)
        self.define_animations(node, True, True, True)  #Should animations be done when forcedParent
        self.name = node.name

        if node.parent and node.parent.type != 'ARMATURE':
            self.parentId = node.parent.name

        loc, rot, scale = node.matrix_local.decompose()

        self.position = loc
        if node.rotation_mode == 'QUATERNION':
            self.rotationQuaternion = rot
        else:
            self.rotation = scale_vector(rot.to_euler('XYZ'), -1)
        self.scaling = scale
        self.isVisible = False
        self.isEnabled = True
        self.checkCollisions = False
        self.billboardMode = BILLBOARDMODE_NONE
        self.castShadows = False
        self.receiveShadows = False
        self.layer = getLayer(object) # used only for lights with 'This Layer Only' checked, not exported
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_string(file_handler, 'id', self.name)
        if hasattr(self, 'parentId'): write_string(file_handler, 'parentId', self.parentId)

        write_vector(file_handler, 'position', self.position)
        if hasattr(self, "rotationQuaternion"):
            write_quaternion(file_handler, "rotationQuaternion", self.rotationQuaternion)
        else:
            write_vector(file_handler, 'rotation', self.rotation)
        write_vector(file_handler, 'scaling', self.scaling)
        write_bool(file_handler, 'isVisible', self.isVisible)
        write_bool(file_handler, 'isEnabled', self.isEnabled)
        write_bool(file_handler, 'checkCollisions', self.checkCollisions)
        write_int(file_handler, 'billboardMode', self.billboardMode)
        write_bool(file_handler, 'receiveShadows', self.receiveShadows)

        super().to_scene_file(file_handler) # Animations
        file_handler.write('}')
#===============================================================================
class SubMesh:
    def __init__(self, materialIndex, verticesStart, indexStart, verticesCount, indexCount):
        self.materialIndex = materialIndex
        self.verticesStart = verticesStart
        self.indexStart = indexStart
        self.verticesCount = verticesCount
        self.indexCount = indexCount
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_int(file_handler, 'materialIndex', self.materialIndex, True)
        write_int(file_handler, 'verticesStart', self.verticesStart)
        write_int(file_handler, 'verticesCount', self.verticesCount)
        write_int(file_handler, 'indexStart'   , self.indexStart)
        write_int(file_handler, 'indexCount'   , self.indexCount)
        file_handler.write('}')
#===============================================================================
bpy.types.Mesh.autoAnimate = bpy.props.BoolProperty(
    name='Auto launch animations',
    description='',
    default = False
)
bpy.types.Mesh.useFlatShading = bpy.props.BoolProperty(
    name='Use Flat Shading',
    description='Use face normals.  Increases vertices.',
    default = False
)
bpy.types.Mesh.checkCollisions = bpy.props.BoolProperty(
    name='Check Collisions',
    description='Indicates mesh should be checked that it does not run into anything.',
    default = False
)
bpy.types.Mesh.castShadows = bpy.props.BoolProperty(
    name='Cast Shadows',
    description='',
    default = False
)
bpy.types.Mesh.receiveShadows = bpy.props.BoolProperty(
    name='Receive Shadows',
    description='',
    default = False
)
# not currently in use
bpy.types.Mesh.forceBaking = bpy.props.BoolProperty(
    name='Combine Multi-textures / resize',
    description='Also good to adjust single texture\'s size /compression.',
    default = False
)
# not currently in use
bpy.types.Mesh.usePNG = bpy.props.BoolProperty(
    name='Need Alpha',
    description='Saved as PNG when alpha is required, else JPG.',
    default = False
)
bpy.types.Mesh.bakeSize = bpy.props.IntProperty(
    name='Texture Size',
    description='',
    default = 1024
)
bpy.types.Mesh.bakeQuality = bpy.props.IntProperty(
    name='Quality 1-100',
    description='For JPG: The trade-off between Quality - File size(100 highest quality)\nFor PNG: amount of time spent for compression',
    default = 50, min = 1, max = 100
)
bpy.types.Mesh.materialNameSpace = bpy.props.StringProperty(
    name='Name Space',
    description='Prefix to use for materials for sharing across .blends.',
    default = DEFAULT_MATERIAL_NAMESPACE
)
bpy.types.Mesh.maxSimultaneousLights = bpy.props.IntProperty(
    name='Max Simultaneous Lights 0 - 32',
    description='BJS property set on each material of this mesh.\nSet higher for more complex lighting.\nSet lower for armatures on mobile',
    default = 4, min = 0, max = 32
)
bpy.types.Mesh.checkReadyOnlyOnce = bpy.props.BoolProperty(
    name='Check Ready Only Once',
    description='When checked better CPU utilization.  Advanced user option.',
    default = False
)
bpy.types.Mesh.freezeWorldMatrix = bpy.props.BoolProperty(
    name='Freeze World Matrix',
    description='Indicate the position, rotation, & scale do not change for performance reasons',
    default = False
)
bpy.types.Mesh.loadDisabled = bpy.props.BoolProperty(
    name='Load Disabled',
    description='Indicate this mesh & children should not be active until enabled by code.',
    default = False
)
bpy.types.Mesh.attachedSound = bpy.props.StringProperty(
    name='Sound',
    description='',
    default = ''
)
bpy.types.Mesh.loopSound = bpy.props.BoolProperty(
    name='Loop sound',
    description='',
    default = True
)
bpy.types.Mesh.autoPlaySound = bpy.props.BoolProperty(
    name='Auto play sound',
    description='',
    default = True
)
bpy.types.Mesh.maxSoundDistance = bpy.props.FloatProperty(
    name='Max sound distance',
    description='',
    default = 100
)
bpy.types.Mesh.ignoreSkeleton = bpy.props.BoolProperty(
    name='Ignore',
    description='Do not export assignment to a skeleton',
    default = False
)
bpy.types.Mesh.maxInfluencers = bpy.props.IntProperty(
    name='Max bone Influencers / Vertex',
    description='When fewer than this are observed, the lower value is used.',
    default = 8, min = 1, max = 8
)

#===============================================================================
class MeshPanel(bpy.types.Panel):
    bl_label = get_title()
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = 'data'
    
    @classmethod
    def poll(cls, context):
        ob = context.object
        return ob is not None and isinstance(ob.data, bpy.types.Mesh)
    
    def draw(self, context):
        ob = context.object
        layout = self.layout  
        row = layout.row()
        row.prop(ob.data, 'useFlatShading')
        row.prop(ob.data, 'checkCollisions')
        
        row = layout.row()
        row.prop(ob.data, 'castShadows')
        row.prop(ob.data, 'receiveShadows')
        
        row = layout.row()
        row.prop(ob.data, 'freezeWorldMatrix')
        row.prop(ob.data, 'loadDisabled')
        
        layout.prop(ob.data, 'autoAnimate')
        
        box = layout.box()
        box.label(text='Skeleton:')
        box.prop(ob.data, 'ignoreSkeleton')
        row = box.row()
        row.enabled = not ob.data.ignoreSkeleton
        row.prop(ob.data, 'maxInfluencers')
        
        box = layout.box()
        box.label('Materials')
        box.prop(ob.data, 'materialNameSpace')
        box.prop(ob.data, 'maxSimultaneousLights')
        box.prop(ob.data, 'checkReadyOnlyOnce')
        
        box = layout.box()
        box.label(text='Procedural Texture / Cycles Baking')
#        box.prop(ob.data, 'forceBaking')
#        box.prop(ob.data, 'usePNG')
        box.prop(ob.data, 'bakeSize')
        box.prop(ob.data, 'bakeQuality')
        
        box = layout.box()
        box.prop(ob.data, 'attachedSound')
        row = box.row()

        row.prop(ob.data, 'autoPlaySound')
        row.prop(ob.data, 'loopSound')
        box.prop(ob.data, 'maxSoundDistance')