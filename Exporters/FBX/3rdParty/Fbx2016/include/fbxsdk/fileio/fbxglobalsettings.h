/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxglobalsettings.h
#ifndef _FBXSDK_FILEIO_GLOBAL_SETTINGS_H_
#define _FBXSDK_FILEIO_GLOBAL_SETTINGS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/core/base/fbxstatus.h>
#include <fbxsdk/scene/fbxaxissystem.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief This class contains functions for accessing global settings.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxGlobalSettings : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxGlobalSettings, FbxObject);

public:
    /** 
	  * \name Axis system
	  */
	//@{
    
	/** Sets the scene's coordinate system.
	  * \param pAxisSystem              The coordinate system to set.
	  */
    void SetAxisSystem(const FbxAxisSystem& pAxisSystem);
    
	/** Returns the scene's current coordinate system.
	  * \return                         The scene's current coordinate system.
	  */
    FbxAxisSystem GetAxisSystem();
    //@}

    /** Sets the coordinate system's original Up Axis when the scene is created.
      * \param pAxisSystem              The coordinate system whose Up Axis is copied.
      */
    void SetOriginalUpAxis(const FbxAxisSystem& pAxisSystem);

    /** Returns the coordinate system's original Up Axis.
      * \return                         The coordinate system's original Up Axis when the scene is created. 0 is X, 1 is Y, 2 is Z axis.
      */
    int GetOriginalUpAxis() const;
    //@}

    /** 
	  * \name System Units
	  */
	//@{

	/** Sets the unit of measurement used by the system.
	  * \param pOther                   The system unit to set. 
	  */
    void SetSystemUnit(const FbxSystemUnit& pOther);
    
	/** Returns the unit of measurement used by the system.
	  * \return                         The unit of measurement used by the system.     
	  */
    FbxSystemUnit GetSystemUnit() const;

    /** Sets the original unit of measurement used by the system.
      * \param pOther                   The original system unit to set. 
      */
    void SetOriginalSystemUnit(const FbxSystemUnit& pOther);

    /** Returns the original unit of measurement used by the system.
      * \return                         The original unit of measurement used by the system.
      */
    FbxSystemUnit GetOriginalSystemUnit() const;
    //@}


    /** 
	  * \name Light Settings
	  */
	//@{

    /** Sets the ambient color.
      * \param pAmbientColor            The ambient color to set.
      * \remarks                        The ambient color only uses the RGB channels.
      */
    void SetAmbientColor(FbxColor pAmbientColor);

    /** Returns the ambient color.
      * \return                         The ambient color.
      */
    FbxColor GetAmbientColor() const;

    //@}

    /** 
	  * \name Camera Settings
	  */
	//@{
    /** Sets the default camera.
      * \param pCameraName              Name of the default camera.
      * \return                         \c true if camera name is valid, returns \c false if the camera does not have a valid name.
      * \remarks                        A valid camera name can be either one of the defined tokens (FBXSDK_CAMERA_PERSPECTIVE,
      *                                 FBXSDK_CAMERA_TOP, FBXSDK_CAMERA_FRONT, FBXSDK_CAMERA_BACK, FBXSDK_CAMERA_RIGHT, FBXSDK_CAMERA_LEFT and FBXSDK_CAMERA_BOTTOM) or the name
      *                                 of a camera inserted in the node tree under the scene's root node.
      */
    bool SetDefaultCamera(const char* pCameraName);

    /** Returns the default camera name.
      * \return                         The default camera name, or an empty string if no camera name has been set.
      */
    FbxString GetDefaultCamera() const;
    //@}

    /** 
	  * \name Time Settings
	  */
	//@{
    /** Sets the time mode.
    * \param pTimeMode                  One of the defined modes in class FbxTime.
    */
    void SetTimeMode(FbxTime::EMode pTimeMode);

    /** Returns the time mode.
    * \return                           The currently set TimeMode.
    */
    FbxTime::EMode GetTimeMode() const;

    /** Sets the time protocol.
      * \param pTimeProtocol        One of the defined protocols in FbxTime class.
      */
    void SetTimeProtocol(FbxTime::EProtocol pTimeProtocol);

    /** Returns the time protocol.
      * \return                     The currently set time protocol (default FbxTime::eFrameCount).
      */
    FbxTime::EProtocol GetTimeProtocol() const;

    /** \enum ESnapOnFrameMode      Snap on frame mode.
      */
    enum ESnapOnFrameMode
    {
        eNoSnap,			//! No snap.
        eSnapOnFrame,		//! Snap on frame.
        ePlayOnFrame,		//! Play on frame.
        eSnapAndPlayOnFrame	//! Snap and play on frame.
    };

    /** Sets the snap on frame mode.
      * \param pSnapOnFrameMode     One of the following values: eNoSnap, eSnapOnFrame, ePlayOnFrame, or eSnapAndPlayOnFrame.
      */
    void SetSnapOnFrameMode(ESnapOnFrameMode pSnapOnFrameMode);

    /** Returns the snap on frame mode.
      * \return                     The currently set snap on frame mode (default eNoSnap).
      */
    ESnapOnFrameMode GetSnapOnFrameMode() const;

    /** Sets the default time span of the time line.
    * \param pTimeSpan                  The default time span of the time line.
    */
    void SetTimelineDefaultTimeSpan(const FbxTimeSpan& pTimeSpan);

    /** Returns the default time span of the time line.
    * \param pTimeSpan                  The default time span of the time line.
    */
    void GetTimelineDefaultTimeSpan(FbxTimeSpan& pTimeSpan) const;

    /** Set custom frame rate.
     *  This is meaningless if the time mode is not FbxTime::eCustom.
     */
    void SetCustomFrameRate(double pCustomFrameRate);

    /** Return frame rate if the time mode is FbxTime::eCustom.
     *  If the time mode is not FbxTime::eCustom, return -1.
     */
    double GetCustomFrameRate() const; 
    //@}

    /** 
	  * \name Time Markers
	  */
	//@{
        struct FBXSDK_DLL TimeMarker
        {
            //! Default constructor.
            TimeMarker();

            /** Copy constructor.
              * \param pTimeMarker      Another time marker copied to this time marker.
              */
            TimeMarker(const TimeMarker& pTimeMarker);

            /** Assignment operator.
              * \param pTimeMarker      Another time marker assigned to this time marker.
              */
            TimeMarker& operator=(const TimeMarker& pTimeMarker);

            //! Marker name.
            FbxString mName; 

            //! Marker time.
            FbxTime mTime; 

            //! Loop flag.
            bool mLoop; 
        };

    /** Returns the number of time markers.
      * \return                     The number of time markers.
      */
    int GetTimeMarkerCount() const;

    /** Returns the time marker at the given index.
      * \param pIndex               The time marker index.
      * \param pStatus              The FbxStatus object to hold error codes.
      * \return                     A copy of the time marker at the given index, or an empty one if an error occurred.
      */
    TimeMarker GetTimeMarker(int pIndex, FbxStatus* pStatus=NULL) const;

    /** Adds a time marker.
      * \param pTimeMarker          The new time marker to be added.
      * \param pStatus              The FbxStatus object to hold error codes.
      */
    void AddTimeMarker(const TimeMarker& pTimeMarker, FbxStatus* pStatus=NULL);

    /** Replaces the time marker at the specified index with the new one.
      * \param pIndex               The time marker index.
      * \param pTimeMarker          The new time marker.
      * \param pStatus              The FbxStatus object to hold error codes.
      */
    void ReplaceTimeMarker(int pIndex, const TimeMarker& pTimeMarker, FbxStatus* pStatus=NULL);

    //! Removes all time markers and sets the current time marker index to -1.
    void RemoveAllTimeMarkers();

    /** Sets the index of the current time marker.
      * \param pIndex               The current time marker index.
      * \param pStatus              The FbxStatus object to hold error codes.
      * \return                     \c true if successful, or returns \c false if the index is not valid.
      */
    bool SetCurrentTimeMarker(int pIndex, FbxStatus* pStatus=NULL);

    /** Returns the current time marker index.
      * \return                     The current time marker index, or -1 if no current time marker has been set.
      */
    int GetCurrentTimeMarker() const;
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxObject& Copy(const FbxObject& pObject);
    
protected:
	FbxPropertyT<FbxInt>	UpAxis;
	FbxPropertyT<FbxInt>	UpAxisSign;

	FbxPropertyT<FbxInt>	FrontAxis;
	FbxPropertyT<FbxInt>	FrontAxisSign;

	FbxPropertyT<FbxInt>	CoordAxis;
	FbxPropertyT<FbxInt>	CoordAxisSign;

    FbxPropertyT<FbxInt>	OriginalUpAxis;
    FbxPropertyT<FbxInt>	OriginalUpAxisSign;

	FbxPropertyT<FbxDouble>	UnitScaleFactor;
    FbxPropertyT<FbxDouble>	OriginalUnitScaleFactor;

    FbxPropertyT<FbxDouble3>    AmbientColor;
    FbxPropertyT<FbxString>     DefaultCamera;
    FbxPropertyT<FbxEnum>       TimeMode;
    FbxPropertyT<FbxEnum>       TimeProtocol;
    FbxPropertyT<FbxEnum>       SnapOnFrameMode;
    FbxPropertyT<FbxTime>       TimeSpanStart;
    FbxPropertyT<FbxTime>       TimeSpanStop;
    FbxPropertyT<FbxDouble>     CustomFrameRate;

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void ConstructProperties(bool pForceSet);
	
private:
    void AxisSystemToProperties();
    void PropertiesToAxisSystem();

    void Init();

    FbxAxisSystem mAxisSystem;    
    int mNbTimeMarkers;

    friend class FbxWriterFbx6;
 
    FbxProperty mTimeMarkers;
    FbxPropertyT<FbxInt> mCurrentTimeMarker;
    void AddSetTimeMarker(int pIndex, const TimeMarker& pTimeMarker, FbxStatus* pStatus, bool pAdd);

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxTime::EMode&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_GLOBAL_SETTINGS_H_ */
