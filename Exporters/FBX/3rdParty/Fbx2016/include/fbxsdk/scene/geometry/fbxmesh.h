/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxmesh.h
#ifndef _FBXSDK_SCENE_GEOMETRY_MESH_H_
#define _FBXSDK_SCENE_GEOMETRY_MESH_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/scene/geometry/fbxgeometry.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** A mesh is a geometry made of polygons.
* The class can define a geometry with as many n-sided polygons as needed. Users can freely 
* mix triangles, quadrilaterals, and other polygons. Since the mesh-related terminology of the FBX SDK 
* differs a little from the known standards, here are our definitions:
* \li A control point is an XYZ coordinate, it is synonym of vertex.
* \li A polygon vertex is an index to a control point (the same control point can be referenced by multiple polygon vertices).
* \li A polygon is a group of polygon vertices. The minimum valid number of polygon vertices to define a polygon is 3.
* \nosubgrouping
* Methods to initialize, set and access control points are provided in the FbxGeometryBase class. */
class FBXSDK_DLL FbxMesh : public FbxGeometry
{
	FBXSDK_OBJECT_DECLARE(FbxMesh, FbxGeometry);

public:
	/** Return the type of node attribute.
	* \return Return the type of this node attribute which is \e EType::eMesh. */
	virtual FbxNodeAttribute::EType GetAttributeType() const;

	/** \name Polygon Management */
	//@{
		/** Begins the process of adding a polygon to the mesh. 
		* Add vertexes to the polygon using AddPolygon. When the polygon is complete call EndPolygon to complete the creation of the polygon.
		* \param pMaterial Index of material to assign to this polygon if material mapping type is \e eByPolygon. Otherwise it must be \c -1.
		* \param pTexture Index of texture to assign to this polygon if texture mapping type is \e eByPolygon. Otherwise it must be \c -1.
		* \param pGroup Group index assigned to polygon.
		* \param pLegacy When set to \c true, automatically create a LayerElement of type Texture; This was the default behavior of earlier
		* versions of the FBX SDK. Since version 2010, the textures are connected to the material object.
		* \remark This function must be called before AddPolygon().
		* \remark If used, the pTexture index will reference textures assigned to the DIFFUSE channel (FbxLayerElement::eTextureDiffuse). */
		void BeginPolygon(int pMaterial=-1, int pTexture=-1, int pGroup=-1, bool pLegacy=true);

		/** Begin writing a polygon.
		* Add vertexes to the polygon using AddPolygon. When the polygon is complete call EndPolygon to complete the creation of the polygon.
		* \param pMaterial Index of material to assign to this polygon if material mapping type is \e eByPolygon. Otherwise it must be \c -1.
		* \param pTextures Array of index of texture (by texture type) to assign to this polygon if texture mapping type is \e eByPolygon.
		* Otherwise it must be an array of \c -1. This array is expected to be of size: FbxLayerElement::sTypeTextureCount. If one texture
		* type is not used, the corresponding entry must be left at \c -1. */
		void BeginPolygonExt(int pMaterial, int* pTextures);

		/** Add a polygon vertex to the current polygon.
		* \param pIndex Index in the table of the control points. 
		* \param pTextureUVIndex Index of texture UV coordinates to assign to this polygon if texture UV mapping type is \e eByPolygonVertex. Otherwise it must be \c -1.
		* \remark After adding all the polygons of the mesh, call function "BuildMeshEdgeArray" to generate edge data for the mesh. */
		void AddPolygon(int pIndex, int pTextureUVIndex = -1);

		//! End writing a polygon, it should be called after adding one polygon.
		void EndPolygon();

		/** Get the polygon count of this mesh.
		* \return Return the number of polygons in the mesh. */
		inline int GetPolygonCount() const { return mPolygons.GetCount(); }

		/** Get the number of polygon vertices in a polygon.
		* \param pPolygonIndex Index of the polygon.
		* \return The number of polygon vertices in the indexed polygon. If the polygon index is out of bounds, return -1. */
		inline int GetPolygonSize(int pPolygonIndex) const
		{
			return ( pPolygonIndex >= 0 && pPolygonIndex < mPolygons.GetCount() ) ? mPolygons[pPolygonIndex].mSize : -1;
		}

		/** Get the current group ID of the specified polygon.
		* A polygon group can be useful to identify a number of polygons that share the same properties. The FBX SDK does not use this information internally
		* but guarantee its persistence in the FBX files and in memory.
		* \param pPolygonIndex Index of the polygon.
		* \return Group index assigned to the polygon. If the polygon index is out of bounds, return -1. */
		int GetPolygonGroup(int pPolygonIndex) const;

		/** Assign the specified polygon a group ID.
		* A polygon can only be assigned to one group at the time.
		* \param pPolygonIndex Index of the polygon.
		* \param pGroup Group index assigned to the polygon.
		* \return Group index assigned to the polygon. If the polygon index is out of bounds, do nothing. */
		inline void SetPolygonGroup(int pPolygonIndex, int pGroup) const
		{
			if( pPolygonIndex >= 0 && pPolygonIndex<mPolygons.GetCount() ) mPolygons[pPolygonIndex].mGroup = pGroup;
		}

		/** Get a polygon vertex (i.e: an index to a control point).
		* \param pPolygonIndex Index of queried polygon. The valid range for this parameter is 0 to \c FbxMesh::GetPolygonCount().
		* \param pPositionInPolygon Position of polygon vertex in indexed polygon. The valid range for this parameter is 0 to \c FbxMesh::GetPolygonSize(pPolygonIndex).
		* \return Return the polygon vertex indexed or -1 if the requested vertex does not exists or the indices arguments have an invalid range. */
		inline int GetPolygonVertex(int pPolygonIndex, int pPositionInPolygon) const
		{
			return ( pPolygonIndex >= 0 && pPolygonIndex < mPolygons.GetCount() && pPositionInPolygon >= 0 && pPositionInPolygon < mPolygons[pPolygonIndex].mSize ) ?
				mPolygonVertices[mPolygons[pPolygonIndex].mIndex + pPositionInPolygon] : -1;
		}

		/** Get the normal associated with the specified polygon vertex.
		* \param pPolyIndex Index of the polygon.
		* \param pVertexIndex Index of the vertex in the polygon.
		* \param pNormal The returned normal.
		* \return \c True on success, \c false on failure.
		* \remark \c pNormal remain unchanged if the requested vertex does not exists. */
		bool GetPolygonVertexNormal(int pPolyIndex, int pVertexIndex, FbxVector4& pNormal) const;

		/** Get the normals associated with the mesh for every polygon vertex.
		* \param pNormals The returned normals.
		* \return \c True on success, \c false on failure. */
		bool GetPolygonVertexNormals(FbxArray<FbxVector4>& pNormals) const;

		/** Get the UV associated with the specified polygon vertex.
		* \param pPolyIndex Index of the polygon.
		* \param pVertexIndex Index of the vertex in the polygon.
		* \param pUVSetName The name of the UV set that contains the UV.
		* \param pUV The returned UV.
        * \param pUnmapped State flag that indicates if the polygon vertex does not have an associated UV.
		* \return \c True on success, \c false on failure.
		* \remark \c pUV remain unchanged if the requested vertex does not exists.
        * \remark This function return \c true if the specified polygon vertex does not have an associated UV. In this case,
        *         pUnampped is set to \c true and the content of \c pUV is undefined.
        */
		bool GetPolygonVertexUV(int pPolyIndex, int pVertexIndex, const char* pUVSetName, FbxVector2& pUV, bool& pUnmapped) const;

		/** Get the UVs associated with the mesh for every polygon vertex.
		* \param pUVSetName The name of the UV set that contains the UVs.
		* \param pUVs The returned UVs.
        * \param pUnmappedUVId If specified, this array will be filled with the indices of the UVs that are not associated to a polygon vertex and thus, 
        *        have an undefined value. If the array as a size of 0, then all the polygon vertices have an associated UV coordinate and the \c pUVs
        *        array can be used as is. Otherwise, the calling application may be required to process the invalid UV coordinates to avoid inconsistent
        *        results. It is strongly suggested to use the FbxLayerElementUV's Direct and Indexed arrays directly (specially if the calling application
        *        supports indirection of the UVs).
        * \remark unmapped UV coordinates are set to (0,0)
		* \return \c True on success, \c false on failure.
        */
		bool GetPolygonVertexUVs(const char* pUVSetName, FbxArray<FbxVector2>& pUVs, FbxArray<int>* pUnmappedUVId = NULL) const;

		/** Get the array of polygon vertices (i.e: indices to the control points).
		* This array is a concatenation of the list of polygon vertices of all the polygons. Example: a mesh made of 2 triangles with vertices [1,2,3]
		* and vertices [2,3,4] results in [1,2,3,2,3,4]. The first polygon starts at position 0 and the second at position 3.
		* \return The array of polygon vertices. */
		int* GetPolygonVertices() const;

		/** Gets the number of polygon vertices in the mesh.
		* \return The overall size of the array of polygon vertices in the mesh.
		* \remark This value can be smaller than the value returned by GetControlPointsCount() (meaning that not all of the control points stored in the object are used to define the mesh).
		* However, typically it will be much bigger since any given control point can be used to define a vertex on multiple polygons. */
		inline int GetPolygonVertexCount() const { return mPolygonVertices.Size(); }

		/** Gets the start index into the array returned by GetPolygonVertices() for the given polygon. 
		* This method can be used for a faster access to the polygon vertices indices. If, for example, we want to
		* access the indices for polygon 3, the following code would do the trick
		* \code
		* int lStartIndex = mesh.GetPolygonVertexIndex(3);
		* if( lStartIndex == -1 ) return;
		* int* lVertices = mesh.GetPolygonVertices()[lStartIndex];
		* int lCount = mesh.GetPolygonSize(3);
		* for( int i = 0; i < lCount; ++i )
		* {
		*     int vertexID = lVertices[i];
		*     ...
		* }
		* \endcode
		* \param pPolygonIndex The polygon of interest.
		* \return The index into the GetPolygonVertices() array.
		* \remark If the polygon index is out of bounds, return -1. */
		int GetPolygonVertexIndex(int pPolygonIndex) const;

		/** Remove the specified polygon from the mesh. 
		* This method will automatically update the layers accordingly.
		* \param pPolygonIndex Index of the polygon.
		* \return Polygon index.
		* \remark If the polygon index is out of bounds, return -1. */
		int RemovePolygon(int pPolygonIndex);

		/** Remove the duplicated edges from the mesh. 
		* This method will remove duplicated edges. It will not change any vertex and not change the mesh topology.
		* \param pEdgeIndexList Index list of edges.
		* \return the count of removed edges.
		* \remark the edge index list must be ordered. The last one is the max. If the edge index is out of bounds, return -1. */
		int RemoveDuplicatedEdges(FbxArray<int>& pEdgeIndexList);
    //@}

	/** \name Texture UV Utility Functions.
	* 
	* The methods found in this section are utility functions used to handle UV coordinates quickly. Internally, they
	* refer to \c FbxLayer and \c FbxLayerElementUV methods to do the job. Except for the GetAllChannelUV(int pLayer),
	* all the methods are implicitly working on Layer 0. Use the \c FbxLayer methods to have access to the other layers. */
	//@{
		/** Init texture UV coordinates.
		* \param pCount Number of texture UV elements.
		* \param pTypeIdentifier Specifies which texture channel this UV refers to.
		* \remark \c pCount must equal the number of control points of the Mesh if
		* the UV mapping mode is \e FbxLayerElement::eByControlPoint. */
		void InitTextureUV(int pCount, FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eTextureDiffuse);

		/** Add texture UV coordinates.
		* Appends a new element at the end of the array of texture UV coordinates.
		* \param pUV Texture UV coordinates, ranging between \c 0 and \c 1.
		* \param pTypeIdentifier Specifies which texture channel this UV refers to.
		* \remark The final number of texture UV elements must equal the number of control
		* points if the UV mapping mode is \e FbxLayerElement::eByControlPoint. */
		void AddTextureUV(FbxVector2 pUV, FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eTextureDiffuse);

		/** Get the number of texture UV coordinates.
		* \param pTypeIdentifier The texture channel the UV refers to. */
		int GetTextureUVCount(FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eTextureDiffuse);

		/** Get the number of layer containing at least one channel UVMap.
		* return \e 0 if no UV maps have been defined. */
		int GetUVLayerCount() const;

		/** Fills an array describing, for the given layer, which texture channel have UVs associated to it.
		* \param pLayer Index of the layer.
		* \return Array with the channel descriptor.
		* \remark Only the channels that have UVs associated are reported in the array. For example, let's assume that we have defined UVs for the Diffuse,
		* Ambient and Bump channels on layer 0. The resulting array will have the following three entries:
		* \li FbxLayerElement::eDIFFUSE_TEXTURE
		* \li FbxLayerElement::eAMBIENT_TEXTURE
		* \li FbxLayerElement::eBUMP_TEXTURE */
		FbxArray<FbxLayerElement::EType> GetAllChannelUV(int pLayer);
	//@}

	/** \name Material, Texture and UV Indices Utility Functions.
	* The methods found in this section are utility functions used to handle Material, Texture and UV indices quickly.
	* Internally, they refer to \c FbxLayer and \c FbxLayerElementUV methods to do the job. These functions are only
	* working on Layer 0. Use the \c FbxLayer methods directly to access other layers. */
	//@{
		/** Initialize material indices.
		* \param pMappingMode The mapping mode.
		* This method must be called after FbxGeometryBase::InitControlPoints().
		* The material indices refer to the position of a material in the FbxLayerElementMaterial's direct array.
		* See FbxLayerElementMaterial for more details. Supported mapping types are \e eByControlPoint,
		* \e eByPolygon and \e eALL_SAME.
		*     - If mapping mode is \e eByControlPoint, there will be as many indices in the material index array
		*       as there are control points.
		*     - If mapping mode is \e eByPolygon, there will be as many indices in the material index array
		*       as there are polygons in the mesh.
		*     - If mapping mode is \e eALL_SAME, there will be only one index in the material index array.
		* \remark This function will set the Reference mode of the FbxLayerElementMaterial on layer 0 to \e eIndexToDirect. */
		void InitMaterialIndices(FbxLayerElement::EMappingMode pMappingMode);

		/** Initialize texture indices.
		* \param pMappingMode The mapping mode.
		* The texture indices refer to the texture connection to the material. In older versions of the FBX SDK, the
		* indices were referring to the entries in the direct array of the FbxLayerElementTexture.
		* See FbxLayerElementTexture for more details. Supported mapping modes are \e eByPolygon
		* and \e eALL_SAME.
		*     - If mapping mode is \e eByPolygon, there will be as many indices in the texture index array
		*       as there are polygons in the mesh.
		*     - If mapping mode is \e eALL_SAME, there will be only one index in the texture index array.
		* \param pTextureType The texture channel identifier.
		* \remark This function will set the Reference mode of the FbxLayerElementTexture on layer 0 to \e eIndexToDirect. */
		void InitTextureIndices(FbxLayerElement::EMappingMode pMappingMode, FbxLayerElement::EType pTextureType);

		/** Initialize texture UV indices.
		* \param pMappingMode The mapping mode.
		* The texture UV indices refer to the index of an element in the FbxLayerElementUV's direct array.
		* See FbxLayerElementUV for more details. Supported mapping types are \e eByControlPoint , \e eByPolygonVertex
		* and \e eALL_SAME.
		*     - If mapping mode is \e eByControlPoint, there will be as many indices in the UV index array
		*       as there are control points. This will also set the Reference mode of the FbxLayerElementUV on
		*       layer 0 to \e eDirect.
		*     - If mapping mode is \e eByPolygonVertex, there will be an index in the UV index array
		*       for each vertex, for each polygon it is part of. This will also set the Reference mode of the FbxLayerElementUV on
		*       layer 0 to \e eIndexToDirect.
		*     - If mapping mode is \e eALL_SAME, there will be no index in the UV index array. This will also set the Reference
		*       mode of the FbxLayerElementUV on layer 0 to \e eDirect.
		* \param pTypeIdentifier The texture channel the UVIndices refers to. */
		void InitTextureUVIndices(FbxLayerElement::EMappingMode pMappingMode, FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eTextureDiffuse);

		/** Get a texture UV index associated with a polygon vertex (i.e: an index to a control point).
		* \param pPolygonIndex Index of polygon.
		* The valid range for this parameter is 0 to FbxMesh::GetPolygonCount().
		* \param pPositionInPolygon Position of polygon vertex in indexed polygon.
		* The valid range for this parameter is 0 to FbxMesh::GetPolygonSize(pPolygonIndex).
		* \param pTypeIdentifier The texture channel the UVIndex refers to.
		* \return Return a texture UV index.
		* \remark This function only works if the texture UV mapping mode is set to \e eByPolygonVertex,
		* otherwise it returns -1. */
		int GetTextureUVIndex(int pPolygonIndex, int pPositionInPolygon, FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eTextureDiffuse);

		/** Set a texture UV index associated with a polygon vertex (i.e: an index to a control point).
		* \param pPolygonIndex Index of polygon.
		* The valid range for this parameter is 0 to FbxMesh::GetPolygonCount().
		* \param pPositionInPolygon Position of polygon vertex in indexed polygon.
		* The valid range for this parameter is 0 to FbxMesh::GetPolygonSize(pPolygonIndex).
		* \param pIndex The index of the texture UV we want to assign to the polygon vertex.
		* \param pTypeIdentifier The texture channel the UVIndex refers to.
		* \remark This function only works if the texture UV mapping type is set to \e eByPolygonVertex. */
		void SetTextureUVIndex(int pPolygonIndex, int pPositionInPolygon, int pIndex, FbxLayerElement::EType pTypeIdentifier);
	//@}

	/** \name Utility functions */
	//@{
		/** Reset the mesh to default values.
		* Frees and set to \c NULL all layers and clear the polygon and the control point array. */
		void Reset();

        /** Generate vertex normals on the mesh.
        * The normal computation takes into consideration, as much as possible, the smoothing groups.
		* \param pOverwrite If true, re-generate normals data regardless of availability, otherwise left untouched if exist.
        * \param pByCtrlPoint If true, the recomputed normals will be defined by control points instead of by polygon vertex.
        * \param pCW True if the normals are calculated clockwise, false otherwise (counter-clockwise).
		* \return \c true if successfully generated normals data, or if already available and pOverwrite is false. */
		bool GenerateNormals(bool pOverwrite=false, bool pByCtrlPoint = false, bool pCW=false);

		/** Compares the normals calculated by doing cross-products between the polygon vertex and by the ones
		* stored in the normal array.
		* \returns \c false if ALL of them are Clockwise. Returns \c true otherwise. */
		bool CheckIfVertexNormalsCCW();

		//! Internal structure used to keep the duplicate vertex information.
		class DuplicateVertex
		{
		public:
			DuplicateVertex() :
				lVertexPolyIndex(0),
				lNewVertexIndex(0),
				lNormal(0, 0, 0),
				lUV(0, 0),
				lEdgeIndex(0)
			{
			}

			int			lVertexPolyIndex;	//!< Index in mPolygonsVertex where the vertex is found.
			int			lNewVertexIndex;	//!< The new index of the vertex.
			FbxVector4	lNormal;			//!< The normal associated with this duplicate control point.
			FbxVector2	lUV;				//!< The UV associated with this duplicate control point.
			int			lEdgeIndex;			//!< The edge index.
		};

		//! Internal structure used to compute the normals on a mesh
		class VertexNormalInfo
		{
		public:
			VertexNormalInfo() :
				mTotalNormal(0, 0, 0),
				mNumNormal(0)
			{
			}

			FbxVector4	mTotalNormal;	//!< Sum of all the normals found.
			int			mNumNormal;		//!< Number of normals added.
		};

		/** Verify if the mesh has polygons that are defined on the same point more than once.
		* \return true if the mesh has that kind of polygon, false otherwise. */
		bool CheckSamePointTwice() const;

		/** Remove bad polygons from a mesh.
		* Degenerate polygons use a vertex more than once. Remove them from the mesh and
		* from the layer element indices as needed.
		* \return Number of polygons removed from the mesh, -1 if an error occurred. */
		int RemoveBadPolygons();
	//@}

	/** \name Point Splitting/Merging utility functions */
	//@{
		/** Split points.
		* \param pTypeIdentifier Specify which UVs are processed.
		* \return \c true if a split occurred, false otherwise.
		* \remark This method replaces the BuildSplitList and SplitPointsForHardEdge. */
		bool SplitPoints(FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eTextureDiffuse);

		/** Insert the new indexes of the object that have to be merged.
		* \param pMergeList The list that will contain the indexes of the objects to merge.
		* \param pExport If set to \c true, include the duplicate indexes in the merge list. */
		bool BuildMergeList(FbxArray<int>& pMergeList, bool pExport=false);

		/** Merge the points specified in the list.
		* \param pMergeList List containing the information on the points that will be merged. */
		void MergePointsForPolygonVerteNormals(FbxArray<int> &pMergeList);
	//@}

	/** \name Edge management functions */
	//@{
		/** Automatically generate edge data for the mesh. Clears all previously stored edge information */
		void BuildMeshEdgeArray();

		/** Query the number of edges defined on this mesh
		* \return The number of edges defined for this mesh */
		int GetMeshEdgeCount() const;

		/** Get the index for the edge between the given vertices.
		* Note that the result of this method is the same if pStartVertexIndex and pEndVertexIndex are swapped.
		* \param pStartVertexIndex The starting point of the edge.
		* \param pEndVertexIndex The ending point of the edge.
		* \param pReversed flag will be set to true if the reverse edge is found, false otherwise.
		* \param pExistedEdgeCount legal edge count in mEdgeArray  
		* \return -1 if no edge exists for the given pair of vertices. */
		int GetMeshEdgeIndex(int pStartVertexIndex, int pEndVertexIndex, bool& pReversed, int pExistedEdgeCount=-1);

		/** Use this method before calling GetMeshEdgeIndexForPolygon if making several calls to that method.
		* Once done calling GetMeshEdgeIndexForPolygon, call EndGetMeshEdgeIndex. This will optimize access time.
		* Do not modify the mesh between calls to BeginGetMeshEdgeIndex and EndGetMeshEdgeIndex. */
		void BeginGetMeshEdgeIndexForPolygon();

		/** Use this method after calling GetMeshEdgeIndexForPolygon if making several calls to that method.
		* This will optimize access time.
		* Do not modify the mesh between calls to BeginGetMeshEdgeIndex and EndGetMeshEdgeIndex. */
		void EndGetMeshEdgeIndexForPolygon();

		/** Get the index for the specific edge of pPolygon.
		* \param pPolygon The polygon of interest.
		* \param pPositionInPolygon The specific edge number in the polygon.      
		* \return -1 if the specific edge does not exist.
		* \remark To optimize access time when making several calls to this method, enclose these calls 
		*          between the BeginGetMeshEdgeIndexForPolygon() and EndGetMeshEdgeIndexForPolygon() calls. */
		int GetMeshEdgeIndexForPolygon(int pPolygon, int pPositionInPolygon);

		/** Get the vertices for the given edge. Note that the values returned are indices into the control point array.
		* \param pEdgeIndex The edge to query.
		* \param pStartVertexIndex The edge's starting point will be stored here.
		* \param pEndVertexIndex The edge's starting point will be stored here. */
		void GetMeshEdgeVertices(int pEdgeIndex, int& pStartVertexIndex, int& pEndVertexIndex) const;

		/**  Use this method before calling GetMeshEdgeVertices if making several calls to that method.
		*  Once done calling GetMeshEdgeVertices, call EndGetMeshEdgeVertices. This will optimize access time.
		*  Do not modify the mesh between calls to BeginGetMeshEdgeVertices and EndGetMeshEdgeVertices. */
		void BeginGetMeshEdgeVertices();

		/** Use this method after calling GetMeshEdgeVertices if making several calls to that method.
		* This will optimize access time.
		* Do not modify the mesh between calls to BeginGetMeshEdgeVertices and EndGetMeshEdgeVertices. */
		void EndGetMeshEdgeVertices();

		/** Presets the number edge data elements.
		* \param pEdgeCount The number of edges to allocate. */
		void SetMeshEdgeCount(int pEdgeCount);

		/** Sets element in edge array to specific value.
		* \param pEdgeIndex The edge index
		* \param pValue The edge data */
		inline void SetMeshEdge(int pEdgeIndex, int pValue){ if( pEdgeIndex >= 0 && pEdgeIndex < mEdgeArray.GetCount() ) mEdgeArray[pEdgeIndex] = pValue; }

		/** Add an edge with the given start/end points. Note that the inserted edge
		* may start at the given end point, and end at the given start point.
		* \param pStartVertexIndex The starting point of the edge.
		* \param pEndVertexIndex The ending point of the edge.
		* \param pCheckForDuplicates Set to true to check if the mesh already contains an edge with these two points.
		*  Can be set to false to speed up this method, when the incoming edges are known to be consistent.
		* \return Edge index of the new edge, or -1 on failure (edge/reverse edge already exists, no face using these 2 points consecutively ) */
		int AddMeshEdgeIndex(int pStartVertexIndex, int pEndVertexIndex, bool pCheckForDuplicates);

		/** Set the index for the edge with the given start/end points. Note that the edge
		* may start at the given end point, and end at the given start point.
		* \param pEdgeIndex The edge index of the edge.
		* \param pStartVertexIndex The starting point of the edge.
		* \param pEndVertexIndex The ending point of the edge.
		* \param pCheckForDuplicates Set to true to check if the mesh already contains an edge with these two points.
		*  Can be set to false to speed up this method, when the incoming edges are known to be consistent.
		* \param pExistedEdgeCount the valid edge count that we have created in edge array. This parameter only works when pCheckForDuplicates is true.
		*			                 The default value is -1 which meaning current edge array has been fully filled with valid edges, i.e., 
		*                          we will search the full edge array for the duplicated edge.
		* \return Edge index of the edge, or -1 on failure (no face using these 2 points consecutively ), or -2 if edge/reverse edge already exists */
		int SetMeshEdgeIndex(int pEdgeIndex, int pStartVertexIndex, int pEndVertexIndex, bool pCheckForDuplicates, int pExistedEdgeCount=-1);

		/** Call this before calling AddMeshEdgeIndex or SetMeshEdgeIndex to increase performance.
		* Once finished adding/setting edges EndAddMeshEdgeIndex should be called. */
		void BeginAddMeshEdgeIndex();

		/** After calling AddMeshEdgeIndex or SetMeshEdgeIndex, EndAddMeshEdgeIndex should be called. */
		void EndAddMeshEdgeIndex();

		/** Adds an edge for the specified polygon, and edge number within the polygon. See SetMeshEdgeIndex for notes the the parameters.
		* \param pPolygonIndex The polygon of interest.
		* \param pPositionInPolygon The edge within the polygon
		* \return edge index or -1 if failed. */
		int AddMeshEdgeIndexForPolygon(int pPolygonIndex, int pPositionInPolygon);

		/** Sets the specified edge to the specified polygon's edge.
		* Note that the position in the polygon ranges from 0 to GetPolygonSize(pPolygonindex) - 1
		* and represents the edge from GetPolygonVertex(pPolygonIndex, pPositionInPolygon) to
		* GetPolygonVertex( pPolygonIndex, pPositionInPolygon + 1 ) or from pPositionInPolygon to
		* 0 if pPositionInPolygon == GetPolygonSize(pPolygonindex) - 1
		* \param pEdgeIndex The edge.
		* \param pPolygonIndex The polygon.
		* \param pPositionInPolygon The specific edge number in the polygon.
		* \return true on success, false on failure. ( edge for the poly and position already exists ) */
		bool SetMeshEdgeIndex(int pEdgeIndex, int pPolygonIndex, int pPositionInPolygon);

		/** Determines if the mesh is composed entirely of triangles.
		* \return true if all polygons are triangles, false otherwise */
		bool IsTriangleMesh() const;
	//@}

	/** Reserve memory in the polygon array to hold the specified number of polygons
	* \param pCount The number of polygons this mesh will hold */
	inline void ReservePolygonCount(int pCount) { mPolygons.Reserve(pCount); }

	/** Reserve memory in the polygon vertex array to hold the specified number of polygon vertices.
	* \param pCount The number of polygon vertices */
	inline void ReservePolygonVertexCount(int pCount) { mPolygonVertices.Reserve(pCount); }

	bool GetTextureUV(FbxLayerElementArrayTemplate<FbxVector2>** pLockableArray, FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eTextureDiffuse) const;
	bool GetMaterialIndices(FbxLayerElementArrayTemplate<int>** pLockableArray) const;
	bool GetTextureIndices(FbxLayerElementArrayTemplate<int>** pLockableArray, FbxLayerElement::EType pTextureType) const;

	/** \name Crease utility functions */
	//@{
		/** Get crease weight by edge index.
		* \param pEdgeIndex Edge index.
		* \return Crease weight value in the range [0.0 - 1.0]. */
		double GetEdgeCreaseInfo(int pEdgeIndex);

		/** Get crease edge array.
		* \param pCreaseArray Edge crease data array.
		* \return \c true if the pCreaseArray is filled successfully. */
		bool GetEdgeCreaseInfoArray(FbxLayerElementArrayTemplate<double>** pCreaseArray);

		/** Get crease weight by vertex index.
		* \param pVertexIndex Vertex index.
		* \return Crease weight value in the range [0.0 - 1.0]. */
		double GetVertexCreaseInfo(int pVertexIndex);

		/** Get vertex crease array.
		* \param pCreaseArray Edge vertex data array.
		* \return \c true if the pCreaseArray is filled successfully. */
		bool GetVertexCreaseInfoArray(FbxLayerElementArrayTemplate<double>** pCreaseArray);

		/** Set crease weight by edge index.
		* \param pEdgeIndex Edge index.
		* \param pWeight Crease weight value in the range [0.0 - 1.0].
		* \return \c true if successfully set the crease weight. */
		bool SetEdgeCreaseInfo(int pEdgeIndex, double pWeight);

		/** Set crease weight data array.
		* \param pWeightArray Edge crease data.
		* \return \c true if successfully set the crease weight. */
		bool SetEdgeCreaseInfoArray(FbxArray<double>* pWeightArray);

		/** Set crease weight by vertex index.
		* \param pVertexIndex Vertex index.
		* \param pWeight Crease weight value in the range [0.0 - 1.0].
		* \return \c true if successfully set the crease weight. */
		bool SetVertexCreaseInfo(int pVertexIndex, double pWeight);

		/** Set crease weight data array.
		* \param pWeightArray Vertex crease data.
		* \return \c true if successfully set the crease weight. */
		bool SetVertexCreaseInfoArray(FbxArray<double>* pWeightArray);
	//@}

	/** \name Smooth mesh preview utility functions */
	//@{
		/** \enum ESmoothness Display Smoothness.
		* It represents smooth mesh preview mode. This concept is not used in the FBX SDK but simply 
		* carried over so applications can access it and perform the appropriate tasks. */
		enum ESmoothness
		{
			eHull,		//!< Default value, not active "smooth mesh preview".
			eRough,		//!< Not active "smooth mesh preview".
			eMedium,	//!< Both display cage and smooth mesh.
			eFine		//!< Display smooth mesh.
		};

		/** \enum EBoundaryRule the boundary rule. */
		enum EBoundaryRule
		{
			eLegacy,	//!< Default value.
			eCreaseAll,	//!< Used for hard corner.
			eCreaseEdge	//!< Used for round corner.
		};

		/** Get display smoothness from mesh.
		* \return Mesh smoothness.
		* \remark It represents smooth mesh preview mode. */
		FbxMesh::ESmoothness GetMeshSmoothness() const;

		/** Set the mesh display smoothness mode.
		* \param pSmoothness New smoothness factor.
		* \remark It represents smooth mesh preview mode. */
		void SetMeshSmoothness(FbxMesh::ESmoothness pSmoothness);

		/** Get preview subdivision levels from mesh.
		* \return Mesh preview subdivision levels. */
		int GetMeshPreviewDivisionLevels() const;

		/** Set mesh preview subdivision levels.
		* \param pPreviewDivisionLevels Number of subdivisions levels. */
		void SetMeshPreviewDivisionLevels(int pPreviewDivisionLevels);

		/** Get render subdivision levels from mesh.
		* \return Mesh render subdivision levels 
		* \remark Sometimes, render division level can be the same as preview level. */
		int GetMeshRenderDivisionLevels() const;

		/** Set mesh render subdivision levels.
		* \param pRenderDivisionLevels Number of subdivision levels. */
		void SetMeshRenderDivisionLevels(int pRenderDivisionLevels);

		/** Query whether to display subdivisions isolines on mesh.
		* \return The current state of the internal flag. */
		bool GetDisplaySubdivisions() const;

		/** Set the DisplySubdivisions state.
		* \param pDisplySubdivisions New value for this flag. */
		void SetDisplaySubdivisions(bool pDisplySubdivisions);

		/** Get BoundaryRule from mesh.
		* \return Current value of the internal state. */
		EBoundaryRule GetBoundaryRule() const;

		/** Set BoundaryRule for this mesh.
		* \param pBoundaryRule New value for the internal state of this mesh.
		* \remark BoundaryRule will affect the corners of smooth mesh. */
		void SetBoundaryRule(EBoundaryRule pBoundaryRule);

		/** Query whether to preserve borders when preview smooth mesh is enabled.
		* \return The current state of the flag. */
		bool GetPreserveBorders() const;

		/** Set the state of the PreserveBorders flag.
		* \param pPreserveBorders New value for this flag.
		* \remark This flag value will affect smooth mesh preview results. */
		void SetPreserveBorders(bool pPreserveBorders);

		/** Query whether to preserve hard edges when preview smooth mesh.
		* \return The current state of the flag. */
		bool GetPreserveHardEdges() const;

		/** Set the state of the PreserveHardEdges flag.
		* \param pPreserveHardEdges New value for this flag.
		* \remark This flag value will affect smooth mesh preview results. */
		void SetPreserveHardEdges(bool pPreserveHardEdges);

		/** Query whether to PropagateEdgeHardness when preview smooth mesh.
		* \return The current state of the flag. */
		bool GetPropagateEdgeHardness() const;

		/** Set state of the PropagateEdgeHardness flag.
		* \param pPropagateEdgeHardness New value for this flag.
		* \remark This flag will affect smooth mesh preview results. */
		void SetPropagateEdgeHardness(bool pPropagateEdgeHardness);
	//@}

	/** \name Geometry hole management utility functions */
	//@{
		/** Get hole flag by face index (an index to a polygon).
		* \param pFaceIndex Index of the queried polygon.
		* \return The hole flag for the given face. */
		bool GetPolyHoleInfo(int pFaceIndex);

		/** Get hole flags Array.
		* \param pHoleArray Hole flags array.
		* \return \c true if the pHoleArray is filled successfully. */
		bool GetPolyHoleInfoArray(FbxLayerElementArrayTemplate<bool>** pHoleArray);

		/** Sets the flag indicating whether the face represents a hole or not.
		* \param pFaceIndex Index of the processed polygon.
		* \param pIsHole If \c true, this face represent a hole.
		* \return \c true if successfully set the hole info. */
		bool SetPolyHoleInfo(int pFaceIndex, bool pIsHole);

		/** Set hole flags array.
		* \param pHoleArray Hole flag array.
		* \return \c true if successfully set the hole flags. */
		bool SetPolyHoleInfoArray(FbxArray<bool>* pHoleArray);
	//@}

	/** \name Tangents data management utility functions */
	//@{
		/** Generate tangents data for UVSet with specific name.
		* Note that the UV winding order is stored in the W component of the tangent.
		* W =  1.0 (right-handed)
		* W = -1.0 (left-handed)
		* In the case of a left-handed tangent, this function automatically flips the
		* resulting binormal to correct for mirrored geometry.
		* \param pUVSetName The UVSet name to generate tangents data with. The UVSet on the first layer is the the default UVSet to generate.
		* \param pOverwrite If true, re-generate tangents data regardless of availability, otherwise left untouched if exist.
		* \return \c true if successfully generated tangents data, or if already available and pOverwrite is false. */
		bool GenerateTangentsData(const char* pUVSetName=NULL, bool pOverwrite=false);

		/** Generate tangents data for UVSet in specific layer.
		* Note that the UV winding order is stored in the W component of the tangent.
		* W =  1.0 (right-handed)
		* W = -1.0 (left-handed)
		* In the case of a left-handed tangent, this function automatically flips the
		* resulting binormal to correct for mirrored geometry.
		* \param pUVSetLayerIndex The layer to generate tangents data with.
		* \param pOverwrite If true, re-generate tangents data regardless of availability, otherwise left untouched if exist.
		* \return \c true if successfully generated tangents data, or if already available and pOverwrite is false. */
		bool GenerateTangentsData(int pUVSetLayerIndex, bool pOverwrite=false);

    
		/** Generate tangents data for all UVSets in all layers.
		* Note that the UV winding order is stored in the W component of the tangent:
		* W =  1.0 (right-handed)
		* W = -1.0 (left-handed)
		* In the case of a left-handed tangent, this function automatically flips the
		* resulting binormal to correct for mirrored geometry.
		* \param pOverwrite If true, re-generate tangents data regardless of availability, otherwise left untouched if exist.
		* \return \c true if successfully generated tangents data, or if already available and pOverwrite is false. */
		bool GenerateTangentsDataForAllUVSets(bool pOverwrite=false);
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);
	virtual void Compact();

	//Please use GetPolygonVertexIndex and GetPolygonVertices to access these arrays.
	//DO NOT MODIFY them directly, otherwise unexpected behavior will occur.
	//These members are public only for application data copy performance reasons.
	struct PolygonDef{ int mIndex; int mSize; int mGroup; };

    FbxArray<PolygonDef>	mPolygons;
    FbxArray<int>			mPolygonVertices;
    FbxArray<int>			mEdgeArray;

	//These are only used in context of triangulation to backup original polygon layout necessary for handling mesh cache after triangulation
	FbxArray<PolygonDef>*	mOriginalPolygons;
	FbxArray<int>*			mOriginalPolygonVertices;
	int						mOriginalControlPointsCount;

	//Internal structure used to keep the mapping information between edges and polygons.
    struct ComponentMap
    {
        FbxArray<int> mData; // The array to store data.
        FbxArray<int> mOffsets; // The array to store the offsets of the data in mData.

        int GetDataCount(int pIndex) { return mOffsets[pIndex + 1] - mOffsets[pIndex]; }
        int GetData(int pIndex, int pSubIndex) { return mData[ mOffsets[pIndex] + pSubIndex ]; }
        int GetComponentCount() { return mOffsets.GetCount() - 1; }
    };
    void ComputeComponentMaps(ComponentMap& pEdgeToPolyMap, ComponentMap& pPolyToEdgeMap);
	
	// Internal structure used to keep the mapping information between the control points and the
	// vertices referencing them
	class ControlPointToVerticesMap
	{
	public:
		ControlPointToVerticesMap();
		~ControlPointToVerticesMap();
		bool Valid();		

		void Fill(FbxMesh* pMesh);

		int  GetCount();
		bool Init(int pNbEntries);
		void Clear();

		FbxArray<int>* GetVerticesArray(int pControlPoint);
		FbxArray<int>* operator[](int pControlPoint);

	private:
		FbxArray< FbxArray<int>* > mMap;
	};
	void ComputeControlPointToVerticesMap(ControlPointToVerticesMap& pMap);

	// this function will compare the vertex normals with the corresponding ones in pMesh and 
	// make them similar (i.e: if pMesh(NVi) == pMesh(NVj) then make this(NVi) == this(NVj))
	bool ConformNormalsTo(const FbxMesh* pMesh);

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void Destruct(bool pRecursive);
	virtual void ContentClear();

	void InitTextureIndices(FbxLayerElementTexture* pLayerElementTexture, FbxLayerElement::EMappingMode pMappingMode);
	void RemoveTextureIndex(FbxLayerElementTexture* pLayerElementTextures, int pPolygonIndex, int pOffset);
	void RemoveUVIndex(FbxLayerElementUV* pLayerElementUV, int pPolygonIndex, int pOffset);
    
	bool GetBadPolyIndices(FbxArray<int>& pArrayBadPolyIndices, bool pCheckOne) const;

	struct SplitEdgeData { int mOriginalEdge; bool mIsNew; };

	ESmoothness		mSmoothness;
	int				mPreviewDivisionLevels;
	int				mRenderDivisionLevels;

	bool			mDisplaySubdivisions;
	EBoundaryRule	mBoundaryRule;
	bool			mPreserveBorders;
	bool			mPreserveHardEdges;
	bool			mPropagateEdgeHardness;

	struct PolygonIndexDef { int mPolygonIndex; int mSubPolygonIndex; };

	struct V2PVMap
	{
		PolygonIndexDef* mV2PV;
		int* mV2PVOffset;
		int* mV2PVCount;
		FbxArray<FbxSet<int>* > mPVEdge;
		bool mValid;

		//Used for fast search in GetMeshEdgeIndexForPolygon this array does not follow the same allocation as the above ones because
		//it is not used in the normal BeginAddMeshEdgeIndex(). It is filled only by the call to BeginGetMeshEdgeIndexForPolygon().
		FbxArray<int> mV2Edge;
	} mV2PVMap;

	struct EdgeLookupDef { FbxArray<int> mPVFlags; bool mValid; } mPVEndFlags;

	//Finds the polygon index for the given edge
	int						FindPolygonIndex(int pEdgeIndex);
	static int				PolygonIndexCompare(const void* p1, const void* p2);
	void					PolySetTexture(FbxLayer* pLayer, int pTextureIndex, FbxLayerElement::EType pTextureType);
	template<class T> bool	GetPolygonVertexLayerElementIndex(const FbxLayerElementTemplate<T>* pLayerElement, int pPolyIndex, int pVertexIndex, int& pIndex) const;
	template<class T> bool	GetPolygonVertexLayerElementValue(const FbxLayerElementTemplate<T>* pLayerElement, int pPolyIndex, int pVertexIndex, T& pValue, bool pAllowUnmapped) const;

	friend class FbxGeometryConverter;

private:
    bool GenerateTangentsData(FbxLayerElementUV* pUVSet, int pLayerIndex, bool pOverwrite=false);
    void FillMeshEdgeTable(FbxArray<int>& pTable, int* pValue, void (*FillFct)(FbxArray<int>& pTable, int pIndex, int* pValue));
    void ComputeNormalsPerCtrlPoint(FbxArray<VertexNormalInfo>& lNormalInfo, bool pCW=false);
    void ComputeNormalsPerPolygonVertex(FbxArray<VertexNormalInfo>& lNormalInfo, bool pCW=false);
    void GenerateNormalsByCtrlPoint(bool pCW);

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_MESH_H_ */
