import { cloneDeep, isEqual } from 'lodash';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Intersection,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Shape,
  Vector2,
} from 'three';
import BaseLayer from './BaseLayer';
import wordJSON from './assets/word.json';
import { IHeatmap, IHeatmapInstance } from './interface';
import LayerType from './LayerType';
import { projection, setDefaultValue } from './utils';

class HeatMap extends BaseLayer implements IHeatmap {
  id?: string;
  lineColor?: Color;
  fillColor?: (d: any) => string;
  lastPick?: Intersection; // 记录鼠标上次选中的区域
  private requestId: number;
  lastMouse?: Vector2;
  tootip: (mouse: Vector2, d: any) => void;
  constructor(options: IHeatmapInstance) {
    super({
      name: LayerType.HEATMAP,
    });
    this.id = setDefaultValue(options.id, undefined);

    this.scene = setDefaultValue(options.scene, undefined);
    this.lineColor = setDefaultValue(options.lineColor, '#4A4A4A');
    this.fillColor = setDefaultValue(options.fillColor, '#F4D3A4');
    this.tootip = setDefaultValue(options.tootip, undefined);
    this.requestId = 0;
    this.lastMouse = cloneDeep(this.scene?.mouse);
    this.init();
  }
  init() {
    this.mesh = new Group();
    this.mesh.name = 'heatmapGroup';
    this.initExtrudeEarth();
    this.mesh?.rotation.set((-20 * Math.PI) / 180, 0, 0);
    this.animate();
  }
  initExtrudeEarth() {
    const features = wordJSON.features;
    features.forEach((feature) => {
      const { type, coordinates } = feature.geometry;
      if (type === 'MultiPolygon') {
        coordinates.forEach((coordinate) => {
          coordinate.forEach((polygon) => {
            const mesh = this.buildShape(polygon as number[][], {
              isLine: true,
              isExtrude: true,
              lineColor: this.lineColor,
              fillColor:
                typeof this.fillColor === 'function'
                  ? this.fillColor(feature.properties)
                  : this.fillColor,
            });
            mesh.userData.properties = feature.properties;
            this.mesh?.add(mesh);
          });
        });
      } else if (type === 'Polygon') {
        coordinates.forEach((coordinate) => {
          const mesh = this.buildShape(coordinate as number[][], {
            isLine: true,
            isExtrude: true,
            lineColor: this.lineColor,
            fillColor:
              typeof this.fillColor === 'function'
                ? this.fillColor(feature.properties)
                : this.fillColor,
          });
          mesh.userData.properties = feature.properties;
          this.mesh?.add(mesh);
        });
      }
    });
  }
  buildShape(
    coordinate: number[][],
    options: { isLine?: boolean; isExtrude?: boolean; [key: string]: any } = {
      isLine: true,
      isExtrude: true,
    },
  ) {
    const group = new Group();
    const shape = new Shape();
    const lineGeometry = new BufferGeometry();
    const lineMaterial = new LineBasicMaterial({
      color: new Color(options.lineColor),
      side: DoubleSide,
    });
    const lines = [];
    for (let i = 0; i < coordinate.length; i++) {
      const [lng, lat] = coordinate[i] as [number, number];
      const [x, y] = projection([lng, lat], 6) as [number, number];

      if (i === 0) {
        shape.moveTo(x, -y);
      }
      shape.lineTo(x, -y);
      lines.push(x, -y, 1);
    }

    lineGeometry.setAttribute('position', new Float32BufferAttribute(lines, 3));

    const extrudeSettings = {
      depth: 1,
      bevelEnabled: false,
    };
    const geometry = new ExtrudeGeometry(shape, extrudeSettings);
    geometry.scale(0.5, 0.5, 0.5);
    lineGeometry.scale(0.5, 0.5, 0.5);
    const material = new MeshBasicMaterial({
      color: new Color(options.fillColor),
      transparent: true,
      opacity: 1,
    });
    const material1 = new MeshBasicMaterial({
      color: new Color(options.fillColor),
      transparent: true,
      opacity: 1,
    });
    const line = new Line(lineGeometry, lineMaterial);
    line.name = 'line';
    const extrude = new Mesh(geometry, [material, material1]);
    extrude.name = 'extrude';
    if (options.isLine) {
      group.add(line);
    }
    if (options.isExtrude) {
      group.add(extrude);
    }
    return group;
  }
  dispose() {
    this.mesh?.traverse((obj) => {
      if (obj.type === 'Mesh' || obj.type === 'Line') {
        // @ts-ignore
        obj.geometry.dispose();
        // obj.material.dispose();
      }
    });
    this.mesh?.remove(...this.mesh?.children);
    this.mesh?.removeFromParent();
    this.mesh?.clear();
  }
  update() {
    this.dispose();
    this.init();
  }
  destroy() {
    this.dispose();
    cancelAnimationFrame(this.requestId);
  }
  animate() {
    if (
      this.scene?.raycaster &&
      this.mesh &&
      (this.lastMouse?.x !== this.scene?.mouse?.x ||
        this.lastMouse?.y !== this.scene?.mouse?.y)
    ) {
      this.lastMouse = cloneDeep(this.scene.mouse);
      const raycaster = this.scene.raycaster;
      const intersects = raycaster.intersectObjects(this.mesh.children, true);
      const thisPick = intersects.find(
        (item) => item.object.name === 'extrude',
      );
      if (this.lastPick && !isEqual(thisPick, this.lastPick)) {
        if (!thisPick) {
          this.tootip?.(
            this.scene.mousePosition || new Vector2(0, 0),
            undefined,
          );
        }
        // 恢复上一次清空的
        this.lastPick.object.position.set(0, 0, 0);
        // @ts-ignore
        const _material = this.lastPick.object._material;
        // @ts-ignore
        this.lastPick.object.material[0].color.set(_material[0].color);
        // @ts-ignore
        this.lastPick.object.material[1].color.set(_material[1].color);
        // this.lastPick = undefined;
      }
      if (thisPick && !isEqual(thisPick, this.lastPick)) {
        // @ts-ignore
        const _material = cloneDeep(thisPick.object.material);
        this.tootip?.(
          this.scene?.mousePosition || new Vector2(0, 0),
          thisPick?.object?.parent?.userData.properties,
        );
        this.lastPick = thisPick;
        this.lastPick.object.position.set(0, 0, 0.3);
        // @ts-ignore
        this.lastPick.object._material = _material;
        // @ts-ignore
        this.lastPick.object.material[0].color.set('#FF9845');
        // @ts-ignore
        this.lastPick.object.material[1].color.set('#FF9845');
      }
    }

    this.requestId = requestAnimationFrame(this.animate.bind(this));
  }
}

export default HeatMap;
