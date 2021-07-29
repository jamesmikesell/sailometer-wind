declare class RadialGauge {
    constructor(config: GaugeConfig);
    draw(): any;
}

interface Gauge {
    options: GaugeConfig;
    update(config: GaugeConfig): void;
    value: number;

}

interface GaugeConfig {
    value?: number;
    valueText?: string;
    highlights?: { from: number; to: number; color: string }[];
    renderTo?: string;
    width?: number;
    height?: number;
    minValue?: number;
    maxValue?: number;
    strokeTicks?: boolean;
    ticksAngle?: number;
    majorTicks?: (string | number)[];
    minorTicks?: number;
    startAngle?: number;
    colorMajorTicks?: string;
    colorMinorTicks?: string;
    colorTitle?: string;
    colorUnits?: string;
    colorNumbers?: string;
    colorPlate?: string;
    borderShadowWidth?: number;
    borders?: boolean;
    needleType?: "arrow";
    needleWidth?: number;
    needleCircleSize?: number;
    needleCircleOuter?: boolean;
    needleCircleInner?: boolean;
    animation?: boolean;
    colorBorderOuter?: string;
    colorBorderOuterEnd?: string;
    colorBorderMiddle?: string;
    colorBorderMiddleEnd?: string;
    colorBorderInner?: string;
    colorBorderInnerEnd?: string;
    colorNeedle?: string;
    colorNeedleEnd?: string;
    colorNeedleShadowDown?: string;
    colorNeedleCircleOuter?: string;
    colorNeedleCircleOuterEnd?: string;
    colorNeedleCircleInner?: string;
    colorNeedleCircleInnerEnd?: string;
    colorValueBoxRect?: string;
    colorValueBoxRectEnd?: string;
    valueBox?: boolean;
}
