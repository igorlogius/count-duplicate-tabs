/* global browser */

let dupTabIds = [];

async function getDups() {
  const dups = new Map();
  let done = [];

  const tabdata = new Map();
  (
    await browser.tabs.query({
      hidden: false,
      pinned: false,
    })
  ).forEach((t) => {
    tabdata.set(t.id, {
      id: t.id,
      status: t.status,
      url: t.url.endsWith("#") ? t.url.slice(0, -1) : t.url,
      cs: t.cookieStoreId,
      ts: t.lastAccessed,
    });
  });

  for (const [tabId, t0] of tabdata) {
    if (done.includes(tabId)) {
      continue;
    }

    if (!dups.has(t0.cs + t0.url)) {
      dups.set(t0.cs + t0.url, []);
    }
    let t0_dups = dups.get(t0.cs + t0.url);

    for (const [vtabId, v] of tabdata) {
      if (t0.url === v.url && t0.cs === v.cs && t0.status !== "loading") {
        t0_dups.push(v);
        done.push(vtabId);
      }
    }

    if (t0_dups.length > 0) {
      t0_dups = t0_dups
        .sort((av, bv) => {
          return bv.ts - av.ts;
        })
        .map((e) => e.id);
    }
    dups.set(t0.cs + t0.url, t0_dups);
  }

  let toClose = [];
  for (const [a, v] of dups) {
    toClose = toClose.concat(v.slice(1));
  }
  toClose = new Set(toClose);
  return [...toClose];
}

async function delDups() {
  if (dupTabIds.length > 0) {
    await browser.tabs.remove(dupTabIds);
  }
}

async function updateBA() {
  dupTabIds = await getDups();
  if (dupTabIds.length > 0) {
    browser.browserAction.setBadgeText({ text: "" + dupTabIds.length });
  } else {
    browser.browserAction.setBadgeText({ text: "" });
  }
}

browser.browserAction.onClicked.addListener(async (tab, info) => {
  browser.browserAction.disable();
  console.debug(info);
  if (info.button === 1) {
    await delDups();
  } else {
    await updateBA();
  }
  browser.browserAction.enable();
});

browser.browserAction.setBadgeText({ text: "" });
browser.browserAction.setBadgeBackgroundColor({ color: "orange" });
