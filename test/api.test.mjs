import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  deployment,
  FETCHED_AT,
  getAddress,
  getAddresses,
  getNetworkInfo,
  getSourceMeta,
  getSupportedNetworks,
  isSupported,
  NETWORKS,
  SOURCE_SHA256,
  SOURCE_TAG,
  SOURCE_URL,
} from "../dist/index.js";

test("deployment exposes raw data", () => {
  assert.ok(deployment["56"], "BNB Chain (56) present");
  assert.equal(
    deployment["56"].Vault,
    "0x6D77a715d2047a69DFdf922876712c4ef17d1788",
  );
});

test("getAddresses by chainId number", () => {
  const a = getAddresses(56);
  assert.equal(a.Pool, "0x104bab30b2983df47dd504114353B0A73bF663CE");
});

test("getAddresses by string chainId", () => {
  const a = getAddresses("56");
  assert.equal(a.Factory, "0x9F5973EC7E5f0781E0fCE71Dd949c997c38508Fc");
});

test("getAddresses by network name + aliases", () => {
  for (const id of ["bsc", "BSC", "bnb", "binance", "bnbchain", "bsc-mainnet"]) {
    const a = getAddresses(id);
    assert.equal(
      a.Vault,
      "0x6D77a715d2047a69DFdf922876712c4ef17d1788",
      `alias ${id}`,
    );
  }
});

test("getAddress returns specific contract", () => {
  assert.equal(
    getAddress("bsc", "Resolver"),
    "0xa78142B2A829AbA5D737af86a14d2BeEE82dDcF9",
  );
});

test("getAddress throws for unknown contract", () => {
  assert.throws(() => getAddress(56, "Nonexistent"), /not deployed/);
});

test("getAddresses throws for unknown network name", () => {
  assert.throws(() => getAddresses("ethereum"), /Unknown network/);
});

test("getAddresses throws for unknown chainId", () => {
  assert.throws(() => getAddresses(1), /No deployment/);
});

test("isSupported", () => {
  assert.equal(isSupported(56), true);
  assert.equal(isSupported("bsc"), true);
  assert.equal(isSupported(1), false);
  assert.equal(isSupported("ethereum"), false);
  assert.equal(isSupported("not-a-network"), false);
});

test("getSupportedNetworks lists deployed networks only", () => {
  const list = getSupportedNetworks();
  assert.ok(list.some((n) => n.chainId === 56));
});

test("getNetworkInfo", () => {
  const info = getNetworkInfo("bnb");
  assert.equal(info?.chainId, 56);
  assert.equal(info?.name, "bsc");
  assert.equal(getNetworkInfo("nope"), undefined);
});

test("NETWORKS metadata exported", () => {
  assert.ok(Array.isArray(NETWORKS));
  assert.ok(NETWORKS.find((n) => n.chainId === 56));
});

test("returned addresses are a copy, not a live reference", () => {
  const a = getAddresses(56);
  a.Vault = "0xMUTATED";
  const b = getAddresses(56);
  assert.notEqual(b.Vault, "0xMUTATED");
});

test("source metadata exports are populated", () => {
  assert.equal(typeof SOURCE_TAG, "string");
  assert.ok(SOURCE_TAG.length > 0, "SOURCE_TAG non-empty");
  assert.match(SOURCE_URL, /^https:\/\/raw\.githubusercontent\.com\/oikos-cash\/core\//);
  assert.ok(SOURCE_URL.includes("/deploy_helper/out/deployment.json"));
  assert.match(FETCHED_AT, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(SOURCE_SHA256, /^[0-9a-f]{64}$/);
});

test("getSourceMeta returns a copy", () => {
  const a = getSourceMeta();
  a.tag = "mutated";
  const b = getSourceMeta();
  assert.notEqual(b.tag, "mutated");
  assert.equal(b.tag, SOURCE_TAG);
});
