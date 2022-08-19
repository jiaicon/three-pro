import {
  Axes,
  IScene,
  ILayer,
  IBaseLayerInstance,
  IEarthInstance as CoreEarthInstance,
  IFlyLineFeature,
  IFlyLineInstance,
  IWavePointInstance,
} from '../index';

export type IAttackedData = IFlyLineFeature;
// 打击效果
export interface IAttacked extends ILayer {
  setData(d: IAttackedData[]): void;
  dispose(): void;
  changeOptions(o: IAttackedInstance): void;
}

export interface IAttackedInstance extends Partial<IBaseLayerInstance> {
  load?: boolean; // 开场动画
  data: IAttackedData[];
  axes?: Axes;
  scene?: IScene;
  earthOptions?: Partial<CoreEarthInstance>;
  flayLineOptions?: Partial<IFlyLineInstance>;
  wavePointOptions?: Partial<IWavePointInstance>;

  // 是否添加其他几个组件
  isFlayLine?: boolean; // 飞线
  isWavePoint?: boolean; // 水波纹点
}
