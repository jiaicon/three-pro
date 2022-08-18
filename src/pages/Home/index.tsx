import React, { useEffect, useRef } from 'react';
import {
  Scene,
  IScene,
  Earth,
  IEarth,
} from '@/lib';
import styles from './styles.less';

const Index = () => {
  const scene = useRef<IScene>();
  const earth = useRef<IEarth>();

  useEffect(() => {
    scene.current = new Scene({
      id: 'container',
      showAxes: true,

    })
    scene.current?.on('scene.loaded', () => {
      earth.current = new Earth({
        scene: scene.current,
        deploy: 'jueJinEarth',
      })

      scene.current?.add(earth.current);
    })
  }, [])
  return (
    <div className={styles.container}>
      <div id='container'></div>
    </div>
  )
}

export default Index;
