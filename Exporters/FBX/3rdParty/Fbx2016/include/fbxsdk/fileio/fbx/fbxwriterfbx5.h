/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxwriterfbx5.h
#ifndef _FBXSDK_FILEIO_FBX_WRITER_FBX5_H_
#define _FBXSDK_FILEIO_FBX_WRITER_FBX5_H_

#include <fbxsdk.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

//Writable versions for this file type.  
//Sync the functions PreProcessScene and PostProcessScene with these elements of this list.

class FbxWriterFbx5 : public FbxWriter
{
public:
	FbxWriterFbx5(FbxManager& pManager, FbxExporter& pExporter, int pID, FbxStatus& pStatus);
	virtual ~FbxWriterFbx5();

	virtual bool FileCreate(char* pFileName);
    virtual bool FileCreate(FbxStream* pStream, void* pStreamData);
	virtual bool FileClose();
	virtual bool IsFileOpen();

	typedef enum 
	{
		eASCII,
		eBINARY,
		eENCRYPTED
	} EExportMode;

	void SetExportMode(EExportMode pMode);

	virtual void GetWriteOptions();
	virtual bool Write(FbxDocument* pDocument);

	virtual bool Write(FbxDocument* pDocument, FbxIO* pFbx);
	virtual bool PreprocessScene(FbxScene& pScene);
	virtual bool PostprocessScene(FbxScene& pScene);

	virtual bool SupportsStreams() const		{ return true; }

private:
	bool WriteAnimation(FbxScene& pScene);
	bool WriteAnimation(FbxNode& pRootNode, FbxAnimLayer* pAnimLayer);
	void WriteTakeNode(KFCurveNode* pCurveNode, bool pRescaleShininess); 
	bool WriteTakeNode(FbxObject& pObj, FbxAnimLayer* pAnimLayer, const char* pBlockName, bool pRescaleShininess = false);

	bool WriteThumbnail(FbxThumbnail* pThumbnail);
	void WriteSceneInfo(FbxDocumentInfo*);

	bool WriteExtensionSection(FbxScene& pScene, int pMediaCount);

    bool WriteNode(FbxNode* pNode);

	bool WriteCameraSwitcher(FbxScene& pScene);

    void WriteGobo(FbxScene& pScene);
    void WriteGoboSection(FbxScene& pScene);
	void WriteGobo(FbxGobo& pGobo);

	void WriteCharacter(FbxScene& pScene);
	void WriteCharacter(FbxScene& pScene, int pCharacterIndex);
	void WriteCharacterLinkGroup(FbxCharacter& pCharacter, int pCharacterGroupId, FbxScene& pScene, bool pBackwardCompatible);
	void WriteCharacterLink(FbxCharacter& pCharacter, int pCharacterNodeId, FbxScene& pScene, bool pBackwardCompatible);
	void WriteFilterSet(FbxCharacter& pCharacter);
	void WriteControlSet(FbxControlSet& pControlSet, FbxScene& pScene, bool pBackwardCompatible);	
	void WriteControlSetLinkGroup(FbxControlSet& pControlSet, int pCharacterGroupId, FbxScene& pScene, bool pBackwardCompatible);
	void WriteControlSetLink(FbxControlSet& pControlSet, int pCharacterNodeId, FbxScene& pScene);
	void WriteEffector(FbxControlSet& pControlSet, int pEffectorNodeId, FbxScene& pScene);
	void WriteEffectorAux(FbxControlSet& pControlSet, int pEffectorNodeId, FbxScene& pScene);

	int  WriteCharacterPose(FbxScene& pScene);
	void WriteCharacterPose(FbxCharacterPose& pCharacterPose);

	void WritePose(FbxScene& pScene);
	void WritePose(FbxPose& pPose);

	void WriteConstraint(FbxScene& pScene);

	void WriteGlobalLightSettings(FbxScene& pScene);
    void WriteShadowPlane(FbxScene& pScene);
    void WriteShadowPlaneSection(FbxScene& pScene);
    void WriteAmbientColor(FbxScene& pScene);
    void WriteFogOption(FbxScene& pScene); 

	void WriteGlobalCameraAndTimeSettings(FbxScene& pScene);
	
	bool WriteMedia(FbxScene& pScene, bool pMediaEmbedded, int& pMediaCount);
	bool WriteMediaClip(FbxString& pFileName, bool pEmbeddedMedia);
	void WriteDefaultMedia();

	bool WriteNode                  (FbxNode& pNode);
	bool WriteNodeBegin             (FbxNode& pNode);
	bool WriteNodeParameters        (FbxNode& pNode);
	bool WriteNodeVersion           (FbxNode& pNode);
	bool WriteNodeShading           (FbxNode& pNode);
	bool WriteNodeAnimationSettings (FbxNode& pNode);
	bool WriteNodeCullingType       (FbxNode& pNode);
    bool WriteNodeLimits            (FbxNode& pNode);
	bool WriteNodeProperties	    (FbxNode& pNode);
	bool WriteNodeTarget            (FbxNode& pNode);
	bool WriteNodeAnimatedProperties(FbxNode& pNode);
	bool WriteNodeAttribute         (FbxNode& pNode);
	bool WriteNodeDefaultAttributes (FbxNode& pNode);
	bool WriteNodeChildrenList      (FbxNode& pNode);
	bool WriteNodeEnd               (FbxNode& pNode);

	bool WriteNull                  ( FbxNull* pNull );

	bool WriteMarker                ( FbxNode& pNode );

	bool WriteCamera                ( FbxCamera& pCamera, bool pIsProducerCamera = false );	

	bool WriteCameraSwitcher        ( FbxCameraSwitcher& pCameraSwitcher );

	bool WriteLight                 ( FbxLight& pLight );

	bool WriteGeometry              ( FbxGeometry& pGeometry );
	bool WriteGeometryLayer         ( FbxGeometry& pGeometry );
	bool WriteGeometryTextureLayer  ( FbxGeometry& pGeometry, int pIndex );

	bool WriteMesh                  ( FbxMesh& pMesh );
	bool WriteMeshVertices          ( FbxMesh& pMesh );
	bool WriteMeshNormals           ( FbxMesh& pMesh );
	bool WriteMeshMaterial          ( FbxMesh& pMesh );
	bool WriteMeshTexture           ( FbxMesh& pMesh );
	bool WriteMeshGeometryUVInfo    ( FbxMesh& pMesh );
	bool WriteMeshPolyVertexIndex   ( FbxMesh& pMesh );
	bool WriteMeshPolyGroupIndex    ( FbxMesh& pMesh );
	bool WriteMeshVertexColors      ( FbxMesh& pMesh );

	bool WriteNurb                  ( FbxNurbs& pNurbs );

	bool WritePatch                 ( FbxPatch& pPatch );
    bool WritePatchType             ( FbxPatch& pPatch, int pType );

	bool WriteSkeleton              ( FbxSkeleton& pSkeleton );
	bool WriteSkeletonRoot          ( FbxSkeleton& pSkeleton );
	bool WriteSkeletonLimb          ( FbxSkeleton& pSkeleton );
	bool WriteSkeletonLimbNode      ( FbxSkeleton& pSkeleton );
	bool WriteSkeletonEffector      ( FbxSkeleton& pSkeleton );
	
	bool WriteOpticalReference      ( FbxOpticalReference& pOpticalReference );

	bool WriteTexture(FbxFileTexture& pTexture);
	bool WriteSurfaceMaterial(FbxSurfaceMaterial& pMaterial);
	bool WriteLink(FbxCluster& pCluster);
	bool WriteShape(FbxShape& pShape, FbxString pShapeName, FbxGeometry& pGeometry);

	bool WriteProperties(FbxObject* pObject);

	int FindString(FbxString pString, FbxArray<FbxString*>& pStringArray);
	void FindShapeValidIndices(FbxArray<FbxVector4>& pGeometryControlPoints, FbxArray<FbxVector4>& pShapeControlPoints, FbxArray<int>& lValidIndices);

	void ConvertShapeNamesToV5Format(FbxNode& pNode);
	void RevertShapeNamesToV6Format (FbxNode& pNode);

	void WritePassword();

	void FindAnimatedChannels(FbxScene& pScene);
	void ClearAnimatedChannels();

	void WriteSceneGenericPersistenceSection(FbxScene& pScene);

    void ForceKFCurveNodesOnTRS(FbxNode* pNode);
    void SetPivotStateRecursive(FbxNode* pNode);

private:
	FbxWriterFbx5& operator=(const FbxWriterFbx5&) { return *this; }

	FbxIO* mFileObject;	
	FbxExporter& mExporter;

	EExportMode mExportMode;

	FbxMultiMap mTextureAnimatedChannels;
	FbxMultiMap mMaterialAnimatedChannels;

	struct TextureAnimatedChannels
	{
		bool mTranslation;
		bool mRotation;
		bool mScaling;
		bool mAlpha;
	};

	struct SurfaceMaterialAnimatedChannels
	{
		bool mAmbient;
		bool mDiffuse;
		bool mSpecular;
		bool mEmissive;
		bool mOpacity;
		bool mShininess;
		bool mReflectivity;
	};
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_FBX_WRITER_FBX5_H_ */
