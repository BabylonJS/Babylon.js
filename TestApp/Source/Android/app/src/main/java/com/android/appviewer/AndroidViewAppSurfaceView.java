package com.android.appviewer;

import android.content.Context;
import android.util.Log;
import android.view.MotionEvent;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;

import java.lang.ref.WeakReference;
import java.util.ArrayList;

class AndroidViewAppSurfaceView extends SurfaceView implements SurfaceHolder.Callback2, View.OnTouchListener {
    private static final String TAG = "AndroidViewAppSurfaceView";
    private static final boolean DEBUG = true;
    private Renderer mRenderer;
    public final static int RENDERMODE_CONTINUOUSLY = 1;

    public AndroidViewAppSurfaceView(Context context, Renderer renderer) {
        super(context);
        init(renderer);
    }
    private void init(Renderer renderer) {
        SurfaceHolder holder = getHolder();
        holder.addCallback(this);
        setOnTouchListener(this);
        mRenderer = renderer;
        mGLThread = new GLThread(mThisWeakRef);
        mGLThread.start();
    }

    public void onPause() {
        mGLThread.onPause();
    }

    public void onResume() {
        mGLThread.onResume();
    }

    // render life
    public void onSurfaceCreated() {
        mRenderer.onSurfaceCreated(getHolder());
    }

    public void onSurfaceChanged(int w, int h) {
        mRenderer.onSurfaceChanged(w, h);
    }

    public void onDrawFrame() {
        mRenderer.onDrawFrame();
    }

    public interface Renderer {
        void onSurfaceCreated(SurfaceHolder surfaceHolder);
        void onSurfaceChanged(int width, int height);
        void onDrawFrame();
        boolean onTouchEvent(MotionEvent event);
    }

    @Override
    public boolean onTouch(View v, MotionEvent event)
    {
        return mRenderer.onTouchEvent(event);
    }

    @Override
    protected void finalize() throws Throwable {
        try {
            if (mGLThread != null) {
                // GLThread may still be running if this view was never
                // attached to a window.
                mGLThread.requestExitAndWait();
            }
        } finally {
            super.finalize();
        }
    }

    /**
     * This method is part of the SurfaceHolder.Callback interface, and is
     * not normally called or subclassed by clients of AndroidViewAppSurfaceView.
     */
    public void surfaceCreated(SurfaceHolder holder) {
        mGLThread.surfaceCreated();
    }
    /**
     * This method is part of the SurfaceHolder.Callback interface, and is
     * not normally called or subclassed by clients of AndroidViewAppSurfaceView.
     */
    public void surfaceDestroyed(SurfaceHolder holder) {
        // Surface will be destroyed when we return
        mGLThread.surfaceDestroyed();
    }
    /**
     * This method is part of the SurfaceHolder.Callback interface, and is
     * not normally called or subclassed by clients of AndroidViewAppSurfaceView.
     */
    public void surfaceChanged(SurfaceHolder holder, int format, int w, int h) {
        mGLThread.onWindowResize(w, h);
    }
    /**
     * This method is part of the SurfaceHolder.Callback2 interface, and is
     * not normally called or subclassed by clients of AndroidViewAppSurfaceView.
     */
    public void surfaceRedrawNeededAsync(SurfaceHolder holder, Runnable finishDrawing) {
        if (mGLThread != null) {
            mGLThread.requestRenderAndNotify(finishDrawing);
        }
    }
    /**
     * This method is part of the SurfaceHolder.Callback2 interface, and is
     * not normally called or subclassed by clients of AndroidViewAppSurfaceView.
     */
    @Deprecated
    @Override
    public void surfaceRedrawNeeded(SurfaceHolder holder) {
        // Since we are part of the framework we know only surfaceRedrawNeededAsync
        // will be called.
    }

    static class GLThread extends Thread {
        GLThread(WeakReference<AndroidViewAppSurfaceView> AndroidViewAppSurfaceViewWeakRef) {
            super();
            mWidth = 0;
            mHeight = 0;
            mRequestRender = true;
            mRenderMode = RENDERMODE_CONTINUOUSLY;
            mWantRenderNotification = false;
            mAndroidViewAppSurfaceViewWeakRef = AndroidViewAppSurfaceViewWeakRef;
        }
        @Override
        public void run() {
            setName("GLThread " + getId());
            try {
                guardedRun();
            } catch (InterruptedException e) {
                // fall thru and exit normally
            } finally {
                sGLThreadManager.threadExiting(this);
            }
        }
        /*
         * This private method should only be called inside a
         * synchronized(sGLThreadManager) block.
         */
        private void stopEglSurfaceLocked() {
            if (mHaveEglSurface) {
                mHaveEglSurface = false;
                //mEglHelper.destroySurface(); TODO
            }
        }
        /*
         * This private method should only be called inside a
         * synchronized(sGLThreadManager) block.
         */
        private void stopEglContextLocked() {
            if (mHaveEglContext) {
                //mEglHelper.finish(); TODO
                mHaveEglContext = false;
                sGLThreadManager.releaseEglContextLocked(this);
            }
        }
        private void guardedRun() throws InterruptedException {
            //mEglHelper = new EglHelper(mAndroidViewAppSurfaceViewWeakRef);
            mHaveEglContext = false;
            mHaveEglSurface = false;
            mWantRenderNotification = false;
            try {
                //GL10 gl = null;
                boolean createEglContext = false;
                boolean createEglSurface = false;
                boolean createGlInterface = false;
                boolean lostEglContext = false;
                boolean sizeChanged = false;
                boolean wantRenderNotification = false;
                boolean doRenderNotification = false;
                boolean askedToReleaseEglContext = false;
                int w = 0;
                int h = 0;
                Runnable event = null;
                Runnable finishDrawingRunnable = null;
                while (true) {
                    synchronized (sGLThreadManager) {
                        while (true) {
                            if (mShouldExit) {
                                return;
                            }
                            if (! mEventQueue.isEmpty()) {
                                event = mEventQueue.remove(0);
                                break;
                            }
                            // Update the pause state.
                            boolean pausing = false;
                            if (mPaused != mRequestPaused) {
                                pausing = mRequestPaused;
                                mPaused = mRequestPaused;
                                sGLThreadManager.notifyAll();
                                /*if (LOG_PAUSE_RESUME) {
                                    Log.i("GLThread", "mPaused is now " + mPaused + " tid=" + getId());
                                }
                                */
                            }
                            // Do we need to give up the EGL context?
                            if (mShouldReleaseEglContext) {
                                /*if (LOG_SURFACE) {
                                    Log.i("GLThread", "releasing EGL context because asked to tid=" + getId());
                                }
                                */
                                stopEglSurfaceLocked();
                                stopEglContextLocked();
                                mShouldReleaseEglContext = false;
                                askedToReleaseEglContext = true;
                            }
                            // Have we lost the EGL context?
                            if (lostEglContext) {
                                stopEglSurfaceLocked();
                                stopEglContextLocked();
                                lostEglContext = false;
                            }
                            // When pausing, release the EGL surface:
                            if (pausing && mHaveEglSurface) {
                                /*if (LOG_SURFACE) {
                                    Log.i("GLThread", "releasing EGL surface because paused tid=" + getId());
                                }
                                */
                                stopEglSurfaceLocked();
                            }
                            // When pausing, optionally release the EGL Context:
                            if (pausing && mHaveEglContext) {
                                AndroidViewAppSurfaceView view = mAndroidViewAppSurfaceViewWeakRef.get();

                                //if (!preserveEglContextOnPause) {
                                    stopEglContextLocked();
                                //}
                            }
                            // Have we lost the SurfaceView surface?
                            if ((! mHasSurface) && (! mWaitingForSurface)) {
                                /*if (LOG_SURFACE) {
                                    Log.i("GLThread", "noticed surfaceView surface lost tid=" + getId());
                                }
                                */
                                if (mHaveEglSurface) {
                                    stopEglSurfaceLocked();
                                }
                                mWaitingForSurface = true;
                                mSurfaceIsBad = false;
                                sGLThreadManager.notifyAll();
                            }
                            // Have we acquired the surface view surface?
                            if (mHasSurface && mWaitingForSurface) {
                                /*if (LOG_SURFACE) {
                                    Log.i("GLThread", "noticed surfaceView surface acquired tid=" + getId());
                                }
                                */
                                mWaitingForSurface = false;
                                sGLThreadManager.notifyAll();
                            }
                            if (doRenderNotification) {
                                /*if (LOG_SURFACE) {
                                    Log.i("GLThread", "sending render notification tid=" + getId());
                                }
                                */
                                mWantRenderNotification = false;
                                doRenderNotification = false;
                                mRenderComplete = true;
                                sGLThreadManager.notifyAll();
                            }
                            if (mFinishDrawingRunnable != null) {
                                finishDrawingRunnable = mFinishDrawingRunnable;
                                mFinishDrawingRunnable = null;
                            }
                            // Ready to draw?
                            if (readyToDraw()) {
                                // If we don't have an EGL context, try to acquire one.
                                if (! mHaveEglContext) {
                                    if (askedToReleaseEglContext) {
                                        askedToReleaseEglContext = false;
                                    } else {
                                        try {
                                            //mEglHelper.start(); TODO
                                        } catch (RuntimeException t) {
                                            sGLThreadManager.releaseEglContextLocked(this);
                                            throw t;
                                        }
                                        mHaveEglContext = true;
                                        createEglContext = true;
                                        sGLThreadManager.notifyAll();
                                    }
                                }
                                if (mHaveEglContext && !mHaveEglSurface) {
                                    mHaveEglSurface = true;
                                    createEglSurface = true;
                                    createGlInterface = true;
                                    sizeChanged = true;
                                }
                                if (mHaveEglSurface) {
                                    if (mSizeChanged) {
                                        sizeChanged = true;
                                        w = mWidth;
                                        h = mHeight;
                                        mWantRenderNotification = true;
                                        /*if (LOG_SURFACE) {
                                            Log.i("GLThread",
                                                    "noticing that we want render notification tid="
                                                            + getId());
                                        }
                                        */
                                        // Destroy and recreate the EGL surface.
                                        createEglSurface = true;
                                        mSizeChanged = false;
                                    }
                                    mRequestRender = false;
                                    sGLThreadManager.notifyAll();
                                    if (mWantRenderNotification) {
                                        wantRenderNotification = true;
                                    }
                                    break;
                                }
                            } else {
                                if (finishDrawingRunnable != null) {
                                    Log.w(TAG, "Warning, !readyToDraw() but waiting for " +
                                            "draw finished! Early reporting draw finished.");
                                    finishDrawingRunnable.run();
                                    finishDrawingRunnable = null;
                                }
                            }
                            sGLThreadManager.wait();
                        }
                    } // end of synchronized(sGLThreadManager)
                    if (event != null) {
                        event.run();
                        event = null;
                        continue;
                    }
//                    if (createEglSurface) {
//                        /*if (LOG_SURFACE) {
//                            Log.w("GLThread", "egl createSurface");
//                        }
//                        */
//                        if (mEglHelper.createSurface()) {
//                            synchronized(sGLThreadManager) {
//                                mFinishedCreatingEglSurface = true;
//                                sGLThreadManager.notifyAll();
//                            }
//                        } else {
//                            synchronized(sGLThreadManager) {
//                                mFinishedCreatingEglSurface = true;
//                                mSurfaceIsBad = true;
//                                sGLThreadManager.notifyAll();
//                            }
//                            continue;
//                        }
//                        createEglSurface = false;
//                    }
                    if (createGlInterface) {
                        createGlInterface = false;
                    }
                    if (createEglContext) {
                        AndroidViewAppSurfaceView view = mAndroidViewAppSurfaceViewWeakRef.get();
                        if (view != null) {
                            try {
                                view.onSurfaceCreated();
                            } finally {
                            }
                        }
                        createEglContext = false;
                    }
                    if (sizeChanged) {
                        AndroidViewAppSurfaceView view = mAndroidViewAppSurfaceViewWeakRef.get();
                        if (view != null) {
                            try {
                                view.onSurfaceChanged(w, h);
                            } finally {
                            }
                        }
                        sizeChanged = false;
                    }
                    {
                        AndroidViewAppSurfaceView view = mAndroidViewAppSurfaceViewWeakRef.get();
                        if (view != null) {
                            try {
                                view.onDrawFrame();
                                if (finishDrawingRunnable != null) {
                                    finishDrawingRunnable.run();
                                    finishDrawingRunnable = null;
                                }
                            } finally {
                            }
                        }
                    }
//
//                    int swapError = mEglHelper.swap();
//                    switch (swapError) {
//                        case EGL10.EGL_SUCCESS:
//                            break;
//                        case EGL11.EGL_CONTEXT_LOST:
//                            if (LOG_SURFACE) {
//                                Log.i("GLThread", "egl context lost tid=" + getId());
//                            }
//                            lostEglContext = true;
//                            break;
//                        default:
//                            // Other errors typically mean that the current surface is bad,
//                            // probably because the SurfaceView surface has been destroyed,
//                            // but we haven't been notified yet.
//                            // Log the error to help developers understand why rendering stopped.
//                            //EglHelper.logEglErrorAsWarning("GLThread", "eglSwapBuffers", swapError);
//                            synchronized(sGLThreadManager) {
//                                mSurfaceIsBad = true;
//                                sGLThreadManager.notifyAll();
//                            }
//                            break;
//                    }
                    if (wantRenderNotification) {
                        doRenderNotification = true;
                        wantRenderNotification = false;
                    }
                }
            } finally {
                /*
                 * clean-up everything...
                 */
                synchronized (sGLThreadManager) {
                    stopEglSurfaceLocked();
                    stopEglContextLocked();
                }
            }
        }

        public boolean ableToDraw() {
            return mHaveEglContext && mHaveEglSurface && readyToDraw();
        }
        private boolean readyToDraw() {
            return (!mPaused) && mHasSurface && (!mSurfaceIsBad)
                    && (mWidth > 0) && (mHeight > 0)
                    && (mRequestRender || (mRenderMode == RENDERMODE_CONTINUOUSLY));
        }
        public void setRenderMode(int renderMode) {
            /*if ( !((RENDERMODE_WHEN_DIRTY <= renderMode) && (renderMode <= RENDERMODE_CONTINUOUSLY)) ) {
                throw new IllegalArgumentException("renderMode");
            }
            */
            synchronized(sGLThreadManager) {
                mRenderMode = renderMode;
                sGLThreadManager.notifyAll();
            }
        }
        public int getRenderMode() {
            synchronized(sGLThreadManager) {
                return mRenderMode;
            }
        }
        public void requestRender() {
            synchronized(sGLThreadManager) {
                mRequestRender = true;
                sGLThreadManager.notifyAll();
            }
        }
        public void requestRenderAndNotify(Runnable finishDrawing) {
            synchronized(sGLThreadManager) {
                // If we are already on the GL thread, this means a client callback
                // has caused reentrancy, for example via updating the SurfaceView parameters.
                // We will return to the client rendering code, so here we don't need to
                // do anything.
                if (Thread.currentThread() == this) {
                    return;
                }
                mWantRenderNotification = true;
                mRequestRender = true;
                mRenderComplete = false;
                mFinishDrawingRunnable = finishDrawing;
                sGLThreadManager.notifyAll();
            }
        }
        public void surfaceCreated() {
            synchronized(sGLThreadManager) {
                mHasSurface = true;
                mFinishedCreatingEglSurface = false;
                sGLThreadManager.notifyAll();
                while (mWaitingForSurface
                        && !mFinishedCreatingEglSurface
                        && !mExited) {
                    try {
                        sGLThreadManager.wait();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }
        public void surfaceDestroyed() {
            synchronized(sGLThreadManager) {
                mHasSurface = false;
                sGLThreadManager.notifyAll();
                while((!mWaitingForSurface) && (!mExited)) {
                    try {
                        sGLThreadManager.wait();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }
        public void onPause() {
            synchronized (sGLThreadManager) {
                mRequestPaused = true;
                sGLThreadManager.notifyAll();
                while ((! mExited) && (! mPaused)) {
                    try {
                        sGLThreadManager.wait();
                    } catch (InterruptedException ex) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }
        public void onResume() {
            synchronized (sGLThreadManager) {
                mRequestPaused = false;
                mRequestRender = true;
                mRenderComplete = false;
                sGLThreadManager.notifyAll();
                while ((! mExited) && mPaused && (!mRenderComplete)) {
                    try {
                        sGLThreadManager.wait();
                    } catch (InterruptedException ex) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }
        public void onWindowResize(int w, int h) {
            synchronized (sGLThreadManager) {
                mWidth = w;
                mHeight = h;
                mSizeChanged = true;
                mRequestRender = true;
                mRenderComplete = false;
                // If we are already on the GL thread, this means a client callback
                // has caused reentrancy, for example via updating the SurfaceView parameters.
                // We need to process the size change eventually though and update our EGLSurface.
                // So we set the parameters and return so they can be processed on our
                // next iteration.
                if (Thread.currentThread() == this) {
                    return;
                }
                sGLThreadManager.notifyAll();
                // Wait for thread to react to resize and render a frame
                while (! mExited && !mPaused && !mRenderComplete
                        && ableToDraw()) {
                    try {
                        sGLThreadManager.wait();
                    } catch (InterruptedException ex) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }
        public void requestExitAndWait() {
            // don't call this from GLThread thread or it is a guaranteed
            // deadlock!
            synchronized(sGLThreadManager) {
                mShouldExit = true;
                sGLThreadManager.notifyAll();
                while (! mExited) {
                    try {
                        sGLThreadManager.wait();
                    } catch (InterruptedException ex) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }
        public void requestReleaseEglContextLocked() {
            mShouldReleaseEglContext = true;
            sGLThreadManager.notifyAll();
        }
        /**
         * Queue an "event" to be run on the GL rendering thread.
         * @param r the runnable to be run on the GL rendering thread.
         */
        public void queueEvent(Runnable r) {
            if (r == null) {
                throw new IllegalArgumentException("r must not be null");
            }
            synchronized(sGLThreadManager) {
                mEventQueue.add(r);
                sGLThreadManager.notifyAll();
            }
        }
        // Once the thread is started, all accesses to the following member
        // variables are protected by the sGLThreadManager monitor
        private boolean mShouldExit;
        private boolean mExited;
        private boolean mRequestPaused;
        private boolean mPaused;
        private boolean mHasSurface;
        private boolean mSurfaceIsBad;
        private boolean mWaitingForSurface;
        private boolean mHaveEglContext;
        private boolean mHaveEglSurface;
        private boolean mFinishedCreatingEglSurface;
        private boolean mShouldReleaseEglContext;
        private int mWidth;
        private int mHeight;
        private int mRenderMode;
        private boolean mRequestRender;
        private boolean mWantRenderNotification;
        private boolean mRenderComplete;
        private ArrayList<Runnable> mEventQueue = new ArrayList<Runnable>();
        private boolean mSizeChanged = true;
        private Runnable mFinishDrawingRunnable = null;
        /**
         * Set once at thread construction time, nulled out when the parent view is garbage
         * called. This weak reference allows the AndroidViewAppSurfaceView to be garbage collected while
         * the GLThread is still alive.
         */
        private WeakReference<AndroidViewAppSurfaceView> mAndroidViewAppSurfaceViewWeakRef;
    }

    private static class GLThreadManager {
        private static String TAG = "GLThreadManager";
        public synchronized void threadExiting(GLThread thread) {
            thread.mExited = true;
            notifyAll();
        }
        /*
         * Releases the EGL context. Requires that we are already in the
         * sGLThreadManager monitor when this is called.
         */
        public void releaseEglContextLocked(GLThread thread) {
            notifyAll();
        }
    }
    private final WeakReference<AndroidViewAppSurfaceView> mThisWeakRef =
            new WeakReference<AndroidViewAppSurfaceView>(this);
    private static final GLThreadManager sGLThreadManager = new GLThreadManager();
    private GLThread mGLThread;
}
