/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbximporter.h
#ifndef _FBXSDK_FILEIO_IMPORTER_H_
#define _FBXSDK_FILEIO_IMPORTER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxsystemunit.h>
#include <fbxsdk/core/base/fbxtime.h>
#include <fbxsdk/fileio/fbxiobase.h>
#include <fbxsdk/fileio/fbxprogress.h>
#include <fbxsdk/fileio/fbxiosettings.h>
#include <fbxsdk/fileio/fbxstatistics.h>
#include <fbxsdk/scene/fbxaxissystem.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxIO;
class FbxIOFileHeaderInfo;
class FbxDocumentInfo;
class FbxTakeInfo;
class FbxReader;
class FbxThread;

struct FbxImportThreadArg;

/** Class to import an FBX file into SDK objects.
* Normally this class is used as is. But for very special needs
* a user can override Initialize() for special purpose.
*
* An importer will select the appropriate reader to a particular file.
* Ex: When an importer must import an FBX 7 file, 
* the importer will ask for all registered readers if an FBX 7 file reader is available,
* then if a reader is found, the importer will create 
* the specialized FBX 7 reader and read the file.
* This way, an importer can "read" many different type of files like FBX 5/6/7, 3DS, Obj, Dxf, Collada, etc.
* \see FbxReader
*
* Typical workflow for using the FbxImporter class:
* -# create a SDKManager
* -# create an IOSettings object
* -# create an empty scene
* -# create an importer
* -# initialize the importer with a file name and IOSettings
* -# set numerous states, take information, defining how the importer will behave
* -# call FbxImporter::Import() with an empty scene
* \code
* ex:
* // create a SdkManager
* FbxManager *lSdkManager = FbxManager::Create();
*
* // create an IOSettings object
* FbxIOSettings * ios = FbxIOSettings::Create(lSdkManager, IOSROOT );
*
* // set some IOSettings options 
* ios->SetBoolProp(IMP_FBX_MATERIAL, true);
* ios->SetBoolProp(IMP_FBX_TEXTURE,  true);
*
* // create an empty scene
* FbxScene* lScene = FbxScene::Create(lSdkManager,"");
*
* // Create an importer.
* FbxImporter* lImporter = FbxImporter::Create(lSdkManager, "");
*
* // Initialize the importer by providing a filename and the IOSettings to use
* lImporter->Initialize("C:\\myfile.fbx", -1, ios);
*
* // Import the scene.
* lImporter->Import(lScene); 
*
* // Destroy the importer.
* lImporter->Destroy(); 
* \endcode
*
* \remarks According to the file suffix, a specialized reader will be created internally.
*          Ex: for .fbx files a FBX Reader, for .3ds files, a 3ds reader, etc.
*          Supported files formats: FBX 5/6/7 Binary & ASCII, Collada, DXF, OBJ, 3DS
* \nosubgrouping
*/
class FBXSDK_DLL FbxImporter : public FbxIOBase
{
	FBXSDK_OBJECT_DECLARE(FbxImporter, FbxIOBase);

public:
	/** 
	  * \name Import Functions
	  */
	//@{

	/** Initialize object.
	  * \param pFileName          Name of file to access.
      * \param pFileFormat        file format identifier User does not need to specify it by default.
                                  if not specified, plugin will detect the file format according to file suffix automatically.
	  * \param pIOSettings        client IOSettings, if not specified, a default IOSettings will be created
	  * \return                   \c true on success, \c false otherwise.
      * \remarks                  To identify the error that occurred, inspect the status object accessed 
      *                           using the GetStatus() function.
      * \remarks                  You do not need to give the pFileFormat if the suffix of pFileName is recognized
	  */
	virtual bool Initialize(const char* pFileName, int pFileFormat=-1, FbxIOSettings * pIOSettings=NULL);

	/** Initialize object.
	  *	\param pStream            stream to access.
	  * \param pStreamData        user-defined stream data.
      * \param pFileFormat        file format identifier User does not need to specify it by default.
                                  if not specified, plugin will request the file format from the stream automatically.
	  * \param pIOSettings        client IOSettings, if not specified, a default IOSettings will be created
      *	\return                   \c true on success, \c false otherwise.
      * \remarks                  To identify the error that occurred, inspect the status object accessed 
      *                           using the GetStatus() function.
      * \remarks                  You do not need to give the pFileFormat if the suffix of pFileName is recognized
      */
	virtual bool Initialize(FbxStream* pStream, void* pStreamData=NULL, const int pFileFormat=-1, FbxIOSettings* pIOSettings=NULL);

	/** Get the FBX version number of the FBX file.
	  * FBX version numbers start at 5.0.0.
	  * \param pMajor        Version major number.
	  * \param pMinor        Version minor number.
	  * \param pRevision     Version revision number.
	  *	\remarks             This function must be called after FbxImporter::Initialize().	  
	  */
	void GetFileVersion(int& pMajor, int& pMinor, int& pRevision);

	/**	Get the default rendering resolution if present in the file header.
	  * \param pCamName            Returned name of the camera.
	  * \param pResolutionMode     Returned resolution mode.
	  * \param pW                  Returned width.
	  * \param pH                  Returned height.
	  * \return                    \c true if the default rendering settings are defined in the file, otherwise
	  *                            returns \c false with empty parameters.
	  */
	bool GetDefaultRenderResolution(FbxString& pCamName, FbxString& pResolutionMode, double& pW, double& pH);

	/**	Get the complete file header information.
	  * \return		valid pointer to the complete header information
	  */
	FbxIOFileHeaderInfo* GetFileHeaderInfo();

	/** \enum EStreamOptionsGeneration Stream options identifiers.
	  * - \e eParseFile			Parse the file
	  * - \e eDoNotParseFile	Do not parse the file.
	  */
	enum EStreamOptionsGeneration
	{
		eParseFile,		// Parse the file
		eDoNotParseFile	// Do not parse the file (fast)
	};

    /** Read the currently opened file header to retrieve information related to takes.
	  * \param pStreamOptionsGeneration     Stream options identifier.
	  *	\return                \c true on success, \c false otherwise.
	  * \remarks                            Caller gets ownership of the returned structure.
      */
 	  bool GetImportOptions(EStreamOptionsGeneration pStreamOptionsGeneration = eParseFile);	

    /** Read the currently opened file header to retrieve information related to takes.
	  * \param pFbxObject     Target FBX file.
	  *	\return                \c true on success, \c false otherwise.
	  * \remarks              Caller gets ownership of the returned structure.
      */
	  bool GetImportOptions(FbxIO* pFbxObject);

    /** Import the currently opened file into a scene. 
      * \param pDocument          Document to fill with file content.
	  * \param pNonBlocking       If true, the import process will be executed in a new thread, allowing it to be non-blocking.
	                              To determine if the import finished, refer to the function IsImporting().
	  *	\return                   \c true on success, \c false otherwise.
      * \remarks                  To identify the error that occurred, inspect the status object accessed 
      *                           using the GetStatus() function.
	  *                           If the imported file is password protected and the password is not
	  *                           set or wrong, the FbxStatus object access with GetStatus() will be set with
	  *                           FbxStatus::ePasswordError.
      */
	  bool Import(FbxDocument* pDocument, bool pNonBlocking=false);

#if  !defined(FBXSDK_ENV_WINSTORE) && !defined(FBXSDK_ENV_EMSCRIPTEN) 
    /** Check if the importer is currently importing.
	  * \param pImportResult  This parameter, after the import finished, will contain the result of the import success or failure.
      * \return               Return true if the importer is currently importing.
	  * \remarks              This function will always return false if Import() was called with pNonBlocking set to false.
	  *                       This function should be used only in the context of pNonBlocking set to true.
	  *                       It is very important to periodically check if the import finished using this function,
      *                       since it will also free up the thread's allocations when its done.
      */
	  bool IsImporting(bool& pImportResult);
#endif /* !FBXSDK_ENV_WINSTORE && !defined(FBXSDK_ENV_EMSCRIPTEN) */

	/** Get the progress status in non-blocking mode.
	  *	\param pStatus Optional current status string.
      *	\return Percentage of the finished workload
	  */
      float GetProgress(FbxString* pStatus=NULL);

    /** Register a callback function for progress reporting in single thread mode.
      *	\param pCallback Pointer of the callback function.
	  * \param pArgs pointer to the arguments passed to the callback function.
      */
      void SetProgressCallback(FbxProgressCallback pCallback, void* pArgs=NULL);

    /** Explicitly set the embedding extraction folder. If this is never called, the FBX SDK will determine the best folder to extract embedded files.
      * \param pExtractFolder The file path name where the embedded files should be extracted.
      */
	void SetEmbeddingExtractionFolder(const char* pExtractFolder);

	/** Retrieve the current folder destination where the embedded files will be extracted. This might not be initialized until file I/O is performed.
	  */
	const char* GetEmbeddingExtractionFolder();

	/** Access to a IOSettings object.
      * \return The pointer to IOSettings or \c NULL \c if the object has not been allocated.
      */
 	  FbxIOSettings* GetIOSettings();

	/** Set the IOSettings pointer
	  * \param pIOSettings Point to a FbxIOSettings object.
	  */
	  void SetIOSettings(FbxIOSettings* pIOSettings);

	/** Set the password.
	  * All subsequently imported files are opened with the given password.
      * \param pPassword     Password string.
      */
      void SetPassword(char* pPassword);

	/** 
	  * \name Animation Stack Description Access
	  * \see FbxAnimStack
	  */
	//@{
	
    /** Get the number of available animation stacks in the file.
      * \return      Number of animation stacks.
      *	\remarks     This function must be called after FbxImporter::Initialize().
      */
      int GetAnimStackCount();

	/** Get the take information about an available take.
	  * Use the returned reference to a FbxTakeInfo object to set whether the indexed take is imported.
	  *	\param pIndex     Index of the requested take.
	  *	\return           Take information or \c NULL if function failed.
	  *	\remarks          This function must be called after FbxImporter::Initialize().
	  */
	  FbxTakeInfo* GetTakeInfo(int pIndex);

    /** Return the active animation stack name.
      * \return     Active animation stack name if there is one, otherwise returns an empty string.
      * \remarks    This function must be called after FbxImporter::Initialize().
      */
      FbxString GetActiveAnimStackName();

	//@}

	/** 
	  * \name Scene Description Access
	  */
	//@{

	/** Get the scene info.
	  * \return     Pointer to the scene info or \c NULL if no scene information
	  *             is available in the file.
	  */
	FbxDocumentInfo* GetSceneInfo();

	//@}
	/** 
	  * \name File Format
	  */
	//@{

	/** Returns the index of the reader (FbxReader) associated with the file format. 
	    This index is considered the identifier of the file format. 
		The array of registered readers can't be retrieved. 
		\return Index of the registered FbxReader associated with the file format. 
		        If no reader found return -1.
		\remarks According to the number of readers registered this value can change 
		         for the same reader between SDK Manager instantiations.
	*/
	int GetFileFormat ();

	/** \return     \c true if the file format is a recognized FBX format.
	  */
	bool IsFBX();
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxFile* GetFile();
    FbxStream* GetStream();
    void*      GetStreamData();

	void ParseForGlobalSettings(bool pState);
    void ParseForStatistics(bool pState);
	bool GetAxisInfo(FbxAxisSystem* pAxisSystem, FbxSystemUnit* pSystemUnits);
    bool GetStatistics(FbxStatistics* pStatistics);
	bool GetFrameRate(FbxTime::EMode &pTimeMode);

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void Destruct(bool pRecursive);
	virtual void SetOrCreateIOSettings(FbxIOSettings* pIOSettings, bool pAllowNULL);

	void Reset();
    bool FileOpen(FbxFile* pFile = NULL);
	bool FileOpen(FbxStream* pStream, void* pStreamData);
	void FileClose();

	void GetImportOptionsInfo();
    bool IsNativeExtension ();

	//These two internal functions are only used to read old character pose data
	bool Initialize(FbxFile* pFile, const int pFileFormat=-1, FbxIOSettings* pIOSettings=NULL);
	bool Import(FbxDocument* pDocument, FbxIO* pFbxObject);

private:
	bool ImportProcess(FbxDocument* pDocument);

    int						mFileFormat;
    FbxReader*				mReader;
	FbxString				mExtractFolder;
    bool					mParseForGlobalSettings;
    FbxAxisSystem			mAxisSystem;
    FbxSystemUnit			mSystemUnits;
	FbxTime::EMode			mFrameRate;
    bool					mParseForStatistics;
    FbxStatistics			mStatistics;
#if  !defined(FBXSDK_ENV_WINSTORE) && !defined(FBXSDK_ENV_EMSCRIPTEN) 
	FbxThread*				mImportThread;
	FbxImportThreadArg*		mImportThreadArg;
	bool					mImportThreadResult;
	bool					mIsThreadImporting;
#endif /* !FBXSDK_ENV_WINSTORE && !defined(FBXSDK_ENV_EMSCRIPTEN) */
    FbxProgress				mProgress;
    FbxFile*				mFile;
	FbxStream*				mStream;
	void*					mStreamData;
	bool					mImportOptionsDone;
	FbxArray<FbxTakeInfo*>	mTakeInfo;
	FbxDocumentInfo*		mSceneInfo;
	FbxString				mActiveAnimStackName;
	int						mMajorVersion;
	int						mMinorVersion;
	int						mRevisionVersion;
	FbxIOFileHeaderInfo*	mHeaderInfo;
	FbxIOSettings*			mIOSettings;
	bool					mClientIOSettings;

	//For Initialize and Import
	friend class FbxReaderFbx5;
	friend class FbxReaderFbx6;
	friend struct FbxReaderFbx7_Impl;

	friend void ImportThread(void*);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

//! Event that is emitted to plugins before a FBX file has been imported.
class FBXSDK_DLL FbxEventPreImport : public FbxEvent<FbxEventPreImport>
{
    FBXSDK_EVENT_DECLARE(FbxEventPreImport);
public:
    inline FbxEventPreImport( FbxDocument* pDocument ) : mDocument(pDocument) {};

    //! The document the FBX file is to be imported into.
    FbxDocument* mDocument; 
};

//! Event that is emitted to plugins after a FBX file has been imported.
class FBXSDK_DLL FbxEventPostImport : public FbxEvent<FbxEventPostImport>
{
    FBXSDK_EVENT_DECLARE(FbxEventPostImport);
public:
    inline FbxEventPostImport( FbxDocument* pDocument ) : mDocument(pDocument) {};

    //! The imported document
    FbxDocument* mDocument; 
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_IMPORTER_H_ */
