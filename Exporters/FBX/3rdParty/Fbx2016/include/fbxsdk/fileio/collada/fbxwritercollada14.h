/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxwritercollada14.h
#ifndef _FBXSDK_FILEIO_COLLADA_WRITER_H_
#define _FBXSDK_FILEIO_COLLADA_WRITER_H_

#include <fbxsdk.h>

#include <fbxsdk/fileio/collada/fbxcolladautils.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief Class to export FBX scene into a Collada file.
*   \nosubgrouping
*/
class FbxWriterCollada : public FbxWriter 
{
public:
    /**
    * \name Constructors and Destructor
    */
    //@{

    /** Constructor.
    * \param pManager FBX SDK object Manager.
    * \param pID      Internal ID.
    * \param pStatus  The FbxStatus object to hold error codes.
    */
    FbxWriterCollada(FbxManager& pManager, int pID, FbxStatus& pStatus);

    //! Destructor.
    virtual ~FbxWriterCollada();

    //@}

    /**
    * \name File Management
    */
    //@{

    /** Create and open file with the given name.
    * \param pFileName the name of file.
    * \return Return true if the specified file is created and opened.
    */
    virtual bool FileCreate(char* pFileName);

    /** Close file.
    * \return Return true if file is closed successfully, false otherwise.
    */
    virtual bool FileClose();

    /** Check if current file is open.
    * \return Return true if file is open, false otherwise.
    */
    virtual bool IsFileOpen();

    //@}

    /**
    * \name Write Functions
    */
    //@{

    /** Get Collada export options settings.
    */
	virtual void GetWriteOptions(){}

    /** Export the FBX document to Collada file, according to the given options settings.
    * \param pDocument FBX Document to export.
    * \return true on success, false otherwise.
    */
    virtual bool Write(FbxDocument* pDocument);

    /** Process FBX scene before exporting FBX scene to Collada file.
    * \param pScene the FBX scene to precess.
    * \return Return true if the given scene is processed successfully.
    * \remarks This function is processing name clash, special transformation conversion etc.
    */
    virtual bool PreprocessScene(FbxScene &pScene);

    /** Process FBX scene after exporting FBX scene to Collada file.
    * \param pScene the FBX scene to precess.
    * \return Return true if the given scene is processed successfully.
    */
    virtual bool PostprocessScene(FbxScene &pScene);

    //@}


/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    /**
    * \name Export Functions
    */
    //@{    

    /** Export FBX scene info to Collada asset.
    * \param pXmlNode the XML Node to export asset, asset nodes will be added as children to this XML node.
    * \param pSceneInfo Pointer to the FBX scene information object.
    * \return Return pointer to XML asset node.
    * \remarks Asset here contains user-defined summary data, such as:
    * contributor, author, authoring tool, created time, Axis System, etc.
    */
    xmlNode*	ExportAsset(xmlNode* pXmlNode, FbxDocumentInfo* pSceneInfo);

    /** Export FBX scene.
      * \param pScene Pointer to the FBX scene object.
      * \return The pointer to XML scene element.
      */
    xmlNode * ExportScene(FbxScene* pScene);

    /** Export Libraries to the Collada document.
    * \param pXmlNode Pointer to XML Node, it should be the asset node.
    * \return Return true if all libraries are exported successfully.
    * \remarks  After the libraries are created, call this function to add libraries to the Collada document.
    * Libraries are added as the siblings just after the given pXmlNode.
    */
    bool		ExportLibraries(xmlNode* pXmlNode);

    /** Export the given FBX node and its hierarchy to Collada XML nodes.
    * \param pXmlNode Pointer to XML Node, created XML nodes hierarchy will be added as children to this XML node.
    * \param pNode Pointer to FBX node, it should be one node in FBX nodes tree.
    * \return Return pointer to XML node.
    * \remarks The returned XML node is corresponding to the given FBX node,
    * the returned XML node will be added as child to the given pXmlNode,
    * this method is called recursively.
    */
    xmlNode* ExportNodeRecursive(xmlNode* pXmlNode, const FbxNode* pNode);

    /** Export a Collada visual_scene MAX3D extension for the given FBX scene.
      * \param pExtraElement The parent COLLADA extra element.
      * \param pScene The FBX scene to be exported.
      */
    void ExportVisualSceneMAX3DExtension(xmlNode * pExtraElement, FbxScene * pScene);

    /** Export a Collada visual_scene FCOLLADA extension for the given FBX scene.
      * \param pExtraElement The parent COLLADA extra element.
      * \param pScene The FBX scene to be exported.
      */
    void ExportVisualSceneFCOLLADAExtension(xmlNode * pExtraElement, FbxScene * pScene);

    /** Export the given FBX node and its node attributes to Collada XML node.
    * \param pXmlNode Pointer to XML Node, created XML node will be added as child to this XML node.
    * \param pNode Pointer to FBX node, it should be one node in FBX nodes tree.
    * \return Return pointer to the created XML node.
    * \remarks The returned XML node is corresponding to the given FBX node,
    * the returned XML node will be added as child to the given pXmlNode.
    */
    xmlNode* ExportNode(xmlNode* pXmlNode, const FbxNode* pNode);

    /** Export the given FBX node's default transformation.
    * \param pXmlNode Pointer to XML Node.
    * \param pNode Pointer to FBX node.
    * \return Return true if transformation is exported successfully.
    * \remarks  FBX node transformation info is exported to properties of pXmlNode and its children,
    * according to the Collada transformation structures.
    */
    bool ExportTransform(xmlNode* pXmlNode, const FbxNode* pNode);

    /** Export FBX node attributes, create different libraries according to different node attribute type.
    * \param pXmlNode Pointer to XML Node.
    * \param pNode Pointer to FBX node.
    * \return Return true if FBX node attributes is exported successfully, false otherwise.
    * \remarks  According to different FBX node attribute type, different libraries will be created, such as:
    * light, camera, geometry. See more details in CreateMeshLibrary(FbxNode* pNode), CreateCameraLibrary(FbxNode* pNode), CreateLightLibrary(FbxNode* pNode).
    */
    bool ExportNodeAttribute(xmlNode* pXmlNode, const FbxNode* pNode);

    /** Create geometry library for the given FBX node.
    * \param pNode Pointer to FBX node, its node attribute type should be FbxNodeAttribute::eMesh, or FbxNodeAttribute::eNurbs, or FbxNodeAttribute::ePatch.
    * \return Return pointer to XML mesh library node.
    * \remarks The returned XML node will be added to the geometry library,
    * the geometry library will be added to the Collada document by ExportLibraries(xmlNode* pXmlNode).
    */
    xmlNode* CreateMeshLibrary(const FbxNode* pNode);

    /** Create camera library for the given FBX node.
    * \param pNode Pointer to FBX node, its node attribute type should be FbxNodeAttribute::eCamera.
    * \return Return pointer to XML camera library node.
    * \remarks The returned XML node will be added to the camera library,
    * the camera library will be added to the Collada document by ExportLibraries(xmlNode* pXmlNode).
    */
    xmlNode* CreateCameraLibrary(const FbxNode* pNode);

    /** Create light library for the given FBX node.
    * \param pNode Pointer to FBX node, its node attribute type should be FbxNodeAttribute::eLight.
    * \return Return pointer to XML light library node.
    * \remarks The returned XML node will be added to the light library,
    * the light library will be added to the Collada document by ExportLibraries(xmlNode* pXmlNode).
    */
    xmlNode* CreateLightLibrary(const FbxNode* pNode);

    /** Export the given FBX mesh node to Collada XML node.
    * \param pNode Pointer to FBX node, its node attribute type should be FbxNodeAttribute::eMesh.
    * \return Return pointer to XML mesh node.
    * \remarks Vertex, polygons of the mesh will be exported.
    * Textures, materials, controllers, and shapes which linked to the mesh will also be exported.
    */
    xmlNode* ExportMesh(const FbxNode* pNode);

    /** Export the given shape's geometry to Collada XML node.
    * \param pMeshShape, Pointer to FBX mesh, corresponding to shape.
    * \param pShapeId, a string to identify shape from internal shape meshes list.
    * \return Return pointer to XML shape geometry node.
    * \remarks The geometry of shape will be exported, materials of shape will not be exported.
    */
    xmlNode*	ExportShapeGeometry(FbxMesh* pMeshShape, FbxString pShapeId);

    /** Export the given mesh's vertex position to Collada XML node.
    * \param pXmlNode Pointer to XML Node, created XML node will be added as child to this XML node.
    * \param pMesh Pointer to FBX mesh object, position info of all the vertices of this mesh will be exported.
    * \param pMeshName Name of the XML node to export, usually it's the name of FBX mesh node.
    * \param pInGeometry True if vertices are inside an ordinary geometry, false if vertices are in a binded geometry.
    * \param pExportControlPoints True if pMesh is an ordinary geometry, false if pMesh is a binded geometry.
    * \return Return pointer to XML vertex position node, the returned XML node will be added as child to the given pXmlNode.
    * \remarks In an ordinary geometry, pExportControlPoints should be true, export the position of the control points;
    * in a binded geometry, pExportControlPoints should be false, export the position of the transformed control points.
    */
    //Note why internally set pExportControlPoints to true?
    xmlNode*	ExportVertexPositions(xmlNode* pXmlNode, FbxMesh* pMesh, FbxString pMeshName, bool pInGeometry, bool pExportControlPoints);

    /** Export all layer elements of the given mesh to Collada XML node.
    * \param pXmlMesh Pointer to XML Node, created XML layer elements nodes will be added as child to this XML node.
    * \param pMesh Pointer to FBX mesh object, all layer elements of this mesh node will be exported.
    * \param pName String which used to construct the names of XML layer elements nodes.
    * \return Return the modified pXmlMesh.
    * \remarks Layer elements including Normals, UVs, Vertex Colors are covered,
    * polygon groups and other undefined layer elements are NOT supported.
    */
    xmlNode*	ExportLayerElements(xmlNode* pXmlMesh, FbxMesh* pMesh, FbxString pName);

    /** Export Normals of specified layer of the given mesh to Collada XML node.
    * \param pXmlNode Pointer to XML Node, created XML Normals node will be added as child to this XML node.
    * \param pMesh Pointer to FBX mesh object, normals layer element of this mesh node will be exported.
    * \param pName String which used to construct the names of XML normals nodes.
    * \param pExt Extension string which used to construct the names of XML normals nodes.
    * \param pLayerIndex Specify an index of layers to export, normals of other layers will NOT be exported.
    * \return Return pointer to XML Normals node.
    * \remarks The returned XML node will be added as child to the given pXmlNode.
    */
    xmlNode*	ExportNormals(xmlNode* pXmlNode, FbxMesh* pMesh, FbxString pName, FbxString pExt, int pLayerIndex);

    /** Export UVs of specified layer of the given mesh to Collada XML node.
    * \param pXmlNode Pointer to XML Node, created XML UVs node will be added as child to this XML node.
    * \param pMesh Pointer to FBX mesh object, UVs layer element of this mesh node will be exported.
    * \param pName String which used to construct the names of XML UVs nodes.
    * \param pLayerIndex Specify an index of layers to export, UVs of other layers will NOT be exported.
    * \return Return pointer to XML UVs node.
    * \remarks The returned XML node will be added as child to the given pXmlNode.
    */
    xmlNode*	ExportUVs(xmlNode* pXmlNode, FbxMesh* pMesh, FbxString pName, int pLayerIndex);

    /** Export VertexColors of specified layer of the given mesh to Collada XML node.
    * \param pXmlNode Pointer to XML Node, created XML VertexColors node will be added as child to this XML node.
    * \param pMesh Pointer to FBX mesh object, VertexColors layer element of this mesh node will be exported.
    * \param pName String which used to construct the names of XML VertexColors nodes.   
    * \param pLayerIndex Specify an index of layers to export, VertexColors of other layers will NOT be exported.
    * \return Return pointer to XML VertexColors node.
    * \remarks The returned XML node will be added as child to the given pXmlNode.
    */
    xmlNode*	ExportVertexColors(xmlNode* pXmlNode, FbxMesh* pMesh, FbxString pName, int pLayerIndex);

    /** Export the given mesh's vertex to Collada XML node.
    * \param pXmlNode Pointer to XML Node.
    * \param pMesh Pointer to FBX mesh object.
    * \param pName Name of the XML node to export, usually it's the name of FBX mesh node.
    * \return Return pointer to the created XML vertex node.
    */
    xmlNode*	ExportVertices(xmlNode* pXmlNode, FbxMesh* pMesh, FbxString pName);

    /** Export the given mesh's polygons to Collada XML node.
    * \param pMeshElement Pointer to XML Node.
    * \param pMesh Pointer to FBX mesh object.
    * \param pMaterialName Specify the name of materials property.
    * \param pMaterialIndexInNode Specify the material index in the FBXNode (will be ignored if there is only 1 material in the node)
    * \param pName String which used to construct the names of created XML nodes.
    * \param pShape true for shape node, false for general node, the default value is false;
    * don't write out the materials if pShape is true.
    * \return Return pointer to the created XML Polygons node.
    */
    xmlNode* ExportPolygons(xmlNode* pMeshElement, FbxMesh* pMesh, FbxString pMaterialName, int pMaterialIndexInNode, FbxString pName, bool pShape = false);

    /** Export all the materials used by the given mesh.
    * \param pMesh FBX mesh to export.
    * \param pNbMat materials count of pMesh.
    * \return true on success, false otherwise.
    */
    bool		ExportMeshMaterials(FbxMesh *pMesh, int pNbMat);

    /** Export the given material to the Material library.
    * \param pMaterial Specify the surface material to export.
    * \return Return pointer to the corresponding XML material node.
    * \remarks If the given material is already in the materials library, return the XML node;
    * otherwise, create and add XML material node to the Material library.
    */
    xmlNode*	ExportMaterial(FbxSurfaceMaterial *pMaterial);

    /** Export the given material to the Effect library.
    * \param pMaterial Specify the surface material to export.
    * \param pEffectId Specify the effect ID to export.
    * \return Return pointer to the corresponding XML effect node.
    * \remarks Material is an instance of an effect.
    * If the given material is already in the Effect library, return the XML node;
    * otherwise, create and add XML effect node to the Effect library.
    * Collada Effect support: Ambient Color, Diffuse Color, Emissive Color, Specular Color, Shiness, Reflective / Reflectivity,
    * Opacity / Transparency.
    */    
    xmlNode*	ExportEffect(FbxSurfaceMaterial *pMaterial, FbxString pEffectId);

    /** Add the given texture as input to the given XML material node.
    * \param pXmlMaterial Pointer to XML material node.
    * \param pTexture FBX texture to export.
    * \param pImageId A string to identify image from the image library.
    * \param pLayerIndex Specify an index of layers to export.
    * \param pLayerElementType Specify the layer element type.
    * \return true on success, false otherwise.
    */
    //Note why return true when failed and popped waring?
    bool		AddMaterialTextureInput(xmlNode *pXmlMaterial, FbxFileTexture *pTexture, FbxString pImageId, int pLayerIndex, int pLayerElementType);

    /** Export the given texture to Collada XML node.
    * \param pTexture FBX texture to export.
    * \param pImageId A string to identify image from the image library.
    * \param pLayerIndex Specify an index of layers to export.
    * \return Return pointer to the created XML texture node.
    */
    xmlNode*	ExportTexture(FbxFileTexture *pTexture, FbxString pImageId, int pLayerIndex);

    /** Export all the textures used by the given mesh.
    * \param pMesh FBX mesh to export.
    * \return true on success, false otherwise.
    * \remarks The materials will also be Exported if needed.
    */
    bool		ExportMeshTextures(FbxMesh *pMesh);

    /** Export the given FBX camera node to Collada XML node.
    * \param pNode Pointer to FBX node, its node attribute type should be FbxNodeAttribute::eCamera.
    * \return Return pointer to XML node.
    * \remarks Camera parameters and properties will be exported.    
    */
    xmlNode* ExportCamera(const FbxNode* pNode);

    /** Export the given FBX light node to Collada XML node.
    * \param pNode Pointer to FBX node, its node attribute type should be FbxNodeAttribute::eLight.
    * \return Return pointer to XML node.
    * \remarks Light parameters and properties will be exported.    
    */
    xmlNode* ExportLight(const FbxNode* pNode);

    /** Export the global ambient to Collada XML light node.    
    */
    void ExportSceneAmbient(xmlNode * pVisualSceneElement);

    /** Export controllers of the given mesh to Collada XML node.
    * \param pMesh FBX mesh to export, it should be a binded skin.
    * \return true on success.
    * \remarks A morph controller will be exported by ExportControllerShape().
    */
    bool		ExportController(FbxMesh *pMesh);

    /** Export morph controllers of the given mesh to Collada XML node.
    * \param pMesh FBX mesh to export, it should has more than one shape.
    * \return true on success.
    * \remarks Morph controller is also called shape deformer.
    */
    bool		ExportControllerShape(FbxMesh *pMesh);

    /** .
    * \param .
    * \param .
    * \return .
    * \remarks .
    */
    //Note : empty method now
    xmlNode*	ExportJointWeights(xmlNode* pXmlNode, FbxMesh* pMesh, FbxString pExt);

    /** Update mesh library with the shapes found, and add shapes as nodes in the scene.
    * \param pXmlNode Pointer to XML Node, created shape node will be added as child to this XML node.
    * \return true on success, false otherwise.
    * \remarks This method will create a geometry node in geometry library for every shape as needed,
    * XML shape nodes will also be created and added to scene.
    */
    bool		UpdateMeshLibraryWithShapes(xmlNode* pXmlNode);

    /** Export animations of the given node and its children, if they are animated.
    * \param pNode FBX node to export, it should be animated.
    * \return true on success, false otherwise.
    * \remarks This method is called recursively, the animations of all the children of pXmlNode will also be exported.
    */
    bool		ExportAnimation(FbxNode* pNode);

    /** Export all the animation curves of the given node to Collada XML node.
    * \param pNode FBX node to export, it should be animated.
    * \param pAnimationNode Pointer to XML Node, created sub-animation nodes will be added as children to this XML node.
    * \return true on success.
    */
    bool		ExportAnimationCurves(FbxNode* pNode, xmlNode* pAnimationNode);

    /** Export the texture into library_images.
      * \param pTexture The texture whose file name to be exported.
      * \return Return the ID of the create image element.
      */
    const FbxString ExportImage(FbxFileTexture * pTexture);

    /** Export the given animation curve (FCurve) to Collada XML node.
    * \param pAnimationNode Pointer to XML Node, created sub-animation node will be added as child to this XML node.
    * \param pCurve Animation Curve to export.
    * \param pChannelName The name of animation channel.
    * \param pSubChannelName The name of animation sub-channel.
    * \param pExportShape Shape animation flag, default value is false; When it's true, Id nomenclature is a bit different.
    * \param pExportIntensity Intensity flag, default value is false; When it's true, FCurve values are divided by 100.
    * \param pExportLib Library flag, default value is false; When it's true, Id nomenclature is a bit different.
    * \return true on success.
    * \remarks When pExportShape or pExportIntensity is true, FCurve values are divided by 100.
    */
    bool		ExportCurve(xmlNode* pAnimationNode, FbxAnimCurve* pCurve,
        const char* pChannelName, const char* pSubChannelName,
        bool pExportShape=false, bool pExportIntensity=false, bool pExportLib=false);

    /** Check whether the first three elements of the given vector are both zero.
    * \param pV the FBX vector4 to check.    
    * \return Return true if one of the first three elements of pV is not zero, return false if all of the three elements are both zero.
    * \remarks If the absolute value of element is less than a tolerance, the element will be considered as zero.
    */
    bool		NotZero(FbxVector4 pV);

    /** Check whether the first three elements of the given vector are both equal to the given value.
    * \param pV the FBX vector4 to check.
    * \param pValue the value to check.
    * \return Return true if one of the first three elements of pV is NOT equal to pValue, return false if all of the three elements are both equal to pValue.
    */
    bool		NotValue(FbxVector4 pV, double pValue);

    /** Check whether the given value is zero.
    * \param pD the value to check.    
    * \return Return true if pD is NOT zero, return false if pD is zero.
    * \remarks If the absolute value of pD is less than a tolerance, pD is considered as zero.
    */
    bool		NotZero(double pD);

    /** Check whether the given node's translation is animated.
    * \param pNode the FBX node to check.
    * \return Return true if one of Translation X/Y/Z is animated, return false if both of Translation X/Y/Z are not animated.
    * \remarks If there is no key on one property, this property is not animated.
    */
    bool IsTranslationAnimated(const FbxNode *pNode);

    /** Check whether the given node's rotation is animated.
    * \param pNode the FBX node to check.
    * \return Return true if one of Rotation X/Y/Z is animated, return false if both of Rotation X/Y/Z are not animated.
    * \remarks If there is no key on one property, this property is not animated.
    */
    bool IsRotationAnimated(const FbxNode *pNode);

    /** Check whether the given node's rotation of specified axis is animated.
    * \param pNode the FBX node to check.
    * \param pAxis Specify index of rotation axis, 0 for Rotation X, 1 for Rotation Y, 2 for Rotation Z.
    * \return Return true if the rotation of specified axis is animated, return false if it is not animated.
    * \remarks If there is no key on one property, this property is not animated.
    */
    bool IsRotationAnimated(const FbxNode *pNode, int pAxis);

    /** Check whether the given node's scale is animated.
    * \param pNode the FBX node to check.
    * \return Return true if one of Scale X/Y/Z is animated, return false if both of Scale X/Y/Z are not animated.
    * \remarks If there is no key on one property, this property is not animated.
    */
    bool IsScaleAnimated(const FbxNode *pNode);

    /** Copy mesh parameters from pRefMesh to pNewMesh.
    * \param lNewMesh New FBX mesh.
    * \param lRefMesh Referenced FBX mesh.
    * \remarks Vertices, polygons, layers will be copied.
    */
    void		CopyMesh(FbxMesh *lNewMesh, FbxMesh *lRefMesh);

    /** Convert camera focal length animation curve to camera field of view animation curve.
    * \param pFOVCurve A curve that represents camera field of view.
    * \param pFLCurve A curve that represents camera focal length animation.
    * \param pCamera FBX camera to convert.
    */
    void		ConvertFocalLengthCurveToFOV(FbxAnimCurve *pFOVCurve, FbxAnimCurve *pFLCurve, FbxCamera *pCamera);

    /** Preprocess the given FBX node and its hierarchy.
    * \param pNode Pointer to FBX node.
    * \remarks To correctly export FBX scene to Collada, this method process FBX nodes,
    * such as set pivot state for every FBX node, do special transformation conversion for FBX lights and cameras.
    * This method is called recursively. 
    */
    void		PreprocessNodeRecursive(FbxNode* pNode);

    /** Export the value of the specific property as a child element of an element.
      * \param pProperty The property whose value to be exported.
      * \param pParentElement The parent element of the created element.
      */
    void ExportPropertyValue(const FbxProperty & pProperty,
                             xmlNode * pParentElement);

    //@}

    /**
    * \name Error Management
    */
    //@{

    /** Add notification error info to notify users.
    * \param pError String of error info.
    */
    void AddNotificationError( FbxString pError );

    /** Add notification warning info to notify users.
    * \param pWarning String of warning info.
    */
    void AddNotificationWarning( FbxString pWarning );

    //@}

    FbxFile* mFileObject;
    FbxString mFileName;
    bool mStatus;

    // XML lib stuff
    //
    xmlDocPtr mXmlDoc;

    // Scene information
    FbxScene*	mScene;

    // AnimStack/Layer holding the animation
    FbxAnimStack* mAnimStack;
    FbxAnimLayer* mAnimLayer;

    // Libraries
    // NB: CODE and PROGRAM libraries are unused, so they are not created.
    xmlNode*	mLibraryAnimation;
    xmlNode*	mLibraryCamera;
    xmlNode*	mLibraryController;
    xmlNode*	mLibraryGeometry;
    xmlNode*	mLibraryImage; 
    xmlNode*	mLibraryLight;
    xmlNode*	mLibraryMaterial;
    xmlNode*	mLibraryEffect;
    xmlNode*	mLibraryTexture;
    xmlNode*	mLibraryVisualScene;

    // Shape information
    FbxStringList	*mShapeMeshesList;

    // export options
    bool mTriangulate;
    bool mSingleMatrix;
    FbxTime mSamplingPeriod;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_COLLADA_WRITER_H_ */
