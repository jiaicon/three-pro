import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneBufferGeometry,
  Vector3,
} from 'three';
import BaseLayer from './BaseLayer';
import wavePng from './imgs/wave.png';
import { IWavePoint, IWavePointFeature, IWavePointInstance } from './interface';
import LayerType from './LayerType';
import { cartographicToXYZ, projection, setDefaultValue } from './utils';

// 带有自定义属性的Mesh
interface IMesh extends Mesh<PlaneBufferGeometry, MeshBasicMaterial> {
  _s: number;
  size: number;
}
class WavePoint extends BaseLayer implements IWavePoint {
  color: string;
  feature: IWavePointFeature[];
  size: number;
  requestId: number;
  icon?: any;
  isCircul?: boolean;
  autoMove?: boolean;
  constructor(options: IWavePointInstance) {
    super({
      name: LayerType.WAVEPOINT,
    });

    this.color = setDefaultValue(options.color, 0xffffff);

    this.feature = setDefaultValue(options.feature, []);

    this.axes = setDefaultValue(options.axes, '3d');
    this.icon = setDefaultValue(options.icon, null);
    this.isCircul = setDefaultValue(options.isCircul, true);
    this.autoMove = setDefaultValue(options.autoMove, true);

    this.size = options.size || 1;
    this.requestId = 0;
    this.init();
  }
  init() {
    const group = new Group();
    this.mesh = group;
    this._setData(this.feature);
  }
  removeChild() {
    this.mesh?.remove(...this.mesh.children);
  }
  update() {
    if (this.mesh && this.mesh.type === 'Group') {
      this._cancelAnimate();
      this._setData(this.feature);
    }
  }
  setData(features: IWavePointFeature[]) {
    this.feature = setDefaultValue(features, []);
    this.update();
  }
  _setData(feature: IWavePointFeature[]) {
    if (this.mesh && this.mesh.type === 'Group') {
      this.removeChild();
      feature.forEach((item) => {
        this.mesh?.add(this.createPoint(item));
      });
      this._cancelAnimate();
      if (this.autoMove) {
        this.autoAnimate();
      }
    }
  }
  createPoint(feature: IWavePointFeature) {
    const geometry = new PlaneBufferGeometry(1, 1);
    let pxyz;
    if (this.axes === '3d') {
      pxyz = cartographicToXYZ(feature[0], feature[1], 0);
    } else {
      const to2d = projection(feature, 3) as [number, number];
      pxyz = new Vector3(to2d[0], -to2d[1], 0.51);
    }

    const texture = this.textureLoader.load(this.icon || wavePng);
    const pointMaterial = new MeshBasicMaterial({
      map: texture,
      color: this.color,
      side: DoubleSide,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });

    const mesh = new Mesh(geometry, pointMaterial) as IMesh;

    mesh.size = this.size * 0.5;
    mesh._s = 0.6;
    mesh.position.set(pxyz.x, pxyz.y, pxyz.z);
    mesh.scale.set(this.size * 1, this.size * 1, this.size * 1);

    // mesh姿态设置
    // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
    const coordVec3 = new Vector3(pxyz.x, pxyz.y, pxyz.z).normalize();
    const meshNormal =
      this.axes === '3d' ? new Vector3(0, 0, 1) : new Vector3(0, 0, 0);
    // 四元数属性.quaternion表示mesh的角度状态
    //.setFromUnitVectors();计算两个向量之间构成的四元数值
    mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);

    return mesh;
  }
  private _animate() {
    const meshs = this.mesh?.children as IMesh[];
    meshs?.forEach((mesh) => {
      mesh._s += 0.006;
      mesh.scale.set(
        mesh.size * mesh._s,
        mesh.size * mesh._s,
        mesh.size * mesh._s,
      );
      if (mesh._s <= 1.5) {
        mesh.material.opacity = 0.5; //2等于1/(1.5-1.0)，保证透明度在0~1之间变化
      } else if (mesh._s > 1.5 && mesh._s <= 2) {
        mesh.material.opacity = 2 - mesh._s; //2等于1/(2.0-1.5) mesh缩放2倍对应0 缩放1.5被对应1
      } else {
        if (this.isCircul) {
          mesh._s = 0.6;
        }
      }
    });
  }
  private autoAnimate() {
    this._animate();
    this.requestId = requestAnimationFrame(this.autoAnimate.bind(this));
  }
  _cancelAnimate() {
    cancelAnimationFrame(this.requestId);
  }
  animate(): void {
    this._animate();
  }
  public dispose() {
    this._cancelAnimate();
    this.requestId = 0;
  }
}

export default WavePoint;
