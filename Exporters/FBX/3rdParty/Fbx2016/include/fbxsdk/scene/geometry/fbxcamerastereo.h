/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcamerastereo.h
#ifndef _FBXSDK_SCENE_GEOMETRY_CAMERA_STEREO_H_
#define _FBXSDK_SCENE_GEOMETRY_CAMERA_STEREO_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxcamera.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This node attribute contains methods for accessing the properties of a stereo camera.
  * \nosubgrouping
  * Generally, a set of stereoRig contains the center camera, the left camera and the right camera.
  * FbxCameraStereo is used to represent the center camera. The left and right camera could be FbxCamera.
  * FbxCameraStereo contains stereo properties.
  * The left and right camera can also be get and set via related methods in FbxCameraStereo class.
  * \see FbxCamera and FbxCameraSwitcher.
  */
class FBXSDK_DLL FbxCameraStereo : public FbxCamera
{
    FBXSDK_OBJECT_DECLARE(FbxCameraStereo, FbxCamera);

public:
    //! Return the type of node attribute which is EType::eCameraStereo.
    virtual FbxNodeAttribute::EType GetAttributeType() const;

    //! Reset the stereo camera to default values.
    void Reset();

    /** Types of Stereo camera.
      */
    enum EStereoType
    {
        eNone,		//!< Disable the stereo effect.(Default value)
        eConverged,	//!< Computes the zero parallax plane by toeing in the cameras.
        eOffAxis,	//!< Computes the convergence plane by shifting the frustum using camera film back.
        eParallel	//!< A parallel camera setup where there is effectively no convergence plane.
    };

    /** Get the left camera which connect to property LeftCamera.
      * \return   A pointer to FbxCamera.
      * \remarks  Current FbxCameraStereo should work with two FbxCamera, left camera and right camera.
      * Use this method to get the left camera.
      */
    FbxCamera* GetLeftCamera() const;

    /** Get the right camera which connect to property RightCamera.
      * \return   A pointer to FbxCamera.
      * \remarks  Current FbxCameraStereo should work with two FbxCamera, left camera and right camera.
      * Use this method to get the right camera.
      */
    FbxCamera* GetRightCamera() const;

    /** Set the left camera, connect property LeftCamera to pCamera.
	  * \param pCamera The camera to set.
      * \return        \c true if it's successful, \c false otherwise.
      * \remarks Current FbxCameraStereo should work with two FbxCamera, left camera and right camera.
      * Use this method to set the left camera.
      */
    bool SetLeftCamera(FbxCamera* pCamera);

    /** Set the right camera, connect property RightCamera to pCamera.
	  * \param pCamera The camera to set.
      * \return        \c true if it's successful, \c false otherwise.
      * \remarks Current FbxCameraStereo should work with two FbxCamera, left camera and right camera.
      * Use this method to set the right camera.
      */
    bool SetRightCamera(FbxCamera* pCamera);

    /** Get the local transformation matrix of left camera.
      * \return The local transformation matrix of left camera.
      * \remarks Use this method to reevaluate the local transformation of left camera.
      */
    FbxAMatrix GetLeftCameraLocalMatrix() const;

    /** Get the global matrix of left camera.
      * \return The global transformation matrix of left camera.
      * \remarks Use this method to reevaluate the global transformation of left camera.
      */
    FbxAMatrix GetLeftCameraGlobalMatrix() const;

    /** Get the local transformation matrix of right camera.
      * \return The local transformation matrix of right camera..
      * \remarks Use this method to reevaluate the local transformation of right camera.
      */
    FbxAMatrix GetRightCameraLocalMatrix() const;

    /** Get the global transformation matrix of right camera.
      * \return The global transformation matrix of right camera.
      * \remarks Use this method to reevaluate the global transformation of right camera.
      */
    FbxAMatrix GetRightCameraGlobalMatrix() const;

    /** Reevaluate the FilmOffsetX of left camera.
      * It's computed through stereo camera properties.
      * \return Current FilmOffsetX value.
      * \remarks This method does not set the FilmOffsetX of left camera.
      */
    double ReevaluateLeftCameraFilmOffsetX() const;

    /** Reevaluate the FilmOffsetX of right camera.
      * It's computed through stereo camera properties.
      * \return Current FilmOffsetX value.
      * \remarks this method does not set the FilmOffsetX of right camera
      */
    double ReevaluateRightCameraFilmOffsetX() const;

    //////////////////////////////////////////////////////////////////////////
    //
    // Properties
    //
    //////////////////////////////////////////////////////////////////////////

    // -----------------------------------------------------------------------
    // Stereo and Stereo Adjustments
    // -----------------------------------------------------------------------

    /** This property handles the types of Stereo camera.
      *
      * To access this property do: Stereo.Get().
      * To set this property do: Stereo.Set(EStereoType).
      *
      * \remarks Default Value is eNone.
      */
    FbxPropertyT<EStereoType>                    Stereo;

    /** This property handles the distance between left and right cameras.
      *
      * To access this property do: InteraxialSeparation.Get().
      * To set this property do: InteraxialSeparation.Set(FbxDouble).
      *
      * \remarks Default Value is 0.0.
      */
    FbxPropertyT<FbxDouble>                       InteraxialSeparation;

    /** This property handles the distance on the camera view axis where the zero parallax plane occurs.
      *
      * To access this property do: ZeroParallax.Get().
      * To set this property do: ZeroParallax.Set(FbxDouble).
      *
      * \remarks Default Value is 0.0.
      */
    FbxPropertyT<FbxDouble>                       ZeroParallax;

    /** This property is to offset the computed toe-in effect when it's in Converged mode.
      *
      * To access this property do: ToeInAdjust.Get().
      * To set this property do: ToeInAdjust.Set(FbxDouble).
      *
      * \remarks Default Value is 0.0. 
      * This value is specified in degrees and acts as an offset to the computed toe-in.
	  * \see EStereoType.
      */
    FbxPropertyT<FbxDouble>                       ToeInAdjust;

    /** This property handles the film offset for the right camera.
      *
      * To access this property do: FilmOffsetRightCam.Get().
      * To set this property do: FilmOffsetRightCam.Set(FbxDouble).
      *
      * \remarks Default Value is 0.0.
      */
    FbxPropertyT<FbxDouble>                       FilmOffsetRightCam;

    /** This property handles the film offset for the left camera.
      *
      * To access this property do: FilmOffsetLeftCam.Get().
      * To set this property do: FilmOffsetLeftCam.Set(FbxDouble).
      *
      * \remarks Default Value is 0.0.
      */
    FbxPropertyT<FbxDouble>                       FilmOffsetLeftCam;

    /** This property has the right camera connected to it.
      *
      * To access this property do: GetRightCamera().
      * To set this property do: SetRightCamera(FbxCamera* pCamera).
      *
      * \remarks The right camera is connected as source object.
      */
    FbxPropertyT<FbxReference>                     RightCamera;

    /** This property has the left camera connected to it.
      *
      * To access this property do: GetLeftCamera().
      * To set this property do: SetLeftCamera(FbxCamera* pCamera).
      *
      * \remarks The left camera is connected as source object.
      */
    FbxPropertyT<FbxReference>                     LeftCamera;

    /** This property handles the precomp file name
    *
    * To access this property do: PrecompFileName.Get().
    * To set this property do: PrecompFileName.Set(FbxString).
    *
    * Default value is ""
    */
    FbxPropertyT<FbxString>                        PrecompFileName;

    /** This property handles the relative precomp file name
    *
    * To access this property do: RelativePrecompFileName.Get().
    * To set this property do: RelativePrecompFileName.Set(FbxString).
    *
    * Default value is ""
    */
    FbxPropertyT<FbxString>                        RelativePrecompFileName;

    /** connect left and right camera property to stereo camera.
    * \return true if it's successful, otherwise return false.
    * \remarks It's used to connect the left/right camera property [FocalLength, FarPlane, NearPlane, FilmWidth,
    * FilmHeight, FilmSqueezeRatio] to stereo camera.
    * During FBX SDK reevaluating, if ConnectProperties is called, 
    * to get the newest FocalLength property of left camera, please use lLeft_Camera->FocalLength.GetSrcProperty();
    */
    bool ConnectProperties();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual void ConstructProperties(bool pForceSet);

    virtual FbxStringList GetTypeFlags() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxCameraStereo::EStereoType&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_CAMERA_STEREO_H_ */
