import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  ABI_FETCHED_AT,
  ABI_SOURCE_REF,
  getAbi,
  getAbiSourceMeta,
  getContract,
  hasAbi,
  listAbis,
} from "../dist/index.js";

const AVAILABLE = [
  "AdaptiveSupply",
  "ExchangeHelper",
  "Factory",
  "ModelHelper",
  "Resolver",
  "RewardsCalculator",
];
const UNAVAILABLE = ["Vault", "Pool", "Proxy"];

test("ABI_SOURCE_REF is the pinned commit", () => {
  assert.equal(
    ABI_SOURCE_REF,
    "e9956d58340ec0c44221e5d3f3bc8590149966c0",
  );
});

test("ABI_FETCHED_AT is an ISO-8601 timestamp", () => {
  assert.match(ABI_FETCHED_AT, /^\d{4}-\d{2}-\d{2}T/);
});

test("listAbis returns the 6 bundled contract names, sorted", () => {
  assert.deepEqual(listAbis(), AVAILABLE);
});

test("hasAbi is true for bundled and false for unavailable", () => {
  for (const name of AVAILABLE) assert.equal(hasAbi(name), true, name);
  for (const name of UNAVAILABLE) assert.equal(hasAbi(name), false, name);
  assert.equal(hasAbi("DoesNotExist"), false);
});

test("getAbi returns a non-empty array of ABI items for each bundled contract", () => {
  for (const name of AVAILABLE) {
    const abi = getAbi(name);
    assert.ok(Array.isArray(abi), `${name} abi is array`);
    assert.ok(abi.length > 0, `${name} abi non-empty`);
    for (const item of abi) {
      assert.equal(typeof item.type, "string", `${name} item has 'type'`);
    }
  }
});

test("getAbi returns a copy (mutation does not leak)", () => {
  const a = getAbi("Resolver");
  const originalLength = a.length;
  a.pop();
  const b = getAbi("Resolver");
  assert.equal(b.length, originalLength);
});

test("getAbi throws with reason for unavailable contracts", () => {
  for (const name of UNAVAILABLE) {
    assert.throws(
      () => getAbi(name),
      (err) =>
        err instanceof Error &&
        err.message.includes(name) &&
        err.message.includes("oikos-cash/core@"),
      `unavailable: ${name}`,
    );
  }
});

test("getAbi throws for completely unknown contract", () => {
  assert.throws(() => getAbi("NopeNotAThing"), /Unknown contract/);
});

test("getContract joins address and ABI", () => {
  const c = getContract("bsc", "Resolver");
  assert.equal(typeof c.address, "string");
  assert.match(c.address, /^0x[0-9a-fA-F]{40}$/);
  assert.ok(Array.isArray(c.abi));
  assert.ok(c.abi.length > 0);
});

test("getContract propagates ABI gap errors", () => {
  assert.throws(
    () => getContract("bsc", "Vault"),
    /Vault.*oikos-cash\/core@/,
  );
});

test("getAbiSourceMeta lists all 9 deployment.json contracts with correct flags", () => {
  const meta = getAbiSourceMeta();
  assert.equal(meta.ref, ABI_SOURCE_REF);
  for (const name of AVAILABLE) {
    assert.equal(meta.contracts[name]?.available, true, `${name} available`);
    assert.ok(meta.contracts[name]?.sha256, `${name} has sha256`);
  }
  for (const name of UNAVAILABLE) {
    assert.equal(
      meta.contracts[name]?.available,
      false,
      `${name} unavailable`,
    );
    assert.ok(meta.contracts[name]?.reason, `${name} has reason`);
  }
});

test("getAbiSourceMeta returns a deep copy", () => {
  const a = getAbiSourceMeta();
  a.contracts.Resolver.available = false;
  const b = getAbiSourceMeta();
  assert.equal(b.contracts.Resolver?.available, true);
});
