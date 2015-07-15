/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxtransforms.h
#ifndef _FBXSDK_CORE_MATH_TRANSFORMS_H_
#define _FBXSDK_CORE_MATH_TRANSFORMS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/math/fbxmath.h>
#include <fbxsdk/core/math/fbxquaternion.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** FbxLimits defines a limit range for one transform component, either translation, rotation or scaling.
  * One transform component limit contains two part: a min value and a max value limit, which means
  * that each value of the corresponding transform component cannot go beyond the range set by the
  * min and max values. Although the members are identified as X, Y and Z (the W component is ignored)
  * at this level, they are unitless values and will only have meaning within the context they are queried.
  *
  * For each limit, there is one flag to indicate if the limit is active or not. Before accessing the 
  * limit info, the caller need to query the flag first to make sure that the retrieved values will be
  * meaningful.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLimits
{
public:
	//! Constructor
	FbxLimits();

	//! Assignment Operator
	FbxLimits& operator=(const FbxLimits& pLimits);

	/** Retrieve the active state of this limit.
	  * \return True if the limit is active.
	  */
	bool GetActive() const;

	/** Set the active state of this limit.
	  * \param pActive If true, this limit will become globally active.
	  */
	void SetActive(const bool pActive);

	/** Get the active state of the minimum X component.
	  * \return True if the X component minimum limit is active.
	  */
	bool GetMinXActive() const;

	/** Get the active state of the minimum Y component.
	  * \return True if the Y component minimum limit is active.
	  */
	bool GetMinYActive() const;

	/** Get the active state of the minimum Z component.
	  * \return True if the Z component minimum limit is active.
	  */
	bool GetMinZActive() const;

	/** Get the active states of the three components of the minimum limit.
	  * \param pXActive \c True if the X component minimum limit is active.
	  * \param pYActive \c True if the Y component minimum limit is active.
	  * \param pZActive \c True if the Z component minimum limit is active.
	  */
	void GetMinActive(bool& pXActive, bool& pYActive, bool& pZActive) const;

	/** Get the minimum limits.
	  * \return The current X, Y and Z values for the minimum limits.
	  */
	FbxDouble3 GetMin() const;

	/** Set the active state of the minimum X component.
	  * \param pActive If true, the X component minimum limit will be active.
	  */
	void SetMinXActive(bool pActive);

	/** Set the active state of the minimum Y component.
	  * \param pActive If true, the Y component minimum limit will be active.
	  */
	void SetMinYActive(bool pActive);

	/** Set the active state of the minimum Z component.
	  * \param pActive If true, the Z component minimum limit will be active.
	  */
	void SetMinZActive(bool pActive);

	/** Set the active states of the three components of the minimum limits.
	  * \param pXActive If true, the X component minimum limit will be active.
	  * \param pYActive If true, the Y component minimum limit will be active.
	  * \param pZActive If true, the Z component minimum limit will be active.
	  */
	void SetMinActive(bool pXActive, bool pYActive, bool pZActive);

	/** Set the minimum limits.
	  * \param pMin The X, Y and Z values for the minimum limits.
	  */
	void SetMin(const FbxDouble3& pMin);

	/** Get the active state of the maximum X component.
	  * \return True if the X component maximum limit is active.
	  */
	bool GetMaxXActive() const;

	/** Get the active state of the maximum Y component.
	  * \return True if the Y component maximum limit is active.
	  */
	bool GetMaxYActive() const;

	/** Get the active state of the maximum Z component.
	  * \return True if the Z component maximum limit is active.
	  */
	bool GetMaxZActive() const;

	/** Get the active states of the three components of the maximum limit.
	  * \param pXActive \c True if the X component maximum limit is active.
	  * \param pYActive \c True if the Y component maximum limit is active.
	  * \param pZActive \c True if the Z component maximum limit is active.
	  */
	void GetMaxActive(bool& pXActive, bool& pYActive, bool& pZActive) const;

	/** Get the maximum limits.
	  * \return The current X, Y and Z values for the maximum limits.
	  */
	FbxDouble3 GetMax() const;

	/** Set the active state of the maximum X component.
	  * \param pActive If true, the X component maximum limit will be active.
	  */
	void SetMaxXActive(bool pActive);

	/** Set the active state of the maximum Y component.
	  * \param pActive If true, the Y component maximum limit will be active.
	  */
	void SetMaxYActive(bool pActive);

	/** Set the active state of the maximum Z component.
	  * \param pActive If true, the Z component maximum limit will be active.
	  */
	void SetMaxZActive(bool pActive);

	/** Set the active states of the three components of the maximum limits.
	  * \param pXActive If true, the X component maximum limit will be active.
	  * \param pYActive If true, the Y component maximum limit will be active.
	  * \param pZActive If true, the Z component maximum limit will be active.
	  */
	void SetMaxActive(bool pXActive, bool pYActive, bool pZActive);

	/** Set the maximum limits.
	  * \param pMax The X, Y and Z values for the maximum limits.
	  */
	void SetMax(const FbxDouble3& pMax);

	/** Find if any of the minimum or maximum active state are set.
	  * \return If any component of the minimum or maximum active state are set, true is returned.
	  * \remarks The global active state will not count when resolving this.
	  */
	bool GetAnyMinMaxActive() const;
	
	/** Apply the active limits to the components of the vector provided.
	  * \return The new vector clamped by active limits.
	  */
	FbxDouble3 Apply(const FbxDouble3& pVector);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
	enum EMask {eActive=1<<0, eMinX=1<<1, eMinY=1<<2, eMinZ=1<<3, eMaxX=1<<4, eMaxY=1<<5, eMaxZ=1<<6, eAll=eMinX|eMinY|eMinZ|eMaxX|eMaxY|eMaxZ};

	FbxUInt8	mMask;
	FbxDouble3	mMin;
	FbxDouble3	mMax;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

class FBXSDK_DLL FbxRotationOrder
{
public:	
	FbxRotationOrder(FbxEuler::EOrder pOrder=FbxEuler::eOrderXYZ);

	FbxEuler::EOrder	GetOrder() const;
	void				SetOrder(FbxEuler::EOrder pOrder);
	void				V2M(FbxAMatrix& pRM, const FbxVector4& pV);
	void				M2V(FbxVector4& pV, const FbxAMatrix& pRM);
	bool				V2VRef(FbxVector4& pVOut, const FbxVector4& pVIn, const FbxVector4& pVRef);

private:
    FbxEuler::EOrder mOrder;
};

/** Handle transform behaviors such as pivots, limits and offets, etc.
  */
class FBXSDK_DLL FbxTransform
{
public:
	enum EInheritType {eInheritRrSs, eInheritRSrs, eInheritRrs};

	FbxTransform();

	EInheritType		GetInheritType() const;
	void				SetInheritType(EInheritType pType);
	FbxLimits&			GetTranslationLimits();
	FbxLimits&			GetRotationLimits();
	FbxLimits&			GetScalingLimits();
	FbxRotationOrder&	GetRotationOrder();
	bool				HasROffset() const;
	bool				HasRPivot() const;
	bool				HasSOffset() const;
	bool				HasSPivot() const;
	bool				HasPreRM() const;
	bool				HasPostRM() const;
	void				SetROffset(const FbxVector4& pROffset);
	void				SetRPivot(const FbxVector4& pRPivot);
	void				SetSOffset(const FbxVector4& pSOffset);
	void				SetSPivot(const FbxVector4& pSPivot);
	void				SetPreRM(const FbxVector4& pPreR);
	void				SetPostRM(const FbxVector4& pPostR);
	bool				GetRotationSpaceForLimitOnly() const;
	void				SetRotationSpaceForLimitOnly(bool pRotationSpaceForLimitOnly);

	void				DoF2LT(FbxVector4& pLT, const FbxVector4& pDoF, const FbxAMatrix& pLRM, const FbxAMatrix& pLSM);
	void				LT2DoF(FbxVector4& pDoF, const FbxVector4& pLT, const FbxAMatrix& pLRM, const FbxAMatrix& pLSM);
	void				DoF2LRM(FbxAMatrix& pLRM, const FbxVector4& pRDoF, bool pForLimit=false);
	void				LRM2DoF(FbxVector4& pRDoF, const FbxAMatrix& pLRM, bool pForLimit=false);
	void				LSM2GSM(FbxAMatrix& pGSM, const FbxAMatrix& pPGSM, const FbxAMatrix& pLSM, const FbxAMatrix& pLRM, const FbxVector4& pPLS);
	void				GTRSM2GX(FbxAMatrix& pGX, const FbxVector4& pGT, const FbxAMatrix& pGRM, const FbxAMatrix& pGSM);

private:
	void				SumPivots(FbxVector4& pSum, const FbxAMatrix& pLRM, const FbxAMatrix& pLSM);

	class RotationSpace
	{
	public:
		enum EMask {eHasNothing=0, eHasPreRotM=1<<0, eHasPostRotM=1<<1};

		RotationSpace();

		bool				HasPreRM() const;
		bool				HasPostRM() const;
		void				GetPreRM(FbxAMatrix& pPreRM) const;
		void				GetPostRM(FbxAMatrix& pPostRM) const;
		void				SetPreRM(const FbxVector4& pPreR);
		void				SetPostRM(const FbxVector4& pPostR);
		void				DoF2LRM(FbxAMatrix& pLRM, const FbxVector4& pRDoF);
		void				LRM2DoF(FbxVector4& pRDoF, const FbxAMatrix& pLRM);

		FbxUInt8			mMask;
		FbxAMatrix			mPreRM;
		FbxAMatrix			mPostRM;
		FbxRotationOrder	mRotationOrder;
	};

    enum EMask {eHasNothing=0, eHasRotOffset=1<<0, eHasRotPivot=1<<1, eHasScaleOffset=1<<2, eHasScalePivot=1<<3};

	FbxUInt8		mMask;
	EInheritType	mInheritType;	
	FbxVector4		mROffset;
	FbxVector4		mRPivot;
	FbxVector4		mSOffset;
	FbxVector4		mSPivot;
	FbxLimits		mTranslationLimits;
	FbxLimits		mRotationLimits;
	FbxLimits		mScalingLimits;
	bool			mRotationSpaceForLimitOnly;
	RotationSpace	mRotationSpace;
};

FBXSDK_DLL bool FbxGetContinuousRotation(FbxVector4& pRes, const FbxVector4& pRot, const FbxVector4& pRef, const int* pOrder);
FBXSDK_DLL void FbxGetContinuousRotation(FbxVector4& pRes, const FbxVector4& pRot, const FbxVector4& pRef);

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_MATH_TRANSFORMS_H_ */
