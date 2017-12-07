/// <reference types="react" />
import { Component } from 'react';
import { PanResponderInstance, Animated, ViewStyle } from 'react-native';
import { Point, ViewTransform, ViewDimensions } from './interfaces';
/*********************************************************
 * Interfaces
 *********************************************************/
export interface Props {
    minScale?: number;
    maxScale?: number;
    initialZoom?: number;
    canvasHeight?: number;
    canvasWidth?: number;
    canvasStyle?: ViewStyle;
    viewStyle?: ViewStyle;
    onZoom?: (zoom: number) => void;
}
export interface State {
    layoutKnown: boolean;
    viewDimensions: ViewDimensions;
    viewTransform: ViewTransform;
    isScaling: boolean;
    initialDistance: number;
    initialTransform: ViewTransform;
    initialScale: number;
    initialTranslation: Point;
    isMoving: boolean;
    initialGestureState: {
        dx: number;
        dy: number;
    };
    scaleAnimation: Animated.Value;
    TranslationAnimation: Animated.ValueXY;
}
/*********************************************************
 * Component
 *********************************************************/
export default class SvgPanZoom extends Component<Props, State> {
    static defaultProps: Partial<Props>;
    mainViewRef: any;
    prInstance: PanResponderInstance;
    prTargetSelf: any;
    prTargetOuter: any;
    constructor(props: Props);
    dropNextEvt: number;
    componentWillMount(): void;
    render(): JSX.Element;
    _onLayout: (event: any) => void;
    getInitialViewTransform(canvasWidth: number, canvasHeight: any, scale: number): ViewTransform;
    zoomToPoint: (x: number, y: number, scale: number, duration?: number) => void;
    processPinch: (x1: any, y1: any, x2: any, y2: any) => void;
    processTouch: (gestureState: any) => void;
}
