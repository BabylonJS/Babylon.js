/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxmanipulators.h
#ifndef _FBXSDK_UTILS_MANIPULATORS_H_
#define _FBXSDK_UTILS_MANIPULATORS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/core/math/fbxvector2.h>
#include <fbxsdk/core/math/fbxvector4.h>
#include <fbxsdk/scene/geometry/fbxcamera.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxCameraManipulationState;

/** This class can be used to provide basic camera manipulation in any program using this library.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxCameraManipulator : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxCameraManipulator, FbxObject);

public:
	//! All possible manipulation actions that can be performed on a camera using this manipulator.
	enum EAction
	{
		eNone,		//!< No action.
		eOrbit,		//!< Orbiting camera around LootAt/Interest position.
		eDolly,		//!< Moving camera closer or away from its LookAt/Intest position.
		ePan,		//!< Panning camera up, down and sideways.
		eFreePan	//!< Panning and dollying all at once.
	};

	/** Begin manipulation of the camera.
	* \param pAction The action performed for this manipulation scope.
	* \param pX Begin horizontal position of the manipulation, in pixels.
	* \param pY Begin vertical position of the manipulation, in pixels. */
	void Begin(EAction pAction, float pX, float pY);

	/** Notify manipulation of latest input.
	* \param pTimeDelta Elapsed time since the last notify. Only used if Smoothing is enabled.
	* \param pX Horizontal position of the manipulation, in pixels.
	* \param pY Vertical position of the manipulation, in pixels.
	* \param pScale Scaling value of the manipulation. Only used by eFreePan action. */
	void Notify(float pX, float pY, float pScale=0);

	//! End current manipulation.
	void End();

	/** Update the camera position. This must be called periodically in order for the camera to update its position.
	* \param pTimeDelta Elapsed time since the last update. If Smooth is disabled, you can leave this value to zero.
	* \remark Begin, Notify and End will not change the current camera position. */
	void Update(const FbxTime& pTimeDelta=FBXSDK_TIME_ZERO);

	/** Do a complete manipulation action in a single operation. This is the equivalent of calling Begin, Notify and End successively.
	* \param pAction The action performed for this manipulation scope.
	* \param pX Horizontal position of the manipulation, in pixels.
	* \param pY Vertical position of the manipulation, in pixels.
	* \param pScale Scaling value of the manipulation. Only used by eFreePan action. */
	void Action(EAction pAction, float pX, float pY, float pScale=0);

	/** Retrieve current manipulation action.
	* \return The action currently performed by the camera manipulator. */
	EAction GetCurrentAction() const;

	/** Change camera position and LookAt node to frame all objects.
	* \param pTime Time to use to evaluate mesh deformations. Leave at default value to cancel mesh evaluation. */
	void FrameAll(const FbxTime& pTime=FBXSDK_TIME_INFINITE);

	/** Change camera position and LookAt to frame all selected objects.
	* \param pTime Time to use to evaluate mesh deformations. Leave at default value to cancel mesh evaluation. */
	void FrameSelected(const FbxTime& pTime=FBXSDK_TIME_INFINITE);

	/** Change camera position and LookAt to frame the selected position on screen. The LookAt will be placed
	* at first closest intersecting geometry, and the distance between camera and LookAt will be preserved.
	* \param pX The horizontal screen coordinate.
	* \param pY The vertical screen coordinate.
	* \param pCulling If \c true, only test triangles that are front-facing, otherwise test both sides.
	* \param pTime Time to use to evaluate mesh deformations. Leave at default value to cancel mesh evaluation. */
	void FrameScreenPosition(float pX, float pY, bool pCulling=false, const FbxTime& pTime=FBXSDK_TIME_INFINITE);

	/** The camera controlled by the manipulator. */
	FbxPropertyT<FbxReference> Camera;

	/** Width of the camera viewport, in pixels. This is used to accurately calculate to movement speed.
	* \remark If this property is not correctly set, movements will be erronous. */
	FbxPropertyT<FbxFloat> ViewportWidth;

	/** Height of the camera viewport, in pixels. This is used to accurately calculate to movement speed.
	* \remark If this property is not correctly set, movements will be erronous. */
	FbxPropertyT<FbxFloat> ViewportHeight;

	/** Camera manipulations will be smooth if enabled. True by default. */
	FbxPropertyT<FbxBool> Smooth;

	/** Camera manipulations smoothing speed. Higher speed will stabilize the camera more quickly. Default is 10.0 */
	FbxPropertyT<FbxDouble> SmoothSpeed;

	/** Invert the camera horizontal manipulation direction if set to true. False by default. */
	FbxPropertyT<FbxBool> InvertX;

	/** Invert the camera vertical manipulation direction if set to true. False by default. */
	FbxPropertyT<FbxBool> InvertY;

	/** Restore the camera transform upon destruction of the manipulator. */
	FbxPropertyT<FbxBool> Restore;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void Destruct(bool pRecursive);
	virtual void ConstructProperties(bool pForceSet);
	virtual bool ConnectNotify(const FbxConnectEvent& pEvent);
	virtual bool PropertyNotify(EPropertyNotifyType pType, FbxProperty& pProperty);

private:
	void		Reset();
	FbxCamera*	GetCamera() const;
	FbxNode*	GetCameraNode() const;
	FbxNode*	GetCameraLookAtNode() const;
	FbxNode*	GetCameraTargetUpNode() const;
	FbxVector4	GetCameraPosition() const;
	void		SetCameraPosition(const FbxVector4& pPosition);
	FbxVector4	GetCameraRotation() const;
	void		SetCameraRotation(const FbxVector4& pRotation);
	FbxVector4	GetCameraLookAtPosition() const;
	void		SetCameraLookAtPosition(const FbxVector4& pPosition);
	FbxVector4	GetCameraTargetUpPosition() const;
	void		SetCameraTargetUpPosition(const FbxVector4& pPosition);
	FbxAMatrix	GetCameraRotationMatrix() const;
	void		SetCameraRotationMatrix(const FbxAMatrix& pRM);

	double		ComputeRotationAxis(FbxVector4& pFront, FbxVector4& pUp, FbxVector4& pRight, const FbxVector4& pEye, const FbxVector4& pLookAt, const FbxVector4& pUpVector) const;
	void		ComputeRotationMatrix(FbxAMatrix& pRM, const FbxVector4& pEye, const FbxVector4& pLookAt, const FbxVector4& pUpVector);
	void		UpdateCameraRotation();

	bool		FrameObjects(bool pSelected, const FbxTime& pTime);
	FbxVector4	ComputePositionToFitBBoxInFrustum(const FbxVector4& pBBoxMin, const FbxVector4& pBBoxMax, const FbxVector4& pBBoxCenter, const FbxVector4& pCameraPosition, const FbxAMatrix& pCameraRM, const FbxTime& pTime);

	EAction		mCurrentAction;
	FbxFloat	mBeginMouse[3], mLastMouse[3];
	FbxVector4	mBeginPosition, mBeginAxis[3];
	FbxBool		mBeginFlipped;

	FbxDouble	mDestOrthoZoom;
	FbxVector4	mDestPosition, mDestLookAt, mDestTargetUp;
	FbxAMatrix	mDestRotation;

  	FbxVector4	mInitialPosition, mInitialRotation, mInitialLookAt;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_MANIPULATORS_H_ */
