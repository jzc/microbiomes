const canvas = <HTMLCanvasElement> document.getElementById("glcanvas");
export const gl = canvas.getContext("webgl2")!;

gl.clearDepth(1);
gl.clearColor(135/255, 206/255, 250/255, 1);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);