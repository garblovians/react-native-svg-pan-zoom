import { ViewTransform, ViewDimensions } from './interfaces';
export declare function calcDistance(x1: any, y1: any, x2: any, y2: any): number;
export declare function calcCenter(x1: any, y1: any, x2: any, y2: any): {
    x: number;
    y: number;
};
export declare function maxOffset(offset: any, windowDimension: any, imageDimension: any): any;
export declare function createIdentityTransform(): {
    scaleX: number;
    skewX: number;
    skewY: number;
    scaleY: number;
    translateX: number;
    translateY: number;
};
export declare function createTranslationMatrix(translateX: number, translateY: number): ViewTransform;
export declare function createScalingMatrix(scale: number): ViewTransform;
export declare function viewTransformMult(vtA: ViewTransform, vtB: ViewTransform): ViewTransform;
export declare function getBoundedPinchTransform(oldTransform: ViewTransform, newTransform: ViewTransform, minScale: number, maxScale: number): ViewTransform;
export declare function getBoundedTouchTransform(initialTransform: ViewTransform, oldTransform: ViewTransform, newTransform: ViewTransform, viewDim: ViewDimensions, canvasWidth: number, canvasHeight: number): ViewTransform;
