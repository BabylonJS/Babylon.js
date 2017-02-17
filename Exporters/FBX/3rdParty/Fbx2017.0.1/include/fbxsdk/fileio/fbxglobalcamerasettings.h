/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxglobalcamerasettings.h
#ifndef _FBXSDK_FILEIO_GLOBAL_CAMERA_SETTINGS_H_
#define _FBXSDK_FILEIO_GLOBAL_CAMERA_SETTINGS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxStatus;
class FbxManager;
class FbxScene;
class FbxCamera;
class FbxCameraSwitcher;

#define FBXSDK_CAMERA_PERSPECTIVE	"Producer Perspective"
#define FBXSDK_CAMERA_TOP			"Producer Top"
#define FBXSDK_CAMERA_FRONT			"Producer Front"
#define FBXSDK_CAMERA_BACK			"Producer Back"
#define FBXSDK_CAMERA_RIGHT			"Producer Right"
#define FBXSDK_CAMERA_LEFT			"Producer Left"
#define FBXSDK_CAMERA_BOTTOM		"Producer Bottom"
#define FBXSDK_CAMERA_SWITCHER		"Camera Switcher"

/** This class contains the global camera settings.
  * \nosubgrouping
  * \remarks This class exists for FBX version 6.x and earlier. The new FBX v7.x file format 
  * that is now the default no longer uses it. The relevant data (a subset of this class) has 
  * been moved to the FbxGlobalSettings object and should be used instead.
  */
class FBXSDK_DLL FbxGlobalCameraSettings
{
    FBXSDK_FRIEND_NEW();

public:
	/** \name Default Camera Settings */
	//@{
		/** \enum EViewingMode Viewing modes. */
		enum EViewingMode
		{
			eStandard,	//<! Standard view mode.
			eXRay,		//<! X ray view mode.
			eModelsOnly	//<! Model only view mode.
		};

		/** Sets the default camera.
		* \param pCameraName Name of the default camera.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c True if camera name is valid, returns \c false if it is not valid.
		* \remark A valid camera name must be either one of the defined tokens (FBXSDK_CAMERA_PERSPECTIVE, FBXSDK_CAMERA_TOP, FBXSDK_CAMERA_BOTTOM, FBXSDK_CAMERA_FRONT, FBXSDK_CAMERA_BACK,
		* FBXSDK_CAMERA_RIGHT, FBXSDK_CAMERA_LEFT and FBXSDK_CAMERA_SWITCHER) or the name of a camera that is inserted in the node tree under the scene's root node. */
		bool SetDefaultCamera(const char* pCameraName, FbxStatus* pStatus=NULL);

		/** Returns the default camera name.
		* \return The default camera name, or returns an empty string if no camera name has been specified. */
		const char* GetDefaultCamera() const;

		//! Restores the default settings.
		void RestoreDefaultSettings();

		/** Sets the default viewing mode.
		* \param pViewingMode Viewing mode to set(eStandard, eXRay or eModelsOnly). */
		void SetDefaultViewingMode(EViewingMode pViewingMode);

		/** Returns the default viewing mode.
		* \return The currently set Viewing mode. */
		EViewingMode GetDefaultViewingMode() const;
	//@}

	/** \name Producer Cameras
	* Producer cameras are global cameras in MotionBuilder you use to view the scene.
	* You cannot animate Producer cameras but you can specify their default positions. */
	//@{
		/** Creates the default Producer cameras. */
		void CreateProducerCameras();

		/** Destroys the default Producer cameras. */
		void DestroyProducerCameras();

		/** Checks if the camera is a Producer camera.
		* \param pCamera The camera to check.
		* \return \c True if it is a producer camera, returns \c false if it is not a producer camera. */
		bool IsProducerCamera(FbxCamera* pCamera) const;

		/** Returns a reference to the Producer perspective camera.
		* \return The reference to the internal Perspective camera. */
		FbxCamera* GetCameraProducerPerspective() const;

		/** Returns a reference to the Producer front camera.
		* \return The reference to the internal Front camera. */
		FbxCamera* GetCameraProducerFront() const;

		/** Returns a reference to the Producer back camera.
		* \return The reference to the internal Back camera. */
		FbxCamera* GetCameraProducerBack() const;

		/** Returns a reference to the Producer left camera.
		* \return The reference to the internal Left camera. */
		FbxCamera* GetCameraProducerLeft() const;

		/** Returns a reference to the Producer right camera.
		* \return The reference to the internal Right camera. */
		FbxCamera* GetCameraProducerRight() const;

		/** Returns a reference to the Producer top camera.
		* \return The reference to the internal Top camera. */
		FbxCamera* GetCameraProducerTop() const;

		/** Returns a reference to the Producer bottom camera.
		* \return The reference to the internal Bottom camera. */
		FbxCamera* GetCameraProducerBottom() const;

		/** Returns the Camera Switcher.
		* \return A pointer to the Camera Switcher.
		* \remark This node has a \c FbxNodeAttribute::eCameraSwitcher node attribute type. This node is not saved when there is no camera in the scene. Nodes inserted below are never saved.
		* Camera indices start at 1. Out of range indices are clamped between 1 and the number of cameras in the scene. The index of a camera refers to its order of appearance when searching
		* the node tree depth first. If a camera is added or removed after camera indices have been set, the camera indices must be updated. It is easier to set camera indices once every camera
		* have been set. Camera index keys must be set using constant interpolation to ensure that camera switches occur exactly at key time. */
		FbxCameraSwitcher* GetCameraSwitcher() const;

		/** Sets the Camera Switcher.
		* \param pSwitcher The Camera Switcher to be set. */
		void SetCameraSwitcher(FbxCameraSwitcher* pSwitcher);
	//@}

    /** Assignment operator.
	* \param pGlobalCameraSettings FbxGlobalCameraSettings object assigned to this one. */
    const FbxGlobalCameraSettings& operator=(const FbxGlobalCameraSettings& pGlobalCameraSettings);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    bool CopyProducerCamera(const char* pCameraName, const FbxCamera* pCamera) const;

private:
    FbxGlobalCameraSettings(FbxManager& pManager, FbxScene& pScene);
    ~FbxGlobalCameraSettings();

	FbxScene*			mScene;
    FbxString			mDefaultCamera;
    EViewingMode		mDefaultViewingMode;
    FbxCamera*			mCameraPerspective;
    FbxCamera*			mCameraFront;
    FbxCamera*			mCameraBack;
    FbxCamera*			mCameraLeft;
    FbxCamera*			mCameraRight;
    FbxCamera*			mCameraTop;
    FbxCamera*			mCameraBottom;
    FbxCameraSwitcher*	mCameraSwitcher;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_GLOBAL_CAMERA_SETTINGS_H_ */
