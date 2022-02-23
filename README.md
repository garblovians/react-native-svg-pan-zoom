# react-native-svg-pan-zoom
Pan-zoom for [react-native-svg](https://github.com/react-native-community/react-native-svg) via "Google Maps"-style pinch and drag gestures.


## Getting Started

### Installing

```
npm install --save react-native-svg-pan-zoom
```

## Usage
Simply use SvgPanZoom as a wrapper and begin dropping components. Plain react-native-svg components will not react to clicks per default. To make things clickable, use the react-native PanResponder or wrap them in the included SvgPanZoomElement as shown below
```js
import React, { Component } from 'react';
import { View } from 'react-native';
import { Circle } from 'react-native-svg';
import SvgPanZoom, { SvgPanZoomElement } from 'react-native-svg-pan-zoom';

class Example extends Component {

  render() {
    return (
      <View style = {{ width: '100%', height:'100%' }}>

        <SvgPanZoom
          canvasHeight  = {500}
          canvasWidth   = {500}
          minScale      = {0.5}
          initialZoom   = {0.7}
          onZoom        = {(zoom) => { console.log('onZoom:' + zoom) }}
          canvasStyle   = {{ backgroundColor: 'yellow' }}
          viewStyle     = {{ backgroundColor: 'green'  }}
        >

          {/* Doesn't consume or respond to clicks */}
          <Circle
            cx          = {100}
            cy          = {100}
            r           = {42} 
            stroke      = "red"
            strokeWidth = "2.5"
            fill        = "blue"
          />

          {/* Responds to clicks */}
          <SvgPanZoomElement
            x ={50}
            y ={50}
            onClick         = {()=>{ console.log('onClick!') }}
            onClickCanceled = {()=>{ console.log('onClickCanceled!') }}
            onClickRelease  = {()=>{ console.log('onClickRelease!') }}
            onDrag          = {()=>{ console.log('onDrag!') }}
          >
            <Circle
              cx          = {42}
              cy          = {42}
              r           = {42} 
              stroke      = "blue"
              strokeWidth = "2.5"
              fill        = "red"
            />
          </SvgPanZoomElement>

        </SvgPanZoom>

      </View>
    );
  }
}
```

You can also use `SvgXml` to render raw SVG:

```js
import React, { Component } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import SvgPanZoom from 'react-native-svg-pan-zoom';

const xml = '...'; // raw SVG XML

class Example2 extends Component {
  render() {
    return (
      <View style = {{ width: '100%', height:'100%' }}>

        <SvgPanZoom
          canvasHeight  = {500}
          canvasWidth   = {500}
          minScale      = {0.5}
          initialZoom   = {0.7}
          onZoom        = {(zoom) => { console.log('onZoom:' + zoom) }}
          canvasStyle   = {{ backgroundColor: 'yellow' }}
          viewStyle     = {{ backgroundColor: 'green'  }}
        >

          {/* Doesn't consume or respond to clicks */}
          <SvgXml height={800} width={800} xml={xml} />

        </SvgPanZoom>

      </View>
    );
  }
}
```

Responding to touch events can be done by using `React.Children.map`:

```js
import React from 'react';
import { View } from 'react-native';
import { Svg, parse } from 'react-native-svg';
import SvgPanZoom, { SvgPanZoomElement } from 'react-native-svg-pan-zoom';

function shouldBeClickable(child) {
  // any logic
}

function Example3(props) {
  const { svgWidth, svgHeight, svgXml } = props;
  const ast = React.useMemo(() => (svgXml !== null ? parse(svgXml) : null), [svgXml]);
  if (!ast) {
    return null;
  }
  const { props: astProps, children: astChildren } = ast;
  if (astChildren.length > 1) {
    return null;
  }
  return (
    <View style = {{ width: '100%', height:'100%' }}>
      <SvgPanZoom
        canvasHeight  = {500}
        canvasWidth   = {500}
        minScale      = {0.5}
        initialZoom   = {0.7}
        onZoom        = {(zoom) => { console.log('onZoom:' + zoom) }}
        canvasStyle   = {{ backgroundColor: 'yellow' }}
        viewStyle     = {{ backgroundColor: 'green'  }}
      >
        <Svg {...astProps} height={svgHeight} width={svgWidth}>
          {React.cloneElement(
            astChildren[0],
            {},
            React.Children.map(astChildren[0].props.children, (child) => {
              return shouldBeClickable(child) ? (
                <SvgPanZoomElement
                  onClick         = {()=>{ console.log('onClick!') }}
                  onClickCanceled = {()=>{ console.log('onClickCanceled!') }}
                  onClickRelease  = {()=>{ console.log('onClickRelease!') }}
                  onDrag          = {()=>{ console.log('onDrag!') }}
                  x={50}
                  y={50}
                >
                  {React.cloneElement(child) /* Responds to clicks */}
                </SvgPanZoomElement>
              ) : (
                React.cloneElement(child) /* Doesn't consume or respond to clicks */
              );
            }),
          )}
        </Svg>
      </SvgPanZoom>
    </View>
  );
}
```

## Additional notes
The drag and zoom gestures are constrained to never leave the SvgPanZoom canvas. It's size as well as scaling constraints can be set through props as shown in the above example.

It is recommended not to set maxScale above 1 as this results in blurred react-native-svg elements. Instead, increase your SVG element dimensions and set minScale lower.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
