import { mat4, vec3 } from "gl-matrix"
import { gl } from "./webgl"
import { Mesh, NormalMesh } from "./mesh"
import { UnlitCube, DebugQuad } from "./primitives"
import { colorShader, hasNormals, shadowShader } from "./shader";

function sin(x: number) {
    return Math.sin(x*Math.PI/180);
}

function cos(x: number) {
    return Math.cos(x*Math.PI/180);
}

function anglesToPosition(yaw: number, pitch: number, r: number) {
    return vec3.fromValues(r*sin(yaw)*cos(pitch),
                           r*sin(pitch),
                           r*cos(yaw)*cos(pitch))
}
     
export const sceneParams = "sceneParams";
export const renderParams = "renderParams";

export class Scene {
    canvas: HTMLCanvasElement;
    meshes: Array<Mesh> = [];

    firstPerson = false;
    cameraPitch: number = 45;
    cameraYaw: number = 45;
    cameraRadius: number = 50;
    _cameraPos = vec3.fromValues(0,0,0);
    get cameraPos(): vec3 {
        if (this.firstPerson) {
            return this._cameraPos;
        } else {
            return anglesToPosition(this.cameraYaw, this.cameraPitch, this.cameraRadius);
        }
    }
    get cameraLook(): vec3 {
        if (this.firstPerson) {
            let dir = anglesToPosition(this.cameraYaw, this.cameraPitch, this.cameraRadius);
            return vec3.add(vec3.create(), this.cameraPos, dir);
        } else {
            return vec3.fromValues(0,0,0);
        }
    }

    lightColor: vec3 = vec3.fromValues(1, 1, 1);
    lightRadius = 50;
    lightMesh: Mesh|null = null;
    get lightTransform() {
        let pos = vec3.scale(vec3.create(), this.lightDir, -this.lightRadius);
        let transform = mat4.translate(mat4.create(), mat4.create(), pos);
        return transform;
    }
    get lightDir()  {
        let yaw = <number> this.params.get("lightYaw");
        let pitch = <number> this.params.get("lightPitch");
        return vec3.scale(vec3.create(), anglesToPosition(yaw, pitch, 1), -1);
    }
    lightProjection = mat4.ortho(mat4.create(), -40, 40, -40, 40, 1, 2*this.lightRadius);
    get lightView() {
        let pos = vec3.scale(vec3.create(), this.lightDir, -this.lightRadius);
        return mat4.lookAt(mat4.create(), pos,
         vec3.add(vec3.create(), pos, this.lightDir), [0, 1, 0]);
    }
    get lightSpaceMatrix() {
        return mat4.multiply(mat4.create(), this.lightProjection, this.lightView);
    }
    
    prevX: number | undefined = undefined;
    prevY: number | undefined = undefined;
    ismousedown: boolean = false;

    get projection() {
        return mat4.perspective(mat4.create(), 45, gl.canvas.clientWidth / gl.canvas.clientHeight, .1, 500);
    } 
    view: mat4 = mat4.create();

    params: HTMLInputMap = new HTMLInputMap();

    shadowMapFbo: WebGLFramebuffer;
    shadowMapTexture: WebGLTexture;
    shadowWidth = 2048;
    shadowHeight = 2048;

    movingForward = false;
    movingBackward = false;
    strafingLeft = false;
    strafingRight = false;
    ascending = false;
    descending = false;


    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.shadowMapFbo = gl.createFramebuffer()!;
        this.shadowMapTexture = gl.createTexture()!;

        gl.bindTexture(gl.TEXTURE_2D, this.shadowMapTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24,
            this.shadowWidth, this.shadowHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapFbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadowMapTexture, 0);
        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); 

        this.addEventListeners()
    }

    setup() {
        let sceneParamDiv = document.getElementById(sceneParams)!;
        while (sceneParamDiv.childNodes.length > 1) {
            sceneParamDiv.removeChild(sceneParamDiv.lastChild!);
        }

        let scene = this;
        let generateButton = document.createElement("button");
        generateButton.innerHTML = "Generate";
        generateButton.addEventListener("click", function () {
            scene.generate();
        })
        sceneParamDiv.appendChild(generateButton);

        let renderParamsDiv = document.getElementById(renderParams)!;
        while (renderParamsDiv.childNodes.length > 1) {
            renderParamsDiv.removeChild(renderParamsDiv.lastChild!);
        }

        this.params = new HTMLInputMap();
        this.params.addRange("lightYaw", renderParams, 0, 360, 0, 1);
        this.params.addRange("lightPitch", renderParams, 0, 180, 45, 1);
        this.params.addCheckbox("drawNormals", renderParams, false);
        this.params.addCheckbox("drawShadowMapTexutre", renderParams, false);
        
    }

    generate() {
        this.meshes = [];
        this.preGenerate();
        this.postGenerate();
    }

    preGenerate() {
        this.lightMesh = new UnlitCube([1, 1, 1]);
        this.meshes.push(this.lightMesh);
    }

    postGenerate() {
        let newMeshes = [];
        for (let mesh of this.meshes) {
            if (hasNormals(mesh.shader)) {
                let color = vec3.fromValues(1, 0, 0);
                newMeshes.push(new NormalMesh(mesh, color, .1));
            }
        }
        this.meshes.push(...newMeshes);
    }


    
    addEventListeners() {
        let scene = this;
        let can = <any>scene.canvas;
        can.requestPointerLock = can.requestPointerLock || can.mozRequestPointerLock;
        this.canvas.onmousedown = function(e: MouseEvent) {
            scene.ismousedown = true;
            scene.prevX = e.clientX;
            scene.prevY = e.clientY;
        };
        this.canvas.onmouseup = function() {
            scene.ismousedown = false;
        };
        this.canvas.onmousemove = function(e: MouseEvent) {
            if (scene.prevX == undefined) scene.prevX = e.clientX;
            if (scene.prevY == undefined) scene.prevY = e.clientY;
            if (!scene.ismousedown) return;
            scene.cameraYaw -= (e.clientX - scene.prevX);
            scene.cameraPitch += (e.clientY - scene.prevY);
            if (scene.cameraPitch >= 90) scene.cameraPitch = 89.9;
            if (scene.cameraPitch <= -90) scene.cameraPitch = -89.9;
            scene.prevX = e.clientX;
            scene.prevY = e.clientY;
        };
        this.canvas.onwheel = function(e: WheelEvent) {
            scene.cameraRadius += e.deltaY > 0 ? 1 : -1;
            if (scene.cameraRadius < 1) scene.cameraRadius = 1;
        };
        document.addEventListener("keyup", function(e) {
            console.log(e.key);
            if (e.key == "f") {
                scene.firstPerson = true;
                if (scene.firstPerson) {
                    can.requestPointerLock();
                }
            }
            if (scene.firstPerson) {
                if (e.key == "w") {
                    scene.movingForward = false;
                }
                else if (e.key == "a") {
                    scene.strafingLeft = false;
                }
                else if (e.key == "s") {
                    scene.movingBackward = false;
                }
                else if (e.key == "d") {
                    scene.strafingRight = false;
                }
                else if (e.key == "q") {
                    scene.ascending = false;
                }
                else if (e.key == "e") {
                    scene.descending = false;
                }
            }
        })

        document.addEventListener("keydown", function(e) {
            if (scene.firstPerson) {
                if (e.key == "w") {
                    scene.movingForward = true;
                }
                else if (e.key == "a") {
                    scene.strafingLeft = true;
                }
                else if (e.key == "s") {
                    scene.movingBackward = true;
                }
                else if (e.key == "d") {
                    scene.strafingRight = true;
                } 
                else if (e.key == "q") {
                    scene.ascending = true;
                }
                else if (e.key == "e") {
                    scene.descending = true;
                }
            }
        })
        let doc = <any>document;
        doc.addEventListener("pointerlockchange", lockChangeAlert, false);
        doc.addEventListener("mozpointerlockchange", lockChangeAlert, false);

        function lockChangeAlert() {
            if (doc.pointerLockElement === can ||
                doc.mozPointerLockElement === can) {
              console.log('The pointer lock status is now locked');
              doc.addEventListener("mousemove", updateLook, false);
            } else {
              console.log('The pointer lock status is now unlocked');
              doc.removeEventListener("mousemove", updateLook, false);
              scene.firstPerson = false;
            }
        }

        function updateLook(e: MouseEvent) {
            scene.cameraPitch -= e.movementY;
            scene.cameraYaw -= e.movementX;
            if (scene.cameraPitch >= 90) scene.cameraPitch = 89.9;
            if (scene.cameraPitch <= -90) scene.cameraPitch = -89.9;
        }
    }

    update(dt: number) {
        mat4.lookAt(this.view, this.cameraPos, this.cameraLook, [0, 1, 0]);
        this.lightMesh!.transform = this.lightTransform;
        if (this.firstPerson) {
            console.log(this.movingForward);
            let v = vec3.fromValues(0, 0, 0,);
            if (this.movingForward) {
                vec3.add(v, v, [sin(this.cameraYaw), 0, cos(this.cameraYaw)]);
            }
            if (this.movingBackward) {
                vec3.add(v, v, [sin(this.cameraYaw+180), 0, cos(this.cameraYaw+180)]);
            }
            if (this.strafingRight) {
                vec3.add(v, v, [sin(this.cameraYaw-90), 0, cos(this.cameraYaw-90)]);
            }
            if (this.strafingLeft) {
                vec3.add(v, v, [sin(this.cameraYaw+90), 0, cos(this.cameraYaw+90)]);
            }
            if (this.ascending) {
                vec3.add(v, v, [0, 1, 0]);
            }
            if (this.descending) {
                vec3.add(v, v, [0, -1, 0]);
            }
            vec3.normalize(v, v);
            vec3.scale(v, v, 0.3);
            vec3.add(this._cameraPos, this._cameraPos, v)
        }

    }

    draw() {
        gl.viewport(0, 0, this.shadowWidth, this.shadowHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapFbo);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        // gl.cullFace(gl.FRONT);
        shadowShader.use()
        shadowShader.setMatrix4("uLightSpaceMatrix", this.lightSpaceMatrix);
        for (let mesh of this.meshes) {
            if (mesh instanceof DebugQuad ||
                mesh instanceof NormalMesh) continue
            shadowShader.setMatrix4("uModel", mesh.transform);
            mesh.draw()
        }
        // gl.cullFace(gl.BACK);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.shadowMapTexture);

        gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (let mesh of this.meshes) {
            if (!(<boolean> this.params.get("drawNormals")) &&
                mesh instanceof NormalMesh) continue;

            if (!(<boolean> this.params.get("drawShadowMapTexutre")) &&
                mesh instanceof DebugQuad) continue;
            
            mesh.shader.use();
            if (mesh.shader == colorShader) {
                mesh.shader.setVec3("uViewPos", this.cameraPos);
                mesh.shader.setVec3("uLightDir", this.lightDir);
                mesh.shader.setVec3("uLightColor", this.lightColor);
                mesh.shader.setMatrix4("uNormal", mesh.normal);
            }
            mesh.shader.setMatrix4("uLightSpaceMatrix", this.lightSpaceMatrix);
            mesh.shader.setMatrix4("uModel", mesh.transform);
            mesh.shader.setMatrix4("uView", this.view);
            mesh.shader.setMatrix4("uProjection", this.projection);
            mesh.draw();
        }
    }
}

class HTMLInputMap {
    map: Map<string, ()=>number|boolean>;

    constructor() {
        this.map = new Map();
    }

    addRange(key: string, divId: string, min: number, max: number, init: number, step: number) {
        let range = document.createElement("input");
        range.type = "range";
        range.name = key;
        range.min = String(min);
        range.max = String(max);
        range.defaultValue = String(init);
        range.step = String(step);
        let label = document.createElement("label");
        let listener = function() {
            label.innerHTML = key + ": " + range.value;
        }
        listener()
        range.addEventListener("input", listener);
        let innerDiv = document.createElement("div");
        innerDiv.className = "row";
        let div = document.getElementById(divId)!;
        innerDiv.appendChild(label);
        innerDiv.appendChild(range);
        div.appendChild(innerDiv);

        this.map.set(key, () => Number(range.value))
    }

    addCheckbox(key: string, divId: string, init: boolean) {
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = key;
        checkbox.checked = init;
        let label = document.createElement("label");
        label.innerHTML = key + ": ";
        let innerDiv = document.createElement("div");
        innerDiv.className = "row";
        innerDiv.appendChild(label);
        innerDiv.appendChild(checkbox);
        let div = document.getElementById(divId)!;
        div.appendChild(innerDiv);
        this.map.set(key, () => checkbox.checked);
    }

    get(key: string) {
        return this.map.get(key)!();
    }
}