import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source=fs.readFileSync(new URL("../apps/admin/src/lib/scheduling.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {parseCentral,centralInput,validDay,weekStart,shiftDay}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
assert.equal(parseCentral("2026-01-12T09:00"),"2026-01-12T15:00:00.000Z");
assert.equal(parseCentral("2026-07-12T09:00"),"2026-07-12T14:00:00.000Z");
assert.equal(parseCentral("2026-11-01T01:30"),"2026-11-01T06:30:00.000Z"); // Earlier occurrence of repeated fall hour.
assert.throws(()=>parseCentral("2026-03-08T02:30"),/daylight saving/);
assert.throws(()=>parseCentral("2026-02-30T09:00"));
assert.throws(()=>parseCentral("2026-01-12T25:00"));
assert.equal(centralInput("2026-07-12T14:00:00Z"),"2026-07-12T09:00");
assert.equal(validDay("2024-02-29"),true);
assert.equal(validDay("2026-02-29"),false);
assert.equal(weekStart("2026-11-03"),"2026-11-02");
assert.equal(shiftDay("2026-12-31",1),"2027-01-01");
console.log("PASS: Central Time winter/summer, DST gap and repeated hour, invalid dates, week and year boundaries.");
