/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcache.h
#ifndef _FBXSDK_SCENE_GEOMETRY_CACHE_H_
#define _FBXSDK_SCENE_GEOMETRY_CACHE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/core/base/fbxstatus.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxCache_internal;

/** This object contains methods for accessing point animation in a cache file.
* The FBX SDK supports three point cache file formats :
* - \e eMaxPointCacheV2: the 3ds Max Point Cache 2 file format.
* - \e eMayaCache: the Maya Cache file format.
* - \e eAlembic: Alembic Cache file format.
*
* Accessing cache data using these formats differs significantly. To address this difference, several sets of methods have been created.
* Use the GetCacheFileFormat() function to determine which set of methods to use. */
class FBXSDK_DLL FbxCache : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxCache, FbxObject);

public:
	//! \name Format Independent Functions.
	//@{
		/** Supported cache file formats. */
		enum EFileFormat
		{
			eUnknownFileFormat,	//!< Unknown cache file format.
			eMaxPointCacheV2,	//!< 3ds Max Point Cache 2 file format.
			eMayaCache,			//!< Maya Cache file format.
			eAlembic			//!< Alembic Cache file format.
		};

		/** Set the cache file format.
		* \param pFileFormat Valid values are \e eMaxPointCacheV2 or \e eMayaCache.
		* \param pStatus The FbxStatus object to hold error codes. */
		void SetCacheFileFormat(EFileFormat pFileFormat, FbxStatus* pStatus=NULL);

		/** Get the cache file format.
		* \return The current cache file format, or \e eUnknown if it is not set. */
		EFileFormat GetCacheFileFormat() const;

		/** Set the cache file name.
		* \param pRelativeFileName_UTF8 The point cache file, relative to the FBX file name.
		* \param pAbsoluteFileName_UTF8 The point cache file absolute path.
		* \param pStatus The FbxStatus object to hold error codes. */
		void SetCacheFileName(const char* pRelativeFileName_UTF8, const char* pAbsoluteFileName_UTF8, FbxStatus* pStatus=NULL);

		/** Get the cache file name.
		* \param pRelativeFileName_UTF8 Return the point cache file name, relative to the FBX File name.
		* \param pAbsoluteFileName_UTF8 Return the point cache file absolute path. */
		void GetCacheFileName(FbxString& pRelativeFileName_UTF8, FbxString& pAbsoluteFileName_UTF8) const;

		/** Open the cache file for reading.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if the file is successfully opened, \c false otherwise. */
		bool OpenFileForRead(FbxStatus* pStatus=NULL);

		/** Get the open state of the cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if the cache file is currently open, \c false otherwise. */
		bool IsOpen(FbxStatus* pStatus=NULL) const;

		/** Read data from the cache file.
		* \param pBuffer The buffer containing the data from the cache file. This parameter can be NULL if interested to get buffer length only.
		* \param pBufferLength The length of the buffer (NOT in bytes).
		* \param pTime The time at which the data should be read.
		* \param pChannel The cache file channel to read, when multiple channels are available.
		* \return \c True if the cache data was successfully read, \c false otherwise.
		* \remark The buffer will be allocated by FbxCache and will be returned if read successful. The buffer will be freed by FbxCache upon its destruction. */
		bool Read(float** pBuffer, unsigned int& pBufferLength, const FbxTime& pTime, unsigned int pChannel=0);

		/** Close the cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if the cache file is closed successfully, \c false otherwise. */
		bool CloseFile(FbxStatus* pStatus=NULL);

		/** Get the sampling frame rate of the cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return The sampling frame rate of the cache file, in frames per second. */
		double GetSamplingFrameRate(FbxStatus* pStatus=NULL);

		/** Get the sampling frame rate of the cache file, as a FbxTime object.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return The sampling frame rate of the cache file. */
		FbxTime GetCacheTimePerFrame(FbxStatus* pStatus=NULL);

		/** Get the number of channels in the cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return The number of animation channels in the cache file. */
		int GetChannelCount(FbxStatus* pStatus=NULL);

		/** Get the channel name for a specific channel index.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pChannelName Returns the name of the requested channel.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool GetChannelName(int pChannelIndex, FbxString& pChannelName, FbxStatus* pStatus=NULL);
	//@}

	//! \name eMayaCache Format Specific Functions.
	//@{
		//! Number of files used to store the animation.
		enum EMCFileCount
		{
			eMCOneFile,			//!< One file is used for all the frames of animation.
			eMCOneFilePerFrame	//!< For every frame of animation, a cache file is used. The number of the frames is the number of the cache files.
		};

		//! Data types in the MC cache file.
		enum EMCDataType
		{
			eUnknownData,		//!< Unknown data.
			eDouble,			//!< No use but has to be defined for consistency reasons.
			eDoubleArray,		//!< double*
			eDoubleVectorArray,	//!< double* [3]
			eInt32Array,		//!< int*
			eFloatArray,		//!< float* 
			eFloatVectorArray	//!< float* [3]
		};

		//! Binary cache format.
		enum EMCBinaryFormat
		{
			eMCC,	//!< MCC cache file format, 32bit (older format)
			eMCX	//!< MCX cache file format, 64bit (newer format)
		};

		//! Cache channel sampling types.
		enum EMCSamplingType
		{
			eSamplingRegular,	//!< Regular sampling.
			eSamplingIrregular	//!< Irregular sampling.
		};

		/** Open a cache file for writing.
		* \param pFileCount Create one file for each frame of animation, or one file for all the frames.
		* \param pSamplingFrameRate Number of frames per second.
		* \param pChannelName The name of the channel of animation to create.
		* \param pBinaryFormat Binary format type (32 bit=eMCC or 64bit=eMCX)
		* \param pMCDataType The data type of the MC cache file.
		* \param pInterpretation A piece of meta data to help users of the cache understand how to interpret the data.
		* \param pStatus The FbxStatus object to hold error codes. */
		bool OpenFileForWrite(EMCFileCount pFileCount, double pSamplingFrameRate, const char* pChannelName, EMCBinaryFormat pBinaryFormat, EMCDataType pMCDataType=eDoubleVectorArray, const char* pInterpretation="Points", FbxStatus* pStatus=NULL);

		/** Creates a new channel in the cache.
		* \param pChannelName The name of the channel of animation to create.
		* \param pMCDataType The MC DataType of the cache.
		* \param pInterpretation A piece of meta data to help users of the cache understand how to interpret the data.
		* \param pChannelIndex The index of the new animation channel.
		* \param pStatus The FbxStatus object to hold error codes.
		* \remark \b pChannelName must be unique within the cache.
		* \remark \b pChannelName and \b pInterpretation cannot be NULL pointers.
		* \remark This method must be called before adding any data to the cache but after the OpenFileForWrite. */
		bool AddChannel(const char* pChannelName, EMCDataType pMCDataType, const char* pInterpretation, unsigned int& pChannelIndex, FbxStatus* pStatus=NULL);     

		/** Get the data type of the specified channel.
		* \param pChannelIndex The index of the channel.
		* \param pChannelType The channel's data type.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool GetChannelDataType(int pChannelIndex, EMCDataType& pChannelType, FbxStatus* pStatus=NULL);

		/** Get the index of the specified channel.
		* \param pChannelName The name of the channel.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return The index of the channel in the cache file, or -1 if an error occurred. */
		int  GetChannelIndex(const char* pChannelName, FbxStatus* pStatus=NULL);

		/** Read a sample at a given time.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pTime Time at which the point animation must be evaluated.
		* \param pBuffer The place where the point value will be copied. If the channel's data type is DoubleVectorArray this buffer must be of size 3*pPointCount.
		* \param pPointCount The number of points to read from the point cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool Read(int pChannelIndex, FbxTime& pTime, double* pBuffer, unsigned int pPointCount, FbxStatus* pStatus=NULL);

		/** Read a sample at a given time.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pTime Time at which the point animation must be evaluated.
		* \param pBuffer The place where the point value will be copied. If the channel's data type is FloatVectorArray this buffer must be of size 3*pPointCount.
		* \param pPointCount The number of points to read from the point cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool Read(int pChannelIndex, FbxTime& pTime, float* pBuffer, unsigned int pPointCount, FbxStatus* pStatus=NULL);

		/** Read a sample at a given time.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pTime Time at which the point animation must be evaluated.
		* \param pBuffer The place where the point value will be copied. This buffer must be of size pPointCount.
		* \param pPointCount The number of points to read from the point cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool Read(int pChannelIndex, FbxTime& pTime, int* pBuffer, unsigned int pPointCount, FbxStatus* pStatus=NULL);

		/** Instruct the cache system that data is about to be written to it. This call must appear before any calls to the Write() methods on any channel and terminated by a call to EndWriteAt().
		* \param pTime Time at which the point animation must be inserted.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool BeginWriteAt( FbxTime& pTime, FbxStatus* pStatus=NULL );

		/** Write a sample at a given time.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pTime Time at which the point animation must be inserted.
		* \param pBuffer Point to the values to be copied. If the channel's data type is DoubleVectorArray this buffer must be of size 3*pPointCount.
		* \param pPointCount The number of points to write in the point cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise.
		* \remark This method will fail if the time \e pTime is different from the time set using the call BeginWriteAt().
		* \remark For backward compatibility reasons you can still call this method without the prior call to BeginWriteAt()
		* only if this cachedsystem has been defined with one channel. Any other configuration will result in a failure. */
		bool Write(int pChannelIndex, FbxTime& pTime, double* pBuffer, unsigned int pPointCount, FbxStatus* pStatus=NULL);

		/** Write a sample at a given time.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pTime Time at which the point animation must be inserted.
		* \param pBuffer Point to the values to be copied. If the channel's data type is FloatVectorArray this buffer must be of size 3*pPointCount.
		* \param pPointCount The number of points to write in the point cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise.
		* \remark This method will fail if the time \e pTime is different from the time set using the call BeginWriteAt().
		* \remark For backward compatibility reasons you can still call this method without the prior call to BeginWriteAt()
		* only if this cached system has been defined with one channel. Any other configuration will result in a failure. */
		bool Write(int pChannelIndex, FbxTime& pTime, float* pBuffer, unsigned int pPointCount, FbxStatus* pStatus=NULL);

		/** Write a sample at a given time.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pTime Time at which the point animation must be inserted.
		* \param pBuffer Point to the values to be copied. This buffer must be of size pPointCount.
		* \param pPointCount The number of points to write in the point cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise.
		* \remark This method will fail if the time \e pTime is different from the time set using the call BeginWriteAt().
		* \remark For backward compatibility reasons you can still call this method without the prior call to BeginWriteAt()
		* only if this cached system has been defined with one channel. Any other configuration will result in a failure. */
		bool Write(int pChannelIndex, FbxTime& pTime, int* pBuffer, unsigned int pPointCount, FbxStatus* pStatus=NULL);

		/** Instruct the cache system that all the data on all the channels has been written to it for the given time (specified
		* by the BeginWriteAt() call). The call to this method must be made after all the Write() for every channel defined.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool EndWriteAt(FbxStatus* pStatus=NULL);

		/** Get the Animation Range of the specified channel.
		* \param pChannelIndex The index of the channel.
		* \param pTimeStart The start time of the channel's animation.
		* \param pTimeEnd The end time of the channel's animation.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool GetAnimationRange(int pChannelIndex, FbxTime &pTimeStart, FbxTime &pTimeEnd, FbxStatus* pStatus=NULL);

		/** Get the cache type.
		* \param pFileCount The cache type.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool GetCacheType(EMCFileCount& pFileCount, FbxStatus* pStatus=NULL);

		/** Get the cache channel interpretation.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pInterpretation The channel interpretation, user-defined.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool GetChannelInterpretation(int pChannelIndex, FbxString& pInterpretation, FbxStatus* pStatus=NULL);

		/** Get the cache channel sampling type.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pSamplingType The sampling type of the channel.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool GetChannelSamplingType(int pChannelIndex, EMCSamplingType& pSamplingType, FbxStatus* pStatus=NULL);

		/** Get the cache channel sampling rate, in frames per second.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pSamplingRate The sampling rate of the channel.  The channel must have a regular sampling type.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool GetChannelSamplingRate(int pChannelIndex, FbxTime& pSamplingRate, FbxStatus* pStatus=NULL);

		/** Get the number of data points for a channel.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pSampleCount Number of available samples.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool GetChannelSampleCount(int pChannelIndex, unsigned int& pSampleCount, FbxStatus* pStatus=NULL);

		/** Get the number of points animated in the cache file, for a channel, for a given time.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pTime Reference time; must be within the boundaries of the animation.
		* \param pPointCount Number of available points.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool GetChannelPointCount(int pChannelIndex, FbxTime pTime, unsigned int& pPointCount, FbxStatus* pStatus=NULL);

		/** Returns the number of cache data files.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return The count returned does not include the main cache file, and depends on the cache type.  Will return -1 if point cache support is not enabled. */
		int GetCacheDataFileCount(FbxStatus* pStatus=NULL) const;

		/** Get the nth cache file name.
		* \param pIndex Index of the cache file to return; index is zero-based, and must be less than GetCacheDataFileCount().
		* \param pRelativeFileName Return the point cache file name, relative to the FBX File name.
		* \param pAbsoluteFileName Return the point cache file absolute path.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. See the error management functions for error details. */
		bool GetCacheDataFileName(int pIndex, FbxString& pRelativeFileName, FbxString& pAbsoluteFileName, FbxStatus* pStatus=NULL);

		/** Enable multi-channel fetching.
		* \param pMultiChannelFetching Enable/disable multi-channel fetching. When multi-channel is enabled, any load of data on a channel at a specific
		* time will pre-fetch data from all channels, for that specific time. This can reduce disk access, and increase performance (but requires more memory).
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool EnableMultiChannelFetching(bool pMultiChannelFetching, FbxStatus* pStatus=NULL);
        
		/** Get the next time where data is stored.
		* \param pCurTime Current time; must be within the boundaries of the animation time.
		* \param pNextTime Next time (filled if the function is successful).
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount(). If pChannel is left at -1, get the next time for any channel.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool GetNextTimeWithData(FbxTime pCurTime, FbxTime& pNextTime, int pChannelIndex = -1, FbxStatus* pStatus=NULL);
        
		/** Get the number of data points the channel contains.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pStatus The FbxStatus object to hold error codes.
		* \return The number of the channel's data points. */
		int GetDataCount(int pChannelIndex, FbxStatus* pStatus=NULL);
        
		/** Get the time of the specified data point.
		* \param pChannelIndex The index of the animation channel, between 0 and GetChannelCount().
		* \param pDataIndex Index of the data point.
		* \param pTime Time of the data point (filled if the function is successful).
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool GetDataTime(int pChannelIndex, unsigned int pDataIndex, FbxTime& pTime, FbxStatus* pStatus=NULL);
	//@}

	//! \name eMaxPointCacheV2 Format Specific Functions.
	//@{
		/** Open a cache file for writing.
		* \param pFrameStartOffset Start time of the animation, in frames.
		* \param pSamplingFrameRate Number of frames per second.
		* \param pSampleCount The number of samples to write to the file.
		* \param pPointCount The number of points to write in the point cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. See the error management functions for error details. */
		bool OpenFileForWrite(double pFrameStartOffset, double pSamplingFrameRate, unsigned int pSampleCount, unsigned int pPointCount, FbxStatus* pStatus=NULL);

		/** Get the number of frames of animation found in the point cache file.
		* \param pStatus  The FbxStatus object to hold error codes.
		* \return         The number of frames of animation.
		*/
		unsigned int GetSampleCount(FbxStatus* pStatus=NULL);

		/** Get the number of points animated in the cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return        The number of points.
		*/
		unsigned int GetPointCount(FbxStatus* pStatus=NULL);

		/** Get the start time of the animation
		* \param pStatus The FbxStatus object to hold error codes.
		* \return The start time of the animation, in frames. */
		double GetFrameStartOffset(FbxStatus* pStatus=NULL);

		/** Read a sample at a given frame index.
		* \param pFrameIndex The index of the animation frame, between 0 and GetSampleCount().
		* \param pBuffer The place where the point value will be copied. This buffer must be of size 3 * pPointCount.
		* \param pPointCount The number of points to read from the point cache file.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise. */
		bool Read(unsigned int pFrameIndex, double* pBuffer, unsigned int pPointCount, FbxStatus* pStatus=NULL);

		/** Write a sample at a given frame index.
		* \param pFrameIndex The index of the animation frame.
		* \param pBuffer Point to the values to be copied. This buffer must be of size 3 * pPointCount, as passed to the function OpenFileForWrite().
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise.
		* \remark Successive calls to Write() must use successive index. */
		bool Write(unsigned int pFrameIndex, double* pBuffer, FbxStatus* pStatus=NULL);
	//@}

	//! \name File conversion Functions.
	//@{
		/** Create an MC cache file from an PC2 cache file.
		* \param pFileCount Create one file for each frame of animation, or one file for all the frames.
		* \param pSamplingFrameRate Number of frames per second used to re-sample the point animation.
		* \param pBinaryFormat Binary format type (32 bit=eMCC or 64bit=eMCX)
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise.
		* \remark The created point cache file will be located in the _fpc folder associate with the FBX file. */
		bool ConvertFromPC2ToMC(EMCFileCount pFileCount, double pSamplingFrameRate, EMCBinaryFormat pBinaryFormat, FbxStatus* pStatus=NULL);

		/** Create a PC2 cache file from an MC cache file.
		* \param pSamplingFrameRate Number of frames per second to re-sample the point animation.
		* \param pChannelIndex Index of the channel of animation to read from.
		* \param pStatus The FbxStatus object to hold error codes.
		* \return \c true if successful, \c false otherwise.
		* \remark The created point cache file will be located in the _fpc folder associate with the FBX file. */
		bool ConvertFromMCToPC2(double pSamplingFrameRate, unsigned int pChannelIndex, FbxStatus* pStatus=NULL);
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	enum EOpenFlag
	{
		eReadOnly,
		eWriteOnly
	};

protected:
	bool OpenFile(EOpenFlag pFlag, EMCFileCount pFileCount, double pSamplingFrameRate, const char* pChannelName, const char* pInterpretation, unsigned int pSampleCount, unsigned int pPointCount, double pFrameStartOffset, FbxStatus* pStatus, EMCDataType pMCDataType = eDoubleVectorArray, EMCBinaryFormat pBinaryFormat = eMCX); 

	virtual void Construct( const FbxObject* pFrom );
	virtual void ConstructProperties(bool pForceSet);
	virtual void Destruct(bool pRecursive);

	FbxCache_internal* mData;

private:
	bool AllocateReadBuffer(unsigned int pTypeSize, unsigned int pTypeLength, unsigned int pLength, bool pAllocateConvertBuffer);
	bool ReadMayaCache(float** pBuffer, unsigned int& pBufferLength, const FbxTime& pTime, unsigned int pChannel);
	bool ReadMaxCache(float** pBuffer, unsigned int& pBufferLength, const FbxTime& pTime);
	bool ReadAlembicCache(float** pBuffer, unsigned int& pBufferLength, const FbxTime& pTime, unsigned int pChannel);

	FbxPropertyT<FbxString> CacheFile;
	FbxPropertyT<FbxString> CacheFileAbsolutePath;
	FbxPropertyT<FbxEnum> CacheFileType;

	void*			mReadBuffer;
	unsigned int	mReadBufferLength;
	unsigned int	mReadBufferSize;
	unsigned int	mReadTypeSize;
	unsigned int	mReadTypeLength;
	unsigned int	mReadLength;
	void*			mConvertBuffer;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxCache::EFileFormat&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_CACHE_H_ */
