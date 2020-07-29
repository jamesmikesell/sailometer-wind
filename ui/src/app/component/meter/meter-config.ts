const WIND_METER_CONFIG: GaugeConfig = {
    renderTo: 'dialId',
    width: 400,
    height: 400,
    minValue: -180,
    maxValue: 180,
    strokeTicks: true,
    ticksAngle: 360,
    majorTicks: [" ", 150, 120, 90, 60, 30, " ", 30, 60, 90, 120, 150, ""],
    minorTicks: 3,
    startAngle: 0,
    colorMajorTicks: "#ddd",
    colorMinorTicks: "#ddd",
    colorTitle: "#eee",
    colorUnits: "#ccc",
    colorNumbers: "#eee",
    colorPlate: "#222",
    borderShadowWidth: 0,
    borders: true,
    needleType: "arrow",
    needleWidth: 2,
    needleCircleSize: 7,
    needleCircleOuter: true,
    needleCircleInner: false,
    animation: false,
    colorBorderOuter: "#333",
    colorBorderOuterEnd: "#111",
    colorBorderMiddle: "#222",
    colorBorderMiddleEnd: "#111",
    colorBorderInner: "#111",
    colorBorderInnerEnd: "#333",
    colorNeedleShadowDown: "#333",
    colorNeedleCircleOuter: "#333",
    colorNeedleCircleOuterEnd: "#111",
    colorNeedleCircleInner: "#111",
    colorNeedleCircleInnerEnd: "#222",
    colorValueBoxRect: "#222",
    colorValueBoxRectEnd: "#333",
    valueBox: true,
};

export { WIND_METER_CONFIG };