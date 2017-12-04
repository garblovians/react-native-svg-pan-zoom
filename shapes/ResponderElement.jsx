"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_svg_1 = require("react-native-svg");
class ResponderElement extends react_1.Component {
    constructor() {
        super(...arguments);
        this.releasedNaturally = true;
    }
    render() {
        return (<react_native_svg_1.G x={this.props.position.x} y={this.props.position.y} onStartShouldSetResponder={(evt) => true} onMoveShouldSetResponder={(evt) => false} onResponderGrant={(evt) => {
            this.releasedNaturally = true;
            this.props.onClick(evt);
        }} onResponderTerminationRequest={(evt) => {
            if (evt.nativeEvent.touches.length > 1) {
                this.releasedNaturally = false;
                return true;
            }
            this.props.onClickCanceled(evt);
            return false;
        }} onResponderMove={this.props.onDrag} onResponderRelease={(evt) => {
            if (this.releasedNaturally) {
                this.props.onClickRelease(evt);
                this.releasedNaturally = true;
            }
        }}>
        {this.props.children}
      </react_native_svg_1.G>);
    }
}
ResponderElement.defaultProps = {
    onClick: (evt) => { },
    onClickRelease: (evt) => { },
    onClickCanceled: (evt) => { },
    onDrag: (evt) => { }
};
exports.default = ResponderElement;
