/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxpatch.h
#ifndef _FBXSDK_SCENE_GEOMETRY_PATCH_H_
#define _FBXSDK_SCENE_GEOMETRY_PATCH_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxgeometry.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** A patch is a type of node attribute with parametric surface.
  * A patch object is useful for creating gently curved surfaces, and provides very detailed control for manipulating complex geometry.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxPatch : public FbxGeometry
{
    FBXSDK_OBJECT_DECLARE(FbxPatch,FbxGeometry);

public:
    //! Returns the FbxNodeAttribute::EType::ePatch node attribute type.
    virtual FbxNodeAttribute::EType GetAttributeType() const;

    //! Resets the patch to its default values.
    void Reset();

    /**
      * \name Patch Properties
      */
    //@{

        /** Sets the surface mode.
          * \param pMode Surface mode identifier (see Class FbxGeometry).
          */
        void SetSurfaceMode(FbxGeometry::ESurfaceMode pMode);

        /** Returns the surface mode.
          * \return The current surface mode identifier.
          */
        inline FbxGeometry::ESurfaceMode GetSurfaceMode() const {return mSurfaceMode;}

        /** \enum EType Patch types.
          * - \e eBezier
          * - \e eBezierQuadric
          * - \e eCardinal
          * - \e eBSpline
          * - \e eLinear
          */
        enum EType
        {
            eBezier,
            eBezierQuadric,
            eCardinal,
            eBSpline,
            eLinear
        };

        /** Allocates memory space for the control points array.
          * \param pUCount      Number of U-dimension control points.
          * \param pUType       U-dimension patch type. 
          * \param pVCount      Number of V-dimension control points.
          * \param pVType       V-dimension patch type. 
          */
        void InitControlPoints(int pUCount, EType pUType, int pVCount, EType pVType);

        /** Returns the number of control points in the U-dimension.
          * \return             The number of control points in the U-dimension.
          */
        inline int GetUCount() const {return mUCount;}

        /** Returns the number of control points in the V-dimension.
          * \return             The number of control points in the V-dimension.
          */
        inline int GetVCount() const {return mVCount;}

        /** Returns the U-dimension patch type.
          * \return             Patch type identifier in the U-dimension.
          */
        inline EType GetPatchUType() const {return mUType;}

        /** Returns the V-dimension patch type.
          * \return             Patch type identifier in the V-dimension.
          */
        inline EType GetPatchVType () const {return mVType;}

        /** Sets the patch step.
          * The step is the number of divisions between adjacent control points.
          * \param pUStep       Steps in U-dimension.
          * \param pVStep       Steps in V-dimension.
          */
        void SetStep(int pUStep, int pVStep);

        /** Returns the number of divisions between adjacent control points in the U-dimension.
          * \return             Step value in the U-dimension.
          */
        inline int GetUStep() const {return mUStep;}

        /** Returns the number of divisions between adjacent control points in the V-dimension.
          * \return             Step value in the V-dimension.
          */
        inline int GetVStep() const {return mVStep;}

        /** Sets closed flags.
          * \param pU           Set to \c true if the patch is closed in U dimension.
          * \param pV           Set to \c true if the patch is closed in V dimension.
          */
        void SetClosed(bool pU, bool pV);

        /** Returns state of the U closed flag.
          * \return             \c True if the patch is closed in U dimension.
          */
        inline bool GetUClosed() const {return mUClosed;}

        /** Returns state of the V closed flag.
          * \return             \c True if the patch is closed in V dimension.
          */
        inline bool GetVClosed() const {return mVClosed;}

        /** Sets U-capped flags.
          * \param pUBottom     Set to \c true if the patch is capped at the bottom in the U-dimension.
          * \param pUTop \c     Set to \c true if the patch is capped on the top in the U-dimension.
          * \remarks            Capping options are saved but not loaded by Motionbuilder because they
          *                     are computed from the patch topography.
          */
        void SetUCapped(bool pUBottom, bool pUTop);

        /** Returns state of the bottom U-capped flag.
          * \return             \c True if the patch is capped at the bottom in the U-dimension.
          */
        inline bool GetUCappedBottom() const {return mUCappedBottom;}

        /** Returns state of the top U-capped flag.
          * \return             \c True if the patch is capped on the top in the U-dimension.
          */
        inline bool GetUCappedTop() const {return mUCappedTop;}

        /** Sets V-capped flags.
          * \param pVBottom     Sets to \c true if the patch is capped at the bottom in the V-dimension.
          * \param pVTop        Sets to \c true if the patch is capped on the top in the V-dimension.
          * \remarks            Capping options are saved but not loaded by Motionbuilder because they
          *                     are computed from the patch topography.
          */
        void SetVCapped(bool pVBottom, bool pVTop);

        /** Returns state of the bottom V-capped flag.
          * \return     \c True if the patch is capped at the bottom.
          */
        inline bool GetVCappedBottom() const {return mVCappedBottom;}

        /** Returns state of the top V-capped flag.
          * \return     \c True if the patch is capped on the top.
          */
        inline bool GetVCappedTop() const {return mVCappedTop;}

    //@}

    /**
      * \name Off-loading Serialization section
      */
    //@{
        /** Writes the content of the patch to the given stream.
          * \param pStream  The destination stream.
          * \return         \c True if the content is successfully processed by the receiving stream.
          *                 If it is not successful, returns \c false.
          */
        virtual bool ContentWriteTo(FbxStream& pStream) const;

        /** Reads the content of the patch from the given stream.
          * \param pStream  The source stream.
          * \return         \c True if the patch completes with the data received from the stream successfully. 
          *                 If it is not successful, returns \c false.
          */
        virtual bool ContentReadFrom(const FbxStream& pStream);
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);
    virtual void InitControlPoints(int pCount)                                  { ParentClass::InitControlPoints(pCount); }
    virtual void SetControlPointAt(const FbxVector4 &pCtrlPoint , int pIndex)   { ParentClass::SetControlPointAt(pCtrlPoint, pIndex); }    

protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual void Destruct(bool pRecursive);

    EType mUType, mVType;
    int mUCount, mVCount;
    int mUStep, mVStep;
    bool mUClosed, mVClosed;
    bool mUCappedBottom, mUCappedTop;
    bool mVCappedBottom, mVCappedTop;

    FbxGeometry::ESurfaceMode mSurfaceMode;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_PATCH_H_ */
