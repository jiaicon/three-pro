import ResizeObserver from 'resize-observer-polyfill';
import {
  AmbientLight,
  AxesHelper,
  Group,
  MOUSE,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer';
import Event from './Event';
import { ILayer, IScene, ISceneInstence } from './interface';
import { setDefaultValue } from './utils';

class SceneLyer extends Event implements IScene {
  public name: string;
  public container: HTMLElement;
  // Three.js用到的
  public renderer?: WebGLRenderer;
  public scene?: Scene;
  public camera?: PerspectiveCamera;
  public light?: AmbientLight;
  public orbitControls?: OrbitControls;
  public css3Render?: CSS3DRenderer;
  public showAxes?: boolean;
  timer?: number;
  public raycaster?: Raycaster;
  mouse: Vector2;
  mousePosition: Vector2;

  group: Group;
  private requestId?: number;
  private isRotate?: boolean;
  isRaycaster?: boolean;

  constructor(options: ISceneInstence) {
    super();

    this.name = 'iLayer';

    if (!(options ?? false)) {
      console.error('缺少Scene的配置参数');
    }
    const { id, showAxes } = options;
    // 是否显示坐标系
    this.showAxes = setDefaultValue(showAxes, false);
    this.isRotate = setDefaultValue(options.isRotate, false);

    // three的容器
    this.container = document.getElementById(id) as HTMLElement;
    // 物体容器
    this.group = new Group();
    this.mouse = new Vector2(); // 不能设置成[0, 0]，初始化时会操作到
    this.mousePosition = new Vector2(-10000, -10000); // 不能设置成[0, 0]，初始化时会操作到
    this.isRaycaster = setDefaultValue(options.isRaycaster, false);

    this.init();
  }
  init() {
    // 创建渲染器
    this.initRenderer();
    // 创建场景
    this.initScene();
    // 创建相机
    this.initCamera();
    // 初始化光照
    this.initLight();
    // 初始化控制器
    this.initControll();
    // 初始化css的组件
    this.initCSS3Render();
    // 初始化射线
    if (this.isRaycaster) {
      this.initRaycaster();
    }
    // 监听dom变化
    this.resize();

    this.animate();
  }
  initRenderer() {
    this.container.setAttribute(
      'style',
      `
        border: none;
        cursor: pointer;
        width: 100%;
        height: 100%;
        background-color: #000000;
        position: relative;
        overflow: hidden;
      `,
    );
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );
    this.renderer.domElement.setAttribute(
      'style',
      `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%)
    `,
    );
    this.container.appendChild(this.renderer.domElement);
    this.renderer?.setClearColor(0x000000, 1.0);
  }
  initScene() {
    this.scene = new Scene();
    this.scene.add(this.group);
    if (this.showAxes) {
      const axesHelper = new AxesHelper(20);
      this.scene?.add(axesHelper);
    }

    // @ts-ignore
    this.fire('scene.loaded');
  }
  initCamera() {
    this.camera = new PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      1,
      10000,
    );
    this.camera.position.set(0, 0, 22);
    this.camera.lookAt(new Vector3(0, 0, 0));
  }
  initLight() {
    this.light = new AmbientLight(0xffffff);
    this.light.position.set(100, 100, 200);
    this.scene?.add(this.light);
  }
  initControll() {
    this.orbitControls = new OrbitControls(
      this.camera as PerspectiveCamera,
      this.renderer?.domElement,
    );
    this.orbitControls.mouseButtons = {
      LEFT: MOUSE.PAN,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.ROTATE,
    };
    this.orbitControls.enableDamping = true;
    this.orbitControls.zoomSpeed = 1;
    this.renderer?.clear();
  }

  initRaycaster() {
    this.raycaster = new Raycaster();
    const onMouseMove = (event: MouseEvent) => {
      // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
      this.mouse.x = (event.offsetX / this.container.offsetWidth) * 2 - 1;
      this.mouse.y = -(event.offsetY / this.container.offsetHeight) * 2 + 1;
      this.mousePosition.x = event.offsetX;
      this.mousePosition.y = event.offsetY;
    };
    this.container.addEventListener('mousedown', onMouseMove, false);
  }

  initCSS3Render() {
    this.css3Render = new CSS3DRenderer();

    this.css3Render.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );

    const cssDom = this.css3Render.domElement;
    cssDom.classList.add('css3Renderer');
    cssDom.setAttribute('style', `
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      overflow: hidden;
    `)

    this.container.appendChild(cssDom);
  }

  removeCSS3DDom() {
    if (this.css3Render?.domElement?.children?.length) {
      this.css3Render.domElement.children[0].innerHTML = '';
    }
  }

  add(layer: ILayer) {
    // 添加其他layer
    if (layer.mesh) {
      this.group.add(layer.mesh);
    }
  }

  update(layer: ILayer) {
    // 添加其他layer
    if (layer.mesh) {
      const _layer = this.group.getObjectByName(layer.mesh.name);
      if (_layer) {
        this.group.remove(_layer);
      }
      this.group.add(layer.mesh);
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
      this.css3Render?.render(this.scene, this.camera);
    }
  }
  animate() {
    this.orbitControls?.update();
    if (this.isRotate && this.scene) {
      this.scene.rotation.y -= 0.0005;
    }
    this.render();
    if (this.camera && this.raycaster) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
    }
    this.requestId = requestAnimationFrame(this.animate.bind(this));
  }

  setOption(options: Partial<ISceneInstence>) {
    if ((options.isRotate ?? '') !== '') {
      this.isRotate = setDefaultValue(options.isRotate, false);
    }
  }

  resize() {
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        clearTimeout(this.timer);
        this.timer = window.setTimeout(() => {
          const { clientWidth, clientHeight } = entry.target;

          (this.camera as PerspectiveCamera).aspect =
            clientWidth / clientHeight;
          this.camera?.updateProjectionMatrix();

          this.renderer?.setSize(clientWidth, clientHeight);
          this.css3Render?.setSize(clientWidth, clientHeight);
        }, 16);
      });
    });

    resizeObserver.observe(this.container);
  }

  destroy() {
    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
    }
    this.scene?.clear();
    this.renderer?.clear();
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.scene?.removeFromParent();
    this.scene?.remove(...this.scene.children);
    this.container.innerHTML = '';
  }
}

export default SceneLyer;
