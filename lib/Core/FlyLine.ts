import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CubicBezierCurve3,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Line,
  MeshBasicMaterial,
  NormalBlending,
  Points,
  QuadraticBezierCurve3,
  Ray,
  ShaderMaterial,
  Vector3,
} from 'three';
import BaseLayer from './BaseLayer';
import { fragmentShader, vertexShader } from './fragment';
import { IFlyLine, IFlyLineFeature, IFlyLineInstance } from './interface';
import LayerType from './LayerType';
import { cartographicToXYZ, projection, setDefaultValue } from './utils';

class FlyLine extends BaseLayer implements IFlyLine {
  private autoMove: boolean;
  private isLine: boolean;
  private isCircul: boolean;
  ratio: { value: number };
  next: number;
  requestId: number;
  speed: number;
  private features: IFlyLineFeature[];
  protected linePoints: (QuadraticBezierCurve3 | CubicBezierCurve3)[] = []; // 保存线上的点
  constructor(options: IFlyLineInstance) {
    super({
      name: LayerType.FLYLINE,
    });
    this.ratio = {
      value: 0,
    };
    this.next = 0;
    this.requestId = 0;
    this.autoMove = setDefaultValue(options.autoMove, true);
    this.isLine = setDefaultValue(options.isLine, true);
    this.isCircul = setDefaultValue(options.isCircul, true);
    this.features = setDefaultValue(options.feature, []);
    this.axes = setDefaultValue(options.axes, '3d');
    this.speed = setDefaultValue(options.speed, 6);
    this.autoMove = setDefaultValue(options.autoMove, true);
    this.init();
  }
  init() {
    const group = new Group();
    group.name = 'flyLineGroup';
    this.mesh = group;
    this._setData(this.features);
  }
  removeChild() {
    this.mesh?.remove(...this.mesh.children);
    this.linePoints = [];
  }
  update() {
    if (this.mesh && this.mesh.type === 'Group') {
      this._cancelAnimate();
      this._setData(this.features);
    }
  }
  setData(feature: IFlyLineFeature[]) {
    this.features = setDefaultValue(feature, []);
    this.update();
  }
  _setData(feature: IFlyLineFeature[]) {
    if (this.mesh && this.mesh.type === 'Group') {
      this.removeChild();
      feature.forEach((item) => {
        this.mesh?.add(this.create(item));
      });
      if (this.autoMove) {
        this._cancelAnimate();
        this.autoAnimate();
      }
    }
  }
  getLine(feature: IFlyLineFeature) {
    const { from, to } = feature;

    if (this.axes === '3d') {
      const posStart = cartographicToXYZ(from[0], from[1]);
      const posEnd = cartographicToXYZ(to[0], to[1]);
      const { v1, v2 } = this.getBezierPoint(posStart, posEnd);
      // 使用CubicBezierCurve3() 创建 三维三次次贝塞尔曲线
      return new CubicBezierCurve3(posStart, v1, v2, posEnd);
    } else {
      const _from = projection(from, 3) as [number, number];
      const _to = projection(to, 3) as [number, number];

      const { x: x0, y: y0, z: z0 } = new Vector3(_from[0], -_from[1], 0.5);
      const { x: x1, y: y1, z: z1 } = new Vector3(_to[0], -_to[1], 0.5);
      // 使用QuadraticBezierCurve3() 创建 三维二次次贝塞尔曲线
      return new QuadraticBezierCurve3(
        new Vector3(x0, y0, z0),
        new Vector3((x0 + x1) / 2, (y0 + y1) / 2, 7),
        new Vector3(x1, y1, z1),
      );
    }
  }
  create(feature: IFlyLineFeature) {
    const curve = this.getLine(feature);
    const lineGeometry = new BufferGeometry();
    // 获取曲线 上的50个点
    let points = curve.getPoints(500);
    let positions = [];
    const current = [];
    let colors = [];
    let color = new Color();

    const setColor = feature.extraData?.color;
    if (setColor) {
      color.setStyle(setColor);
    }

    this.linePoints.push(curve);
    // 给每个顶点设置演示 实现渐变
    for (let j = 0; j < points.length; j++) {
      if (!setColor) {
        color.setRGB(
          0.6019 + j * 0.0018352,
          0.2137 + j * 0.0006274,
          0.0705 + j * 0.000141,
        ); // 粉色
      }

      colors.push(color.r, color.g, color.b);
      positions.push(points[j].x, points[j].y, points[j].z);
      current.push(j);
    }
    // 放入顶点 和 设置顶点颜色
    lineGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(positions, 3),
    );
    lineGeometry.setAttribute(
      'color',
      new BufferAttribute(new Float32Array(colors), 3, true),
    );

    lineGeometry.setAttribute(
      'current',
      new Float32BufferAttribute(current, 1),
    );

    const shaderMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      // depthTest: false,
      blending: !setColor ? AdditiveBlending : NormalBlending,
      uniforms: {
        uSize: {
          // 点的大小
          value: 10,
        },
        uTime: this.ratio, // 时间
        uColor: {
          // 颜色
          value: new Color(color),
        },
        uRange: {
          // 飞线长度
          value: 100,
        },
        uTotal: {
          // 轨迹总长度，（点的总个数）
          value: 500,
        },
        uSpeed: {
          // 飞行速度
          value: 0.6,
        },
        circul: {
          // 动画是否循环
          value: this.isCircul ? 1.0 : 0.0,
        },
      },
      vertexShader,
      fragmentShader,
    });
    const material = new MeshBasicMaterial({
      vertexColors: true,
      side: DoubleSide,
    });
    const line = new Line(lineGeometry, material);
    const point = new Points(lineGeometry, shaderMaterial);
    const group = new Group();
    if (this.isLine) {
      group.add(line);
    }
    group.add(point);
    return group;
  }
  getVCenter(start: Vector3, end: Vector3) {
    const v = start.add(end);
    return v.divideScalar(2);
  }
  getLenVcetor(v1: Vector3, v2: Vector3, len: number) {
    const v1v2Len = v1.distanceTo(v2);
    return v1.lerp(v2, len / v1v2Len);
  }
  getBezierPoint(v0: Vector3, v3: Vector3) {
    // 获取贝塞尔控制点
    const angle = (v0.angleTo(v3) * 180) / Math.PI; // 0 ~ Math.PI       // 计算向量夹角
    const aLen = angle * 0.06;
    const hLen = angle * angle * 50;
    const p0 = new Vector3(0, 0, 0); // 法线向量
    const rayLine = new Ray(p0, this.getVCenter(v0.clone(), v3.clone())); // 顶点坐标
    const vtop = rayLine.at(
      hLen / rayLine.at(1, new Vector3(0, 0, 0)).distanceTo(p0),
      new Vector3(0, 0, 0),
    ); // 几倍位置
    // 控制点坐标
    const v1 = this.getLenVcetor(v0.clone(), vtop, aLen);
    const v2 = this.getLenVcetor(v3.clone(), vtop, aLen);
    return {
      v1: v1,
      v2: v2,
    };
  }

  private _animate() {
    this.next += this.speed / 1000;
    this.ratio.value = this.next;
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
  }
}

export default FlyLine;
