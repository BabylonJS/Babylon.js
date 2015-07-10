//-------------------------------------------------------------------------------------
// DirectXTexNormalMaps.cpp
//  
// DirectX Texture Library - Normal map operations
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

#pragma prefast(suppress : 25000, "FXMVECTOR is 16 bytes")
static inline float _EvaluateColor( _In_ FXMVECTOR val, _In_ DWORD flags )
{
    XMFLOAT4A f;

    static XMVECTORF32 lScale = { 0.2125f, 0.7154f, 0.0721f, 1.f };

    static_assert( CNMAP_CHANNEL_RED == 0x1, "CNMAP_CHANNEL_ flag values don't match mask" );
    switch( flags & 0xf )
    {
    case 0:
    case CNMAP_CHANNEL_RED:     return XMVectorGetX( val );
    case CNMAP_CHANNEL_GREEN:   return XMVectorGetY( val );
    case CNMAP_CHANNEL_BLUE:    return XMVectorGetZ( val );
    case CNMAP_CHANNEL_ALPHA:   return XMVectorGetW( val );

    case CNMAP_CHANNEL_LUMINANCE:
        {
            XMVECTOR v = XMVectorMultiply( val, lScale );
            XMStoreFloat4A( &f, v );
            return f.x + f.y + f.z;
        }
        break;

    default:
        assert(false);
        return 0.f;
    }
}

static void _EvaluateRow( _In_reads_(width) const XMVECTOR* pSource, _Out_writes_(width+2) float* pDest,
                          _In_ size_t width, _In_ DWORD flags )
{
    assert( pSource && pDest );
    assert( width > 0 );

    for( size_t x = 0; x < width; ++x )
    {
        pDest[x+1] = _EvaluateColor( pSource[x], flags );
    }

    if ( flags & CNMAP_MIRROR_U )
    {
        // Mirror in U
        pDest[0] = _EvaluateColor( pSource[0], flags );
        pDest[width+1] = _EvaluateColor( pSource[width-1], flags );
    }
    else
    {
        // Wrap in U
        pDest[0] = _EvaluateColor( pSource[width-1], flags );
        pDest[width+1] = _EvaluateColor( pSource[0], flags );
    }
}

static HRESULT _ComputeNMap( _In_ const Image& srcImage, _In_ DWORD flags, _In_ float amplitude,
                             _In_ DXGI_FORMAT format, _In_ const Image& normalMap )
{
    if ( !srcImage.pixels || !normalMap.pixels )
        return E_INVALIDARG;

    const DWORD convFlags = _GetConvertFlags( format );
    if ( !convFlags )
        return E_FAIL;

    if ( !( convFlags & (CONVF_UNORM | CONVF_SNORM | CONVF_FLOAT) ) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    const size_t width = srcImage.width;
    const size_t height = srcImage.height;
    if ( width != normalMap.width || height != normalMap.height )
        return E_FAIL;

    // Allocate temporary space (4 scanlines and 3 evaluated rows)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*width*4), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    ScopedAlignedArrayFloat buffer( reinterpret_cast<float*>( _aligned_malloc( ( ( sizeof(float) * ( width + 2 ) ) * 3 ), 16 ) ) );
    if ( !buffer )
        return E_OUTOFMEMORY;

    uint8_t* pDest = normalMap.pixels;
    if ( !pDest )
        return E_POINTER;

    XMVECTOR* row0 = scanline.get();
    XMVECTOR* row1 = row0 + width;
    XMVECTOR* row2 = row1 + width;
    XMVECTOR* target = row2 + width;

    float* val0 = buffer.get();
    float* val1 = val0 + width + 2;
    float* val2 = val1 + width + 2;

    const size_t rowPitch = srcImage.rowPitch;
    const uint8_t* pSrc = srcImage.pixels;

    // Read first scanline row into 'row1'
    if ( !_LoadScanline( row1, width, pSrc, rowPitch, srcImage.format ) )
        return E_FAIL;

    // Setup 'row0'
    if ( flags & CNMAP_MIRROR_V )
    {
        // Mirror first row
        memcpy_s( row0, rowPitch, row1, rowPitch );
    }
    else
    {
        // Read last row (Wrap V)
        if ( !_LoadScanline( row0, width, pSrc + (rowPitch * (height-1)), rowPitch, srcImage.format ) )
            return E_FAIL;
    }

    // Evaluate the initial rows
    _EvaluateRow( row0, val0, width, flags );
    _EvaluateRow( row1, val1, width, flags );

    pSrc += rowPitch;

    for( size_t y = 0; y < height; ++y )
    {
        // Load next scanline of source image
        if ( y < (height-1) )
        {
            if ( !_LoadScanline( row2, width, pSrc, rowPitch, srcImage.format ) )
                return E_FAIL;
        }
        else
        {
            if ( flags & CNMAP_MIRROR_V )
            {
                // Use last row of source image
                if ( !_LoadScanline( row2, width, srcImage.pixels + (rowPitch * (height-1)), rowPitch, srcImage.format ) )
                    return E_FAIL;
            }
            else
            {
                // Use first row of source image (Wrap V)
                if ( !_LoadScanline( row2, width, srcImage.pixels, rowPitch, srcImage.format ) )
                    return E_FAIL;
            }
        }

        // Evaluate row
        _EvaluateRow( row2, val2, width, flags );

        // Generate target scanline
        XMVECTOR *dptr = target;
        for( size_t x = 0; x < width; ++x )
        {
            // Compute normal via central differencing
            float totDelta = ( val0[x] - val0[x+2] ) + ( val1[x] - val1[x+2] ) + ( val2[x] - val2[x+2] );
            float deltaZX = totDelta * amplitude / 6.f;

            totDelta = ( val0[x] - val2[x] ) + ( val0[x+1] - val2[x+1] ) + ( val0[x+2] - val2[x+2] );
            float deltaZY = totDelta * amplitude / 6.f;

            XMVECTOR vx = XMVectorSetZ( g_XMNegIdentityR0, deltaZX );   // (-1.0f, 0.0f, deltaZX)
            XMVECTOR vy = XMVectorSetZ( g_XMNegIdentityR1, deltaZY );   // (0.0f, -1.0f, deltaZY)

            XMVECTOR normal = XMVector3Normalize( XMVector3Cross( vx, vy ) );

            // Compute alpha (1.0 or an occlusion term)
            float alpha = 1.f;

            if ( flags & CNMAP_COMPUTE_OCCLUSION )
            {
                float delta = 0.f;
                float c = val1[x+1];

                float t = val0[x] - c;  if ( t > 0.f ) delta += t;
                t = val0[x+1]   - c;    if ( t > 0.f ) delta += t;
                t = val0[x+2]   - c;    if ( t > 0.f ) delta += t;
                t = val1[x]     - c;    if ( t > 0.f ) delta += t;
                // Skip current pixel
                t = val1[x+2]   - c;    if ( t > 0.f ) delta += t;
                t = val2[x]     - c;    if ( t > 0.f ) delta += t;
                t = val2[x+1]   - c;    if ( t > 0.f ) delta += t;
                t = val2[x+2]   - c;    if ( t > 0.f ) delta += t;

                // Average delta (divide by 8, scale by amplitude factor)
                delta *= 0.125f * amplitude;
                if ( delta > 0.f )
                {
                    // If < 0, then no occlusion
                    float r = sqrtf( 1.f + delta*delta );
                    alpha = (r - delta) / r;
                }
            }

            // Encode based on target format
            if ( convFlags & CONVF_UNORM )
            {
                // 0.5f*normal + 0.5f -or- invert sign case: -0.5f*normal + 0.5f
                XMVECTOR n1 = XMVectorMultiplyAdd( (flags & CNMAP_INVERT_SIGN) ? g_XMNegativeOneHalf : g_XMOneHalf, normal, g_XMOneHalf ); 
                *dptr++ = XMVectorSetW( n1, alpha );
            }
            else if ( flags & CNMAP_INVERT_SIGN )
            {
                *dptr++ = XMVectorSetW( XMVectorNegate( normal ), alpha );
            }
            else
            {
                *dptr++ = XMVectorSetW( normal, alpha );
            }
        }

        if ( !_StoreScanline( pDest, normalMap.rowPitch, format, target, width ) )
            return E_FAIL;

        // Cycle buffers
        float* temp = val0;
        val0 = val1;
        val1 = val2;
        val2 = temp;

        pSrc += rowPitch;
        pDest += normalMap.rowPitch;
    }

    return S_OK;
}


//=====================================================================================
// Entry points
//=====================================================================================
        
//-------------------------------------------------------------------------------------
// Generates a normal map from a height-map
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT ComputeNormalMap( const Image& srcImage, DWORD flags, float amplitude,
                          DXGI_FORMAT format, ScratchImage& normalMap )
{
    if ( !srcImage.pixels || !IsValid(format) )
        return E_INVALIDARG;

    static_assert( CNMAP_CHANNEL_RED == 0x1, "CNMAP_CHANNEL_ flag values don't match mask" );
    switch( flags & 0xf )
    {
    case 0:
    case CNMAP_CHANNEL_RED:
    case CNMAP_CHANNEL_GREEN:
    case CNMAP_CHANNEL_BLUE:
    case CNMAP_CHANNEL_ALPHA:
    case CNMAP_CHANNEL_LUMINANCE:
        break;

    default:
        return E_INVALIDARG;
    }

    if ( IsCompressed(format) || IsCompressed(srcImage.format)
         || IsTypeless(format) || IsTypeless(srcImage.format) 
         || IsPlanar(format) || IsPlanar(srcImage.format) 
         || IsPalettized(format) || IsPalettized(srcImage.format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    // Setup target image
    normalMap.Release();

    HRESULT hr = normalMap.Initialize2D( format, srcImage.width, srcImage.height, 1, 1 );
    if ( FAILED(hr) )
        return hr;

    const Image *img = normalMap.GetImage( 0, 0, 0 );
    if ( !img )
    {
        normalMap.Release();
        return E_POINTER;
    }

    hr = _ComputeNMap( srcImage, flags, amplitude, format, *img );
    if ( FAILED(hr) )
    {
        normalMap.Release();
        return hr;
    }

    return S_OK;
}

_Use_decl_annotations_
HRESULT ComputeNormalMap( const Image* srcImages, size_t nimages, const TexMetadata& metadata,
                          DWORD flags, float amplitude, DXGI_FORMAT format, ScratchImage& normalMaps )
{
    if ( !srcImages || !nimages || !IsValid(format) )
        return E_INVALIDARG;

    if ( IsCompressed(format) || IsCompressed(metadata.format)
         || IsTypeless(format) || IsTypeless(metadata.format) 
         || IsPlanar(format) || IsPlanar(metadata.format) 
         || IsPalettized(format) || IsPalettized(metadata.format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    static_assert( CNMAP_CHANNEL_RED == 0x1, "CNMAP_CHANNEL_ flag values don't match mask" );
    switch( flags & 0xf )
    {
    case 0:
    case CNMAP_CHANNEL_RED:
    case CNMAP_CHANNEL_GREEN:
    case CNMAP_CHANNEL_BLUE:
    case CNMAP_CHANNEL_ALPHA:
    case CNMAP_CHANNEL_LUMINANCE:
        break;

    default:
        return E_INVALIDARG;
    }

    normalMaps.Release();

    TexMetadata mdata2 = metadata;
    mdata2.format = format;
    HRESULT hr = normalMaps.Initialize( mdata2 );
    if ( FAILED(hr) )
        return hr;

    if ( nimages != normalMaps.GetImageCount() )
    {
        normalMaps.Release();
        return E_FAIL;
    }

    const Image* dest = normalMaps.GetImages();
    if ( !dest )
    {
        normalMaps.Release();
        return E_POINTER;
    }

    for( size_t index=0; index < nimages; ++index )
    {
        assert( dest[ index ].format == format );

        const Image& src = srcImages[ index ];
        if ( IsCompressed( src.format ) || IsTypeless( src.format ) )
        {
            normalMaps.Release();
            return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
        }

        if ( src.width != dest[ index ].width || src.height != dest[ index ].height )
        {
            normalMaps.Release();
            return E_FAIL;
        }

        hr = _ComputeNMap( src, flags, amplitude, format, dest[ index ] );
        if ( FAILED(hr) )
        {
            normalMaps.Release();
            return hr;
        }
    }

    return S_OK;
}

}; // namespace
