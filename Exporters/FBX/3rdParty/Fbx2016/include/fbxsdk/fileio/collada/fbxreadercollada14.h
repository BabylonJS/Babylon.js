/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxreadercollada14.h
#ifndef _FBXSDK_FILEIO_COLLADA_READER_H_
#define _FBXSDK_FILEIO_COLLADA_READER_H_

#include <fbxsdk.h>

#include <fbxsdk/fileio/collada/fbxcolladautils.h>
#include <fbxsdk/fileio/collada/fbxcolladanamespace.h>

#include <fbxsdk/fbxsdk_nsbegin.h>


/** Class to read a Collada file and import it to a FBX scene.
  *
  * Some terms about COLLADA (from the spec of the COLLADA).
  * 
  * Element: An XML document consists primarily of elements. An element is a block of information that is
  * bounded by tags at the beginning and end of the block. Elements can be nested, producing a hierarchical
  * data set.
  * 
  * Tag: Each XML element begins with a start tag and ends with an end tag.
  * 
  * Attribute: An XML element can have zero or more attributes. Attributes are given within the start tag and 
  * follow the tag name. Each attribute is a name-value pair. The value portion of an attribute is always 
  * surrounded by quotation marks (" "). Attributes provide semantic information about the element on which 
  * they are bound.
  * For example:
  * \code
  * <tagName attribute="value">
  * \endcode
  * 
  * URI Addressing: Refers to the id attribute of an element. Used in url, source or target attributes.
  * In a url, source or target attribute, the URI fragment identifier is preceded with the pound sign ("#").
  * 
  * Markup and Content: The characters which make up an XML document are divided into markup and content.
  * Markup and content may be distinguished by the application of simple syntactic rules.
  * All strings which constitute markup either begin with the character "<" and end with a ">",
  * or begin with the character "&" and end with a ";".
  * Strings of characters which are not markup are content.
  * \nosubgrouping
  */
class FbxReaderCollada : public FbxReader 
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
    FbxReaderCollada(FbxManager& pManager, int pID, FbxStatus& pStatus); 
	
    //! Destructor.
    virtual ~FbxReaderCollada();
    
    //@}

    /**
    * \name File Management
    */
    //@{
    
    /** Open file with the given name.
    * \param pFileName the name of file.
    * \return Return true if the specified file is opened.
    */
    virtual bool FileOpen(char* pFileName);
    
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
    * \name Read Functions
    */
    //@{

    /** Get Collada import options settings.
    * \param pParseFileAsNeeded whether parse file as needed, the default value is true.
    * \return true
    */
	virtual bool GetReadOptions(bool pParseFileAsNeeded = true){ return true; }

    /** Get axis system information from file
      * \param pAxisSystem      axis system in file
      * \param pSystemUnits     system unit in file
      * \return if either pAxisSystem or pSystemUnits is \c NULL return \c false, otherwise return \c true.
      */
    virtual bool GetAxisInfo(FbxAxisSystem* pAxisSystem, FbxSystemUnit* pSystemUnits);

    /** Returns the list of take infos from the file.
      * \return NULL
      */
    virtual FbxArray<FbxTakeInfo*>* GetTakeInfo();

    /** Read from Collada file and import it to the FBX document, according to the given options settings.
    * \param pDocument FBX Document to import.
    * \return true on success, false otherwise.
    */
	virtual bool Read(FbxDocument* pDocument);

    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    /**
    * \name Import Functions
    */
    //@{

    /** Import Collada XML nodes tree to FBX scene.
    * \param pScene The FBX scene object.
    * \param pXmlNode The XML Node to import, it should be the root of Collada nodes tree.
    * \return true on success, false otherwise.
    */
	bool ReadCollada(FbxScene &pScene, xmlNode* pXmlNode);

    /** Import a Collada visual_scene element to the given FBX scene.
      * \param pXmlNode The COLLADA visual_scene element.
      * \param pScene The FBX scene to contain the imported data.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportVisualScene(xmlNode* pXmlNode, FbxScene * pScene);

    /** Import a Collada visual_scene MAX3D extension to the given FBX scene.
      * \param pXmlNode The COLLADA technique element with profile MAX3D.
      * \param pScene The FBX scene to contain the imported data.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportVisualSceneMax3DExtension(xmlNode * pTechniqueElement, FbxScene * pScene);

    /** Import a Collada visual_scene FCOLLADA extension to the given FBX scene.
      * \param pXmlNode The COLLADA technique element with profile FCOLLADA.
      * \param pScene The FBX scene to contain the imported data.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportVisualSceneFCOLLADAExtension(xmlNode * pTechniqueElement, FbxScene * pScene);

    /** Import a Collada visual_scene MAYA extension to the given FBX scene.
      * \param pXmlNode The COLLADA technique element with profile MAYA.
      * \param pScene The FBX scene to contain the imported data.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportVisualSceneMayaExtension(xmlNode * pTechniqueElement, FbxScene * pScene);

    /** Import Collada asset element.
    * \param pXmlNode The XML Node, asset is read from pXmlNode and its children.
    * \param pGlobalSettings The FBX global settings.
    * \param pSceneInfo The FBX scene information object.
    * \return Return true if asset is imported successfully.
    * \remarks Imported asset has following contents:
    * Axis System, system Unit, author, comments, title, subject, keywords, revision, etc.
    */
    bool ImportAsset(xmlNode* pXmlNode, FbxGlobalSettings & pGlobalSettings, FbxDocumentInfo &pSceneInfo);

    /** Import a COLLADA node element.
      * If the COLLADA node element contains only one node attribute (node attribute means instance_geometry,
      * instance_camera, instance_light and instance_controller), node attribute will be attached directly under the node;
      * If not, one child node will be created for each node attribute except the first one.
      * \param pXmlNode The COLLADA node element.
      * \return The created node and return \c NULL if failed.
      */
    FbxNode * ImportNode(xmlNode* pXmlNode);

    /** Import a COLLADA node FCOLLADA extension to the given FBX node.
      * \param pXmlNode The COLLADA technique element with profile FCOLLADA.
      * \param pNode The FBX node to contain the imported data.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportNodeFCOLLADAExtension(xmlNode* pTechniqueElement, FbxNode * pNode);

    /** Import a COLLADA node XSI extension to the given FBX node.
      * \param pXmlNode The COLLADA technique element with profile XSI.
      * \param pNode The FBX node to contain the imported data.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportNodeXSIExtension(xmlNode* pTechniqueElement, FbxNode * pNode);

    /** Import a COLLADA node FBX extension to the given FBX node.
      * \param pXmlNode The COLLADA technique element with profile FBX.
      * \param pNode The FBX node to contain the imported data.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportNodeFBXExtension(xmlNode* pTechniqueElement, FbxNode * pNode);

    /** Import a COLLADA geometry element.
      * \param pGeometryID The COLLADA geometry ID.
      * \param pMaterialSequence A ordered sequence of material symbols connecting to the geometry.
      * \return The created geometry object and return \c NULL if failed.
      * \remarks Except mesh, other types of geometry are not supported now.
      */
    FbxGeometry * ImportGeometry(const FbxString & pGeometryID, const FbxDynamicArray<FbxString> & pMaterialSequence);

    /** Import a COLLADA skin element.
      * \param pSkinElement The COLLADA skin element.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportSkin(xmlNode* pSkinElement);

    /** Import a COLLADA morph element or morphs recursively.
      * \param pXmlNode The COLLADA morph element.
      * \param pMaterialSequence A ordered sequence of material symbols connecting to the target geometry.
      * \return Return the pointer to the target geometry.
      */
    FbxGeometry * ImportMorph(xmlNode * pMorphElement, const FbxDynamicArray<FbxString> & pMaterialSequence);

    /** Import a COLLADA controller element.
      * \param pXmlNode The COLLADA controller ID.
      * \param pMaterialSequence A ordered sequence of material symbols connecting to the target geometry.
      * \return Return the pointer to the target geometry.
      */
    FbxGeometry * ImportController(const FbxString & pControllerID, const FbxDynamicArray<FbxString> & pMaterialSequence);

    /** Import a COLLADA camera element.
      * \param pXmlNode The COLLADA camera element.
      * \return The created camera object and return \c NULL if failed.
      * \remarks Camera parameters will also be imported, such as FOV, aspect ratio, etc.
      */
    FbxCamera * ImportCamera(xmlNode* pXmlNode);

    /** Import a COLLADA light element.
      * \param pXmlNode The COLLADA light element.
      * \return The created light object and return \c NULL if failed.
      * Following types of light are supported now: ambient light, directional light, point light, and spot light.
      */
    FbxLight * ImportLight(xmlNode* pXmlNode);

    /** Import a COLLADA material element.
      * \param pXmlNode The COLLADA material element.
      * \return The created material object and return \c NULL if failed.
      */
    FbxSurfaceMaterial * ImportMaterial(xmlNode* pXmlNode);

    /** Import a COLLADA effect element.
      * \param pEffectElement The COLLADA effect element.
      * \return The created material object and return \c NULL if failed.
      */
    FbxSurfaceMaterial * ImportEffect(xmlNode* pEffectElement);

    /** Import a COLLADA effect NVIDIA_FXCOMPOSER extension.
      * \param pXmlNode The COLLADA technique element with profile
      * NVIDIA_FXCOMPOSER.
      * \return The created material object and return \c NULL if failed.
      */
    FbxSurfaceMaterial * ImportEffectNVidiaExtension(xmlNode * pEffectElement);

    /** Import a COLLADA texture element.
      * \param pXmlNode The COLLADA texture element.
      * \return The created texture object and return \c NULL if failed.
      * \remarks Following types of texture are supported now: ambient, diffuse, emission, reflective, specular, transparent.
      */
    FbxFileTexture * ImportTexture(xmlNode* pXmlNode);

    /** Import a COLLADA image element.
      * \param pXmlNode The COLLADA image element.
      * \return The created texture object and return \c NULL if failed.
      */
    FbxFileTexture * ImportImage(xmlNode* pXmlNode);

    /** Import a COLLADA mesh element.
      * If this mesh element contains polygons, polygon list or triangles elements, a FBX mesh will be created.
      * If it contains lines or line strips elements, a FBX line will be created.
      * \param pXmlNode The COLLADA mesh element.
      * \param pMaterialSequence A ordered sequence of material symbols connecting to the geometry.
	  * \param pObjects List of all the created objects. If this mesh contains lines or line strips as well as
	  *                 the polymesh, the array will be filled with: [mesh, line, line strip]
      * \return The created geometry object and return \c NULL if failed.
      */
    FbxGeometry * ImportMesh(xmlNode* pXmlNode, const FbxDynamicArray<FbxString> & pMaterialSequence, FbxArray<FbxObject*>& pObjects);

    /** Import a COLLADA vertices element.
      * \param pVerticesElement The COLLADA vertices element.
      * \param pGeometry The FBX geometry object to store the vertices.
      * \return true on success, false otherwise.
      * \remarks Besides vertex, the vertex colors and normals are also imported.
      */
    bool ImportVertices(xmlNode* pVerticesElement, FbxGeometry * pGeometry);

    /** Import polygons of Collada mesh node to FBX mesh node.
    * \param pXmlNode Pointer to XML mesh Node.
    * \param pMesh The FBX mesh object.
    * \param pMaterialSequence A ordered sequence of material symbols connecting to the mesh.
    * \return true on success, false otherwise.
    * \remarks Vertex colors, normals, UVs, textures and materials which related to polygons, are also imported.
    */
	bool ImportPolygons(xmlNode* pXmlNode, FbxMesh& pMesh, const FbxDynamicArray<FbxString> & pMaterialSequence);

    /** Import the transformation of Collada node to FBX node.
    * \param pXmlNode Pointer to XML Node.
    * \param pNode The FBX node.
    * \return true on success, false otherwise.
    * \remarks Transformation will cover matrix, translation, rotation, scale, skew, perspective, etc.
    */
	bool ImportTransforms(xmlNode* pXmlNode, FbxNode* pNode);

    /** Import a COLLADA rotation element.
      * \param pXmlNode The COLLADA rotation element.
      * \param pRotationVector Vector4 value to return the rotation vector.
      * \return Return the rotation axis index.
      */
    int ImportRotationElement(xmlNode* pXmlNode, FbxVector4& pRotationVector);

    /** Extrapolate rotation order by the given int list.
      * \param pNode The node whose rotation order is updated.
      * \param pRotationOrder The int list representing the rotation order.
      */
    void SetRotationOrder(FbxNode * pNode, const FbxArray<int> & pRotationOrder);

     /** Import Collada look at node, and computed camera position, interest, up vector, etc.
    * \param pXmlNode Pointer to XML look at Node.
    * \param lCameraPosition Vector4 value to return camera position.
    * \param lInterestPosition Vector4 value to return camera interest position.
    * \param lUpVector Vector4 value to return camera up vector.
    * \param lCameraTransformMatrix XMatrix value to return camera transform matrix.
    * \return true on success, false otherwise.
    * \remarks Computed camera parameters are saved in lCameraPosition, lInterestPosition, lUpVector, lCameraTransformMatrix.
    */
    bool ImportLookAt(xmlNode* pXmlNode, FbxVector4& lCameraPosition, 
										 FbxVector4& lInterestPosition, FbxVector4& lUpVector,
										 FbxAMatrix& lCameraTransformMatrix);

    //@}


    /**
    * \name Miscellaneous Functions
    */
    //@{
    
    /** Return false if we do not want to import a node with the given ID.
    * \param lId The node ID.
    * \return true for importable, false for in-importable.
    * \remarks Do not import camera nodes with IDs (perspective, top, bottom,
    * left, right, side, front or back), since they are global cameras already created in FBX.
    */
	bool IsNodeExportable(FbxString lId);
    
    /** Check if the Collada version is 1.4.*.
      * \param pVersionString The string representing the COLLADA version, like "1.4.1".
      * \return \c true if the Collada version is 1.4.* or \c false otherwise.
      */
    bool CheckColladaVersion(const FbxString & pVersionString);

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

    /** Import the whole scene from the root element of a COLLADA file.
      * This is the main entry of COLLADA reader.
      * \param pColladaNode The root element.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportScene(xmlNode * pColladaNode);

    /** Preprocess the COLLADA scene.
      * \param pColladaElement The root element of COLLADA scene.
      */
    void Preprocess(xmlNode * pColladaElement);

    /** Build up the cache map from COLLADA element id to their data, which contain COLLADA elements and FBX objects.
      */
    void BuildUpLibraryMap();

    /** Recursively build up the cache map from COLLADA element id to their data, which contain COLLADA elements and FBX objects.
      * /param pElement The parent element which may contain target elements.
      * /param pElementTag The tag of target elements.
      */
    void BuildUpLibraryMap(xmlNode * pElement, const FbxString & pElementTag);

    /** Retrieve the material map from the bind_material element under an instance_geometry or instance_controller.
      * And connected the created materials to the node.
      * \param pNode The node to which the materials connect.
      * \param pElement The COLLADA instance_goemetry or instance_controller element.
      * \param pMaterialSequence The ordered material symbols which is used to create geometries.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ConnectMaterialsToNode(FbxNode * pNode, xmlNode * pElement, FbxDynamicArray<FbxString> & pMaterialSequence);

    /** Import COLLADA transparent and transparency attributes in a COLLADA effect element.
      * \param pElement A COLLADA Lambert, Phong, constant or Blinn element.
      * \param pSurfaceMaterial A FBX surface material.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportTransparent(xmlNode * pElement, FbxSurfaceLambert * pSurfaceMaterial);

    // Some traits with a typed element.
    struct LibraryTypeTraits
    {
        FbxString library_tag;
        FbxString element_tag;
    };

    /** Get a typed element from the library element with a given ID.
      * \param pTypeTraits The traits of type.
      * \param pID The ID of the element.
      * \return The FBX object.
      */
    FbxObject * GetLibrary(const LibraryTypeTraits & pTypeTraits, const FbxString & pID);
    FbxObject * GetLibrary(const LibraryTypeTraits & pTypeTraits, xmlNode * pElement);

    /** Import the transform animation of a given node.
      * \param pNode The node whose transform to be animated.
      * \pAnimationChannelID The ID of animation element.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportMatrixAnimation(FbxNode * pNode, const FbxString & pAnimationChannelID);

    /** Import the animation of a given attribute.
      * \param pProperty The property to be animated.
      * \param pAnimationChannelID The ID of animation element.
      * \param pChannelName The channel name if the property has multiple channels.
      * \return Return \c true on success and \c false otherwise.
      */
    bool ImportPropertyAnimation(FbxProperty & pProperty, const FbxString & pAnimationChannelID, const char * pChannelName = NULL);

    /** Get the animation layer to which the specific animation curve belongs.
      * \param pAnimationID The ID of the animation curve.
      * \return The animation layer.
      */
    FbxAnimLayer * GetAnimLayer(const FbxString & pAnimationID);

    /** Import local unit conversion.
      * \param pElement The specific element.
      * \return Return the local unit conversion.
      */
    double GetLocalUnitConversion(xmlNode * pElement);

    /** Set the value of the property.
      * \param pPropertyElement The corresponding element.
      * \param pProperty The specific property.
      */
    void SetProperty(xmlNode* pPropertyElement, FbxProperty & pProperty);

    /** Create a property with given name and set the value.
      * \param pObject The object as the parent of the property.
      * \param pPropertyName The name of the property.
      * \param pPropertyValueElement The element containing the value.
      */
    void ImportPropertyValue(FbxObject * pObject, const char * pPropertyName,
                             xmlNode * pPropertyValueElement);

    FbxFile*		mFileObject;
    FbxString		mFileName;

    // XML lib stuff
    xmlDocPtr		mXmlDoc;

    FbxAnimLayer*	mAnimLayer;
    FbxScene*		mScene;

    // Save the global settings and document info in pre-reading
    FbxGlobalSettings * mGlobalSettings;
    FbxDocumentInfo * mDocumentInfo;
    FbxArray<FbxTakeInfo*> mTakeInfo;

    xmlNode * mColladaElement;

    struct ColladaElementData
    {
        explicit ColladaElementData(xmlNode * pElement = NULL)
            : mColladaElement(pElement), mFBXObject(NULL) {}
        xmlNode * mColladaElement;
        FbxObject * mFBXObject;
		FbxArray<FbxObject*> mFBXObjects;
    };
	typedef FbxMap<FbxString, ColladaElementData> ColladaElementMapType;
    ColladaElementMapType mColladaElements;

    LibraryTypeTraits mEffectTypeTraits;
    LibraryTypeTraits mMaterialTypeTraits;
    LibraryTypeTraits mImageTypeTraits;
    LibraryTypeTraits mGeometryTypeTraits;
    LibraryTypeTraits mControllerTypeTraits;
    LibraryTypeTraits mLightTypeTraits;
    LibraryTypeTraits mCameraTypeTraits;
    LibraryTypeTraits mNodeTypeTraits;
    LibraryTypeTraits mAnimationTypeTraits;

	typedef FbxMap<FbxString, FbxArray<xmlNode*> > AnimationMapType;
    AnimationMapType mAnimationElements;

    SourceElementMapType mSourceElements;

	struct AnimationClipData
	{
		AnimationClipData(const FbxString & pID) : mID(pID), mAnimLayer(NULL) {}
		AnimationClipData(const AnimationClipData& pOther){ *this = pOther; }
		AnimationClipData& operator=(const AnimationClipData& pOther){ mID = pOther.mID; mAnimationElementIDs = pOther.mAnimationElementIDs; mAnimLayer = pOther.mAnimLayer; return *this; }

		FbxString mID;                                // ID of animation clip
		FbxSet<FbxString> mAnimationElementIDs;     // IDs of animation belong to this animation clip
		FbxAnimLayer * mAnimLayer;                 // The corresponding animation layer
	};
	FbxDynamicArray<AnimationClipData> mAnimationClipData;

    // Map from skin ID to skin element.
    SkinMapType mSkinElements;

    // There are two distinct namespaces for node ID & SID mapping.
    // One with ID and the other with SID.
    typedef FbxMap<FbxString, FbxNode *> NodeMapType;
    NodeMapType mIDNamespaceNodes;
    NodeMapType mSIDNamespaceNodes;

    // Record the nodes which are to connect to its target node.
    // Save the ID of the target node if a node has its target
	typedef FbxMap<FbxNode *, FbxString> TargetIDMapType;
    TargetIDMapType mTargetIDs;

    FbxColladaNamespace mNamespace;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_COLLADA_READER_H_ */
