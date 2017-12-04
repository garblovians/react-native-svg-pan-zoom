export interface Point {
  x: number,
  y: number
}

export interface ViewTransform {
  scaleX: number,
  skewX: number,
  skewY: number,
  scaleY: number,
  translateX: number,
  translateY: number
}

export interface ViewDimensions { 
  height: number, 
  width: number, 
  pageX: number, 
  pageY: number 
}