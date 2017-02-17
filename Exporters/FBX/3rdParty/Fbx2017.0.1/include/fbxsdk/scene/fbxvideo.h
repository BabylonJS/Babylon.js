/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxvideo.h
#ifndef _FBXSDK_SCENE_VIDEO_H_
#define _FBXSDK_SCENE_VIDEO_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**	FBX SDK video class.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxVideo : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxVideo, FbxObject);

public:
	/**
	  *\name Reset video
	  */
	//@{
		//! Reset the video to default values.
		void Reset();
	//@}

    /**
      * \name Video attributes Management
      */
    //@{
		/** Set the use of MipMap on the video.
		  * \param pUseMipMap If \c true, use MipMap on the video.
		  */
		void ImageTextureSetMipMap(bool pUseMipMap);

		/** Retrieve use MipMap state.
		  * \return          MipMap flag state.
		  */
		bool ImageTextureGetMipMap() const;

		/** Specify the Video full filename.
		  * \param pName     Video full filename.
		  * \return          \c True,if update successfully, \c false otherwise.
		  * \remarks         Update the texture filename if the connection exists.
		  */
		bool SetFileName(const char* pName);

		/** Retrieve the Video full filename.
		  * \return          Video full filename.
		  */
		FbxString GetFileName () const;

		/** Specify the Video relative filename.
		  * \param pName     Video relative filename.
		  * \return          \c True, if update successfully, \c false otherwise.
		  * \remarks         Update the texture filename if the connection exists.
		  */
		bool SetRelativeFileName(const char* pName);

		/** Retrieve the Video relative filename.
		  * \return         Video relative filename.
		  */
		const char* GetRelativeFileName() const;

		/**
		* \name Image sequence attributes Management
		* Besides storing video clips, the FbxVideo object can also store image sequences. This section contains
		* the manipulation methods used in this specialized mode. Note that, except for the GetFileName(), 
		* SetFileName(), GetRelativeFileName(), SetRelativeFileName() and the methods in this section, all the 
		* other ones are not mandatory therefore could contain uninitialized or default data values. 
		* 
		*/
		//@{
		/** Specify if this video object is holding the starting point of an image sequence.
		  * \param pImageSequence If \c true, this object is holding an image sequence.
		  * \remarks When this object is used as image sequence, the FBX SDK
		  *          will automatically exclude it from the embedding mechanism.
		  */
		void SetImageSequence(bool pImageSequence);

		/** Get the current state of the ImageSequence property.
		  * \return          ImageSequence property value.
		  */
		bool GetImageSequence() const;

		/** Specify the frame offset to be applied to the image sequence.
		  * \param pOffset The frame offset value.
		  */
		void SetImageSequenceOffset(int pOffset);

		/** Get the current value of the ImageSequenceOffset property.
		  * \return			ImageSequenceOffset property value.
		  */
		int GetImageSequenceOffset() const;
		//@}

		/** Retrieve the Frame rate of the video clip.
		  * \return        Frame rate.
		  */
		double GetFrameRate() const;

		/** Retrieve the last frame of the video clip.
		  * \return       Last frame number.
		  */
		int GetLastFrame() const;

		/** Retrieve the clip width.
		  * \return      Video image width.
		  */
		int GetWidth() const;

		/** Retrieve the clip height.
		  * \return      Video image height.
		  */
		int GetHeight() const;

		/** Set the start frame of the video clip.
		  * \param pStartFrame     Start frame number.
		  * \remarks               The parameter value is not checked. It is the responsibility
		  *                        of the caller to deal with bad frame numbers.
		  */
		void SetStartFrame(int pStartFrame);

		/** Retrieve the start frame of the video clip.
		  * \return     Start frame number.
		  */
		int GetStartFrame() const;

		/** Set the stop frame of the video clip.
		  * \param pStopFrame     Stop frame number.
		  * \remarks              The parameter value is not checked. It is the responsibility
		  *                       of the caller to deal with bad frame numbers.
		  */
		void SetStopFrame(int pStopFrame);

		/** Retrieve the stop frame of the video clip.
		  * \return     Stop frame number.
		  */
		int GetStopFrame() const;

		/** Set the play speed of the video clip.
		  * \param pPlaySpeed     Playback speed of the clip.
		  * \remarks             The parameter value is not checked. It is the responsibility
		  *                      of the caller to deal with bad playback speed values.
		  */
		void SetPlaySpeed(double pPlaySpeed);

		/** Retrieve the play speed of the video clip.
		  * \return Playback     speed.
		  */
		double GetPlaySpeed() const;

		/** Set the time offset.
		  * The offset can be used to shift the playback start time of the clip.
		  * \param pTime     Time offset of the clip.
		  */
		void SetOffset(FbxTime pTime);

		/* Retrieve the time offset.
		 * \return     The current time shift.
		 */
		FbxTime GetOffset() const;

		/** Set the Free Running state of the video clip.
		  * The Free Running flag can be used by a client application to implement a
		  * playback scheme that is independent of the main timeline.
		  * \param pState     State of the Free running flag.
		  */
		void SetFreeRunning(bool pState);

		/** Retrieve the Free Running state.
		  * \return     Current free running flag.
		  */
		bool GetFreeRunning() const;


		/** Set the Loop state of the video clip.
		  * The Loop flag can be used by a client application to implement the loop
		  * playback of the video clip.
		  * \param pLoop     State of the loop flag.
		  */
		void SetLoop(bool pLoop);

		/** Retrieve the Loop state.
		  * \return     Current loop flag.
		  */
		bool GetLoop() const;


		/** Video interlace modes.
		  */
		enum EInterlaceMode
		{
			eNone,           //!< Progressive frame (full frame).
			eFields,         //!< Alternate even/odd fields.
			eHalfEven,       //!< Half of a frame, even fields only.
			eHalfOdd,        //!< Half of a frame, odd fields only.
			eFullEven,       //!< Extract and use the even field of a full frame.
			eFullOdd,        //!< Extract and use the odd field of a full frame.
			eFullEvenOdd,    //!< Extract eFields and make full frame with each one beginning with Odd (60fps).
			eFullOddEven     //!< Extract eFields and make full frame with each one beginning with Even (60fps).
		};

		/** Set the Interlace mode.
		  * \param pInterlaceMode     Interlace mode identifier.
		  */
		void SetInterlaceMode(EInterlaceMode pInterlaceMode);

		/** Retrieve the Interlace mode.
		  * \return     Interlace mode identifier.
		  */
		EInterlaceMode GetInterlaceMode() const;


		/** Video clip access mode.
		  */
		enum EAccessMode
		{
			eDisk,
			eMemory,
			eDiskAsync
		};

		/** Set the clip Access Mode.
		  * \param pAccessMode     Clip access mode identifier.
		  */
		void SetAccessMode(EAccessMode pAccessMode);

		/** Retrieve the clip Access Mode.
		  * \return     Clip access mode identifier.
		  */
		EAccessMode GetAccessMode() const;
    //@}
    
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual void Construct(const FbxObject* pFrom);
    virtual void ConstructProperties(bool pForceSet);
    virtual bool ConnectNotify(FbxConnectEvent const &pEvent);

public:
	virtual FbxObject& Copy(const FbxObject& pObject);

    virtual FbxStringList GetTypeFlags() const;

    void SetOriginalFormat(bool pState);
    bool GetOriginalFormat() const;
    void SetOriginalFilename(const char* pOriginalFilename);
    const char* GetOriginalFilename() const;

	FbxPropertyT<FbxBool>   ImageSequence;
	FbxPropertyT<FbxInt> ImageSequenceOffset;
    FbxPropertyT<FbxDouble> FrameRate;
    FbxPropertyT<FbxInt> LastFrame;
    FbxPropertyT<FbxInt> Width;
    FbxPropertyT<FbxInt> Height;
    FbxPropertyT<FbxString> Path;
    FbxPropertyT<FbxInt> StartFrame;
    FbxPropertyT<FbxInt> StopFrame;
    FbxPropertyT<FbxDouble> PlaySpeed;
    FbxPropertyT<FbxTime> Offset;
    FbxPropertyT<EInterlaceMode> InterlaceMode;
    FbxPropertyT<FbxBool> FreeRunning;
    FbxPropertyT<FbxBool> Loop;
    FbxPropertyT<EAccessMode> AccessMode;

protected:
    void Init();

    bool		mUseMipMap;
    bool		mOriginalFormat;
    FbxString	mOriginalFilename;
    FbxString	mRelativeFilename;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxVideo::EInterlaceMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxVideo::EAccessMode&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_VIDEO_H_ */
