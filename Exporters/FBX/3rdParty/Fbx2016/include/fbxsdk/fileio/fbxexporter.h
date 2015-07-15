/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxexporter.h
#ifndef _FBXSDK_FILEIO_EXPORTER_H_
#define _FBXSDK_FILEIO_EXPORTER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxevent.h>
#include <fbxsdk/core/base/fbxstring.h>
#include <fbxsdk/fileio/fbxiobase.h>
#include <fbxsdk/fileio/fbxiosettings.h>
#include <fbxsdk/fileio/fbxprogress.h>
#include <fbxsdk/utils/fbxrenamingstrategy.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxIO;
class FbxIOFileHeaderInfo;
class FbxThread;
class FbxWriter;

struct FbxExportThreadArg;

/** Class to export SDK objects into an FBX file.
  * Normally this class is used as is. But for very special needs
  * a user can override Initialize() for special purpose.
  *
  * An exporter will select the appropriate writer to a particular file.
  * Ex: When an exporter must export an FBX 7 file, 
  * the exporter will ask for all registered writers if an FBX 7 file writer is available,
  * then if a writer is found, the exporter will create 
  * the specialized FBX 7 writer and write the file.
  * This way, an exporter can "write" many different type of files like FBX 5/6/7, 3DS, Obj, Dxf, Collada, etc.
  * \see FbxWriter
  *
  * Typical workflow for using the FbxExporter class:
  * -# create a SDKManager
  * -# create an IOSettings object
  * -# create an empty scene
  * -# create an exporter
  * -# initialize it with a file name
  * -# set numerous options to control how the exporter will behave.\n
  *    ex: set IOSettings values to export Materials or Textures.
  * -# call FbxExporter::Export() with the entity to export.
  *
  * \code
  * // ex:
  * // create a SdkManager
  * FbxManager* lSdkManager = FbxManager::Create();
  *
  * // create an IOSettings object
  * FbxIOSettings* ios = FbxIOSettings::Create(lSdkManager, IOSROOT);
  *
  * // set some IOSettings options 
  * ios->SetBoolProp(EXP_FBX_MATERIAL, true);
  * ios->SetBoolProp(EXP_FBX_TEXTURE,  true);
  *
  * // create an empty scene
  * FbxScene* lScene = FbxScene::Create(lSdkManager, "");
  *
  * // create an exporter.
  * FbxExporter* lExporter = FbxExporter::Create(lSdkManager, "");
  *
  * // initialize the exporter by providing a filename and the IOSettings to use
  * lExporter->Initialize("C:\\myfile.fbx", -1, ios);
  *
  * // export the scene.
  * lExporter->Export(lScene); 
  *  
  * // destroy the exporter
  * lExporter->Destroy();
  * \endcode
  *
  * \remarks According to the file suffix, a specialized writer will be created internally.\n
  * 		 Ex: for .fbx files a FBX Writer, for .3ds files, a 3ds writer, etc.\n
  *          Supported files formats: FBX 5/6/7 Binary & ASCII, Collada, DXF, OBJ, 3DS
  * \nosubgrouping
  */
class FBXSDK_DLL FbxExporter : public FbxIOBase
{
	FBXSDK_OBJECT_DECLARE(FbxExporter, FbxIOBase);

public:
	/** 
	  * \name Export Functions
	  */
	//@{
		/** Initialize object.
		  *	\param pFileName     Name of file to access.
		  * \param pFileFormat   file format identifier User does not need to specify it by default.
								 if not specified, plugin will detect the file format according to file suffix automatically.
		  * \param pIOSettings   client IOSettings, if not specified, a default IOSettings will be created
		  *	\return              \c true on success, \c false otherwise.
		  * \remarks             To identify the error that occurred, inspect the status object accessed 
          *                      using the GetStatus() function.
		  */
		virtual bool Initialize(const char* pFileName, int pFileFormat = -1, FbxIOSettings* pIOSettings = NULL);

	    /** Initialize object.
	    * \param pStream       stream to access.
	    * \param pStreamData   user-defined stream data.
        * \param pFileFormat   file format identifier User does not need to specify it by default.
                               if not specified, plugin will request the file format from the stream.
	    * \param pIOSettings   client IOSettings, if not specified, a default IOSettings will be created
        * \return              \c true on success, \c false otherwise.
	    * \remarks             To identify the error that occurred, inspect the status object accessed 
        *                      using the GetStatus() function.
	    */
        virtual bool Initialize(FbxStream* pStream, void* pStreamData=NULL, int pFileFormat = -1, FbxIOSettings * pIOSettings = NULL);

		/** Setup file export options settings.
		  *	\return \c true on success, \c false otherwise.
		  */	
		bool GetExportOptions();

        /** Access to a IOSettings object.
		  * \return The pointer to IOSettings or \c NULL \c if the object has not been allocated.
		  */
		FbxIOSettings* GetIOSettings();

		/** Set the IOSettings pointer
		  * \param pIOSettings  Pointer on a FbxIOSettings object.  
		  */
		void SetIOSettings(FbxIOSettings* pIOSettings);


		/** Export the document to the currently created file.
		  * \param pDocument          Document to export.
		  * \param pNonBlocking       If true, the export process will be executed in a new thread, allowing it to be non-blocking.
									  To determine if the export finished, refer to the function IsExporting().
		  *	\return                   \c true on success, \c false otherwise.
	      * \remarks                  To identify the error that occurred, inspect the status object accessed 
          *                           using the GetStatus() function.
		  */
		bool Export(FbxDocument* pDocument, bool pNonBlocking=false);

	#if !defined(FBXSDK_ENV_WINSTORE) && !defined(FBXSDK_ENV_EMSCRIPTEN)
		/** Check if the exporter is currently exporting.
		  * \param pExportResult  This parameter, after the export finished, will contain the result of the export success or failure.
		  * \return               Return true if the exporter is currently exporting.
		  * \remarks              This function will always return false if Export() was called with pNonBlocking set to false.
		  *                       This function should be used only in the context of pNonBlocking set to true.
		  *                       It is very important to periodically check if the export finished using this function,
		  *                       since it will also free up the thread's allocations when its done.
		  */
		bool IsExporting(bool& pExportResult);
	#endif /* !FBXSDK_ENV_WINSTORE && ! FBXSDK_ENV_EMSCRIPTEN */

		/** Get the progress status in non-blocking mode.
		  *	\param pStatus Optional current status string.
		  *	\return Percentage of the finished workload.
		  */
		float GetProgress(FbxString* pStatus=NULL);

		/** Register a callback function for progress reporting in single thread mode.
		  *	\param pCallback Pointer of the callback function.
		  * \param pArgs Pointer to the arguments passed to the callback function.
		  */
		void SetProgressCallback(FbxProgressCallback pCallback, void* pArgs=NULL);
	//@}

	/** 
	  * \name File Format
	  */
	//@{
		/** Get the format of the exported file.
		  *	\return     File format identifier.
		  */
		int GetFileFormat();

		/** Return \c true if the file format is a recognized FBX format.
		  */
		bool IsFBX();

		/** Get the list of writable versions for the current file format.
		  * \return \c NULL or a null terminated array of strings.
		  * \remarks the strings returned match the writers registered for the current format. 
          * The array items can be retrieved with the following code:
          * \code
          *   char const* const* lWV = lExporter->GetCurrentWritableVersions();
          *   if (lWV)
          *   {
          *       int i = 0;
          *       while (lWV[i] != NULL)
          *       {
          *           printf("fmt = %s\n", lWV[i]);
          *           i++;
          *       }
          *   }
          * \endcode
		  * 
		  */
		char const* const* GetCurrentWritableVersions();

		/** Set file version for a given file format.
		  * \param pVersion String description of the file format.
		  * \param pRenamingMode Renaming mode.
		  * \return \c true if mode is set correctly
		  */
		bool SetFileExportVersion(FbxString pVersion, FbxSceneRenamer::ERenamingMode pRenamingMode=FbxSceneRenamer::eNone);

		/** Set the resampling rate (only used when exporting to FBX 5.3 and lower)
		  * \param pResamplingRate resampling rate
		  */
		inline void SetResamplingRate(double pResamplingRate){ mResamplingRate = pResamplingRate; }

		/** Set the default rendering resolution.
		  * \param pCamName            name of the camera.
		  * \param pResolutionMode     resolution mode.
		  * \param pW                  width.
		  * \param pH                  height.
          * \remark These values are ignored when exporting to FBX 7.x and higher. With FBX version 6.x and lower, 
          *         the HeaderInfo is still accessible for legacy reasons and any other custom writers. For FBX filles,
          *         these values are used by the FBX QuickTime plug-in (obsolete now) to help it get the window size 
          *         without loading the whole file. The information contained in the FbxIOFileHeaderInfo is a duplicate
          *         of AspectRatioMode, AspectWidth and AspectHeight properties defined in the FbxCamera class. 
          *         Retrieveing the FileHeaderInfo starting from FBX 7.x will always return the uninitialized structure.
		  */
		void SetDefaultRenderResolution(FbxString pCamName, FbxString pResolutionMode, double pW, double pH);

		/**	Get the complete file header information.
		* \return		valid pointer to the complete header information
		*/
		FbxIOFileHeaderInfo* GetFileHeaderInfo();
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	bool GetExportOptions(FbxIO* pFbxObject);
	bool Export(FbxDocument* pDocument, FbxIO* pFbxObject);

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void Destruct(bool pRecursive);
	virtual void SetOrCreateIOSettings(FbxIOSettings* pIOSettings, bool pAllowNULL);

	void Reset();
	bool FileCreate();
	void FileClose();

private:
	bool ExportProcess(FbxDocument* pDocument);

	int								mFileFormat;
	FbxWriter*						mWriter;
#if !defined(FBXSDK_ENV_WINSTORE) && !defined(FBXSDK_ENV_EMSCRIPTEN)
    FbxThread*						mExportThread;
    FbxExportThreadArg*				mExportThreadArg;
    bool							mExportThreadResult;
    bool							mIsThreadExporting;
#endif /* !FBXSDK_ENV_WINSTORE && !FBXSDK_ENV_EMSCRIPTEN */
    FbxProgress						mProgress;
	FbxStream*                      mStream;
	void*                           mStreamData;
	FbxString						mStrFileVersion;
	double							mResamplingRate;
	FbxSceneRenamer::ERenamingMode	mRenamingMode;
	FbxIOFileHeaderInfo*			mHeaderInfo;
	FbxIOSettings*					mIOSettings;
	bool							mClientIOSettings;

	friend void ExportThread(void*);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

//! Event that is emitted to plugins before a file is exported to the FBX format.
class FBXSDK_DLL FbxEventPreExport : public FbxEvent<FbxEventPreExport>
{
	FBXSDK_EVENT_DECLARE(FbxEventPreExport);

public:
	FbxEventPreExport(FbxDocument* pDocument) : mDocument(pDocument) {};

	//! The document to be exported
	FbxDocument* mDocument;
};

//! Event that is emitted to plugins after a file is exported to the FBX format.
class FBXSDK_DLL FbxEventPostExport : public FbxEvent<FbxEventPostExport>
{
	FBXSDK_EVENT_DECLARE(FbxEventPostExport);

public:
	FbxEventPostExport(FbxDocument* pDocument) : mDocument(pDocument) {};

	//! The document to be exported
	FbxDocument* mDocument;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_EXPORTER_H_ */
