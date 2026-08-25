(function (w) {
  "use strict";

  function wehouseUtmParamsFromUrl() {
    var out = {};
    try {
      var sp = new URLSearchParams(w.location.search || "");
      sp.forEach(function (val, key) {
        if (!key) return;
        var lk = String(key).toLowerCase();
        if (lk.indexOf("utm_") !== 0 && lk !== "gclid") return;
        var v = String(val).trim();
        if (v !== "") out[key] = v;
      });
    } catch (e) {}
    return out;
  }

  function wehouseMergeUtmIntoPayload(payload) {
    var p = payload || {};
    var utms = wehouseUtmParamsFromUrl();
    Object.keys(utms).forEach(function (k) {
      p[k] = utms[k];
    });
    return p;
  }

  w.wehouseUtmParamsFromUrl = wehouseUtmParamsFromUrl;
  w.wehouseMergeUtmIntoPayload = wehouseMergeUtmIntoPayload;
})(typeof window !== "undefined" ? window : this);
