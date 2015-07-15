/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxreaderfbx6.h
#ifndef _FBXSDK_FILEIO_FBX_READER_FBX6_H_
#define _FBXSDK_FILEIO_FBX_READER_FBX6_H_

#include <fbxsdk.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxAnimStack;
class FbxAnimLayer;
class Fbx6ObjectTypeInfo;
class Fbx6TypeReadReferences;


/**	\brief Helper class to merge Class root property templates.
  * Add class id and object to the template and search object by
  * class id.
  */
class Fbx6ClassTemplateMap
{
public:

    /** Constructor
      *	
      */
    Fbx6ClassTemplateMap();

    /** Destructor
      *	
      */
    ~Fbx6ClassTemplateMap();

    // Fbx6ClassTemplateMap will own this template object.

    /** Add the template object to template map
      *	\param pId              Class Id
      * \param pTemplateObject  template object
      * \return if the object is successfully added return \c true, otherwise return \c false.
      */
    bool AddClassId( FbxClassId pId, FbxObject* pTemplateObject );

    /** Merge the properties of FbxObject with the object with the same class id
      *	\param pObject          The FbxObject to merge
      * \return if the object is merged return \c true, otherwise return \c false.
      */
    bool MergeWithTemplate( FbxObject* pObject ) const;

    /** Delete all FbxObject in template map
      *	
      */
    void Clear();

private:
    typedef FbxMap< FbxClassId, FbxObject*, FbxClassIdCompare > MapType;
    MapType mClassMap;

    /** Whether the property is modified
      *	\param lProp        The property to check
      * \return If the property has been modified return \c true, otherwise return \c false
      */
    bool HasModifiedFlags(FbxProperty lProp) const;
    inline FbxPropertyFlags::EFlags IndexToFlag( int i ) const { return static_cast<FbxPropertyFlags::EFlags>(1 << i); }
};



/**	\brief This class is the FBX v6 reader.
* The reader provide you the ability to read the global settings, objects and animation information from file.
*
*/
class FbxReaderFbx6 : public FbxReader
{
public:

    /** Constructor
      *	\param pManager        the FbxManager Object
      * \param pImporter       the FbxImporter to import the SDK objects
      * \param pID             id for current reader
      * \param pStatus         the FbxStatus object to hold error codes
      */
    FbxReaderFbx6(FbxManager& pManager, FbxImporter& pImporter, int pID, FbxStatus& pStatus);

    /** Destructor
      *
      */
    virtual ~FbxReaderFbx6();

    /** Open file with certain EFileOpenSpecialFlags
      * \param pFileName     name of the File to open
      * \param pFlags        the EFileOpenSpecialFlags to open with
      * \return if the file is open successfully return true, otherwise return false
      */
    virtual bool FileOpen(char* pFileName, EFileOpenSpecialFlags pFlags);

    /** Open file with default flag
      *	\param pFileName     name of the File to open
      * \return if the file is open successfully return \c true, otherwise return \c false
      */
    virtual bool FileOpen(char* pFileName);

    /** Open file with FbxFile handle
      *	\param pFile        the FbxFile handle
      * \return if the file is open successfully return \c true, otherwise return \c false
      */
    virtual bool FileOpen(FbxFile * pFile);

    /** Open file from stream
      */
	virtual bool FileOpen(FbxStream * pStream, void* pStreamData);

    /** Close the file stream
      * \return if the file is closed successfully return \c true, otherwise return \c false
      */
    virtual bool FileClose();

    /** Check whether the file stream is open.
      *	\return if the file stream is open return \c true, otherwise return \c false.
      */
    virtual bool IsFileOpen();

    /** \enum EImportMode File import mode.
      *
      */
    typedef enum
    {
        eASCII,     /**< Plain text mode */
        eBINARY,    /**< Binary mode */
        eENCRYPTED  /**< Encrypted mode */
    } EImportMode;

    /** Get current Import mode
      *	\return return the EImportMode value
      */
    EImportMode GetImportMode();

    /** Get file version
      *	\param pMajor       Major version
      *	\param pMinor       Minor version
      *	\param pRevision    Revision version
      */
    virtual void GetVersion(int& pMajor, int& pMinor, int& pRevision);

    /** Get axis system information from file
      *	\param pAxisSystem      axis system in file
      * \param pSystemUnits     system unit in file
      * \return if either pAxisSystem or pSystemUnits is \c NULL return \c false, otherwise return \c true.
      */
    virtual bool GetAxisInfo(FbxAxisSystem* pAxisSystem, FbxSystemUnit* pSystemUnits);

	/** Get FBX file time mode read from GlobalSettings in FBX 6.n and FBX 7.n
	  *	\param pTimeMode  ref to a FbxTime::EMode enum
	  *	\return     \c true on success, \c false otherwise.
	  *	\remarks    This function must be called after FbxImporter::Initialize().
	  *             Can be used for statistics (via GlobalSettings) before loading the whole scene from the file.
	  */
	virtual bool GetFrameRate(FbxTime::EMode &pTimeMode);	

    /** Get the statistics from file
      *	\param pStats statistics in file
      *	\return if fetching statistics is successfully return \c true, otherwise return \c false.
      */
    virtual bool GetStatistics(FbxStatistics* pStats);

    /** Get the file stream options
      *	\param pParseFileAsNeeded       Whether to parse file as read options
      * \return true on success, otherwise return false.
      */
    virtual bool GetReadOptions(bool pParseFileAsNeeded = true);


    /** Read file with stream options
      *	\param pDocument        FbxDocument to store the file data
      *	\return if fetching statistics is successful return \c true, otherwise return \c false.
      */
    virtual bool Read(FbxDocument *pDocument);

    /** Get the file options
      * \param pFbx                     file object to read options
      *	\param pParseFileAsNeeded       Whether to parse file as read options
      * \return true on success, otherwise return false.
      */
    virtual bool GetReadOptions(FbxIO* pFbx, bool pParseFileAsNeeded = true);


    /** Read file with stream options
      *	\param pDocument        FbxDocument to store the file data
      * \param pFbx             file object to read from
      *	\return if reading the file is successful return \c true, otherwise return \c false.
      */
    virtual bool Read(FbxDocument *pDocument, FbxIO* pFbx);


    /** Read all the properties and flags
      *	\param pParams        settings to assign properties and flags
      */
	virtual void PluginReadParameters(FbxObject& pParams);

    /** Returns the scene info from the file.
      * \return The pointer to file scene info defined by this reader.
      */
    virtual FbxDocumentInfo*  GetSceneInfo() { return mSceneInfo; }


    /** Returns the pointer to the list of TakeInfo from the file.
      * \return NULL
      */
    virtual FbxArray<FbxTakeInfo*>* GetTakeInfo() { return &mTakeInfo; }

    /** Pass a progress handler to the reader
      * \param pProgress     FbxProgress to store the progress information.
      */
    virtual void SetProgressHandler(FbxProgress *pProgress);

	virtual void SetEmbeddingExtractionFolder(const char* pExtractFolder);

	virtual bool SupportsStreams() const { return true; }

private:

    /** Read scene information
      *	\return A pointer of document info. Return \c NULL if any error exist
      */
    FbxDocumentInfo* ReadSceneInfo();

    /** Read scene information by type
      *	\param pType        the type to read
      * \return A pointer of document info. Return \c NULL if any error exist
      */
    FbxDocumentInfo* ReadSceneInfo(FbxString& pType);

    /** Write scene information
      *	
      */
    void WriteSceneInfo(FbxDocumentInfo*);

    /** Write thumbnail
      *	
      */
    bool WriteThumbnail(FbxThumbnail*);

    /**
      * \name FBX File sections
      */
    //@{

    /** Create generic object and connect with FbxIO document
      *	\param pDocument      FbxDocument to connect with the generic object 
      * \param pObjectType    type of generic object 
      * \param pObjectSubType Subtype of generic object
      * \param pObjectName    Name of generic object
      * \param pFlags         Object flag
      * \return A pointer of the generic object. Return \c NULL if creation fails.
      */
    FbxObject* CreateGenericObject(FbxDocument *pDocument, char* pObjectType, char* pObjectSubType, char* pObjectName, FbxObject::EObjectFlag pFlags=FbxObject::eSavable);

    /** Read description section and assign the document name
      *	\param pDocument        Document to read
      * \param pDocumentName    Document name to assign
      *	\return if reading description section is successful return \c true, otherwise return \c false.
      */
    bool ReadDescriptionSection(FbxDocument *pDocument, FbxString& pDocumentName);

    /** Read reference section and fill the external references
      *	\param pDocument        Document to read
      * \param pDocReferences   External references to fill
      *	\return if reading reference section is successful return \c true, otherwise return \c false.
      */
    bool ReadReferenceSection(FbxDocument *pDocument, Fbx6TypeReadReferences& pDocReferences);

    /** Read definition section and fill object type info array
      *	\param pDocument        Document to read
      * \param pObjectContent   Object type info array to fill
      *	\return if reading definition section is successful return \c true, otherwise return \c false.
      */
    bool ReadDefinitionSection(FbxDocument *pDocument, FbxArray<Fbx6ObjectTypeInfo*>& pObjectContent );

    /** Read object section and fill object type info array and external reference
      *	\param pDocument        Document to read
      * \param pObjectContent   Object type info array to fill
      * \param pDocReferences   External references to fill
      *	\return if reading object section is successful return \c true, otherwise return \c false.
      */
    bool ReadObjectSection(FbxDocument *pDocument, FbxArray<Fbx6ObjectTypeInfo*>& pObjectContent, Fbx6TypeReadReferences& pDocReferences );

    /** Read object information from document
      *	\param pDocument            Document to read
      * \param pObjectType          Object type to assign
      * \param pObjectSubType       Object subtype to assign
      * \param pObjectName          Object Name
      * \param pObjectUniqueId      Object unique id
      * \param pReferencedObject    Reference object
      * \param pDocReferences       External reference
      *	\return if reading object is successful return \c true, otherwise return \c false.      
      */
    bool ReadObject(FbxDocument *pDocument, FbxString& pObjectType, FbxString& pObjectSubType, FbxString& pObjectName, FbxString& pObjectUniqueId, FbxObject* pReferencedObject, Fbx6TypeReadReferences& pDocReferences);

    /** Read the connection section from document
      *	\param pDocument        Document to read
      *	\return if reading connection section is successful return \c true, otherwise return \c false.
      */
    bool ReadConnectionSection(FbxDocument *pDocument );
    //@}

    /**
      * \name Takes and animation
      */
    //@{
    
    /** Read animation from document
      *	\param pDocument        Document to read
      *	\return if reading animation is successful return \c true, otherwise return \c false.
      */
    bool ReadDocumentAnimation(FbxDocument *pDocument);

    /** Read object animation from file object
      *	\param pFileObject      File object handle
      * \param pNode            Fill this node with animation
      * \param pAnimStack       Animation stack to read from
      * \param pExceptionFlag   Exception flag
      */
    void ReadObjectAnimation(FbxIO& pFileObject, FbxObject* pNode, FbxAnimStack& pAnimStack, int pExceptionFlag);

    /** Read property animation from file object
      *	\param pFileObject      File object handle
      * \param pProp            Fill the property with animation
      * \param pAnimStack       Animation stack to read from
      */
    void ReadPropertyAnimation(FbxIO& pFileObject, FbxProperty* pProp, FbxAnimStack& pAnimStack);

    /** Read take animation from fbx scene
      *	\param pScene           Scene to read animation
      * \param pTakeInfo        Take info to read from
      * \remarks This function will allocate the corresponding FbxAnimStack with the base animation layer.
      */
    bool ReadTakeAnimation(FbxScene& pScene, FbxTakeInfo* pTakeInfo);

    /** Read node animation from file
      * \param pFileObject      File object to read
      *	\param pScene           Scene to read animation
      * \param pAnimStack       The animation stack to read from
      * \param pTakeInfo        Take info to read from
      */
    bool ReadNodeAnimation(FbxIO& pFileObject, FbxScene& pScene, FbxAnimStack& pAnimStack, FbxTakeInfo* pTakeInfo);


    /** Read layer information from file
      *	\param pFileObject      File object to read
      * \param pTakeInfo        Take info to read from
      */
    void ReadLayers(FbxIO& pFileObject, FbxTakeInfo* pTakeInfo);

    /** Read time warps from file
      *	\param pFileObject      File object to read
      * \param pTimeWarpSet     Time warp set to fill
	  *	\param pScene           Scene holding the time warp curves.
      */
    void ReadTimeWarps(FbxIO& pFileObject, FbxMultiMap& pTimeWarpSet, FbxScene& pScene);

    /** Read thumbnail
      *	\return A pointer of thumbnail. Return \c NULL if any error exist
      */
    FbxThumbnail* ReadThumbnail();

    /** Set time shift for node animation from take information
      * \param pScene           Scene to read
      *	\param pAnimStack       The animation stack to modify
      * \param pTimeOffsetType  A value from the FbxTakeInfo::EImportOffsetType enumeration that indicates the time shift offset type
      * \param pTimeOffset      The time shift offset
      * \return if time shifting is successful return \c true, otherwise return \c false.
      */
    bool TimeShiftNodeAnimation(FbxScene& pScene, FbxAnimStack& pAnimStack, int pTimeOffsetType, FbxTime pTimeOffset);
    //@}

    /**
      * \name Camera switcher
      */
    //@{

    /** Read camera switcher from scene
      *	\param pScene       Scene to read from
      */
    void ReadCameraSwitcher(FbxScene& pScene);

    /** Fill camera switcher object with data
      *	\param pCameraSwitcher    Camera switcher to fill  
      */
    bool ReadCameraSwitcher( FbxCameraSwitcher& pCameraSwitcher );

    /** Reorder camera switcher indices in the scene
      *	\param  pScene          Scene to read from
      */
    void ReorderCameraSwitcherIndices(FbxScene& pScene);
    //@}

    /**
      * \name Global parameters
      */
    //@{

    /** Read global light settings from scene
      *	\param  pScene          Scene to read from
      */
    void ReadGlobalLightSettings(FbxScene& pScene);

    /** Read global time settings from scene
      *	\param  pScene          Scene to read from
      */
    void ReadGlobalTimeSettings(FbxScene& pScene);

    /** Read global camera settings from scene
      *	\param  pScene          Scene to read from
      */
    void ReadGlobalCameraSettings(FbxScene& pScene);

    /** Read shadow plane from scene
      *	\param  pScene          Scene to read from
      */
    void ReadShadowPlane(FbxScene& pScene);

    /** Read ambient color from scene
      *	\param  pScene          Scene to read from
      */
    void ReadAmbientColor(FbxScene& pScene);

    /** Read fog option from scene
      *	\param  pScene          Scene to read from
      */
    void ReadFogOption(FbxScene& pScene);
    //@}

    /**
      * \name Character
      */
    //@{

    /** Read character information from file
      *	\param pCharacter       Character object to fill
      *	\param pInputType       Unused.
      *	\param pInputIndex      Unused.
      */
    void ReadCharacter(FbxCharacter& pCharacter,int& pInputType, int& pInputIndex);

    /** Read character link group information from file by group id
      *	\param pCharacter           Character object to fill
      * \param pCharacterGroupId    Group id to read character link
      */
    void ReadCharacterLinkGroup(FbxCharacter& pCharacter, int pCharacterGroupId);

    /** Read character link information from file by node id
      *	\param pCharacter           Character object to fill
      * \param pCharacterNodeId     Character node id
      */
    void ReadCharacterLink(FbxCharacter& pCharacter, int pCharacterNodeId);

    /** Read character link formation in rotation space
      *	\param pCharacterLink       Character link object to fill
      */
    void ReadCharacterLinkRotationSpace(FbxCharacterLink& pCharacterLink);

    /** Read character pose from file
      *	\param pCharacterPose       Character pose to fill
      * \return if reading character pose is successful return \c true, otherwise return \c false.
      */
    bool ReadCharacterPose(FbxCharacterPose& pCharacterPose); // TBV
    //@}

    /**
      * \name Misc
      */
    //@{
		/** Read pose object from scene
		  *	\param pScene               Scene to read from
		  * \param pPose                Pose object
		  * \param pAsBindPose          whether to treat the pose as BindPose
		  * \return if reading pose is successful return \c true, otherwise return \c false.
		  */
		bool ReadPose(FbxScene& pScene, FbxPose* pPose, bool pAsBindPose);

		/** Read media data from document
		  *	\param pDocument                Document to read from
		  * \param pEmbeddedMediaDirectory  the directory path storing the embedded media
		  * \return if reading media is successful return \c true, otherwise return \c false.
		  */
		bool ReadMedia(FbxDocument *pDocument, const char* pEmbeddedMediaDirectory = "");

		/** Read global settings from file
		  *	\param pGlobalSettings          global settings object to fill
		  * \return if reading global settings is successful return \c true, otherwise return \c false.
		  */
		bool ReadGlobalSettings(FbxGlobalSettings& pGlobalSettings);
    //@}

    /**
    * \name Objects
    */
    //@{

    /** Read node data from file
      *	\param pNode            Node object to fill data
      * \param pObjectSubType   Subtype of object
      * \param pDocReferences   External reference
      * \return if reading node data is successful return \c true, otherwise return \c false.
      */
    bool ReadNode                       ( FbxNode& pNode, FbxString& pObjectSubType, Fbx6TypeReadReferences& pDocReferences );

    /** Read properties and flags for fbx container
      *	\param pContainer           container to fill data
      * \return if reading data to container is successful return \c true, otherwise return \c false.
      */
	bool ReadContainer					( FbxContainer& pContainer );

    /** Read properties and flags for fbx generic node
      *	\param pNode                generic node to fill data
      * \return if reading data to generic node is successful return \c true, otherwise return \c false.
      */
    bool ReadGenericNode                ( FbxGenericNode& pNode );

    /** Read shading information of node
      *	\param pNode                fbx node to fill shading information
      * \return if reading shading information to node is successful return \c true, otherwise return \c false.
      */
    bool ReadNodeShading                ( FbxNode& pNode );

    /** Read back-face culling type for node
      *	\param pNode                fbx node
      * \return if reading culling type to node is successful return \c true, otherwise return \c false.
      */
    bool ReadNodeCullingType            ( FbxNode& pNode ); // TBV, probablement passe tout en property

    /** Read target transform for node
      *	\param pNode                fbx node
      * \return if reading target transform to node is successful return \c true, otherwise return \c false.
      */
    bool ReadNodeTarget                 ( FbxNode& pNode );

    /** Read node attribute according to object subtype
      *	\param pNode                fbx node
      * \param pObjectSubType       object subtype
      * \param pCreatedAttribute    set to true if attribute exists
      * \param pDocReferences       external reference to search
      * \return if reading node attribute is successful return \c true, otherwise return \c false.
      */
    bool ReadNodeAttribute              ( FbxNode& pNode , FbxString& pObjectSubType, bool& pCreatedAttribute, Fbx6TypeReadReferences& pDocReferences);

    /** Read node attribute according to object subtype
      * \param pObjectSubType       object subtype
      * \param pObjectName          object name
      * \param pObjectUniqueId      unique id of object
      * \param pReferencedObject    pointer of reference object
      * \return A pointer of node attribute. Return \c NULL if the attribute does not exist
      */
    FbxNodeAttribute* ReadNodeAttribute( FbxString& pObjectSubType, FbxString& pObjectName, FbxString& pObjectUniqueId, FbxObject* pReferencedObject);

    /** Read node properties , flags and update the 
      * node pivot and limits according to properties
      *	\param pNode                            FBX node
      * \param pReadNodeAttributeProperties     whether to 
      * \return if reading node properties is successful return \c true, otherwise return \c false.
      */
    bool ReadNodeProperties             ( FbxNode& pNode, bool pReadNodeAttributeProperties );

    /** Read layered texture from file
      *	\param pTex                             Layered texture to fill
      * \return if reading layered texture is successful return \c true, otherwise return \c false.
      */
    bool ReadLayeredTexture             ( FbxLayeredTexture& pTex );

    /** Read FBX links for geometry
      * \param pGeometry                        FBX geometry
      * \return if reading geometry links is successful return \c true, otherwise return \c false.
      */
    bool ReadGeometryLinks              ( FbxGeometry& pGeometry );

    /** Read FBX shapes for geometry
      *	\param pGeometry                        FBX geometry
      * \return if reading geometry shapes is successful return \c true, otherwise return \c false.
      */
    bool ReadGeometryShapes             ( FbxGeometry& pGeometry );

    /** Read the null node from file
      *	\param pNull                            Null node
      * \return if reading null node is successful return \c true, otherwise return \c false.      
      */
    bool ReadNull                       ( FbxNull& pNull );

    /** Read the marker node from file
      *	\param pMarker                            Marker node
      * \return if reading marker node is successful return \c true, otherwise return \c false.      
      */
    bool ReadMarker                     ( FbxMarker& pMarker );

    /** Read the camera node from file
      *	\param pCamera                            Camera node
      * \return if reading camera node is successful return \c true, otherwise return \c false.      
      */
    bool ReadCamera                     ( FbxCamera& pCamera );

    /** Read the stereo camera node from file
    *	\param pCameraStereo                            Stereo camera node
    * \return if reading stereo camera node is successful return \c true, otherwise return \c false.      
    */
    bool ReadCameraStereo               ( FbxCameraStereo& pCameraStereo );

    /** Read the precomp file from binary file
    *	\param pCameraStereo                            Stereo camera node
    * \return if reading precomp file is successful return \c true, otherwise return \c false.      
    */
    bool ReadCameraStereoPrecomp        (FbxCameraStereo& pCameraStereo);

    /** Read the light node from file
      *	\param pLight                            light node
      * \return if reading light node is successful return \c true, otherwise return \c false.      
      */
    bool ReadLight                      ( FbxLight& pLight );

    /** Read the binding table node from file.
      * Create all the binding table entries and fill with embedded data
      *	\param pTable                            binding table
      * \return if reading binding table is successful return \c true, otherwise return \c false.      
      */
    bool ReadBindingTable               ( FbxBindingTable& pTable );

    /** Read the binding operator from file
      *	\param pOperator                         binding operator
      * \return if reading binding operator is successful return \c true, otherwise return \c false.      
      */
    bool ReadBindingOperator            ( FbxBindingOperator& pOperator );

    /** Read vertices, polygon indices, edges, layer elements, geometry links and shapes to mesh object
      *	\param pMesh                            fbx mesh
      * \return if reading mesh object is successful return \c true, otherwise return \c false. 
      */
    bool ReadMesh                       ( FbxMesh& pMesh );

    /** Read mesh smoothness factor from mesh
      * \param pMesh                            fbx mesh
      * \return if reading mesh smoothness is successful return \c true, otherwise return \c false. 
      */
    bool ReadMeshSmoothness               ( FbxMesh& pMesh );

    /** Read vertices of mesh object
      *	\param pMesh                            fbx mesh
      * \return if reading mesh vertices is successful return \c true, otherwise return \c false. 
      */
    bool ReadMeshVertices               ( FbxMesh& pMesh );

    /** Read polygon indices of mesh object
      *	\param pMesh                            fbx mesh
      * \return if reading polygon indices is successful return \c true, otherwise return \c false. 
      */
    bool ReadMeshPolygonIndex           ( FbxMesh& pMesh );

    /** Read edges of mesh object
      *	\param pMesh                            fbx mesh
      * \return if reading mesh edges is successful return \c true, otherwise return \c false. 
      */
    bool ReadMeshEdges                  ( FbxMesh& pMesh );

    //** Read FBX subdiv, base mesh, finest mesh, current subdiv level...
    //*	\param pSubdiv                            fbx subdiv
    //*	\param pObjectName                        Object Name
    //*	\param pReferencedObject                  pointer of reference object
    //* \return if reading subdiv object is successful return \c true, otherwise return \c false. 
    //*/
    //bool ReadSubdiv( FbxSubDiv& pSubdiv, FbxString& pObjectName, FbxObject* pReferencedObject);

    /** Read FBX subdiv, base mesh, finest mesh, current subdiv level...
    *	\param pSubdiv                            fbx subdiv
    * \return if reading subdiv object is successful return \c true, otherwise return \c false. 
    */
    bool ReadSubdiv( FbxSubDiv& pSubdiv);

    /** Read properties and flags for fbx document
      *	\param pSubDocument                     fbx document
      * \return if reading document information is successful return \c true, otherwise return \c false.
      */
    bool ReadDocument                   ( FbxDocument& pSubDocument );

    /** Read properties and flags for fbx collection
      *	\param pCollection                      fbx collection
      * \return if reading fbx collection is successful return \c true, otherwise return \c false.
      */
    bool ReadCollection                 ( FbxCollection& pCollection );

    /** Read properties and flags for fbx selection set
    *	\param pSelectionSet                    fbx selection set
    * \return if reading fbx selection set is successful return \c true, otherwise return \c false.
    */
    bool ReadSelectionSet                ( FbxSelectionSet& pSelectionSet);

    bool ReadSelectionNode             (FbxSelectionNode& pSelectionNode);

    /** Read nurb data including surface types, nurb type, display type, steps, control points and UV.
      *	\param pNurbs                            Nurb object
      * \return if reading nurb data is successful return \c true, otherwise return \c false.
      */
    bool ReadNurb                       ( FbxNurbs& pNurbs );

    /** Read nurb surface data including surface types, surface type, display type, steps, control points and UV vectors.
      *	\param pNurbs                            Nurb surface object
      * \return if reading nurb surface data is successful return \c true, otherwise return \c false.
      */
    bool ReadNurbsSurface               ( FbxNurbsSurface& pNurbs );

    /** Read patch data including patch type, dimension, display type, steps, UV cap and control points.
      *	\param pPatch                           Patch object
      * \return if reading patch data is successful return \c true, otherwise return \c false.      
      */
    bool ReadPatch                      ( FbxPatch& pPatch );

    /** Read patch type in string and return type in enum
      *	\param pPatch                           Patch object
      * \return patch type in enum      
      */
    int  ReadPatchType                  ( FbxPatch& pPatch );


    /** Read nurb curve data including types, dimension, rational-ness, control points and knots.
      *	\param pNurbsCurve                      Nurb curve
      * \return if reading nurb curve data is successful return \c true, otherwise return \c false.  
      */
    bool ReadNurbsCurve                 ( FbxNurbsCurve& pNurbsCurve );

    /** Read trim Nurb surface objects with properties
      *	\param pNurbs                            Trim nurb surface                * \return if reading trim nurb surface is successful return \c true, otherwise return \c false.                 
      */
    bool ReadTrimNurbsSurface           ( FbxTrimNurbsSurface& pNurbs );

    /** Read properties and flags of fbx boundary
      *	\param pBoundary                        Fbx boundary object
      * \return if reading fbx boundary is successful return \c true, otherwise return \c false.   
      */
    bool ReadBoundary                   ( FbxBoundary& pBoundary );

    /** Read shape object properties from file
      *	\param pShape                           Fbx Shape
      * \param pGeometry                        Geometry contains the shape
      * \return if reading shape object properties is successful return \c true, otherwise return \c false.   
      */
    bool ReadShape                      ( FbxShape& pShape, FbxGeometry& pGeometry);

    /** Read properties and flags of fbx implementation
      *	\param pImplementation                  Fbx implementation
      * \return if reading fbx implementation is successful return \c true, otherwise return \c false.  
      */
    bool ReadImplementation             ( FbxImplementation& pImplementation );

    /** Read texture object data including name, UV transform, alpha and cropping.
      *	\param pTexture                         Fbx texture object
      * \return if reading texture object is successful return \c true, otherwise return \c false.  
      */
    bool ReadFileTexture                    (FbxFileTexture& pTexture);

    /** Read surface material from file
      *	\param pName                Material Name
      * \param pMaterialType        Material type
      * \param pReferencedMaterial  Reference material to clone from if it is not \c NULL
      * \return A pointer of read surface material
      */
    FbxSurfaceMaterial* ReadSurfaceMaterial(const char* pName, const char* pMaterialType, FbxSurfaceMaterial* pReferencedMaterial);

    /** Read video object from file
      *	\param pVideo               Fbx video object
      * \return if reading video object is successful return \c true, otherwise return \c false.  
      */
    bool ReadVideo                      (FbxVideo& pVideo);

    /** Read thumbnail object from file
      *	\param pThumbnail           Fbx thumbnail
      * \return if reading thumbnail is successful return \c true, otherwise return \c false.  
      */
    bool ReadThumbnail                  (FbxThumbnail& pThumbnail);
    //@}


    /**
    * \name Layer elements
    */
    //@{

    /** Read all layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \return if reading all layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElements              (FbxGeometry& pGeometry);

    /** Read material layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsMaterial        material layer element array
      * \return if reading material layer elements is successful return \c true, otherwise return \c false.
      */
    bool ReadLayerElementsMaterial      (FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsMaterial);

    /** Read normal layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsNormal          normal layer element array
      * \return if reading normal layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementsNormal        (FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsNormal);

    /** Read Tangent layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsTangent          Tangent layer element array
      * \return if reading Tangent layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementsTangent        (FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsTangent); 

    /** Read Binormal layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsBinormal          Binormal layer element array
      * \return if reading Binormal layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementsBinormal        (FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsBinormal);

    /** Read vertex color layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsVertexColor     vertex color layer element array
      * \return if reading vertex color layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementsVertexColor   (FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsVertexColor);

    /** Read texture layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsTexture         texture layer element array
      * \param pTextureType             the type of elements to read
      * \return if reading texture layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementsTexture (FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsTexture, FbxLayerElement::EType pTextureType);

    /** Read UV layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsUV              UV layer element array
      * \param pTextureType             the type of elements to read
      * \return if reading UV layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementsChannelUV (FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsUV, FbxLayerElement::EType pTextureType);

    /** Read polygon group layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsPolygonGroup    polygon group layer element array
      * \return if reading polygon group layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementsPolygonGroup  (FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsPolygonGroup);

    /** Read smoothing layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsSmoothing       Smoothing group layer element array
      * \return if reading smoothing layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementsSmoothing     (FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsSmoothing);

    /** Read user data layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsUserData        User data layer element array
      * \return if reading user data layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementsUserData      (FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsUserData);

    /** Read visibility layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsVisibility      visibility layer element array
      * \return if reading visibility layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementsVisibility    (FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsVisibility);

    /** Read edge crease layer elements for geometry
      *	\param pGeometry                geometry to fill
      * \param pElementsEdgeCrease      edge crease layer element array
      * \return if reading edge crease layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementEdgeCrease     (FbxGeometry*pGeometry, FbxArray<FbxLayerElement*>& pElementsEdgeCrease);

    /** Read vertex crease layer elements for geometry
      * \param pGeometry                geometry to fill
      * \param pElementsVertexCrease    vertex crease layer element array
      * \return if reading vertex crease layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementVertexCrease   (FbxGeometry*pGeometry, FbxArray<FbxLayerElement*>& pElementsVertexCrease);

    /** Read hole layer elements for geometry
      * \param pGeometry                geometry to fill
      * \param pElementsHole            hole layer element array
      * \return if reading hole layer elements is successful return \c true, otherwise return \c false.        
      */
    bool ReadLayerElementHole           (FbxGeometry*pGeometry, FbxArray<FbxLayerElement*>& pElementsHole);
    //@}

    /**
    * \name Geometry weighted maps
    */
    //@{

    /** Read geometry weight map from file
      *	\param pGeometryWeightedMap     geometry weighted
      * \return if reading geometry weight map is successful return \c true, otherwise return \c false.
      */
    bool ReadGeometryWeightedMap(FbxGeometryWeightedMap& pGeometryWeightedMap);
    //@}

    /**
    * \name Deformers / Constraints
    */
    //@{

    /** Read link object from file
      *	\param pLink            fbx link object
      * \return if reading link object is successful return \c true, otherwise return \c false.
      */
    bool ReadLink(FbxCluster& pLink);

    /** Read SDK skin from file
      *	\param pSkin            SDK skin object
      * \return if reading skin object is successful return \c true, otherwise return \c false.
      */
    bool ReadSkin(FbxSkin& pSkin);

    /** Read properties and flags for vertex cache deformer from file
      *	\param pDeformer            fbx vertex cache deformer
      * \return if reading vertex cache deformer is successful return \c true, otherwise return \c false.
      */
    bool ReadVertexCacheDeformer(FbxVertexCacheDeformer& pDeformer);

    /** Read cluster object data from file
      *	\param pCluster            fbx cluster object
      * \return if reading cluster object is successful return \c true, otherwise return \c false.
      */
    bool ReadCluster(FbxCluster& pCluster);

    /** Read constraint object from file
      *	\param pPosition            fbx constraint object
      * \return if reading constraint object is successful return \c true, otherwise return \c false.
      */
    bool ReadConstraint(FbxConstraint& pPosition);
    //@}

    // Cache

    /** Read fbx cache file
      *	\param pCache       fbx cache
      * \return if reading cache data is successful return \c true, otherwise return \c false.
      */
    bool ReadCache(FbxCache& pCache);

    /**
    * \name Post-processing / utility functions
    */
    //@{

	/** Make sure the Camera's background textures are properly connected
	  * \param pScene			fbx scene
	  * \remarks This function only applies when it detects older file versions in 
	  * which the background texture is connected directly to the object instead of
	  * the corresponding property.
	 */
	bool ResolveCameraBackgrounds(FbxScene& pScene);

    /** Remove duplicate textures in the same scene
      *	\param pScene           fbx scene
      */
    void RemoveDuplicateTextures(FbxScene& pScene);

    /** Replace textures in the geometry
      *	\param pTextureDuplicate    texture array
      * \param pTextureReplacement  texture array to replace
      * \param pGeometry            geometry owns these textures
      * \param pTextureType         layer element type
      */
    void ReplaceTextures(FbxArray<FbxTexture*> const& pTextureDuplicate,
                         FbxArray<FbxTexture*> const& pTextureReplacement,
                         FbxGeometry* pGeometry, FbxLayerElement::EType pTextureType);

    /** Remove duplicated materials in the same scene
      *	\param pScene       FBX scene
      */    
    void RemoveDuplicateMaterials(FbxScene& pScene);

    /** convert camera name for naming convention
      *	\param pCameraName  original camera name
      * \return new name for the camera
      */
    FbxString ConvertCameraName(FbxString pCameraName);

    /** Search string in a string array
      *	\param pString      the string to search
      * \param pStringArray string array
      * \return return the index of the array if the string is found, otherwise return \c -1
      */
    int  FindString(FbxString pString, FbxArray<FbxString*>& pStringArray);

    /** Read password from string
      *	\param pPassword        password in string
      * \return if the password is valid return \c true, otherwise return \c false
      */
    bool ReadPassword(FbxString pPassword);

    /** Publish properties
      *	\param pObject      fbx object
      */
    void PublishProperties(FbxObject& pObject);

    /** Read properties for fbx object from file object
      *	\param pFbxObject                   fbx object
      * \param pFbxFileObject               fbx file object
      * \param pReadNodeAttributeProperties whether to read properties for node attributes
      */
    bool ReadProperties(FbxObject *pFbxObject, FbxIO *pFbxFileObject, bool pReadNodeAttributeProperties=true);


    /** Read properties and flags for fbx object from file object
      *	\param pFbxObject                   fbx object
      * \param pFbxFileObject               fbx file object
      * \param pReadNodeAttributeProperties whether to read properties for node attributes
      * \return if reading properties and flags is successful return \c true, otherwise return \c false.
      */
    bool ReadPropertiesAndFlags(FbxObject *pFbxObject, FbxIO *pFbxFileObject, bool pReadNodeAttributeProperties=true);

    /** Read flags for fbx object from file object
      *	\param pFbxObject               object to set flags
      * \param pFbxFileObject           file to read
      * \return if reading flags is successful return \c true, otherwise return \c false.  
      */
    bool ReadFlags(FbxObject *pFbxObject, FbxIO* pFbxFileObject);

    /** Rebuild trim regions indices from the boundary connections
      *	\param pScene           Fbx scene
      */
    void RebuildTrimRegions(FbxScene& pScene) const;

    /** Rebuild subdivision object from subdiv-mesh connections
    *	\param pScene           Fbx scene
    */
    void SetSubdivision(FbxScene& pScene) const;

	/** Convert shape deform property to DeformPercent property of FbxBlendShapeChannel
	*	\param pScene           Fbx scene
	*/
	void ConvertShapeDeformProperty(FbxScene& pScene) const;

    /** Rebuild layered texture alphas from sub texture connections.
      *	\param pScene           Fbx scene
      */
    void RebuildLayeredTextureAlphas(FbxScene& pScene) const;

    //---------------- in progress -------------------------------
    void ReadOptionsInMainSection();
    void ReadTakeOptions();
    bool ReadOptionsInExtensionSection(int& pSectionIndex);
    bool WriteOptionsInExtensionSection(bool pOverwriteLastExtensionSection=false); 
    //--------------- end in progress ----------------------------

    /** Read global settings, axis system, system unit from main section of file
      *
      */
    void ReadGlobalSettingsInMainSection();

    /** Read statistic data from definition section 
      *	
      */
    void ReadDefinitionSectionForStats();
    //@}

private:

    FbxReaderFbx6& operator=(FbxReaderFbx6 const&) { return *this; }

    FbxIO*                  mFileObject;
    FbxImporter&            mImporter;
    FbxCharPtrSet           mNodeArrayName;
    FbxObjectStringMap      mObjectMap;

    bool					mParseGlobalSettings;
    FbxAxisSystem			mAxisSystem;
    FbxSystemUnit			mSystemUnit;
	FbxTime::EMode			mFrameRate;

    bool					mRetrieveStats;
    FbxStatistics*	        mDefinitionsStatistics;
    FbxArray<FbxTakeInfo *> mTakeInfo;
    FbxDocumentInfo*        mSceneInfo;
    FbxAnimLayer*           mAnimLayer;
	FbxMultiMap					mNickToKFCurveNodeTimeWarpsSet;
	FbxMultiMap*					mNickToAnimCurveTimeWarpsSet;

    Fbx6ClassTemplateMap    mClassTemplateMap;
    FbxProgress*            mProgress;
    bool                    mProgressPause;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_FBX_READER_FBX6_H_ */
