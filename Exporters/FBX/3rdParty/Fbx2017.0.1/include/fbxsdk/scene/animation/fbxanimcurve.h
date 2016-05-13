/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxanimcurve.h
#ifndef _FBXSDK_SCENE_ANIMATION_CURVE_H_
#define _FBXSDK_SCENE_ANIMATION_CURVE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/scene/animation/fbxanimcurvebase.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class KFCurve;

/** Definitions used for the FBX animation curves and keys. */
class FBXSDK_DLL FbxAnimCurveDef
{
public:
	static const float sDEFAULT_WEIGHT;
	static const float sMIN_WEIGHT;
	static const float sMAX_WEIGHT;
	static const float sDEFAULT_VELOCITY;

	//! Key tangent mode for cubic interpolation.
	enum ETangentMode
	{
		eTangentAuto = 0x00000100,													//!< Auto key (spline cardinal).
		eTangentTCB = 0x00000200,													//!< Spline TCB (Tension, Continuity, Bias)
		eTangentUser = 0x00000400,													//!< Next slope at the left equal to slope at the right.
		eTangentGenericBreak = 0x00000800,											//!< Independent left and right slopes.
		eTangentBreak = eTangentGenericBreak|eTangentUser,							//!< Independent left and right slopes, with next slope at the left equal to slope at the right.
		eTangentAutoBreak = eTangentGenericBreak|eTangentAuto,						//!< Independent left and right slopes, with auto key.
		eTangentGenericClamp = 0x00001000,											//!< Clamp: key should be flat if next or previous key has the same value (overrides tangent mode).
		eTangentGenericTimeIndependent = 0x00002000,								//!< Time independent tangent (overrides tangent mode).
		eTangentGenericClampProgressive = 0x00004000|eTangentGenericTimeIndependent	//!< Clamp progressive: key should be flat if tangent control point is outside [next-previous key] range (overrides tangent mode).
	};

	//! Key interpolation type.
	enum EInterpolationType
	{
		eInterpolationConstant = 0x00000002,	//!< Constant value until next key.
		eInterpolationLinear = 0x00000004,		//!< Linear progression to next key.
		eInterpolationCubic = 0x00000008		//!< Cubic progression to next key.
	};

	//! Weighted mode.
	enum EWeightedMode
	{
		eWeightedNone = 0x00000000,						//!< Tangent has default weights of 0.333; we define this state as not weighted.
		eWeightedRight = 0x01000000,					//!< Right tangent is weighted.
		eWeightedNextLeft = 0x02000000,					//!< Left tangent is weighted.
		eWeightedAll = eWeightedRight|eWeightedNextLeft	//!< Both left and right tangents are weighted.
	};

	//! Key constant mode.
	enum EConstantMode
	{
		eConstantStandard = 0x00000000,	//!< Curve value is constant between this key and the next
		eConstantNext = 0x00000100		//!< Curve value is constant, with next key's value
	};

	//! Velocity mode. Velocity settings speed up or slow down animation on either side of a key without changing the trajectory of the animation. Unlike Auto and Weight settings, Velocity changes the animation in time, but not in space.
	enum EVelocityMode
	{
		eVelocityNone = 0x00000000,						//!< No velocity (default).
		eVelocityRight = 0x10000000,					//!< Right tangent has velocity.
		eVelocityNextLeft = 0x20000000,					//!< Left tangent has velocity.
		eVelocityAll = eVelocityRight|eVelocityNextLeft	//!< Both left and right tangents have velocity.
	};

	//! Tangent visibility.
	enum ETangentVisibility
	{
		eTangentShowNone = 0x00000000,							//!< No tangent is visible.
		eTangentShowLeft = 0x00100000,							//!< Left tangent is visible.
		eTangentShowRight = 0x00200000,							//!< Right tangent is visible.
		eTangentShowBoth = eTangentShowLeft|eTangentShowRight	//!< Both left and right tangents are visible.
	};

	//! FbxAnimCurveKey data indices for cubic interpolation tangent information.
	enum EDataIndex
	{
		eRightSlope = 0,		//!< Index of the right derivative, User and Break tangent mode (data are float).
		eNextLeftSlope = 1,		//!< Index of the left derivative for the next key, User and Break tangent mode.
		eWeights = 2,			//!< Start index of weight values, User and Break tangent break mode (data are FbxInt16 tokens from weight and converted to float).
		eRightWeight = 2,		//!< Index of weight on right tangent, User and Break tangent break mode.
		eNextLeftWeight = 3,	//!< Index of weight on next key's left tangent, User and Break tangent break mode.
		eVelocity = 4,			//!< Start index of velocity values, Velocity mode
		eRightVelocity = 4,		//!< Index of velocity on right tangent, Velocity mode
		eNextLeftVelocity = 5,	//!< Index of velocity on next key's left tangent, Velocity mode
		eTCBTension = 0,		//!< Index of Tension, TCB tangent mode (data are floats).
		eTCBContinuity = 1,		//!< Index of Continuity, TCB tangent mode.
		eTCBBias = 2			//!< Index of Bias, TCB tangent mode.
	};
};

struct FBXSDK_DLL FbxAnimCurveTangentInfo
{
	inline FbxAnimCurveTangentInfo()
	{
		mDerivative = 0;
		mWeight = FbxAnimCurveDef::sDEFAULT_WEIGHT;
		mWeighted = false;
		mVelocity = FbxAnimCurveDef::sDEFAULT_VELOCITY;
		mHasVelocity = false;
		mAuto = 0;
	}

	float	mDerivative;
	float	mWeight;
	float	mVelocity;
	float	mAuto;
	bool	mWeighted;
	bool	mHasVelocity;
};

/** This is the interface for implementation of animation key objects.
  * \nosubgrouping
  *
  * \remarks Users should not use this class directly, but always use FbxAnimCurveKey. 
  * A FbxAnimCurveKey has a FbxAnimCurveKey_Impl.
  * But FbxAnimCurveKey_Impl is just an implementation interface,
  */
class FBXSDK_DLL FbxAnimCurveKey_Impl
{
public:
    /** Destructor.
      */
    virtual ~FbxAnimCurveKey_Impl() {};

	/** Assignment operator.
	  */
    virtual FbxAnimCurveKey_Impl& operator=(const FbxAnimCurveKey_Impl& pFKey) = 0;

    /** Set time and value of key.
      * \param pTime New time of this key.
      * \param pValue New value of this key.
      */
	virtual void Set(FbxTime pTime, float pValue) = 0;

    /**	Set a key with cubic interpolation, TCB tangent mode. 	
	* The key is modified according to the other parameters. 
	* The TCB mode controls the tension, continuity,
	* and bias of the curve.
    *	\param pTime	Key time.
    *	\param pValue	Key value.
    *	\param pData0	Tension. Controls the amount of curvature in the animation curve. The higher the tension is, the more linear
	* the curve looks. When the tension is low, the curve looks rounder or wider. 
    *	\param pData1	Continuity. Controls the smoothness or singularity of the curve on the key. 
    *	\param pData2	Bias. Controls if the effect of tension and continuity affect the curve before or after the key.
    */
	virtual void SetTCB(FbxTime pTime, float pValue, float pData0 = 0.0f, float pData1 = 0.0f, float pData2 = 0.0f) = 0;

    /** Get the key value.
    *	\return The value of the key.
    */
    virtual float GetValue() const = 0;

    /** Set the key value.
    * \param pValue The value to set.
    */ 
	virtual void SetValue(float pValue) = 0;

    /** Get key's interpolation type.
    *   \return   Interpolation type of the queried key.
    */
    virtual FbxAnimCurveDef::EInterpolationType GetInterpolation() const = 0;

    /** Set key's interpolation type.
    *	\param pInterpolation Interpolation type of the key.
    */
	virtual void SetInterpolation (FbxAnimCurveDef::EInterpolationType pInterpolation) = 0;

	/** Get key's tangent mode.
    *   \param pIncludeOverrides Include override flags: Break, Clamp, Time-Independent.
    *	\return Tangent mode of the key.
	*	\remarks This method is meaningful for cubic interpolation only.
	*	Using this method for non cubic interpolated key will return unpredictable value.
    */
    virtual FbxAnimCurveDef::ETangentMode GetTangentMode(bool pIncludeOverrides = false) const = 0;

	/** Set tangent mode.
	  * \param pTangentMode Tangent mode to set.
	  */
	virtual void SetTangentMode (FbxAnimCurveDef::ETangentMode pTangentMode) = 0;

	/** Get key's tangent weight mode.
	*	\return Tangent weight mode of the key.
	*	\remarks This method is meaningful for cubic interpolation only.
	*/
	virtual FbxAnimCurveDef::EWeightedMode GetTangentWeightMode() const = 0;

	/** Set key's tangent weight mode as double value (cubic interpolation, non TCB tangent mode).
    *	\param pTangentWeightMode	Weight mode.
	*	\param pMask				Used to select the affected tangents.
	*	\remarks This method is meaningful for cubic interpolation only.
	*   The pMask will be used to cancel out the current tangent weight mode first, and then be used to
	*   define which tangent to select to affect.
	*   
	*   Sample01:
	*   \code
	*   FbxAnimCurveKey* lAnimCurveKey = FbxSdkNew<FbxAnimCurveKey>();
	*   lAnimCurveKey->SetTangentWeightMode(FbxAnimCurveDef::eWeightedNextLeft);
	*   lAnimCurveKey->SetTangentWeightMode(FbxAnimCurveDef::eWeightedRight, FbxAnimCurveDef::eWeightedRight);
    *   \endcode
	*   pMask is eWeightedRight, it will first be used to cancel out the current tangent weight mode eWeightedNextLeft,
	*   since they are not the same, it fails to cancel it out.
	*   Then the mask eWeightedRight will be used to define which tangent should be affected, 
	*   since it is the same as pTangentWeightMode (eWeightedRight), so the eWeightedRight should be affected.
	*   In total, after above calls, both eWeightedNextLeft and eWeightedRight of this key are affected, so 
	*   lAnimCurveKey->GetTangentWeightMode() will be FbxAnimCurveDef::eWeightedAll.
	* 
	*   Sample02:
	*   \code
	*   FbxAnimCurveKey* lAnimCurveKey = FbxSdkNew<FbxAnimCurveKey>();
	*   lAnimCurveKey->SetTangentWeightMode(FbxAnimCurveDef::eWeightedAll);
	*   lAnimCurveKey->SetTangentWeightMode(FbxAnimCurveDef::eWeightedRight, FbxAnimCurveDef::eWeightedNextLeft);
	*   \endcode
	*   pMask is eWeightedNextLeft, it will first be used to cancel out the current tangent weight mode eWeightedAll,
	*   it will cancel out affect on eWeightedNextLeft, but leave affect on eWeightedRight.
	*   Then the mask eWeightedNextLeft will be used to define which tangent should be affected, 
	*   since it is not the same as pTangentWeightMode (eWeightedRight), so the pMask won't affect anything in this step.
	*   In total, after above calls, only eWeightedRight of this key is still affected, so 
	* 	lAnimCurveKey->GetTangentWeightMode() will be FbxAnimCurveDef::eWeightedRight.
	*/
	virtual void SetTangentWeightMode(FbxAnimCurveDef::EWeightedMode pTangentWeightMode, FbxAnimCurveDef::EWeightedMode pMask = FbxAnimCurveDef::eWeightedAll ) = 0;

    /** Adjust the actual tangent of the key so that the tangent control point (tangent extremity) 
	*   stays closer to where it should be. This is required because the weight value gets imprecise
	*   when it is small (it is stored as a fixed point value). This method must be called when 
	*   setting the weight coming from a source where the precision is the same. It must be called 
	*   after the tangent value has been set. 
    *   \remark Do not use this call repetitively (from an interactive editor for example) because 
	*   this function will create imprecision on the tangent value.
    *   \param pIndex FbxAnimCurveDef::EDataIndex
    *   \param pWeight New tangent weight value.
    */
    virtual void SetTangentWeightAndAdjustTangent(FbxAnimCurveDef::EDataIndex pIndex, double pWeight ) = 0;

	/** Get key's tangent velocity mode.
	*	\return Tangent velocity mode of the key.
    *	\remarks This method is meaningful for cubic interpolation only.
	*/
	virtual FbxAnimCurveDef::EVelocityMode GetTangentVelocityMode() const = 0;

	/** Set key's tangent velocity mode as double value (cubic interpolation, non TCB tangent mode).
    *	\param pTangentVelocityMode	Velocity mode. 
	*	\param pMask				Used to select the affected tangents
	*	\remarks This method is meaningful for cubic interpolation only.
	*   The pMask will be used to cancel out the current tangent velocity mode first, and then be used to
	*   define which tangent to select to affect.
	*   
	*   \see The documentation of SetTangentWeightMode for more details and samples about how the pMask works.
	*/
	virtual void SetTangentVelocityMode(FbxAnimCurveDef::EVelocityMode pTangentVelocityMode, FbxAnimCurveDef::EVelocityMode pMask = FbxAnimCurveDef::eVelocityAll ) = 0;

	/** Get key constant mode.
	*	\return Key constant mode.
	*	\remarks This method is meaningful for constant interpolation only.
	*			 Using this method for non constant interpolated key will return unpredicted value.
    */
	virtual FbxAnimCurveDef::EConstantMode GetConstantMode() const = 0;

	/** Set key's constant mode.
	*   \param pMode Constant mode to set.
	*	\remarks This method is meaningful for constant interpolation only.
	*/
	virtual void SetConstantMode(FbxAnimCurveDef::EConstantMode pMode) = 0;

	/** Get the value of specified data of the key.
	* \param pIndex Data index to specify which data to get value, the index is dependent on the key tangent mode.
	* \return The value of the specified data.
	*
	* \code
	* FbxAnimCurveKey* lKey; // we suppose this is a valid pointer
	* if(lKey->GetTangentMode() == FbxAnimCurveDef::eTangentTCB)
	* {
	*     lKey->GetDataFloat(FbxAnimCurveDef::eTCBTension);
	*     lKey->GetDataFloat(FbxAnimCurveDef::eTCBContinuity);
	*     lKey->GetDataFloat(FbxAnimCurveDef::eTCBBias);
	* }
	* \endcode	
	*/
	virtual float GetDataFloat(FbxAnimCurveDef::EDataIndex pIndex) const = 0;

	/** Set the value of specified data of the key.
	* \param pIndex Data index to specify which data to get value, the index is dependent on the key tangent mode.
	* \param pValue The data value to set.
	* 
	* \code
	* FbxAnimCurveKey* lKey; // we suppose this is a valid pointer
	* lKey->SetInterpolation(FbxAnimCurveDef::eInterpolationCubic);
	* lKey->SetTangentMode(FbxAnimCurveDef::eTangentAuto);
	* lKey->SetDataFloat(FbxAnimCurveDef::eRightSlope, 0.0);
	* \endcode
	*/
	virtual void SetDataFloat(FbxAnimCurveDef::EDataIndex pIndex, float pValue) = 0;

	/** Set tangent visibility mode. This would indicate what part of the tangent is visible in a graphical interface.
    *	\param pVisibility	Tangent visibility mode.
	*	\remarks This method is meaningful for cubic interpolation only.
	*/
	virtual void	SetTangentVisibility (FbxAnimCurveDef::ETangentVisibility pVisibility) = 0;	

	/** Return tangent visibility mode.
    *	\return Tangent visibility mode.
	*	\remarks This method is meaningful for cubic interpolation only.
	*/
	virtual FbxAnimCurveDef::ETangentVisibility GetTangentVisibility () const = 0;

	/** Turn on or turn off the tangent break. 
	* When this flag is on (FbxAnimCurveDef::eTANGEAT_BREAK will be set), the key's left and right slopes are independent.
	* When this flag is off, the key's left and right slope are equal.
    * \param pVal Break flag (\c true or \c false).
	* \remarks This method is meaningful for User (FbxAnimCurveDef::eTangentUser) and Auto (FbxAnimCurveDef::eTangentAuto) tangent modes only.
	*/
	virtual void SetBreak(bool pVal) = 0; 

	/** Get if the tangent has a break. 
	* When this flag is set (FbxAnimCurveDef::eTANGEAT_BREAK), the key's left and right slopes are independent.
	* When this flag is off, the key's left and right slope are equal.
	* \return Break flag (\c true or \c false).
	* \remarks This method is meaningful for User (FbxAnimCurveDef::eTangentUser) and Auto (FbxAnimCurveDef::eTangentAuto) tangent modes only.
	*/
	virtual bool GetBreak() const = 0; 
};

/** This is the interface for the FBX animation curve keys.
  * A key is defined by a time and a value. It also has tangents that control how the animation curve enters and exits the key.
  * \nosubgrouping
  *
  *\remarks This class is now the main animation key object of the SDK,
  * Users should always use this class to handle animation curve key.
  * This class has a FbxAnimCurveKey_Impl as its implementation interface, 
  * Default constructor does not initialize data members. 
  * If an instance has to be initialized, use function FbxAnimCurveKey::Set().
  */
class FBXSDK_DLL FbxAnimCurveKey : public FbxAnimCurveKeyBase
{
public:
	/** Constructor with no argument
	  */
	FbxAnimCurveKey() : FbxAnimCurveKeyBase()
    {
		FBX_ASSERT(mAllocatorFct != NULL);
		mImpl = (*mAllocatorFct)();
    }

	/** Constructor with time.
      * \param pTime The time of key.
      */
    FbxAnimCurveKey(FbxTime pTime) : FbxAnimCurveKeyBase()
    {
		FBX_ASSERT(mAllocatorFct != NULL);
		mImpl = (*mAllocatorFct)();
        SetTime(pTime);
    }

    /** Constructor with time and value.
      * \param pTime The time of key.
      * \param pVal The value of key.
      */
    FbxAnimCurveKey(FbxTime pTime, float pVal) : FbxAnimCurveKeyBase()
    {
		FBX_ASSERT(mAllocatorFct != NULL);
		mImpl = (*mAllocatorFct)();
        Set(pTime, pVal);
    }

	/** Copy constructor
	  */
	FbxAnimCurveKey(FbxAnimCurveKey const& pFKey) : FbxAnimCurveKeyBase()
    {
		FBX_ASSERT(mCopyAllocatorFct != NULL);
		SetTime(pFKey.GetTime());
		mImpl = mCopyAllocatorFct(pFKey.GetImpl());
    }

	/** Destructor
	  */
	~FbxAnimCurveKey()
    {
		FBX_ASSERT(mDeallocatorFct != NULL);
		(*mDeallocatorFct)(mImpl);
    }

    /** Assignment operator
      */
    FbxAnimCurveKey& operator=(const FbxAnimCurveKey& pFKey)
	{
		FBX_ASSERT(mImpl);
		if (mImpl)
		{
			*mImpl = *(pFKey.GetImpl());
		}
		SetTime(pFKey.GetTime());
		return *this;
	}

    /** Get time value.
    * \return Time value.
    */
    FbxTime GetTime() const
	{
		return FbxAnimCurveKeyBase::GetTime();
	}

    /** Set time value.
    * \param pTime Time value to set.
    */
    void SetTime(const FbxTime& pTime)
	{
		FbxAnimCurveKeyBase::SetTime(pTime);
	}

    /** Set time and value of key.
      * \param pTime New time of this key.
      * \param pValue New value of this key.
      */
	void Set(FbxTime pTime, float pValue)
	{
		FbxAnimCurveKeyBase::SetTime(pTime);
		mImpl->Set(pTime, pValue);
	}

    /**	Set a key with cubic interpolation, TCB tangent mode. 	
	* The key is modified according to the other parameters. 
	* The TCB mode controls the tension, continuity,
	* and bias of the curve.
    *	\param pTime	Key time.
    *	\param pValue	Key value.
    *	\param pData0	Tension. Controls the amount of curvature in the animation curve. The higher the tension is, the more linear
	* the curve looks. When the tension is low, the curve looks rounder or wider. 
    *	\param pData1	Continuity. Controls the smoothness or singularity of the curve on the key. 
    *	\param pData2	Bias. Controls if the effect of tension and continuity affect the curve before or after the key.
    */
	void SetTCB(FbxTime pTime, float pValue, float pData0 = 0.0f, float pData1 = 0.0f, float pData2 = 0.0f)
	{
		FbxAnimCurveKeyBase::SetTime(pTime);
		mImpl->SetTCB(pTime, pValue, pData0, pData1, pData2);
	}

    /** Get the key value.
	* \return The value of the key.
    */
    float GetValue() const
	{
		return mImpl->GetValue();
	}

    /** Set the key value.
    * \param pValue The value to set.
    */ 
	void SetValue(float pValue)
	{
		mImpl->SetValue(pValue);
	}


	/** Get key's interpolation type.
    *   \return   Interpolation type of the queried key.
    */
    FbxAnimCurveDef::EInterpolationType GetInterpolation()
	{
		return mImpl->GetInterpolation();
	}

    /** Set key's interpolation type.
    *	\param pInterpolation Interpolation type of the key.
    */
	void SetInterpolation (FbxAnimCurveDef::EInterpolationType pInterpolation)
	{
		mImpl->SetInterpolation(pInterpolation);
	}

	/** Get key's tangent mode.
	*   \param pIncludeOverrides Include override flags: Break, Clamp, Time-Independent.
	*	\return Tangent mode of the key.
	*	\remarks This method is meaningful for cubic interpolation only.
	*	Using this method for non cubic interpolated key will return unpredictable value.
	*/
    FbxAnimCurveDef::ETangentMode GetTangentMode(bool pIncludeOverrides = false)
	{
		return mImpl->GetTangentMode(pIncludeOverrides);
	}

	/** Set tangent mode.
	  * \param pTangentMode Tangent mode to set.
	  */
	void SetTangentMode (FbxAnimCurveDef::ETangentMode pTangentMode)
	{
		mImpl->SetTangentMode(pTangentMode);
	}

	/** Get key's tangent weight mode.
	*	\return Tangent weight mode of the key.
	*	\remarks This method is meaningful for cubic interpolation only.
	*/
	FbxAnimCurveDef::EWeightedMode GetTangentWeightMode() const
	{
		return mImpl->GetTangentWeightMode();
	}

	/** Set key's tangent weight mode as double value (cubic interpolation, non TCB tangent mode).
	*	\param pTangentWeightMode	Weight mode.
	*	\param pMask				Used to select the affected tangents.
	*	\remarks This method is meaningful for cubic interpolation only.
	*   The pMask will be used to cancel out the current tangent weight mode first, and then be used to
	*   define which tangent to select to affect.
	*   
	*   Sample01:
	*   \code
	*   FbxAnimCurveKey* lAnimCurveKey = FbxSdkNew<FbxAnimCurveKey>();
	*   lAnimCurveKey->SetTangentWeightMode(FbxAnimCurveDef::eWeightedNextLeft);
	*   lAnimCurveKey->SetTangentWeightMode(FbxAnimCurveDef::eWeightedRight, FbxAnimCurveDef::eWeightedRight);
	*   \endcode
	*   pMask is eWeightedRight, it will first be used to cancel out the current tangent weight mode eWeightedNextLeft,
	*   since they are not the same, it fails to cancel it out.
	*   Then the mask eWeightedRight will be used to define which tangent should be affected, 
	*   since it is the same as pTangentWeightMode (eWeightedRight), so the eWeightedRight should be affected.
	*   In total, after above calls, both eWeightedNextLeft and eWeightedRight of this key are affected, so 
	*   lAnimCurveKey->GetTangentWeightMode() will be FbxAnimCurveDef::eWeightedAll.
	* 
	*   Sample02:
	*   \code
	*   FbxAnimCurveKey* lAnimCurveKey = FbxSdkNew<FbxAnimCurveKey>();
	*   lAnimCurveKey->SetTangentWeightMode(FbxAnimCurveDef::eWeightedAll);
	*   lAnimCurveKey->SetTangentWeightMode(FbxAnimCurveDef::eWeightedRight, FbxAnimCurveDef::eWeightedNextLeft);
	*   \endcode
	*   pMask is eWeightedNextLeft, it will first be used to cancel out the current tangent weight mode eWeightedAll,
	*   it will cancel out affect on eWeightedNextLeft, but leave affect on eWeightedRight.
	*   Then the mask eWeightedNextLeft will be used to define which tangent should be affected, 
	*   since it is not the same as pTangentWeightMode (eWeightedRight), so the pMask won't affect anything in this step.
	*   In total, after above calls, only eWeightedRight of this key is still affected, so 
	* 	lAnimCurveKey->GetTangentWeightMode() will be FbxAnimCurveDef::eWeightedRight.
	*/
	void SetTangentWeightMode(FbxAnimCurveDef::EWeightedMode pTangentWeightMode, FbxAnimCurveDef::EWeightedMode pMask = FbxAnimCurveDef::eWeightedAll )
	{
		mImpl->SetTangentWeightMode(pTangentWeightMode, pMask);
	}

    /** Adjust the actual tangent of the key so that the tangent control point (tangent extremity) 
	*   stays closer to where it should be. This is required because the weight value gets imprecise
	*   when it is small (it is stored as a fixed point value). This method must be called when 
	*   setting the weight coming from a source where the precision is the same. It must be called 
	*   after the tangent value has been set. 
    *   \remark Do not use this call repetitively (from an interactive editor for example) because 
	*   this function will create imprecision on the tangent value.
    *   \param pIndex FbxAnimCurveDef::EDataIndex
    *   \param pWeight New tangent weight value.
    */
    void SetTangentWeightAndAdjustTangent(FbxAnimCurveDef::EDataIndex pIndex, double pWeight )
    {
        mImpl->SetTangentWeightAndAdjustTangent(pIndex, pWeight);
    }

	/** Get key's tangent velocity mode.
	*	\return Tangent velocity mode of the key.
	*	\remarks This method is meaningful for cubic interpolation only.
	*/
	FbxAnimCurveDef::EVelocityMode GetTangentVelocityMode() const
	{
		return mImpl->GetTangentVelocityMode();
	}

	/** Set key's tangent velocity mode as double value (cubic interpolation, non TCB tangent mode).
	*	\param pTangentVelocityMode	Velocity mode. 
	*	\param pMask				Used to select the affected tangents
	*	\remarks This method is meaningful for cubic interpolation only.
	*   The pMask will be used to cancel out the current tangent velocity mode first, and then be used to
	*   define which tangent to select to affect.
	*   
	*   \see The documentation of SetTangentWeightMode for more details and samples about how the pMask works.
	*/
	void SetTangentVelocityMode(FbxAnimCurveDef::EVelocityMode pTangentVelocityMode, FbxAnimCurveDef::EVelocityMode pMask = FbxAnimCurveDef::eVelocityAll )
	{
		mImpl->SetTangentVelocityMode(pTangentVelocityMode, pMask);
	}

	/** Get key constant mode.
	*	\return Key constant mode.
	*	\remarks This method is meaningful for constant interpolation only.
	*			 Using this method for non constant interpolated key will return unpredicted value.
	*/
	FbxAnimCurveDef::EConstantMode GetConstantMode() const
	{
		return mImpl->GetConstantMode();
	}

	/** Set key's constant mode.
	*   \param pMode Constant mode to set.
	*	\remarks This method is meaningful for constant interpolation only.
	*/
	void SetConstantMode(FbxAnimCurveDef::EConstantMode pMode)
	{
		mImpl->SetConstantMode(pMode);
	}

	/** Get the value of specified data of the key.
	* \param pIndex Data index to specify which data to get value, the index is dependent on the key tangent mode.
	* \return The value of the specified data.
	*
	* \code
	* FbxAnimCurveKey* lKey; // we suppose this is a valid pointer
	* if(lKey->GetTangentMode() == FbxAnimCurveDef::eTangentTCB)
	* {
	*     lKey->GetDataFloat(FbxAnimCurveDef::eTCBTension);
	*     lKey->GetDataFloat(FbxAnimCurveDef::eTCBContinuity);
	*     lKey->GetDataFloat(FbxAnimCurveDef::eTCBBias);
	* }
	* \endcode	
	*/
	float GetDataFloat(FbxAnimCurveDef::EDataIndex pIndex) const
	{
		return mImpl->GetDataFloat(pIndex);
	}

	/** Set the value of specified data of the key.
	* \param pIndex Data index to specify which data to get value, the index is dependent on the key tangent mode.
	* \param pValue The data value to set.
    *
    * \code
	* FbxAnimCurveKey* lKey; // we suppose this is a valid pointer
	* lKey->SetInterpolation(FbxAnimCurveDef::eInterpolationCubic);
	* lKey->SetTangentMode(FbxAnimCurveDef::eTangentAuto);
	* lKey->SetDataFloat(FbxAnimCurveDef::eRightSlope, 0.0);
	* \endcode
	*/
	void SetDataFloat(FbxAnimCurveDef::EDataIndex pIndex, float pValue)
	{
		mImpl->SetDataFloat(pIndex, pValue);
	}

	/** Set tangent visibility mode. This would indicate what part of the tangent is visible in a graphical interface.
	*	\param pVisibility	Tangent visibility mode.
	*	\remarks This method is meaningful for cubic interpolation only.
	*/
	void	SetTangentVisibility (FbxAnimCurveDef::ETangentVisibility pVisibility)
	{
		mImpl->SetTangentVisibility(pVisibility);
	}

	/** Return tangent visibility mode.
	*	\return Tangent visibility mode.
	*	\remarks This method is meaningful for cubic interpolation only.
	*/
	FbxAnimCurveDef::ETangentVisibility GetTangentVisibility () const
	{
		return mImpl->GetTangentVisibility();
	}

	/** Turn on or turn off the tangent break. 
	* When this flag is on (FbxAnimCurveDef::eTANGEAT_BREAK will be set), the key's left and right slopes are independent.
	* When this flag is off, the key's left and right slope are equal.
	* \param pVal Break flag (\c true or \c false).
	* \remarks This method is meaningful for User (FbxAnimCurveDef::eTangentUser) and Auto (FbxAnimCurveDef::eTangentAuto) tangent modes only.
	*/
	void SetBreak(bool pVal)
	{
		mImpl->SetBreak(pVal);
	}

	/** Get if the tangent has a break. 
	* When this flag is set (FbxAnimCurveDef::eTANGEAT_BREAK), the key's left and right slopes are independent.
	* When this flag is off, the key's left and right slope are equal.
	* \return Break flag (\c true or \c false).
	* \remarks This method is meaningful for User (FbxAnimCurveDef::eTangentUser) and Auto (FbxAnimCurveDef::eTangentAuto) tangent modes only.
	*/
	bool GetBreak() const
	{
		return mImpl->GetBreak();
	}

	/** Get key implementation.
      * \return Pointer to implemented instance.
      */
	FbxAnimCurveKey_Impl* GetImpl() const
	{
		return mImpl;
	}

	/** Set allocator function
      * \param pAllocatorFct Allocator function
      */
	static void SetAllocatorFct(FbxAnimCurveKey_Impl* (*pAllocatorFct)());

	/** Set copy allocator function
      * \param pCopyAllocatorFct Copy allocator function
      */
	static void SetCopyAllocatorFct(FbxAnimCurveKey_Impl* (*pCopyAllocatorFct)(FbxAnimCurveKey_Impl*));

	/** Set deallocator function
      * \param pDeallocatorFct Deallocator function
      */
	static void SetDeallocatorFct(void (*pDeallocatorFct)(FbxAnimCurveKey_Impl*));

private:
	static FbxAnimCurveKey_Impl* (*mAllocatorFct)();
	static FbxAnimCurveKey_Impl* (*mCopyAllocatorFct)(FbxAnimCurveKey_Impl*);
	static void (*mDeallocatorFct)(FbxAnimCurveKey_Impl*);
	FbxAnimCurveKey_Impl* mImpl;
};

class FbxScene;

/** An animation curve, defined by a collection of keys (FbxAnimCurveKey), and indicating how a value changes over time.
* Since an animation curve is a function, on a given animation curve, only one key per time is
* allowed. The keys are sorted
* in time order. They can be accessed by their index on the curve, from 0 to FbxAnimCurve::KeyGetCount-1.
* The time unit in FBX (FbxTime) is 1/46186158000 of one second. 
*
* Each key defines tangents and interpolation that modify the animation curve.
* Tangents control the way the animation curve enters and exits the keys.
* Interpolation indicates the animation curve's behavior between keys.
*
* Interpolation modes are
* \li Constant - Curve value stays the same until next key
* \li Linear - Animation curve is a straight line
* \li Cubic - Animation curve is a Bezier spline
*
* Tangent modes are
* \li Auto (Spline cardinal)
* \li Spline TCB (Tension, Continuity, Bias)
* \li User (Next slope at the left equal to slope at the right)
*
* Tangent modes can be overridden by more tangent options:
* \li Break (Independent left and right slopes)
* \li Clamp (Key should be flat if next or previous key has the same value)
* \li Time independent
*
* Tangent can be modified some more by adding weights and velocity.
* By default, the weights are 0.333 on either side of the key, and there is 
* no velocity. Velocity settings speed up or slow down animation on either side of 
* a key without changing the trajectory of the animation. Unlike Auto and Weight settings, 
* Velocity changes the animation in time, but not in space.
* 
* \nosubgrouping
* \remarks FbxAnimCurve is now the main animation animation curve object of the SDK.
* Users should always use this class to handle animation curve.
*
* \note When adding keys to an animation curve, use FbxAnimCurve::KeyModifyBegin and FbxAnimCurve::KeyModifyEnd.
*  please refer to the following sample code:
* \code
* FbxTime lTime;
* int lKeyIndex = 0;

* // Create curve
* FbxAnimCurve* lAnimCurve = FbxAnimCurve::Create(pScene, "Cube Animation");

* // Add keys to the curve
* lAnimCurve->KeyModifyBegin();

* // First key: time 0, value 0
* lTime.SetSecondDouble(0.0);
* lKeyIndex = lAnimCurve->KeyAdd(lTime);
* lAnimCurve->KeySet(lKeyIndex, lTime, 0.0, FbxAnimCurveDef::eInterpolationLinear);

* // Second key: time 20s, value -3600
* // Since this curve will describe rotation, each cube will rotate 10 times around itself during 20 seconds.
* lTime.SetSecondDouble(20.0);
* lKeyIndex = lAnimCurve->KeyAdd(lTime);
* lAnimCurve->KeySet(lKeyIndex, lTime, -3600, FbxAnimCurveDef::eInterpolationLinear);

* // Done adding keys.
* lAnimCurve->KeyModifyEnd();
* \endcode
*
*/
class FBXSDK_DLL FbxAnimCurve : public FbxAnimCurveBase
{
    FBXSDK_ABSTRACT_OBJECT_DECLARE(FbxAnimCurve, FbxAnimCurveBase);

public:
    /**
	  * \name Animation curve creation.
	  *
	  */
	//@{
		/** Create a FbxAnimCurve.
		  * \param pContainer Scene to which the created animation curve belongs.
		  * \param pName Name of the animation curve.
		  * \return Newly created animation curve
		  */
		static FbxAnimCurve* Create(FbxScene* pContainer, const char* pName);
	//@}

    /**
      * \name Key management.
      *
      */
    //@{
		/** Resize animation curve buffer to hold a certain number of keys.
		  * \param pKeyCount Number of keys the animation curve will eventually hold.
		  */
		virtual void ResizeKeyBuffer(int pKeyCount) = 0;

		/** Call this function prior to adding, removing or editing keys of an animation curve.
		  * Call function FbxAnimCurve::KeyModifyEnd() after modification.
		  */
		virtual void KeyModifyBegin () = 0;
		    
		/** Call this function after adding, removing or editing keys of an animation curve.
		  * Function FbxAnimCurve::KeyModifyBegin() must have been called prior to modify the keys.
		  */
		virtual void KeyModifyEnd () = 0;

		//! Remove all the keys of the animation curve and free buffer memory.
		virtual void KeyClear () = 0;

		/** Get the number of keys.
		  * \return Key count.
		  */
		virtual int KeyGetCount () const = 0;

		/** Add a given key at given time. The new key is appended after all the other animation curve's keys.
		* Function FbxAnimCurve::KeyInsert() should be used instead if the key 
		* is to be added in the curve and not at the end. This function does not
		* respect the interpolation type and tangents of the neighboring keys. 
		* If there is already a key at the given time, the key is modified and no 
		* new key is added.
		*
		* \param pTime Time of the new key.
		* \param pKey Key to add.
		* \param pLast Index of the last processed key to speed up search. If this function is called in a loop, 
		*              initialize this value to 0 and let it be updated by each call.
		* \return Index of the key at given time, no matter if it was added 
		*         or already present.
		*
		* \remark Key value, interpolation type and tangent mode must be set 
		*  explicitly afterwards.
		*/
		virtual int KeyAdd (FbxTime pTime, FbxAnimCurveKeyBase& pKey, int* pLast = NULL) = 0; 

		/** Add a key at given time. The new key is appended after all the other animation curve's keys.
		* Function FbxAnimCurve::KeyInsert() should be used instead if the key 
		* is to be added in the curve and not at the end. This function does not
		* respect of the interpolation type and tangents of the neighboring keys. 
		* If there is already a key a the given time, no key is added.
		*
		* \param pTime Time of the new key.
		* \param pLast Index of the last processed key to speed up search. If this function is called in a loop, 
		*              initialize this value to 0 and let it be updated by each call.
		* \return Index of the key at given time, no matter if it was added 
		*         or already present.
		* \remark Key value, interpolation type and tangent mode must be set 
		* explicitly afterwards.
		*/
		virtual int KeyAdd (FbxTime pTime, int* pLast = NULL) = 0;

		/** Set (or replace) key at given index with given key. 
		* \param pIndex Index of the key to be set or replaced.
		* \param pKey New key at this index.
		* \return \c true if key time is superior to previous key time
		* and inferior to next key time, \c false otherwise.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		*/
		virtual bool KeySet(int pIndex,  FbxAnimCurveKeyBase& pKey) = 0;
		    
		/** Remove key at given index. Other key indices are updated automatically.
		* \param pIndex Index of key to remove.
		* \return \c true on success, \c false otherwise.
		*/
		virtual bool KeyRemove(int pIndex) = 0;

		/** Remove all the keys in the given range.
		* \param pStartIndex Index of the first key to remove (inclusive).
		* \param pEndIndex Index of the last key to remove (inclusive).
		* \return true on success.
		*/
		virtual bool KeyRemove(int pStartIndex, int pEndIndex) = 0;

		/** Insert a key at given time.
		* This function should be used instead of FbxAnimCurve::KeyAdd() if the key 
		* is to be added in the curve and not at the end. It inserts the key in 
		* respect to the interpolation type and tangents of the neighboring keys. 
		* If there is already a key a the given time, the key is modified and no 
		* new key is added.
		* \param pTime Time of the new key.
		* \param pLast Index of the last processed key to speed up search. If this 
		* function is called in a loop, initialize this value to 0 and let it 
		* be updated by each call.
		* \return Index of the key at given time, no matter if it was inserted 
		* or already present.
		* \remark Key value must be set explicitly afterwards. The 
		* interpolation type and tangent mode are copied from the previous key.
		*/
		virtual int KeyInsert ( FbxTime pTime, int* pLast = NULL ) = 0;
		    
		/** Find key index for a given time.
		* \param pTime Time of the key looked for.
		* \param pLast Index of the last processed key to speed up search. If this 
		* function is called in a loop, initialize this value to 0 and let it 
		* be updated by each call.
		* \return Key index. The integer part of the key index gives the 
		* index of the closest key with a smaller time. The decimals give
		* the relative position of given time compared to previous and next
		* key times. Returns -1 if animation curve has no key.
		*
		* For example (using seconds for clarity), if there is a key at time 10s with index 5, and a key at
		* time 11s with index 6, KeyFind(10.3s) would return 5.3.
		*/
		virtual double KeyFind (FbxTime pTime, int* pLast = NULL) = 0;

		/** Scale value of all keys.
		*	\param pMultValue Scale applied on key values.
		*	\return \c true on success, \c false otherwise.
		*/
		virtual bool KeyScaleValue (float pMultValue) = 0;

		/** Scale value and tangent of all keys.
		*	\param pMultValue Scale applied on key values and tangents.
		*	\return \c true on success, \c false otherwise.
		*/
		virtual bool KeyScaleValueAndTangent (float pMultValue) = 0;
		//@}

		/**
		* \name Key Manipulation
		*/

		//@{
		/** General function to set key properties.
		* The key at index pKeyIndex is retrieved and modified according to the other parameters. 
		* The key must have been previously created, for example using KeyAdd.
		*	Use FbxAnimCurve::SetTCB() in the specific case of setting a key with cubic interpolation and TCB tangent mode.
		*   \param pKeyIndex        Index of the key.
		*	\param pTime			Key time.
		*	\param pValue			Key value.
		*	\param pInterpolation	Key interpolation type.
		*	\param pTangentMode		Key tangent mode (meaningful for cubic interpolation only).
		*	\param pData0			Value of right slope.
		*	\param pData1			Value of next left slope.
		*	\param pTangentWeightMode	Weight mode, if used.
		*	\param pWeight0				Weight for right slope, if tangent weight mode is eWeightedRight or eWeightedAll.
		*	\param pWeight1				Weight for next left slope, if tangent weight mode is eWeightedNextLeft or eWeightedAll.
		*	\param pVelocity0			Velocity for right slope, if tangent velocity mode is eVelocityRight or eVelocityAll.
		*	\param pVelocity1			Velocity for next left slope, if tangent velocity mode is eVelocityNextLeft or eVelocityAll.
		*/
		virtual void KeySet(int pKeyIndex,FbxTime pTime, float pValue, FbxAnimCurveDef::EInterpolationType pInterpolation = FbxAnimCurveDef::eInterpolationCubic, FbxAnimCurveDef::ETangentMode pTangentMode = FbxAnimCurveDef::eTangentAuto, float pData0 = 0.0,float pData1 = 0.0,FbxAnimCurveDef::EWeightedMode pTangentWeightMode = FbxAnimCurveDef::eWeightedNone, float pWeight0 = FbxAnimCurveDef::sDEFAULT_WEIGHT,float pWeight1 = FbxAnimCurveDef::sDEFAULT_WEIGHT,float pVelocity0 = FbxAnimCurveDef::sDEFAULT_VELOCITY,float pVelocity1 = FbxAnimCurveDef::sDEFAULT_VELOCITY) = 0;

		/**	Set a key with cubic interpolation, TCB tangent mode. 	
		* The key at index pKeyIndex is retrieved and modified according to the other parameters. 
		* The TCB mode controls the tension, continuity,
		* and bias of the curve.
		*   \param pKeyIndex  Index of the key.
		*	\param pTime	Key time.
		*	\param pValue	Key value.
		*	\param pData0	Tension. Controls the amount of curvature in the animation curve. The higher the tension is, the more linear
		* the curve looks. When the tension is low, the curve looks rounder or wider. 
		*	\param pData1	Continuity. Controls the smoothness or singularity of the curve on the key. 
		*	\param pData2	Bias. Controls if the effect of tension and continuity affect the curve before or after the key.
		*/
		virtual void KeySetTCB(int pKeyIndex,FbxTime pTime, float pValue, float pData0 = 0.0f, float pData1 = 0.0f, float pData2 = 0.0f) = 0;

		/** Get key's interpolation type.
		*   \param pKeyIndex         Index of the queried key.
		*   \return                  Interpolation type of the queried key.
		*/
		virtual FbxAnimCurveDef::EInterpolationType KeyGetInterpolation(int pKeyIndex) const = 0;

		/** Set key's interpolation type.
		*   \param pKeyIndex      Index of the key.
		*	\param pInterpolation Key interpolation type.
		*/
		virtual void KeySetInterpolation(int pKeyIndex, FbxAnimCurveDef::EInterpolationType pInterpolation) = 0;

		/** Get key's constant mode.
		*	\note This method is only relevant if the key's interpolation type is constant (eInterpolationConstant).
		*	Using this method on a key with an other interpolation type will return unpredictable value.
		*   \param pKeyIndex      Index of the queried key.
		*	\return Key constant mode.
		*/
		virtual FbxAnimCurveDef::EConstantMode KeyGetConstantMode(int pKeyIndex) const = 0;

		/** Get key's tangent mode.
		*   \param pKeyIndex  Index of the key.
		*   \param pIncludeOverrides Include override flags: Break, Clamp, Time-Independent.
		*	This method is meaningful for cubic interpolation only.
		*			 Using this method for non cubic interpolated key will return unpredictable value.
		*	\return Key tangent mode.
		*/
		virtual FbxAnimCurveDef::ETangentMode KeyGetTangentMode(int pKeyIndex, bool pIncludeOverrides = false ) const = 0;

		/** Set key's constant mode.
		*	This method is meaningful for constant interpolation only.
		*   \param pKeyIndex            Index of the key.
		*	\param pMode Key constant mode.
		*/
		virtual void KeySetConstantMode(int pKeyIndex, FbxAnimCurveDef::EConstantMode pMode) = 0;

		/** Set key's tangent mode.
		*	This method is meaningful for cubic interpolation only.
		*   \param pKeyIndex   Index of the key.
		*	\param pTangent Key tangent mode.
		*/
		virtual void KeySetTangentMode(int pKeyIndex, FbxAnimCurveDef::ETangentMode pTangent) = 0;

		/** Get key at given index.
		* \param pIndex Index of the key on the animation curve.
		* \return The key at the given index.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		*/
		virtual FbxAnimCurveKey KeyGet(int pIndex) const = 0;

		/**	Get key value.
		* \param pKeyIndex Index of the queried key.
		* \return Key value.
		*/
		virtual float KeyGetValue(int pKeyIndex) const = 0;

		/** Set key value.
		* \param pKeyIndex Index of the key.
		* \param pValue The value to set.
		*/ 
		virtual void KeySetValue(int pKeyIndex, float pValue) = 0;

		/** Increment key value.
		*   \param pKeyIndex   Index of the key.
		*	\param pValue Term added to the key value.
		*/
		virtual void KeyIncValue(int pKeyIndex, float pValue) = 0;

		/** Multiply key value.
		* \param pKeyIndex   Index of the key.
		* \param pValue Factor multiplying the key value.
		* \see FbxAnimCurve::KeyMultTangent.
		*/
		virtual void KeyMultValue(int pKeyIndex, float pValue) = 0;

		/** Multiply key tangents.
		*	\remark When multiplying a key value, tangents must be
		*         multiplied to conserve the same topology.
		*   \param pKeyIndex   Index of the key.
		*	\param pValue Factor multiplying the key tangents.
		*/
		virtual void KeyMultTangent(int pKeyIndex, float pValue) = 0;

		/** Get key time
		*   \param pKeyIndex   Index of the queried key.
		*	\return Key time (time at which this key is occurring).
		*/
		virtual FbxTime KeyGetTime(int pKeyIndex) const = 0;

		/** Set key time.
		* \param pKeyIndex   Index of the key.
		* \param pTime Key time (time at which this key is occurring).
		* \remark The new key time might modify the key index.
		*/
		virtual void KeySetTime(int pKeyIndex, FbxTime pTime) = 0;

		/** Set or unset the tangent break. When this flag is set (FbxAnimCurveDef::eTangentBreak), the key's left and right slopes are independent.
		* When this flag is off, the key's left and right slope are equal.
		* This method is relevant for User (FbxAnimCurveDef::eTangentUser) and Auto (FbxAnimCurveDef::eTangentAuto) tangent modes only.
		* \param pKeyIndex Index of the key.
		* \param pVal Break flag (\c true or \c false).
		*/
		virtual void KeySetBreak(int pKeyIndex, bool pVal) = 0; 

		/** Get if the tangent has a break. When this flag is set (FbxAnimCurveDef::eTangentBreak), the key's left and right slopes are independent.
		* When this flag is off, the key's left and right slope are equal.
		* This method is relevant for User (FbxAnimCurveDef::eTangentUser) and Auto (FbxAnimCurveDef::eTangentAuto) tangent modes only.
		* \param pKeyIndex Index of the queried key.
		* \return Break flag (\c true or \c false).
		*/
		virtual bool KeyGetBreak(int pKeyIndex) const = 0; 
    //@}

    /**
      * \name Key Tangent Management
      */
    //@{
		/** Get the left derivative of a key.
		* \param pIndex Index of the queried key.
		* \return Left derivative (Value over time (s)).
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		*/
		virtual float KeyGetLeftDerivative(int pIndex) = 0;

		/** Set the left derivative of a key.
		* \param pIndex Index of the key.
		* \param pValue Left derivative.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		* This function is only relevant if previous key interpolation
		* type is eInterpolationCubic and tangent mode is
		* FbxAnimCurveDef::eTangentUser, FbxAnimCurveDef::eTangentBreak or FbxAnimCurveDef::eTangentAuto. 
		*/
		virtual void KeySetLeftDerivative(int pIndex, float pValue) = 0;

		/** Get the left auto parametric of a key. This is used to compute the slope of Auto and User keys.
		* \param pIndex Index of the key.
		* \param pApplyOvershootProtection Clamp flag (eGENERIC_CLAMP) is taken into account.
		* \return Left auto parametric.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		*/
		virtual float KeyGetLeftAuto(int pIndex, bool pApplyOvershootProtection = false) = 0;

		/** Get the left derivative info (of type FbxAnimCurveTangentInfo) of a key.
		* \param pIndex Index of the queried key.
		* \return Left derivative info.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		*/
		virtual FbxAnimCurveTangentInfo KeyGetLeftDerivativeInfo(int pIndex) = 0;

		/** Set the left derivative info (of type FbxAnimCurveTangentInfo) of a key.
		* \param pIndex Index of the key.
		* \param pValue Left derivative info.
		* \param pForceDerivative If \c true, assign the tangent info's derivative value to the key derivative.
		*  If \c false, use the tangent info's auto parametric value to recompute the key derivative.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		* This function is only relevant if previous key interpolation
		* type is eInterpolationCubic and tangent mode is
		* FbxAnimCurveDef::eTangentUser or FbxAnimCurveDef::eTangentBreak.
		*/
		virtual void KeySetLeftDerivativeInfo(int pIndex, const FbxAnimCurveTangentInfo& pValue, bool pForceDerivative = false) = 0;

		/** Get the right derivative of a key.
		* \param pIndex Index of the key.
		* \return Right derivative (Value over time (s)).
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		*/
		virtual float KeyGetRightDerivative(int pIndex) = 0;

		/** Set the right derivative of a key.
		* \param pIndex Index of the key.
		* \param pValue Right derivative.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		* This function is only relevant if previous key interpolation
		* type is eInterpolationCubic and tangent mode is
		* FbxAnimCurveDef::eTangentUser, FbxAnimCurveDef::eTangentBreak or FbxAnimCurveDef::eTangentAuto.
		*/
		virtual void KeySetRightDerivative(int pIndex, float pValue) = 0;

		/** Get the right auto parametric of a key. This is used to compute the slope of Auto and User keys.
		* \param pIndex Index of the key.
		* \param pApplyOvershootProtection Clamp flag (eGENERIC_CLAMP) is taken into account.
		* \return Right auto parametric.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		*/
		virtual float KeyGetRightAuto(int pIndex, bool pApplyOvershootProtection = false) = 0;

		/** Get the right derivative info (of type FbxAnimCurveTangentInfo) of a key.
		* \param pIndex Index of the queried key.
		* \return Right derivative info.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		*/
		virtual FbxAnimCurveTangentInfo KeyGetRightDerivativeInfo(int pIndex) = 0;

		/** Set the right derivative info (of type FbxAnimCurveTangentInfo) of a key.
		* \param pIndex Index of the key.
		* \param pValue Right derivative info.
		* \param pForceDerivative If \c true, assign the tangent info's derivative value to the key derivative.
		*  If \c false, use the tangent info's auto parametric value to recompute the key derivative.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		* This function is only relevant if previous key interpolation
		* type is eInterpolationCubic and tangent mode is
		* FbxAnimCurveDef::eTangentUser or FbxAnimCurveDef::eTangentBreak.
		*/
		virtual void KeySetRightDerivativeInfo(int pIndex, const FbxAnimCurveTangentInfo& pValue, bool pForceDerivative = false) = 0;

		/** Get the left tangent weight mode of a key.
		* \param pIndex Index of queried key.
		* \return \c true if the key is left weighted (Weight mode is eWEIGHT_WEIGHTED_RIGHT or eWeightedAll). \c false otherwise.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		*/
		virtual bool KeyIsLeftTangentWeighted(int pIndex) const = 0;

		/** Get the right tangent weight mode of a key.
		* \param pIndex Index of queried key.
		* \return \c true if the key is right weighted (Weight mode is eWeightedRight or eWeightedAll). \c false otherwise.
		* \remark Result is undetermined if animation curve has no key or if index 
		* is out of bounds.
		*/
		virtual bool KeyIsRightTangentWeighted(int pIndex) const = 0;

		/** Get the weight value component of the left tangent of a key.
		* \param pIndex Index of the key.
		* \return Left tangent weight, or eDEFAULT_WEIGHT (0.333...) if left tangent is not weighted.
		* \remark This function is only relevant if key interpolation
		* type is eInterpolationCubic.
		*/
		virtual float KeyGetLeftTangentWeight(int pIndex) const = 0;

		/** Get the weight value component of the right tangent of a key.
		* \param pIndex Index of the key.
		* \return Right tangent weight, or eDEFAULT_WEIGHT (0.333...) if right tangent is not weighted.
		* \remark This function is only relevant if key interpolation
		* type is eInterpolationCubic.
		*/	
		virtual float KeyGetRightTangentWeight(int pIndex) const = 0;

		/** Set the left tangent weight of a key.
		* \param pIndex Index of the key.
		* \param pWeight Weight to set on the left tangent.
		* \param pAdjustTan If true, recompute the tangent height to compensate for very small weights.
		* \remarks This function is only relevant if previous key interpolation
		* type is eInterpolationCubic and tangent mode is
		* FbxAnimCurveDef::eTangentUser or FbxAnimCurveDef::eTangentBreak. The tangent is 
		* automatically set in weighted mode.
		* The pAdjustTan option will only produce correct results provided that the tangent has already been
		* set before calling this function.
		*/
		virtual void   KeySetLeftTangentWeight( int pIndex, float pWeight, bool pAdjustTan = false ) = 0;

		/** Set the right tangent weight of a key.
		* \param pIndex Index of the key.
		* \param pWeight Weight to set on the right tangent.
		* \param pAdjustTan If true, recompute the tangent height to compensate for very small weights.
		* \remarks This function is only relevant if key interpolation
		* type is eInterpolationCubic and tangent mode is
		* FbxAnimCurveDef::eTangentUser or FbxAnimCurveDef::eTangentBreak. The tangent is 
		* automatically set in weighted mode.
		* The pAdjustTan option will only produce correct results provided that the tangent has already been
		* set before calling this function.
		*/
		virtual void   KeySetRightTangentWeight( int pIndex, float pWeight, bool pAdjustTan = false  ) = 0;

		/** Get the velocity value component of the left tangent of a key.
		* \param pIndex Index of the key.
		* \return Tangent velocity of the left tangent.
		* \remarks This function is only relevant if key interpolation
		*  type is eInterpolationCubic
		*/
		virtual float KeyGetLeftTangentVelocity( int pIndex) const = 0;

		/** Get the velocity value component of the right tangent of a key.
		* \param pIndex Index of the key.
		* \return Tangent velocity of the right tangent.
		* \remarks This function is only relevant if key interpolation
		*  type is eInterpolationCubic
		*/			
		virtual float KeyGetRightTangentVelocity( int pIndex) const = 0;
    //@}

    /**
      * \name Evaluation and Analysis
      */
    //@{
		/**	Evaluate animation curve value at a given time.
		* \param pTime Time of evaluation.
		* If time falls between two keys, animation curve value is 
		* interpolated according to previous key interpolation type and
		* tangent mode if relevant.
		* \param pLast Index of the last processed key to speed up search. If this 
		* function is called in a loop, initialize this value to 0 and let it 
		* be updated by each call.
		* \return Animation curve value on given time, or animation curve's default value if animation curve
		* has no key.
		* \remarks This function takes extrapolation into account.
		*/
		virtual float Evaluate (FbxTime pTime, int* pLast = NULL) = 0;

		/**	Evaluate animation curve value at a given key index.
		* \param pIndex Any value from 0 to FbxAnimCurve::KeyGetCount() - 1.
		* \return Animation curve value, or default value if animation curve
		* has no key. 
		*
		* \remarks If key index is not an integer value, animation curve value is 
		* interpolated according to previous key interpolation type and
		* tangent mode, if relevant.
		* This function does not take extrapolation into account.
		* Result is undetermined if index is out of bounds.
		*/
		virtual float EvaluateIndex( double pIndex) = 0;
		    
		/**	Evaluate function left derivative at given time.
		* \param pTime Time of evaluation.
		* \param pLast Index of the last processed key to speed up search. If this 
		* function is called in a loop, initialize this value to 0 and let it 
		* be updated by each call.
		* \return Left derivative at given time.
		* \remarks This function does not take extrapolation into account. 
		*  Result is undetermined if index is out of bounds.
		*/
		virtual float EvaluateLeftDerivative (FbxTime pTime, int* pLast = NULL) = 0;
		    
		/**	Evaluate function right derivative at given time.
		* \param pTime Time of evaluation.
		* \param pLast Index of the last processed key to speed up search. If this 
		* function is called in a loop, initialize this value to 0 and let it 
		* be updated by each call.
		* \return Right derivative at given time.
		* \remarks This function does not take extrapolation into account. 
		* Result is undetermined if index is out of bounds.
		*/
		virtual float EvaluateRightDerivative (FbxTime pTime, int* pLast = NULL) = 0;
    //@}

    /**
      * \name Utility functions.
      *
      */
    //@{
		/** Find out start and end time of the animation animation curve.
		  * This function retrieves the animation curve's time span.
		  * \param pTimeInterval Reference to receive start and end time.
		  * \return \c true on success, \c false otherwise.
		  */
		virtual bool GetTimeInterval(FbxTimeSpan& pTimeInterval) = 0;

		/** Copy animation curve content into current animation curve.
		  * \param pSource Animation curve to be copied (which will not be modified).
		  * \param pWithKeys If \c true, clear keys in current animation curve and copy
		  * keys from source animation curve. If \c false, keys in current animation curve
		  * are left as is.
		*/
		virtual void CopyFrom(FbxAnimCurve& pSource, bool pWithKeys = true) = 0;

		/** Retrieve the value of the parent curve node channel.
		* \param pCurveNodeIndex The index of the parent curve node, if more than one exist.
		* \return The value of the parent curve node channel of this curve.
		* \remark In most case, the curve will have a single curve node channel as destination. However,
		* it is possible that more are connected, hence why we provide the curve node index parameter. */
		virtual float GetValue(int pCurveNodeIndex=0) = 0;

		/** Set the value to the parent curve node channel.
		* \param pValue The value to set to the parent curve node channel of this curve.
		* \param pCurveNodeIndex The index of the parent curve node, if more than one exist.
		* \remark In most case, the curve will have a single curve node channel as destination. However,
		* it is possible that more are connected, hence why we provide the curve node index parameter. */
		virtual void SetValue(float pValue, int pCurveNodeIndex=0) = 0;
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual KFCurve* GetKFCurve() = 0;
	virtual bool Store(FbxIO* pFileObject, bool pLegacyVersion=false) = 0;
    virtual bool Retrieve(FbxIO* pFileObject) = 0;
	virtual void ExtrapolationSyncCallback() = 0;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_ANIMATION_CURVE_H_ */
