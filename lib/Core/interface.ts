import {
  Camera,
  Color,
  ColorRepresentation,
  Group,
  Mesh,
  Points,
  Raycaster,
  Scene,
  Vector2,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface IEvent {
  on(nam: string, fn: () => void): void;
}

/**
 * Scene的类型
 */
export interface IScene extends IEvent {
  name: string;
  add(layer: ILayer): void;
  update(layer: ILayer): void;
  destroy(): void;
  resize(): void;
  scene?: Scene;
  group?: Group;
  camera?: Camera;
  mouse?: Vector2;
  mousePosition?: Vector2;
  raycaster?: Raycaster;
  orbitControls?: OrbitControls;
  setOption(o: Partial<ISceneInstence>): void;
  removeCSS3DDom(): void;
}

export interface ISceneInstence {
  id: string;
  showAxes?: boolean;
  isRotate?: boolean;
  isRaycaster?: boolean;
  load?: boolean;
}

export type Axes = '3d' | '2d';
/**
 * 基础layer的类型
 */
export interface ILayer {
  name: string;
  mesh?: Mesh | Group | Points;
  axes?: Axes; // 标记坐标系使用的2d还是3d
  changeAxes(axex: Axes): this;
}

export interface IBaseLayerInstance {
  name: string;
  scene?: IScene;
}

export interface IData {
  from: {
    lnglat: [number, number];
    [key: string]: any;
  };
  to: {
    lnglat: [number, number];
    [key: string]: any;
  };
}
export type IFeature = IData[];

export interface IEarth extends ILayer {
  changeType: (s: EarthType) => void;
  changeOptions: (o: IEarthInstance) => void;
}

export type EarthType =
  | 'extrudeEarth'
  | 'jueJinEarth'
  | 'pointEarth'
  | 'earth'
  | 'lineEarth';

export interface IEarthInstance extends Partial<IBaseLayerInstance> {
  color?: any;
  cloud?: boolean;
  arround?: boolean;
  rotate?: boolean;
  load?: boolean;
  // data: IFeature;
  // 地图类型：point：例子地图   其他：带材质的地图
  type?: string;
  // 粒子地图时是否展开
  deploy?: EarthType;
  impact?: boolean; // 地球背面光
}

// 飞线
export interface IFlyLine extends ILayer {
  update(): void;
  dispose(): void;
  animate(): void;
  setData(d: IFlyLineFeature[]): void;
}
export interface IFlyLineFeature {
  from: [number, number];
  to: [number, number];
  extraData?: any;
}
export interface IFlyLineInstance extends Partial<IBaseLayerInstance> {
  feature: IFlyLineFeature[];
  axes?: Axes;
  speed?: number; // 流动线段的速率[0, 100]，算法  n/1000
  autoMove?: boolean; // 是否使用动态点
  isLine?: boolean; // 是否显示默认线条
  isCircul?: boolean; // 移动点是否循环播放
}

// 地图表面的物体
export interface ISprite extends ILayer {
  update(): void;
  animate(): void;
  setData(d: ISpriteFeature[]): void;
}

export interface ISpriteFeature {
  lnglat: [number, number];
  [key: string]: any;
}
export interface ISpriteInstance extends Partial<IBaseLayerInstance> {
  feature: ISpriteFeature[];
  axes?: Axes;
  element: HTMLElement | ((v: ISpriteFeature, index: number) => HTMLElement);
}

// 水波纹
export interface IWavePoint extends ILayer {
  update(): void;
  dispose(): void; // 从内存中清除
  animate(): void;
  setData(d: IWavePointFeature[]): void;
}

export type IWavePointFeature = [number, number];
export interface IWavePointInstance extends Partial<IBaseLayerInstance> {
  feature: IWavePointFeature[];
  color?: ColorRepresentation;
  size?: number;
  axes?: Axes;
  icon?: any;
  isCircul?: boolean;
  autoMove?: boolean;
}

// 氛围点
export type IArround = ILayer;

export interface IArroundInstance extends Partial<IBaseLayerInstance> {
  color?: ColorRepresentation;
  number: number; // 个数
}

// 热力图
export interface IHeatmap extends ILayer {
  update(): void;
  destroy(): void;
  animate(): void;
}

export interface IHeatmapInstance extends Partial<IBaseLayerInstance> {
  id?: string; // 热力图挂载的容器，默认body
  data?: any[];
  lineColor?: Color;
  fillColor?: (d: any) => string;
  tootip?: (mouse: { x: number; y: number }, d: any) => void; // 返回点的信息
}
