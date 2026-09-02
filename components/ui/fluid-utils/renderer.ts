/* ─── WebGL Fluid Simulation ─── */

interface RendererOptions { canvas: HTMLCanvasElement; dark?: boolean }
interface Renderer { ready: Promise<void>; dispose: () => void }

const baseVertexShader = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;
  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const splatShader = `
  precision highp float;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  varying vec2 vUv;
  void main () {
    vec2 p = vUv - point;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const advectionShader = `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;
  varying vec2 vUv;
  void main () {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    gl_FragColor = dissipation * texture2D(uSource, coord);
  }
`;

const divergenceShader = `
  precision highp float;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const pressureShader = `
  precision highp float;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float C = texture2D(uPressure, vUv).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractShader = `
  precision highp float;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const clearShader = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float value;
  varying vec2 vUv;
  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const displayShader = `
  precision highp float;
  uniform sampler2D uTexture;
  varying vec2 vUv;
  void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;
    float a = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c, a);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
  return s;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
  return p;
}

function createFBO(
  gl: WebGLRenderingContext,
  w: number, h: number,
  internalFormat: number, format: number, type: number, filter: number,
) {
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return {
    texture, fbo, width: w, height: h,
    texelSizeX: 1.0 / w, texelSizeY: 1.0 / h,
    attach(id: number) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; },
  };
}

function createDoubleFBO(gl: WebGLRenderingContext, w: number, h: number, iF: number, f: number, t: number, filter: number) {
  let a = createFBO(gl, w, h, iF, f, t, filter);
  let b = createFBO(gl, w, h, iF, f, t, filter);
  return {
    width: w, height: h, texelSizeX: a.texelSizeX, texelSizeY: a.texelSizeY,
    get read() { return a; }, get write() { return b; },
    swap() { [a, b] = [b, a]; },
  };
}

export function createRenderer({ canvas, dark = true }: RendererOptions): Renderer {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: false })!;
  if (!gl) return { ready: Promise.resolve(), dispose: () => {} };

  const halfFloat = gl.getExtension("OES_texture_half_float");
  const linearFiltering = gl.getExtension("OES_texture_half_float_linear");
  const texType = halfFloat ? halfFloat.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
  const filtering = linearFiltering ? gl.LINEAR : gl.NEAREST;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  const SIM_RESOLUTION = 128;
  const DYE_RESOLUTION = 1024;
  const VELOCITY_DISSIPATION = 0.98;
  const DENSITY_DISSIPATION = 0.97;
  const PRESSURE_DISSIPATION = 0.8;
  const PRESSURE_ITERATIONS = 20;
  const SPLAT_RADIUS = 0.25;

  const splatProgram = createProgram(gl, baseVertexShader, splatShader);
  const advectionProgram = createProgram(gl, baseVertexShader, advectionShader);
  const divergenceProgram = createProgram(gl, baseVertexShader, divergenceShader);
  const pressureProgram = createProgram(gl, baseVertexShader, pressureShader);
  const gradientSubtractProgram = createProgram(gl, baseVertexShader, gradientSubtractShader);
  const clearProgram = createProgram(gl, baseVertexShader, clearShader);
  const displayProgram = createProgram(gl, baseVertexShader, displayShader);

  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

  function blit(target: { fbo: WebGLFramebuffer; width: number; height: number } | null) {
    if (target == null) { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    else { gl.viewport(0, 0, target.width, target.height); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
  }
  resize();

  const dye = createDoubleFBO(gl, DYE_RESOLUTION, DYE_RESOLUTION, gl.RGBA, gl.RGBA, texType, filtering);
  const velocity = createDoubleFBO(gl, SIM_RESOLUTION, SIM_RESOLUTION, gl.RGBA, gl.RGBA, texType, filtering);
  const divergenceFBO = createFBO(gl, SIM_RESOLUTION, SIM_RESOLUTION, gl.RGBA, gl.RGBA, texType, gl.NEAREST);
  const pressure = createDoubleFBO(gl, SIM_RESOLUTION, SIM_RESOLUTION, gl.RGBA, gl.RGBA, texType, gl.NEAREST);

  function getUniforms(program: WebGLProgram) {
    const u: Record<string, WebGLUniformLocation | null> = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) { const info = gl.getActiveUniform(program, i); if (info) u[info.name] = gl.getUniformLocation(program, info.name); }
    return u;
  }

  const splatU = getUniforms(splatProgram);
  const advectU = getUniforms(advectionProgram);
  const divU = getUniforms(divergenceProgram);
  const presU = getUniforms(pressureProgram);
  const gradU = getUniforms(gradientSubtractProgram);
  const clearU = getUniforms(clearProgram);

  function splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]) {
    gl.useProgram(splatProgram);
    gl.uniform1i(splatU.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatU.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatU.point, x, y);
    gl.uniform3f(splatU.color, dx, dy, 0.0);
    gl.uniform1f(splatU.radius, correctRadius(SPLAT_RADIUS / 100.0));
    blit(velocity.write);
    velocity.swap();

    gl.uniform1i(splatU.uTarget, dye.read.attach(0));
    gl.uniform3f(splatU.color, color[0], color[1], color[2]);
    blit(dye.write);
    dye.swap();
  }

  function correctRadius(r: number) {
    const ar = canvas.width / canvas.height;
    if (ar > 1) r *= ar;
    return r;
  }

  function step(dt: number) {
    gl.disable(gl.BLEND);

    gl.useProgram(advectionProgram);
    gl.uniform2f(advectU.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(advectU.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectU.uSource, velocity.read.attach(0));
    gl.uniform1f(advectU.dt, dt);
    gl.uniform1f(advectU.dissipation, VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    gl.uniform2f(advectU.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(advectU.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectU.uSource, dye.read.attach(1));
    gl.uniform1f(advectU.dissipation, DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();

    gl.useProgram(divergenceProgram);
    gl.uniform2f(divU.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(divU.uVelocity, velocity.read.attach(0));
    blit(divergenceFBO);

    gl.useProgram(clearProgram);
    gl.uniform1i(clearU.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearU.value, PRESSURE_DISSIPATION);
    blit(pressure.write);
    pressure.swap();

    gl.useProgram(pressureProgram);
    gl.uniform2f(presU.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(presU.uDivergence, divergenceFBO.attach(0));
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(presU.uPressure, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    gl.useProgram(gradientSubtractProgram);
    gl.uniform2f(gradU.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gradU.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradU.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();
  }

  function render() {
    const loc = gl.getUniformLocation(displayProgram, "uTexture");
    gl.useProgram(displayProgram);
    gl.uniform1i(loc, dye.read.attach(0));
    blit(null);
  }

  // Colors — adjusted for light/dark
  const darkPalette: [number, number, number][] = [
    [0.15, 0.9, 0.45], [0.1, 0.7, 0.35], [0.2, 1.0, 0.5],
    [0.12, 0.8, 0.4], [0.18, 0.85, 0.48], [0.08, 0.6, 0.3],
    [0.22, 0.95, 0.52], [0.14, 0.75, 0.38],
  ];
  const lightPalette: [number, number, number][] = [
    [0.06, 0.45, 0.22], [0.05, 0.38, 0.18], [0.08, 0.5, 0.25],
    [0.04, 0.42, 0.2], [0.07, 0.48, 0.24], [0.03, 0.35, 0.16],
    [0.09, 0.52, 0.26], [0.055, 0.4, 0.19],
  ];
  const palette = dark ? darkPalette : lightPalette;
  let colorIdx = 0;
  function nextColor(): [number, number, number] {
    const c = palette[colorIdx++ % palette.length];
    const b = 0.12 + Math.random() * 0.08;
    return [c[0] * b, c[1] * b, c[2] * b];
  }

  let animId = 0;
  let lastTime = performance.now();
  let mouseX = 0, mouseY = 0, prevMX = 0, prevMY = 0, mouseIn = false;
  let frameCount = 0;

  function autoSplat() {
    const t = performance.now() * 0.001;
    // Multiple splats per frame for always-active feel
    const x = 0.5 + 0.4 * Math.sin(t * 0.18);
    const y = 0.5 + 0.4 * Math.cos(t * 0.13);
    const dx = Math.cos(t * 0.25) * 180;
    const dy = Math.sin(t * 0.2) * 180;
    splat(x, y, dx, dy, nextColor());

    // Second orbiting splat
    const x2 = 0.5 + 0.35 * Math.cos(t * 0.22 + 2);
    const y2 = 0.5 + 0.35 * Math.sin(t * 0.17 + 1);
    const dx2 = Math.sin(t * 0.3) * 150;
    const dy2 = Math.cos(t * 0.28) * 150;
    splat(x2, y2, dx2, dy2, nextColor());

    // Random splash every few frames
    if (frameCount % 8 === 0) {
      const rx = Math.random();
      const ry = Math.random();
      const rdx = (Math.random() - 0.5) * 300;
      const rdy = (Math.random() - 0.5) * 300;
      splat(rx, ry, rdx, rdy, nextColor());
    }
  }

  // Initial splats to fill the screen
  for (let i = 0; i < 15; i++) {
    splat(Math.random(), Math.random(), (Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400, nextColor());
  }

  function loop() {
    const now = performance.now();
    let dt = Math.min((now - lastTime) / 1000, 0.016666);
    lastTime = now;
    frameCount++;

    if (mouseIn) {
      const dx = (mouseX - prevMX) * canvas.width * 4;
      const dy = -(mouseY - prevMY) * canvas.height * 4;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) splat(mouseX, mouseY, dx, dy, nextColor());
      prevMX = mouseX;
      prevMY = mouseY;
    }

    autoSplat();
    step(dt);
    render();
    animId = requestAnimationFrame(loop);
  }

  const onMove = (e: MouseEvent) => {
    const r = canvas.getBoundingClientRect();
    mouseX = (e.clientX - r.left) / r.width;
    mouseY = 1.0 - (e.clientY - r.top) / r.height;
    mouseIn = true;
  };
  const onLeave = () => { mouseIn = false; };
  const onTouch = (e: TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0], r = canvas.getBoundingClientRect();
    mouseX = (t.clientX - r.left) / r.width;
    mouseY = 1.0 - (t.clientY - r.top) / r.height;
    mouseIn = true;
  };
  const onTouchEnd = () => { mouseIn = false; };

  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", onLeave);
  canvas.addEventListener("touchmove", onTouch, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd);
  window.addEventListener("resize", resize);

  resize();
  loop();

  return {
    ready: Promise.resolve(),
    dispose() {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", resize);
    },
  };
}
