//-------------------------------------------------------------------------------------
// DirectXTexMisc.cpp
//  
// DirectX Texture Library - Misc image operations
//
// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// http://go.microsoft.com/fwlink/?LinkId=248926
//-------------------------------------------------------------------------------------

#include "directxtexp.h"

namespace DirectX
{
static const XMVECTORF32 g_Gamma22 = { 2.2f, 2.2f, 2.2f, 1.f };

//-------------------------------------------------------------------------------------
static HRESULT _ComputeMSE( _In_ const Image& image1, _In_ const Image& image2,
                            _Out_ float& mse, _Out_writes_opt_(4) float* mseV,
                            _In_ DWORD flags )
{
    if ( !image1.pixels || !image2.pixels )
        return E_POINTER;

    assert( image1.width == image2.width && image1.height == image2.height );
    assert( !IsCompressed( image1.format ) && !IsCompressed( image2.format )  );

    const size_t width = image1.width;

    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*width)*2, 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    // Flags implied from image formats
    switch( image1.format )
    {
    case DXGI_FORMAT_B8G8R8X8_UNORM:
        flags |= CMSE_IGNORE_ALPHA;
        break;

    case DXGI_FORMAT_B8G8R8X8_UNORM_SRGB:
        flags |= CMSE_IMAGE1_SRGB | CMSE_IGNORE_ALPHA;
        break;

    case DXGI_FORMAT_R8G8B8A8_UNORM_SRGB:
    case DXGI_FORMAT_BC1_UNORM_SRGB:
    case DXGI_FORMAT_BC2_UNORM_SRGB:
    case DXGI_FORMAT_BC3_UNORM_SRGB:
    case DXGI_FORMAT_B8G8R8A8_UNORM_SRGB:
    case DXGI_FORMAT_BC7_UNORM_SRGB:
        flags |= CMSE_IMAGE1_SRGB;
        break;
    }

    switch( image2.format )
    {
    case DXGI_FORMAT_B8G8R8X8_UNORM:
        flags |= CMSE_IGNORE_ALPHA;
        break;

    case DXGI_FORMAT_B8G8R8X8_UNORM_SRGB:
        flags |= CMSE_IMAGE2_SRGB | CMSE_IGNORE_ALPHA;
        break;

    case DXGI_FORMAT_R8G8B8A8_UNORM_SRGB:
    case DXGI_FORMAT_BC1_UNORM_SRGB:
    case DXGI_FORMAT_BC2_UNORM_SRGB:
    case DXGI_FORMAT_BC3_UNORM_SRGB:
    case DXGI_FORMAT_B8G8R8A8_UNORM_SRGB:
    case DXGI_FORMAT_BC7_UNORM_SRGB:
        flags |= CMSE_IMAGE2_SRGB;
        break;
    }

    const uint8_t *pSrc1 = image1.pixels;
    const size_t rowPitch1 = image1.rowPitch;

    const uint8_t *pSrc2 = image2.pixels;
    const size_t rowPitch2 = image2.rowPitch;

    XMVECTOR acc = g_XMZero;
    static XMVECTORF32 two = { 2.0f, 2.0f, 2.0f, 2.0f };

    for( size_t h = 0; h < image1.height; ++h )
    {
        XMVECTOR* ptr1 = scanline.get();
        if ( !_LoadScanline( ptr1, width, pSrc1, rowPitch1, image1.format ) )
            return E_FAIL;

        XMVECTOR* ptr2 = scanline.get() + width;
        if ( !_LoadScanline( ptr2, width, pSrc2, rowPitch2, image2.format ) )
            return E_FAIL;

        for( size_t i = 0; i < width; ++i )
        {
            XMVECTOR v1 = *(ptr1++);
            if ( flags & CMSE_IMAGE1_SRGB )
            {
                v1 = XMVectorPow( v1, g_Gamma22 );
            }
            if ( flags & CMSE_IMAGE1_X2_BIAS )
            {
                v1 = XMVectorMultiplyAdd( v1, two, g_XMNegativeOne );
            }

            XMVECTOR v2 = *(ptr2++);
            if ( flags & CMSE_IMAGE2_SRGB )
            {
                v2 = XMVectorPow( v2, g_Gamma22 );
            }
            if ( flags & CMSE_IMAGE2_X2_BIAS )
            {
                v1 = XMVectorMultiplyAdd( v2, two, g_XMNegativeOne );
            }

            // sum[ (I1 - I2)^2 ]
            XMVECTOR v = XMVectorSubtract( v1, v2 );
            if ( flags & CMSE_IGNORE_RED )
            {
                v = XMVectorSelect( v, g_XMZero, g_XMMaskX );
            }
            if ( flags & CMSE_IGNORE_GREEN )
            {
                v = XMVectorSelect( v, g_XMZero, g_XMMaskY );
            }
            if ( flags & CMSE_IGNORE_BLUE )
            {
                v = XMVectorSelect( v, g_XMZero, g_XMMaskZ );
            }
            if ( flags & CMSE_IGNORE_ALPHA )
            {
                v = XMVectorSelect( v, g_XMZero, g_XMMaskW );
            }

            acc = XMVectorMultiplyAdd( v, v, acc );
        }

        pSrc1 += rowPitch1;
        pSrc2 += rowPitch2;
    }

    // MSE = sum[ (I1 - I2)^2 ] / w*h
    XMVECTOR d = XMVectorReplicate( float(image1.width * image1.height) );
    XMVECTOR v = XMVectorDivide( acc, d );
    if ( mseV )
    {
        XMStoreFloat4( reinterpret_cast<XMFLOAT4*>( mseV ), v );
        mse = mseV[0] + mseV[1] + mseV[2] + mseV[3];
    }
    else
    {
        XMFLOAT4 _mseV;
        XMStoreFloat4( &_mseV, v );
        mse = _mseV.x + _mseV.y + _mseV.z + _mseV.w;
    }

    return S_OK; 
}


//=====================================================================================
// Entry points
//=====================================================================================
        
//-------------------------------------------------------------------------------------
// Copies a rectangle from one image into another
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT CopyRectangle( const Image& srcImage, const Rect& srcRect, const Image& dstImage, DWORD filter, size_t xOffset, size_t yOffset )
{
    if ( !srcImage.pixels || !dstImage.pixels )
        return E_POINTER;

    if ( IsCompressed( srcImage.format ) || IsCompressed( dstImage.format )
         || IsPlanar( srcImage.format ) || IsPlanar( dstImage.format )
         || IsPalettized( srcImage.format ) || IsPalettized( dstImage.format ) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    // Validate rectangle/offset
    if ( !srcRect.w || !srcRect.h || ( (srcRect.x + srcRect.w) > srcImage.width ) || ( (srcRect.y + srcRect.h) > srcImage.height ) )
    {
        return E_INVALIDARG;
    }

    if ( ( (xOffset + srcRect.w) > dstImage.width ) || ( (yOffset + srcRect.h) > dstImage.height ) )
    {
        return E_INVALIDARG;
    }

    // Compute source bytes-per-pixel
    size_t sbpp = BitsPerPixel( srcImage.format );
    if ( !sbpp )
        return E_FAIL;

    if ( sbpp < 8 )
    {
        // We don't support monochrome (DXGI_FORMAT_R1_UNORM)
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    const uint8_t* pEndSrc = srcImage.pixels + srcImage.rowPitch*srcImage.height;
    const uint8_t* pEndDest = dstImage.pixels + dstImage.rowPitch*dstImage.height;

    // Round to bytes
    sbpp = ( sbpp + 7 ) / 8;

    const uint8_t* pSrc = srcImage.pixels + (srcRect.y * srcImage.rowPitch) + (srcRect.x * sbpp);

    if ( srcImage.format == dstImage.format )
    {
        // Direct copy case (avoid intermediate conversions)
        uint8_t* pDest = dstImage.pixels + (yOffset * dstImage.rowPitch) + (xOffset * sbpp);
        const size_t copyW = srcRect.w * sbpp;
        for( size_t h=0; h < srcRect.h; ++h )
        {
            if ( ( (pSrc+copyW) > pEndSrc ) || (pDest > pEndDest) )
                return E_FAIL;

            memcpy_s( pDest, pEndDest - pDest, pSrc, copyW );

            pSrc += srcImage.rowPitch;
            pDest += dstImage.rowPitch;
        }

        return S_OK;
    }

    // Compute destination bytes-per-pixel (not the same format as source)
    size_t dbpp = BitsPerPixel( dstImage.format );
    if ( !dbpp )
        return E_FAIL;

    if ( dbpp < 8 )
    {
        // We don't support monochrome (DXGI_FORMAT_R1_UNORM)
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    // Round to bytes
    dbpp = ( dbpp + 7 ) / 8;

    uint8_t* pDest = dstImage.pixels + (yOffset * dstImage.rowPitch) + (xOffset * dbpp);

    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*srcRect.w), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    const size_t copyS = srcRect.w * sbpp;
    const size_t copyD = srcRect.w * dbpp;

    for( size_t h=0; h < srcRect.h; ++h )
    {
        if ( ( (pSrc+copyS) > pEndSrc) || ((pDest+copyD) > pEndDest) )
            return E_FAIL;

        if ( !_LoadScanline( scanline.get(), srcRect.w, pSrc, copyS, srcImage.format ) )
            return E_FAIL;

        _ConvertScanline( scanline.get(), srcRect.w, dstImage.format, srcImage.format, filter );

        if ( !_StoreScanline( pDest, copyD, dstImage.format, scanline.get(), srcRect.w ) )
            return E_FAIL;

        pSrc += srcImage.rowPitch;
        pDest += dstImage.rowPitch;
    }

    return S_OK;
}

    
//-------------------------------------------------------------------------------------
// Computes the Mean-Squared-Error (MSE) between two images
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT ComputeMSE( const Image& image1, const Image& image2, float& mse, float* mseV, DWORD flags )
{
    if ( !image1.pixels || !image2.pixels )
        return E_POINTER;

    if ( image1.width != image2.width || image1.height != image2.height )
        return E_INVALIDARG;

    if ( IsPlanar( image1.format ) || IsPlanar( image2.format )
         || IsPalettized( image1.format ) || IsPalettized( image2.format ) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    if ( IsCompressed(image1.format) )
    {
        if ( IsCompressed(image2.format) )
        {
            // Case 1: both images are compressed, expand to RGBA32F
            ScratchImage temp1;
            HRESULT hr = Decompress( image1, DXGI_FORMAT_R32G32B32A32_FLOAT, temp1 );
            if ( FAILED(hr) )
                return hr;

            ScratchImage temp2;
            hr = Decompress(  image2, DXGI_FORMAT_R32G32B32A32_FLOAT, temp2 );
            if ( FAILED(hr) )
                return hr;

            const Image* img1 = temp1.GetImage(0,0,0);
            const Image* img2 = temp2.GetImage(0,0,0);
            if ( !img1 || !img2 )
                return E_POINTER;

            return _ComputeMSE( *img1, *img2, mse, mseV, flags );
        }
        else
        {
            // Case 2: image1 is compressed, expand to RGBA32F
            ScratchImage temp;
            HRESULT hr = Decompress( image1, DXGI_FORMAT_R32G32B32A32_FLOAT, temp );
            if ( FAILED(hr) )
                return hr;

            const Image* img = temp.GetImage(0,0,0);
            if ( !img )
                return E_POINTER;

            return _ComputeMSE( *img, image2, mse, mseV, flags );
        }
    }
    else
    {
        if ( IsCompressed(image2.format) )
        {
            // Case 3: image2 is compressed, expand to RGBA32F
            ScratchImage temp;
            HRESULT hr = Decompress( image2, DXGI_FORMAT_R32G32B32A32_FLOAT, temp );
            if ( FAILED(hr) )
                return hr;

            const Image* img = temp.GetImage(0,0,0);
            if ( !img )
                return E_POINTER;

            return _ComputeMSE( image1, *img, mse, mseV, flags );
        }
        else
        {
            // Case 4: neither image is compressed
            return _ComputeMSE( image1, image2, mse, mseV, flags );
        }
    }
}

}; // namespace
