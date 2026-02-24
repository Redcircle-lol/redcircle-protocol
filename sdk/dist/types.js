"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurveType = exports.PoolStatus = void 0;
exports.parsePoolStatus = parsePoolStatus;
exports.parseCurveType = parseCurveType;
// --- Enums ---
var PoolStatus;
(function (PoolStatus) {
    PoolStatus["Active"] = "active";
    PoolStatus["LaunchProtection"] = "launchProtection";
    PoolStatus["Migrated"] = "migrated";
    PoolStatus["Paused"] = "paused";
})(PoolStatus || (exports.PoolStatus = PoolStatus = {}));
var CurveType;
(function (CurveType) {
    CurveType[CurveType["ConstantProduct"] = 0] = "ConstantProduct";
    CurveType[CurveType["Linear"] = 1] = "Linear";
    CurveType[CurveType["Exponential"] = 2] = "Exponential";
})(CurveType || (exports.CurveType = CurveType = {}));
// --- Helper to parse pool status ---
function parsePoolStatus(status) {
    if ("active" in status)
        return PoolStatus.Active;
    if ("launchProtection" in status)
        return PoolStatus.LaunchProtection;
    if ("migrated" in status)
        return PoolStatus.Migrated;
    if ("paused" in status)
        return PoolStatus.Paused;
    throw new Error("Unknown pool status");
}
// --- Helper to parse curve type ---
function parseCurveType(curveType) {
    if ("constantProduct" in curveType)
        return CurveType.ConstantProduct;
    if ("linear" in curveType)
        return CurveType.Linear;
    if ("exponential" in curveType)
        return CurveType.Exponential;
    throw new Error("Unknown curve type");
}
//# sourceMappingURL=types.js.map