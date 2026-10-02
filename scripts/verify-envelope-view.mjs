import assert from "node:assert/strict";
import { normalizeEnvelopeView, nextEnvelopeGrid, canShowThreeColumns, reorderEnvelopes } from "../lib/envelope-view.ts";

assert.deepEqual(normalizeEnvelopeView({}), { envelopesViewMode: "list", envelopesGridColumns: 2 });
assert.deepEqual(normalizeEnvelopeView({ envelopesViewMode: "grid" }), { envelopesViewMode: "grid", envelopesGridColumns: 2 });
let view = normalizeEnvelopeView({});
for (const columns of [2, 3, 2, 3]) {
  view = nextEnvelopeGrid(view);
  assert.equal(view.envelopesGridColumns, columns);
  assert.equal(view.envelopesViewMode, "grid");
}
assert.deepEqual(normalizeEnvelopeView(JSON.parse(JSON.stringify(view))), view);
assert.equal(nextEnvelopeGrid({ ...view, envelopesViewMode: "list" }).envelopesGridColumns, 2);
assert.equal(normalizeEnvelopeView({ envelopesGridColumns: 9 }).envelopesGridColumns, 2);
console.log("PASS: list, grid 2→3→2, legacy defaults, invalid preference and reload persistence.");
assert.equal(canShowThreeColumns(299), false);
assert.equal(canShowThreeColumns(300), true);
assert.equal(canShowThreeColumns(768), true);
assert.equal(canShowThreeColumns(Number.NaN), false);
const envelopes = [{ id: "a", balance: 20 }, { id: "archived", archived: true, balance: 0 }, { id: "b", balance: 40 }, { id: "c", balance: 60 }];
const reordered = reorderEnvelopes(envelopes, ["c", "a", "b"]);
assert.deepEqual(reordered.map(item => item.id), ["c", "archived", "a", "b"]);
assert.equal(reordered[0], envelopes[3]);
assert.equal(reordered[1], envelopes[1]);
assert.deepEqual(reorderEnvelopes(envelopes, ["b", "b", "missing", "a"]).map(item => item.id), ["b", "archived", "a", "c"]);
assert.deepEqual(reorderEnvelopes(envelopes, []).map(item => item.id), ["a", "archived", "b", "c"]);
assert.deepEqual(envelopes.map(item => item.id), ["a", "archived", "b", "c"]);
assert.equal(reordered.reduce((sum, item) => sum + item.balance, 0), envelopes.reduce((sum, item) => sum + item.balance, 0));
console.log("PASS: three-column width boundary, reorder preserves objects/balances/archived positions, duplicate and stale IDs.");
