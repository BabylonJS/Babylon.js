/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxanimcurvenode.h
#ifndef _FBXSDK_SCENE_ANIMATION_CURVE_NODE_H_
#define _FBXSDK_SCENE_ANIMATION_CURVE_NODE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

//Standard curve node names
#define FBXSDK_CURVENODE_TRANSFORM		"Transform"
#define FBXSDK_CURVENODE_TRANSLATION	"T"
#define FBXSDK_CURVENODE_ROTATION		"R"
#define FBXSDK_CURVENODE_SCALING		"S"
#define FBXSDK_CURVENODE_COMPONENT_X	"X"
#define FBXSDK_CURVENODE_COMPONENT_Y	"Y"
#define FBXSDK_CURVENODE_COMPONENT_Z	"Z"
#define FBXSDK_CURVENODE_COLOR			"Color"
#define FBXSDK_CURVENODE_COLOR_RED		FBXSDK_CURVENODE_COMPONENT_X
#define FBXSDK_CURVENODE_COLOR_GREEN	FBXSDK_CURVENODE_COMPONENT_Y
#define FBXSDK_CURVENODE_COLOR_BLUE		FBXSDK_CURVENODE_COMPONENT_Z

class FbxAnimStack;
class FbxAnimCurve;
class FbxMultiMap;
class KFCurveNode;

/** This class is an composite of animation curves and is called as animation curve node.
  * \nosubgrouping
  * Animation curve node is used as the connection point for animation curves and other animation curve nodes 
  * associated to a property.  FbxAnimCurveNode can be connected to other FbxAnimCurveNode, 
  * in this case, the destination animation curve node may be considered as "composite", \ref IsComposite().
  * remarks  When created, the FbxAnimCurveNode has no valid channels unless it is created using the function CreateTypedCurveNode(). 
  * This function will add all the required channels to correctly match the number of values of the property.
  * For instance, when CreateTypedCurveNode(pNode.LclTranslation, pScene) is called, the resulting 
  * FbxAnimCurveNode will automatically have 3 channels corresponding to the X,Y and Z components of the LclTranslation property. 
  * You can add and remove channels dynamically but can never remove the channels that have been added by the call to CreateTypedCurveNode(). 
  *
  * However, the FBX SDK animation system's default implementation is to consider only the first curve connected to 
  * the channel. Therefore, if the caller connects multiple animation curves to the same channel, then it becomes 
  * the caller's responsibility to handle and manipulate these extra curves in a meaningful manner.
  */
class FBXSDK_DLL FbxAnimCurveNode : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxAnimCurveNode, FbxObject);

public:
    /**
      * \name Utility functions.
      *
      */
    //@{
        /** Check if the animation curve node contains any animation key.
          * \param pRecurse \c true to descend to the children if the animation curve node is composite.
          * \return \c true if at least one animation curve that contains one or more animation keys is found, 
          *         \c false otherwise.
		  * \remarks This method only considers the first animation curve connected to each channel.
		  *          To check multiple animation curves that are connected to the same channel, it is the caller's 
		  *          responsibility to write a new version of this method, and GetCurveCount() will be useful in this case.
          */
        bool IsAnimated(bool pRecurse=false) const;

        /** Find out start and end time of the animation.
          * This function retrieves the including time span for all animation curves of this animation curve node.
          * \param pTimeInterval Reference to receive start time and end time.
          * \return \c true on success, \c false otherwise.
          * \remarks \c false is also returned if this animation curve node has no animation.
		  * \remarks This method only considers the first animation curve connected to each channel.
		  *          To find time interval of multiple animation curves that are connected to the same channel, it is the caller's 
		  *          responsibility to write a new version of this method, and GetCurveCount() will be useful in this case.
          */
        bool GetAnimationInterval(FbxTimeSpan& pTimeInterval) const;

        /** Test this object to see if it is a composite FbxAnimCurveNode or a "leaf".
          * A composite FbxAnimCurveNode is a FbxAnimCurveNode whose all source connections are FbxAnimCurveNode
          * and its property channels is totally empty. It is just a container to take other FbxAnimCurveNode.
          * \return \c true if this object is a composite, \c false otherwise.
          */
        bool IsComposite() const;

        /** Recursively look for the FbxAnimCurveNode matching the passed named argument.
          * \param pName Name of the FbxAnimCurveNode we are looking for.
          * \return The found anim curve node or NULL.
          * \remarks If pName is an empty string, this function automatically return NULL.
          */
        FbxAnimCurveNode* Find(const char* pName);

        /** Create a FbxAnimCurveNode compatible with the specified property data type.
          * \param pProperty The property that needs a FbxAnimCurveNode.
          * \param pScene The scene the created FbxAnimCurveNode will belong to.
          * \return The pointer to the newly created FbxAnimCurveNode. Returns NULL if an error occurred. 
          * \remarks This function does not connect the newly created FbxAnimCurveNode to the property.
          * \remarks This function detects FbxDouble3, FbxDouble4 and FbxDouble4x4 properties DataTypes and
          *         automatically adds the required channels properties. Any other DataType is not 
          *         specifically processed and the channels properties are left empty and need to be filled
          *         using the AddChannel() function.
          */
        static FbxAnimCurveNode* CreateTypedCurveNode(FbxProperty& pProperty, FbxScene* pScene);

        /** Get the total number of property channels defined in this animation curve node.
		  * For composite animation curve nodes, since they do not contain any channels, this function will always return 0.
          * \return The number of property channels.
          */
        unsigned int GetChannelsCount() const;

        /** Get the index of the named channel.
          * \param pChannelName Name of the channel for which we want the index.
          * \return the index of the named channel or -1 if no channel with this name is found.
          */
        int GetChannelIndex(const char* pChannelName) const;

        /** Get the name of the channel.
          * \param pChannelId Index of the channel for which we want the name.
          * \return the name of the indexed channel or "" if the index is invalid.
          */
        FbxString GetChannelName(int pChannelId) const;

        /** Empties the property channels of this animation curve node.
          * \remarks This function will remove all the channels added with the AddChannel() method
          *          regardless of their use and/or connections.
		  *          But it can not remove the channels that are added by the call to CreateTypedCurveNode().
          */
        void ResetChannels();

        /** Adds the specified channel property.
          * \param pChnlName Channel name.
          * \param pValue Default value of the channel.
          * \return \c true if successful, \c false otherwise.
          * \remarks It is an error to try to add a channel that already exists.
          */
        template <class T> bool AddChannel(const char* pChnlName, T const &pValue)
        {
            if (!pChnlName || strlen(pChnlName)==0) return false;
            FbxProperty c = GetChannel(pChnlName);
            if (c.IsValid()) 
            {
                return false;
            }

            mChannels.BeginCreateOrFindProperty();
            FbxDataType dt = FbxGetDataTypeFromEnum(FbxTypeOf(pValue));
            c = FbxProperty::Create(mChannels, dt, pChnlName);
            c.Set(pValue);
            mChannels.EndCreateOrFindProperty();
            return true;
        }

        /** Set the default value of the channel.
          * \param pChnlName Channel name.
          * \param pValue    New default value of this channel.
          */
        template <class T> void SetChannelValue(const char* pChnlName, T pValue)
        {
            FbxProperty c = GetChannel(pChnlName);
            if( c.IsValid() ) c.Set(pValue);
        }

        /** Set the default value of the channel.
          * \param pChnlId   Channel index.
          * \param pValue    New default value of this channel.
          */
        template <class T> void SetChannelValue(unsigned int pChnlId, T pValue)
        {
            FbxProperty c = GetChannel(pChnlId);
            if( c.IsValid() ) c.Set(pValue);
        }

        /** Get the default value of the channel.
          * \param pChnlName Channel name.
          * \param pInitVal  Value returned if the specified channel is invalid.
          * \return The default value of this channel.
          */
        template <class T> T GetChannelValue(const char* pChnlName, T pInitVal)
        {
            T v = pInitVal;
            FbxProperty c = GetChannel(pChnlName);
            if( c.IsValid() ) v = c.Get<T>();
            return v;
        }

        /** Get the default value of the channel.
          * \param pChnlId Channel index.
		  * \param pInitVal  Value returned if the specified channel is invalid.
          * \return The default value of this channel.
          */
        template <class T> T GetChannelValue(unsigned int pChnlId, T pInitVal)
        {
            T v = pInitVal;
            FbxProperty c = GetChannel(pChnlId);
            if( c.IsValid() ) v = c.Get<T>();
            return v;
        }
    //@}

    /**
      * \name FbxAnimCurve management.
      *
      */
    //@{
        /** Disconnect the animation curve from the channel.
          * \param pCurve       The curve to disconnect from the channel.
          * \param pChnlId      The channel index.
          * \return \c true if the disconnection was made, \c false if an error occurred.
          */
        bool DisconnectFromChannel(FbxAnimCurve* pCurve, unsigned int pChnlId);

        /** Connects the given animation curve to the specified channel.
          * \param pCurve   The curve to connect to the channel.
          * \param pChnl    The name of the channel the curve is to be connected to.
          * \param pInFront When \c true, all the current connections are moved after this one,
          *                 making this one the first. By default, the connection is the last one.
          * \return \c true if the connection was made, \c false if an error occurred.
          */
        bool ConnectToChannel(FbxAnimCurve* pCurve, const char* pChnl, bool pInFront = false);

        /** Connects the given animation curve to the specified channel.
          * \param pCurve   The curve to connect to the channel.
          * \param pChnlId  Index of the channel the curve is to be connected to.
          * \param pInFront When \c true, all the current connections are moved after this one.
          *                 making this one the first. By default, the connection is the last one.
          * \return \c true if the connection was made, \c false if an error occurred.
          * \remarks The index is 0 based.
          */
        bool ConnectToChannel(FbxAnimCurve* pCurve, unsigned int pChnlId, bool pInFront = false);

        /** Creates a new curve and connects it to the specified channel of the animation curve node named pCurveNodeName.
		  * If this animation curve node is composite, this function will try to search all children animation curve nodes
		  * recursively for the one named pCurveNodeName.
          * \param pCurveNodeName Name of the FbxAnimCurveNode we are looking for.
          * \param pChannel Channel identifier.
          * \return Pointer to the FbxAnimCurve or NULL if an error occurred.
          * \remarks pCurveNodeName cannot be empty.
          * \remarks If the pChannel identifier is left NULL, the first valid channel will be used to create curve.
          */
        FbxAnimCurve* CreateCurve(const char* pCurveNodeName, const char* pChannel);

        /** Creates a new curve and connects it to the specified channel of the animation curve node named pCurveNodeName.
		  * If this animation curve node is composite, this function will try to search all children animation curve nodes
		  * recursively for the one named pCurveNodeName.
    	  * \param pCurveNodeName Name of the FbxAnimCurveNode we are looking for.
          * \param pChannelId Channel index.
          * \return Pointer to the FbxAnimCurve or NULL if an error occurred.
          * \remarks pCurveNodeName cannot be empty.
          *          If the pChannelId is not assigned, the first valid channel will be used to create curve.
          */
        FbxAnimCurve* CreateCurve(const char* pCurveNodeName, unsigned int pChannelId = 0);
        
        /** Get the number of FbxAnimCurve connected to the specified channel.
		  * If this animation curve node is composite, this function will try to search all children animation curve nodes
   		  * recursively for the one named pCurveNodeName.
          * \param pChannelId Channel index.
          * \param pCurveNodeName Name of the FbxAnimCurveNode we are looking for.
          * \return The number of animation curves on the specified channel or 0 if an error occurred.
          * \remarks This method fails if the FbxAnimCurveNode with name pCurveNodeName does not exist and return 0.
          *          If the specified channel cannot be found on the FbxAnimCurveNode with name pCurveNodeName, return 0.
		  * \remarks If this animation curve node is composite, this function will try to search all 
		  *          children animation curve nodes recursively for the one named pCurveNodeName.
          *          If the pCurveNodeName is left NULL, then only look for the curves on this animation curve node 
		  *          even if it is composite.
          */
        int GetCurveCount(unsigned int pChannelId, const char* pCurveNodeName = NULL);

        /** Get the FbxAnimCurve of the specified channel.
		  * If this animation curve node is composite, this function will try to search all children animation curve nodes
		  * recursively for the one named pCurveNodeName.
		  * \param pChannelId Channel index.
          * \param pId The index of the desired anim curve (in case there is more than one).
          * \param pCurveNodeName Name of the FbxAnimCurveNode we are looking for (if this object is a composite).
          * \return Pointer to the FbxAnimCurve that matches the criteria.
          * \remarks This method fails if the FbxAnimCurveNode with name pCurveNodeName does not exist and return NULL.
          *          If the specified channel cannot be found in the FbxAnimCurveNode with name pCurveNodeName, return NULL.
		  * \remarks If the pCurveNodeName is left NULL, then only search in the curves on this animation curve node 
		  *          even if it is composite.
          */
        FbxAnimCurve* GetCurve(unsigned int pChannelId, unsigned int pId = 0, const char* pCurveNodeName = NULL);

     //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxObject& Copy(const FbxObject& pObject);

    static const char* CurveNodeNameFrom(const char* pName);
	static bool EvaluateChannels(FbxAnimCurveNode* pCurveNode, double* pData, unsigned int pCount, FbxTime pTime);

    void ReleaseKFCurveNode();
    void SyncChannelsWithKFCurve();

    inline bool UseQuaternionInterpolation() {return mQuaternionInterpolation != 0;}; 
	bool SetQuaternionInterpolation(unsigned short pVal); 
    unsigned short GetQuaternionInterpolation() { return mQuaternionInterpolation; };
    void SetKFCurveNodeLayerType(FbxProperty& pProp);
	KFCurveNode* GetKFCurveNode(bool pNoCreate=false);

private:
	friend class FbxAnimCurveFilterMatrixConverter;
	friend class FbxAnimEvalClassic;
    void Evaluate(double* pData, FbxTime pTime);
    
protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual void Destruct(bool pRecursive);
    virtual void ConstructProperties(bool pForceSet);
	virtual bool ConnectNotify(const FbxConnectEvent& pEvent);

    FbxAnimCurveNode* Find(FbxAnimCurveNode* pRoot, const FbxString& pName);

private:
    FbxProperty GetChannel(const char* pChnl);
    FbxProperty GetChannel(unsigned int pChnlId);

	friend void CollectAnimFromCurveNode(void **lSrc, void *fcn, unsigned int nbCrvs, FbxAnimCurveNode *cn, FbxMultiMap* pNickToAnimCurveTimeWarpsSet, FbxMultiMap& pNickToKFCurveNodeWarpSet);

    unsigned char	mNonRemovableChannels;
    FbxProperty		mChannels;
    FbxProperty*	mCurrentlyProcessed;
    KFCurveNode*	mFCurveNode;
    bool*			mOwnedKFCurve;
    int				mKFCurveNodeLayerType;
    unsigned short  mQuaternionInterpolation;
	int*			mDirectIndexes;
	int				mDirectIndexesSize;

    FbxAnimCurve* GetCurve(unsigned int pChannelId, unsigned int pId, FbxAnimCurveNode* pCurveNode);
    bool ConnectToChannel(FbxProperty& p, FbxAnimCurve* pCurve, bool pInFront);
    void ResetKFCurveNode();
    void SyncKFCurveValue(FbxAnimCurve* pCurve, double pVal);
	void ReleaseOwnershipOfKFCurve(int pIndex);

	template <class T> FbxAnimCurve* CreateCurveGeneral(const char* pCurveNodeName, T pChannel);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

FBXSDK_DLL void GetAllAnimCurves(FbxAnimStack* pAnimStack, FbxArray<FbxAnimCurve*>& pCurves);
FBXSDK_DLL void GetAllAnimCurves(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxArray<FbxAnimCurve*>& pCurves);

#include <fbxsdk/fbxsdk_nsend.h>

#endif // FBXFILESDK_KFBXPLUGINS_KFBXANIMCURVENODE_H

