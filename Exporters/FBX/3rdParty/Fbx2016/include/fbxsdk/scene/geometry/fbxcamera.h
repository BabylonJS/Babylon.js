/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcamera.h
#ifndef _FBXSDK_SCENE_GEOMETRY_CAMERA_H_
#define _FBXSDK_SCENE_GEOMETRY_CAMERA_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>
#include <fbxsdk/core/math/fbxvector4.h>
#include <fbxsdk/scene/geometry/fbxnodeattribute.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxTexture;

/** This node attribute contains methods for accessing the properties of a camera.
  * \nosubgrouping
  * A camera can be set to automatically point at and follow
  * another node in the hierarchy. To do this, the focus source
  * must be set to EFocusDistanceSource::eFocusSrcCameraInterest and the
  * followed node associated with function FbxNode::SetTarget().
  * \see FbxCameraStereo and FbxCameraSwitcher.
  */
class FBXSDK_DLL FbxCamera : public FbxNodeAttribute
{
    FBXSDK_OBJECT_DECLARE(FbxCamera,FbxNodeAttribute);

public:
    //! Return the type of node attribute which is EType::eCamera.
    virtual FbxNodeAttribute::EType GetAttributeType() const;

    //! Reset the camera to default values.
    void Reset();

    /** Camera projection types.
      * \remarks     By default, the camera projection type is set to ePerspective.
      *              If the camera projection type is set to eOrthogonal, the following options
      *              are not relevant:
      *                   - aperture format
      *                   - aperture mode
      *                   - aperture width and height
      *                   - angle of view/focal length
      *                   - squeeze ratio
      */
    enum EProjectionType
    {
        ePerspective,	//!< Perspective projection.
        eOrthogonal		//!< Orthogonal projection.
    };

	/**
      * \name Functions to handle the viewing area.
      */
    //@{
        /** Camera formats identifiers.
		  * \remarks This is designed as the same as in MotionBuilder.
		  * \see SetFormat, GetFormat and CameraFormat.
          */
        enum EFormat
        {
            eCustomFormat,	//!< The format's width, height, or pixel ratio has been user-specified, and matches none of the other picture formats.
            eD1NTSC,		//!< Standard format for D1 NTSC (720 by 486).
            eNTSC,			//!< NTSC standard for North American television broadcast (640 by 480).
            ePAL,			//!< PAL standard for European television broadcast (570 by 486).
            eD1PAL,			//!< Standard format for D1 PAL (720 by 576).
            eHD,			//!< HD format(1920 by 1080).
            e640x480,		//!< Recommended computer screen format (640 by 480).
            e320x200,		//!< Recommended format for World Wide Web production(320 by 200).
            e320x240,		//!< Alternate World Wide Web format(320 by 240).
            e128x128,		//!< Format(128 by 128)
            eFullscreen		//!< Full computer screen format (1280 by 1024 pixels).
        };

        /** Set the camera format.
          * \param pFormat     The camera format identifier.
          * \remarks           Changing the camera format sets the camera aspect
          *                    ratio mode to eFixedResolution and modifies the aspect width
          *                    size, height size, and pixel ratio accordingly.
          */
        void SetFormat(EFormat pFormat);

        /** Get the camera format.
          * \return     The current camera format identifier.
          */
        EFormat GetFormat() const;

        /** Camera's aspect ratio modes.
		  * \see SetAspect, GetAspectRatioMode, AspectWidth, AspectHeight and AspectRatioMode.
          */
        enum EAspectRatioMode
        {
            eWindowSize,		//!< Both width and height values aren't relevant.
            eFixedRatio,		//!< The height value is set to 1.0 and the width value is relative to the height value.
            eFixedResolution,	//!< Both width and height values are in pixels.
            eFixedWidth,		//!< The width value is in pixels and the height value is relative to the width value.
            eFixedHeight		//!< The height value is in pixels and the width value is relative to the height value.
        };

        /** Set the camera's aspect ratio mode.
          * \param pRatioMode     Camera's aspect ratio mode.
          * \param pWidth         Camera's aspect width, must be a positive value.
          * \param pHeight        Camera's aspect height, must be a positive value.
          * \remarks              Changing the camera aspect sets the camera format to eCustomFormat.
		  * \see EAspectRatioMode.
          */
        void SetAspect(EAspectRatioMode pRatioMode, double pWidth, double pHeight);

        /** Get the camera aspect ratio mode.
          * \return     The current aspect ratio mode.
          */
        EAspectRatioMode GetAspectRatioMode() const;

        /** Set the pixel ratio.
          * \param pRatio     The pixel ratio value.
          * \remarks          The value must be a positive number. Comprised between 0.05 and 20.0. Values
          *                   outside these limits will be clamped. Changing the pixel ratio sets the camera format to eCustomFormat.
          */
        void SetPixelRatio(double pRatio);

        /** Get the pixel ratio.
          * \return     The current camera's pixel ratio value.
          */
        double GetPixelRatio() const;

        /** Set the near plane distance from the camera.
          * The near plane is the minimum distance to render a scene on the camera display.
	      * A synonym for the near plane is "front clipping plane".
          * \param pDistance     The near plane distance value.
          * \remarks             The near plane value is limited to the range [0.001, 600000.0] and
          *                      must be inferior to the far plane value.
          */
        void SetNearPlane(double pDistance);

        /** Get the near plane distance from the camera.
          * The near plane is the minimum distance to render a scene on the camera display.
	      * A synonym for the near plane is "front clipping plane".
          * \return     The near plane value.
          */
        double GetNearPlane() const;

        /** Set the far plane distance from camera.
          * The far plane is the maximum distance to render a scene on the camera display.
	      * A synonym for the far plane is "back clipping plane".
          * \param pDistance     The far plane distance value.
          * \remarks             The far plane value is limited to the range [0.001, 600000.0] and
          *                      must be superior to the near plane value.
          */
        void SetFarPlane(double pDistance);

        /** Get the far plane distance from camera.
          * The far plane is the maximum distance to render a scene on the camera display.
	      * A synonym for the far plane is "back clipping plane".
          * \return     The far plane value.
          */
        double GetFarPlane() const;

    //@}

    /**
      * \name Aperture and Film Functions.
	  * In photography, the aperture is the size of hole allowing light from the lens to get through to the film. 
      * The aperture mode determines which values drive the camera aperture. When the aperture mode is \e eHorizAndVert,
      * \e eHorizontal or \e eVertical, the field of view is used. When the aperture mode is \e eFocalLength, the focal length is used.
      *
      * It is possible to convert the aperture mode into field of view or vice versa using functions ComputeFieldOfView and
      * ComputeFocalLength. These functions use the camera aperture width and height for their computation.
      */
    //@{

    /** Camera's aperture formats.
   	  * \remarks This is designed as the same as in MotionBuilder.
	  * \see SetApertureFormat, GetApertureFormat, FilmFormat, FilmWidth, FilmHeight, FilmSqueezeRatio and FilmAspectRatio.
      */
    enum EApertureFormat
    {
		eCustomAperture,	//!< The film size, squeeze ratio and aspect ratio has been user-specified, and matches none of the other aperture formats.
        e16mmTheatrical,	//!< Film Size: 0.404, 0.295 inches. Film Squeeze Ratio: 1.0. Film Aspect Ratio: 1.369.
        eSuper16mm,			//!< Film Size: 0.493, 0.292 inches. Film Squeeze Ratio: 1.0. Film Aspect Ratio: 1.688.
        e35mmAcademy,		//!< Film Size: 0.864, 0.630 inches. Film Squeeze Ratio: 1.0. Film Aspect Ratio: 1.371. 
        e35mmTVProjection,	//!< Film Size: 0.816, 0.612 inches. Film Squeeze Ratio: 1.0. Film Aspect Ratio: 1.333.
        e35mmFullAperture,	//!< Film Size: 0.980, 0.735 inches. Film Squeeze Ratio: 1.0. Film Aspect Ratio: 1.333.
        e35mm185Projection,	//!< Film Size: 0.825, 0.446 inches. Film Squeeze Ratio: 1.0. Film Aspect Ratio: 1.850.
        e35mmAnamorphic,	//!< Film Size: 0.864, 0.732 inches. Film Squeeze Ratio: 2.0. Film Aspect Ratio:1.180. 
        e70mmProjection,	//!< Film Size: 2.066, 0.906 inches. Film Squeeze Ratio: 1.0. Film Aspect Ratio: 2.280.
        eVistaVision,		//!< Film Size: 1.485, 0.991 inches. Film Squeeze Ratio: 1.0. Film Aspect Ratio: 1.498.
        eDynaVision,		//!< Film Size: 2.080, 1.480 inches. Film Squeeze Ratio: 1.0. Film Aspect Ratio: 1.405.
        eIMAX				//!< Film Size: 2.772, 2.072 inches. Film Squeeze Ratio: 1.0. Film Aspect Ratio: 1.338.
    };

    /** Set the camera aperture format.
      * \param pFormat     The camera aperture format identifier.
      * \remarks           Changing the aperture format modifies the aperture width, height, and squeeze ratio accordingly.
      */
    void SetApertureFormat(EApertureFormat pFormat);

    /** Get the camera aperture format.
      * \return     The camera's current aperture format identifier.
      */
    EApertureFormat GetApertureFormat() const;

    /** Camera aperture modes. 
      * The aperture mode determines which values drive the camera aperture. 
	  * If the aperture mode is \e eHorizAndVert, \e eHorizontal, or \e eVertical, then the field of view is used. 
	  * If the aperture mode is \e eFocalLength, then the focal length is used.
      */
    enum EApertureMode
    {
		eHorizAndVert,	//!< Set the angle values for both the horizontal and vertical settings. 
        eHorizontal,	//!< Set only the horizontal angle. 
        eVertical,		//!< Set only the vertical angle. 
        eFocalLength	//!< Use focal length directly. 
    };

    /** Set the camera aperture mode.
      * \param pMode     The camera aperture mode identifier.
      */
    void SetApertureMode(EApertureMode pMode);

    /** Get the camera aperture mode.
      * \return     The camera's current aperture mode identifier.
      */
    EApertureMode GetApertureMode() const;

    /** Set the camera aperture width in inches.
      * \param pWidth     The aperture width value.
      * \remarks          Must be a positive value. The minimum accepted value is 0.0001.
      *                   Changing the aperture width sets the camera aperture format to eCustomFormat.
      */
    void SetApertureWidth(double pWidth);

    /** Get the camera aperture width in inches.
      * \return     The camera's current aperture width value in inches.
      */
    double GetApertureWidth() const;

    /** Set the camera aperture height in inches.
      * \param pHeight     The aperture height value.
      * \remarks           Must be a positive value. The minimum accepted value is 0.0001.
      *                    Changing the aperture height sets the camera aperture format to eCustomFormat.
      */
    void SetApertureHeight(double pHeight);

    /** Get the camera aperture height in inches.
      * \return     The camera's current aperture height value in inches.
      */
    double GetApertureHeight() const;

    /** Set the squeeze ratio.
      * \param pRatio      The squeeze ratio value.
      * \remarks           Must be a positive value. The minimum accepted value is 0.0001.
      *                    Changing the squeeze ratio sets the camera aperture format to eCustomFormat.
      */
    void SetSqueezeRatio(double pRatio);

    /** Get the camera squeeze ratio.
      * \return     The camera's current squeeze ratio value.
      */
    double GetSqueezeRatio() const;

    /** Camera's gate fit modes. 
	  * There are two gates for a camera, film gate and resolution gate.
	  * Film gate is a border indicating the area of the camera's view as a real-world camera records on film. 
	  * The dimensions of the film gate represent the dimensions of the camera aperture. 
	  * But the film gate does not represent the render region.
	  * It is the resolution gate that represents the rendering resolution. 
	  * The gate fit mode controls the size of the resolution gate relative to the film gate. 
      */
    enum EGateFit
    {
        eFitNone,		//!< No resolution gate fit.
        eFitVertical,	//!< Fit the resolution gate vertically within the film gate.
        eFitHorizontal,	//!< Fit the resolution gate horizontally within the film gate.
        eFitFill,		//!< Fit the resolution gate within the film gate.
        eFitOverscan,	//!< Fit the film gate within the resolution gate.
        eFitStretch		//!< Fit the resolution gate to the film gate.
    };

    /** Compute the angle of view based on the given focal length, the aperture width, and aperture height.
      * \param pFocalLength     The focal length in millimeters.
      * \return                 The computed angle of view in degrees.
	  * \remark					If aperture mode is not vertical, horizontal is assumed.
      */
    double ComputeFieldOfView(double pFocalLength) const;

    /** Compute the focal length based on the given angle of view, the aperture width, and aperture height.
      * \param pAngleOfView     The angle of view in degrees.
      * \return                 The computed focal length in millimeters.
	  * \remark					If aperture mode is not vertical, horizontal is assumed.
      */
    double ComputeFocalLength(double pAngleOfView) const;

    /** Specifies how the roll is applied with respect to the pivot value.
      */
    enum EFilmRollOrder
    {
        eRotateFirst,	//!< The film back is first rotated then translated by the pivot point value.
        eTranslateFirst	//!< The film back is first translated then rotated by the film roll value.
    };

    //@}

    /**
      * \name Functions to handle BackPlane/FrontPlane and Plate.
	  * 
	  * In the FbxSdk terminology, the Back/Front plane is the support of the plate. And the plate is
	  * the support of the texture used for backgrounds/foregrounds. Functions and properties 
	  * identified by the "Plate" name are affecting the display of the texture on the plate. 
	  * The functions and properties identified with the "Back/FrontPlane" are affecting the plate.
	  *
	  * Typically a client application would place the BackPlate a small distance in front of the 
	  * FarPlane and the FrontPlate just behind the NearPlane to avoid them to be hidden by the clipping.
	  * Unless otherwise noted, there are no restrictions on the values stored by the camera object
	  * therefore it is the responsibility of the client application to process the information in a 
	  * meaningful way and to maintain consistency between the different properties relationships.
      */
    //@{

    /** Set the associated background image file.
      * \param pFileName     The path of the background image file.
      * \remarks             The background image file name must be valid.
	  * \remarks             This method is still provided just for legacy files (Fbx version 5.0 and earlier)
	  *                      and must not be used in any other cases.
      */
    void SetBackgroundFileName(const char* pFileName);

    /** Get the background image file name.
      * \return     Pointer to the background filename string or \c NULL if not set.
	  * \remarks             This method is still provided just for legacy files (Fbx version 5.0 and earlier)
	  *                      and must not be used in any other cases.
      */
    const char* GetBackgroundFileName() const;

    /** Set the media name associated to the background image file.
      * \param pFileName     The media name of the background image file.
      * \remarks             The media name is a unique name used to identify the background image file.
	  * \remarks             This method is still provided just for legacy files (Fbx version 5.0 and earlier)
	  *                      and must not be used in any other cases.
      */
    void SetBackgroundMediaName(const char* pFileName);

    /** Get the media name associated to the background image file.
      * \return     Pointer to the media name string or \c NULL if not set.
	  * \remarks             This method is still provided just for legacy files (Fbx version 5.0 and earlier)
	  *                      and must not be used in any other cases.
      */
    const char* GetBackgroundMediaName() const;

    /** Set the associated foreground image file.
    * \param pFileName     The path of the foreground image file.
    * \remarks             The foreground image file name must be valid.
    * \remarks             This method is still provided just for legacy files (Fbx version 5.0 and earlier)
    *                      and must not be used in any other cases.
    */
    void SetForegroundFileName(const char* pFileName);

    /** Get the foreground image file name.
    * \return     Pointer to the foreground filename string or \c NULL if not set.
    * \remarks             This method is still provided just for legacy files (Fbx version 5.0 and earlier)
    *                      and must not be used in any other cases.
    */
    const char* GetForegroundFileName() const;

    /** Set the media name associated to the foreground image file.
    * \param pFileName     The media name of the foreground image file.
    * \remarks             The media name is a unique name used to identify the foreground image file.
    * \remarks             This method is still provided just for legacy files (Fbx version 5.0 and earlier)
    *                      and must not be used in any other cases.
    */
    void SetForegroundMediaName(const char* pFileName);

    /** Get the media name associated to the foreground image file.
    * \return     Pointer to the media name string or \c NULL if not set.
    * \remarks             This method is still provided just for legacy files (Fbx version 5.0 and earlier)
    *                      and must not be used in any other cases.
    */
    const char* GetForegroundMediaName() const;

	
	/** Image plate drawing modes.
      */
    enum EPlateDrawingMode
    {
        ePlateBackground,	//!< Image is drawn behind models.
        ePlateForeground,	//!< Image is drawn in front of models based on alpha channel.
        ePlateBackAndFront	//!< Image is drawn behind and in front of models depending on alpha channel.
    };

	/** Set front plate matte threshold.
      * \param pThreshold     Threshold value on a range from 0.0 to 1.0.
      * \remarks              This option is only relevant if the image plate drawing mode is set to ePlateForeground or ePlateBackAndFront.
      */
    void SetBackgroundAlphaTreshold(double pThreshold);

    /** Get front plate matte threshold.
      * \return      Threshold value on a range from 0.0 to 1.0.
      * \remarks     This option is only relevant if the image plate drawing mode is set to ePlateForeground or ePlateBackAndFront.
      */
    double GetBackgroundAlphaTreshold() const;

	/** Change the back plate fit image flag.
	  * If this flag is on, scale the back plate image to fit on the back plane. 
      * \param pFitImage    New value for the BackPlateFitImage property.
      */
    void SetBackPlateFitImage(bool pFitImage);

    /** Get the current back plate image flag.
   	  * If this flag is on, scale the back plate image to fit on the back plane. 
      * \return             The value of the BackPlateFitImage property.
      */
    bool GetBackPlateFitImage() const;

    /** Change the back plate crop flag.
	  * If this flag is on, crop the back plate image to fit on the back plane. 
	  * If the image is smaller than the plane, this flag has no effect.
      * \param pCrop          New value for the BackPlateCrop property.
      */
    void SetBackPlateCrop(bool pCrop);

    /** Get the current back plate crop flag.
	  * If this flag is on, crop the back plate image to fit on the back plane. 
	  * If the image is smaller than the plane, this flag has no effect.
      * \return               The value of the BackPlateCrop property.
      */
    bool GetBackPlateCrop() const;

    /** Change the back plate center flag.
	  * If this flag is on, center the back plate image on the back plane.
      * \param pCenter        New value for the BackPlateCenter property.
      */
    void SetBackPlateCenter(bool pCenter);

    /** Get the current back plate center flag.
	  * If this flag is on, center the back plate image on the back plane.
      * \return               The value of the BackPlateCenter property.
      */
    bool GetBackPlateCenter() const;

    /** Change the back plate keep ratio flag.
	  * If this flag is on, keep the aspect ratio of the back plate image. 
	  * Turn on both the keep ration flag and the fit image flag to scale the back plate image proportionately.
      * \param pKeepRatio     New value for the BackPlateKeepRatio property.
      */
    void SetBackPlateKeepRatio(bool pKeepRatio);

    /** Get the current back plate keep ratio flag.
	  * If this flag is on, keep the aspect ratio of the back plate image. 
	  * Turn on both the keep ration flag and the fit image flag to scale the back plate image proportionately.
      * \return               The value of the BackPlateKeepRatio property.
      */
    bool GetBackPlateKeepRatio() const;

	/** Enable or disable the display of the texture without the need to disconnect it from its plate.
      * \param pEnable     If \c true the texture is displayed, \c false otherwise.
      * \remarks           It is the responsibility of the client application to perform the required tasks according to the state
      *                    of this flag.
      */
    void SetShowFrontPlate(bool pEnable);

	/** Get the current state of the flag to display the front plate or not.
      * \return            \c true if show front plate is enabled, otherwise \c false.
      * \remarks           It is the responsibility of the client application to perform the required tasks according to the state
      *                    of this flag.
      */
    bool GetShowFrontPlate() const;
 
	/** Change the front plate fit image flag.
	  * If this flag is on, scale the front plate image to fit on the front plane. 
      * \param pFrontPlateFitImage	  New value for the FrontPlateFitImage property.
      */
    void SetFrontPlateFitImage(bool pFrontPlateFitImage);

    /** Get the current front plate fit image flag.
	  * If this flag is on, scale the front plate image to fit on the front plane. 
      * \return               The value of the BackPlateFitImage property.
      */
    bool GetFrontPlateFitImage() const;

    /** Change the front plate crop flag.
	  * If this flag is on, crop the front plate image to fit on the front plane. 
	  * If the image is smaller than the plane, this flag has no effect.
      * \param pFrontPlateCrop          New value for the FrontPlateCrop property.
      */
    void SetFrontPlateCrop(bool pFrontPlateCrop);

    /** Get the current front plate crop flag.
	  * If this flag is on, crop the front plate image to fit on the front plane. 
	  * If the image is smaller than the plane, this flag has no effect.
      * \return               The value of the FrontPlateCrop property.
      */
    bool GetFrontPlateCrop() const;

    /** Change the front plate center flag.
	  * If this flag is on, center the front plate image on the front plane.
      * \param pFrontPlateCenter		  New value for the FrontPlateCenter property.
      */
    void SetFrontPlateCenter(bool pFrontPlateCenter);

    /** Get the current front plate center flag.
	  * If this flag is on, center the front plate image on the front plane.
      * \return               The value of the FrontPlateCenter property.
      */
    bool GetFrontPlateCenter() const;

    /** Change the front plate keep ratio flag.
	  * If this flag is on, keep the aspect ratio of the front plate image. 
	  * Turn on both the keep ration flag and the fit image flag to scale the front plate image proportionately.
      * \param pFrontPlateKeepRatio     New value for the FrontPlateKeepRatio property.
      */
    void SetFrontPlateKeepRatio(bool pFrontPlateKeepRatio);

    /** Get the current front plate keep ratio flag.
	  * If this flag is on, keep the aspect ratio of the front plate image. 
	  * Turn on both the keep ration flag and the fit image flag to scale the front plate image proportionately.
      * \return               The value of the FrontPlateKeepRatio property.
      */
    bool GetFrontPlateKeepRatio() const;

    /** Set the front plate opacity value.
      * \param pOpacity       New value for the ForegroundOpacity property.
      */
    void SetForegroundOpacity(double pOpacity);

    /** Get the front plate opacity value.
      * \return               The value of the ForegroundOpacity property.
      */
    double GetForegroundOpacity() const;

    /** Attach the texture to the front plate.
      * \param pTexture       The pointer to the texture to attach.
      */
    void SetForegroundTexture(FbxTexture* pTexture);

    /** Get the texture connected to the front plate.
      * \return     A pointer to the texture attached to front plate.
      */
    FbxTexture* GetForegroundTexture() const;

	/** Front and BackPlane distance modes.
	  * \see SetBackPlaneDistanceMode and GetBackPlaneDistanceMode.
      */
    enum EFrontBackPlaneDistanceMode
    {
        eRelativeToInterest,	//!< The back plane distance is measured in relation to the camera interest.
        eRelativeToCamera		//!< The back plane distance is measured in relation to the camera.
    };

	/** Set the back plane distance mode.
      * \param pMode    The back plane distance mode to set.
      */
    void SetBackPlaneDistanceMode(EFrontBackPlaneDistanceMode pMode);

    /** Get the back plane distance mode.
      * \return     Return the back plane distance mode.
      */
    EFrontBackPlaneDistanceMode GetBackPlaneDistanceMode() const;

	/** Set the front plane distance from the camera. The the absolute position of the plane must be calculated
	  * by taking into consideration of the FrontPlaneDistanceMode.
      * \param pDistance    The front plane distance value.
	  * \remarks			It is the responsibility of the client application to ensure that this plane position is 
	  *                     within the frustum boundaries.
      */
    void SetFrontPlaneDistance(double pDistance);

    /** Get the front plane distance value.
      * \return double      The front plane distance value.
      */
    double GetFrontPlaneDistance() const;

    /** Set the front plane distance mode.
      * \param pMode        The front plane distance mode to set.
      */
    void SetFrontPlaneDistanceMode(EFrontBackPlaneDistanceMode pMode);

    /** Get the front plane distance mode flag.
      * \return     The front plane distance mode.
      */
    EFrontBackPlaneDistanceMode GetFrontPlaneDistanceMode() const;

    /** Front/back plane display modes.
      */
    enum EFrontBackPlaneDisplayMode
    {
        ePlanesDisabled,	//!< Disables the front/back plane whether a texture is being projected or not.
        ePlanesAlways,		//!< Always shows the front/back plane, even if no texture has been added.
        ePlanesWhenMedia	//!< Shows the front/back plane only if a texture has been added.
    };
	
    /** Set the front plane display mode. This mode can be used by the client application to
	  * decide under which circumstance the front plane should be drawn in the viewport.
      * \param pMode        The front/back plane display mode.
      */
    void SetViewFrustumFrontPlaneMode(EFrontBackPlaneDisplayMode pMode);

    /** Get the front plane display mode.
      * \return     The front/back plane display mode.
      */
    EFrontBackPlaneDisplayMode GetViewFrustumFrontPlaneMode() const;

    /** Set the back plane display mode. This mode can be used by the client application to
	  * decide under which circumstance the back plane should be drawn in the viewport.
      * \param pMode        The front/back plane display mode.
      */
    void SetViewFrustumBackPlaneMode(EFrontBackPlaneDisplayMode pMode);

    /** Get the back plane display mode.
      * \return     The front/back plane display mode.
      */
    EFrontBackPlaneDisplayMode GetViewFrustumBackPlaneMode() const;
    
    //@}

    /**
      * \name Camera View Functions
      * It is the responsibility of the client application to perform the required tasks according to the state
      * of the options that are either set or returned by these methods.
      */
    //@{

    /** Change the camera interest visibility flag.
      * \param pEnable     Set to \c true if the camera interest is shown, \c false otherwise.
      */
    void SetViewCameraInterest(bool pEnable);

    /** Get current visibility state of the camera interest.
      * \return     \c true if the camera interest is shown, or \c false if hidden.
      */
    bool GetViewCameraInterest() const;

	/** Change the camera near and far planes visibility flag.
      * \param pEnable      Set to \c true if the near and far planes are shown, \c false otherwise.
      */
    void SetViewNearFarPlanes(bool pEnable);

    /** Get current visibility state of the camera near and far planes.
      * \return     \c true if the near and far planes are shown, \c false otherwise.
      */
    bool GetViewNearFarPlanes() const;

    /** Camera safe area display styles.
      */
    enum ESafeAreaStyle
    {
		eSafeAreaRound,	//!< Rounded safe area.
        eSafeAreaSquare	//!< Square safe area.
    };

    //@}

    /**
      * \name Render Functions
      * It is the responsibility of the client application to perform the required tasks according to the state
      * of the options that are either set or returned by these methods.
      */
    //@{

    /** Render options usage time.
      */
    enum ERenderOptionsUsageTime
    {
        eInteractive,	//!< To render in real time.
        eOnDemand		//!< Only render when it is asked.
    };

    /** Anti-aliasing methods.
      */
    enum EAntialiasingMethod
    {
        eAAOversampling,	//!< To do anti-aliasing by oversampling.
        eAAHardware			//!< To do anti-aliasing by hardware.
    };

    /** Oversampling types for anti-aliasing.
      */
    enum ESamplingType
    {
		eSamplingUniform,	/*!<	The Uniform method samples each pixel at the same location. 
									The pixel is divided into equal parts, and each part is sampled. 
									The number of samples determines the number of times the pixel is divided. */
		eSamplingStochastic	/*!<	The Stochastic method randomly samples each pixel. 
									This produces an accurate color using a small number of samples. */
    };

    /** Camera focus sources, that is the focal point for the depth of field.
	  * \see FocusDistance.
      */
    enum EFocusDistanceSource
    {
        eFocusSrcCameraInterest,	/*!<	Base the depth of field on the camera interest. Models at the camera interest are in focus. 
											As you move toward or away from the camera interest, models become increasingly blurred. */
        eFocusSpecificDistance		//!<	Base the depth of field on a point defined by a specific distance from the camera interest.
    };

    //@}

	//! \name Utility Functions.
	//@{
		/** Evaluate the camera position (eye).
		* \param pTime The time at which the camera should be evaluated.
		* \return The camera position evaluated from property value and animation. */
		FbxVector4 EvaluatePosition(const FbxTime& pTime=FBXSDK_TIME_ZERO) const;

		/** Evaluate the camera target position (look at).
		* \param pTime The time at which the camera should be evaluated.
		* \return The camera target position evaluated from property value and animation. */
		FbxVector4 EvaluateLookAtPosition(const FbxTime& pTime=FBXSDK_TIME_ZERO) const;

		/** Evaluate the camera up direction, taking target up objects into consideration.
		* \param pCameraPosition The camera current position. You can retrieve this with FbxCamera::EvaluatePosition().
		* \param pLookAtPosition The camera target position. you can retrieve this with FbxCamera::EvaluateLookAtPosition().
		* \param pTime The time at which the camera should be evaluated.
		* \return The camera up direction vector based on provided information. */
		FbxVector4 EvaluateUpDirection(const FbxVector4& pCameraPosition, const FbxVector4& pLookAtPosition, const FbxTime& pTime=FBXSDK_TIME_ZERO) const;

		/** Compute the camera projection matrix.
		* \param pWidth The width of the output frame.
		* \param pHeight The height of the output frame.
		* \param pVerticalFOV Calculate FOV vertically (based on height) if true or horizontally (based on width) if false (Note: Only applicable in perspective proj).
		* \return The camera projection matrix, or the default identity matrix in case of wrong camera parameters. */
		FbxMatrix ComputeProjectionMatrix(const int pWidth, const int pHeight, const bool pVerticalFOV = true) const;

		/** Determine if the given bounding box is in the camera's view. The input points do not need to be ordered in any particular way.
		* \param pWorldToScreen The world to screen transformation. Please refer to FbxCamera::ComputeWorldToScreen.
		* \param pWorldToCamera The world to camera transformation. Inverse of the matrix returned from FbxAnimEvaluator::GetNodeGlobalTransform is suitable.
		* Please refer to FbxScene::GetEvaluator and FbxAnimEvaluator::GetNodeGlobalTransform.
		* \param pPoints 8 corners of the bounding box.
		* \return \c true if any of the given points are in the camera's view, \c false otherwise. */
		bool IsBoundingBoxInView(const FbxMatrix& pWorldToScreen, const FbxMatrix& pWorldToCamera, const FbxVector4 pPoints[8]) const;

		/** Determine if the given 3d point is in the camera's view. 
		* \param pWorldToScreen The world to screen transformation. Please refer to FbxCamera::ComputeWorldToScreen.
		* \param pWorldToCamera The world to camera transformation. Inverse of the matrix returned from FbxAnimEvaluator::GetNodeGlobalTransform is suitable.
		* Please refer to FbxScene::GetEvaluator and FbxAnimEvaluator::GetNodeGlobalTransform.
		* \param pPoint World-space point to test.
		* \return \c true if the given point is in the camera's view, \c false otherwise. */
		bool IsPointInView(const FbxMatrix& pWorldToScreen, const FbxMatrix& pWorldToCamera, const FbxVector4& pPoint) const;

		/** Compute world space to screen space transformation matrix.
		* \param pPixelHeight The pixel height of the output image.
		* \param pPixelWidth The pixel height of the output image.
		* \param pWorldToCamera The world to camera affine transformation matrix.
		* \return The world to screen space matrix, or the identity matrix on error. */
		FbxMatrix ComputeWorldToScreen(int pPixelWidth, int pPixelHeight, const FbxAMatrix& pWorldToCamera) const;

		/** Compute screen space to world space ray direction.
		* \param pX The horizontal screen coordinate.
		* \param pY The vertical screen coordinate.
		* \param pWidth The width of the viewport in pixels.
		* \param pHeight The height of the viewport in pixels.
		* \param pTime The time to use to evaluate the camera's view matrix.
		* \return a normalized vector corresponding to the ray direction. */
		FbxVector4 ComputeScreenToWorld(float pX, float pY, float pWidth, float pHeight, const FbxTime& pTime=FBXSDK_TIME_INFINITE) const;
	//@}

    //////////////////////////////////////////////////////////////////////////
    //
    // Properties
    //
    //////////////////////////////////////////////////////////////////////////

    // -----------------------------------------------------------------------
    // Geometrical
    // -----------------------------------------------------------------------

    /** This property handles the camera's position (XYZ coordinates).
      *
      * To access this property do: Position.Get().
      * To set this property do: Position.Set(FbxDouble3).
      *
      * \remarks Default Value is (0.0, 0.0, 0.0).
      */
    FbxPropertyT<FbxDouble3>                       Position;

    /** This property handles the camera's Up Vector (XYZ coordinates).
      *
      * To access this property do: UpVector.Get().
      * To set this property do: UpVector.Set(FbxDouble3).
      *
      * \remarks Default Value is (0.0, 1.0, 0.0).
      */
    FbxPropertyT<FbxDouble3>                       UpVector;

    /** This property handles the default point (XYZ coordinates) the camera is looking at.
      *
      * To access this property do: InterestPosition.Get().
      * To set this property do: InterestPosition.Set(FbxDouble3).
      *
      * \remarks During the computations of the camera position
      * and orientation, this property is overridden by the
      * position of a valid target in the parent node.
      *
      * \remarks Default Value is (0.0, 0.0, 0.0).
      */
    FbxPropertyT<FbxDouble3>                       InterestPosition;

    /** This property handles the camera roll angle in degrees.
      *
      * To access this property do: Roll.Get().
      * To set this property do: Roll.Set(FbxDouble).
      *
      * Default value is 0.0.
      */
    FbxPropertyT<FbxDouble>                       Roll;

    /** This property handles the camera optical center X, in pixels.
      * It sets horizontal offset of the optical center.
	  * When the camera's aperture mode is set to \e eVertical, this property has no effect.
      *
      * To access this property do: OpticalCenterX.Get().
      * To set this property do: OpticalCenterX.Set(FbxDouble).
      *
      * Default value is 0.0.
      */
    FbxPropertyT<FbxDouble>                       OpticalCenterX;

    /** This property handles the camera optical center Y, in pixels.
      * It sets the vertical offset of the optical center. 
	  * When the camera's aperture mode is set to \e eHorizontal, this property has no effect.
      *
      * To access this property do: OpticalCenterY.Get().
      * To set this property do: OpticalCenterY.Set(FbxDouble).
      *
      * Default value is 0.0.
      */
    FbxPropertyT<FbxDouble>                       OpticalCenterY;

    /** This property handles the RGB values of the camera's background color.
      *
      * To access this property do: BackgroundColor.Get().
      * To set this property do: BackgroundColor.Set(FbxDouble3).
      *
      * Default value is black (0, 0, 0)
      */
    FbxPropertyT<FbxDouble3>                       BackgroundColor;

    /** When modeling 3D objects, you often need to review or evaluate your models during the creation process. 
	  * You may create a camera with turn table animation to view your models in 360 or certain degrees.
	  * This property handles the camera's turn table angle in degrees.
	  *
      * To access this property do: TurnTable.Get().
      * To set this property do: TurnTable.Set(FbxDouble).
      *
      * Default value is 0.
      */
    FbxPropertyT<FbxDouble>                       TurnTable;

    /** This property handles a flag that indicates if the camera displays the
      * Turn Table icon or not.
      *
      * To access this property do: DisplayTurnTableIcon.Get().
      * To set this property do: DisplayTurnTableIcon.Set(FbxBool).
      *
      * Default value is false (no display).
      */
    FbxPropertyT<FbxBool>                         DisplayTurnTableIcon;

    // -----------------------------------------------------------------------
    // Motion Blur
    // -----------------------------------------------------------------------

    /** This property handles a flag that indicates if the camera uses
      * motion blur or not.
      *
      * To access this property do: UseMotionBlur.Get().
      * To set this property do: UseMotionBlur.Set(FbxBool).
      *
      * Default value is false (do not use motion blur).
      */
    FbxPropertyT<FbxBool>                         UseMotionBlur;

    /** This property handles a flag that indicates if the camera uses
      * real time motion blur or not.
      *
      * To access this property do: UseRealTimeMotionBlur.Get().
      * To set this property do: UseRealTimeMotionBlur.Set(FbxBool).
      *
      * Default value is false (use real time motion blur).
      */
    FbxPropertyT<FbxBool>                         UseRealTimeMotionBlur;

    /** This property handles the camera's motion blur intensity (in pixels).
      *
      * To access this property do: MotionBlurIntensity.Get().
      * To set this property do: MotionBlurIntensity.Set(FbxDouble).
      *
      * Default value is 1.0.
      */
    FbxPropertyT<FbxDouble>                       MotionBlurIntensity;

    // -----------------------------------------------------------------------
    // Optical
    // -----------------------------------------------------------------------

    /** This property handles the camera's aspect ratio mode.
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetAspect() if you want to change its value.
      *
      * Default value is eWindowSize.
      *
      */
    FbxPropertyT<EAspectRatioMode>           AspectRatioMode;

    /** This property handles the camera's aspect width.
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetAspect() if you want to change its value.
      *
      * Default value is 320.
      */
    FbxPropertyT<FbxDouble>                       AspectWidth;

    /** This property handles the camera's aspect height.
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetAspect() if you want to change its value.
      *
      * Default value is 200.
      */
    FbxPropertyT<FbxDouble>                       AspectHeight;

    /** This property handles the pixel aspect ratio.
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetPixelRatio() if you want to change its value.
	  *
      * Default value is 1.
      * \remarks Value range is [0.050, 20.0].
      */
    FbxPropertyT<FbxDouble>                       PixelAspectRatio;

    /** This property handles the aperture mode.
      *
	  * To access this property do: ApertureMode.Get().
	  * To set this property do: ApertureMode.Set(EApertureMode).
	  *
      * Default value is eVertical.
      */
    FbxPropertyT<EApertureMode>              ApertureMode;

    /** This property handles the gate fit mode.
      * To control the size of the resolution gate relative to the film gate. 
	  * If the resolution gate and the film gate have the same aspect ratio, then the property has no effect. 
	  *
      * To access this property do: GateFit.Get().
      * To set this property do: GateFit.Set(EGateFit).
      *
      * Default value is eFitNone.
      */
    FbxPropertyT<EGateFit>                   GateFit;

    /** This property handles the field of view in degrees.
      *
      * To access this property do: FieldOfView.Get().
      * To set this property do: FieldOfView.Set(FbxDouble).
      *
      * \remarks This property has meaning only when
      * property ApertureMode equals eHorizontal or eVertical.
      *
      * \remarks Default value is 40.
      * \remarks Value range is [1.0, 179.0].
      */
    FbxPropertyT<FbxDouble>                       FieldOfView;

    /** This property handles the X (horizontal) field of view in degrees.
      *
      * To access this property do: FieldOfViewX.Get().
      * To set this property do: FieldOfViewX.Set(FbxDouble).
      *
      * \remarks This property has meaning only when
      * property ApertureMode equals eHorizAndVert.
      *
      * Default value is 1.
      * \remarks Value range is [1.0, 179.0].
      */
    FbxPropertyT<FbxDouble>                       FieldOfViewX;

    /** This property handles the Y (vertical) field of view in degrees.
      *
      * To access this property do: FieldOfViewY.Get().
      * To set this property do: FieldOfViewY.Set(FbxDouble).
      *
      * \remarks This property has meaning only when
      * property ApertureMode equals eHorizAndVert.
      *
      * \remarks Default value is 1.
      * \remarks Value range is [1.0, 179.0].
      */
    FbxPropertyT<FbxDouble>                       FieldOfViewY;

    /** This property handles the focal length (in millimeters).
      *
      * To access this property do: FocalLength.Get().
      * To set this property do: FocalLength.Set(FbxDouble).
      *
      * Default value is the result of ComputeFocalLength(40.0).
      */
    FbxPropertyT<FbxDouble>                       FocalLength;

    /** This property handles the camera's format.
      *
      * To access this property do: CameraFormat.Get().
      * To set this property do: CameraFormat.Set(EFormat).
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetFormat() if you want to change its value.
	  *
      * Default value is eCustomFormat.
      */
    FbxPropertyT<EFormat>                    CameraFormat;

    // -----------------------------------------------------------------------
    // Frame
    // -----------------------------------------------------------------------

    /** This property stores a flag that indicates to draw a border with color around the camera's viewable area or not.
      * To access this property do: UseFrameColor.Get().
      * To set this property do: UseFrameColor.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         UseFrameColor;

	/** This property is used to define the color of the border around the camera view.
      *
      * To access this property do: FrameColor.Get().
      * To set this property do: FrameColor.Set(FbxDouble3).
      *
      * Default value is (0.3, 0.3, 0.3).
      */
    FbxPropertyT<FbxDouble3>                       FrameColor;

    // -----------------------------------------------------------------------
    // On Screen Display
    // -----------------------------------------------------------------------

    /** This property handles the flag to show the camera's name or not.
      *
      * To access this property do: ShowName.Get().
      * To set this property do: ShowName.Set(FbxBool).
      *
      * Default value is true.
      */
    FbxPropertyT<FbxBool>                         ShowName;

    /** This property handles the flag to show info on moving or not.
      *
      * To access this property do: ShowInfoOnMoving.Get().
      * To set this property do: ShowInfoOnMoving.Set(FbxBool).
      *
      * Default value is true.
      */
    FbxPropertyT<FbxBool>                         ShowInfoOnMoving;

    /** This property handles the flag to draw floor grid or not.
      *
      * To access this property do: ShowGrid.Get().
      * To set this property do: ShowGrid.Set(FbxBool).
      *
      * Default value is true.
      */
    FbxPropertyT<FbxBool>                         ShowGrid;

    /** This property handles the flag to show optical center or not.
      *
      * To access this property do: ShowOpticalCenter.Get().
      * To set this property do: ShowOpticalCenter.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         ShowOpticalCenter;

    /** This property handles the flag to show the camera's sight line or not.
	  * When the camera is revolved about the center of interest in the perspective view,
	  * the angle of a camera's sight line relative to a plane perpendicular to the ground plane is referred to as its azimuth;
	  * and the angle of a camera's sight line relative to the ground plane is referred to as its elevation; 
      *
      * To access this property do: ShowAzimut.Get().
      * To set this property do: ShowAzimut.Set(FbxBool).
      *
      * Default value is true.
      */
    FbxPropertyT<FbxBool>                         ShowAzimut;

    /** This property handles the flag to show time code or not.
      *
      * To access this property do: ShowTimeCode.Get().
      * To set this property do: ShowTimeCode.Set(FbxBool).
      *
      * Default value is true.
      */
    FbxPropertyT<FbxBool>                         ShowTimeCode;

    /** This property handles the flag to show audio or not.
      *
      * To access this property do: ShowAudio.Get().
      * To set this property do: ShowAudio.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         ShowAudio;

    /** This property handles audio color.
      *
      * To access this property do: AudioColor.Get().
      * To set this property do: AudioColor.Set(FbxDouble3).
      *
      * Default value is (0.0, 1.0, 0.0).
      */
    FbxPropertyT<FbxDouble3>                       AudioColor;

    // -----------------------------------------------------------------------
    // Clipping Planes
    // -----------------------------------------------------------------------

    /** This property handles the near plane distance.
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetNearPlane() if you want to change its value.
	  *
      * Default value is 10.
      * \remarks Value range is [0.001, 600000.0].
      */
    FbxPropertyT<FbxDouble>                       NearPlane;

    /** This property handles the far plane distance.
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetFarPlane() if you want to change its value.
	  *
      * Default value is 4000.
      * \remarks Value range is [0.001, 600000.0].
      */
    FbxPropertyT<FbxDouble>                       FarPlane;

    /** This property indicates that the clip planes should be automatically computed or not.
      *
      * To access this property do: AutoComputeClipPlanes.Get().
      * To set this property do: AutoComputeClipPlanes.Set(FbxBool).
      *
      * When this property is set to true, the NearPlane and FarPlane values are
      * ignored. Note that not all applications support this flag.
      */
    FbxPropertyT<FbxBool>                         AutoComputeClipPlanes;


    // -----------------------------------------------------------------------
    // Camera Film Setting
    // -----------------------------------------------------------------------

    /** This property handles the film aperture width (in inches).
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetApertureWidth()
      * or SetApertureFormat() if you want to change its value.
	  *
      * Default value is 0.8160.
      * \remarks Value range is [0.0001, +inf).
      */
    FbxPropertyT<FbxDouble>                       FilmWidth;

    /** This property handles the film aperture height (in inches).
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetApertureHeight()
      * or SetApertureFormat() if you want to change its value.
	  *
      * Default value is 0.6120.
      * \remarks Value range is [0.0001, +inf).
      */
    FbxPropertyT<FbxDouble>                       FilmHeight;

    /** This property handles the film aperture aspect ratio.
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetApertureFormat() if you want to change its value.
	  *
      * Default value is (FilmWidth / FilmHeight).
      * \remarks Value range is [0.0001, +inf).
      */
    FbxPropertyT<FbxDouble>                       FilmAspectRatio;

    /** This property handles the film aperture squeeze ratio.
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetSqueezeRatio()
      * or SetApertureFormat() if you want to change its value.
	  *
      * Default value is 1.0.
      * \remarks Value range is [0.0001, +inf).
      */
    FbxPropertyT<FbxDouble>                       FilmSqueezeRatio;

    /** This property handles the film aperture format.
      *
      * \remarks This property is read-only.
      * \remarks Please use function SetApertureFormat()
      * if you want to change its value.
	  *
      * Default value is eCustomAperture.
      */
    FbxPropertyT<EApertureFormat>            FilmFormat;

    /** This property handles the horizontal offset from the center of the film aperture,
    * defined by the film height and film width. The offset is measured in inches.
    *
    * To access this property do: FilmOffsetX.Get().
    * To set this property do: FilmOffsetX.Set(FbxDouble).
    *
	* Default value is 0.0.
    */
    FbxPropertyT<FbxDouble>                       FilmOffsetX;

    /** This property handles the vertical offset from the center of the film aperture,
    * defined by the film height and film width. The offset is measured
    * in inches.
    *
    * To access this property do: FilmOffsetY.Get().
    * To set this property do: FilmOffsetY.Set(FbxDouble).
    *
	* Default value is 0.0.
    */
    FbxPropertyT<FbxDouble>                       FilmOffsetY;

    /** This property handles the pre-scale value. 
      * The value is multiplied against the computed projection matrix. 
      * It is applied before the film roll. 
	  *
      * To access this property do: PreScale.Get().
      * To set this property do: PreScale.Set(FbxDouble).
	  *
      * Default value is 1.0.
      */
    FbxPropertyT<FbxDouble>                       PreScale;

    /** This property handles the horizontal film horizontal translation.
      * To access this property do: FilmTranslateX.Get().
      * To set this property do: FilmTranslateX.Set(FbxDouble).
      * Default value is 0.0
      */
    FbxPropertyT<FbxDouble>                       FilmTranslateX;

    /** This property handles the vertical film translation.
	  *
      * To access this property do: FilmTranslateY.Get().
      * To set this property do: FilmTranslateY.Set(FbxDouble).
	  *
      * Default value is 0.0.
      */
    FbxPropertyT<FbxDouble>                       FilmTranslateY;

    /** This property handles the horizontal pivot point used for rotating the film back.
	  *
      * To access this property do: FilmRollPivotX.Get().
      * To set this property do: FilmRollPivotX.Set(FbxDouble).
	  *
      * Default value is 0.0.
      * \remarks FilmRollPivot value is used to compute the film roll matrix, which is a component of the post projection matrix.
      */
    FbxPropertyT<FbxDouble>                       FilmRollPivotX;

    /** This property handles the vertical pivot point used for rotating the film back.
	  *
      * To access this property do: FilmRollPivotY.Get().
      * To set this property do: FilmRollPivotY.Set(FbxDouble).
      *
	  * Default value is 0.0.
      * \remarks FilmRollPivot value is used to compute the film roll matrix, which is a component of the post projection matrix.
      */
    FbxPropertyT<FbxDouble>                       FilmRollPivotY;

    /** This property handles the amount of rotation around the film back. 
      * The roll value is specified in degrees.
	  *
      * To access this property do: FilmRollValue.Get().
      * To set this property do: FilmRollValue.Set(FbxDouble).
	  *
      * Default value is 0.0.
      * \remarks The rotation occurs around the specified pivot point, 
      * this value is used to compute a film roll matrix, which is a component of the post-projection matrix. 
      */
    FbxPropertyT<FbxDouble>                       FilmRollValue;

    /** This property handles how the roll is applied with respect to the pivot value.
      * eRotateFirst    The film back is first rotated then translated by the pivot point value.
      * eTranslateFirst    The film back is first translated then rotated by the film roll value.
	  *
      * To access this property do: FilmRollOrder.Get().
      * To set this property do: FilmRollOrder.Set(EFilmRollOrder).
	  *
      * Default value is eRotateFirst.
      */
    FbxPropertyT<EFilmRollOrder>             FilmRollOrder ;

    // -----------------------------------------------------------------------
    // Camera View Widget Option
    // -----------------------------------------------------------------------

    /** This property handles the camera's look-at flag.
      * If this flag is on, the camera will look at the camera interest.  
	  *
      * To access this property do: ViewCameraToLookAt.Get().
      * To set this property do: ViewCameraToLookAt.Set(FbxBool).
      *
      * Default value is true.
      */
    FbxPropertyT<FbxBool>                         ViewCameraToLookAt;

	/** This property handles to display the near and far plane or not.
      *
      * To access this property do: ViewFrustumNearFarPlane.Get().
      * To set this property do: ViewFrustumNearFarPlane.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         ViewFrustumNearFarPlane;

    /** This property handles the back plane display mode.
      *
      * To access this property do: ViewFrustumBackPlaneMode.Get().
      * To set this property do: ViewFrustumBackPlaneMode.Set(EFrontBackPlaneDisplayMode).
      *
      * Default value is ePlanesWhenMedia.
      */
    FbxPropertyT<EFrontBackPlaneDisplayMode>	ViewFrustumBackPlaneMode;

    /** This property handles the back plane distance.
      *
      * To access this property do: BackPlaneDistance.Get().
      * To set this property do: BackPlaneDistance.Set(FbxDouble).
      *
      * Default value is 100.0.
      */
    FbxPropertyT<FbxDouble>                       BackPlaneDistance;

    /** This property handles the back plane distance mode.
      *
      * To access this property do: BackPlaneDistanceMode.Get().
      * To set this property do: BackPlaneDistanceMode.Set(EFrontBackPlaneDistanceMode).
      *
      * Default value is eRelativeToInterest.
      */
    FbxPropertyT<EFrontBackPlaneDistanceMode>	BackPlaneDistanceMode;

    /** This property handles the front plane mode.
      *
      * To access this property do: ViewFrustumFrontPlaneMode.Get().
      * To set this property do: ViewFrustumFrontPlaneMode.Set(EFrontBackPlaneDisplayMode).
      *
      * Default value is ePlanesWhenMedia.
      */
    FbxPropertyT<EFrontBackPlaneDisplayMode>	ViewFrustumFrontPlaneMode;

    /** This property handles the front plane distance.
      *
      * To access this property do: FrontPlaneDistance.Get().
      * To set this property do: FrontPlaneDistance.Set(FbxDouble).
      *
      * Default value is 100.0.
      */
    FbxPropertyT<FbxDouble>                       FrontPlaneDistance;

    /** This property handles the front plane distance mode.
      *
      * To access this property do: FrontPlaneDistanceMode.Get().
      * To set this property do: FrontPlaneDistanceMode.Set(EFrontBackPlaneDistanceMode).
      *
      * Default value is eRelativeToInterest.
      */
    FbxPropertyT<EFrontBackPlaneDistanceMode>	FrontPlaneDistanceMode;

    // -----------------------------------------------------------------------
    // Camera Lock Mode
    // -----------------------------------------------------------------------

    /** This property handles the flag to lock the camera's navigation.
	  * When this flag is on, the camera's view can not be changed anymore.
      * To access this property do: LockMode.Get().
      * To set this property do: LockMode.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         LockMode;

    /** This property handles the flag to lock the camera interest's navigation.
      * When this flag is one, the position of the camera interest is locked.
      * To access this property do: LockInterestNavigation.Get().
      * To set this property do: LockInterestNavigation.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         LockInterestNavigation;

    // -----------------------------------------------------------------------
    // Background Image Display Options
    // -----------------------------------------------------------------------

    /** This property handles the fit image flag of back plane.
      *
      * To access this property do: BackPlateFitImage.Get().
      * To set this property do: BackPlateFitImage.Set(FbxBool).
      *
      * Default value is false.
	  * \see SetFitImage and GetFitImage.
      */
    FbxPropertyT<FbxBool>                         BackPlateFitImage;

    /** This property handles the crop flag of back plane.
      *
      * To access this property do: BackPlateCrop.Get().
      * To set this property do: BackPlateCrop.Set(FbxBool).
      *
      * Default value is false.
	  * \see SetCrop and GetCrop.
      */
    FbxPropertyT<FbxBool>                         BackPlateCrop;

    /** This property handles the center flag of back plane.
      *
      * To access this property do: BackPlateCenter.Get().
      * To set this property do: BackPlateCenter.Set(FbxBool).
      *
      * Default value is true.
	  * see SetCenter and GetCenter.
      */
    FbxPropertyT<FbxBool>                         BackPlateCenter;

    /** This property handles the keep ratio flag of back plane.
      *
      * To access this property do: BackPlateKeepRatio.Get().
      * To set this property do: BackPlateKeepRatio.Set(FbxBool).
      *
      * Default value is true.
	  * \see SetKeepRatio and GetKeepRatio.
      */
    FbxPropertyT<FbxBool>                         BackPlateKeepRatio;

    /** This property handles the background alpha threshold value.
      *
      * To access this property do: BackgroundAlphaTreshold.Get().
      * To set this property do: BackgroundAlphaTreshold.Set(FbxDouble).
      *
      * Default value is 0.5.
      */
    FbxPropertyT<FbxDouble>                       BackgroundAlphaTreshold;

    /** This property handles the back plane offset X.
    *
    * To access this property do: BackPlaneOffsetX.Get().
    * To set this property do: BackPlaneOffsetX.Set(FbxDouble).
    *
    * Default value is 0.0.
    */
    FbxPropertyT<FbxDouble>                       BackPlaneOffsetX;

    /** This property handles the back plane offset Y.
    *
    * To access this property do: BackPlaneOffsetY.Get().
    * To set this property do: BackPlaneOffsetY.Set(FbxDouble).
    *
    * Default value is 0.0.
    */
    FbxPropertyT<FbxDouble>                       BackPlaneOffsetY;

    /** This property handles the back plane rotation.
      *
      * To access this property do: BackPlaneRotation.Get().
      * To set this property do: BackPlaneRotation.Set(FbxDouble).
      *
      * Default value is 0.0.
      */
    FbxPropertyT<FbxDouble>                       BackPlaneRotation;

    /** This property handles the back plane scaling X.
    *
    * To access this property do: BackPlaneScaleX.Get().
    * To set this property do: BackPlaneScaleX.Set(FbxDouble).
    *
    * Default value is 1.0.
    * \remarks The application manipulating the camera has to take into consideration of
    * the BackPlateKeepRatio value too.
    */
    FbxPropertyT<FbxDouble>                       BackPlaneScaleX;

    /** This property handles the back plane scaling Y.
    *
    * To access this property do: BackPlaneScaleY.Get().
    * To set this property do: BackPlaneScaleY.Set(FbxDouble).
    *
    * Default value is 1.0.
    * \remarks The application manipulating the camera has to take into consideration of
    * the BackPlateKeepRatio value too.
    */
    FbxPropertyT<FbxDouble>                       BackPlaneScaleY;

    /** This property handles the flag to show back plane or not.
    *
    * To access this property do: ShowBackPlate.Get().
    * To set this property do: ShowBackPlate.Set(FbxBool).
    *
    * Default value is false.
    * \remarks This replaces ForegroundTransparent. 
    */
    FbxPropertyT<FbxBool>                         ShowBackplate;

    /** This property has the background texture connected to it.
      *
      * To access this property do: BackgroundTexture.Get().
      * To set this property do: BackgroundTexture.Set().
      *
      * \remarks The background texture is connected as source object.
      */
    FbxPropertyT<FbxReference> BackgroundTexture;


    // -----------------------------------------------------------------------
    // Foreground Image Display Options
    // -----------------------------------------------------------------------

    /** This property handles the fit image flag of front plate.
      *
      * To access this property do: FrontPlateFitImage.Get().
      * To set this property do: FrontPlateFitImage.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool> FrontPlateFitImage;

    /** This property handles the crop flag of front plane.
      *
      * To access this property do: FrontPlateCrop.Get().
      * To set this property do: FrontPlateCrop.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool> FrontPlateCrop;

    /** This property handles the center flag of front plane.
      *
      * To access this property do: FrontPlateCenter.Get().
      * To set this property do: FrontPlateCenter.Set(FbxBool).
      *
      * Default value is true.
      */
    FbxPropertyT<FbxBool> FrontPlateCenter;

    /** This property handles the keep ratio flag of front plane.
      *
      * To access this property do: FrontPlateKeepRatio.Get().
      * To set this property do: FrontPlateKeepRatio.Set(FbxBool).
      *
      * Default value is true.
      */
    FbxPropertyT<FbxBool> FrontPlateKeepRatio;


    /** This property handles the flag to show front plane or not.
      *
      * To access this property do: ShowFrontplate.Get().
      * To set this property do: ShowFrontplate.Set(FbxBool).
      *
      * Default value is false.
      * \remarks This replaces ForegroundTransparent.
      */
    FbxPropertyT<FbxBool> ShowFrontplate;

    /** This property handles the front plane offset X.
    *
    * To access this property do: FrontPlaneOffsetX.Get().
    * To set this property do: FrontPlaneOffsetX.Set(FbxDouble).
    *
    * Default value is 0.0.
    */
    FbxPropertyT<FbxDouble>                       FrontPlaneOffsetX;

    /** This property handles the front plane offset Y.
    *
    * To access this property do: FrontPlaneOffsetY.Get().
    * To set this property do: FrontPlaneOffsetY.Set(FbxDouble).
    *
    * Default value is 0.0.
    */
    FbxPropertyT<FbxDouble>                       FrontPlaneOffsetY;

    /** This property handles the front plane rotation.
      *
      * To access this property do: FrontPlaneRotation.Get().
      * To set this property do: FrontPlaneRotation.Set(FbxDouble).
      *
      * Default value is 0.0.
      */
    FbxPropertyT<FbxDouble>                       FrontPlaneRotation;

    /** This property handles the front plane scaling X.
    *
    * To access this property do: FrontPlaneScaleX.Get().
    * To set this property do: FrontPlaneScaleX.Set(FbxDouble).
    *
    * Default value is 1.0.
    */
    FbxPropertyT<FbxDouble>                       FrontPlaneScaleX;

    /** This property handles the front plane scaling Y.
    *
    * To access this property do: FrontPlaneScaleY.Get().
    * To set this property do: FrontPlaneScaleY.Set(FbxDouble).
    *
    * Default value is 1.0.
    */
    FbxPropertyT<FbxDouble>                       FrontPlaneScaleY;
	
	/** This property has the foreground texture connected to it.
      *
      * To access this property do: ForegroundTexture.Get().
      * To set this property do: ForegroundTexture.Set().
      *
      * \remarks The foreground texture is connected as source object.
      */
    FbxPropertyT<FbxReference>						ForegroundTexture;

    /** This property handles the foreground image opacity value.
      *
      * To access this property do: ForegroundOpacity.Get().
      * To set this property do: ForegroundOpacity.Set(FbxDouble).
      *
      * Default value is 1.0.
      */
    FbxPropertyT<FbxDouble>						ForegroundOpacity;

    // -----------------------------------------------------------------------
    // Safe Area
    // -----------------------------------------------------------------------

    /** This property handles the flag to display safe area or not.
      *
      * To access this property do: DisplaySafeArea.Get().
      * To set this property do: DisplaySafeArea.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         DisplaySafeArea;

    /** This property handles the flag display safe area on render or not.
      *
      * To access this property do: DisplaySafeAreaOnRender.Get().
      * To set this property do: DisplaySafeAreaOnRender.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         DisplaySafeAreaOnRender;

    /** This property handles the style to display safe area.
      *
      * To access this property do: SafeAreaDisplayStyle.Get().
      * To set this property do: SafeAreaDisplayStyle.Set(ESafeAreaStyle).
      *
      * Default value is eSafeAreaSquare.
      */
    FbxPropertyT<ESafeAreaStyle>             SafeAreaDisplayStyle;

    /** This property handles the display aspect ratio of safe area.
      *
      * To access this property do: SafeAreaDisplayStyle.Get().
      * To set this property do: SafeAreaAspectRatio.Set(FbxDouble).
      *
      * Default value is 1.33333333333333.
      */
    FbxPropertyT<FbxDouble>                       SafeAreaAspectRatio;

    // -----------------------------------------------------------------------
    // 2D Magnifier
    // -----------------------------------------------------------------------

    /** This property handles the flag to use 2d magnifier zoom or not.
	  * The 2D Magnifier lets you perform a 2D enlargement of the scene using the 
	  * current camera without changing any camera settings. 
	  *
      * To access this property do: Use2DMagnifierZoom.Get().
      * To set this property do: Use2DMagnifierZoom.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         Use2DMagnifierZoom;

    /** This property handles the 2d magnifier zoom value.
      *
      * To access this property do: _2DMagnifierZoom.Get().
      * To set this property do: _2DMagnifierZoom.Set(FbxDouble).
      *
      * Default value is 100.0.
      */
    FbxPropertyT<FbxDouble>                       _2DMagnifierZoom;

    /** This property handles the 2d magnifier X value.
      *
      * To access this property do: _2DMagnifierX.Get().
      * To set this property do: _2DMagnifierX.Set(FbxDouble).
      *
      * Default value is 50.0.
      */
    FbxPropertyT<FbxDouble>                       _2DMagnifierX;

    /** This property handles the 2d magnifier Y value.
      *
      * To access this property do: _2DMagnifierY.Get().
      * To set this property do: _2DMagnifierY.Set(FbxDouble).
      *
      * Default value is 50.0.
      */
    FbxPropertyT<FbxDouble>                       _2DMagnifierY;

    // -----------------------------------------------------------------------
    // Projection Type: Ortho, Perspective
    // -----------------------------------------------------------------------

    /** This property handles the projection type.
      *
      * To access this property do: ProjectionType.Get().
      * To set this property do: ProjectionType.Set(EProjectionType).
      *
      * Default value is ePerspective.
      */
    FbxPropertyT<EProjectionType>            ProjectionType;

    /** This property handles the orthographic zoom value.
      *
      * To access this property do: OrthoZoom.Get().
      * To set this property do: OrthoZoom.Set(FbxDouble).
      *
      * Default value is 1.0.
      */
    FbxPropertyT<FbxDouble>                       OrthoZoom;

    // -----------------------------------------------------------------------
    // Depth Of Field & Anti Aliasing
    // -----------------------------------------------------------------------

    /** This property handles the flag to use real time Depth of Field and Anti-Aliasing or not.
      *
      * To access this property do: UseRealTimeDOFAndAA.Get().
      * To set this property do: UseRealTimeDOFAndAA.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         UseRealTimeDOFAndAA;

    /** This property handles the flag to use depth of field or not.
      *
      * To access this property do: UseDepthOfField.Get().
      * To set this property do: UseDepthOfField.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         UseDepthOfField;

    /** This property handles the focus source.
      *
      * To access this property do: FocusSource.Get().
      * To set this property do: FocusSource.Set(EFocusDistanceSource).
      *
      * Default value is eFocusSrcCameraInterest.
	  * \see FocusDistance.
      */
    FbxPropertyT<EFocusDistanceSource>       FocusSource;

    /** This property handles the focus angle (in degrees).
      *
      * To access this property do: FocusAngle.Get().
      * To set this property do: FocusAngle.Set(FbxDouble).
      *
      * Default value is 3.5.
      */
    FbxPropertyT<FbxDouble>                       FocusAngle;

    /** This property handles the focus distance.
	  * Focus distance is the distance between the camera and the object on which the camera is focused. 
	  * There are two possible sources for this distance.
	  * \see EFocusDistanceSource
	  *
	  * To access this property do: FocusDistance.Get().
      * To set this property do: FocusDistance.Set(FbxDouble).
      *
      * Default value is 200.0.
      */
    FbxPropertyT<FbxDouble>                       FocusDistance;

    /** This property handles the flag to use anti aliasing or not.
      *
      * To access this property do: UseAntialiasing.Get().
      * To set this property do: UseAntialiasing.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         UseAntialiasing;

    /** This property handles the anti aliasing intensity.
      *
      * To access this property do: AntialiasingIntensity.Get().
      * To set this property do: AntialiasingIntensity.Set(FbxDouble).
      *
      * Default value is 0.77777.
      */
    FbxPropertyT<FbxDouble>                       AntialiasingIntensity;

    /** This property handles the anti aliasing method.
      *
      * To access this property do: AntialiasingMethod.Get().
      * To set this property do: AntialiasingMethod.Set(EAntialiasingMethod).
      *
      * Default value is eAAOversampling.
      */
    FbxPropertyT<EAntialiasingMethod>        AntialiasingMethod;

    // -----------------------------------------------------------------------
    // Accumulation Buffer
    // -----------------------------------------------------------------------

    /** This property handles the flag to use accumulation buffer or not.
      *
      * To access this property do: UseAccumulationBuffer.Get().
      * To set this property do: UseAccumulationBuffer.Set(FbxBool).
      *
      * Default value is false.
      */
    FbxPropertyT<FbxBool>                         UseAccumulationBuffer;

    /** This property handles the frame sampling count.
      *
      * To access this property do: FrameSamplingCount.Get().
      * To set this property do: FrameSamplingCount.Set(FbxInt).
      *
      * Default value is 7.
      */
    FbxPropertyT<FbxInt>                      FrameSamplingCount;

    /** This property handles the frame sampling type.
      *
      * To access this property do: FrameSamplingType.Get().
      * To set this property do: FrameSamplingType.Set(ESamplingType).
      *
      * Default value is eSamplingStochastic.
      */
    FbxPropertyT<ESamplingType>              FrameSamplingType;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);

protected:
    virtual void ConstructProperties(bool pForceSet);
	virtual FbxStringList GetTypeFlags() const;

private:
    double ComputePixelRatio(FbxUInt pWidth, FbxUInt pHeight, double pScreenRatio = 1.3333333333);

    // Background Properties
    FbxString mBackgroundMediaName;
    FbxString mBackgroundFileName;

    // Foreground Properties
    FbxString mForegroundMediaName;
    FbxString mForegroundFileName;

	FbxVector4 mLastUp;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxCamera::EAntialiasingMethod&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::EApertureFormat&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::EApertureMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::EAspectRatioMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::EFrontBackPlaneDisplayMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::EFrontBackPlaneDistanceMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::EPlateDrawingMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::EFocusDistanceSource&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::EFormat&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::EGateFit&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::EProjectionType&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::ERenderOptionsUsageTime&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::ESafeAreaStyle&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::ESamplingType&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCamera::EFilmRollOrder&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_CAMERA_H_ */
