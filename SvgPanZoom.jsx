"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_svg_1 = require("react-native-svg");
const util_1 = require("./util");
/*********************************************************
 * Component
 *********************************************************/
class SvgPanZoom extends react_1.Component {
    // Lifecycle methods
    constructor(props) {
        super(props);
        this.dropNextEvt = 0;
        // Utils
        this._onLayout = (event) => {
            this.mainViewRef.measure((x, y, w, h, pageX, pageY) => {
                this.setState({
                    viewDimensions: {
                        height: h,
                        width: w,
                        pageX: pageX,
                        pageY: pageY,
                    },
                    layoutKnown: true,
                });
            });
        };
        this.zoomToPoint = (x, y, scale, duration = 700) => {
            const { viewDimensions } = this.state;
            const { canvasHeight, canvasWidth } = this.props;
            const zoomPoint = {
                x: -x * scale + viewDimensions.width / 2,
                y: -y * scale + viewDimensions.height / 2,
            };
            const zoomDisplacement = {
                x: -(canvasWidth - canvasWidth * scale) / 2,
                y: -(canvasHeight - canvasHeight * scale) / 2
            };
            const pan = {
                x: zoomPoint.x + zoomDisplacement.x,
                y: zoomPoint.y + zoomDisplacement.y
            };
            const viewTransform = {
                scaleX: scale,
                scaleY: scale,
                skewX: 0,
                skewY: 0,
                translateX: pan.x,
                translateY: pan.y
            };
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(this.state.TranslationAnimation, {
                    toValue: { x: viewTransform.translateX, y: viewTransform.translateY },
                    duration,
                    useNativeDriver: true
                }),
                react_native_1.Animated.timing(this.state.scaleAnimation, {
                    toValue: viewTransform.scaleX,
                    duration,
                    useNativeDriver: true
                })
            ]).start();
            this.setState({
                viewTransform: viewTransform
            });
        };
        this.processPinch = (x1, y1, x2, y2) => {
            const distance = util_1.calcDistance(x1, y1, x2, y2);
            if (!this.state.isScaling) {
                this.setState({
                    isScaling: true,
                    initialDistance: distance,
                    initialTransform: this.state.viewTransform,
                });
                return;
            }
            const center = util_1.calcCenter(x1, y1, x2, y2);
            const { viewTransform, initialDistance, initialTransform, viewDimensions, } = this.state;
            const { canvasHeight, canvasWidth, minScale, maxScale } = this.props;
            const touchZoom = distance / initialDistance;
            const zoomScale = (touchZoom * initialTransform.scaleX) / viewTransform.scaleX;
            const panOffset = {
                x: (initialTransform.translateX + viewDimensions.pageX),
                y: (initialTransform.translateY + viewDimensions.pageY)
            };
            const pinchCenterPoint = {
                x: (center.x - panOffset.x),
                y: (center.y - panOffset.y)
            };
            const canvasCenter = {
                x: canvasWidth / 2,
                y: canvasHeight / 2
            };
            //When initial scale of canvas is different from 1, the pinch center point will be translated.
            //This is due to screen center and canvas center differs if the size of them arent equal
            const initialZoomDisplacement = {
                x: (pinchCenterPoint.x - canvasCenter.x) - (pinchCenterPoint.x - canvasCenter.x) / initialTransform.scaleX,
                y: (pinchCenterPoint.y - canvasCenter.y) - (pinchCenterPoint.y - canvasCenter.y) / initialTransform.scaleY,
            };
            const zoomPoint = {
                x: canvasCenter.x - pinchCenterPoint.x + initialZoomDisplacement.x,
                y: canvasCenter.y - pinchCenterPoint.y + initialZoomDisplacement.y,
            };
            const zoomDisplacement = {
                x: -(zoomPoint.x - zoomPoint.x * zoomScale),
                y: -(zoomPoint.y - zoomPoint.y * zoomScale)
            };
            const scalingMatrix = util_1.createScalingMatrix(zoomScale);
            const tranlationMatrix = util_1.createTranslationMatrix(zoomDisplacement.x, zoomDisplacement.y);
            const transform = util_1.viewTransformMult(tranlationMatrix, scalingMatrix);
            const newTransform = util_1.getBoundedPinchTransform(viewTransform, util_1.viewTransformMult(viewTransform, transform), minScale, maxScale);
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(this.state.TranslationAnimation, {
                    toValue: { x: newTransform.translateX, y: newTransform.translateY },
                    duration: 0,
                    useNativeDriver: true
                }),
                react_native_1.Animated.timing(this.state.scaleAnimation, {
                    toValue: newTransform.scaleX,
                    duration: 0,
                    useNativeDriver: true
                })
            ]).start();
            this.setState({
                viewTransform: newTransform,
            });
        };
        this.processTouch = (gestureState) => {
            if (!this.state.isMoving) {
                this.setState({
                    isMoving: true,
                    initialGestureState: { dy: 0, dx: 0 },
                    initialTransform: this.state.viewTransform,
                });
                return;
            }
            const { viewTransform, initialGestureState, initialTransform, viewDimensions } = this.state;
            const { canvasWidth, canvasHeight } = this.props;
            /*gestureState holds total displacement since pan started.
              Here we calculate difference since last call of processTouch */
            const displacement = {
                x: (gestureState.dx - initialGestureState.dx) / viewTransform.scaleX,
                y: (gestureState.dy - initialGestureState.dy) / viewTransform.scaleY,
            };
            const tranlationMatrix = util_1.createTranslationMatrix(displacement.x, displacement.y);
            const newTransform = util_1.getBoundedTouchTransform(initialTransform, viewTransform, util_1.viewTransformMult(viewTransform, tranlationMatrix), viewDimensions, canvasWidth, canvasHeight);
            react_native_1.Animated.timing(this.state.TranslationAnimation, {
                toValue: {
                    x: newTransform.translateX,
                    y: newTransform.translateY
                },
                duration: 0,
                useNativeDriver: true
            }).start();
            this.setState({
                viewTransform: newTransform,
                initialGestureState: { dx: gestureState.dx, dy: gestureState.dy },
            });
        };
        const vt = this.getInitialViewTransform(props.canvasWidth, props.canvasHeight, props.initialZoom);
        this.state = {
            //Layout state
            layoutKnown: false,
            viewDimensions: { height: 0, width: 0, pageX: 0, pageY: 0 },
            //ViewTransform state
            viewTransform: vt,
            isScaling: false,
            initialDistance: 1,
            initialTransform: util_1.createIdentityTransform(),
            initialScale: props.initialZoom,
            initialTranslation: { x: 0, y: 0 },
            isMoving: false,
            initialGestureState: { dx: 0, dy: 0 },
            //ViewTransform animation state
            TranslationAnimation: new react_native_1.Animated.ValueXY({ x: vt.translateX, y: vt.translateY }),
            scaleAnimation: new react_native_1.Animated.Value(vt.scaleX),
        };
    }
    componentWillMount() {
        this.prInstance = react_native_1.PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => false,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,
            onPanResponderGrant: (evt, gestureState) => {
                // Set self for filtering events from other PanResponderTarges
                if (this.prTargetSelf == null) {
                    if (this.prTargetOuter == null) {
                        this.prTargetOuter = evt.currentTarget;
                    }
                    if (evt.target !== evt.currentTarget) {
                        this.prTargetSelf = evt.target;
                    }
                }
            },
            onPanResponderMove: (evt, gestureState) => {
                const touches = evt.nativeEvent.touches;
                // console.log('evt: ' + evt.target + '*************')
                if (this.dropNextEvt > 0) {
                    // console.log('drop required: ' + evt.target)
                    this.dropNextEvt--;
                    return;
                }
                //Child element events are bubbled up but are not valid in out context. Sort them out
                if (evt.target !== this.prTargetSelf && evt.target !== this.prTargetOuter) {
                    // console.log('illegal origin: ' + evt.target)
                    this.dropNextEvt++;
                    return;
                }
                //HACK: the native event has some glitches with far-off coordinates. Sort out the worst ones
                if ((Math.abs(gestureState.vx) + Math.abs(gestureState.vx)) > 6) {
                    // console.log('TOO FAAAAST! ' + evt.target)
                    // console.log(JSON.stringify(gestureState,null,2))
                    this.dropNextEvt++;
                    return;
                }
                if (touches.length === 2) {
                    this.processPinch(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);
                }
                else if (touches.length === 1 && !this.state.isScaling) {
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
        });
    }
    render() {
        return (<react_native_1.View ref={v => this.mainViewRef = v} style={react_native_1.StyleSheet.flatten([
            {
                flex: 1,
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
            },
            this.props.style
        ])} onLayout={this._onLayout} {...this.prInstance.panHandlers}>

        <react_native_1.Animated.View style={{
            width: this.props.canvasWidth,
            height: this.props.canvasHeight,
            transform: [
                { translateX: this.state.TranslationAnimation.x },
                { translateY: this.state.TranslationAnimation.y },
                { scale: this.state.scaleAnimation }
            ]
        }}>
          <react_native_svg_1.Svg style={{
            width: this.props.canvasWidth,
            height: this.props.canvasHeight,
        }}>
            {this.props.children}
          </react_native_svg_1.Svg>
        </react_native_1.Animated.View>

      </react_native_1.View>);
    }
    getInitialViewTransform(canvasWidth, canvasHeight, scale) {
        return util_1.viewTransformMult(util_1.createTranslationMatrix(-(canvasWidth - canvasWidth * scale) / 2, -(canvasHeight - canvasHeight * scale) / 2), util_1.createScalingMatrix(scale));
    }
}
SvgPanZoom.defaultProps = {
    canvasHeight: 1080,
    canvasWidth: 720,
    minScale: 0.5,
    maxScale: 1.2,
    initialZoom: 0.7,
};
exports.default = SvgPanZoom;
