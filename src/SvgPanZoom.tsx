import React, { Component } from 'react';

import {
  View,
  PanResponder, PanResponderInstance,
  Animated,
  ViewStyle,
  StyleSheet
} from 'react-native';

import Svg from 'react-native-svg';
const SvgView = Svg as any

import {
  Point,
  ViewTransform,
  ViewDimensions
} from './interfaces';

import {
  createIdentityTransform,
  calcDistance,
  calcCenter,
  createScalingMatrix,
  createTranslationMatrix,
  viewTransformMult,
  getBoundedPinchTransform,
  getBoundedTouchTransform
} from './util';

/*********************************************************
 * Interfaces
 *********************************************************/

export interface Props {
  minScale?: number,
  maxScale?: number,
  initialZoom?: number,
  canvasHeight?: number,
  canvasWidth?: number,
  canvasStyle?: ViewStyle,
  viewStyle?: ViewStyle,
  onZoom?: (zoom: number) => void
}

export interface State {
  //Layout
  layoutKnown: boolean,
  viewDimensions: ViewDimensions,

  //ViewTransform 
  viewTransform: ViewTransform

  //Pinch 
  isScaling: boolean,
  initialDistance: number,
  initialTransform: ViewTransform,
  initialScale: number,
  initialTranslation: Point

  //Pan 
  isMoving: boolean,
  initialGestureState: { dx: number, dy: number }

  //ViewTransform animation
  scaleAnimation: Animated.Value,
  TranslationAnimation: Animated.ValueXY
}

/*********************************************************
 * Component
 *********************************************************/

export default class SvgPanZoom extends Component<Props, State> {

  public static defaultProps: Partial<Props> = {
    canvasHeight: 1080,
    canvasWidth:  720,
    minScale: 0.5,
    maxScale: 1.0,
    initialZoom: 0.7,
    canvasStyle: {},
    viewStyle: {},
    onZoom: (zoom: number) => {},
  };

  mainViewRef: any
  prInstance: PanResponderInstance

  prTargetSelf: any
  prTargetOuter: any
  
  // Lifecycle methods
  
  constructor(props: Props) {
    super(props);
    
    const vt = this.getInitialViewTransform(props.canvasWidth, props.canvasHeight, props.initialZoom)
    
    this.state = {
      //Layout state
      layoutKnown: false,
      viewDimensions: { height: 0, width: 0, pageX: 0, pageY: 0 },
      
      //ViewTransform state
      viewTransform: vt ,
      
      isScaling: false,
      initialDistance: 1,
      initialTransform: createIdentityTransform(), //maybe null
      initialScale: props.initialZoom,
      initialTranslation: { x: 0, y: 0 },
      
      isMoving: false,
      initialGestureState: { dx: 0, dy: 0 },
      
      //ViewTransform animation state
      TranslationAnimation: new Animated.ValueXY({ x: vt.translateX, y: vt.translateY }),
      scaleAnimation: new Animated.Value(vt.scaleX),
    }
  }
  
  dropNextEvt = 0
  
  componentWillMount() {
    this.state.scaleAnimation.addListener((zoom)=> { this.props.onZoom(zoom.value) })

    this.prInstance = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => false,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,
      onPanResponderGrant: (evt, gestureState) => {
        // Set self for filtering events from other PanResponderTarges
        if (this.prTargetSelf == null) { 
          if (this.prTargetOuter == null) { this.prTargetOuter = evt.currentTarget }
          if (evt.target !== evt.currentTarget) { this.prTargetSelf = evt.target }
        }
       },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches

        // console.log('evt: ' + evt.target + '*************')

        if(this.dropNextEvt > 0) { 
          this.dropNextEvt--
          return 
        }
        
        //Child element events are bubbled up but are not valid in out context. Sort them out
        if (evt.target !== this.prTargetSelf && evt.target !== this.prTargetOuter){ 
          this.dropNextEvt++
          return 
        }

        //HACK: the native event has some glitches with far-off coordinates. Sort out the worst ones
        if ((Math.abs(gestureState.vx) + Math.abs(gestureState.vx)) > 6) { 
          this.dropNextEvt++
          return 
        }

        if (touches.length === 2) {
          this.processPinch(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);
        } else if (touches.length === 1 && !this.state.isScaling) {
          this.processTouch(gestureState);
        }
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        this.setState({
          isScaling: false,
          isMoving: false,
        });
      },
      onPanResponderTerminate: (evt, gestureState) => { },
    })

  }

  render() {
    const {
      canvasHeight,
      canvasWidth,
      viewStyle,
      canvasStyle,
      children,
    } = this.props

    return (
      <View
        ref={v => this.mainViewRef = v}
        style={StyleSheet.flatten([
          {
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          },
          viewStyle])}
        onLayout={this._onLayout}
        {...this.prInstance.panHandlers}
      >

        <Animated.View
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: [
              { translateX: this.state.TranslationAnimation.x },
              { translateY: this.state.TranslationAnimation.y },
              { scale: this.state.scaleAnimation }
            ],
            ...canvasStyle
          }}
        >
          <SvgView
            style={{
              width: canvasWidth,
              height: canvasHeight,
            }}
          >
            {children}
          </SvgView>
        </Animated.View>

      </View>
    );
  }

  // Utils
  
  _onLayout = (event) => {
    this.mainViewRef.measure((x, y, w, h, pageX, pageY) => {

      this.setState({
        viewDimensions: {
          height: h,
          width: w,
          pageX: pageX,
          pageY: pageY,
        },

        layoutKnown: true,
      })

    })
  }

  getInitialViewTransform(canvasWidth: number, canvasHeight, scale: number): ViewTransform {
    return viewTransformMult(
      createTranslationMatrix(
        -(canvasWidth - canvasWidth * scale) / 2,
        -(canvasHeight - canvasHeight * scale) / 2
      ),
      createScalingMatrix(scale)
    )
  }

  public zoomToPoint = (x: number, y: number, scale: number, duration: number = 700) => {

    const { viewDimensions } = this.state

    const { canvasHeight, canvasWidth } = this.props

    const zoomPoint = {
      x: -x * scale + viewDimensions.width / 2,
      y: -y * scale + viewDimensions.height / 2,
    }

    const zoomDisplacement = {
      x: -(canvasWidth - canvasWidth * scale) / 2,
      y: -(canvasHeight - canvasHeight * scale) / 2
    }

    const pan = {
      x: zoomPoint.x + zoomDisplacement.x,
      y: zoomPoint.y + zoomDisplacement.y
    }

    const viewTransform: ViewTransform = {
      scaleX: scale,
      scaleY: scale,
      skewX: 0,
      skewY: 0,
      translateX: pan.x,
      translateY: pan.y
    }

    Animated.parallel([
      Animated.timing(this.state.TranslationAnimation, {
        toValue: { x: viewTransform.translateX, y: viewTransform.translateY },
        duration,
        useNativeDriver: true
      }),
      Animated.timing(this.state.scaleAnimation, {
        toValue: viewTransform.scaleX,
        duration,
        useNativeDriver: true
      })
    ]).start()

    this.setState({
      viewTransform: viewTransform
    })
  }

  processPinch = (x1, y1, x2, y2) => {

    const distance = calcDistance(x1, y1, x2, y2);

    if (!this.state.isScaling) {
      this.setState({
        isScaling: true,
        initialDistance: distance,
        initialTransform: this.state.viewTransform,
      })
      return
    }

    const center = calcCenter(x1, y1, x2, y2);

    const {
      viewTransform,
      initialDistance,
      initialTransform,
      viewDimensions,
    } = this.state

    const {
      canvasHeight,
      canvasWidth,
      minScale,
      maxScale
    } = this.props

    const touchZoom = distance / initialDistance;
    const zoomScale = (touchZoom * initialTransform.scaleX) / viewTransform.scaleX

    const panOffset: Point = {
      x: (initialTransform.translateX + viewDimensions.pageX),
      y: (initialTransform.translateY + viewDimensions.pageY)
    }

    const pinchCenterPoint: Point = {
      x: (center.x - panOffset.x),
      y: (center.y - panOffset.y)
    }

    const canvasCenter: Point = {
      x: canvasWidth / 2,
      y: canvasHeight / 2
    }

    //When initial scale of canvas is different from 1, the pinch center point will be translated.
    //This is due to screen center and canvas center differs if the size of them arent equal
    const initialZoomDisplacement: Point = {
      x: (pinchCenterPoint.x - canvasCenter.x) - (pinchCenterPoint.x - canvasCenter.x) / initialTransform.scaleX,
      y: (pinchCenterPoint.y - canvasCenter.y) - (pinchCenterPoint.y - canvasCenter.y) / initialTransform.scaleY,
    }

    const zoomPoint: Point = {
      x: canvasCenter.x - pinchCenterPoint.x + initialZoomDisplacement.x,
      y: canvasCenter.y - pinchCenterPoint.y + initialZoomDisplacement.y,
    }

    const zoomDisplacement: Point = {
      x: -(zoomPoint.x - zoomPoint.x * zoomScale),
      y: -(zoomPoint.y - zoomPoint.y * zoomScale)
    }

    const scalingMatrix: ViewTransform = createScalingMatrix(zoomScale)
    const tranlationMatrix: ViewTransform = createTranslationMatrix(zoomDisplacement.x, zoomDisplacement.y)

    const transform: ViewTransform = viewTransformMult(tranlationMatrix, scalingMatrix)

    const newTransform: ViewTransform = getBoundedPinchTransform(
      viewTransform,
      viewTransformMult(viewTransform, transform),
      minScale,
      maxScale
    )

    Animated.parallel([
      Animated.timing(this.state.TranslationAnimation, {
        toValue: { x: newTransform.translateX, y: newTransform.translateY },
        duration: 0,
        useNativeDriver: true
      }),
      Animated.timing(this.state.scaleAnimation, {
        toValue: newTransform.scaleX,
        duration: 0,
        useNativeDriver: true
      })
    ]).start()

    this.setState({
      viewTransform: newTransform,
    })
  }

  processTouch = (gestureState) => {
    if (!this.state.isMoving) {
      this.setState({
        isMoving: true,
        initialGestureState: { dy: 0, dx: 0 },
        initialTransform: this.state.viewTransform,
      })
      return
    }

    const {
      viewTransform,
      initialGestureState,
      initialTransform,
      viewDimensions
    } = this.state

    const {
      canvasWidth,
      canvasHeight
    } = this.props

    /*gestureState holds total displacement since pan started. 
      Here we calculate difference since last call of processTouch */
    const displacement = {
      x: (gestureState.dx - initialGestureState.dx) / viewTransform.scaleX,
      y: (gestureState.dy - initialGestureState.dy) / viewTransform.scaleY,
    }

    const tranlationMatrix: ViewTransform = createTranslationMatrix(displacement.x, displacement.y)

    const newTransform: ViewTransform = getBoundedTouchTransform(
      initialTransform,
      viewTransform,
      viewTransformMult(viewTransform, tranlationMatrix),
      viewDimensions,
      canvasWidth,
      canvasHeight
    );

    Animated.timing(this.state.TranslationAnimation, {
      toValue: {
        x: newTransform.translateX,
        y: newTransform.translateY
      },
      duration: 0,
      useNativeDriver: true
    }).start()

    this.setState({
      viewTransform: newTransform,
      initialGestureState: { dx: gestureState.dx, dy: gestureState.dy },
    })
  }


}