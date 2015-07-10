/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxwriter.h
#ifndef _FBXSDK_FILEIO_WRITER_H_
#define _FBXSDK_FILEIO_WRITER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/utils/fbxrenamingstrategy.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxStatus;
class FbxManager;
class FbxFile;
class FbxStream;
class FbxObject;
class FbxDocument;
class FbxScene;
class FbxExporter;
class FbxIO;
class FbxIOSettings;
class FbxProgress;

#define IOSP GetIOSettings()

 /** Base class of other writers used internally.
   * This class provides the interfaces for writing files. 
   *
   * The role of the writer is to effectively "write" specific file data
   * vs the role of the exporter is to select a specific writer
   * and launch the writing of a file through that writer.
   * \see FbxExporter 
   *
   * ex:
   * - FbxWriterFbx5  can write FBX 5 format files
   * - FbxWriterFbx6 can write FBX 6 format files
   * - FbxWriterFbx7 can write FBX 7 format files
   * - FbxWriterCollada can write Collada files
   * - FbxWriterDxf can write Dxf files
   * - ... etc.
   *
   * A SDK user should - normally - not use this class,
   * except if a custom writer must be created for plug-in extension,
   * then FbxWriter must be the base class for 
   * the new custom writer in that particular situation.
   * \nosubgrouping
   */
class FBXSDK_DLL FbxWriter
{
public:
	/** Constructor.
      *	\param pManager        The FbxManager Object.
      * \param pID             Id for current writer.
      * \param pStatus         The FbxStatus object to hold error codes.
      */
    FbxWriter(FbxManager& pManager, int pID, FbxStatus& pStatus);

	/** Destructor.    */
    virtual ~FbxWriter();

	/** Information type to request.
	 * \remarks Used internally to get writer file information.
	 */
    enum EInfoRequest
	{
        eInfoExtension,         //!<  To get the file ext for a writer ex: "FBX".     
        eInfoDescriptions,      //!<  To get the file description for a writer ex:"Autodesk FBX (*.fbx)".  
        eInfoVersions,          //!<  To get the file version for a writer ex: 7100.
		eInfoCompatibleDesc,    //!<  To get the file compatible description for a writer.
		eInfoUILabel,           //!<  To get the file UI label to show for a writer ex: file labels shown in "Open file dialog".
        eReserved1 = 0xFBFB,
    };
	
	//! Helper typedef for passing FbxWriter creator function as argument (used internally).
    typedef FbxWriter*				(*CreateFuncType)(FbxManager& pManager, FbxExporter& pExporter, int pSubID, int pPluginID);

	//! Helper typedef for passing FbxIOSettings creator function as argument (used internally).
    typedef void					(*IOSettingsFillerFuncType)(FbxIOSettings& pIOS);

	//! Helper typedef for passing EInfoRequest function as argument (used internally).
    typedef void*					(*GetInfoFuncType)(EInfoRequest pRequest, int pWriterTypeId);

    /** Creates a new file.
      * \param pFileName The name of the newly created file.
      */
    virtual bool					FileCreate(char* pFileName) = 0;

	/** Creates a new file via a stream.
      * \param pStream The stream to write to.
      * \param pStreamData the user-defined stream data to be written.
      */
    virtual bool					FileCreate(FbxStream* pStream, void* pStreamData);
	
	/** Closes the file.
	  */
    virtual bool					FileClose() = 0;
	
	/**  Test if the file is open.
	*/
    virtual bool					IsFileOpen() = 0;

    /**  Setup write options.
	*/
    virtual void		            GetWriteOptions() = 0;

	/** Writes content to the specified file with given stream options
      *	\param pDocument        FbxDocument to write file data to.
	  */
    virtual bool					Write(FbxDocument* pDocument) = 0;

	/** Pre-processes the scene.
      * \param pScene The scene needs to be pre-processed.
      */
    virtual bool					PreprocessScene(FbxScene &pScene) = 0;

	/** Post-processes the scene.
      * \param pScene The scene needs to be post-processed.
      */
    virtual bool					PostprocessScene(FbxScene &pScene) = 0;

#ifndef FBXSDK_ENV_WINSTORE
	/** Writes extension plug-ins name, version and parameters, so that we can remember if a plug-in was used during export.
	  * This is especially useful for extension plug-ins that modify the scene and also to warn users during import if an
	  * extension plug-in was used that could be missing.
      * \param pParams The parameters of the extension plug-in. The properties of the objects are used
	  * as the parameters of the extension plug-in.
	  * \remark This function has no implementation in this class. Only sub-class should implement it as needed. For example,
	  * FBX 6 and FBX 7 does implement it.
      */
	virtual void					PluginWriteParameters(FbxObject& pParams);
#endif /* !FBXSDK_ENV_WINSTORE */

	/** Finds the selected root node in the specified scene.
      * \param pScene	The scene in which the selected root node is found.
	  *	\return			The located root node.\c NULL if the selected root node cannot be found.
      */
    virtual FbxNode*				FindRootNode(FbxScene& pScene);

	/** Checks if there are spaces in the names of specified node (and its children nodes),
	  * and writes the returned node's name in the specified string list.
      * \param pNode	Specifies the node to check.
	  * \param pNodeNameList Specifies the string list where the node name that has spaces in it is recorded.
	  *	\return \c true If there are no spaces in the name of specified node (and its children nodes), 
	  * \c false  If spaces are found.
      */
    virtual bool					CheckSpaceInNodeNameRecursive(FbxNode* pNode, FbxString& pNodeNameList);

	/** Sets the file export version as specified.
      * \param pVersion The specified file export version.
      */
    bool							SetFileExportVersion(FbxString pVersion);
 
	/** Sets the renaming mode as specified.
      * \param pRenamingMode The specified renaming mode.
      */
    void							SetRenamingMode(FbxSceneRenamer::ERenamingMode pRenamingMode){mRenamingMode = pRenamingMode;}

	/** Sets the resampling rate as specified.
      * \param pResamplingRate The specified resampling rate.
      */
    inline void						SetResamplingRate(double pResamplingRate){mResamplingRate = pResamplingRate;}

	/** Test if file format is an internal plug-in .
	  * A non genuine plug-in is a plug-in made by someone external to Autodesk FBX SDK group.
      *	\return \c true If the file format is an internal plug-in ,\c false Otherwise .
      */
	bool							IsGenuine();

    /** Access to a IOSettings object.
      * \return The pointer to IOSettings or \c NULL \c if the object
      * has not been allocated.
    */
	virtual FbxIOSettings * GetIOSettings();

	/** Set the IOSettings pointer to be used for this writer instance.
	  * \param pIOSettings  
	  */
	virtual void SetIOSettings(FbxIOSettings * pIOSettings);

    /** Pass a progress handler to the writer.
      * \param pProgress     FbxProgress to store the progress information.
      */
    virtual void SetProgressHandler(FbxProgress* /*pProgress*/){}

	/** Returns true if this writer supports FbxStream I/O. Default value is false. */
	virtual bool SupportsStreams() const;

protected:
#ifndef FBXSDK_ENV_WINSTORE
    //! Function called by FBX before writing out the scene (FbxScene).
	void							PluginsWriteBegin(FbxScene& pScene);
    /**
     * Function called by FBX before writing out any FBX object.
     * \param pFbx              File object.
     * \param pWriteObjectId    Flag to write out object id.
     */
    void							PluginsWrite(FbxIO& pFbx, bool pWriteObjectId);
    //! Function called by FBX after writing out the scene (FbxScene).
    void							PluginsWriteEnd(FbxScene& pScene);
#endif /* !FBXSDK_ENV_WINSTORE */

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
public:
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxStatus& GetStatus()              { return mStatus; }

protected:

    FbxWriter&						operator=(FbxWriter const&) { return *this; }

    FbxStatus&                          mStatus;
    FbxManager& 				        mManager;
    FbxString							mFileVersion;
    //! Resample rate for animation.
    double							    mResamplingRate;
    //! The mode describing from which format to which format when write FBX file.
    FbxSceneRenamer::ERenamingMode	    mRenamingMode;

private:
	int								    mInternalID;
	FbxIOSettings *                     mIOSettings;

	friend struct FbxWriterFbx7_Impl;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

//! Helper to access the IOSetting object pointer as a ref ex: IOS_REF.GetBoolProp( ... );
#define IOS_REF (*GetIOSettings())

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_WRITER_H_ */
