var Browser = (function(uA) {
  function getVersion(identifier) {
    var version = new RegExp(identifier + "([\\d.]+)").exec(uA);
    return version ? parseFloat(version[1]) : true;
  }

  return {
    IE:
      !!(window.attachEvent && uA.indexOf("Opera") === -1) &&
      getVersion("MSIE "),
    Opera:
      uA.indexOf("Opera") > -1 &&
      ((!!window.opera && opera.version && parseFloat(opera.version())) ||
        7.55),
    WebKit: uA.indexOf("AppleWebKit/") > -1 && getVersion("AppleWebKit/"),
    Gecko:
      uA.indexOf("Gecko") > -1 &&
      uA.indexOf("KHTML") === -1 &&
      getVersion("rv:"),
    MobileSafari: !!uA.match(/Apple.*Mobile.*Safari/),
    Chrome: uA.indexOf("Chrome") > -1 && getVersion("Chrome/"),
    ChromeMobile: uA.indexOf("CrMo") > -1 && getVersion("CrMo/"),
    Android: uA.indexOf("Android") > -1 && getVersion("Android "),
    IEMobile: uA.indexOf("IEMobile") > -1 && getVersion("IEMobile/")
  };
})(navigator.userAgent);
