/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxwriterfbx6.h
#ifndef _FBXSDK_FILEIO_FBX_WRITER_FBX6_H_
#define _FBXSDK_FILEIO_FBX_WRITER_FBX6_H_

#include <fbxsdk.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class Fbx6TypeDefinition;
class Fbx6TypeWriteReferences;
class Fbx6TypeObjectHierarchy;

typedef FbxArray<FbxTakeInfo*> TakeInfoArray;

class FbxWriterFbx6 : public FbxWriter
{
public:
    FbxWriterFbx6(FbxManager& pManager, FbxExporter& pExporter, int pID, FbxStatus& pStatus);
    virtual ~FbxWriterFbx6();

    virtual bool    FileCreate(char* pFileName);
    virtual bool	FileCreate(FbxStream* pStream, void* pStreamData);
    virtual bool    FileClose();
    virtual bool    IsFileOpen();

    typedef enum {eASCII, eBINARY, eENCRYPTED} EExportMode;

    void            SetExportMode(EExportMode pMode);

    virtual void    GetWriteOptions();
    virtual bool    Write(FbxDocument* pDocument);
    virtual bool    PreprocessScene(FbxScene& pScene);
    virtual bool    PostprocessScene(FbxScene& pScene);
    virtual void    PluginWriteParameters(FbxObject& pParams);
    virtual bool    Write(FbxDocument* pDocument, FbxIO* pFbx);
    virtual void    SetProgressHandler(FbxProgress *pProgress);

	virtual bool SupportsStreams() const		{ return true; }

private:
    /*************************** new writer ***************************/
	void            ConvertShapePropertyToOldStyle(FbxScene& pScene);
	void            ConvertShapePropertyToNewStyle(FbxScene& pScene);
    void            BuildObjectDefinition(FbxDocument* pDocument, Fbx6TypeDefinition& pDefinitions);
    void            SetObjectWriteSupport(const Fbx6TypeDefinition& pDefinitions);
    bool            WriteDescriptionSection(FbxDocument* pDocument);
    bool            WriteReferenceSection(FbxDocument* pDocument, Fbx6TypeWriteReferences& pReferences);
    void            WriteObjectDefinition(FbxDocument* pDocument, Fbx6TypeDefinition& pDefinitions);
    void            WriteObjectProperties(FbxDocument* pDocument, Fbx6TypeDefinition& pDefinitions);

    void            FlattenDocument(FbxDocument* pDocument, Fbx6TypeObjectHierarchy& pDocHierarchy, bool pFirstCall=true);
    void            UnFlattenDocument(FbxDocument* pDocument, Fbx6TypeObjectHierarchy& pDocHierarchy);
    bool            WriteObjectHeaderAndReferenceIfAny(FbxObject& pObj, const char* pObjectType) const;

    FbxObject*     GetObjectIndirection(FbxObject* pObject);
    void            WriteObjectConnections(FbxDocument* pDocument);
    void            WriteTakesAndAnimation(FbxDocument* pDocument);

    void            WriteConstraints(FbxScene& pScene);
    void            WriteConstraint(FbxConstraint& pConstraint, FbxScene& pScene);

    void            WriteGeometryWeightedMap(FbxGeometryWeightedMap& pGeometryWeightedMap);
    void            WriteNodeAttributes(const FbxDocument& pDocument);
    void            WriteAllGeometries(FbxScene& pScene);

    void            WriteAllGeometryWeightedMaps(FbxScene& pScene);

    int             WriteCharacterPose(FbxScene& pScene);
    void            WriteCharacterPose(FbxCharacterPose& pCharacterPose);

    void            WriteCharacterLinkGroup(FbxCharacter& pCharacter, int pCharacterGroupId, FbxScene& pScene);
    void            WriteCharacterLink(FbxCharacter& pCharacter, int pCharacterNodeId, FbxScene& pScene);
    void            WriteCharacterLinkRotationSpace(FbxCharacterLink& pCharacterLink);

    void            WriteControlSetPlug(FbxScene& pScene);

    /*************************** new writer ***************************/
    bool            WriteNodes(FbxScene& pScene, bool pIncludeRoot);
    bool            WriteNodes(const FbxDocument& pDocument);

    /*************************** kept functions ***************************/
    bool            WriteObjectProperties(FbxObject* pObject);
    bool            WriteObjectPropertiesAndFlags(FbxObject* pObject);

    bool            WriteContainers(FbxScene& pScene);

    bool            WriteNode(FbxNode& pNode);
    bool            WriteNodeBegin(FbxNode& pNode);
    bool            WriteNodeEnd(FbxNode& pNode);
    bool            WriteNodeParameters(FbxNode& pNode);
    bool            WriteNodeVersion(FbxNode& pNode);
    bool            WriteNodeAnimationSettings(FbxNode& pNode);
    bool            WriteNodeShading(FbxNode& pNode);
    bool            WriteNodeCullingType(FbxNode& pNode);
    bool            WriteNodeAttribute(FbxNodeAttribute* pNodeAttribute);
    bool            WriteNodeProperties(FbxNode& pNode);

    bool            WriteNodeType(FbxNode& pNode);
    bool            WriteNull(FbxNull* pNull);
    bool            WriteMarker(FbxNode& pNode);
    bool            WriteSkeleton(FbxSkeleton& pSkeleton);
    bool            WriteSkeletonRoot(FbxSkeleton& pSkeleton);
    bool            WriteSkeletonLimb(FbxSkeleton& pSkeleton);
    bool            WriteSkeletonLimbNode(FbxSkeleton& pSkeleton);
    bool            WriteSkeletonEffector(FbxSkeleton& pSkeleton);
    bool            WriteGenericNodes(FbxScene& pScene);

    bool            WriteGeometry(FbxGeometry& pGeometry);
    bool            WriteMesh(FbxMesh& pMesh);
    bool            WriteMeshSmoothness(FbxMesh& pMesh);
    bool            WriteMeshVertices(FbxMesh& pMesh);
    bool            WriteMeshPolyVertexIndex(FbxMesh& pMesh);
    bool            WriteMeshEdges(FbxMesh& pMesh);
    bool            WriteNurb(FbxNurbs& pNurbs);
    bool            WriteNurbsSurface(FbxNurbsSurface& pNurbs);
    bool            WriteNurbsCurve(FbxNurbsCurve& pNurbsCurve);
    bool            WriteTrimNurbsSurface(FbxTrimNurbsSurface& pNurbs);
    bool            WriteBoundary(FbxBoundary& pBoundary);
    bool            WriteSubdiv(FbxSubDiv& pSubdiv);

    bool            WritePatch(FbxPatch& pPatch);
    bool            WritePatchType(FbxPatch& pPatch, int pType);

    bool            WriteDeformers(FbxScene& pScene);
    bool            WriteSkin(FbxSkin& pSkin);
    bool            WriteVertexCacheDeformer(FbxVertexCacheDeformer& pDeformer);
    bool            WriteCluster(FbxCluster& pCluster);
    bool            WriteShape(FbxShape& pShape, FbxString pShapeName, FbxGeometry& pGeometry);
    void            FindShapeValidIndices(FbxArray<FbxVector4>& pGeometryControlPoints, FbxArray<FbxVector4>& pShapeControlPoints, FbxArray<int>& lValidIndices);

    bool            WriteFbxLayerElementNormals(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementBinormals(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementTangents(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementMaterials(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementTextures(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementTexturesChannel(FbxLayerContainer& pLayerContainer, FbxLayerElement::EType pTextureType, FbxMultiMap& pLayerIndexSet);
    bool            WriteFbxLayerElementUVsChannel(FbxLayerContainer& pLayerContainer, FbxLayerElement::EType pTextureType, FbxMultiMap& pLayerIndexSet);

    bool            WriteFbxLayerElementPolygonGroups(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementVertexColors(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementUVs(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementSmoothing(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementUserData(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementVisibility(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementVertexCrease(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementEdgeCrease(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    bool            WriteFbxLayerElementHole(FbxLayerContainer& pLayerContainer, FbxMultiMap&);

    bool            WriteLayers(FbxLayerContainer& pLayerContainer, FbxMultiMap&);
    int             MapLayeredTextureIndexToConnectionIndex(FbxNode* pNode, void* pLET, int pIndex);

    bool            WriteMaterials(FbxDocument* pDocument);
    bool            WriteSurfaceMaterial(FbxSurfaceMaterial& pMaterial);

    bool            WritePose(FbxScene& pScene);

    // Write Connections
    bool            WriteFieldConnection(FbxDocument* pDocument, FbxObject* pSrcObject, FbxDocument* pDstDocument);
    bool            WriteFieldConnection(FbxDocument* pDocument, FbxObject* pSrc,FbxObject* pDst);
    bool            WriteFieldConnection(FbxDocument* pDocument, FbxObject* pSrc,FbxProperty& pDst);
    bool            WriteFieldConnection(FbxDocument* pDocument, FbxProperty& pSrc,FbxObject* pDst);
    bool            WriteFieldConnection(FbxDocument* pDocument, FbxProperty& pSrc,FbxProperty& pDst);
    
    void            WriteObjectConnections(FbxDocument* pDocument, FbxObject* pObject, bool pRecursive);

    bool            WriteCamera(FbxCamera& pCamera);
    bool            WriteCameraStereo(FbxCameraStereo& pCameraStereo);
    bool            WriteLight(FbxLight& pLight);
    bool            WriteCameraSwitcher(FbxScene& pScene);                   
    bool            WriteCameraSwitcher(FbxCameraSwitcher& pCameraSwitcher);

    bool            WriteTextures(FbxDocument* pDocument);
    bool            WriteTexture(FbxFileTexture& pTexture);

	bool            WriteTimeWarps(FbxDocument* pDocument, FbxAnimStack* pAnimStack);
    bool            WriteThumbnails(FbxDocument* pDocument);
    bool            WriteThumbnail(FbxThumbnail& pThumbnail);

    bool            WriteCaches(FbxDocument* pDocument);
    bool            WriteCache(FbxCache& pCache);

    bool            WriteBindingTables(FbxDocument* pDocument);
    bool            WriteBindingTable(FbxBindingTable& pTable);

    bool            WriteBindingOperators(FbxDocument* pDocument);
    bool            WriteBindingOperator(FbxBindingOperator& pOperator);

    bool            WriteImplementations(FbxDocument* pDocument);
    bool            WriteImplementation(FbxImplementation& pImplementation);

    bool            WriteCollections(FbxDocument* pDocument);
    bool            WriteCollection(FbxCollection& pImplementation);

    bool            WriteDocuments(FbxDocument* pDocument);
    bool            WriteDocument(FbxDocument& pSubDocument);

    bool            WriteLayeredTextures(FbxDocument* pDocument);
    bool            WriteLayeredTexture(FbxLayeredTexture& pTexture);

    void            WriteGobo(FbxScene& pScene);
    void            WriteGoboSection(FbxScene& pScene);
    void            WriteGobo(FbxGobo& pGobo);

    bool            WriteVideos(FbxDocument* pDocument);
    bool            WriteVideo(FbxVideo& pVideo, FbxString& pFileName, bool pEmbeddedMedia);

    bool            WriteAnimation(FbxDocument* pDocument);
    bool            WriteAnimation(FbxDocument* pDocument, FbxAnimLayer* pAnimLayer);

    bool            WriteFCurves(FbxObject& pObject, FbxAnimLayer* pAnimLayer, const char* pBlockName, bool pKeepBlockOpen=false, bool pRescaleShininess=false);

    void            WritePose(FbxPose& pPose);

    bool            WriteSelectionNode(FbxScene& pScene);
    void            WriteSelectionNode(FbxSelectionNode& pSelectionNode);

    bool            WriteSelectionSet(FbxScene& pScene);
    void            WriteSelectionSet(FbxSelectionSet& pSelectionSet);
    
    bool            WriteThumbnail(FbxThumbnail* pThumbnail);

    void            WriteSceneInfo(FbxDocumentInfo*);
    void            WriteGlobalSettings(FbxGlobalSettings& pGlobalSettings);

    bool            WriteExtensionSection(FbxScene& pScene, int pMediaCount);

    int				FindString(FbxString pString, FbxArray<FbxString*>& pStringArray);

    /****************** Function that write in the v5 section******************/
    void            WriteGlobalLightSettings(FbxScene& pScene);
    void            WriteShadowPlane(FbxScene& pScene);
    void            WriteShadowPlaneSection(FbxScene& pScene);
    void            WriteAmbientColor(FbxScene& pScene);
    void            WriteFogOption(FbxScene& pScene);

    void            WriteGlobalCameraSettings(FbxScene& pScene);
    void            WriteGlobalTimeSettings(FbxScene& pScene);
    /****************** Function that write in the v5 section******************/
    
    void            WritePassword();

	void			WriteLayeredAnimation(FbxScene& pScene);

private:
    void            WritePropertyTemplate(FbxClassId pClassId, FbxDocument* pDocument, bool& pVisitedNodeClass);
    void            WriteProperty(FbxProperty& pProperty, bool lSetNodeAttributeFlag);
	void			ConnectTimeWarp(FbxAnimCurveNode* pCurveNode, KFCurveNode* pFCurveNode);

    FbxWriterFbx6&    operator=(const FbxWriterFbx6&);

    FbxScene*					mScene;
    FbxIO*						mFileObject;
    FbxExporter&				mExporter;
    Fbx6TypeObjectHierarchy*    mDocumentHierarchy;
    Fbx6TypeWriteReferences*    mDocumentReferences;

	bool						mWriteNonDefaultPropertiesOnly;
    bool						mWriteEnhancedProperties;
    EExportMode					mExportMode;

    FbxMultiMap						mTextureAnimatedChannels;
    FbxMultiMap						mMaterialAnimatedChannels;
	FbxMultiMap						mTimeWarpsCurveNodes;

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

    FbxNode*	mCurrentNode;

    struct ModifiedPropertyInfo { FbxObject* mObj; FbxString mPropName; };
    FbxArray<ModifiedPropertyInfo*> mModifiedProperties;
    void ReplaceUnsupportedProperties(FbxScene* pScene, bool pPreprocessPass, int pFormatV);
	void StoreUnsupportedProperty(FbxObject* pObject, FbxProperty& pProperty);

    FbxProgress* mProgress;
    bool mProgressPause;
};

bool IsNameUnique(FbxScene& pScene, FbxObject* pObject);

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_FBX_WRITER_FBX6_H_ */
