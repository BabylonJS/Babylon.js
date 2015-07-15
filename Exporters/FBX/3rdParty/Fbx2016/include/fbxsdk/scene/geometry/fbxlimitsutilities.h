/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxlimitsutilities.h
#ifndef _FBXSDK_SCENE_GEOMETRY_LIMIT_UTILS_H_
#define _FBXSDK_SCENE_GEOMETRY_LIMIT_UTILS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/math/fbxvector4.h>
#include <fbxsdk/core/math/fbxtransforms.h>
#include <fbxsdk/scene/geometry/fbxnode.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief This class represent a utility of limits for transforms.
* \nosubgrouping
*/
class FBXSDK_DLL FbxLimitsUtilities
{
public:
    /** \enum EType    Limit Type.
    * - \e eTranslation               Translation type
    * - \e eRotation               Rotation type
    * - \e eScaling               Scale type
    */
	enum EType
	{
		eTranslation,
		eRotation,
		eScaling
	};

    /** \enum ERotationType            Rotation type.
    * - \e eQuaternion   Quaternion rotation type
    * - \e eEuler        Euler rotation type
    */
	enum ERotationType
	{ 
		eQuaternion, 
		eEuler
	};

    /** \enum ERotationClampType              Rotation clamp type.
    * - \e eRectangular   Rectangular clamp type
    * - \e eEllipsoid      Ellipsoid clamp type
    */
	enum ERotationClampType
	{ 
		eRectangular, 
		eEllipsoid
	};


	FbxLimitsUtilities(FbxNode* pNode);

    /**
      * \name Getter/Setter functions
      */
    //@{
		void SetAuto(EType pType, bool pAuto);
		bool GetAuto(EType pType) const;

		void SetEnable(EType pType, bool pEnable);
		bool GetEnable(EType pType) const;

		void SetDefault(EType pType, FbxVector4 pDefault);
		FbxVector4 GetDefault(EType pType) const;

		void SetMin(EType pType, FbxVector4 pMin);
		FbxVector4 GetMin(EType pType) const;

		void SetMax(EType pType, FbxVector4 pMax);
		FbxVector4 GetMax(EType pType) const;

		void SetRotationType(ERotationType pType);
		ERotationType GetRotationType() const;

		ERotationClampType GetRotationClampType() const;

		void SetRotationAxis(FbxVector4 pRotationAxis);
		FbxVector4 GetRotationAxis() const;

		void SetAxisLength(double pLength);
		double GetAxisLength() const;

		void UpdateAutomatic(FbxNode* pNode);
		FbxVector4 GetEndPointTranslation(FbxNode* pNode) const;
		FbxVector4 GetEndSite(FbxNode* pNode) const;
    //@}

	FbxNode*	mNode;
	double		mAxisLength; 
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_LIMIT_UTILS_H_ */
