const canvas = <HTMLCanvasElement> document.getElementById("glcanvas");
export const gl = canvas.getContext("webgl")!;
const oes_vao_ext = gl.getExtension("OES_vertex_array_object")!;

gl.clearDepth(1);
gl.enable(gl.DEPTH_TEST);

export function createVertexArray() {
    return oes_vao_ext.createVertexArrayOES();
}

export function bindVertexArray(vao: WebGLVertexArrayObjectOES) {
    oes_vao_ext.bindVertexArrayOES(vao);
}