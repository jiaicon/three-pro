import TWEEN from '@tweenjs/tween.js';
import { isEqual, uniqWith } from 'lodash';
import { Group, Object3D } from 'three';
import {
  Axes,
  BaseLayer,
  Earth,
  EarthType,
  FlyLine,
  IEarth as CoreEarth,
  IEarthInstance as CoreEarthInstance,
  IFlyLine,
  IFlyLineFeature,
  IFlyLineInstance,
  IWavePoint,
  IWavePointFeature,
  IWavePointInstance,
  setDefaultValue,
  WavePoint,
} from './../index';
import { IAttacked, IAttackedInstance, IAttackedData } from './interface';

function spiteData(data: IAttackedData[]) {
  const flyLineData: IFlyLineFeature[] = [];
  const wavePointData: IWavePointFeature[] = [];

  data.forEach((item) => {
    flyLineData.push({
      from: item.from,
      to: item.to,
      extraData: item,
    });
    wavePointData.push(
      item.from,
      item.to,
    );
  });
  return {
    flyLineData: uniqWith(flyLineData, isEqual),
    wavePointData: uniqWith(wavePointData, isEqual),
  };
}

class AttackedLayer extends BaseLayer implements IAttacked {
  load?: boolean;
  data: IAttackedData[];
  allMesh?: Group;

  earthOptions: CoreEarthInstance;
  flayLineOptions: IFlyLineInstance;
  wavePointOptions: IWavePointInstance;

  earthLayer?: CoreEarth;
  isFlayLine?: boolean; // 飞线
  isWavePoint?: boolean; // 水波纹点
  flayLineLayer?: IFlyLine;
  wavePointLayer?: IWavePoint;

  requestId: number;
  components?: [IFlyLine, IWavePoint][];

  constructor(options: IAttackedInstance) {
    super({
      name: 'attackLayer',
    });


    this.requestId = 0;
    this.components = [];

    this.mesh = new Group();
    this.mesh.name = 'attackedGroup';

    this.setOptions(options);

    this.init();
  }
  init() {
    if (!this.earthLayer) {
      this.earthLayer = new Earth({
        ...this.earthOptions,
        load: false, // 关闭默认动画
        rotate: false,
      });
      if (this.earthLayer.mesh) {
        this.mesh.add(this.earthLayer.mesh);
      }
    }

    this.allMesh = new Group();
    this.allMesh.name = 'allMesh';
    this.mesh.add(this.allMesh);

    this._setData(this.data);
    this.loaded();
    this.animate();
  }
  changeType(s: EarthType) {
    this.earthLayer?.changeType?.(s);
    this._setAxes(s);
    this.update();
    this.loaded();
  }
  update() {
    if (this.mesh && this.mesh.type === 'Group') {
      this._setData(this.data);
    }
  }
  setData(data: IAttackedData[]) {
    this.data = setDefaultValue(data, []);
    this.update();
  }
  // 设置数据
  _setData(data: IAttackedData[]) {
    const { flyLineData, wavePointData } = spiteData(data);

    /**
     * 这里逻辑是：
     * 每当有新数据过来，都新创建飞线实例，8s后删除飞线
     */
    const flyLine: IFlyLine = new FlyLine({
      ...this.flayLineOptions,
      feature: flyLineData,
      axes: this.axes,
    });
    const wavePoint: IWavePoint = new WavePoint({
      ...this.wavePointOptions,
      feature: wavePointData,
      axes: this.axes,
    });

    if (wavePoint.mesh && flyLine.mesh) {
      // 自定义数据，保存创建时间
      const group = new Group();
      group.add(flyLine.mesh, wavePoint.mesh);
      group.userData.create_at = new Date().getTime();
      this.allMesh?.add(group);
      this.components?.push([flyLine, wavePoint]);
    }
    this.checkFlyLines();
  }
  checkFlyLines(): void {
    // 删除过期的飞线
    this.allMesh?.children.forEach((item, index) => {
      const current_at = new Date().getTime();
      if (current_at - item.userData.create_at >= 3000) {
        this.clearGroup(item);
        this.components?.[index]?.[0]?.dispose();
        this.components?.[index]?.[1]?.dispose();
        this.components?.splice(index, 1);
      }
    });
  }
  clearGroup(group: Object3D) {
    group.traverse((obj) => {
      if (obj.type === 'Mesh' || obj.type === 'Points') {
        // @ts-ignore
        obj.geometry.dispose();
        // @ts-ignore
        obj.material.dispose();
      }
    });
    group.remove(...group.children);
    group.removeFromParent();
    group.clear();
  }

  _setAxes(s: EarthType) {
    let axes: Axes = '3d';
    if (s === 'extrudeEarth' || s === 'lineEarth') {
      axes = '2d';
    }
    this.axes = axes;
  }
  loaded() {
    if (this.load && this.mesh) {
      this.mesh.scale.set(0.1, 0.1, 0.1);

      const tween = new TWEEN.Tween(this.mesh.scale);
      tween.to(
        {
          x: 1,
          y: 1,
          z: 1,
        },
        1000,
      );
      tween.easing(TWEEN.Easing.Exponential.In);
      tween.start();
    }
  }
  animate() {
    this.components?.forEach((item) => {
      item[0]?.animate?.();
      item[1]?.animate?.();
    });

    this.requestId = requestAnimationFrame(this.animate.bind(this));
  }
  dispose() {
    this.clearGroup(this.mesh as Group);
    cancelAnimationFrame(this.requestId);
  }
  clearAllMesh() {
    this.clearGroup(this.allMesh as Group);
  }
  private setOptions(options: IAttackedInstance) {
    this.load = setDefaultValue(options.load, true);
    this.data = setDefaultValue(options.data, []);
    this.scene = setDefaultValue(options.scene, undefined);

    this.earthOptions = setDefaultValue(options.earthOptions, {});
    this.flayLineOptions = setDefaultValue(options.flayLineOptions, {});
    this.wavePointOptions = setDefaultValue(options.wavePointOptions, {});

    this.isFlayLine = setDefaultValue(options.isFlayLine, false);
    this.isWavePoint = setDefaultValue(options.isWavePoint, false);
    this.axes = setDefaultValue(options.axes, '3d');
  }
  changeOptions(options: IAttackedInstance) {
    this.clearAllMesh();
    cancelAnimationFrame(this.requestId);
    
    this.setOptions(options);

    this.init();
  }
}

export default AttackedLayer;
