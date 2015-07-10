/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxreaderfbx5.h
#ifndef _FBXSDK_FILEIO_FBX_READER_FBX5_H_
#define _FBXSDK_FILEIO_FBX_READER_FBX5_H_

#include <fbxsdk.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxAnimLayer;
class Fbx5ObjectTypeInfo;	

FbxReader* CreateFBXReader(FbxManager& pManager, 
							FbxImporter& pImporter,
							int pID,
                            FbxStatus& pStatus);
void GetInfoFBXReader(int* pCount, 
					  const char* * pExtensions, 
					  const char* * pDescriptions);

class FbxReaderFbx5 : public FbxReader
{
public:
	FbxReaderFbx5(FbxManager& pManager, FbxImporter& pImporter, int pID, FbxStatus& pStatus);
	virtual ~FbxReaderFbx5();

    virtual bool FileOpen(char* pFileName, bool pIgnoredArg);
    virtual bool FileOpen(char* pFileName, EFileOpenSpecialFlags pFlags){ return FbxReader::FileOpen(pFileName, pFlags); }
	virtual bool FileOpen(char* pFileName);
    virtual bool FileOpen(FbxFile * pFile);
	virtual bool FileOpen(FbxStream * pStream, void* pStreamData);
	virtual bool FileClose();
	virtual bool IsFileOpen();

	virtual void SetEmbeddingExtractionFolder(const char* pExtractFolder);

	typedef enum 
	{
		eASCII,
		eBINARY,
		eENCRYPTED
	} EImportMode;

	EImportMode GetImportMode();
	virtual void GetVersion(int& pMajor, int& pMinor, int& pRevision);

	virtual bool GetReadOptions(bool pParseFileAsNeeded = true);
	virtual bool Read(FbxDocument* pDocument);

	virtual bool GetReadOptions(FbxIO* pFbx, bool pParseFileAsNeeded = true);
	virtual bool Read(FbxScene& pScene, FbxIO* pFbx);

    virtual FbxDocumentInfo* GetSceneInfo() { return mSceneInfo; }
    virtual FbxArray<FbxTakeInfo*>* GetTakeInfo() { return &mTakeInfo; }

	virtual bool SupportsStreams() const { return true; }

private:
	void ReadOptionsInMainSection();
	void ReadTakeOptions();
	bool ReadOptionsInExtensionSection(int& pSectionIndex);
	void ReadOptionsInGenericSection();
	bool WriteOptionsInExtensionSection(bool pOverwriteLastExtensionSection=false);
	bool WriteThumbnail(FbxThumbnail*);
	FbxDocumentInfo* ReadSceneInfo();
	FbxDocumentInfo* ReadSceneInfo(FbxString& pType);
	void WriteSceneInfo(FbxDocumentInfo*);
	void SetIsBeforeVersion6WithMainSection(bool pOpenMainSection);
	
	bool ReadDefinitionSection(FbxScene& pScene, FbxArray<Fbx5ObjectTypeInfo*>& pObjectContent);
	bool ReadObjectSection(FbxScene& pScene, FbxArray<Fbx5ObjectTypeInfo*>& pObjectContent);
	bool ReadObject(FbxScene& pScene, FbxString& pObjectType, FbxString& pObjectSubType, FbxString& pObjectName, FbxString& pObjectUniqueId);
	bool ReadNode();
	//bool ReadGenericNode(FbxScene& pScene);
	bool ReadAnimation(FbxScene& pScene);
	bool ReadTakeAnimation(FbxScene& pScene, FbxTakeInfo* pTakeInfo);
	FbxThumbnail* ReadThumbnail();
	bool ReadNodeAnimation(FbxIO& pFileObject, FbxScene& pScene, FbxTakeInfo* pTakeInfo);	
	bool TimeShiftNodeAnimation(FbxScene& pScene, FbxTakeInfo* pTakeInfo);
    bool ReadHierarchy(FbxNode& pRootNode);
	bool ResolveHierarchy(FbxNode& pRootNode);
	bool ResolveLinks(FbxNode& pRootNode, FbxNode& pCurrentNode);
	bool ResolveTargets(FbxNode& pRootNode);
	bool ResolveUpNodes(FbxNode& pRootNode);
	bool ResolveCameraBackgrounds(FbxScene& pScene);
	void RemoveDuplicateTextures(FbxScene& pScene);
	void RemoveDuplicateMaterials(FbxScene& pScene);

	void ReadPose(FbxScene& pScene);
	bool ReadPose(FbxScene& pScene, FbxPose* pPose, bool pAsBindPose);

	void ReadCameraSwitcher(FbxScene& pScene);
	void ReorderCameraSwitcherIndices(FbxScene& pScene);

    void ReadGobo(FbxScene& pScene);
    void ReadGoboSection(FbxScene& pScene);
	void ReadGobo(FbxGobo& pGobo);

    void ReadCharacter(FbxScene& pScene);
	void ReadCharacter(FbxCharacter& pCharacter,int& pInputType, int& pInputIndex);
	void ReadCharacterLinkGroup(FbxCharacter& pCharacter, int pCharacterGroupId);
	void ReadCharacterLink(FbxCharacter& pCharacter, int pCharacterNodeId);
	void ReadCharacterLinkRotationSpace(FbxCharacterLink& pCharacterLink);
	void ReadFilterSet(FbxCharacter& pCharacter);
	void ReadControlSet(FbxControlSet& pControlSet);
	void ReadControlSetLinkGroup(FbxControlSet& pControlSet, int pCharacterGroupId);
	void ReadControlSetLink(FbxControlSet& pControlSet, int pCharacterNodeId);
	void ReadEffector(FbxControlSet& pControlSet);	
	void ReadEffectorAux(FbxControlSet& pControlSet);

	int  ReadCharacterPose(FbxScene& pScene);
	bool ReadCharacterPose(FbxCharacterPose& pCharacterPose);

	void ReadGlobalLightSettings(FbxScene& pScene);
    void ReadShadowPlane(FbxScene& pScene);
    void ReadAmbientColor(FbxScene& pScene);
    void ReadFogOption(FbxScene& pScene);

	void ReadGlobalCameraAndTimeSettings(FbxScene& pScene); // for pre v6 files
	void ReadGlobalTimeSettings(FbxScene& pScene);

	void ReadGlobalCameraSettings(FbxScene& pScene);

    bool ReadMedia(FbxScene& pScene, const char* pEmbeddedMediaDirectory = "");
	FbxString ReadMediaClip(const char* pEmbeddedMediaDirectory);

	bool ReadNode                       ( FbxNode& pNode );
	bool ReadGenericNode                ( FbxGenericNode& pNode );
	bool ReadNodeChildrenName           ( FbxNode& pNode );
	bool ReadNodeShading                ( FbxNode& pNode );
	bool ReadNodeCullingType            ( FbxNode& pNode );
	bool ReadNodeLimits                 ( FbxNode& pNode );
	bool ReadNodeTarget                 ( FbxNode& pNode );
	bool ReadNodeAttribute              ( FbxNode& pNode );
	bool ReadNodePivots                 ( FbxNode& pNode );
	bool ReadNodeDefaultAttributes      ( FbxNode& pNode );
	bool ReadNodeProperties				( FbxNode& pNode );
	bool ReadGeometry                   ( FbxGeometry& pGeometry );
	bool ReadGeometryMaterial           ( FbxGeometry& pGeometry );
	bool ReadGeometryTexture            ( FbxGeometry& pGeometry );
	bool ReadGeometryLinks              ( FbxGeometry& pGeometry );
	bool ReadGeometryShapes             ( FbxGeometry& pGeometry );
	bool ReadGeometryLayer              ( FbxGeometry& pGeometry );
	bool ReadGeometryTextureLayer       ( FbxGeometry& pGeometry, int pLayerIndex );

	bool ReadNull                       ( FbxNull& pNull );

	bool ReadMarker                     ( FbxMarker& pMarker );

	bool ReadCamera                     ( FbxCamera& pCamera );
	bool ReadCameraSwitcher             ( FbxCameraSwitcher& pCameraSwitcher );

	bool ReadLight                      ( FbxLight& pLight );

	bool ReadMesh                       ( FbxMesh& pMesh );
	bool ReadMeshVertices               ( FbxMesh& pMesh );
	bool ReadMeshNormals                ( FbxMesh& pMesh );
	bool ReadMeshAssignation            ( FbxMesh& pMesh );
	bool ReadMeshPolygonIndex           ( FbxMesh& pMesh );
	bool ReadMeshPolyGroupIndex         ( FbxMesh& pMesh );
	bool ReadMeshMaterialsID            ( FbxMesh& pMesh );
	bool ReadMeshTexturesID             ( FbxMesh& pMesh );
	bool ReadMeshTextureType            ( FbxMesh& pMesh );
	bool ReadMeshTextureUV              ( FbxMesh& pMesh );
	bool ReadMeshTextureIndex           ( FbxMesh& pMesh );
	bool ReadMeshVertexColors           ( FbxMesh& pMesh );


	// Layer elements	
	bool ReadLayerElements				(FbxGeometry& pGeometry);
	bool ReadLayerElementsMaterial		(FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsMaterial);	
	bool ReadLayerElementsNormal		(FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsNormal);
	bool ReadLayerElementsVertexColor	(FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsVertexColor);
	bool ReadLayerElementsTexture		(FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsTexture);
	bool ReadLayerElementsUV			(FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsUV);
	bool ReadLayerElementsPolygonGroup	(FbxGeometry* pGeometry, FbxArray<FbxLayerElement*>& pElementsPolygonGroup);
	
	bool ReadNurb                       ( FbxNurbs& pNurbs );

	bool ReadPatch                      ( FbxPatch& pPatch );
	int ReadPatchType                  ( FbxPatch& pPatch );

	bool ReadTexture(FbxFileTexture& pTexture);
	bool ReadSurfaceMaterial(FbxSurfacePhong& pMaterial);
	bool ReadLink(FbxCluster& pLink);
	bool ReadSkin(FbxSkin& pSkin);
	bool ReadCluster(FbxCluster& pCluster);
	bool ReadShape(FbxShape& pShape, FbxGeometry& pGeometry);
	bool ReadVideo(FbxVideo& pVideo);
	bool ReadConstraint(FbxConstraint& pPosition);

	bool ReadUserProperties					(FbxNode& pNode);
	bool ReadProperties(FbxObject *pObject);

	//
	// 6.0 Format specific
	//
	bool ReadConnectionSection();
	void ReadPoses(FbxScene& pScene);

	FbxString ConvertCameraName(FbxString pCameraName);

	bool GenerateParametricGeometryLayer(FbxGeometry& pGeometry);
	void CorrectTextureLayers(FbxMesh& pMesh);

    void TransferAnimation(void* pRootCurveNode, FbxProperty& pRootProperty, bool pValueOnly = false);
    void ReadAnimation(FbxIO& pFileObject, void* pCurveNode);
	void ReadAnimation(FbxIO& pFileObject, FbxObject*  pObj);
    
    void ReadTimeWarps(FbxIO& pFileObject, FbxMultiMap& pTimeWarpSet);
	void DestroyTimeWarps(FbxMultiMap& pTimeWarpSet);

	FbxNode* FindNode (char* pName);
	int FindString(FbxString pString, FbxArray<FbxString*>& pStringArray);
	FbxString FindFile(FbxString pFullFilePath, FbxString pRelativeFilePath = "");

	bool ReadPassword(FbxString pPassword);

	void ReadSceneGenericPersistenceSection(FbxScene& pScene);	




private:
    FbxReaderFbx5& operator=(FbxReaderFbx5 const&) { return *this; }

    FbxIO*			mFileObject;	
	FbxImporter&	mImporter;

	FbxCharPtrSet mNodeArrayName;
	FbxCharPtrSet mTargetArrayName;
	FbxCharPtrSet mUpNodeArrayName;
	FbxCharPtrSet mCameraBackgroundArrayName;

	FbxObjectStringMap		mObjectMap;
    FbxArray<FbxTakeInfo *> mTakeInfo;
    FbxDocumentInfo * mSceneInfo;
    FbxAnimLayer* mAnimLayer;

	// Temporary storage
	FbxArray<FbxTexture*> mTemporaryTextures;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_FBX_READER_FBX5_H_ */
