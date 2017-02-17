/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxnurbssurface.h
#ifndef _FBXSDK_SCENE_GEOMETRY_NURBS_SURFACE_H_
#define _FBXSDK_SCENE_GEOMETRY_NURBS_SURFACE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxgeometry.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxNode;

/** A NURBS surface is a type of parametric geometry. A NURBS surface is defined by the
    order, form, knot vector and control points in the U and V directions.

    For more information on the meaning of the form, knot vector and control points,
    see the documentation for the FbxNurbsCurve. The same concepts for NURBS curves
    apply to NURBS surfaces. NURBS surfaces simply have two dimensions (U and V).

  * \nosubgrouping
  */
class FBXSDK_DLL FbxNurbsSurface : public FbxGeometry
{
    FBXSDK_OBJECT_DECLARE(FbxNurbsSurface, FbxGeometry);

public:
    //! Returns the FbxNodeAttribute::EType::eNurbsSurface node attribute type.
    virtual FbxNodeAttribute::EType GetAttributeType() const;

    //! Resets the NURBS surface its default values.
    void Reset();

    /**
      * \name NURBS surface Properties
      */
    //@{

    /** Sets the surface mode.
      * \param pMode            Surface mode identifier (see class FbxGeometry).
      */
    void SetSurfaceMode(FbxGeometry::ESurfaceMode pMode);

    /** Returns the surface mode.
      * \return                 The surface mode identifier that is currently set.
      */
    inline ESurfaceMode GetSurfaceMode() const {return mSurfaceMode;}

    /** \enum EType NURBS types.
      * - \e ePeriodic
      * - \e eClosed
      * - \e eOpen
      */
    enum EType
    {
        ePeriodic,
        eClosed,
        eOpen
    };

    /** Allocates memory space for an array of control points as well as knot
      * and multiplicity vectors.
      * \param pUCount      Number of U-dimension control points.
      * \param pUType       U-dimension NURBS type.
      * \param pVCount      Number of V-dimension control points.
      * \param pVType       V-dimension NURBS type.
      * \remarks            Always call this function after FbxNurbsSurface::SetOrder().
      */
    void InitControlPoints(int pUCount, EType pUType, int pVCount, EType pVType);

    /** Returns the number of U-dimension control points.
      * \return             Number of U-dimension control points.
      */
    inline int GetUCount() const {return mUCount;}

    /** Returns the number of V-dimension control points.
      * \return             Number of V-dimension control points.
      */
    inline int GetVCount() const {return mVCount;}

    /** Returns the U-dimension NURBS type.
      * \return             NURBS type identifier.
      */
    inline EType GetNurbsUType() const {return mUType;}

    /** Returns the V-dimension NURBS type.
      * \return             NURBS type identifier.
      */
    inline EType GetNurbsVType() const {return mVType;}

    /** Returns the number of elements in the U-dimension knot vector. See FbxNurbsCurve for more information.
      * \return             The number of elements in the U-dimension knot vector.
      */
    int GetUKnotCount() const;

    /** Returns the U-dimension knot vector.
      * \return             Pointer to the U-dimension knot vector.
      */
    double* GetUKnotVector() const;

    /** Returns the number of elements in the V-dimension knot vector. See FbxNurbsCurve for more information.
      * \return             The number of elements in the V-dimension knot vector.
      */
    int GetVKnotCount() const;

    /** Returns the V-dimension knot vector.
      * \return             Pointer to the V-dimension knot vector.
      */
    double* GetVKnotVector() const;

    /** Sets the order of the NURBS surface.
      * \param pUOrder      NURBS order in U dimension.
      * \param pVOrder      NURBS order in V dimension.
      */
    void SetOrder(FbxUInt pUOrder, FbxUInt pVOrder);

    /** Returns the NURBS order in U dimension.
      * \return             NURBS order in U dimension.
      */
    inline int GetUOrder() const {return mUOrder;}

    /** Returns the NURBS order in V dimension.
      * \return             NURBS order in V dimension.
      */
    inline int GetVOrder() const {return mVOrder;}

    /** Sets the NURBS step.
      * The step value is the number of divisions between adjacent control points.
      * \param pUStep       Steps in U dimension.
      * \param pVStep       Steps in V dimension.
      */
    void SetStep(int pUStep, int pVStep);

    /** Returns the number of divisions between adjacent control points in U dimension.
      * \return             Steps in U dimension.
      */
    inline int GetUStep() const {return mUStep;}

    /** Returns the number of divisions between adjacent control points in V dimension.
      * \return             Steps in V dimension.
      */
    inline int GetVStep() const {return mVStep;}

    /** Calculates the number of surface spans in the U dimension.
      * See FbxNurbsCurve::GetSpanCount() for more information.
      * \return             The number of spans in the U dimension if the surface has been initialized.
      *                     If the spans have not been initialized, returns -1.
      */
    int GetUSpanCount() const;

    /** Calculates the number of surface spans in the V dimension.
      * See FbxNurbsCurve::GetSpanCount() for more information.
      * \return             The number of spans in the V dimension if the surface has been initialized.
      *                     If the spans have not been initialized, returns -1.
      */
    int GetVSpanCount() const;

    //@}

    /**
      * \name NURBS surface Export Flags
      */
    //@{

    /** Sets the flag that induces UV flipping at export.
      * \param pFlag        If \c true, UV flipping occurs.
      */
    void SetApplyFlipUV(bool pFlag);

    /** Returns the flag that induces UV flipping at export.
      * \return             The current state of the UV flip flag.
      */
    bool GetApplyFlipUV() const;

    /** Sets the flag that induces link flipping at export.
      * \param pFlag        If \c true, the links control points indices are flipped.
      */
    void SetApplyFlipLinks(bool pFlag);

    /** Returns the flag that induces link flipping at export.
      * \return             The current state of the link flip flag.
      */
    bool GetApplyFlipLinks() const;

    /** Returns flip flags state.
      * \return             \c True if we need to flip either the UV or the links.
      */
    bool GetApplyFlip() const { return GetApplyFlipUV() || GetApplyFlipLinks(); }

    /** Adds a curve to the NURBS surface.
      * Adds a 2D, parametric space curve to this surface
      * \param pCurve       The curve to be added to the surface.
      */
    void AddCurveOnSurface( FbxNode* pCurve );

   /** Retrieves a curve from this surface
     * \param pIndex        Index of the curve to retrieve (Valid range is 0 to GetCurveOnSurfaceCount() - 1).
     * \return              The curve at the specified index, or returns NULL if pIndex is out of range.
     */
    FbxNode* GetCurveOnSurface( int pIndex );

   /** Retrieves a curve from this surface
     * \param pIndex        Index of the curve to retrieve (Valid range is 0 to GetCurveOnSurfaceCount() - 1).
     * \return              The curve at the specified index, or returns NULL if pIndex is out of range.
     */
    const FbxNode* GetCurveOnSurface( int pIndex ) const;

   /** Returns the number of curves on this surface.
     * \return              The number of curves on this surface.
     */
    int GetCurveOnSurfaceCount() const;

   /** Removes a curve from this surface.
     * \param pCurve        The curve to be removed.
     * \return              \c True if the curve is removed successfully, if unsuccessful, returns \c false.
     */
    bool RemoveCurveOnSurface( FbxNode* pCurve );

    //@}

    /** Checks if the surface has all rational control points.
      * \return             \c True if rational, \c false otherwise
      */
    bool IsRational() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    // Error identifiers, these are only used internally.
    enum EErrorCode
    {
        eNurbsTypeUnknown,
        eWrongNumberOfControlPoint,
        eWeightTooSmall,
        eUKnotVectorError,
        eVKnotVectorError,
        eErrorCount
    };

    virtual FbxObject& Copy(const FbxObject& pObject);
    virtual void InitControlPoints(int pCount) { ParentClass::InitControlPoints(pCount); }

    void SetFlipNormals(bool pFlipNormals);
    bool GetFlipNormals() const;
    bool IsValidKnots() const;

protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual void Destruct(bool pRecursive);

    FbxUInt mUOrder, mVOrder;
    int mUCount, mVCount;
    int mUStep, mVStep;
    EType mUType, mVType;

    double* mUKnotVector;
    double* mVKnotVector;

    ESurfaceMode mSurfaceMode;

    bool mApplyFlipUV;
    bool mApplyFlipLinks;
    bool mFlipNormals;

    friend class FbxGeometryConverter;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_NURBS_SURFACE_H_ */
