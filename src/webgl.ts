const canvas = <HTMLCanvasElement> document.getElementById("glcanvas");
export const gl = canvas.getContext("webgl2")!;

gl.clearDepth(1);
gl.clearColor(0, 0, 0, 1);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);