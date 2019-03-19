// Worker plugin
/*
addEventListener('message', event => {
    console.log(event);
});
*/

// Worker loader
const ctx: Worker = self as any;
ctx.postMessage(['ping_from_worker']);
ctx.addEventListener("message", (event) => console.log(event));

// https://github.com/webpack-contrib/worker-loader/issues/94#issuecomment-449861198
export default {} as typeof Worker & {new (): Worker};
