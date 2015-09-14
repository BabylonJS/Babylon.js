/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxgeometryconverter.h
#ifndef _FBXSDK_UTILS_GEOMETRY_CONVERTER_H_
#define _FBXSDK_UTILS_GEOMETRY_CONVERTER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxManager;
class FbxMesh;
class FbxPatch;
class FbxNurbs;
class FbxNurbsSurface;
class FbxNurbsCurve;
class FbxWeightedMapping;
class FbxSurfaceEvaluator;
class FbxScene;
class FbxNode;
class FbxNodeAttribute;
class FbxGeometry;

/** 
* This class provides the functionality to convert geometry nodes 
* attributes (FbxMesh, FbxNurbs and FbxPatch) and mainly focuses on the two
* major categories: Triangulation and conversion between NURBS and Patches surfaces. 
* \nosubgrouping
*/
class FBXSDK_DLL FbxGeometryConverter
{
public:
	/** \name Triangulation Utilities */
	//@{
		/** Triangulate all node attributes in the scene that can be triangulated.
		* \param pScene The scene to iterate through to triangulate meshes.
		* \param pReplace If \c true, replace the original meshes with the new triangulated meshes on all the nodes, and delete the original meshes. Otherwise, original meshes are left untouched.
		* \param pLegacy If \c true, use legacy triangulation method that does not support holes in geometry. Provided for backward compatibility.
		* \return \c true if all node attributes that can be triangulated were triangulated successfully.
		* \remark The function will still iterate through all meshes regardless if one fails to triangulate, but will return false in that case. This function
		* currently only supports node attribute of type eMesh, ePatch, eNurbs or eNurbsSurface. */
		bool Triangulate(FbxScene* pScene, bool pReplace, bool pLegacy=false);

		/** Triangulate a node attribute, if supported, and preserve the skins and shapes animation channels.
		* \param pNodeAttribute Pointer to the node containing the geometry to triangulate.
		* \param pReplace If \c true, replace the original geometry with the new triangulated geometry on the nodes, and delete the original geometry.
		*                 Otherwise, the original geometry is left untouched, the new one is added to the nodes, and becomes the default one.
		* \param pLegacy If \c true, use legacy triangulation method that does not support holes in geometry. Provided for backward compatibility.
		* \return The newly created node attribute if successful, otherwise NULL. If node attribute type is not supported by triangulation, it returns the original node attribute.
		* \remark This function currently only supports node attribute of type eMesh, ePatch, eNurbs or eNurbsSurface. If the node attribute does not support triangulation,
		* or if it is already triangulated, this function will return pNodeAttribute. */
		FbxNodeAttribute* Triangulate(FbxNodeAttribute* pNodeAttribute, bool pReplace, bool pLegacy=false);

		/** Compute a "vertex-correspondence" table that helps passing from source to destination geometry.
		* \param pSrcGeom Pointer to the source geometry.
		* \param pDstGeom Pointer to the destination geometry.
		* \param pSrcToDstWeightedMapping Pointer to the weighted mapping table.
		* \param pSwapUV Set to \c true to swap UVs.
		* \return \c true on success, \c false if the function fails to compute the correspondence.
		* \remark Skins and shapes are also converted to fit the alternate geometry. */
		bool ComputeGeometryControlPointsWeightedMapping(FbxGeometry* pSrcGeom, FbxGeometry* pDstGeom, FbxWeightedMapping* pSrcToDstWeightedMapping, bool pSwapUV=false);
    //@}

    /** 
    * \name Geometry Conversion
    */
    //@{
		/** Convert from patch to nurb.
		  * \param pPatch     Pointer to the patch to convert.
		  * \return           Created nurb or \c NULL if the conversion fails.
		  * \remarks          The patch must be of type eBSpline, eBezier or eLinear.
		  */
		FbxNurbs* ConvertPatchToNurbs(FbxPatch *pPatch);

		/** Convert a patch contained in a node to a nurb. Use this function to preserve the patch's 
		  *   skins and shapes animation channels.
		  * \param pNode     Pointer to the node containing the patch.
		  * \return          \c true on success, \c false if the node attribute is not a patch.
		  * \remarks         The patch must be of type eBSpline, eBezier or eLinear.
		  */
		bool ConvertPatchToNurbsInPlace(FbxNode* pNode);

		/** Convert a patch to nurb surface.
		  * \param pPatch     Pointer to the patch to convert.
		  * \return           Created nurb surface or \c NULL if conversion fails.
		  * \remarks          The patch must be of type eBSpline, eBezier or eLinear.
		  */
		FbxNurbsSurface* ConvertPatchToNurbsSurface(FbxPatch *pPatch);

		/** Convert a patch contained in a node to a nurb surface. Use this function to preserve 
		  *   the patch's skins and shapes animation channels.
		  * \param pNode     Pointer to the node containing the patch.
		  * \return          \c true on success, \c false if the node attribute is not a patch.
		  * \remarks         The patch must be of type eBSpline, eBezier or eLinear.
		  */
		bool ConvertPatchToNurbsSurfaceInPlace(FbxNode* pNode);

		/** Convert a FbxNurbs to a FbxNurbsSurface
		  * \param pNurbs     Pointer to the original nurb
		  * \return          A FbxNurbsSurface that is equivalent to the original nurb.
		  */
		FbxNurbsSurface* ConvertNurbsToNurbsSurface( FbxNurbs* pNurbs );

		/** Convert a FbxNurbsSurface to a FbxNurbs
		  * \param pNurbs     Pointer to the original nurbs surface
		  * \return          A FbxNurbs that is equivalent to the original nurbs surface.
		  */
		FbxNurbs* ConvertNurbsSurfaceToNurbs( FbxNurbsSurface* pNurbs );

		/** Convert a nurb, contained in a node, to a nurbs surface. Use this function to preserve 
		  *   the nurb's skins and shapes animation channels.
		  * \param pNode     Pointer to the node containing the nurb.
		  * \return          \c true on success, \c false otherwise
		  */
		bool ConvertNurbsToNurbsSurfaceInPlace(FbxNode* pNode);

		/** Convert a nurb contained in a node to a nurbs surface. Use this function to preserve 
		  *   the nurb's skins and shapes animation channels.
		  * \param pNode     Pointer to the node containing the nurbs surface.
		  * \return          \c true on success, \c false otherwise
		  */
		bool ConvertNurbsSurfaceToNurbsInPlace(FbxNode* pNode);
    //@}

    /** 
    * \name Nurb UV and Links Swapping
    */
    //@{
		/** Flip UV and/or skin clusters of a nurb.
		  * \param pNurbs             Pointer to the Source nurb.
		  * \param pSwapUV           Set to \c true to swap the UVs.
		  * \param pSwapClusters     Set to \c true to swap the control point indices of clusters.
		  * \return                  A flipped FbxNurbs, or \c NULL if the function fails.
		  */
		FbxNurbs* FlipNurbs(FbxNurbs* pNurbs, bool pSwapUV, bool pSwapClusters);

		/** Flip UV and/or skin clusters of a nurb surface.
		  * \param pNurbs             Pointer to the Source nurb surface.
		  * \param pSwapUV           Set to \c true to swap the UVs.
		  * \param pSwapClusters     Set to \c true to swap the control point indices of clusters.
		  * \return                  A flipped FbxNurbsSurface, or \c NULL if the function fails.
		  */
		FbxNurbsSurface* FlipNurbsSurface(FbxNurbsSurface* pNurbs, bool pSwapUV, bool pSwapClusters);
    //@}

    /** 
    * \name Normals By Polygon Vertex Emulation
    */
    //@{
		/** Emulate normals by polygon vertex mode for a mesh.
		  * \param pMesh     Pointer to the mesh object.
		  * \return          \c true on success, \c false if the number of normals in the 
		  *                  mesh and in its associated shapes don't match the number of polygon
		  *                  vertices.
		  * \remarks         For applications that only supports normals by control points, 
		  *                  this function duplicates control points to equal the 
		  *                  number of polygon vertices. skins and shapes are also converted.
		  *                  As preconditions:
		  *                       -# polygons must have been created
		  *                       -# the number of normals in the mesh and in its associated shapes must match the 
		  *                          number of polygon vertices.
		  */
		bool EmulateNormalsByPolygonVertex(FbxMesh* pMesh);

		/** Create edge smoothing information from polygon-vertex mapped normals.
		  * Existing smoothing information is removed and edge data is created if
		  * none exists on the mesh.
		  * \param pMesh     The mesh used to generate edge smoothing.
		  * \return          \c true on success, \c false otherwise.
		  * \remarks         The edge smoothing data is placed on Layer 0 of the mesh.
		  *                  Normals do not need to be on Layer 0, since the first layer with
		  *                  per polygon vertex normals is used.
		  */
		bool ComputeEdgeSmoothingFromNormals( FbxMesh* pMesh ) const;

		/** Convert edge smoothing to polygon smoothing group.
		  * Existing smoothing information is replaced.
		  * 
		  * \param pMesh     The mesh that contains the smoothing to be converted.
		  * \param pIndex    The index of the layer smoothing to be converted.
		  * \return          \c true on success, \c false otherwise.
		  * \remarks         The smoothing group is bitwise.  Each bit of the integer represents
		  *                  one smoothing group.  Therefore, there is a maximum of 32 smoothing groups.
		  */
		bool ComputePolygonSmoothingFromEdgeSmoothing( FbxMesh* pMesh, int pIndex=0 ) const;

		/** Convert polygon smoothing group to edge smoothing.
		  * Existing smoothing information is replaced.
		  * 
		  * \param pMesh     The mesh that contains the smoothing to be converted.
		  * \param pIndex    The index of the layer smoothing to be converted
		  * \return          \c true on success, \c false otherwise.
		  */
		bool ComputeEdgeSmoothingFromPolygonSmoothing( FbxMesh* pMesh, int pIndex=0 ) const;
    //@}

	/** \name Split Mesh Per Materials */
	//@{
		/** Split all the mesh in the scene per material.
		* \param pScene The scene to iterate through to split meshes.
		* \param pReplace If \c true, replace the original mesh with new ones and delete the original meshes, but *only* if they got split into multiple meshes, otherwise they are left untouched.
		* \return \c true if all splitable mesh were successfully split, \c false otherwise.
		* \remark The function will still iterate through all meshes regardless if one fails to split, but will return false in that case. */
		bool SplitMeshesPerMaterial(FbxScene* pScene, bool pReplace);

		/** Split mesh per material.
		* \param pMesh The mesh that will be split if it has multiple materials assigned.
		* \param pReplace If \c true, replace the original mesh with new one and delete the original mesh, but *only* if they got split into multiple meshes, otherwise left untouched.
		* \return \c true on success, \c false otherwise.
		* \remark The function will fail if the mapped material is not per face (FbxLayerElement::eByPolygon) or if a material is multi-layered. It will create as many meshes as
		* there are materials applied to it. If one mesh have some polygons with material A, some polygons with material B, and some polygons with NO material, 3 meshes distinct
		* will be created. The newly created meshes will be automatically attached to the same FbxNode that holds the original FbxMesh. If the original mesh have tangents, they will
		* be regenerated on the new meshes. */
		bool SplitMeshPerMaterial(FbxMesh* pMesh, bool pReplace);
	//@}

	/** Re-parent nodes at root node level under a new node to re-center them at world center.
	* Basically, this function calculates the scene bounding box in world coordinates, and test if the center of that bounding box distance from the
	* world center is larger or equal than the threshold. If true, a new node with the proper negative offset position will become the new parent of all nodes at root node level.
	* \param pScene The scene to process.
	* \param pThreshold Threshold at which all nodes will be re-centered.
	* \return \c true if any nodes were re-centered, otherwise \c false. */
	bool RecenterSceneToWorldCenter(FbxScene* pScene, FbxDouble pThreshold);

	/**
	* Merge multiple meshes to one mesh.
	* The method will merge: 
	* a) mesh vertex;
	* b) mesh polygon;
	* c) mesh edge;
	* d) all mesh elements; only the layer 0 elements is merged.
	* e) if there are skins for old mesh, merge these skins. The new skin clusters link to old skeletons.
	*
	* \param pMeshNodes FBX nodes that hold multiple meshes. These meshes will be merged.
	* \param pNodeName	 Name of new mesh node.
	* \param pScene     The scene that will contain the new mesh node.
	* \return			 The new mesh node if merge successfully, otherwise NULL is returned.
	* \remarks			 This method creates a new mesh, leaving the source mesh unchanged.
	*                   The transform of new mesh node is: translate (0, 0, 0), rotation (0, 0, 0), scale (1, 1, 1).
	*					 For layer element material, normal, smoothing, UV set, vertex color, binormal, tangent and polygon group,
	*					 if any mesh misses these element, the merge for this kind of element is skipped.
	*					 For layer element crease, hole, visibility and user data, if any mesh has such element, the kind of element
	*                   will be merged. The missing element will be filled with default values.
	*					 For meshes with skin binding, if the pose of frame 0 is different with bind pose, the new mesh will be distorted.
	*/
	FbxNode* MergeMeshes(FbxArray<FbxNode*>& pMeshNodes, const char* pNodeName, FbxScene* pScene);

	/**
	* Cleanup or remove degenerated meshes.
	* \param pScene The scene to process.
	* \param pAffectedNodes The list of nodes that have been affected by this operation.
	* \remarks  If the cleaned-up mesh becomes invalid, it is removed entirely.
	*/
	void RemoveBadPolygonsFromMeshes(FbxScene* pScene, FbxArray<FbxNode*>* pAffectedNodes = NULL);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxGeometryConverter(FbxManager* pManager);
    ~FbxGeometryConverter();

private:
	FbxMesh* TriangulateMeshInternal(const FbxMesh* pMesh);
	FbxMesh* TriangulateMeshInternalLegacy(const FbxMesh* pMesh);
	FbxMesh* TriangulatePatchInternal(const FbxPatch* pPatch);
	FbxMesh* TriangulateNurbsInternal(const FbxNurbs* pNurbs);

	bool AddAlternateGeometry(FbxNode* pNode, FbxGeometry* pSrcGeom, FbxGeometry* pAltGeom, FbxWeightedMapping* pSrcToAltWeightedMapping, bool pConvertDeformations);
	bool ConvertGeometryAnimation(FbxNode* pNode, FbxGeometry* pSrcGeom, FbxGeometry* pDstGeom);
	void ReplaceNodeAttribute(FbxNode* pNode, FbxNodeAttribute* pNewNodeAttr);
	bool AddTriangulatedMeshGeometry(FbxNode* pNode, int pUVStepCoeff);
	bool CreateAndCopyLayerElement(FbxMesh *pNewMesh, FbxMesh *pRefMesh);
	bool SetLayerElements(FbxMesh *pNewMesh, FbxMesh *pMesh, int pPolygonIndex, int pPolyPointIndex, int pLoopIndex, bool pIsSearched, bool pIsEndPolygon);

    /** FbxTriangulation
    * \param Index Output array of triangle indices
    * \param pNumSide Input number of sides of the polygon to triangulate
    * -- Triangulation algorithm is strip, Sorting vertex index for strip in clockwise.
    *
    *          2           3         4
    *           0----------0---------0
    *          /                      `
    *         /                        `  5
    *      1 /                          0 
    *       0                          /
    *        `                        /
    *          `                     /
    *         0 0-----0-------------0 6
    *                 7
    *  The result of this one will be [{0,1,2},{2,3,0},{0,3,7},{3,4,7},{7,4,6},{4,5,6}]
    */
    static void FbxTriangulation(int *Index, int pNumSide);

    bool ComputePatchToMeshControlPointsWeightedMapping(FbxPatch* pSrcPatch, FbxMesh* pDstMesh, FbxWeightedMapping* pMapping, bool pSwapUV=false);
    bool ComputeNurbsToMeshControlPointsWeightedMapping(FbxNurbsSurface* pSrcNurbs, FbxMesh* pDstMesh, FbxWeightedMapping* pMapping, bool pRescaleUVs=false, bool pSwapUV=false);

    void InitializeWeightInControlPoints(FbxGeometryBase* pGeometry);
    void InitializeWeightInNormals(FbxLayerContainer* pLayerContainer);
    void TriangulateContinuousSurface(FbxMesh* pMesh, FbxSurfaceEvaluator* pSurface, FbxUInt pPointCountX, FbxUInt pPointCountY, bool ClockWise=false);
    void CheckForZeroWeightInShape(FbxGeometry *pGeometry);
    FbxMesh* CreateMeshFromParametricSurface(const FbxGeometry* pGeometry);
    FbxNurbs* CreateNurbsFromPatch(FbxPatch* pPatch);
    FbxNurbsSurface* CreateNurbsSurfaceFromPatch(FbxPatch* pPatch);

    void ConvertShapes(const FbxGeometry* pSource, FbxGeometry* pDestination, FbxSurfaceEvaluator* pEvaluator, int pUCount, int pVCount);
    void ConvertShapes(const FbxGeometry* pSource, FbxGeometry* pDestination, FbxWeightedMapping* pSourceToDestinationMapping);
    void ConvertClusters(const FbxGeometry* pSource, FbxGeometry* pDestination, FbxWeightedMapping* pSourceToDestinationMapping);
    void ConvertClusters(FbxArray<FbxCluster*> const& pSourceClusters, int pSourceControlPointsCount, FbxArray<FbxCluster*>& pDestinationClusters, int pDestinationControlPointsCount, FbxWeightedMapping* pSourceToDestinationMapping);
    void BuildClusterToSourceMapping(FbxArray<FbxCluster*> const& pSourceClusters, FbxWeightedMapping* pClusterToSourceMapping);
    void CheckClusterToSourceMapping(FbxWeightedMapping* pClusterToSourceMapping);
    void ConvertCluster(int pSourceClusterIndex, FbxWeightedMapping* pClusterToSourceMapping, FbxWeightedMapping* pSourceToDestinationMapping, FbxCluster* pDestinationCluster);
    void DuplicateControlPoints(FbxArray<FbxVector4>& pControlPoints, FbxArray<int>& pPolygonVertices);
    void UpdatePolygon(FbxMesh *pNewMesh, FbxMesh const *pRefMesh, int pPolygonIndex, int* pNewIndex, int &pVerticeIndexMeshTriangulated, int &pPolygonIndexMeshTriangulated);
    void UpdatePolygon(FbxMesh *pNewMesh, FbxMesh const *pRefMesh, int pPolygonIndex, int* pNewIndex, int &pVerticeIndexMeshTriangulated, int &pPolygonIndexMeshTriangulated, int pTriangleNum);
    void ResizePolygon(FbxMesh *pNewMesh, int pNewCountVertices = 0, int pNewCountPolygons =0, bool pClearFlag = true);

    template <class T1, class T2> void ConvertNurbs(T1* pNewNurbs, T2* pOldNurb);

    bool CopyAnimationCurves(FbxNode* pNode, FbxGeometry* pNewGeometry);
    bool FlipNurbsCurve(FbxNurbsCurve* pCurve) const;
    void FlipControlPoints(FbxGeometryBase* pPoints, int pUCount, int pVCount) const;
    bool ConvertMaterialReferenceMode(FbxMesh* pMeshRef) const;
    void RevertMaterialReferenceModeConversion(FbxMesh* pMeshRef) const;

    FbxManager* mManager;

	friend class FbxWriter3ds;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_GEOMETRY_CONVERTER_H_ */
