/// <reference types="react" />
import { Component } from 'react';
export interface Props {
    x: number;
    y: number;
    onClick?: (evt: any) => void;
    onClickRelease?: (evt: any) => void;
    onClickCanceled?: (evt: any) => void;
    onDrag?: (evt: any) => void;
}
export interface State {
}
export default class ResponderElement extends Component<Props, State> {
    static defaultProps: Partial<Props>;
    releasedNaturally: boolean;
    render(): JSX.Element;
}
