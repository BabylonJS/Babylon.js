/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxreader.h
#ifndef _FBXSDK_FILEIO_READER_H_
#define _FBXSDK_FILEIO_READER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/core/base/fbxstring.h>
#include <fbxsdk/core/base/fbxtime.h>
#include <fbxsdk/fileio/fbx/fbxio.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxManager;
class FbxFile;
class FbxStream;
class FbxObject;
class FbxDocument;
class FbxDocumentInfo;
class FbxScene;
class FbxImporter;
class FbxIOSettings;
class FbxAxisSystem;
class FbxStatistics;
class FbxSystemUnit;
class FbxNode;
class FbxProgress;
class FbxTakeInfo;

 /** Base class of other readers used internally.
   * This class provides the interfaces for reading files.
   *
   * The role of the reader is to effectively "read" specific file data
   * vs the role of the importer is to select a specific reader
   * and launch the reading of a file through that reader.
   * \see FbxImporter 
   *
   * ex:
   * - FbxReaderFbx5  can read FBX 5 format files
   * - FbxReaderFbx6 can read FBX 6 format files
   * - FbxReaderFbx7 can read FBX 7 format files
   * - FbxReaderCollada can read Collada files
   * - FbxReaderDxf can read Dxf files
   * - ... etc.
   *
   * A SDK user should - normally - not use this class,
   * except if a custom reader must be created for plug-in extension,
   * then FbxReader must be the base class for 
   * the new custom reader in that particular situation.
   * \nosubgrouping
   */

class FBXSDK_DLL FbxReader
{
public:
	/** Constructor.
      *	\param pManager        The FbxManager Object.
      * \param pID             Id for current reader.
      * \param pStatus         The FbxStatus object to hold error codes.
      */
    FbxReader(FbxManager& pManager, int pID, FbxStatus& pStatus);

	 /** Destructor.
      */
    virtual ~FbxReader();
    
	/** Information type to request.
			  * \remarks Used internally to get reader file information.
	          */
    enum EInfoRequest
	{
        eInfoExtension,     //!< To get the file ext for a reader ex: "FBX".		
        eInfoDescriptions,	//!< To get the file description for a reader ex: "Autodesk FBX (*.fbx)".
        eReserved1 = 0xFBFB,
    };

	/** Flags for reading parts of file.
     * \remarks Used internally when an importer is initialized to get some information very fast.
		      */
    enum EFileOpenSpecialFlags
	{
		eParseForGlobalSettings = 1, //!< Used for reading the Global settings section when an importer is initialized.
		eParseForStatistics = 2      //!< Used for reading a group of statistics when an importer is initialized.     
	};

	/** \internal Helper typedef for passing FbxReader creator function as argument (used internally) */
    typedef FbxReader*			(*CreateFuncType)(FbxManager& pManager, FbxImporter& pImporter, int pSubID, int pPluginID);

	/** \internal Helper typedef for passing FbxIOSettings creator function as argument (used internally) */
    typedef void				(*IOSettingsFillerFuncType)(FbxIOSettings& pIOS);

	/** \internal Helper typedef for passing EInfoRequest function as argument (used internally) */
    typedef void*				(*GetInfoFuncType)(EInfoRequest pRequest, int pReaderTypeId);

	/** Returns the file version.
      *	\param pMajor       Major version.
      *	\param pMinor       Minor version.
      *	\param pRevision    Revision version.
      */
	virtual void				GetVersion(int& pMajor, int& pMinor, int& pRevision){ pMajor = pMinor = pRevision = 0; }

	/** Opens the file with default flag
      *	\param pFileName     Name of the File to open
      * \return				 If the file opens successfully return \c true, otherwise return \c false.
      */
    virtual bool				FileOpen(char* pFileName) = 0;

	/** Opens the stream with default flag
      *	\param pStream       stream to open
	  * \param pStreamData   user-defined stream data
      * \return				 If the stream opens successfully return \c true, otherwise return \c false.
      */
	virtual bool				FileOpen(FbxStream* pStream, void* pStreamData);

	/** Closes the file stream
      * \return  \c false
      */
    virtual bool				FileClose() = 0;

	 /** Checks if the file stream is open.
      *	\return  \c false.
      */
    virtual bool				IsFileOpen() = 0;

	/** Returns file stream options
      *	\param pParseFileAsNeeded       Sets whether to parse file as read options
      * \return                         true on success, otherwise return false. 
      */
    virtual bool                GetReadOptions(bool pParseFileAsNeeded = true) = 0;

	/** Reads file with stream options
      *	\param pDocument        FbxDocument to store the file data
      *	\return \c false.
      */
    virtual bool				Read(FbxDocument* pDocument) = 0;

#ifndef FBXSDK_ENV_WINSTORE
	/** Reads extension plug-ins name, version and parameters, so that we can remember if a plug-in was used during export.
	  * This is especially useful for extension plug-ins that modify the scene and also to warn users during import if an
	  * extension plug-in was used that could be missing.
      * \param pParams The parameters of the extension plug-in. The properties of the objects are used
	  * as the parameters of the extension plug-in.
	  * \remark This function has no implementation in this class. Only sub-class should implement it as needed. For example,
	  * FBX 6 and FBX 7 does implement it.
      */
	virtual void				PluginReadParameters(FbxObject& pParams);
#endif /* !FBXSDK_ENV_WINSTORE */

	/** Opens the file with specific EFileOpenSpecialFlags
      * \param pFileName     Name of the File to open.
      * \param pFlags        The EFileOpenSpecialFlags to open with
      * \return If the file opens successfully return true, otherwise return false.
      */
    virtual bool				FileOpen(char* pFileName, EFileOpenSpecialFlags /*pFlags*/){ return FileOpen(pFileName); }

	/** Returns the system axis information and file system units from the file
      *	\param pAxisSystem      Axis system in file
      * \param pSystemUnits     System unit in file
      * \return \c false.
      */
    virtual bool				GetAxisInfo(FbxAxisSystem* /*pAxisSystem*/, FbxSystemUnit* /*pSystemUnits*/){ return false; }

	/** Returns statistics from the file 
      *	\param pStats			Statistics in the file.
      *	\return \c false.
      */
    virtual bool				GetStatistics(FbxStatistics* /*pStats*/){ return false; }

	/** Get FBX file time mode read from GlobalSettings in FBX 6.n and FBX 7.n
	  *	\param pTimeMode  ref to a FbxTime::EMode enum	
	  *	\return     \c true on success, \c false otherwise.
	  *	\remarks    This function must be called after FbxImporter::Initialize().
	  *             Can be used for statistics (via GlobalSettings) before loading the whole scene from the file.
	  */
	virtual bool                GetFrameRate(FbxTime::EMode& pTimeMode) { pTimeMode = FbxTime::eDefaultMode; return false; }


    /** Returns the scene info from the file.
      * \return NULL.
      */
    virtual FbxDocumentInfo*   GetSceneInfo(){return NULL;}

    /** Returns the list of take infos from the file.	
      * \return NULL
      */
    virtual FbxArray<FbxTakeInfo*>* GetTakeInfo(){return NULL;}

	/** If default camera resolution is OK, returns information about the resolution of the render.
      *	\param pCamName			Default camera name.
	  *	\param pResolutionMode	Default resolution mode.
	  *	\param pW				Default resolution width.
	  *	\param pH				Default resolution height.
      *	\return \c true If default camera resolution is OK, \c false  Otherwise.
      */
	virtual bool	  		    GetDefaultRenderResolution(FbxString& pCamName, FbxString& pResolutionMode, double& pW, double& pH);

	/** Judges if the format of the file is was created by an Autodesk plug-in.
	  * An internal (genuine) plug-in is one created by the Autodesk FBX product team.
      *	\return \c true If the file format is internal plug-in , \c false Otherwise.
      */
	bool						IsGenuine();
   
    /** Access to a IOSettings object.
      * \return A pointer to IOSettings used for this reader or NULL if the object
      * has not been allocated.
    */
	virtual FbxIOSettings * GetIOSettings();

	/** Set the IOSettings pointer to be used for this reader instance.
	  * \param pIOSettings  
	  */
	virtual void SetIOSettings(FbxIOSettings * pIOSettings);

    /** Pass a progress handler to the reader.
      * \param pProgress     FbxProgress to store the progress information.
      */
    virtual void SetProgressHandler(FbxProgress* /*pProgress*/){}

	virtual void SetEmbeddingExtractionFolder(const char* /*pExtractFolder*/){}

	/** Returns true if this reader supports FbxStream I/O. Default value is false. */
	virtual bool SupportsStreams() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual bool				FileOpen(FbxFile * pFile);

    FbxStatus& GetStatus()              { return mStatus; }

protected:
	void						SetDefaultRenderResolution(const char* pCamName, const char* pResolutionMode, double pW, double pH);
#ifndef FBXSDK_ENV_WINSTORE
	void						PluginsReadBegin(FbxScene& pScene);
	void						PluginsRead(const char* pName, const char* pVersion);
	void						PluginsReadEnd(FbxScene& pScene);
#endif /* !FBXSDK_ENV_WINSTORE */
    FbxReader&					operator=(FbxReader const&) { return *this; }
    virtual bool				CheckDuplicateNodeNames(FbxNode* pRootNode, FbxString& pDuplicateNodeNameList);

    FbxStatus&                      mStatus;
    FbxManager&						mManager;
    FbxIODefaultRenderResolution*	mData;

private:
	int				mInternalID;
	FbxIOSettings*	mIOSettings;

	friend struct FbxReaderFbx7_Impl;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

//! Helper to access the IOSetting object pointer as a ref ex: IOS_REF.GetBoolProp( ... );
#define IOS_REF (*GetIOSettings())

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_READER_H_ */
