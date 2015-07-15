/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxtrimnurbssurface.h
#ifndef _FBXSDK_SCENE_GEOMETRY_TRIM_NURBS_SURFACE_H_
#define _FBXSDK_SCENE_GEOMETRY_TRIM_NURBS_SURFACE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxgeometry.h>
#include <fbxsdk/scene/geometry/fbxnurbscurve.h>
#include <fbxsdk/scene/geometry/fbxnurbssurface.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** FbxBoundary describes a trimming boundary for a trimmed NURBS object.
  * Note:Outer boundaries run counter-clockwise in UV space and inner
  * boundaries run clockwise. An outer boundary represents the outer edges
  * of the trimmed surface whereas the inner boundaries define "holes" in
  * the surface.
  */
class FBXSDK_DLL FbxBoundary : public FbxGeometry
{
    FBXSDK_OBJECT_DECLARE(FbxBoundary, FbxGeometry);

public:

    //! Properties
    static const char* sOuterFlag;

    /** This property handles outer flag.
    *
    * Default value is false.
    */
    FbxPropertyT<FbxBool> OuterFlag;

    /** Adds an edge to this boundary.
      * \param pCurve       The curve to be appended to the end of this boundary
      */
    void AddCurve( FbxNurbsCurve* pCurve );

    /** Returns the number of edges within this boundary.
      * \return             The number of edges within this boundary
      */
    int GetCurveCount() const;

    /** Returns the edge at the specified index.
      * \param pIndex       The specified index, no bound checking is done.
      * \return             The edge at the specified index if
      *                     pIndex is in the range [0, GetEdgeCount() ),
      *                     otherwise the return value is undefined.
      */
    FbxNurbsCurve* GetCurve( int pIndex );

    /** Returns the edge at the specified index.
      * \param pIndex       The specified index, no bound checking is done.
      * \return             The edge at the specified index if
      *                     pIndex is in the range [0, GetEdgeCount() ),
      *                     otherwise, the return value is undefined.
      */
    const FbxNurbsCurve* GetCurve( int pIndex ) const;


    //! Returns the type of node attribute.
    virtual FbxNodeAttribute::EType GetAttributeType() const;

    /** Detects if the point is in the boundary's control hull.
      * \param pPoint       The point to be detected.
      * \return             \c True if the point is in the boundary's control hull, returns \c false if it is not in the control hull.
      */
    bool IsPointInControlHull(const FbxVector4& pPoint );

    /** Computes the origin point in the boundary
      * \return             The origin point.
      */
    FbxVector4 ComputePointInBoundary();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);

    void ClearCurves();
    void CopyCurves( FbxBoundary const& pOther );
    bool IsValid(bool mustClosed = true);
    bool IsCounterClockwise();

protected:
    virtual void ConstructProperties(bool pForceSet);

    void Reset();
    bool LineSegmentIntersect(const FbxVector4 & pStart1, const FbxVector4 & pEnd1, const FbxVector4 & pStart2, const FbxVector4 & pEnd2 ) const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


/** FbxTrimNurbsSurface describes a NURBS surface with regions
    trimmed or cut away with trimming boundaries.
  */
class FBXSDK_DLL FbxTrimNurbsSurface : public FbxGeometry
{
    FBXSDK_OBJECT_DECLARE(FbxTrimNurbsSurface,FbxGeometry);
public:
    //! Returns the type of node attribute.
    virtual FbxNodeAttribute::EType GetAttributeType() const;


    /** Returns the number of regions on this trimmed NURBS surface.
      * Note: There is always at least one region.
      * \return             The number of regions
      */
    int GetTrimRegionCount() const;

    /** Calls this function before adding boundaries to a new trim region.
      * The number of regions is incremented on this call.
      */
    void BeginTrimRegion();

    /** Calls this function after the last boundary for a given region is added.
      * If no boundaries are added between the calls to BeginTrimRegion
      * and EndTrimRegion, the last region is removed.
      */
    void EndTrimRegion();

    /** Appends a trimming boundary to the set of trimming boundaries.
      * The first boundary specified for a given trim region should be
      * the outer boundary. All other boundaries are inner boundaries.
      * This must be called after a call to BeginTrimRegion(). Boundaries
      * cannot be shared among regions. Duplicate the boundary if necessary.
      * \param pBoundary        The boundary to add.
      * \return                 \c True if the boundary is added successfully.
      *                         If the boundary is not added successfully, returns \c false.
      */
    bool              AddBoundary( FbxBoundary* pBoundary );

    /** Returns the boundary at a given index for the specified region
      * \param pIndex           The index of the boundary to retrieve, no bound checking is done.
      * \param pRegionIndex     The index of the region which is bordered by the boundary.
      * \return                 The trimming boundary at index pIndex,
      *                         if pIndex is in the range [0, GetBoundaryCount() ),
      *                         otherwise the result is undefined.
      */
    FbxBoundary*     GetBoundary( int pIndex, int pRegionIndex = 0 );

    /** Returns the boundary at a given index for the specified region
      * \param pIndex           The index of the boundary to retrieve, no bound checking is done.
      * \param pRegionIndex     The index of the region which is bordered by the boundary.
      * \return                 The trimming boundary at index pIndex,
      *                         if pIndex is in the range [0, GetBoundaryCount() ),
      *                         otherwise the result is undefined.
      */
    const FbxBoundary*     GetBoundary( int pIndex, int pRegionIndex = 0 ) const;

    /** Returns the number of boundaries for a given region.
	  * \param pRegionIndex     The index of the region. 
      * \return                 The number of trim boundaries for the given region.
      */
    int               GetBoundaryCount(int pRegionIndex = 0) const;

    /** Sets the NURBS surface that is trimmed by the trimming boundaries.
      * \param pNurbs           The NURBS surface to be trimmed.
      */
    void       SetNurbsSurface( const FbxNurbsSurface* pNurbs );

    /** Returns the NURBS surface that is trimmed by the trim boundaries.
      * \return                 A pointer to the (untrimmed) NURBS surface.
      */
    FbxNurbsSurface* GetNurbsSurface();

    /** Returns the NURBS surface that is trimmed by the trim boundaries.
      * \return                 A pointer to the (untrimmed) NURBS surface.
      */
    const FbxNurbsSurface* GetNurbsSurface() const;

    /** Sets the flag which indicates whether the surface normals are flipped. 
      * You can flip the normals of the surface to reverse the surface.
      * \param pFlip            If \c true, the surface is reversed. If it is false, the surface is not reversed.
      */
    inline void SetFlipNormals( bool pFlip ) { mFlipNormals = pFlip; }

    /** Checks if the normals are flipped.
      * \return                 \c True if normals are flipped, returns \c false if they are not flipped.
      */
    inline bool GetFlipNormals() const { return  mFlipNormals; }

    virtual int GetControlPointsCount() const;

    /** Sets the control point and the normal values for a specified index.
      * \param pCtrlPoint         The value of the control point.
      * \param pNormal            The value of the normal.
      * \param pIndex             The specified index.
      * \param pI2DSearch         Unused in this implementation.
      */
    virtual void SetControlPointAt(const FbxVector4 &pCtrlPoint, const FbxVector4 &pNormal , int pIndex, bool pI2DSearch = false);

    /** Sets the control point for a specified index.
      * \param pCtrlPoint         The value of the control point.
      * \param pIndex             The specified index.
      */
    virtual void SetControlPointAt(const FbxVector4 &pCtrlPoint, int pIndex) { ParentClass::SetControlPointAt(pCtrlPoint, pIndex); }

     /** Returns the NURBS surface's control points.
       * \param pStatus         The FbxStatus object to hold error codes.
       */
    virtual FbxVector4* GetControlPoints(FbxStatus* pStatus = NULL) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);

    bool IsValid(bool mustClosed = true);
    void ClearBoundaries();
    void CopyBoundaries( FbxTrimNurbsSurface const& pOther );
    bool IsValid(int pRegion, bool mustClosed = true);
    void RebuildRegions();

protected:
	virtual void Construct(const FbxObject* pFrom);

private:
    bool			mFlipNormals;
    FbxArray<int>	mRegionIndices;
    bool			mNewRegion;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_TRIM_NURBS_SURFACE_H_ */
