import assert from "node:assert/strict";
import { envelopeGridColumns, isAdaptiveEnvelopeGrid } from "../lib/envelope-view.ts";

// Only the new desktop layout: previously verified finance/mobile flows are
// intentionally not run by this script.
for (const width of [null, NaN, Infinity, 0, 300, 641]) {
  assert.equal(isAdaptiveEnvelopeGrid(width), false);
  assert.equal(envelopeGridColumns(2, width), 2);
  assert.equal(envelopeGridColumns(3, width), 3);
}
for (const [width, comfortable, compact] of [[642, 3, 4], [822, 3, 5], [966, 4, 6], [1128, 5, 7], [1290, 6, 8]]) {
  assert.equal(envelopeGridColumns(2, width), comfortable);
  assert.equal(envelopeGridColumns(3, width), compact);
  assert.ok((width - (compact - 1) * 6) / compact >= 156);
  assert.ok((width - (comfortable - 1) * 6) / comfortable >= 210);
}
assert.equal(envelopeGridColumns(3, 2000), 12, "No arbitrary six-column limit");
console.log("PASS: responsive desktop density, 4/5/6/7/8+ columns, minimum card widths and preserved mobile preference.");
